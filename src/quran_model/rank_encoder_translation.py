import pandas as pd
from sentence_transformers import util
from typing import List, Tuple
from quran_model.text_normalization import normalisasi_teks
from quran_model.utility import muat_jsonl

class RankEncoderTranslation:
    def __init__(self, bi_encoder, cross_encoder, embedding_korpus, daftar_string_terjemahan_quran):
        self.bi_encoder = bi_encoder
        self.cross_encoder = cross_encoder
        self.embedding_korpus = embedding_korpus
        self.daftar_string_terjemahan_quran = daftar_string_terjemahan_quran
        self.korpus = [str(item) for item in daftar_string_terjemahan_quran]

    def rank(self, query: str, candidates: List[dict]) -> List[dict]:
        """Rank the candidates using cross-encoder"""
        if not self.cross_encoder:
            raise Exception("Cross-encoder not initialized")
            
        if not candidates:
            raise Exception("No candidates provided for ranking")

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
                        'corpus_id': int(hit['corpus_id']),
                        'text': self.korpus[hit['corpus_id']],
                        'score': float(hit['score']) if 'score' in hit else 0.0,
                        'cross-score': float(hit['cross-score']),
                        'final_score': (float(hit['score']) + float(hit['cross-score'])) / 2 if 'score' in hit else float(hit['cross-score'])
                    })
                    seen_docs.add(doc_id)

            if not results:
                raise Exception("No valid results after ranking")

            return results[:5]  # Return top 5 results

        except Exception as e:
            raise Exception(f"Ranking failed: {str(e)}")

    def cari_dengan_pengkode_silang_terjemahan(self, query: str) -> List[dict]:
        """Search using cross-encoder on translation"""
        pairs = [[query, text] for text in self.daftar_string_terjemahan_quran]
        scores = self.cross_encoder.predict(pairs)
        
        results = []
        for idx, score in enumerate(scores):
            if score > 0:  # Only include positive scores
                results.append({
                    'corpus_id': idx,
                    'text': self.daftar_string_terjemahan_quran[idx],
                    'cross-score': float(score)
                })
        
        return sorted(results, key=lambda x: x['cross-score'], reverse=True)[:10]

def perbarui_rekaman_dengan_peringkat_terjemahan(rekaman):
    daftar_baris = []
    # Mengambil kueri dari rekaman, bisa dari 'query_id' atau 'query'
    kueri = rekaman.get('query_id', rekaman.get('query'))
    # Mengambil id pertanyaan dari rekaman
    id_pertanyaan = rekaman['qid']

    try:
        # Melakukan pencarian dokumen dengan pengkode silang terjemahan
        hasil_pencarian = cari_dengan_pengkode_silang_terjemahan(normalisasi_teks(kueri))
        daftar_id_dokumen, daftar_skor, daftar_nomor_dokumen = hasil_pencarian

        # Membuat baris hasil untuk setiap dokumen yang ditemukan
        for j in range(len(daftar_nomor_dokumen)):
            kamus_baris = {
                'qid': id_pertanyaan,
                'Q0': "Q0",
                'nomor_dokumen': daftar_nomor_dokumen[j],
                'peringkat': j + 1,
                'skor': float(daftar_skor[j]),
                'tag': "PencarianSemantik",
            }
            daftar_baris.append(kamus_baris)
    except Exception as e:
        # Menangani error jika terjadi saat pemrosesan kueri
        print(f"Error saat memproses kueri: {kueri}")
        print(f"Error: {str(e)}")
        # Mengembalikan DataFrame default jika terjadi error
        return pd.DataFrame({
            'qid': [id_pertanyaan],
            'Q0': ['Q0'],
            'nomor_dokumen': ['-1'],
            'peringkat': [1],
            'skor': [-999.0],
            'tag': ['PencarianSemantik']
        })

    # Jika tidak ada baris hasil, kembalikan DataFrame default
    if not daftar_baris:
        return pd.DataFrame({
            'qid': [id_pertanyaan],
            'Q0': ['Q0'],
            'nomor_dokumen': ['-1'],
            'peringkat': [1],
            'skor': [-999.0],
            'tag': ['PencarianSemantik']
        })

    # Membuat DataFrame dari daftar baris hasil
    kerangka_data = pd.DataFrame(daftar_baris)
    # Mengurutkan DataFrame berdasarkan skor secara menurun
    kerangka_data_terurut = kerangka_data.sort_values(by='skor', ascending=False)
    # Menghapus duplikasi berdasarkan nomor_dokumen, hanya menyimpan yang pertama
    kerangka_data_terurut.drop_duplicates(subset='nomor_dokumen', keep='first', inplace=True)
    # Mereset index DataFrame
    kerangka_data_terurut.reset_index(drop=True, inplace=True)

    # Menghapus baris dengan nomor_dokumen '-1' jika tidak berada di urutan pertama
    indeks_minus_satu = kerangka_data_terurut.index[kerangka_data_terurut['nomor_dokumen'] == '-1'].tolist()
    if indeks_minus_satu and indeks_minus_satu[0] != 0:
        kerangka_data_terurut = kerangka_data_terurut.drop(indeks_minus_satu)

    # Memperbarui kolom peringkat sesuai urutan baru
    kerangka_data_terurut['peringkat'] = range(1, len(kerangka_data_terurut) + 1)
    # Membatasi hasil hanya 5 teratas
    kerangka_data_terurut = kerangka_data_terurut.iloc[:5, :]

    return kerangka_data_terurut