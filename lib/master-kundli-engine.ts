/**
 * lib/master-kundli-engine.ts
 * Master Astrological Engine combining high-precision KP Astrology (Placidus cusps, CSLs,
 * 4-fold significators L1-L4, Ruling Planets, Pars Fortuna, 120-year Vimshottari Dasha down to Sookshma)
 * with Parashari Vedic strengths, Bhava shift detection, special aspects, Shodashvarga (16 divisional charts),
 * Ashtakvarga (BAV & SAV), and Live Real-Time Double-Transit Gochar.
 */

import { ChartInput, KPMatrix, PlanetPosition, CuspData } from '@/types/astrology';
import { calculateMasterKPMatrix } from '@/lib/astronomyEngine';
import { VIMSHOTTARI_LORDS, TOTAL_DASHA_YEARS } from '@/lib/kp-calculator';
import { evaluateParashariKundli, ParashariAnalysis, resolveSignId } from '@/lib/parashari-evaluator';
import { computeShodashvarga, ShodashvargaChart } from '@/lib/shodashvarga';
import { calculateAshtakvarga, AshtakvargaResult } from '@/lib/ashtakvarga';
import { evaluateGochar, GocharEvaluationResult } from '@/lib/gochar-evaluator';
import { kundliCalculationCache } from '@/lib/cache-manager';
import { generateFull120YearDashaTimeline, DetailedMahadasha, getUtcBirthDate, getAllMahadashasTable, DashaTableEntry } from '@/lib/dasha-date-resolver';

export interface ExtendedDashaHierarchy {
  mahadasha: { planet: string; startDate: string; endDate: string };
  antardasha: { planet: string; startDate: string; endDate: string };
  pratyantardasha: { planet: string; startDate: string; endDate: string };
  sookshmaDasha: { planet: string; startDate: string; endDate: string };
}

export interface MasterPlanetDetails extends PlanetPosition {
  d1House: number;
  bhavaChalitHouse: number;
  hasBhavaShift: boolean;
  shiftDescription?: string;
  isUntenanted: boolean;
  dignity: 'Exalted' | 'Debilitated' | 'Own Sign' | 'Vargottama' | 'Normal';
  specialAspectHouses: number[];
}

export interface BhavaShiftRecord {
  planet: string;
  d1House: number;
  bhavaChalitHouse: number;
  description: string;
}

export interface BhavaBhaveshInfo {
  houseNumber: number;
  signLord: string;
  lordPlacedInHouse: number;
  planetsInHouse: string[];
}

export interface AspectDetails {
  planet: string;
  sourceHouse: number;
  aspectHouses: number[];
  aspectType: string;
  descriptionHi: string;
}

export interface MasterKundliJSON {
  meta: {
    name: string;
    dateOfBirth: string;
    timeOfBirth: string;
    placeName: string;
    latitude: number;
    longitude: number;
    timezone: number;
    ayanamsa: string;
    ayanamsaValueDeg: number;
    julianDay: number;
    generatedAt: string;
  };
  ascendant: {
    longitude: number;
    signId: number;
    signName: string;
    signLord: string;
    starLord: string;
    subLord: string;
    subSubLord: string;
    dms: string;
  };
  planets: MasterPlanetDetails[];
  cusps: CuspData[];
  fourFoldSignificators: {
    L1: { house: number; planets: string[] }[];
    L2: { house: number; planets: string[] }[];
    L3: { house: number; planets: string[] }[];
    L4: { house: number; planets: string[] }[];
  };
  untenantedPlanets: string[];
  bhavaShifts: BhavaShiftRecord[];
  conjunctionsByHouse: { house: number; planets: string[] }[];
  planetaryAspects: AspectDetails[];
  houseLordships: BhavaBhaveshInfo[];
  rulingPlanets: {
    dayLord: string;
    ascendantSignLord: string;
    ascendantStarLord: string;
    ascendantSubLord: string;
    moonSignLord: string;
    moonStarLord: string;
    moonSubLord: string;
  };
  parsFortuna: {
    longitude: number;
    signId: number;
    signName: string;
    house: number;
    signLord: string;
    starLord: string;
    subLord: string;
  };
  dashaHierarchy: ExtendedDashaHierarchy;
  full120YearDashaTimeline: DetailedMahadasha[];
  fullMahadashaSummary: { planet: string; startYear: number; endYear: number; periodStr: string }[];
  allMahadashasTable?: DashaTableEntry[];
  shodashvarga: Record<string, ShodashvargaChart>;
  ashtakvarga: AshtakvargaResult;
  parashariAnalysis: ParashariAnalysis;
  liveGochar: GocharEvaluationResult;
}

