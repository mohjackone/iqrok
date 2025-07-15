from typing import List, Dict
import re
from quran_model.text_normalization import normalisasi_teks

class RankEncoderOpenAI:
    def __init__(self, client, embedding_korpus, daftar_string_terjemahan_quran):
        self.client = client
        self.embedding_korpus = embedding_korpus
        self.daftar_string_terjemahan_quran = daftar_string_terjemahan_quran
        self.korpus = [str(item) for item in daftar_string_terjemahan_quran]

    def get_similarity_score(self, text1: str, text2: str) -> float:
        prompt = f"""Bandingkan kemiripan makna dari kedua teks ini dan berikan nilai dari -5 sampai 5, dimana:
        5 berarti memiliki makna yang sama persis
        0 berarti tidak berhubungan
        -5 berarti memiliki makna yang benar-benar berlawanan
        Berikan jawaban hanya dalam bentuk angka saja.

        Teks 1: {text1}
        Teks 2: {text2}
        
        Nilai kemiripan:"""
        
        response = self.client.completions.create(
            model="gpt-3.5-turbo-instruct",
            prompt=prompt,
            max_tokens=4,
            temperature=0,
            top_p=1,
            frequency_penalty=0,
            presence_penalty=0
        )
        raw_text = response.choices[0].text.strip()
        match = re.search(r"-?\d+(\.\d+)?", raw_text)
        if match:
            score = float(match.group(0))
            normalized_score = (score + 5) / 10  # Convert from [-5,5] to [0,1]
            return normalized_score
        else:
            return 0.0

    def rank(self, query: str, candidates: List[dict]) -> List[dict]:
        """Rank the candidates using GPT model for scoring"""
        try:
            # Normalize query
            normalized_query = normalisasi_teks(query)
            
            # Get similarity scores for each candidate
            for candidate in candidates:
                score = self.get_similarity_score(normalized_query, self.korpus[candidate['corpus_id']])
                candidate['cross-score'] = float(score)

            # Sort by cross-encoder score
            candidates = sorted(candidates, key=lambda x: x['cross-score'], reverse=True)

            # Format results while preserving corpus_id
            results = []
            seen_docs = set()
            
            for hit in candidates[:10]:
                doc_id = str(hit['corpus_id'])
                if doc_id not in seen_docs:
                    results.append({
                        'corpus_id': hit['corpus_id'],  # Preserve the original corpus_id
                        'verse_id': doc_id,
                        'arabic_text': '',  # To be filled from your Arabic text source
                        'text': self.korpus[hit['corpus_id']],
                        'score': float(hit['score']) if 'score' in hit else 0.0,
                        'cross-score': float(hit['cross-score']),
                        'final_score': (float(hit['score']) + float(hit['cross-score'])) / 2 if 'score' in hit else float(hit['cross-score'])
                    })
                    seen_docs.add(doc_id)

            return results[:5]  # Return top 5 results

        except Exception as e:
            print(f"Error in OpenAI ranking: {str(e)}")
            return [] 