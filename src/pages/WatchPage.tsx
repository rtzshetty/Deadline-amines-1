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
  Maximize2,
  Crown,
  Lock,
  Sparkles,
  CreditCard,
  Shield,
  Check
} from 'lucide-react';
import { StreamData, WatchHistoryItem, UserProfile } from '../types';

interface WatchPageProps {
  id: string;
  isMovie?: boolean;
  onNavigate: (tab: string, param?: string) => void;
  onAddToHistory: (item: WatchHistoryItem) => void;
  currentUser?: UserProfile | null;
  onOpenPricing?: () => void;
  onOpenAuth?: () => void;
}

function getSafeStreamUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('/api/anime-world-india/v1/player')) return url;
  if (url.includes('abyssplayer.com') || url.includes('dub-player') || url.includes('zephyrix') || url.startsWith('http')) {
    return `/api/anime-world-india/v1/player?url=${encodeURIComponent(url)}`;
  }
  return url;
}

export const WatchPage: React.FC<WatchPageProps> = ({
  id,
  isMovie = false,
  onNavigate,
  onAddToHistory,
  currentUser = null,
  onOpenPricing,
  onOpenAuth
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
        const userEmailParam = currentUser?.email ? `&userEmail=${encodeURIComponent(currentUser.email)}` : '';
        const res = await fetch(`/api/anime-world-india/v1/stream?${param}${userEmailParam}`, {
          headers: {
            'x-user-email': currentUser?.email || ''
          }
        });
        const json: StreamData = await res.json();

        if (!isMounted) return;

        if (json.success) {
          setData(json);

          // If not locked, find default stream url and route through player shield
          if (!json.isPremiumLocked && json.stream) {
            const initialUrl = json.stream.streamLink || (json.stream.servers[0]?.url ?? '');
            setActiveStreamUrl(getSafeStreamUrl(initialUrl));
          }

          // Save to watch history
          const title = json.series?.title || json.movie?.title || id.replace(/-/g, ' ');
          const poster = json.series?.poster || json.movie?.poster || '';
          const epNum = json.current?.episodeId?.split('x')[1]
            ? `Episode ${json.current.episodeId.split('x')[1]}`
            : undefined;

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
  }, [id, isMovie, currentUser?.email, currentUser?.isPremium]);

  const handleAudioChange = (track: { language: string; url: string }) => {
    setSelectedAudio(track.language);
    setActiveStreamUrl(getSafeStreamUrl(track.url));
  };

  const handleServerChange = (url: string) => {
    setActiveStreamUrl(getSafeStreamUrl(url));
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

  const { series, movie, current, stream, episodes = [], previous, next, isPremiumLocked } = data;
  const currentTitle = movie?.title || current?.title || id.replace(/-/g, ' ');
  const parentSeriesTitle = series?.title || '';
  const cleanRating = (movie?.rating || series?.rating || '8.5').replace(/TMDB\s*/i, '');
  const backdropPoster = movie?.poster || series?.poster || '';

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
        {/* Left Column: Player or VIP Lock Screen */}
        <div className="lg:col-span-2 space-y-6">
          {/* Responsive Video Container */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-[#232838] shadow-2xl shadow-black/80">
            {isPremiumLocked ? (
              /* VIP Paywall Overlay */
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#131722]/95 via-[#0e1017]/95 to-[#090b10] backdrop-blur-md">
                {backdropPoster && (
                  <div className="absolute inset-0 opacity-15 overflow-hidden pointer-events-none">
                    <img src={backdropPoster} alt="Background" className="w-full h-full object-cover blur-md" />
                  </div>
                )}

                <div className="relative z-10 max-w-lg space-y-4 animate-fade-in">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                    <Crown className="w-8 h-8 fill-amber-400" />
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
                      VIP Premium Locked Title
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white font-['Syne']">
                      {currentTitle}
                    </h3>
                    <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                      This anime is designated as VIP Premium by the admin. Subscribe to any plan via FamGateway to unlock full HD multi-audio streaming instantly.
                    </p>
                  </div>

                  {/* 3 Quick Plans Preview */}
                  <div className="grid grid-cols-3 gap-2.5 pt-2">
                    <div className="p-2.5 rounded-xl bg-[#141824] border border-slate-800 text-left">
                      <span className="text-[9px] text-red-400 font-bold uppercase block">Fan Pass</span>
                      <div className="text-sm font-black text-white">₹149</div>
                      <span className="text-[10px] text-slate-400">30 Days</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#141824] border border-slate-800 text-left">
                      <span className="text-[9px] text-red-400 font-bold uppercase block">VIP Otaku</span>
                      <div className="text-sm font-black text-white">₹149</div>
                      <span className="text-[10px] text-slate-400">4K & 2 Dev</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-left">
                      <span className="text-[9px] text-amber-400 font-bold uppercase block">Yearly Pass</span>
                      <div className="text-sm font-black text-amber-300">₹600</div>
                      <span className="text-[10px] text-amber-200">365 Days</span>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    {onOpenPricing && (
                      <button
                        onClick={onOpenPricing}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Unlock with FamGateway (₹149)</span>
                      </button>
                    )}

                    {onOpenAuth && (
                      <button
                        onClick={onOpenAuth}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition cursor-pointer"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Sign In / Admin Access</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : activeStreamUrl ? (
              <iframe
                key={activeStreamUrl}
                src={getSafeStreamUrl(activeStreamUrl)}
                title={currentTitle}
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                className="w-full h-full border-0"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">
                No active stream loaded
              </div>
            )}
          </div>

          {/* Episode Controls Bar */}
          {!isMovie && !isPremiumLocked && (
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
          {!isPremiumLocked && stream?.audioTracks && stream.audioTracks.length > 0 && (
            <div className="bg-[#11141e] p-4 rounded-xl border border-[#232838] space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <Volume2 className="w-4 h-4 text-red-500" />
                <span>Audio Tracks & Dubbing:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {stream.audioTracks.map((track, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAudioChange(track)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      selectedAudio === track.language
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                        : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>{track.language}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Servers Switcher */}
          {!isPremiumLocked && stream?.servers && stream.servers.length > 0 && (
            <div className="bg-[#11141e] p-4 rounded-xl border border-[#232838] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Switch Stream Server ({stream.servers.length}):</span>
                <span className="text-[10px] text-emerald-400 font-medium">Multi-Server Active</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {stream.servers.map((server, idx) => {
                  const isActive = activeStreamUrl === server.url || decodeURIComponent(activeStreamUrl) === decodeURIComponent(server.url);
                  return (
                    <button
                      key={idx}
                      onClick={() => handleServerChange(server.url)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-red-600 text-white shadow-md shadow-red-600/30 border border-red-500'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                      }`}
                    >
                      <span>📺</span>
                      <span>{server.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Episode / Movie Info */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
              {parentSeriesTitle && (
                <span className="font-bold text-red-400 text-sm">{parentSeriesTitle}</span>
              )}
              {cleanRating && (
                <div className="flex items-center gap-1 font-bold text-amber-300">
                  <Star className="w-3.5 h-3.5 fill-amber-300" />
                  <span>TMDB {cleanRating}</span>
                </div>
              )}
              {isPremiumLocked && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1">
                  <Crown className="w-3 h-3" /> VIP Premium
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white font-['Syne']">
              {currentTitle}
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-3xl">
              {current?.overview || movie?.description || series?.description || 'Watch full high definition anime streaming with multi-audio servers.'}
            </p>
          </div>
        </div>

        {/* Right Column: Up Next / Season Episodes */}
        <div className="space-y-4 bg-[#11141e] p-4 sm:p-5 rounded-2xl border border-[#232838]">
          <div className="flex items-center justify-between pb-3 border-b border-[#232838]">
            <div className="flex items-center gap-2">
              <Tv className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-bold text-white font-['Syne']">
                {isMovie ? 'Related Features' : 'Season Episodes'}
              </h3>
            </div>
            <span className="text-xs text-slate-500">{episodes.length} Available</span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {episodes.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No other episodes indexed.</p>
            ) : (
              episodes.map((ep) => {
                const isActive = ep.episodeId === id;
                return (
                  <button
                    key={ep.episodeId}
                    onClick={() => onNavigate(isMovie ? 'watch-movie' : 'watch', ep.episodeId)}
                    className={`w-full p-2 rounded-xl text-left flex items-center gap-3 transition cursor-pointer ${
                      isActive
                        ? 'bg-red-600/20 border border-red-500/40 text-white'
                        : 'hover:bg-slate-800/60 border border-transparent text-slate-300'
                    }`}
                  >
                    <div className="relative w-16 aspect-video rounded-lg overflow-hidden bg-slate-900 shrink-0">
                      {ep.image ? (
                        <img src={ep.image} alt={ep.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700">
                          <Play className="w-4 h-4" />
                        </div>
                      )}
                      {isActive && (
                        <div className="absolute inset-0 bg-red-600/60 flex items-center justify-center">
                          <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-red-400">
                          {ep.episodeNumber || 'Episode'}
                        </span>
                        {ep.isPremium && (
                          <span className="text-[9px] font-bold text-amber-400 flex items-center gap-0.5">
                            <Crown className="w-2.5 h-2.5" /> VIP
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-200 truncate mt-0.5">
                        {ep.title}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