/**
 * Computes Sookshma Dasha (4th tier: Mahadasha -> Antardasha -> Pratyantardasha -> Sookshma Dasha)
 */
function computeSookshmaDasha(
  pratyantar: { planet: string; startDate: string; endDate: string }
): { planet: string; startDate: string; endDate: string } {
  const now = Date.now();
  const pratLordIdx = VIMSHOTTARI_LORDS.findIndex((l) => l.name === pratyantar.planet);
  const pStart = new Date(pratyantar.startDate).getTime();
  const pDurationYears = (new Date(pratyantar.endDate).getTime() - pStart) / (365.25 * 86400000);

  let sookshmaStart = pStart;
  let activeSookshma = {
    planet: pratyantar.planet,
    startDate: pratyantar.startDate,
    endDate: pratyantar.endDate,
  };

  const baseIdx = pratLordIdx >= 0 ? pratLordIdx : 0;
  for (let s = 0; s < 9; s++) {
    const sLordIdx = (baseIdx + s) % 9;
    const sLord = VIMSHOTTARI_LORDS[sLordIdx];
    const sDurationYears = (pDurationYears * sLord.years) / TOTAL_DASHA_YEARS;
    const sEnd = sookshmaStart + sDurationYears * 365.25 * 86400000;

    if (now >= sookshmaStart && now <= sEnd) {
      activeSookshma = {
        planet: sLord.name,
        startDate: new Date(sookshmaStart).toISOString(),
        endDate: new Date(sEnd).toISOString(),
      };
      break;
    }
    sookshmaStart = sEnd;
  }

  return activeSookshma;
}

/**
 * Evaluates dignity of a planet (Exalted, Debilitated, Own Sign, Vargottama, Normal)
 */
function evaluatePlanetDignity(planetName: string, signId: number, d9SignId?: number): 'Exalted' | 'Debilitated' | 'Own Sign' | 'Vargottama' | 'Normal' {
  if (d9SignId && d9SignId === signId) return 'Vargottama';

  switch (planetName) {
    case 'Sun':
      if (signId === 1) return 'Exalted';
      if (signId === 7) return 'Debilitated';
      if (signId === 5) return 'Own Sign';
      break;
    case 'Moon':
      if (signId === 2) return 'Exalted';
      if (signId === 8) return 'Debilitated';
      if (signId === 4) return 'Own Sign';
      break;
    case 'Mars':
      if (signId === 10) return 'Exalted';
      if (signId === 4) return 'Debilitated';
      if (signId === 1 || signId === 8) return 'Own Sign';
      break;
    case 'Mercury':
      if (signId === 6) return 'Exalted';
      if (signId === 12) return 'Debilitated';
      if (signId === 3 || signId === 6) return 'Own Sign';
      break;
    case 'Jupiter':
      if (signId === 4) return 'Exalted';
      if (signId === 10) return 'Debilitated';
      if (signId === 9 || signId === 12) return 'Own Sign';
      break;
    case 'Venus':
      if (signId === 12) return 'Exalted';
      if (signId === 6) return 'Debilitated';
      if (signId === 2 || signId === 7) return 'Own Sign';
      break;
    case 'Saturn':
      if (signId === 7) return 'Exalted';
      if (signId === 1) return 'Debilitated';
      if (signId === 10 || signId === 11) return 'Own Sign';
      break;
  }
  return 'Normal';
}

/**
 * Calculates Full Planetary Aspects (Drishti) including Mars, Jupiter, Saturn special aspects
 */
