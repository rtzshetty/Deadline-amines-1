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
import { AdminPanelModal } from './components/AdminPanelModal';
import { AuthModal } from './components/AuthModal';
import { PricingModal } from './components/PricingModal';
import { Footer } from './components/Footer';
import { WatchPage } from './pages/WatchPage';
import { SeriesPage } from './pages/SeriesPage';
import { CatalogPage } from './pages/CatalogPage';
import { A2ZPage } from './pages/A2ZPage';
import { AnimeItem, WatchHistoryItem, HomeData, SyncStatus, UserProfile } from './types';
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
  Film,
  Crown,
  Shield,
  CreditCard
} from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [activeId, setActiveId] = useState<string>('');
  const [isMovieMode, setIsMovieMode] = useState<boolean>(false);

  // App & Brand Name
  const [appName, setAppName] = useState<string>('Deadline Amines');

  // User Profile & Authentication
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('animeworld_user_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

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
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);

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

  const navigateTo = (tab: string, param?: string) => {
    if (param) {
      window.location.hash = `#${tab}/${param}`;
    } else {
      window.location.hash = `#${tab}`;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch Admin config to get App Name & status
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/admin/config');
        const data = await res.json();
        if (data.appName) {
          setAppName(data.appName);
          document.title = `${data.appName} - Multi-Audio Streaming & Premium Passes`;
        }
      } catch (e) {
        console.warn('Failed to load admin config:', e);
      }
    }
    loadConfig();
  }, []);

  // Verify and sync current user status
  useEffect(() => {
    async function checkUserStatus() {
      if (!currentUser?.email) return;
      try {
        const res = await fetch(`/api/user/status?email=${encodeURIComponent(currentUser.email)}`);
        const data = await res.json();
        if (data && (data.isPremium !== currentUser.isPremium || data.isAdmin !== currentUser.isAdmin)) {
          const updatedUser: UserProfile = {
            ...currentUser,
            isPremium: Boolean(data.isPremium),
            isAdmin: Boolean(data.isAdmin),
            plan: data.plan || currentUser.plan,
            expiresAt: data.expiresAt || currentUser.expiresAt
          };
          setCurrentUser(updatedUser);
          localStorage.setItem('animeworld_user_session', JSON.stringify(updatedUser));
        }
      } catch (err) {
        console.warn('User status sync error:', err);
      }
    }
    checkUserStatus();
  }, [currentUser?.email]);

  const handleLogin = async (email: string, name?: string, picture?: string) => {
    const cleanEmail = email.toLowerCase().trim();
    const isAdmin = cleanEmail === 'prithvirajshetty769@gmail.com';
    let isPremium = isAdmin;
    let plan = isAdmin ? 'Admin Lifetime Pass' : undefined;
    let expiresAt = isAdmin ? 253402300799000 : undefined;

    try {
      const res = await fetch(`/api/user/status?email=${encodeURIComponent(cleanEmail)}`);
      const data = await res.json();
      if (data) {
        if (data.isPremium !== undefined) isPremium = Boolean(data.isPremium);
        if (data.plan) plan = data.plan;
        if (data.expiresAt) expiresAt = data.expiresAt;
      }
    } catch (e) {
      console.warn(e);
    }

    const newUser: UserProfile = {
      email: cleanEmail,
      name: name || cleanEmail.split('@')[0],
      picture: picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`,
      isAdmin,
      isPremium,
      plan,
      expiresAt
    };

    setCurrentUser(newUser);
    localStorage.setItem('animeworld_user_session', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('animeworld_user_session');
  };

  const handlePaymentSuccess = (user: UserProfile) => {
    setCurrentUser((prev) => {
      const updated = { ...(prev || {}), ...user, isPremium: true };
      localStorage.setItem('animeworld_user_session', JSON.stringify(updated));
      return updated;
    });
    fetchHomeData();
  };

  // Fetch Homepage Data
  const fetchHomeData = async () => {
    setLoadingHome(true);
    try {
      const res = await fetch('/api/anime-world-india/v1/home');
      const data: HomeData = await res.json();
      if (data.success) {
        setHomeData(data);
      }
    } catch (err) {
      console.error('Failed to load home page content:', err);
    } finally {
      setLoadingHome(false);
    }
  };

  // Fetch Sync Status
  const fetchSyncStatus = async () => {
    try {
      const res = await fetch('/api/anime-world-india/v1/sync-status');
      const data: SyncStatus = await res.json();
      setSyncStatus(data);
    } catch (err) {
      console.error('Failed to load sync status:', err);
    }
  };

  // Trigger Sync
  const handleTriggerSync = async () => {
    setSyncNotification('Syncing anime database with AnimeWorld India...');
    try {
      const res = await fetch('/api/anime-world-india/v1/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncNotification(`Successfully synchronized ${data.totalSyncedCount || '150+'} titles!`);
        fetchHomeData();
        fetchSyncStatus();
        setTimeout(() => setSyncNotification(null), 4000);
      }
    } catch (err) {
      setSyncNotification('Sync failed. Please check network connection.');
      setTimeout(() => setSyncNotification(null), 3000);
    }
  };

  useEffect(() => {
    fetchHomeData();
    fetchSyncStatus();
  }, []);

  const handleSelectAnime = (item: AnimeItem) => {
    const isMovie = item.type === 'movie' || Boolean(item.movieId);
    const id = item.movieId || item.seriesId || item.slug;
    if (isMovie) {
      navigateTo('watch-movie', id);
    } else {
      navigateTo('series-detail', id);
    }
  };

  const handleDirectWatch = (item: AnimeItem) => {
    const isMovie = item.type === 'movie' || Boolean(item.movieId);
    const id = item.movieId || item.seriesId || item.slug;
    if (isMovie) {
      navigateTo('watch-movie', id);
    } else {
      navigateTo('watch', `${id}-1x1`);
    }
  };

  // Trending list merges top shows and top films
  const trendingList = [...(homeData.top_shows || []), ...(homeData.top_films || [])];

  return (
    <div className="min-h-screen bg-[#0a0b10] text-[#e2e8f0] flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Top Navbar */}
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
        appName={appName}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenAdminPanel={() => setAdminModalOpen(true)}
        onOpenPricing={() => setPricingModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Sync Toast Notification */}
        {syncNotification && (
          <div className="fixed top-20 right-6 z-50 bg-[#161b26] border border-red-500/40 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in text-xs font-semibold backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncNotification}</span>
          </div>
        )}

        {/* TAB 1: HOMEPAGE */}
        {currentTab === 'home' && (
          <div className="space-y-10 animate-fade-in">
            {/* Sync Status Banner */}
            <div className="bg-[#10131d] border border-[#222736] p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-['Syne']">
                      Synchronized with AnimeWorld India Catalog
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-semibold border border-emerald-500/20">
                      {syncStatus.totalSyncedCount || '140+'} Titles Available
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Auto-scraped Hindi &amp; regional dubs. Last synced:{' '}
                    <span className="text-slate-300 font-mono">
                      {syncStatus.lastSyncedFormatted || 'Just now'}
                    </span>
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

            {/* VIP Premium Pass Announcement Strip (FamGateway) */}
            <div className="bg-gradient-to-r from-amber-950/40 via-[#181512] to-[#11141e] border border-amber-500/30 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                  <Crown className="w-6 h-6 fill-amber-400" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-black text-white font-['Syne']">
                      AnimeWorld India VIP Passes · Powered by FamGateway
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 font-bold uppercase">
                      3 Plans
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Subscribe from <strong>₹149 / month</strong> or <strong>₹600 / year</strong> for 4K streaming, simultaneous devices, and unlocked premium anime!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setPricingModalOpen(true)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer active:scale-95"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>View Plans (From ₹149)</span>
                </button>
              </div>
            </div>

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
                    <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-white font-['Syne']">
                        Newest Drops
                      </h2>
                      <p className="text-xs text-slate-400">
                        Freshly updated episodes and latest series synchronized from AnimeWorld India
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigateTo('series')}
                    className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition cursor-pointer"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
                  {(homeData.newest_drops && homeData.newest_drops.length > 0
                    ? homeData.newest_drops
                    : homeData.latest_series
                  )
                    .slice(0, 12)
                    .map((item, idx) => (
                      <AnimeCard
                        key={`${item.seriesId || item.movieId || item.slug}-${idx}`}
                        item={item}
                        onClick={() => handleSelectAnime(item)}
                        showType
                      />
                    ))}
                </div>
              </section>
            )}

            {/* SHELF 2: NEW ANIME ARRIVALS */}
            {(activeShelfCategory === 'all' || activeShelfCategory === 'arrivals') && (
              <section className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-white font-['Syne']">
                        New Anime Arrivals
                      </h2>
                      <p className="text-xs text-slate-400">
                        Recently added complete anime series with Hindi audio dubs
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigateTo('series')}
                    className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition cursor-pointer"
                  >
                    <span>Explore Series</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
                  {(homeData.new_anime_arrivals && homeData.new_anime_arrivals.length > 0
                    ? homeData.new_anime_arrivals
                    : homeData.latest_series
                  )
                    .slice(0, 12)
                    .map((item, idx) => (
                      <AnimeCard
                        key={`arrival-${item.seriesId || item.slug}-${idx}`}
                        item={item}
                        onClick={() => handleSelectAnime(item)}
                        showType
                      />
                    ))}
                </div>
              </section>
            )}

            {/* SHELF 3: TOP 10 TRENDING SHOWS & FILMS */}
            {(activeShelfCategory === 'all' || activeShelfCategory === 'trending') &&
              trendingList.length > 0 && (
                <section className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-black text-white font-['Syne']">
                          Top 10 Most-Watched &amp; Trending
                        </h2>
                        <p className="text-xs text-slate-400">
                          Fan favorites and highest rated anime across the network
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                    {trendingList.slice(0, 10).map((item, idx) => (
                      <div key={`trending-${item.slug}-${idx}`} className="relative group">
                        <div className="absolute -left-3 -top-3 z-10 w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 text-white font-black font-['Syne'] flex items-center justify-center text-sm shadow-xl border border-white/20">
                          #{idx + 1}
                        </div>
                        <AnimeCard
                          item={item}
                          onClick={() => handleSelectAnime(item)}
                          showType
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}

            {/* SHELF 4: LATEST ANIME MOVIES */}
            {(activeShelfCategory === 'all' || activeShelfCategory === 'movies') && (
              <section className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                      <Film className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-white font-['Syne']">
                        Latest Anime Movies
                      </h2>
                      <p className="text-xs text-slate-400">
                        Theatrical films, specials, and feature releases with Hindi dubs
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigateTo('movies')}
                    className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 transition cursor-pointer"
                  >
                    <span>All Movies</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
                  {(homeData.latest_movies || []).slice(0, 12).map((item, idx) => (
                    <AnimeCard
                      key={`mov-${item.movieId || item.slug}-${idx}`}
                      item={item}
                      onClick={() => handleSelectAnime(item)}
                      showType
                    />
                  ))}
                </div>
              </section>
            )}

            {/* SHELF 5: CARTOON SERIES */}
            {(activeShelfCategory === 'all' || activeShelfCategory === 'cartoons') &&
              homeData.cartoon_series &&
              homeData.cartoon_series.length > 0 && (
                <section className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                        <Tv className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-black text-white font-['Syne']">
                          Just In: Cartoon Series
                        </h2>
                        <p className="text-xs text-slate-400">
                          Popular animation series and classic nostalgic shows
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
                    {(homeData.cartoon_series || []).slice(0, 12).map((item, idx) => (
                      <AnimeCard
                        key={`${item.seriesId || item.slug}-${idx}`}
                        item={item}
                        onClick={() => handleSelectAnime(item)}
                        showType
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
                  {appName} Streaming &amp; FamGateway API v1
                </h3>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                  Integrate {syncStatus.totalSyncedCount || '150+'}+ anime series, movies, season episodes, FamGateway payment orders, and multi-audio streaming links into your own applications with full CORS and JSON compatibility.
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
            currentUser={currentUser}
            onOpenPricing={() => setPricingModalOpen(true)}
            onOpenAuth={() => setAuthModalOpen(true)}
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

      {/* Admin Panel Modal */}
      <AdminPanelModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        currentUserEmail={currentUser?.email || ''}
        onRefreshData={() => {
          fetchHomeData();
          fetchSyncStatus();
        }}
        onAdminLoginRequested={() => {
          setAdminModalOpen(false);
          handleLogin('prithvirajshetty769@gmail.com', 'Admin Prithviraj');
          setAdminModalOpen(true);
        }}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onOpenAdminPanel={() => setAdminModalOpen(true)}
        onOpenPricing={() => setPricingModalOpen(true)}
      />

      {/* Pricing / FamGateway Modal */}
      <PricingModal
        isOpen={pricingModalOpen}
        onClose={() => setPricingModalOpen(false)}
        currentUser={currentUser}
        onPaymentSuccess={handlePaymentSuccess}
        onOpenAuth={() => {
          setPricingModalOpen(false);
          setAuthModalOpen(true);
        }}
      />

      {/* Footer */}
      <Footer onNavigate={navigateTo} onOpenApiDocs={() => setApiDocsOpen(true)} />
    </div>
  );
}
