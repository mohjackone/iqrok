import pandas as pd

# Membaca data QPC Tematik dari file TSV
tematik_QPC = pd.read_csv("quran-qa-2023/Task-A/data/Thematic_QPC/QQA23_TaskA_QPC_v1.1.tsv", sep="\t", encoding="utf-8", header=None)

# Memberikan nama kolom
tematik_QPC.columns = ["nomor_dokumen", "ayat"]

# Menambahkan kolom baru 'id_dokumen' dengan nomor indeks
tematik_QPC['id_dokumen'] = tematik_QPC.index

# Mengkonversi tematik_QPC menjadi daftar string
daftar_terjemahan_tematik_QPC = tematik_QPC.astype(str).values.tolist()
daftar_terjemahan_tematik_QPC[0]