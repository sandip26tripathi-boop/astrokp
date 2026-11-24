'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import RulingPlanetsBar from '@/components/RulingPlanetsBar';
import KundliForm from '@/components/KundliForm';
import ChartViewer from '@/components/ChartViewer';
import EventChecklist from '@/components/EventChecklist';
import BTRWorkspace from '@/components/BTRWorkspace';
import KPDataTable from '@/components/KPDataTable';
import AstrologyChat from '@/components/AstrologyChat';
import ReportView from '@/components/ReportView';
import PanditJiIcon from '@/components/PanditJiIcon';
import { useAstrologyStore } from '@/store/useAstrologyStore';
import { t } from '@/lib/i18n';
import {
  Sparkles,
  Compass,
  Layers,
  Bot,
  ShieldCheck,
  ShieldAlert,
  Download,
  Crown,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Heart,
  Briefcase,
  CheckCircle2,
  Sliders,
  GraduationCap,
  BookOpen,
  Lock,
} from 'lucide-react';

export default function Home() {
  const { kpMatrix, language } = useAstrologyStore();
  const [showReport, setShowReport] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<'matrix' | 'btr'>('matrix');
  const [showAstronomicalData, setShowAstronomicalData] = useState(false);

  // Ensure page starts at top
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden w-full max-w-full bg-ivory-bg dark:bg-cosmic-obsidian selection:bg-amber-500 selection:text-black">
      {/* Background Cosmic Radial Glows (strictly contained to prevent horizontal scroll) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] max-w-[100vw] h-[550px] bg-gradient-to-b from-indigo-900/20 via-amber-500/5 to-transparent blur-3xl" />
        <div className="absolute top-[800px] -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute top-[1400px] -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      {/* Real-time Ruling Planets HUD Header Banner */}
      <RulingPlanetsBar />

      {/* Main Navigation */}
      <Navbar onOpenReport={() => setShowReport(true)} />

      {/* Report View Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md p-4 sm:p-8">
          <ReportView onClose={() => setShowReport(false)} />
        </div>
      )}


      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-8 sm:space-y-10">
        {/* Hero Section */}
        <div className="text-center space-y-2.5 sm:space-y-4 max-w-3xl mx-auto pt-1 sm:pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-500/10 animate-fade-in max-w-full flex-wrap justify-center">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {language === 'hi'
                ? 'प्रामाणिक वैदिक ज्योतिष एवं AI इंटेलिजेंस'
                : 'Vedic Astrological Standard & AI Intelligence'}
            </span>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <h1 className="text-xl sm:text-4xl md:text-5xl font-extrabold font-serif tracking-tight text-slate-900 dark:text-white leading-[1.2] sm:leading-[1.15]">
              Astronomical Precision Meets{' '}
              <span className="gold-gradient-text">Cosmic Intelligence</span>.
            </h1>
            <p className="text-sm sm:text-xl md:text-2xl font-serif font-bold text-amber-600 dark:text-amber-400 tracking-wide leading-relaxed">
              सटीक खगोलीय गणना, गहन ज्योतिषीय समझ।
            </p>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed px-1">
            {language === 'hi'
              ? 'वैदिक लग्न चक्र, भाव चलित, विंशोत्तरी महादशा-अंतर्दशा एवं वास्तविक गोचर आधारित १००% प्रामाणिक विश्लेषण व Gemini Astro फलादेश।'
              : 'Generate authentic Vedic D1 and Bhava Chalit Kundlis with exact planetary positions, Vimshottari dasha, and real-time verifiable predictions from Gemini Astro.'}
          </p>

          {/* Quick Metrics Bar */}
          <div className="pt-1 sm:pt-2 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
              <span>{language === 'hi' ? 'वैदिक अयनांश' : 'Vedic Ayanamsa'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
              <span>{language === 'hi' ? 'लग्न व भाव चलित' : 'D1 & Bhava Chalit'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
              <span>{language === 'hi' ? 'Gemini Astro परामर्श' : 'Gemini Astro Voice'}</span>
            </div>
          </div>
        </div>

        {/* Section 1: Birth Details & Geocoding Input Form */}
        <div className="w-full">
          <KundliForm />
        </div>

        {/* Section 2: Interactive Dynamic Chart Visualizer */}
        <div id="chart-viewer-section" className="w-full space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
                <Compass className="w-6 h-6 text-amber-500" />
                {t('chartViewer', language)}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Interactive D1 Lagna & Bhava Chalit Kundli with Real-time Cusp Highlighting
              </p>
            </div>
          </div>

          {/* Full-width Kundli Chart Viewer */}
          <div className="w-full">
            <ChartViewer />
          </div>

          {/* Full-width Event Checklist & Probability Scores */}
          <div className="w-full pt-2">
            <EventChecklist />
          </div>
        </div>

        {/* Section 3: Astrological Data Tables & BTR Workspace (Hidden by default, opens on click) */}
        <div className="w-full pt-4">
          <div
            onClick={() => setShowAstronomicalData(!showAstronomicalData)}
            className="w-full flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-amber-500/20 hover:border-amber-500/40 cursor-pointer transition shadow-md group"
          >
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-6 h-6 text-amber-500 group-hover:rotate-6 transition-transform" />
                Astronomical Data & Analysis
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Deep dive into Placidus Cuspal details, Sub-Lords, and rectification tools.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {showAstronomicalData
                  ? (language === 'hi' ? 'क्लिक करके छुपाएं' : 'Click to Collapse')
                  : (language === 'hi' ? 'विस्तार से देखने के लिए क्लिक करें' : 'Click to Expand')}
              </span>
              {showAstronomicalData ? (
                <ChevronUp className="w-5 h-5 text-amber-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-amber-500" />
              )}
            </div>
          </div>

          {showAstronomicalData && (
            <div className="mt-4 space-y-4 animate-fade-in">
              {/* Toggle Tabs */}
              <div className="flex items-center justify-end">
                <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1">
                  <button
                    type="button"
                    onClick={() => setActiveBottomTab('matrix')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                      activeBottomTab === 'matrix'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>कस्पल व ग्रह तालिकाएं</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveBottomTab('btr')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                      activeBottomTab === 'btr'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Birth Time Rectification (BTR)</span>
                  </button>
                </div>
              </div>

              {activeBottomTab === 'matrix' ? <KPDataTable /> : <BTRWorkspace />}
            </div>
          )}
        </div>

        {/* Section 4: Gemini Astro AI Assistant */}
        <div className="w-full space-y-4 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
                <PanditJiIcon size={28} />
                {language === 'hi' ? 'Gemini Astro (ज्योतिषीय परामर्श)' : 'Gemini Astro (Astrological Guidance)'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Inquires against your computed planetary positions, D1 chart, Cusps, and Dasha periods.
              </p>
            </div>

            <button
              onClick={() => setShowReport(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition"
            >
              <Download className="w-3.5 h-3.5" />
              {t('exportPdf', language)}
            </button>
          </div>

          <AstrologyChat />
        </div>

        {/* Section 5: Legal Disclaimer Box */}
        <div className="w-full pt-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/5 border border-amber-500/30 text-slate-700 dark:text-slate-300 space-y-2 shadow-sm">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-400">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500" />
              <span>
                {language === 'hi' ? 'महत्वपूर्ण कानूनी अस्वीकरण (Legal Disclaimer)' : 'Important Legal Disclaimer'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              {language === 'hi'
                ? '⚠️ यह रिपोर्ट, कुंडली गणनाएं एवं सभी भविष्यवाणियां आर्टिफिशियल इंटेलिजेंस (AI Generated) तथा वैदिक व कस्पल ज्योतिष के प्रामाणिक गणितीय नियमों पर आधारित एल्गोरिदम द्वारा स्वतः जनरेट की गई हैं। यह केवल शोध, अध्ययन एवं सामान्य मार्गदर्शन के उद्देश्य से प्रस्तुत की गई हैं। किसी भी महत्वपूर्ण जीवन निर्णय, विवाह, करियर, कानूनी या स्वास्थ्य (चिकित्सा) संबंधी मामलों में शत-प्रतिशत सटीक व अंतिम मार्गदर्शन हेतु अनुभवी एवं प्रमाणित विशेषज्ञ ज्योतिषी (Expert Astrologer) से व्यक्तिगत परामर्श अवश्य लें।'
                : '⚠️ All astrological charts, predictive insights, and analysis presented on this platform are automatically generated through Artificial Intelligence (AI Generated) and algorithmic Vedic principles. They are intended strictly for educational, research, and general exploratory guidance. For life-altering decisions regarding health, relationships, career, legal, or financial matters, please seek individualized consultation from a qualified, certified expert astrologer.'}
            </p>
          </div>
        </div>

        {/* Section 6: Research & Concept Developer Profile (Sandeep K Tripathi) */}
        <div className="w-full pt-4">
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-500/5 via-indigo-500/5 to-purple-500/5 dark:bg-gradient-to-br dark:from-amber-500/10 dark:via-cosmic-card dark:to-slate-900 border border-amber-500/25 shadow-xl">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              {/* Profile Avatar / Photo */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-indigo-600 p-1 shadow-2xl shadow-amber-500/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/sandeep-tripathi.jpg"
                    alt={language === 'hi' ? 'संदीप के. त्रिपाठी' : 'Sandeep K. Tripathi'}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div className="absolute -bottom-2 -right-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold shadow-md uppercase tracking-wider">
                  {language === 'hi' ? 'संस्थापक' : 'FOUNDER'}
                </div>
              </div>

              {/* Developer Info */}
              <div className="flex-1 space-y-2">
                <h3 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white">
                  {language === 'hi'
                    ? 'संरचना एवं परिकल्पना: संदीप के. त्रिपाठी'
                    : 'Architected by Sandeep K. Tripathi'}
                </h3>
                <p className="text-xs sm:text-sm font-semibold gold-gradient-text tracking-wide">
                  {language === 'hi'
                    ? 'एस्ट्रो-वास्तु शोधकर्ता, शिक्षक एवं ऐप डेवलपर'
                    : 'AstroVastu Researcher, Educator & App Developer'}
                </p>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                  {language === 'hi'
                    ? 'शास्त्रीय वैदिक, के.पी. (KP) एवं पाराशरी ज्योतिष तथा वास्तु ऊर्जा संतुलन में वर्षों के गहन शोध पर आधारित। संदीप के. त्रिपाठी द्वारा निर्मित यह प्रणाली प्राचीन खगोलीय गणित और आधुनिक कंप्यूटिंग का समन्वय करती है—जो जीवन और व्यवसाय के महत्वपूर्ण निर्णयों के लिए तर्कसंगत और सटीक मार्गदर्शन प्रदान करती है।'
                    : 'Built upon years of rigorous research in classical Vedic, KP, and Parashari astrology alongside spatial energy dynamics (AstroVastu). Conceived by Sandeep K. Tripathi to bridge ancient astronomical mathematics with modern computational intelligence—delivering structured, logic-driven insights for strategic life and executive decisions.'}
                </p>

                {/* Expertise Badges */}
                <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  <span className="px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1">
                    <span>🔭</span>
                    <span>{language === 'hi' ? 'वैदिक व के.पी. ज्योतिष अनुसंधान' : 'Vedic & KP Astrological Research'}</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1">
                    <span>🏛️</span>
                    <span>{language === 'hi' ? 'एस्ट्रो-वास्तु ऊर्जा संतुलन' : 'AstroVastu Energy Dynamics'}</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1">
                    <span>📚</span>
                    <span>{language === 'hi' ? 'शोधकर्ता एवं शिक्षक' : 'Researcher & Educator'}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 7: Astrological Modules (Locked / Coming Soon) */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="text-center max-w-xl mx-auto mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 mb-2">
              <Lock className="w-3 h-3 text-amber-500" />
              <span>{language === 'hi' ? '🔒 लॉक मॉड्यूल - शीघ्र उपलब्ध' : '🔒 Locked Modules - Coming Soon'}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold font-serif text-slate-900 dark:text-white">
              Commercial-Grade Astrological Modules
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {language === 'hi'
                ? 'स्विट्जरलैंड एफिमिरिस और प्लासिडस कस्पल गणना पर आधारित व्यावसायिक मॉड्यूल (जल्द लॉन्च हो रहे हैं)।'
                : 'Enterprise-grade astrological calculation engines (Launching Soon).'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Module 1: Corporate & Financial */}
            <div className="relative p-5 rounded-2xl bg-white/60 dark:bg-cosmic-card/60 border border-slate-200 dark:border-slate-800 shadow-sm opacity-90 select-none">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  <Lock className="w-2.5 h-2.5 text-amber-500" />
                  <span>Locked</span>
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Corporate & Financial Astrology
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                B2B executive chart audits, startup incorporation timing, and business partnership analysis.
              </p>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
                <Lock className="w-3.5 h-3.5 text-amber-500/70" />
                <span>{language === 'hi' ? 'मॉड्यूल लॉक है • शीघ्र उपलब्ध' : 'Locked • Launching Soon'}</span>
              </div>
            </div>

            {/* Module 2: Vedic Kundli Matching & Marriage */}
            <div className="relative p-5 rounded-2xl bg-white/60 dark:bg-cosmic-card/60 border border-slate-200 dark:border-slate-800 shadow-sm opacity-90 select-none">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <Heart className="w-5 h-5" />
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  <Lock className="w-2.5 h-2.5 text-amber-500" />
                  <span>Locked</span>
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Vedic Kundli Matching & Marriage
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                Evaluates mutual planetary compatibility, 7th house promise, and relationship timing beyond traditional Guna Milan.
              </p>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
                <Lock className="w-3.5 h-3.5 text-amber-500/70" />
                <span>{language === 'hi' ? 'मॉड्यूल लॉक है • शीघ्र उपलब्ध' : 'Locked • Launching Soon'}</span>
              </div>
            </div>

            {/* Module 3: Horary 1–249 Prashna Engine */}
            <div className="relative p-5 rounded-2xl bg-white/60 dark:bg-cosmic-card/60 border border-slate-200 dark:border-slate-800 shadow-sm opacity-90 select-none">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  <Lock className="w-2.5 h-2.5 text-amber-500" />
                  <span>Locked</span>
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Horary 1–249 Prashna Engine
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                Instant answers to urgent questions without birth time using authentic sub-lord boundary mathematics.
              </p>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
                <Lock className="w-3.5 h-3.5 text-amber-500/70" />
                <span>{language === 'hi' ? 'मॉड्यूल लॉक है • शीघ्र उपलब्ध' : 'Locked • Launching Soon'}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full border-t border-slate-200 dark:border-slate-800 py-6 text-xs text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-cosmic-obsidian/50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
              Astronomical Precision Meets Cosmic Intelligence.
            </p>
            <p className="text-amber-600 dark:text-amber-400 text-xs sm:text-sm font-medium">
              सटीक खगोलीय गणना, गहन ज्योतिषीय समझ।
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
              © {new Date().getFullYear()} Gemini Astro. High-Precision Astrological Intelligence. All rights reserved.
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <Link
              href="/admin"
              className="text-amber-600 dark:text-amber-400 hover:underline font-semibold flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20"
            >
              <span>🔐</span>
              <span>क्लाइंट डेटा (Admin Dashboard)</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
