import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import dns from 'dns';
import { extractCleanKPJson, classifyQuestionTopic, isAstrologicalQuery } from '@/lib/kp-classifier';
import { evaluateParashariKundli } from '@/lib/parashari-evaluator';
import { evaluateGochar } from '@/lib/gochar-evaluator';
import { synthesizeFastKPAnswer } from '@/lib/kp-fast-synthesizer';

// Enforce IPv4 on Windows to prevent Undici IPv6 connect timeouts to Google APIs
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  // Ignore in environments where not supported
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
    const { messages, kundliData, kpMatrix, presetQuery } = body;
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

    if (!apiKey) {
      return NextResponse.json(
        {
          error: isEnglish
            ? 'GEMINI_API_KEY is not configured.'
            : 'GEMINI_API_KEY कॉन्फ़िगर नहीं है।',
        },
        { status: 500 }
      );
    }

    const cleanKundli = extractCleanKPJson(activeChart) || activeChart;

    // Full Parashari Evaluation (पराशरी ज्योतिष विश्लेषण)
    const parashariData = evaluateParashariKundli(activeChart);

    // Extract Natal Lagna and Natal Moon Sign ID for Gochar Calculation
    const ascSignId = activeChart.cusps?.[0]?.signId || 1;
    const moonPlanet = (activeChart.planets || []).find(
      (p: any) =>
        (p.name || '').toLowerCase() === 'moon' ||
        (p.id || '').toLowerCase() === 'moon'
    );
    const moonSignId = moonPlanet?.signId || 1;

    // Evaluate Real-Time Gochar (तात्कालिक गोचर गणना)
    const gocharData = evaluateGochar(ascSignId, moonSignId, new Date());

    // Key cuspal data for high-precision focus
    const cusps = activeChart.cusps || [];
    const findCusp = (num: number) =>
      cusps.find((c: any) => c.houseNumber === num || c.cuspNumber === num);

    const houseDefinitions = isEnglish
      ? [
          { num: 10, name: '10th House (Career & Profession)' },
          { num: 6, name: '6th House (Job, Competition & Disease)' },
          { num: 2, name: '2nd House (Wealth & Accumulated Assets)' },
          { num: 11, name: '11th House (Gains, Aspirations & Fulfillment)' },
          { num: 7, name: '7th House (Partnership, Business & Marriage)' },
          { num: 4, name: '4th House (Education & Fixed Assets)' },
          { num: 5, name: '5th House (Intelligence, Skills & Speculation)' },
          { num: 1, name: '1st House (Ascendant, Physical Self & Health)' },
          { num: 3, name: '3rd House (12th from 4th - School completion & Travels)' },
          { num: 8, name: '8th House (Sudden Obstacles, Crises & Transformation)' },
          { num: 9, name: '9th House (Higher Education, Fortune & Dharma)' },
          { num: 12, name: '12th House (Foreign Lands, Expenditure & Separation)' },
        ]
      : [
          { num: 10, name: '१०वां भाव (करियर/कर्म)' },
          { num: 6, name: '६वां भाव (प्रतियोगिता/नौकरी/रोग)' },
          { num: 2, name: '२रा भाव (धन/आवक)' },
          { num: 11, name: '११वां भाव (लाभ/इच्छापूर्ति)' },
          { num: 7, name: '७वां भाव (व्यापार/साझेदारी/विवाह)' },
          { num: 4, name: '४था भाव (शिक्षा/स्थिर संपत्ति)' },
          { num: 5, name: '५वां भाव (बुद्धि/तकनीकी ज्ञान)' },
          { num: 1, name: '१ला भाव (लग्न/स्वास्थ्य)' },
          { num: 3, name: '३रा भाव (४थे से १२वां - स्कूल समाप्ति/यात्रा)' },
          { num: 8, name: '८वां भाव (अचानक विघ्न/संकट)' },
          { num: 9, name: '९वां भाव (उच्च शिक्षा/भाग्य)' },
          { num: 12, name: '१२वां भाव (अलगाव/स्थान परिवर्तन/व्यय)' },
        ];

    const activeCslList = houseDefinitions
      .map((h) => {
        const c = findCusp(h.num);
        if (!c) return null;
        return {
          houseNumber: h.num,
          houseName: h.name,
          signName: c.signName || c.sign || '',
          signLord: c.signLord || '',
          starLord: c.starLord || '',
          subLord: c.subLord || '',
          subSubLord: c.subSubLord || '',
        };
      })
      .filter(Boolean);

    // Format all 12 Cusps
    const allCuspsFormatted = (activeChart.cusps || [])
      .map((c: any) => {
        const houseNum = c.houseNumber || c.cuspNumber;
        if (isEnglish) {
          return `• Cusp ${houseNum}: Sign=${c.signName || c.sign || ''}, Sign Lord=${c.signLord || ''}, Star Lord=${c.starLord || ''}, Sub-Lord (CSL)=${c.subLord || ''}, Sub-Sub=${c.subSubLord || ''}`;
        }
        return `• भाव ${houseNum}: राशि=${c.signName || c.sign || ''}, राशि स्वामी=${c.signLord || ''}, नक्षत्र स्वामी=${c.starLord || ''}, सब-लॉर्ड (CSL)=${c.subLord || ''}, Sub-Sub=${c.subSubLord || ''}`;
      })
      .join('\n');

    // Format all Planets
    const allPlanetsFormatted = (activeChart.planets || cleanKundli.planets || [])
      .map((p: any) => {
        const pName = p.name || p.id || p.planet || '';
        if (isEnglish) {
          return `• ${pName}: Sign=${p.signName || p.sign || ''} (${p.degreeInSign || p.degree || ''}°), House Occupied=${p.houseOccupied || p.house || ''}, Star Lord=${p.starLord || ''}, Sub-Lord=${p.subLord || ''}, Houses Owned=${(p.housesOwned || []).join(',') || ''}`;
        }
        return `• ${pName}: राशि=${p.signName || p.sign || ''} (${p.degreeInSign || p.degree || ''}°), भाव में स्थित=${p.houseOccupied || p.house || ''}, नक्षत्र स्वामी (Star)=${p.starLord || ''}, उप-नक्षत्र (Sub)=${p.subLord || ''}, स्वामित्व भाव=${(p.housesOwned || []).join(',') || ''}`;
      })
      .join('\n');

    // Format 4-Fold Significators
    const significatorsFormatted = (
      activeChart.houseSignificators ||
      cleanKundli.significators4Fold ||
      []
    )
      .slice(0, 12)
      .map((h: any) => {
        const prefix = isEnglish ? `• House ${h.houseNumber}` : `• भाव ${h.houseNumber}`;
        return `${prefix}: L1=[${(h.level1 || []).join(',')}], L2=[${(h.level2 || []).join(',')}], L3=[${(h.level3 || []).join(',')}], L4=[${(h.level4 || []).join(',')}]`;
      })
      .join('\n');

    // Format Dasha Timeline
    const dashaTree = activeChart.vimshottariDashaTree || cleanKundli.vimshottariDashaTree || [];
    const dashaTreeFormatted = dashaTree
      .slice(0, 8)
      .map((d: any) => {
        if (isEnglish) {
          return `• Mahadasha ${d.planet}: ${d.startDate || ''} to ${d.endDate || ''}`;
        }
        return `• महादशा ${d.planet}: ${d.startDate || ''} से ${d.endDate || ''}`;
      })
      .join('\n');

    const currentDBA = cleanKundli.currentRunningDBA || activeChart.currentDasha;
    const rulingPlanets = cleanKundli.rulingPlanets || activeChart.rulingPlanets;

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

    const previousContext = recentMessages
      .slice(0, -1)
      .map((m: any) => m.text || m.content || '')
      .join(' ');

    // Strict Astrology Guardrail: If client asks non-astrology questions (coding, general knowledge, etc.)
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

    const topicAnalysis = classifyQuestionTopic(currentQuestion, previousContext);

    // Build the dynamic, intelligent Dual-Engine (Parashari + Cuspal + Gochar) system instruction
    const dynamicSystemInstruction = isEnglish
      ? `
# ROLE: WISE, EMPATHETIC & REVERED ASTROLOGICAL SCHOLAR (Vedic & Astrological Expert)

You are an accomplished, empathetic, and esteemed Vedic Astrological scholar possessing authoritative mastery of **Parashari Vedic Astrology**, **Cuspal & Stellar Astrology**, and **Real-Time Planetary Transit (Gochar / गोचर)**. You are advising the client 1-on-1 in a personalized, direct consultation.

## 🌐 CRITICAL MANDATORY LANGUAGE DIRECTIVE:
- **OUTPUT LANGUAGE: STRICTLY 100% ENGLISH.**
- The application mode is set to **ENGLISH**. You MUST formulate and output your entire response, prediction, astrological analysis, timing, and recommendations exclusively in **fluent, dignified, warm, and articulate ENGLISH**.
- Do NOT output any sentences in Hindi or Devanagari script.

## ⚠️ GREETING & CONVERSATIONAL CONTINUITY (MANDATORY RULE):
${
  isFirstTurn
    ? '- **INITIAL TURN**: This is the very first question opening the consultation session. You may open with a warm, polite initial greeting (e.g. "Namaste! Welcome. Let us examine your chart...").'
    : `- **ONGOING CONVERSATION (Turn #${userTurnsCount})**: ⚠️ STRICTLY FORBIDDEN TO REPEAT GREETINGS! You MUST NOT begin with "Namaste", "Hello", "Welcome", or "Greetings". Start directly with the answer, analysis, or explanation in a natural conversational flow, as if continuing an uninterrupted spoken dialog.`
}

