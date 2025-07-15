'use client';

import React, { useEffect, useState } from 'react';
import AnswerData from '@/components/atoms/AnswerData';

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

interface VerseReference {
  sura: string;
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
  hukumType?: string;
  metadata?: {
    verse_ref: string;
  };
}

interface VerseSourceProps {
  verses: Verse[];
  query: string;
  query_words: string[];
  query_arabic: string;
  meter_hukum?: Record<string, number>;
  onVerseLoad?: (verses: Verse[]) => void;
  encoder?: string;
}

const hukumOrder = ['halal', 'syubhat', 'haram'];

const VerseSource = ({ verses, query, query_words, query_arabic, meter_hukum, onVerseLoad, encoder }: VerseSourceProps) => {
  const [versesWithDetails, setVersesWithDetails] = useState<Verse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add sorting function
  const sortVersesByScore = (verses: Verse[]) => {
    return [...verses].sort((a, b) => {
      // Calculate combined score (MAP@10 + MRR)
      const scoreA = (a['map@10'] || 0) + (a.mrr || 0);
      const scoreB = (b['map@10'] || 0) + (b.mrr || 0);
      return scoreB - scoreA; // Sort in descending order
    });
  };

  useEffect(() => {
    const fetchVerseDetails = async () => {
      try {
        setIsLoading(true);
        const detailedVerses = await Promise.all(
          verses.map(async (verse, idx) => {
            const [sura, aya] = verse.nomor_dokumen.split(':');
            const surahName = SURAH_NAMES[sura] || '';
            
            const response = await fetch('/api/show', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                verseId: `${sura}:${aya}`,
                encoder: encoder
              }),
            });
            if (!response.ok) {
              throw new Error('Failed to fetch verse details');
            }
            const data = await response.json();
            let hukumType = undefined;
            if (meter_hukum) {
              let max = 0;
              for (const key of hukumOrder) {
                if ((meter_hukum[key] || 0) > max) {
                  max = meter_hukum[key];
                  hukumType = key;
                }
              }
            }
            return {
              ...verse,
              translation: data.verse_data?.translation || verse.translation || '',
              surah_name: surahName,
              verse_ref: data.verse_data?.verse_ref || `${sura}:${aya}`,
              hukumType,
            };
          })
        );

        // Sort verses before setting state
        const sortedVerses = sortVersesByScore(detailedVerses);
        setVersesWithDetails(sortedVerses);
        if (onVerseLoad) {
          onVerseLoad(sortedVerses);
        }
      } catch (error) {
        console.error('Error fetching verse details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (verses.length > 0) {
      fetchVerseDetails();
    }
  }, [verses, meter_hukum, onVerseLoad, encoder]);

  if (!verses || verses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Tidak ada ayat yang sesuai dengan pertanyaan Anda.
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Memuat detail ayat...
      </div>
    );
  }
  return (
    <div className="w-full">
      {versesWithDetails.map((verse, index) => (
        <AnswerData 
          key={`${verse.nomor_dokumen}-${index}`}
          verse={verse}
          queryWords={query_words}
          index={index + 1}
          hukumType={verse.hukumType}
        />
      ))}
    </div>
  );
};

export default VerseSource;