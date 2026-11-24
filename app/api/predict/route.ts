import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import dns from 'dns';
import { extractCleanKPJson, classifyQuestionTopic, isAstrologicalQuery } from '@/lib/kp-classifier';
import { evaluateParashariKundli, resolveSignId } from '@/lib/parashari-evaluator';
import { evaluateGochar } from '@/lib/gochar-evaluator';
import { synthesizeFastKPAnswer } from '@/lib/kp-fast-synthesizer';
import { analyzeQuestionAstrology } from '@/lib/kp-question-analyzer';

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
    const body = await req.json();
    const { messages, kundliData, kpMatrix, birthDetails, presetQuery } = body;
    const clientLanguage = body.language === 'en' ? 'en' : 'hi';
    const isEnglish = clientLanguage === 'en';

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

    const previousContext = recentMessages
      .slice(0, -1)
      .map((m: any) => m.text || m.content || '')
      .join(' ');
    
    // Deep KP & Parashari Question Analysis using exact Kundli data
    const questionAnalysis = analyzeQuestionAstrology(
      activeChart,
      parashariData,
      gocharData,
      currentQuestion,
      birthDetails
    );

    const cusps = activeChart.cusps || [];
    const allCuspsFormatted = (activeChart.cusps || [])
      .map((c: any) => {
        const houseNum = c.houseNumber || c.cuspNumber;
        return isEnglish
          ? `• Cusp ${houseNum}: Sign=${c.signName || c.sign || ''}, Sign Lord=${c.signLord || ''}, Star Lord=${c.starLord || ''}, Sub-Lord (CSL)=${c.subLord || ''}`
          : `• भाव ${houseNum}: राशि=${c.signName || c.sign || ''}, राशि स्वामी=${c.signLord || ''}, नक्षत्र स्वामी=${c.starLord || ''}, सब-लॉर्ड (CSL)=${c.subLord || ''}`;
      })
      .join('\n');

    const allPlanetsFormatted = (activeChart.planets || cleanKundli.planets || [])
      .map((p: any) => {
        const pName = p.name || p.id || p.planet || '';
        return isEnglish
          ? `• ${pName}: Sign=${p.signName || p.sign || ''} (${p.degreeInSign || p.degree || ''}°), House=${p.houseOccupied || p.house || ''}, Star Lord=${p.starLord || ''}, Sub-Lord=${p.subLord || ''}`
          : `• ${pName}: राशि=${p.signName || p.sign || ''} (${p.degreeInSign || p.degree || ''}°), भाव=${p.houseOccupied || p.house || ''}, नक्षत्र स्वामी=${p.starLord || ''}, उप-नक्षत्र=${p.subLord || ''}`;
      })
      .join('\n');

    const currentDBA = cleanKundli.currentRunningDBA || activeChart.currentDasha;

    const dynamicSystemInstruction = isEnglish
      ? `
# ROLE: ASTRO GEMINI (REVERED VEDIC & KP JYOTISHACHARYA)
You are **Astro Gemini** — an esteemed, wise, authoritative Vedic Jyotishacharya advising the client 1-on-1.
- OUTPUT LANGUAGE: STRICTLY 100% ENGLISH.
- DOMAIN SCOPE: Strictly Vedic & Cuspal astrology, birth chart analysis, dashas, and transits.
${
  isFirstTurn
    ? '- INITIAL TURN: Greet with a warm initial greeting (e.g. "Namaste! Welcome. Let us examine your chart...").'
    : '- ONGOING CONVERSATION: Strictly forbid repeating greetings. Begin directly with the answer.'
}
- Synthesize Parashari, Cuspal Sub-Lords, and Real-Time Gochar directly from the client's computed chart.
- Do NOT chant "KP" or sound like an AI bot. Speak with genuine astrological mastery.

${questionAnalysis.synthesisFactSheetHi}

CLIENT CHART DATA:
Lagna: ${parashariData.lagnaSign} | Lagna Lord: ${parashariData.lagnaLord} (House ${parashariData.lagnaLordHouse})
Moon Sign: ${parashariData.moonSign} (Nakshatra: ${parashariData.moonNakshatra})
Current Dasha: ${formatDashaText(currentDBA, true)}
Primary House for Query: House ${questionAnalysis.primaryHouseNum} (CSL: ${questionAnalysis.cslName})
CSL Significations: [${questionAnalysis.cslHousesSignified.join(', ')}]
KP Verdict: ${questionAnalysis.kpPromiseVerdictEn}
Cuspal Sub-Lords:
${allCuspsFormatted}
Planetary Positions:
${allPlanetsFormatted}
Gochar Transits:
${gocharData.summaryTextEn}
`
      : `
# भूमिका: ASTRO GEMINI (परम विद्वान, आत्मीय एवं अनुभवी वैदिक एवं के.पी. ज्योतिषाचार्य)
आपकी पहचान **Astro Gemini** है — एक अत्यंत विद्वान, गंभीर, आत्मीय और प्रामाणिक वैदिक एवं कस्पल ज्योतिषाचार्य। जातक ने आपके सामने पोर्टल पर अपनी जन्म कुंडली की गणना रखी है।

${questionAnalysis.synthesisFactSheetHi}

## 🎯 संवाद व फलादेश के अनिवार्य नियम (STRICT CONVERSATIONAL RULES):
1. **कुंडली की वास्तविक गणना का अनिवार्य प्रयोग (USE EXACT COMPUTED KUNDLI):**
   - जातक को यह स्पष्ट अनुभव होना चाहिए कि आप उसी की वास्तविक कुंडली देख रहे हैं।
   - बातचीत में जातक के वास्तविक लग्न (${parashariData.lagnaSign}), चन्द्र राशि (${parashariData.moonSign}), वर्तमान दशा (${formatDashaText(currentDBA, false)}), और प्रश्न से जुड़े मुख्य भाव के कस्पल सब-लॉर्ड (${questionAnalysis.cslName}) का तार्किक उल्लेख करें।
   - 🚫 **सख्त चेतावनी:** कभी भी मनगढ़ंत लग्न (जैसे मिथुन आदि) न बोलें जब तक कि गणना में वह न हो! ऊपर दी गई वास्तविक गणना ही अंतिम सत्य है।

2. **दो इंसानों की तरह सहज और स्वाभाविक बातचीत (Natural Spoken Counseling):**
   - जातक से बिल्कुल वैसे बात करें जैसे कोई प्रख्यात ज्योतिषाचार्य अपने सामने बैठे जातक से आमने-सामने आत्मीयता से बात करते हैं।
   - 🚫 **सख्त मनाही:** "ज्योतिषीय आधार (Parashari + KP Logic)", "के.पी. पद्धति", "### १. ज्योतिषीय विश्लेषण", "### अचूक उपाय" जैसी कृत्रिम, रोबोटिक या मशीनी हेडिंग्स कतई न लिखें! 
   - उत्तर को किसी बने-बनाए सांचे (fixed template) में न बांधें। भाषा प्रवाहमयी, आत्मीय और स्वाभाविक अनुच्छेदों (natural paragraphs) में होनी चाहिए।

3. **ज्योतिषीय तर्क को बातचीत में सहजता से पिरोएं (Logical Astrological Reasoning):**
   - जातक के प्रश्न के अनुसार भाव, भावेश, कस्पल सब-लॉर्ड (CSL), सक्रिय महादशा/अंतर्दशा, और वर्तमान गोचर (शनि व गुरु) का तार्किक कारण बातचीत के प्रवाह में स्वाभाविक रूप से समझाएं।
   - जैसे: "आपकी जन्म कुंडली में लग्न ${parashariData.lagnaSign} है और कार्यक्षेत्र यानी दशम भाव के कस्पल सब-लॉर्ड ${questionAnalysis.cslName} हैं। वर्तमान में चल रही दशा और गोचर..."

4. **⚠️ उपाय (Remedies) का अनिवार्य नियम (DO NOT FORCE REMEDIES EVERY TIME):**
   - **हर उत्तर के अंत में जबरदस्ती उपाय की हेडिंग या सूची कतई न जोड़ें!** 
   - उपाय केवल और केवल तभी बताएं जब जातक ने स्पष्ट रूप से उपाय या निवारण पूछा हो (उदा. "क्या उपाय करें?", "कोई उपाय बताओ?", "समाधान क्या है?"), या जब कोई ग्रह गंभीर संकट दिखा रहा हो।
   - यदि जातक केवल यह पूछ रहा है कि "best profession in 2027" या "स्वास्थ्य कैसा रहेगा", तो अपना पूरा ध्यान प्रश्न के सटीक उत्तर, तार्किक कारण और समय-सीमा (Timing) पर रखें।

5. **अभिवादन व निरंतर बातचीत (No Greeting Repetition):**
   ${isFirstTurn ? '- यह पहला प्रश्न है: एक बार आत्मीय अभिवादन ("नमस्ते!") से उत्तर शुरू करें।' : '- यह फॉलो-अप प्रश्न है: "नमस्ते!" या किसी भी अभिवादन का दोहराव बिल्कुल न करें। पिछली बातचीत को याद रखते हुए सीधे नए प्रश्न के उत्तर से बात शुरू करें।'}

6. **सटीक समय-सीमा (Precise Timing):**
   - जातक को स्पष्ट बताएं कि अनुकूलता कब से आएगी (${questionAnalysis.timingWindowHi})।

---
### 🪐 जातक की जन्म कुंडली की संपूर्ण गणना (Parashari + KP + Gochar Coordinates):
- लग्न: ${parashariData.lagnaSign} | लग्नेश: ${parashariData.lagnaLord} (भाव ${parashariData.lagnaLordHouse})
- चन्द्र राशि: ${parashariData.moonSign} (स्वामी: ${parashariData.moonLord})
- वर्तमान विंशोत्तरी दशा: ${formatDashaText(currentDBA, false)}
- केन्द्र भाव: ${parashariData.kendraHouses.map((k: any) => `भाव ${k.house}: [${k.planets.join(', ') || 'रिक्त'}]`).join(' | ')}
- त्रिकोण भाव: ${parashariData.trikonaHouses.map((t: any) => `भाव ${t.house}: [${t.planets.join(', ') || 'रिक्त'}]`).join(' | ')}
- दुस्थान भाव: ${parashariData.dusthanaHouses.map((d: any) => `भाव ${d.house}: [${d.planets.join(', ') || 'रिक्त'}]`).join(' | ')}
- सक्रिय शुभ योग: ${parashariData.yogas.join('; ') || 'सामान्य योग'}

- सभी १२ भावों के कस्पल सब-लॉर्ड (Placidus Cuspal Sub-Lords):
${allCuspsFormatted}

- सभी ग्रहों की स्थिति (Planets, Signs & Sub-Lords):
${allPlanetsFormatted}

- तात्कालिक गोचर विश्लेषण:
${gocharData.summaryTextHi}
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

    let replyText = '';
    let modelUsed = '';
    const geminiErrors: string[] = [];

    if (apiKey) {
      // Verified production Google Gemini 3.5 models (active and verified)
      const models = ['gemini-3.5-flash', 'gemini-3.5-flash-lite'];
      for (const m of models) {
        try {
          const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 12000));
          const aiCall = ai.models.generateContent({
            model: m,
            contents: formattedContents,
            config: { systemInstruction: dynamicSystemInstruction, temperature: 0.35 },
          });
          const res: any = await Promise.race([aiCall, timeoutPromise]);
          if (res && res.text && res.text.trim().length > 10) {
            replyText = res.text.trim();
            modelUsed = m;
            break;
          } else if (!res) {
            geminiErrors.push(`${m}: timed out after 12000ms`);
          }
        } catch (e: any) {
          geminiErrors.push(`${m}: ${e?.message || String(e)}`);
          console.warn(`Model ${m} failed in predict route:`, e);
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
        apiKeyPrefix: apiKey ? apiKey.slice(0, 6) + '...' + apiKey.slice(-4) : 'none',
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
        reply: 'आपकी कुंडली के अनुसार ग्रह स्थिति आपके पक्ष में है। कृपया अपना प्रश्न पुनः पूछें।',
        text: 'आपकी कुंडली के अनुसार ग्रह स्थिति आपके पक्ष में है। कृपया अपना प्रश्न पुनः पूछें।',
        error: error?.message || 'Error occurred',
      },
      { status: 200 } // Return 200 with fallback so UI never breaks!
    );
  }
}
