import {
  AyanamsaType,
  ChartInput,
  CuspData,
  CurrentDasha,
  DashaPeriod,
  HouseSignificator,
  KPMatrix,
  PlanetPosition,
  PlanetSignification,
  RulingPlanets,
} from '@/types/astrology';
import { calculateParsFortuna, evaluateEventChecklist } from './kp-evaluator';
import { Body, GeoVector, Ecliptic, AstroTime, SiderealTime } from 'astronomy-engine';

// Zodiac Signs metadata
export const ZODIAC_SIGNS = [
  { id: 1, name: 'Aries', hindiName: 'मेष', lord: 'Mars', sanskrit: 'Mesha' },
  { id: 2, name: 'Taurus', hindiName: 'वृषभ', lord: 'Venus', sanskrit: 'Vrishabha' },
  { id: 3, name: 'Gemini', hindiName: 'मिथुन', lord: 'Mercury', sanskrit: 'Mithuna' },
  { id: 4, name: 'Cancer', hindiName: 'कर्क', lord: 'Moon', sanskrit: 'Karka' },
  { id: 5, name: 'Leo', hindiName: 'सिंह', lord: 'Sun', sanskrit: 'Simha' },
  { id: 6, name: 'Virgo', hindiName: 'कन्या', lord: 'Mercury', sanskrit: 'Kanya' },
  { id: 7, name: 'Libra', hindiName: 'तुला', lord: 'Venus', sanskrit: 'Tula' },
  { id: 8, name: 'Scorpio', hindiName: 'वृश्चिक', lord: 'Mars', sanskrit: 'Vrishchika' },
  { id: 9, name: 'Sagittarius', hindiName: 'धनु', lord: 'Jupiter', sanskrit: 'Dhanu' },
  { id: 10, name: 'Capricorn', hindiName: 'मकर', lord: 'Saturn', sanskrit: 'Makara' },
  { id: 11, name: 'Aquarius', hindiName: 'कुंभ', lord: 'Saturn', sanskrit: 'Kumbha' },
  { id: 12, name: 'Pisces', hindiName: 'मीन', lord: 'Jupiter', sanskrit: 'Meena' },
];

// Vimshottari Dasha Lords and their spans in years (Total: 120 years)
export const VIMSHOTTARI_LORDS: { name: string; hindiName: string; years: number }[] = [
  { name: 'Ketu', hindiName: 'केतु', years: 7 },
  { name: 'Venus', hindiName: 'शुक्र', years: 20 },
  { name: 'Sun', hindiName: 'सूर्य', years: 6 },
  { name: 'Moon', hindiName: 'चंद्र', years: 10 },
  { name: 'Mars', hindiName: 'मंगल', years: 7 },
  { name: 'Rahu', hindiName: 'राहु', years: 18 },
  { name: 'Jupiter', hindiName: 'गुरु', years: 16 },
  { name: 'Saturn', hindiName: 'शनि', years: 19 },
  { name: 'Mercury', hindiName: 'बुध', years: 17 },
];

export const TOTAL_DASHA_YEARS = 120;

// 27 Nakshatras list
export const NAKSHATRAS = [
  { id: 1, name: 'Ashwini', hindiName: 'अश्विनी', starLord: 'Ketu' },
  { id: 2, name: 'Bharani', hindiName: 'भरणी', starLord: 'Venus' },
  { id: 3, name: 'Krittika', hindiName: 'कृत्तिका', starLord: 'Sun' },
  { id: 4, name: 'Rohini', hindiName: 'रोहिणी', starLord: 'Moon' },
  { id: 5, name: 'Mrigashira', hindiName: 'मृगशिरा', starLord: 'Mars' },
  { id: 6, name: 'Ardra', hindiName: 'आर्द्रा', starLord: 'Rahu' },
  { id: 7, name: 'Punarvasu', hindiName: 'पुनर्वसु', starLord: 'Jupiter' },
  { id: 8, name: 'Pushya', hindiName: 'पुष्य', starLord: 'Saturn' },
  { id: 9, name: 'Ashlesha', hindiName: 'आश्लेषा', starLord: 'Mercury' },
  { id: 10, name: 'Magha', hindiName: 'मघा', starLord: 'Ketu' },
  { id: 11, name: 'Purva Phalguni', hindiName: 'पूर्वा फाल्गुनी', starLord: 'Venus' },
  { id: 12, name: 'Uttara Phalguni', hindiName: 'उत्तरा फाल्गुनी', starLord: 'Sun' },
  { id: 13, name: 'Hasta', hindiName: 'हस्त', starLord: 'Moon' },
  { id: 14, name: 'Chitra', hindiName: 'चित्रा', starLord: 'Mars' },
  { id: 15, name: 'Swati', hindiName: 'स्वाती', starLord: 'Rahu' },
  { id: 16, name: 'Vishakha', hindiName: 'विशाखा', starLord: 'Jupiter' },
  { id: 17, name: 'Anuradha', hindiName: 'अनुराधा', starLord: 'Saturn' },
  { id: 18, name: 'Jyeshtha', hindiName: 'ज्येष्ठा', starLord: 'Mercury' },
  { id: 19, name: 'Moola', hindiName: 'मूल', starLord: 'Ketu' },
  { id: 20, name: 'Purva Ashadha', hindiName: 'पूर्वाषाढ़ा', starLord: 'Venus' },
  { id: 21, name: 'Uttara Ashadha', hindiName: 'उत्तराषाढ़ा', starLord: 'Sun' },
  { id: 22, name: 'Shravana', hindiName: 'श्रवण', starLord: 'Moon' },
  { id: 23, name: 'Dhanishta', hindiName: 'धनिष्ठा', starLord: 'Mars' },
  { id: 24, name: 'Shatabhisha', hindiName: 'शतभिषा', starLord: 'Rahu' },
  { id: 25, name: 'Purva Bhadrapada', hindiName: 'पूर्वाभाद्रपद', starLord: 'Jupiter' },
  { id: 26, name: 'Uttara Bhadrapada', hindiName: 'उत्तराभाद्रपद', starLord: 'Saturn' },
  { id: 27, name: 'Revati', hindiName: 'रेवती', starLord: 'Mercury' },
];

