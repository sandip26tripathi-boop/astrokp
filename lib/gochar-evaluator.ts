/**
 * lib/gochar-evaluator.ts
 * Real-Time Gochar (Planetary Transit - गोचर) Computation Engine
 * Computes exact sidereal positions of all 9 planets and evaluates
 * their transit impact relative to Natal Moon and Natal Ascendant.
 */

import * as Astronomy from 'astronomy-engine';

export interface TransitPlanetInfo {
  name: string;
  hindiName: string;
  longitude: number;
  formattedDMS: string;
  signId: number; // 1-12
  signName: string;
  hindiSignName: string;
  degreeInSign: number;
  signLord: string;
  isRetrograde: boolean;
  nakshatra: string;
  starLord: string;
  subLord: string;
  houseFromLagna: number; // 1-12 from Natal Ascendant
  houseFromMoon: number; // 1-12 from Natal Moon
  isFavorableFromMoon: boolean;
}

export interface GocharEvaluationResult {
  dateStr: string;
  transitPlanets: TransitPlanetInfo[];
  sadeSati: {
    hasSadeSati: boolean;
    phase: 'none' | 'rising' | 'peak' | 'setting';
    hasDhaiya: boolean;
    dhaiyaType: 'none' | 'kantaka_4th' | 'ashtama_8th';
    summaryEn: string;
    summaryHi: string;
  };
  jupiterTransit: {
    houseFromMoon: number;
    houseFromLagna: number;
    isAuspicious: boolean;
    aspectHousesFromLagna: number[];
    aspectHousesFromMoon: number[];
    summaryEn: string;
    summaryHi: string;
  };
  rahuKetuTransit: {
    rahuHouseFromLagna: number;
    rahuHouseFromMoon: number;
    ketuHouseFromLagna: number;
    ketuHouseFromMoon: number;
    summaryEn: string;
    summaryHi: string;
  };
  doubleTransitHouses: {
    housesFromLagna: number[];
    housesFromMoon: number[];
    summaryEn: string;
    summaryHi: string;
  };
  summaryTextEn: string;
  summaryTextHi: string;
}

const RASHIS_EN = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

const RASHIS_HI = [
  'मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या',
  'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुंभ', 'मीन'
];

const RASHI_LORDS = [
  'Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury',
  'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'
];

const NAKSHATRAS_EN = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

const VIMSHOTTARI_LORDS = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'
];

const VIMSHOTTARI_YEARS = [7, 20, 6, 10, 7, 18, 16, 19, 17];

function formatDMS(deg: number): string {
  const norm = ((deg % 360) + 360) % 360;
  const d = Math.floor(norm);
  const remMinutes = (norm - d) * 60;
  const m = Math.floor(remMinutes);
  const s = Math.round((remMinutes - m) * 60);
  return `${d}° ${m}' ${s}"`;
}

function getSubLord(deg: number): string {
  const norm = ((deg % 360) + 360) % 360;
  const nakTotal = 360 / 27; // 13.33333333°
  const nakIndex = Math.floor(norm / nakTotal);
  const nakDeg = norm % nakTotal;

  const totalYears = 120;
  const nakMinutes = 800;
  const posMinutes = nakDeg * 60;
  const nakLordIndex = nakIndex % 9;

  let subLordIdx = nakLordIndex;
  let accumulated = 0;

  for (let i = 0; i < 9; i++) {
    const currentLordIdx = (nakLordIndex + i) % 9;
    const span = (VIMSHOTTARI_YEARS[currentLordIdx] / totalYears) * nakMinutes;
    accumulated += span;
    if (posMinutes <= accumulated + 1e-7) {
      subLordIdx = currentLordIdx;
      break;
    }
  }
  return VIMSHOTTARI_LORDS[subLordIdx];
}

