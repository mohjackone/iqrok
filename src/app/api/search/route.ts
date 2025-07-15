import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Define types locally to avoid conflicts
interface VerseReference {
  sura: string;
  surah_name: string;
  aya: string;
  arabic_text: string;
  translation: string;
  relevance: number;
}

interface RelatedQuestion {
  qid: string;
  question: string;
  similarity: number;
  translations: string[];
  paraphrases: string[];
  arabic_question: string | null;
  verse_refs?: VerseReference[];
}

interface RelevancyMetrics {
  high: number;
  medium: number;
  low: number;
}

interface SearchRequest {
  prompt: string;
  encoder: string;
}

export interface SearchResponse {
  results: Array<{
    id_dokumen: string;
    nomor_dokumen: string;
    text: string;
    verse_ref: string;
    arabic_text: string;
    translation: string;
    "bi-encoder": string;
    "cross-encoder": string;
    "map@10": number;
    mrr: number;
    skor_final: number;
  }>;
  query_words: string[];
  query_arabic: string;
  query_parameter: {
    ringkasan: string;
    meter_relevancy: RelevancyMetrics;
    related_questions?: Array<RelatedQuestion>;
  };
  question_type: string;
  has_gold_standard: boolean;
  gold_standard_refs: string[] | null;
  encoder: string;
}

// Constants
const BACKEND_URL = 'http://localhost:8001'; // Updated to use our new Quran model port
const REQUEST_TIMEOUT = 30000; // 30 seconds

// Encoder model mappings
const ENCODER_MODELS: Record<string, { name: string; cross_encoder_name: string }> = {
  'firqaaa/indo-sentence-bert-base': {
    name: 'firqaaa/indo-sentence-bert-base',
    cross_encoder_name: 'Rifky/Indobert-QA'
  },
  'indobenchmark/indobert-base-p1': {
    name: 'indobenchmark/indobert-base-p1',
    cross_encoder_name: 'indobenchmark/indobert-base-p2'
  },
  'msmarco-distilbert-base-tas-b': {
    name: 'msmarco-distilbert-base-tas-b',
    cross_encoder_name: 'cross-encoder/ms-marco-MiniLM-L-6-v2'
  },
  'aubmindlab/bert-base-arabert': {
    name: 'aubmindlab/bert-base-arabert',
    cross_encoder_name: 'aubmindlab/araelectra-base-discriminator'
  }
};

// Add interface definitions at the top of the file
interface TranslationItem {
  qid: number | string;
  query: string;
  query_id: string;
}

interface ParaphraseItem {
  qid: number | string;
  query: string;
  query_versions: string[];
}

interface QuestionData {
  translations: string[];
  paraphrases: string[];
}

// Add interface for gold standard data
interface GoldStandardEntry {
  qid: string;
  verse_ref: string;
}

// Add interface for Quran verse data
interface QuranVerse {
  id: string;
  sura: string;
  aya: string;
  arabic_text: string;
  translation: string;
  footnotes: string;
}

// Add cache for gold standard data
let goldStandardCache: Map<string, string[]> | null = null;

// Add cache for Quran translations
let quranTranslationsCache: Map<string, QuranVerse> | null = null;

