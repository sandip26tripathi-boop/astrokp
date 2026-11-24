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
} from 'lucide-react';
import MonetizationModal from './MonetizationModal';
import LoginModal from './LoginModal';
import TriangleLogo from './TriangleLogo';

interface NavbarProps {
  onOpenReport: () => void;
}

export default function Navbar({ onOpenReport }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, user } = useAstrologyStore();
  const [showProModal, setShowProModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/80 dark:bg-cosmic-obsidian/90 border-b border-amber-500/20 dark:border-amber-500/20 transition-colors shadow-sm">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <TriangleLogo size="sm" />
            <div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="font-serif font-black text-sm sm:text-xl tracking-tight gold-gradient-text">
                  Astro Gemini
                </span>
                <span className="text-[8px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Vedic Astrology & Astrological AI
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Language Switcher */}
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5 sm:p-1">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-semibold rounded-lg transition ${
                  language === 'en'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-semibold rounded-lg transition ${
                  language === 'hi'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                हिं
              </button>
            </div>

            {/* Dark / Light Toggle */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-amber-400 hover:scale-105 transition"
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
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition"
            >
              <Download className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('exportPdf', language)}</span>
            </button>

            {/* Login / User Profile Button */}
            {user?.isLoggedIn ? (
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition text-xs font-semibold"
                title={user.email}
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-6 h-6 rounded-full border border-amber-500"
                />
                <span className="hidden sm:inline max-w-[80px] truncate">{user.name.split(' ')[0]}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition"
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

            {/* Monetization / Unlock Pro Button */}
            <button
              type="button"
              onClick={() => setShowProModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95 transition"
            >
              <Crown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('proFeature', language)}</span>
            </button>
          </div>
        </div>
      </header>

      <MonetizationModal isOpen={showProModal} onClose={() => setShowProModal(false)} />
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
}
