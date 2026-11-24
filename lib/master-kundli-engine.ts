/**
 * lib/master-kundli-engine.ts
 * Master Astrological Engine combining high-precision KP Astrology (Placidus cusps, CSLs,
 * 4-fold significators L1-L4, Ruling Planets, Pars Fortuna, Vimshottari Dasha down to Sookshma)
 * with Parashari Vedic strengths, Shodashvarga (16 divisional charts), Ashtakvarga (BAV & SAV),
 * and Live Real-Time Gochar (Planetary Transits).
 */

import { ChartInput, KPMatrix, PlanetPosition, CuspData } from '@/types/astrology';
import { calculateMasterKPMatrix } from '@/lib/astronomyEngine';
import { VIMSHOTTARI_LORDS, TOTAL_DASHA_YEARS } from '@/lib/kp-calculator';
import { evaluateParashariKundli, ParashariAnalysis, resolveSignId } from '@/lib/parashari-evaluator';
import { computeShodashvarga, ShodashvargaChart } from '@/lib/shodashvarga';
import { calculateAshtakvarga, AshtakvargaResult } from '@/lib/ashtakvarga';
import { evaluateGochar, GocharEvaluationResult } from '@/lib/gochar-evaluator';
import { kundliCalculationCache } from '@/lib/cache-manager';

export interface ExtendedDashaHierarchy {
  mahadasha: { planet: string; startDate: string; endDate: string };
  antardasha: { planet: string; startDate: string; endDate: string };
  pratyantardasha: { planet: string; startDate: string; endDate: string };
  sookshmaDasha: { planet: string; startDate: string; endDate: string };
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
  planets: PlanetPosition[];
  cusps: CuspData[];
  fourFoldSignificators: {
    L1: { house: number; planets: string[] }[];
    L2: { house: number; planets: string[] }[];
    L3: { house: number; planets: string[] }[];
    L4: { house: number; planets: string[] }[];
  };
  untenantedPlanets: string[];
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

  // 2. Untenanted Planets check
  // A planet is untenanted if no other planet is in its star (nakshatra)
  const starLordsInUse = new Set(kpMatrix.planets.map((p) => p.starLord));
  const untenantedPlanets = kpMatrix.planets
    .filter((p) => !starLordsInUse.has(p.name))
    .map((p) => p.name);

  // 3. 4-Fold Significators (L1, L2, L3, L4)
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

  // 4. Ruling Planets & Pars Fortuna
  const rulingPlanets = kpMatrix.rulingPlanets;
  const parsFortuna = kpMatrix.parsFortuna;

  // 5. Extended Dasha Hierarchy (MD -> AD -> PD -> Sookshma)
  const currentDasha = kpMatrix.currentDasha;
  const sookshmaDasha = computeSookshmaDasha(currentDasha.pratyantardasha);
  const dashaHierarchy: ExtendedDashaHierarchy = {
    mahadasha: currentDasha.mahadasha,
    antardasha: currentDasha.antardasha,
    pratyantardasha: currentDasha.pratyantardasha,
    sookshmaDasha,
  };

  // 6. Shodashvarga 16 Divisional Charts
  const bodiesForDivisions = [
    { name: 'Ascendant', longitude: ascLon },
    ...kpMatrix.planets.map((p) => ({ name: p.name, longitude: p.longitude })),
  ];
  const shodashvarga = computeShodashvarga(bodiesForDivisions);

  // 7. Ashtakvarga (BAV for 7 planets & SAV for all houses)
  const planetSignsMap: Record<string, number> = {};
  for (const p of kpMatrix.planets) {
    planetSignsMap[p.name] = resolveSignId(p.signId || p.signName, p.longitude);
  }
  const ascSignId = resolveSignId(cusp1?.signName || Math.floor(ascLon / 30) + 1, ascLon);
  const ashtakvarga = calculateAshtakvarga(planetSignsMap, ascSignId);

  // 8. Parashari Dignities, Yogas & Aspects
  const parashariAnalysis = evaluateParashariKundli(kpMatrix);

  // 9. Live Gochar (Real-Time Transits mapped against natal)
  const moonPlanet = kpMatrix.planets.find((p) => p.name === 'Moon');
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
    planets: kpMatrix.planets,
    cusps: kpMatrix.cusps,
    fourFoldSignificators,
    untenantedPlanets,
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
    shodashvarga,
    ashtakvarga,
    parashariAnalysis,
    liveGochar,
  };

  kundliCalculationCache.set(cacheKey, masterKundli, 24 * 60 * 60 * 1000);
  return masterKundli;
}