// Add Surah names constant
const SURAH_NAMES: Record<string, string> = {
  "1": "Al-Fatihah",
  "2": "Al-Baqarah",
  "3": "Ali 'Imran",
  "4": "An-Nisa'",
  "5": "Al-Ma'idah",
  "6": "Al-An'am",
  "7": "Al-A'raf",
  "8": "Al-Anfal",
  "9": "At-Taubah",
  "10": "Yunus",
  "11": "Hud",
  "12": "Yusuf",
  "13": "Ar-Ra'd",
  "14": "Ibrahim",
  "15": "Al-Hijr",
  "16": "An-Nahl",
  "17": "Al-Isra'",
  "18": "Al-Kahf",
  "19": "Maryam",
  "20": "Ta Ha",
  "21": "Al-Anbiya'",
  "22": "Al-Hajj",
  "23": "Al-Mu'minun",
  "24": "An-Nur",
  "25": "Al-Furqan",
  "26": "Asy-Syu'ara'",
  "27": "An-Naml",
  "28": "Al-Qasas",
  "29": "Al-'Ankabut",
  "30": "Ar-Rum",
  "31": "Luqman",
  "32": "As-Sajdah",
  "33": "Al-Ahzab",
  "34": "Saba'",
  "35": "Fatir",
  "36": "Ya Sin",
  "37": "As-Saffat",
  "38": "Sad",
  "39": "Az-Zumar",
  "40": "Gafir",
  "41": "Fussilat",
  "42": "Asy-Syura",
  "43": "Az-Zukhruf",
  "44": "Ad-Dukhan",
  "45": "Al-Jasiyah",
  "46": "Al-Ahqaf",
  "47": "Muhammad",
  "48": "Al-Fath",
  "49": "Al-Hujurat",
  "50": "Qaf",
  "51": "Az-Zariyat",
  "52": "At-Tur",
  "53": "An-Najm",
  "54": "Al-Qamar",
  "55": "Ar-Rahman",
  "56": "Al-Waqi'ah",
  "57": "Al-Hadid",
  "58": "Al-Mujadalah",
  "59": "Al-Hasyr",
  "60": "Al-Mumtahanah",
  "61": "As-Saff",
  "62": "Al-Jumu'ah",
  "63": "Al-Munafiqun",
  "64": "At-Tagabun",
  "65": "At-Talaq",
  "66": "At-Tahrim",
  "67": "Al-Mulk",
  "68": "Al-Qalam",
  "69": "Al-Haqqah",
  "70": "Al-Ma'arij",
  "71": "Nuh",
  "72": "Al-Jinn",
  "73": "Al-Muzzammil",
  "74": "Al-Muddassir",
  "75": "Al-Qiyamah",
  "76": "Al-Insan",
  "77": "Al-Mursalat",
  "78": "An-Naba'",
  "79": "An-Nazi'at",
  "80": "'Abasa",
  "81": "At-Takwir",
  "82": "Al-Infitar",
  "83": "Al-Mutaffifin",
  "84": "Al-Insyiqaq",
  "85": "Al-Buruj",
  "86": "At-Tariq",
  "87": "Al-A'la",
  "88": "Al-Gasyiyah",
  "89": "Al-Fajr",
  "90": "Al-Balad",
  "91": "Asy-Syams",
  "92": "Al-Lail",
  "93": "Ad-Duha",
  "94": "Asy-Syarh",
  "95": "At-Tin",
  "96": "Al-'Alaq",
  "97": "Al-Qadr",
  "98": "Al-Bayyinah",
  "99": "Az-Zalzalah",
  "100": "Al-'Adiyat",
  "101": "Al-Qari'ah",
  "102": "At-Takasur",
  "103": "Al-'Asr",
  "104": "Al-Humazah",
  "105": "Al-Fil",
  "106": "Quraisy",
  "107": "Al-Ma'un",
  "108": "Al-Kausar",
  "109": "Al-Kafirun",
  "110": "An-Nasr",
  "111": "Al-Masad",
  "112": "Al-Ikhlas",
  "113": "Al-Falaq",
  "114": "An-Nas"
};

