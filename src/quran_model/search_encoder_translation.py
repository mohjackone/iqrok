from typing import List, Dict, Any, Optional
from sentence_transformers import SentenceTransformer, CrossEncoder
import numpy as np
from quran_model.rank_encoder_translation import RankEncoderTranslation

class SearchEncoderTranslation:
    def __init__(self, bi_encoder: SentenceTransformer, cross_encoder: CrossEncoder, embedding_korpus: np.ndarray, korpus: List[str]):
        self.bi_encoder = bi_encoder
        self.cross_encoder = cross_encoder
        self.embedding_korpus = embedding_korpus
        self.korpus = korpus
        self.rank_encoder: Optional[RankEncoderTranslation] = None

    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        try:
            # Get query embedding
            query_embedding = self.bi_encoder.encode(query, convert_to_tensor=True)
            
            # Calculate cosine similarities
            cos_scores = np.dot(self.embedding_korpus, query_embedding) / (
                np.linalg.norm(self.embedding_korpus, axis=1) * np.linalg.norm(query_embedding)
            )
            
            # Get top-k results
            top_results = []
            top_indices = np.argsort(-cos_scores)[:top_k]
            
            for idx in top_indices:
                score = float(cos_scores[idx])
                if score > 0:  # Only include positive scores
                    top_results.append({
                        'corpus_id': int(idx),
                        'text': self.korpus[idx],
                        'score': score
                    })
            
            # Use rank_encoder if available
            if self.rank_encoder and top_results:
                try:
                    ranked_results = self.rank_encoder.rank(query, top_results)
                    if ranked_results:  # Only use ranked results if successful
                        return ranked_results
                    else:
                        raise Exception("Rank encoder returned empty results")
                except Exception as e:
                    raise Exception(f"Rank encoder failed: {str(e)}")
                    
            # If no rank encoder or ranking failed, raise exception
            if not top_results:
                raise Exception("No results found")
                
            return top_results

        except Exception as e:
            raise Exception(f"Search failed: {str(e)}")