## ⚠️ METHODOLOGY & PRESENTATION RULES:
1. **Never repeat or chant the acronym 'KP' or 'Krishnamurti Paddhati'**:
   - Instead, phrase your insights naturally: "According to your birth chart", "Based on stellar alignments and planetary sub-lords", "As indicated by the planetary configurations and active dasha", "Through the synthesis of planetary and stellar lords".

2. **Backend Synthesis of All Systems (Parashari + Cuspal + Gochar)**:
   - Calculate and synthesize traditional Vedic/Parashari factors (Houses, House Lords, Ascendant, Moon Sign, Kendra-Trikona, Yogas, Aspects), Stellar/Cuspal factors (Cuspal Sub-Lords, Star Lords, 4-Fold Significators), and Gochar (Planetary Transits) internally to derive the most accurate, undeniable verdict.

3. **Active Integration of Gochar (Planetary Transit)**:
   - "Dasha indicates the promise and period; Gochar triggers the exact timing of materialization."
   - You MUST actively incorporate the current live Gochar calculations provided in Section C below!
   - Highlight Saturn's transit (Shani Gochar / Sade Sati / Dhaiya status), Jupiter's transit (Guru Gochar & divine 5th/7th/9th aspects), Rahu-Ketu transit axis, and the Double Transit activation of life sectors.

