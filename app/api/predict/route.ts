import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import dns from 'dns';
import { extractCleanKPJson, classifyQuestionTopic, isAstrologicalQuery } from '@/lib/kp-classifier';
import { evaluateParashariKundli, resolveSignId } from '@/lib/parashari-evaluator';
import { evaluateGochar } from '@/lib/gochar-evaluator';
import { synthesizeFastKPAnswer } from '@/lib/kp-fast-synthesizer';
import { analyzeQuestionAstrology } from '@/lib/kp-question-analyzer';
import { apiRateLimiter } from '@/lib/cache-manager';

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

    const activeChart = kpMatrix || kundliData;
    if (!activeChart) {
      return NextResponse.json(
        {
          error: isEnglish
            ? 'Kundli data (kundliData / kpMatrix) is missing.'
            : 'कुंडली डेटा (kundliData / kpMatrix) उपलब्ध नहीं है।',
        },
        { status: 400 }
      );
    }

    const cleanKundli = extractCleanKPJson(activeChart) || activeChart;
    const parashariData = evaluateParashariKundli(activeChart);
    const gocharData = evaluateGochar(parashariData.lagnaSignId, parashariData.moonSignId, new Date());

    const rawMessages = messages && messages.length > 0 ? messages : [];
    const recentMessages = rawMessages.slice(-10);
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
        ? '🙏 **Namaste!**\n\nI am **Astro Gemini**, dedicated exclusively to authentic Vedic Astrology, Placidus Cuspal Sub-Lord analysis, and Janma Kundli guidance.\n\nKindly ask questions pertaining to your birth chart, life destiny, career, marriage, health, finances, dasha periods, or astrological remedies.'
        : '🙏 **सादर अभिवादन!**\n\nमैं **Astro Gemini** केवल प्रामाणिक वैदिक ज्योतिष, कस्पल नक्षत्र गणना एवं जन्मकुंडली विश्लेषण के लिए समर्पित हूँ।\n\nकृपया अपने जीवन, भविष्य, करियर, नौकरी, व्यवसाय, विवाह, स्वास्थ्य, आर्थिक स्थिति, ग्रह शांति अथवा तात्कालिक गोचर से संबंधित ज्योतिषीय प्रश्न पूछें।';

      return NextResponse.json({
        reply: redirectMsg,
        text: redirectMsg,
        model: 'Astro-Gemini-Guardrail',
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

    const cusps = activeChart.cusps || [];
    const currentDBA = cleanKundli.currentRunningDBA || activeChart.currentDasha;

    // Structured Kundli JSON payload for Gemini
    const kundliJsonPayload = {
      clientBirthDetails: {
        name: birthDetails?.name || 'Native',
        dateOfBirth: birthDetails?.dateOfBirth,
        timeOfBirth: birthDetails?.timeOfBirth,
        place: birthDetails?.placeName,
        gender: birthDetails?.gender || 'male',
      },
      natalCoordinates: {
        lagna: {
          sign: parashariData.lagnaSign,
          lord: parashariData.lagnaLord,
          lordPlacementHouse: parashariData.lagnaLordHouse,
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
      runningVimshottariDBA: currentDBA,
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
      placidus12Cusps: cusps.map((c: any) => ({
        house: c.houseNumber || c.cuspNumber,
        sign: c.signName || c.hindiSignName,
        signLord: c.signLord,
        starLord: c.starLord,
        cuspalSubLord: c.subLord,
        occupants: c.occupants || [],
      })),
      planetsStatus: (activeChart.planets || []).map((p: any) => ({
        name: p.name,
        sign: p.signName || p.hindiSignName,
        degreeInSign: p.degreeInSign,
        house: p.houseOccupied,
        starLord: p.starLord,
        subLord: p.subLord,
        isRetrograde: Boolean(p.isRetrograde),
      })),
      currentTransitsGochar: {
        saturnHouseFromLagna: gocharData.transitPlanets.find((p: any) => p.name === 'Saturn')?.houseFromLagna,
        saturnHouseFromMoon: gocharData.transitPlanets.find((p: any) => p.name === 'Saturn')?.houseFromMoon,
        sadeSatiVerdict: gocharData.sadeSati.summaryHi,
        jupiterHouseFromLagna: gocharData.transitPlanets.find((p: any) => p.name === 'Jupiter')?.houseFromLagna,
        jupiterHouseFromMoon: gocharData.transitPlanets.find((p: any) => p.name === 'Jupiter')?.houseFromMoon,
      },
      timingForecast: questionAnalysis.timingWindowHi,
    };

    const masterSystemPrompt = `You are "Astro Gemini", an experienced, empathetic, and logical Indian Astrologer specializing in Krishnamurti Paddhati (KP Astrology) and Parashari Vedic Astrology. You are NOT a generic AI chatbot. You NEVER give vague, sugar-coated, or mood-pleasing answers. Every single word you speak must be strictly derived from the backend Kundli JSON data provided to you.

MANDATORY SILENT WORKFLOW (DO NOT SHOW RAW STEPS TO CLIENT):
1. Map Query to Houses: Identify the client's exact life area and map it to relevant KP Houses (e.g., Career: 2, 6, 10, 11; Marriage: 2, 7, 11; Finance: 2, 6, 11; Health/Disputes: 6, 8, 12).
2. KP & Vedic Promise Check: Check the Cuspal Sub-Lord (CSL) of the primary house and its 4-Fold Significators (L1–L4) + Star Lord. Cross-verify with Parashari Vedic house lord placement, aspects, and strength to see if the event is promised, delayed, or denied.
3. Timing Check (Dasha & Gochar): Check the currently running Vimshottari Mahadasha, Antardasha, and Pratyantardasha (DBA) along with current slow-moving planet Transits (Saturn, Jupiter, Rahu/Ketu) over natal cusps and Dasha lords.
4. Synthesize Verdict: Combine KP promise + Dasha timing + Transit trigger into a clear, factual conclusion.

FRONTEND RESPONSE RULES:
- Human Astrologer Tone: Speak like a wise, grounded, caring astrologer sitting across the table. Mirror the user's language naturally (${isEnglish ? 'English' : 'Hindi / Hinglish'}). Avoid robotic bullet dumps.
- Crisp & Direct (120–180 words): Answer the exact question directly in the first two sentences. Never write long essays.
- Logical Backing (No Superficiality): Never say "things will improve soon" without proof. Explicitly name the responsible Planet (ग्रह), House (भाव), Mahadasha/Antardasha (दशा), or Gochar (गोचर) driving the situation, translated into simple language without raw technical codes like "L2 CSL".
- Honesty & Grounded Closure: If the chart shows delay or struggle, state it honestly with empathy. End with one practical, actionable takeaway or clear timeframe. Never invent missing chart data.
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
                temperature: 0.25,
                maxOutputTokens: 450,
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
              temperature: 0.25,
              maxOutputTokens: 450,
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
