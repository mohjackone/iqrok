import os
import pickle
from sentence_transformers import SentenceTransformer, CrossEncoder

# Translation corpus
korpus = daftar_string_hanya_terjemahan

# Cache file paths
bi_encoder_cache = "embedding_korpus_2.pkl"
# cross_encoder_cache = "scores_2.pkl"  # Uncomment if you want to cache cross-encoder scores

# Bi-encoder
bi_encoder_2 = SentenceTransformer('indobenchmark/indobert-base-p1')

# Cross-encoder (example: scoring query-passage pairs)
cross_encoder_2 = CrossEncoder('indobenchmark/indobert-base-p2')

if os.path.exists(bi_encoder_cache):
    print("Loading bi-encoder embeddings from cache...")
    with open(bi_encoder_cache, "rb") as f:
        embedding_korpus_2 = pickle.load(f)
else:
    print("Computing bi-encoder embeddings...")
    embedding_korpus_2 = bi_encoder_2.encode(korpus, convert_to_tensor=True, show_progress_bar=True)
    with open(bi_encoder_cache, "wb") as f:
        pickle.dump(embedding_korpus_2, f)
    print(f"Saved embeddings to {bi_encoder_cache}")