// Add function to load gold standard data
function loadGoldStandardData(): Map<string, string[]> {
  const goldStandardMap = new Map<string, string[]>();
  
  try {
    const files = [
      'QQA23_TaskA_ayatec_v1.2_qrels_dev.gold',
      'QQA23_TaskA_ayatec_v1.2_qrels_test.gold',
      'QQA23_TaskA_ayatec_v1.2_qrels_train.gold'
    ];

    files.forEach(filename => {
      const fullPath = path.join(process.cwd(), 'src', 'quran_model', 'quran-qa-2023', 'Task-A', 'data', 'qrels', filename);
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      content.split('\n').forEach(line => {
        const parts = line.trim().split('\t');
        if (parts.length === 4 && parts[3] === '1' && parts[2] !== '-1') {
          const qid = parts[0];
          const verse_ref = parts[2];
          
          if (!goldStandardMap.has(qid)) {
            goldStandardMap.set(qid, []);
          }
          goldStandardMap.get(qid)!.push(verse_ref);
        }
      });
    });

    console.log('Gold standard data loaded with entries:', goldStandardMap.size);
    return goldStandardMap;
  } catch (error) {
    console.error('Error loading gold standard data:', error);
    return new Map();
  }
}

// Function to load Quran translations
function loadQuranTranslations(): Map<string, QuranVerse> {
  const translationsMap = new Map<string, QuranVerse>();
  
  try {
    const fullPath = path.join(process.cwd(), 'public', 'quran_terjemahan_indonesia.jsonl');
    const content = fs.readFileSync(fullPath, 'utf-8');
    
    content.split('\n').forEach(line => {
      if (!line.trim()) return;
      
      try {
        const verse = JSON.parse(line) as QuranVerse;
        const key = `${verse.sura}:${verse.aya}`;
        translationsMap.set(key, verse);
      } catch (error) {
        console.error('Error parsing verse:', error);
      }
    });

    console.log('Quran translations loaded with verses:', translationsMap.size);
    return translationsMap;
  } catch (error) {
    console.error('Error loading Quran translations:', error);
    return new Map();
  }
}

// Helper to format verse references
function formatVerseReference(verse_id: string): { surah: string; verses: string } {
  if (!verse_id) {
    return { surah: '', verses: '' };
  }
  
  const [surah, verses] = verse_id.split(':');
  return { surah, verses };
}

// Helper to normalize Arabic text
function normalizeArabicText(text: string): string {
  if (!text) return '';
  // Remove extra spaces and normalize Arabic characters
  return text.trim()
    .replace(/\s+/g, ' ')
    .replace(/[ىيﻱﻲﻳﻴ]/g, 'ي')
    .replace(/[ةﺓﺔﺕﺖ]/g, 'ة')
    .replace(/[ﻩﻪﻫﻬ]/g, 'ه')
    .replace(/[ﺍﺎ]/g, 'ا')
    .replace(/[ﻭﻮ]/g, 'و');
}

// Helper to validate search request
function validateSearchRequest(body: any): body is SearchRequest {
  return (
    body &&
    typeof body === 'object' &&
    typeof body.prompt === 'string' &&
    body.prompt.trim().length > 0
  );
}

// Update the loadJsonlFile function
function loadJsonlFile(filePath: string): Array<TranslationItem | ParaphraseItem> {
  try {
    const fullPath = path.join(process.cwd(), 'src', 'quran_data', filePath);
    const content = fs.readFileSync(fullPath, 'utf-8');
    return content.split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error);
    return [];
  }
}

