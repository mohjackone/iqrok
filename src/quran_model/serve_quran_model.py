import os
import sys
import json
import numpy as np
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
import logging
from pathlib import Path
import pickle
from sentence_transformers import SentenceTransformer, CrossEncoder
from openai import OpenAI
import time
from sklearn.metrics.pairwise import cosine_similarity
from threading import Lock
from fastapi.responses import JSONResponse
import openai

# Import Quran-specific modules
from quran_model.rank_encoder_translation import RankEncoderTranslation
from quran_model.search_encoder_translation import SearchEncoderTranslation
from quran_model.search_encoder_openai import OpenAISearchEncoder
from quran_model.rank_encoder_openai import RankEncoderOpenAI
from quran_model.text_normalization import normalisasi_teks
from quran_model.utility import muat_jsonl
from quran_model.search_encoder_ayatec import AyatecSearchEncoder

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get the absolute path to the current directory
current_dir = os.path.dirname(os.path.abspath(__file__))

# --- Load models and data ---
# Load translation data
try:
    translation_file = os.path.join(current_dir, 'quran_terjemahan_sabiq.jsonl')
    logger.info(f"Loading translation data from: {translation_file}")
    daftar_string_terjemahan_quran = muat_jsonl(translation_file)
    logger.info(f"Loaded {len(daftar_string_terjemahan_quran)} verses from translation file")
    # Log sample of first verse
    if daftar_string_terjemahan_quran:
        logger.info(f"Sample verse data: {daftar_string_terjemahan_quran[0]}")
    daftar_string_hanya_terjemahan = [str(item) for item in daftar_string_terjemahan_quran]
except Exception as e:
    logger.error(f"Error loading translation data: {e}")
    sys.exit(1)

# Initialize encoder models dictionary
ENCODER_MODELS = {
    'firqaaa/indo-sentence-bert-base': {
        'name': 'firqaaa/indo-sentence-bert-base',
        'bi_encoder': None,
        'cross_encoder': None,
        'embedding_file': 'embedding_korpus_1.pkl',
        'cross_encoder_name': 'Rifky/Indobert-QA',
        'type': 'transformer'
    },
    'indobenchmark/indobert-base-p1': {
        'name': 'indobenchmark/indobert-base-p1',
        'bi_encoder': None,
        'cross_encoder': None,
        'embedding_file': 'embedding_korpus_2.pkl',
        'cross_encoder_name': 'indobenchmark/indobert-base-p2',
        'type': 'transformer'
    },
    'msmarco-distilbert-base-tas-b': {
        'name': 'msmarco-distilbert-base-tas-b',
        'bi_encoder': None,
        'cross_encoder': None,
        'embedding_file': 'embedding_korpus_3.pkl',
        'cross_encoder_name': 'cross-encoder/ms-marco-MiniLM-L-6-v2',
        'type': 'transformer'
    },
    'aubmindlab/bert-base-arabert': {
        'name': 'aubmindlab/bert-base-arabert',
        'bi_encoder': None,
        'cross_encoder': None,
        'embedding_file': 'embedding_korpus_4.pkl',
        'cross_encoder_name': 'aubmindlab/araelectra-base-discriminator',
        'type': 'transformer'
    },
    'text-embedding-ada-002': {
        'name': 'text-embedding-ada-002',
        'bi_encoder': None,
        'cross_encoder': None,
        'embedding_file': 'embedding_korpus_5.pkl',
        'cross_encoder_name': 'gpt-3.5-turbo-instruct',
        'type': 'openai'
    },
    'ayatec': {
        'type': 'ayatec',
        'embeddings': None  # Ayatec doesn't use pre-computed embeddings
    }
}

# Load embeddings for each model
for model_name, model_info in ENCODER_MODELS.items():
    try:
        if model_info['type'] in ['transformer', 'openai']:
            embeddings_file = os.path.join(current_dir, model_info['embedding_file'])
            with open(embeddings_file, "rb") as f:
                model_info['embeddings'] = pickle.load(f)
                logger.info(f"Loaded embeddings for {model_name}")
    except Exception as e:
        logger.error(f"Error loading embeddings for {model_name}: {e}")
        model_info['embeddings'] = None

