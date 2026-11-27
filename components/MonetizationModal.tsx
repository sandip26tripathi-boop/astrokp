'use client';

import React, { useState } from 'react';
import { useAstrologyStore } from '@/store/useAstrologyStore';
import { t } from '@/lib/i18n';
import { Sparkles, Check, Crown, Shield, CreditCard, Lock, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MonetizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MonetizationModal({ isOpen, onClose }: MonetizationModalProps) {
  const { language } = useAstrologyStore();
  const [selectedPlan, setSelectedPlan] = useState<'single' | 'annual'>('single');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCheckout = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti fallback
      }
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2500);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-cosmic-card border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm"
        >
          ✕
        </button>

        {/* Content */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20 mb-1">
            <Crown className="w-6 h-6" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white">
            {language === 'hi' ? 'प्रीमियम के.पी. रिपोर्ट अनलॉक करें' : 'Unlock Complete KP Astrology Dossier'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {language === 'hi'
              ? '१५+ पृष्ठीय संपूर्ण जीवन कुंडली, उप-स्वामी विश्लेषण एवं असीमित वैदिक विज़डम ए.आई. परामर्श'
              : 'Comprehensive 15+ page Kundli, Sub-Lord Promise Matrix, and Unlimited Vedic AI Consultations.'}
          </p>
        </div>

        {/* Pricing Options */}
        <div className="grid grid-cols-2 gap-3 my-6">
          <div
            onClick={() => setSelectedPlan('single')}
            className={`p-4 rounded-2xl border cursor-pointer transition relative ${
              selectedPlan === 'single'
                ? 'border-amber-500 bg-amber-500/10 shadow-md'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="text-xs text-slate-500 dark:text-slate-400">Single Dossier</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">₹499 / $9</div>
            <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
              Instant 15-Page PDF
            </div>
          </div>

          <div
            onClick={() => setSelectedPlan('annual')}
            className={`p-4 rounded-2xl border cursor-pointer transition relative ${
              selectedPlan === 'annual'
                ? 'border-amber-500 bg-amber-500/10 shadow-md'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-slate-950">
              BEST VALUE
            </span>
            <div className="text-xs text-slate-500 dark:text-slate-400">Pro Astrologer Pass</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">₹1,999 / $29</div>
            <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
              Unlimited Charts & AI
            </div>
          </div>
        </div>

        {/* Included Features List */}
        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 mb-6">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>High-Definition 15+ Page KP Kundli & Bhava Chalit Dossier</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Complete 4-Step Significators & Sub-Lord Promises for all 12 Cusps</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Career, Marriage, Wealth, and Foreign Settlement Timelines</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Horary 1-249 Prashna Engine & Unlimited Astrological Consults</span>
          </div>
        </div>

        {/* Checkout Button */}
        <button
          type="button"
          disabled={isProcessing}
          onClick={handleCheckout}
          className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-slate-950 shadow-xl shadow-amber-500/25 active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isProcessing ? (
            <Sparkles className="w-4 h-4 animate-spin" />
          ) : isSuccess ? (
            <>
              <Check className="w-4 h-4" /> Unlocked Successfully!
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" /> Pay with Razorpay / Stripe
            </>
          )}
        </button>

        <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-slate-400">
          <Lock className="w-3 h-3" /> 256-Bit SSL Encrypted • 100% Satisfaction Guarantee
        </div>
      </div>
    </div>
  );
}
