import requests
import json
import time
import os
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
                logger.info(f"Berhasil mengambil Surat {nomor_surat} untuk {translation_type}")
            else:
                logger.error(f"Gagal mengambil Surat {nomor_surat} untuk {translation_type}: HTTP {response.status_code}")
                # Retry once after a delay
                time.sleep(5)
                response = requests.get(url)
                if response.status_code == 200:
                    data_surat = response.json()
                    terjemahan.extend(data_surat['result'])
                    logger.info(f"Berhasil mengambil Surat {nomor_surat} untuk {translation_type} setelah retry")
        except Exception as e:
            logger.error(f"Error saat mengambil Surat {nomor_surat} untuk {translation_type}: {str(e)}")
            # Retry once after a delay
            time.sleep(5)
            try:
                response = requests.get(url)
                if response.status_code == 200:
                    data_surat = response.json()
                    terjemahan.extend(data_surat['result'])
                    logger.info(f"Berhasil mengambil Surat {nomor_surat} untuk {translation_type} setelah retry")
            except Exception as e:
                logger.error(f"Error saat retry Surat {nomor_surat} untuk {translation_type}: {str(e)}")
        # Delay untuk menghindari rate limit
        time.sleep(1)

    if not terjemahan:
        raise Exception(f"Tidak ada data terjemahan yang berhasil diambil untuk {translation_type}")

    # Get the directory of this script
    current_dir = Path(__file__).parent.absolute()
    output_path = current_dir / output_filename

    # Simpan hasil ke file JSONL
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            for t in terjemahan:
                json.dump(t, f, ensure_ascii=False)
                f.write('\n')
        logger.info(f"Total ayat untuk {translation_type}: {len(terjemahan)}")
        logger.info(f"Berhasil menyimpan file ke {output_path}")
    except Exception as e:
        logger.error(f"Error saat menyimpan file {output_path}: {str(e)}")
        raise

    return terjemahan

if __name__ == "__main__":
    try:
        # Ambil dan simpan terjemahan
        logger.info("Memulai pengambilan terjemahan...")
        terjemahan_sabiq = ambil_terjemahan_quran('indonesian_sabiq', 'quran_terjemahan_sabiq.jsonl')
        logger.info("Selesai mengambil terjemahan Sabiq")
    except Exception as e:
        logger.error(f"Error utama: {str(e)}")
        raise 