4. **Answer According to the Client's Query (Adaptive Client-Centric Response)**:
   - **When the client asks a general / direct question** (e.g. "How is my career?", "What should I do?", "When will I get a job?"):
     - Deliver a direct, empathetic, practical, and concise response (1-2 clear, readable paragraphs). Do not drown the client in raw astrological formulas; provide actionable cosmic clarity.
   - **When the client asks for explanations, reasons, or astrological logic** (e.g. "Explain the reason", "Why did this happen?", "Provide detailed logic"):
     - Speak like a true master astrologer and lay down the precise logic using Parashari, Cuspal, and Gochar principles (House & CSL status, active Dasha periods, and transiting planetary triggers).

5. **Natural Human Conversation**:
   - Maintain the warmth of an insightful human counselor. Avoid robotic or template section numbers unless answering a complex multi-part inquiry.

---
## 🪐 CLIENT HOROSCOPE ASTRONOMICAL DATA (Internal Analysis):

### A. Parashari Astrological Insights:
- Ascendant (Lagna): ${parashariData.lagnaSign} | Lagnesh: ${parashariData.lagnaLord} (Placed in House ${parashariData.lagnaLordHouse})
- Moon Sign: ${parashariData.moonSign} (Lord: ${parashariData.moonLord})
- Sun Sign: ${parashariData.sunSign}
- Kendra Houses (1, 4, 7, 10): ${parashariData.kendraHouses.map((k) => `House ${k.house}: [${k.planets.join(', ') || 'Vacant'}]`).join(' | ')}
- Trikona Houses (1, 5, 9): ${parashariData.trikonaHouses.map((t) => `House ${t.house}: [${t.planets.join(', ') || 'Vacant'}]`).join(' | ')}
- Dusthana Houses (6, 8, 12): ${parashariData.dusthanaHouses.map((d) => `House ${d.house}: [${d.planets.join(', ') || 'Vacant'}]`).join(' | ')}
- Key Yogas: ${parashariData.yogas.length > 0 ? parashariData.yogas.join('; ') : 'Standard configurations'}
- Planetary Aspects: ${parashariData.keyAspects.length > 0 ? parashariData.keyAspects.join('; ') : 'Standard'}
- Functional Benefics: ${parashariData.functionalBenefics.join(', ')}
- Functional Malefics: ${parashariData.functionalMalefics.join(', ')}

