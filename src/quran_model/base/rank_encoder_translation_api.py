def perbarui_rekaman_dengan_peringkat_terjemahan_openai(rekaman):
    daftar_baris = []
    # Mengambil kueri dari rekaman, bisa dari 'query_id' atau 'query'
    kueri = rekaman.get('query_id', rekaman.get('query'))
    # Mengambil id pertanyaan dari rekaman
    id_pertanyaan = rekaman['qid']

    try:
        # Melakukan pencarian dokumen dengan pengkode silang terjemahan
        hasil_pencarian = cari_dengan_pengkode_silang_terjemahan_openai(normalisasi_teks(kueri))
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