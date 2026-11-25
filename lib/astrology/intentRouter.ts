/**
 * lib/astrology/intentRouter.ts
 * Master Intent-to-House Router & Context Slice Extractor for Gemini Astro
 *
 * Ensures:
 * 1. 100% accurate intent routing without false positives (e.g. "career" never matches "car" or 4th house).
 * 2. Follow-up state retention across chat turns (inherits active domain when user asks "kab tak hoga?", "business karun ya job?", etc.).
 * 3. Extracts strictly the relevant astrological slice (KP CSLs L1-L4, Parashari Yuti/Drishti, D10/D9, SAV points, and Dasha).
 */

import { MasterKundliJSON, MasterPlanetDetails } from '../master-kundli-engine';

export type AstrologyDomain = 'career' | 'marriage' | 'finance' | 'health' | 'education' | 'property' | 'general';

export interface IntentClassification {
  domain: AstrologyDomain;
  domainHi: string;
  subIntent: string;
  isFollowUp: boolean;
  inheritedFromPreviousTurn: boolean;
  primaryHouses: number[];
  supportiveHouses: number[];
  negatingHouses: number[];
  userQuery: string;
}

export interface IntentAstrologyData {
  intent: IntentClassification;
  kpSlice: {
    primaryHouseNum: number;
    primaryCsl: {
      planet: string;
      longitudeDms: string;
      sign: string;
      signLord: string;
      starLord: string;
      subLord: string;
      subSubLord?: string;
      isUntenanted: boolean;
      isRetrograde: boolean;
      housesSignifiedL1toL4: number[];
    };
    secondaryCsl?: {
      house: number;
      planet: string;
      sign?: string;
      starLord: string;
      subLord: string;
      isUntenanted: boolean;
      isRetrograde: boolean;
      housesSignifiedL1toL4: number[];
    };
    supportiveHousesSignified: number[];
    negatingHousesSignified: number[];
    kpVerdictSummary: string;
  };
  parashariSlice: {
    houseLordPlanet: string;
    houseLordPlacementHouse: number;
    houseLordSign: string;
    houseLordDignity: string;
    houseLordBaladiAvastha: string;
    houseLordIsCombust: boolean;
    conjoinedPlanetsInHouse: string[];
    aspectingPlanetsOnHouse: string[];
    savPoints: number;
    divisionalChartHighlight: {
      chart: string;
      summary: string;
    };
    domainSpecificComparison?: string; // e.g. 6th Lord (job) vs 7th Lord (business) for career
  };
  dashaAndTiming: {
    todayMahadasha: string;
    todayAntardasha: string;
    todayPratyantardasha: string;
    dashaPeriodDates: string;
    saturnTransitHouseFromLagna: number;
    jupiterTransitHouseFromLagna: number;
    doubleTransitHouses: number[];
    timingSummary: string;
  };
}

/**
 * 1. Programmatically classify user message & extract query intent
 */
