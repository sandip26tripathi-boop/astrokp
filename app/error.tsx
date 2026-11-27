'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home, Sparkles } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[VedicWisdom Self-Healing Guardian] Caught error:', error);
  }, [error]);

  const handleSelfHealAndReset = () => {
    try {
      // Clear potentially corrupted local session storage keys
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('vedic_pending_question');
      }
    } catch (e) {}
    reset();
  };

  const handleHardRefresh = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6 bg-[#FAF4E6] dark:bg-[#15100B] text-[#231A12] dark:text-[#FFFDF7]">
      <div className="w-full max-w-md bg-[#FFFDF7] dark:bg-[#1A140E] border-2 border-[#D4AF37] rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-4 animate-scale-up">
        <div className="w-14 h-14 mx-auto rounded-full bg-[#B87314]/10 border border-[#D4AF37] flex items-center justify-center text-2xl">
          🛡️
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-bold font-serif text-[#231A12] dark:text-[#FFFDF7]">
            सिस्टम स्व-सुधार सक्रिय (Auto-Recovery Active)
          </h2>
          <p className="text-xs sm:text-sm text-[#5C4D3C] dark:text-[#D8C39E] mt-1.5 leading-relaxed">
            एक क्षणिक विसंगति उत्पन्न हुई थी। वैदिक विज़डम के स्व-उपचार इंजन ने इसे सुरक्षित रूप से नियंत्रित कर लिया है।
          </p>
          <p className="text-[11px] text-[#8A7967] dark:text-[#A89886] mt-1">
            A temporary glitch was safely caught by the VedicWisdom Self-Healing Guardian.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={handleSelfHealAndReset}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#B87314] hover:bg-[#9A5E0D] text-[#FFFDF7] font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>पुनः प्रयास करें (Auto-Recover)</span>
          </button>

          <button
            type="button"
            onClick={handleHardRefresh}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#FFFDF7] dark:bg-[#231A12] border border-[#D4AF37] text-[#231A12] dark:text-[#FFFDF7] font-semibold text-xs sm:text-sm hover:bg-[#F3E8D2] transition flex items-center justify-center gap-2 active:scale-95"
          >
            <Home className="w-4 h-4 text-[#B87314]" />
            <span>होमपेज (Home)</span>
          </button>
        </div>

        <p className="text-[10px] text-[#8A7967] dark:text-[#A89886] pt-1">
          VedicWisdom High-Precision Resilient Architecture • vedicwisdom.world
        </p>
      </div>
    </div>
  );
}
