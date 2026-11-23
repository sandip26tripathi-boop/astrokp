import * as Astronomy from 'astronomy-engine';
import {
  AyanamsaType,
  ChartInput,
  CuspData,
  KPMatrix,
  PlanetPosition,
  RulingPlanets,
} from '@/types/astrology';
import {
  calculateSignificators,
  calculateRulingPlanets,
  calculateVimshottariDasha,
  generateHorary249Table,
  PLANET_META,
} from './kp-calculator';
import { calculateParsFortuna, evaluateEventChecklist } from './kp-evaluator';

/**
 * 1. Precise Lahiri Ayanamsha (Chitrapaksha)
 * Epoch J2000.0 (2000-01-01 12:00 UTC) = 23° 51' 25.53" = 85885.53"
 * Annual precession: 50.290966" / year = 5029.0966" / century
 */
export function getLahiriAyanamsha(date: Date): number {
  const t = Astronomy.MakeTime(date).ut / 36525.0; // Centuries from J2000.0 (t=0 at J2000)
  const ayanSec = 85885.53 + 5029.0966 * t + 1.1116 * t * t;
  return ayanSec / 3600.0;
}

/**
 * 2. KP New Ayanamsha (Prof. K.S. Krishnamurti New Standard)
 * Epoch J2000.0 = 23° 45' 22.93" = 23.75637017°
 * Annual precession: 50.2388475" / year = 5023.88475" / century
 */
export function getKPAyanamsha(date: Date): number {
  const t = Astronomy.MakeTime(date).ut / 36525.0; // Centuries from J2000.0
  return 23.75637017 + (5023.88475 * t) / 3600.0 + (1.1116 * t * t) / 3600.0;
}

/**
 * 3. KP Old Ayanamsha
 * Epoch J2000.0 = 23° 46' 07" = 23.76861111°
 */
export function getKPOldAyanamsha(date: Date): number {
  const t = Astronomy.MakeTime(date).ut / 36525.0;
  return 23.76861111 + (5023.88475 * t) / 3600.0;
}

export function normalizeDeg(deg: number): number {
  deg = deg % 360;
  return deg < 0 ? deg + 360 : deg;
}

export const RASHIS = [
  'Mesh',
  'Vrishabh',
  'Mithun',
  'Kark',
  'Simha',
  'Kanya',
  'Tula',
  'Vrishchik',
  'Dhanu',
  'Makar',
  'Kumbh',
  'Meen',
];

export const RASHIS_EN = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
];

export const RASHI_LORDS = [
  'Mars',
  'Venus',
  'Mercury',
  'Moon',
  'Sun',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Saturn',
  'Jupiter',
];

export const NAKSHATRAS = [
  'Ashwini',
  'Bharani',
  'Krittika',
  'Rohini',
  'Mrigashira',
  'Ardra',
  'Punarvasu',
  'Pushya',
  'Ashlesha',
  'Magha',
  'Purva Phalguni',
  'Uttara Phalguni',
  'Hasta',
  'Chitra',
  'Swati',
  'Vishakha',
  'Anuradha',
  'Jyeshtha',
  'Mula',
  'Purva Ashadha',
  'Uttara Ashadha',
  'Shravana',
  'Dhanishta',
  'Shatabhisha',
  'Purva Bhadrapada',
  'Uttara Bhadrapada',
  'Revati',
];

export const VIMSHOTTARI_LORDS = [
  'Ketu',
  'Venus',
  'Sun',
  'Moon',
  'Mars',
  'Rahu',
  'Jupiter',
  'Saturn',
  'Mercury',
];

const VIMSHOTTARI_YEARS = [7, 20, 6, 10, 7, 18, 16, 19, 17]; // Ketu to Mercury (Total: 120 years)

export function getSignLord(degree: number): string {
  const norm = normalizeDeg(degree);
  const rashiIdx = Math.floor(norm / 30);
  return RASHI_LORDS[rashiIdx];
}

