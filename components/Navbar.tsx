'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { useAstrologyStore } from '@/store/useAstrologyStore';
import { t } from '@/lib/i18n';
import {
  Sparkles,
  Sun,
  Moon,
  Globe,
  Download,
  Crown,
  Compass,
  User,
  LogIn,
  Lock,
} from 'lucide-react';
import LoginModal from './LoginModal';
import TriangleLogo from './TriangleLogo';

interface NavbarProps {
  onOpenReport: () => void;
}

export default function Navbar({ onOpenReport }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, user } = useAstrologyStore();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [lockedToast, setLockedToast] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleLockedClick = () => {
    const msg =
      language === 'hi'
        ? '🔒 प्रीमियम सुविधाएं वर्तमान में लॉक हैं और जल्द ही शुरू हो रही हैं'
        : '🔒 Premium features are currently locked and launching soon';
    setLockedToast(msg);
    setTimeout(() => {
      setLockedToast((current) => (current === msg ? null : current));
    }, 3500);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#FFFDF7]/95 dark:bg-[#1A140E]/95 border-b border-[#E4D5B7] dark:border-[#443525] transition-colors shadow-sandalwood overflow-visible box-border">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 min-h-[64px] py-3 flex items-center justify-between gap-2 sm:gap-4 overflow-visible box-border">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <TriangleLogo size="sm" />
            <div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="font-serif font-black text-sm sm:text-xl tracking-tight text-[#231A12] dark:text-[#FFFDF7]">
                  Gemini Astro
                </span>
                <span className="text-[8px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.2 rounded bg-[#F3E8D2] text-[#B87314] dark:bg-[#2A1F16] dark:text-[#D4AF37] border border-[#E4D5B7] dark:border-[#443525]">
                  PRO
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-[9.5px] sm:text-[10px] font-medium text-[#5C4D3C] dark:text-[#D8C39E] leading-tight">
                  Astronomical Precision Meets Cosmic Intelligence.
                </p>
                <p className="text-[8.5px] sm:text-[9px] font-medium text-[#5C4D3C] dark:text-[#D4AF37]/90 leading-tight">
                  सटीक खगोलीय गणना, गहन ज्योतिषीय समझ।
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Language Switcher */}
            <div className="flex items-center rounded-xl bg-[#F3E8D2] dark:bg-[#2A1F16] border border-[#E4D5B7] dark:border-[#443525] p-0.5 sm:p-1">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-semibold rounded-lg transition ${
                  language === 'en'
                    ? 'bg-[#B87314] text-[#FFFDF7] shadow-sm'
                    : 'text-[#5C4D3C] dark:text-[#D8C39E] hover:text-[#231A12] dark:hover:text-[#FFFDF7]'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-semibold rounded-lg transition ${
                  language === 'hi'
                    ? 'bg-[#B87314] text-[#FFFDF7] shadow-sm'
                    : 'text-[#5C4D3C] dark:text-[#D8C39E] hover:text-[#231A12] dark:hover:text-[#FFFDF7]'
                }`}
              >
                हिं
              </button>
            </div>

            {/* Dark / Light Toggle */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 sm:p-2 rounded-xl bg-[#F3E8D2] dark:bg-[#2A1F16] border border-[#E4D5B7] dark:border-[#443525] text-[#5C4D3C] dark:text-[#D4AF37] hover:scale-105 transition"
              aria-label="Toggle Theme"
            >
              {mounted ? (
                theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4" />
              )}
            </button>

            {/* Export PDF Button */}
            <button
              type="button"
              onClick={onOpenReport}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F3E8D2] dark:bg-[#2A1F16] hover:bg-[#E4D5B7] dark:hover:bg-[#443525] text-[#231A12] dark:text-[#FFFDF7] border border-[#E4D5B7] dark:border-[#443525] transition"
            >
              <Download className="w-3.5 h-3.5 text-[#B87314]" />
              <span>{t('exportPdf', language)}</span>
            </button>

            {/* Login / User Profile Button */}
            {user?.isLoggedIn ? (
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#B87314]/10 hover:bg-[#B87314]/20 text-[#B87314] dark:text-[#D4AF37] border border-[#B87314]/30 transition text-xs font-semibold"
                title={user.email}
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-6 h-6 rounded-full border border-[#B87314]"
                />
                <span className="hidden sm:inline max-w-[80px] truncate">{user.name.split(' ')[0]}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold bg-[#F3E8D2] dark:bg-[#2A1F16] hover:bg-[#E4D5B7] dark:hover:bg-[#443525] text-[#231A12] dark:text-[#FFFDF7] border border-[#E4D5B7] dark:border-[#443525] transition"
              >
                {/* Google G Icon */}
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.9c2.28-2.1 3.645-5.2 3.645-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.96-1.08 7.95-2.92l-3.9-3.05c-1.08.72-2.46 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.59H1.24C.45 8.16 0 9.92 0 12c0 2.08.45 3.84 1.24 5.41l4.04-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.59l4.04 3.15c.95-2.83 3.6-4.99 6.72-4.99z"
                  />
                </svg>
                <span>{language === 'hi' ? 'लॉगिन' : 'Sign In'}</span>
              </button>
            )}

            {/* Locked Premium Features Button */}
            <div className="relative">
              <button
                type="button"
                onClick={handleLockedClick}
                className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold bg-[#F3E8D2] dark:bg-[#2A1F16] text-[#8A7967] border border-[#E4D5B7] dark:border-[#443525] hover:border-[#D4AF37] hover:text-[#5C4D3C] transition shadow-sm group"
                title={language === 'hi' ? 'प्रीमियम सुविधाएं (शीघ्र उपलब्ध)' : 'Premium Features (Coming Soon)'}
                aria-label="Premium Features - Locked"
              >
                <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#B87314] group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline font-medium">
                  {language === 'hi' ? 'प्रीमियम सुविधा' : 'Premium'}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold uppercase tracking-wider">
                  Soon
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Polite Non-intrusive Toast Notification for Locked Premium */}
        {lockedToast && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 px-4 py-2 rounded-xl bg-slate-900/95 text-white dark:bg-slate-800/95 text-xs font-medium border border-amber-500/40 shadow-2xl backdrop-blur-md flex items-center gap-2 animate-fade-in max-w-[90vw] text-center">
            <span>{lockedToast}</span>
            <button
              type="button"
              onClick={() => setLockedToast(null)}
              className="text-slate-400 hover:text-white text-xs ml-1 font-bold"
            >
              ✕
            </button>
          </div>
        )}
      </header>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
}