# Initialize OpenAI client if needed
api_key = os.getenv('OPENAI_API_KEY')
openai_client = None
if api_key:
    os.environ['OPENAI_API_KEY'] = api_key
    openai_client = OpenAI(api_key=api_key)

# --- FastAPI app ---
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add error handling
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"error": str(exc)}
    )

# Model classes
class QuranSearchRequest(BaseModel):
    query: str
    search_type: str = "translation"  # or "paraphrase"
    top_k: int = 5
    encoder: str  # Remove default encoder to force explicit selection

class QuranSearchResult(BaseModel):
    verse_id: str
    arabic_text: str
    translation: str
    search_score: float
    rank_score: float
    final_score: float
    ayatec_match: Optional[Dict] = None
    relevancy_scores: Optional[Dict[str, float]] = None
    related_questions: Optional[List[Dict[str, Any]]] = None

class QuranSearchResponse(BaseModel):
    results: List[QuranSearchResult]
    query: str
    search_type: str
    processing_time: float
    encoder: str
    relevancy_metrics: Optional[Dict[str, float]] = None
    related_questions: Optional[List[Dict[str, Any]]] = None

# Global variables for model caching
encoders = {}
encoder_locks = {}
model_cache = {}

def get_or_initialize_model(encoder_name: str):
    global encoders, encoder_locks, model_cache
    
    if encoder_name not in ENCODER_MODELS:
        raise HTTPException(status_code=400, detail=f"Encoder {encoder_name} not supported")
    
    logger.info(f"Requested encoder: {encoder_name}")
        
    # If encoder is already initialized, return it
    if encoder_name in encoders and encoders[encoder_name] is not None:
        logger.info(f"Using cached encoder: {encoder_name}")
        return encoders[encoder_name]
        
    # Initialize lock if not exists
    if encoder_name not in encoder_locks:
        encoder_locks[encoder_name] = Lock()
    
    lock = encoder_locks[encoder_name]
    
    # Try to acquire the lock
    if not lock.acquire(blocking=False):
        # If we can't get the lock, someone else is initializing
        # Wait for a short time and check if the model is ready
        time.sleep(0.1)
        if encoder_name in encoders and encoders[encoder_name] is not None:
            return encoders[encoder_name]
        raise HTTPException(status_code=503, detail="Model is being initialized by another request")
    
    try:
        model_info = ENCODER_MODELS[encoder_name]
        embeddings = model_info['embeddings']
        
        if embeddings is None:
            raise HTTPException(status_code=500, detail=f"Embeddings not available for encoder {encoder_name}")

        if model_info['type'] == 'transformer':
            logger.info("Creating SearchEncoderTranslation")
            
            # Initialize the bi-encoder if needed
            if model_info['bi_encoder'] is None:
                logger.info(f"Loading bi-encoder: {encoder_name}")
                try:
                    model_info['bi_encoder'] = SentenceTransformer(encoder_name)
                except Exception as e:
                    raise HTTPException(status_code=500, detail=f"Failed to load bi-encoder {encoder_name}: {str(e)}")

            # Initialize the cross-encoder if needed
            if model_info['cross_encoder'] is None and model_info['cross_encoder_name']:
                logger.info(f"Loading cross-encoder: {model_info['cross_encoder_name']}")
                try:
                    model_info['cross_encoder'] = CrossEncoder(model_info['cross_encoder_name'])
                except Exception as e:
                    logger.warning(f"Failed to load cross-encoder {model_info['cross_encoder_name']}: {str(e)}")
                    # Don't raise exception here, we can still use bi-encoder only

            model = SearchEncoderTranslation(
                bi_encoder=model_info['bi_encoder'],
                cross_encoder=model_info['cross_encoder'],
                embedding_korpus=embeddings,
                korpus=daftar_string_hanya_terjemahan
            )

            # Initialize rank encoder if cross encoder is available
            if model_info['cross_encoder']:
                try:
                    model.rank_encoder = RankEncoderTranslation(
                        bi_encoder=model_info['bi_encoder'],
                        cross_encoder=model_info['cross_encoder'],
                        embedding_korpus=embeddings,
                        daftar_string_terjemahan_quran=daftar_string_terjemahan_quran
                    )
                    logger.info("Successfully initialized rank encoder")
                except Exception as e:
                    logger.warning(f"Failed to initialize rank encoder: {str(e)}")
            else:
                logger.warning(f"Cross encoder not available for {encoder_name}")

        elif encoder_name == "text-embedding-ada-002":
            if not openai_client:
                raise HTTPException(status_code=500, detail="OpenAI client not initialized. Please check API key.")
            logger.info("Creating OpenAISearchEncoder")
            model = OpenAISearchEncoder(
                client=openai_client,
                embedding_korpus=embeddings,
                daftar_string_terjemahan_quran=daftar_string_terjemahan_quran
            )
            # Initialize rank encoder
            try:
                rank_encoder = RankEncoderOpenAI(
                    client=openai_client,
                    embedding_korpus=embeddings,
                    daftar_string_terjemahan_quran=daftar_string_terjemahan_quran
                )
                setattr(model, 'rank_encoder', rank_encoder)
                logger.info("Successfully initialized OpenAI search and rank encoders")
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI rank encoder: {str(e)}")

        elif encoder_name == "ayatec":
            logger.info("Creating AyatecSearchEncoder")
            model = AyatecSearchEncoder()
            logger.info("Successfully initialized Ayatec encoder")

        else:
            raise HTTPException(status_code=400, detail=f"Unsupported encoder type: {model_info['type']}")

        encoders[encoder_name] = model
        return model

    except Exception as e:
        logger.error(f"Error initializing encoder {encoder_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to initialize encoder {encoder_name}: {str(e)}")
    finally:
        lock.release()

