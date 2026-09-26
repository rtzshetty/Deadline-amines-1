/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { AnimeCard } from './components/AnimeCard';
import { SearchModal } from './components/SearchModal';
import { WatchHistoryDrawer } from './components/WatchHistoryDrawer';
import { ApiExplorerModal } from './components/ApiExplorerModal';
import { Footer } from './components/Footer';
import { WatchPage } from './pages/WatchPage';
import { SeriesPage } from './pages/SeriesPage';
import { CatalogPage } from './pages/CatalogPage';
import { A2ZPage } from './pages/A2ZPage';
import { AnimeItem, WatchHistoryItem, HomeData, SyncStatus } from './types';
import {
  Sparkles,
  ArrowRight,
  Terminal,
  Volume2,
  RefreshCw,
  TrendingUp,
  Flame,
  CheckCircle2,
  Tv,
  Film
} from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [activeId, setActiveId] = useState<string>('');
  const [isMovieMode, setIsMovieMode] = useState<boolean>(false);

  // Home data
  const [homeData, setHomeData] = useState<HomeData>({
    success: true,
    source: 'animeworld-india.me',
    latest_series: [],
    latest_movies: [],
    newest_drops: [],
    new_anime_arrivals: [],
    cartoon_series: [],
    cartoon_films: [],
    top_shows: [],
    top_films: [],
    featured: [],
    all_synced: []
  });
  const [loadingHome, setLoadingHome] = useState(true);

  // Sync Manager State
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    lastSynced: 0,
    lastSyncedFormatted: '',
    totalSyncedCount: 0,
    seriesCount: 0,
    moviesCount: 0,
    sections: {
      newestDropsCount: 0,
      newArrivalsCount: 0,
      topShowsCount: 0,
      topFilmsCount: 0,
      latestMoviesCount: 0,
      cartoonSeriesCount: 0,
      cartoonFilmsCount: 0,
      catalogCount: 0
    }
  });
  const [syncNotification, setSyncNotification] = useState<string | null>(null);

  // Active home shelf category tab filter
  const [activeShelfCategory, setActiveShelfCategory] = useState<string>('all');

  // Modals & Drawers
  const [searchOpen, setSearchOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [apiDocsOpen, setApiDocsOpen] = useState(false);

  // Watch history in localStorage
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('animeworld_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addToHistory = (item: WatchHistoryItem) => {
    setWatchHistory((prev) => {
      const filtered = prev.filter((p) => p.id !== item.id);
      const updated = [item, ...filtered].slice(0, 30);
      try {
        localStorage.setItem('animeworld_history', JSON.stringify(updated));
      } catch (e) {
        // ignore quota
      }
      return updated;
    });
  };

  const clearHistory = () => {
    setWatchHistory([]);
    try {
      localStorage.removeItem('animeworld_history');
    } catch (e) {
      // ignore
    }
  };

  // Sync hash routing
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      if (!hash) {
        setCurrentTab('home');
        return;
      }
      const [route, ...rest] = hash.split('/');
      const param = rest.join('/');

      if (route === 'watch') {
        setCurrentTab('watch');
        setActiveId(param);
        setIsMovieMode(false);
      } else if (route === 'watch-movie') {
        setCurrentTab('watch');
        setActiveId(param);
        setIsMovieMode(true);
      } else if (route === 'series-detail') {
        setCurrentTab('series-detail');
        setActiveId(param);
      } else if (route === 'series') {
        setCurrentTab('series');
      } else if (route === 'movies') {
        setCurrentTab('movies');
      } else if (route === 'a2z') {
        setCurrentTab('a2z');
      } else {
        setCurrentTab('home');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Fetch Home & Sync Status
  const loadHomeAndStatus = async () => {
    try {
      const [homeRes, statusRes] = await Promise.all([
        fetch('/api/anime-world-india/v1/home'),
        fetch('/api/anime-world-india/v1/sync-status')
      ]);

      const [homeJson, statusJson] = await Promise.all([
        homeRes.json(),
        statusRes.json()
      ]);

      if (homeJson.success) {
        setHomeData(homeJson);
      }
      if (statusJson) {
        setSyncStatus(statusJson);
      }
    } catch (err) {
      console.error('Failed to load anime data:', err);
    } finally {
      setLoadingHome(false);
    }
  };

  useEffect(() => {
    loadHomeAndStatus();
  }, []);

  // Trigger on-demand sync of more anime
  const handleTriggerSync = async () => {
    setSyncStatus((prev) => ({ ...prev, isSyncing: true }));
    setSyncNotification('Synchronizing more anime from AnimeWorld India...');

    try {
      const res = await fetch('/api/anime-world-india/v1/sync?force=true');
      const data = await res.json();
      if (data.success) {
        setSyncNotification(`Synced successfully! ${data.total_synced_count} anime loaded.`);
        await loadHomeAndStatus();
        setTimeout(() => setSyncNotification(null), 4000);
      }
    } catch (e: any) {
      setSyncNotification('Sync completed with local cached catalog.');
      setTimeout(() => setSyncNotification(null), 3000);
    } finally {
      setSyncStatus((prev) => ({ ...prev, isSyncing: false }));
    }
  };

  const navigateTo = (tab: string, param?: string) => {
    if (tab === 'home') {
      window.location.hash = '';
      setCurrentTab('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'series') {
      window.location.hash = 'series';
      setCurrentTab('series');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'movies') {
      window.location.hash = 'movies';
      setCurrentTab('movies');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'a2z') {
      window.location.hash = 'a2z';
      setCurrentTab('a2z');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'series-detail' && param) {
      window.location.hash = `series-detail/${param}`;
      setCurrentTab('series-detail');
      setActiveId(param);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'watch' && param) {
      window.location.hash = `watch/${param}`;
      setCurrentTab('watch');
      setActiveId(param);
      setIsMovieMode(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'watch-movie' && param) {
      window.location.hash = `watch-movie/${param}`;
      setCurrentTab('watch');
      setActiveId(param);
      setIsMovieMode(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectAnime = (item: AnimeItem) => {
    const isMovie = item.type === 'movie' || Boolean(item.movieId);
    const id = item.movieId || item.seriesId || item.slug || '';

    if (isMovie) {
      navigateTo('watch-movie', id);
    } else {
      navigateTo('series-detail', id);
    }
  };

  const handleDirectWatch = (item: AnimeItem) => {
    const isMovie = item.type === 'movie' || Boolean(item.movieId);
    const id = item.movieId || item.seriesId || item.slug || '';

    if (isMovie) {
      navigateTo('watch-movie', id);
    } else {
      navigateTo('watch', `${id}-1x1`);
    }
  };

  // Top trending combined list
  const trendingList = [
    ...(homeData.top_shows || []),
    ...(homeData.top_films || [])
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0c10] text-[#e2e8f0]">
      {/* Universal Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onNavigate={navigateTo}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenApiDocs={() => setApiDocsOpen(true)}
        historyCount={watchHistory.length}
        onSyncAnime={handleTriggerSync}
        isSyncing={syncStatus.isSyncing}
        syncedCount={syncStatus.totalSyncedCount}
      />

      {/* Sync Alert / Toast */}
      {syncNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161a27] border border-red-500/40 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in backdrop-blur-md">
          {syncStatus.isSyncing ? (
            <RefreshCw className="w-4 h-4 text-red-400 animate-spin shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs font-medium text-slate-200">{syncNotification}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB 1: HOME */}
        {currentTab === 'home' && (
          <div className="space-y-12 animate-fade-in">
            {/* Live Sync Engine Status Banner */}
            <div className="bg-[#11141e] border border-[#222634] p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-['Syne']">
                      AnimeWorld India Sync Engine Active
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 font-bold border border-red-500/30">
                      {syncStatus.totalSyncedCount > 0 ? `${syncStatus.totalSyncedCount}+ Titles Synced` : '120+ Titles Synced'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Multi-page crawler continuously syncing episodes, Hindi dubs, movies, and season catalogs.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleTriggerSync}
                  disabled={syncStatus.isSyncing}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-red-600/20 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
                  <span>{syncStatus.isSyncing ? 'Syncing...' : 'Sync More Anime'}</span>
                </button>
              </div>
            </div>

            {/* Hero Banner Showcase */}
            <HeroBanner
              items={homeData.featured.length > 0 ? homeData.featured : homeData.latest_series}
              onSelect={handleSelectAnime}
              onWatchDirect={handleDirectWatch}
            />

            {/* Multi-Audio & Dub Features Strip */}
            <div className="bg-[#11141e] border border-[#222634] p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-['Syne']">
                    Multi-Language Streaming Support
                  </h3>
                  <p className="text-xs text-slate-400">
                    Switch seamlessly between Hindi, Tamil, Telugu, Malayalam, Bengali &amp; English dubs.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {['Hindi Dubbed', 'Tamil Audio', 'Telugu Dub', 'Malayalam', 'Bengali', 'English Sub/Dub'].map(
                  (lang) => (
                    <span
                      key={lang}
                      className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60"
                    >
                      {lang}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Shelf Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#222634]">
              {[
                { id: 'all', label: 'All Shelves' },
                { id: 'newest', label: `Newest Drops (${homeData.newest_drops?.length || 20})` },
                { id: 'arrivals', label: `New Arrivals (${homeData.new_anime_arrivals?.length || 19})` },
                { id: 'trending', label: `Top 10 Trending (${trendingList.length})` },
                { id: 'movies', label: `Anime Movies (${homeData.latest_movies?.length || 19})` },
                { id: 'cartoons', label: `Cartoon Series (${homeData.cartoon_series?.length || 19})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveShelfCategory(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeShelfCategory === tab.id
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                      : 'bg-slate-800/60 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* SHELF 1: NEWEST DROPS (Latest Updated Episodes) */}
            {(activeShelfCategory === 'all' || activeShelfCategory === 'newest') && (
              <section className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-red-600 rounded-full" />
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-white font-['Syne'] flex items-center gap-2">
                        <Flame className="w-5 h-5 text-red-500 fill-red-500" />
                        <span>Newest Drops (Recently Updated)</span>
                      </h2>
                      <p className="text-xs text-slate-400">Fresh episode releases synced from AnimeWorld India</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigateTo('series')}
                    className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1 transition cursor-pointer"
                  >
                    <span>View All Series</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {loadingHome ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="aspect-[2/3] rounded-xl bg-slate-900 animate-pulse border border-slate-800" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
                    {(homeData.newest_drops || homeData.latest_series).slice(0, 12).map((item, idx) => (
                      <AnimeCard
                        key={`${item.seriesId || item.title}-${idx}`}
                        item={item}
                        onClick={() => handleSelectAnime(item)}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* SHELF 2: TOP 10 TRENDING (Shows & Movies) */}
            {(activeShelfCategory === 'all' || activeShelfCategory === 'trending') && trendingList.length > 0 && (
              <section className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-white font-['Syne'] flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-amber-400" />
                        <span>Top 10 Most-Watched &amp; Trending</span>
                      </h2>
                      <p className="text-xs text-slate-400">Most streamed anime titles this week</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                  {trendingList.slice(0, 10).map((item, idx) => (
                    <div key={`${item.slug || item.title}-${idx}`} className="relative">
                      {/* Rank Number Badge */}
                      <div className="absolute -top-3 -left-2 z-20 w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-red-600 flex items-center justify-center text-white font-black font-['Syne'] text-sm shadow-xl border border-white/20">
                        {idx + 1}
                      </div>
                      <AnimeCard
                        item={item}
                        showType
                        onClick={() => handleSelectAnime(item)}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* SHELF 3: NEW ANIME ARRIVALS */}
            {(activeShelfCategory === 'all' || activeShelfCategory === 'arrivals') && (
              <section className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-red-600 rounded-full" />
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-white font-['Syne'] flex items-center gap-2">
                        <Tv className="w-5 h-5 text-red-500" />
                        <span>New Anime Arrivals</span>
                      </h2>
                      <p className="text-xs text-slate-400">Newly added anime series in high definition</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigateTo('series')}
                    className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1 transition cursor-pointer"
                  >
                    <span>More Series</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
                  {(homeData.new_anime_arrivals || homeData.latest_series).slice(0, 12).map((item, idx) => (
                    <AnimeCard
                      key={`${item.seriesId || item.title}-${idx}`}
                      item={item}
                      onClick={() => handleSelectAnime(item)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* SHELF 4: LATEST ANIME MOVIES */}
            {(activeShelfCategory === 'all' || activeShelfCategory === 'movies') && (
              <section className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-red-600 rounded-full" />
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-white font-['Syne'] flex items-center gap-2">
                        <Film className="w-5 h-5 text-red-500" />
                        <span>Latest Anime Movies</span>
                      </h2>
                      <p className="text-xs text-slate-400">Full-length anime feature films with multi-audio dubs</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigateTo('movies')}
                    className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1 transition cursor-pointer"
                  >
                    <span>View All Movies</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
                  {(homeData.latest_movies || []).slice(0, 12).map((item, idx) => (
                    <AnimeCard
                      key={`${item.movieId || item.title}-${idx}`}
                      item={item}
                      showType
                      onClick={() => handleSelectAnime(item)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* SHELF 5: JUST IN - CARTOON SERIES (Shinchan, Doraemon, Pokemon, Ben 10) */}
            {(activeShelfCategory === 'all' || activeShelfCategory === 'cartoons') && (homeData.cartoon_series || []).length > 0 && (
              <section className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-white font-['Syne']">
                        Just In: Hindi Cartoon &amp; Animation Series
                      </h2>
                      <p className="text-xs text-slate-400">Nostalgic hits including Shinchan, Doraemon, Pokemon &amp; Beyblade</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
                  {(homeData.cartoon_series || []).slice(0, 12).map((item, idx) => (
                    <AnimeCard
                      key={`${item.seriesId || item.title}-${idx}`}
                      item={item}
                      onClick={() => handleSelectAnime(item)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* SHELF 6: FRESH CARTOON FILMS */}
            {(activeShelfCategory === 'all' || activeShelfCategory === 'cartoons') && (homeData.cartoon_films || []).length > 0 && (
              <section className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-white font-['Syne']">
                        Fresh Cartoon Films
                      </h2>
                      <p className="text-xs text-slate-400">Feature animated movies in Hindi &amp; regional languages</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
                  {(homeData.cartoon_films || []).slice(0, 12).map((item, idx) => (
                    <AnimeCard
                      key={`${item.movieId || item.title}-${idx}`}
                      item={item}
                      showType
                      onClick={() => handleSelectAnime(item)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* API Explorer Promotion Banner */}
            <div className="bg-gradient-to-r from-red-950/40 via-[#11141e] to-[#0c0d14] border border-red-900/30 p-6 md:p-8 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider">
                  <Terminal className="w-4 h-4" />
                  <span>Developer API Available</span>
                </div>
                <h3 className="text-xl md:text-2xl font-black text-white font-['Syne']">
                  AnimeWorld India Streaming API v1
                </h3>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                  Integrate {syncStatus.totalSyncedCount || '150+'}+ anime series, movies, season episodes, and multi-audio streaming links into your own applications with full CORS and JSON compatibility.
                </p>
              </div>

              <button
                onClick={() => setApiDocsOpen(true)}
                className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-red-600/30 cursor-pointer whitespace-nowrap active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Open API Interactive Explorer</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: SERIES CATALOG */}
        {currentTab === 'series' && (
          <CatalogPage
            type="series"
            onNavigate={navigateTo}
            onSelectAnime={handleSelectAnime}
          />
        )}

        {/* TAB 3: MOVIES CATALOG */}
        {currentTab === 'movies' && (
          <CatalogPage
            type="movies"
            onNavigate={navigateTo}
            onSelectAnime={handleSelectAnime}
          />
        )}

        {/* TAB 4: A-Z DIRECTORY */}
        {currentTab === 'a2z' && (
          <A2ZPage onNavigate={navigateTo} onSelectAnime={handleSelectAnime} />
        )}

        {/* TAB 5: SERIES DETAILS */}
        {currentTab === 'series-detail' && (
          <SeriesPage seriesId={activeId} onNavigate={navigateTo} />
        )}

        {/* TAB 6: WATCH STREAM PLAYER */}
        {currentTab === 'watch' && (
          <WatchPage
            id={activeId}
            isMovie={isMovieMode}
            onNavigate={navigateTo}
            onAddToHistory={addToHistory}
          />
        )}
      </main>

      {/* Universal Search Modal */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={handleSelectAnime}
      />

      {/* Watch History Drawer */}
      <WatchHistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={watchHistory}
        onSelect={(item) => {
          if (item.type === 'movie') {
            navigateTo('watch-movie', item.id);
          } else {
            navigateTo('watch', item.id);
          }
        }}
        onClear={clearHistory}
      />

      {/* Interactive API Explorer Modal */}
      <ApiExplorerModal
        isOpen={apiDocsOpen}
        onClose={() => setApiDocsOpen(false)}
      />

      {/* Footer */}
      <Footer onNavigate={navigateTo} onOpenApiDocs={() => setApiDocsOpen(true)} />
    </div>
  );
}