### B. Cuspal & Stellar Data:
- Current Running Dasha: ${formatDashaText(currentDBA, true)}
- Primary Topic of Inquiry: ${topicAnalysis?.topic || 'General Guidance'}
- All 12 Cuspal Sub-Lords (CSL & Cusps):
${allCuspsFormatted || 'Not available'}

- All Planetary Positions (Planets, Star Lords & Sub-Lords):
${allPlanetsFormatted || 'Not available'}

- 4-Fold Significators (कार्येश):
${significatorsFormatted || 'Not available'}

- Vimshottari Dasha Tree:
${dashaTreeFormatted || 'Not available'}

### C. Live Real-Time Gochar (Planetary Transit Analysis):
${gocharData.summaryTextEn}
`
      : `
# भूमिका: आत्मीय, विद्वान एवं अनुभवी ज्योतिषी (Vedic & Astrological Expert)

आप एक अत्यंत अनुभवी, आत्मीय और प्रतिष्ठित वैदिक ज्योतिषी हैं, जिन्हें **पराशरी ज्योतिष (Parashari Astrology)**, **कस्पल/नक्षत्र नाड़ी ज्योतिष (Cuspal & Stellar Astrology)** तथा **तात्कालिक गोचर (Real-Time Planetary Transit - Gochar)** तीनों का पूर्ण और प्रामाणिक ज्ञान है। आप जातक से 1-on-1 आमने-सामने बैठकर या चैट पर बात कर रहे हैं।

## 🌐 अनिवार्य भाषा निर्देश (MANDATORY LANGUAGE DIRECTIVE):
- **उत्तर की भाषा: केवल और केवल शुद्ध, आत्मीय व प्रवाहमयी हिंदी (Devanagari)।**
- जातक ने **हिंदी (HINDI)** मोड चुना है। आपका संपूर्ण फलादेश, विश्लेषण और मार्गदर्शन केवल हिंदी भाषा में होना चाहिए।

