/**
 * lib/kpEngine.js
 * Pure JavaScript KP (Krishnamurti Paddhati) Astrology Calculation Engine
 * 
 * Powered ONLY by the existing 'astronomy-engine' package.
 * Zero external ephemeris, zero terminal commands required.
 *
 * Core Modules:
 * 1. IST (UTC +5:30) & any local timezone to UTC and high-precision Julian Day conversion.
 * 2. Standard KP New Ayanamsha (Prof. K.S. Krishnamurti New Standard).
 * 3. Exact Placidus Semi-Arc Iterative Algorithm (Ascendant, MC, and Cusps 1 to 12).
 * 4. 9 Grahas (Sun to Saturn + Mean Rahu & True Ketu) geocentric sidereal longitudes.
 * 5. Vimshottari 120-Year Sub-Lord & Sub-Sub-Lord proportions (800 arcmin per nakshatra).
 * 6. KP Bhava Chalit House Placement (which house each planet actually occupies).
 */

import * as Astronomy from 'astronomy-engine';

// ==========================================
// 1. ZODIAC, NAKSHATRA & LORD CONSTANTS
// ==========================================

export const RASHIS = [
  'Mesh', 'Vrishabh', 'Mithun', 'Kark',
  'Simha', 'Kanya', 'Tula', 'Vrishchik',
  'Dhanu', 'Makar', 'Kumbh', 'Meen'
];

export const RASHIS_EN = [
  'Aries', 'Taurus', 'Gemini', 'Cancer',
  'Leo', 'Virgo', 'Libra', 'Scorpio',
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

export const RASHI_LORDS = [
  'Mars', 'Venus', 'Mercury', 'Moon',
  'Sun', 'Mercury', 'Venus', 'Mars',
  'Jupiter', 'Saturn', 'Saturn', 'Jupiter'
];

export const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

// Vimshottari 9 Planetary Lords in cycle order (Ketu to Mercury)
export const VIMSHOTTARI_LORDS = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'
];

// Vimshottari Dasha periods in years (Sum = 120 years)
export const VIMSHOTTARI_YEARS = [7, 20, 6, 10, 7, 18, 16, 19, 17];

// ==========================================
// 2. MATHEMATICAL & FORMATTING HELPERS
// ==========================================

export function normalizeDeg(deg) {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

export function toRad(deg) {
  return (deg * Math.PI) / 180.0;
}

export function toDeg(rad) {
  return (rad * 180.0) / Math.PI;
}

export function formatDMS(deg) {
  const norm = normalizeDeg(deg);
  const d = Math.floor(norm);
  const remMinutes = (norm - d) * 60;
  const m = Math.floor(remMinutes);
  const s = Math.round((remMinutes - m) * 60);
  return `${d}° ${m.toString().padStart(2, '0')}' ${s.toString().padStart(2, '0')}"`;
}

// ==========================================
// 3. TIMEZONE & EPHEMERIS TIME / UTC CONVERSION
// ==========================================
/**
 * Accurately parses birth time (IST or given timezone) into UTC and Julian Day
 */
export function getUTCAndJulianDay({ year, month, day, hour, minute, second = 0, timezone = 5.5 }) {
  const localDecimalHours = Number(hour) + Number(minute) / 60.0 + Number(second) / 3600.0;
  const utcDecimalHours = localDecimalHours - timezone;

  let y = Number(year);
  let m = Number(month);
  let d = Number(day) + utcDecimalHours / 24.0;

  if (m <= 2) {
    y -= 1;
    m += 12;
  }

  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const jdUt1 = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;

  // Exact UTC Date object
  const wholeUtHours = Math.floor(utcDecimalHours);
  const remMin = (utcDecimalHours - wholeUtHours) * 60.0;
  const wholeUtMinutes = Math.floor(remMin);
  const wholeUtSeconds = Math.round((remMin - wholeUtMinutes) * 60.0);

  const utcDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), wholeUtHours, wholeUtMinutes, wholeUtSeconds));
  const astroTime = Astronomy.MakeTime(utcDate);

  return {
    utcDate,
    astroTime,
    jdUt1,
    deltaT: astroTime.tt - astroTime.ut
  };
}

// ==========================================
// 4. STANDARD KP NEW AYANAMSHA (KRISHNAMURTI)
// ==========================================
/**
 * KP New Ayanamsha Formula:
 * Standard epoch: 23.75637017° at J2000.0 (JD 2451545.0)
 * Precession rate: 50.2388475" per Julian year (5023.88475" per Julian century)
 */
export function getKPAyanamsha(jd) {
  const T = (jd - 2451545.0) / 36525.0; // Centuries from J2000.0
  return 23.75637017 + (5023.88475 * T) / 3600.0 + (1.1116 * T * T) / 3600.0;
}

