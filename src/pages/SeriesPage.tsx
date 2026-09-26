import React, { useState, useEffect } from 'react';
import { Play, Star, Clock, Layers, ArrowLeft, Loader2, Info } from 'lucide-react';
import { SeriesDetails, SeasonInfo, EpisodeItem } from '../types';

interface SeriesPageProps {
  seriesId: string;
  onNavigate: (tab: string, param?: string) => void;
}

export const SeriesPage: React.FC<SeriesPageProps> = ({ seriesId, onNavigate }) => {
  const [series, setSeries] = useState<SeriesDetails | null>(null);
  const [seasons, setSeasons] = useState<SeasonInfo[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<SeasonInfo | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [loadingSeries, setLoadingSeries] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch Series Details and Seasons
  useEffect(() => {
    let isMounted = true;
    async function loadSeries() {
      setLoadingSeries(true);
      setError(null);
      try {
        const res = await fetch(`/api/anime-world-india/v1/seasons?seriesID=${encodeURIComponent(seriesId)}`);
        const json = await res.json();
        if (!isMounted) return;

        if (json.success && json.series) {
          setSeries(json.series);
          const seasonList: SeasonInfo[] = json.seasons || [];
          setSeasons(seasonList);
          if (seasonList.length > 0) {
            setSelectedSeason(seasonList[0]);
          }
        } else {
          throw new Error('Series information could not be retrieved');
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to load anime series');
      } finally {
        if (isMounted) setLoadingSeries(false);
      }
    }

    loadSeries();
    return () => {
      isMounted = false;
    };
  }, [seriesId]);

  // 2. Fetch Episodes for selected season
  useEffect(() => {
    if (!selectedSeason) return;

    let isMounted = true;
    async function loadEpisodes() {
      setLoadingEpisodes(true);
      try {
        const queryParams = new URLSearchParams();
        if (selectedSeason?.postId) queryParams.set('postId', selectedSeason.postId);
        if (selectedSeason?.numericSeason) queryParams.set('season', selectedSeason.numericSeason.toString());
        queryParams.set('seasonId', selectedSeason?.seasonId || `${seriesId}-season-1`);
        queryParams.set('seriesId', seriesId);

        const res = await fetch(`/api/anime-world-india/v1/episodes?${queryParams.toString()}`);
        const json = await res.json();
        if (!isMounted) return;

        if (json.success && json.episodes) {
          setEpisodes(json.episodes);
        } else {
          setEpisodes([]);
        }
      } catch (err) {
        console.error('Error fetching episodes:', err);
      } finally {
        if (isMounted) setLoadingEpisodes(false);
      }
    }

    loadEpisodes();
    return () => {
      isMounted = false;
    };
  }, [selectedSeason, seriesId]);

  if (loadingSeries) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
        <p className="text-slate-400 text-sm animate-pulse">Loading anime series details...</p>
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 text-center px-4">
        <h2 className="text-xl font-bold text-white">Could not find series</h2>
        <p className="text-sm text-slate-400">{error || 'Series not found.'}</p>
        <button
          onClick={() => onNavigate('series')}
          className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition cursor-pointer"
        >
          Back to Series Catalog
        </button>
      </div>
    );
  }

  const cleanRating = (series.rating || '8.5').replace(/TMDB\s*/i, '');

  return (
    <div className="space-y-12 animate-fade-in max-w-7xl mx-auto">
      {/* Back button */}
      <div>
        <button
          onClick={() => onNavigate('series')}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Series</span>
        </button>
      </div>

      {/* Series Hero Section */}
      <div className="relative rounded-3xl overflow-hidden bg-[#10121a] border border-[#232838] p-6 md:p-10 shadow-2xl">
        {/* Subtle backdrop scrim */}
        <div className="absolute inset-0">
          <img
            src={series.poster}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover filter blur-2xl opacity-15 scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#10121a] via-[#10121a]/90 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
          {/* Left Poster */}
          <div className="w-48 sm:w-60 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border border-[#2a3045] shrink-0 mx-auto md:mx-0">
            <img
              src={series.poster}
              alt={series.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right Details */}
          <div className="flex-1 space-y-4 text-left">
            {/* Unboxed Metadata (Zero-Pill Discipline) */}
            <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-slate-400">
              <span className="font-bold text-red-500 uppercase tracking-wider">Series</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>{series.year}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="flex items-center gap-1 text-amber-300 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                <span className="tabular-nums">{cleanRating}</span>
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="flex items-center gap-1 text-slate-300">
                <Clock className="w-3.5 h-3.5" />
                <span>{series.duration || '24 min'}</span>
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="flex items-center gap-1 text-slate-300">
                <Layers className="w-3.5 h-3.5" />
                <span>{series.totalSeasons || seasons.length} Seasons</span>
              </span>
            </div>

            <h1
              style={{ textWrap: 'balance' }}
              className="text-3xl sm:text-4xl md:text-5xl font-black text-white font-['Syne'] leading-tight"
            >
              {series.title}
            </h1>

            <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-3xl">
              {series.description}
            </p>

            {/* Quick Play First Episode */}
            {episodes.length > 0 && (
              <div className="pt-2">
                <button
                  onClick={() => onNavigate('watch', episodes[0].episodeId)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition shadow-lg shadow-red-600/30 cursor-pointer active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Watching S1 · Ep 1</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Seasons & Episodes Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232838] pb-4">
          <h2 className="text-xl md:text-2xl font-bold text-white font-['Syne']">
            Available Episodes
          </h2>

          {/* Interactive Season Selector Tabs */}
          {seasons.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {seasons.map((s, idx) => {
                const isActive = selectedSeason?.seasonId === s.seasonId;
                return (
                  <button
                    key={`${s.seasonId}-${idx}`}
                    onClick={() => setSelectedSeason(s)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                        : 'bg-slate-800/60 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                    }`}
                  >
                    {s.seasonName}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Episodes Grid */}
        {loadingEpisodes ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading episodes for {selectedSeason?.seasonName}...</p>
          </div>
        ) : episodes.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <Info className="w-8 h-8 mx-auto opacity-30 text-slate-400" />
            <p className="text-sm">No episodes found for this season.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {episodes.map((ep, idx) => (
              <div
                key={`${ep.episodeId}-${idx}`}
                onClick={() => onNavigate('watch', ep.episodeId)}
                role="button"
                tabIndex={0}
                className="flex gap-4 p-3.5 rounded-2xl bg-[#11141e] hover:bg-[#161a28] border border-[#232838] hover:border-red-500/40 transition-all cursor-pointer group shadow-sm"
              >
                {/* Thumbnail */}
                <div className="relative w-32 aspect-video rounded-xl overflow-hidden bg-slate-900 shrink-0">
                  {ep.image ? (
                    <img
                      src={ep.image}
                      alt={ep.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <Play className="w-5 h-5" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg">
                      <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <span className="text-[11px] font-bold text-red-400 uppercase tracking-wide">
                      {ep.episodeNumber || `Ep ${idx + 1}`}
                    </span>
                    <h3 className="text-sm font-bold text-slate-200 truncate group-hover:text-red-400 transition-colors mt-0.5">
                      {ep.title}
                    </h3>
                    {ep.overview && (
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-normal">
                        {ep.overview}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2">
                    <span>{ep.airDate || 'Ready'}</span>
                    <span className="text-red-400 font-semibold group-hover:underline">Watch &rarr;</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