export function getNakshatraInfo(degree: number): { name: string; lord: string; pada: number } {
  const norm = normalizeDeg(degree);
  const nakTotal = 360 / 27; // 13° 20' = 13.333333°
  const nakIndex = Math.floor(norm / nakTotal);
  const nakDeg = norm % nakTotal;
  const pada = Math.floor(nakDeg / (nakTotal / 4)) + 1;
  return {
    name: NAKSHATRAS[nakIndex],
    lord: VIMSHOTTARI_LORDS[nakIndex % 9],
    pada: Math.min(Math.max(pada, 1), 4)
  };
}

// Helper: Convert decimal degree to DMS formatted string
export function formatDMS(deg: number): string {
  const norm = normalizeDeg(deg);
  const d = Math.floor(norm);
  const minFloat = (norm - d) * 60;
  const m = Math.floor(minFloat);
  const s = Math.round((minFloat - m) * 60);
  return `${d}° ${m.toString().padStart(2, '0')}' ${s.toString().padStart(2, '0')}"`;
}

// KP Sub Lord Calculation helper
export function getSubLord(degree: number): string {
  const normDeg = normalizeDeg(degree);
  const nakTotal = 360 / 27; // 13° 20' = 13.333333°
  const nakIndex = Math.floor(normDeg / nakTotal);
  const nakDeg = normDeg % nakTotal;

  const totalYears = 120;
  const nakMinutes = 800; // 13 deg 20 min = 800 mins
  const posMinutes = nakDeg * 60;
  const nakLordIndex = nakIndex % 9;

  let accumulated = 0;
  for (let i = 0; i < 9; i++) {
    const currentLordIdx = (nakLordIndex + i) % 9;
    const span = (VIMSHOTTARI_YEARS[currentLordIdx] / totalYears) * nakMinutes;
    accumulated += span;
    if (posMinutes <= accumulated + 1e-7) {
      return VIMSHOTTARI_LORDS[currentLordIdx];
    }
  }
  return VIMSHOTTARI_LORDS[nakLordIndex];
}

// KP Sub-Sub Lord Calculation helper
export function getSubSubLord(degree: number): string {
  const normDeg = normalizeDeg(degree);
  const nakTotal = 360 / 27;
  const nakIndex = Math.floor(normDeg / nakTotal);
  const nakDeg = normDeg % nakTotal;

  const totalYears = 120;
  const nakMinutes = 800;
  const posMinutes = nakDeg * 60;
  const nakLordIndex = nakIndex % 9;

  let subLordIdx = nakLordIndex;
  let accumulated = 0;
  let prevAccumulated = 0;

  for (let i = 0; i < 9; i++) {
    const currentLordIdx = (nakLordIndex + i) % 9;
    const span = (VIMSHOTTARI_YEARS[currentLordIdx] / totalYears) * nakMinutes;
    accumulated += span;
    if (posMinutes <= accumulated + 1e-7) {
      subLordIdx = currentLordIdx;
      break;
    }
    prevAccumulated = accumulated;
  }

  // Inside the Sub-Lord, find Sub-Sub-Lord
  const subMinutesElapsed = posMinutes - prevAccumulated;
  const subSpanMinutes = (VIMSHOTTARI_YEARS[subLordIdx] / totalYears) * nakMinutes;

  let sslAccumulated = 0;
  for (let j = 0; j < 9; j++) {
    const currentSSLIdx = (subLordIdx + j) % 9;
    const sslSpan = (VIMSHOTTARI_YEARS[currentSSLIdx] / totalYears) * subSpanMinutes;
    sslAccumulated += sslSpan;
    if (subMinutesElapsed <= sslAccumulated + 1e-7) {
      return VIMSHOTTARI_LORDS[currentSSLIdx];
    }
  }

  return VIMSHOTTARI_LORDS[subLordIdx];
}

