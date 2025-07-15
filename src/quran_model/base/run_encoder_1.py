import os
import pickle
from sentence_transformers import SentenceTransformer, CrossEncoder

korpus = daftar_string_hanya_terjemahan
bi_encoder_cache = "embedding_korpus_1.pkl"

bi_encoder_1 = SentenceTransformer('firqaaa/indo-sentence-bert-base')
cross_encoder_1 = CrossEncoder('Rifky/Indobert-QA')

if os.path.exists(bi_encoder_cache):
    print("Loading bi-encoder embeddings from cache...")
    with open(bi_encoder_cache, "rb") as f:
        embedding_korpus_1 = pickle.load(f)
else:
    print("Computing bi-encoder embeddings...")
    embedding_korpus_1 = bi_encoder_1.encode(korpus, convert_to_tensor=True, show_progress_bar=True)
    with open(bi_encoder_cache, "wb") as f:
        pickle.dump(embedding_korpus_1, f)
    print(f"Saved embeddings to {bi_encoder_cache}")
