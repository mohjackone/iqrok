from sentence_transformers import SentenceTransformer, CrossEncoder, util
import os
import pickle

# Inisialisasi model bi-encoder untuk menghasilkan embedding kalimat
bi_encoder_3 = SentenceTransformer('msmarco-distilbert-base-tas-b') #msmarco-distilbert-base-v4

# Inisialisasi model cross-encoder untuk penilaian relevansi
cross_encoder_3 = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2') #"cross-encoder/ms-marco-MiniLM-L-12-v2"

# Menyiapkan korpus dan menghasilkan embedding
korpus = daftar_string_hanya_terjemahan
embedding_cache_path = 'embedding_korpus_3.pkl'

if os.path.exists(embedding_cache_path):
    print("Loading bi-encoder embeddings from cache...")
    with open(embedding_cache_path, "rb") as f:
        embedding_korpus_3 = pickle.load(f)
else:
    print("Computing bi-encoder embeddings...")
    embedding_korpus_3 = bi_encoder_3.encode(korpus, convert_to_tensor=True, show_progress_bar=True)
    with open(embedding_cache_path, "wb") as f:
        pickle.dump(embedding_korpus_3, f)
    print(f"Saved embeddings to {embedding_cache_path}") 