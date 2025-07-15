from openai import OpenAI
import time
import os

# Initialize OpenAI client with OpenRouter
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),  # Get from environment variable
)

# Fungsi untuk memproses file pertanyaan dan menghasilkan parafrasa
def proses_file_pertanyaan(input_file, output_file):
    # Memuat data pertanyaan dari file JSONL
    file_pertanyaan_terjemahan = muat_jsonl(input_file)
    file_pertanyaan_parafrasa_terjemahan = []

    print(f"\nMemulai pemrosesan file: {input_file}")
    print(f"Total pertanyaan yang akan diproses: {len(file_pertanyaan_terjemahan)}")

    # Iterasi setiap baris pertanyaan
    for indeks, baris in enumerate(file_pertanyaan_terjemahan):
        id_pertanyaan = baris['qid']
        kueri_indo = baris['query_id']
        versi_kueri = []
        versi_kueri.append(kueri_indo)

        # Menghasilkan 3 versi parafrasa untuk setiap pertanyaan
        for i in range(3):
            try:
                # Meminta parafrasa ke model Gemini melalui OpenRouter
                completion = client.chat.completions.create(
                    model="google/gemini-2.0-flash-001",
                    messages=[
                        {
                            "role": "system",
                            "content": "Anda akan diberikan pertanyaan dalam bahasa Indonesia dan tugas Anda adalah memparafrasekannya tanpa ditambah kalimat pengantar."
                        },
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": kueri_indo
                                }
                            ]
                        }
                    ]
                )
                # Mengambil hasil parafrasa dari response
                pertanyaan_parafrasa = completion.choices[0].message.content.strip()
                versi_kueri.append(pertanyaan_parafrasa)
            except Exception as e:
                print(f"Error saat memproses kueri {id_pertanyaan} versi {i+1}: {str(e)}")
                versi_kueri.append(f"Error: Tidak dapat memparafrasakan kueri {id_pertanyaan} versi {i+1}")

            # Menunggu 1 detik sebelum permintaan berikutnya (untuk menghindari rate limit)
            time.sleep(1)

        # Menyusun data hasil parafrasa
        data = {
            'qid': id_pertanyaan,
            'query': baris['query'],
            'query_id': kueri_indo,
            'query_versions': versi_kueri
        }
        file_pertanyaan_parafrasa_terjemahan.append(data)

        # Menampilkan progres setiap 5 pertanyaan
        if (indeks + 1) % 5 == 0:
            print(f"Telah memproses {indeks + 1} dari {len(file_pertanyaan_terjemahan)} pertanyaan")

    # Menyimpan hasil parafrasa ke file output JSONL
    simpan_jsonl(file_pertanyaan_parafrasa_terjemahan, output_file)
    print(f"Selesai memproses {input_file}. Hasil disimpan di {output_file}\n")

# Daftar file yang akan diproses (train, dev, test)
files_to_process = [
    ("terjemahan_pertanyaan_gemini_train_id.jsonl", "parafrasa_pertanyaan_gemini_train_id.jsonl"),
    ("terjemahan_pertanyaan_gemini_dev_id.jsonl", "parafrasa_pertanyaan_gemini_dev_id.jsonl"),
    ("terjemahan_pertanyaan_gemini_test_id.jsonl", "parafrasa_pertanyaan_gemini_test_id.jsonl")
]

# Memproses setiap file dalam daftar
for input_file, output_file in files_to_process:
    proses_file_pertanyaan(input_file, output_file)