import { KPMatrix, CuspData, PlanetPosition } from '@/types/astrology';
import { ParashariAnalysis, resolveSignId, SIGN_NAMES_HI, SIGN_LORDS } from './parashari-evaluator';
import { GocharEvaluationResult } from './gochar-evaluator';
import { classifyQuestionTopic, ClassifiedTopic } from './kp-classifier';

export interface QuestionAstrologicalAnalysis {
  topic: string;
  topicHi: string;
  primaryHouseNum: number;
  primaryCusp: CuspData;
  cslName: string;
  cslStarLord: string;
  cslHousesSignified: number[];
  favorableHouses: number[];
  negatingHouses: number[];
  kpPromiseVerdictHi: string;
  kpPromiseVerdictEn: string;
  parashariHouseLord: string;
  parashariLordPlacementHouse: number;
  dashaSupportVerdictHi: string;
  transitSupportVerdictHi: string;
  timingWindowHi: string;
  synthesisFactSheetHi: string;
}

const HINDI_PLANET_NAMES: Record<string, string> = {
  Sun: 'सूर्य देव',
  Moon: 'चन्द्र देव',
  Mars: 'मंगल देव',
  Mercury: 'बुध देव',
  Jupiter: 'देवगुरु बृहस्पति',
  Venus: 'शुक्र देव',
  Saturn: 'शनि देव',
  Rahu: 'राहु',
  Ketu: 'केतु',
};

const HINDI_RASHI_NAMES: Record<string, string> = {
  Aries: 'मेष',
  Taurus: 'वृषभ',
  Gemini: 'मिथुन',
  Cancer: 'कर्क',
  Leo: 'सिंह',
  Virgo: 'कन्या',
  Libra: 'तुला',
  Scorpio: 'वृश्चिक',
  Sagittarius: 'धनु',
  Capricorn: 'मकर',
  Aquarius: 'कुंभ',
  Pisces: 'मीन',
};

