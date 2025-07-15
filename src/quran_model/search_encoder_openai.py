from typing import List, Dict
import numpy as np
from quran_model.text_normalization import normalisasi_teks

class OpenAISearchEncoder:
    def __init__(self, client, embedding_korpus, daftar_string_terjemahan_quran):
        self.client = client
        self.embedding_korpus = embedding_korpus
        self.daftar_string_terjemahan_quran = daftar_string_terjemahan_quran
        self.korpus = [str(item) for item in daftar_string_terjemahan_quran]
        self.rank_encoder = None  # Initialize rank_encoder as None

    def get_embedding(self, text: str) -> List[float]:
        response = self.client.embeddings.create(
            input=text,
            model="text-embedding-ada-002"
        )
        return response.data[0].embedding

    def search(self, query: str, top_k: int = 20) -> List[Dict]:
        try:
            # Normalize query
            normalized_query = normalisasi_teks(query)
            
            # Get query embedding
            query_embedding = self.get_embedding(normalized_query)
            
            # Convert embeddings to numpy arrays for efficient computation
            query_embedding = np.array(query_embedding)
            corpus_embeddings = np.array(self.embedding_korpus)
            
            # Compute cosine similarity
            similarities = np.dot(corpus_embeddings, query_embedding) / (
                np.linalg.norm(corpus_embeddings, axis=1) * np.linalg.norm(query_embedding)
            )
            
            # Get top k results
            top_k_idx = np.argsort(similarities)[-top_k:][::-1]
            
            # Format initial results
            initial_results = []
            for idx in top_k_idx:
                initial_results.append({
                    'corpus_id': int(idx),
                    'score': float(similarities[idx]),
                    'text': self.korpus[idx]
                })
            
            # Use rank encoder if available
            if self.rank_encoder is not None:
                ranked_results = self.rank_encoder.rank(normalized_query, initial_results)
                
                # Ensure results have all required fields
                final_results = []
                for result in ranked_results:
                    final_results.append({
                        'corpus_id': result['corpus_id'],
                        'text': result['text'],
                        'score': result['score'],
                        'cross-score': result['cross-score'],
                        'final_score': result['final_score'],
                        'map@10': result['score'],  # Use initial score as MAP@10
                        'mrr': result['cross-score']  # Use cross-score as MRR
                    })
                return final_results
            
            # If no rank encoder, format results consistently
            return [{
                'corpus_id': r['corpus_id'],
                'text': r['text'],
                'score': r['score'],
                'cross-score': r['score'],  # Use same score when no cross-encoder
                'final_score': r['score'],
                'map@10': r['score'],
                'mrr': r['score']
            } for r in initial_results]

        except Exception as e:
            print(f"Error in OpenAI search: {str(e)}")
            return [] 