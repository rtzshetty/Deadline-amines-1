import React from 'react';
import { Play, Terminal } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string) => void;
  onOpenApiDocs: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenApiDocs }) => {
  return (
    <footer className="mt-20 border-t border-[#222634] bg-[#0a0b10] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center text-white">
                <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
              </div>
              <span className="text-base font-black tracking-wider uppercase font-['Syne'] text-white">
                Anime<span className="text-red-500">World</span> <span className="text-xs text-slate-400 font-medium tracking-normal lowercase">india</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Leading streaming destination for anime series and films dubbed in Hindi, Tamil, Telugu, Malayalam, Bengali, and English.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400">
            <button
              onClick={() => onNavigate('home')}
              className="hover:text-white transition cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('series')}
              className="hover:text-white transition cursor-pointer"
            >
              All Series
            </button>
            <button
              onClick={() => onNavigate('movies')}
              className="hover:text-white transition cursor-pointer"
            >
              All Movies
            </button>
            <button
              onClick={() => onNavigate('a2z')}
              className="hover:text-white transition cursor-pointer"
            >
              A-Z Directory
            </button>
            <button
              onClick={onOpenApiDocs}
              className="hover:text-red-400 transition flex items-center gap-1 cursor-pointer font-semibold"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>API Explorer v1</span>
            </button>
          </div>
        </div>

        <div className="border-t border-[#1a1d28] pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-3">
          <p>
            AnimeWorld India API Integration &amp; Streaming Player.
          </p>
          <p>
            Fast multi-audio playback powered by high-speed CDN and Abyss streaming servers.
          </p>
        </div>
      </div>
    </footer>
  );
};
