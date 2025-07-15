import os
import pickle
from sentence_transformers import SentenceTransformer
from sentence_transformers import CrossEncoder
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Model configurations
ENCODER_MODELS = {
    'firqaaa/indo-sentence-bert-base': {
        'embedding_file': 'embedding_korpus_1.pkl',
        'cross_encoder': 'Rifky/Indobert-QA'
    },
    'indobenchmark/indobert-base-p1': {
        'embedding_file': 'embedding_korpus_2.pkl',
        'cross_encoder': 'indobenchmark/indobert-base-p2'
    },
    'msmarco-distilbert-base-tas-b': {
        'embedding_file': 'embedding_korpus_3.pkl',
        'cross_encoder': 'cross-encoder/ms-marco-MiniLM-L-6-v2'
    },
    'aubmindlab/bert-base-arabert': {
        'embedding_file': 'embedding_korpus_4.pkl',
        'cross_encoder': 'aubmindlab/araelectra-base-discriminator'
    }
}

def verify_pkl_file(file_path: str) -> bool:
    """Verify if a pickle file exists and can be loaded"""
    try:
        if not os.path.exists(file_path):
            logger.error(f"Embedding file not found: {file_path}")
            return False
            
        with open(file_path, 'rb') as f:
            embeddings = pickle.load(f)
            logger.info(f"Successfully loaded embeddings from {file_path}")
            logger.info(f"Embeddings shape/size: {len(embeddings) if isinstance(embeddings, list) else embeddings.shape}")
        return True
    except Exception as e:
        logger.error(f"Error loading {file_path}: {e}")
        return False

def main():
    # Get the current directory
    current_dir = Path(__file__).parent

    logger.info("Starting model setup and verification...")
    
    # Track success/failure
    status = {
        "bi_encoders": {},
        "cross_encoders": {},
        "embeddings": {}
    }

    # Check each model
    for model_name, config in ENCODER_MODELS.items():
        logger.info(f"\nChecking {model_name}...")
        
        # 1. Download and verify bi-encoder
        try:
            logger.info(f"Downloading bi-encoder: {model_name}")
            model = SentenceTransformer(model_name)
            status["bi_encoders"][model_name] = "✓"
            logger.info(f"Successfully loaded bi-encoder: {model_name}")
        except Exception as e:
            status["bi_encoders"][model_name] = "✗"
            logger.error(f"Error loading bi-encoder {model_name}: {e}")

        # 2. Download and verify cross-encoder
        try:
            logger.info(f"Downloading cross-encoder: {config['cross_encoder']}")
            cross_model = CrossEncoder(config['cross_encoder'])
            status["cross_encoders"][config['cross_encoder']] = "✓"
            logger.info(f"Successfully loaded cross-encoder: {config['cross_encoder']}")
        except Exception as e:
            status["cross_encoders"][config['cross_encoder']] = "✗"
            logger.error(f"Error loading cross-encoder {config['cross_encoder']}: {e}")

        # 3. Verify embedding file
        embedding_path = current_dir / config['embedding_file']
        if verify_pkl_file(str(embedding_path)):
            status["embeddings"][config['embedding_file']] = "✓"
        else:
            status["embeddings"][config['embedding_file']] = "✗"

    # Print summary
    logger.info("\n=== Setup Summary ===")
    
    logger.info("\nBi-Encoders:")
    for model, result in status["bi_encoders"].items():
        logger.info(f"{result} {model}")
    
    logger.info("\nCross-Encoders:")
    for model, result in status["cross_encoders"].items():
        logger.info(f"{result} {model}")
    
    logger.info("\nEmbedding Files:")
    for file, result in status["embeddings"].items():
        logger.info(f"{result} {file}")

if __name__ == "__main__":
    main() 