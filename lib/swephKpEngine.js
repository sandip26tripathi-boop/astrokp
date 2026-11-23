/**
 * lib/swephKpEngine.js
 * 100% Free, Open-Source & Accurate KP (Krishnamurti Paddhati) Engine
 * Powered by sweph-wasm (Swiss Ephemeris WebAssembly)
 */

import sweph from 'sweph-wasm';

// 1. Vimshottari Lord Orders aur Dasa Years
export const DASA_ORDER = [
  { lord: 'Ketu', years: 7 },
  { lord: 'Venus', years: 20 },
  { lord: 'Sun', years: 6 },
  { lord: 'Moon', years: 10 },
  { lord: 'Mars', years: 7 },
  { lord: 'Rahu', years: 18 },
  { lord: 'Jupiter', years: 16 },
  { lord: 'Saturn', years: 19 },
  { lord: 'Mercury', years: 17 }
];

export const SIGN_LORDS = [
  'Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury',
  'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'
];

export const SIGN_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

export const SIGN_NAMES_HI = [
  'Mesh', 'Vrishabh', 'Mithun', 'Kark', 'Simha', 'Kanya',
  'Tula', 'Vrishchik', 'Dhanu', 'Makar', 'Kumbh', 'Meen'
];

export const NAKSHATRA_NAMES = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

export function formatDMS(deg) {
  const norm = ((deg % 360) + 360) % 360;
  const d = Math.floor(norm);
  const remMinutes = (norm - d) * 60;
  const m = Math.floor(remMinutes);
  const s = Math.round((remMinutes - m) * 60);
  return `${d}° ${m.toString().padStart(2, '0')}' ${s.toString().padStart(2, '0')}"`;
}

// 2. Sub-Lord, Sub-Sub-Lord aur Star Lord Calculation
export function getKpDetails(deg) {
  let longitude = ((deg % 360) + 360) % 360;

  // Sign Lord
  const signIndex = Math.floor(longitude / 30);
  const signName = SIGN_NAMES[signIndex];
  const rashiName = SIGN_NAMES_HI[signIndex];
  const signLord = SIGN_LORDS[signIndex];
  const degInSign = longitude % 30;

  // Star Lord (13° 20' = 13.33333333°)
  const nakshatraSpan = 13 + 20 / 60;
  const nakIndex = Math.floor(longitude / nakshatraSpan);
  const nakName = NAKSHATRA_NAMES[nakIndex];
  const starLord = DASA_ORDER[nakIndex % 9].lord;
  const pada = Math.floor((longitude % nakshatraSpan) / (nakshatraSpan / 4)) + 1;

  // Sub Lord (120-Year Vimshottari Proportion)
  const degInNak = longitude % nakshatraSpan;
  const startLordIndex = nakIndex % 9;
  let accumulated = 0;
  let subLord = starLord;
  let subSpan = (nakshatraSpan * DASA_ORDER[startLordIndex].years) / 120.0;
  let subStart = 0;

  for (let i = 0; i < 9; i++) {
    const currentLord = DASA_ORDER[(startLordIndex + i) % 9];
    const span = (nakshatraSpan * currentLord.years) / 120.0;
    if (degInNak < accumulated + span - 1e-9 || i === 8) {
      subLord = currentLord.lord;
      subStart = accumulated;
      subSpan = span;
      break;
    }
    accumulated += span;
  }

  // Sub-Sub Lord
  const degInSub = degInNak - subStart;
  const subLordIdx = DASA_ORDER.findIndex((d) => d.lord === subLord);
  let accSSL = 0;
  let subSubLord = subLord;

  for (let j = 0; j < 9; j++) {
    const currentSSL = DASA_ORDER[(subLordIdx + j) % 9];
    const sslSpan = (subSpan * currentSSL.years) / 120.0;
    if (degInSub < accSSL + sslSpan - 1e-9 || j === 8) {
      subSubLord = currentSSL.lord;
      break;
    }
    accSSL += sslSpan;
  }

  return {
    longitude,
    totalDegree: longitude,
    dms: formatDMS(longitude),
    sign: signName,
    signName,
    rashiNo: signIndex + 1,
    rashiName,
    signLord,
    degInSign,
    rashiDegree: degInSign.toFixed(4),
    nakshatraNo: nakIndex + 1,
    nakshatraName: nakName,
    pada,
    starLord,
    subLord,
    subSubLord
  };
}

// 3. Bhava Chalit House Placement Helper
export function getOccupiedHouse(planetDeg, cusps12) {
  const normDeg = ((planetDeg % 360) + 360) % 360;
  for (let i = 0; i < 12; i++) {
    const start = cusps12[i];
    const end = cusps12[(i + 1) % 12];
    if (start < end) {
      if (normDeg >= start && normDeg < end) return i + 1;
    } else {
      if (normDeg >= start || normDeg < end) return i + 1;
    }
  }
  return 1;
}