// Placidus House Cusps computation with Exact Semi-Arc Convergence
export function calculatePlacidusCusps(
  lstDeg: number,
  latDeg: number,
  epsDeg: number,
  ayanamsa: number
): number[] {
  const ramc = lstDeg * (Math.PI / 180);
  const lat = latDeg * (Math.PI / 180);
  const eps = epsDeg * (Math.PI / 180);

  // Midheaven (MC - 10th House)
  let mcRad = Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps));
  if (mcRad < 0) mcRad += 2 * Math.PI;
  const mc = (mcRad * (180 / Math.PI)) % 360;

  // Ascendant (ASC - 1st House)
  const yAsc = Math.cos(ramc);
  const xAsc = -(Math.sin(ramc) * Math.cos(eps) + Math.tan(lat) * Math.sin(eps));
  let ascRad = Math.atan2(yAsc, xAsc);
  if (ascRad < 0) ascRad += 2 * Math.PI;
  const asc = (ascRad * (180 / Math.PI)) % 360;

  function calcIntermediate(offsetDeg: number, factor: number): number {
    const targetRA = normalizeDeg(lstDeg + offsetDeg) * (Math.PI / 180);
    let l = targetRA;
    for (let i = 0; i < 30; i++) {
      const sinDecl = Math.sin(eps) * Math.sin(l);
      const decl = Math.asin(Math.max(-0.9999, Math.min(0.9999, sinDecl)));
      const tanDecl = Math.tan(decl);
      const ad = Math.asin(Math.max(-0.9999, Math.min(0.9999, Math.tan(lat) * tanDecl)));
      const ra = targetRA + factor * ad;
      const tanL = Math.tan(ra) / Math.cos(eps);
      let nextL = Math.atan(tanL);
      if (Math.cos(ra) < 0) nextL += Math.PI;
      if (nextL < 0) nextL += 2 * Math.PI;
      if (Math.abs(nextL - l) < 1e-7) {
        l = nextL;
        break;
      }
      l = nextL;
    }
    return (l * (180 / Math.PI)) % 360;
  }

  const h11 = calcIntermediate(30, 1 / 3);
  const h12 = calcIntermediate(60, 2 / 3);
  const h2 = calcIntermediate(120, 2 / 3);
  const h3 = calcIntermediate(150, 1 / 3);

  const cuspsTropical = [
    asc,
    h2,
    h3,
    normalizeDeg(mc + 180), // 4th
    normalizeDeg(h11 + 180), // 5th
    normalizeDeg(h12 + 180), // 6th
    normalizeDeg(asc + 180), // 7th
    normalizeDeg(h2 + 180), // 8th
    normalizeDeg(h3 + 180), // 9th
    mc, // 10th
    h11, // 11th
    h12, // 12th
  ];

  return cuspsTropical.map((c) => normalizeDeg(c - ayanamsa));
}

// Determine which house a planet occupies based on Placidus Cusps (Bhava Chalit)
export function getOccupiedHouse(planetLon: number, cusps: number[]): number {
  const normPlanet = normalizeDeg(planetLon);
  for (let i = 0; i < 12; i++) {
    const cuspStart = cusps[i];
    const cuspEnd = cusps[(i + 1) % 12];

    if (cuspEnd > cuspStart) {
      if (normPlanet >= cuspStart && normPlanet < cuspEnd) {
        return i + 1;
      }
    } else {
      if (normPlanet >= cuspStart || normPlanet < cuspEnd) {
        return i + 1;
      }
    }
  }
  return 1;
}