# Initialize global variables
cached_gold_questions = None

# Load gold standard questions
def load_gold_questions():
    global cached_gold_questions
    if cached_gold_questions is not None:
        return cached_gold_questions
    
    gold_questions = {}
    data_dir = os.path.join(current_dir, "quran-qa-2023", "Task-A", "data")
    
    # Load all question files
    for dataset_type in ['dev', 'test', 'train']:
        question_file = os.path.join(data_dir, f"QQA23_TaskA_ayatec_v1.2_{dataset_type}.tsv")
        try:
            if os.path.exists(question_file):
                with open(question_file, encoding='utf-8') as f:
                    for line in f:
                        try:
                            qid, question = line.strip().split('\t')
                            gold_questions[qid] = question
                        except ValueError:
                            logger.warning(f"Invalid line format in {question_file}")
                            continue
            else:
                logger.warning(f"Question file not found: {question_file}")
        except Exception as e:
            logger.error(f"Error loading question file {question_file}: {e}")
    
    cached_gold_questions = gold_questions
    return gold_questions

def normalize_text(text: str) -> str:
    # Convert to lowercase
    text = text.lower()
    # Remove punctuation
    text = ''.join(c for c in text if c.isalnum() or c.isspace())
    # Normalize whitespace
    text = ' '.join(text.split())
    return text