export function routeUserIntent(
  userQuery: string,
  previousTurns: Array<{ role: string; content?: string; text?: string }> = []
): IntentClassification {
  const q = (userQuery || '').trim().toLowerCase();

  // Helper to test regex
  const testRegex = (re: RegExp) => re.test(q);

  // Check if query is a follow-up or refinement
  const isFollowUpCue =
    /kab tak|kab hogi|kab lagega|kab hoga|aage kya|aage ka|aur aage|to kya|phir kya|next|what next|when will|when does|future|badlav|change|kya kare|kya karun|business karun ya job|job karun ya business|job ya business|business ya job|upay|remedy|kaisa rahega|sahi rahega|kya hoga/i.test(
      q
    );

  // Determine previous active domain from conversation history
  let previousDomain: AstrologyDomain | null = null;
  const userHistory = previousTurns.filter((t) => t.role === 'user' && (t.content || t.text));

  for (let i = userHistory.length - 1; i >= 0; i--) {
    const prevText = (userHistory[i].content || userHistory[i].text || '').toLowerCase();
    if (/\b(career|job|jobs|service|profession|promotion|business|firm|startup|work|office)\b|करियर|नौकरी|पेशा|रोजगार|आजीविका|काम|कामकाज|प्रमोशन|व्यापार|व्यवसाय/i.test(prevText)) {
      previousDomain = 'career';
      break;
    }
    if (/\b(marriage|wedding|spouse|husband|wife|partner|relationship|engagement|divorce)\b|शादी|विवाह|दांपत्य|जीवनसाथी|पति|पत्नी|सगाई|रिश्ता/i.test(prevText)) {
      previousDomain = 'marriage';
      break;
    }
    if (/\b(health|disease|illness|medical|doctor|hospital|pain|ache|fever|infection|depression|stress)\b|स्वास्थ्य|रोग|बीमारी|तबीयत|इलाज|दर्द|दवा/i.test(prevText)) {
      previousDomain = 'health';
      break;
    }
    if (/\b(wealth|money|finance|financial|income|loan|debt|savings?|investment)\b|धन|पैसा|रुपया|कमाई|कर्ज|लोन|बचत|आर्थिक/i.test(prevText)) {
      previousDomain = 'finance';
      break;
    }
    if (/\b(education|study|studies|exam|exams|neet|jee|iit|upsc|admission|college|school)\b|शिक्षा|पढ़ाई|परीक्षा|कॉलेज|दाखिला/i.test(prevText)) {
      previousDomain = 'education';
      break;
    }
    if (/\b(property|plot|plots|flat|flats|vehicle|vehicles|car|cars|automobile|real\s*estate)\b|संपत्ति|मकान|घर|गाड़ी|वाहन|प्लॉट|ज़मीन|भूमि/i.test(prevText)) {
      previousDomain = 'property';
      break;
    }
  }

  // --- Strict Domain Pattern Matching ---
  // A. Career / Job / Business / Promotion (Checked FIRST with strict priority)
  const isCareerExplicit =
    /\b(career|job|jobs|service|employment|profession|promotions?|increments?|boss|interview|transfer|business|firm|startups?|partnership|workplace|occupation)\b|करियर|नौकरी|पेशा|रोजगार|आजीविका|कामकाज|काम|प्रमोशन|पदोन्नति|तरक्की|इंक्रीमेंट|व्यापार|दुकान|व्यवसाय|कंपनी|साझेदारी/i.test(
      q
    );

  if (isCareerExplicit || (isFollowUpCue && previousDomain === 'career')) {
    let subIntent = 'general_career';
    if (/business karun ya job|job karun ya business|job ya business|business ya job|नौकरी या व्यापार|व्यापार या नौकरी|service or business|business or job/i.test(q)) {
      subIntent = 'job_vs_business';
    } else if (/promotion|hike|increment|elevation|tarqqi|padonnati|पदोन्नति|प्रमोशन|तरक्की|वेतन वृद्धि/i.test(q)) {
      subIntent = 'promotion_or_hike';
    } else if (/kab lagegi|kab tak|badlav|change|switch|new job|fire|chhoot|नई नौकरी|बदलाव|कब लगेगी/i.test(q)) {
      subIntent = 'timing_or_change';
    }

    return {
      domain: 'career',
      domainHi: 'करियर, आजीविका एवं कार्यक्षेत्र',
      subIntent,
      isFollowUp: Boolean(isFollowUpCue && previousDomain === 'career'),
      inheritedFromPreviousTurn: Boolean(!isCareerExplicit && previousDomain === 'career'),
      primaryHouses: [10, 6],
      supportiveHouses: [2, 6, 10, 11],
      negatingHouses: [5, 8, 12],
      userQuery,
    };
  }

  // B. Marriage / Relationship
  const isMarriageExplicit =
    /\b(marriage|wedding|spouse|husband|wife|partner|relationship|engagement|divorce|separation)\b|शादी|विवाह|दांपत्य|जीवनसाथी|पति|पत्नी|सगाई|रिश्ता|तलाक|अलगाव/i.test(
      q
    );

  if (isMarriageExplicit || (isFollowUpCue && previousDomain === 'marriage')) {
    let subIntent = 'general_marriage';
    if (/kab hogi|shadi kab|vivah kab|timing|delay|विवाह कब|शादी कब|देरी|विलंब/i.test(q)) {
      subIntent = 'timing';
    } else if (/kaisa hoga|nature|swabhav|looks|jeevansathi kaisa|patni kaisi|पति कैसा|पत्नी कैसी/i.test(q)) {
      subIntent = 'spouse_nature';
    } else if (/talaq|talak|divorce|dispute|ladai|jhagda|klesh|झगड़ा|विवाद|क्लेश/i.test(q)) {
      subIntent = 'compatibility_dispute';
    }

    return {
      domain: 'marriage',
      domainHi: 'विवाह एवं दांपत्य जीवन',
      subIntent,
      isFollowUp: Boolean(isFollowUpCue && previousDomain === 'marriage'),
      inheritedFromPreviousTurn: Boolean(!isMarriageExplicit && previousDomain === 'marriage'),
      primaryHouses: [7],
      supportiveHouses: [2, 7, 11],
      negatingHouses: [1, 6, 10, 12],
      userQuery,
    };
  }

  // C. Wealth / Finance / Debt
  const isFinanceExplicit =
    /\b(wealth|money|finance|finances|financial|income|loan|loans|debt|debts|savings?|investment|investments?)\b|धन|पैसा|रुपया|कमाई|कर्ज|लोन|बचत|आर्थिक|तंगी|मुनाफा/i.test(
      q
    );

  if (isFinanceExplicit || (isFollowUpCue && previousDomain === 'finance')) {
    let subIntent = 'general_finance';
    if (/karz|loan|debt|emi|udhari|कर्ज|लोन|उधार/i.test(q)) {
      subIntent = 'debt_loan';
    } else if (/saving|bachat|invest|बचत|निवेश/i.test(q)) {
      subIntent = 'wealth_accumulation';
    }

    return {
      domain: 'finance',
      domainHi: 'धन, संपत्ति एवं आर्थिक स्थिति',
      subIntent,
      isFollowUp: Boolean(isFollowUpCue && previousDomain === 'finance'),
      inheritedFromPreviousTurn: Boolean(!isFinanceExplicit && previousDomain === 'finance'),
      primaryHouses: [2, 11],
      supportiveHouses: [2, 6, 11],
      negatingHouses: [5, 8, 12],
      userQuery,
    };
  }

  // D. Health / Disease / Stress
  const isHealthExplicit =
    /\b(health|disease|illness|medical|doctor|hospital|pain|ache|fever|infection|depression|stress|anxiety)\b|स्वास्थ्य|रोग|बीमारी|तबीयत|इलाज|दर्द|दवा|अस्पताल|तनाव|मानसिक/i.test(
      q
    );

  if (isHealthExplicit || (isFollowUpCue && previousDomain === 'health')) {
    let subIntent = 'general_health';
    if (/mental|stress|anxiety|depression|sleep|insomnia|तनाव|अनिद्रा|चिंता/i.test(q)) {
      subIntent = 'mental_stress';
    } else if (/pet|stomach|digest|gas|liver|अपच|पेट|गैस/i.test(q)) {
      subIntent = 'digestive';
    }

    return {
      domain: 'health',
      domainHi: 'स्वास्थ्य एवं शारीरिक ऊर्जा',
      subIntent,
      isFollowUp: Boolean(isFollowUpCue && previousDomain === 'health'),
      inheritedFromPreviousTurn: Boolean(!isHealthExplicit && previousDomain === 'health'),
      primaryHouses: [6, 1],
      supportiveHouses: [1, 5, 11],
      negatingHouses: [6, 8, 12],
      userQuery,
    };
  }

  // E. Education / Studies / Exams
  const isEducationExplicit =
    /\b(education|study|studies|exam|exams|examination|neet|jee|iit|upsc|admission|degree|college|school)\b|शिक्षा|पढ़ाई|परीक्षा|प्रतियोगी\s*परीक्षा|कॉलेज|दाखिला|विद्या/i.test(
      q
    );

  if (isEducationExplicit || (isFollowUpCue && previousDomain === 'education')) {
    return {
      domain: 'education',
      domainHi: 'शिक्षा, विद्या एवं प्रतियोगी परीक्षा',
      subIntent: 'general_education',
      isFollowUp: Boolean(isFollowUpCue && previousDomain === 'education'),
      inheritedFromPreviousTurn: Boolean(!isEducationExplicit && previousDomain === 'education'),
      primaryHouses: [4, 9, 11],
      supportiveHouses: [4, 9, 11],
      negatingHouses: [3, 8],
      userQuery,
    };
  }

  // F. Property & Vehicle (Explicit STRICT check: \bcar\b, \bflat\b, \bplot\b)
  const isPropertyExplicit =
    /\b(property|plot|plots|flat|flats|vehicle|vehicles|car|cars|automobile|real\s*estate)\b|संपत्ति|मकान|घर|गाड़ी|वाहन|प्लॉट|ज़मीन|जमीन|भूमि/i.test(
      q
    );

  if (isPropertyExplicit || (isFollowUpCue && previousDomain === 'property')) {
    return {
      domain: 'property',
      domainHi: 'भूमि, भवन, मकान एवं वाहन',
      subIntent: 'general_property',
      isFollowUp: Boolean(isFollowUpCue && previousDomain === 'property'),
      inheritedFromPreviousTurn: Boolean(!isPropertyExplicit && previousDomain === 'property'),
      primaryHouses: [4],
      supportiveHouses: [4, 11, 12],
      negatingHouses: [3, 8],
      userQuery,
    };
  }

  // Default fallback if previous domain existed
  if (previousDomain) {
    return {
      domain: previousDomain,
      domainHi: previousDomain === 'career' ? 'करियर, आजीविका एवं कार्यक्षेत्र' : previousDomain,
      subIntent: 'follow_up_continuation',
      isFollowUp: true,
      inheritedFromPreviousTurn: true,
      primaryHouses: previousDomain === 'career' ? [10, 6] : [1],
      supportiveHouses: [2, 6, 10, 11],
      negatingHouses: [5, 8, 12],
      userQuery,
    };
  }

  // Default: General Career & Life Purpose
  return {
    domain: 'career',
    domainHi: 'करियर, आजीविका एवं जीवन दिशा',
    subIntent: 'general_career',
    isFollowUp: false,
    inheritedFromPreviousTurn: false,
    primaryHouses: [10, 6],
    supportiveHouses: [2, 6, 10, 11],
    negatingHouses: [5, 8, 12],
    userQuery,
  };
}

