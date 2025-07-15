'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import styles from '@/styles/answer.module.css';
import { highlightText } from '@/utility/pillar/textHighlight';
import DOMPurify from 'isomorphic-dompurify';

interface Verse {
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
  metadata?: {
    verse_ref: string;
  };
}

interface AnswerDataProps {
  verse: Verse & {
    analisis_pro?: string;
    ringkasan_konsensus?: {
      ringkasan: string;
      meter_konsensus?: {
        ya: number;
        tidak: number;
        mungkin: number;
      } | null;
    };
  };
  queryWords: string[];
  index: number;
  hukumType?: string;
}

// Add surah names mapping
const SURAH_NAMES: { [key: string]: string } = {
  '1': 'Al-Fatihah',
  '2': 'Al-Baqarah',
  '3': 'Ali Imran',
  '4': 'An-Nisa',
  '5': 'Al-Maidah',
  '6': 'Al-Anam',
  '7': 'Al-Araf',
  '8': 'Al-Anfal',
  '9': 'At-Taubah',
  '10': 'Yunus',
  '11': 'Hud',
  '12': 'Yusuf',
  '13': 'Ar-Rad',
  '14': 'Ibrahim',
  '15': 'Al-Hijr',
  '16': 'An-Nahl',
  '17': 'Al-Isra',
  '18': 'Al-Kahf',
  '19': 'Maryam',
  '20': 'Taha',
  '21': 'Al-Anbiya',
  '22': 'Al-Hajj',
  '23': 'Al-Muminun',
  '24': 'An-Nur',
  '25': 'Al-Furqan',
  '26': 'Asy-Syuara',
  '27': 'An-Naml',
  '28': 'Al-Qasas',
  '29': 'Al-Ankabut',
  '30': 'Ar-Rum',
  '31': 'Luqman',
  '32': 'As-Sajdah',
  '33': 'Al-Ahzab',
  '34': 'Saba',
  '35': 'Fatir',
  '36': 'Ya Sin',
  '37': 'As-Saffat',
  '38': 'Sad',
  '39': 'Az-Zumar',
  '40': 'Gafir',
  '41': 'Fussilat',
  '42': 'Asy-Syura',
  '43': 'Az-Zukhruf',
  '44': 'Ad-Dukhan',
  '45': 'Al-Jasiyah',
  '46': 'Al-Ahqaf',
  '47': 'Muhammad',
  '48': 'Al-Fath',
  '49': 'Al-Hujurat',
  '50': 'Qaf',
  '51': 'Az-Zariyat',
  '52': 'At-Tur',
  '53': 'An-Najm',
  '54': 'Al-Qamar',
  '55': 'Ar-Rahman',
  '56': 'Al-Waqiah',
  '57': 'Al-Hadid',
  '58': 'Al-Mujadalah',
  '59': 'Al-Hasyr',
  '60': 'Al-Mumtahanah',
  '61': 'As-Saff',
  '62': 'Al-Jumuah',
  '63': 'Al-Munafiqun',
  '64': 'At-Tagabun',
  '65': 'At-Talaq',
  '66': 'At-Tahrim',
  '67': 'Al-Mulk',
  '68': 'Al-Qalam',
  '69': 'Al-Haqqah',
  '70': 'Al-Maarij',
  '71': 'Nuh',
  '72': 'Al-Jinn',
  '73': 'Al-Muzzammil',
  '74': 'Al-Muddassir',
  '75': 'Al-Qiyamah',
  '76': 'Al-Insan',
  '77': 'Al-Mursalat',
  '78': 'An-Naba',
  '79': 'An-Naziat',
  '80': 'Abasa',
  '81': 'At-Takwir',
  '82': 'Al-Infitar',
  '83': 'Al-Mutaffifin',
  '84': 'Al-Insyiqaq',
  '85': 'Al-Buruj',
  '86': 'At-Tariq',
  '87': 'Al-Ala',
  '88': 'Al-Gasyiyah',
  '89': 'Al-Fajr',
  '90': 'Al-Balad',
  '91': 'Asy-Syams',
  '92': 'Al-Lail',
  '93': 'Ad-Duha',
  '94': 'Asy-Syarh',
  '95': 'At-Tin',
  '96': 'Al-Alaq',
  '97': 'Al-Qadr',
  '98': 'Al-Bayyinah',
  '99': 'Az-Zalzalah',
  '100': 'Al-Adiyat',
  '101': 'Al-Qariah',
  '102': 'At-Takasur',
  '103': 'Al-Asr',
  '104': 'Al-Humazah',
  '105': 'Al-Fil',
  '106': 'Quraisy',
  '107': 'Al-Maun',
  '108': 'Al-Kausar',
  '109': 'Al-Kafirun',
  '110': 'An-Nasr',
  '111': 'Al-Lahab',
  '112': 'Al-Ikhlas',
  '113': 'Al-Falaq',
  '114': 'An-Nas'
};

