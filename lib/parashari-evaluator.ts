import { KPMatrix, PlanetPosition } from '@/types/astrology';

export interface ParashariAnalysis {
  lagnaSign: string;
  lagnaLord: string;
  lagnaLordHouse: number;
  moonSign: string;
  moonLord: string;
  sunSign: string;
  kendraHouses: { house: number; planets: string[] }[];
  trikonaHouses: { house: number; planets: string[] }[];
  dusthanaHouses: { house: number; planets: string[] }[];
  yogas: string[];
  keyAspects: string[];
  functionalBenefics: string[];
  functionalMalefics: string[];
  dashaParashariVerdict: string;
}

const SIGN_NAMES = [
  'मेष (Aries)',
  'वृषभ (Taurus)',
  'मिथुन (Gemini)',
  'कर्क (Cancer)',
  'सिंह (Leo)',
  'कन्या (Virgo)',
  'तुला (Libra)',
  'वृश्चिक (Scorpio)',
  'धनु (Sagittarius)',
  'मकर (Capricorn)',
  'कुंभ (Aquarius)',
  'मीन (Pisces)',
];

const SIGN_LORDS: Record<number, string> = {
  1: 'Mars (मंगल)',
  2: 'Venus (शुक्र)',
  3: 'Mercury (बुध)',
  4: 'Moon (चन्द्र)',
  5: 'Sun (सूर्य)',
  6: 'Mercury (बुध)',
  7: 'Venus (शुक्र)',
  8: 'Mars (मंगल)',
  9: 'Jupiter (गुरु)',
  10: 'Saturn (शनि)',
  11: 'Saturn (शनि)',
  12: 'Jupiter (गुरु)',
};