## ⚠️ अभिवादन एवं निरंतर बातचीत का नियम (MANDATORY RULE):
${
  isFirstTurn
    ? '- **आरंभिक संदेश (First Turn)**: यह जातक के साथ बातचीत की शुरुआत (पहला संदेश) है। आप एक बार आत्मीय व सम्मानजनक अभिवादन (जैसे "नमस्ते!" या "आयुष्मान भव!") से उत्तर शुरू कर सकते हैं।'
    : `- **चलती हुई बातचीत (Turn #${userTurnsCount})**: ⚠️ 'नमस्ते!' या किसी भी प्रकार का अभिवादन दोहराना सख्त मना है! जातक के साथ बातचीत पहले से चल रही है (यह फॉलो-अप प्रश्न है)। उत्तर की शुरुआत में 'नमस्ते!', 'सादर प्रणाम!', 'आयुष्मान भव!' या कोई भी ग्रीटिंग कतई न लिखें। सीधे उत्तर और ज्योतिषीय फलादेश से बात शुरू करें, जैसे दो व्यक्ति लगातार बातचीत कर रहे हों।`
}

## ⚠️ भाषा व अभिव्यक्ति के अनिवार्य नियम (STRICT GUIDELINES):
1. **'KP' या 'के.पी.' शब्द का बार-बार उच्चारण कतई न करें**:
   - उत्तर में 'के.पी. के अनुसार', 'के.पी. सिद्धांत' जैसे शब्दों का अनावश्यक प्रयोग न करें। स्वाभाविक शब्दों का उपयोग करें जैसे: "आपकी जन्म कुंडली के अनुसार", "वैदिक ज्योतिष एवं नक्षत्र गणना के अनुसार", "ग्रहों की स्थिति व दशा के प्रभाव से", "गोचर एवं नक्षत्र के तालमेल से"।

2. **बैकएंड में सभी पद्धतियों का समन्वय (Parashari + Cuspal + Gochar)**:
   - फलादेश निर्धारित करने के लिए पराशरी सिद्धांतों, कस्पल सिद्धांतों तथा तात्कालिक गोचर (Gochar) तीनों की गणनाओं का आंतरिक रूप से उपयोग करें।

3. **गोचर (Planetary Transit) का अनिवार्य समन्वय**:
   - ज्योतिष का सनातन नियम है: "दशा घटना की संभावना तय करती है, और गोचर उस घटना के घटित होने का वास्तविक समय तय करता है।"
   - आपको नीचे 'खंड ग' में दी गई तात्कालिक गोचर गणनाओं (Gochar Analysis) को फलादेश में अनिवार्य रूप से शामिल करना है!
   - विशेष रूप से ध्यान दें:
     • शनि गोचर (Shani Gochar): चन्द्र राशि व लग्न से स्थिति, साढ़े साती या ढैय्या का प्रभाव, और ३री, ७वीं, १०वीं दृष्टि का प्रभाव।
     • देवगुरु बृहस्पति गोचर (Guru Gochar): चन्द्र व लग्न से शुभ स्थिति तथा ५वीं, ७वीं, ९वीं अमृत दृष्टियों से शक्ति पाने वाले भाव।
     • द्वि-गोचर सिद्धांत (Double Transit): गुरु और शनि दोनों मिलकर जीवन के किन क्षेत्रों को सक्रिय कर रहे हैं।
     • राहु-केतु गोचर: किस अक्ष पर जीवन में अचानक परिवर्तन या नए अवसर ला रहे हैं।

4. **जातक के प्रश्न के अनुसार उत्तर दें (Adaptive Client-Centric Response)**:
   - **जब जातक सामान्य / सीधा प्रश्न पूछे** (उदा. "मेरा करियर कैसा रहेगा?", "क्या करूँ?", "मेरी नौकरी कब लगेगी?"):
     - उत्तर बिल्कुल सीधा, आत्मीय, व्यावहारिक और संक्षिप्त (1-2 छोटे पैराग्राफ) में दें। जातक को तकनीकी सूत्रों में न उलझाएं; सीधा फलादेश और उपयोगी मार्गदर्शन दें।
   - **जब जातक स्पष्टीकरण, कारण या ज्योतिषीय तर्क मांगे** (उदा. "कारण बताओ", "Logic sahit detail me"):
     - एक सच्चे विद्वान ज्योतिषी की तरह पराशरी, कस्पल तथा गोचर तीनों के संयुक्त नियमों से स्पष्ट करें (भाव व भावेश, कस्पल सब-लॉर्ड, सक्रिय महादशा/अंतर्दशा एवं गोचर ग्रहों के प्रभाव)।

