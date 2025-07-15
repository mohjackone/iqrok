import os
import pickle
import numpy as np
from typing import List, Tuple
from openai import OpenAI

# Initialize the OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))  # Get from environment variable

korpus = daftar_string_hanya_terjemahan
embedding_cache_path = 'embedding_korpus_5.pkl'

def get_ada_embeddings(texts, model="text-embedding-ada-002", batch_size=1000):
    embeddings = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i+batch_size]
        response = client.embeddings.create(input=batch, model=model)
        batch_embeddings = [item.embedding for item in response.data]
        embeddings.extend(batch_embeddings)
    return embeddings

def get_gpt_similarity(text1: str, text2: str, model="gpt-3.5-turbo-instruct") -> float:
    prompt = f"""Bandingkan kemiripan makna dari kedua teks ini dan berikan nilai dari -5 sampai 5, dimana:
    5 berarti memiliki makna yang sama persis
    0 berarti tidak berhubungan
    -5 berarti memiliki makna yang benar-benar berlawanan
    Berikan jawaban hanya dalam bentuk angka saja.

    Teks 1: {text1}
    Teks 2: {text2}
    
    Nilai kemiripan:"""
    
    response = client.completions.create(
        model=model,
        prompt=prompt,
        max_tokens=4,  # allow a few tokens for safety
        temperature=0,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0
    )
    raw_text = response.choices[0].text.strip()
    match = re.search(r"-?\d+(\.\d+)?", raw_text)
    if match:
        score = float(match.group(0))
        normalized_score = (score + 5) / 10
        return normalized_score
    else:
        return 0.0
    
def semantic_search(query_embedding: List[float], corpus_embeddings: List[List[float]], top_k: int = 20) -> List[dict]:
    # Convert to numpy arrays for efficient computation
    query_embedding = np.array(query_embedding)
    corpus_embeddings = np.array(corpus_embeddings)
    
    # Compute cosine similarity
    similarities = np.dot(corpus_embeddings, query_embedding) / (
        np.linalg.norm(corpus_embeddings, axis=1) * np.linalg.norm(query_embedding)
    )
    
    # Get top k results
    top_k_idx = np.argsort(similarities)[-top_k:][::-1]
    
    results = []
    for idx in top_k_idx:
        results.append({
            'corpus_id': int(idx),
            'score': float(similarities[idx])
        })
    
    return results

if os.path.exists(embedding_cache_path):
    print("Loading bi-encoder embeddings from cache...")
    with open(embedding_cache_path, "rb") as f:
        embedding_korpus_5 = pickle.load(f)
else:
    print("Computing bi-encoder embeddings with text-embedding-ada-002...")
    embedding_korpus_5 = get_ada_embeddings(korpus)
    with open(embedding_cache_path, "wb") as f:
        pickle.dump(embedding_korpus_5, f)
    print(f"Saved embeddings to {embedding_cache_path}")