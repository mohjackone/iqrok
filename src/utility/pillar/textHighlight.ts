import DOMPurify from 'isomorphic-dompurify';

export function highlightText(text: string, words: string[]): string {
  if (!text || !words?.length) return text;

  let highlightedText = text;
  words.forEach(word => {
    if (!word) return;
    const regex = new RegExp(word, 'gi');
    highlightedText = highlightedText.replace(
      regex,
      match => `<mark>${match}</mark>`
    );
  });

  return DOMPurify.sanitize(highlightedText);
}

export const highlightArabicWords = (arabicText: string, queryWords: string[]) => {
  let highlightedText = arabicText;
  const arabicKeywords: Record<string, string> = {
    'kehidupan': 'ٱلۡحَيَوٰةُ',
    // Add more mappings as needed
  };

  queryWords.forEach(word => {
    const lowerWord = word.toLowerCase();
    if (arabicKeywords[lowerWord]) {
      highlightedText = highlightedText.replace(
        arabicKeywords[lowerWord],
        `<span style="color: #2EB5A8;">${arabicKeywords[lowerWord]}</span>`
      );
    }
  });

  return { __html: highlightedText };
}; 