/**
 * Classical Gochar auspicious house benchmarks from Natal Moon:
 * Sun: 3, 6, 10, 11
 * Moon: 1, 3, 6, 7, 10, 11
 * Mars: 3, 6, 11
 * Mercury: 2, 4, 6, 8, 10, 11
 * Jupiter: 2, 5, 7, 9, 11
 * Venus: 1, 2, 3, 4, 5, 8, 9, 11, 12
 * Saturn: 3, 6, 11
 * Rahu: 3, 6, 10, 11
 * Ketu: 3, 6, 11
 */
function isTransitFavorableFromMoon(planet: string, houseFromMoon: number): boolean {
  switch (planet.toLowerCase()) {
    case 'sun':
      return [3, 6, 10, 11].includes(houseFromMoon);
    case 'moon':
      return [1, 3, 6, 7, 10, 11].includes(houseFromMoon);
    case 'mars':
      return [3, 6, 11].includes(houseFromMoon);
    case 'mercury':
      return [2, 4, 6, 8, 10, 11].includes(houseFromMoon);
    case 'jupiter':
    case 'guru':
      return [2, 5, 7, 9, 11].includes(houseFromMoon);
    case 'venus':
    case 'shukra':
      return [1, 2, 3, 4, 5, 8, 9, 11, 12].includes(houseFromMoon);
    case 'saturn':
    case 'shani':
      return [3, 6, 11].includes(houseFromMoon);
    case 'rahu':
      return [3, 6, 10, 11].includes(houseFromMoon);
    case 'ketu':
      return [3, 6, 11].includes(houseFromMoon);
    default:
      return true;
  }
}

/**
 * Master Gochar evaluation function
 * Evaluates live planetary transit relative to natal Lagna sign and natal Moon sign.
 */