// 4. Master Chart Calculator Function
export function calculateAccurateKundli(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number = 0,
  lat: number = 28.6139,
  lon: number = 77.209,
  tz: number = 5.5,
  mode: AyanamsaType = 'KP_NEW'
) {
  // Local Time to UTC Date
  const localTimeDec = hour + minute / 60.0 + second / 3600.0;
  const utcTimeDec = localTimeDec - tz;
  const utcMs = Date.UTC(year, month - 1, day, 0, 0, 0, 0) + utcTimeDec * 3600000;
  const utcDate = isNaN(utcMs) ? new Date() : new Date(utcMs);

  const astroTime = Astronomy.MakeTime(utcDate);
  const T = astroTime.ut / 36525.0; // Centuries from J2000.0

  let ayanamsha: number;
  if (mode === 'LAHIRI') {
    ayanamsha = getLahiriAyanamsha(utcDate);
  } else if (mode === 'KP_OLD') {
    ayanamsha = getKPOldAyanamsha(utcDate);
  } else {
    ayanamsha = getKPAyanamsha(utcDate);
  }

  // Geocentric Planetary Positions via astronomy-engine
  const planetConfigs = [
    { id: 'sun', name: 'Surya', stdName: 'Sun', body: Astronomy.Body.Sun },
    { id: 'moon', name: 'Chandra', stdName: 'Moon', body: Astronomy.Body.Moon },
    { id: 'mars', name: 'Mangal', stdName: 'Mars', body: Astronomy.Body.Mars },
    { id: 'mercury', name: 'Budh', stdName: 'Mercury', body: Astronomy.Body.Mercury },
    { id: 'jupiter', name: 'Guru', stdName: 'Jupiter', body: Astronomy.Body.Jupiter },
    { id: 'venus', name: 'Shukra', stdName: 'Venus', body: Astronomy.Body.Venus },
    { id: 'saturn', name: 'Shani', stdName: 'Saturn', body: Astronomy.Body.Saturn },
  ];

  const astroTimePlus1h = astroTime.AddDays(1 / 24);

  let calculatedPlanets: Record<string, any> = {};

  planetConfigs.forEach((p) => {
    // Geocentric coordinates with aberration (Standard Astrological Geocentric Vector)
    const gv1 = Astronomy.GeoVector(p.body, astroTime, true);
    const ecl = Astronomy.Ecliptic(gv1);

    // Retrograde motion check (+1 hour)
    const gv2 = Astronomy.GeoVector(p.body, astroTimePlus1h, true);
    const ecl2 = Astronomy.Ecliptic(gv2);
    let diff = ecl2.elon - ecl.elon;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    const isRetrograde = diff < 0;

    // Sidereal degree conversion (Tropical - Ayanamsa)
    const siderealDeg = normalizeDeg(ecl.elon - ayanamsha);
    const rashiIdx = Math.floor(siderealDeg / 30);
    const nakIdx = Math.floor(siderealDeg / (360 / 27));
    const nakLord = VIMSHOTTARI_LORDS[nakIdx % 9];
    const subLord = getSubLord(siderealDeg);
    const subSubLord = getSubSubLord(siderealDeg);

    calculatedPlanets[p.name] = {
      id: p.id,
      name: p.stdName,
      hindiName: p.name,
      totalDegree: siderealDeg,
      formattedDMS: formatDMS(siderealDeg),
      rashiNo: rashiIdx + 1,
      rashiName: RASHIS_EN[rashiIdx],
      hindiRashiName: RASHIS[rashiIdx],
      degreeInRashi: siderealDeg % 30,
      formattedSignDMS: formatDMS(siderealDeg % 30),
      signLord: RASHI_LORDS[rashiIdx],
      isRetrograde,
      nakshatraId: nakIdx + 1,
      nakshatra: NAKSHATRAS[nakIdx],
      nakLord,
      subLord,
      subSubLord,
    };
  });

  // Accurate Rahu / Ketu (Mean Ascending Lunar Node)
  const meanRahuTropical = 125.04452 - 1934.136261 * T + 0.0020708 * T * T;
  const rahuSidereal = normalizeDeg(meanRahuTropical - ayanamsha);
  const ketuSidereal = normalizeDeg(rahuSidereal + 180.0);

  const rahuRashi = Math.floor(rahuSidereal / 30);
  const rahuNak = Math.floor(rahuSidereal / (360 / 27));
  calculatedPlanets['Rahu'] = {
    id: 'rahu',
    name: 'Rahu',
    hindiName: 'राहु',
    totalDegree: rahuSidereal,
    formattedDMS: formatDMS(rahuSidereal),
    rashiNo: rahuRashi + 1,
    rashiName: RASHIS_EN[rahuRashi],
    hindiRashiName: RASHIS[rahuRashi],
    degreeInRashi: rahuSidereal % 30,
    formattedSignDMS: formatDMS(rahuSidereal % 30),
    signLord: RASHI_LORDS[rahuRashi],
    isRetrograde: false, // Rahu is naturally retro, never display (R)
    nakshatraId: rahuNak + 1,
    nakshatra: NAKSHATRAS[rahuNak],
    nakLord: VIMSHOTTARI_LORDS[rahuNak % 9],
    subLord: getSubLord(rahuSidereal),
    subSubLord: getSubSubLord(rahuSidereal),
  };

  const ketuRashi = Math.floor(ketuSidereal / 30);
  const ketuNak = Math.floor(ketuSidereal / (360 / 27));
  calculatedPlanets['Ketu'] = {
    id: 'ketu',
    name: 'Ketu',
    hindiName: 'केतु',
    totalDegree: ketuSidereal,
    formattedDMS: formatDMS(ketuSidereal),
    rashiNo: ketuRashi + 1,
    rashiName: RASHIS_EN[ketuRashi],
    hindiRashiName: RASHIS[ketuRashi],
    degreeInRashi: ketuSidereal % 30,
    formattedSignDMS: formatDMS(ketuSidereal % 30),
    signLord: RASHI_LORDS[ketuRashi],
    isRetrograde: false, // Ketu is naturally retro, never display (R)
    nakshatraId: ketuNak + 1,
    nakshatra: NAKSHATRAS[ketuNak],
    nakLord: VIMSHOTTARI_LORDS[ketuNak % 9],
    subLord: getSubLord(ketuSidereal),
    subSubLord: getSubSubLord(ketuSidereal),
  };

  // Outer Planets (Uranus, Neptune, Pluto)
  const outerPlanets = [
    { id: 'uranus', stdName: 'Uranus', hindiName: 'अरुण', body: Astronomy.Body.Uranus },
    { id: 'neptune', stdName: 'Neptune', hindiName: 'वरुण', body: Astronomy.Body.Neptune },
    { id: 'pluto', stdName: 'Pluto', hindiName: 'यम', body: Astronomy.Body.Pluto },
  ];
  outerPlanets.forEach((p) => {
    const gv = Astronomy.GeoVector(p.body, astroTime, true);
    const ecl = Astronomy.Ecliptic(gv);
    const siderealDeg = normalizeDeg(ecl.elon - ayanamsha);
    const rashiIdx = Math.floor(siderealDeg / 30);
    const nakIdx = Math.floor(siderealDeg / (360 / 27));

    calculatedPlanets[p.stdName] = {
      id: p.id,
      name: p.stdName,
      hindiName: p.hindiName,
      totalDegree: siderealDeg,
      formattedDMS: formatDMS(siderealDeg),
      rashiNo: rashiIdx + 1,
      rashiName: RASHIS_EN[rashiIdx],
      hindiRashiName: RASHIS[rashiIdx],
      degreeInRashi: siderealDeg % 30,
      formattedSignDMS: formatDMS(siderealDeg % 30),
      signLord: RASHI_LORDS[rashiIdx],
      isRetrograde: false,
      nakshatraId: nakIdx + 1,
      nakshatra: NAKSHATRAS[nakIdx],
      nakLord: VIMSHOTTARI_LORDS[nakIdx % 9],
      subLord: getSubLord(siderealDeg),
      subSubLord: getSubSubLord(siderealDeg),
    };
  });

  // Lagna (Ascendant) & Placidus House Cusps
  const siderealTimeHours = Astronomy.SiderealTime(astroTime);
  const ramc = normalizeDeg(siderealTimeHours * 15 + lon);
  const epsDeg = 23.4392911 - (46.815 * T) / 3600.0;
  const epsRad = epsDeg * (Math.PI / 180);
  const ramcRad = ramc * (Math.PI / 180);
  const latRad = lat * (Math.PI / 180);

  const yAsc = Math.cos(ramcRad);
  const xAsc = -(Math.sin(ramcRad) * Math.cos(epsRad) + Math.tan(latRad) * Math.sin(epsRad));
  let ascRad = Math.atan2(yAsc, xAsc);
  if (ascRad < 0) ascRad += 2 * Math.PI;
  const ascTropical = (ascRad * 180) / Math.PI;
  const ascSidereal = normalizeDeg(ascTropical - ayanamsha);

  const lagnaRashi = Math.floor(ascSidereal / 30);
  const lagnaNak = Math.floor(ascSidereal / (360 / 27));

  const lagnaInfo = {
    totalDegree: ascSidereal,
    formattedDMS: formatDMS(ascSidereal),
    rashiNo: lagnaRashi + 1,
    rashiName: RASHIS_EN[lagnaRashi],
    hindiRashiName: RASHIS[lagnaRashi],
    degreeInRashi: ascSidereal % 30,
    formattedSignDMS: formatDMS(ascSidereal % 30),
    signLord: RASHI_LORDS[lagnaRashi],
    nakshatra: NAKSHATRAS[lagnaNak],
    nakLord: VIMSHOTTARI_LORDS[lagnaNak % 9],
    subLord: getSubLord(ascSidereal),
    subSubLord: getSubSubLord(ascSidereal),
  };

  // 12 Placidus Cusps (Sidereal)
  const cuspsSidereal = calculatePlacidusCusps(ramc, lat, epsDeg, ayanamsha);

  // Assign House Occupied to Planets
  const planetList: PlanetPosition[] = Object.values(calculatedPlanets).map((p: any) => {
    const meta = PLANET_META[p.name] || { hindiName: p.hindiName || p.name, symbol: '•' };
    const houseOccupied = getOccupiedHouse(p.totalDegree, cuspsSidereal);
    // Also compute whole sign house relative to Lagna
    const wholeSignHouse = ((p.rashiNo - lagnaInfo.rashiNo + 12) % 12) + 1;

    return {
      id: p.id,
      name: p.name,
      hindiName: meta.hindiName,
      symbol: meta.symbol,
      longitude: p.totalDegree,
      formattedDMS: p.formattedDMS,
      signId: p.rashiNo,
      signName: p.rashiName,
      hindiSignName: p.hindiRashiName,
      degreeInSign: p.degreeInRashi,
      formattedSignDMS: p.formattedSignDMS,
      signLord: p.signLord,
      isRetrograde: p.isRetrograde,
      nakshatraId: p.nakshatraId,
      nakshatraName: p.nakshatra,
      hindiNakshatraName: p.nakshatra,
      nakshatraPada: Math.floor((p.degreeInRashi % (30 / 9)) / (30 / 36)) + 1,
      starLord: p.nakLord,
      starLordIsRetrograde: false,
      subLord: p.subLord,
      subSubLord: p.subSubLord,
      houseOccupied, // Placidus Bhava Chalit House
      wholeSignHouse, // Rashi D1 House
    };
  });

  // Cusps formatted
  const formattedCusps: CuspData[] = cuspsSidereal.map((lonDeg, idx) => {
    const rashiIdx = Math.floor(lonDeg / 30);
    const nakIdx = Math.floor(lonDeg / (360 / 27));
    return {
      houseNumber: idx + 1,
      longitude: lonDeg,
      formattedDMS: formatDMS(lonDeg),
      signId: rashiIdx + 1,
      signName: RASHIS_EN[rashiIdx],
      hindiSignName: RASHIS[rashiIdx],
      degreeInSign: lonDeg % 30,
      formattedSignDMS: formatDMS(lonDeg % 30),
      signLord: RASHI_LORDS[rashiIdx],
      starLord: VIMSHOTTARI_LORDS[nakIdx % 9],
      starLordIsRetrograde: false,
      subLord: getSubLord(lonDeg),
      subSubLord: getSubSubLord(lonDeg),
      occupants: [],
    };
  });

  // Assign occupants to Cusps
  planetList.forEach((p) => {
    const cusp = formattedCusps.find((c) => c.houseNumber === p.houseOccupied);
    if (cusp) {
      cusp.occupants.push(p.name);
    }
  });

  return {
    lagna: lagnaInfo,
    planets: calculatedPlanets,
    planetList,
    cusps: formattedCusps,
    cuspsSidereal,
    ayanamsha,
    formattedAyanamsha: formatDMS(ayanamsha),
    utcDate,
    astroTime,
  };
}

