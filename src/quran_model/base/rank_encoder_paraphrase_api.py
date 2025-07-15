def perbarui_rekaman_dengan_peringkat_parafrasa_openai(rekaman):
    daftar_baris = []
    daftar_parafrasa = rekaman['query_versions']  # expects a list of paraphrased queries
    id_pertanyaan = rekaman['qid']

    try:
        daftar_id_dokumen, daftar_skor, daftar_nomor_dokumen = cari_dengan_pengkode_silang_parafrasa_openai(daftar_parafrasa)

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