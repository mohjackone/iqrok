# Daftar file yang akan diproses untuk parafrasa
files_to_process_paraphrase = [    
    #('parafrasa_pertanyaan_gpt_dev_id.jsonl', 'hasil_pencarian_parafrasa_jawaban_encoder_5_gpt_dev_id.jsonl'),
    #('parafrasa_pertanyaan_gpt_test_id.jsonl', 'hasil_pencarian_parafrasa_jawaban_encoder_5_gpt_test_id.jsonl'),
    ('parafrasa_pertanyaan_gpt_train_id.jsonl', 'hasil_pencarian_parafrasa_jawaban_encoder_5_gpt_train_id.jsonl')
    
]

print("Memulai pemrosesan file parafrasa...")
print("="*50)

# Memproses setiap file parafrasa dalam daftar files_to_process_paraphrase
for input_file, output_file in files_to_process_paraphrase:
    print(f"\nMemproses file parafrasa: {input_file}")
    print("="*50)
    
    # Memuat file pertanyaan parafrasa
    file_pertanyaan_parafrasa = muat_jsonl(input_file)
    # file_pertanyaan_parafrasa = file_pertanyaan_parafrasa[:1]
    total_pertanyaan = len(file_pertanyaan_parafrasa)
    print(f"Berhasil memuat {total_pertanyaan} data dari {input_file}")

    # Menjalankan pencarian untuk semua Pertanyaan yang telah diparafrasa
    for indeks, rekaman in enumerate(file_pertanyaan_parafrasa):
        # Menggunakan query_versions yang berisi daftar parafrasa
        daftar_parafrasa = rekaman['query_versions']
        daftar_nomor_dokumen = []
        daftar_skor = []
        daftar_id_dokumen = []
        
        # Memproses setiap versi parafrasa
        for parafrasa in daftar_parafrasa:
            id_dokumen, skor, nomor_dokumen = cari_dengan_pengkode_silang_parafrasa_openai([normalisasi_teks(parafrasa)])
            daftar_nomor_dokumen.append(nomor_dokumen)
            daftar_skor.append([float(nilai) for nilai in skor])
            daftar_id_dokumen.append(id_dokumen)

        rekaman['nomor_dokumen'] = daftar_nomor_dokumen
        rekaman['skor'] = daftar_skor
        rekaman['id_dokumen'] = daftar_id_dokumen

        daftar_peringkat = []
        for nomor_dokumen in daftar_nomor_dokumen:
            daftar_peringkat.append([x for x in range(1, len(nomor_dokumen) + 1)])
        rekaman['peringkat'] = daftar_peringkat

        # Simpan setiap 10 data atau jika sudah selesai
        if (indeks + 1) % 10 == 0 or (indeks + 1) == total_pertanyaan:
            print(f"Telah memproses {indeks + 1}/{total_pertanyaan} pertanyaan ({((indeks + 1)/total_pertanyaan*100):.1f}%)")
            simpan_jsonl(file_pertanyaan_parafrasa, output_file)

        # Mencetak kemajuan setiap 10 rekaman atau jika sudah selesai
        if (indeks + 1) % 10 == 0 or (indeks + 1) == total_pertanyaan:
            print(f"Telah memproses {indeks + 1}/{total_pertanyaan} pertanyaan ({((indeks + 1)/total_pertanyaan*100):.1f}%)")

    print(f"\nPencarian selesai untuk {input_file}")
    print(f"Total pertanyaan diproses: {total_pertanyaan}")

    # Menyimpan hasil ke file output
    simpan_jsonl(file_pertanyaan_parafrasa, output_file)
    print(f"Hasil disimpan di: {output_file}")

print("\nSemua file parafrasa telah selesai diproses!")
print("="*50)
print("Ringkasan pemrosesan parafrasa:")
# Menampilkan ringkasan file input dan output
for input_file, output_file in files_to_process_paraphrase:
    print(f"- {input_file} -> {output_file}")