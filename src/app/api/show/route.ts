import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001'; // Updated to use our new Quran model port
const REQUEST_TIMEOUT = 30000;

// Helper function to normalize verse ID format
function normalizeVerseId(verseId: string): string {
  const cleanId = String(verseId).trim().replace(/^0+/, '');
  return cleanId;
}

export async function POST(request: Request) {
  try {
    const { verseId, encoder } = await request.json();

    if (!verseId) {
      return NextResponse.json(
        { error: 'ID Ayat diperlukan' },
        { status: 400 }
      );
    }

    const normalizedVerseId = normalizeVerseId(verseId);
    console.log(`Fetching details for verse ID: ${normalizedVerseId} (original: ${verseId}), Using encoder: ${encoder}`);

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

      // Search for the specific verse using our search endpoint
      const searchResponse = await fetch(`${BACKEND_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `verse:${normalizedVerseId}`,
          search_type: 'translation',
          top_k: 1,
          encoder: encoder || 'firqaaa/indo-sentence-bert-base'
        }),
        signal: controller.signal,
      });

      if (!searchResponse.ok) {
        throw new Error('Failed to fetch verse details');
      }

      const searchData = await searchResponse.json();
      
      if (!searchData.results || searchData.results.length === 0) {
        return NextResponse.json(
          { error: 'Ayat tidak ditemukan' },
          { status: 404 }
        );
      }

      const verseData = searchData.results[0];
      const cleanVerseId = verseId.split(':')[0];

      // Parse the text field to get sura and aya
      let sura = '';
      let aya = '';
      let parsedArabicText = '';
      let parsedTranslation = '';
      try {
        if (verseData.translation && verseData.translation.startsWith('{')) {
          const textData = JSON.parse(verseData.translation.replace(/'/g, '"'));
          sura = textData.sura;
          aya = textData.aya;
          parsedArabicText = textData.arabic_text || '';
          parsedTranslation = (textData.translation || '').replace(/^\d+\.\s*/, '');
        } else if (verseData.text && verseData.text.startsWith('{')) {
          const textData = JSON.parse(verseData.text.replace(/'/g, '"'));
          sura = textData.sura;
          aya = textData.aya;
          parsedArabicText = textData.arabic_text || '';
          parsedTranslation = (textData.translation || '').replace(/^\d+\.\s*/, '');
        }
      } catch (error) {
        console.error('Error parsing text data:', error);
      }

      // Format response to match search data structure exactly
      const responseData = {
        id_dokumen: cleanVerseId,
        nomor_dokumen: cleanVerseId,
        text: `{'id':'${cleanVerseId}','sura':'${sura}','aya':'${aya}','arabic_text':'${parsedArabicText}','translation':'${parsedTranslation}','footnotes':''}`,
        verse_ref: sura && aya ? `${sura}:${aya}` : cleanVerseId,
        arabic_text: parsedArabicText || verseData.arabic_text || '',
        translation: parsedTranslation || '',
        'bi-encoder': encoder || 'firqaaa/indo-sentence-bert-base',
        'cross-encoder': 'Rifky/Indobert-QA',
        'map@10': verseData.search_score || 1,
        'mrr': verseData.rank_score || 1,
        'skor_final': verseData.final_score || 1
      };

      return NextResponse.json(responseData, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      });

    } finally {
      clearTimeout(timeoutId);
    }
    
  } catch (error) {
    console.error('Error in show API:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memuat detail ayat' },
      { status: 500 }
    );
  }
}

// GET handler for preflight requests
export async function GET() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
} 