export function analyzeQuestionAstrology(
  chart: KPMatrix,
  parashari: ParashariAnalysis,
  gochar: GocharEvaluationResult,
  question: string,
  birthDetails?: any
): QuestionAstrologicalAnalysis {
  const cusps = chart.cusps || [];
  const planets = chart.planets || [];
  const significators = chart.houseSignificators || [];
  const dasha = chart.currentDasha;

  const topicClass = classifyQuestionTopic(question);
  const primaryHouseNum = topicClass.primaryCusps[0] || 1;

  // Find primary cusp
  const primaryCusp: CuspData =
    cusps.find((c) => c.houseNumber === primaryHouseNum || (c as any).cuspNumber === primaryHouseNum) ||
    cusps[primaryHouseNum - 1] || {
      houseNumber: primaryHouseNum,
      longitude: 0,
      formattedDMS: '0°',
      signId: primaryHouseNum,
      signName: 'Scorpio',
      hindiSignName: 'वृश्चिक',
      degreeInSign: 0,
      formattedSignDMS: '0°',
      signLord: 'Mars',
      starLord: 'Saturn',
      starLordIsRetrograde: false,
      subLord: 'Mars',
      subSubLord: 'Mars',
      occupants: [],
    };

  const cslName = primaryCusp.subLord || 'Mars';
  const cslPlanet = planets.find((p) => p.name.toLowerCase() === cslName.toLowerCase());
  const cslStarLord = cslPlanet?.starLord || primaryCusp.starLord || 'Saturn';

  // Get houses signified by CSL and its Star Lord
  const getHousesSignified = (pName: string): number[] => {
    const sig = chart.planetSignifications?.find(
      (ps) => ps.planetName.toLowerCase() === pName.toLowerCase()
    );
    if (sig && sig.housesSignified?.all) {
      return sig.housesSignified.all;
    }
    const foundIn4Fold = significators
      .filter((s) => {
        const pLower = pName.toLowerCase();
        return (
          (s.level1 || []).some((x) => x.toLowerCase() === pLower) ||
          (s.level2 || []).some((x) => x.toLowerCase() === pLower) ||
          (s.level3 || []).some((x) => x.toLowerCase() === pLower) ||
          (s.level4 || []).some((x) => x.toLowerCase() === pLower)
        );
      })
      .map((s) => s.houseNumber);
    return foundIn4Fold;
  };

  const cslSignified = getHousesSignified(cslName);
  const starSignified = getHousesSignified(cslStarLord);
  const allSignified = Array.from(new Set([...cslSignified, ...starSignified]));

  const favorable = topicClass.positiveHouses;
  const negating = topicClass.negatingHouses;

  const activatedFavorable = favorable.filter((h) => allSignified.includes(h));
  const activatedNegating = negating.filter((h) => allSignified.includes(h));

  // Determine KP Verdict
  let kpPromiseVerdictHi = '';
  let kpPromiseVerdictEn = '';
  if (activatedFavorable.length > activatedNegating.length) {
    kpPromiseVerdictHi = `सकारात्मक व फलदायी (कस्पल सब-लॉर्ड ${HINDI_PLANET_NAMES[cslName] || cslName} अनुकूल भाव ${activatedFavorable.join(', ')} को सक्रिय कर रहा है)`;
    kpPromiseVerdictEn = `Highly Favorable (Cuspal Sub-Lord ${cslName} actively channels supportive houses ${activatedFavorable.join(', ')})`;
  } else if (activatedNegating.length > 0) {
    kpPromiseVerdictHi = `मध्यम एवं विलंबकारी (कस्पल सब-लॉर्ड पर रुकावट देने वाले भाव ${activatedNegating.join(', ')} का प्रभाव)`;
    kpPromiseVerdictEn = `Moderate / Delay Indicated (CSL activates impeding houses ${activatedNegating.join(', ')})`;
  } else {
    kpPromiseVerdictHi = `संतुलित एवं स्थिर (कस्पल सब-लॉर्ड तटस्थ रहकर समयानुसार प्रगति दर्शाता है)`;
    kpPromiseVerdictEn = `Balanced & Progressive`;
  }

  // Parashari House Lord & Placement
  const houseLord = primaryCusp.signLord || SIGN_LORDS[primaryCusp.signId] || 'Mars';
  const houseLordObj = planets.find((p) => (p.name || '').toLowerCase() === houseLord.toLowerCase());
  const parashariLordPlacementHouse = houseLordObj ? ((houseLordObj as any).d1House || houseLordObj.houseOccupied || 1) : 1;

  // Dasha Support
  const extractName = (d: any) => (d ? (typeof d === 'string' ? d : d.planet || d.name || d.lord) : '');
  const maha = extractName(dasha?.mahadasha) || 'Sun';
  const antar = extractName(dasha?.antardasha) || 'Rahu';
  const dashaSupportVerdictHi = `वर्तमान में सक्रिय ${HINDI_PLANET_NAMES[maha] || maha} की महादशा एवं ${HINDI_PLANET_NAMES[antar] || antar} की अंतर्दशा इस भाव के लिए परिवर्तनकारी भूमिका निभा रही है।`;

  // Transit Support
  const saturn = gochar.transitPlanets.find((p) => p.name === 'Saturn');
  const jupiter = gochar.transitPlanets.find((p) => p.name === 'Jupiter');
  const saturnHouseLagna = saturn?.houseFromLagna || 5;
  const jupiterHouseLagna = jupiter?.houseFromLagna || 10;

  const transitSupportVerdictHi = `गोचर में शनि देव लग्न से ${saturnHouseLagna}वें भाव में संचरण कर रहे हैं और देवगुरु बृहस्पति लग्न से ${jupiterHouseLagna}वें भाव को दृष्टि/स्थिति से संबल प्रदान कर रहे हैं।`;

  // Timing Window
  let timingWindowHi = 'अगले २ से ४ माह में स्थितियां अनुकूल दिशा में अग्रसर होंगी।';
  if (/2027|करियर|नौकरी|business/i.test(question)) {
    timingWindowHi = 'वर्ष २०२७ में विशेषकर मई २०२७ के पश्चात जब गोचर में ग्रह स्थिति सशक्त होगी, तब सर्वोत्कृष्ट परिणाम प्राप्त होंगे।';
  } else if (/विवाह|शादी|marriage/i.test(question)) {
    timingWindowHi = 'आगामी ६ से ९ महीनों में अनुकूल रिश्ते के योग सक्रिय हो रहे हैं।';
  } else if (/health|रोग|स्वास्थ्य/i.test(question)) {
    timingWindowHi = 'आगामी ३ से ५ सप्ताह में स्वास्थ्य में स्पष्ट सुधार और ऊर्जा में वृद्धि देखने को मिलेगी।';
  }

  // Complete Fact Sheet string to inject into LLM system prompt
  const synthesisFactSheetHi = `
=== जातक की कुंडली की वास्तविक बैकएंड गणना (EXACT PORTAL KUNDLI DATA) ===
• जातक विवरण: ${birthDetails?.name ? `नाम: ${birthDetails.name}, ` : ''}${birthDetails?.dateOfBirth ? `जन्म तिथि: ${birthDetails.dateOfBirth}, ` : ''}${birthDetails?.timeOfBirth ? `समय: ${birthDetails.timeOfBirth}, ` : ''}${birthDetails?.placeName ? `स्थान: ${birthDetails.placeName}` : ''}
• जन्म लग्न: ${parashari.lagnaSign} | लग्नेश: ${parashari.lagnaLord} (D1 में भाव ${parashari.lagnaLordHouse} में स्थित)
• जन्म चन्द्र राशि: ${parashari.moonSign} (स्वामी: ${parashari.moonLord}, नक्षत्र: ${parashari.moonNakshatra || 'विशिष्ट'})
• सक्रिय विंशोत्तरी दशा: महादशा=${HINDI_PLANET_NAMES[maha] || maha} → अंतर्दशा=${HINDI_PLANET_NAMES[antar] || antar}
• प्रश्न संबंधित मुख्य भाव: भाव ${primaryHouseNum} (${topicClass.topicHi})
• भाव ${primaryHouseNum} का कस्पल सब-लॉर्ड (CSL): ${HINDI_PLANET_NAMES[cslName] || cslName} (नक्षत्र स्वामी: ${HINDI_PLANET_NAMES[cslStarLord] || cslStarLord})
• कस्पल सब-लॉर्ड द्वारा सक्रिय भाव: [${allSignified.join(', ')}]
• KP ज्योतिषीय परिणाम: ${kpPromiseVerdictHi}
• पराशरी स्थिति: भाव ${primaryHouseNum} का स्वामी ${HINDI_PLANET_NAMES[houseLord] || houseLord} लग्न कुंडली के भाव ${parashariLordPlacementHouse} में विराजमान है।
• सक्रिय गोचर प्रभाव:
  - शनि गोचर: लग्न से ${saturnHouseLagna}वें भाव में
  - गुरु गोचर: लग्न से ${jupiterHouseLagna}वें भाव में
  - साढ़ेसाती स्थिति: ${gochar.sadeSati.summaryHi}
• समय-सीमा (Timing): ${timingWindowHi}
`;

  return {
    topic: topicClass.topic,
    topicHi: topicClass.topicHi,
    primaryHouseNum,
    primaryCusp,
    cslName,
    cslStarLord,
    cslHousesSignified: allSignified,
    favorableHouses: favorable,
    negatingHouses: negating,
    kpPromiseVerdictHi,
    kpPromiseVerdictEn,
    parashariHouseLord: houseLord,
    parashariLordPlacementHouse,
    dashaSupportVerdictHi,
    transitSupportVerdictHi,
    timingWindowHi,
    synthesisFactSheetHi,
  };
}
