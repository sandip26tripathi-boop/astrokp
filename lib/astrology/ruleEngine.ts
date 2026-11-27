/**
 * lib/astrology/ruleEngine.ts
 * Dedicated Classical Astrological Rule Engine & Evaluator
 * Executes deterministic diagnosis across Krishnamurti Paddhati (KP)
 * and Parashari Vedic Astrology principles.
 */

import { MasterKundliJSON, MasterPlanetDetails } from '../master-kundli-engine';
import { routeUserIntent } from './intentRouter';
import {
  PLANET_ELEMENTAL_MAP,
  ASCENDANT_FUNCTIONAL_MAP,
  KP_HOUSE_GROUPINGS,
  calculateNavtara,
  PlanetElementalProperties,
  HouseGroupRule
} from './classicalRules';
import { computeLiveRulingPlanets } from './rulingPlanetsEngine';

export interface ThreeTierKPChain {
  stepA_PlanetSource: {
    planet: string;
    occupiedHouse: number;
    ownedHouses: number[];
    isUntenanted: boolean;
    untenantedSignificanceHi: string;
    untenantedSignificanceEn: string;
    sourceSummaryHi: string;
    sourceSummaryEn: string;
  };
  stepB_StarLordResult: {
    starLord: string;
    housesSignifiedL1toL4: number[];
    supportiveHouses: number[];
    negatingHouses: number[];
    resultGiverSummaryHi: string;
    resultGiverSummaryEn: string;
  };
  stepC_SubLordApproval: {
    subLord: string;
    housesSignified: number[];
    approvalStatus: 'Promised' | 'Delayed / Obstacles' | 'Denied';
    approvalStatusHi: string;
    qualityModifierSummaryHi: string;
    qualityModifierSummaryEn: string;
  };
  completeChainSummaryHi: string;
  completeChainSummaryEn: string;
}

export interface AstrologicalAuditReport {
  topic: string;
  topicHi: string;
  primaryHouseNum: number;
  domainRule: HouseGroupRule;
  threeTierKpChain: ThreeTierKPChain;
  kpDiagnosis: {
    primaryCuspalSubLord: string;
    cslStarLord: string;
    cslSubLord: string;
    cslHousesSignifiedL1toL4: number[];
    cslElementalData: PlanetElementalProperties | null;
    starLordElementalData: PlanetElementalProperties | null;
    isCslUntenanted: boolean;
    isCslRetrograde: boolean;
    supportiveHousesSignified: number[];
    negatingHousesSignified: number[];
    kpPromiseVerdictHi: string;
    concreteHealthOrLifeManifestationHi: string;
  };
  parashariDiagnosis: {
    ascendantSignId: number;
    ascendantName: string;
    functionalNatureOfLagna: any;
    houseLordPlanet: string;
    houseLordPlacementHouse: number;
    houseLordSign: string;
    houseLordDignity: string;
    houseLordBaladiAvastha: string;
    houseLordIsCombust: boolean;
    conjoinedPlanetsInHouse: string[];
    aspectingPlanetsOnHouse: string[];
    savPointsInHouse: number;
    badhakaStatus: string;
    parashariSynthesisVerdictHi: string;
  };
  timingSynthesis: {
    activeMahadasha: string;
    activeAntardasha: string;
    activePratyantardasha: string;
    dashaPeriodDates: string;
    dashaLordNavtara: string;
    dashaLordIsFavorableInNavtara: boolean;
    saturnTransit: {
      sign: string;
      houseFromLagna: number;
      houseFromMoon: number;
      isRetrograde: boolean;
    };
    jupiterTransit: {
      sign: string;
      houseFromLagna: number;
      houseFromMoon: number;
      isRetrograde: boolean;
    };
    rahuKetuAxis: {
      rahuHouseFromLagna: number;
      ketuHouseFromLagna: number;
    };
    doubleTransitHouses: number[];
    doubleTransitSummaryHi: string;
    doubleTransitSummaryEn: string;
    liveRulingPlanets: {
      purifiedRPs: string[];
      retrogradePlanets: string[];
      dayLord: string;
      moonSignLord: string;
      moonStarLord: string;
      lagnaSignLord: string;
      lagnaStarLord: string;
      timingWindow: string;
      timingWindowHi: string;
    };
    timeframeRecommendationHi: string;
    timeframeRecommendationEn: string;
  };
}

