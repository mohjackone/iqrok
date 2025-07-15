import unicodedata
from bs4 import BeautifulSoup
import re
import warnings

# Pola regex
pola_tautan = re.compile(r'\/\/[\d\w-]+(\.[\d\w-]+)*(?:(?:\/[^\s/]*))*')  # Web links
pola_huruf = re.compile(r"[^a-zA-Z\u0600-\u06FF\s]")  # Letters (Latin and Arabic) and spaces
pola_spasi = re.compile(r'\s+')

def normalisasi_teks(teks, bahasa='indonesia', hanya_huruf=True, hapus_kata_satu_karakter=True, hapus_diacritics=False):
    # Cek input harus string
    if not isinstance(teks, str):
        warnings.warn("Input bukan string, mengembalikan string kosong...")
        return ""
    
    # Normalisasi Unicode
    teks = unicodedata.normalize('NFC', teks)
    
    # Hapus tag HTML
    teks = BeautifulSoup(teks, 'html.parser').get_text()
    
    # Hapus tautan web
    teks = pola_tautan.sub('', teks)
    
    # Ubah ke huruf kecil
    bahasa = bahasa.lower()

    if bahasa == 'arab':
        if hapus_diacritics:
            # Hapus harakat/diakritik Arab
            teks = re.sub(r'[\u064B-\u0652]', '', teks)
        # Standarisasi karakter Arab
        teks = re.sub("[إأٱآا]", "ا", teks)
        teks = re.sub("ى", "ي", teks)
        teks = re.sub("ؤ", "ء", teks)
        teks = re.sub("ئ", "ء", teks)
        teks = re.sub("ة", "ه", teks)
        if hanya_huruf:
            # Hapus karakter selain huruf Arab dan spasi
            teks = re.sub(r'[^ء-ي\s]', '', teks)
            
    elif bahasa == 'english' or bahasa == 'indonesia':
        # Ubah ke huruf kecil
        teks = teks.lower()
        if hanya_huruf:
            # Hapus karakter selain huruf Latin/Arab dan spasi
            teks = pola_huruf.sub('', teks)
    
    # Normalisasi spasi
    teks = pola_spasi.sub(' ', teks).strip()
    
    # Hapus kata satu karakter
    if hapus_kata_satu_karakter:
        teks = ' '.join([kata for kata in teks.split() if len(kata) > 1])
    
    # Kembalikan hasil
    return teks