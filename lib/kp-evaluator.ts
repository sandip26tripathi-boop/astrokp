import {
  CuspData,
  CurrentDasha,
  EventChecklistItem,
  ParsFortuna,
  PlanetPosition,
  PlanetSignification,
  RulingPlanets,
} from '@/types/astrology';
import { formatDMS, getKPDivision, PLANET_META } from './kp-calculator';
import { AstroTime, SiderealTime, Body, GeoVector, Ecliptic } from 'astronomy-engine';

// Normalize 0-360 degrees
function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

// Calculate Pars Fortuna
export function calculateParsFortuna(
  ascLon: number,
  sunLon: number,
  moonLon: number,
  isDayBirth: boolean,
  cusps: number[]
): ParsFortuna {
  let fortunaLon = 0;
  if (isDayBirth) {
    // Day Birth: Ascendant + Moon - Sun
    fortunaLon = norm360(ascLon + moonLon - sunLon);
  } else {
    // Night Birth: Ascendant + Sun - Moon
    fortunaLon = norm360(ascLon + sunLon - moonLon);
  }

  const div = getKPDivision(fortunaLon);

  // House occupied in Placidus Bhava Chalit
  let houseOccupied = 1;
  for (let i = 0; i < 12; i++) {
    const start = cusps[i];
    const end = cusps[(i + 1) % 12];
    if (end > start) {
      if (fortunaLon >= start && fortunaLon < end) {
        houseOccupied = i + 1;
        break;
      }
    } else {
      if (fortunaLon >= start || fortunaLon < end) {
        houseOccupied = i + 1;
        break;
      }
    }
  }

  return {
    longitude: fortunaLon,
    formattedDMS: formatDMS(fortunaLon),
    signName: div.signName,
    hindiSignName: div.hindiSignName,
    degreeInSign: div.degreeInSign,
    formattedSignDMS: formatDMS(div.degreeInSign),
    signLord: div.signLord,
    starLord: div.starLord,
    subLord: div.subLord,
    houseOccupied,
  };
}

// Planetary Remedies Palette (Color, Donation, Mantra)
export const PLANET_REMEDIES: Record<
  string,
  { color: string; donation: string; mantra: string }
> = {
  Sun: {
    color: 'Ruby Red, Bright Orange, Saffron Gold',
    donation: 'Wheat, jaggery, copper vessel, red flowers to elderly or temple priests on Sunday',
    mantra: 'Om Hram Hreem Hroum Sah Suryaya Namah (ॐ ह्रां ह्रीं ह्रौं सः सूर्याय नमः)',
  },
  Moon: {
    color: 'Pristine White, Pearl, Soft Silver, Cream',
    donation: 'Milk, rice, white sandalwood, silver or water to travelers on Monday',
    mantra: 'Om Shram Shreem Shroum Sah Chandraya Namah (ॐ श्रां श्रीं श्रौं सः चंद्राय नमः)',
  },
  Mars: {
    color: 'Deep Coral, Crimson Red, Scarlet',
    donation: 'Red lentils (masoor dal), red sweets, jaggery to brothers or armed forces on Tuesday',
    mantra: 'Om Kram Kreem Kroum Sah Bhaumaya Namah (ॐ क्रां क्रीं क्रौं सः भौमाय नमः)',
  },
  Mercury: {
    color: 'Emerald Green, Mint, Jade, Leaf Green',
    donation: 'Green gram (moong dal), green stationery, grass to cows, books to students on Wednesday',
    mantra: 'Om Bram Breem Broum Sah Budhaya Namah (ॐ ब्रां ब्रीं ब्रौं सः बुधाय नमः)',
  },
  Jupiter: {
    color: 'Royal Yellow, Golden Amber, Turmeric Gold',
    donation: 'Chana dal, turmeric, yellow sweets, spiritual texts to teachers and saints on Thursday',
    mantra: 'Om Gram Greem Groum Sah Gurave Namah (ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः)',
  },
  Venus: {
    color: 'Silk White, Iridescent Diamond, Soft Pastel Rose',
    donation: 'Rice, sugar, fragrant white perfumes, curd, silk clothing on Friday',
    mantra: 'Om Dram Dreem Droum Sah Shukraya Namah (ॐ द्रां द्रीं द्रौं सः शुक्राय नमः)',
  },
  Saturn: {
    color: 'Cosmic Blue, Charcoal Navy, Dark Sapphire',
    donation: 'Black sesame seeds, mustard oil, dark blankets, footwear to underprivileged on Saturday',
    mantra: 'Om Pram Preem Proum Sah Shanaischaraya Namah (ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः)',
  },
  Rahu: {
    color: 'Smoky Grey, Obsidian, Metallic Steel',
    donation: 'Urad dal, coconut into flowing water, electronic gadgets repair, charity to sweepers',
    mantra: 'Om Bhram Bhreem Bhroum Sah Rahave Namah (ॐ भ्रां भ्रीं भ्रौं सः राहवे नमः)',
  },
  Ketu: {
    color: 'Smoky Brown, Earth Ochre, Multicolored checks',
    donation: 'Warm blankets, feeding stray dogs, donating sesame to spiritual hermits',
    mantra: 'Om Stram Streem Stroum Sah Ketave Namah (ॐ स्रां स्रीं स्रौं सः केतवे नमः)',
  },
};

