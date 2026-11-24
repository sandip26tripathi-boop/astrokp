/**
 * lib/ashtakvarga.ts
 * Classical Parashara Ashtakvarga Calculation Engine (Brihat Parashara Hora Shastra)
 * Computes Bhinna Ashtakvarga (BAV) for 7 planets and Sarvashtakvarga (SAV) for all 12 signs/houses.
 * Total universal bindus across 7 planets = 337 points.
 */

export interface AshtakvargaResult {
  bav: Record<string, number[]>; // Planet name -> 12 signs (index 0 = Aries/House 1 to index 11 = Pisces/House 12)
  sav: number[]; // Sarvashtakvarga: total bindus in each of the 12 signs (index 0 = Aries, index 11 = Pisces)
  savByHouse: number[]; // Sarvashtakvarga total bindus in House 1 through House 12 from Natal Ascendant
  houseScores: { houseNumber: number; signId: number; signName: string; bindus: number; category: 'high' | 'average' | 'low' }[];
  totalBindus: number; // 337
}

const SIGN_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

type PlanetName = 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn';

// BPHS Auspicious Bindu Rules from 各 bodies + Lagna
const ASHTAKVARGA_RULES: Record<
  PlanetName,
  Record<PlanetName | 'Lagna', number[]>
> = {
  Sun: {
    Sun: [1, 2, 4, 7, 8, 9, 10, 11],
    Moon: [3, 6, 10, 11],
    Mars: [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [3, 5, 6, 9, 10, 11, 12],
    Jupiter: [5, 6, 9, 11],
    Venus: [6, 7, 12],
    Saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    Lagna: [3, 4, 6, 10, 11, 12],
  },
  Moon: {
    Sun: [3, 6, 7, 8, 10, 11],
    Moon: [1, 3, 6, 7, 10, 11],
    Mars: [2, 3, 5, 6, 9, 10, 11],
    Mercury: [1, 3, 4, 5, 7, 8, 10, 11],
    Jupiter: [1, 4, 7, 8, 10, 11, 12],
    Venus: [3, 4, 5, 7, 9, 10, 11],
    Saturn: [3, 5, 6, 11],
    Lagna: [3, 6, 10, 11],
  },
  Mars: {
    Sun: [3, 5, 6, 10, 11],
    Moon: [3, 6, 11],
    Mars: [1, 2, 4, 7, 8, 10, 11],
    Mercury: [3, 5, 6, 11],
    Jupiter: [6, 10, 11, 12],
    Venus: [6, 8, 11, 12],
    Saturn: [1, 4, 7, 8, 9, 10, 11],
    Lagna: [1, 3, 6, 10, 11],
  },
  Mercury: {
    Sun: [5, 6, 9, 11, 12],
    Moon: [2, 4, 6, 8, 10, 11],
    Mars: [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [1, 3, 5, 6, 9, 10, 11, 12],
    Jupiter: [6, 8, 11, 12],
    Venus: [1, 2, 3, 4, 5, 8, 9, 11],
    Saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    Lagna: [1, 2, 4, 6, 8, 10, 11],
  },
  Jupiter: {
    Sun: [1, 2, 3, 4, 7, 8, 9, 10, 11],
    Moon: [2, 5, 7, 9, 11],
    Mars: [1, 2, 4, 7, 8, 10, 11],
    Mercury: [1, 2, 4, 5, 6, 9, 10, 11],
    Jupiter: [1, 2, 3, 4, 7, 8, 10, 11],
    Venus: [2, 5, 6, 9, 10, 11],
    Saturn: [3, 5, 6, 12],
    Lagna: [1, 2, 4, 5, 6, 7, 9, 10, 11],
  },
  Venus: {
    Sun: [8, 11, 12],
    Moon: [1, 2, 3, 4, 5, 8, 9, 11, 12],
    Mars: [3, 5, 6, 9, 11, 12],
    Mercury: [3, 5, 6, 9, 11],
    Jupiter: [5, 8, 9, 10, 11],
    Venus: [1, 2, 3, 4, 5, 8, 9, 10, 11],
    Saturn: [3, 5, 8, 9, 10, 11],
    Lagna: [1, 2, 3, 4, 5, 8, 9, 11],
  },
  Saturn: {
    Sun: [1, 2, 4, 7, 8, 10, 11],
    Moon: [3, 6, 11],
    Mars: [3, 5, 6, 10, 11, 12],
    Mercury: [6, 8, 9, 10, 11, 12],
    Jupiter: [5, 6, 11, 12],
    Venus: [6, 11, 12],
    Saturn: [3, 5, 6, 11],
    Lagna: [1, 3, 4, 6, 10, 11],
  },
};

/**
 * Calculates complete Ashtakvarga (BAV & SAV)
 * @param planetSigns: object with signId (1-12) for Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn
 * @param ascSignId: signId (1-12) of the Ascendant / Lagna
 */
export function calculateAshtakvarga(
  planetSigns: Record<string, number>,
  ascSignId: number
): AshtakvargaResult {
  const planetList: PlanetName[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const bav: Record<string, number[]> = {};
  const sav = new Array(12).fill(0);

  // Normalize sign to 0-indexed (0 = Aries, 11 = Pisces)
  const signPositions: Record<string, number> = {
    Lagna: ((((ascSignId - 1) % 12) + 12) % 12),
  };

  for (const p of planetList) {
    const rawSign = planetSigns[p] || 1;
    signPositions[p] = ((((rawSign - 1) % 12) + 12) % 12);
  }

  // Calculate BAV for each of the 7 planets
  for (const targetPlanet of planetList) {
    const planetBav = new Array(12).fill(0);
    const rules = ASHTAKVARGA_RULES[targetPlanet];

    for (const [donorBody, houses] of Object.entries(rules)) {
      const donorSign = signPositions[donorBody];
      if (donorSign === undefined) continue;

      for (const house of houses) {
        // house 1 is donorSign itself, house 2 is donorSign + 1, etc.
        const targetSign = (donorSign + (house - 1)) % 12;
        planetBav[targetSign] += 1;
      }
    }

    bav[targetPlanet] = planetBav;

    // Add to SAV
    for (let s = 0; s < 12; s++) {
      sav[s] += planetBav[s];
    }
  }

  // Calculate SAV by House from Lagna (House 1 = Lagna sign, House 2 = Lagna sign + 1...)
  const lagnaSignIdx = signPositions.Lagna;
  const savByHouse = new Array(12).fill(0);
  const houseScores: AshtakvargaResult['houseScores'] = [];

  for (let h = 0; h < 12; h++) {
    const signIdx = (lagnaSignIdx + h) % 12;
    const bindus = sav[signIdx];
    savByHouse[h] = bindus;

    let category: 'high' | 'average' | 'low' = 'average';
    if (bindus >= 30) category = 'high';
    else if (bindus < 25) category = 'low';

    houseScores.push({
      houseNumber: h + 1,
      signId: signIdx + 1,
      signName: SIGN_NAMES[signIdx],
      bindus,
      category,
    });
  }

  const totalBindus = sav.reduce((acc, curr) => acc + curr, 0);

  return {
    bav,
    sav,
    savByHouse,
    houseScores,
    totalBindus,
  };
}
