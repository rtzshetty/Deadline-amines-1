import React, { useState } from 'react';
import { X, Play, Copy, Check, Terminal, ExternalLink } from 'lucide-react';

interface ApiExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EndpointDef {
  name: string;
  path: string;
  method: string;
  description: string;
  defaultParams: Record<string, string>;
}

const ENDPOINTS: EndpointDef[] = [
  {
    name: 'Home',
    path: '/api/anime-world-india/v1/home.php',
    method: 'GET',
    description: 'Fetches latest anime series and movies displayed on the homepage.',
    defaultParams: {}
  },
  {
    name: 'Series Catalog',
    path: '/api/anime-world-india/v1/series.php',
    method: 'GET',
    description: 'Fetches paginated list of anime series.',
    defaultParams: { p: '1' }
  },
  {
    name: 'Movies Catalog',
    path: '/api/anime-world-india/v1/movie.php',
    method: 'GET',
    description: 'Fetches paginated list of anime movies.',
    defaultParams: { p: '1' }
  },
  {
    name: 'Seasons & Info',
    path: '/api/anime-world-india/v1/seasons.php',
    method: 'GET',
    description: 'Retrieves series details and available seasons for a series ID.',
    defaultParams: { seriesID: 'naruto-shippuden' }
  },
  {
    name: 'Episodes',
    path: '/api/anime-world-india/v1/episodes.php',
    method: 'GET',
    description: 'Fetches details and episode list for a season ID.',
    defaultParams: { seasonId: 'naruto-shippuden-season-1' }
  },
  {
    name: 'Stream & Links',
    path: '/api/anime-world-india/v1/stream.php',
    method: 'GET',
    description: 'Fetches streaming embed and audio tracks for an episode or movie.',
    defaultParams: { episodeId: 'naruto-shippuden-16x349' }
  },
  {
    name: 'Search',
    path: '/api/anime-world-india/v1/search.php',
    method: 'GET',
    description: 'Searches anime series and movies with pagination.',
    defaultParams: { query: 'naruto', p: '1' }
  },
  {
    name: 'A to Z Index',
    path: '/api/anime-world-india/v1/a2z.php',
    method: 'GET',
    description: 'Fetches anime starting with a letter or 0-9.',
    defaultParams: { letter: 'a', page: '1' }
  }
];

export const ApiExplorerModal: React.FC<ApiExplorerModalProps> = ({ isOpen, onClose }) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDef>(ENDPOINTS[0]);
  const [params, setParams] = useState<Record<string, string>>(ENDPOINTS[0].defaultParams);
  const [responseJson, setResponseJson] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSelectEndpoint = (ep: EndpointDef) => {
    setSelectedEndpoint(ep);
    setParams(ep.defaultParams);
    setResponseJson(null);
  };

  const constructUrl = () => {
    const url = new URL(selectedEndpoint.path, window.location.origin);
    Object.entries(params).forEach(([key, val]) => {
      if (val) url.searchParams.set(key, val);
    });
    return url.pathname + url.search;
  };

  const executeRequest = async () => {
    setLoading(true);
    try {
      const fullUrl = constructUrl();
      const res = await fetch(fullUrl);
      const json = await res.json();
      setResponseJson(JSON.stringify(json, null, 2));
    } catch (err: any) {
      setResponseJson(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const copyCurl = () => {
    const curl = `curl -X ${selectedEndpoint.method} "${window.location.origin}${constructUrl()}"`;
    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-5xl bg-[#0f1118] border border-[#232838] rounded-2xl shadow-2xl flex flex-col h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#232838] flex items-center justify-between bg-[#0b0c10]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-['Syne']">
                AnimeWorld India API v1 Explorer
              </h2>
              <p className="text-xs text-slate-400">
                Official REST endpoints matching GitHub repository specifications
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Endpoint selector sidebar */}
          <div className="w-full md:w-64 border-r border-[#232838] bg-[#0c0e14] overflow-y-auto p-3 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase px-2 mb-2 block tracking-wider">
              Endpoints
            </span>
            {ENDPOINTS.map((ep) => (
              <button
                key={ep.name}
                onClick={() => handleSelectEndpoint(ep)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                  selectedEndpoint.name === ep.name
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <span>{ep.name}</span>
                <span className="font-mono text-[10px] opacity-75">{ep.method}</span>
              </button>
            ))}
          </div>

          {/* Right: Request configuration & response preview */}
          <div className="flex-1 flex flex-col overflow-hidden p-5 space-y-4 bg-[#0f1118]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {selectedEndpoint.method}
                </span>
                <span className="font-mono text-sm text-slate-200">{selectedEndpoint.path}</span>
              </div>
              <p className="text-xs text-slate-400">{selectedEndpoint.description}</p>
            </div>

            {/* Parameters inputs */}
            {Object.keys(selectedEndpoint.defaultParams).length > 0 && (
              <div className="bg-[#141722] p-3 rounded-xl border border-[#232838] space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">Query Parameters:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.keys(selectedEndpoint.defaultParams).map((paramKey) => (
                    <div key={paramKey} className="flex items-center gap-2">
                      <label className="text-xs font-mono text-slate-400 w-24 shrink-0">{paramKey}:</label>
                      <input
                        type="text"
                        value={params[paramKey] ?? ''}
                        onChange={(e) => setParams({ ...params, [paramKey]: e.target.value })}
                        className="flex-1 bg-[#0b0c10] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Request action buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={executeRequest}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-red-600/20 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{loading ? 'Sending Request...' : 'Send Live Request'}</span>
              </button>

              <button
                onClick={copyCurl}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-2 transition cursor-pointer border border-slate-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied cURL' : 'Copy cURL'}</span>
              </button>

              <a
                href={constructUrl()}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Response viewer */}
            <div className="flex-1 flex flex-col min-h-0 bg-[#07080c] rounded-xl border border-[#232838] overflow-hidden">
              <div className="px-4 py-2 border-b border-[#232838] flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono">Response (application/json)</span>
                {responseJson && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(responseJson);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy JSON</span>
                  </button>
                )}
              </div>
              <div className="flex-1 p-4 overflow-auto font-mono text-xs text-emerald-400 whitespace-pre leading-relaxed">
                {loading ? (
                  <span className="text-slate-500 animate-pulse">Executing request against server...</span>
                ) : responseJson ? (
                  responseJson
                ) : (
                  <span className="text-slate-600">Click "Send Live Request" above to test this endpoint live.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