export const PLANET_META: Record<string, { hindiName: string; symbol: string }> = {
  Sun: { hindiName: 'सूर्य', symbol: '☉' },
  Moon: { hindiName: 'चंद्र', symbol: '☽' },
  Mars: { hindiName: 'मंगल', symbol: '♂' },
  Mercury: { hindiName: 'बुध', symbol: '☿' },
  Jupiter: { hindiName: 'गुरु', symbol: '♃' },
  Venus: { hindiName: 'शुक्र', symbol: '♀' },
  Saturn: { hindiName: 'शनि', symbol: '♄' },
  Rahu: { hindiName: 'राहु', symbol: '☊' },
  Ketu: { hindiName: 'केतु', symbol: '☋' },
  Uranus: { hindiName: 'अरुण', symbol: '♅' },
  Neptune: { hindiName: 'वरुण', symbol: '♆' },
  Pluto: { hindiName: 'यम', symbol: '♇' },
};

// Convert degree to Degrees, Minutes, Seconds string
export function formatDMS(deg: number): string {
  const norm = ((deg % 360) + 360) % 360;
  const d = Math.floor(norm);
  const minFloat = (norm - d) * 60;
  const m = Math.floor(minFloat);
  const s = Math.round((minFloat - m) * 60);
  return `${d}° ${m.toString().padStart(2, '0')}' ${s.toString().padStart(2, '0')}"`;
}

// Convert Julian Day to Date
export function getJulianDay(year: number, month: number, day: number, hourFraction: number): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + hourFraction + B - 1524.5;
  return jd;
}

// Calculate KP Ayanamsa
export function calculateAyanamsa(julianDay: number, type: AyanamsaType = 'KP_NEW'): number {
  // T: Centuries from J2000.0 (JD 2451545.0)
  const T = (julianDay - 2451545.0) / 36525;
  // Year float
  const year = 2000.0 + T * 100;

  if (type === 'KP_NEW') {
    // KP New Ayanamsa (Krishnamurti New)
    // On 1900.0 KP New was approx 22° 22' 31.8" = 22.3755°
    // Precession approx 50.2388475" / year = 0.013955235° / year
    const diffYears = year - 1900.0;
    return 22.3755 + (diffYears * 50.2388475) / 3600.0;
  } else if (type === 'KP_OLD') {
    // KP Old Ayanamsa
    const diffYears = year - 1900.0;
    return 22.361111 + (diffYears * 50.2388475) / 3600.0;
  } else {
    // Lahiri (Chitra Paksha) Ayanamsa
    return 23.85694 + (T * 1.396971) + (T * T * 0.000308);
  }
}

