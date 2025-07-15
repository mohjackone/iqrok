'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import VerseSource from '@/components/molecules/VerseSource';
import SearchInput from '@/components/molecules/SearchInput';
import GraphOutput from '@/components/molecules/GraphOutput';
import { Cpu } from 'lucide-react';
import GraphHistory from '@/components/molecules/GraphHistory';

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

// Define similarity threshold constants
const SIMILARITY_THRESHOLDS = {
  HIGH: 0.5,    // 50% and above
  MEDIUM: 0.25, // 25% to 49%
};

// Function to get badge color based on similarity
const getSimilarityBadgeColor = (similarity: number) => {
  if (similarity >= SIMILARITY_THRESHOLDS.HIGH) {
    return 'bg-[#5DD6B9] text-[#015C46]'; // Green for high similarity
  } else if (similarity >= SIMILARITY_THRESHOLDS.MEDIUM) {
    return 'bg-[#FDC442] text-[#8B4C00]'; // Yellow for medium similarity
  }
  return 'bg-[#F17575] text-[#7A1B1B]'; // Red for low similarity
};

// Hukum color mapping for new bar
const hukumColors = {
  halal: { bg: 'bg-[#5DD6B9]', hex: '#5DD6B9' },
  syubhat: { bg: 'bg-[#FDC442]', hex: '#FDC442' },
  haram: { bg: 'bg-[#F17575]', hex: '#F17575' },
};

// Loading component
const Loading = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#3F86C7]"></div>
  </div>
);

// Animated Badge component
const AnimatedBadge = () => {
  return (
    <motion.div
      className="absolute -bottom-7 left-1/2 transform -translate-x-1/2"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative px-3 py-1 rounded-full text-[10px] font-medium text-white whitespace-nowrap overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-[#3F86C7] to-[#2FB5A8]"
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            backgroundSize: '200% 100%'
          }}
        />
        <span className="relative z-10">Indonesian Version</span>
      </div>
    </motion.div>
  );
};

interface SearchResponse {
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
    meter_relevancy: RelevancyMetrics;
    related_questions?: RelatedQuestion[];
  };
  question_type: string;
  has_gold_standard: boolean;
  gold_standard_refs: string[] | null;
  encoder: string;
}

// Update the RelevancySection interface
interface RelevancySectionProps {
  searchResponse: SearchResponse;
  expandedVerses: Record<string, boolean>;
  toggleVerseDetails: (qid: string) => void;
  onSearch: (query: string, encoder: string) => void;
}

