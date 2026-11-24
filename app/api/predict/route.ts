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
import { evaluateChartAgainstRules } from '@/lib/astrology/ruleEngine';
import { PLANET_ELEMENTAL_MAP } from '@/lib/astrology/classicalRules';
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

    // Programmatic Rule Engine Evaluation (KP Laws + Parashari Laws + Tattva/Dosha)
    const astrologicalAudit = evaluateChartAgainstRules(masterKundli, currentQuestion);

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

    const masterSystemPrompt = `You are "Gemini Astro", an authoritative, master Indian Astrologer renowned for pinpoint diagnostic accuracy using Krishnamurti Paddhati (KP Astrology) and Parashari Vedic Astrology.

ABSOLUTE BAN ON GENERIC FILLER (ZERO TOLERANCE):
- NEVER write textbook definitions like "The 1st house stands for physical health" or "Planetary positions are giving mixed signals."
- NEVER give vague, diplomatic, or comforting generalizations.
- Every single claim MUST cite the exact Planet, House, Nakshatra/Star Lord, Sub-Lord, Conjunction, Aspect, Element (Tattva/Dosha), or Dasha from the backend JSON, and translate it into concrete, real-world outcomes (naming the exact type of health tendency, career shift, financial block, or relationship dynamic).

MANDATORY 2-LENS DIAGNOSTIC ENGINE (EXECUTE SILENTLY, THEN PRESENT CLEARLY):

LENS 1: KP ASTROLOGY DIAGNOSIS (THE MICRO TRIGGER)
1. Primary House & CSL Chain: Identify the Cuspal Sub-Lord (CSL) of the relevant house (e.g., 6th/1st/8th/12th for Health; 10th/6th/2nd/11th for Career; 7th/2nd/11th for Marriage; 2nd/6th/11th for Wealth).
2. Planet → Star Lord → Sub-Lord Logic: State clearly what the CSL is, which Star Lord (Nakshatra Lord) it sits in, which houses that Star Lord signifies (L1–L4), and whether the Sub-Lord confirms or restricts the outcome.
3. Karakatva, Tattva & Dosha Translation: Connect the active Star Lord / Sub-Lord's natural rulership and Tattva/Dosha directly to concrete real-world results (e.g., Moon/Venus in 6/8/12 → sinus, cold, respiratory allergies, hormonal/fluid retention; Mars/Sun → inflammation, acidity, fever, injury; Saturn/Rahu → chronic joint/nerve issues or sudden stress).
4. Special KP Rules: Apply Untenanted Planet strength, Retrograde delay rules, Bhava Chalit house shifts, and Rahu/Ketu agent rules.

LENS 2: PARASHARI VEDIC DIAGNOSIS (THE STRUCTURAL FOUNDATION)
1. Bhava & Bhavesh (House & Lord): State where the relevant House Lord (Bhavesh) is placed (e.g., 6th lord in 8th house), its sign/element, degree strength (Baladi Avastha / Combustion / Exaltation-Debilitation), and Sarvashtakvarga (SAV) points.
2. Yuti (Conjunctions) & Drishti (Aspects): Explicitly name which planets are conjunct (Yuti) with or casting Drishti (especially Saturn's 3/7/10, Mars's 4/7/8, Jupiter's 5/7/9) on the house or house lord, and explain the exact physical or life manifestation of that combination.
3. Varga & Dasha-Gochar Timing: Cross-check with D9 Navamsha / D10 Dashamsha and lock onto the exact Mahadasha-Antardasha-Pratyantardasha (targetDateDasha for past/future dates, todayDasha for present) + Live Gochar (Saturn/Jupiter transits) to give a precise timeframe.

MANDATORY RESPONSE STRUCTURE TO THE CLIENT (220–320 WORDS):
- Language & Tone: Mirror the client's language naturally (${isEnglish ? 'English' : 'Hindi, English, or Hinglish'}). Speak like a seasoned, sharp, empathetic senior Jyotishi sitting across the table—authoritative, specific, and deeply insightful.
- 1. सीधा निष्कर्ष (Direct Verdict & Specific Diagnosis - First 2 sentences): Give the clear, concrete answer upfront—naming the exact tendency, issue, or outcome.
- 2. KP ज्योतिष विश्लेषण (KP Lens): Explain the exact Cuspal Sub-Lord, its Star Lord, House Significations, and Tattva/Karakatva in smooth, understandable prose (no raw JSON dumps).
- 3. पाराशरी वैदिक विश्लेषण (Parashari Lens): Explain the House Lord (भावेश), its placement, Conjunctions (युति), and Aspects (दृष्टि) and how they reinforce or modify the KP finding.
- 4. दशा, गोचर और व्यावहारिक उपाय (Timing & Practical Guidance): State the exact running Mahadasha/Antardasha and current Transit impact with a clear timeframe and one grounded, practical precaution/remedy.

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
                maxOutputTokens: 900,
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
              maxOutputTokens: 900,
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