// Error boundary component
class VerseErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Verse rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorContainer}>
          <h3>Kesalahan Memuat Ayat</h3>
          <p>Terjadi kesalahan saat menampilkan ayat ini. Silakan muat ulang halaman.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading indicator component
const LoadingIndicator = () => (
  <div className={styles.loadingContainer}>
    <div className={styles.loadingSpinner}></div>
  </div>
);

// Add relevancy calculation function
const getRelevancyBadge = (mapScore: number, mrrScore: number) => {
  const combinedScore = (mapScore + mrrScore) / 2;
  
  if (combinedScore >= 0.9) {
    return {
      text: 'Sangat Relevan',
      color: 'bg-[#5DD6B9] text-white'
    };
  } else if (combinedScore >= 0.7) {
    return {
      text: 'Cukup Relevan',
      color: 'bg-[#FDC442] text-white'
    };
  } else if (combinedScore >= 0.5) {
    return {
      text: 'Kurang Relevan',
      color: 'bg-[#F17575] text-white'
    };
  } else {
    return {
      text: 'Tidak Relevan',
      color: 'bg-gray-400 text-white'
    };
  }
};

function AnswerData({ verse, queryWords, index, hukumType }: AnswerDataProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Add logging for verse data
  useEffect(() => {
    console.log('AnswerData received verse:', {
      verseId: verse.nomor_dokumen,
    });
  }, [verse]);

  // Update getSurahAyat function
  const getSurahAyat = () => {
    try {
      if (typeof verse.text === 'string' && verse.text.startsWith('{')) {
        const textData = JSON.parse(verse.text.replace(/'/g, '"'));
        if (textData.sura && textData.aya) {
          const surahName = SURAH_NAMES[textData.sura] || '';
          return `${surahName} (${textData.sura}:${textData.aya})`;
        }
      }
    } catch (error) {
      console.error('Error parsing verse text:', error);
    }
    if (verse.verse_ref) {
      const [sura, aya] = verse.verse_ref.split(':');
      const surahName = SURAH_NAMES[sura] || '';
      return `${surahName} (${sura}:${aya})`;
    }
    return 'Undefined';
  };

  // Function to get clean translation text
  const getTranslationText = () => {
    try {
      if (typeof verse.text === 'string' && verse.text.startsWith('{')) {
        const textData = JSON.parse(verse.text.replace(/'/g, '"'));
        // Remove footnote numbers (e.g., "1) ", "12) ", etc.)
        return (textData.translation || '').replace(/^\d+\)\s*/, '');
      }
    } catch (error) {
      console.error('Error parsing verse translation:', error);
    }
    // Remove footnote numbers from direct translation
    return verse.translation || '';
  };

  // Add verse reference display
  const verseRef = `[${index + 1}] ${verse.nomor_dokumen}`;

  // Function to highlight query words in text
  const highlightQueryWords = (text: string, words: string[]) => {
    if (!words || words.length === 0) return text;
    
    const regex = new RegExp(`(${words.join('|')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 rounded px-1">$1</mark>');
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const highlightedText = highlightText(verse.text, queryWords);
  const highlightedArabic = useMemo(() => {
    return verse.arabic_text ? DOMPurify.sanitize(verse.arabic_text) : '';
  }, [verse.arabic_text]);

  // Get relevancy badge
  const relevancyBadge = getRelevancyBadge(verse['map@10'] || 0, verse.mrr || 0);

  if (!isVisible) {
    return <div ref={containerRef} className={`${styles.placeholder} w-full`} />;
  }

  return (
    <div className="bg-white border border-gray-200 shadow-sm overflow-hidden mb-2">
      {/* Verse Card Header */}
      <div className="bg-gradient-to-r from-[#2FB5A8] to-[#3F86C7] text-white p-2 rounded-t-lg">
        <div className="grid grid-cols-3 items-center">
          {/* Left: Number Badge */}
          <div className="flex items-center justify-start">
            <div className="flex items-center justify-center" style={{ minWidth: '1.7em' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '1.5em',
                height: '1.5em',
                background: '#65d1cb',
                color: '#fff',
                fontSize: '0.95em',
                fontWeight: 600,
                borderRadius: '0.35em',
                verticalAlign: 'middle',
                boxShadow: '0 1px 4px 0 rgba(47,181,168,0.12)',
              }}>{index}</span>
            </div>
          </div>
          {/* Center: Surah Title */}
          <h3 className="font-bold text-sm text-center">
            {getSurahAyat()}
          </h3>
          {/* Right: Badges */}
          <div className="flex justify-end items-center gap-2">
            {/* Relevancy badge */}
            <span className={`text-xs font-semibold px-2 py-1 rounded ${relevancyBadge.color}`}>
              {relevancyBadge.text}
            </span>
            {/* Hukum badge */}
            {hukumType && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 'auto',
                minWidth: '1.5em',
                height: '1.5em',
                background: hukumType === 'halal' ? '#65d1cb' : hukumType === 'syubhat' ? '#d19565' : '#d1656b',
                color: '#ffffff',
                borderRadius: '0.35em',
                padding: '0 0.5em',
                fontWeight: 600,
                fontSize: '0.95em',
                textTransform: 'capitalize',
                letterSpacing: '0.01em',
                boxShadow: '0 1px 4px 0 rgba(47,181,168,0.12)',
              }}>{hukumType}</span>
            )}
          </div>
        </div>
      </div>
      <div className="p-5 rounded-b-lg">
        {/* Arabic Text */}
        <div className="mb-2">
          <p className="text-right font-arabic leading-normal" dir="rtl" style={{ fontSize: '20px' }}>
            {verse.arabic_text}
          </p>
        </div>
        {/* Indonesian Text */}
        <div className="mb-2">
          <p className="text-gray-800 text-[15px]" 
             dangerouslySetInnerHTML={{ 
               __html: highlightQueryWords(getTranslationText(), queryWords) 
             }} 
          />
        </div>
        {/* Combined Intisari and Relevansi Container */}
        <div className="flex mb-2">
          <div className="w-2 bg-gradient-to-b from-[#2FB5A8] to-[#3F86C7] rounded-l-md" />
          <div className="flex-1 bg-gradient-to-r from-[#2FB5A8]/10 to-[#eafaf7] shadow-md p-3 space-y-4">
            {/* Intisari Section */}
            <div>
              <div className="flex items-center mb-2">
                <h4 className="text-gray-700 font-semibold text-sm">Metrik Evaluasi</h4>
              </div>
              <p className="text-gray-600 text-sm">
                {verse.key_takeaway}
              </p>
            </div>
            {/* Relevansi Section */}
            <div>
              {(() => {
                // Get raw scores (0-1 scale)
                const mapScore = verse['map@10'] || 0;
                const mrrScore = verse.mrr || 0;
                
                return (
                  <>
                    {/* MAP@10 Bar */}
                    <div className="mb-2">
                      <div className="flex items-center">
                        <div className="flex-1 h-2 bg-gray-200 rounded-md overflow-hidden">
                          <div 
                            className="h-full bg-[#2FB5A8] rounded-md" 
                            style={{ width: `${mapScore * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between mt-1">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-[#2FB5A8] rounded-sm"></div>
                          <span className="text-sm text-[#2FB5A8] font-medium">
                            MAP@10: {mapScore.toFixed(3)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* MRR Bar */}
                    <div>
                      <div className="flex items-center">
                        <div className="flex-1 h-2 bg-gray-200 rounded-md overflow-hidden">
                          <div 
                            className="h-full bg-[#3F86C7] rounded-md" 
                            style={{ width: `${mrrScore * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between mt-1">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-[#3F86C7] rounded-sm"></div>
                          <span className="text-sm text-[#3F86C7] font-medium">
                            MRR: {mrrScore.toFixed(3)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export wrapped component with error boundary
export default function AnswerDataWithErrorBoundary(props: AnswerDataProps) {
  return (
    <VerseErrorBoundary>
      <AnswerData {...props} />
    </VerseErrorBoundary>
  );
} 