// Evaluate the full Life Event Checklist using strict KP rules
export function evaluateEventChecklist(
  cusps: CuspData[],
  planets: PlanetPosition[],
  planetSignifications: PlanetSignification[],
  currentDasha: CurrentDasha
): EventChecklistItem[] {
  // Helper to get houses signified by a planet
  const getHousesSignifiedByPlanet = (planetName: string): number[] => {
    const found = planetSignifications.find(
      (p) => p.planetName.toLowerCase() === planetName.toLowerCase()
    );
    return found ? found.housesSignified.all : [];
  };

  const getPlanetObj = (planetName: string): PlanetPosition | undefined => {
    return planets.find((p) => p.name.toLowerCase() === planetName.toLowerCase());
  };

  // Define Life Milestone rules
  const MILESTONE_DEFINITIONS = [
    {
      id: 'career' as const,
      title: 'Career Elevation & Job Success',
      hindiTitle: 'करियर पदोन्नति एवं नौकरी सफलता',
      primaryHouse: 10,
      favorableHouses: [2, 6, 10, 11],
      negatingHouses: [5, 8, 12],
    },
    {
      id: 'marriage' as const,
      title: 'Marriage & Partnership Fulfillment',
      hindiTitle: 'विवाह एवं दांपत्य सुख',
      primaryHouse: 7,
      favorableHouses: [2, 7, 11],
      negatingHouses: [1, 6, 10],
    },
    {
      id: 'wealth' as const,
      title: 'Financial Liquidity & Wealth Surge',
      hindiTitle: 'धन लाभ एवं आर्थिक संचय',
      primaryHouse: 2,
      favorableHouses: [2, 6, 10, 11],
      negatingHouses: [5, 8, 12],
    },
    {
      id: 'property' as const,
      title: 'Property & Real Estate Acquisition',
      hindiTitle: 'भवन, भूमि एवं संपत्ति क्रय योग',
      primaryHouse: 4,
      favorableHouses: [4, 11, 12],
      negatingHouses: [3, 5, 8],
    },
    {
      id: 'foreign' as const,
      title: 'Foreign Travel & PR / Overseas Settlement',
      hindiTitle: 'विदेश यात्रा एवं विदेशी भूमि पर निवास',
      primaryHouse: 12,
      favorableHouses: [3, 9, 12],
      negatingHouses: [4, 11],
    },
    {
      id: 'childbirth' as const,
      title: 'Childbirth & Progeny Expansion',
      hindiTitle: 'संतान प्राप्ति एवं सुख',
      primaryHouse: 5,
      favorableHouses: [2, 5, 11],
      negatingHouses: [1, 4, 10],
    },
    {
      id: 'litigation' as const,
      title: 'Litigation Triumph & Health Recovery',
      hindiTitle: 'न्यायालय विजय एवं रोग मुक्ति',
      primaryHouse: 6,
      favorableHouses: [6, 11],
      negatingHouses: [8, 12],
    },
  ];

  return MILESTONE_DEFINITIONS.map((m) => {
    const cusp = cusps.find((c) => c.houseNumber === m.primaryHouse) || cusps[0];
    const subLordName = cusp.subLord;
    const subLordObj = getPlanetObj(subLordName);

    // Sub-Lord's Star Lord
    const starLordOfSub = subLordObj ? subLordObj.starLord : '';
    const starLordObj = getPlanetObj(starLordOfSub);
    const starLordIsRetro = starLordObj ? starLordObj.isRetrograde : false;

    // Houses signified by the Sub-Lord and its Star Lord
    const signifiedBySub = getHousesSignifiedByPlanet(subLordName);
    const signifiedByStar = starLordOfSub ? getHousesSignifiedByPlanet(starLordOfSub) : [];
    const allSignified = Array.from(new Set([...signifiedBySub, ...signifiedByStar]));

    // Match favorable and negating
    const activatedFavorable = m.favorableHouses.filter((h) => allSignified.includes(h));
    const activatedNegating = m.negatingHouses.filter((h) => allSignified.includes(h));

    // Calculate Mathematical Probability Score (0 - 100%)
    let baseScore = 50;
    // Favorable houses increase score
    baseScore += (activatedFavorable.length / m.favorableHouses.length) * 45;
    // Negating houses decrease score
    baseScore -= (activatedNegating.length / m.negatingHouses.length) * 40;

    // Retrograde Star-Lord penalty: signals reversals/delays
    if (starLordIsRetro) {
      baseScore -= 15;
    }

    // Active Dasha synergy bonus:
    const activeMahaSignifies = getHousesSignifiedByPlanet(currentDasha.mahadasha.planet);
    const dashaFavors = m.favorableHouses.some((h) => activeMahaSignifies.includes(h));
    if (dashaFavors) {
      baseScore += 10;
    }

    const finalScore = Math.max(12, Math.min(96, Math.round(baseScore)));

    // Verdict classification
    let verdict: EventChecklistItem['verdict'] = 'Promising with Effort';
    let hindiVerdict = 'प्रयास से अनुकूल';

    if (finalScore >= 75) {
      verdict = 'Highly Favorable';
      hindiVerdict = 'अत्यंत अनुकूल एवं सुनिश्चित';
    } else if (finalScore >= 55) {
      verdict = 'Promising with Effort';
      hindiVerdict = 'अनुकूल (परिश्रम व सही समय आवश्यक)';
    } else if (finalScore >= 38) {
      verdict = 'Delayed / Obstacles';
      hindiVerdict = 'विलंब एवं विघ्न योग';
    } else {
      verdict = 'Unfavorable / Negated';
      hindiVerdict = 'प्रतिकूल / निषेध योग';
    }

    // Timing Window estimation based on Dasha
    const timingWindow = `Active during ${currentDasha.mahadasha.planet}-${currentDasha.antardasha.planet} period (${new Date(currentDasha.antardasha.endDate).getFullYear()})`;
    const hindiTimingWindow = `${currentDasha.mahadasha.planet}-${currentDasha.antardasha.planet} अवधि में सक्रिय (${new Date(currentDasha.antardasha.endDate).getFullYear()})`;

    // Remedy mapping based on favorable planet
    const favorablePlanet = cusp.signLord || 'Jupiter';
    const remedyData = PLANET_REMEDIES[favorablePlanet] || PLANET_REMEDIES.Jupiter;

    return {
      id: m.id,
      title: m.title,
      hindiTitle: m.hindiTitle,
      primaryHouse: m.primaryHouse,
      cuspSubLord: subLordName,
      cuspStarLord: starLordOfSub,
      starLordIsRetro,
      favorableHouses: m.favorableHouses,
      negatingHouses: m.negatingHouses,
      activatedFavorable,
      activatedNegating,
      probabilityScore: finalScore,
      verdict,
      hindiVerdict,
      timingWindow,
      hindiTimingWindow,
      remedy: {
        color: remedyData.color,
        donation: remedyData.donation,
        mantra: remedyData.mantra,
        favorablePlanet,
      },
    };
  });
}

