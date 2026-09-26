import React from 'react';
import { X, Play, Trash2, Clock, Film, Tv } from 'lucide-react';
import { WatchHistoryItem } from '../types';

interface WatchHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: WatchHistoryItem[];
  onSelect: (item: WatchHistoryItem) => void;
  onClear: () => void;
}

export const WatchHistoryDrawer: React.FC<WatchHistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelect,
  onClear
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0f1118] border-l border-[#222634] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-[#222634] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-500" />
              <h2 className="text-base font-bold text-white font-['Syne']">Continue Watching</h2>
            </div>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <button
                  onClick={onClear}
                  title="Clear history"
                  className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {history.length === 0 ? (
              <div className="py-24 text-center text-slate-500 space-y-3">
                <Clock className="w-12 h-12 mx-auto opacity-20 text-slate-400" />
                <p className="text-sm font-medium">No watch history yet</p>
                <p className="text-xs text-slate-600">Episodes & movies you start watching will appear here.</p>
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={`${item.id}-${item.timestamp}`}
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  role="button"
                  tabIndex={0}
                  className="flex gap-3 p-3 rounded-xl bg-[#141722] hover:bg-[#1a1f2e] border border-[#232838] transition-colors cursor-pointer group"
                >
                  <div className="relative w-20 aspect-[16/10] rounded-lg overflow-hidden bg-slate-900 shrink-0">
                    {item.poster ? (
                      <img
                        src={item.poster}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        {item.type === 'movie' ? <Film className="w-5 h-5" /> : <Tv className="w-5 h-5" />}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-4 h-4 fill-white text-white" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wide">
                      {item.episodeNumber ? item.episodeNumber : item.type}
                    </span>
                    <h4 className="text-sm font-bold text-slate-200 truncate group-hover:text-white transition-colors">
                      {item.title}
                    </h4>
                    {item.episodeTitle && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {item.episodeTitle}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
