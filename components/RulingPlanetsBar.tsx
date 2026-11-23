'use client';

import React, { useState, useEffect } from 'react';
import { useAstrologyStore } from '@/store/useAstrologyStore';
import { getLiveRulingPlanets } from '@/lib/kp-evaluator';
import { RulingPlanets } from '@/types/astrology';
import { MapPin, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

export default function RulingPlanetsBar() {
  const { input, language } = useAstrologyStore();
  const [liveRP, setLiveRP] = useState<RulingPlanets | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  const refreshLiveRP = () => {
    const lat = input.latitude || 21.90;
    const lng = input.longitude || 77.90;
    const tz = input.timezone || 5.5;
    const rp = getLiveRulingPlanets(lat, lng, tz);
    setLiveRP(rp);
    setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  useEffect(() => {
    setMounted(true);
    refreshLiveRP();
    const interval = setInterval(refreshLiveRP, 30000); // 30 sec auto-refresh
    return () => clearInterval(interval);
  }, [input.latitude, input.longitude, input.timezone]);

  if (!mounted || !liveRP) {
    return (
      <div className="w-full bg-slate-950 text-white border-b border-amber-500/20 px-3 py-1.5 min-h-[34px] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[9px] font-bold uppercase tracking-wider">
            <span>LIVE RP</span>
          </div>
          <span className="text-slate-400 text-[10px] font-mono">Syncing live planetary clock...</span>
        </div>
      </div>
    );
  }

  const placeDisplay = input.placeName && input.placeName.trim()
    ? input.placeName.split(',')[0].trim()
    : (language === 'hi' ? 'तात्कालिक कालचक्र' : 'Live Astro Clock');

  return (
    <div className="w-full max-w-full overflow-hidden bg-slate-950 text-white border-b border-amber-500/30 backdrop-blur-md px-2.5 sm:px-4 py-1.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-xs">
        {/* Left Status Badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>RP HUD</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-slate-300 text-[11px] font-mono">
            <MapPin className="w-3 h-3 text-amber-400" />
            <span className="truncate max-w-[120px] lg:max-w-none">{placeDisplay}</span>
            <span className="text-slate-500">({currentTime})</span>
          </div>
        </div>

        {/* Center: Live RP Keys (Horizontally scrollable on mobile) */}
        <div className="flex items-center gap-1.5 sm:gap-3 overflow-x-auto no-scrollbar py-0.5 text-[10px] sm:text-[11px]">
          <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 shrink-0">
            <span className="text-slate-400">{language === 'hi' ? 'वार:' : 'Day:'}</span>
            <strong className="text-amber-300">{liveRP.dayLord}</strong>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 shrink-0">
            <span className="text-slate-400">{language === 'hi' ? 'चन्द्र:' : 'Moon:'}</span>
            <span className="text-slate-200">{liveRP.moonSignLord}</span>
            <span className="text-amber-400 font-semibold">({liveRP.moonStarLord})</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 shrink-0">
            <span className="text-slate-400">{language === 'hi' ? 'लग्न:' : 'Lagna:'}</span>
            <span className="text-slate-200">{liveRP.lagnaSignLord}</span>
            <span className="text-amber-400 font-semibold">({liveRP.lagnaStarLord})</span>
            <span className="text-emerald-400 font-bold">[{liveRP.lagnaSubLord}]</span>
          </div>
        </div>

        {/* Right Toggle */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={refreshLiveRP}
            title="Recalculate Live RP"
            className="p-1 rounded-md text-slate-400 hover:text-amber-400 transition"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-0.5 text-[10px] text-amber-400 hover:underline font-semibold"
          >
            <span className="hidden sm:inline">{isExpanded ? 'Hide Rules' : 'RP Prashna Guide'}</span>
            <span className="sm:hidden">{isExpanded ? '▲' : '▼'}</span>
            {isExpanded ? (
              <ChevronUp className="w-3 h-3 hidden sm:inline" />
            ) : (
              <ChevronDown className="w-3 h-3 hidden sm:inline" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Educational Drawer */}
      {isExpanded && (
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-300 grid grid-cols-1 md:grid-cols-3 gap-2.5 animate-fade-in">
          <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
            <strong className="text-amber-400 block mb-1">
              {language === 'hi' ? 'प्रश्न कुंडली सत्यापन' : 'Prashna Authentication'}
            </strong>
            {language === 'hi'
              ? 'यदि प्रश्न के समय लग्न सब-लॉर्ड का संबंध इन रूलिंग प्लैनेट्स से हो, तो कार्य सिद्धि निश्चित होती है।'
              : 'When the Horary Cusp Sub-Lord connects with current Ruling Planets, the inquiry is confirmed.'}
          </div>
          <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
            <strong className="text-amber-400 block mb-1">
              {language === 'hi' ? 'सटीक समय निर्धारण' : 'Pinpoint Event Timing'}
            </strong>
            {language === 'hi'
              ? 'जब गोचरीय सूर्य या चन्द्रमा इन रूलिंग ग्रहों के नक्षत्र अथवा उप-नक्षत्र से गुजरते हैं, तब घटना घटित होती है।'
              : 'Events materialize when transiting Sun or Moon touches the star/sub of these Ruling Planets.'}
          </div>
          <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
            <strong className="text-amber-400 block mb-1">
              {language === 'hi' ? 'जन्म समय संशोधन (BTR)' : 'Birth Time Rectification'}
            </strong>
            {language === 'hi'
              ? 'जन्म लग्न का उप-स्वामी प्रश्न समय के रूलिंग ग्रहों से अनिवार्य रूप से सुमेलित होता है।'
              : 'The natal Ascendant Sub-Lord invariably coordinates with Ruling Planets at the examination moment.'}
          </div>
        </div>
      )}
    </div>
  );
}
