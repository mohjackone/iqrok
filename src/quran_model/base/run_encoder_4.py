from sentence_transformers import SentenceTransformer, CrossEncoder, util
import os
import pickle

# Inisialisasi model bi-encoder untuk menghasilkan embedding kalimat
bi_encoder_4 = SentenceTransformer('aubmindlab/bert-base-arabert')

# Inisialisasi model cross-encoder untuk penilaian relevansi
cross_encoder_4 = CrossEncoder('aubmindlab/araelectra-base-discriminator')

# Menyiapkan korpus dan menghasilkan embedding
korpus = daftar_string_hanya_terjemahan
embedding_cache_path = 'embedding_korpus_4.pkl'

if os.path.exists(embedding_cache_path):
    print("Loading bi-encoder embeddings from cache...")
    with open(embedding_cache_path, "rb") as f:
        embedding_korpus_4 = pickle.load(f)
else:
    print("Computing bi-encoder embeddings...")
    embedding_korpus_4 = bi_encoder_4.encode(korpus, convert_to_tensor=True, show_progress_bar=True)
    with open(embedding_cache_path, "wb") as f:
        pickle.dump(embedding_korpus_4, f)
    print(f"Saved embeddings to {embedding_cache_path}")