def calculate_relevancy(query: str, gold_questions: Dict[str, str]) -> tuple[Dict[str, float], List[Dict[str, Any]]]:
    relevancy_scores = {"high": 0.0, "medium": 0.0, "low": 0.0}
    related_questions = []
    
    if not gold_questions:
        relevancy_scores["medium"] = 1.0
        return relevancy_scores, related_questions

    # Load translations and paraphrases with error handling
    translations_data = {}
    paraphrases_data = {}
    
    # Helper function to safely load JSONL files
    def safe_load_jsonl(file_path: str) -> List[Dict]:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return [json.loads(line) for line in f if line.strip()]
        except Exception as e:
            logger.warning(f"Error loading {file_path}: {e}")
            return []

    # Load all translation files
    for dataset in ['dev', 'test', 'train']:
        file_path = os.path.join(current_dir, '..', 'quran_data', f'terjemahan_pertanyaan_claude_{dataset}_id.jsonl')
        translations = safe_load_jsonl(file_path)
        for item in translations:
            if 'qid' in item and 'query_id' in item:
                qid = str(item['qid'])
                if qid not in translations_data:
                    translations_data[qid] = []
                translations_data[qid].append(item['query_id'])

    # Load all paraphrase files
    for dataset in ['dev', 'test', 'train']:
        file_path = os.path.join(current_dir, '..', 'quran_data', f'parafrasa_pertanyaan_gpt_{dataset}_id.jsonl')
        paraphrases = safe_load_jsonl(file_path)
        for item in paraphrases:
            if 'qid' in item and 'query_versions' in item:
                qid = str(item['qid'])
                if qid not in paraphrases_data:
                    paraphrases_data[qid] = []
                paraphrases_data[qid].extend(item['query_versions'])

    # Calculate similarities using translations and paraphrases
    similarities = []
    query_normalized = normalize_text(query)
    
    for qid, question in gold_questions.items():
        qid = str(qid)
        max_similarity = 0.0
        
        # Check translations
        translations = translations_data.get(qid, [])
        for translation in translations:
            translation_normalized = normalize_text(translation)
            similarity = len(set(query_normalized.split()) & set(translation_normalized.split())) / \
                        len(set(query_normalized.split()) | set(translation_normalized.split()))
            max_similarity = max(max_similarity, similarity)
        
        # Check paraphrases
        paraphrases = paraphrases_data.get(qid, [])
        for paraphrase in paraphrases:
            paraphrase_normalized = normalize_text(paraphrase)
            similarity = len(set(query_normalized.split()) & set(paraphrase_normalized.split())) / \
                        len(set(query_normalized.split()) | set(paraphrase_normalized.split()))
            max_similarity = max(max_similarity, similarity)
        
        if max_similarity > 0:
            similarities.append((max_similarity, qid, question))
    
    # Sort by similarity score
    similarities.sort(reverse=True)
    
    # Get top 5 similar questions
    top_5 = similarities[:5]
    
    # Calculate relevancy metrics
    if top_5:
        max_sim = top_5[0][0]
        if max_sim >= 0.6:
            relevancy_scores["high"] = 0.7
            relevancy_scores["medium"] = 0.2
            relevancy_scores["low"] = 0.1
        elif max_sim >= 0.3:
            relevancy_scores["high"] = 0.3
            relevancy_scores["medium"] = 0.5
            relevancy_scores["low"] = 0.2
        else:
            relevancy_scores["high"] = 0.1
            relevancy_scores["medium"] = 0.3
            relevancy_scores["low"] = 0.6
    
    # Add related questions with translations and paraphrases
    for sim, qid, question in top_5:
        related_questions.append({
            "qid": qid,
            "question": question,
            "similarity": float(sim),
            "translations": translations_data.get(qid, []),
            "paraphrases": paraphrases_data.get(qid, []),
            "arabic_question": question  # Keep the Arabic question for display
        })
    
    return relevancy_scores, related_questions

@app.get("/")
async def health_check():
    """Simple health check endpoint"""
    return {
        "status": "ok",
        "service": "quran-search-rank"
    }

