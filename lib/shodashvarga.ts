/**
 * lib/shodashvarga.ts
 * High-Precision Mathematical Computation of the 16 Parashara Divisional Charts (Shodashvarga)
 * D1, D2, D3, D4, D7, D9 (Navamsha), D10 (Dashamsha), D12, D16, D20, D24, D27, D30, D40, D45, D60
 */

export interface DivisionalPlacement {
  signId: number; // 1-12
  signName: string;
  hindiSignName: string;
}

export interface ShodashvargaChart {
  id: string;
  name: string;
  description: string;
  placements: Record<string, DivisionalPlacement>; // Planet name / Ascendant -> DivisionalPlacement
}

const SIGN_NAMES_EN = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

const SIGN_NAMES_HI = [
  'मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या',
  'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुंभ', 'मीन'
];

function wrap12(n: number): number {
  return (((n - 1) % 12) + 12) % 12 + 1;
}

function makePlacement(signId: number): DivisionalPlacement {
  const cleanSign = wrap12(signId);
  return {
    signId: cleanSign,
    signName: SIGN_NAMES_EN[cleanSign - 1],
    hindiSignName: SIGN_NAMES_HI[cleanSign - 1],
  };
}

/**
 * Calculates all 16 divisional sign placements for a single sidereal longitude (0° - 360°)
 */
export function calculateDivisionalPlacements(lonDeg: number): Record<string, DivisionalPlacement> {
  const normLon = ((lonDeg % 360) + 360) % 360;
  const s = Math.floor(normLon / 30) + 1; // Natal sign 1-12
  const deg = normLon % 30; // 0 to 30 deg in sign
  const isOdd = s % 2 !== 0;

  // D1: Rashi
  const d1 = s;

  // D2: Hora (15° each)
  let d2: number;
  if (isOdd) {
    d2 = deg < 15 ? 5 : 4; // Leo (Sun) then Cancer (Moon)
  } else {
    d2 = deg < 15 ? 4 : 5; // Cancer (Moon) then Leo (Sun)
  }

  // D3: Drekkana (10° each)
  let d3: number;
  if (deg < 10) d3 = s;
  else if (deg < 20) d3 = wrap12(s + 4);
  else d3 = wrap12(s + 8);

  // D4: Chaturthamsha (7°30' each)
  const k4 = Math.min(3, Math.floor(deg / 7.5));
  const d4 = wrap12(s + k4 * 3);

  // D7: Saptamsha (30/7° each)
  const k7 = Math.min(6, Math.floor(deg / (30 / 7)));
  const d7 = isOdd ? wrap12(s + k7) : wrap12(s + 6 + k7);

  // D9: Navamsha (3°20' each)
  const k9 = Math.min(8, Math.floor(deg / (30 / 9)));
  let start9 = 1;
  if ([1, 5, 9].includes(s)) start9 = 1; // Fiery -> Aries
  else if ([2, 6, 10].includes(s)) start9 = 10; // Earthy -> Capricorn
  else if ([3, 7, 11].includes(s)) start9 = 7; // Airy -> Libra
  else start9 = 4; // Watery -> Cancer
  const d9 = wrap12(start9 + k9);

  // D10: Dashamsha (3° each)
  const k10 = Math.min(9, Math.floor(deg / 3));
  const d10 = isOdd ? wrap12(s + k10) : wrap12(s + 8 + k10);

  // D12: Dwadashamsha (2°30' each)
  const k12 = Math.min(11, Math.floor(deg / 2.5));
  const d12 = wrap12(s + k12);

  // D16: Shodashamsha (1°52'30" = 1.875° each)
  const k16 = Math.min(15, Math.floor(deg / 1.875));
  let start16 = 1;
  if ([1, 4, 7, 10].includes(s)) start16 = 1; // Movable -> Aries
  else if ([2, 5, 8, 11].includes(s)) start16 = 5; // Fixed -> Leo
  else start16 = 9; // Dual -> Sagittarius
  const d16 = wrap12(start16 + k16);

  // D20: Vimshamsha (1°30' = 1.5° each)
  const k20 = Math.min(19, Math.floor(deg / 1.5));
  let start20 = 1;
  if ([1, 4, 7, 10].includes(s)) start20 = 1;
  else if ([2, 5, 8, 11].includes(s)) start20 = 9;
  else start20 = 5;
  const d20 = wrap12(start20 + k20);

  // D24: Chaturvimshamsha / Siddhamsa (1°15' = 1.25° each)
  const k24 = Math.min(23, Math.floor(deg / 1.25));
  const start24 = isOdd ? 5 : 4;
  const d24 = wrap12(start24 + k24);

  // D27: Saptavimshamsha / Bhamsa (30/27° each)
  const k27 = Math.min(26, Math.floor(deg / (30 / 27)));
  let start27 = 1;
  if ([1, 5, 9].includes(s)) start27 = 1;
  else if ([2, 6, 10].includes(s)) start27 = 4;
  else if ([3, 7, 11].includes(s)) start27 = 7;
  else start27 = 10;
  const d27 = wrap12(start27 + k27);

  // D30: Trishamsha (unequal Parashara divisions)
  let d30: number;
  if (isOdd) {
    if (deg < 5) d30 = 1; // Mars
    else if (deg < 10) d30 = 11; // Saturn
    else if (deg < 18) d30 = 9; // Jupiter
    else if (deg < 25) d30 = 3; // Mercury
    else d30 = 7; // Venus
  } else {
    if (deg < 5) d30 = 2; // Venus
    else if (deg < 12) d30 = 6; // Mercury
    else if (deg < 20) d30 = 12; // Jupiter
    else if (deg < 25) d30 = 10; // Saturn
    else d30 = 8; // Mars
  }

  // D40: Khavedamsha (45' = 0.75° each)
  const k40 = Math.min(39, Math.floor(deg / 0.75));
  const start40 = isOdd ? 1 : 7;
  const d40 = wrap12(start40 + k40);

  // D45: Akshavedamsha (40' = 2/3° each)
  const k45 = Math.min(44, Math.floor(deg / (30 / 45)));
  let start45 = 1;
  if ([1, 4, 7, 10].includes(s)) start45 = 1;
  else if ([2, 5, 8, 11].includes(s)) start45 = 5;
  else start45 = 9;
  const d45 = wrap12(start45 + k45);

  // D60: Shashtiamsha (30' = 0.5° each)
  const k60 = Math.min(59, Math.floor(deg / 0.5));
  const d60 = wrap12(s + k60);

  return {
    D1: makePlacement(d1),
    D2: makePlacement(d2),
    D3: makePlacement(d3),
    D4: makePlacement(d4),
    D7: makePlacement(d7),
    D9: makePlacement(d9),
    D10: makePlacement(d10),
    D12: makePlacement(d12),
    D16: makePlacement(d16),
    D20: makePlacement(d20),
    D24: makePlacement(d24),
    D27: makePlacement(d27),
    D30: makePlacement(d30),
    D40: makePlacement(d40),
    D45: makePlacement(d45),
    D60: makePlacement(d60),
  };
}

