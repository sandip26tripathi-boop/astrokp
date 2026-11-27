/**
 * lib/astrology/rulingPlanetsEngine.ts
 * Real-Time Krishnamurti Paddhati (KP) Ruling Planets Engine
 *
 * Implements the 5 classical KP Ruling Planets (RP) with:
 * 1. Vedic Sunrise-to-Sunrise Day Lord (Vaar Swami) Rule
 * 2. Instantaneous query timestamp (Date.now()) with KP New Ayanamsa
 * 3. Classical KP Purification Rule (Discards planets in Star/Sub of Retrograde planets)
 * 4. Rahu & Ketu Node Representation Rule (Nodes represent sign lord & conjunctions)
 * 5. Event Timing synthesis cross-matching Purified RPs with DBA (MD-AD-PD) and Fruitful Significators
 */

import * as Astronomy from 'astronomy-engine';
import { getKPAyanamsha } from '../astronomyEngine';
import { getKPDivision, PLANET_META, VIMSHOTTARI_LORDS } from '../kp-calculator';
import { RulingPlanets } from '@/types/astrology';

export interface PurifiedRPDetails {
  planet: string;
  source: 'DayLord' | 'MoonSignLord' | 'MoonStarLord' | 'LagnaSignLord' | 'LagnaStarLord' | 'LagnaSubLord' | 'MoonSubLord' | 'NodeProxy';
  transitSign: string;
  transitDegree: number;
  starLord: string;
  subLord: string;
  isSelfRetrograde: boolean;
  isStarLordRetrograde: boolean;
  isSubLordRetrograde: boolean;
  isPurified: boolean;
  rejectionReason?: string;
  representsNodeFor?: string;
}

export interface LiveRulingPlanetsResult extends RulingPlanets {
  timestampIST: string;
  sunriseTodayIST: string;
  vedicWeekday: string;
  purifiedRulingPlanets: string[];
  retrogradePlanets: string[];
  rpAuditDetails: PurifiedRPDetails[];
  rahuKetuAgents: Array<{ node: 'Rahu' | 'Ketu'; represents: string; signOccupied: string }>;
  fruitfulSignificators?: string[];
  commonTimingPlanets?: string[];
  eventTimingWindow?: string;
  eventTimingWindowHi?: string;
}

function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

const VEDIC_DAY_LORDS = [
  'Sun',      // 0 = Sunday
  'Moon',     // 1 = Monday
  'Mars',     // 2 = Tuesday
  'Mercury',  // 3 = Wednesday
  'Jupiter',  // 4 = Thursday
  'Venus',    // 5 = Friday
  'Saturn',   // 6 = Saturday
];

const VEDIC_DAY_NAMES_HI: Record<string, string> = {
  Sun: 'रविवार (सूर्य)',
  Moon: 'सोमवार (चन्द्र)',
  Mars: 'मंगलवार (मंगल)',
  Mercury: 'बुधवार (बुध)',
  Jupiter: 'गुरुवार (बृहस्पति)',
  Venus: 'शुक्रवार (शुक्र)',
  Saturn: 'शनिवार (शनि)',
};

/**
 * Calculates Vedic Day Lord (Vaar Swami) strictly from Sunrise to Sunrise.
 * If queryTime is before the local sunrise on that calendar date,
 * the Vedic day is the previous calendar day's day.
 */
export function calculateVedicDayLord(
  queryTime: Date,
  lat: number = 28.6139,
  lon: number = 77.209
): { dayLord: string; vedicWeekdayHi: string; sunriseIST: string } {
  const obs = new Astronomy.Observer(lat, lon, 0);

  // Midnight UTC of query day
  const queryYear = queryTime.getUTCFullYear();
  const queryMonth = queryTime.getUTCMonth();
  const queryDate = queryTime.getUTCDate();
  const startOfDay = new Date(Date.UTC(queryYear, queryMonth, queryDate, 0, 0, 0));

  let sunriseDate = new Date(Date.UTC(queryYear, queryMonth, queryDate, 1, 0, 0)); // approx 6:30 IST
  try {
    const rise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, obs, +1, startOfDay, 1);
    if (rise && rise.date) {
      sunriseDate = rise.date;
    }
  } catch (e) {
    // Fallback sunrise ~06:00 local time
  }

  // Check if query is before sunrise
  let dayOfWeekIndex = queryTime.getDay();
  if (queryTime.getTime() < sunriseDate.getTime()) {
    // Before sunrise -> belongs to previous day
    dayOfWeekIndex = (dayOfWeekIndex + 6) % 7;
  }

  const dayLord = VEDIC_DAY_LORDS[dayOfWeekIndex];
  const vedicWeekdayHi = VEDIC_DAY_NAMES_HI[dayLord] || dayLord;

  const sunriseIST = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(sunriseDate);

  return { dayLord, vedicWeekdayHi, sunriseIST };
}

