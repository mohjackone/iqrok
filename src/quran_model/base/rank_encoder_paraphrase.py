import pandas as pd
from typing import List, Dict
from quran_model.text_normalization import normalisasi_teks

class RankEncoderParaphrase:
    def __init__(self, bi_encoder, cross_encoder, embedding_korpus, daftar_string_terjemahan_quran):
        self.bi_encoder = bi_encoder
        self.cross_encoder = cross_encoder
        self.embedding_korpus = embedding_korpus
        self.daftar_string_terjemahan_quran = daftar_string_terjemahan_quran
        self.korpus = [str(item) for item in daftar_string_terjemahan_quran]

    def rank(self, query: str, candidates: List[dict]) -> List[dict]:
        """Rank the candidates using cross-encoder with paraphrase support"""
        try:
            # Normalize query
            normalized_query = normalisasi_teks(query)
            
            # Create cross-encoder pairs
            pairs = [[normalized_query, self.korpus[hit['corpus_id']]] for hit in candidates]
            
            # Get cross-encoder scores
            cross_scores = self.cross_encoder.predict(pairs)

            # Add scores to candidates
            for idx, score in enumerate(cross_scores):
                candidates[idx]['cross-score'] = float(score)

            # Sort by cross-encoder score
            candidates = sorted(candidates, key=lambda x: x['cross-score'], reverse=True)

            # Format results
            results = []
            seen_docs = set()
            
            for hit in candidates[:10]:
                doc_id = str(hit['corpus_id'])
                if doc_id not in seen_docs:
                    results.append({
                        'verse_id': doc_id,
                        'arabic_text': '',  # To be filled from your Arabic text source
                        'translation': self.korpus[hit['corpus_id']],
                        'search_score': float(hit['score']) if 'score' in hit else 0.0,
                        'rank_score': float(hit['cross-score']),
                        'final_score': (float(hit['score']) + float(hit['cross-score'])) / 2 if 'score' in hit else float(hit['cross-score'])
                    })
                    seen_docs.add(doc_id)

            return results[:5]  # Return top 5 results

        except Exception as e:
            print(f"Error in ranking: {str(e)}")
            return []

def perbarui_rekaman_dengan_peringkat_parafrasa(rekaman):
    daftar_baris = []
    daftar_parafrasa = rekaman['query_versions']  # expects a list of paraphrased queries
    id_pertanyaan = rekaman['qid']

    try:
        daftar_id_dokumen, daftar_skor, daftar_nomor_dokumen = cari_dengan_pengkode_silang_parafrasa(daftar_parafrasa)

        for j in range(len(daftar_nomor_dokumen)):
            kamus_baris = {
                'qid': id_pertanyaan,
                'Q0': "Q0",
                'nomor_dokumen': daftar_nomor_dokumen[j],
                'peringkat': j + 1,
                'skor': float(daftar_skor[j]),
                'tag': "PencarianSemantikParafrasa",
            }
            daftar_baris.append(kamus_baris)
    except Exception as e:
        print(f"Error saat memproses parafrasa: {daftar_parafrasa}")
        print(f"Error: {str(e)}")
        return pd.DataFrame({
            'qid': [id_pertanyaan],
            'Q0': ['Q0'],
            'nomor_dokumen': ['-1'],
            'peringkat': [1],
            'skor': [-999.0],
            'tag': ['PencarianSemantikParafrasa']
        })

    if not daftar_baris:
        return pd.DataFrame({
            'qid': [id_pertanyaan],
            'Q0': ['Q0'],
            'nomor_dokumen': ['-1'],
            'peringkat': [1],
            'skor': [-999.0],
            'tag': ['PencarianSemantikParafrasa']
        })

    kerangka_data = pd.DataFrame(daftar_baris)
    kerangka_data_terurut = kerangka_data.sort_values(by='skor', ascending=False)
    kerangka_data_terurut.drop_duplicates(subset='nomor_dokumen', keep='first', inplace=True)
    kerangka_data_terurut.reset_index(drop=True, inplace=True)

    indeks_minus_satu = kerangka_data_terurut.index[kerangka_data_terurut['nomor_dokumen'] == '-1'].tolist()
    if indeks_minus_satu and indeks_minus_satu[0] != 0:
        kerangka_data_terurut = kerangka_data_terurut.drop(indeks_minus_satu)

    kerangka_data_terurut['peringkat'] = range(1, len(kerangka_data_terurut) + 1)
    kerangka_data_terurut = kerangka_data_terurut.iloc[:5, :]

    return kerangka_data_terurut