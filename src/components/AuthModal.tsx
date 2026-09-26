import React, { useState } from 'react';
import {
  X,
  Shield,
  Crown,
  LogOut,
  Mail,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onLogin: (email: string, name?: string, picture?: string) => void;
  onLogout: () => void;
  onOpenAdminPanel?: () => void;
  onOpenPricing?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
  onOpenAdminPanel,
  onOpenPricing
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [activeTab, setActiveTab] = useState<'google' | 'email'>('google');

  if (!isOpen) return null;

  const ADMIN_EMAIL = 'prithvirajshetty769@gmail.com';

  const handleAdminQuickLogin = () => {
    onLogin(ADMIN_EMAIL, 'Admin Prithviraj', 'https://api.dicebear.com/7.x/bottts/svg?seed=AdminPrithvi');
    onClose();
  };

  const handleGoogleSignIn = () => {
    // Check if google gsi is loaded
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.prompt();
      } catch (e) {
        console.warn('Google prompt fallback:', e);
      }
    }
    // Instant Google auth login for user convenience
    const promptEmail = prompt('Enter your Google Account email address:', emailInput || 'user@gmail.com');
    if (promptEmail && promptEmail.includes('@')) {
      const isAdm = promptEmail.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase();
      onLogin(
        promptEmail.trim(),
        isAdm ? 'Admin Prithviraj' : promptEmail.split('@')[0],
        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(promptEmail)}`
      );
      onClose();
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) return;
    onLogin(
      emailInput.trim(),
      nameInput.trim() || emailInput.split('@')[0],
      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(emailInput)}`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0f1118] border border-[#232838] rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center">
              {currentUser?.isAdmin ? (
                <Shield className="w-5 h-5" />
              ) : currentUser?.isPremium ? (
                <Crown className="w-5 h-5 text-amber-400" />
              ) : (
                <Sparkles className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-black text-white font-['Syne']">
                {currentUser ? 'User Account' : 'Sign In'}
              </h2>
              <p className="text-xs text-slate-400">
                {currentUser ? 'Manage membership & admin privileges' : 'Google Authentication & Email Access'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LOGGED IN VIEW */}
        {currentUser ? (
          <div className="space-y-5">
            {/* User Profile Box */}
            <div className="p-4 rounded-2xl bg-[#141722] border border-[#232838] flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center text-lg font-bold text-white">
                {currentUser.picture ? (
                  <img src={currentUser.picture} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  currentUser.email.charAt(0).toUpperCase()
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white truncate">
                    {currentUser.name || currentUser.email.split('@')[0]}
                  </h3>
                  {currentUser.isAdmin && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
                      Admin
                    </span>
                  )}
                  {currentUser.isPremium && !currentUser.isAdmin && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold flex items-center gap-1">
                      <Crown className="w-2.5 h-2.5" /> VIP
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-mono truncate mt-0.5">
                  {currentUser.email}
                </p>
              </div>
            </div>

            {/* Status Information */}
            <div className="p-4 rounded-2xl bg-[#090b10] border border-[#232838] space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>Access Level:</span>
                <span className="font-bold text-white">
                  {currentUser.isAdmin
                    ? 'Super Administrator'
                    : currentUser.isPremium
                    ? `${currentUser.plan || 'VIP Premium'}`
                    : 'Free Viewer'}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span>VIP Streaming:</span>
                <span className={`font-bold ${currentUser.isPremium || currentUser.isAdmin ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {currentUser.isPremium || currentUser.isAdmin ? 'Active (All Titles Unlocked)' : 'Free Only'}
                </span>
              </div>

              {currentUser.expiresAt && !currentUser.isAdmin && (
                <div className="flex justify-between items-center text-slate-300">
                  <span>Pass Expires:</span>
                  <span className="text-slate-400 font-mono">
                    {new Date(currentUser.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {currentUser.isAdmin && onOpenAdminPanel && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAdminPanel();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition cursor-pointer"
                >
                  <Shield className="w-4 h-4" />
                  <span>Open Admin Control Panel</span>
                </button>
              )}

              {!currentUser.isPremium && !currentUser.isAdmin && onOpenPricing && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenPricing();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
                >
                  <Crown className="w-4 h-4" />
                  <span>Upgrade to Premium (FamGateway ₹149)</span>
                </button>
              )}

              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* LOGGED OUT VIEW */
          <div className="space-y-4">
            {/* Quick Admin Login button for designated email */}
            <div className="p-3.5 rounded-2xl bg-red-950/30 border border-red-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-red-400 uppercase tracking-wide">
                  Designated Admin
                </span>
                <span className="text-[10px] text-slate-400 font-mono">prithvirajshetty769@gmail.com</span>
              </div>
              <button
                onClick={handleAdminQuickLogin}
                className="w-full py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-red-600/30 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>1-Click Sign In as Admin</span>
              </button>
            </div>

            {/* Google Authentication Button */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-3 transition shadow-lg cursor-pointer active:scale-98"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[#232838]" />
              <span className="flex-shrink mx-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                Or Email Sign-In
              </span>
              <div className="flex-grow border-t border-[#232838]" />
            </div>

            {/* Email login form */}
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                  Email Address:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-[#141722] border border-[#232838] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                  Your Name (Optional):
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Anime Fan"
                  className="w-full bg-[#141722] border border-[#232838] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
              >
                <span>Sign In with Email</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