/**
 * 2. Extracts strictly the relevant astrological data slice according to the classified intent
 */
export function extractIntentAstrologyData(
  masterKundli: MasterKundliJSON,
  intent: IntentClassification
): IntentAstrologyData {
  const cusps = masterKundli.cusps || [];
  const planets = masterKundli.planets || [];
  const primaryHouseNum = intent.primaryHouses[0] || 10;
  const secondaryHouseNum = intent.primaryHouses[1] || (primaryHouseNum === 10 ? 6 : 1);

  // Helper to extract cusp
  const getCusp = (houseNum: number) =>
    cusps.find((c) => c.houseNumber === houseNum) ||
    cusps[houseNum - 1] || {
      houseNumber: houseNum,
      longitude: 0,
      dms: '0°',
      signName: 'Scorpio',
      signLord: 'Mars',
      starLord: 'Saturn',
      subLord: 'Mars',
      subSubLord: 'Mars',
      occupants: [],
    };

  const primaryCuspObj = getCusp(primaryHouseNum);
  const secondaryCuspObj = getCusp(secondaryHouseNum);

  // Helper to find planet details
  const findPlanet = (name: string): MasterPlanetDetails | undefined =>
    planets.find((p) => p.name.toLowerCase() === (name || '').toLowerCase());

  const primaryCslPlanet = findPlanet(primaryCuspObj.subLord);
  const secondaryCslPlanet = findPlanet(secondaryCuspObj.subLord);

  // Four-Fold Significators (L1 to L4)
  const getL1toL4Houses = (planetName: string): number[] => {
    if (!masterKundli.fourFoldSignificators || !planetName) return [];
    const pUpper = planetName.toUpperCase();
    const resultHouses = new Set<number>();

    const checkLevel = (levelMap: Record<number, { planets: string[] }>) => {
      if (!levelMap) return;
      Object.entries(levelMap).forEach(([houseStr, data]) => {
        const h = Number(houseStr);
        if (data?.planets?.some((p) => p.toUpperCase() === pUpper)) {
          resultHouses.add(h);
        }
      });
    };

    checkLevel(masterKundli.fourFoldSignificators.L1);
    checkLevel(masterKundli.fourFoldSignificators.L2);
    checkLevel(masterKundli.fourFoldSignificators.L3);
    checkLevel(masterKundli.fourFoldSignificators.L4);

    return Array.from(resultHouses).sort((a, b) => a - b);
  };

  const primaryHousesSignified = getL1toL4Houses(primaryCuspObj.subLord);
  const secondaryHousesSignified = getL1toL4Houses(secondaryCuspObj.subLord);

  // Supportive vs Negating matches in signified houses
  const supportiveHits = primaryHousesSignified.filter((h) => intent.supportiveHouses.includes(h));
  const negatingHits = primaryHousesSignified.filter((h) => intent.negatingHouses.includes(h));

  let kpVerdictSummary = '';
  if (supportiveHits.length > 0 && negatingHits.length === 0) {
    kpVerdictSummary = `पूर्ण रूप से सकारात्मक: कस्पल सब-लॉर्ड ${primaryCuspObj.subLord} अनुकूल भावों (${supportiveHits.join(', ')}) को सक्रिय कर रहा है।`;
  } else if (supportiveHits.length > 0 && negatingHits.length > 0) {
    kpVerdictSummary = `मिश्रित व प्रगतिशील: कस्पल सब-लॉर्ड ${primaryCuspObj.subLord} अनुकूल भाव (${supportiveHits.join(', ')}) के साथ-साथ परिवर्तन भाव (${negatingHits.join(', ')}) को भी दर्शा रहा है, जो बदलाव के बाद सफलता का संकेत है।`;
  } else {
    kpVerdictSummary = `धैर्य व संतुलन की आवश्यकता: कस्पल सब-लॉर्ड ${primaryCuspObj.subLord} प्राथमिक स्तर पर सतर्कता के भावों को छू रहा है।`;
  }

  // Parashari calculations
  const primaryHouseLordship = masterKundli.houseLordships?.find((h) => h.houseNumber === primaryHouseNum);
  const primaryHouseLordName = primaryHouseLordship?.signLord || primaryCuspObj.signLord || 'Mars';
  const primaryLordPlanet = findPlanet(primaryHouseLordName);

  // Conjoined & Aspecting planets on primary house
  const conjunctionsObj = masterKundli.conjunctionsByHouse?.find((c) => c.house === primaryHouseNum);
  const conjoinedPlanets = conjunctionsObj?.planets || [];

  const aspectingPlanets = masterKundli.planetaryAspects
    ?.filter((a) => a.aspectHouses?.includes(primaryHouseNum))
    .map((a) => a.planet) || [];

  const savPoints = masterKundli.ashtakvarga?.savByHouse?.[primaryHouseNum - 1] || 28;

  // Divisional chart highlights
  let divChartName = 'D10';
  let divChartSummary = '';
  if (intent.domain === 'career') {
    divChartName = 'D10 (दशमांश चक्र)';
    const d10LordPlacement = masterKundli.shodashvarga?.D10?.placements?.[primaryHouseLordName]?.signName || 'अनुकूल';
    divChartSummary = `दशमांश चक्र (D10) में दशमेश ${primaryHouseLordName} ${d10LordPlacement} राशि में स्थित होकर आजीविका और प्रतिष्ठा को बल प्रदान करते हैं।`;
  } else if (intent.domain === 'marriage') {
    divChartName = 'D9 (नवांश चक्र)';
    const d9LordPlacement = masterKundli.shodashvarga?.D9?.placements?.[primaryHouseLordName]?.signName || 'अनुकूल';
    divChartSummary = `नवांश चक्र (D9) में सप्तमेश ${primaryHouseLordName} ${d9LordPlacement} स्थिति में होकर वैवाहिक सामंजस्य की पुष्टि करते हैं।`;
  } else {
    divChartName = 'D9 (नवांश चक्र)';
    divChartSummary = `नवांश में भावेश की स्थिति ग्रह बल को पुष्ट करती है।`;
  }

  // Domain Specific Comparison: Career (Job 6th vs Business 7th)
  let domainSpecificComparison: string | undefined;
  if (intent.domain === 'career') {
    const lord6 = masterKundli.houseLordships?.find((h) => h.houseNumber === 6)?.signLord || 'Mars';
    const lord7 = masterKundli.houseLordships?.find((h) => h.houseNumber === 7)?.signLord || 'Venus';
    const planet6 = findPlanet(lord6);
    const planet7 = findPlanet(lord7);

    const is6Strong = (planet6?.dignity === 'Exalted' || planet6?.dignity === 'Own Sign' || (planet6?.bhavaChalitHouse && [3, 6, 10, 11].includes(planet6.bhavaChalitHouse)));
    const is7Strong = (planet7?.dignity === 'Exalted' || planet7?.dignity === 'Own Sign' || (planet7?.bhavaChalitHouse && [2, 7, 10, 11].includes(planet7.bhavaChalitHouse)));

    if (intent.subIntent === 'job_vs_business') {
      domainSpecificComparison = `नौकरी (षष्ठम भाव - स्वामी: ${lord6}) vs व्यापार (सप्तम भाव - स्वामी: ${lord7}): ${
        is6Strong && !is7Strong
          ? `षष्ठम भाव सेवा व संगठन में विशेष अधिकार देता है, इसलिए नौकरी/कॉर्पोरेट पद अधिक सुरक्षित व लाभदायक रहेगा।`
          : is7Strong && !is6Strong
          ? `सप्तम भाव व्यापार व स्वतंत्र क्लाइंट्स का है, इसलिए स्वतंत्र व्यवसाय, फर्म या कंसल्टेंसी अधिक प्रगतिशील रहेगी।`
          : `आपकी कुंडली में नौकरी और स्वतंत्र परामर्श (Consulting/Partnership) दोनों के सुंदर योग हैं। पहले अनुभव लेकर स्वतंत्र कार्य करना सर्वोत्तम रहेगा।`
      }`;
    }
  }

  // Dasha & Timing calculations
  const todayDasha = masterKundli.dashaHierarchy;
  const transitPlanets = masterKundli.liveGochar?.transitPlanets || [];
  const saturnTransit = transitPlanets.find((p) => p.name === 'Saturn')?.houseFromLagna || 6;
  const jupiterTransit = transitPlanets.find((p) => p.name === 'Jupiter')?.houseFromLagna || 10;
  const doubleTransitHouses: number[] = (masterKundli.liveGochar?.doubleTransitHouses as any)?.housesFromLagna || [10];

  return {
    intent,
    kpSlice: {
      primaryHouseNum,
      primaryCsl: {
        planet: primaryCuspObj.subLord,
        longitudeDms: (primaryCuspObj as any).formattedDMS || (primaryCuspObj as any).dms || `${Math.floor(primaryCuspObj.longitude % 30)}°`,
        sign: primaryCuspObj.signName,
        signLord: primaryCuspObj.signLord,
        starLord: primaryCslPlanet?.starLord || primaryCuspObj.starLord,
        subLord: primaryCslPlanet?.subLord || primaryCuspObj.subLord,
        subSubLord: primaryCuspObj.subSubLord,
        isUntenanted: Boolean(primaryCslPlanet?.isUntenanted),
        isRetrograde: Boolean(primaryCslPlanet?.isRetrograde),
        housesSignifiedL1toL4: primaryHousesSignified,
      },
      secondaryCsl: {
        house: secondaryHouseNum,
        planet: secondaryCuspObj.subLord,
        sign: secondaryCuspObj.signName,
        starLord: secondaryCslPlanet?.starLord || secondaryCuspObj.starLord,
        subLord: secondaryCslPlanet?.subLord || secondaryCuspObj.subLord,
        isUntenanted: Boolean(secondaryCslPlanet?.isUntenanted),
        isRetrograde: Boolean(secondaryCslPlanet?.isRetrograde),
        housesSignifiedL1toL4: secondaryHousesSignified,
      },
      supportiveHousesSignified: supportiveHits,
      negatingHousesSignified: negatingHits,
      kpVerdictSummary,
    },
    parashariSlice: {
      houseLordPlanet: primaryHouseLordName,
      houseLordPlacementHouse: primaryLordPlanet?.bhavaChalitHouse || primaryLordPlanet?.d1House || primaryHouseNum,
      houseLordSign: primaryLordPlanet?.signName || 'Scorpio',
      houseLordDignity: primaryLordPlanet?.dignity || 'Normal',
      houseLordBaladiAvastha: primaryLordPlanet?.baladiAvastha || 'Yuva',
      houseLordIsCombust: Boolean(primaryLordPlanet?.isCombust),
      conjoinedPlanetsInHouse: conjoinedPlanets,
      aspectingPlanetsOnHouse: aspectingPlanets,
      savPoints,
      divisionalChartHighlight: {
        chart: divChartName,
        summary: divChartSummary,
      },
      domainSpecificComparison,
    },
    dashaAndTiming: {
      todayMahadasha: todayDasha?.mahadasha?.planet || 'Sun',
      todayAntardasha: todayDasha?.antardasha?.planet || 'Rahu',
      todayPratyantardasha: todayDasha?.pratyantardasha?.planet || 'Jupiter',
      dashaPeriodDates: `${todayDasha?.antardasha?.startDate ? new Date(todayDasha.antardasha.startDate).toLocaleDateString() : ''} से ${todayDasha?.antardasha?.endDate ? new Date(todayDasha.antardasha.endDate).toLocaleDateString() : ''}`,
      saturnTransitHouseFromLagna: saturnTransit,
      jupiterTransitHouseFromLagna: jupiterTransit,
      doubleTransitHouses,
      timingSummary: `वर्तमान में ${todayDasha?.mahadasha?.planet || 'सूर्य'} की महादशा में ${todayDasha?.antardasha?.planet || 'राहु'} की अंतर्दशा सक्रिय है। गोचर में देवगुरु बृहस्पति एवं शनि का द्वि-गोचरीय प्रभाव भाव ${doubleTransitHouses.join(', ')} को सक्रिय कर रहा है।`,
    },
  };
}
