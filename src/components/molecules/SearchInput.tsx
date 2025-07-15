'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, ArrowRight, Ban, Loader2, Book, Globe, Cpu, User, ChevronDown } from 'lucide-react';
import { cn } from '@/libraries/ux-provider/tailwind-merge';

interface Suggestion {
  qid: string;
  question: string;
  similarity: number;
  translations: string[];
  paraphrases: string[];
  arabic_question?: string;
  originalQuestion?: string;
}

interface SearchInputProps {
  onSearch: (query: string, encoder: string) => void;
  onLoading?: (loading: boolean) => void;
  onError?: (error: string | null) => void;
  placeholder?: string;
  className?: string;
}

const ENCODERS = [
  {
    id: 'indo-sbert',
    name: 'Indo-SBERT Base',
    model: 'firqaaa/indo-sentence-bert-base',
    crossEncoder: 'cross-encoder/stsb-distilroberta-base',
    description: 'Indonesian SBERT model'
  },
  {
    id: 'indobert',
    name: 'IndoBERT Base P1',
    model: 'indobenchmark/indobert-base-p1',
    crossEncoder: 'cross-encoder/stsb-distilroberta-base',
    description: 'Indonesian BERT model'
  },
  {
    id: 'msmarco',
    name: 'MS MARCO DistilBERT',
    model: 'msmarco-distilbert-base-tas-b',
    crossEncoder: 'cross-encoder/ms-marco-MiniLM-L-6-v2',
    description: 'Multilingual search model'
  },
  {
    id: 'arabert',
    name: 'Arabert',
    model: 'aubmindlab/bert-base-arabert',
    crossEncoder: 'cross-encoder/stsb-distilroberta-base',
    description: 'Arabic BERT model'
  },
  {
    id: 'ada',
    name: 'OpenAI Ada',
    model: 'text-embedding-ada-002',
    crossEncoder: 'cross-encoder/stsb-distilroberta-base',
    description: 'OpenAI embedding model'
  }
];

