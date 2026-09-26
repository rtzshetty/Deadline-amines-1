import React, { useState, useEffect } from 'react';
import { Loader2, ArrowLeft, ChevronLeft, ChevronRight, Search, Film, Tv } from 'lucide-react';
import { AnimeItem } from '../types';
import { AnimeCard } from '../components/AnimeCard';

interface CatalogPageProps {
  type: 'series' | 'movies';
  onNavigate: (tab: string, param?: string) => void;
  onSelectAnime: (item: AnimeItem) => void;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({
  type,
  onNavigate,
  onSelectAnime
}) => {
  const [items, setItems] = useState<AnimeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState<string>('all');

  const isMovie = type === 'movies';

  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      setLoading(true);
      try {
        const endpoint = isMovie
          ? `/api/anime-world-india/v1/movie?p=${currentPage}`
          : `/api/anime-world-india/v1/series?p=${currentPage}`;

        const res = await fetch(endpoint);
        const data = await res.json();
        if (!isMounted) return;

        if (data.success) {
          const list = isMovie ? data.movies : data.series;
          setItems(list || []);
          setCurrentPage(data.current_page || 1);
          setTotalPages(data.total_pages || 10);
        }
      } catch (err) {
        console.error('Catalog fetch error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, [type, currentPage, isMovie]);

  // Client-side quick filter
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#232838] pb-6">
        <div>
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition cursor-pointer mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
          <h1 className="text-3xl font-black text-white font-['Syne'] flex items-center gap-3">
            {isMovie ? <Film className="w-8 h-8 text-red-500" /> : <Tv className="w-8 h-8 text-red-500" />}
            <span>{isMovie ? 'Anime Movies Catalog' : 'Anime Series Catalog'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse complete database of Hindi dubbed and multi-audio anime.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter on this page..."
              className="w-full bg-[#11141e] border border-[#232838] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Interactive filter buttons */}
          <div className="flex items-center p-1 bg-[#11141e] border border-[#232838] rounded-xl">
            <button
              onClick={() => setLanguageFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                languageFilter === 'all'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Dubs
            </button>
            <button
              onClick={() => setLanguageFilter('hindi')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                languageFilter === 'hindi'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Hindi
            </button>
            <button
              onClick={() => setLanguageFilter('tamil')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                languageFilter === 'tamil'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tamil/Telugu
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Anime Cards */}
      {loading ? (
        <div className="py-28 text-center space-y-3">
          <Loader2 className="w-10 h-10 text-red-500 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 animate-pulse">Fetching anime titles...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-24 text-center text-slate-500 space-y-2">
          <p className="text-sm font-semibold">No anime matching filters</p>
          <p className="text-xs text-slate-600">Try clearing your search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {filteredItems.map((item, idx) => (
            <AnimeCard
              key={`${item.seriesId || item.movieId || item.title}-${idx}`}
              item={item}
              onClick={() => onSelectAnime(item)}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-between border-t border-[#232838] pt-6">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1 || loading}
          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#11141e] border border-[#232838] text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <span>Page</span>
          <span className="font-bold text-white px-2 py-1 bg-red-600 rounded-md">{currentPage}</span>
          <span>of</span>
          <span className="text-slate-300">{totalPages}</span>
        </div>

        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage >= totalPages || loading}
          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#11141e] border border-[#232838] text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