## 🌟 दो इंसानों की तरह आत्मीय व संवेदनशील संवाद (HUMAN-TO-HUMAN COUNSELING):
- आप एक सच्चे विद्वान और आत्मीय ज्योतिषाचार्य **Astro Gemini** हैं। जातक से बिल्कुल वैसे बात करें जैसे दो इंसान आमने-सामने बैठकर अपनी परेशानी पर विचार-विमर्श कर रहे हों।
- **जातक की समस्या को गहराई से समझें:** यदि जातक नौकरी छूटने, विवाह में रुकावट, कर्ज, व्यापार घाटे, बीमारी या मानसिक तनाव से परेशान है, तो पहले उसकी मनोदशा को समझकर सहानुभूति और सांत्वना के साथ उत्तर शुरू करें।
- **के.पी. व पराशरी का वास्तविक कारण:** भाव के कस्पल सब-लॉर्ड (CSL), नक्षत्र स्वामी, सक्रिय महादशा/अंतर्दशा तथा वर्तमान शनि/गुरु/राहु गोचर के आधार पर स्पष्ट समझाएं कि यह परिस्थिति क्यों बनी।
- **सटीक समय (Timing of Relief):** स्पष्ट बताएं कि कब तक यह तनाव बना रहेगा और किस महीने से अनुकूल समय का आरंभ होगा।
- **सरल वैदिक उपाय:** ग्रह शांति और बाधा निवारण हेतु १-२ अत्यंत व्यावहारिक व सात्विक उपाय बताएं।
- **कदापि मशीनी न लगें:** कोई रोबोटिक फॉर्मूले, सेक्शन १/२ या बॉट जैसी भाषा न लिखें। आत्मीय गुरु व मार्गदर्शक की तरह बात करें।

---
## 🪐 जातक की जन्म कुंडली का संपूर्ण ज्योतिषीय डेटा (आंतरिक विश्लेषण हेतु):

### क. पराशरी ज्योतिषीय विश्लेषण (Parashari Insights):
- लग्न: ${parashariData.lagnaSign} | लग्नेश: ${parashariData.lagnaLord} (भाव ${parashariData.lagnaLordHouse} में स्थित)
- चन्द्र राशि: ${parashariData.moonSign} (स्वामी: ${parashariData.moonLord})
- सूर्य राशि: ${parashariData.sunSign}
- केन्द्र भाव (1, 4, 7, 10): ${parashariData.kendraHouses.map((k) => `भाव ${k.house}: [${k.planets.join(', ') || 'रिक्त'}]`).join(' | ')}
- त्रिकोण भाव (1, 5, 9): ${parashariData.trikonaHouses.map((t) => `भाव ${t.house}: [${t.planets.join(', ') || 'रिक्त'}]`).join(' | ')}
- दुस्थान भाव (6, 8, 12): ${parashariData.dusthanaHouses.map((d) => `भाव ${d.house}: [${d.planets.join(', ') || 'रिक्त'}]`).join(' | ')}
- प्रमुख योग: ${parashariData.yogas.length > 0 ? parashariData.yogas.join('; ') : 'सामान्य ग्रह योग'}
- प्रमुख दृष्टियां: ${parashariData.keyAspects.length > 0 ? parashariData.keyAspects.join('; ') : 'सामान्य'}
- लग्न अनुसार शुभ ग्रह: ${parashariData.functionalBenefics.join(', ')}
- लग्न अनुसार अशुभ ग्रह: ${parashariData.functionalMalefics.join(', ')}

### ख. कस्पल व नक्षत्र नाड़ी विश्लेषण (Cuspal & Stellar Data):
- वर्तमान विंशोत्तरी दशा: ${formatDashaText(currentDBA, false)}
- मुख्य प्रश्न प्रसंग: ${topicAnalysis?.topicHi || 'सामान्य मार्गदर्शन'}
- सभी १२ भावों के कस्पल सब-लॉर्ड (CSL & Cusps):
${allCuspsFormatted || 'उपलब्ध नहीं'}

