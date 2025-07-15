from typing import Tuple, List

def cari_dengan_pengkode_silang_terjemahan_openai(kueri: str) -> Tuple[List[str], List[float], List[str]]:
    # Initialize result lists
    nomor_dokumen = []
    skor = []
    id_dokumen = []
    id_dokumen_unik = set()

    # Get query embedding
    query_embedding = get_ada_embeddings([kueri])[0]
    
    # Semantic search with bi-encoder - increase top_k to get more candidates
    hasil = semantic_search(query_embedding, embedding_korpus_5, top_k=30)

    # Cross-encode top results
    for hit in hasil:
        corpus_text = korpus[hit['corpus_id']]
        cross_score = get_gpt_similarity(kueri, corpus_text)
        hit['cross-score'] = cross_score

    # Sort by cross-encoder score
    hasil = sorted(hasil, key=lambda x: x['cross-score'], reverse=True)

    # Process top 10 results with threshold logic
    skor_tertinggi = None
    
    for i, hit in enumerate(hasil[0:10]):
        id_dokumen_temp, nomor_dokumen_temp = ambil_bagian_ayat(daftar_string_terjemahan_quran[hit['corpus_id']])
        nilai = float(hit['cross-score'])

        # Set highest score on first iteration
        if i == 0:
            skor_tertinggi = nilai

        # Check thresholds and add results
        if skor_tertinggi < -3:
            nomor_dokumen.append('-1')
            skor.append(round(nilai, 2))
            id_dokumen.append("")
            break
        elif skor_tertinggi >= 1 or nilai >= 1:
            if id_dokumen_temp not in id_dokumen_unik:
                nomor_dokumen.append(nomor_dokumen_temp)
                skor.append(round(nilai, 2))
                id_dokumen.append(id_dokumen_temp)
                id_dokumen_unik.add(id_dokumen_temp)
        elif nilai >= -2:  # Changed from -5 to -2
            if id_dokumen_temp not in id_dokumen_unik and len(nomor_dokumen) < 5:
                nomor_dokumen.append(nomor_dokumen_temp)
                skor.append(round(nilai, 2))
                id_dokumen.append(id_dokumen_temp)
                id_dokumen_unik.add(id_dokumen_temp)

    # If no results found, add a default "no match" result
    if not nomor_dokumen:
        nomor_dokumen.append('-1')
        skor.append(0.0)
        id_dokumen.append("")

    return id_dokumen, skor, nomor_dokumen 