// Calculate Nakshatra, Star Lord, Sub Lord, and Sub-Sub Lord for any Nirayana longitude (0-360°)
export function getKPDivision(nirayanaLon: number): {
  nakshatraId: number;
  nakshatraName: string;
  hindiNakshatraName: string;
  nakshatraPada: number;
  starLord: string;
  subLord: string;
  subSubLord: string;
  degreeInSign: number;
  signId: number;
  signName: string;
  hindiSignName: string;
  signLord: string;
} {
  const norm = ((nirayanaLon % 360) + 360) % 360;

  // Sign
  const signId = Math.floor(norm / 30) + 1;
  const signObj = ZODIAC_SIGNS[signId - 1];
  const degreeInSign = norm % 30;

  // Nakshatra (each is 13° 20' = 800 minutes)
  const totalMinutes = norm * 60;
  const nakshatraIndex = Math.floor(totalMinutes / 800); // 0 to 26
  const nakshatraId = nakshatraIndex + 1;
  const nakshatraObj = NAKSHATRAS[nakshatraIndex];
  const nakshatraRemMinutes = totalMinutes % 800; // 0 to 800

  // Pada (each pada is 3°20' = 200 minutes)
  const nakshatraPada = Math.floor(nakshatraRemMinutes / 200) + 1;

  // Find Star Lord Index in VIMSHOTTARI_LORDS
  const starLordName = nakshatraObj.starLord;
  const starLordIdx = VIMSHOTTARI_LORDS.findIndex((l) => l.name === starLordName);

  // Sub-Lord calculation:
  // Each nakshatra of 800 minutes is split into 9 parts proportional to Vimshottari years starting from star Lord
  let accumulatedMinutes = 0;
  let subLord = starLordName;
  let subLordSpanMinutes = 0;
  let subLordStartMinute = 0;

  for (let i = 0; i < 9; i++) {
    const currentLordIdx = (starLordIdx + i) % 9;
    const lord = VIMSHOTTARI_LORDS[currentLordIdx];
    const spanMinutes = (800 * lord.years) / TOTAL_DASHA_YEARS; // 800 * (years / 120)

    if (nakshatraRemMinutes >= accumulatedMinutes && nakshatraRemMinutes < accumulatedMinutes + spanMinutes + 0.000001) {
      subLord = lord.name;
      subLordStartMinute = accumulatedMinutes;
      subLordSpanMinutes = spanMinutes;
      break;
    }
    accumulatedMinutes += spanMinutes;
  }

  // Sub-Sub Lord calculation:
  // The subLord's span is subdivided into 9 parts proportional to Vimshottari years starting from subLord
  const subLordIdx = VIMSHOTTARI_LORDS.findIndex((l) => l.name === subLord);
  const subLordRemMinutes = nakshatraRemMinutes - subLordStartMinute;
  let accSubMinutes = 0;
  let subSubLord = subLord;

  for (let j = 0; j < 9; j++) {
    const currentSSLIdx = (subLordIdx + j) % 9;
    const lord = VIMSHOTTARI_LORDS[currentSSLIdx];
    const spanSSL = (subLordSpanMinutes * lord.years) / TOTAL_DASHA_YEARS;

    if (subLordRemMinutes >= accSubMinutes && subLordRemMinutes < accSubMinutes + spanSSL + 0.000001) {
      subSubLord = lord.name;
      break;
    }
    accSubMinutes += spanSSL;
  }

  return {
    nakshatraId,
    nakshatraName: nakshatraObj.name,
    hindiNakshatraName: nakshatraObj.hindiName,
    nakshatraPada,
    starLord: starLordName,
    subLord,
    subSubLord,
    degreeInSign,
    signId,
    signName: signObj.name,
    hindiSignName: signObj.hindiName,
    signLord: signObj.lord,
  };
}

// Generate the authoritative 249 KP Horary Sub-Lord Table
export interface HorarySegment {
  number: number; // 1 to 249
  sign: string;
  signLord: string;
  star: string;
  starLord: string;
  subLord: string;
  startLon: number;
  endLon: number;
  startDMS: string;
  endDMS: string;
}

export function generateHorary249Table(): HorarySegment[] {
  const segments: HorarySegment[] = [];
  let horaryNum = 1;

  for (let nakIdx = 0; nakIdx < 27; nakIdx++) {
    const nak = NAKSHATRAS[nakIdx];
    const nakStartLon = (nakIdx * 800) / 60; // deg
    const starLordIdx = VIMSHOTTARI_LORDS.findIndex((l) => l.name === nak.starLord);

    let currentOffsetMinutes = 0;

    for (let sub = 0; sub < 9; sub++) {
      const subLordIdx = (starLordIdx + sub) % 9;
      const subLordObj = VIMSHOTTARI_LORDS[subLordIdx];
      const spanMinutes = (800 * subLordObj.years) / TOTAL_DASHA_YEARS;

      const subStartLon = nakStartLon + currentOffsetMinutes / 60;
      const subEndLon = subStartLon + spanMinutes / 60;

      // Check if this sub span crosses a 30° zodiac sign boundary
      const startSignIdx = Math.floor(subStartLon / 30);
      const endSignBoundary = (startSignIdx + 1) * 30;

      if (subEndLon > endSignBoundary && endSignBoundary > subStartLon + 0.00001) {
        // Splits into two horary numbers!
        // Part 1: before boundary
        const sign1 = ZODIAC_SIGNS[startSignIdx];
        segments.push({
          number: horaryNum++,
          sign: sign1.name,
          signLord: sign1.lord,
          star: nak.name,
          starLord: nak.starLord,
          subLord: subLordObj.name,
          startLon: subStartLon,
          endLon: endSignBoundary,
          startDMS: formatDMS(subStartLon % 30),
          endDMS: '30° 00\' 00"',
        });

        // Part 2: after boundary
        const nextSignIdx = (startSignIdx + 1) % 12;
        const sign2 = ZODIAC_SIGNS[nextSignIdx];
        segments.push({
          number: horaryNum++,
          sign: sign2.name,
          signLord: sign2.lord,
          star: nak.name,
          starLord: nak.starLord,
          subLord: subLordObj.name,
          startLon: endSignBoundary,
          endLon: subEndLon,
          startDMS: '00° 00\' 00"',
          endDMS: formatDMS(subEndLon % 30),
        });
      } else {
        const sign = ZODIAC_SIGNS[startSignIdx % 12];
        segments.push({
          number: horaryNum++,
          sign: sign.name,
          signLord: sign.lord,
          star: nak.name,
          starLord: nak.starLord,
          subLord: subLordObj.name,
          startLon: subStartLon,
          endLon: subEndLon,
          startDMS: formatDMS(subStartLon % 30),
          endDMS: formatDMS(subEndLon % 30),
        });
      }

      currentOffsetMinutes += spanMinutes;
    }
  }

  return segments;
}

