'use server';

import { Verse } from '@/types';
import path from 'path';
import fs from 'fs/promises';

let quranData: any[] | null = null;

async function loadQuranData() {
  if (quranData) return quranData;
  
  try {
    const filePath = path.join(process.cwd(), 'public', 'quran_terjemahan_indonesia.jsonl');
    const text = await fs.readFile(filePath, 'utf-8');
    
    quranData = text
      .trim()
      .split('\n')
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          console.error('Error parsing line:', line, e);
          return null;
        }
      })
      .filter(data => data !== null);
      
    return quranData;
  } catch (error) {
    console.error('Error loading Quran data:', error);
    return [];
  }
}

// Helper function to normalize verse ID format
function normalizeVerseId(sura: string | number, aya: string | number): string {
  return `${String(sura)}:${String(aya)}`;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';

export async function fetchVerseDetails(surah: string, verses: string): Promise<Verse[]> {
  try {
    console.log('Fetching verse details for:', { surah, verses });
    
    // Format the verse ID properly
    const verseId = normalizeVerseId(surah, verses);
    
    // First fetch verse details from the API
    const response = await fetch(`${BACKEND_URL}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query: verseId, // Just send the verse ID directly
        search_type: 'verse', // Specify that this is a verse lookup
        top_k: 1,
        encoder: 'firqaaa/indo-sentence-bert-base' // Use Indo-SBERT by default
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch verse details');
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      console.log('No results found for verse:', verseId);
      return [];
    }

    const verseData = data.results[0];

    const verse: Verse = {
      id_dokumen: verseId,
      nomor_dokumen: verseId,
      text: verseData.text || verseData.translation,
      verse_ref: verseId,
      translation: verseData.translation || '',
      'bi-encoder': verseData.bi_encoder || 'firqaaa/indo-sentence-bert-base',
      'cross-encoder': verseData.cross_encoder || 'Rifky/Indobert-QA',
      'map@10': verseData.search_score || 1,
      mrr: verseData.rank_score || 1,
      key_takeaway: '',
      skor_tekstual: verseData.search_score || 1,
      skor_kontekstual: verseData.rank_score || 1,
      skor_final: verseData.final_score || 1,
      arabic_text: verseData.arabic_text,
      metadata: {
        verse_ref: verseId,
        surah_name: verseData.metadata?.surah_name
      }
    };

    return [verse];

  } catch (error) {
    console.error('Error fetching verse details:', error);
    return [];
  }
} 