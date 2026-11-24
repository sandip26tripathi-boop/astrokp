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
import { extractQueriedTargetDate, getDashaForDate, getAllMahadashasTable } from '@/lib/dasha-date-resolver';
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
    const recentMessages = rawMessages.slice(-6); // Maintain last 6 turns context
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
        ? '🙏 **Namaste!**\n\nI am **Gemini Astro**, dedicated exclusively to authentic Vedic Astrology, Placidus Cuspal Sub-Lord analysis, and Janma Kundli guidance.\n\nKindly ask questions pertaining to your birth chart, life destiny, career, marriage, health, finances, dasha periods, or astrological remedies.'
        : '🙏 **सादर अभिवादन!**\n\nमैं **Gemini Astro** केवल प्रामाणिक वैदिक ज्योतिष, कस्पल नक्षत्र गणना एवं जन्मकुंडली विश्लेषण के लिए समर्पित हूँ।\n\nकृपया अपने जीवन, भविष्य, करियर, नौकरी, व्यवसाय, विवाह, स्वास्थ्य, आर्थिक स्थिति, ग्रह शांति अथवा तात्कालिक गोचर से संबंधित ज्योतिषीय प्रश्न पूछें।';

      return NextResponse.json({
        reply: redirectMsg,
        text: redirectMsg,
        model: 'Gemini-Astro-Guardrail',
        debug: { topic: 'Off-Topic Redirection', isAstrological: false },
      });
    }

    // Deep KP & Parashari Question Analysis using exact Kundli data
    const questionAnalysis = analyzeQuestionAstrology(
      activeChart,
      parashariData,
      gocharData,
      currentQuestion,
      birthDetails
    );

    // Ensure comprehensive Master Kundli JSON from backend calculation engine
    let masterKundli: MasterKundliJSON;
    if (activeChart.masterKundli) {
      masterKundli = activeChart.masterKundli;
    } else {
      const bInput: ChartInput = {
        name: birthDetails?.name || 'Native',
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

    // Historical & Target Date Resolution (e.g., 2014, 2028, next year)
    const dateParse = extractQueriedTargetDate(currentQuestion);
    const targetDateDasha = getDashaForDate(masterKundli.full120YearDashaTimeline, dateParse.targetDate);
    const todayDasha = getDashaForDate(masterKundli.full120YearDashaTimeline, new Date());
    const allMahadashasTable = masterKundli.allMahadashasTable || getAllMahadashasTable(masterKundli.full120YearDashaTimeline);

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

    const masterSystemPrompt = `You are "Gemini Astro", a master Indian Astrologer with deep classical command over both Krishnamurti Paddhati (KP Astrology) and Parashari Vedic Astrology. You NEVER guess, generalize, or give mood-pleasing answers. Every conclusion must be deduced silently from the client's Backend Master Kundli JSON.

MANDATORY SILENT ANALYSIS PIPELINE (NEVER DUMP RAW JSON, TABLES, OR TECHNICAL CODES TO CLIENT):

1. STRICT DASHA LOCK:
- Never compute Dasha dates yourself. Read the exact Mahadasha, Antardasha, and Pratyantardasha directly from targetDateDasha (if the user asks about a specific past/future year like 2014 or 2029) or todayDasha (for present/upcoming questions).

2. COMPLETE KP ASTROLOGY RULEBOOK:
- House Grouping (Positive vs. Negating Houses): Map the query to its primary house and supportive vs. negating house group:
  - Career / Promotion / Job: 2, 6, 10, 11 (Supportive) vs 5, 8, 12 (Change/Loss/Obstacles).
  - Marriage / Relationship: 2, 7, 11 (Supportive) vs 1, 6, 10 (Denial/Separation).
  - Wealth / Gains: 2, 6, 11 (Supportive) vs 5, 8, 12 (Loss/Drain).
  - Education: 4, 9, 11 (Supportive) vs 3, 8 (Break).
  - Health / Litigation: 1, 5, 11 (Recovery/Victory) vs 6, 8, 12 (Disease/Hospitalization/Defeat).
  - Property / Vehicle: 4, 11, 12 (Purchase) vs 3, 8 (Loss).
  - Foreign Travel / Settlement: 3, 9, 12 (Supportive) vs 2, 4, 11 (Stay at homeland).
- CSL Promise Formula: Inspect the Cuspal Sub-Lord (CSL) of the primary house:
  - Planet = Source, Star Lord (Nakshatra Lord) = Actual Result, Sub-Lord = Quality & Final Approval/Denial.
  - If the CSL's Star Lord signifies supportive houses and its Sub-Lord also confirms supportive houses (without strong negation), the event is promised.
- Untenanted, Retrograde, Bhava Shift & Node Rules:
  - Untenanted Planet: Gives strong, direct results of the houses it occupies and owns, in addition to its Star Lord.
  - Retrograde Planet: Delays, stalls, or forces re-attempts only if posited in the star of a retrograde planet; if in the star of a direct planet, it eventually delivers results.
  - Bhava Chalit Shift: Always judge house occupancy from the KP Placidus Bhava house, not just the D1 Rashi chart.
  - Rahu / Ketu: Act as agents of their conjoined planets, aspecting planets, Star Lord, and Sign Lord in that order of priority.
- Ruling Planets (RP): Use live Ruling Planets to confirm immediate timing triggers.

3. COMPLETE PARASHARI VEDIC RULEBOOK (CROSS-VERIFICATION):
- Bhava, Bhavesh & Functional Nature: Check the relevant house, occupants, and House Lord (Bhavesh) placement (Kendra 1,4,7,10 / Trikona 1,5,9 strength vs. Trik 6,8,12 or Badhaka obstruction), plus Yogakaraka status for the client's Ascendant.
- Planetary Strength, Degrees & Avastha: Check exact degrees (0°–30°), Yuva Avastha (12°–18° full power) vs Bala/Vriddha/Mrita (weak degree), Combustion (अस्त), Exaltation/Debilitation, and Vargottama status.
- Drishti & Yuti: Evaluate close conjunctions (Yuti) and aspects (Drishti)—especially Saturn (3, 7, 10), Mars (4, 7, 8), and Jupiter (5, 7, 9)—on the house, house lord, and Dasha lord.
- Ashtakvarga & Divisional Confirmation: Check Sarvashtakvarga (SAV) bindus of the house (28+ strong, <25 weak) and Bhinna Ashtakvarga (BAV) points (4+ strong) of the active Dasha lord, cross-checked with D9 Navamsha and D10 Dashamsha.

4. TIMING SYNTHESIS (DBA + DOUBLE TRANSIT):
- Confirm exact timing when the running Mahadasha-Antardasha-Pratyantardasha lords signify the event AND Live Gochar (Saturn & Jupiter Double Transit) activates the relevant natal houses/cusps.

FRONTEND RESPONSE RULES (HOW TO SPEAK TO THE CLIENT):
- Human Astrologer Persona: Speak with the calm wisdom, empathy, and clarity of a senior Indian Jyotishi sitting across the table. Mirror the user's language naturally (${isEnglish ? 'English' : 'Hindi, English, or Hinglish'}). Build seamlessly on prior chat turns for follow-up questions without repeating intros.
- Crisp & Direct (140–200 words): Give the direct, unambiguous answer in the first two sentences. No long essays or robotic bullet lists.
- Logical Proof in Simple Words: Explain why clearly by naming the responsible Planet (ग्रह), House & House Lord (भाव/भावेश), Degree/Strength (अंश/बल), Aspects/Conjunctions (दृष्टि/युति), Nakshatra/Sub-Lord, Exact Mahadasha/Antardasha (दशा), and Ashtakvarga/Transit (गोचर)—translating technical KP/Vedic rules into everyday language without raw codes like "L2 CSL".
- Honesty & Practical Closure: If the chart shows delay, weak degree, or obstruction, state it honestly with empathy and end with one grounded, actionable takeaway.
- Remedies On Demand: Do NOT append remedies unless explicitly asked by the client.

BACKEND KUNDLI JSON DATA:
${JSON.stringify(kundliJsonPayload, null, 2)}
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

    // 🌟 Instant SSE Streaming Support
    if (wantStream && apiKey) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const aiCall = await ai.models.generateContentStream({
              model: 'gemini-3.5-flash-lite',
              contents: formattedContents,
              config: {
                systemInstruction: masterSystemPrompt,
                temperature: 0.2,
                maxOutputTokens: 520,
              },
            });

            for await (const chunk of aiCall) {
              const text = chunk.text;
              if (text) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
              }
            }
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
            controller.close();
          } catch (streamErr) {
            console.warn('Streaming error, falling back to local synthesis:', streamErr);
            const fallback = synthesizeFastKPAnswer(activeChart, gocharData, currentQuestion, clientLanguage, recentMessages);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: fallback })}\n\n`));
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
            controller.close();
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
              maxOutputTokens: 520,
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
      modelUsed = 'Astro-Gemini-Synthesis-Engine (High-Speed Local)';
    }

    return NextResponse.json({
      reply: replyText,
      text: replyText,
      model: modelUsed,
      debug: {
        modelUsed,
        geminiErrors,
        apiKeyConfigured: Boolean(apiKey),
        topic: questionAnalysis?.topic || 'general',
        primaryHouse: questionAnalysis?.primaryHouseNum,
        cslName: questionAnalysis?.cslName,
        lagnaSign: parashariData.lagnaSign,
        moonSign: parashariData.moonSign,
        isFirstTurn,
        userTurnsCount,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Prediction API Error:', error);
    return NextResponse.json(
      {
        reply: 'आपकी कुंडली के अनुसार ग्रह स्थिति का विश्लेषण पूर्ण है। कृपया अपना प्रश्न पुनः पूछें।',
        text: 'आपकी कुंडली के अनुसार ग्रह स्थिति का विश्लेषण पूर्ण है। कृपया अपना प्रश्न पुनः पूछें।',
        error: error?.message || 'Error occurred',
      },
      { status: 200 }
    );
  }
}
