from sentence_transformers import util
from typing import List, Dict
from quran_model.text_normalization import normalisasi_teks
import torch

class SearchEncoderParaphrase:
    def __init__(self, bi_encoder, embedding_korpus, daftar_string_terjemahan_quran):
        self.bi_encoder = bi_encoder
        self.embedding_korpus = embedding_korpus
        self.daftar_string_terjemahan_quran = daftar_string_terjemahan_quran
        self.korpus = [str(item) for item in daftar_string_terjemahan_quran]

    def calculate_map_score(self, scores: List[float], k: int = 10) -> float:
        """Calculate Mean Average Precision score"""
        if not scores:
            return 0.0
        
        precisions = []
        relevant_count = 0
        
        for i, score in enumerate(scores[:k], 1):
            if score >= 0.5:  # Consider scores >= 0.5 as relevant
                relevant_count += 1
                precisions.append(relevant_count / i)
                
        return sum(precisions) / len(precisions) if precisions else 0.0

    def calculate_mrr_score(self, scores: List[float]) -> float:
        """Calculate Mean Reciprocal Rank score"""
        for i, score in enumerate(scores, 1):
            if score >= 0.5:  # First relevant result
                return 1.0 / i
        return 0.0

    def search(self, query: str, top_k: int = 20) -> List[Dict]:
        try:
            # Generate paraphrases (you can implement your own paraphrase generation here)
            paraphrases = [query]  # For now, just use the original query
            
            all_results = []
            seen_docs = set()
            
            for paraphrase in paraphrases:
                # Normalize paraphrase
                normalized_query = normalisasi_teks(paraphrase)
                
                # Create query embedding
                query_embedding = self.bi_encoder.encode(normalized_query, convert_to_tensor=True)
                
                # Perform semantic search
                hits = util.semantic_search(query_embedding, self.embedding_korpus, top_k=top_k)[0]
                
                # Add unique results
                for hit in hits:
                    if hit['corpus_id'] not in seen_docs:
                        # Calculate MAP and MRR scores
                        map_score = self.calculate_map_score([1.0 if i == hit['corpus_id'] else 0.0 for i in range(len(self.korpus))])
                        mrr_score = self.calculate_mrr_score([1.0 if i == hit['corpus_id'] else 0.0 for i in range(len(self.korpus))])
                        
                        all_results.append({
                            'corpus_id': hit['corpus_id'],
                            'score': float(hit['score']),
                            'text': self.korpus[hit['corpus_id']],
                            'map_score': map_score,
                            'mrr_score': mrr_score,
                            'final_score': (map_score + mrr_score) / 2
                        })
                        seen_docs.add(hit['corpus_id'])
            
            # Sort by final score
            all_results = sorted(all_results, key=lambda x: x['final_score'], reverse=True)
            return all_results[:top_k]

        except Exception as e:
            print(f"Error in search: {str(e)}")
            return []

def cari_dengan_pengkode_silang_parafrasa(daftar_parafrasa):

    hasil_semua = []

    # Iterasi setiap parafrasa dalam daftar
    for parafrasa in daftar_parafrasa:
        # Panggil fungsi pencarian dengan pengkode silang terjemahan
        id_dokumen, skor, nomor_dokumen = cari_dengan_pengkode_silang_terjemahan(parafrasa)
        # Gabungkan hasil ke dalam satu list
        for i in range(len(id_dokumen)):
            hasil_semua.append({
                'id_dokumen': id_dokumen[i],
                'skor': float(skor[i]) if isinstance(skor[i], (int, float, str)) else skor[i],  # Penanganan konversi tipe data
                'nomor_dokumen': nomor_dokumen[i]
            })

    # Gabungkan hasil yang sama (berdasarkan id_dokumen), ambil skor tertinggi
    hasil_terbaik = {}
    for item in hasil_semua:
        id_doc = item['id_dokumen']
        if id_doc == "":
            continue
        # Jika id_dokumen belum ada atau skor lebih tinggi, simpan sebagai hasil terbaik
        if id_doc not in hasil_terbaik or item['skor'] > hasil_terbaik[id_doc]['skor']:
            hasil_terbaik[id_doc] = item

    # Urutkan berdasarkan skor tertinggi
    hasil_terurut = sorted(hasil_terbaik.values(), key=lambda x: x['skor'], reverse=True)

    # Batasi hasil ke 10 teratas
    hasil_terurut = hasil_terurut[:10]

    # Keluarkan dalam format yang sama seperti output fungsi sebelumnya
    id_dokumen = [item['id_dokumen'] for item in hasil_terurut]
    skor = [item['skor'] for item in hasil_terurut]  # Skor sudah dikonversi ke float
    nomor_dokumen = [item['nomor_dokumen'] for item in hasil_terurut]

    return id_dokumen, skor, nomor_dokumen