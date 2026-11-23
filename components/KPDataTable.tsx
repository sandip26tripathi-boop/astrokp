'use client';

import React, { useState } from 'react';
import { useAstrologyStore } from '@/store/useAstrologyStore';
import { t } from '@/lib/i18n';
import {
  Table,
  Layers,
  Sparkles,
  Calendar,
  Compass,
  Clock,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

export default function KPDataTable() {
  const { kpMatrix, language, setSelectedHouse, setSelectedPlanet } = useAstrologyStore();
  const [activeTab, setActiveTab] = useState<'planets' | 'cusps' | 'significators' | 'rp' | 'dasha'>(
    'planets'
  );

  if (!kpMatrix) return null;

  const { planets, cusps, houseSignificators, rulingPlanets, currentDasha, vimshottariDashaTree } =
    kpMatrix;

  return (
    <div className="w-full max-w-full overflow-hidden bg-white/80 dark:bg-cosmic-card/90 backdrop-blur-xl border border-amber-500/20 dark:border-amber-500/30 rounded-2xl p-4 sm:p-6 shadow-xl">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('planets')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'planets'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Compass className="w-4 h-4" />
          {t('planetaryTable', language)}
        </button>

        <button
          onClick={() => setActiveTab('cusps')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'cusps'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          {t('cuspalTable', language)}
        </button>

        <button
          onClick={() => setActiveTab('significators')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'significators'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          {t('significatorsTable', language)}
        </button>

        <button
          onClick={() => setActiveTab('rp')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'rp'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          {t('rulingPlanets', language)}
        </button>

        <button
          onClick={() => setActiveTab('dasha')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'dasha'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          {t('dashaTimeline', language)}
        </button>
      </div>

      {/* Tab 1: Planetary Table */}
      {activeTab === 'planets' && (
        <div className="mt-5 overflow-x-auto w-full">
          <table className="w-full min-w-[650px] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">{t('planet', language)}</th>
                <th className="py-2.5 px-3">State</th>
                <th className="py-2.5 px-3">{t('sign', language)}</th>
                <th className="py-2.5 px-3">{t('degree', language)}</th>
                <th className="py-2.5 px-3">Nakshatra (Pada)</th>
                <th className="py-2.5 px-3">{t('signLord', language)}</th>
                <th className="py-2.5 px-3">{t('starLord', language)}</th>
                <th className="py-2.5 px-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                  {t('subLord', language)}
                </th>
                <th className="py-2.5 px-3">{t('subSubLord', language)}</th>
                <th className="py-2.5 px-3">{t('house', language)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {planets.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setSelectedPlanet(p.name)}
                  className="hover:bg-amber-500/5 cursor-pointer transition"
                >
                  <td className="py-2.5 px-3 flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
                    <span className="text-amber-500">{p.symbol}</span>
                    {p.name}
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({p.hindiName})
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {['Rahu', 'Ketu'].includes(p.name) ? (
                      <span className="text-slate-400 text-[10px]">—</span>
                    ) : p.isRetrograde ? (
                      <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 font-bold text-[10px]">
                        {t('retrograde', language)} (R)
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">{t('direct', language)}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                    {p.signName} ({p.hindiSignName})
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-900 dark:text-slate-200">
                    {p.formattedSignDMS}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                    {p.nakshatraName} ({p.nakshatraPada})
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{p.signLord}</td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{p.starLord}</td>
                  <td className="py-2.5 px-3 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold">
                    {p.subLord}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{p.subSubLord}</td>
                  <td className="py-2.5 px-3 font-bold text-amber-500">H{p.houseOccupied}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Cuspal Table (Bhava Chalit) */}
      {activeTab === 'cusps' && (
        <div className="mt-5 overflow-x-auto w-full">
          <table className="w-full min-w-[580px] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">{t('house', language)}</th>
                <th className="py-2.5 px-3">{t('sign', language)}</th>
                <th className="py-2.5 px-3">{t('degree', language)}</th>
                <th className="py-2.5 px-3">{t('signLord', language)}</th>
                <th className="py-2.5 px-3">{t('starLord', language)}</th>
                <th className="py-2.5 px-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                  {t('subLord', language)} (Cuspal SL)
                </th>
                <th className="py-2.5 px-3">{t('subSubLord', language)}</th>
                <th className="py-2.5 px-3">{t('occupants', language)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {cusps.map((c) => (
                <tr
                  key={c.houseNumber}
                  onClick={() => setSelectedHouse(c.houseNumber)}
                  className="hover:bg-amber-500/5 cursor-pointer transition"
                >
                  <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[10px]">
                      {c.houseNumber}
                    </span>
                    {t('house', language)} {c.houseNumber}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                    {c.signName} ({c.hindiSignName})
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-900 dark:text-slate-200">
                    {c.formattedSignDMS}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{c.signLord}</td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{c.starLord}</td>
                  <td className="py-2.5 px-3 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold">
                    {c.subLord}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{c.subSubLord}</td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                    {c.occupants.length ? c.occupants.join(', ') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: KP 4-Fold Significators */}
      {activeTab === 'significators' && (
        <div className="mt-5 overflow-x-auto w-full">
          <div className="mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            <strong>४-स्तरीय कार्येश नियम (4-Step Strength Rule):</strong> Level 1 (Strongest: Planet in star of occupant) &gt; Level 2 (Occupant of house) &gt; Level 3 (Planet in star of house lord) &gt; Level 4 (House lord).
          </div>
          <table className="w-full min-w-[500px] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">{t('house', language)}</th>
                <th className="py-2.5 px-3 text-amber-600 dark:text-amber-400 font-bold">Level 1 (Occupant&apos;s Star Lord)</th>
                <th className="py-2.5 px-3">Level 2 (Occupant)</th>
                <th className="py-2.5 px-3">Level 3 (Lord&apos;s Star Lord)</th>
                <th className="py-2.5 px-3">Level 4 (Lord)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {houseSignificators.map((hs) => (
                <tr key={hs.houseNumber} className="hover:bg-amber-500/5 transition">
                  <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                    {t('house', language)} {hs.houseNumber}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-amber-600 dark:text-amber-400">
                    {hs.level1.length ? hs.level1.join(', ') : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                    {hs.level2.length ? hs.level2.join(', ') : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                    {hs.level3.length ? hs.level3.join(', ') : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                    {hs.level4.length ? hs.level4.join(', ') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Ruling Planets (RP) */}
      {activeTab === 'rp' && (
        <div className="mt-5 space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ruling Planets (RP) are the guiding cosmic keys used in Vedic & Cuspal Astrology for pinpoint event timing and authenticating Prashna queries.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                {t('dayLord', language)}
              </span>
              <span className="text-base font-bold text-slate-900 dark:text-white">
                {rulingPlanets.dayLord}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                {t('moonSignLord', language)}
              </span>
              <span className="text-base font-bold text-slate-900 dark:text-white">
                {rulingPlanets.moonSignLord}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                {t('moonStarLord', language)}
              </span>
              <span className="text-base font-bold text-slate-900 dark:text-white">
                {rulingPlanets.moonStarLord}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                {t('lagnaSignLord', language)}
              </span>
              <span className="text-base font-bold text-slate-900 dark:text-white">
                {rulingPlanets.lagnaSignLord}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                {t('lagnaStarLord', language)}
              </span>
              <span className="text-base font-bold text-slate-900 dark:text-white">
                {rulingPlanets.lagnaStarLord}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase tracking-wider font-bold block">
                Lagna Sub-Lord (RP Anchor)
              </span>
              <span className="text-base font-extrabold text-amber-700 dark:text-amber-300">
                {rulingPlanets.lagnaSubLord}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Vimshottari Dasha */}
      {activeTab === 'dasha' && (
        <div className="mt-5 space-y-4">
          {/* Active Dasha Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-2">
              {t('currentDasha', language)} (Right Now)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">{t('mahadasha', language)}</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {currentDasha.mahadasha.planet}
                </span>
                <span suppressHydrationWarning className="text-[10px] text-slate-500 block">
                  until {new Date(currentDasha.mahadasha.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">{t('antardasha', language)}</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {currentDasha.antardasha.planet}
                </span>
                <span suppressHydrationWarning className="text-[10px] text-slate-500 block">
                  until {new Date(currentDasha.antardasha.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block">{t('pratyantardasha', language)}</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {currentDasha.pratyantardasha.planet}
                </span>
                <span suppressHydrationWarning className="text-[10px] text-slate-500 block">
                  until {new Date(currentDasha.pratyantardasha.endDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Full Mahadasha Timeline */}
          <div className="mt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              120-Year Vimshottari Mahadasha Cycle
            </h4>
            <div className="space-y-2">
              {vimshottariDashaTree.map((d, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {d.planet} Mahadasha
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1.5">
                        ({d.durationYears.toFixed(1)} years)
                      </span>
                    </div>
                  </div>
                  <div suppressHydrationWarning className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {new Date(d.startDate).toLocaleDateString()} — {new Date(d.endDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
