/**
 * lib/dasha-date-resolver.ts
 * Complete 120-Year Vimshottari Dasha Hierarchy (MD -> AD -> PD)
 * Deterministic, mathematically exact (365.25 days/year astronomical standard)
 * with strict date lookup for past, present, and future queries.
 */

import { VIMSHOTTARI_LORDS, TOTAL_DASHA_YEARS } from './kp-calculator';

// Standard astronomical Julian year in milliseconds (365.25 days)
export const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

export interface DetailedPratyantar {
  planet: string;
  hindiPlanet: string;
  startMs: number;
  endMs: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  durationDays: number;
}

export interface DetailedAntar {
  planet: string;
  hindiPlanet: string;
  startMs: number;
  endMs: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  durationYears: number;
  pratyantardashas: DetailedPratyantar[];
}

export interface DetailedMahadasha {
  planet: string;
  hindiPlanet: string;
  startMs: number;
  endMs: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  durationYears: number;
  antardashas: DetailedAntar[];
}

export interface ResolvedDashaContext {
  planetMD: string;
  hindiMD: string;
  mdStart: string;
  mdEnd: string;
  planetAD: string;
  hindiAD: string;
  adStart: string;
  adEnd: string;
  planetPD: string;
  hindiPD: string;
  pdStart: string;
  pdEnd: string;
  periodDescription: string;
  targetDate: string;
  isPast: boolean;
  isFuture: boolean;
  isCurrent: boolean;
}

export interface DashaTableEntry {
  mahadasha: string;
  hindiPlanet: string;
  mdStart: string;
  mdEnd: string;
  durationYears: number;
}

/**
 * Converts local DOB, TOB, and Timezone to UTC Date object and UTC ms
 */
export function getUtcBirthDate(dob: string, tob: string, tz: number = 5.5): Date {
  const [yearStr, monthStr, dayStr] = (dob || '1995-10-24').split('-');
  const timeParts = (tob || '12:00').split(':');

  const year = parseInt(yearStr || '1995', 10);
  const month = parseInt(monthStr || '10', 10);
  const day = parseInt(dayStr || '24', 10);
  const hour = parseInt(timeParts[0] || '12', 10);
  const minute = parseInt(timeParts[1] || '0', 10);
  const second = parseInt(timeParts[2] || '0', 10);

  const localTimeDec = hour + minute / 60.0 + second / 3600.0;
  const utcTimeDec = localTimeDec - tz;
  const utcMs = Date.UTC(year, month - 1, day, 0, 0, 0, 0) + utcTimeDec * 3600000;
  return new Date(utcMs);
}

/**
 * Computes the complete 120-year Vimshottari Dasha timeline (MD -> AD -> PD)
 * using the exact 365.25 days/year standard and true astronomical balance of Dasha.
 */