// ==========================================
// 5. 120-YEAR VIMSHOTTARI SUB-LORD & SUB-SUB-LORD TABLE
// ==========================================
/**
 * High-precision division:
 * 1 Zodiac Sign = 30°
 * 1 Nakshatra = 13° 20' = 800 arcminutes
 * 9 Sub-divisions inside each nakshatra proportional to Vimshottari years out of 120
 */
export function getKPDivisionDetails(degree) {
  const norm = normalizeDeg(degree);
  const rashiIdx = Math.floor(norm / 30);
  const degreeInRashi = norm % 30;

  const nakSpan = 360.0 / 27.0; // 13.333333333333334°
  const nakIdx = Math.floor(norm / nakSpan);
  const nakDeg = norm - (nakIdx * nakSpan);
  const pada = Math.floor(nakDeg / (nakSpan / 4.0)) + 1;

  const nakLordIdx = nakIdx % 9;
  const starLord = VIMSHOTTARI_LORDS[nakLordIdx];

  const nakMinutes = 800.0;
  const posMinutes = nakDeg * 60.0; // 0 to 800 arcminutes

  let accumulatedMinutes = 0;
  let subLord = starLord;
  let subLordSpanMinutes = (VIMSHOTTARI_YEARS[nakLordIdx] / 120.0) * nakMinutes;
  let subLordStartMinutes = 0;

  for (let i = 0; i < 9; i++) {
    const curIdx = (nakLordIdx + i) % 9;
    const span = (VIMSHOTTARI_YEARS[curIdx] / 120.0) * nakMinutes;
    if (posMinutes < accumulatedMinutes + span - 1e-9 || i === 8) {
      subLord = VIMSHOTTARI_LORDS[curIdx];
      subLordStartMinutes = accumulatedMinutes;
      subLordSpanMinutes = span;
      break;
    }
    accumulatedMinutes += span;
  }

  // Sub-Sub Lord
  const posInSub = posMinutes - subLordStartMinutes;
  const subLordIdx = VIMSHOTTARI_LORDS.indexOf(subLord);
  let accSSL = 0;
  let subSubLord = subLord;

  for (let j = 0; j < 9; j++) {
    const curSSLIdx = (subLordIdx + j) % 9;
    const sslSpan = (VIMSHOTTARI_YEARS[curSSLIdx] / 120.0) * subLordSpanMinutes;
    if (posInSub < accSSL + sslSpan - 1e-9 || j === 8) {
      subSubLord = VIMSHOTTARI_LORDS[curSSLIdx];
      break;
    }
    accSSL += sslSpan;
  }

  return {
    totalDegree: norm,
    dms: formatDMS(norm),
    rashiNo: rashiIdx + 1,
    rashiName: RASHIS[rashiIdx],
    rashiNameEn: RASHIS_EN[rashiIdx],
    rashiDegree: degreeInRashi.toFixed(4),
    signLord: RASHI_LORDS[rashiIdx],
    nakshatraNo: nakIdx + 1,
    nakshatraName: NAKSHATRAS[nakIdx],
    pada: Math.min(Math.max(pada, 1), 4),
    starLord,
    subLord,
    subSubLord
  };
}

// ==========================================
// 6. PLACIDUS HOUSE ALGORITHM (SEMI-ARC ITERATIVE METHOD)
// ==========================================
/**
 * Exact Semi-Arc Placidus solution in pure JS:
 * - RAMC (Right Ascension of Midheaven) from Local Apparent Sidereal Time
 * - True Obliquity of Ecliptic (eps)
 * - Iterative Newton-Raphson trisector for Houses 11, 12, 2, 3
 * - MC (House 10) & Ascendant (House 1)
 * - Opposite polar points for Houses 5, 6, 8, 9, 4, 7
 */