export function evaluateParashariKundli(matrix: KPMatrix): ParashariAnalysis {
  const cusps = matrix.cusps || [];
  const planets = matrix.planets || [];
  const ascCusp = cusps[0];
  const ascSignId = ascCusp?.signId || 3; // Default Gemini if missing

  const lagnaSign = SIGN_NAMES[ascSignId - 1] || 'मिथुन (Gemini)';
  const lagnaLord = SIGN_LORDS[ascSignId] || 'Mercury (बुध)';

  // Calculate D1 (Rashi) house for each planet:
  // Formula: D1 House = ((Planet Sign ID - Lagna Sign ID + 12) % 12) + 1
  const planetsWithD1House = planets.map((p) => {
    const d1House = ((p.signId - ascSignId + 12) % 12) + 1;
    return {
      ...p,
      d1House,
    };
  });

  const getPlanetsInD1House = (h: number): string[] => {
    return planetsWithD1House.filter((p) => p.d1House === h).map((p) => p.name);
  };

  const lagneshObj = planetsWithD1House.find((p) => {
    const lLordName = lagnaLord.toLowerCase();
    const pName = p.name.toLowerCase();
    return lLordName.includes(pName);
  });
  const lagnaLordHouse = lagneshObj ? lagneshObj.d1House : 1;

  const moonObj = planetsWithD1House.find((p) => p.name.toLowerCase() === 'moon');
  const moonSign = moonObj ? SIGN_NAMES[moonObj.signId - 1] : 'अज्ञात';
  const moonLord = moonObj ? SIGN_LORDS[moonObj.signId] : 'अज्ञात';

  const sunObj = planetsWithD1House.find((p) => p.name.toLowerCase() === 'sun');
  const sunSign = sunObj ? SIGN_NAMES[sunObj.signId - 1] : 'अज्ञात';

  // Kendra (1, 4, 7, 10)
  const kendraHouses = [1, 4, 7, 10].map((h) => ({
    house: h,
    planets: getPlanetsInD1House(h),
  }));

  // Trikona (1, 5, 9)
  const trikonaHouses = [1, 5, 9].map((h) => ({
    house: h,
    planets: getPlanetsInD1House(h),
  }));

  // Dusthana (6, 8, 12)
  const dusthanaHouses = [6, 8, 12].map((h) => ({
    house: h,
    planets: getPlanetsInD1House(h),
  }));

  // Detect Parashari Yogas
  const yogas: string[] = [];

  // 1. Budhaditya Yoga (Sun + Mercury in same house)
  if (sunObj && lagneshObj && sunObj.d1House === lagneshObj.d1House) {
    yogas.push(`बुधादित्य योग (${sunObj.d1House}वें भाव में सूर्य-बुध की युति - तीक्ष्ण बुद्धि व ख्याति)`);
  }

  // 2. Gajakesari Yoga (Moon & Jupiter in mutual Kendra: distance 0, 3, 6, 9 houses)
  const jupObj = planetsWithD1House.find((p) => p.name.toLowerCase() === 'jupiter');
  if (moonObj && jupObj) {
    const dist = ((jupObj.d1House - moonObj.d1House + 12) % 12) + 1;
    if (dist === 1 || dist === 4 || dist === 7 || dist === 10) {
      yogas.push(`गजकेसरी योग (गुरु-चन्द्र का केन्द्र संबंध - ज्ञान, प्रतिष्ठा व दीर्घकालिक समृद्धि)`);
    }
  }

  // 3. Chandra-Mangal Yoga
  const marsObj = planetsWithD1House.find((p) => p.name.toLowerCase() === 'mars');
  if (moonObj && marsObj && moonObj.d1House === marsObj.d1House) {
    yogas.push(`चन्द्र-मंगल योग (${moonObj.d1House}वें भाव में युति - धन उपार्जन व तीव्र इच्छाशक्ति)`);
  }

  // 4. Guru-Mangal Yoga
  if (jupObj && marsObj && (jupObj.d1House === marsObj.d1House || Math.abs(jupObj.d1House - marsObj.d1House) === 6)) {
    yogas.push(`गुरु-मंगल योग (साहस, धर्मनिष्ठा एवं कार्यकुशलता)`);
  }

  // 5. Ruchaka / Bhadra / Hamsa / Malavya / Sasa (Pancha Mahapurusha Yogas)
  const satObj = planetsWithD1House.find((p) => p.name.toLowerCase() === 'saturn');
  if (satObj && [1, 4, 7, 10].includes(satObj.d1House) && [10, 11, 7].includes(satObj.signId)) {
    yogas.push(`शश महापुरुष योग (शनि का केन्द्र में स्वराशि/उच्च - कर्मठता, संगठन शक्ति व दीर्घायु)`);
  }

  // Detect key Parashari aspects
  const keyAspects: string[] = [];
  if (jupObj) {
    const asp5 = ((jupObj.d1House + 4 - 1) % 12) + 1;
    const asp7 = ((jupObj.d1House + 6 - 1) % 12) + 1;
    const asp9 = ((jupObj.d1House + 8 - 1) % 12) + 1;
    keyAspects.push(`गुरु की ५वीं दृष्टि ${asp5}वें भाव पर, ७वीं दृष्टि ${asp7}वें भाव पर, ९वीं दृष्टि ${asp9}वें भाव पर (अमृत समान शुभ दृष्टि)`);
  }
  if (satObj) {
    const asp3 = ((satObj.d1House + 2 - 1) % 12) + 1;
    const asp7 = ((satObj.d1House + 6 - 1) % 12) + 1;
    const asp10 = ((satObj.d1House + 9 - 1) % 12) + 1;
    keyAspects.push(`शनि की ३री दृष्टि ${asp3}वें भाव पर, ७वीं दृष्टि ${asp7}वें भाव पर, १०वीं दृष्टि ${asp10}वें भाव पर (परिश्रम व अनुशासन)`);
  }
  if (marsObj) {
    const asp4 = ((marsObj.d1House + 3 - 1) % 12) + 1;
    const asp7 = ((marsObj.d1House + 6 - 1) % 12) + 1;
    const asp8 = ((marsObj.d1House + 7 - 1) % 12) + 1;
    keyAspects.push(`मंगल की ४थी दृष्टि ${asp4}वें भाव पर, ७वीं दृष्टि ${asp7}वें भाव पर, ८वीं दृष्टि ${asp8}वें भाव पर (ऊर्जा व तीव्रता)`);
  }

  // Functional Benefics & Malefics for Lagna
  // (Parashari Lagna lordship principles)
  let functionalBenefics: string[] = [];
  let functionalMalefics: string[] = [];

  switch (ascSignId) {
    case 3: // Gemini (मिथुन)
      functionalBenefics = ['Mercury (लग्नेश)', 'Venus (पंचमेश)', 'Saturn (नवमेश - भाग्येश)'];
      functionalMalefics = ['Mars (६ठे व ११वें का स्वामी)', 'Jupiter (केन्द्राधिपति दोष)'];
      break;
    case 1: // Aries
      functionalBenefics = ['Mars (लग्नेश)', 'Sun (पंचमेश)', 'Jupiter (भाग्येश)'];
      functionalMalefics = ['Mercury (३रे व ६ठे का स्वामी)', 'Saturn'];
      break;
    case 2: // Taurus
      functionalBenefics = ['Venus (लग्नेश)', 'Saturn (योगकारक - ९वें व १०वें का स्वामी)', 'Mercury (द्वितीयेश व पंचमेश)'];
      functionalMalefics = ['Jupiter (८वें व ११वें का स्वामी)'];
      break;
    case 4: // Cancer
      functionalBenefics = ['Moon (लग्नेश)', 'Mars (योगकारक - ५वें व १०वें का स्वामी)', 'Jupiter (भाग्येश)'];
      functionalMalefics = ['Mercury', 'Venus'];
      break;
    case 5: // Leo
      functionalBenefics = ['Sun (लग्नेश)', 'Mars (योगकारक - ४थे व ९वें का स्वामी)', 'Jupiter (पंचमेश)'];
      functionalMalefics = ['Saturn', 'Venus'];
      break;
    case 6: // Virgo
      functionalBenefics = ['Mercury (लग्नेश)', 'Venus (भाग्येश)', 'Saturn (पंचमेश)'];
      functionalMalefics = ['Mars', 'Jupiter'];
      break;
    case 7: // Libra
      functionalBenefics = ['Venus (लग्नेश)', 'Saturn (योगकारक - ४थे व ५वें का स्वामी)', 'Mercury (भाग्येश)'];
      functionalMalefics = ['Jupiter', 'Mars'];
      break;
    case 8: // Scorpio
      functionalBenefics = ['Mars (लग्नेश)', 'Jupiter (पंचमेश व द्वितीयेश)', 'Moon (भाग्येश)'];
      functionalMalefics = ['Mercury', 'Venus'];
      break;
    case 9: // Sagittarius
      functionalBenefics = ['Jupiter (लग्नेश)', 'Mars (पंचमेश)', 'Sun (भाग्येश)'];
      functionalMalefics = ['Venus', 'Mercury'];
      break;
    case 10: // Capricorn
      functionalBenefics = ['Saturn (लग्नेश)', 'Venus (योगकारक - ५वें व १०वें का स्वामी)', 'Mercury (भाग्येश)'];
      functionalMalefics = ['Mars', 'Jupiter'];
      break;
    case 11: // Aquarius
      functionalBenefics = ['Saturn (लग्नेश)', 'Venus (भाग्येश व सुखेश)', 'Mercury (पंचमेश)'];
      functionalMalefics = ['Jupiter', 'Moon'];
      break;
    case 12: // Pisces
      functionalBenefics = ['Jupiter (लग्नेश)', 'Moon (पंचमेश)', 'Mars (भाग्येश)'];
      functionalMalefics = ['Venus', 'Saturn', 'Mercury'];
      break;
    default:
      functionalBenefics = ['लग्नेश', 'पंचमेश', 'नवमेश'];
      functionalMalefics = ['षष्ठेश', 'अष्टमेश', 'द्वादशेश'];
  }

  const dashaObj = matrix.currentDasha;
  const currentMaha = typeof dashaObj?.mahadasha === 'object' ? dashaObj?.mahadasha?.planet : String(dashaObj?.mahadasha || 'Saturn');
  const dashaParashariVerdict = `वर्तमान में ${currentMaha} की महादशा चल रही है। इस लग्न के लिए महादशा स्वामी की स्थिति व भाव प्रभाव के अनुसार फल की प्राप्ति होगी।`;

  return {
    lagnaSign,
    lagnaLord,
    lagnaLordHouse,
    moonSign,
    moonLord,
    sunSign,
    kendraHouses,
    trikonaHouses,
    dusthanaHouses,
    yogas,
    keyAspects,
    functionalBenefics,
    functionalMalefics,
    dashaParashariVerdict,
  };
}