export function generateFull120YearDashaTimeline(
  siderealMoonLon: number,
  birthDate: Date
): DetailedMahadasha[] {
  const normMoon = ((siderealMoonLon % 360) + 360) % 360;
  const nakTotal = 360 / 27; // 13° 20' = 13.3333333333° (800 arcmin)
  const nakIndex = Math.floor(normMoon / nakTotal);
  const elapsedInNak = normMoon % nakTotal;
  const remainingFraction = Math.max(0, Math.min(1, 1 - (elapsedInNak / nakTotal)));

  const startLordIdx = nakIndex % 9;
  const birthLord = VIMSHOTTARI_LORDS[startLordIdx];
  const balanceYears = birthLord.years * remainingFraction;

  const birthTimestamp = isNaN(birthDate.getTime()) ? Date.now() : birthDate.getTime();
  const timeline: DetailedMahadasha[] = [];

  // Helper to build Antardashas and Pratyantardashas
  function buildAntardashas(
    mahaLord: typeof VIMSHOTTARI_LORDS[0],
    isFirst: boolean,
    theoryStartMs: number,
    clipStartMs: number
  ): DetailedAntar[] {
    const antars: DetailedAntar[] = [];
    let runningStart = theoryStartMs;
    const mLordIdx = VIMSHOTTARI_LORDS.findIndex((l) => l.name === mahaLord.name);

    for (let a = 0; a < 9; a++) {
      const aLordIdx = (mLordIdx + a) % 9;
      const aLord = VIMSHOTTARI_LORDS[aLordIdx];
      // Exact duration: (MD_Years * AD_Years / 120) * MS_PER_YEAR
      const adDurationMs = (mahaLord.years * aLord.years / TOTAL_DASHA_YEARS) * MS_PER_YEAR;
      const runningEnd = runningStart + adDurationMs;

      if (!isFirst || runningEnd > clipStartMs) {
        const actualAdStart = (isFirst && runningStart < clipStartMs) ? clipStartMs : runningStart;

        // Build Pratyantardashas
        const pratyantars: DetailedPratyantar[] = [];
        let pRunningStart = runningStart;

        for (let p = 0; p < 9; p++) {
          const pLordIdx = (aLordIdx + p) % 9;
          const pLord = VIMSHOTTARI_LORDS[pLordIdx];
          const pdDurationMs = (adDurationMs * pLord.years) / TOTAL_DASHA_YEARS;
          const pRunningEnd = pRunningStart + pdDurationMs;

          if (!isFirst || pRunningEnd > clipStartMs) {
            const actualPdStart = (isFirst && pRunningStart < clipStartMs) ? clipStartMs : pRunningStart;
            pratyantars.push({
              planet: pLord.name,
              hindiPlanet: pLord.hindiName,
              startMs: actualPdStart,
              endMs: pRunningEnd,
              startDate: new Date(actualPdStart).toISOString().slice(0, 10),
              endDate: new Date(pRunningEnd).toISOString().slice(0, 10),
              durationDays: Math.round((pRunningEnd - actualPdStart) / 86400000),
            });
          }
          pRunningStart = pRunningEnd;
        }

        antars.push({
          planet: aLord.name,
          hindiPlanet: aLord.hindiName,
          startMs: actualAdStart,
          endMs: runningEnd,
          startDate: new Date(actualAdStart).toISOString().slice(0, 10),
          endDate: new Date(runningEnd).toISOString().slice(0, 10),
          durationYears: Number(((runningEnd - actualAdStart) / MS_PER_YEAR).toFixed(3)),
          pratyantardashas: pratyantars,
        });
      }

      runningStart = runningEnd;
    }
    return antars;
  }

  // 1. First Mahadasha (Birth Balance)
  const firstEndMs = birthTimestamp + balanceYears * MS_PER_YEAR;
  const firstMdTheoryStartMs = firstEndMs - birthLord.years * MS_PER_YEAR;

  timeline.push({
    planet: birthLord.name,
    hindiPlanet: birthLord.hindiName,
    startMs: birthTimestamp,
    endMs: firstEndMs,
    startDate: new Date(birthTimestamp).toISOString().slice(0, 10),
    endDate: new Date(firstEndMs).toISOString().slice(0, 10),
    durationYears: Number(balanceYears.toFixed(3)),
    antardashas: buildAntardashas(birthLord, true, firstMdTheoryStartMs, birthTimestamp),
  });

  // 2. Remaining 8 Mahadashas (Full Standard Durations)
  let currentStartMs = firstEndMs;
  for (let m = 1; m < 9; m++) {
    const lordIdx = (startLordIdx + m) % 9;
    const lord = VIMSHOTTARI_LORDS[lordIdx];
    const endMs = currentStartMs + lord.years * MS_PER_YEAR;

    timeline.push({
      planet: lord.name,
      hindiPlanet: lord.hindiName,
      startMs: currentStartMs,
      endMs: endMs,
      startDate: new Date(currentStartMs).toISOString().slice(0, 10),
      endDate: new Date(endMs).toISOString().slice(0, 10),
      durationYears: lord.years,
      antardashas: buildAntardashas(lord, false, currentStartMs, currentStartMs),
    });

    currentStartMs = endMs;
  }

  return timeline;
}

/**
 * Resolves the exact active Dasha hierarchy for ANY target date (past, present, or future)
 * using strict binary / range lookup over the 120-year tree.
 */
