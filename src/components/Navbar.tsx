import React from 'react';
import { Search, History, Play, Terminal, RefreshCw, Crown, Shield, User } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string, param?: string) => void;
  onOpenSearch: () => void;
  onOpenHistory: () => void;
  onOpenApiDocs: () => void;
  historyCount: number;
  onSyncAnime?: () => void;
  isSyncing?: boolean;
  syncedCount?: number;
  appName?: string;
  currentUser?: UserProfile | null;
  onOpenAuth?: () => void;
  onOpenAdminPanel?: () => void;
  onOpenPricing?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  onOpenSearch,
  onOpenHistory,
  onOpenApiDocs,
  historyCount,
  onSyncAnime,
  isSyncing = false,
  syncedCount = 0,
  appName = 'AnimeWorld India',
  currentUser = null,
  onOpenAuth,
  onOpenAdminPanel,
  onOpenPricing
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0a0b10]/95 backdrop-blur-md border-b border-[#222634]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Zone 1: Wordmark */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 group text-left cursor-pointer focus-visible:outline-none shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30 group-hover:bg-red-500 transition-colors">
            <Play className="w-4 h-4 fill-white ml-0.5" />
          </div>
          <span className="text-base sm:text-lg font-black tracking-wider uppercase font-['Syne'] text-white">
            {appName.includes(' ') ? (
              <>
                {appName.split(' ')[0]} <span className="text-red-500">{appName.split(' ').slice(1).join(' ')}</span>
              </>
            ) : (
              <span className="text-white">{appName}</span>
            )}
          </span>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => onNavigate('home')}
            className={`transition-colors cursor-pointer py-1 ${
              currentTab === 'home'
                ? 'text-red-500 border-b-2 border-red-500 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onNavigate('series')}
            className={`transition-colors cursor-pointer py-1 ${
              currentTab === 'series'
                ? 'text-red-500 border-b-2 border-red-500 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Series
          </button>
          <button
            onClick={() => onNavigate('movies')}
            className={`transition-colors cursor-pointer py-1 ${
              currentTab === 'movies'
                ? 'text-red-500 border-b-2 border-red-500 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Movies
          </button>
          <button
            onClick={() => onNavigate('a2z')}
            className={`transition-colors cursor-pointer py-1 ${
              currentTab === 'a2z'
                ? 'text-red-500 border-b-2 border-red-500 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            A-Z Index
          </button>
          <button
            onClick={onOpenApiDocs}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <Terminal className="w-4 h-4" />
            <span>API</span>
          </button>
        </nav>

        {/* Zone 3: Primary interactive actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Quick Sync Button */}
          {onSyncAnime && (
            <button
              onClick={onSyncAnime}
              disabled={isSyncing}
              title="Sync anime catalog"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-red-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : syncedCount > 0 ? `${syncedCount}+ Synced` : 'Sync'}</span>
            </button>
          )}

          {/* Pricing / VIP Pass Button */}
          {onOpenPricing && (
            <button
              onClick={onOpenPricing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs shadow-md shadow-amber-500/10 transition cursor-pointer active:scale-95"
            >
              <Crown className="w-3.5 h-3.5 fill-black" />
              <span>VIP Pass</span>
            </button>
          )}

          {/* Admin Panel Direct Button (if admin or always accessible to admin) */}
          {onOpenAdminPanel && (
            <button
              onClick={onOpenAdminPanel}
              title={currentUser?.isAdmin ? 'Admin Control Panel' : 'Admin Panel Login'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                currentUser?.isAdmin
                  ? 'bg-red-600 hover:bg-red-500 text-white border-red-500 shadow-md shadow-red-600/20'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}

          {/* Search Trigger */}
          <button
            onClick={onOpenSearch}
            aria-label="Search anime"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Watch History */}
          <button
            onClick={onOpenHistory}
            aria-label="Watch History"
            className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <History className="w-4 h-4" />
            {historyCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>

          {/* User Account / Auth Trigger */}
          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              aria-label="User Account"
              className="p-1.5 rounded-xl hover:bg-slate-800/60 transition cursor-pointer flex items-center gap-2 border border-transparent hover:border-slate-700"
            >
              {currentUser ? (
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center text-xs font-bold text-white relative">
                  {currentUser.picture ? (
                    <img src={currentUser.picture} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    currentUser.email.charAt(0).toUpperCase()
                  )}
                  {currentUser.isAdmin && (
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                  {currentUser.isPremium && !currentUser.isAdmin && (
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-amber-400 rounded-full" />
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800 text-xs font-semibold text-slate-200 hover:text-white border border-slate-700">
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign In</span>
                </div>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