/**
 * Computes instantaneous transit positions and retrogrades of all planets
 */
function getTransitPlanetsAtTime(time: Astronomy.AstroTime, ayan: number) {
  const bodies = [
    { name: 'Sun', body: Astronomy.Body.Sun },
    { name: 'Moon', body: Astronomy.Body.Moon },
    { name: 'Mars', body: Astronomy.Body.Mars },
    { name: 'Mercury', body: Astronomy.Body.Mercury },
    { name: 'Jupiter', body: Astronomy.Body.Jupiter },
    { name: 'Venus', body: Astronomy.Body.Venus },
    { name: 'Saturn', body: Astronomy.Body.Saturn },
  ];

  const timePlus1h = time.AddDays(1 / 24);
  const result: Record<string, { lon: number; isRetrograde: boolean; starLord: string; subLord: string; signLord: string; signName: string; degreeInSign: number }> = {};

  for (const item of bodies) {
    const gv1 = Astronomy.GeoVector(item.body, time, true);
    const ecl1 = Astronomy.Ecliptic(gv1);
    const sid1 = norm360(ecl1.elon - ayan);

    const gv2 = Astronomy.GeoVector(item.body, timePlus1h, true);
    const ecl2 = Astronomy.Ecliptic(gv2);
    let diff = ecl2.elon - ecl1.elon;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    const isRetro = diff < 0;

    const div = getKPDivision(sid1);
    result[item.name] = {
      lon: sid1,
      isRetrograde: isRetro,
      starLord: div.starLord,
      subLord: div.subLord,
      signLord: div.signLord,
      signName: div.signName,
      degreeInSign: div.degreeInSign,
    };
  }

  // Rahu & Ketu (Mean Nodes)
  const t = time.ut / 36525.0;
  const meanRahuTropical = 125.04452 - 1934.136261 * t + 0.0020708 * t * t;
  const rahuSidereal = norm360(meanRahuTropical - ayan);
  const ketuSidereal = norm360(rahuSidereal + 180);

  const rahuDiv = getKPDivision(rahuSidereal);
  const ketuDiv = getKPDivision(ketuSidereal);

  result['Rahu'] = {
    lon: rahuSidereal,
    isRetrograde: false, // Nodes always move retrograde in mean motion, treated normally in KP
    starLord: rahuDiv.starLord,
    subLord: rahuDiv.subLord,
    signLord: rahuDiv.signLord,
    signName: rahuDiv.signName,
    degreeInSign: rahuDiv.degreeInSign,
  };

  result['Ketu'] = {
    lon: ketuSidereal,
    isRetrograde: false,
    starLord: ketuDiv.starLord,
    subLord: ketuDiv.subLord,
    signLord: ketuDiv.signLord,
    signName: ketuDiv.signName,
    degreeInSign: ketuDiv.degreeInSign,
  };

  return result;
}

/**
 * Master Live Ruling Planets Calculator with KP Purification and DBA Timing
 */
