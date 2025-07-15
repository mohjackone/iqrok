def cari_dengan_pengkode_silang_parafrasa_openai(daftar_parafrasa: List[str]) -> Tuple[List[str], List[float], List[str]]:

    hasil_semua = []

    for parafrasa in daftar_parafrasa:
        id_dokumen, skor, nomor_dokumen = cari_dengan_pengkode_silang_terjemahan_openai(parafrasa)
        for i in range(len(id_dokumen)):
            hasil_semua.append({
                'id_dokumen': id_dokumen[i],
                'skor': float(skor[i]),
                'nomor_dokumen': nomor_dokumen[i]
            })

    # Combine results, keep highest scores
    hasil_terbaik = {}
    for item in hasil_semua:
        id_doc = item['id_dokumen']
        if id_doc == "":
            continue
        if id_doc not in hasil_terbaik or item['skor'] > hasil_terbaik[id_doc]['skor']:
            hasil_terbaik[id_doc] = item

    # Sort by score
    hasil_terurut = sorted(hasil_terbaik.values(), key=lambda x: x['skor'], reverse=True)
    hasil_terurut = hasil_terurut[:10]

    id_dokumen = [item['id_dokumen'] for item in hasil_terurut]
    skor = [item['skor'] for item in hasil_terurut]
    nomor_dokumen = [item['nomor_dokumen'] for item in hasil_terurut]

    return id_dokumen, skor, nomor_dokumen