from openai import OpenAI
import pandas as pd
import time
import json
import os

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),  # Get from environment variable
)

def simpan_jsonl(data, nama_file):
    with open(nama_file, 'w', encoding='utf-8') as f:
        for item in data:
            json.dump(item, f, ensure_ascii=False)
            f.write('\n')
    print(f"Berhasil menulis {len(data)} data ke {nama_file}")

def proses_file_pertanyaan(nama_file, jenis_set):
    print(f"\nMemproses {jenis_set} set dari file: {nama_file}")
    file_pertanyaan = pd.read_csv(nama_file, sep="\t", encoding="utf-8", header=None)
    file_pertanyaan_terjemahan = []

    for indeks, baris in file_pertanyaan.iterrows():
        id_pertanyaan = baris[0]
        kueri = str(baris[1])

        try:
            prompt = (
                "Anda akan diberikan kalimat pertanyaan dalam bahasa Arab dan Anda bertugas menerjemahkan kalimat pertanyaan tersebut ke dalam bahasa Indonesia tanpa ditambahkan kata pengantar.\n\n"
                f"{normalisasi_teks(kueri, 'arab')}"
            )
            completion = client.chat.completions.create(
                model="openai/gpt-4o-mini",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            }
                        ]
                    }
                ]
            )
            terjemahan = completion.choices[0].message.content.strip()
            data = {
                'qid': id_pertanyaan,
                'query': kueri,
                'query_id': terjemahan
            }
            file_pertanyaan_terjemahan.append(data)
            print(f"ID: {id_pertanyaan} - Terjemahan: {terjemahan}")
            time.sleep(0.5)
        except Exception as e:
            print(f"Error pada ID {id_pertanyaan}: {str(e)}")
            continue

    output_file = f"terjemahan_pertanyaan_gpt_{jenis_set}_id.jsonl"
    simpan_jsonl(file_pertanyaan_terjemahan, output_file)
    return file_pertanyaan_terjemahan

files_to_process = [
    ("quran-qa-2023/Task-A/data/QQA23_TaskA_ayatec_v1.2_train.tsv", "train"),
    ("quran-qa-2023/Task-A/data/QQA23_TaskA_ayatec_v1.2_dev.tsv", "dev"),
    ("quran-qa-2023/Task-A/data/QQA23_TaskA_ayatec_v1.2_test.tsv", "test")
]

all_results = {}
for file_path, dataset_type in files_to_process:
    print(f"\nMemulai pemrosesan {dataset_type} set...")
    results = proses_file_pertanyaan(file_path, dataset_type)
    all_results[dataset_type] = results
    print(f"Selesai memproses {dataset_type} set")

print("\nPemrosesan semua file selesai!")