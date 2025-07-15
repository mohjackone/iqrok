import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Cache interface
interface FileDataCache {
  translations?: Map<string, string[]>;
  paraphrases?: Map<string, string[]>;
  verseToQid?: Map<string, string>;
  qidToQuestion?: Map<string, string>;
  normalizedTexts?: Map<string, {
    qid: string;
    originalText: string;
    normalizedText: string;
    isTranslation: boolean;
  }[]>;
}

// Constants
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache
const MIN_WORD_LENGTH = 2; // Minimum word length to consider
const MIN_MATCH_SCORE = 0.3; // Minimum similarity score to include

// Global cache
let fileDataCache: FileDataCache = {};
let lastCacheUpdate = 0;

// Helper function to normalize text for faster matching
function normalizeText(text: string): string {
  return text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Helper function to check and refresh cache
function checkAndRefreshCache() {
  const now = Date.now();
  if (now - lastCacheUpdate > CACHE_DURATION) {
    fileDataCache = {};
    lastCacheUpdate = now;
  }
}

// Helper function to safely load JSONL files
function loadJsonlFile(filePath: string): any[] {
  try {
    const fullPath = path.join(process.cwd(), 'src', 'quran_data', filePath);
    if (!fs.existsSync(fullPath)) {
      console.warn(`File not found: ${fullPath}`);
      return [];
    }
    const content = fs.readFileSync(fullPath, 'utf-8');
    return content.split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return null;
        }
      })
      .filter(item => item !== null);
  } catch (error) {
    return [];
  }
}

// Load and process all text data for fast searching
function loadAndProcessTexts() {
  checkAndRefreshCache();
  
  if (fileDataCache.normalizedTexts) {
    return fileDataCache.normalizedTexts;
  }

  const normalizedTexts = new Map<string, {
    qid: string;
    originalText: string;
    normalizedText: string;
    isTranslation: boolean;
  }[]>();

  // Process translations
    ['dev', 'test', 'train'].forEach(dataset => {
      const items = loadJsonlFile(`terjemahan_pertanyaan_claude_${dataset}_id.jsonl`);
      items.forEach(item => {
        if (item?.qid && item?.query_id) {
          const qid = item.qid.toString();
        const normalizedKey = normalizeText(item.query_id);
        
        if (!normalizedTexts.has(normalizedKey)) {
          normalizedTexts.set(normalizedKey, []);
            }
        
        normalizedTexts.get(normalizedKey)!.push({
          qid,
          originalText: item.query_id,
          normalizedText: normalizedKey,
          isTranslation: true
        });
        }
      });
    });

  // Process paraphrases
    ['dev', 'test', 'train'].forEach(dataset => {
      const items = loadJsonlFile(`parafrasa_pertanyaan_gpt_${dataset}_id.jsonl`);
      items.forEach(item => {
        if (item?.qid && Array.isArray(item?.query_versions)) {
          const qid = item.qid.toString();
          item.query_versions.forEach((version: string) => {
          const normalizedKey = normalizeText(version);
          
          if (!normalizedTexts.has(normalizedKey)) {
            normalizedTexts.set(normalizedKey, []);
            }
          
          normalizedTexts.get(normalizedKey)!.push({
            qid,
            originalText: version,
            normalizedText: normalizedKey,
            isTranslation: false
          });
          });
        }
      });
    });

  fileDataCache.normalizedTexts = normalizedTexts;
  return normalizedTexts;
}

// Fast word similarity calculation
function calculateWordSimilarity(queryNorm: string, textNorm: string): number {
  // Direct matches get highest score
  if (textNorm === queryNorm) return 1;
  if (textNorm.includes(queryNorm)) return 0.9;
  
  const queryWords = queryNorm.split(/\s+/);
  const textWords = textNorm.split(/\s+/);
  
  let matchCount = 0;
  let totalWords = queryWords.length;
  
  for (const qWord of queryWords) {
    if (qWord.length < MIN_WORD_LENGTH) {
      totalWords--;
      continue;
    }
    
    if (textWords.includes(qWord)) {
      matchCount++;
      continue;
    }
    
    // Check for substring matches
    for (const tWord of textWords) {
      if (tWord.includes(qWord) || qWord.includes(tWord)) {
        matchCount += 0.7;
        break;
          }
        }
      }
  
  return totalWords > 0 ? matchCount / totalWords : 0;
}

