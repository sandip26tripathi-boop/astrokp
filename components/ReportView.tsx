'use client';

import React from 'react';
import { useAstrologyStore } from '@/store/useAstrologyStore';
import { t } from '@/lib/i18n';
import { Printer, Compass, Sparkles, BookOpen, Layers, Clock, ShieldCheck, Calendar, Briefcase, Heart, Coins, Activity, ShieldAlert } from 'lucide-react';
import { generate10YearPredictions } from '@/lib/kp-10year-predictions';

interface ReportViewProps {
  onClose?: () => void;
}

export default function ReportView({ onClose }: ReportViewProps) {
  const { kpMatrix, language } = useAstrologyStore();

  if (!kpMatrix) return null;

  const {
    input,
    cusps,
    planets,
    houseSignificators,
    planetSignifications,
    rulingPlanets,
    currentDasha,
    vimshottariDashaTree,
  } = kpMatrix;

  const tenYearPredictions = generate10YearPredictions(kpMatrix, language);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-6 p-6 sm:p-10 bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 print:border-none print:shadow-none print:p-0">
      {/* Print Controls (Hidden when printing) */}
      <div className="no-print flex items-center justify-between pb-6 mb-8 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold font-serif text-slate-900">
            {language === 'hi' ? 'संपूर्ण जन्म कुंडली रिपोर्ट (PDF)' : 'Comprehensive Kundli Dossier'}
          </h2>
          <p className="text-xs text-slate-500">
            Click print below to save as high-definition PDF using browser print preview.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition"
          >
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Printable Report Document Body */}
      <div className="space-y-8 font-sans">
        {/* Cover / Header Section */}
        <div className="text-center pb-8 border-b-2 border-amber-500/40">
          <div className="inline-block px-3 py-1 mb-2 rounded-full text-xs font-bold tracking-widest text-amber-700 bg-amber-100 uppercase">
            ASTROLABS • ASTRONOMICAL DOSSIER
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-extrabold tracking-tight text-slate-950">
            {input.name || 'Client Kundli'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Born on {input.dateOfBirth} at {input.timeOfBirth} • {input.placeName}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs font-mono text-slate-500">
            <span>Lat: {input.latitude}°</span>
            <span>Lon: {input.longitude}°</span>
            <span>Timezone: UTC {input.timezone >= 0 ? `+${input.timezone}` : input.timezone}</span>
            <span>Ayanamsa: {input.ayanamsa} ({kpMatrix.formattedAyanamsa})</span>
          </div>
        </div>

        {/* Section 1: Executive KP Summary */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-800 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            Core KP Astrological Signatures
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">Ascendant Cusp</span>
              <strong className="text-slate-900">{cusps[0].signName} ({cusps[0].formattedSignDMS})</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Lagna Sub-Lord</span>
              <strong className="text-amber-700">{cusps[0].subLord}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Moon Sign & Star</span>
              <strong className="text-slate-900">{planets[1].signName} ({planets[1].nakshatraName})</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Current Mahadasha</span>
              <strong className="text-amber-700">{currentDasha.mahadasha.planet}</strong>
            </div>
          </div>
        </div>

        {/* Section 2: Placidus Cuspal Table */}
        <div className="space-y-3">
          <h3 className="text-base font-bold font-serif text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600" />
            1. Placidus 12 House Cusps (Bhava Chalit)
          </h3>
          <table className="w-full text-xs text-left border-collapse border border-slate-200">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-2 border border-slate-200">Cusp</th>
                <th className="p-2 border border-slate-200">Sign</th>
                <th className="p-2 border border-slate-200">Degree</th>
                <th className="p-2 border border-slate-200">Sign Lord</th>
                <th className="p-2 border border-slate-200">Star Lord</th>
                <th className="p-2 border border-slate-200 bg-amber-100 font-bold">Sub-Lord (SL)</th>
                <th className="p-2 border border-slate-200">Sub-Sub Lord</th>
                <th className="p-2 border border-slate-200">Occupants</th>
              </tr>
            </thead>
            <tbody>
              {cusps.map((c) => (
                <tr key={c.houseNumber} className="border-b border-slate-200">
                  <td className="p-2 border border-slate-200 font-bold">House {c.houseNumber}</td>
                  <td className="p-2 border border-slate-200">{c.signName}</td>
                  <td className="p-2 border border-slate-200 font-mono">{c.formattedSignDMS}</td>
                  <td className="p-2 border border-slate-200">{c.signLord}</td>
                  <td className="p-2 border border-slate-200">{c.starLord}</td>
                  <td className="p-2 border border-slate-200 bg-amber-50 font-bold text-amber-800">
                    {c.subLord}
                  </td>
                  <td className="p-2 border border-slate-200">{c.subSubLord}</td>
                  <td className="p-2 border border-slate-200">{c.occupants.join(', ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 3: Planetary Table */}
        <div className="space-y-3">
          <h3 className="text-base font-bold font-serif text-slate-900 flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-600" />
            2. Nirayana Planetary Positions & Sub-Lords
          </h3>
          <table className="w-full text-xs text-left border-collapse border border-slate-200">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-2 border border-slate-200">Planet</th>
                <th className="p-2 border border-slate-200">Sign</th>
                <th className="p-2 border border-slate-200">Longitude</th>
                <th className="p-2 border border-slate-200">Nakshatra</th>
                <th className="p-2 border border-slate-200">Star Lord</th>
                <th className="p-2 border border-slate-200 bg-amber-100 font-bold">Sub-Lord</th>
                <th className="p-2 border border-slate-200">House Occupied</th>
              </tr>
            </thead>
            <tbody>
              {planets.map((p) => (
                <tr key={p.id} className="border-b border-slate-200">
                  <td className="p-2 border border-slate-200 font-bold flex items-center gap-1.5">
                    {p.name} {p.isRetrograde && !['Rahu', 'Ketu'].includes(p.name) && '(R)'}
                  </td>
                  <td className="p-2 border border-slate-200">{p.signName}</td>
                  <td className="p-2 border border-slate-200 font-mono">{p.formattedSignDMS}</td>
                  <td className="p-2 border border-slate-200">{p.nakshatraName} (P{p.nakshatraPada})</td>
                  <td className="p-2 border border-slate-200">{p.starLord}</td>
                  <td className="p-2 border border-slate-200 bg-amber-50 font-bold text-amber-800">
                    {p.subLord}
                  </td>
                  <td className="p-2 border border-slate-200 font-bold">H{p.houseOccupied}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Page break for printing */}
        <div className="page-break" />

        {/* Section 4: KP 4-Fold Significators */}
        <div className="space-y-3 pt-6">
          <h3 className="text-base font-bold font-serif text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-600" />
            3. KP 4-Fold Significators (House Results Engine)
          </h3>
          <table className="w-full text-xs text-left border-collapse border border-slate-200">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-2 border border-slate-200">House</th>
                <th className="p-2 border border-slate-200 bg-amber-50">Level 1 (Strongest: Star of Occupant)</th>
                <th className="p-2 border border-slate-200">Level 2 (Occupant)</th>
                <th className="p-2 border border-slate-200">Level 3 (Star of Lord)</th>
                <th className="p-2 border border-slate-200">Level 4 (Lord)</th>
              </tr>
            </thead>
            <tbody>
              {houseSignificators.map((hs) => (
                <tr key={hs.houseNumber} className="border-b border-slate-200">
                  <td className="p-2 border border-slate-200 font-bold">House {hs.houseNumber}</td>
                  <td className="p-2 border border-slate-200 bg-amber-50 font-bold text-amber-900">
                    {hs.level1.join(', ') || '—'}
                  </td>
                  <td className="p-2 border border-slate-200">{hs.level2.join(', ') || '—'}</td>
                  <td className="p-2 border border-slate-200">{hs.level3.join(', ') || '—'}</td>
                  <td className="p-2 border border-slate-200">{hs.level4.join(', ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 5: Ruling Planets & Dasha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              Ruling Planets (RP) at Calculation
            </h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Day Lord:</span>
                <span className="font-bold">{rulingPlanets.dayLord}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Moon Sign Lord:</span>
                <span className="font-bold">{rulingPlanets.moonSignLord}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Moon Star Lord:</span>
                <span className="font-bold">{rulingPlanets.moonStarLord}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Lagna Sign Lord:</span>
                <span className="font-bold">{rulingPlanets.lagnaSignLord}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Lagna Star Lord:</span>
                <span className="font-bold">{rulingPlanets.lagnaStarLord}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1">
                <span className="text-amber-700 font-bold">Lagna Sub-Lord:</span>
                <span className="font-bold text-amber-700">{rulingPlanets.lagnaSubLord}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              Active Vimshottari Dasha
            </h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Mahadasha:</span>
                <span className="font-bold">{currentDasha.mahadasha.planet}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Antardasha:</span>
                <span className="font-bold">{currentDasha.antardasha.planet}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pratyantardasha:</span>
                <span className="font-bold">{currentDasha.pratyantardasha.planet}</span>
              </div>
              <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-200">
                Full 120-Year Vimshottari cycle is computed from Moon&apos;s exact degree in {planets[1].nakshatraName} Nakshatra.
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Comprehensive 10-Year Life Predictions (Next 10 Years) */}
        <div className="space-y-4 pt-6">
          <div className="border-b-2 border-amber-500/60 pb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold font-serif text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                {language === 'hi'
                  ? '४. आगामी १० वर्षों का संपूर्ण जीवन फलादेश (10-Year Comprehensive Life Predictions)'
                  : '4. Comprehensive 10-Year Life Predictions & Dasha Forecast'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'hi'
                  ? 'विंशोत्तरी महादशा, अंतर्दशा एवं भाव उप-स्वामी (Cuspal Sub-Lords) के आधार पर वार्षिक विश्लेषण'
                  : 'Annual life domain progression based on Cuspal Sub-Lords and running Vimshottari periods'}
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              १०-वर्षीय विस्तृत खाका (10-Year Roadmap)
            </span>
          </div>

          <div className="space-y-4">
            {tenYearPredictions.map((pred) => (
              <div
                key={pred.year}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3 break-inside-avoid shadow-sm"
              >
                {/* Year Header & Running Dasha */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-serif font-black text-sm shadow-sm">
                      वर्ष {pred.year}
                    </span>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      {pred.dashaPeriodText}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400">अनुकूलता स्कोर:</span>
                    <span className="font-bold text-amber-700 font-mono px-2 py-0.5 rounded bg-amber-100 border border-amber-200">
                      {pred.ratingScore}%
                    </span>
                  </div>
                </div>

                {/* Grid of 4 Life Domains */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Career & Profession */}
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5 text-amber-700">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? 'करियर, नौकरी एवं व्यवसाय:' : 'Career & Profession:'}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">{pred.career}</p>
                  </div>

                  {/* Wealth & Finances */}
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5 text-emerald-700">
                      <Coins className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? 'आर्थिक स्थिति एवं संचित धन:' : 'Wealth & Financial Growth:'}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">{pred.wealth}</p>
                  </div>

                  {/* Marriage & Family */}
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5 text-rose-700">
                      <Heart className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? 'दांपत्य, प्रेम एवं पारिवारिक सुख:' : 'Marriage & Family Relations:'}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">{pred.marriage}</p>
                  </div>

                  {/* Health & Vitality */}
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5 text-indigo-700">
                      <Activity className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? 'स्वास्थ्य एवं शारीरिक ऊर्जा:' : 'Health & Vitality:'}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">{pred.health}</p>
                  </div>
                </div>

                {/* Annual Remedy & Guidance */}
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs flex items-start gap-2">
                  <span className="font-bold text-amber-900 shrink-0">🌿 {language === 'hi' ? 'वार्षिक सलाह व के.पी. उपाय:' : 'Key Annual Remedy:'}</span>
                  <span className="text-amber-800 text-[11px]">{pred.remedy}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legal Disclaimer & Developer Attribution */}
        <div className="mt-8 p-4 rounded-xl border border-amber-300 bg-amber-50/50 space-y-2 text-xs">
          <div className="font-bold text-amber-800 flex items-center gap-1.5">
            <span>⚠️</span>
            <span>कानूनी अस्वीकरण (Legal Disclaimer):</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            यह रिपोर्ट और फलादेश आर्टिफिशियल इंटेलिजेंस (AI Generated) एवं कृष्णमूर्ति पद्धति (KP System) के गणितीय सूत्रों द्वारा स्वतः तैयार किए गए हैं। यह जानकारी केवल शैक्षणिक व सामान्य मार्गदर्शन हेतु है। महत्वपूर्ण जीवन, करियर, विवाह, वित्तीय अथवा स्वास्थ्य निर्णयों के लिए प्रमाणित ज्योतिषी (Expert Astrologer) से व्यक्तिगत परामर्श अवश्य लें।
          </p>
          <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/sandeep-tripathi.jpg"
                alt="Sandeep K Tripathi"
                className="w-7 h-7 rounded-full object-cover border border-amber-400"
              />
              <span className="font-semibold text-amber-900">Developed by Sandeep K Tripathi</span>
            </div>
            <span>AstroVastu Researcher & Educator</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
          Generated automatically by AstroLabs • Developed by Sandeep K Tripathi • Certified Astrological Algorithm
        </div>
      </div>
    </div>
  );
}
