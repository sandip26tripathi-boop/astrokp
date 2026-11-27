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
import AutoRecoveryBoundary from '@/components/AutoRecoveryBoundary';
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
  const [showCalculations, setShowCalculations] = useState(false);
  const [activeCalcTab, setActiveCalcTab] = useState<'chart' | 'events' | 'matrix' | 'btr'>('chart');

  // Ensure page starts at top
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden w-full max-w-full bg-[#FAF4E6] dark:bg-[#1A140E] text-[#231A12] dark:text-[#FAF4E6] selection:bg-[#B87314] selection:text-[#FFFDF7]">
      {/* Background Sandalwood Warm Radial Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] max-w-[100vw] h-[550px] bg-gradient-to-b from-[#B87314]/10 via-[#D4AF37]/5 to-transparent blur-3xl" />
        <div className="absolute top-[800px] -left-40 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl" />
        <div className="absolute top-[1400px] -right-40 w-96 h-96 bg-[#B87314]/10 rounded-full blur-3xl" />
      </div>

      {/* Real-time Ruling Planets HUD Header Banner */}
      <AutoRecoveryBoundary moduleName="RulingPlanetsHUD">
        <RulingPlanetsBar />
      </AutoRecoveryBoundary>

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-[#F3E8D2] text-[#B87314] dark:bg-[#2A1F16] dark:text-[#D4AF37] border border-[#E4D5B7] dark:border-[#443525] shadow-sm animate-fade-in max-w-full flex-wrap justify-center">
            <Sparkles className="w-3.5 h-3.5 text-[#B87314]" />
            <span>
              {language === 'hi'
                ? 'प्रामाणिक वैदिक ज्योतिष एवं AI इंटेलिजेंस'
                : 'Vedic Astrological Standard & AI Intelligence'}
            </span>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold font-serif tracking-tight text-[#231A12] dark:text-[#FFFDF7] leading-snug sm:leading-tight">
              Astronomical Precision Meets{' '}
              <span className="gold-gradient-text">Cosmic Intelligence</span>.
            </h1>
            <p className="text-base sm:text-xl md:text-2xl font-serif font-bold text-[#5C4D3C] dark:text-[#D4AF37] tracking-wide leading-relaxed">
              सटीक खगोलीय गणना, गहन ज्योतिषीय समझ।
            </p>
          </div>

          <p className="text-sm sm:text-base text-[#5C4D3C] dark:text-[#D8C39E] max-w-2xl mx-auto leading-relaxed px-1">
            {language === 'hi'
              ? 'वैदिक लग्न चक्र, भाव चलित, विंशोत्तरी महादशा-अंतर्दशा एवं वास्तविक गोचर आधारित १००% प्रामाणिक विश्लेषण व VedicWisdom फलादेश।'
              : 'Generate authentic Vedic D1 and Bhava Chalit Kundlis with exact planetary positions, Vimshottari dasha, and real-time verifiable predictions from VedicWisdom.'}
          </p>

          {/* Quick Metrics Bar */}
          <div className="pt-1 sm:pt-2 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-xs sm:text-sm font-medium text-[#5C4D3C] dark:text-[#D8C39E]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#B87314]" />
              <span>{language === 'hi' ? 'वैदिक अयनांश' : 'Vedic Ayanamsa'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#B87314]" />
              <span>{language === 'hi' ? 'लग्न व भाव चलित' : 'D1 & Bhava Chalit'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#B87314]" />
              <span>{language === 'hi' ? 'VedicWisdom परामर्श' : 'VedicWisdom Voice'}</span>
            </div>
          </div>
        </div>

        {/* Section 1: Birth Details & Geocoding Input Form */}
        <div className="w-full">
          <AutoRecoveryBoundary moduleName="KundliForm">
            <KundliForm />
          </AutoRecoveryBoundary>
        </div>

        {/* Section 2: Astrological Calculations & Charts Suite (Hidden by default; opens on demand) */}
        <div id="chart-viewer-section" className="w-full pt-1">
          <div
            onClick={() => setShowCalculations(!showCalculations)}
            className="w-full flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-[#FFFDF7] dark:bg-[#231A12] border border-[#E4D5B7] dark:border-[#443525] hover:border-[#D4AF37] cursor-pointer transition shadow-sandalwood group select-none"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#F3E8D2] text-[#B87314] dark:bg-[#2A1F16] dark:text-[#D4AF37] flex items-center justify-center shrink-0 border border-[#E4D5B7] dark:border-[#443525] group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-[#B87314]" />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-bold font-serif text-[#231A12] dark:text-[#FFFDF7] flex items-center gap-2">
                  <span>
                    {language === 'hi'
                      ? 'विस्तृत कुंडली चक्र एवं ज्योतिषीय गणनाएं'
                      : 'Kundli Charts & Astrological Calculations'}
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-[#5C4D3C] dark:text-[#D8C39E] mt-0.5">
                  {language === 'hi'
                    ? 'D1 लग्न चक्र, भाव चलित, ग्रह स्थितियां, कस्पल सब-लॉर्ड एवं इवेंट टाइमिंग स्कोर देखने के लिए खोलें'
                    : 'Click to view D1 Lagna, Bhava Chalit, Placidus Cusps, Planet Longitudes & Event Verification'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-full bg-[#F3E8D2] text-[#B87314] dark:bg-[#2A1F16] dark:text-[#D4AF37] border border-[#E4D5B7] dark:border-[#443525]">
                {showCalculations
                  ? (language === 'hi' ? 'गणनाएं छुपाएं ▲' : 'Hide Calculations ▲')
                  : (language === 'hi' ? 'गणनाएं देखें ▼' : 'View Calculations ▼')}
              </span>
              {showCalculations ? (
                <ChevronUp className="w-5 h-5 text-[#B87314]" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[#B87314]" />
              )}
            </div>
          </div>

          {showCalculations && (
            <div className="mt-4 space-y-6 animate-fade-in">
              {/* Tab Navigation inside calculations */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#E4D5B7] dark:border-[#443525]">
                <div className="flex items-center flex-wrap gap-1.5 p-1 rounded-xl bg-[#F3E8D2] dark:bg-[#2A1F16] border border-[#E4D5B7] dark:border-[#443525]">
                  <button
                    type="button"
                    onClick={() => setActiveCalcTab('chart')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition ${
                      activeCalcTab === 'chart'
                        ? 'bg-[#B87314] text-[#FFFDF7] shadow-sm'
                        : 'text-[#5C4D3C] dark:text-[#D8C39E] hover:text-[#231A12] dark:hover:text-[#FFFDF7]'
                    }`}
                  >
                    <Compass className="w-4 h-4" />
                    <span>{language === 'hi' ? 'कुंडली चक्र (D1 & भाव चलित)' : 'Kundli Charts (D1 & Bhava)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveCalcTab('events')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition ${
                      activeCalcTab === 'events'
                        ? 'bg-[#B87314] text-[#FFFDF7] shadow-sm'
                        : 'text-[#5C4D3C] dark:text-[#D8C39E] hover:text-[#231A12] dark:hover:text-[#FFFDF7]'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{language === 'hi' ? 'इवेंट चेकलिस्ट (Event Scores)' : 'Event Checklist'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveCalcTab('matrix')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition ${
                      activeCalcTab === 'matrix'
                        ? 'bg-[#B87314] text-[#FFFDF7] shadow-sm'
                        : 'text-[#5C4D3C] dark:text-[#D8C39E] hover:text-[#231A12] dark:hover:text-[#FFFDF7]'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>{language === 'hi' ? 'कस्पल व ग्रह तालिकाएं' : 'Cuspal & Planet Tables'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveCalcTab('btr')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition ${
                      activeCalcTab === 'btr'
                        ? 'bg-[#B87314] text-[#FFFDF7] shadow-sm'
                        : 'text-[#5C4D3C] dark:text-[#D8C39E] hover:text-[#231A12] dark:hover:text-[#FFFDF7]'
                    }`}
                  >
                    <Sliders className="w-4 h-4" />
                    <span>{language === 'hi' ? 'जन्म समय शुद्धि (BTR)' : 'BTR Workspace'}</span>
                  </button>
                </div>
              </div>

              {/* Tab Contents */}
              <AutoRecoveryBoundary moduleName="CalculationsSuite">
                {activeCalcTab === 'chart' && (
                  <div className="w-full space-y-4">
                    <ChartViewer />
                  </div>
                )}

                {activeCalcTab === 'events' && (
                  <div className="w-full">
                    <EventChecklist />
                  </div>
                )}

                {activeCalcTab === 'matrix' && (
                  <div className="w-full">
                    <KPDataTable />
                  </div>
                )}

                {activeCalcTab === 'btr' && (
                  <div className="w-full">
                    <BTRWorkspace />
                  </div>
                )}
              </AutoRecoveryBoundary>
            </div>
          )}
        </div>

        {/* Section 4: VedicWisdom AI Assistant */}
        <div className="w-full space-y-4 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#231A12] dark:text-[#FFFDF7] flex items-center gap-2">
                <PanditJiIcon size={28} />
                {language === 'hi' ? 'VedicWisdom (ज्योतिषीय परामर्श)' : 'VedicWisdom (Astrological Guidance)'}
              </h2>
              <p className="text-xs sm:text-sm text-[#5C4D3C] dark:text-[#D8C39E]">
                Inquires against your computed planetary positions, D1 chart, Cusps, and Dasha periods.
              </p>
            </div>

            <button
              onClick={() => setShowReport(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#F3E8D2] hover:bg-[#E4D5B7] text-[#B87314] dark:bg-[#2A1F16] dark:text-[#D4AF37] border border-[#E4D5B7] dark:border-[#443525] transition"
            >
              <Download className="w-3.5 h-3.5 text-[#B87314]" />
              {t('exportPdf', language)}
            </button>
          </div>

          <AutoRecoveryBoundary moduleName="AstrologyChat">
            <AstrologyChat />
          </AutoRecoveryBoundary>
        </div>

        {/* Section 5: Legal Disclaimer Box */}
        <div className="w-full pt-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-[#F3E8D2]/40 dark:bg-[#1A140E]/60 border border-[#E4D5B7] dark:border-[#443525] text-[#231A12] dark:text-[#FAF4E6] space-y-2 shadow-sm">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#B87314] dark:text-[#D4AF37]">
              <ShieldAlert className="w-4 h-4 shrink-0 text-[#B87314]" />
              <span>
                {language === 'hi' ? 'महत्वपूर्ण कानूनी अस्वीकरण (Legal Disclaimer)' : 'Important Legal Disclaimer'}
              </span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-[#5C4D3C] dark:text-[#D8C39E]">
              {language === 'hi'
                ? '⚠️ यह रिपोर्ट, कुंडली गणनाएं एवं सभी भविष्यवाणियां आर्टिफिशियल इंटेलिजेंस (AI Generated) तथा वैदिक व कस्पल ज्योतिष के प्रामाणिक गणितीय नियमों पर आधारित एल्गोरिदम द्वारा स्वतः जनरेट की गई हैं। यह केवल शोध, अध्ययन एवं सामान्य मार्गदर्शन के उद्देश्य से प्रस्तुत की गई हैं। किसी भी महत्वपूर्ण जीवन निर्णय, विवाह, करियर, कानूनी या स्वास्थ्य (चिकित्सा) संबंधी मामलों में शत-प्रतिशत सटीक व अंतिम मार्गदर्शन हेतु अनुभवी एवं प्रमाणित विशेषज्ञ ज्योतिषी (Expert Astrologer) से व्यक्तिगत परामर्श अवश्य लें।'
                : '⚠️ All astrological charts, predictive insights, and analysis presented on this platform are automatically generated through Artificial Intelligence (AI Generated) and algorithmic Vedic principles. They are intended strictly for educational, research, and general exploratory guidance. For life-altering decisions regarding health, relationships, career, legal, or financial matters, please seek individualized consultation from a qualified, certified expert astrologer.'}
            </p>
          </div>
        </div>

        {/* Section 6: Research & Concept Developer Profile (Sandeep K Tripathi) */}
        <div className="w-full pt-4">
          <div className="p-6 sm:p-8 rounded-3xl bg-[#F3E8D2] dark:bg-[#231A12] border border-[#E4D5B7] dark:border-[#443525] border-t-4 border-t-[#D4AF37] dark:border-t-[#D4AF37] shadow-sandalwood">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              {/* Profile Avatar / Photo */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-[#B87314] via-[#D4AF37] to-[#9A5E0D] p-1 shadow-md shadow-[#B87314]/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/sandeep-tripathi.jpg"
                    alt={language === 'hi' ? 'संदीप के. त्रिपाठी' : 'Sandeep K. Tripathi'}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div className="absolute -bottom-2 -right-1 px-2.5 py-0.5 rounded-full bg-[#B87314] text-[#FFFDF7] text-[10px] font-extrabold shadow-md uppercase tracking-wider">
                  {language === 'hi' ? 'संस्थापक' : 'FOUNDER'}
                </div>
              </div>

              {/* Developer Info */}
              <div className="flex-1 space-y-2">
                <h3 className="text-xl sm:text-2xl font-bold font-serif text-[#231A12] dark:text-[#FFFDF7]">
                  {language === 'hi'
                    ? 'संरचना एवं परिकल्पना: संदीप के. त्रिपाठी'
                    : 'Architected by Sandeep K. Tripathi'}
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-[#B87314] dark:text-[#D4AF37] tracking-wide">
                  {language === 'hi'
                    ? 'एस्ट्रो-वास्तु शोधकर्ता, शिक्षक एवं ऐप डेवलपर'
                    : 'AstroVastu Researcher, Educator & App Developer'}
                </p>

                <p className="text-sm sm:text-base text-[#231A12] dark:text-[#FAF4E6] leading-relaxed max-w-3xl">
                  {language === 'hi'
                    ? 'शास्त्रीय वैदिक, के.पी. (KP) एवं पाराशरी ज्योतिष के साथ-साथ स्थानिक ऊर्जा विज्ञान (एस्ट्रो-वास्तु) में वर्षों के गहन शोध पर आधारित। संदीप के. त्रिपाठी द्वारा परिकल्पित यह प्रणाली प्राचीन खगोलीय गणित और आधुनिक बुद्धिमत्ता का समन्वय करती है—जो जीवन और व्यवसाय के महत्वपूर्ण निर्णयों के लिए तर्कसंगत और सटीक अंतर्दृष्टि प्रदान करती है।'
                    : 'Built upon years of rigorous research in classical Vedic, KP, and Parashari astrology alongside spatial energy dynamics (AstroVastu). Conceived by Sandeep K. Tripathi to bridge ancient astronomical mathematics with modern computational intelligence—delivering structured, logic-driven insights for strategic life and executive decisions.'}
                </p>

                {/* Expertise Badges */}
                <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm font-semibold text-[#231A12] dark:text-[#FFFDF7]">
                  <span className="px-2.5 py-1 rounded-lg bg-[#FFFDF7] dark:bg-[#2A1F16] border border-[#E4D5B7] dark:border-[#443525] shadow-sm flex items-center gap-1">
                    <span>🔭</span>
                    <span>{language === 'hi' ? 'वैदिक व के.पी. ज्योतिष अनुसंधान' : 'Vedic & KP Astrological Research'}</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#FFFDF7] dark:bg-[#2A1F16] border border-[#E4D5B7] dark:border-[#443525] shadow-sm flex items-center gap-1">
                    <span>🏛️</span>
                    <span>{language === 'hi' ? 'एस्ट्रो-वास्तु ऊर्जा संतुलन' : 'AstroVastu Energy Dynamics'}</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#FFFDF7] dark:bg-[#2A1F16] border border-[#E4D5B7] dark:border-[#443525] shadow-sm flex items-center gap-1">
                    <span>📚</span>
                    <span>{language === 'hi' ? 'शोधकर्ता एवं शिक्षक' : 'Researcher & Educator'}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 7: Astrological Modules (Locked / Coming Soon) */}
        <div className="pt-6 border-t border-[#E4D5B7] dark:border-[#443525]">
          <div className="text-center max-w-xl mx-auto mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-[#F3E8D2] dark:bg-[#2A1F16] text-[#8A7967] border border-[#E4D5B7] dark:border-[#443525] mb-2">
              <Lock className="w-3 h-3 text-[#B87314]" />
              <span>{language === 'hi' ? '🔒 लॉक मॉड्यूल - शीघ्र उपलब्ध' : '🔒 Locked Modules - Coming Soon'}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold font-serif text-[#231A12] dark:text-[#FFFDF7]">
              Commercial-Grade Astrological Modules
            </h3>
            <p className="text-xs text-[#5C4D3C] dark:text-[#D8C39E] mt-1">
              {language === 'hi'
                ? 'स्विट्जरलैंड एफिमिरिस और प्लासिडस कस्पल गणना पर आधारित व्यावसायिक मॉड्यूल (जल्द लॉन्च हो रहे हैं)।'
                : 'Enterprise-grade astrological calculation engines (Launching Soon).'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Module 1: Corporate & Financial */}
            <div className="relative p-5 rounded-2xl bg-[#F3E8D2] dark:bg-[#231A12] border border-[#E4D5B7] dark:border-[#443525] shadow-sandalwood opacity-95 select-none">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFFDF7] dark:bg-[#2A1F16] text-[#B87314] dark:text-[#D4AF37] border border-[#E4D5B7] dark:border-[#443525] flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFFDF7] dark:bg-[#2A1F16] text-[#8A7967] border border-[#E4D5B7] dark:border-[#443525]">
                  <Lock className="w-2.5 h-2.5 text-[#8A7967]" />
                  <span>Locked</span>
                </span>
              </div>
              <h4 className="text-sm font-bold text-[#231A12] dark:text-[#FFFDF7] mb-1">
                Corporate & Financial Astrology
              </h4>
              <p className="text-xs text-[#5C4D3C] dark:text-[#D8C39E] leading-relaxed mb-3">
                B2B executive chart audits, startup incorporation timing, and business partnership analysis.
              </p>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8A7967]">
                <Lock className="w-3.5 h-3.5 text-[#8A7967]" />
                <span>{language === 'hi' ? 'मॉड्यूल लॉक है • शीघ्र उपलब्ध' : 'Locked • Launching Soon'}</span>
              </div>
            </div>

            {/* Module 2: Vedic Kundli Matching & Marriage */}
            <div className="relative p-5 rounded-2xl bg-[#F3E8D2] dark:bg-[#231A12] border border-[#E4D5B7] dark:border-[#443525] shadow-sandalwood opacity-95 select-none">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFFDF7] dark:bg-[#2A1F16] text-[#C2592B] border border-[#E4D5B7] dark:border-[#443525] flex items-center justify-center">
                  <Heart className="w-5 h-5" />
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFFDF7] dark:bg-[#2A1F16] text-[#8A7967] border border-[#E4D5B7] dark:border-[#443525]">
                  <Lock className="w-2.5 h-2.5 text-[#8A7967]" />
                  <span>Locked</span>
                </span>
              </div>
              <h4 className="text-sm font-bold text-[#231A12] dark:text-[#FFFDF7] mb-1">
                Vedic Kundli Matching & Marriage
              </h4>
              <p className="text-xs text-[#5C4D3C] dark:text-[#D8C39E] leading-relaxed mb-3">
                Evaluates mutual planetary compatibility, 7th house promise, and relationship timing beyond traditional Guna Milan.
              </p>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8A7967]">
                <Lock className="w-3.5 h-3.5 text-[#8A7967]" />
                <span>{language === 'hi' ? 'मॉड्यूल लॉक है • शीघ्र उपलब्ध' : 'Locked • Launching Soon'}</span>
              </div>
            </div>

            {/* Module 3: Horary 1–249 Prashna Engine */}
            <div className="relative p-5 rounded-2xl bg-[#F3E8D2] dark:bg-[#231A12] border border-[#E4D5B7] dark:border-[#443525] shadow-sandalwood opacity-95 select-none">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFFDF7] dark:bg-[#2A1F16] text-[#4A6B53] border border-[#E4D5B7] dark:border-[#443525] flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFFDF7] dark:bg-[#2A1F16] text-[#8A7967] border border-[#E4D5B7] dark:border-[#443525]">
                  <Lock className="w-2.5 h-2.5 text-[#8A7967]" />
                  <span>Locked</span>
                </span>
              </div>
              <h4 className="text-sm font-bold text-[#231A12] dark:text-[#FFFDF7] mb-1">
                Horary 1–249 Prashna Engine
              </h4>
              <p className="text-xs text-[#5C4D3C] dark:text-[#D8C39E] leading-relaxed mb-3">
                Instant answers to urgent questions without birth time using authentic sub-lord boundary mathematics.
              </p>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8A7967]">
                <Lock className="w-3.5 h-3.5 text-[#8A7967]" />
                <span>{language === 'hi' ? 'मॉड्यूल लॉक है • शीघ्र उपलब्ध' : 'Locked • Launching Soon'}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full border-t border-[#E4D5B7] dark:border-[#443525] py-6 text-xs text-[#5C4D3C] dark:text-[#D8C39E] bg-[#FFFDF7]/60 dark:bg-[#1A140E]/60">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <p className="font-semibold text-[#231A12] dark:text-[#FFFDF7] text-xs sm:text-sm">
              Astronomical Precision Meets Cosmic Intelligence.
            </p>
            <p className="text-[#5C4D3C] dark:text-[#D4AF37] text-xs sm:text-sm font-medium">
              सटीक खगोलीय गणना, गहन ज्योतिषीय समझ।
            </p>
            <p className="text-[11px] text-[#8A7967] pt-0.5">
              © {new Date().getFullYear()} VedicWisdom. High-Precision Astrological Intelligence. All rights reserved.
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <Link
              href="/admin"
              className="text-[#B87314] dark:text-[#D4AF37] hover:underline font-semibold flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F3E8D2] dark:bg-[#2A1F16] border border-[#E4D5B7] dark:border-[#443525]"
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
