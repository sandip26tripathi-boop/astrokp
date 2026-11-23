'use client';

import React, { useState, useEffect } from 'react';
import { useAstrologyStore } from '@/store/useAstrologyStore';
import { getLiveRulingPlanets } from '@/lib/kp-evaluator';
import { RulingPlanets } from '@/types/astrology';
import { Shield, Sparkles, Clock, MapPin, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

export default function RulingPlanetsBar() {
  const { input, language } = useAstrologyStore();
  const [liveRP, setLiveRP] = useState<RulingPlanets | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  const refreshLiveRP = () => {
    const rp = getLiveRulingPlanets(input.latitude, input.longitude, input.timezone);
    setLiveRP(rp);
    setCurrentTime(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    setMounted(true);
    refreshLiveRP();
    const interval = setInterval(refreshLiveRP, 30000); // 30 sec auto-refresh
    return () => clearInterval(interval);
  }, [input.latitude, input.longitude, input.timezone]);

  if (!mounted || !liveRP) {
    return (
      <div className="w-full bg-slate-900/90 text-white border-b border-amber-500/20 px-4 py-2 min-h-[37px] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
            <span>LIVE RP HUD</span>
          </div>
          <span className="text-slate-400 text-[11px] font-mono">Syncing live planetary clock...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-hidden bg-slate-900/90 text-white border-b border-amber-500/30 backdrop-blur-md px-2 sm:px-4 py-2 transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-xs">
        {/* Left Badge: Live RP Status */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>LIVE RP HUD</span>
          </div>

          <div className="flex items-center gap-1 text-slate-300 text-[11px] font-mono">
            <MapPin className="w-3 h-3 text-amber-400" />
            <span className="truncate max-w-[140px] sm:max-w-none">{input.placeName.split(',')[0]}</span>
            <span className="text-slate-500">({currentTime})</span>
          </div>
        </div>

        {/* Center: Live RP Keys */}
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap text-[11px]">
          <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
            <span className="text-slate-400 text-[10px]">Day:</span>
            <strong className="text-amber-300">{liveRP.dayLord}</strong>
          </div>

          <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
            <span className="text-slate-400 text-[10px]">Moon:</span>
            <span className="text-slate-200">{liveRP.moonSignLord}</span>
            <span className="text-amber-400 font-semibold">({liveRP.moonStarLord})</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
            <span className="text-slate-400 text-[10px]">Lagna:</span>
            <span className="text-slate-200">{liveRP.lagnaSignLord}</span>
            <span className="text-amber-400 font-semibold">({liveRP.lagnaStarLord})</span>
            <span className="text-emerald-400 font-bold">[{liveRP.lagnaSubLord}]</span>
          </div>
        </div>

        {/* Right Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshLiveRP}
            title="Recalculate Live RP"
            className="p-1 rounded-md text-slate-400 hover:text-amber-400 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-[10px] text-amber-400 hover:underline font-semibold"
          >
            <span>{isExpanded ? 'Hide RP Rules' : 'RP Prashna Guide'}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expanded Educational Drawer */}
      {isExpanded && (
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-300 grid grid-cols-1 md:grid-cols-3 gap-3 animate-fade-in">
          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700">
            <strong className="text-amber-400 block mb-1">Authenticating Prashna / Horary</strong>
            In Vedic Astrology, if the Horary Ascendant Sub-Lord is strongly connected to the current Ruling Planets (RP), the query is genuine and fruition is confirmed.
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700">
            <strong className="text-amber-400 block mb-1">Pinpoint Event Timing</strong>
            Events fructify when the transiting Sun or Moon touches the star/sub of these current Ruling Planets while favorable Dasha is operating.
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700">
            <strong className="text-amber-400 block mb-1">Birth Time Rectification</strong>
            The natal Ascendant Star/Sub-Lord will invariably match the Ruling Planets at the moment of query examination.
          </div>
        </div>
      )}
    </div>
  );
}
