export type Surah = {
    title: string;
    url: string;
    content: string;
    tokens: number;
    chunks: Ayat[];
}

export type Ayat = {
    surah_title: string;
    surah_url: string;
    content: string;
    content_tokens: number;
    embedding: number[];

};

export type QURANJSON = {
    tokens: number;
    essayss: Surah[];
}

export interface SearchResult {
  id_dokumen: string;
  nomor_dokumen: string;
  skor: number;
}

export interface Verse {
  id_dokumen: string;
  nomor_dokumen: string;
  text: string;
  verse_ref: string;
  arabic_text: string;
  translation: string;
  'bi-encoder': string;
  'cross-encoder': string;
  'map@10': number;
  mrr: number;
  skor_final: number;
  key_takeaway?: string;
  skor_tekstual?: number;
  skor_kontekstual?: number;
  arabic_tafsir?: string;
  tafsir?: string;
  footnotes?: string;
  arabic_footnotes?: string;
  hukumType?: string;
  metadata?: {
    verse_ref: string;
    surah_name?: string;
  };
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
  consolidated_consensus: {
    ringkasan: string;
    meter_relevancy: {
      high: number;
      medium: number;
      low: number;
    };
    related_questions?: Array<{
      qid: string;
      question: string;
      similarity: number;
      translations?: string[];
      paraphrases?: string[];
      arabic_question?: string;
    }>;
  };
  question_type: string;
  has_gold_standard: boolean;
  gold_standard_refs: string[] | null;
  encoder: string;
}

export interface SearchRequest {
  prompt: string;
  encoder?: string;
}

export interface VerseDetail {
  surah: number;
  ayah: number;
  arabicText: string;
  translation: string;
  score: number;
}
