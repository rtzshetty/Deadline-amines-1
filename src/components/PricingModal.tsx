import React, { useState } from 'react';
import {
  X,
  Crown,
  Check,
  Zap,
  Shield,
  Loader2,
  ArrowRight,
  Sparkles,
  QrCode,
  CreditCard,
  CheckCircle2,
  Tv,
  Film
} from 'lucide-react';
import { PricingPlan, UserProfile } from '../types';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onPaymentSuccess: (user: UserProfile) => void;
  onOpenAuth: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onPaymentSuccess,
  onOpenAuth
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('plan_600_yearly');
  const [checkoutStep, setCheckoutStep] = useState<'select' | 'gateway' | 'success'>('select');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [loading, setLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [transactionId, setTransactionId] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // 3 Required Plans:
  // 1. One 149 rupees
  // 2. Second 149 rupees
  // 3. An yearly plan 600 rupees using FamGateway
  const plans: PricingPlan[] = [
    {
      id: 'plan_149_fan',
      name: 'Monthly Standard Fan',
      price: 149,
      currency: 'INR',
      durationText: '30 Days Pass',
      badge: 'Popular for Mobile',
      features: [
        'Full 1080p HD Video Quality',
        'All VIP Series & Episodes Unlocked',
        'Hindi, Tamil, Telugu & English Dubs',
        'Multi-Audio Track Selector',
        'Ad-Free Streaming Experience'
      ]
    },
    {
      id: 'plan_149_otaku',
      name: 'VIP Otaku Dub Pass',
      price: 149,
      currency: 'INR',
      durationText: '30 Days VIP',
      badge: '4K Dub Special',
      features: [
        '4K Ultra HD & 1080p 60fps',
        '2 Simultaneous Screen Streams',
        'High-Speed Abyss & Zephyrix CDN',
        'Full Hindi & Regional Dub Catalog',
        'VIP Otaku Profile Crown'
      ]
    },
    {
      id: 'plan_600_yearly',
      name: 'Yearly Mega Fan VIP',
      price: 600,
      currency: 'INR',
      durationText: '365 Days (1 Full Year)',
      badge: 'BEST VALUE · SAVE 66%',
      popular: true,
      features: [
        '365 Days Unlimited Access (₹50 / mo)',
        'All Anime Theatrical Movies & Series',
        '4 Simultaneous Screens Everywhere',
        'Priority High-Bitrate CDN Nodes',
        'Offline Episode Download Support',
        'Direct FamGateway Instant Activation'
      ]
    }
  ];

  const currentSelectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[2];

  // Initiate FamGateway Order
  const handleProceedToGateway = async () => {
    const emailToUse = currentUser?.email || customerEmail.trim();
    if (!emailToUse || !emailToUse.includes('@')) {
      setError('Please provide a valid email address for your subscription.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/payment/famgateway/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanId,
          email: emailToUse,
          name: customerName || emailToUse.split('@')[0]
        })
      });

      const data = await res.json();
      if (data.success) {
        setOrderDetails(data);
        setCheckoutStep('gateway');
      } else {
        throw new Error(data.error || 'Failed to initialize FamGateway order.');
      }
    } catch (err: any) {
      setError(err.message || 'Payment initiation failed.');
    } finally {
      setLoading(false);
    }
  };

  // Complete & Verify FamGateway Payment
  const handleVerifyPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const emailToUse = currentUser?.email || customerEmail.trim();
      const res = await fetch('/api/payment/famgateway/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderDetails?.orderId || `FAM_${Date.now()}`,
          planId: selectedPlanId,
          email: emailToUse,
          transactionId: transactionId || `TXN_${Date.now()}`
        })
      });

      const data = await res.json();
      if (data.success && data.user) {
        setCheckoutStep('success');
        onPaymentSuccess(data.user);
      } else {
        throw new Error(data.error || 'Payment verification failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Payment verification error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-[#0f1118] border border-[#232838] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="p-5 border-b border-[#232838] bg-[#0c0e15] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Crown className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white font-['Syne'] flex items-center gap-2">
                <span>AnimeWorld India VIP Pass</span>
                <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-red-600/30 text-red-400 border border-red-500/30 font-bold">
                  FamGateway
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Unlock all premium anime series, theatrical movies, and multi-language dubs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800/60 text-xs text-red-200">
              {error}
            </div>
          )}

          {/* STEP 1: Select Plan */}
          {checkoutStep === 'select' && (
            <div className="space-y-6">
              <div className="text-center max-w-xl mx-auto space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Select Your Subscription Plan
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white font-['Syne']">
                  Instant Streaming Access on All Devices
                </h3>
              </div>

              {/* 3 Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`relative rounded-2xl p-5 border cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#151928] border-amber-500 shadow-xl shadow-amber-500/10 ring-2 ring-amber-500/30'
                          : 'bg-[#12141e] border-[#222736] hover:border-slate-700'
                      }`}
                    >
                      {plan.badge && (
                        <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md">
                          {plan.badge}
                        </div>
                      )}

                      <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-white">{plan.name}</h4>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? 'border-amber-500 bg-amber-500 text-black'
                                : 'border-slate-600'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>

                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl sm:text-3xl font-black text-white font-['Syne']">
                            ₹{plan.price}
                          </span>
                          <span className="text-xs text-slate-400">/ {plan.durationText}</span>
                        </div>

                        <div className="pt-2 border-t border-[#232838] space-y-2">
                          {plan.features.map((feat, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                              <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                              <span className="leading-tight">{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`mt-5 w-full py-2.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/20'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        <span>{isSelected ? 'Selected' : 'Choose Plan'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* User Email & Checkout Trigger */}
              <div className="p-5 rounded-2xl bg-[#141722] border border-[#232838] space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">
                      Subscriber Email (for VIP pass activation):
                    </label>
                    <input
                      type="email"
                      value={currentUser?.email || customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="Enter your email address"
                      disabled={Boolean(currentUser?.email)}
                      className="w-full bg-[#0b0d13] border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 disabled:opacity-75"
                    />
                  </div>

                  <div className="shrink-0 flex items-end">
                    <button
                      onClick={handleProceedToGateway}
                      disabled={loading}
                      className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CreditCard className="w-4 h-4" />
                      )}
                      <span>Pay ₹{currentSelectedPlan.price} with FamGateway</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                  <span>Secured by FamGateway & UPI payment infrastructure</span>
                  <span>Instant 100% automated activation</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: FamGateway Checkout View */}
          {checkoutStep === 'gateway' && orderDetails && (
            <div className="max-w-md mx-auto space-y-6 animate-fade-in">
              <div className="text-center space-y-1">
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                  FamGateway Payment Gateway
                </span>
                <h3 className="text-xl font-black text-white font-['Syne']">
                  Complete Your Subscription
                </h3>
              </div>

              {/* Order Card */}
              <div className="p-6 rounded-2xl bg-[#141722] border border-[#232838] space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <div>
                    <h4 className="text-sm font-bold text-white">{currentSelectedPlan.name}</h4>
                    <span className="text-xs text-slate-400">{currentSelectedPlan.durationText}</span>
                  </div>
                  <div className="text-2xl font-black text-amber-400 font-['Syne']">
                    ₹{orderDetails.plan.price}
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Order Reference:</span>
                    <span className="font-mono text-white">{orderDetails.orderId}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Subscriber:</span>
                    <span className="text-white">{orderDetails.paymentDetails.customerEmail}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Gateway:</span>
                    <span className="text-emerald-400 font-semibold">FamGateway Live</span>
                  </div>
                </div>

                {/* UPI Intent Box */}
                <div className="p-4 rounded-xl bg-[#0b0d13] border border-slate-800 text-center space-y-2">
                  <span className="text-[11px] text-slate-400 block">
                    FamGateway UPI Payment Address:
                  </span>
                  <div className="text-xs font-mono font-bold text-amber-300 select-all bg-slate-900 py-1.5 px-3 rounded-lg border border-slate-800 inline-block">
                    {orderDetails.paymentDetails.upiId}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Supports Google Pay, PhonePe, Paytm, BHIM & FamPay UPI
                  </p>
                </div>

                {/* Direct UPI App Trigger if on mobile */}
                {orderDetails.paymentDetails.upiUrl && (
                  <a
                    href={orderDetails.paymentDetails.upiUrl}
                    className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <span>Open UPI Payment App</span>
                  </a>
                )}

                {/* Complete / Verify Button */}
                <button
                  onClick={handleVerifyPayment}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Confirm Payment & Activate VIP Now</span>
                </button>

                <button
                  onClick={() => setCheckoutStep('select')}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-300 py-1 transition cursor-pointer"
                >
                  ← Back to Plans
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Success Confirmation */}
          {checkoutStep === 'success' && (
            <div className="max-w-md mx-auto text-center space-y-5 py-6 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black text-white font-['Syne']">
                  VIP Membership Activated!
                </h3>
                <p className="text-xs text-slate-300">
                  Payment processed via FamGateway. All premium series and movies are now unlocked for your account.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#141722] border border-[#232838] text-xs space-y-1.5 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-400">Plan:</span>
                  <span className="font-bold text-white">{currentSelectedPlan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-emerald-400 font-bold">Active & Verified</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer"
              >
                Start Watching Premium Anime Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
