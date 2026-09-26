import React, { useState, useEffect } from 'react';
import { Play, Info, Star, ChevronLeft, ChevronRight, Volume2 } from 'lucide-react';
import { AnimeItem } from '../types';

interface HeroBannerProps {
  items: AnimeItem[];
  onSelect: (item: AnimeItem) => void;
  onWatchDirect: (item: AnimeItem) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ items, onSelect, onWatchDirect }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!items || items.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [items]);

  if (!items || items.length === 0) return null;
  const current = items[currentIndex];

  const cleanRating = current.rating ? current.rating.replace(/TMDB\s*/i, '').trim() : '8.8';
  const cleanYear = current.year ? current.year.split(/[-–]/)[0].trim() : '2024';

  return (
    <div className="relative w-full min-h-[460px] md:min-h-[520px] rounded-2xl overflow-hidden bg-[#11131a] border border-[#222634] mb-10">
      {/* Background Poster Artwork with Cinematic Contrast Scrim */}
      <div className="absolute inset-0">
        <img
          src={current.image}
          alt={current.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-top filter blur-[1px] opacity-40 scale-105 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-[#0b0c10]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0c10] via-[#0b0c10]/60 to-transparent" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16 flex flex-col justify-end min-h-[460px] md:min-h-[520px]">
        <div className="max-w-2xl space-y-4">
          {/* Metadata: Unboxed Text with Separators */}
          <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-slate-300">
            <span className="text-red-400 font-bold uppercase tracking-wider">Featured Release</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>{cleanYear}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="flex items-center gap-1 text-amber-300 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
              <span className="tabular-nums">{cleanRating}</span>
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="flex items-center gap-1 text-slate-300">
              <Volume2 className="w-3.5 h-3.5 text-red-400" />
              Hindi Dub & Multi-Audio
            </span>
          </div>

          {/* Title */}
          <h1
            style={{ textWrap: 'balance' }}
            className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white font-['Syne'] leading-tight drop-shadow-md"
          >
            {current.title}
          </h1>

          {/* Description */}
          <p className="text-slate-300 text-sm md:text-base leading-relaxed line-clamp-2 md:line-clamp-3 max-w-xl">
            Stream {current.title} in high definition with official Hindi, Tamil, Telugu, and English audio. Multiple high-speed streaming servers and episode catalogs included.
          </p>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onWatchDirect(current)}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-500 transition-colors shadow-lg shadow-red-600/30 cursor-pointer active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Watch Now</span>
            </button>

            <button
              onClick={() => onSelect(current)}
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition-colors backdrop-blur-sm cursor-pointer"
            >
              <Info className="w-4 h-4" />
              <span>View Details</span>
            </button>
          </div>
        </div>

        {/* Carousel controls */}
        {items.length > 1 && (
          <div className="absolute bottom-6 right-6 flex items-center gap-2">
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)}
              aria-label="Previous Slide"
              className="p-2 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1 px-2">
              {items.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentIndex ? 'w-6 bg-red-500' : 'w-2 bg-slate-600 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % items.length)}
              aria-label="Next Slide"
              className="p-2 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