export function computeLiveRulingPlanets(
  lat: number = 28.6139,
  lon: number = 77.209,
  queryTime: Date = new Date(),
  options: {
    fruitfulHouses?: number[];
    fourFoldSignificators?: any;
    dashaHierarchy?: any;
    full120YearDashaTimeline?: any[];
    language?: 'en' | 'hi';
  } = {}
): LiveRulingPlanetsResult {
  const time = new Astronomy.AstroTime(queryTime);
  const ayan = getKPAyanamsha(queryTime);

  // 1. Vedic Day Lord (Sunrise to Sunrise)
  const { dayLord, vedicWeekdayHi, sunriseIST } = calculateVedicDayLord(queryTime, lat, lon);

  // 2. Transits at Current Moment
  const transits = getTransitPlanetsAtTime(time, ayan);

  // List of all currently retrograde planets
  const retrogradePlanets = Object.entries(transits)
    .filter(([_, data]) => data.isRetrograde)
    .map(([p]) => p);

  // 3. Moon Position at Query Time
  const moonTransit = transits['Moon'];
  const moonDiv = getKPDivision(moonTransit.lon);
  const moonSignLord = moonDiv.signLord;
  const moonStarLord = moonDiv.starLord;
  const moonSubLord = moonDiv.subLord;

  // 4. Ascendant (Lagna) at Query Time and Location
  const gmstHours = Astronomy.SiderealTime(time);
  const gmstDeg = norm360(gmstHours * 15.0);
  const lst = norm360(gmstDeg + lon);

  const T = time.ut / 36525.0;
  const eps = 23.43929111 - (46.815 * T) / 3600.0 - (0.00059 * T * T) / 3600.0;

  const ramcRad = (lst * Math.PI) / 180.0;
  const epsRad = (eps * Math.PI) / 180.0;
  const latRad = (lat * Math.PI) / 180.0;

  const yAsc = Math.cos(ramcRad);
  const xAsc = -(
    Math.sin(ramcRad) * Math.cos(epsRad) +
    Math.tan(latRad) * Math.sin(epsRad)
  );
  let ascRad = Math.atan2(yAsc, xAsc);
  if (ascRad < 0) ascRad += 2 * Math.PI;
  const ascTropical = (ascRad * 180.0) / Math.PI;
  const ascNirayana = norm360(ascTropical - ayan);

  const lagnaDiv = getKPDivision(ascNirayana);
  const lagnaSignLord = lagnaDiv.signLord;
  const lagnaStarLord = lagnaDiv.starLord;
  const lagnaSubLord = lagnaDiv.subLord;

  // 5. Build Initial Classical RP List
  const rawRPs: Array<{ planet: string; source: PurifiedRPDetails['source'] }> = [
    { planet: dayLord, source: 'DayLord' },
    { planet: moonSignLord, source: 'MoonSignLord' },
    { planet: moonStarLord, source: 'MoonStarLord' },
    { planet: lagnaSignLord, source: 'LagnaSignLord' },
    { planet: lagnaStarLord, source: 'LagnaStarLord' },
    { planet: lagnaSubLord, source: 'LagnaSubLord' },
    { planet: moonSubLord, source: 'MoonSubLord' },
  ];

  // 6. Classical KP Purification Audit:
  // A Ruling Planet is rejected / deemed unfruitful if it is posited in the Star or Sub of a Retrograde planet.
  const rpAuditDetails: PurifiedRPDetails[] = [];
  const purifiedPlanetsSet = new Set<string>();

  for (const rp of rawRPs) {
    const tData = transits[rp.planet];
    if (!tData) continue;

    const isSelfRetro = Boolean(tData.isRetrograde);
    const starLordIsRetro = retrogradePlanets.includes(tData.starLord);
    const subLordIsRetro = retrogradePlanets.includes(tData.subLord);

    let isPurified = true;
    let rejectionReason: string | undefined = undefined;

    if (starLordIsRetro) {
      isPurified = false;
      rejectionReason = `Situated in the star of Retrograde ${tData.starLord}`;
    } else if (subLordIsRetro) {
      isPurified = false;
      rejectionReason = `Situated in the sub of Retrograde ${tData.subLord}`;
    }

    rpAuditDetails.push({
      planet: rp.planet,
      source: rp.source,
      transitSign: tData.signName,
      transitDegree: tData.degreeInSign,
      starLord: tData.starLord,
      subLord: tData.subLord,
      isSelfRetrograde: isSelfRetro,
      isStarLordRetrograde: starLordIsRetro,
      isSubLordRetrograde: subLordIsRetro,
      isPurified,
      rejectionReason,
    });

    if (isPurified) {
      purifiedPlanetsSet.add(rp.planet);
    }
  }

  // 7. Rahu & Ketu Node Representation Rule:
  // In KP, Nodes are stronger than planets. If Rahu/Ketu occupy the sign of a valid RP,
  // or conjoin a valid RP, they act as strong proxy Ruling Planets.
  const rahuKetuAgents: Array<{ node: 'Rahu' | 'Ketu'; represents: string; signOccupied: string }> = [];

  for (const node of ['Rahu', 'Ketu'] as const) {
    const nodeData = transits[node];
    if (!nodeData) continue;

    const signLord = nodeData.signLord;
    if (purifiedPlanetsSet.has(signLord)) {
      rahuKetuAgents.push({
        node,
        represents: signLord,
        signOccupied: nodeData.signName,
      });
      purifiedPlanetsSet.add(node);
      rpAuditDetails.push({
        planet: node,
        source: 'NodeProxy',
        transitSign: nodeData.signName,
        transitDegree: nodeData.degreeInSign,
        starLord: nodeData.starLord,
        subLord: nodeData.subLord,
        isSelfRetrograde: false,
        isStarLordRetrograde: retrogradePlanets.includes(nodeData.starLord),
        isSubLordRetrograde: retrogradePlanets.includes(nodeData.subLord),
        isPurified: true,
        representsNodeFor: signLord,
      });
    }

    // Conjunction check (within same sign)
    for (const [pName, pData] of Object.entries(transits)) {
      if (pName !== 'Rahu' && pName !== 'Ketu' && pData.signName === nodeData.signName) {
        if (purifiedPlanetsSet.has(pName)) {
          rahuKetuAgents.push({
            node,
            represents: pName,
            signOccupied: nodeData.signName,
          });
          purifiedPlanetsSet.add(node);
        }
      }
    }
  }

  const purifiedRulingPlanets = Array.from(purifiedPlanetsSet);

  // 8. Event Timing Synthesis via RP + DBA + Fruitful Significators:
  let fruitfulSignificators: string[] = [];
  let commonTimingPlanets: string[] = [];
  let eventTimingWindow = '';
  let eventTimingWindowHi = '';

  const fruitfulHouses = options.fruitfulHouses || [10, 6, 2, 11]; // default career houses
  const fourFold = options.fourFoldSignificators;

  if (fourFold) {
    const fruitfulSet = new Set<string>();
    const checkLevel = (level: any[]) => {
      if (!Array.isArray(level)) return;
      level.forEach((item) => {
        if (fruitfulHouses.includes(item.house)) {
          (item.planets || []).forEach((p: string) => fruitfulSet.add(p));
        }
      });
    };
    checkLevel(fourFold.L1);
    checkLevel(fourFold.L2);
    checkLevel(fourFold.L3);
    checkLevel(fourFold.L4);
    fruitfulSignificators = Array.from(fruitfulSet);

    // Cross-match with Purified RPs
    commonTimingPlanets = fruitfulSignificators.filter((p) => purifiedRulingPlanets.includes(p));
    if (commonTimingPlanets.length === 0) {
      commonTimingPlanets = purifiedRulingPlanets;
    }

    // Check with active running Dasha
    const dasha = options.dashaHierarchy;
    if (dasha && dasha.mahadasha && dasha.antardasha) {
      const activeMD = dasha.mahadasha.planet;
      const activeAD = dasha.antardasha.planet;
      const activePD = dasha.pratyantardasha?.planet || '';

      const adEndDate = new Date(dasha.antardasha.endDate || Date.now() + 180 * 86400000);
      const adEndYear = adEndDate.getFullYear();
      const adEndMonth = adEndDate.toLocaleString('en-US', { month: 'short' });

      if (commonTimingPlanets.includes(activeAD) || commonTimingPlanets.includes(activePD)) {
        eventTimingWindow = `Current running ${activeMD}-${activeAD} period (fructifying by ${adEndMonth} ${adEndYear})`;
        eventTimingWindowHi = `वर्तमान में गतिशील ${activeMD}-${activeAD} अवधि (${adEndMonth} ${adEndYear} तक फलित)`;
      } else {
        const nextTargetPlanet = commonTimingPlanets[0] || activeMD;
        eventTimingWindow = `Upcoming ${activeMD}-${nextTargetPlanet} period / transit trigger in ${adEndYear}`;
        eventTimingWindowHi = `आगामी ${activeMD}-${nextTargetPlanet} अंतर्दशा एवं गोचर सक्रियता (${adEndYear})`;
      }
    }
  }

  const timestampIST = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(queryTime);

  return {
    timestamp: queryTime.toISOString(),
    timestampIST,
    sunriseTodayIST: sunriseIST,
    vedicWeekday: vedicWeekdayHi,
    dayLord,
    moonSignLord,
    moonStarLord,
    moonSubLord,
    lagnaSignLord,
    lagnaStarLord,
    lagnaSubLord,
    isRealtime: true,
    purifiedRulingPlanets,
    retrogradePlanets,
    rpAuditDetails,
    rahuKetuAgents,
    fruitfulSignificators,
    commonTimingPlanets,
    eventTimingWindow,
    eventTimingWindowHi,
  };
}