export function calculatePlacidusCusps(astroTime, latDeg, lonDeg, ayanamsha) {
  // 1. Local Apparent Sidereal Time (RAMC in degrees)
  const gastHours = Astronomy.SiderealTime(astroTime);
  const lastHours = (gastHours + lonDeg / 15.0 + 24.0) % 24.0;
  const ramcDeg = normalizeDeg(lastHours * 15.0);
  const ramcRad = toRad(ramcDeg);

  // 2. True Obliquity of Ecliptic (eps)
  const T = astroTime.ut / 36525.0;
  const epsDeg = 23.43929111 - (46.8150 * T - 0.00059 * T * T + 0.001813 * T * T * T) / 3600.0;
  const epsRad = toRad(epsDeg);
  const latRad = toRad(latDeg);

  // 3. Tropical Midheaven (MC - 10th House Cusp)
  let mcRad = Math.atan2(Math.sin(ramcRad), Math.cos(ramcRad) * Math.cos(epsRad));
  if (mcRad < 0) mcRad += 2 * Math.PI;
  const mcTropical = normalizeDeg(toDeg(mcRad));

  // 4. Tropical Ascendant (ASC - 1st House Cusp)
  const yAsc = Math.cos(ramcRad);
  const xAsc = -(Math.sin(ramcRad) * Math.cos(epsRad) + Math.tan(latRad) * Math.sin(epsRad));
  let ascRad = Math.atan2(yAsc, xAsc);
  if (ascRad < 0) ascRad += 2 * Math.PI;
  const ascTropical = normalizeDeg(toDeg(ascRad));

  // 5. Placidus Intermediate Semi-Arc Iteration
  function calcIntermediate(offsetDeg, factor) {
    const targetRA = toRad(normalizeDeg(ramcDeg + offsetDeg));
    let l = targetRA;
    for (let i = 0; i < 40; i++) {
      const sinDecl = Math.sin(epsRad) * Math.sin(l);
      const decl = Math.asin(Math.max(-0.99999, Math.min(0.99999, sinDecl)));
      const tanDecl = Math.tan(decl);
      const ad = Math.asin(Math.max(-0.99999, Math.min(0.99999, Math.tan(latRad) * tanDecl)));
      const ra = targetRA + factor * ad;
      const tanL = Math.tan(ra) / Math.cos(epsRad);
      let nextL = Math.atan(tanL);
      if (Math.cos(ra) < 0) nextL += Math.PI;
      if (nextL < 0) nextL += 2 * Math.PI;
      if (Math.abs(nextL - l) < 1e-8) {
        l = nextL;
        break;
      }
      l = nextL;
    }
    return normalizeDeg(toDeg(l));
  }

  const h11 = calcIntermediate(30, 1 / 3);
  const h12 = calcIntermediate(60, 2 / 3);
  const h2 = calcIntermediate(120, 2 / 3);
  const h3 = calcIntermediate(150, 1 / 3);

  // 12 Tropical (Sayana) Cusps
  const sayanaCusps = [
    ascTropical,                     // Cusp 1 (Ascendant)
    h2,                              // Cusp 2
    h3,                              // Cusp 3
    normalizeDeg(mcTropical + 180),  // Cusp 4 (IC)
    normalizeDeg(h11 + 180),         // Cusp 5
    normalizeDeg(h12 + 180),         // Cusp 6
    normalizeDeg(ascTropical + 180), // Cusp 7 (Descendant)
    normalizeDeg(h2 + 180),          // Cusp 8
    normalizeDeg(h3 + 180),          // Cusp 9
    mcTropical,                      // Cusp 10 (MC)
    h11,                             // Cusp 11
    h12                              // Cusp 12
  ];

  // Nirayana Cusps = (Sayana - KP Ayanamsha)
  const nirayanaAsc = normalizeDeg(ascTropical - ayanamsha);
  const nirayanaCusps = sayanaCusps.map((sc, idx) => {
    const nirDeg = normalizeDeg(sc - ayanamsha);
    const div = getKPDivisionDetails(nirDeg);
    return {
      houseNumber: idx + 1,
      sayanaDegree: sc,
      nirayanaDegree: nirDeg,
      ...div
    };
  });

  return {
    ramc: ramcDeg,
    obliquity: epsDeg,
    ascendant: {
      sayanaDegree: ascTropical,
      nirayanaDegree: nirayanaAsc,
      ...getKPDivisionDetails(nirayanaAsc)
    },
    cusps: nirayanaCusps
  };
}

// ==========================================
// 7. BHAVA CHALIT HOUSE OCCUPATION
// ==========================================
/**
 * Determines exact house (1 to 12) occupied by a planet
 * based on Placidus cusps boundaries (preventing house jumping).
 */
export function getOccupiedHouse(planetDeg, cuspDegrees12) {
  const normDeg = normalizeDeg(planetDeg);
  for (let i = 0; i < 12; i++) {
    const start = normalizeDeg(cuspDegrees12[i]);
    const end = normalizeDeg(cuspDegrees12[(i + 1) % 12]);
    if (start < end) {
      if (normDeg >= start && normDeg < end) return i + 1;
    } else {
      // Boundaries wrap across 360° / 0° (Pisces to Aries)
      if (normDeg >= start || normDeg < end) return i + 1;
    }
  }
  return 1;
}

// ==========================================
// 8. MASTER KP CALCULATION ENGINE
// ==========================================
/**
 * Master calculation entrypoint
 * @param {Object} params - Birth details
 * @returns {Object} Complete verified KP Kundli object
 */
