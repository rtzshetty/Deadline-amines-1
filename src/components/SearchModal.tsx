import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Film, Tv, Star, ArrowRight } from 'lucide-react';
import { AnimeItem } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: AnimeItem) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AnimeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'series' | 'movie'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults([]);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const handler = setTimeout(async () => {
      try {
        const res = await fetch(`/api/anime-world-india/v1/search?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success && data.results) {
          setResults(data.results);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [query]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const filteredResults = results.filter((item) => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl bg-[#0f1118] border border-[#232838] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[82vh]">
        {/* Search Header Bar */}
        <div className="p-4 border-b border-[#232838] flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anime series, movies (e.g. Naruto, Demon Slayer, Suzume)..."
            className="w-full bg-transparent text-white placeholder-slate-500 text-base focus:outline-none"
          />
          {loading && <Loader2 className="w-5 h-5 text-red-500 animate-spin shrink-0" />}
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs font-medium text-slate-400 hover:text-white rounded border border-slate-700 cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Filter Segmented Controls */}
        {results.length > 0 && (
          <div className="px-4 py-2 border-b border-[#232838] bg-[#0c0d13] flex items-center gap-2">
            <span className="text-xs text-slate-500 mr-2">Filter:</span>
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-red-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
              }`}
            >
              All ({results.length})
            </button>
            <button
              onClick={() => setFilterType('series')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                filterType === 'series'
                  ? 'bg-red-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
              }`}
            >
              Series
            </button>
            <button
              onClick={() => setFilterType('movie')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                filterType === 'movie'
                  ? 'bg-red-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
              }`}
            >
              Movies
            </button>
          </div>
        )}

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {!query && (
            <div className="py-16 text-center text-slate-500 space-y-3">
              <Search className="w-10 h-10 mx-auto opacity-30 text-slate-400" />
              <p className="text-sm">Type any title to search anime series, movies & Hindi dubs</p>
              <div className="flex flex-wrap justify-center gap-2 pt-2 text-xs text-slate-400">
                <span className="text-slate-500">Popular:</span>
                {['Naruto', 'One Punch Man', 'Shinchan', 'Demon Slayer', 'Suzume'].map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="hover:text-red-400 underline underline-offset-2 cursor-pointer"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {query && !loading && filteredResults.length === 0 && (
            <div className="py-16 text-center text-slate-500">
              <p className="text-sm">No anime found matching "{query}"</p>
              <p className="text-xs text-slate-600 mt-1">Try searching for keywords or character names</p>
            </div>
          )}

          {filteredResults.map((item, idx) => (
            <div
              key={`${item.slug || item.title}-${idx}`}
              onClick={() => {
                onSelect(item);
                onClose();
              }}
              role="button"
              tabIndex={0}
              className="flex items-center gap-4 p-2.5 rounded-xl hover:bg-slate-800/60 border border-transparent hover:border-slate-700/60 cursor-pointer transition-colors group"
            >
              <div className="w-14 h-20 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-800">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    {item.type === 'movie' ? <Film className="w-5 h-5" /> : <Tv className="w-5 h-5" />}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-slate-200 group-hover:text-red-400 transition-colors truncate">
                  {item.title}
                </h4>

                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <span className="uppercase text-[11px] font-bold text-slate-300">
                    {item.type === 'movie' ? 'Movie' : 'Series'}
                  </span>
                  {item.year && (
                    <>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span>{item.year}</span>
                    </>
                  )}
                  {item.rating && (
                    <>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="flex items-center gap-1 text-amber-300 font-medium">
                        <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                        <span>{item.rating.replace(/TMDB\s*/i, '')}</span>
                      </span>
                    </>
                  )}
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="text-slate-400">Hindi / Multi Dub</span>
                </div>
              </div>

              <div className="p-2 text-slate-500 group-hover:text-red-400 transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