export function evaluateChartAgainstRules(
  masterKundli: MasterKundliJSON,
  userQuery: string,
  previousTurns: Array<{ role: string; content?: string; text?: string }> = []
): AstrologicalAuditReport {
  // 1. Identify Topic & Target House via Strict Intent Router
  const routedIntent = routeUserIntent(userQuery, previousTurns);
  const domainKey = routedIntent.domain;
  const topicKey = domainKey;

  let domainRule = KP_HOUSE_GROUPINGS[domainKey];
  if (!domainRule) {
    if (domainKey === 'health') {
      domainRule = KP_HOUSE_GROUPINGS.health;
    } else if (domainKey === 'career') {
      domainRule = KP_HOUSE_GROUPINGS.career;
    } else if (domainKey === 'marriage') {
      domainRule = KP_HOUSE_GROUPINGS.marriage;
    } else if (domainKey === 'finance') {
      domainRule = KP_HOUSE_GROUPINGS.wealth;
    } else if (domainKey === 'education') {
      domainRule = KP_HOUSE_GROUPINGS.education;
    } else if (domainKey === 'property') {
      domainRule = KP_HOUSE_GROUPINGS.property;
    } else {
      domainRule = KP_HOUSE_GROUPINGS.career;
    }
  }

  const classified = {
    topic: domainRule.domain,
    topicHi: domainRule.domainHi,
  };

  const primaryHouseNum = domainRule.primaryHouse;
  const cusps = masterKundli.cusps || [];
  const primaryCusp = cusps.find(
    (c) => (c.houseNumber || (c as any).cuspNumber) === primaryHouseNum
  ) || cusps[primaryHouseNum - 1] || cusps[0];

  const cslName = primaryCusp?.subLord || 'Mercury';
  const cslStarLord = primaryCusp?.starLord || 'Moon';
  const cslSubLord = primaryCusp?.subLord || cslName;

  // 2. Fetch CSL and Star Lord Planet Details
  const cslPlanetObj = masterKundli.planets.find(
    (p) => (p.name || '').toLowerCase() === cslName.toLowerCase()
  );
  const starLordPlanetObj = masterKundli.planets.find(
    (p) => (p.name || '').toLowerCase() === cslStarLord.toLowerCase()
  );

  const isCslUntenanted = cslPlanetObj?.isUntenanted ?? masterKundli.untenantedPlanets.includes(cslName);
  const isCslRetrograde = Boolean(cslPlanetObj?.isRetrograde);

  // 4-Fold Significators calculation for CSL
  const cslHousesSignified = new Set<number>();
  const addLevelHouses = (levelArray: { house: number; planets: string[] }[]) => {
    levelArray.forEach((item) => {
      if (item.planets.some((pName) => pName.toLowerCase() === cslName.toLowerCase() || pName.toLowerCase() === cslStarLord.toLowerCase())) {
        cslHousesSignified.add(item.house);
      }
    });
  };

  if (masterKundli.fourFoldSignificators) {
    addLevelHouses(masterKundli.fourFoldSignificators.L1 || []);
    addLevelHouses(masterKundli.fourFoldSignificators.L2 || []);
    addLevelHouses(masterKundli.fourFoldSignificators.L3 || []);
    addLevelHouses(masterKundli.fourFoldSignificators.L4 || []);
  }

  // If no 4-fold significator was populated, add occupied & owned houses
  if (cslHousesSignified.size === 0 && cslPlanetObj) {
    cslHousesSignified.add(cslPlanetObj.bhavaChalitHouse || cslPlanetObj.d1House);
  }

  const signifiedHousesList = Array.from(cslHousesSignified);
  const supportiveSignified = signifiedHousesList.filter((h) => domainRule.supportiveHouses.includes(h));
  const negatingSignified = signifiedHousesList.filter((h) => domainRule.negatingHouses.includes(h));

  // Tattva & Dosha Mappings
  const cslElemental = PLANET_ELEMENTAL_MAP[cslName] || null;
  const starLordElemental = PLANET_ELEMENTAL_MAP[cslStarLord] || null;

  // Build Concrete Real-World Manifestation based on Tattva/Dosha and Domain
  let concreteManifestation = '';
  if (topicKey.includes('health') || primaryHouseNum === 6) {
    const activeElemental = starLordElemental || cslElemental || PLANET_ELEMENTAL_MAP['Moon'];
    const activeTattva = activeElemental.tattvaHi;
    const activeDosha = activeElemental.doshaHi;
    const specificIssues = activeElemental.healthSensitivities.join(', ');

    concreteManifestation = `6ठे कस्पल सब-लॉर्ड (${cslName}) का नक्षत्र स्वामी ${cslStarLord} है, जो ${activeTattva} व ${activeDosha} के अधिपति हैं। इसके कारण जातक में मुख्य रूप से ${specificIssues} की शारीरिक संवेदनशीलता उत्पन्न होती है।`;
  } else if (topicKey.includes('career') || primaryHouseNum === 10) {
    concreteManifestation = `10वें कस्पल सब-लॉर्ड (${cslName}) के नक्षत्र स्वामी ${cslStarLord} के भाव संबंध [${signifiedHousesList.join(', ')}] कार्यक्षेत्र में ${supportiveSignified.length >= 2 ? 'स्थिर विस्तार व आजीविका वृद्धि' : 'स्थान परिवर्तन या पद संबंधी पुनर्गठन'} का संकेत देते हैं।`;
  } else if (topicKey.includes('marriage') || primaryHouseNum === 7) {
    concreteManifestation = `7वें कस्पल सब-लॉर्ड (${cslName}) का संबंध भाव [${signifiedHousesList.join(', ')}] से है; ${supportiveSignified.includes(2) || supportiveSignified.includes(7) || supportiveSignified.includes(11) ? 'वैवाहिक बंधन व परिवार वृद्धि का पूर्ण योग बनता है।' : 'वैवाहिक निर्णय में विलंब या प्राथमिक असहमति का योग है।'}`;
  } else {
    concreteManifestation = `संबंधित भाव के कस्पल सब-लॉर्ड (${cslName}) का नक्षत्र स्वामी ${cslStarLord} होने से विषय से जुड़े परिणाम स्पष्ट रूप से घटित होंगे।`;
  }

  let kpVerdictHi = '';
  if (primaryHouseNum === 6 && (topicKey.includes('health') || topicKey.includes('रोग'))) {
    if (negatingSignified.includes(6) || negatingSignified.includes(8) || negatingSignified.includes(12)) {
      kpVerdictHi = `रोग भाव (6/8/12) सक्रिय होने से स्वास्थ्य में समय-समय पर संवेदनशीलता रहेगी, किंतु 1 व 11 भाव के सहयोग से अंततः आरोग्य लाभ होगा।`;
    } else {
      kpVerdictHi = `शारीरिक प्रतिरोधक क्षमता (इम्युनिटी) मजबूत है; सामान्य मौसमी संवेदनशीलता के अतिरिक्त कोई गंभीर दीर्घकालिक रोग नहीं है।`;
    }
  } else {
    kpVerdictHi = supportiveSignified.length >= negatingSignified.length
      ? `के.पी. ज्योतिष अनुसार कस्पल सब-लॉर्ड कार्य सिद्धि के सकारात्मक भावों को पुष्ट कर रहा है।`
      : `के.पी. ज्योतिष अनुसार कस्पल सब-लॉर्ड कुछ रुकावट देने वाले भावों को सक्रिय कर रहा है जिससे सतर्कता आवश्यक है।`;
  }

  // 3-Tier KP Chain Structure: Planet (Source) -> Star Lord (Result Giver) -> Sub-Lord (Quality / Approval)
  const ownedHouses = masterKundli.houseLordships
    ?.filter((h) => (h.signLord || '').toLowerCase() === cslName.toLowerCase())
    .map((h) => h.houseNumber) || [];
  const cslOccupiedHouse = cslPlanetObj ? (cslPlanetObj.bhavaChalitHouse || cslPlanetObj.d1House) : primaryHouseNum;

  // Sub-lord houses signified
  const subLordHouses = new Set<number>();
  if (masterKundli.fourFoldSignificators) {
    const checkSub = (levelArray: { house: number; planets: string[] }[]) => {
      levelArray.forEach((item) => {
        if (item.planets.some((pName) => pName.toLowerCase() === cslSubLord.toLowerCase())) {
          subLordHouses.add(item.house);
        }
      });
    };
    checkSub(masterKundli.fourFoldSignificators.L1 || []);
    checkSub(masterKundli.fourFoldSignificators.L2 || []);
    checkSub(masterKundli.fourFoldSignificators.L3 || []);
    checkSub(masterKundli.fourFoldSignificators.L4 || []);
  }
  const subLordHousesList = Array.from(subLordHouses);

  let approvalStatus: 'Promised' | 'Delayed / Obstacles' | 'Denied' = 'Promised';
  let approvalStatusHi = 'कार्य सिद्धि (स्वीकृत)';
  if (negatingSignified.length > supportiveSignified.length) {
    approvalStatus = 'Denied';
    approvalStatusHi = 'निषेध / प्रतिकूल';
  } else if (negatingSignified.length > 0 || isCslRetrograde) {
    approvalStatus = 'Delayed / Obstacles';
    approvalStatusHi = 'विलंब व परिश्रम उपरांत सिद्धि';
  }

  const untenantedHi = isCslUntenanted
    ? `कस्पल सब-लॉर्ड (${cslName}) अप्रयुक्त (Untenanted) है, जिसका अर्थ है कि इसके नक्षत्र में कोई अन्य ग्रह नहीं बैठा है; अतः यह अपने अधिकृत भाव (${cslOccupiedHouse}) और स्वामित्व भावों [${ownedHouses.join(', ') || 'स्थानीय'}] का फल सीधे व पूर्ण सामर्थ्य से देने वाला स्वतंत्र स्रोत बनता है।`
    : `कस्पल सब-लॉर्ड (${cslName}) प्रयुक्त (Tenanted) है, अतः इसके स्वामित्व भावों के परिणाम अन्य tenant ग्रहों के माध्यम से भी प्रवाहित होते हैं।`;

  const untenantedEn = isCslUntenanted
    ? `Cuspal Sub-Lord (${cslName}) is Untenanted (no planet occupies its Nakshatra), making it an uninhibited, direct, and powerful primary source for its occupied house (${cslOccupiedHouse}) and owned houses [${ownedHouses.join(', ') || 'own'}].`
    : `Cuspal Sub-Lord (${cslName}) is Tenanted; its significations also flow through tenant planets.`;

  const stepASummaryHi = `कस्पल सब-लॉर्ड ${cslName} भाव ${cslOccupiedHouse} में स्थित है और भाव [${ownedHouses.join(', ') || 'स्वामित्व'}] का स्वामी है। ${untenantedHi}`;
  const stepASummaryEn = `CSL ${cslName} occupies House ${cslOccupiedHouse} and rules Houses [${ownedHouses.join(', ') || 'none'}]. ${untenantedEn}`;

  const stepBSummaryHi = `के.पी. मूल सिद्धांत (Planet is the source, Star Lord delivers the results): कस्पल सब-लॉर्ड का नक्षत्र स्वामी ${cslStarLord} 4-स्तरीय भाव संबंधों (L1-L4) द्वारा भाव [${signifiedHousesList.join(', ')}] को सक्रिय कर रहा है (अनुकूल भाव: [${supportiveSignified.join(', ') || 'कोई नहीं'}], प्रतिकूल भाव: [${negatingSignified.join(', ') || 'कोई नहीं'}])।`;
  const stepBSummaryEn = `KP Core Law (Planet represents the source, Star Lord delivers the actual result): Nakshatra Lord ${cslStarLord} signifies Houses [${signifiedHousesList.join(', ')}] across 4-fold levels (Fruitful: [${supportiveSignified.join(', ') || 'none'}], Opposing: [${negatingSignified.join(', ') || 'none'}]).`;

  const stepCSummaryHi = `के.पी. निर्णायक सिद्धांत (Sub-Lord decides the quality and final fruition): उप-स्वामी ${cslSubLord} द्वारा इस फल की अंतिम स्वीकृति ${approvalStatusHi} के रूप में निर्धारित होती है।`;
  const stepCSummaryEn = `KP Decisive Law (Sub-Lord determines the quality and final fruition): Sub-Lord ${cslSubLord} modifies the outcome as ${approvalStatus}.`;

  const completeChainHi = `के.पी. 3-स्तरीय विश्लेषण: स्रोत (Planet): ${cslName} [भाव ${cslOccupiedHouse}, स्वामित्व ${ownedHouses.join(', ')}] ${isCslUntenanted ? '(अप्रयुक्त)' : ''} → फल दाता (Star Lord): ${cslStarLord} [भाव ${signifiedHousesList.join(', ')}] → अंतिम स्वीकृति (Sub-Lord): ${cslSubLord} (${approvalStatusHi})।`;
  const completeChainEn = `KP 3-Tier Analysis: Source (Planet): ${cslName} [House ${cslOccupiedHouse}, Rules ${ownedHouses.join(', ')}] ${isCslUntenanted ? '(Untenanted)' : ''} → Result Giver (Star Lord): ${cslStarLord} [Houses ${signifiedHousesList.join(', ')}] → Final Approval (Sub-Lord): ${cslSubLord} (${approvalStatus}).`;

  const threeTierKpChain: ThreeTierKPChain = {
    stepA_PlanetSource: {
      planet: cslName,
      occupiedHouse: cslOccupiedHouse,
      ownedHouses,
      isUntenanted: isCslUntenanted,
      untenantedSignificanceHi: untenantedHi,
      untenantedSignificanceEn: untenantedEn,
      sourceSummaryHi: stepASummaryHi,
      sourceSummaryEn: stepASummaryEn,
    },
    stepB_StarLordResult: {
      starLord: cslStarLord,
      housesSignifiedL1toL4: signifiedHousesList,
      supportiveHouses: supportiveSignified,
      negatingHouses: negatingSignified,
      resultGiverSummaryHi: stepBSummaryHi,
      resultGiverSummaryEn: stepBSummaryEn,
    },
    stepC_SubLordApproval: {
      subLord: cslSubLord,
      housesSignified: subLordHousesList,
      approvalStatus,
      approvalStatusHi,
      qualityModifierSummaryHi: stepCSummaryHi,
      qualityModifierSummaryEn: stepCSummaryEn,
    },
    completeChainSummaryHi: completeChainHi,
    completeChainSummaryEn: completeChainEn,
  };

  // 4. Parashari Lens Evaluation
  const ascSignId = masterKundli.ascendant.signId || 1;
  const functionalNature = ASCENDANT_FUNCTIONAL_MAP[ascSignId] || ASCENDANT_FUNCTIONAL_MAP[1];

  const houseLordship = masterKundli.houseLordships?.find((h) => h.houseNumber === primaryHouseNum);
  const houseLordPlanetName = houseLordship?.signLord || primaryCusp?.signLord || 'Mars';
  const houseLordPlanetObj = masterKundli.planets.find(
    (p) => (p.name || '').toLowerCase() === houseLordPlanetName.toLowerCase()
  );

  const houseLordPlacementHouse = houseLordPlanetObj ? houseLordPlanetObj.d1House : primaryHouseNum;
  const houseLordSign = houseLordPlanetObj?.signName || '';
  const houseLordDignity = houseLordPlanetObj?.dignity || 'Normal';
  const houseLordBaladiAvastha = houseLordPlanetObj?.baladiAvastha || 'Yuva';
  const houseLordIsCombust = Boolean(houseLordPlanetObj?.isCombust);

  // Conjunctions in the house where House Lord is placed
  const conjunctionEntry = masterKundli.conjunctionsByHouse?.find(
    (c) => c.house === houseLordPlacementHouse
  );
  const conjoinedPlanets = conjunctionEntry ? conjunctionEntry.planets.filter((p) => p !== houseLordPlanetName) : [];

  // Aspects on primary house
  const aspectingPlanets = masterKundli.planetaryAspects
    ?.filter((a) => a.aspectHouses.includes(primaryHouseNum))
    .map((a) => a.planet) || [];

  const savPoints = masterKundli.ashtakvarga?.savByHouse?.[primaryHouseNum - 1] ?? 28;

  const badhakaInfo = masterKundli.badhakaInfo;
  const isBadhakaActive = badhakaInfo?.badhakeshPlanet?.toLowerCase() === houseLordPlanetName.toLowerCase();
  const badhakaStatusText = isBadhakaActive
    ? `सावधान: यह ग्रह लग्न के लिए बाधकेश भी है (${badhakaInfo?.summaryHi})।`
    : `सामान्य स्थिति (बाधक भाव ${badhakaInfo?.badhakaHouseNumber}वां है जिसके स्वामी ${badhakaInfo?.badhakeshPlanet} हैं)।`;

  let parashariSynthesisHi = `${primaryHouseNum}वें भाव के स्वामी ${houseLordPlanetName} कुंडली के ${houseLordPlacementHouse}वें भाव में स्थित हैं`;
  if (conjoinedPlanets.length > 0) {
    parashariSynthesisHi += ` और वहां ${conjoinedPlanets.join(' व ')} के साथ युति बना रहे हैं`;
  }
  if (aspectingPlanets.length > 0) {
    parashariSynthesisHi += `, जिस पर ${aspectingPlanets.join(' व ')} की दृष्टि प्रभाव डाल रही है`;
  }
  parashariSynthesisHi += `। (अष्टकवर्ग में इस भाव को ${savPoints} बिंदु प्राप्त हैं)।`;

  // 5. Timing Synthesis (Vimshottari Dasha + Live Gochar + Double Transit + Purified Live RP)
  const todayDasha = masterKundli.dashaHierarchy;
  const activeMD = todayDasha.mahadasha.planet;
  const activeAD = todayDasha.antardasha.planet;
  const activePD = todayDasha.pratyantardasha.planet;

  // Navtara of active Mahadasha Lord
  const moonPlanet = masterKundli.planets.find((p) => p.name === 'Moon');
  const moonNakIdx = moonPlanet ? Math.floor(((moonPlanet.longitude % 360) + 360) % 360 / (360 / 27)) : 0;
  const mdPlanet = masterKundli.planets.find((p) => p.name === activeMD);
  const mdNakIdx = mdPlanet ? Math.floor(((mdPlanet.longitude % 360) + 360) % 360 / (360 / 27)) : 0;

  const navtaraResult = calculateNavtara(moonNakIdx, mdNakIdx);

  // Live Transit Details
  const liveGochar = masterKundli.liveGochar;
  const saturnTransit = liveGochar?.transitPlanets?.find((p: any) => p.name === 'Saturn') || {
    signName: 'Aquarius',
    houseFromLagna: 10,
    houseFromMoon: 12,
    isRetrograde: false,
  };
  const jupiterTransit = liveGochar?.transitPlanets?.find((p: any) => p.name === 'Jupiter') || {
    signName: 'Taurus',
    houseFromLagna: 1,
    houseFromMoon: 3,
    isRetrograde: false,
  };
  const rahuTransit = liveGochar?.transitPlanets?.find((p: any) => p.name === 'Rahu') || {
    houseFromLagna: 11,
  };
  const ketuTransit = liveGochar?.transitPlanets?.find((p: any) => p.name === 'Ketu') || {
    houseFromLagna: 5,
  };

  const doubleTransitHouses = liveGochar?.doubleTransitHouses?.housesFromLagna || [];
  const doubleTransitSummaryHi = doubleTransitHouses.length > 0
    ? `शनि एवं गुरु का संयुक्त दृष्टि/गोचर प्रभाव भाव [${doubleTransitHouses.join(', ')}] पर है, जो इस भाव से जुड़े कार्यों के फलित होने का अटल समय निर्धारित करता है।`
    : `शनि एवं गुरु के गोचर से संबंधित भावों की सक्रियता अनुकूल है।`;
  const doubleTransitSummaryEn = doubleTransitHouses.length > 0
    ? `The Double Transit Principle locks cosmic manifestation into Houses [${doubleTransitHouses.join(', ')}] simultaneously influenced by Saturn and Jupiter.`
    : `Saturn and Jupiter transits establish favorable cosmic timing for the queried matter.`;

  // Compute Live Ruling Planets using the exact query timestamp and user coordinates
  const lat = masterKundli.meta.latitude || 28.6139;
  const lon = masterKundli.meta.longitude || 77.209;
  const liveRP = computeLiveRulingPlanets(lat, lon, new Date(), {
    fruitfulHouses: domainRule.supportiveHouses,
    fourFoldSignificators: masterKundli.fourFoldSignificators,
    dashaHierarchy: todayDasha,
  });

  const timingRecommendationHi = `वर्तमान में ${activeMD} की महादशा में ${activeAD} की अंतर्दशा एवं ${activePD} की प्रत्यंतर्दशा गतिमान है। तात्कालिक शुद्ध रूलिंग प्लैनेट्स [${liveRP.purifiedRulingPlanets.join(', ')}] तथा गोचर में द्वि-गोचर के प्रभाव से यह समय ${liveRP.eventTimingWindowHi || 'आगामी महीनों में फलित होने के अनुकूल है'}।`;
  const timingRecommendationEn = `Currently running ${activeMD} Mahadasha, ${activeAD} Antardasha, and ${activePD} Pratyantardasha. Cross-matching with purified Live Ruling Planets [${liveRP.purifiedRulingPlanets.join(', ')}] and the Double Transit impact on House(s) [${doubleTransitHouses.join(', ')}], the timing window is: ${liveRP.eventTimingWindow || 'Active during the upcoming transition'}.`;

  return {
    topic: classified?.topic || 'general',
    topicHi: classified?.topicHi || 'सामान्य',
    primaryHouseNum,
    domainRule,
    threeTierKpChain,
    kpDiagnosis: {
      primaryCuspalSubLord: cslName,
      cslStarLord: cslStarLord,
      cslSubLord: cslSubLord,
      cslHousesSignifiedL1toL4: signifiedHousesList,
      cslElementalData: cslElemental,
      starLordElementalData: starLordElemental,
      isCslUntenanted,
      isCslRetrograde,
      supportiveHousesSignified: supportiveSignified,
      negatingHousesSignified: negatingSignified,
      kpPromiseVerdictHi: kpVerdictHi,
      concreteHealthOrLifeManifestationHi: concreteManifestation,
    },
    parashariDiagnosis: {
      ascendantSignId: ascSignId,
      ascendantName: functionalNature.ascendantName,
      functionalNatureOfLagna: functionalNature,
      houseLordPlanet: houseLordPlanetName,
      houseLordPlacementHouse,
      houseLordSign,
      houseLordDignity,
      houseLordBaladiAvastha,
      houseLordIsCombust,
      conjoinedPlanetsInHouse: conjoinedPlanets,
      aspectingPlanetsOnHouse: aspectingPlanets,
      savPointsInHouse: savPoints,
      badhakaStatus: badhakaStatusText,
      parashariSynthesisVerdictHi: parashariSynthesisHi,
    },
    timingSynthesis: {
      activeMahadasha: activeMD,
      activeAntardasha: activeAD,
      activePratyantardasha: activePD,
      dashaPeriodDates: `${todayDasha.antardasha.startDate.slice(0, 10)} से ${todayDasha.antardasha.endDate.slice(0, 10)}`,
      dashaLordNavtara: `${navtaraResult.taraHindi} (${navtaraResult.taraNature})`,
      dashaLordIsFavorableInNavtara: navtaraResult.isFavorable,
      saturnTransit: {
        sign: saturnTransit.signName,
        houseFromLagna: saturnTransit.houseFromLagna,
        houseFromMoon: saturnTransit.houseFromMoon,
        isRetrograde: Boolean(saturnTransit.isRetrograde),
      },
      jupiterTransit: {
        sign: jupiterTransit.signName,
        houseFromLagna: jupiterTransit.houseFromLagna,
        houseFromMoon: jupiterTransit.houseFromMoon,
        isRetrograde: Boolean(jupiterTransit.isRetrograde),
      },
      rahuKetuAxis: {
        rahuHouseFromLagna: rahuTransit.houseFromLagna,
        ketuHouseFromLagna: ketuTransit.houseFromLagna,
      },
      doubleTransitHouses,
      doubleTransitSummaryHi,
      doubleTransitSummaryEn,
      liveRulingPlanets: {
        purifiedRPs: liveRP.purifiedRulingPlanets,
        retrogradePlanets: liveRP.retrogradePlanets,
        dayLord: liveRP.dayLord,
        moonSignLord: liveRP.moonSignLord,
        moonStarLord: liveRP.moonStarLord,
        lagnaSignLord: liveRP.lagnaSignLord,
        lagnaStarLord: liveRP.lagnaStarLord,
        timingWindow: liveRP.eventTimingWindow || '',
        timingWindowHi: liveRP.eventTimingWindowHi || '',
      },
      timeframeRecommendationHi: timingRecommendationHi,
      timeframeRecommendationEn: timingRecommendationEn,
    },
  };
}