// Astronomical Helpers (Solar, Lunar, Planetary Mean and True motions)
function degToRad(deg: number): number {
  return (deg * Math.PI) / 180.0;
}

function radToDeg(rad: number): number {
  return (rad * 180.0) / Math.PI;
}

function normalize360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

// Compute Local Sidereal Time (RAMC) in degrees
export function getLST(julianDay: number, longitude: number): number {
  const T = (julianDay - 2451545.0) / 36525.0;
  // Greenwich Mean Sidereal Time in degrees
  let gmst =
    280.46061837 +
    360.98564736629 * (julianDay - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000.0;
  gmst = normalize360(gmst);
  const lst = normalize360(gmst + longitude);
  return lst;
}

// Precise Obliquity of the Ecliptic (eps)
export function getTrueObliquity(julianDay: number): number {
  const T = (julianDay - 2451545.0) / 36525.0;
  // Mean obliquity
  const eps0 =
    23.43929111 -
    (46.815 * T) / 3600.0 -
    (0.00059 * T * T) / 3600.0 +
    (0.001813 * T * T * T) / 3600.0;
  return eps0;
}

// Calculate Ascendant and Midheaven (RAMC to MC & ASC)
export function calculateAscAndMC(lstDeg: number, latDeg: number, epsDeg: number): { ascendant: number; mc: number } {
  const ramcRad = degToRad(lstDeg);
  const epsRad = degToRad(epsDeg);
  const latRad = degToRad(latDeg);

  // Midheaven (MC): tan(MC) = tan(RAMC) / cos(eps)
  let mcRad = Math.atan2(Math.sin(ramcRad), Math.cos(ramcRad) * Math.cos(epsRad));
  if (mcRad < 0) mcRad += 2 * Math.PI;
  const mc = normalize360(radToDeg(mcRad));

  // Ascendant: tan(ASC) = cos(RAMC) / - (sin(RAMC) * cos(eps) + tan(lat) * sin(eps))
  const y = Math.cos(ramcRad);
  const x = -(Math.sin(ramcRad) * Math.cos(epsRad) + Math.tan(latRad) * Math.sin(epsRad));
  let ascRad = Math.atan2(y, x);
  if (ascRad < 0) ascRad += 2 * Math.PI;
  const asc = normalize360(radToDeg(ascRad));

  return { ascendant: asc, mc };
}

// Placidus House Cusps Computation with Exact Trigonometric Convergence
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

  // Semi-arc iteration for Placidus intermediate cusps (11, 12, 2, 3)
  function calcIntermediate(offsetDeg: number, factor: number): number {
    const targetRA = normalize360(lstDeg + offsetDeg) * (Math.PI / 180);
    let l = targetRA;
    for (let i = 0; i < 25; i++) {
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
    normalize360(mc + 180), // 4th (IC)
    normalize360(h11 + 180), // 5th
    normalize360(h12 + 180), // 6th
    normalize360(asc + 180), // 7th (DSC)
    normalize360(h2 + 180), // 8th
    normalize360(h3 + 180), // 9th
    mc, // 10th (MC)
    h11, // 11th
    h12, // 12th
  ];

  return cuspsTropical.map((c) => normalize360(c - ayanamsa));
}

// Swiss Ephemeris Grade High-Precision Planetary Positions via astronomy-engine
export function calculatePlanetaryPositions(
  time: AstroTime,
  ayanamsa: number
): {
  id: string;
  name: string;
  longitude: number; // Nirayana
  isRetrograde: boolean;
}[] {
  const bodies: { id: string; name: string; body: Body }[] = [
    { id: 'sun', name: 'Sun', body: Body.Sun },
    { id: 'moon', name: 'Moon', body: Body.Moon },
    { id: 'mars', name: 'Mars', body: Body.Mars },
    { id: 'mercury', name: 'Mercury', body: Body.Mercury },
    { id: 'jupiter', name: 'Jupiter', body: Body.Jupiter },
    { id: 'venus', name: 'Venus', body: Body.Venus },
    { id: 'saturn', name: 'Saturn', body: Body.Saturn },
    { id: 'uranus', name: 'Uranus', body: Body.Uranus },
    { id: 'neptune', name: 'Neptune', body: Body.Neptune },
    { id: 'pluto', name: 'Pluto', body: Body.Pluto },
  ];

  const timePlus1h = time.AddDays(1 / 24);

  const mainPlanets = bodies.map((b) => {
    const v1 = GeoVector(b.body, time, true);
    const e1 = Ecliptic(v1);
    const tropicalLon = normalize360(e1.elon);

    const v2 = GeoVector(b.body, timePlus1h, true);
    const e2 = Ecliptic(v2);
    let diff = e2.elon - e1.elon;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    const isRetrograde = diff < 0;

    return {
      id: b.id,
      name: b.name,
      longitude: normalize360(tropicalLon - ayanamsa),
      isRetrograde,
    };
  });

  // Mean Moon Node (Rahu)
  const T = time.ut / 36525.0; // centuries from J2000
  const rahuTropical = normalize360(
    125.04452222 - 1934.1362608 * T + 0.0020708 * T * T + (T * T * T) / 450000.0
  );
  const rahuNirayana = normalize360(rahuTropical - ayanamsa);
  const ketuNirayana = normalize360(rahuNirayana + 180);

  const nodes = [
    { id: 'rahu', name: 'Rahu', longitude: rahuNirayana, isRetrograde: true },
    { id: 'ketu', name: 'Ketu', longitude: ketuNirayana, isRetrograde: true },
  ];

  const sun = mainPlanets.find((p) => p.id === 'sun')!;
  const moon = mainPlanets.find((p) => p.id === 'moon')!;
  const mars = mainPlanets.find((p) => p.id === 'mars')!;
  const mercury = mainPlanets.find((p) => p.id === 'mercury')!;
  const jupiter = mainPlanets.find((p) => p.id === 'jupiter')!;
  const venus = mainPlanets.find((p) => p.id === 'venus')!;
  const saturn = mainPlanets.find((p) => p.id === 'saturn')!;
  const uranus = mainPlanets.find((p) => p.id === 'uranus')!;
  const neptune = mainPlanets.find((p) => p.id === 'neptune')!;
  const pluto = mainPlanets.find((p) => p.id === 'pluto')!;

  return [sun, moon, mars, mercury, jupiter, venus, saturn, nodes[0], nodes[1], uranus, neptune, pluto];
}

// Determine which house a planet occupies based on Placidus Cusps (Bhava Chalit)
export function getOccupiedHouse(planetLon: number, cusps: number[]): number {
  const normPlanet = normalize360(planetLon);
  for (let i = 0; i < 12; i++) {
    const cuspStart = cusps[i];
    const cuspEnd = cusps[(i + 1) % 12];

    if (cuspEnd > cuspStart) {
      if (normPlanet >= cuspStart && normPlanet < cuspEnd) {
        return i + 1;
      }
    } else {
      // Wraps over 360°/0°
      if (normPlanet >= cuspStart || normPlanet < cuspEnd) {
        return i + 1;
      }
    }
  }
  return 1;
}

// Compute KP 4-Fold Significators
export function calculateSignificators(
  planets: PlanetPosition[],
  cusps: CuspData[]
): { houseSignificators: HouseSignificator[]; planetSignifications: PlanetSignification[] } {
  // Map planet name/id to occupied house and houses owned
  const planetOccupies: Record<string, number> = {};
  const planetStars: Record<string, string> = {}; // planet -> starLord

  planets.forEach((p) => {
    planetOccupies[p.name] = p.houseOccupied;
    planetStars[p.name] = p.starLord;
  });

  // House Lords (Sign Lords of Cusps)
  const houseLords: Record<number, string> = {};
  const houseOccupants: Record<number, string[]> = {};

  for (let h = 1; h <= 12; h++) {
    houseOccupants[h] = [];
    const cusp = cusps.find((c) => c.houseNumber === h);
    if (cusp) {
      houseLords[h] = cusp.signLord;
    }
  }

  planets.forEach((p) => {
    const h = p.houseOccupied;
    if (houseOccupants[h]) {
      houseOccupants[h].push(p.name);
    }
  });

  // Calculate for each House:
  // Level 1: Planets in star of occupants of this house
  // Level 2: Occupants of this house
  // Level 3: Planets in star of lord of this house
  // Level 4: Lord of this house
  const houseSignificators: HouseSignificator[] = [];

  for (let h = 1; h <= 12; h++) {
    const occupants = houseOccupants[h] || [];
    const lord = houseLords[h] || '';

    // Level 1: Any planet whose starLord is in occupants
    const level1: string[] = [];
    planets.forEach((p) => {
      if (occupants.includes(p.starLord) && !level1.includes(p.name)) {
        level1.push(p.name);
      }
    });

    // Level 2: occupants themselves
    const level2 = [...occupants];

    // Level 3: Any planet whose starLord is the house lord
    const level3: string[] = [];
    if (lord) {
      planets.forEach((p) => {
        if (p.starLord === lord && !level3.includes(p.name)) {
          level3.push(p.name);
        }
      });
    }

    // Level 4: The Lord of the house
    const level4 = lord ? [lord] : [];

    houseSignificators.push({
      houseNumber: h,
      level1,
      level2,
      level3,
      level4,
    });
  }

  // Planet Significations (Inverse mapping: which houses does each planet signify at levels 1-4)
  const planetSignifications: PlanetSignification[] = planets.map((p) => {
    const l1: number[] = [];
    const l2: number[] = [];
    const l3: number[] = [];
    const l4: number[] = [];

    houseSignificators.forEach((hs) => {
      if (hs.level1.includes(p.name)) l1.push(hs.houseNumber);
      if (hs.level2.includes(p.name)) l2.push(hs.houseNumber);
      if (hs.level3.includes(p.name)) l3.push(hs.houseNumber);
      if (hs.level4.includes(p.name)) l4.push(hs.houseNumber);
    });

    const all = Array.from(new Set([...l1, ...l2, ...l3, ...l4])).sort((a, b) => a - b);

    return {
      planetId: p.id,
      planetName: p.name,
      housesSignified: {
        level1: l1,
        level2: l2,
        level3: l3,
        level4: l4,
        all,
      },
    };
  });

  return { houseSignificators, planetSignifications };
}

// Compute Ruling Planets (RP)
export function calculateRulingPlanets(
  lagnaLon: number,
  moonLon: number,
  dayOfWeek: number // 0 = Sun, 1 = Mon, ..., 6 = Sat
): RulingPlanets {
  const dayLords = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const dayLord = dayLords[dayOfWeek % 7];

  const moonDiv = getKPDivision(moonLon);
  const lagnaDiv = getKPDivision(lagnaLon);

  return {
    timestamp: new Date().toISOString(),
    dayLord,
    moonSignLord: moonDiv.signLord,
    moonStarLord: moonDiv.starLord,
    moonSubLord: moonDiv.subLord,
    lagnaSignLord: lagnaDiv.signLord,
    lagnaStarLord: lagnaDiv.starLord,
    lagnaSubLord: lagnaDiv.subLord,
  };
}

// Vimshottari Dasha Tree Calculation
export function calculateVimshottariDasha(
  moonLon: number,
  birthDate: Date
): { tree: DashaPeriod[]; current: CurrentDasha } {
  const moonDiv = getKPDivision(moonLon);
  const totalMinutes = moonLon * 60;
  const remMinutesInNak = totalMinutes % 800; // minutes elapsed in current nakshatra

  // Balance of dasha at birth
  const starLordName = moonDiv.starLord;
  let startLordIdx = VIMSHOTTARI_LORDS.findIndex((l) => l.name === starLordName);
  if (startLordIdx === -1) startLordIdx = 0;
  const totalYearsOfLord = VIMSHOTTARI_LORDS[startLordIdx].years;
  const elapsedFraction = remMinutesInNak / 800.0;
  const balanceYears = totalYearsOfLord * (1 - elapsedFraction);

  const tree: DashaPeriod[] = [];
  const safeBirthTime = isNaN(birthDate.getTime()) ? Date.now() : birthDate.getTime();
  let currentDate = new Date(safeBirthTime);

  // First balance Mahadasha
  const firstMahaLord = VIMSHOTTARI_LORDS[startLordIdx];
  const firstEndDate = new Date(currentDate.getTime() + balanceYears * 365.25 * 86400000);

  tree.push({
    planet: firstMahaLord.name,
    hindiPlanet: firstMahaLord.hindiName,
    startDate: currentDate.toISOString(),
    endDate: firstEndDate.toISOString(),
    durationYears: balanceYears,
  });

  currentDate = firstEndDate;

  // Remaining Mahadashas for a full 120-year cycle
  for (let m = 1; m < 9; m++) {
    const lordIdx = (startLordIdx + m) % 9;
    const lord = VIMSHOTTARI_LORDS[lordIdx];
    const endDate = new Date(currentDate.getTime() + lord.years * 365.25 * 86400000);

    tree.push({
      planet: lord.name,
      hindiPlanet: lord.hindiName,
      startDate: currentDate.toISOString(),
      endDate: endDate.toISOString(),
      durationYears: lord.years,
    });

    currentDate = endDate;
  }

  // Find Current Dasha for today
  const now = new Date();
  let currentMaha = tree.find((d) => new Date(d.startDate) <= now && new Date(d.endDate) >= now);
  if (!currentMaha) currentMaha = tree[0];

  // Calculate Antardasha within Current Mahadasha
  const mahaLordIdx = VIMSHOTTARI_LORDS.findIndex((l) => l.name === currentMaha!.planet);
  const mahaStart = new Date(currentMaha.startDate).getTime();
  const totalMahaDurationYears = currentMaha.durationYears;

  let antarStart = mahaStart;
  let activeAntar: { planet: string; startDate: string; endDate: string } = {
    planet: currentMaha.planet,
    startDate: currentMaha.startDate,
    endDate: currentMaha.endDate,
  };

  for (let a = 0; a < 9; a++) {
    const antarLordIdx = (mahaLordIdx + a) % 9;
    const aLord = VIMSHOTTARI_LORDS[antarLordIdx];
    const antarDurationYears = (totalMahaDurationYears * aLord.years) / TOTAL_DASHA_YEARS;
    const antarEnd = antarStart + antarDurationYears * 365.25 * 86400000;

    if (now.getTime() >= antarStart && now.getTime() <= antarEnd) {
      activeAntar = {
        planet: aLord.name,
        startDate: new Date(antarStart).toISOString(),
        endDate: new Date(antarEnd).toISOString(),
      };
      break;
    }
    antarStart = antarEnd;
  }

  // Calculate Pratyantardasha within active Antardasha
  const antarLordIdx = VIMSHOTTARI_LORDS.findIndex((l) => l.name === activeAntar.planet);
  const aStart = new Date(activeAntar.startDate).getTime();
  const aDurationYears = (new Date(activeAntar.endDate).getTime() - aStart) / (365.25 * 86400000);

  let pratStart = aStart;
  let activePratyantar = {
    planet: activeAntar.planet,
    startDate: activeAntar.startDate,
    endDate: activeAntar.endDate,
  };

  for (let p = 0; p < 9; p++) {
    const pratLordIdx = (antarLordIdx + p) % 9;
    const pLord = VIMSHOTTARI_LORDS[pratLordIdx];
    const pDurationYears = (aDurationYears * pLord.years) / TOTAL_DASHA_YEARS;
    const pEnd = pratStart + pDurationYears * 365.25 * 86400000;

    if (now.getTime() >= pratStart && now.getTime() <= pEnd) {
      activePratyantar = {
        planet: pLord.name,
        startDate: new Date(pratStart).toISOString(),
        endDate: new Date(pEnd).toISOString(),
      };
      break;
    }
    pratStart = pEnd;
  }

  return {
    tree,
    current: {
      mahadasha: {
        planet: currentMaha.planet,
        startDate: currentMaha.startDate,
        endDate: currentMaha.endDate,
      },
      antardasha: activeAntar,
      pratyantardasha: activePratyantar,
    },
  };
}

// Master KP Engine: Generate Complete KP Matrix with Swiss-Grade Astronomical Precision
export function calculateKPMatrix(input: ChartInput): KPMatrix {
  const lat = typeof input.latitude === 'string' ? parseFloat(input.latitude) : (Number(input.latitude) || 0);
  const lon = typeof input.longitude === 'string' ? parseFloat(input.longitude) : (Number(input.longitude) || 0);
  const tz = typeof input.timezone === 'string' ? parseFloat(input.timezone) : (input.timezone !== undefined ? Number(input.timezone) : 5.5);

  const [yearStr, monthStr, dayStr] = (input.dateOfBirth || '1995-10-24').split('-');
  const timeParts = (input.timeOfBirth || '12:00').split(':');

  const year = parseInt(yearStr || '1995', 10);
  const month = parseInt(monthStr || '10', 10);
  const day = parseInt(dayStr || '24', 10);
  const hour = parseInt(timeParts[0] || '12', 10);
  const minute = parseInt(timeParts[1] || '0', 10);
  const second = parseInt(timeParts[2] || '0', 10);

  // Time in UTC decimal hours
  const localTimeDec = hour + minute / 60.0 + second / 3600.0;
  const utcTimeDec = localTimeDec - tz;

  const utcMs = Date.UTC(year, month - 1, day, 0, 0, 0, 0) + utcTimeDec * 3600000;
  const utcDate = isNaN(utcMs) ? new Date() : new Date(utcMs);
  const astroTime = new AstroTime(utcDate);

  const jd = 2451545.0 + astroTime.ut;
  const ayanamsaVal = calculateAyanamsa(jd, input.ayanamsa || 'KP_NEW');

  // Exact Greenwich Sidereal Time
  const gmstHours = SiderealTime(astroTime);
  const gmstDeg = normalize360(gmstHours * 15.0);
  const lst = normalize360(gmstDeg + lon);

  // True Obliquity of Ecliptic
  const T = astroTime.ut / 36525.0;
  const eps = 23.43929111 - (46.815 * T) / 3600.0 - (0.00059 * T * T) / 3600.0;

  let rawCusps = calculatePlacidusCusps(lst, lat, eps, ayanamsaVal);
  const rawPlanets = calculatePlanetaryPositions(astroTime, ayanamsaVal);

  // Horary (Prashna 1-249) override if selected
  let horaryInfo: KPMatrix['horaryData'] | undefined = undefined;
  if (input.isHorary && input.horaryNumber && input.horaryNumber >= 1 && input.horaryNumber <= 249) {
    const table = generateHorary249Table();
    const seg = table.find((s) => s.number === input.horaryNumber) || table[0];

    // Align 1st Cusp (Ascendant) exactly to the Horary Sub-Lord segment start
    const horaryAscNirayana = seg.startLon;
    const shift = normalize360(horaryAscNirayana - rawCusps[0]);
    rawCusps = rawCusps.map((c) => normalize360(c + shift));

    horaryInfo = {
      seed: input.horaryNumber,
      subLordSpan: `${seg.startDMS} - ${seg.endDMS}`,
      signLord: seg.signLord,
      starLord: seg.starLord,
      subLord: seg.subLord,
    };
  }

  // Retrograde lookup map
  const retroPlanetsMap = new Map<string, boolean>();
  rawPlanets.forEach((p) => retroPlanetsMap.set(p.name, p.isRetrograde));

  // Format Cusps
  const cusps: CuspData[] = rawCusps.map((cuspLon, idx) => {
    const div = getKPDivision(cuspLon);
    return {
      houseNumber: idx + 1,
      longitude: cuspLon,
      formattedDMS: formatDMS(cuspLon),
      signId: div.signId,
      signName: div.signName,
      hindiSignName: div.hindiSignName,
      degreeInSign: div.degreeInSign,
      formattedSignDMS: formatDMS(div.degreeInSign),
      signLord: div.signLord,
      starLord: div.starLord,
      starLordIsRetrograde: retroPlanetsMap.get(div.starLord) || false,
      subLord: div.subLord,
      subSubLord: div.subSubLord,
      occupants: [],
    };
  });

  // Format Planets
  const planets: PlanetPosition[] = rawPlanets.map((p) => {
    const div = getKPDivision(p.longitude);
    const houseOccupied = getOccupiedHouse(p.longitude, rawCusps);
    const meta = PLANET_META[p.name] || { hindiName: p.name, symbol: '•' };

    return {
      id: p.id,
      name: p.name,
      hindiName: meta.hindiName,
      symbol: meta.symbol,
      longitude: p.longitude,
      formattedDMS: formatDMS(p.longitude),
      signId: div.signId,
      signName: div.signName,
      hindiSignName: div.hindiSignName,
      degreeInSign: div.degreeInSign,
      formattedSignDMS: formatDMS(div.degreeInSign),
      signLord: div.signLord,
      isRetrograde: p.isRetrograde,
      nakshatraId: div.nakshatraId,
      nakshatraName: div.nakshatraName,
      hindiNakshatraName: div.hindiNakshatraName,
      nakshatraPada: div.nakshatraPada,
      starLord: div.starLord,
      starLordIsRetrograde: retroPlanetsMap.get(div.starLord) || false,
      subLord: div.subLord,
      subSubLord: div.subSubLord,
      houseOccupied,
    };
  });

  // Assign occupants to Cusps
  planets.forEach((p) => {
    const cusp = cusps.find((c) => c.houseNumber === p.houseOccupied);
    if (cusp) {
      cusp.occupants.push(p.name);
    }
  });

  // Calculate 4-Fold Significators
  const { houseSignificators, planetSignifications } = calculateSignificators(planets, cusps);

  // Ruling Planets
  const moonPlanet = planets.find((p) => p.name === 'Moon') || planets[1];
  const sunPlanet = planets.find((p) => p.name === 'Sun') || planets[0];
  const birthDateObj = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const rulingPlanets = calculateRulingPlanets(rawCusps[0], moonPlanet.longitude, birthDateObj.getUTCDay());

  // Vimshottari Dasha
  const { tree, current } = calculateVimshottariDasha(moonPlanet.longitude, birthDateObj);

  // Pars Fortuna
  // Sun above horizon check: House 7 to House 12 is day, House 1 to 6 is night
  const isDayBirth = sunPlanet.houseOccupied >= 7 && sunPlanet.houseOccupied <= 12;
  const parsFortuna = calculateParsFortuna(rawCusps[0], sunPlanet.longitude, moonPlanet.longitude, isDayBirth, rawCusps);

  // Mathematical Event Checklist & Probability Scores
  const eventChecklist = evaluateEventChecklist(cusps, planets, planetSignifications, current);

  return {
    input,
    calculationTimestamp: new Date().toISOString(),
    julianDay: jd,
    ayanamsaType: input.ayanamsa || 'KP_NEW',
    ayanamsaValue: ayanamsaVal,
    formattedAyanamsa: formatDMS(ayanamsaVal),
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