function calculateSpecialAspects(planetName: string, fromHouse: number): { houses: number[]; descriptionHi: string } {
  const norm = (h: number) => (((h - 1) % 12) + 12) % 12 + 1;
  const standard7 = norm(fromHouse + 6);

  if (planetName === 'Mars') {
    const asp4 = norm(fromHouse + 3);
    const asp8 = norm(fromHouse + 7);
    return {
      houses: [asp4, standard7, asp8],
      descriptionHi: `मंगल की ४थी दृष्टि ${asp4}वें, ७वीं दृष्टि ${standard7}वें, व ८वीं दृष्टि ${asp8}वें भाव पर है।`,
    };
  }

  if (planetName === 'Jupiter') {
    const asp5 = norm(fromHouse + 4);
    const asp9 = norm(fromHouse + 8);
    return {
      houses: [asp5, standard7, asp9],
      descriptionHi: `देवगुरु बृहस्पति की ५वीं दृष्टि ${asp5}वें, ७वीं दृष्टि ${standard7}वें, व ९वीं दृष्टि ${asp9}वें भाव पर है (अमृत तुल्य शुभ दृष्टि)।`,
    };
  }

  if (planetName === 'Saturn') {
    const asp3 = norm(fromHouse + 2);
    const asp10 = norm(fromHouse + 9);
    return {
      houses: [asp3, standard7, asp10],
      descriptionHi: `शनि देव की ३री दृष्टि ${asp3}वें, ७वीं दृष्टि ${standard7}वें, व १०वीं दृष्टि ${asp10}वें भाव पर है (कर्म व अनुशासन)।`,
    };
  }

  if (['Rahu', 'Ketu'].includes(planetName)) {
    const asp5 = norm(fromHouse + 4);
    const asp9 = norm(fromHouse + 8);
    return {
      houses: [asp5, standard7, asp9],
      descriptionHi: `${planetName} की ५वीं, ७वीं व ९वीं दृष्टि क्रमशः ${asp5}, ${standard7}, ${asp9}वें भावों पर है।`,
    };
  }

  // Standard 7th aspect for Sun, Moon, Mercury, Venus
  return {
    houses: [standard7],
    descriptionHi: `${planetName} की पूर्ण ७वीं दृष्टि ${standard7}वें भाव पर है।`,
  };
}

/**
 * Builds the complete Master Kundli JSON
 */