// 4. Main Calculation Function
export async function calculateExactKP(dateStr, timeStr, lat, lon, timezone = 5.5) {
  await sweph.init();

  // Local / IST (UTC+5:30) se Universal Time (UT) nikalna
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, min, sec = 0] = timeStr.split(':').map(Number);
  const tz = typeof timezone === 'number' ? timezone : Number(timezone) || 5.5;
  const utHour = hour + min / 60.0 + sec / 3600.0 - tz;

  // Julian Day UT
  const jd = sweph.julday(year, month, day, utHour, sweph.SE_GREG_CAL);

  // KP New Ayanamsha Set Karna (SE_SIDM_KRISHNAMURTI = 5)
  sweph.set_sid_mode(sweph.SE_SIDM_KRISHNAMURTI, 0, 0);

  // Placidus House Cusps (Nirayana KP Cusps)
  // 'P' = Placidus
  const houses = sweph.houses_ex(jd, sweph.SEFLG_SIDEREAL, lat, lon, 'P');
  const cuspsData = {};
  const cuspsList = [];
  const rawCusps12 = [];

  for (let i = 1; i <= 12; i++) {
    const cuspDeg = houses.cusps[i];
    rawCusps12.push(cuspDeg);
    const details = getKpDetails(cuspDeg);
    details.houseNumber = i;
    cuspsData[`Cusp_${i}`] = details;
    cuspsList.push(details);
  }

  // Ascendant (Lagna) details
  const ascDetails = getKpDetails(houses.ascendant);

  // 9 Graha Calculation (Sidereal KP)
  const planets = [
    { name: 'Sun', key: 'Surya', id: sweph.SE_SUN },
    { name: 'Moon', key: 'Chandra', id: sweph.SE_MOON },
    { name: 'Mars', key: 'Mangal', id: sweph.SE_MARS },
    { name: 'Mercury', key: 'Budh', id: sweph.SE_MERCURY },
    { name: 'Jupiter', key: 'Guru', id: sweph.SE_JUPITER },
    { name: 'Venus', key: 'Shukra', id: sweph.SE_VENUS },
    { name: 'Saturn', key: 'Shani', id: sweph.SE_SATURN },
    { name: 'Rahu', key: 'Rahu', id: sweph.SE_TRUE_NODE } // True Node for KP
  ];

  const planetsData = {};
  const flag = sweph.SEFLG_SIDEREAL | sweph.SEFLG_SPEED;

  for (let p of planets) {
    const body = sweph.calc_ut(jd, p.id, flag);
    const details = getKpDetails(body.longitude);
    // Rahu & Ketu are naturally always retrograde in astrology, so do not label them retrograde
    details.isRetrograde = p.name === 'Rahu' ? false : (body.longitudeSpeed < 0);
    details.speedPerDay = body.longitudeSpeed;
    details.houseOccupied = getOccupiedHouse(body.longitude, rawCusps12);
    details.planetEn = p.name;
    planetsData[p.name] = details;
    // Map hindi keys also for backwards compatibility
    planetsData[p.key] = details;
  }

  // Ketu (Rahu se 180° opposite)
  const ketuDeg = (planetsData['Rahu'].longitude + 180) % 360;
  const ketuDetails = getKpDetails(ketuDeg);
  // Ketu is naturally always retrograde, do not label retrograde
  ketuDetails.isRetrograde = false;
  ketuDetails.speedPerDay = planetsData['Rahu'].speedPerDay;
  ketuDetails.houseOccupied = getOccupiedHouse(ketuDeg, rawCusps12);
  ketuDetails.planetEn = 'Ketu';
  planetsData['Ketu'] = ketuDetails;

  return {
    engine: 'sweph-wasm',
    jd,
    ascendant: ascDetails,
    lagna: ascDetails,
    cusps: cuspsData,
    cuspsList,
    cuspsDetail: cuspsList,
    planets: planetsData
  };
}

export async function calculateSwephKPChart(params) {
  let dateStr = '';
  let timeStr = '';

  if (params.dateStr) {
    dateStr = params.dateStr;
  } else if (params.year && params.month && params.day) {
    dateStr = `${params.year}-${String(params.month).padStart(2, '0')}-${String(params.day).padStart(2, '0')}`;
  } else if (params.date) {
    dateStr = params.date;
  } else {
    dateStr = '1977-07-26';
  }

  if (params.timeStr) {
    timeStr = params.timeStr;
  } else if (params.hour !== undefined) {
    timeStr = `${String(params.hour).padStart(2, '0')}:${String(params.minute || 0).padStart(2, '0')}:${String(params.second || 0).padStart(2, '0')}`;
  } else if (params.time) {
    timeStr = params.time;
  } else {
    timeStr = '12:00:00';
  }

  const lat = Number(params.lat ?? params.latitude ?? 0);
  const lon = Number(params.lon ?? params.longitude ?? 0);
  const timezone = params.timezone !== undefined ? Number(params.timezone) : 5.5;

  const result = await calculateExactKP(dateStr, timeStr, lat, lon, timezone);

  return {
    ...result,
    meta: {
      dateStr,
      timeStr,
      lat,
      lon,
      timezone,
      jd: result.jd
    }
  };
}

export default calculateExactKP;
