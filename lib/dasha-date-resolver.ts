/**
 * lib/dasha-date-resolver.ts
 * Complete 120-Year Vimshottari Dasha Hierarchy (MD -> AD -> PD)
 * with deterministic date resolution for past, present, and future queries.
 */

import { VIMSHOTTARI_LORDS, TOTAL_DASHA_YEARS, getKPDivision } from './kp-calculator';

export interface DetailedPratyantar {
  planet: string;
  hindiPlanet: string;
  startDate: string; // ISO
  endDate: string; // ISO
  durationDays: number;
}

export interface DetailedAntar {
  planet: string;
  hindiPlanet: string;
  startDate: string; // ISO
  endDate: string; // ISO
  durationYears: number;
  pratyantardashas: DetailedPratyantar[];
}

export interface DetailedMahadasha {
  planet: string;
  hindiPlanet: string;
  startDate: string; // ISO
  endDate: string; // ISO
  durationYears: number;
  antardashas: DetailedAntar[];
}

export interface ResolvedDashaContext {
  planetMD: string;
  hindiMD: string;
  planetAD: string;
  hindiAD: string;
  planetPD: string;
  hindiPD: string;
  periodDescription: string;
  mdStart: string;
  mdEnd: string;
  adStart: string;
  adEnd: string;
  targetDate: string;
  isPast: boolean;
  isFuture: boolean;
  isCurrent: boolean;
}

/**
 * Computes the complete 120-year Vimshottari Dasha timeline (MD -> AD -> PD)
 */
export function generateFull120YearDashaTimeline(
  moonLon: number,
  birthDate: Date
): DetailedMahadasha[] {
  const moonDiv = getKPDivision(moonLon);
  const totalMinutes = moonLon * 60;
  const remMinutesInNak = totalMinutes % 800; // minutes elapsed in current nakshatra

  const starLordName = moonDiv.starLord;
  let startLordIdx = VIMSHOTTARI_LORDS.findIndex((l) => l.name === starLordName);
  if (startLordIdx === -1) startLordIdx = 0;

  const totalYearsOfLord = VIMSHOTTARI_LORDS[startLordIdx].years;
  const elapsedFraction = remMinutesInNak / 800.0;
  const balanceYears = totalYearsOfLord * (1 - elapsedFraction);

  const safeBirthTime = isNaN(birthDate.getTime()) ? Date.now() : birthDate.getTime();
  let currentStartTime = safeBirthTime;

  const timeline: DetailedMahadasha[] = [];

  for (let m = 0; m < 9; m++) {
    const lordIdx = (startLordIdx + m) % 9;
    const mahaLord = VIMSHOTTARI_LORDS[lordIdx];
    const durationYears = m === 0 ? balanceYears : mahaLord.years;
    const durationMs = durationYears * 365.25 * 86400000;
    const currentEndTime = currentStartTime + durationMs;

    const mahaStartIso = new Date(currentStartTime).toISOString();
    const mahaEndIso = new Date(currentEndTime).toISOString();

    // Generate 9 Antardashas
    const antardashas: DetailedAntar[] = [];
    let antarStartTime = currentStartTime;

    for (let a = 0; a < 9; a++) {
      const antarLordIdx = (lordIdx + a) % 9;
      const aLord = VIMSHOTTARI_LORDS[antarLordIdx];
      const antarDurationYears = (durationYears * aLord.years) / TOTAL_DASHA_YEARS;
      const antarDurationMs = antarDurationYears * 365.25 * 86400000;
      const antarEndTime = antarStartTime + antarDurationMs;

      const antarStartIso = new Date(antarStartTime).toISOString();
      const antarEndIso = new Date(antarEndTime).toISOString();

      // Generate 9 Pratyantardashas
      const pratyantardashas: DetailedPratyantar[] = [];
      let pratStartTime = antarStartTime;

      for (let p = 0; p < 9; p++) {
        const pratLordIdx = (antarLordIdx + p) % 9;
        const pLord = VIMSHOTTARI_LORDS[pratLordIdx];
        const pratDurationYears = (antarDurationYears * pLord.years) / TOTAL_DASHA_YEARS;
        const pratDurationMs = pratDurationYears * 365.25 * 86400000;
        const pratEndTime = pratStartTime + pratDurationMs;

        pratyantardashas.push({
          planet: pLord.name,
          hindiPlanet: pLord.hindiName,
          startDate: new Date(pratStartTime).toISOString(),
          endDate: new Date(pratEndTime).toISOString(),
          durationDays: Math.round(pratDurationMs / 86400000),
        });

        pratStartTime = pratEndTime;
      }

      antardashas.push({
        planet: aLord.name,
        hindiPlanet: aLord.hindiName,
        startDate: antarStartIso,
        endDate: antarEndIso,
        durationYears: Number(antarDurationYears.toFixed(2)),
        pratyantardashas,
      });

      antarStartTime = antarEndTime;
    }

    timeline.push({
      planet: mahaLord.name,
      hindiPlanet: mahaLord.hindiName,
      startDate: mahaStartIso,
      endDate: mahaEndIso,
      durationYears: Number(durationYears.toFixed(2)),
      antardashas,
    });

    currentStartTime = currentEndTime;
  }

  return timeline;
}