// Load Arabic questions
function loadQidToQuestion(): Map<string, string> {
  checkAndRefreshCache();
  
  if (fileDataCache.qidToQuestion) {
    return fileDataCache.qidToQuestion;
  }

  const mapping = new Map<string, string>();
  const tsvFiles = [
    'quran_model/quran-qa-2023/Task-A/data/QQA23_TaskA_ayatec_v1.2_dev.tsv',
    'quran_model/quran-qa-2023/Task-A/data/QQA23_TaskA_ayatec_v1.2_test.tsv',
    'quran_model/quran-qa-2023/Task-A/data/QQA23_TaskA_ayatec_v1.2_train.tsv',
  ];
  
  for (const file of tsvFiles) {
    const fullPath = path.join(process.cwd(), 'src', file);
    if (!fs.existsSync(fullPath)) continue;
    
    const lines = fs.readFileSync(fullPath, 'utf-8').split('\n');
    for (const line of lines) {
      const [qid, ...parts] = line.split('\t');
      if (qid && parts.length > 0) {
        mapping.set(qid, parts.join(' ').trim());
      }
    }
  }
  
  fileDataCache.qidToQuestion = mapping;
  return mapping;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body?.query?.trim()) {
      return NextResponse.json(
        { error: 'Invalid request. Please provide a valid query.' },
        { status: 400 }
      );
    }

    // Get normalized texts and Arabic questions
    const normalizedTexts = loadAndProcessTexts();
    const qidToQuestion = loadQidToQuestion();
    
    // Normalize query once
    const queryNorm = normalizeText(body.query);

    // Fast matching using Map lookup and pre-normalized texts
    const matches = new Map<string, {
      qid: string;
      text: string;
      score: number;
      arabic: string;
    }>();

    // First check for direct matches
    if (normalizedTexts.has(queryNorm)) {
      normalizedTexts.get(queryNorm)!.forEach(item => {
        const arabic = qidToQuestion.get(item.qid) || '';
        matches.set(item.qid, {
          qid: item.qid,
          text: item.originalText,
          score: 1,
          arabic
        });
      });
    }
    
    // Then check for partial matches if we don't have enough results
    if (matches.size < 7) {
      for (const [normalizedKey, items] of Array.from(normalizedTexts)) {
        if (matches.size >= 7) break;
        
        // Skip already matched items
        if (matches.has(items[0].qid)) continue;
        
        const score = calculateWordSimilarity(queryNorm, normalizedKey);
        if (score >= MIN_MATCH_SCORE) {
          const item = items[0]; // Use first match for this normalized text
          const arabic = qidToQuestion.get(item.qid) || '';
          
          // Only add if we have a better score for this qid
          const existing = matches.get(item.qid);
          if (!existing || score > existing.score) {
            matches.set(item.qid, {
              qid: item.qid,
              text: item.originalText,
              score,
              arabic
            });
          }
        }
      }
    }
    
    // Convert to array and sort
    const suggestions = Array.from(matches.values())
      .sort((a, b) => {
        const scoreDiff = b.score - a.score;
        if (Math.abs(scoreDiff) > 0.1) return scoreDiff;
        return a.text.length - b.text.length;
        })
      .slice(0, 7)
      .map(match => ({
        qid: match.qid,
        question: match.text,
        originalQuestion: match.arabic,
        wordSimilarity: match.score,
        arabic_question: match.arabic
      }));

    return NextResponse.json({ suggestions });

  } catch (error) {
    console.error('Error in suggestions endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 