// Update the loadTranslationsAndParaphrases function
function loadTranslationsAndParaphrases(): Map<string, QuestionData> {
  // Load all data files
  const translations = [
    ...loadJsonlFile('terjemahan_pertanyaan_claude_dev_id.jsonl'),
    ...loadJsonlFile('terjemahan_pertanyaan_claude_test_id.jsonl'),
    ...loadJsonlFile('terjemahan_pertanyaan_claude_train_id.jsonl')
  ] as TranslationItem[];

  const paraphrases = [
    ...loadJsonlFile('parafrasa_pertanyaan_gpt_dev_id.jsonl'),
    ...loadJsonlFile('parafrasa_pertanyaan_gpt_test_id.jsonl'),
    ...loadJsonlFile('parafrasa_pertanyaan_gpt_train_id.jsonl')
  ] as ParaphraseItem[];

  // Create a map to store question data
  const questionMap = new Map<string, QuestionData>();

  // Process translations
  translations.forEach((item: TranslationItem) => {
    if (!item || !item.qid) return;
    
    const qid = item.qid.toString();
    if (!questionMap.has(qid)) {
      questionMap.set(qid, {
        translations: [],
        paraphrases: []
      });
    }
    
    const data = questionMap.get(qid)!;
    if (item.query_id && !data.translations.includes(item.query_id)) {
      data.translations.push(item.query_id);
    }
  });

  // Process paraphrases
  paraphrases.forEach((item: ParaphraseItem) => {
    if (!item || !item.qid) return;
    
    const qid = item.qid.toString();
    if (!questionMap.has(qid)) {
      questionMap.set(qid, {
        translations: [],
        paraphrases: []
      });
    }
    
    const data = questionMap.get(qid)!;
    if (item.query_versions && Array.isArray(item.query_versions)) {
      item.query_versions.forEach((version: string) => {
        if (!data.paraphrases.includes(version)) {
          data.paraphrases.push(version);
        }
      });
    }
  });

  console.log('Question data cache initialized with:', Array.from(questionMap.entries()).slice(0, 5));
  return questionMap;
}

