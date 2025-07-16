import os
import pickle
import numpy as np
from sentence_transformers import SentenceTransformer
from openai import OpenAI
import logging
from pathlib import Path
from quran_model.utility import muat_jsonl
import torch

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_transformer_embeddings(model_name, texts, output_file):
    """Generate embeddings using transformer models"""
    logger.info(f"Loading model {model_name}")
    model = SentenceTransformer(model_name)
    
    logger.info(f"Generating embeddings for {len(texts)} texts")
    embeddings = model.encode(texts, show_progress_bar=True, convert_to_tensor=True)
    
    # Convert to numpy array
    if isinstance(embeddings, torch.Tensor):
        embeddings = embeddings.cpu().numpy()
    elif isinstance(embeddings, list):
        embeddings = np.array(embeddings)
    
    logger.info(f"Saving embeddings to {output_file}")
    with open(output_file, 'wb') as f:
        # Use protocol=4 for better compatibility
        pickle.dump(embeddings, f, protocol=4)
    
    return embeddings

def generate_openai_embeddings(texts, output_file):
    """Generate embeddings using OpenAI API"""
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OpenAI API key not found in environment variables")
    
    client = OpenAI(api_key=api_key)
    embeddings_list = []
    batch_size = 100  # Process in smaller batches
    
    logger.info(f"Generating OpenAI embeddings for {len(texts)} texts")
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        try:
            response = client.embeddings.create(
                input=batch,
                model="text-embedding-ada-002"
            )
            batch_embeddings = [data.embedding for data in response.data]
            embeddings_list.extend(batch_embeddings)
            logger.info(f"Processed {i + len(batch)} texts")
        except Exception as e:
            logger.error(f"Error generating embeddings for batch starting at {i}: {e}")
            raise
    
    # Convert to numpy array
    embeddings = np.array(embeddings_list, dtype=np.float32)
    
    logger.info(f"Saving embeddings to {output_file}")
    with open(output_file, 'wb') as f:
        # Use protocol=4 for better compatibility
        pickle.dump(embeddings, f, protocol=4)
    
    return embeddings

def main():
    try:
        # Get current directory
        current_dir = Path(__file__).parent.absolute()
        
        # Load translation data
        translation_file = current_dir / 'quran_terjemahan_sabiq.jsonl'
        logger.info(f"Loading translations from {translation_file}")
        translations = muat_jsonl(str(translation_file))
        texts = [str(item) for item in translations]
        
        # Model configurations
        models = {
            'firqaaa/indo-sentence-bert-base': 'embedding_korpus_1.pkl',
            'indobenchmark/indobert-base-p1': 'embedding_korpus_2.pkl',
            'msmarco-distilbert-base-tas-b': 'embedding_korpus_3.pkl',
            'aubmindlab/bert-base-arabert': 'embedding_korpus_4.pkl',
            'text-embedding-ada-002': 'embedding_korpus_5.pkl'
        }
        
        # Generate embeddings for transformer models and OpenAI
        for model_name, output_file in models.items():
            output_path = current_dir / output_file
            try:
                logger.info(f"\nProcessing model: {model_name}")
                if model_name == 'text-embedding-ada-002':
                    generate_openai_embeddings(texts, output_path)
                else:
                    generate_transformer_embeddings(model_name, texts, output_path)
                logger.info(f"Successfully generated embeddings for {model_name}")
            except Exception as e:
                logger.error(f"Error generating embeddings for {model_name}: {e}")
        
        logger.info("\nEmbedding generation complete!")
        
    except Exception as e:
        logger.error(f"Error in main process: {e}")
        raise

if __name__ == "__main__":
    main() 