import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import dns from 'dns';
import { extractCleanKPJson, classifyQuestionTopic, isAstrologicalQuery } from '@/lib/kp-classifier';
import { evaluateParashariKundli, resolveSignId } from '@/lib/parashari-evaluator';
import { evaluateGochar } from '@/lib/gochar-evaluator';
import { synthesizeFastKPAnswer } from '@/lib/kp-fast-synthesizer';
import { analyzeQuestionAstrology } from '@/lib/kp-question-analyzer';
import { apiRateLimiter } from '@/lib/cache-manager';
import { generateMasterKundli, MasterKundliJSON } from '@/lib/master-kundli-engine';
import { NAKSHATRAS } from '@/lib/kp-calculator';
import { extractQueriedTargetDate, getDashaForDate, getAllMahadashasTable } from '@/lib/dasha-date-resolver';
import { evaluateChartAgainstRules } from '@/lib/astrology/ruleEngine';
import { PLANET_ELEMENTAL_MAP } from '@/lib/astrology/classicalRules';
import { routeUserIntent, extractIntentAstrologyData } from '@/lib/astrology/intentRouter';
import { resolveBhavatBhavam, BhavatBhavamResult } from '@/lib/astrology/bhavatBhavam';
import { ChartInput } from '@/types/astrology';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  // Ignore
}

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