/**
 * High-Level Bridge generating the full KPMatrix for UI and components
 */
export function calculateMasterKPMatrix(input: ChartInput): KPMatrix {
  const lat = typeof input.latitude === 'string' ? parseFloat(input.latitude) : Number(input.latitude) || 0;
  const lon = typeof input.longitude === 'string' ? parseFloat(input.longitude) : Number(input.longitude) || 0;
  const tz = typeof input.timezone === 'string' ? parseFloat(input.timezone) : input.timezone !== undefined ? Number(input.timezone) : 5.5;

  const [yearStr, monthStr, dayStr] = (input.dateOfBirth || '1995-10-24').split('-');
  const timeParts = (input.timeOfBirth || '12:00').split(':');

  const year = parseInt(yearStr || '1995', 10);
  const month = parseInt(monthStr || '10', 10);
  const day = parseInt(dayStr || '24', 10);
  const hour = parseInt(timeParts[0] || '12', 10);
  const minute = parseInt(timeParts[1] || '0', 10);
  const second = parseInt(timeParts[2] || '0', 10);

  const res = calculateAccurateKundli(
    year,
    month,
    day,
    hour,
    minute,
    second,
    lat,
    lon,
    tz,
    input.ayanamsa || 'KP_NEW'
  );

  let cusps = res.cusps;
  let rawCusps = res.cuspsSidereal;
  let horaryInfo: KPMatrix['horaryData'] | undefined = undefined;

  // Horary 1-249 shift if applicable
  if (input.isHorary && input.horaryNumber && input.horaryNumber >= 1 && input.horaryNumber <= 249) {
    const table = generateHorary249Table();
    const seg = table.find((s) => s.number === input.horaryNumber) || table[0];
    const horaryAsc = seg.startLon;
    const shift = normalizeDeg(horaryAsc - rawCusps[0]);
    rawCusps = rawCusps.map((c) => normalizeDeg(c + shift));

    cusps = rawCusps.map((lonDeg, idx) => {
      const rashiIdx = Math.floor(lonDeg / 30);
      const nakIdx = Math.floor(lonDeg / (360 / 27));
      return {
        houseNumber: idx + 1,
        longitude: lonDeg,
        formattedDMS: formatDMS(lonDeg),
        signId: rashiIdx + 1,
        signName: RASHIS_EN[rashiIdx],
        hindiSignName: RASHIS[rashiIdx],
        degreeInSign: lonDeg % 30,
        formattedSignDMS: formatDMS(lonDeg % 30),
        signLord: RASHI_LORDS[rashiIdx],
        starLord: VIMSHOTTARI_LORDS[nakIdx % 9],
        starLordIsRetrograde: false,
        subLord: getSubLord(lonDeg),
        subSubLord: getSubSubLord(lonDeg),
        occupants: [],
      };
    });

    horaryInfo = {
      seed: input.horaryNumber,
      subLordSpan: `${seg.startDMS} - ${seg.endDMS}`,
      signLord: seg.signLord,
      starLord: seg.starLord,
      subLord: seg.subLord,
    };
  }

  const planets = res.planetList;

  // 4-Fold Significators
  const { houseSignificators, planetSignifications } = calculateSignificators(planets, cusps);

  // Ruling Planets
  const moonPlanet = planets.find((p) => p.name === 'Moon') || planets[1];
  const sunPlanet = planets.find((p) => p.name === 'Sun') || planets[0];
  const birthDateObj = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const rulingPlanets: RulingPlanets = calculateRulingPlanets(
    rawCusps[0],
    moonPlanet.longitude,
    birthDateObj.getUTCDay()
  );

  // Vimshottari Dasha
  const { tree, current } = calculateVimshottariDasha(moonPlanet.longitude, birthDateObj);

  // Pars Fortuna
  const isDayBirth = sunPlanet.houseOccupied >= 7 && sunPlanet.houseOccupied <= 12;
  const parsFortuna = calculateParsFortuna(
    rawCusps[0],
    sunPlanet.longitude,
    moonPlanet.longitude,
    isDayBirth,
    rawCusps
  );

  // Mathematical Event Checklist
  const eventChecklist = evaluateEventChecklist(cusps, planets, planetSignifications, current);

  return {
    input,
    calculationTimestamp: new Date().toISOString(),
    julianDay: res.astroTime.ut,
    ayanamsaType: input.ayanamsa || 'KP_NEW',
    ayanamsaValue: res.ayanamsha,
    formattedAyanamsa: res.formattedAyanamsha,
    ascendant: rawCusps[0],
    midheaven: rawCusps[9],
    planets,
    cusps,
    houseSignificators,
    planetSignifications,
    rulingPlanets,
    currentDasha: current,
    vimshottariDashaTree: tree,
    parsFortuna,
    eventChecklist,
    horaryData: horaryInfo,
  };
}
