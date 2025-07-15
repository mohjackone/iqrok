# Hasil dari semua Pertanyaan yang Diterjemahkan dan versi parafrasenya
import pandas as pd
from IPython.display import display, HTML

# Daftar file yang akan diproses
files_to_process = [
    #('hasil_pencarian_parafrasa_jawaban_encoder_1_gpt_train_id.jsonl', 'model_pencarian_parafrasa_jawaban_encoder_1_gpt_train_id.tsv'),
    #('hasil_pencarian_parafrasa_jawaban_encoder_1_gpt_dev_id.jsonl', 'model_pencarian_parafrasa_jawaban_encoder_1_gpt_dev_id.tsv'),
    #('hasil_pencarian_parafrasa_jawaban_encoder_1_gpt_test_id.jsonl', 'model_pencarian_parafrasa_jawaban_encoder_1_gpt_test_id.tsv')
    #('hasil_pencarian_parafrasa_jawaban_encoder_2_gpt_train_id.jsonl', 'model_pencarian_parafrasa_jawaban_encoder_2_gpt_train_id.tsv'),
    #('hasil_pencarian_parafrasa_jawaban_encoder_2_gpt_dev_id.jsonl', 'model_pencarian_parafrasa_jawaban_encoder_2_gpt_dev_id.tsv'),
    #('hasil_pencarian_parafrasa_jawaban_encoder_2_gpt_test_id.jsonl', 'model_pencarian_parafrasa_jawaban_encoder_2_gpt_test_id.tsv'),
    #('hasil_pencarian_parafrasa_jawaban_encoder_3_gpt_train_id.jsonl', 'model_pencarian_parafrasa_jawaban_encoder_3_gpt_train_id.tsv'),
    #('hasil_pencarian_parafrasa_jawaban_encoder_3_gpt_dev_id.jsonl', 'model_pencarian_parafrasa_jawaban_encoder_3_gpt_dev_id.tsv'),
    #('hasil_pencarian_parafrasa_jawaban_encoder_3_gpt_test_id.jsonl', 'model_pencarian_parafrasa_jawaban_encoder_3_gpt_test_id.tsv')
    #('hasil_pencarian_parafrasa_jawaban_encoder_4_gpt_train_id.jsonl', 'model_pencarian_parafrasa_jawaban_encoder_4_gpt_train_id.tsv'),
    #('hasil_pencarian_parafrasa_jawaban_encoder_4_gpt_dev_id.jsonl', 'model_pencarian_parafrasa_jawaban_encoder_4_gpt_dev_id.tsv'),
    #('hasil_pencarian_parafrasa_jawaban_encoder_4_gpt_test_id.jsonl', 'model_pencarian_parafrasa_jawaban_encoder_4_gpt_test_id.tsv'),
    #('hasil_pencarian_parafrasa_jawaban_encoder_5_gpt_dev_id.jsonl', 'model_pencarian_parafrasa_jawaban_encoder_5_gpt_dev_id.tsv'),
    #('hasil_pencarian_parafrasa_jawaban_encoder_5_gpt_test_id.jsonl', 'model_pencarian_parafrasa_jawaban_encoder_5_gpt_test_id.tsv'),
    #('hasil_pencarian_parafrasa_jawaban_encoder_5_gpt_train_id.jsonl', 'model_pencarian_parafrasa_jawaban_encoder_5_gpt_train_id.tsv'),

]

# Memproses setiap file dalam daftar files_to_process
for input_file, output_file in files_to_process:
    print(f"\nMemproses file: {input_file}")
    print("="*50)
    
    # Memuat file pertanyaan yang telah diparafrase
    try:
        file_pertanyaan_parafrasa = muat_jsonl(input_file)
        print(f"Berhasil memuat {len(file_pertanyaan_parafrasa)} pertanyaan dari file")
    except Exception as e:
        # Menangani error jika gagal memuat file
        print(f"Error saat memuat file {input_file}: {str(e)}")
        continue

    # Inisialisasi daftar untuk menyimpan semua hasil
    daftar_hasil = []

    # Proses setiap rekaman dalam file pertanyaan yang telah diparafrase
    for indeks, rekaman in enumerate(file_pertanyaan_parafrasa[650:], start=650):
        # Memperbarui rekaman dengan peringkat hasil pencarian
        hasil_pembaruan = perbarui_rekaman_dengan_peringkat_parafrasa_openai(rekaman)
        if not hasil_pembaruan.empty:
            daftar_hasil.append(hasil_pembaruan)

        # Tampilkan kemajuan setiap 5 rekaman atau jika sudah selesai
        if (indeks + 1) % 5 == 0 or (indeks + 1) == len(file_pertanyaan_parafrasa):
            print(f"Telah memproses {indeks + 1}/{len(file_pertanyaan_parafrasa)} pertanyaan ({((indeks + 1)/len(file_pertanyaan_parafrasa)*100):.1f}%)")

    # Gabungkan semua hasil jika ada
    if daftar_hasil:
        # Gabungkan semua hasil
        kerangka_data_gabungan = pd.concat(daftar_hasil, ignore_index=True)

        # Atur urutan kolom yang diinginkan
        urutan_kolom = ['qid', 'Q0', 'nomor_dokumen', 'peringkat', 'skor', 'tag']
        kerangka_data_gabungan = kerangka_data_gabungan[urutan_kolom]

        # Simpan hasil ke file TSV tanpa header dan index
        kerangka_data_gabungan.to_csv(output_file, sep="\t", index=False, header=False)
        print(f"\nData telah disimpan ke {output_file} dengan {len(kerangka_data_gabungan)} baris")

        # Tampilkan hasil dalam format HTML
        display(HTML(kerangka_data_gabungan.to_html()))
    else:
        print(f"\nTidak ada hasil yang dapat diproses untuk file {input_file}")

print("\nSemua file telah selesai diproses!")
print("="*50)
print("Ringkasan:")
# Menampilkan ringkasan file input dan output
for input_file, output_file in files_to_process:
    print(f"- {input_file} -> {output_file}") 