const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  onLoading,
  onError,
  placeholder = "Ajukan pertanyaan tentang Al-Quran...",
  className = "",
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedEncoder, setSelectedEncoder] = useState(ENCODERS[0]); // Default to Indo-SBERT
  const [showEncoderDropdown, setShowEncoderDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debouncedQuery = useDebounce(query, 500);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const encoderDropdownRef = useRef<HTMLDivElement>(null);
  const previousQueryRef = useRef<string>(debouncedQuery);

  // Handle outside clicks
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        encoderDropdownRef.current &&
        !encoderDropdownRef.current.contains(event.target as Node)
      ) {
        setShowEncoderDropdown(false);
      }

      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setIsFocused(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions
  useEffect(() => {
    let isMounted = true;

    async function fetchSuggestions() {
      // Don't fetch if query is empty or unchanged
      if (!debouncedQuery.trim() || debouncedQuery === previousQueryRef.current) {
        return;
      }

      previousQueryRef.current = debouncedQuery;
      setIsLoadingSuggestions(true);
      setError(null);

      try {
        const response = await fetch('/api/suggest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            query: debouncedQuery,
            encoder: selectedEncoder.model,
            limit: 5
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch suggestions');
        }

        // Only update state if component is still mounted
        if (isMounted) {
          if (Array.isArray(data.suggestions)) {
            setSuggestions(data.suggestions);
            setShowSuggestions(true);
          } else if (Array.isArray(data)) {
            setSuggestions(data);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching suggestions:', error);
          setError(error instanceof Error ? error.message : 'Failed to fetch suggestions');
          setSuggestions([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingSuggestions(false);
        }
      }
    }

    fetchSuggestions();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, selectedEncoder]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Show loading state immediately for better UX
    if (value.trim()) {
      setShowSuggestions(true);
      setIsLoadingSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }

    // Adjust height
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.max(48, e.target.scrollHeight)}px`;
  };

  const handleSuggestionClick = async (suggestion: any) => {
    // Get the best matching text from translations and paraphrases
    const allTexts = [
      suggestion.question,
      ...(suggestion.translations || []),
      ...(suggestion.paraphrases || [])
    ].filter(Boolean);

    // Use the original question if available, otherwise use the first valid text
    const searchText = suggestion.question || allTexts[0];
    
    // Update the input field with the selected text
    setQuery(searchText);
    
    // Hide suggestions and remove focus
    setShowSuggestions(false);
    setIsFocused(false);
    
    // Perform the search with the same encoder
    onSearch(searchText, selectedEncoder.model);
  };

  const handleEncoderSelect = (encoder: typeof ENCODERS[0]) => {
    setSelectedEncoder(encoder);
    setShowEncoderDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), selectedEncoder.model);
      setShowSuggestions(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full px-4 pb-4">
      <div className="relative group mt-7">
        <div className={cn(
          "flex flex-col w-full rounded-[8px] transition-colors bg-white",
          isFocused 
            ? "border border-[#3F86C7] shadow-[0_1px_8px_rgba(63,134,199,0.25)]" 
            : "border-0 hover:border hover:border-[#3F86C7]"
        )}>
          <div className="relative flex items-start w-full min-h-[48px]">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400 group-focus-within:text-[#3F86C7] transition-colors" />
            <textarea
              ref={inputRef}
              value={query}
              onChange={handleInputChange}
              onFocus={() => {
                setIsFocused(true);
                setShowSuggestions(true);
              }}
              placeholder={placeholder}
              rows={1}
              style={{ resize: 'none' }}
              className="w-full pl-11 pr-[100px] py-3 text-sm focus:outline-none focus:ring-0 focus:ring-offset-0 border-0 rounded-[8px] bg-transparent overflow-y-hidden min-h-[48px]"
            />
            <div className="absolute right-2 top-2">
              <button 
                type="submit" 
                className={cn(
                  "h-8 px-3 text-sm font-medium flex items-center gap-1.5 relative",
                  query.trim()
                    ? "bg-[#3F86C7] text-white hover:bg-[#4F96D7] [&:disabled]:bg-[#3F86C7] [&:disabled]:opacity-100 rounded-[8px]"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100 rounded-[8px]"
                )}
                disabled={!query.trim()}
              >
                <div className={cn(
                  "flex items-center gap-1.5",
                  !query.trim() && "group-hover:invisible"
                )}>
                  {isLoadingSuggestions ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Mencari...</span>
                    </>
                  ) : (
                    <>
                      <span>Cari</span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </div>
                {!query.trim() && (
                  <div className="absolute inset-0 rounded-[8px] invisible group-hover:visible flex items-center justify-center">
                    <Ban className="h-5 w-5 text-[#FF0000] opacity-100" />
                  </div>
                )}
              </button>
            </div>
          </div>
          <div className="flex justify-between pl-3 pr-2 pb-3 pt-3">
            <div>
              <span className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-900 border border-gray-300">
                <Book className="h-4 w-4" />
                Quran
              </span>
            </div>
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-900 border border-gray-300">
                <User className="h-4 w-4" />
                AI Generated
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-900 border border-gray-300">
                <Globe className="h-4 w-4" />
                Bahasa
              </span>
              <div className="relative" ref={encoderDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowEncoderDropdown(!showEncoderDropdown)}
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-900 border border-gray-300 hover:bg-gray-50"
                >
                  <Cpu className="h-4 w-4" />
                  <span>{selectedEncoder.name}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                
                {showEncoderDropdown && (
                  <div
                    ref={encoderDropdownRef}
                    className={cn(
                      'absolute right-0 top-full mt-1 w-64 rounded-lg border border-gray-200 bg-white shadow-lg',
                      'transition-all duration-200 ease-in-out',
                      showEncoderDropdown ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                    )}
                  >
                    <div className="max-h-[200px] overflow-auto">
                      {ENCODERS.map((encoder) => (
                        <button
                          key={encoder.id}
                          type="button"
                          onClick={() => handleEncoderSelect(encoder)}
                          className={cn(
                            "w-full px-4 py-2 text-left hover:bg-gray-50",
                            selectedEncoder.id === encoder.id ? "bg-gray-50" : ""
                          )}
                        >
                          <div className="font-medium text-gray-900">{encoder.name}</div>
                          <div className="text-sm text-gray-500">{encoder.description}</div>
                          <div className="flex flex-col gap-1 text-xs text-gray-400 font-mono mt-1">
                            <span>Bi: {encoder.model}</span>
                            <span>Cross: {encoder.crossEncoder}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Suggestions dropdown */}
        {(showSuggestions && (isLoadingSuggestions || suggestions.length > 0 || error)) && (
          <div
            ref={suggestionsRef}
            className="absolute z-10 w-full mt-2 bg-white rounded-[12px] shadow-lg border border-gray-200 overflow-hidden"
          >
            {isLoadingSuggestions ? (
              <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Mencari saran...</span>
              </div>
            ) : error ? (
              <div className="px-4 py-3 text-sm text-red-500">
                {error}
              </div>
            ) : suggestions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                Tidak ada saran yang ditemukan
              </div>
            ) : (
              <ul className="max-h-[200px] overflow-auto">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={`${suggestion.qid}-${index}`}
                  >
                    {/* Main question */}
                    <button 
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 flex flex-col gap-1"
                    >
                      {/* Arabic question with proper styling */}
                      {suggestion.arabic_question && (
                        <span className="font-arabic text-right w-full text-gray-900" dir="rtl" style={{ fontSize: '1em' }}>
                          {suggestion.arabic_question}
                        </span>
                      )}
                      {/* Indonesian question */}
                      <span className="font-medium text-sm text-gray-900">
                        {suggestion.question}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </form>
  );
};

export default SearchInput; 