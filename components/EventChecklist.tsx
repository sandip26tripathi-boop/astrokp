'use client';

import React, { useState } from 'react';
import { useAstrologyStore } from '@/store/useAstrologyStore';
import { EventChecklistItem } from '@/types/astrology';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Share2,
  ChevronRight,
  ShieldAlert,
  Compass,
  Briefcase,
  Heart,
  Coins,
  Home,
  Plane,
  Baby,
  Scale,
  Gift,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  career: Briefcase,
  marriage: Heart,
  wealth: Coins,
  property: Home,
  foreign: Plane,
  childbirth: Baby,
  litigation: Scale,
};

export default function EventChecklist() {
  const { kpMatrix, language } = useAstrologyStore();
  const [selectedMilestone, setSelectedMilestone] = useState<EventChecklistItem | null>(null);
  const [copiedNotice, setCopiedNotice] = useState(false);

  if (!kpMatrix || !kpMatrix.eventChecklist) return null;

  const { eventChecklist, input } = kpMatrix;

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 55) return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
    if (score >= 40) return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
    return 'text-rose-500 bg-rose-500/10 border-rose-500/30';
  };

  const getBarColor = (score: number) => {
    if (score >= 75) return 'bg-emerald-500';
    if (score >= 55) return 'bg-amber-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-rose-500';
  };

  const shareSummary = (item: EventChecklistItem) => {
    const text = `✨ KP Astrology Prediction for ${input.name || 'Native'}:
🎯 Milestone: ${item.title}
⭐ Sub-Lord: ${item.cuspSubLord} (House ${item.primaryHouse})
📊 Probability Score: ${item.probabilityScore}% (${item.verdict})
⏳ Timing Window: ${item.timingWindow}
Checked on Gemini Astro KP!`;

    if (navigator.share) {
      navigator.share({
        title: `KP Horoscope: ${item.title}`,
        text,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2500);
    }
  };

  return (
    <div className="w-full max-w-full overflow-hidden bg-white/80 dark:bg-cosmic-card/90 backdrop-blur-xl border border-amber-500/20 dark:border-amber-500/30 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
            <h3 className="text-base sm:text-lg font-bold font-serif text-slate-900 dark:text-white leading-snug">
              {language === 'hi' ? 'जीवन प्रसंग चेकलिस्ट एवं संभावना स्कोर' : 'Event & Probability Scores'}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Mathematical KP verification evaluating Cusp Sub-Lords, Supporting Houses, and Negation Factors.
          </p>
        </div>

        {copiedNotice && (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 animate-pulse">
            Copied to clipboard!
          </span>
        )}
      </div>

      {/* Responsive Grid of Milestone Cards (Full Width 1 to 4 cols) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {eventChecklist.map((item) => {
          const Icon = ICON_MAP[item.id] || Compass;
          const scoreColorClass = getScoreColor(item.probabilityScore);
          const barColorClass = getBarColor(item.probabilityScore);

          return (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-3 group w-full overflow-hidden shadow-sm"
            >
              <div>
                {/* Top Badge & Score */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
                        {language === 'hi' ? item.hindiTitle : item.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 block truncate">
                        Cusp {item.primaryHouse} SL: <strong className="text-amber-500">{item.cuspSubLord}</strong>
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold border shrink-0 ${scoreColorClass}`}
                  >
                    {item.probabilityScore}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden my-2">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${barColorClass}`}
                    style={{ width: `${item.probabilityScore}%` }}
                  />
                </div>

                {/* Verdict Chip */}
                <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 my-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="truncate">{language === 'hi' ? item.hindiVerdict : item.verdict}</span>
                </div>

                {/* Retrograde Warning */}
                {item.starLordIsRetro && (
                  <div className="flex items-center gap-1 text-[10px] text-red-500 dark:text-red-400 bg-red-500/10 px-2 py-1 rounded-md my-1.5 border border-red-500/20">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>Star Lord ({item.cuspStarLord}) is Retrograde: Expect Delays</span>
                  </div>
                )}

                {/* House Combinations Box (Clean spacing, zero overlap) */}
                <div className="text-[11px] space-y-1.5 mt-2.5 p-2.5 rounded-lg bg-white/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px]">Favorable Houses:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-[11px] shrink-0">
                      [{item.favorableHouses.join(', ')}]
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px]">Negating Houses:</span>
                    <span className="font-mono text-rose-500 font-bold text-[11px] shrink-0">
                      [{item.negatingHouses.join(', ')}]
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-1.5 pt-1.5 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] shrink-0">Timing:</span>
                    <span className="font-medium text-[10px] text-slate-800 dark:text-slate-200 text-right leading-tight">
                      {language === 'hi' ? item.hindiTimingWindow : item.timingWindow}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setSelectedMilestone(item)}
                  className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 flex items-center gap-1 transition"
                >
                  <Gift className="w-3 h-3" />
                  <span>View Remedies</span>
                </button>

                <button
                  type="button"
                  onClick={() => shareSummary(item)}
                  title="Share prediction"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Remedies Dialog Modal */}
      {selectedMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-cosmic-card border border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setSelectedMilestone(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-500">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold font-serif text-slate-900 dark:text-white">
                  KP Remedies for {selectedMilestone.title}
                </h4>
                <p className="text-xs text-slate-500">
                  Benefiting Cusp {selectedMilestone.primaryHouse} through {selectedMilestone.remedy.favorablePlanet}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-1">
                  Color Therapy & Attire
                </span>
                <p className="text-slate-800 dark:text-slate-200 font-medium">
                  {selectedMilestone.remedy.color}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-1">
                  Constructive Charity / Donation
                </span>
                <p className="text-slate-800 dark:text-slate-200 font-medium">
                  {selectedMilestone.remedy.donation}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-bold uppercase tracking-wider mb-1">
                  Vedic Frequency Mantra
                </span>
                <p className="text-amber-800 dark:text-amber-300 font-mono text-[11px] font-bold">
                  {selectedMilestone.remedy.mantra}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedMilestone(null)}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