const RelevancySection: React.FC<RelevancySectionProps> = ({ 
  searchResponse, 
  expandedVerses, 
  toggleVerseDetails,
  onSearch
}) => {
  const relevancy = searchResponse.query_parameter.meter_relevancy;
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleTextClick = (text: string) => {
    onSearch(text, searchResponse.encoder);
  };

  const toggleDetails = () => {
    setIsDetailsOpen(!isDetailsOpen);
  };
  
  return (
    <div className="flex mb-0">
      <div className="w-2 bg-gradient-to-b from-[#2FB5A8] to-[#3F86C7]" />
      <div className="flex-1 bg-gradient-to-r from-[#2FB5A8]/10 to-[#eafaf7] shadow-md mb-0 p-3">
        <div className="flex items-center mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Relevansi Pertanyaan</h3>
            <div className="flex items-center gap-2 ml-4">
              <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-medium">
                {searchResponse.query_parameter.related_questions?.length || 0} pertanyaan terkait
              </span>
              <span className="bg-gray-400 text-white px-2 py-0.5 rounded text-xs font-medium">
                {searchResponse.query_parameter.related_questions?.reduce((total, q) => total + (q.verse_refs?.length || 0), 0)} ayat terkait
              </span>
            </div>
          </div>
        </div>
        
        {/* Relevancy Bar - New Style */}
        <div className="w-full h-4 rounded-full overflow-hidden bg-gray-200 mb-2">
          <div className="h-full flex">
            <div 
              className="bg-[#5DD6B9] transition-all duration-500" 
              style={{ width: `${relevancy.high * 100}%` }}
            />
            <div 
              className="bg-[#FDC442] transition-all duration-500" 
              style={{ width: `${relevancy.medium * 100}%` }}
            />
            <div 
              className="bg-[#F17575] transition-all duration-500" 
              style={{ width: `${relevancy.low * 100}%` }}
            />
          </div>
        </div>
        
        {/* Relevancy Legend - New Style */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#5DD6B9]" />
            <span>Sangat Relevan {Math.round(relevancy.high * 100)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#FDC442]" />
            <span>Cukup Relevan {Math.round(relevancy.medium * 100)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#F17575]" />
            <span>Kurang Relevan {Math.round(relevancy.low * 100)}%</span>
          </div>
        </div>

        <div className="h-[1px] bg-gray-200 w-full my-4" />
        
        <div className="flex justify-end">
          <button
            onClick={toggleDetails}
            className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-1 bg-white px-3 py-1.5 rounded-full shadow-sm hover:shadow-md"
          >
            {isDetailsOpen ? (
              <>
                Tutup detail
                <motion.span
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                  className="text-xs"
                >
                  ▼
                </motion.span>
              </>
            ) : (
              <>
                Semua detail
                <motion.span
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                  className="text-xs"
                >
                  ▲
                </motion.span>
              </>
            )}
          </button>
        </div>

        {/* Related Questions and Verses */}
        {searchResponse.query_parameter.related_questions && searchResponse.query_parameter.related_questions.length > 0 && (
          <motion.div 
            className="mt-4"
            initial={false}
            animate={{ 
              height: isDetailsOpen ? "auto" : 0,
              opacity: isDetailsOpen ? 1 : 0
            }}
            transition={{ duration: 0.3 }}
            style={{ overflow: "hidden" }}
          >
            <div>
              <h4 className="font-semibold mb-2">Pertanyaan Terkait</h4>
              <ul className="space-y-4">
                {searchResponse.query_parameter.related_questions?.map((q, idx) => (
                  <li key={q.qid} className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="bg-gray-400 text-white px-2 py-0.5 rounded text-sm font-medium mr-2">{idx + 1}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-sm font-medium whitespace-nowrap ml-2 ${getSimilarityBadgeColor(q.similarity)}`}>
                        {Math.round(q.similarity * 100)}% mirip
                      </span>
                    </div>
                    <p className="text-right font-arabic leading-relaxed text-lg" dir="rtl" style={{ fontSize: '1.2em' }}>
                      {q.arabic_question}
                    </p>
                    
                    <div className="mt-3 space-y-4">
                      {/* Translations */}
                      {Array.isArray(q.translations) && q.translations.length > 0 && (
                        <div>
                          <h4 className="text-gray-700 font-semibold text-sm mb-2">Terjemahan</h4>
                          <ul className="space-y-1.5">
                            {q.translations.map((t, i) => (
                              <li 
                                key={i} 
                                className="text-sm text-gray-600 flex items-start cursor-pointer hover:bg-gray-100 rounded p-1 transition-colors"
                                onClick={() => handleTextClick(t)}
                              >
                                <span className="mr-2 text-[#2FB5A8]">•</span>
                                <span>{t}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Paraphrases */}
                      {Array.isArray(q.paraphrases) && q.paraphrases.length > 0 && (
                        <div>
                          <h4 className="text-gray-700 font-semibold text-sm mb-2">Parafrasa</h4>
                          <ul className="space-y-1.5">
                            {q.paraphrases.map((p, i) => (
                              <li 
                                key={i} 
                                className="text-sm text-gray-600 flex items-start cursor-pointer hover:bg-gray-100 rounded p-1 transition-colors"
                                onClick={() => handleTextClick(p)}
                              >
                                <span className="mr-2 text-[#3F86C7]">•</span>
                                <span>{p}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Related Verses Section */}
                      {q.verse_refs && q.verse_refs.length > 0 && (
                        <div className="border-t border-gray-200 pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <h4 className="text-gray-700 font-semibold text-sm">Ayat Terkait</h4>
                              <span className="bg-gray-400 text-white px-2 py-0.5 rounded text-xs font-medium">
                                {q.verse_refs.length} ayat
                              </span>
                            </div>
                            <span className="bg-[#5DD6B9] text-white px-2 py-0.5 rounded text-xs font-medium">
                              Sangat Relevan
                            </span>
                          </div>

                          <div className="space-y-3">
                            {/* Always show first verse */}
                            {q.verse_refs?.slice(0, 1).map((ref) => (
                              <div 
                                key={`${q.qid}-0`}
                                className="bg-white rounded-lg p-3 shadow-sm"
                              >
                                {/* Centered Surah Reference with Badge */}
                                <div className="text-center mb-2 flex items-center justify-between">
                                  <span className="bg-gray-400 text-white px-2 py-0.5 rounded text-sm font-medium">1</span>
                                  <span className="text-sm font-bold text-gray-600">
                                    {ref.surah_name} ({ref.sura}:{ref.aya})
                                  </span>
                                  <div className="w-[32px]"></div> {/* Spacer for alignment */}
                                </div>

                                <p className="text-right font-arabic leading-relaxed text-lg mb-3" dir="rtl" style={{ fontSize: '1.2em' }}>
                                  {ref.arabic_text}
                                </p>
                                {/* First verse translation */}
                                <p className="text-sm text-gray-700 mb-2">
                                  {(ref.translation || '').replace(/^\d+\)\s*/, '')}
                                </p>
                                {/* More Details Button */}
                                {q.verse_refs && q.verse_refs.length > 1 && (
                                  <div className="flex justify-end mt-2">
                                    <button
                                      onClick={() => toggleVerseDetails(q.qid)}
                                      className="text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-1 bg-white px-2 py-1 rounded-full shadow-sm hover:shadow-md border border-gray-200"
                                    >
                                      {expandedVerses[q.qid] ? (
                                        <>
                                          Tutup detail
                                          <motion.span
                                            initial={{ rotate: 0 }}
                                            animate={{ rotate: 180 }}
                                            transition={{ duration: 0.3 }}
                                            className="text-xs"
                                          >
                                            ▼
                                          </motion.span>
                                        </>
                                      ) : (
                                        <>
                                          Detail lainnya
                                          <motion.span
                                            initial={{ rotate: 180 }}
                                            animate={{ rotate: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="text-xs"
                                          >
                                            ▼
                                          </motion.span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}

                            {/* Show remaining verses when expanded */}
                            {expandedVerses[q.qid] && q.verse_refs?.slice(1).map((ref, vIdx) => (
                              <motion.div 
                                key={`${q.qid}-${vIdx + 1}`}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white rounded-lg p-3 shadow-sm"
                              >
                                {/* Centered Surah Reference with Badge */}
                                <div className="text-center mb-2 flex items-center justify-between">
                                  <span className="bg-gray-400 text-white px-2 py-0.5 rounded text-sm font-medium">{vIdx + 2}</span>
                                  <span className="text-sm font-bold text-gray-600">
                                    {ref.surah_name} ({ref.sura}:{ref.aya})
                                  </span>
                                  <div className="w-[32px]"></div> {/* Spacer for alignment */}
                                </div>

                                <p className="text-right font-arabic leading-relaxed text-lg mb-3" dir="rtl" style={{ fontSize: '1.2em' }}>
                                  {ref.arabic_text}
                                </p>
                                {/* Expanded verses translation */}
                                <p className="text-sm text-gray-700">
                                  {(ref.translation || '').replace(/^\d+\)\s*/, '')}
                                </p>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Define interface for search verse
interface SearchVerse {
  verse_ref: string;
  skor_final: number;
  'map@10': number;
  mrr: number;
}

// Update HistoricalData interface
interface HistoricalData {
  timestamp: string;
  query: string;
  map: number;
  mrr: number;
  encoder: string;
  relevancy: number;
  related_relevancy: number;
  verses_stats?: {
    total_related: number;
    total_processed: number;
    total_predicted: number;
    related_verses?: Array<{surah_name: string; sura: string; aya: string}>;
    processed_verses?: Array<{surah_name: string; sura: string; aya: string}>;
    predicted_verses?: Array<{surah_name: string; sura: string; aya: string}>;
  };
}

// Update SearchResult interface to include all needed fields
interface SearchResult {
  verse_ref: string;
  nomor_dokumen: string;
  'map@10': number;
  mrr: number;
  skor_final: number;
  text: string;
  arabic_text: string;
  translation: string;
  surah_name?: string;  // Add this field
}

// Add encoder name mapping at the top level
const encoderNames: { [key: string]: string } = {
  'firqaaa/indo-sentence-bert-base': 'Indo-SBERT Base',
  'indobenchmark/indobert-base-p1': 'IndoBERT Base P1',
  'msmarco-distilbert-base-tas-b': 'MS MARCO DistilBERT',
  'aubmindlab/bert-base-arabert': 'Arabert',
  'text-embedding-ada-002': 'OpenAI Ada'
};

// Add Surah name mapping
const surahNames: { [key: string]: string } = {
  "1": "Al-Fatihah",
  "2": "Al-Baqarah",
  "3": "Ali 'Imran",
  "4": "An-Nisa'",
  "5": "Al-Ma'idah",
  "6": "Al-An'am",
  "7": "Al-A'raf",
  "8": "Al-Anfal",
  "9": "At-Tawbah",
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
  "20": "Taha",
  "21": "Al-Anbya'",
  "22": "Al-Hajj",
  "23": "Al-Mu'minun",
  "24": "An-Nur",
  "25": "Al-Furqan",
  "26": "Ash-Shu'ara'",
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
  "40": "Ghafir",
  "41": "Fussilat",
  "42": "Ash-Shura",
  "43": "Az-Zukhruf",
  "44": "Ad-Dukhan",
  "45": "Al-Jathiyah",
  "46": "Al-Ahqaf",
  "47": "Muhammad",
  "48": "Al-Fath",
  "49": "Al-Hujurat",
  "50": "Qaf",
  "51": "Adh-Dhariyat",
  "52": "At-Tur",
  "53": "An-Najm",
  "54": "Al-Qamar",
  "55": "Ar-Rahman",
  "56": "Al-Waqi'ah",
  "57": "Al-Hadid",
  "58": "Al-Mujadilah",
  "59": "Al-Hashr",
  "60": "Al-Mumtahanah",
  "61": "As-Saff",
  "62": "Al-Jumu'ah",
  "63": "Al-Munafiqun",
  "64": "At-Taghabun",
  "65": "At-Talaq",
  "66": "At-Tahrim",
  "67": "Al-Mulk",
  "68": "Al-Qalam",
  "69": "Al-Haqqah",
  "70": "Al-Ma'arij",
  "71": "Nuh",
  "72": "Al-Jinn",
  "73": "Al-Muzzammil",
  "74": "Al-Muddaththir",
  "75": "Al-Qiyamah",
  "76": "Al-Insan",
  "77": "Al-Mursalat",
  "78": "An-Naba'",
  "79": "An-Nazi'at",
  "80": "'Abasa",
  "81": "At-Takwir",
  "82": "Al-Infitar",
  "83": "Al-Mutaffifin",
  "84": "Al-Inshiqaq",
  "85": "Al-Buruj",
  "86": "At-Tariq",
  "87": "Al-A'la",
  "88": "Al-Ghashiyah",
  "89": "Al-Fajr",
  "90": "Al-Balad",
  "91": "Ash-Shams",
  "92": "Al-Layl",
  "93": "Ad-Duha",
  "94": "Ash-Sharh",
  "95": "At-Tin",
  "96": "Al-'Alaq",
  "97": "Al-Qadr",
  "98": "Al-Bayyinah",
  "99": "Az-Zalzalah",
  "100": "Al-'Adiyat",
  "101": "Al-Qari'ah",
  "102": "At-Takathur",
  "103": "Al-'Asr",
  "104": "Al-Humazah",
  "105": "Al-Fil",
  "106": "Quraysh",
  "107": "Al-Ma'un",
  "108": "Al-Kawthar",
  "109": "Al-Kafirun",
  "110": "An-Nasr",
  "111": "Al-Masad",
  "112": "Al-Ikhlas",
  "113": "Al-Falaq",
  "114": "An-Nas"
};

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResponse, setSearchResponse] = useState<any>(null);
  const [selectedEncoder, setSelectedEncoder] = useState<string>('firqaaa/indo-sentence-bert-base');
  const [expandedVerses, setExpandedVerses] = useState<Record<string, boolean>>({});
  const [graphHistory, setGraphHistory] = useState<HistoricalData[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('graphHistory');
    if (savedHistory) {
      try {
        setGraphHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Error loading graph history:', e);
      }
    }
  }, []);

  const handleSearch = async (query: string, encoder: string) => {
    setIsLoading(true);
    setError(null);
    setSelectedEncoder(encoder);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: query, encoder }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Search request failed');
      }

      const data = await response.json();
      
      // Sort results by MAP@10 and MRR scores
      if (data.results && Array.isArray(data.results)) {
        data.results.sort((a: any, b: any) => {
          const scoreA = (a['map@10'] || 0) + (a.mrr || 0);
          const scoreB = (b['map@10'] || 0) + (b.mrr || 0);
          return scoreB - scoreA; // Sort in descending order
        });

        // Add to history if we have valid scores
        if (data.results.length > 0) {
          const firstResult: SearchResult = data.results[0];
          
          // Calculate total related verses for matching questions
          let totalRelatedVerses = 0;
          let relatedVersesList: Array<{surah_name: string; sura: string; aya: string}> = [];
          
          if (data.query_parameter?.related_questions) {
            data.query_parameter.related_questions.forEach((q: RelatedQuestion) => {
              // Only count verses if the question matches the current query
              if (q.translations?.includes(query) || q.paraphrases?.includes(query)) {
                totalRelatedVerses += (q.verse_refs?.length || 0);
                // Add verse references
                if (q.verse_refs) {
                  relatedVersesList.push(...q.verse_refs.map(ref => ({
                    surah_name: ref.surah_name,
                    sura: ref.sura,
                    aya: ref.aya
                  })));
                }
              }
            });
          }

          // Get processed verses info
          const processedVersesList = data.results.map((result: SearchResult) => {
            const [sura, aya] = result.verse_ref.split(':');
            // Get surah name from the mapping
            const surah_name = surahNames[sura] || `Surah ${sura}`;
            
            return {
              surah_name,
              sura,
              aya
            };
          });

          // Calculate predicted verses (intersection between related and processed verses)
          const predictedVersesList = relatedVersesList.filter(relatedVerse => 
            processedVersesList.some((processedVerse: {surah_name: string; sura: string; aya: string}) => 
              processedVerse.sura === relatedVerse.sura && 
              processedVerse.aya === relatedVerse.aya
            )
          );

          const newHistoryEntry: HistoricalData = {
            timestamp: new Date().toLocaleTimeString(),
            query,
            map: firstResult['map@10'] || 0,
            mrr: firstResult.mrr || 0,
            encoder: encoderNames[encoder] || encoder,
            relevancy: firstResult.skor_final || 0,
            related_relevancy: data.query_parameter?.meter_relevancy?.high || 0,
            verses_stats: {
              total_related: totalRelatedVerses,
              total_processed: data.results.length || 0,
              total_predicted: predictedVersesList.length,
              related_verses: relatedVersesList,
              processed_verses: processedVersesList,
              predicted_verses: predictedVersesList
            }
          };

          // Update history state
          const updatedHistory = [...graphHistory, newHistoryEntry].slice(-10); // Keep last 10 entries
          setGraphHistory(updatedHistory);

          // Save to localStorage
          localStorage.setItem('graphHistory', JSON.stringify(updatedHistory));
        }
      }
      
      setSearchResponse(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred during search');
      setSearchResponse(null);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVerseDetails = (qid: string) => {
    setExpandedVerses(prev => ({
      ...prev,
      [qid]: !prev[qid]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-[#2FB5A8]/20">
      <main className="max-w-[1440px] mx-auto px-6 lg:px-8">
        <div className="py-16 lg:py-20 space-y-4 lg:space-y-6">
          {/* Header */}
          <div className="flex flex-col items-center space-y-2">
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center space-x-4 relative">
                <Image
                  src="/iqrok_logo.svg"
                  alt="Iqrok Logo"
                  width={60}
                  height={60}
                  className="w-15 h-15"
                  priority
                />
                <div className="flex flex-col items-center">
                  <h1 className="text-4xl font-gugi tracking-wide select-none font-[--font-gugi]">
                    <span className="text-[#3F86C7]">iq</span>
                    <span className="text-[#2FB5A8]">rok</span>
                  </h1>
                  <motion.div
                    className="mt-1"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="relative px-3 py-1 rounded-full text-[10px] font-medium text-white whitespace-nowrap overflow-hidden">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-[#3F86C7] to-[#2FB5A8]"
                        animate={{
                          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                        }}
                        transition={{
                          duration: 5,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                        style={{
                          backgroundSize: '200% 100%'
                        }}
                      />
                      <span className="relative z-10">Indonesian Version</span>
                    </div>
                  </motion.div>
                </div>
              </div>
              <p className="mt-5 text-[25px] font-semibold text-gray-900 font-[--font-saira]">
                Selami Luasnya Quran
              </p>
            </div>
            
            <h2 className="text-2xl text-gray-700 font-[--font-saira] font-semibold max-w-4xl text-center">
                
            </h2>
          </div>

          {/* Search Input - Centered with max width */}
          <div className="max-w-4xl mx-auto w-full">
            <SearchInput onSearch={handleSearch} onLoading={setIsLoading} onError={setError} />
          </div>

          
          {/* Error Message */}
          {error && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
                {error}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && <Loading />}

          {/* Results */}
          {!isLoading && searchResponse && (
            <div className="max-w-4xl mx-auto w-full px-6">
              <div className="space-y-6">
                {/* Move Ringkasan Konsensus and Analisis Keseluruhan boxes here */}
                {searchResponse.results.length > 0 && (
                  <>
                    <div className="h-[1px] bg-gray-400 w-full" />
                    {((searchResponse.query_words && searchResponse.query_words.length > 0) || searchResponse.query_arabic) && (
                      <div className="text-lg font-semibold mb-2">
                        {searchResponse.query_words && searchResponse.query_words.length > 0
                          ? searchResponse.query_words.join(' ')
                          : searchResponse.query_arabic}
                      </div>
                    )}
                    {/* Add GraphOutput component */}
                    {searchResponse.results.length > 0 && searchResponse.query_parameter.related_questions?.some((q: RelatedQuestion) => q.verse_refs && q.verse_refs.length > 0) && (
                      <div className="space-y-4">
                        <GraphOutput 
                          queryVerses={searchResponse.results.map((verse: SearchVerse) => ({
                            verse_ref: verse.verse_ref,
                            relevance: verse.skor_final,
                            skor_final: verse.skor_final,
                            'map@10': verse['map@10'],
                            mrr: verse.mrr
                          }))}
                          relatedVerses={searchResponse.query_parameter.related_questions?.flatMap((q: RelatedQuestion) => 
                            q.verse_refs?.map((ref: VerseReference) => ({
                              verse_ref: `${ref.sura}:${ref.aya}`,
                              relevance: Number(ref.relevance) || 0
                            })) || []
                          )}
                        />
                        {/* Add GraphHistory component */}
                        {graphHistory.length > 0 && (
                          <GraphHistory 
                            history={graphHistory} 
                            onHistoryUpdate={(newHistory) => setGraphHistory(newHistory)}
                          />
                        )}
                        <RelevancySection 
                          searchResponse={searchResponse} 
                          expandedVerses={expandedVerses}
                          toggleVerseDetails={toggleVerseDetails}
                          onSearch={handleSearch}
                        />
                      </div>
                    )}
                  </>
                )}
                <VerseSource
                  verses={searchResponse.results}
                  query={searchResponse.query_arabic}
                  query_words={searchResponse.query_words}
                  query_arabic={searchResponse.query_arabic}
                  encoder={selectedEncoder}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 