/**
 * Builds the complete Shodashvarga 16 charts table for all natal bodies + Ascendant
 */
export function computeShodashvarga(
  bodies: { name: string; longitude: number }[]
): Record<string, ShodashvargaChart> {
  const chartDefinitions: { id: string; name: string; description: string }[] = [
    { id: 'D1', name: 'Rashi', description: 'Physical body, general life, identity' },
    { id: 'D2', name: 'Hora', description: 'Wealth, financial capacity, liquid assets' },
    { id: 'D3', name: 'Drekkana', description: 'Siblings, courage, motivation, third-house matters' },
    { id: 'D4', name: 'Chaturthamsha', description: 'Fixed assets, fortune, home, vehicles' },
    { id: 'D7', name: 'Saptamsha', description: 'Children, progeny, creative lineage' },
    { id: 'D9', name: 'Navamsha', description: 'Spouse, marriage, inner destiny, 9th harmonic strength' },
    { id: 'D10', name: 'Dashamsha', description: 'Career, profession, social status, leadership' },
    { id: 'D12', name: 'Dwadashamsha', description: 'Parents, heritage, past karma' },
    { id: 'D16', name: 'Shodashamsha', description: 'Conveyances, comforts, pleasures and vehicles' },
    { id: 'D20', name: 'Vimshamsha', description: 'Spiritual inclination, upasana, religious devotion' },
    { id: 'D24', name: 'Chaturvimshamsha', description: 'Higher education, learning, intellectual skills' },
    { id: 'D27', name: 'Saptavimshamsha', description: 'General strengths and weaknesses, physical stamina' },
    { id: 'D30', name: 'Trishamsha', description: 'Evils, misfortunes, health vulnerabilities' },
    { id: 'D40', name: 'Khavedamsha', description: 'Auspicious and inauspicious karmic effects' },
    { id: 'D45', name: 'Akshavedamsha', description: 'General well-being, character integrity' },
    { id: 'D60', name: 'Shashtiamsha', description: 'Past life karma, root cause of overall destiny' },
  ];

  const result: Record<string, ShodashvargaChart> = {};

  for (const def of chartDefinitions) {
    result[def.id] = {
      id: def.id,
      name: def.name,
      description: def.description,
      placements: {},
    };
  }

  for (const body of bodies) {
    const divs = calculateDivisionalPlacements(body.longitude);
    for (const [vargaId, placement] of Object.entries(divs)) {
      if (result[vargaId]) {
        result[vargaId].placements[body.name] = placement;
      }
    }
  }

  return result;
}
