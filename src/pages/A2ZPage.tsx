import React, { useState, useEffect } from 'react';
import { Loader2, ArrowLeft, Filter } from 'lucide-react';
import { AnimeItem } from '../types';
import { AnimeCard } from '../components/AnimeCard';

interface A2ZPageProps {
  onNavigate: (tab: string, param?: string) => void;
  onSelectAnime: (item: AnimeItem) => void;
}

const LETTERS = ['0-9', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

export const A2ZPage: React.FC<A2ZPageProps> = ({ onNavigate, onSelectAnime }) => {
  const [selectedLetter, setSelectedLetter] = useState('A');
  const [items, setItems] = useState<AnimeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadLetter() {
      setLoading(true);
      try {
        const res = await fetch(`/api/anime-world-india/v1/a2z?letter=${encodeURIComponent(selectedLetter.toLowerCase())}`);
        const data = await res.json();
        if (!isMounted) return;

        if (data.success && data.results) {
          const formatted: AnimeItem[] = data.results.map((r: any) => {
            const isMovie = r.type === 'movie' || (r.id && r.id.startsWith('movie/'));
            const cleanId = r.id ? r.id.replace(/^(series|movie)\//, '') : '';
            return {
              title: r.title,
              image: r.image,
              year: r.year,
              rating: r.rating,
              type: isMovie ? 'movie' : 'series',
              seriesId: isMovie ? undefined : cleanId,
              movieId: isMovie ? cleanId : undefined,
              slug: cleanId
            };
          });
          setItems(formatted);
        } else {
          setItems([]);
        }
      } catch (err) {
        console.error('A-Z fetch error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadLetter();
    return () => {
      isMounted = false;
    };
  }, [selectedLetter]);

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="border-b border-[#232838] pb-6">
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition cursor-pointer mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>
        <h1 className="text-3xl font-black text-white font-['Syne'] flex items-center gap-3">
          <Filter className="w-8 h-8 text-red-500" />
          <span>A-Z Directory</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Browse anime by alphabetical letter or numeric index.
        </p>
      </div>

      {/* Alphabetical Letters Bar */}
      <div className="p-3 bg-[#11141e] border border-[#232838] rounded-2xl flex flex-wrap gap-1.5 justify-center">
        {LETTERS.map((letter) => {
          const isActive = selectedLetter === letter;
          return (
            <button
              key={letter}
              onClick={() => setSelectedLetter(letter)}
              className={`w-9 h-9 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center ${
                isActive
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 scale-105'
                  : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* Section header for the active letter */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white font-['Syne']">
          Anime starting with "{selectedLetter}"
        </h2>
        <span className="text-xs text-slate-500 font-mono">
          {items.length} titles listed
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 animate-pulse">Loading anime starting with {selectedLetter}...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center text-slate-500 space-y-2">
          <p className="text-sm font-semibold">No anime starting with "{selectedLetter}" found</p>
          <p className="text-xs text-slate-600">Try selecting another letter above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {items.map((item, idx) => (
            <AnimeCard
              key={`${item.slug || item.title}-${idx}`}
              item={item}
              showType
              onClick={() => onSelectAnime(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