@app.post("/api/search", response_model=QuranSearchResponse)
async def search_quran(request: QuranSearchRequest):
    start_time = time.time()
    logger.info(f"Received search request - Query: {request.query}, Type: {request.search_type}, Encoder: {request.encoder}")
    
    try:
        # Get the appropriate model
        model = get_or_initialize_model(request.encoder)
        
        # Load gold standard questions
        gold_questions = load_gold_questions()
        
        # Calculate relevancy scores and get related questions
        relevancy_scores, related_questions = calculate_relevancy(request.query, gold_questions)
        
        # Handle verse lookup differently
        if request.search_type == 'verse':
            try:
                # Parse verse ID (format: surah:ayah)
                if ':' not in request.query:
                    raise ValueError("Invalid verse ID format")
                    
                surah, ayah = request.query.split(':')
                logger.info(f"Verse lookup - Surah: {surah}, Ayah: {ayah}")
                
                if not surah.isdigit() or not ayah.isdigit():
                    raise ValueError("Invalid verse ID format")
                
                # Use the selected encoder
                model = get_or_initialize_model(request.encoder)
                
                # Search for exact verse
                verse_results = model.search(f"verse:{request.query}", request.top_k)
                logger.info(f"Verse search results: {verse_results}")
                
                if not verse_results:
                    logger.warning(f"No results found for verse {request.query}")
                    results = []
                else:
                    results = [
                        QuranSearchResult(
                            verse_id=request.query,
                            arabic_text=verse_results[0].get('arabic_text', ''),
                            translation=verse_results[0].get('text', ''),
                            search_score=verse_results[0].get('map_score', verse_results[0].get('score', 1.0)),
                            rank_score=verse_results[0].get('mrr_score', verse_results[0].get('cross-score', 1.0)),
                            final_score=verse_results[0].get('final_score', 1.0),
                            relevancy_scores=relevancy_scores,
                            related_questions=related_questions
                        )
                    ]
                    logger.info(f"Created verse result with verse_id: {request.query}")
                
                return QuranSearchResponse(
                    results=results,
                    query=request.query,
                    search_type='verse',
                    processing_time=time.time() - start_time,
                    encoder=request.encoder,
                    relevancy_metrics=relevancy_scores,
                    related_questions=related_questions
                )
                
            except ValueError as e:
                logger.error(f"Invalid verse query format: {request.query}")
                raise HTTPException(status_code=400, detail=str(e))
        
        # For Ayatec encoder, handle differently
        if ENCODER_MODELS[request.encoder]['type'] == "ayatec":
            ayatec_results = model.search(request.query, request.top_k)
            
            # Convert Ayatec results to QuranSearchResult format
            results = []
            for res in ayatec_results:
                results.append(QuranSearchResult(
                    verse_id="ayatec",
                    arabic_text=res["question_ar"],
                    translation="",
                    search_score=res["similarity_score"],
                    rank_score=1.0,
                    final_score=res["similarity_score"],
                    ayatec_match=res["ayatec_match"],
                    relevancy_scores=relevancy_scores,
                    related_questions=related_questions
                ))
        else:
            # Handle normal search
            search_results = model.search(request.query, request.top_k)
            logger.info(f"Search returned {len(search_results)} results")
            results = []
            seen_docs = set()
            
            for hit in search_results:
                doc_id = str(hit['corpus_id'])
                if doc_id not in seen_docs:
                    # Get scores with fallbacks
                    search_score = hit.get('map_score', hit.get('score', 0.0))
                    rank_score = hit.get('mrr_score', hit.get('cross-score', 0.0))
                    final_score = hit.get('final_score', (search_score + rank_score) / 2)
                    
                    results.append(QuranSearchResult(
                        verse_id=doc_id,
                        arabic_text=hit.get('arabic_text', ''),
                        translation=hit.get('text', daftar_string_terjemahan_quran[hit['corpus_id']]),
                        search_score=float(search_score),
                        rank_score=float(rank_score),
                        final_score=float(final_score),
                        relevancy_scores=relevancy_scores,
                        related_questions=related_questions
                    ))
                    seen_docs.add(doc_id)
            
        return QuranSearchResponse(
            results=results,
            query=request.query,
            search_type=request.search_type,
            processing_time=time.time() - start_time,
            encoder=request.encoder,
            relevancy_metrics=relevancy_scores,
            related_questions=related_questions
        )
        
    except Exception as e:
        logger.error(f"Error processing search request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.on_event("shutdown")
async def shutdown_event():
    # Clean up resources
    global encoders, encoder_locks, model_cache
    encoders.clear()
    encoder_locks.clear()
    model_cache.clear()
    
    # Clean up any temporary files
    cache_dir = os.path.join(os.path.dirname(__file__), "model_cache")
    if os.path.exists(cache_dir):
        try:
            import shutil
            shutil.rmtree(cache_dir)
        except:
            pass

if __name__ == "__main__":
    try:
        # Configure uvicorn with better error handling and connection management
        config = uvicorn.Config(
            "quran_model.serve_quran_model:app",
            host="127.0.0.1",
            port=8001,
            log_level="info",
            reload=True,
            workers=1,
            backlog=2048,
            timeout_keep_alive=5,
            access_log=True
        )
        server = uvicorn.Server(config)
        server.run()
    except KeyboardInterrupt:
        print("\nShutting down gracefully...")
        # Create a new event loop for cleanup
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(shutdown_event())
        loop.close()
    except Exception as e:
        print(f"Error running server: {str(e)}")
    finally:
        # Ensure cleanup happens
        try:
            loop = asyncio.get_event_loop()
            if not loop.is_closed():
                loop.run_until_complete(shutdown_event())
                loop.close()
        except Exception as e:
            print(f"Error during cleanup: {str(e)}") 