import requests
import json
import time

# Fungsi utama untuk mengambil terjemahan Quran
def ambil_terjemahan_quran(translation_type, output_filename):
    terjemahan = []
    for nomor_surat in range(1, 115):
        # Membentuk URL API untuk setiap surat
        url = f"https://quranenc.com/api/v1/translation/sura/{translation_type}/{nomor_surat}"
        try:
            # Mengirim permintaan GET ke API
            response = requests.get(url)
            if response.status_code == 200:
                # Jika berhasil, parsing hasil dan tambahkan ke list
                data_surat = response.json()
                terjemahan.extend(data_surat['result'])
                print(f"Berhasil mengambil Surat {nomor_surat} untuk {translation_type}")
            else:
                print(f"Gagal mengambil Surat {nomor_surat} untuk {translation_type}")
        except Exception as e:
            print(f"Error saat mengambil Surat {nomor_surat} untuk {translation_type}: {str(e)}")
        # Delay untuk menghindari rate limit
        time.sleep(1)
    # Simpan hasil ke file JSONL
    with open(output_filename, 'w', encoding='utf-8') as f:
        for t in terjemahan:
            json.dump(t, f, ensure_ascii=False)
            f.write('\n')
    print(f"Total ayat untuk {translation_type}: {len(terjemahan)}")
    return terjemahan

# Ambil dan simpan tiga terjemahan berbeda
terjemahan_affairs = ambil_terjemahan_quran('indonesian_affairs', 'quran_terjemahan_affairs.jsonl')
terjemahan_complex = ambil_terjemahan_quran('indonesian_complex', 'quran_terjemahan_complex.jsonl')
terjemahan_sabiq = ambil_terjemahan_quran('indonesian_sabiq', 'quran_terjemahan_sabiq.jsonl') 