export function getDashaForDate(
  timeline: DetailedMahadasha[],
  targetDate: Date
): ResolvedDashaContext {
  const targetTime = targetDate.getTime();
  const now = Date.now();

  if (!timeline || timeline.length === 0) {
    return {
      planetMD: 'Unknown',
      hindiMD: 'अज्ञात',
      mdStart: '',
      mdEnd: '',
      planetAD: 'Unknown',
      hindiAD: 'अज्ञात',
      adStart: '',
      adEnd: '',
      planetPD: 'Unknown',
      hindiPD: 'अज्ञात',
      pdStart: '',
      pdEnd: '',
      periodDescription: '',
      targetDate: targetDate.toISOString().slice(0, 10),
      isPast: false,
      isFuture: false,
      isCurrent: true,
    };
  }

  // 1. Strict Range Search for Mahadasha
  let activeMaha = timeline.find((m) => targetTime >= m.startMs && targetTime < m.endMs);
  if (!activeMaha) {
    activeMaha = targetTime < timeline[0].startMs ? timeline[0] : timeline[timeline.length - 1];
  }

  // 2. Strict Range Search for Antardasha
  let activeAntar = activeMaha.antardashas.find((a) => targetTime >= a.startMs && targetTime < a.endMs);
  if (!activeAntar) {
    activeAntar = activeMaha.antardashas[0];
  }

  // 3. Strict Range Search for Pratyantardasha
  let activePrat = activeAntar.pratyantardashas.find((p) => targetTime >= p.startMs && targetTime < p.endMs);
  if (!activePrat) {
    activePrat = activeAntar.pratyantardashas[0] || {
      planet: activeAntar.planet,
      hindiPlanet: activeAntar.hindiPlanet,
      startDate: activeAntar.startDate,
      endDate: activeAntar.endDate,
    };
  }

  const isCurrent = Math.abs(targetTime - now) < 24 * 60 * 60 * 1000;
  const isPast = targetTime < now && !isCurrent;
  const isFuture = targetTime > now && !isCurrent;

  return {
    planetMD: activeMaha.planet,
    hindiMD: activeMaha.hindiPlanet,
    mdStart: activeMaha.startDate,
    mdEnd: activeMaha.endDate,
    planetAD: activeAntar.planet,
    hindiAD: activeAntar.hindiPlanet,
    adStart: activeAntar.startDate,
    adEnd: activeAntar.endDate,
    planetPD: activePrat.planet,
    hindiPD: activePrat.hindiPlanet,
    pdStart: activePrat.startDate,
    pdEnd: activePrat.endDate,
    periodDescription: `${activeMaha.planet} महादशा में ${activeAntar.planet} अंतर्दशा (${activeMaha.startDate} से ${activeMaha.endDate})`,
    targetDate: targetDate.toISOString().slice(0, 10),
    isPast,
    isFuture,
    isCurrent,
  };
}

/**
 * Extracts a clean summary table of all Mahadashas with start and end dates
 */
export function getAllMahadashasTable(timeline: DetailedMahadasha[]): DashaTableEntry[] {
  return timeline.map((m) => ({
    mahadasha: m.planet,
    hindiPlanet: m.hindiPlanet,
    mdStart: m.startDate,
    mdEnd: m.endDate,
    durationYears: m.durationYears,
  }));
}

/**
 * Parses user query to detect if they are asking about a specific year or date.
 * If 4-digit year like "2014" is found, returns July 1st of that year (2014-07-01).
 * If no date/year is mentioned, defaults to today.
 */
export function extractQueriedTargetDate(query: string): { targetDate: Date; yearMentioned: number | null } {
  if (!query) {
    return { targetDate: new Date(), yearMentioned: null };
  }

  // 1. Full explicit ISO date match (e.g. 2014-05-15 or 15/05/2014)
  const isoMatch = query.match(/\b(19\d\d|20\d\d)[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const d = parseInt(isoMatch[3], 10);
    return { targetDate: new Date(Date.UTC(y, m, d)), yearMentioned: y };
  }

  // 2. Explicit 4-digit year match (e.g. 2014, 1999)
  const yearMatch = query.match(/\b(19\d\d|20\d\d)\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    return {
      targetDate: new Date(Date.UTC(year, 6, 1)), // Mid-year July 1st
      yearMentioned: year,
    };
  }

  // 3. Relative keywords
  const currentYear = new Date().getFullYear();
  const lower = query.toLowerCase();

  if (/next\s*year|अगले\s*साल|अगले\s*वर्ष/i.test(lower)) {
    return {
      targetDate: new Date(Date.UTC(currentYear + 1, 6, 1)),
      yearMentioned: currentYear + 1,
    };
  }

  if (/last\s*year|पिछले\s*साल|पिछले\s*वर्ष/i.test(lower)) {
    return {
      targetDate: new Date(Date.UTC(currentYear - 1, 6, 1)),
      yearMentioned: currentYear - 1,
    };
  }

  if (/after\s*(\d+)\s*years?|(\d+)\s*साल\s*बाद/i.test(lower)) {
    const m = lower.match(/after\s*(\d+)\s*years?|(\d+)\s*साल\s*बाद/i);
    const offset = parseInt(m?.[1] || m?.[2] || '1', 10);
    return {
      targetDate: new Date(Date.UTC(currentYear + offset, 6, 1)),
      yearMentioned: currentYear + offset,
    };
  }

  return {
    targetDate: new Date(),
    yearMentioned: null,
  };
}
