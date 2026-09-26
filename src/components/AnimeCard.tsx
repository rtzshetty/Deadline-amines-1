import React, { useState } from 'react';
import { Play, Film, Tv, Star, Crown } from 'lucide-react';
import { AnimeItem } from '../types';

interface AnimeCardProps {
  item: AnimeItem;
  onClick: () => void;
  showType?: boolean;
}

export const AnimeCard: React.FC<AnimeCardProps> = ({ item, onClick, showType = false }) => {
  const [imageError, setImageError] = useState(false);

  const cleanRating = item.rating ? item.rating.replace(/TMDB\s*/i, '').trim() : '';
  const cleanYear = item.year ? item.year.split(/[-–]/)[0].trim() : '';
  const isMovie = item.type === 'movie' || Boolean(item.movieId);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group relative cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-red-500 rounded-xl"
    >
      {/* Poster Media Box */}
      <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-[#161922] border border-[#232838] transition-all duration-300 group-hover:border-red-500/50 group-hover:shadow-xl group-hover:shadow-red-950/30">
        {!imageError && item.image ? (
          <img
            src={item.image}
            alt={item.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#161922] to-[#0d0e14] text-slate-500">
            {isMovie ? <Film className="w-10 h-10 mb-2 opacity-40 text-red-400" /> : <Tv className="w-10 h-10 mb-2 opacity-40 text-red-400" />}
            <span className="text-xs text-center line-clamp-3 text-slate-400 font-medium">{item.title}</span>
          </div>
        )}

        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
          <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white shadow-xl shadow-red-600/40 transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </div>

        {/* Discrete Top Scrim with rating and VIP badge */}
        <div className="absolute top-0 inset-x-0 p-2.5 flex items-center justify-between pointer-events-none bg-gradient-to-b from-black/80 via-black/30 to-transparent">
          <div className="flex items-center gap-1.5">
            {cleanRating && (
              <div className="flex items-center gap-1 text-[11px] font-bold text-amber-300 drop-shadow-md">
                <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                <span className="tabular-nums">{cleanRating}</span>
              </div>
            )}
            {item.isPremium && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[9px] font-black uppercase tracking-wider shadow-sm">
                <Crown className="w-2.5 h-2.5 fill-black" />
                <span>VIP</span>
              </div>
            )}
          </div>

          {showType && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 drop-shadow-md">
              {isMovie ? 'Movie' : 'Series'}
            </span>
          )}
        </div>
      </div>

      {/* Metadata (Zero-Pill Discipline: Unboxed Text with Separators) */}
      <div className="mt-2.5 space-y-1">
        <h3 className="text-sm font-semibold text-slate-200 line-clamp-1 group-hover:text-red-400 transition-colors">
          {item.title}
        </h3>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          {cleanYear && <span>{cleanYear}</span>}
          {cleanYear && <span aria-hidden="true" className="text-slate-600">·</span>}
          <span>{isMovie ? 'Movie' : 'Hindi Dub'}</span>
          {item.language && (
            <>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="truncate max-w-[90px]">{item.language}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
