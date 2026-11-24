/**
 * lib/astrology/ruleEngine.ts
 * Dedicated Classical Astrological Rule Engine & Evaluator
 * Executes deterministic diagnosis across Krishnamurti Paddhati (KP)
 * and Parashari Vedic Astrology principles.
 */

import { MasterKundliJSON, MasterPlanetDetails } from '../master-kundli-engine';
import { classifyQuestionTopic } from '../kp-classifier';
import {
  PLANET_ELEMENTAL_MAP,
  ASCENDANT_FUNCTIONAL_MAP,
  KP_HOUSE_GROUPINGS,
  calculateNavtara,
  PlanetElementalProperties,
  HouseGroupRule
} from './classicalRules';

export interface AstrologicalAuditReport {
  topic: string;
  topicHi: string;
  primaryHouseNum: number;
  domainRule: HouseGroupRule;
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
    doubleTransitHouses: number[];
    timeframeRecommendationHi: string;
  };
}

export function evaluateChartAgainstRules(
  masterKundli: MasterKundliJSON,
  userQuery: string
): AstrologicalAuditReport {
  // 1. Identify Topic & Target House
  const classified = classifyQuestionTopic(userQuery);
  const topicKey = (classified?.topic || 'health').toLowerCase();

  let domainRule = KP_HOUSE_GROUPINGS[topicKey];
  if (!domainRule) {
    if (topicKey.includes('health') || topicKey.includes('रोग') || topicKey.includes('बीमार')) {
      domainRule = KP_HOUSE_GROUPINGS.health;
    } else if (topicKey.includes('job') || topicKey.includes('career') || topicKey.includes('व्यवसाय')) {
      domainRule = KP_HOUSE_GROUPINGS.career;
    } else if (topicKey.includes('marriage') || topicKey.includes('विवाह')) {
      domainRule = KP_HOUSE_GROUPINGS.marriage;
    } else if (topicKey.includes('wealth') || topicKey.includes('धन') || topicKey.includes('money')) {
      domainRule = KP_HOUSE_GROUPINGS.wealth;
    } else {
      domainRule = KP_HOUSE_GROUPINGS.health;
    }
  }

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

  // 3. Parashari Lens Evaluation
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

  // 4. Timing Synthesis (Vimshottari Dasha + Gochar)
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

  const doubleTransitHouses = masterKundli.liveGochar?.doubleTransitHouses?.housesFromLagna || [];

  return {
    topic: classified?.topic || 'general',
    topicHi: classified?.topicHi || 'सामान्य',
    primaryHouseNum,
    domainRule,
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
      doubleTransitHouses,
      timeframeRecommendationHi: `वर्तमान में ${activeMD} की महादशा में ${activeAD} की अंतर्दशा गतिशील है। गोचर में द्वि-गोचर का प्रभाव भाव [${doubleTransitHouses.join(', ') || 'सक्रिय'}] पर होने से आगामी महीनों में अनुकूल परिणाम दृष्टिगोचर होंगे।`,
    },
  };
}