function formatDashaText(dasha: any, isEn: boolean = false): string {
  const notAvailable = isEn ? 'Not Available' : 'उपलब्ध नहीं';
  if (!dasha) return notAvailable;
  if (typeof dasha === 'string') return dasha;

  const extractPlanet = (d: any) => {
    if (!d) return null;
    if (typeof d === 'string') return d;
    if (typeof d === 'object') return d.planet || d.name || d.lord || null;
    return String(d);
  };

  const maha = extractPlanet(dasha.mahadasha) || extractPlanet(dasha.major) || '';
  const antar =
    extractPlanet(dasha.antardasha) ||
    extractPlanet(dasha.antardasha_Bhukti) ||
    extractPlanet(dasha.sub) ||
    '';
  const prat =
    extractPlanet(dasha.pratyantardasha) ||
    extractPlanet(dasha.pratyantardasha_Antara) ||
    extractPlanet(dasha.pratyantar) ||
    '';

  const parts = [];
  if (isEn) {
    if (maha) parts.push(`Mahadasha: ${maha}`);
    if (antar) parts.push(`Antardasha: ${antar}`);
    if (prat) parts.push(`Pratyantardasha: ${prat}`);
  } else {
    if (maha) parts.push(`महादशा: ${maha}`);
    if (antar) parts.push(`अंतर्दशा: ${antar}`);
    if (prat) parts.push(`प्रत्यंतर्दशा: ${prat}`);
  }

  return parts.join(', ') || notAvailable;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const clientIp = ip.split(',')[0].trim();
    const rateCheck = apiRateLimiter.check(clientIp);

    const body = await req.json();
    const { messages, kundliData, kpMatrix, birthDetails, presetQuery, stream: wantStream } = body;
    const clientLanguage = body.language === 'en' ? 'en' : 'hi';
    const isEnglish = clientLanguage === 'en';

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: isEnglish
            ? 'Too many inquiries. Please wait a few moments before asking another question.'
            : 'अत्यधिक अनुरोध। कृपया कुछ सेकंड प्रतीक्षा करने के पश्चात पुनः प्रयास करें।',
          rateLimited: true,
        },
        { status: 429 }
      );
    }

    let activeChart = kpMatrix || kundliData;

    // Automatic calculation trigger if activeChart is missing but birth details are provided
    if (!activeChart && birthDetails && (birthDetails.dateOfBirth || birthDetails.date)) {
      const bInput: ChartInput = {
        name: birthDetails.name || 'Native',
        gender: (birthDetails.gender || 'male') as 'male' | 'female' | 'other',
        dateOfBirth: birthDetails.dateOfBirth || birthDetails.date || '1995-10-24',
        timeOfBirth: birthDetails.timeOfBirth || birthDetails.time || '12:00',
        placeName: birthDetails.placeName || birthDetails.place || 'Unknown',
        latitude: Number(birthDetails.latitude ?? birthDetails.lat ?? 28.6139),
        longitude: Number(birthDetails.longitude ?? birthDetails.lon ?? 77.209),
        timezone: birthDetails.timezone !== undefined ? Number(birthDetails.timezone) : 5.5,
        ayanamsa: 'KP_NEW',
        isHorary: false,
        horaryNumber: 1,
        language: clientLanguage,
      };
      const computed = generateMasterKundli(bInput);
      activeChart = {
        masterKundli: computed,
        ascendant: computed.ascendant.longitude,
        cusps: computed.cusps,
        planets: computed.planets,
        currentDasha: computed.dashaHierarchy,
        houseSignificators: computed.fourFoldSignificators ? Object.entries(computed.fourFoldSignificators.L1).map(([_, val], idx) => ({
          houseNumber: idx + 1,
          level1: computed.fourFoldSignificators.L1[idx]?.planets || [],
          level2: computed.fourFoldSignificators.L2[idx]?.planets || [],
          level3: computed.fourFoldSignificators.L3[idx]?.planets || [],
          level4: computed.fourFoldSignificators.L4[idx]?.planets || [],
        })) : [],
        dateOfBirth: computed.meta.dateOfBirth,
        timeOfBirth: computed.meta.timeOfBirth,
        latitude: computed.meta.latitude,
        longitude: computed.meta.longitude,
      };
    }

    if (!activeChart) {
      return NextResponse.json(
        {
          error: isEnglish
            ? 'Kundli data (kundliData / kpMatrix / birthDetails) is missing.'
            : 'कुंडली डेटा (kundliData / kpMatrix / birthDetails) उपलब्ध नहीं है।',
        },
        { status: 400 }
      );
    }

    const cleanKundli = extractCleanKPJson(activeChart) || activeChart;
    const parashariData = evaluateParashariKundli(activeChart);
    const gocharData = evaluateGochar(parashariData.lagnaSignId, parashariData.moonSignId, new Date());

    const rawMessages = messages && messages.length > 0 ? messages : [];
    const recentMessages = rawMessages.slice(-8); // Maintain last 8 turns context for seamless follow-ups
    const userTurnsCount = recentMessages.filter(
      (m: any) => m.role === 'user' || (!m.role && m.content)
    ).length;
    const isFirstTurn = userTurnsCount <= 1;

    const lastMsg = recentMessages.length > 0 ? recentMessages[recentMessages.length - 1] : null;
    const currentQuestion =
      presetQuery ||
      (lastMsg ? lastMsg.text || lastMsg.content : '') ||
      (isEnglish
        ? 'Please provide an accurate astrological reading based on my birth chart.'
        : 'मेरी कुंडली के अनुसार मेरे प्रश्न का सटीक उत्तर दें।');

    // Strict Astrology Guardrail: Reject non-astrology / bot inquiries
    if (!isAstrologicalQuery(currentQuestion)) {
      const redirectMsg = isEnglish
        ? '🙏 **Namaste!**\n\nI am **VedicWisdom**, dedicated exclusively to authentic Vedic Astrology, Placidus Cuspal Sub-Lord analysis, and Janma Kundli guidance.\n\nKindly ask questions pertaining to your birth chart, life destiny, career, marriage, health, finances, dasha periods, or astrological remedies.'
        : '🙏 **सादर अभिवादन!**\n\nमैं **VedicWisdom** केवल प्रामाणिक वैदिक ज्योतिष, कस्पल नक्षत्र गणना एवं जन्मकुंडली विश्लेषण के लिए समर्पित हूँ।\n\nकृपया अपने जीवन, भविष्य, करियर, नौकरी, व्यवसाय, विवाह, स्वास्थ्य, आर्थिक स्थिति, ग्रह शांति अथवा तात्कालिक गोचर से संबंधित ज्योतिषीय प्रश्न पूछें।';

      return NextResponse.json({
        reply: redirectMsg,
        text: redirectMsg,
        model: 'VedicWisdom-Guardrail',
        debug: { topic: 'Off-Topic Redirection', isAstrological: false },
      });
    }

    // Ensure comprehensive Master Kundli JSON from backend calculation engine
    let masterKundli: MasterKundliJSON;
    if (activeChart.masterKundli && activeChart.masterKundli.planets?.length && activeChart.masterKundli.cusps?.length === 12) {
      masterKundli = activeChart.masterKundli;
    } else {
      const bInput: ChartInput = {
        name: birthDetails?.name || activeChart.masterKundli?.meta?.name || 'Native',
        gender: (birthDetails?.gender || 'male') as 'male' | 'female' | 'other',
        dateOfBirth: birthDetails?.dateOfBirth || activeChart.dateOfBirth || '1995-10-24',
        timeOfBirth: birthDetails?.timeOfBirth || activeChart.timeOfBirth || '12:00',
        placeName: birthDetails?.placeName || activeChart.placeName || 'Unknown',
        latitude: birthDetails?.latitude || activeChart.latitude || 28.6139,
        longitude: birthDetails?.longitude || activeChart.longitude || 77.209,
        timezone: birthDetails?.timezone !== undefined ? birthDetails?.timezone : 5.5,
        ayanamsa: 'KP_NEW',
        isHorary: false,
        horaryNumber: 1,
        language: clientLanguage,
      };
      masterKundli = generateMasterKundli(bInput);
    }

    // Programmatic Intent Routing & Relevant Data Slicing (100% accurate house mapping)
    const userIntent = routeUserIntent(currentQuestion, recentMessages);
    const intentAstrologyData = extractIntentAstrologyData(masterKundli, userIntent);

    // Deep KP & Parashari Question Analysis using exact Kundli data
    const questionAnalysis = analyzeQuestionAstrology(
      activeChart,
      parashariData,
      gocharData,
      currentQuestion,
      birthDetails
    );

    // Historical & Target Date Resolution (e.g., 2014, 2028, next year)
    const dateParse = extractQueriedTargetDate(currentQuestion);
    const targetDateDasha = getDashaForDate(masterKundli.full120YearDashaTimeline, dateParse.targetDate);
    const todayDasha = getDashaForDate(masterKundli.full120YearDashaTimeline, new Date());
    const allMahadashasTable = masterKundli.allMahadashasTable || getAllMahadashasTable(masterKundli.full120YearDashaTimeline);

    // Programmatic Rule Engine Evaluation (KP Laws + Parashari Laws + Tattva/Dosha)
    const astrologicalAudit = evaluateChartAgainstRules(masterKundli, currentQuestion, recentMessages);
    const bhavatBhavam = userIntent.bhavatBhavam || astrologicalAudit.bhavatBhavam || resolveBhavatBhavam(currentQuestion, recentMessages);

    const cusps = activeChart.cusps || [];
    const currentDBA = masterKundli.dashaHierarchy;

    // Structured Master Kundli JSON payload for Gemini Astro context injection
    const kundliJsonPayload = {
      clientBirthDetails: {
        name: birthDetails?.name || masterKundli.meta.name,
        dateOfBirth: birthDetails?.dateOfBirth || masterKundli.meta.dateOfBirth,
        timeOfBirth: birthDetails?.timeOfBirth || masterKundli.meta.timeOfBirth,
        place: birthDetails?.placeName || masterKundli.meta.placeName,
        gender: birthDetails?.gender || 'male',
      },
      astrologicalAuditReport: astrologicalAudit,
      planetElementalKarakatvaMap: PLANET_ELEMENTAL_MAP,
      dashaDateLock: {
        strictInstruction: "STRICT RULE: Never calculate Dasha dates yourself. Read the exact Mahadasha, Antardasha, and Pratyantardasha directly from targetDateDasha (for any past/future year asked by the user) and todayDasha (for current questions).",
        targetDateDasha: {
          targetDate: targetDateDasha.targetDate,
          mahadasha: targetDateDasha.planetMD,
          mdStart: targetDateDasha.mdStart,
          mdEnd: targetDateDasha.mdEnd,
          antardasha: targetDateDasha.planetAD,
          adStart: targetDateDasha.adStart,
          adEnd: targetDateDasha.adEnd,
          pratyantardasha: targetDateDasha.planetPD,
          pdStart: targetDateDasha.pdStart,
          pdEnd: targetDateDasha.pdEnd,
          periodSummaryHi: targetDateDasha.periodDescription,
          isPast: targetDateDasha.isPast,
          isFuture: targetDateDasha.isFuture,
          isCurrentToday: targetDateDasha.isCurrent,
        },
        todayDasha: {
          targetDate: todayDasha.targetDate,
          mahadasha: todayDasha.planetMD,
          mdStart: todayDasha.mdStart,
          mdEnd: todayDasha.mdEnd,
          antardasha: todayDasha.planetAD,
          adStart: todayDasha.adStart,
          adEnd: todayDasha.adEnd,
          pratyantardasha: todayDasha.planetPD,
          pdStart: todayDasha.pdStart,
          pdEnd: todayDasha.pdEnd,
          periodSummaryHi: todayDasha.periodDescription,
        },
        allMahadashasTable: allMahadashasTable.map((m) => ({
          mahadasha: m.mahadasha,
          mdStart: m.mdStart,
          mdEnd: m.mdEnd,
          durationYears: m.durationYears,
        })),
        userQueriedYear: dateParse.yearMentioned,
        isSpecificDateQueried: !targetDateDasha.isCurrent,
      },
      natalCoordinates: {
        lagna: {
          sign: masterKundli.ascendant.signName,
          lord: masterKundli.ascendant.signLord,
          starLord: masterKundli.ascendant.starLord,
          subLord: masterKundli.ascendant.subLord,
          degree: masterKundli.ascendant.dms,
        },
        moon: {
          sign: parashariData.moonSign,
          lord: parashariData.moonLord,
          nakshatra: parashariData.moonNakshatra,
        },
        sun: {
          sign: parashariData.sunSign,
        },
      },
      questionContext: {
        query: currentQuestion,
        topic: questionAnalysis.topic,
        topicHi: questionAnalysis.topicHi,
        primaryHouse: questionAnalysis.primaryHouseNum,
        primaryCuspalSubLord: questionAnalysis.cslName,
        cslStarLord: questionAnalysis.cslStarLord,
        cslSignifiedHouses: questionAnalysis.cslHousesSignified,
        kpVerdict: questionAnalysis.kpPromiseVerdictHi,
      },
      bhavaShiftsBetweenRashiAndChalit: masterKundli.bhavaShifts,
      conjunctionsPerHouseYuti: masterKundli.conjunctionsByHouse,
      specialPlanetaryAspectsDrishti: masterKundli.planetaryAspects,
      houseLordshipsBhavaBhavesh: masterKundli.houseLordships,
      placidus12Cusps: cusps.map((c: any) => ({
        house: c.houseNumber || c.cuspNumber,
        sign: c.signName || c.hindiSignName,
        signLord: c.signLord,
        starLord: c.starLord,
        cuspalSubLord: c.subLord,
        occupants: c.occupants || [],
      })),
      fourFoldSignificators: masterKundli.fourFoldSignificators,
      untenantedPlanets: masterKundli.untenantedPlanets,
      ashtakvarga: {
        houseBindusFromLagna: masterKundli.ashtakvarga.savByHouse,
        primaryHouseBindus: masterKundli.ashtakvarga.savByHouse[questionAnalysis.primaryHouseNum - 1] || 28,
        totalUniversalBindus: masterKundli.ashtakvarga.totalBindus,
      },
      divisionalD1D9D10: {
        D1_Rashi: masterKundli.shodashvarga?.D1?.placements || {},
        D9_Navamsha: masterKundli.shodashvarga?.D9?.placements || {},
        D10_Dashamsha: masterKundli.shodashvarga?.D10?.placements || {},
      },
      planetsStatus: masterKundli.planets.map((p) => ({
        name: p.name,
        sign: p.signName || p.hindiSignName,
        d1House: p.d1House,
        bhavaChalitHouse: p.bhavaChalitHouse,
        hasBhavaShift: p.hasBhavaShift,
        degreeInSign: p.degreeInSign,
        starLord: p.starLord,
        subLord: p.subLord,
        dignity: p.dignity,
        isRetrograde: Boolean(p.isRetrograde),
        isCombust: p.isCombust,
        baladiAvastha: p.baladiAvastha,
        avasthaDetailHi: p.avasthaDescriptionHi,
        hasDigbala: p.hasDigbala,
        isUntenanted: p.isUntenanted,
      })),
      badhakaInformation: masterKundli.badhakaInfo,
      nodeRepresentationAgents: masterKundli.nodeRepresentation,
      currentTransitsGochar: {
        saturnHouseFromLagna: gocharData.transitPlanets.find((p: any) => p.name === 'Saturn')?.houseFromLagna,
        saturnHouseFromMoon: gocharData.transitPlanets.find((p: any) => p.name === 'Saturn')?.houseFromMoon,
        sadeSatiVerdict: gocharData.sadeSati.summaryHi,
        jupiterHouseFromLagna: gocharData.transitPlanets.find((p: any) => p.name === 'Jupiter')?.houseFromLagna,
        jupiterHouseFromMoon: gocharData.transitPlanets.find((p: any) => p.name === 'Jupiter')?.houseFromMoon,
        doubleTransitActivation: masterKundli.liveGochar.doubleTransitHouses,
      },
      timingForecast: questionAnalysis.timingWindowHi,
    };

    const userAskedTiming = /kab|when|timing|samay|date|year|month|kisme|kis varsh|kab tak|कब|समय|तिथि|वर्ष|कब होगा|कब तक/i.test(currentQuestion);
    const userAskedRemedy = /upay|remedy|puja|path|ratna|stone|mantra|daan|solution|उपाय|निवारण|पूजा|दान|मंत्र|रत्न|समाधान|क्या करूं|kya karun/i.test(currentQuestion);

    // 🌟 BUILD EXPLICIT VERIFIED KP CALCULATION TABLE (ZERO-HALLUCINATION GROUND TRUTH)
    const planetHousesOwnedMap: Record<string, number[]> = {};
    (masterKundli.houseLordships || []).forEach((hl: any) => {
      if (hl.signLord) {
        const lordKey = hl.signLord.trim();
        if (!planetHousesOwnedMap[lordKey]) planetHousesOwnedMap[lordKey] = [];
        planetHousesOwnedMap[lordKey].push(hl.houseNumber);
      }
    });

    const standardPlanetOrder = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
    const sortedPlanets = [...masterKundli.planets].sort((a, b) => {
      const idxA = standardPlanetOrder.indexOf(a.name);
      const idxB = standardPlanetOrder.indexOf(b.name);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });

    const verifiedPlanetsMarkdown = sortedPlanets.map((p) => {
      const ownedHouses = planetHousesOwnedMap[p.name]?.length
        ? planetHousesOwnedMap[p.name].sort((x, y) => x - y).join(', ')
        : 'None';
      const degreeStr = p.formattedSignDMS || (p.degreeInSign !== undefined ? `${p.degreeInSign.toFixed(2)}°` : `${p.longitude.toFixed(2)}°`);
      const nakStr = p.nakshatraName || (p as any).nakshatra || '';
      const padaStr = p.nakshatraPada ? ` (Pada ${p.nakshatraPada})` : '';
      const houseOccupied = p.bhavaChalitHouse || p.houseOccupied || p.d1House || 1;
      return `| ${p.name} | ${degreeStr} | ${p.signName} | ${p.signLord} | ${nakStr}${padaStr} | ${p.starLord} | ${p.subLord} | House ${houseOccupied} | Houses ${ownedHouses} |`;
    }).join('\n');

    const cuspsSource = (masterKundli.cusps && masterKundli.cusps.length === 12)
      ? masterKundli.cusps
      : (activeChart.cusps && activeChart.cusps.length === 12)
        ? activeChart.cusps
        : [];

    const verifiedCuspsMarkdown = cuspsSource.map((c: any) => {
      const hNum = c.houseNumber || c.cuspNumber;
      const degreeStr = c.formattedSignDMS || (c.degreeInSign !== undefined ? `${c.degreeInSign.toFixed(2)}°` : `${c.longitude.toFixed(2)}°`);
      const nakIdx = Math.floor(((Number(c.longitude) % 360 + 360) % 360) / (360 / 27));
      const nakStr = c.nakshatraName || c.nakshatra || (NAKSHATRAS && NAKSHATRAS[nakIdx] ? NAKSHATRAS[nakIdx].name : '');
      return `| Cusp ${hNum} | ${degreeStr} | ${c.signName} | ${c.signLord} | ${nakStr} | ${c.starLord} | ${c.subLord} |`;
    }).join('\n');

    const masterSystemPrompt = `You are "VedicWisdom", a sharp, perceptive, and deeply knowledgeable Indian Astrologer sitting face-to-face with a client.

### MANDATORY GROUNDING RULE (ZERO HALLUCINATION):
Never compute or guess any planet's or cusp's Sign Lord, Star Lord (Nakshatra Lord), or Sub-Lord from memory. You MUST read every planet's and cusp's Sign Lord, Star Lord, and Sub-Lord strictly and verbatim from the provided VERIFIED_KP_CALCULATION_TABLE below.
Before writing your final answer, internally verify every single planet you mention (for example, if checking a Cuspal Sub-Lord like Mercury, look up Mercury's row in VERIFIED_KP_CALCULATION_TABLE and copy its exact Star Lord and Sub-Lord). Any mismatch between your text and VERIFIED_KP_CALCULATION_TABLE is strictly forbidden.

### VERIFIED_KP_CALCULATION_TABLE:
#### PLANETS TABLE:
| Planet | Degree | Sign | Sign Lord | Nakshatra | Star Lord (NL) | Sub Lord (SL) | House Occupied | Houses Owned |
|---|---|---|---|---|---|---|---|---|
${verifiedPlanetsMarkdown}

#### CUSPS TABLE (1 TO 12):
| House Cusp | Degree | Sign | Sign Lord | Nakshatra | Star Lord (NL) | Sub Lord (SL) |
|---|---|---|---|---|---|---|
${verifiedCuspsMarkdown}

1. STRICT LANGUAGE & TONE LOCK:
- Follow the active UI language (uiLanguage: "${clientLanguage}"): if "hi", respond in warm, natural spoken Hindi (Devanagari); if "en", respond in natural, articulate Indian English. Even if the client asks in Hinglish or romanized text, you MUST reply strictly in the active UI language (${clientLanguage === 'hi' ? 'Pure, natural Hindi in Devanagari script' : 'Natural, articulate English'}).
- NEVER address the user as "पंडित जी" (you are the astrologer, they are the client).
- NEVER use a repetitive 3-paragraph formula, numbered headings, bullet lists, or generic closing sermons ("धैर्य और योजना से आगे बढ़ें").
- Write like two intelligent people having a real conversation—concise, natural, and directly focused on what the client actually asked (140–210 words).

2. UNDERSTAND THE QUESTION'S NATURE FIRST:
- Read the client's exact intent: Are they asking for a general career direction, a job vs. business choice, timing of a change, or solving a current struggle? Answer that exact point first without wandering into unrelated houses (never discuss the 4th house of property when asked about career unless it directly links to a specific job transfer).

3. BHAVAT BHAVAM (DERIVED HOUSES / भावात भावम) RULE FOR FAMILY MEMBERS & RELATIVES:
Whenever the client asks about any family member or relative (spouse, children, mother, father, siblings, grandparents, maternal relatives, business partners, etc.), you MUST automatically apply the classical principle of Bhavat Bhavam (Derived House Rotation) combined with KP Cuspal Sub-Lord (CSL) and Parashari analysis:

- PART 1: RELATIVE BASE HOUSE MAPPING (PRIMARY HOUSE OF EACH RELATIVE = HOUSE X):
  • Self (Native): House 1
  • Younger Siblings (छोटे भाई-बहन): House 3
  • Mother (माता): House 4
  • 1st Child (पहली संतान / बेटा / बेटी): House 5
  • Maternal Uncle / Aunt (मामा-मामी): House 6
  • Spouse / Life Partner / Business Partner (पत्नी / पति / साझेदार): House 7
  • 2nd Child (दूसरी संतान — 3rd from 5th): House 7
  • Father (पिता): House 9
  • 3rd Child (तीसरी संतान — 3rd from 7th): House 9
  • Elder Siblings / Friends (बड़े भाई-बहन / मित्र): House 11
  • 4th Child (चौथी संतान — 3rd from 9th): House 11
  • Father's Mother / Paternal Grandmother (दादी — 4th from 9th): House 12
  • Father's Father / Paternal Grandfather (दादा — 9th from 9th): House 5
  • Mother's Father / Maternal Grandfather (नाना — 9th from 4th): House 12
  • Mother's Mother / Maternal Grandmother (नानी — 4th from 4th): House 7

- PART 2: DERIVED HOUSE CALCULATION FORMULA (ROTATING FROM HOUSE X):
  Once the relative's Base House X is locked, calculate the queried life aspect of that relative using inclusive counting:
  Derived House = ((X + Offset - 2) % 12) + 1
  1. Personality, Nature & Appearance (व्यक्तित्व और स्वभाव): 1st from X (House X itself)
  2. Wealth, Bank Balance & Speech (धन, कुटुंब और वाणी): 2nd from X (e.g. for Spouse [7], it is 8th house; for Mother [4], it is 5th house)
  3. Courage, Communication & Younger Sibling (पराक्रम और संवाद): 3rd from X
  4. Home, Property, Vehicles & Peace (सुख, संपत्ति और वाहन): 4th from X (e.g. for Spouse [7], it is 10th house; for 1st Child [5], it is 8th house)
  5. Education, Intelligence & Speculation (शिक्षा और बुद्धि): 5th from X (e.g. for 1st Child [5], 5th from 5th = 9th house; for Spouse [7], 5th from 7th = 11th house)
  6. Health Issues, Diseases, Debts & Enemies (रोग, स्वास्थ्य और शत्रु): 6th from X (e.g. for Spouse [7], 6th from 7th = 12th house; for Father [9], 6th from 9th = 2nd house; for Mother [4], 6th from 4th = 9th house)
  7. Longevity & Sudden Events (आयु और संकट): 8th from X (e.g. for Spouse [7], 8th from 7th = 2nd house; for Father [9], 8th from 9th = 4th house)
  8. Luck, Dharma & Higher Studies (भाग्य और उच्च शिक्षा): 9th from X (e.g. for 1st Child [5], 9th from 5th = 1st house)
  9. Career, Profession, Status & Karma (करियर, व्यवसाय और पद-प्रतिष्ठा): 10th from X (e.g. for Spouse [7], career is 10th from 7th = 4th house; for 1st Child [5], career is 10th from 5th = 2nd house; for Father [9], career is 10th from 9th = 6th house)
  10. Gains, Income & Fulfillment of Desires (आय, लाभ और इच्छापूर्ति): 11th from X (e.g. for Spouse [7], income is 11th from 7th = 5th house; for 1st Child [5], income is 11th from 5th = 3rd house)
  11. Hospitalization, Losses & Foreign Travel (व्यय, अस्पताल और विदेश): 12th from X

- PART 3: MANDATORY STEP-BY-STEP EXECUTION & OUTPUT FORMAT FOR RELATIVE QUERIES:
  1. Explicitly State the Derived House Logic First: Show the mathematical rotation clearly in opening sentences (e.g. ${bhavatBhavam ? `"${bhavatBhavam.formulaDisplayHi}" / "${bhavatBhavam.formulaDisplayEn}"` : '"पत्नी का मुख्य भाव = ७वाँ भाव। पत्नी के करियर के लिए ७वें से १०वाँ भाव = कुंडली का ४था भाव देखा जाएगा।"'}).
  2. Read Exact Cuspal Sub-Lord (CSL) from VERIFIED_KP_CALCULATION_TABLE: Inspect the CSL, Star Lord (NL), and Sub-Lord (SL) of that derived house strictly without guessing, checking supportive houses relative to X (2, 6, 10, 11 from X for career/wealth; 1, 5, 11 from X for health recovery; 6, 8, 12 from X for illness).
  3. Check Active Dasha-Antardasha: Evaluate the running Mahadasha/Antardasha lords in relation to those derived houses.
  4. Always Conclude with the 120-150 Word Plain-Language Summary Section below the \`---\` line.

4. COMPLETE KP 3-TIER CHAIN + PARASHARI DASHA-GOCHAR SYNTHESIS:
- Trace the complete 3-tier KP logic for the relevant house:
  (A) Planet (Source): Explain the Cuspal Sub-Lord (CSL), its house placement and ownership, and explicitly note if it is Untenanted (no planet occupying its stars, meaning it acts as a direct, unhindered source of its own houses).
  (B) Star Lord (Result Giver): What actual results its Nakshatra Lord delivers across 4-fold significations (L1–L4) (favorable vs opposing houses). Must match the Star Lord verbatim from VERIFIED_KP_CALCULATION_TABLE.
  (C) Sub-Lord (Quality & Final Approval): How the Sub-Lord modifies the quality, speed, or gives final sanction to the event. Must match the Sub-Lord verbatim from VERIFIED_KP_CALCULATION_TABLE.
- Parashari & Gochar Synthesis: Weave Parashari house lord placement, Yuti, Drishti, active Vimshottari Mahadasha-Antardasha-Pratyantardasha, live Gochar (Saturn & Jupiter transits), and the Double Transit principle (Saturn + Jupiter simultaneous activation) into natural, flowing sentences.
- Cross-match with Purified Live Ruling Planets: Incorporate current Live Ruling Planets to corroborate the astrological reading.

5. CONDITIONAL TIMING & REMEDIES (NO FORCED REPETITIVE BOXES):
- Timing (समयावधि): ${userAskedTiming ? 'The client has explicitly asked WHEN / Timing ("kab" / "when" / "samay"). State the exact calculated event timing window derived from Ruling Planets + Dasha + Double Transit Gochar.' : 'The client did NOT ask for event timing. Do NOT force a dedicated timing window, dates, or time box into this response.'}
- Remedies (उपाय): ${userAskedRemedy ? 'The client has explicitly asked for remedies ("upay" / "remedy" / "solution"). Suggest 1 or 2 grounded, practical, and sattvic astrological remedies aligned with their chart.' : 'The client did NOT ask for remedies. Do NOT append forced astrological remedies or upay.'}
- Deliver a clear, authoritative, and direct astrological verdict on the client’s inquiry without unnecessary boilerplate or generic filler.

6. MANDATORY CONCLUDING SECTION: BEGINNER-FRIENDLY PLAIN-LANGUAGE SUMMARY (STRICTLY 120 TO 150 WORDS):
At the very end of EVERY response—after completing the detailed Parashari & KP technical analysis above—you MUST append a distinct, easy-to-understand concluding summary separated by a horizontal line (\`---\`).
- Required Markdown Heading:
  ${clientLanguage === 'hi' ? 'Use the EXACT heading:\n  ### सरल शब्दों में मुख्य निष्कर्ष (आसान सारांश)' : 'Use the EXACT heading:\n  ### Simple Takeaway (Easy-to-Understand Summary)'}
- Strict Length: Strictly 120 to 150 words maximum.
- Zero Technical Jargon: Strictly DO NOT use complex Sanskrit, astrological, or KP terms in this concluding section (avoid words like Sub-Lord, Nakshatra, Dasha, Antardasha, Mahadasha, Ascendant, Lagna, 10th Cusp, CSL, Star Lord, Significator, Bhava Chalit, Gochar, or House numbers).
- Direct & Actionable Everyday Guidance:
  1. What the current and upcoming phase actually means in plain human language for the client\'s question (favorable, slow, or requiring caution).
  2. Clear timelines and months in plain calendar terms (e.g. \'Starting from May next year\', \'Over the next 2 to 4 months\').
  3. One or two simple, practical real-world steps or peaceful habits they can follow immediately.
Ensure the main detailed technical analysis above this summary remains complete, rigorous, and strictly grounded in VERIFIED_KP_CALCULATION_TABLE.

${bhavatBhavam ? `
ACTIVE BHAVAT BHAVAM DERIVED ROTATION (PROGRAMMATICALLY VERIFIED BY ENGINE):
${JSON.stringify({
  targetRelative: bhavatBhavam.relative.nameEn,
  relativeNameHi: bhavatBhavam.relative.nameHi,
  baseHouseX: bhavatBhavam.baseHouseX,
  queriedAspect: bhavatBhavam.aspect.nameEn,
  aspectOffsetFromX: bhavatBhavam.offset,
  targetDerivedNatalHouse: bhavatBhavam.derivedHouse,
  formulaDisplayHi: bhavatBhavam.formulaDisplayHi,
  formulaDisplayEn: bhavatBhavam.formulaDisplayEn,
  supportiveNatalHousesForRelative: bhavatBhavam.relativeSupportiveHouses,
  negatingNatalHousesForRelative: bhavatBhavam.relativeNegatingHouses,
  targetCuspToEvaluateInTable: bhavatBhavam.derivedHouse,
}, null, 2)}
` : ''}

PRE-FILTERED INTENT-DRIVEN ASTROLOGICAL DATA SLICE (STRICT GROUND TRUTH):
${JSON.stringify(intentAstrologyData, null, 2)}

COMPLETE KP 3-TIER CHAIN & TIMING AUDIT:
${JSON.stringify({
  threeTierKpChain: astrologicalAudit.threeTierKpChain,
  timingSynthesis: astrologicalAudit.timingSynthesis,
}, null, 2)}

VERIFIED DASHA & TIMING (DO NOT GUESS OR RECALCULATE DATES):
${JSON.stringify(kundliJsonPayload.dashaDateLock, null, 2)}
`;

    const rawContents = recentMessages
      .map((msg: any) => ({
        role: (msg.role === 'model' || msg.role === 'assistant') ? 'model' : 'user',
        parts: [{ text: (msg.text || msg.content || '').trim() }],
      }))
      .filter((m: any) => m.parts[0].text.length > 0);

    // Strip leading model messages so Google GenAI strictly starts with 'user'
    while (rawContents.length > 0 && rawContents[0].role === 'model') {
      rawContents.shift();
    }

    // Ensure the last message is from the user with current question
    if (rawContents.length === 0 || rawContents[rawContents.length - 1].role !== 'user') {
      rawContents.push({ role: 'user', parts: [{ text: currentQuestion }] });
    }

    // Merge consecutive messages with the same role for strict alternation (user -> model -> user)
    const formattedContents: any[] = [];
    for (const item of rawContents) {
      if (formattedContents.length > 0 && formattedContents[formattedContents.length - 1].role === item.role) {
        formattedContents[formattedContents.length - 1].parts[0].text += `\n${item.parts[0].text}`;
      } else {
        formattedContents.push(item);
      }
    }

    // 🌟 Instant SSE Streaming Support with Abort & Timeout Protection for High Concurrency
    if (wantStream && apiKey) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          let isClosed = false;
          const safeClose = () => {
            if (!isClosed) {
              isClosed = true;
              try {
                controller.close();
              } catch (_) {}
            }
          };

          const safeEnqueue = (data: Uint8Array) => {
            if (!isClosed && !req.signal?.aborted) {
              try {
                controller.enqueue(data);
              } catch (_) {
                isClosed = true;
              }
            }
          };

          req.signal?.addEventListener('abort', () => {
            safeClose();
          });

          try {
            // Race the stream initiation against a 12s timeout
            const streamTimeout = new Promise<null>((_, reject) =>
              setTimeout(() => reject(new Error('Stream initiation timeout')), 12000)
            );
            const aiCallPromise = ai.models.generateContentStream({
              model: 'gemini-3.5-flash-lite',
              contents: formattedContents,
              config: {
                systemInstruction: masterSystemPrompt,
                temperature: 0.2,
                maxOutputTokens: 2048,
              },
            });

            const aiCall: any = await Promise.race([aiCallPromise, streamTimeout]);

            for await (const chunk of aiCall) {
              if (req.signal?.aborted || isClosed) break;
              const text = chunk.text;
              if (text) {
                safeEnqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
              }
            }
            safeEnqueue(encoder.encode(`data: [DONE]\n\n`));
            safeClose();
          } catch (streamErr) {
            console.warn('Streaming error, falling back to local synthesis:', streamErr);
            if (!req.signal?.aborted && !isClosed) {
              const fallback = synthesizeFastKPAnswer(activeChart, gocharData, currentQuestion, clientLanguage, recentMessages);
              safeEnqueue(encoder.encode(`data: ${JSON.stringify({ text: fallback })}\n\n`));
              safeEnqueue(encoder.encode(`data: [DONE]\n\n`));
            }
            safeClose();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    }

    // Non-Streaming Response (JSON API)
    let replyText = '';
    let modelUsed = '';
    const geminiErrors: string[] = [];

    if (apiKey) {
      const models = ['gemini-3.5-flash', 'gemini-3.5-flash-lite'];
      for (const m of models) {
        try {
          const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 10000));
          const aiCall = ai.models.generateContent({
            model: m,
            contents: formattedContents,
            config: {
              systemInstruction: masterSystemPrompt,
              temperature: 0.2,
              maxOutputTokens: 2048,
            },
          });
          const res: any = await Promise.race([aiCall, timeoutPromise]);
          if (res && res.text && res.text.trim().length > 10) {
            replyText = res.text.trim();
            modelUsed = m;
            break;
          } else if (!res) {
            geminiErrors.push(`${m}: timed out after 10000ms`);
          }
        } catch (e: any) {
          geminiErrors.push(`${m}: ${e?.message || String(e)}`);
        }
      }
    } else {
      geminiErrors.push('GEMINI_API_KEY not present in environment');
    }

    // Fail-safe Astrological Synthesis: Instant, zero-hang guaranteed response
    if (!replyText || replyText.trim().length === 0) {
      replyText = synthesizeFastKPAnswer(activeChart, gocharData, currentQuestion, clientLanguage, recentMessages);
      modelUsed = 'Gemini-Astro-Synthesis-Engine (High-Speed Local)';
    }

    return NextResponse.json({
      reply: replyText,
      text: replyText,
      model: modelUsed,
      debug: {
        modelUsed,
        geminiErrors,
        apiKeyConfigured: Boolean(apiKey),
        topic: userIntent.domain,
        subIntent: userIntent.subIntent,
        primaryHouse: userIntent.primaryHouses[0],
        cslName: intentAstrologyData.kpSlice.primaryCsl.planet,
        lagnaSign: parashariData.lagnaSign,
        moonSign: parashariData.moonSign,
        isFirstTurn,
        userTurnsCount,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Prediction API Error:', error);
    const fallbackMsg = (req as any)?.body?.language === 'en'
      ? 'Based on your birth chart coordinates, planetary evaluation is complete. Please ask your question again.'
      : 'आपकी कुंडली के अनुसार ग्रह स्थिति का विश्लेषण पूर्ण है। कृपया अपना प्रश्न पुनः पूछें।';
    return NextResponse.json(
      {
        reply: fallbackMsg,
        text: fallbackMsg,
        error: error?.message || 'Error occurred',
      },
      { status: 200 }
    );
  }
}