/**
 * Resolves the exact active Dasha hierarchy for ANY target date (past, present, or future)
 */
export function getDashaForDate(
  timeline: DetailedMahadasha[],
  targetDate: Date
): ResolvedDashaContext {
  const targetTime = targetDate.getTime();
  const now = Date.now();

  // Find active Mahadasha
  let activeMaha = timeline.find((m) => {
    const s = new Date(m.startDate).getTime();
    const e = new Date(m.endDate).getTime();
    return targetTime >= s && targetTime <= e;
  });

  if (!activeMaha) {
    // If target date is before birth or after 120 years, pick closest
    activeMaha = targetTime < new Date(timeline[0].startDate).getTime() ? timeline[0] : timeline[timeline.length - 1];
  }

  // Find active Antardasha
  let activeAntar = activeMaha.antardashas.find((a) => {
    const s = new Date(a.startDate).getTime();
    const e = new Date(a.endDate).getTime();
    return targetTime >= s && targetTime <= e;
  });

  if (!activeAntar) {
    activeAntar = activeMaha.antardashas[0];
  }

  // Find active Pratyantardasha
  let activePrat = activeAntar.pratyantardashas.find((p) => {
    const s = new Date(p.startDate).getTime();
    const e = new Date(p.endDate).getTime();
    return targetTime >= s && targetTime <= e;
  });

  if (!activePrat) {
    activePrat = activeAntar.pratyantardashas[0];
  }

  const isCurrent = Math.abs(targetTime - now) < 24 * 60 * 60 * 1000;
  const isPast = targetTime < now && !isCurrent;
  const isFuture = targetTime > now && !isCurrent;

  return {
    planetMD: activeMaha.planet,
    hindiMD: activeMaha.hindiPlanet,
    planetAD: activeAntar.planet,
    hindiAD: activeAntar.hindiPlanet,
    planetPD: activePrat.planet,
    hindiPD: activePrat.hindiPlanet,
    periodDescription: `${activeMaha.planet} महादशा में ${activeAntar.planet} अंतर्दशा (${activeMaha.startDate.slice(0, 4)} - ${activeMaha.endDate.slice(0, 4)})`,
    mdStart: activeMaha.startDate.slice(0, 10),
    mdEnd: activeMaha.endDate.slice(0, 10),
    adStart: activeAntar.startDate.slice(0, 10),
    adEnd: activeAntar.endDate.slice(0, 10),
    targetDate: targetDate.toISOString().slice(0, 10),
    isPast,
    isFuture,
    isCurrent,
  };
}

/**
 * Parses user query to detect if they are asking about a specific year (e.g. 2014, 2028, next year)
 */
export function extractQueriedTargetDate(query: string): { targetDate: Date; yearMentioned: number | null } {
  const currentYear = new Date().getFullYear();

  // 1. Look for explicit 4-digit year (1920 - 2099)
  const yearMatch = query.match(/\b(19\d\d|20\d\d)\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    // Set to mid-year of that year (July 1st)
    return {
      targetDate: new Date(Date.UTC(year, 6, 1)),
      yearMentioned: year,
    };
  }

  // 2. Relative keywords
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

  // Default to today
  return {
    targetDate: new Date(),
    yearMentioned: null,
  };
}