export function evaluateGochar(
  natalLagnaSignId: number = 1, // 1=Aries ... 12=Pisces
  natalMoonSignId: number = 1,
  targetDate: Date = new Date()
): GocharEvaluationResult {
  const dateStr = targetDate.toISOString().slice(0, 10);
  const time = Astronomy.MakeTime(targetDate);
  const t = time.ut / 36525.0; // Centuries from J2000.0

  // High-precision KP New Ayanamsha
  const ayan = 23.75637017 + (5023.88475 * t) / 3600.0 + (1.1116 * t * t) / 3600.0;

  const bodies = [
    { name: 'Jupiter', hi: 'गुरु / बृहस्पति', body: Astronomy.Body.Jupiter },
    { name: 'Saturn', hi: 'शनि', body: Astronomy.Body.Saturn },
    { name: 'Rahu', hi: 'राहु', body: null },
    { name: 'Ketu', hi: 'केतु', body: null },
    { name: 'Mars', hi: 'मंगल', body: Astronomy.Body.Mars },
    { name: 'Sun', hi: 'सूर्य', body: Astronomy.Body.Sun },
    { name: 'Moon', hi: 'चन्द्र', body: Astronomy.Body.Moon },
    { name: 'Mercury', hi: 'बुध', body: Astronomy.Body.Mercury },
    { name: 'Venus', hi: 'शुक्र', body: Astronomy.Body.Venus },
  ];

  const timePlus1h = time.AddDays(1 / 24);

  // Mean Lunar Node (Rahu/Ketu)
  const meanRahuTropical = 125.04452 - 1934.136261 * t + 0.0020708 * t * t;
  const rahuSidereal = ((meanRahuTropical - ayan) % 360 + 360) % 360;
  const ketuSidereal = (rahuSidereal + 180) % 360;

  const transitPlanets: TransitPlanetInfo[] = [];

  for (const item of bodies) {
    let siderealDeg = 0;
    let isRetro = false;

    if (item.name === 'Rahu') {
      siderealDeg = rahuSidereal;
      isRetro = false;
    } else if (item.name === 'Ketu') {
      siderealDeg = ketuSidereal;
      isRetro = false;
    } else if (item.body !== null) {
      const gv1 = Astronomy.GeoVector(item.body, time, true);
      const ecl1 = Astronomy.Ecliptic(gv1);
      siderealDeg = ((ecl1.elon - ayan) % 360 + 360) % 360;

      // Retrograde check (+1 hour)
      const gv2 = Astronomy.GeoVector(item.body, timePlus1h, true);
      const ecl2 = Astronomy.Ecliptic(gv2);
      let diff = ecl2.elon - ecl1.elon;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      isRetro = diff < 0;
    }

    const signIdx = Math.floor(siderealDeg / 30);
    const signId = signIdx + 1;
    const nakIdx = Math.floor(siderealDeg / (360 / 27));
    const starLord = VIMSHOTTARI_LORDS[nakIdx % 9];
    const subLord = getSubLord(siderealDeg);

    // Compute house relative to natal Lagna and natal Moon
    const houseFromLagna = ((signId - natalLagnaSignId + 12) % 12) + 1;
    const houseFromMoon = ((signId - natalMoonSignId + 12) % 12) + 1;
    const isFavorable = isTransitFavorableFromMoon(item.name, houseFromMoon);

    transitPlanets.push({
      name: item.name,
      hindiName: item.hi,
      longitude: siderealDeg,
      formattedDMS: formatDMS(siderealDeg),
      signId,
      signName: RASHIS_EN[signIdx],
      hindiSignName: RASHIS_HI[signIdx],
      degreeInSign: siderealDeg % 30,
      signLord: RASHI_LORDS[signIdx],
      isRetrograde: isRetro,
      nakshatra: NAKSHATRAS_EN[nakIdx],
      starLord,
      subLord,
      houseFromLagna,
      houseFromMoon,
      isFavorableFromMoon: isFavorable,
    });
  }

  // 1. Shani Gochar (Saturn Transit) & Sade Sati Evaluation
  const saturn = transitPlanets.find((p) => p.name === 'Saturn')!;
  const saturnHouseFromMoon = saturn.houseFromMoon;
  let hasSadeSati = false;
  let phase: 'none' | 'rising' | 'peak' | 'setting' = 'none';
  let hasDhaiya = false;
  let dhaiyaType: 'none' | 'kantaka_4th' | 'ashtama_8th' = 'none';

  if (saturnHouseFromMoon === 12) {
    hasSadeSati = true;
    phase = 'rising';
  } else if (saturnHouseFromMoon === 1) {
    hasSadeSati = true;
    phase = 'peak';
  } else if (saturnHouseFromMoon === 2) {
    hasSadeSati = true;
    phase = 'setting';
  } else if (saturnHouseFromMoon === 4) {
    hasDhaiya = true;
    dhaiyaType = 'kantaka_4th';
  } else if (saturnHouseFromMoon === 8) {
    hasDhaiya = true;
    dhaiyaType = 'ashtama_8th';
  }

  const sadeSatiSummaryEn = hasSadeSati
    ? `Currently under Saturn's Sade Sati (${phase.toUpperCase()} phase). Transiting ${saturn.signName} (${saturnHouseFromMoon}th from Natal Moon). Requires patience, disciplined routine, and karmic integrity.`
    : hasDhaiya
    ? `Currently under Saturn's Dhaiya (${dhaiyaType === 'ashtama_8th' ? '8th House Ashtama Dhaiya - requires care in health & sudden decisions' : '4th House Kantaka Dhaiya - domestic & workplace transformations'}).`
    : `Free from Saturn's Sade Sati and Dhaiya. Saturn is transiting ${saturn.signName} (${saturnHouseFromMoon}th house from Natal Moon, ${saturn.houseFromLagna}th from Lagna).`;

  const sadeSatiSummaryHi = hasSadeSati
    ? `जातक वर्तमान में शनि की साढ़े साती के ${phase === 'rising' ? 'प्रथम (आरंभिक)' : phase === 'peak' ? 'द्वितीय (शिखर)' : 'तृतीय (अंतिम)'} चरण में है। शनि गोचर में ${saturn.hindiSignName} राशि (चन्द्र राशि से ${saturnHouseFromMoon}वें भाव) में भ्रमणशील है। धैर्य, संयम और अनुशासन आवश्यक है।`
    : hasDhaiya
    ? `जातक पर वर्तमान में शनि की ${dhaiyaType === 'ashtama_8th' ? 'अष्टम ढैय्या (८वां भाव - स्वास्थ्य व अचानक बदलावों में सतर्कता)' : 'चतुर्थ ढैय्या / कंटक शनि (४था भाव - कार्य व स्थान परिवर्तन)'} का प्रभाव है।`
    : `जातक वर्तमान में शनि की साढ़े साती एवं ढैय्या के नकारात्मक प्रभाव से पूर्णतः मुक्त है। शनि गोचर में ${saturn.hindiSignName} राशि (चन्द्र राशि से ${saturnHouseFromMoon}वें भाव, लग्न से ${saturn.houseFromLagna}वें भाव) में स्थित है।`;

  // 2. Guru Gochar (Jupiter Transit) & Aspects
  const jupiter = transitPlanets.find((p) => p.name === 'Jupiter')!;
  const jupiterAspectsFromLagna = [
    jupiter.houseFromLagna, // 1st (conjunction)
    ((jupiter.houseFromLagna + 4 - 1) % 12) + 1, // 5th aspect
    ((jupiter.houseFromLagna + 6 - 1) % 12) + 1, // 7th aspect
    ((jupiter.houseFromLagna + 8 - 1) % 12) + 1, // 9th aspect
  ];
  const jupiterAspectsFromMoon = [
    jupiter.houseFromMoon,
    ((jupiter.houseFromMoon + 4 - 1) % 12) + 1,
    ((jupiter.houseFromMoon + 6 - 1) % 12) + 1,
    ((jupiter.houseFromMoon + 8 - 1) % 12) + 1,
  ];

  const jupiterSummaryEn = `Transiting Jupiter in ${jupiter.signName} occupies the ${jupiter.houseFromLagna}th house from Lagna and ${jupiter.houseFromMoon}th from Moon (${jupiter.isFavorableFromMoon ? 'Auspicious / Beneficial' : 'Requires spiritual discipline'}). It casts divine 5th, 7th, and 9th trine aspects on houses [${jupiterAspectsFromLagna.slice(1).join(', ')}] from Lagna.`;

  const jupiterSummaryHi = `गोचर में देवगुरु बृहस्पति ${jupiter.hindiSignName} राशि में स्थित हैं, जो लग्न से ${jupiter.houseFromLagna}वें भाव एवं चन्द्र राशि से ${jupiter.houseFromMoon}वें भाव में हैं (${jupiter.isFavorableFromMoon ? 'अत्यंत शुभ व फलदायी' : 'सामान्य फलदायी'})। गुरु की अमृतमयी ५वीं, ७वीं व ९वीं दृष्टियां लग्न से [${jupiterAspectsFromLagna.slice(1).join(', ')}] भावों को शक्ति प्रदान कर रही हैं।`;

  // 3. Rahu & Ketu Transit
  const rahu = transitPlanets.find((p) => p.name === 'Rahu')!;
  const ketu = transitPlanets.find((p) => p.name === 'Ketu')!;

  const rahuKetuSummaryEn = `Rahu transits ${rahu.signName} (House ${rahu.houseFromLagna} from Lagna, ${rahu.houseFromMoon} from Moon). Ketu transits ${ketu.signName} (House ${ketu.houseFromLagna} from Lagna, ${ketu.houseFromMoon} from Moon). Highlights sudden transformations, overseas connections, and karmic shifts.`;

  const rahuKetuSummaryHi = `राहु गोचर में ${rahu.hindiSignName} राशि (लग्न से ${rahu.houseFromLagna}वां, चन्द्र से ${rahu.houseFromMoon}वां भाव) तथा केतु ${ketu.hindiSignName} राशि (लग्न से ${ketu.houseFromLagna}वां, चन्द्र से ${ketu.houseFromMoon}वां भाव) में अक्ष बना रहे हैं। यह स्थिति अचानक बदलाव, बौद्धिक ऊर्जा और कर्मिक शुद्धि का संकेत करती है।`;

  // 4. Double Transit (द्वि-गोचर सिद्धांत)
  // Houses receiving joint influence of Saturn & Jupiter from Lagna
  const saturnAspectsFromLagna = [
    saturn.houseFromLagna, // 1st (conjunction)
    ((saturn.houseFromLagna + 2 - 1) % 12) + 1, // 3rd aspect
    ((saturn.houseFromLagna + 6 - 1) % 12) + 1, // 7th aspect
    ((saturn.houseFromLagna + 9 - 1) % 12) + 1, // 10th aspect
  ];

  const doubleTransitHousesFromLagna = jupiterAspectsFromLagna.filter((h) =>
    saturnAspectsFromLagna.includes(h)
  );

  const doubleTransitSummaryEn =
    doubleTransitHousesFromLagna.length > 0
      ? `Double Transit Activation: Houses [${doubleTransitHousesFromLagna.join(
          ', '
        )}] from Lagna are jointly activated by both Jupiter and Saturn. Major life breakthroughs, materialization of events, and lasting changes occur in these areas.`
      : `Jupiter and Saturn are operating on independent house axes, creating balanced, phased developments.`;

  const doubleTransitSummaryHi =
    doubleTransitHousesFromLagna.length > 0
      ? `द्वि-गोचर सिद्धांत (Double Transit Activation): लग्न से भाव [${doubleTransitHousesFromLagna.join(
          ', '
        )}] पर देवगुरु बृहस्पति एवं कर्मफलदाता शनि दोनों का संयुक्त प्रभाव सक्रिय है। इन्हीं भावों से संबंधित जीवन के बड़े निर्णय व शुभ परिणाम घटित होते हैं।`
      : `गुरु एवं शनि स्वतंत्र भावों को सक्रिय कर रहे हैं, जिससे संतुलित और क्रमिक प्रगति होगी।`;

  // Format Overall Structured Text for Context Injection
  const summaryLinesEn = [
    `=== LIVE PLANETARY TRANSIT (GOCHAR ANALYSIS - DATE: ${dateStr}) ===`,
    `• Saturn (Shani Gochar): ${saturn.signName} (${saturn.degreeInSign.toFixed(1)}°), Star Lord: ${saturn.starLord}, Sub Lord: ${saturn.subLord}${saturn.isRetrograde ? ' [RETROGRADE]' : ''} | ${saturn.houseFromLagna}th from Lagna, ${saturn.houseFromMoon}th from Moon.`,
    `  ↳ Sade Sati/Dhaiya Verdict: ${sadeSatiSummaryEn}`,
    `• Jupiter (Guru Gochar): ${jupiter.signName} (${jupiter.degreeInSign.toFixed(1)}°), Star Lord: ${jupiter.starLord}, Sub Lord: ${jupiter.subLord}${jupiter.isRetrograde ? ' [RETROGRADE]' : ''} | ${jupiter.houseFromLagna}th from Lagna, ${jupiter.houseFromMoon}th from Moon.`,
    `  ↳ Jupiter Blessing: ${jupiterSummaryEn}`,
    `• Rahu-Ketu Axis: Rahu in ${rahu.signName} (House ${rahu.houseFromLagna} from Lagna), Ketu in ${ketu.signName} (House ${ketu.houseFromLagna} from Lagna).`,
    `• Mars (Mangal Gochar): ${transitPlanets.find((p) => p.name === 'Mars')?.signName} (${transitPlanets.find((p) => p.name === 'Mars')?.degreeInSign.toFixed(1)}°), House ${transitPlanets.find((p) => p.name === 'Mars')?.houseFromLagna} from Lagna, ${transitPlanets.find((p) => p.name === 'Mars')?.houseFromMoon} from Moon.`,
    `• Sun (Surya Gochar): ${transitPlanets.find((p) => p.name === 'Sun')?.signName} (House ${transitPlanets.find((p) => p.name === 'Sun')?.houseFromLagna} from Lagna).`,
    `• Double Transit: ${doubleTransitSummaryEn}`,
  ];

  const summaryLinesHi = [
    `=== तात्कालिक गोचर विश्लेषण (GOCHAR EVALUATION - दिनांक: ${dateStr}) ===`,
    `• शनि गोचर: ${saturn.hindiSignName} राशि (${saturn.degreeInSign.toFixed(1)}°), नक्षत्र स्वामी: ${saturn.starLord}, उप-स्वामी: ${saturn.subLord}${saturn.isRetrograde ? ' [वक्री]' : ''} | लग्न से ${saturn.houseFromLagna}वां भाव, चन्द्र से ${saturn.houseFromMoon}वां भाव।`,
    `  ↳ साढ़े साती/ढैय्या स्थिति: ${sadeSatiSummaryHi}`,
    `• देवगुरु बृहस्पति गोचर: ${jupiter.hindiSignName} राशि (${jupiter.degreeInSign.toFixed(1)}°), नक्षत्र स्वामी: ${jupiter.starLord}, उप-स्वामी: ${jupiter.subLord}${jupiter.isRetrograde ? ' [वक्री]' : ''} | लग्न से ${jupiter.houseFromLagna}वां भाव, चन्द्र से ${jupiter.houseFromMoon}वां भाव।`,
    `  ↳ गुरु कृपा व दृष्टियां: ${jupiterSummaryHi}`,
    `• राहु-केतु अक्ष: राहु ${rahu.hindiSignName} राशि (लग्न से ${rahu.houseFromLagna}वां भाव), केतु ${ketu.hindiSignName} राशि (लग्न से ${ketu.houseFromLagna}वां भाव)।`,
    `• मंगल गोचर: ${transitPlanets.find((p) => p.name === 'Mars')?.hindiSignName} राशि (लग्न से ${transitPlanets.find((p) => p.name === 'Mars')?.houseFromLagna}वां भाव, चन्द्र से ${transitPlanets.find((p) => p.name === 'Mars')?.houseFromMoon}वां भाव)।`,
    `• सूर्य गोचर: ${transitPlanets.find((p) => p.name === 'Sun')?.hindiSignName} राशि (लग्न से ${transitPlanets.find((p) => p.name === 'Sun')?.houseFromLagna}वां भाव)।`,
    `• द्वि-गोचर फल: ${doubleTransitSummaryHi}`,
  ];

  return {
    dateStr,
    transitPlanets,
    sadeSati: {
      hasSadeSati,
      phase,
      hasDhaiya,
      dhaiyaType,
      summaryEn: sadeSatiSummaryEn,
      summaryHi: sadeSatiSummaryHi,
    },
    jupiterTransit: {
      houseFromMoon: jupiter.houseFromMoon,
      houseFromLagna: jupiter.houseFromLagna,
      isAuspicious: jupiter.isFavorableFromMoon,
      aspectHousesFromLagna: jupiterAspectsFromLagna,
      aspectHousesFromMoon: jupiterAspectsFromMoon,
      summaryEn: jupiterSummaryEn,
      summaryHi: jupiterSummaryHi,
    },
    rahuKetuTransit: {
      rahuHouseFromLagna: rahu.houseFromLagna,
      rahuHouseFromMoon: rahu.houseFromMoon,
      ketuHouseFromLagna: ketu.houseFromLagna,
      ketuHouseFromMoon: ketu.houseFromMoon,
      summaryEn: rahuKetuSummaryEn,
      summaryHi: rahuKetuSummaryHi,
    },
    doubleTransitHouses: {
      housesFromLagna: doubleTransitHousesFromLagna,
      housesFromMoon: [],
      summaryEn: doubleTransitSummaryEn,
      summaryHi: doubleTransitSummaryHi,
    },
    summaryTextEn: summaryLinesEn.join('\n'),
    summaryTextHi: summaryLinesHi.join('\n'),
  };
}
