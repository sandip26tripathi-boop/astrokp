'use client';

import React, { useState } from 'react';
import { useAstrologyStore } from '@/store/useAstrologyStore';
import { t } from '@/lib/i18n';
import { CuspData, PlanetPosition, Language } from '@/types/astrology';
import { Compass, Sparkles, Layers, Info } from 'lucide-react';

export default function ChartViewer() {
  const {
    kpMatrix,
    chartStyle,
    setChartStyle,
    language,
    selectedHouse,
    setSelectedHouse,
    selectedPlanet,
    setSelectedPlanet,
  } = useAstrologyStore();

  const [chartMode, setChartMode] = useState<'dual' | 'rashi' | 'bhava'>('dual');

  if (!kpMatrix) return null;

  const { cusps, planets, houseSignificators, planetSignifications, parsFortuna } = kpMatrix;
  const ascCusp = cusps[0];
  const ascSignId = ascCusp.signId;

  // Find currently selected house data and significators
  const activeHouseData: CuspData | undefined = cusps.find(
    (c) => c.houseNumber === (selectedHouse || 1)
  );
  const activeHouseSignificator = houseSignificators.find(
    (h) => h.houseNumber === (selectedHouse || 1)
  );

  // Helper: In North Indian chart, each house displays its Rashi Number
  const getHouseRashi = (houseNum: number): number => {
    return ((ascSignId - 1 + (houseNum - 1)) % 12) + 1;
  };

  // Group planets by occupied house for D1 Rashi Chart
  const planetsByRashiHouse: Record<number, PlanetPosition[]> = {};
  for (let h = 1; h <= 12; h++) {
    planetsByRashiHouse[h] = [];
  }
  planets.forEach((p) => {
    const rashiHouse = ((p.signId - ascSignId + 12) % 12) + 1;
    if (planetsByRashiHouse[rashiHouse]) {
      planetsByRashiHouse[rashiHouse].push(p);
    }
  });

  // Group planets by occupied house for Bhava Chalit Chart
  const planetsByBhavaHouse: Record<number, PlanetPosition[]> = {};
  for (let h = 1; h <= 12; h++) {
    planetsByBhavaHouse[h] = [];
  }
  planets.forEach((p) => {
    const rashiHouse = ((p.signId - ascSignId + 12) % 12) + 1;
    const targetHouse = p.houseOccupied || rashiHouse;
    if (planetsByBhavaHouse[targetHouse]) {
      planetsByBhavaHouse[targetHouse].push(p);
    }
  });

  // Group planets by zodiac sign (for South Indian chart)
  const planetsBySign: Record<number, PlanetPosition[]> = {};
  for (let s = 1; s <= 12; s++) {
    planetsBySign[s] = [];
  }
  planets.forEach((p) => {
    if (planetsBySign[p.signId]) {
      planetsBySign[p.signId].push(p);
    }
  });

  // Active selected planet info
  const activePlanetData = planets.find((p) => p.name === selectedPlanet);
  const activePlanetSig = planetSignifications.find((p) => p.planetName === selectedPlanet);

  // Helper to render a single North Indian SVG
  const renderNorthSVG = (mode: 'rashi' | 'bhava') => {
    const housePlanets = mode === 'rashi' ? planetsByRashiHouse : planetsByBhavaHouse;
    return (
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full drop-shadow-md rounded-2xl overflow-hidden border border-[#E4D5B7] dark:border-[#443525] bg-[#FFFDF7] dark:bg-[#1A140E]"
      >
        <defs>
          <linearGradient id={`goldStroke-${mode}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B87314" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#9A5E0D" />
          </linearGradient>
          <radialGradient id={`houseGlow-${mode}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#B87314" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#B87314" stopOpacity="0.0" />
          </radialGradient>
        </defs>

        {/* Outer Square */}
        <rect
          x="4"
          y="4"
          width="392"
          height="392"
          fill="none"
          stroke="#B87314"
          strokeWidth="1.5"
        />

        {/* Diagonals */}
        <line x1="4" y1="4" x2="396" y2="396" stroke="#B87314" strokeWidth="1.5" />
        <line x1="396" y1="4" x2="4" y2="396" stroke="#B87314" strokeWidth="1.5" />

        {/* Inner Diamond */}
        <polygon
          points="200,4 396,200 200,396 4,200"
          fill="none"
          stroke="#B87314"
          strokeWidth="1.5"
        />

        {/* House 1 (Top diamond) */}
        <polygon
          points="200,4 300,104 200,200 100,104"
          fill={selectedHouse === 1 ? `url(#houseGlow-${mode})` : 'transparent'}
          className="cursor-pointer hover:fill-[#B87314]/10 transition"
          onClick={() => setSelectedHouse(1)}
        />
        <text x="200" y="32" textAnchor="middle" className="text-[12px] fill-[#8A7967] font-extrabold">
          {mode === 'rashi' ? ascSignId : cusps[0]?.signId}
        </text>
        <text x="200" y="52" textAnchor="middle" className="text-[11px] font-bold fill-[#231A12] dark:fill-[#FAF4E6]">
          {ascCusp.formattedSignDMS}
        </text>
        <g transform="translate(200, 115)">
          {renderHousePlanets(housePlanets[1], setSelectedPlanet, language)}
        </g>

        {/* House 2 */}
        <polygon
          points="4,4 200,4 100,104"
          fill={selectedHouse === 2 ? `url(#houseGlow-${mode})` : 'transparent'}
          className="cursor-pointer hover:fill-[#B87314]/10 transition"
          onClick={() => setSelectedHouse(2)}
        />
        <text x="100" y="26" textAnchor="middle" className="text-[11px] fill-[#8A7967] font-bold">
          {mode === 'rashi' ? getHouseRashi(2) : cusps[1]?.signId}
        </text>
        <g transform="translate(100, 60)">
          {renderHousePlanets(housePlanets[2], setSelectedPlanet, language)}
        </g>

        {/* House 3 */}
        <polygon
          points="4,4 100,104 4,200"
          fill={selectedHouse === 3 ? `url(#houseGlow-${mode})` : 'transparent'}
          className="cursor-pointer hover:fill-[#B87314]/10 transition"
          onClick={() => setSelectedHouse(3)}
        />
        <text x="25" y="80" textAnchor="middle" className="text-[11px] fill-[#8A7967] font-bold">
          {mode === 'rashi' ? getHouseRashi(3) : cusps[2]?.signId}
        </text>
        <g transform="translate(45, 125)">
          {renderHousePlanets(housePlanets[3], setSelectedPlanet, language)}
        </g>

        {/* House 4 */}
        <polygon
          points="4,200 100,104 200,200 100,296"
          fill={selectedHouse === 4 ? `url(#houseGlow-${mode})` : 'transparent'}
          className="cursor-pointer hover:fill-[#B87314]/10 transition"
          onClick={() => setSelectedHouse(4)}
        />
        <text x="35" y="205" textAnchor="middle" className="text-[12px] fill-[#8A7967] font-extrabold">
          {mode === 'rashi' ? getHouseRashi(4) : cusps[3]?.signId}
        </text>
        <g transform="translate(105, 200)">
          {renderHousePlanets(housePlanets[4], setSelectedPlanet, language)}
        </g>

        {/* House 5 */}
        <polygon
          points="4,200 100,296 4,396"
          fill={selectedHouse === 5 ? `url(#houseGlow-${mode})` : 'transparent'}
          className="cursor-pointer hover:fill-[#B87314]/10 transition"
          onClick={() => setSelectedHouse(5)}
        />
        <text x="25" y="325" textAnchor="middle" className="text-[11px] fill-[#8A7967] font-bold">
          {mode === 'rashi' ? getHouseRashi(5) : cusps[4]?.signId}
        </text>
        <g transform="translate(45, 275)">
          {renderHousePlanets(housePlanets[5], setSelectedPlanet, language)}
        </g>

        {/* House 6 */}
        <polygon
          points="4,396 100,296 200,396"
          fill={selectedHouse === 6 ? `url(#houseGlow-${mode})` : 'transparent'}
          className="cursor-pointer hover:fill-[#B87314]/10 transition"
          onClick={() => setSelectedHouse(6)}
        />
        <text x="100" y="382" textAnchor="middle" className="text-[12px] fill-[#8A7967] font-extrabold">
          {mode === 'rashi' ? getHouseRashi(6) : cusps[5]?.signId}
        </text>
        <g transform="translate(100, 340)">
          {renderHousePlanets(housePlanets[6], setSelectedPlanet, language)}
        </g>

        {/* House 7 */}
        <polygon
          points="200,200 100,296 200,396 300,296"
          fill={selectedHouse === 7 ? `url(#houseGlow-${mode})` : 'transparent'}
          className="cursor-pointer hover:fill-[#B87314]/10 transition"
          onClick={() => setSelectedHouse(7)}
        />
        <text x="200" y="380" textAnchor="middle" className="text-[12px] fill-[#8A7967] font-extrabold">
          {mode === 'rashi' ? getHouseRashi(7) : cusps[6]?.signId}
        </text>
        <g transform="translate(200, 285)">
          {renderHousePlanets(housePlanets[7], setSelectedPlanet, language)}
        </g>

        {/* House 8 */}
        <polygon
          points="200,396 300,296 396,396"
          fill={selectedHouse === 8 ? `url(#houseGlow-${mode})` : 'transparent'}
          className="cursor-pointer hover:fill-[#B87314]/10 transition"
          onClick={() => setSelectedHouse(8)}
        />
        <text x="300" y="382" textAnchor="middle" className="text-[11px] fill-[#8A7967] font-bold">
          {mode === 'rashi' ? getHouseRashi(8) : cusps[7]?.signId}
        </text>
        <g transform="translate(300, 340)">
          {renderHousePlanets(housePlanets[8], setSelectedPlanet, language)}
        </g>

        {/* House 9 */}
        <polygon
          points="300,296 396,200 396,396"
          fill={selectedHouse === 9 ? `url(#houseGlow-${mode})` : 'transparent'}
          className="cursor-pointer hover:fill-[#B87314]/10 transition"
          onClick={() => setSelectedHouse(9)}
        />
        <text x="375" y="325" textAnchor="middle" className="text-[11px] fill-[#8A7967] font-bold">
          {mode === 'rashi' ? getHouseRashi(9) : cusps[8]?.signId}
        </text>
        <g transform="translate(355, 275)">
          {renderHousePlanets(housePlanets[9], setSelectedPlanet, language)}
        </g>

        {/* House 10 */}
        <polygon
          points="200,200 300,104 396,200 300,296"
          fill={selectedHouse === 10 ? `url(#houseGlow-${mode})` : 'transparent'}
          className="cursor-pointer hover:fill-[#B87314]/10 transition"
          onClick={() => setSelectedHouse(10)}
        />
        <text x="365" y="205" textAnchor="middle" className="text-[12px] fill-[#8A7967] font-extrabold">
          {mode === 'rashi' ? getHouseRashi(10) : cusps[9]?.signId}
        </text>
        <g transform="translate(295, 200)">
          {renderHousePlanets(housePlanets[10], setSelectedPlanet, language)}
        </g>

        {/* House 11 */}
        <polygon
          points="300,104 396,4 396,200"
          fill={selectedHouse === 11 ? `url(#houseGlow-${mode})` : 'transparent'}
          className="cursor-pointer hover:fill-[#B87314]/10 transition"
          onClick={() => setSelectedHouse(11)}
        />
        <text x="375" y="80" textAnchor="middle" className="text-[11px] fill-[#8A7967] font-bold">
          {mode === 'rashi' ? getHouseRashi(11) : cusps[10]?.signId}
        </text>
        <g transform="translate(355, 125)">
          {renderHousePlanets(housePlanets[11], setSelectedPlanet, language)}
        </g>

        {/* House 12 */}
        <polygon
          points="200,4 396,4 300,104"
          fill={selectedHouse === 12 ? `url(#houseGlow-${mode})` : 'transparent'}
          className="cursor-pointer hover:fill-[#B87314]/10 transition"
          onClick={() => setSelectedHouse(12)}
        />
        <text x="300" y="26" textAnchor="middle" className="text-[11px] fill-[#8A7967] font-bold">
          {mode === 'rashi' ? getHouseRashi(12) : cusps[11]?.signId}
        </text>
        <g transform="translate(300, 60)">
          {renderHousePlanets(housePlanets[12], setSelectedPlanet, language)}
        </g>
      </svg>
    );
  };

  return (
    <div className="w-full max-w-full overflow-hidden bg-[#FFFDF7] dark:bg-[#231A12] border border-[#E4D5B7] dark:border-[#443525] rounded-2xl p-4 sm:p-6 shadow-sandalwood">
      {/* Top Controls */}
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#E4D5B7] dark:border-[#443525] gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#B87314]" />
          <h3 className="text-lg font-bold font-serif text-[#231A12] dark:text-[#FFFDF7]">
            {t('chartViewer', language)}
          </h3>
          <span className="text-xs px-2.5 py-0.5 rounded-md bg-[#F3E8D2] text-[#B87314] dark:bg-[#2A1F16] dark:text-[#D4AF37] font-semibold border border-[#E4D5B7] dark:border-[#443525]">
            {chartMode === 'dual'
              ? (language === 'hi' ? 'D1 लग्न + भाव चलित (Dual)' : 'D1 Lagna + Bhava Chalit')
              : chartMode === 'rashi'
              ? (language === 'hi' ? 'D1 लग्न कुंडली' : 'D1 Lagna Chart')
              : (language === 'hi' ? 'भाव चलित कुंडली' : 'Bhava Chalit Chart')}
          </span>
        </div>

        {/* Mode & Style Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Dual vs Rashi vs Bhava Mode */}
          <div className="flex items-center p-1 rounded-xl bg-[#F3E8D2] dark:bg-[#2A1F16] border border-[#E4D5B7] dark:border-[#443525] text-xs font-semibold">
            <button
              type="button"
              onClick={() => setChartMode('dual')}
              className={`px-3 py-1 rounded-lg transition ${
                chartMode === 'dual'
                  ? 'bg-[#B87314] text-[#FFFDF7] shadow-sm'
                  : 'text-[#5C4D3C] dark:text-[#D8C39E] hover:text-[#231A12] dark:hover:text-[#FFFDF7]'
              }`}
            >
              {language === 'hi' ? 'दोनों (D1 + भाव चलित)' : 'Dual View'}
            </button>
            <button
              type="button"
              onClick={() => setChartMode('rashi')}
              className={`px-2.5 py-1 rounded-lg transition ${
                chartMode === 'rashi'
                  ? 'bg-[#B87314] text-[#FFFDF7] shadow-sm'
                  : 'text-[#5C4D3C] dark:text-[#D8C39E] hover:text-[#231A12] dark:hover:text-[#FFFDF7]'
              }`}
            >
              D1 Lagna
            </button>
            <button
              type="button"
              onClick={() => setChartMode('bhava')}
              className={`px-2.5 py-1 rounded-lg transition ${
                chartMode === 'bhava'
                  ? 'bg-[#B87314] text-[#FFFDF7] shadow-sm'
                  : 'text-[#5C4D3C] dark:text-[#D8C39E] hover:text-[#231A12] dark:hover:text-[#FFFDF7]'
              }`}
            >
              Bhava Chalit
            </button>
          </div>

          {/* North vs South Style */}
          <div className="flex items-center p-1 rounded-xl bg-[#F3E8D2] dark:bg-[#2A1F16] border border-[#E4D5B7] dark:border-[#443525]">
            <button
              type="button"
              onClick={() => setChartStyle('north')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                chartStyle === 'north'
                  ? 'bg-[#B87314] text-[#FFFDF7] shadow-sm'
                  : 'text-[#5C4D3C] dark:text-[#D8C39E] hover:text-[#231A12] dark:hover:text-[#FFFDF7]'
              }`}
            >
              {t('northIndian', language)}
            </button>
            <button
              type="button"
              onClick={() => setChartStyle('south')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                chartStyle === 'south'
                  ? 'bg-[#B87314] text-[#FFFDF7] shadow-sm'
                  : 'text-[#5C4D3C] dark:text-[#D8C39E] hover:text-[#231A12] dark:hover:text-[#FFFDF7]'
              }`}
            >
              {t('southIndian', language)}
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      {chartMode === 'dual' ? (
        /* Dual View Layout: D1 Lagna Chart AND Bhava Chalit Chart side by side */
        <div className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {/* Chart 1: D1 Lagna / Rashi Chart */}
            <div className="flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-[#FAF4E6]/50 dark:bg-[#1A140E]/60 border border-[#E4D5B7] dark:border-[#443525]">
              <div className="w-full flex items-center justify-between mb-3 px-1">
                <span className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  D1 लग्न / राशि कुंडली (Vedic D1 Lagna Chart)
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Lagna: {ascCusp.signName}
                </span>
              </div>
              <div className="w-full max-w-[390px] aspect-square relative select-none">
                {chartStyle === 'north' ? (
                  renderNorthSVG('rashi')
                ) : (
                  <svg
                    viewBox="0 0 400 400"
                    className="w-full h-full drop-shadow-2xl rounded-2xl overflow-hidden border border-amber-500/30 bg-slate-50 dark:bg-[#070b14]"
                  >
                    {renderSouthIndianBoxes(
                      ascSignId,
                      planetsBySign,
                      selectedHouse,
                      setSelectedHouse,
                      setSelectedPlanet,
                      'rashi',
                      cusps
                    )}
                  </svg>
                )}
              </div>
            </div>

            {/* Chart 2: Bhava Chalit Chart */}
            <div className="flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-amber-500/20">
              <div className="w-full flex items-center justify-between mb-3 px-1">
                <span className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-amber-500" />
                  भाव चलित / कस्पल कुंडली (Bhava Chalit Chart)
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Placidus Cusps
                </span>
              </div>
              <div className="w-full max-w-[390px] aspect-square relative select-none">
                {chartStyle === 'north' ? (
                  renderNorthSVG('bhava')
                ) : (
                  <svg
                    viewBox="0 0 400 400"
                    className="w-full h-full drop-shadow-2xl rounded-2xl overflow-hidden border border-amber-500/30 bg-slate-50 dark:bg-[#070b14]"
                  >
                    {renderSouthIndianBoxes(
                      ascSignId,
                      planetsBySign,
                      selectedHouse,
                      setSelectedHouse,
                      setSelectedPlanet,
                      'bhava',
                      cusps
                    )}
                  </svg>
                )}
              </div>
            </div>
          </div>

          {/* Underneath: Interactive Inspector for Selected House / Planet */}
          <div className="w-full">
            {renderInspectorCard(
              activeHouseData,
              activeHouseSignificator,
              activePlanetData,
              activePlanetSig,
              parsFortuna,
              planets,
              setSelectedPlanet,
              language
            )}
          </div>
        </div>
      ) : (
        /* Single View Layout (7 cols Chart + 5 cols Inspector) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-start">
          <div className="lg:col-span-7 flex flex-col items-center justify-center">
            <div className="w-full max-w-[460px] aspect-square relative select-none">
              {chartStyle === 'north' ? (
                renderNorthSVG(chartMode)
              ) : (
                <svg
                  viewBox="0 0 400 400"
                  className="w-full h-full drop-shadow-2xl rounded-2xl overflow-hidden border border-amber-500/30 bg-slate-50 dark:bg-[#070b14]"
                >
                  {renderSouthIndianBoxes(
                    ascSignId,
                    planetsBySign,
                    selectedHouse,
                    setSelectedHouse,
                    setSelectedPlanet,
                    chartMode,
                    cusps
                  )}
                </svg>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 text-center">
              Click on any House or Planet glyph in the chart to inspect its Sub-Lord and 4-step significators.
            </p>
          </div>

          <div className="lg:col-span-5 space-y-4">
            {renderInspectorCard(
              activeHouseData,
              activeHouseSignificator,
              activePlanetData,
              activePlanetSig,
              parsFortuna,
              planets,
              setSelectedPlanet,
              language
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Planet Short Codes (Hindi)
const PLANET_SHORT_HI: Record<string, string> = {
  Sun: 'सू',
  Moon: 'चं',
  Mars: 'मं',
  Mercury: 'बु',
  Jupiter: 'गु',
  Venus: 'शु',
  Saturn: 'श',
  Rahu: 'रा',
  Ketu: 'के',
  Uranus: 'अरु',
  Neptune: 'वरु',
  Pluto: 'यम',
};

// Helper: render planet labels inside North Indian house
function renderHousePlanets(
  planets: PlanetPosition[] = [],
  setSelectedPlanet: (name: string) => void,
  language: Language = 'hi'
) {
  if (!planets || planets.length === 0) return null;

  const count = planets.length;

  return (
    <g>
      {planets.map((p, idx) => {
        let xOffset = 0;
        let yOffset = 0;

        if (count === 1) {
          xOffset = 0;
          yOffset = 0;
        } else if (count === 2) {
          xOffset = idx === 0 ? -16 : 16;
          yOffset = 0;
        } else if (count === 3) {
          xOffset = (idx - 1) * 22;
          yOffset = 0;
        } else {
          const row = Math.floor(idx / 2);
          const col = idx % 2;
          xOffset = col === 0 ? -16 : 16;
          yOffset = row === 0 ? -8 : 8;
        }

        const hiShort = PLANET_SHORT_HI[p.name] || p.hindiName?.slice(0, 2) || p.name.slice(0, 2);
        const label = language === 'hi' ? hiShort : p.name.slice(0, 2);

        return (
          <g
            key={p.id}
            transform={`translate(${xOffset}, ${yOffset})`}
            className="cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPlanet(p.name);
            }}
          >
            <title>{`${p.hindiName || p.name} (${p.signName} ${p.formattedSignDMS}) • House ${p.houseOccupied}`}</title>
            <text
              x="0"
              y="0"
              textAnchor="middle"
              className="text-[11px] font-extrabold fill-[#231A12] dark:fill-[#FAF4E6] group-hover:fill-[#B87314] drop-shadow-sm transition select-none"
            >
              {label}
              {p.isRetrograde && !['Rahu', 'Ketu'].includes(p.name) ? 'ᴿ' : ''}
            </text>
          </g>
        );
      })}
    </g>
  );
}

// Helper: render South Indian 12 fixed sign boxes
function renderSouthIndianBoxes(
  ascSignId: number,
  planetsBySign: Record<number, PlanetPosition[]>,
  selectedHouse: number | null,
  setSelectedHouse: (h: number) => void,
  setSelectedPlanet: (p: string) => void,
  chartMode: 'bhava' | 'rashi' = 'bhava',
  cusps: CuspData[] = []
) {
  const signLayout: { signId: number; col: number; row: number; name: string }[] = [
    { signId: 12, col: 0, row: 0, name: 'Pisces' },
    { signId: 1, col: 1, row: 0, name: 'Aries' },
    { signId: 2, col: 2, row: 0, name: 'Taurus' },
    { signId: 3, col: 3, row: 0, name: 'Gemini' },
    { signId: 4, col: 3, row: 1, name: 'Cancer' },
    { signId: 5, col: 3, row: 2, name: 'Leo' },
    { signId: 6, col: 3, row: 3, name: 'Virgo' },
    { signId: 7, col: 2, row: 3, name: 'Libra' },
    { signId: 8, col: 1, row: 3, name: 'Scorpio' },
    { signId: 9, col: 0, row: 3, name: 'Sagittarius' },
    { signId: 10, col: 0, row: 2, name: 'Capricorn' },
    { signId: 11, col: 0, row: 1, name: 'Aquarius' },
  ];

  return (
    <g>
      <rect x="4" y="4" width="392" height="392" fill="none" stroke="#B87314" strokeWidth="1.5" />
      <line x1="102" y1="4" x2="102" y2="396" stroke="#B87314" strokeWidth="1" />
      <line x1="200" y1="4" x2="200" y2="102" stroke="#B87314" strokeWidth="1" />
      <line x1="200" y1="298" x2="200" y2="396" stroke="#B87314" strokeWidth="1" />
      <line x1="298" y1="4" x2="298" y2="396" stroke="#B87314" strokeWidth="1" />

      <line x1="4" y1="102" x2="396" y2="102" stroke="#B87314" strokeWidth="1" />
      <line x1="4" y1="200" x2="102" y2="200" stroke="#B87314" strokeWidth="1" />
      <line x1="298" y1="200" x2="396" y2="200" stroke="#B87314" strokeWidth="1" />
      <line x1="4" y1="298" x2="396" y2="298" stroke="#B87314" strokeWidth="1" />

      <rect x="104" y="104" width="192" height="192" fill="none" />
      <text x="200" y="190" textAnchor="middle" className="text-xs font-serif font-bold fill-[#B87314]">
        SOUTH INDIAN VEDIC
      </text>
      <text x="200" y="210" textAnchor="middle" className="text-[10px] fill-[#8A7967]">
        {chartMode === 'bhava' ? 'Bhava Chalit Occupants' : 'Rashi (D1) Fixed Signs'}
      </text>

      {signLayout.map((box) => {
        const x = box.col * 98 + 4;
        const y = box.row * 98 + 4;
        const wholeSignHouse = ((box.signId - ascSignId + 12) % 12) + 1;
        const isAscSign = box.signId === ascSignId;
        const planetsInBox = planetsBySign[box.signId] || [];
        const cuspInSign = cusps.find((c) => c.signId === box.signId);

        return (
          <g
            key={box.signId}
            className="cursor-pointer"
            onClick={() => setSelectedHouse(cuspInSign ? cuspInSign.houseNumber : wholeSignHouse)}
          >
            <rect
              x={x}
              y={y}
              width="96"
              height="96"
              fill={
                selectedHouse === (cuspInSign ? cuspInSign.houseNumber : wholeSignHouse)
                  ? 'rgba(245, 158, 11, 0.15)'
                  : 'transparent'
              }
              className="hover:fill-amber-500/10 transition"
            />
            <text x={x + 6} y={y + 14} className="text-[9px] font-bold fill-slate-400">
              {box.name.slice(0, 3)}
            </text>
            <text x={x + 90} y={y + 14} textAnchor="end" className="text-[9px] font-bold fill-amber-500">
              {chartMode === 'bhava' && cuspInSign ? `C${cuspInSign.houseNumber}` : `H${wholeSignHouse}`}
            </text>
            {isAscSign && (
              <text x={x + 48} y={y + 14} textAnchor="middle" className="text-[9px] font-extrabold fill-red-500">
                [ASC]
              </text>
            )}

            <g transform={`translate(${x + 8}, ${y + 35})`}>
              {planetsInBox.map((p, idx) => (
                <text
                  key={p.id}
                  x={(idx % 2) * 44}
                  y={Math.floor(idx / 2) * 16}
                  className="text-[10px] font-bold fill-slate-800 dark:fill-amber-200 hover:fill-amber-500 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlanet(p.name);
                  }}
                >
                  {p.name.slice(0, 2)}
                  {chartMode === 'bhava' && p.houseOccupied ? `(H${p.houseOccupied})` : ''}
                  {p.isRetrograde && !['Rahu', 'Ketu'].includes(p.name) ? 'ᴿ' : ''}
                </text>
              ))}
            </g>
          </g>
        );
      })}
    </g>
  );
}

// Reusable Inspector Card
function renderInspectorCard(
  activeHouseData: CuspData | undefined,
  activeHouseSignificator: any,
  activePlanetData: PlanetPosition | undefined,
  activePlanetSig: any,
  parsFortuna: any,
  planets: PlanetPosition[],
  setSelectedPlanet: (name: string | null) => void,
  language: Language
) {
  return (
    <div className="space-y-4">
      {/* Selected House Card */}
      {activeHouseData && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-amber-500/30 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-xs">
                H{activeHouseData.houseNumber}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  House {activeHouseData.houseNumber} ({activeHouseData.signName} / {activeHouseData.hindiSignName})
                </h4>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  Cusp Longitude: {activeHouseData.formattedDMS}
                </span>
              </div>
            </div>
          </div>

          {activeHouseData.starLordIsRetrograde && (
            <div className="mb-2 p-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-[10px] text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
              <span>⚠️ Star Lord ({activeHouseData.starLord}) is Retrograde (Delays in H{activeHouseData.houseNumber})</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 block">{t('signLord', language)}</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {activeHouseData.signLord}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 block">{t('starLord', language)}</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {activeHouseData.starLord}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 col-span-2">
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {t('subLord', language)} (Primary Decision Maker)
              </span>
              <span className="font-bold text-amber-700 dark:text-amber-300 text-sm">
                {activeHouseData.subLord}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                SSL (Sub-Sub Lord): {activeHouseData.subSubLord}
              </span>
            </div>
          </div>

          {/* Occupants of this House */}
          <div className="mt-2.5 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold block flex items-center gap-1">
              <Compass className="w-3 h-3" />
              {language === 'hi' ? 'इस भाव में स्थित ग्रह (Occupants)' : 'Planets Occupying this House'}:
            </span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {activeHouseData.occupants && activeHouseData.occupants.length > 0 ? (
                activeHouseData.occupants.map((pName) => {
                  const pObj = planets.find((p) => p.name === pName);
                  return (
                    <span
                      key={pName}
                      onClick={() => setSelectedPlanet(pName)}
                      className="px-2 py-1 rounded-md bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer shadow-sm hover:scale-105 transition flex items-center gap-1"
                    >
                      {pObj?.hindiName || pName} ({pObj?.formattedSignDMS} {pObj?.hindiSignName || pObj?.signName})
                      {pObj?.isRetrograde && !['Rahu', 'Ketu'].includes(pObj.name) && ' ᴿ'}
                    </span>
                  );
                })
              ) : (
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {language === 'hi' ? 'कोई ग्रह नहीं (खाली भाव)' : 'No planets in this house'}
                </span>
              )}
            </div>
          </div>

          {/* 4-Step Significators for this House */}
          {activeHouseSignificator && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                ४-स्तरीय कार्येश (4-Fold Significators for House {activeHouseData.houseNumber}):
              </span>
              <div className="flex items-center justify-between text-[11px] py-1 border-b border-dashed border-slate-200 dark:border-slate-800">
                <span className="text-slate-500">{t('level1', language)}:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {activeHouseSignificator.level1.length ? activeHouseSignificator.level1.join(', ') : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] py-1 border-b border-dashed border-slate-200 dark:border-slate-800">
                <span className="text-slate-500">{t('level2', language)}:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {activeHouseSignificator.level2.length ? activeHouseSignificator.level2.join(', ') : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] py-1 border-b border-dashed border-slate-200 dark:border-slate-800">
                <span className="text-slate-500">{t('level3', language)}:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {activeHouseSignificator.level3.length ? activeHouseSignificator.level3.join(', ') : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] py-1">
                <span className="text-slate-500">{t('level4', language)}:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {activeHouseSignificator.level4.length ? activeHouseSignificator.level4.join(', ') : '—'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selected Planet Card */}
      {activePlanetData && (
        <div className="p-4 rounded-xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/40 shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-amber-500/20 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{activePlanetData.symbol}</span>
              <div>
                <h5 className="text-sm font-bold text-amber-700 dark:text-amber-300">
                  {activePlanetData.name} ({activePlanetData.hindiName}){' '}
                  {activePlanetData.isRetrograde && !['Rahu', 'Ketu'].includes(activePlanetData.name) && '(R)'}
                </h5>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {activePlanetData.signName} ({activePlanetData.formattedSignDMS}) • House {activePlanetData.houseOccupied}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedPlanet(null)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕
            </button>
          </div>

          {activePlanetData.starLordIsRetrograde && (
            <div className="mb-2 p-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-[10px] text-red-600 dark:text-red-400 font-bold">
              ⚠️ Star Lord ({activePlanetData.starLord}) is Retrograde
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-1.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block">Star Lord</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {activePlanetData.starLord} ({activePlanetData.nakshatraName})
              </span>
            </div>
            <div className="p-1.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block">Sub Lord</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {activePlanetData.subLord}
              </span>
            </div>
          </div>

          {activePlanetSig && (
            <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-300">
              <span className="font-semibold">Signifies Houses (Levels 1-4): </span>
              <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                {activePlanetSig.housesSignified.all.join(', ') || 'None'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Pars Fortuna Point Card */}
      {parsFortuna && (
        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-xs">
              ⊕
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                Pars Fortuna (Point of Fortune)
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {parsFortuna.signName} ({parsFortuna.formattedSignDMS}) • House {parsFortuna.houseOccupied}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Sub-Lord</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">{parsFortuna.subLord}</span>
          </div>
        </div>
      )}
    </div>
  );
}
