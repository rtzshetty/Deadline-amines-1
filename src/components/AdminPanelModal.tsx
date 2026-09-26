import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Key,
  Crown,
  Search,
  Check,
  Save,
  Loader2,
  Tv,
  Film,
  Lock,
  Unlock,
  Sparkles,
  Settings,
  Layers
} from 'lucide-react';
import { AdminConfigData } from '../types';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string;
  onRefreshData?: () => void;
  onAdminLoginRequested?: () => void;
}

interface AnimeAdminItem {
  title: string;
  slug: string;
  type: 'series' | 'movie';
  image: string;
  year?: string;
  rating?: string;
  isPremium: boolean;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
  onRefreshData,
  onAdminLoginRequested
}) => {
  const [activeTab, setActiveTab] = useState<'anime' | 'gateway'>('anime');
  const [adminConfig, setAdminConfig] = useState<AdminConfigData | null>(null);
  const [allAnime, setAllAnime] = useState<AnimeAdminItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'premium' | 'free'>('all');
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [merchantInput, setMerchantInput] = useState('');
  const [appNameInput, setAppNameInput] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);

  // Load Admin Config & Anime list
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [cfgRes, animeRes] = await Promise.all([
          fetch('/api/admin/config'),
          fetch('/api/admin/all-anime')
        ]);
        const cfgData = await cfgRes.json();
        const animeData = await animeRes.json();

        if (!isMounted) return;

        setAdminConfig(cfgData);
        setKeyInput(cfgData.famGatewayApiKey || '');
        setMerchantInput(cfgData.famGatewayMerchantId || '');
        setAppNameInput(cfgData.appName || 'AnimeWorld India');
        if (animeData.success && animeData.items) {
          setAllAnime(animeData.items);
        }
      } catch (err) {
        console.error('Failed to load admin data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isAdmin =
    currentUserEmail.toLowerCase().trim() ===
    (adminConfig?.adminEmail || 'prithvirajshetty769@gmail.com').toLowerCase().trim();

  // Toggle Single Anime Premium Status
  const handleTogglePremium = async (slug: string, currentlyPremium: boolean) => {
    setTogglingSlug(slug);
    try {
      const res = await fetch('/api/admin/toggle-premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, isPremium: !currentlyPremium })
      });
      const data = await res.json();
      if (data.success) {
        setAllAnime((prev) =>
          prev.map((item) => (item.slug === slug ? { ...item, isPremium: !currentlyPremium } : item))
        );
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      console.error('Failed to toggle premium:', e);
    } finally {
      setTogglingSlug(null);
    }
  };

  // Bulk Actions
  const handleBulkSetPremium = async (makePremium: boolean) => {
    const targetSlugs = allAnime.map((a) => a.slug);
    try {
      const res = await fetch('/api/admin/batch-premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slugs: targetSlugs, isPremium: makePremium })
      });
      const data = await res.json();
      if (data.success) {
        setAllAnime((prev) => prev.map((item) => ({ ...item, isPremium: makePremium })));
        setMessage(`All anime set to ${makePremium ? 'VIP Premium' : 'Free'}.`);
        setTimeout(() => setMessage(null), 3000);
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSeedPopularVIP = async () => {
    const popularSlugs = [
      'solo-leveling',
      'jujutsu-kaisen',
      'demon-slayer-kimetsu-no-yaiba',
      'chainsaw-man-the-movie-reze-arc',
      'suzume',
      'your-name',
      'naruto-shippuden',
      'weathering-with-you',
      'jujutsu-kaisen-0-movie'
    ];
    try {
      const res = await fetch('/api/admin/batch-premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slugs: popularSlugs, isPremium: true })
      });
      const data = await res.json();
      if (data.success) {
        setAllAnime((prev) =>
          prev.map((item) =>
            popularSlugs.includes(item.slug) ? { ...item, isPremium: true } : item
          )
        );
        setMessage('Top popular anime marked as VIP Premium.');
        setTimeout(() => setMessage(null), 3000);
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save FamGateway Key & App Name
  const handleSaveSettings = async () => {
    setSavingKey(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/set-gateway-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: keyInput,
          merchantId: merchantInput,
          appName: appNameInput
        })
      });
      const data = await res.json();
      if (data.success) {
        setAdminConfig((prev) =>
          prev ? { ...prev, appName: appNameInput, famGatewayApiKey: keyInput, famGatewayMerchantId: merchantInput } : null
        );
        setMessage('Settings and FamGateway credentials saved successfully.');
        setTimeout(() => setMessage(null), 3500);
        if (onRefreshData) onRefreshData();
      }
    } catch (e: any) {
      setMessage('Failed to save settings.');
    } finally {
      setSavingKey(false);
    }
  };

  const filteredAnime = allAnime.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.slug.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterType === 'premium') return matchesSearch && item.isPremium;
    if (filterType === 'free') return matchesSearch && !item.isPremium;
    return matchesSearch;
  });

  const premiumCount = allAnime.filter((a) => a.isPremium).length;
  const currentDisplayName = adminConfig?.appName || 'AnimeWorld India';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl bg-[#0f1118] border border-[#232838] rounded-3xl shadow-2xl flex flex-col h-[90vh] overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-[#232838] bg-[#0c0e15] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white font-['Syne']">
                  {currentDisplayName} Admin Panel
                </h2>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    isAdmin
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {isAdmin ? 'Authorized Admin' : 'Admin View (Demo Mode)'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Admin Email:{' '}
                <span className="text-red-400 font-mono font-semibold">
                  {adminConfig?.adminEmail || 'prithvirajshetty769@gmail.com'}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close Admin Panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin Warning Banner if not logged in as admin */}
        {!isAdmin && (
          <div className="bg-amber-950/40 border-b border-amber-800/40 px-5 py-2.5 flex items-center justify-between gap-3 text-xs text-amber-200">
            <span>
              You are signed in as <strong>{currentUserEmail || 'Guest'}</strong>. The designated admin email is{' '}
              <strong className="font-mono text-amber-300">prithvirajshetty769@gmail.com</strong>.
            </span>
            {onAdminLoginRequested && (
              <button
                onClick={onAdminLoginRequested}
                className="px-3 py-1 bg-amber-500 text-black font-bold text-xs rounded-lg hover:bg-amber-400 transition cursor-pointer shrink-0"
              >
                Sign In as Admin
              </button>
            )}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-5 py-2.5 bg-[#090b10] border-b border-[#232838] flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('anime')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'anime'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'text-slate-400 hover:text-white bg-slate-800/40'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Which Anime Will Go Premium ({premiumCount} VIP)</span>
            </button>

            <button
              onClick={() => setActiveTab('gateway')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'gateway'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'text-slate-400 hover:text-white bg-slate-800/40'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>FamGateway & Site Settings</span>
            </button>
          </div>

          {message && (
            <div className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-800/60 flex items-center gap-1.5 animate-fade-in">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>{message}</span>
            </div>
          )}
        </div>

        {/* Tab 1: Premium Anime Access Control */}
        {activeTab === 'anime' && (
          <div className="flex-1 flex flex-col overflow-hidden p-4 sm:p-6 space-y-4">
            {/* Top Toolbar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search series or movie to toggle VIP status..."
                  className="w-full bg-[#141722] border border-[#232838] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center p-1 bg-[#141722] border border-[#232838] rounded-xl">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                      filterType === 'all'
                        ? 'bg-red-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({allAnime.length})
                  </button>
                  <button
                    onClick={() => setFilterType('premium')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                      filterType === 'premium'
                        ? 'bg-amber-500 text-black font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    VIP Premium ({premiumCount})
                  </button>
                  <button
                    onClick={() => setFilterType('free')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                      filterType === 'free'
                        ? 'bg-slate-700 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Free Access ({allAnime.length - premiumCount})
                  </button>
                </div>

                <button
                  onClick={handleSeedPopularVIP}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                  title="Make Top 10 popular anime VIP"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Seed Popular VIP</span>
                </button>

                <button
                  onClick={() => handleBulkSetPremium(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer border border-slate-700"
                  title="Set all anime to free"
                >
                  Make All Free
                </button>
              </div>
            </div>

            {/* Anime Table / Cards */}
            <div className="flex-1 overflow-y-auto border border-[#232838] rounded-2xl bg-[#090b10] divide-y divide-[#1e2330]">
              {loading ? (
                <div className="py-24 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto" />
                  <p className="text-xs text-slate-400">Loading catalog for admin management...</p>
                </div>
              ) : filteredAnime.length === 0 ? (
                <div className="py-20 text-center text-slate-500">
                  <p className="text-sm">No anime matching filters</p>
                </div>
              ) : (
                filteredAnime.map((item) => (
                  <div
                    key={item.slug}
                    className="p-3.5 flex items-center justify-between gap-4 hover:bg-[#121520] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-16 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-800">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600">
                            {item.type === 'movie' ? <Film className="w-4 h-4" /> : <Tv className="w-4 h-4" />}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white truncate max-w-sm sm:max-w-md">
                            {item.title}
                          </h4>
                          <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5 py-0.5 rounded bg-slate-800/80">
                            {item.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                          slug: {item.slug}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge & Toggle Button */}
                    <div className="flex items-center gap-3 shrink-0">
                      {item.isPremium ? (
                        <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                          <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>VIP Premium</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/60 text-xs font-semibold">
                          Free Access
                        </span>
                      )}

                      <button
                        onClick={() => handleTogglePremium(item.slug, item.isPremium)}
                        disabled={togglingSlug === item.slug}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm ${
                          item.isPremium
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                            : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold shadow-amber-500/20'
                        }`}
                      >
                        {togglingSlug === item.slug ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : item.isPremium ? (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Set to Free</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Make Premium</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: FamGateway Settings & Name Config */}
        {activeTab === 'gateway' && (
          <div className="p-6 sm:p-8 max-w-2xl mx-auto space-y-6 flex-1 overflow-y-auto">
            {/* 1. App Name Customization (Change the name of Deadline amin) */}
            <div className="bg-[#141722] p-6 rounded-2xl border border-[#232838] space-y-4">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-red-500" />
                <h3 className="text-base font-bold text-white font-['Syne']">
                  App / Brand Name Configuration
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                You can change the name of the app (formerly &quot;Deadline Anime&quot; / &quot;Deadline amin&quot;) to your preferred branding:
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wide block">
                  Application Title:
                </label>
                <input
                  type="text"
                  value={appNameInput}
                  onChange={(e) => setAppNameInput(e.target.value)}
                  placeholder="e.g. AnimeWorld India"
                  className="w-full bg-[#0b0d13] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-medium"
                />
              </div>
            </div>

            {/* 2. FamGateway Credentials */}
            <div className="bg-[#141722] p-6 rounded-2xl border border-[#232838] space-y-5">
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white font-['Syne'] flex items-center gap-2">
                  <Key className="w-5 h-5 text-red-500" />
                  <span>FamGateway API Credentials</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Provide your FamGateway API Key. When users subscribe to any of the 3 plans, payments are processed with FamGateway and users instantly receive Premium VIP access.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wide block">
                  FamGateway API Key:
                </label>
                <input
                  type="text"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Paste your FamGateway API Key (e.g. fam_live_sec_...)"
                  className="w-full bg-[#0b0d13] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-mono"
                />
                <span className="text-[11px] text-slate-500 block">
                  Production or sandbox key accepted. You can update this at any time.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wide block">
                  FamGateway Merchant / VPA ID (Optional):
                </label>
                <input
                  type="text"
                  value={merchantInput}
                  onChange={(e) => setMerchantInput(e.target.value)}
                  placeholder="e.g. famgateway.merchant@fam"
                  className="w-full bg-[#0b0d13] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      keyInput ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  <span className="text-slate-300">
                    {keyInput ? 'API Key Configured & Ready' : 'API Key Pending (Using Test Mode)'}
                  </span>
                </div>

                <button
                  onClick={handleSaveSettings}
                  disabled={savingKey}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-red-600/30 cursor-pointer disabled:opacity-50"
                >
                  {savingKey ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Save Settings</span>
                </button>
              </div>
            </div>

            {/* 3. Pricing Plans Summary in Admin */}
            <div className="bg-[#141722] p-5 rounded-2xl border border-[#232838] space-y-3">
              <span className="text-xs font-bold text-white block">Active Subscription Plans (FamGateway):</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[#0b0d13] border border-slate-800 space-y-1">
                  <span className="text-[10px] text-red-400 font-bold uppercase block">Plan 1</span>
                  <div className="text-lg font-black text-white font-['Syne']">₹149 / mo</div>
                  <span className="text-xs text-slate-300 font-semibold block">Monthly Fan Pass</span>
                  <span className="text-[11px] text-slate-500 block">30 Days · Full 1080p HD</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0b0d13] border border-slate-800 space-y-1">
                  <span className="text-[10px] text-red-400 font-bold uppercase block">Plan 2</span>
                  <div className="text-lg font-black text-white font-['Syne']">₹149 / mo</div>
                  <span className="text-xs text-slate-300 font-semibold block">VIP Otaku Dub Pass</span>
                  <span className="text-[11px] text-slate-500 block">30 Days · 4K & 2 Screens</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0b0d13] border border-amber-500/40 bg-amber-950/10 space-y-1">
                  <span className="text-[10px] text-amber-400 font-bold uppercase block">Plan 3 · Best Value</span>
                  <div className="text-lg font-black text-amber-300 font-['Syne']">₹600 / yr</div>
                  <span className="text-xs text-amber-200 font-semibold block">Yearly Mega Fan</span>
                  <span className="text-[11px] text-slate-400 block">365 Days · Save 66%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