// Update the cache type
let questionDataCache: Map<string, QuestionData> | null = null;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.prompt || typeof body.prompt !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request. Please provide a valid prompt.' },
        { status: 400 }
      );
    }

    // Initialize caches if not exists
    if (!questionDataCache) {
      console.log('Initializing question data cache...');
      questionDataCache = loadTranslationsAndParaphrases();
      console.log('Cache initialized with keys:', Array.from(questionDataCache.keys()));
    }

    if (!goldStandardCache) {
      console.log('Initializing gold standard cache...');
      goldStandardCache = loadGoldStandardData();
      console.log('Gold standard cache initialized with keys:', Array.from(goldStandardCache.keys()));
    }

    if (!quranTranslationsCache) {
      console.log('Initializing Quran translations cache...');
      quranTranslationsCache = loadQuranTranslations();
      console.log('Translations cache initialized with verses:', quranTranslationsCache.size);
    }

    // Log encoder selection
    const selectedEncoder = body.encoder || 'firqaaa/indo-sentence-bert-base';
    console.log(`Search request - Query: "${body.prompt}", Using encoder: ${selectedEncoder}`);
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    try {
      // Check if the Quran model server is running
      const healthCheck = await fetch(`${BACKEND_URL}/`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      if (!healthCheck.ok) {
        return NextResponse.json(
          { error: 'Quran search server is not running. Please start the Python server first.' },
          { status: 503 }
        );
      }

      // Get available encoders from health check
      const healthData = await healthCheck.json();
      const availableEncoders = healthData.available_encoders || [];
      
      // Validate encoder selection
      if (!availableEncoders.includes(selectedEncoder)) {
        console.warn(`Warning: Selected encoder "${selectedEncoder}" not in available encoders:`, availableEncoders);
      }
      
      // Make the search request to our new Quran model endpoint
      const searchResponse = await fetch(`${BACKEND_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: body.prompt.trim(),
          search_type: 'translation',
          top_k: 5,
          encoder: selectedEncoder
        }),
        signal: controller.signal,
      });

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        throw new Error(`Search request failed: ${errorText}`);
      }

      const quranResponse = await searchResponse.json();
      
      // Log if encoder changed from request to response
      if (quranResponse.encoder !== selectedEncoder) {
        console.warn(`Warning: Encoder changed from "${selectedEncoder}" to "${quranResponse.encoder}"`);
      }
      
      // Transform the response
      const transformedResponse = {
        results: quranResponse.results.map((result: any) => {
          const docId = result.verse_id || result.id;
          let textContent = result.translation || result.text;
          let arabicText = '';
          let translation = '';
          let verseRef = docId;
          
          // Get encoder information
          const modelInfo = ENCODER_MODELS[quranResponse.encoder] || {
            name: quranResponse.encoder,
            cross_encoder_name: 'aubmindlab/araelectra-base-discriminator'
          };
          
          // Parse and modify the text content to match id_dokumen
          if (textContent && textContent.startsWith('{')) {
            try {
              const textObj = JSON.parse(textContent.replace(/'/g, '"'));
              textObj.id = docId;
              // Extract Arabic text and translation from the text object
              arabicText = textObj.arabic_text || '';
              // Remove number prefix and footnote numbers from translation
              translation = (textObj.translation || '')
                .replace(/^\d+\.\s*/, '')  // Remove number prefix (e.g., "1. " or "123. ")
                .replace(/^\d+\)\s*/, ''); // Remove footnote numbers (e.g., "1) " or "12) ")
              // Format verse_ref as sura:aya
              if (textObj.sura && textObj.aya) {
                verseRef = `${textObj.sura}:${textObj.aya}`;
              }
              textContent = JSON.stringify(textObj).replace(/"/g, "'");
            } catch (error) {
              console.error('Error parsing text content:', error);
            }
          }

          return {
            id_dokumen: docId,
            nomor_dokumen: docId,
            text: textContent,
            verse_ref: verseRef,
            arabic_text: arabicText,
            translation: translation,
            "bi-encoder": quranResponse.encoder,
            "cross-encoder": modelInfo.cross_encoder_name,
            "map@10": result.search_score || 0,
            mrr: result.rank_score || 0,
            skor_final: result.final_score || 0
          };
        }),
        query_words: body.prompt.split(' '),
        query_arabic: body.prompt,
        query_parameter: {
          ringkasan: "Tingkat relevansi pertanyaan dengan dataset gold standard",
          meter_relevancy: quranResponse.relevancy_metrics || {
            high: 0.3,
            medium: 0.5,
            low: 0.2
          },
          related_questions: (quranResponse.related_questions || []).map((q: any) => {
            const qid = q.qid.toString();
            console.log('Processing question:', qid);
            const questionData = questionDataCache?.get(qid);
            console.log('Found data for question:', qid, questionData);
            
            // Get verse references from gold standard data
            const goldVerseRefs = goldStandardCache?.get(qid) || [];
            console.log('Found gold standard verses for question:', qid, goldVerseRefs);

            // Map verse references to the required format
            const verse_refs = goldVerseRefs.map(ref => {
              const [surah, ayaRange] = ref.split(':');
              const [startAya] = ayaRange.split('-'); // For now, just use the start verse
              
              // Get verse data from translations cache
              const verseKey = `${surah}:${startAya}`;
              const verseData = quranTranslationsCache?.get(verseKey);

              return {
                sura: surah,
                surah_name: SURAH_NAMES[surah] || `Surah ${surah}`,
                aya: startAya,
                arabic_text: verseData?.arabic_text || '',
                translation: verseData?.translation || '',
                relevance: 1.0 // Gold standard references have maximum relevance
              };
            });

            return {
              qid: qid,
              question: q.question,
              similarity: q.similarity || 0,
              translations: questionData?.translations || [],
              paraphrases: questionData?.paraphrases || [],
              arabic_question: q.arabic_question || q.query || q.question,
              verse_refs: verse_refs
            };
          })
        },
        question_type: quranResponse.question_type || 'general',
        has_gold_standard: Boolean(quranResponse.related_questions?.length),
        gold_standard_refs: quranResponse.related_questions?.map((q: any) => q.qid.toString()) || null,
        encoder: quranResponse.encoder
      };
      
      console.log('Transformed response:', JSON.stringify(transformedResponse, null, 2));
      return NextResponse.json(transformedResponse);
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('Search error:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timed out. Please try again.' },
          { status: 504 }
        );
      }
      
      if (error.message.includes('fetch')) {
        return NextResponse.json(
          { error: 'Failed to connect to Quran search server.' },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 