- सभी ग्रहों की स्थिति (Planets, Star Lords & Sub Lords):
${allPlanetsFormatted || 'उपलब्ध नहीं'}

- चार-स्तरीय कार्येश (4-Fold Significators):
${significatorsFormatted || 'उपलब्ध नहीं'}

- विंशोत्तरी दशा समय-सारणी:
${dashaTreeFormatted || 'उपलब्ध नहीं'}

### ग. तात्कालिक गोचर विश्लेषण (Real-Time Gochar Analysis):
${gocharData.summaryTextHi}
`;

    // Format clean conversation history for Google GenAI SDK
    const formattedContents = recentMessages
      .map((msg: any) => {
        const role =
          (msg.role as string) === 'model' || (msg.role as string) === 'assistant'
            ? 'model'
            : 'user';
        const text = (msg.text || msg.content || '').trim();
        return {
          role,
          parts: [{ text }],
        };
      })
      .filter((m: any) => m.parts[0].text.length > 0);

    // If formattedContents is empty or last is not user, add currentQuestion
    if (
      formattedContents.length === 0 ||
      formattedContents[formattedContents.length - 1].role !== 'user'
    ) {
      formattedContents.push({
        role: 'user',
        parts: [{ text: currentQuestion }],
      });
    }

    // Verified active GenAI models with human-speed response
    const models = [
      'gemini-3.6-flash',
      'gemini-3.5-flash-lite',
    ];

    let replyText = '';
    let modelUsed = '';
    let lastError = '';

    for (const m of models) {
      try {
        const timeoutPromise = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), 4500)
        );

        const aiCallPromise = ai.models.generateContent({
          model: m,
          contents: formattedContents,
          config: {
            systemInstruction: dynamicSystemInstruction,
            temperature: 0.35,
          },
        });

        const response: any = await Promise.race([aiCallPromise, timeoutPromise]);

        if (response && response.text && response.text.trim().length > 10) {
          replyText = response.text.trim();
          modelUsed = m;
          break;
        } else if (!response) {
          console.warn(`Model ${m} timed out after 4500ms`);
        }
      } catch (mErr: any) {
        lastError = mErr?.message || String(mErr);
        console.warn(`Model ${m} attempt failed:`, lastError);
      }
    }

    // Fail-safe Astrological Synthesis: If Gemini is busy, rate-limited, or slow,
    // NEVER hang or crash! Provide instant high-precision mathematical astrological reading.
    if (!replyText || replyText.trim().length === 0) {
      replyText = synthesizeFastKPAnswer(
        activeChart,
        gocharData,
        currentQuestion,
        clientLanguage
      );
      modelUsed = 'Astro-Gemini-Synthesis-Engine (High-Speed Local)';
    }

    const debugData = {
      modelUsed,
      language: clientLanguage,
      topic: topicAnalysis?.topic || 'general',
      isFirstTurn,
      userTurnsCount,
      activeCsl: activeCslList,
      currentDasha: currentDBA,
      rulingPlanets: rulingPlanets,
      gocharSummary: {
        date: gocharData.dateStr,
        sadeSati: gocharData.sadeSati.summaryHi,
        jupiterTransit: gocharData.jupiterTransit.summaryHi,
        doubleTransit: gocharData.doubleTransitHouses.summaryHi,
      },
      parashariSummary: {
        lagna: parashariData.lagnaSign,
        moon: parashariData.moonSign,
        yogas: parashariData.yogas,
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      reply: replyText,
      text: replyText,
      model: modelUsed,
      debug: debugData,
      debugInfo: debugData,
    });
  } catch (error: unknown) {
    console.error('Prediction API Error:', error);
    const errMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'भविष्यवाणी प्राप्त करने में तकनीकी समस्या आई है।',
        details: errMessage,
      },
      { status: 500 }
    );
  }
}
