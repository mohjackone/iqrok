import json
import numpy as np
import pandas as pd

# Memuat daftar objek dari file JSON lines.
def muat_jsonl(lokasi_file) -> list:
    data = []
    with open(lokasi_file, 'r', encoding='utf-8') as f:
        for baris in f:
            data.append(json.loads(baris.rstrip('\n|\r')))
    print('Berhasil memuat {} data dari {}'.format(len(data), lokasi_file))
    return data

# Mengonversi numpy ke native Python
def convert_numpy(obj):
    if isinstance(obj, dict):
        return {k: convert_numpy(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy(i) for i in obj]
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    else:
        return obj

# Menyimpan data ke dalam file JSONL
def simpan_jsonl(data, nama_file):
    with open(nama_file, 'w', encoding='utf-8') as f:
        for item in data:
            item = convert_numpy(item)  # Convert all numpy types to native Python types
            json.dump(item, f, ensure_ascii=False)
            f.write('\n')
    print(f"Berhasil menulis {len(data)} data ke {nama_file}")

# Memuat indeks dari file yang ditentukan.
def muat_indeks(lokasi_indeks):
    try:
        with open(lokasi_indeks, 'r', encoding='utf-8') as f:
            indeks = json.load(f)
        print("Indeks berhasil dimuat dari lokasi: ", lokasi_indeks)
        return indeks
    except Exception as e:
        print('Tidak dapat memuat indeks, periksa detail kesalahan {}'.format(e))
        return []

# Membaca file berdasarkan ekstensinya (tsv atau xlsx)
def baca_file(file_input, pemisah="\t", nama_kolom=""):
    if file_input.endswith(".xlsx"):
        df = pd.read_excel(file_input)
    else:
        if nama_kolom != "":
            df = pd.read_csv(file_input, sep=pemisah, names=nama_kolom, encoding="utf-8")
        else:
            df = pd.read_csv(file_input, sep=pemisah, encoding="utf-8")
    return df