from openai import OpenAI
import time
import os

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),  # Get from environment variable
)

def proses_file_pertanyaan(input_file, output_file):
    file_pertanyaan_terjemahan = muat_jsonl(input_file)
    file_pertanyaan_parafrasa_terjemahan = []

    print(f"\nMemulai pemrosesan file: {input_file}")
    print(f"Total pertanyaan yang akan diproses: {len(file_pertanyaan_terjemahan)}")

    for indeks, baris in enumerate(file_pertanyaan_terjemahan):
        id_pertanyaan = baris['qid']
        kueri_indo = baris['query_id']
        versi_kueri = []
        versi_kueri.append(kueri_indo)

        for i in range(3):  # Generate 3 paraphrase versions
            try:
                completion = client.chat.completions.create(
                    model="anthropic/claude-sonnet-4",
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
                pertanyaan_parafrasa = completion.choices[0].message.content.strip()
                versi_kueri.append(pertanyaan_parafrasa)
            except Exception as e:
                print(f"Error saat memproses kueri {id_pertanyaan} versi {i+1}: {str(e)}")
                versi_kueri.append(f"Error: Tidak dapat memparafrasakan kueri {id_pertanyaan} versi {i+1}")

            time.sleep(1)

        data = {
            'qid': id_pertanyaan,
            'query': baris['query'],
            'query_id': kueri_indo,
            'query_versions': versi_kueri
        }
        file_pertanyaan_parafrasa_terjemahan.append(data)

        if (indeks + 1) % 5 == 0:
            print(f"Telah memproses {indeks + 1} dari {len(file_pertanyaan_terjemahan)} pertanyaan")

    simpan_jsonl(file_pertanyaan_parafrasa_terjemahan, output_file)
    print(f"Selesai memproses {input_file}. Hasil disimpan di {output_file}\n")

# Daftar file yang akan diproses
files_to_process = [
    ("terjemahan_pertanyaan_claude_train_id.jsonl", "parafrasa_pertanyaan_claude_train_id.jsonl"),
    ("terjemahan_pertanyaan_claude_dev_id.jsonl", "parafrasa_pertanyaan_claude_dev_id.jsonl"),
    ("terjemahan_pertanyaan_claude_test_id.jsonl", "parafrasa_pertanyaan_claude_test_id.jsonl")
]

for input_file, output_file in files_to_process:
    proses_file_pertanyaan(input_file, output_file)