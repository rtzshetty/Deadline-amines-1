import React from 'react';
import { Search, History, Play, Terminal, RefreshCw } from 'lucide-react';

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
  syncedCount = 0
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0a0b10]/95 backdrop-blur-md border-b border-[#222634]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Wordmark */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 group text-left cursor-pointer focus-visible:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30 group-hover:bg-red-500 transition-colors">
            <Play className="w-4 h-4 fill-white ml-0.5" />
          </div>
          <span className="text-lg font-black tracking-wider uppercase font-['Syne'] text-white">
            Anime<span className="text-red-500">World</span> <span className="text-xs text-slate-400 font-medium tracking-normal lowercase">india</span>
          </span>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
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
            <span>API Docs</span>
          </button>
        </nav>

        {/* Zone 3: Primary interactive actions */}
        <div className="flex items-center gap-2.5">
          {/* Quick Sync Button */}
          {onSyncAnime && (
            <button
              onClick={onSyncAnime}
              disabled={isSyncing}
              title="Sync more anime from AnimeWorld India"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-red-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {isSyncing ? 'Syncing...' : syncedCount > 0 ? `${syncedCount}+ Synced` : 'Sync Anime'}
              </span>
            </button>
          )}

          <button
            onClick={onOpenSearch}
            aria-label="Search anime"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span className="hidden lg:inline text-xs text-slate-400 font-normal">Search...</span>
          </button>

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

          <button
            onClick={() => onNavigate('series')}
            className="hidden sm:inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-500 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
          >
            Browse
          </button>
        </div>
      </div>
    </header>
  );
};

