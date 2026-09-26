import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  RotateCcw,
  Volume2,
  Tv,
  Star,
  Clock,
  ArrowLeft,
  Maximize2
} from 'lucide-react';
import { StreamData, WatchHistoryItem } from '../types';

interface WatchPageProps {
  id: string;
  isMovie?: boolean;
  onNavigate: (tab: string, param?: string) => void;
  onAddToHistory: (item: WatchHistoryItem) => void;
}

export const WatchPage: React.FC<WatchPageProps> = ({
  id,
  isMovie = false,
  onNavigate,
  onAddToHistory
}) => {
  const [data, setData] = useState<StreamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStreamUrl, setActiveStreamUrl] = useState<string>('');
  const [selectedAudio, setSelectedAudio] = useState<string>('Hindi');
  const [theaterMode, setTheaterMode] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchStream() {
      setLoading(true);
      setError(null);
      try {
        const param = isMovie ? `movieId=${id}` : `episodeId=${id}`;
        const res = await fetch(`/api/anime-world-india/v1/stream?${param}`);
        const json: StreamData = await res.json();

        if (!isMounted) return;

        if (json.success && json.stream) {
          setData(json);

          // Find default stream url
          const initialUrl = json.stream.streamLink || (json.stream.servers[0]?.url ?? '');
          setActiveStreamUrl(initialUrl);

          // Save to watch history
          const title = json.series?.title || json.movie?.title || id.replace(/-/g, ' ');
          const poster = json.series?.poster || json.movie?.poster || '';
          const epNum = json.current?.episodeId?.split('x')[1] ? `Episode ${json.current.episodeId.split('x')[1]}` : undefined;

          onAddToHistory({
            id,
            title,
            type: isMovie ? 'movie' : 'series',
            episodeTitle: json.current?.title,
            episodeNumber: epNum,
            poster,
            timestamp: Date.now()
          });
        } else {
          throw new Error('Streaming source unavailable');
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to load video stream');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchStream();
    return () => {
      isMounted = false;
    };
  }, [id, isMovie]);

  const handleAudioChange = (track: { language: string; url: string }) => {
    setSelectedAudio(track.language);
    setActiveStreamUrl(track.url);
  };

  const handleServerChange = (url: string) => {
    setActiveStreamUrl(url);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium animate-pulse">
          Connecting to stream servers and audio tracks...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 text-center px-4">
        <div className="p-4 rounded-full bg-red-950/40 border border-red-800 text-red-400">
          <RotateCcw className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Stream Currently Unavailable</h2>
        <p className="text-sm text-slate-400 max-w-md">
          {error || 'The video provider could not be reached. Try switching servers or choosing another title.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { series, movie, current, stream, episodes = [], previous, next } = data;
  const currentTitle = movie?.title || current?.title || id.replace(/-/g, ' ');
  const parentSeriesTitle = series?.title || '';
  const cleanRating = (movie?.rating || series?.rating || '8.5').replace(/TMDB\s*/i, '');

  return (
    <div className={`space-y-8 animate-fade-in ${theaterMode ? 'max-w-full' : 'max-w-7xl'} mx-auto`}>
      {/* Top back & title breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (parentSeriesTitle && !isMovie) {
              const seriesSlug = id.split('-').slice(0, -1).join('-');
              onNavigate('series-detail', seriesSlug);
            } else {
              onNavigate(isMovie ? 'movies' : 'series');
            }
          }}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {parentSeriesTitle ? parentSeriesTitle : isMovie ? 'Movies' : 'Series'}</span>
        </button>

        <button
          onClick={() => setTheaterMode(!theaterMode)}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-xs text-slate-300 transition cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>{theaterMode ? 'Default View' : 'Theater Mode'}</span>
        </button>
      </div>

      {/* Main Grid: Player on left, episode list on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Player, Audio Dub Selectors, Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Responsive Video Container */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-[#232838] shadow-2xl shadow-black/80">
            {activeStreamUrl ? (
              <iframe
                src={activeStreamUrl}
                title={currentTitle}
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                className="w-full h-full border-0"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">
                No active stream loaded
              </div>
            )}
          </div>

          {/* Episode Controls Bar */}
          {!isMovie && (
            <div className="flex items-center justify-between gap-3 bg-[#11141e] p-3 rounded-xl border border-[#232838]">
              {previous ? (
                <button
                  onClick={() => onNavigate('watch', previous)}
                  className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
              ) : (
                <div className="flex-1 py-2 px-3 rounded-lg bg-slate-900/40 text-xs text-slate-600 flex items-center justify-center gap-1.5 cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </div>
              )}

              <div className="px-4 py-1.5 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider text-center">
                {id.split('x')[1] ? `Episode ${id.split('x')[1]}` : 'Now Playing'}
              </div>

              {next ? (
                <button
                  onClick={() => onNavigate('watch', next)}
                  className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex-1 py-2 px-3 rounded-lg bg-slate-900/40 text-xs text-slate-600 flex items-center justify-center gap-1.5 cursor-not-allowed">
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              )}
            </div>
          )}

          {/* Audio Dub Language Selectors */}
          {stream.audioTracks && stream.audioTracks.length > 0 && (
            <div className="bg-[#11141e] p-4 rounded-xl border border-[#232838] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                  <Volume2 className="w-4 h-4 text-red-500" />
                  <span>Available Audio Tracks (Select Language)</span>
                </div>
                <span className="text-[11px] text-slate-500">Instant Switch</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {stream.audioTracks.map((track, idx) => {
                  const isActive = track.url === activeStreamUrl || selectedAudio === track.language;
                  return (
                    <button
                      key={`${track.language}-${idx}`}
                      onClick={() => handleAudioChange(track)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        isActive
                          ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                          : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                      }`}
                    >
                      <span>{track.language}</span>
                      {track.code && (
                        <span className="text-[10px] opacity-75 font-mono">({track.code.toUpperCase()})</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Alternative Stream Servers */}
          {stream.servers && stream.servers.length > 1 && (
            <div className="bg-[#11141e] p-4 rounded-xl border border-[#232838] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                <div className="flex items-center gap-2">
                  <Tv className="w-4 h-4 text-red-500" />
                  <span>Streaming Servers</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {stream.servers.map((srv, idx) => {
                  const isActive = srv.url === activeStreamUrl;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleServerChange(srv.url)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                        isActive
                          ? 'bg-slate-700 text-white border border-slate-500'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {srv.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Metadata & Synopsis Details (Zero-Pill Discipline) */}
          <div className="bg-[#11141e] p-6 rounded-2xl border border-[#232838] space-y-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white font-['Syne']">
                {currentTitle}
              </h1>

              {/* Unboxed Metadata with Typographic Separators */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-2">
                {parentSeriesTitle && (
                  <>
                    <span className="text-red-400 font-semibold">{parentSeriesTitle}</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                  </>
                )}
                {series?.season && (
                  <>
                    <span>{series.season}</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                  </>
                )}
                <span className="flex items-center gap-1 text-amber-300 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  <span className="tabular-nums">{cleanRating}</span>
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{movie?.duration || series?.duration || '24 min'}</span>
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>Hindi Dubbed & Multi-Audio</span>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              {current?.overview || movie?.description || series?.description || 'Enjoy seamless anime streaming with multi-audio dubbed tracks.'}
            </p>
          </div>
        </div>

        {/* Right Column: Up Next Episodes Sidebar */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white font-['Syne'] flex items-center justify-between px-1">
            <span>{isMovie ? 'Recommended Anime' : 'Episodes in this Series'}</span>
            <span className="text-xs text-slate-500 font-normal">
              {episodes.length} available
            </span>
          </h3>

          <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
            {episodes.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-[#232838] rounded-xl">
                No next episodes listed.
              </div>
            ) : (
              episodes.map((ep) => {
                const isActive = ep.episodeId === id;
                return (
                  <div
                    key={ep.episodeId}
                    onClick={() => onNavigate('watch', ep.episodeId)}
                    role="button"
                    tabIndex={0}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer group ${
                      isActive
                        ? 'bg-red-950/30 border-red-500/60 shadow-md'
                        : 'bg-[#11141e] border-[#232838] hover:bg-[#181d2a]'
                    }`}
                  >
                    <div className="relative w-24 aspect-[16/10] rounded-lg overflow-hidden bg-slate-900 shrink-0">
                      {ep.image ? (
                        <img
                          src={ep.image}
                          alt={ep.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <Play className="w-4 h-4" />
                        </div>
                      )}
                      {isActive && (
                        <div className="absolute inset-0 bg-red-600/40 flex items-center justify-center">
                          <Play className="w-4 h-4 fill-white text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 block">
                        {ep.episodeNumber || 'Episode'}
                      </span>
                      <h4 className="text-xs font-semibold text-slate-200 truncate group-hover:text-red-400 transition-colors">
                        {ep.title}
                      </h4>
                      {ep.airDate && (
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {ep.airDate}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