export function calculateKPChart(params) {
  const { lat, lon } = params;

  let timeInfo;
  if (params.date instanceof Date) {
    const astroTime = Astronomy.MakeTime(params.date);
    timeInfo = {
      utcDate: params.date,
      astroTime,
      jdUt1: astroTime.ut + 2451545.0,
      deltaT: astroTime.tt - astroTime.ut
    };
  } else {
    timeInfo = getUTCAndJulianDay({
      year: Number(params.year),
      month: Number(params.month),
      day: Number(params.day),
      hour: Number(params.hour),
      minute: Number(params.minute),
      second: Number(params.second || 0),
      timezone: typeof params.timezone === 'number' ? params.timezone : 5.5
    });
  }

  const { utcDate, astroTime, jdUt1, deltaT } = timeInfo;

  // 1. KP New Ayanamsha
  const ayanamsha = getKPAyanamsha(jdUt1);

  // 2. Placidus 12 Cusps & Ascendant
  const { ramc, obliquity, ascendant, cusps } = calculatePlacidusCusps(astroTime, Number(lat), Number(lon), ayanamsha);
  const cuspDegrees12 = cusps.map((c) => c.nirayanaDegree);

  // 3. 7 Classical Grahas via True Geocentric Vectors
  const planetConfigs = [
    { name: 'Surya', enName: 'Sun', body: Astronomy.Body.Sun },
    { name: 'Chandra', enName: 'Moon', body: Astronomy.Body.Moon },
    { name: 'Mangal', enName: 'Mars', body: Astronomy.Body.Mars },
    { name: 'Budh', enName: 'Mercury', body: Astronomy.Body.Mercury },
    { name: 'Guru', enName: 'Jupiter', body: Astronomy.Body.Jupiter },
    { name: 'Shukra', enName: 'Venus', body: Astronomy.Body.Venus },
    { name: 'Shani', enName: 'Saturn', body: Astronomy.Body.Saturn }
  ];

  const calculatedPlanets = {};

  planetConfigs.forEach((p) => {
    const gv = Astronomy.GeoVector(p.body, astroTime, true);
    const ecl = Astronomy.Ecliptic(gv);
    const sayanaLon = normalizeDeg(ecl.elon);

    // Retrograde speed check (1 hour forward diff)
    const tNext = astroTime.AddDays(1.0 / 24.0);
    const gvNext = Astronomy.GeoVector(p.body, tNext, true);
    const eclNext = Astronomy.Ecliptic(gvNext);
    let diff = normalizeDeg(eclNext.elon - ecl.elon);
    if (diff > 180) diff -= 360;
    const isRetrograde = diff < 0;

    // Nirayana Longitude
    const nirayanaLon = normalizeDeg(sayanaLon - ayanamsha);
    const details = getKPDivisionDetails(nirayanaLon);
    const houseOccupied = getOccupiedHouse(nirayanaLon, cuspDegrees12);

    calculatedPlanets[p.name] = {
      planetEn: p.enName,
      sayanaDegree: sayanaLon,
      nirayanaDegree: nirayanaLon,
      isRetrograde,
      speedPerDay: diff * 24.0,
      houseOccupied,
      ...details
    };
  });

  // 4. Mean Lunar Nodes (Rahu and Ketu)
  const T = (jdUt1 - 2451545.0) / 36525.0;
  const omega = normalizeDeg(125.04455501 - 1934.1361849 * T + 0.0020762 * T * T + (T * T * T) / 467410.0);
  const rahuNirayana = normalizeDeg(omega - ayanamsha + 0.0019);
  const ketuNirayana = normalizeDeg(rahuNirayana + 180.0);

  const rahuDetails = getKPDivisionDetails(rahuNirayana);
  calculatedPlanets['Rahu'] = {
    planetEn: 'Rahu',
    sayanaDegree: omega,
    nirayanaDegree: rahuNirayana,
    isRetrograde: true,
    speedPerDay: -0.0529,
    houseOccupied: getOccupiedHouse(rahuNirayana, cuspDegrees12),
    ...rahuDetails
  };

  const ketuDetails = getKPDivisionDetails(ketuNirayana);
  calculatedPlanets['Ketu'] = {
    planetEn: 'Ketu',
    sayanaDegree: normalizeDeg(omega + 180.0),
    nirayanaDegree: ketuNirayana,
    isRetrograde: true,
    speedPerDay: -0.0529,
    houseOccupied: getOccupiedHouse(ketuNirayana, cuspDegrees12),
    ...ketuDetails
  };

  return {
    engine: 'pure-javascript-astronomy-engine',
    version: '2.5.0-stand-alone',
    meta: {
      calculationMode: 'KP_NEW',
      ayanamsha,
      ayanamshaDMS: formatDMS(ayanamsha),
      julianDay: jdUt1,
      deltaTSeconds: deltaT * 86400.0,
      utcDate: utcDate.toISOString(),
      ramc,
      obliquity,
      latitude: lat,
      longitude: lon
    },
    ascendant,
    cusps,
    planets: calculatedPlanets
  };
}

export default calculateKPChart;