// Real-time Ruling Planets Calculator for Header HUD with Astronomical Engine
export function getLiveRulingPlanets(
  lat: number = 28.6139,
  lon: number = 77.209,
  timezone: number = 5.5
): RulingPlanets {
  const now = new Date();
  const time = new AstroTime(now);

  const jd = 2451545.0 + time.ut;
  const diffYears = (jd - 2415020.0) / 365.2422;
  const ayanamsa = 22.3755 + (diffYears * 50.2388475) / 3600.0;

  // Exact Greenwich Sidereal Time
  const gmstHours = SiderealTime(time);
  const gmstDeg = norm360(gmstHours * 15.0);
  const lst = norm360(gmstDeg + lon);

  // Obliquity
  const T = time.ut / 36525.0;
  const eps = 23.43929111 - (46.815 * T) / 3600.0 - (0.00059 * T * T) / 3600.0;

  // Ascendant
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
  const ascNirayana = norm360(ascTropical - ayanamsa);

  // Exact Moon position from astronomy-engine
  const moonVec = GeoVector(Body.Moon, time, true);
  const moonEcl = Ecliptic(moonVec);
  const moonNirayana = norm360(moonEcl.elon - ayanamsa);

  const dayLords = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const dayLord = dayLords[now.getDay()];

  const moonDiv = getKPDivision(moonNirayana);
  const lagnaDiv = getKPDivision(ascNirayana);

  return {
    timestamp: now.toISOString(),
    dayLord,
    moonSignLord: moonDiv.signLord,
    moonStarLord: moonDiv.starLord,
    moonSubLord: moonDiv.subLord,
    lagnaSignLord: lagnaDiv.signLord,
    lagnaStarLord: lagnaDiv.starLord,
    lagnaSubLord: lagnaDiv.subLord,
    isRealtime: true,
  };
}
