import ast

def ambil_bagian_ayat(rekaman):
    kamus_rekaman = ast.literal_eval(rekaman)
    surat = int(kamus_rekaman['sura'])
    ayat = int(kamus_rekaman['aya'])

    # Ekstrak nomor_surat, ayat_awal, ayat_akhir dari kolom 'nomor_dokumen'
    # Buat kolom bantu jika belum ada
    if not {'nomor_surat', 'ayat_awal', 'ayat_akhir'}.issubset(tematik_QPC.columns):
        tematik_QPC['nomor_surat'] = tematik_QPC['nomor_dokumen'].apply(lambda x: int(x.split(':')[0]))
        tematik_QPC['ayat_awal'] = tematik_QPC['nomor_dokumen'].apply(lambda x: int(x.split(':')[1].split('-')[0]))
        tematik_QPC['ayat_akhir'] = tematik_QPC['nomor_dokumen'].apply(lambda x: int(x.split(':')[1].split('-')[1]))

    # Boolean indexing
    hasil = tematik_QPC[
        (tematik_QPC['nomor_surat'] == surat) &
        (tematik_QPC['ayat_awal'] <= ayat) &
        (tematik_QPC['ayat_akhir'] >= ayat)
    ]

    if not hasil.empty:
        return hasil.iloc[0]['id_dokumen'], hasil.iloc[0]['nomor_dokumen']
    else:
        return None, None

# Example usage
result = ambil_bagian_ayat(str(daftar_terjemahan_quran[0]))
print(result)