export function generateMasterKundli(input: ChartInput): MasterKundliJSON {
  const dob = input.dateOfBirth || '1995-10-24';
  const tob = input.timeOfBirth || '12:00';
  const lat = typeof input.latitude === 'string' ? parseFloat(input.latitude) : Number(input.latitude) || 28.6139;
  const lon = typeof input.longitude === 'string' ? parseFloat(input.longitude) : Number(input.longitude) || 77.209;
  const tz = typeof input.timezone === 'string' ? parseFloat(input.timezone) : input.timezone !== undefined ? Number(input.timezone) : 5.5;

  const cacheKey = `master_kundli:${dob}_${tob}_${lat.toFixed(4)}_${lon.toFixed(4)}_${tz}`;
  const cached = kundliCalculationCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // 1. Core KP Matrix (Planets, Placidus Cusps, Ascendant)
  const kpMatrix = calculateMasterKPMatrix(input);
  const cusp1 = kpMatrix.cusps && kpMatrix.cusps.length > 0 ? kpMatrix.cusps[0] : null;
  const ascLon = typeof kpMatrix.ascendant === 'number' ? kpMatrix.ascendant : (cusp1?.longitude || 0);
  const ascSignId = resolveSignId(cusp1?.signName || Math.floor(ascLon / 30) + 1, ascLon);

  // 2. Shodashvarga 16 Divisional Charts
  const bodiesForDivisions = [
    { name: 'Ascendant', longitude: ascLon },
    ...kpMatrix.planets.map((p) => ({ name: p.name, longitude: p.longitude })),
  ];
  const shodashvarga = computeShodashvarga(bodiesForDivisions);

  // 3. Untenanted Planets check
  // In KP, a planet is untenanted if no other planet occupies its nakshatra (star)
  const starLordsInUse = new Set(kpMatrix.planets.map((p) => p.starLord));
  const untenantedPlanets = kpMatrix.planets
    .filter((p) => !starLordsInUse.has(p.name))
    .map((p) => p.name);

  // 4. Bhava Shift & Detailed Planet Calculation
  const bhavaShifts: BhavaShiftRecord[] = [];
  const planetaryAspects: AspectDetails[] = [];
  const masterPlanets: MasterPlanetDetails[] = [];

  for (const p of kpMatrix.planets) {
    const pSignId = resolveSignId(p.signId || p.signName, p.longitude);
    // D1 House from Lagna Sign
    const d1House = (((pSignId - ascSignId) % 12) + 12) % 12 + 1;
    // Bhava Chalit House from KP Placidus Cusps
    const bhavaChalitHouse = p.houseOccupied || d1House;
    const hasBhavaShift = d1House !== bhavaChalitHouse;

    let shiftDesc: string | undefined;
    if (hasBhavaShift) {
      shiftDesc = `${p.name} राशि कुंडली में भाव ${d1House} में है परंतु भाव चलित में खिसक कर भाव ${bhavaChalitHouse} का फल दे रहा है।`;
      bhavaShifts.push({
        planet: p.name,
        d1House,
        bhavaChalitHouse,
        description: shiftDesc,
      });
    }

    const d9Sign = shodashvarga?.D9?.placements[p.name]?.signId;
    const dignity = evaluatePlanetDignity(p.name, pSignId, d9Sign);
    const aspectInfo = calculateSpecialAspects(p.name, d1House);

    planetaryAspects.push({
      planet: p.name,
      sourceHouse: d1House,
      aspectHouses: aspectInfo.houses,
      aspectType: p.name === 'Mars' ? '4/7/8' : p.name === 'Jupiter' ? '5/7/9' : p.name === 'Saturn' ? '3/7/10' : '7th',
      descriptionHi: aspectInfo.descriptionHi,
    });

    masterPlanets.push({
      ...p,
      d1House,
      bhavaChalitHouse,
      hasBhavaShift,
      shiftDescription: shiftDesc,
      isUntenanted: untenantedPlanets.includes(p.name),
      dignity,
      specialAspectHouses: aspectInfo.houses,
    });
  }

  // 5. Conjunctions per house (Yuti) & House Lordships (Bhava-Bhavesh)
  const conjunctionsByHouse: { house: number; planets: string[] }[] = [];
  const houseLordships: BhavaBhaveshInfo[] = [];

  for (let h = 1; h <= 12; h++) {
    const occupants = masterPlanets.filter((p) => p.d1House === h).map((p) => p.name);
    if (occupants.length > 0) {
      conjunctionsByHouse.push({ house: h, planets: occupants });
    }

    // Sign of house h from Lagna
    const houseSign = (((ascSignId - 1 + (h - 1)) % 12) + 12) % 12 + 1;
    const lordObj = kpMatrix.cusps.find((c) => (c.houseNumber || (c as any).cuspNumber) === h);
    const signLord = lordObj?.signLord || '';
    const lordPlanet = masterPlanets.find((p) => (p.name || '').toLowerCase() === (signLord || '').toLowerCase());

    houseLordships.push({
      houseNumber: h,
      signLord,
      lordPlacedInHouse: lordPlanet ? lordPlanet.d1House : h,
      planetsInHouse: occupants,
    });
  }

  // 6. 4-Fold Significators (L1, L2, L3, L4)
  const fourFoldSignificators = {
    L1: [] as { house: number; planets: string[] }[],
    L2: [] as { house: number; planets: string[] }[],
    L3: [] as { house: number; planets: string[] }[],
    L4: [] as { house: number; planets: string[] }[],
  };

  if (kpMatrix.houseSignificators) {
    for (const sig of kpMatrix.houseSignificators) {
      fourFoldSignificators.L1.push({ house: sig.houseNumber, planets: sig.level1 || [] });
      fourFoldSignificators.L2.push({ house: sig.houseNumber, planets: sig.level2 || [] });
      fourFoldSignificators.L3.push({ house: sig.houseNumber, planets: sig.level3 || [] });
      fourFoldSignificators.L4.push({ house: sig.houseNumber, planets: sig.level4 || [] });
    }
  }

  // 7. Ruling Planets & Pars Fortuna
  const rulingPlanets = kpMatrix.rulingPlanets;
  const parsFortuna = kpMatrix.parsFortuna;

  // 8. Extended Dasha Hierarchy & 120-Year Timeline
  const currentDasha = kpMatrix.currentDasha;
  const sookshmaDasha = computeSookshmaDasha(currentDasha.pratyantardasha);
  const dashaHierarchy: ExtendedDashaHierarchy = {
    mahadasha: currentDasha.mahadasha,
    antardasha: currentDasha.antardasha,
    pratyantardasha: currentDasha.pratyantardasha,
    sookshmaDasha,
  };

  const birthDateObj = getUtcBirthDate(dob, tob, tz);
  const moonPlanet = kpMatrix.planets.find((p) => p.name === 'Moon');
  const moonLon = moonPlanet ? moonPlanet.longitude : 0;
  const full120YearDashaTimeline = generateFull120YearDashaTimeline(moonLon, birthDateObj);

  const fullMahadashaSummary = full120YearDashaTimeline.map((m) => {
    const sYear = parseInt(m.startDate.slice(0, 4), 10);
    const eYear = parseInt(m.endDate.slice(0, 4), 10);
    return {
      planet: m.planet,
      startYear: sYear,
      endYear: eYear,
      periodStr: `${m.planet} (${m.hindiPlanet}): ${sYear} से ${eYear}`,
    };
  });

  // 9. Ashtakvarga (BAV for 7 planets & SAV for all houses)
  const planetSignsMap: Record<string, number> = {};
  for (const p of kpMatrix.planets) {
    planetSignsMap[p.name] = resolveSignId(p.signId || p.signName, p.longitude);
  }
  const ashtakvarga = calculateAshtakvarga(planetSignsMap, ascSignId);

  // 10. Parashari Dignities, Yogas & Aspects
  const parashariAnalysis = evaluateParashariKundli(kpMatrix);

  // 11. Live Gochar (Real-Time Transits mapped against natal)
  const moonSignId = resolveSignId(moonPlanet?.signId || moonPlanet?.signName, moonPlanet?.longitude);
  const liveGochar = evaluateGochar(ascSignId, moonSignId);

  const masterKundli: MasterKundliJSON = {
    meta: {
      name: input.name || 'Jataka',
      dateOfBirth: dob,
      timeOfBirth: tob,
      placeName: input.placeName || 'Unknown',
      latitude: lat,
      longitude: lon,
      timezone: tz,
      ayanamsa: input.ayanamsa || 'KP_NEW',
      ayanamsaValueDeg: kpMatrix.ayanamsaValue,
      julianDay: kpMatrix.julianDay,
      generatedAt: new Date().toISOString(),
    },
    ascendant: {
      longitude: ascLon,
      signId: ascSignId,
      signName: cusp1?.signName || '',
      signLord: cusp1?.signLord || '',
      starLord: cusp1?.starLord || '',
      subLord: cusp1?.subLord || '',
      subSubLord: cusp1?.subSubLord || '',
      dms: cusp1?.formattedDMS || '',
    },
    planets: masterPlanets,
    cusps: kpMatrix.cusps,
    fourFoldSignificators,
    untenantedPlanets,
    bhavaShifts,
    conjunctionsByHouse,
    planetaryAspects,
    houseLordships,
    rulingPlanets: {
      dayLord: rulingPlanets.dayLord,
      ascendantSignLord: rulingPlanets.lagnaSignLord,
      ascendantStarLord: rulingPlanets.lagnaStarLord,
      ascendantSubLord: rulingPlanets.lagnaSubLord,
      moonSignLord: rulingPlanets.moonSignLord,
      moonStarLord: rulingPlanets.moonStarLord,
      moonSubLord: rulingPlanets.moonSubLord,
    },
    parsFortuna: {
      longitude: parsFortuna.longitude,
      signId: resolveSignId(parsFortuna.signName, parsFortuna.longitude),
      signName: parsFortuna.signName,
      house: parsFortuna.houseOccupied,
      signLord: parsFortuna.signLord,
      starLord: parsFortuna.starLord,
      subLord: parsFortuna.subLord,
    },
    dashaHierarchy,
    full120YearDashaTimeline,
    fullMahadashaSummary,
    allMahadashasTable: getAllMahadashasTable(full120YearDashaTimeline),
    shodashvarga,
    ashtakvarga,
    parashariAnalysis,
    liveGochar,
  };

  kundliCalculationCache.set(cacheKey, masterKundli, 24 * 60 * 60 * 1000);
  return masterKundli;
}
