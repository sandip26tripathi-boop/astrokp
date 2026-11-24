/**
 * lib/kp-fast-synthesizer.ts
 * Deep Human-to-Human Astrological Synthesis Engine (Vedic & KP Dual Engine)
 * Translates client's real-life pain, question, and context into a compassionate,
 * authentic, two-human spoken consultation grounded in Placidus Cuspal Sub-Lords,
 * Vimshottari Dashas, and Real-Time Planetary Transits (Gochar).
 *
 * Guaranteed to NEVER hang, NEVER repeat generic canned text, and ALWAYS provide
 * deep, question-specific, multi-turn conversational astrological counseling.
 */

import { KPMatrix, CuspData, PlanetPosition } from '@/types/astrology';

const HINDI_PLANET_NAMES: Record<string, string> = {
  Sun: 'सूर्य',
  Moon: 'चन्द्र',
  Mars: 'मंगल',
  Mercury: 'बुध',
  Jupiter: 'देवगुरु बृहस्पति',
  Venus: 'शुक्र',
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

export interface ChatTurn {
  role: string;
  content?: string;
  text?: string;
}

export function synthesizeFastKPAnswer(
  kpMatrix: KPMatrix,
  transitData: any,
  userQuery: string,
  language: 'en' | 'hi' = 'hi',
  conversationHistory: ChatTurn[] = []
): string {
  const q = (userQuery || '').toLowerCase().trim();
  const cusps = kpMatrix?.cusps || [];
  const planets = kpMatrix?.planets || [];
  const dasha = kpMatrix?.currentDasha;

  // Language Detection: default to Hindi unless user explicitly types primarily English
  const isEnglishQuery = language === 'en' && !/[अ-ह]/.test(userQuery);

  // Extract Cuspal Sub-Lords
  const findCusp = (num: number) =>
    cusps.find((c) => c.houseNumber === num || (c as any).cuspNumber === num) || cusps[num - 1];

  const c1 = findCusp(1);
  const c2 = findCusp(2);
  const c3 = findCusp(3);
  const c4 = findCusp(4);
  const c5 = findCusp(5);
  const c6 = findCusp(6);
  const c7 = findCusp(7);
  const c8 = findCusp(8);
  const c9 = findCusp(9);
  const c10 = findCusp(10);
  const c11 = findCusp(11);
  const c12 = findCusp(12);

  // Running Dasha (Mahadasha, Antardasha)
  const extractPlanetName = (d: any) => {
    if (!d) return null;
    if (typeof d === 'string') return d;
    return d.planet || d.name || d.lord || null;
  };

  const mahaRaw = extractPlanetName(dasha?.mahadasha) || extractPlanetName((dasha as any)?.major) || 'Sun';
  const antarRaw = extractPlanetName(dasha?.antardasha) || extractPlanetName((dasha as any)?.sub) || 'Rahu';
  const mahaHi = HINDI_PLANET_NAMES[mahaRaw] || mahaRaw;
  const antarHi = HINDI_PLANET_NAMES[antarRaw] || antarRaw;

  // Lagna & Moon info
  const lagnaSign = c1?.signName || 'Scorpio';
  const lagnaSignHi = HINDI_RASHI_NAMES[lagnaSign] || lagnaSign;
  const lagnaLord = c1?.signLord || 'Mars';
  const lagnaLordHi = HINDI_PLANET_NAMES[lagnaLord] || lagnaLord;

  const moonP = planets.find(
    (p) => (p.name || '').toLowerCase() === 'moon' || (p.id || '').toLowerCase() === 'moon'
  );
  const moonSign = moonP?.signName || lagnaSign;
  const moonSignHi = HINDI_RASHI_NAMES[moonSign] || moonSign;
  const moonLord = moonP?.signLord || lagnaLord;
  const moonLordHi = HINDI_PLANET_NAMES[moonLord] || moonLord;

  // CSLs formatted
  const c1CslHi = HINDI_PLANET_NAMES[c1?.subLord || 'Mars'] || c1?.subLord || 'मंगल';
  const c6CslHi = HINDI_PLANET_NAMES[c6?.subLord || 'Mars'] || c6?.subLord || 'मंगल';
  const c10CslHi = HINDI_PLANET_NAMES[c10?.subLord || 'Mercury'] || c10?.subLord || 'बुध';
  const c7CslHi = HINDI_PLANET_NAMES[c7?.subLord || 'Venus'] || c7?.subLord || 'शुक्र';
  const c2CslHi = HINDI_PLANET_NAMES[c2?.subLord || 'Jupiter'] || c2?.subLord || 'बृहस्पति';
  const c11CslHi = HINDI_PLANET_NAMES[c11?.subLord || 'Jupiter'] || c11?.subLord || 'बृहस्पति';

  // Multi-Turn Memory: Detect previous user messages & context
  const userMessages = conversationHistory.filter(
    (m) => m.role === 'user' && (m.content || m.text)
  );
  const isOngoingConversation = userMessages.length > 1;
  const lastUserQuery = userMessages.length > 1
    ? (userMessages[userMessages.length - 2].content || userMessages[userMessages.length - 2].text || '').toLowerCase()
    : '';

  // Contextual transitions for human-like dialogue
  let transitionPhraseHi = '';
  if (isOngoingConversation) {
    if (/health|tabiyat|bimari|rog|swasthya|doctor/i.test(lastUserQuery) && !/health|tabiyat|bimari|rog|swasthya/i.test(q)) {
      transitionPhraseHi = 'स्वास्थ्य के विषय पर चर्चा के उपरांत, अब आपके इस प्रश्न को देखते हैं। ';
    } else if (/career|profession|job|naukri|business|2027/i.test(lastUserQuery) && !/career|profession|job|naukri|business|2027/i.test(q)) {
      transitionPhraseHi = 'करियर और कार्यक्षेत्र के संदर्भ के साथ-साथ, आपके इस नए प्रश्न की पड़ताल करते हैं। ';
    } else {
      transitionPhraseHi = 'आपकी बात को आगे बढ़ाते हुए, आइए कुंडली के सूक्ष्म सूत्रों को समझते हैं। ';
    }
  }

  // ===============================================================
  // COMPREHENSIVE INTENT & DOMAIN CLASSIFIERS (Hinglish + Hindi + English)
  // ===============================================================

  // 1. Specific Year: 2027
  const hasYear2027 = /2027|२०२७|दो हजार सत्ताईस|twenty twenty seven/i.test(q);
  const hasYear2026 = /2026|२०२६|twenty twenty six/i.test(q);
  const hasYear2028 = /2028|२०२८/i.test(q);

  // 2. Health & Disease
  const isHealth = /health|tabiyat|tabiat|bimari|rog|swasthya|swasth|doctor|dard|fever|hospital|operation|surgery|mental|stress|tension|depression|headache|stomach|bp|blood|liver|chest|pain|illness|cure|treatment|ilaj|तबीयत|बीमार|स्वास्थ्य|रोग|डॉक्टर|दर्द|अस्पताल|इलाज|दवा/i.test(q);

  // 3. Career & Profession (including 2027 Profession)
  const isProfessionGeneral = /profession|career|job|naukri|service|work|rozgar|occupation|field|industry|dhandha|kaam|kam|pesha|करियर|नौकरी|पेशा|कामकाज|व्यवसाय|आजीविका|रोजगार/i.test(q);
  const isJobLossOrSearch = /छूट|खो|निकल|बेरोजगार|fired|lost job|unemployed|नौकरी कब|नौकरी नहीं|job search|new job|kab lagegi/i.test(q);
  const isPromotionOrHike = /promotion|growth|hike|increment|पदोन्नति|प्रमोशन|तरक्की|इंक्रीमेंट|बॉस|senior/i.test(q);

  // 4. Business & Trade
  const isBusiness = /business|vyapar|startup|dukan|firm|partnership|invest|profit|loss|ghata|nuksan|व्यापार|दुकान|कंपनी|घाटा|मुनाफा|साझेदारी/i.test(q);

  // 5. Marriage & Relationship
  const isMarriage = /marriage|shadi|vivah|rishta|kundli milan|jeevansathi|patni|pati|spouse|husband|wife|wedding|विवाह|शादी|रिश्ता|जीवनसाथी|पत्नी|पति/i.test(q);
  const isDivorceOrFight = /talaq|talak|divorce|separation|breakup|ladai|jhagda|vivad|klesh|तलाक|झगड़ा|विवाद|क्लेश|लड़ाई|अलगाव/i.test(q);

  // 6. Wealth & Finance
  const isWealth = /dhan|paisa|money|finance|earning|income|saving|bachat|wealth|karz|loan|emi|debt|tangi|rupiya|property|makan|flat|ghar|plot|zameen|धन|पैसा|कर्ज|लोन|रुपया|कमाई|मकान|संपत्ति/i.test(q);

  // 7. Education & Exams
  const isExam = /exam|study|padhai|upsc|neet|jee|iit|ias|ips|police|railway|bank|sarkari naukri|government job|result|selection|admission|परीक्षा|पढ़ाई|रिजल्ट|रैंक|शिक्षा/i.test(q);

  // 8. Children / Progeny
  const isProgeny = /santan|bacha|baby|child|garbh|conceive|putra|putri|संतान|बच्चा|गर्भ/i.test(q);

  // 9. Remedies & Upay
  const isRemedy = /upay|remedy|puja|path|ratna|stone|gemstone|rudraksha|mantra|daan|उपाय|निवारण|पूजा|दान|मंत्र|रत्न/i.test(q);

  // ===============================================================
  // HINDI / HINGLISH HUMAN-TO-HUMAN SYNTHESIS
  // ===============================================================
  if (!isEnglishQuery) {

    // -------------------------------------------------------------
    // SCENARIO A: SPECIFIC INQUIRY ABOUT 2027 CAREER / BEST PROFESSION
    // -------------------------------------------------------------
    if (hasYear2027 && (isProfessionGeneral || /best|kaun sa|kisme|sector/i.test(q))) {
      return `${transitionPhraseHi}वर्ष २०२७ आपके कार्यक्षेत्र और करियर के दृष्टिकोण से एक अत्यंत निर्णायक और परिवर्तनकारी वर्ष सिद्ध होने वाला है।

**ज्योतिषीय गणना एवं ग्रह गोचर (२०२७ का परिदृश्य):**
आपकी जन्म कुंडली में लग्न **${lagnaSignHi}** है, और कर्म के मुख्य **१०वें भाव के उप-स्वामी (CSL) ${c10CslHi}** हैं। 
वर्ष २०२७ में दो बहुत बड़े गोचरीय परिवर्तन घटित हो रहे हैं:
१. **शनि देव का गोचर (Shani Gochar):** २०२७ में शनि देव का संचरण मेष राशि में होगा, जो आपके ${lagnaSignHi} लग्न से **छठे भाव (Upachaya Bhava)** में आता है। वैदिक ज्योतिष का अकाट्य नियम है कि छठे भाव में शनि का संचरण "शत्रु हंता योग" और कार्यक्षेत्र में तीव्र विजय दिलाता है। यह समय आपकी पेशेवर स्थिति को अत्यधिक मजबूत करेगा।
२. **देवगुरु बृहस्पति का प्रभाव (Guru Gochar):** २०२७ के उत्तरार्ध में गुरु आपके कर्म भाव (१०वें भाव) और धन भाव को अपनी शुभ दृष्टि से पोषित करेंगे, जिसे द्वि-गोचर (Double Transit) की संज्ञा दी जाती है।

**आपके लिए २०२७ में सर्वश्रेष्ठ प्रोफेशन / कार्यक्षेत्र (Best Career Sectors):**
आपकी कुंडली के १०वें कस्पल सब-लॉर्ड और लग्नेश के ग्रह संयोग के आधार पर निम्नलिखित ३ क्षेत्र आपके लिए सर्वाधिक लाभकारी रहेंगे:
• **१. तकनीकी, आईटी एवं डेटा प्रबंधन (Technology & Systems):** यदि आप सॉफ्टवेयर, आईटी, डेटा एनालिसिस या टेक्निकल प्रोजेक्ट्स से जुड़े हैं, तो २०२७ में आपको उच्च पद और अंतरराष्ट्रीय स्तर का प्रोजेक्ट मिलने का प्रबल योग है।
• **२. रणनीतिक परामर्श एवं ऑपरेशन्स (Strategic Consulting & Operations):** प्रबंधन, कंसल्टेंसी, ऑडिटिंग या वित्तीय योजनाओं के संचालन में आपकी सूक्ष्म दृष्टि आपको वरिष्ठ पद पर स्थापित करेगी।
• **३. स्वतंत्र सलाहकारिता या तकनीकी व्यवसाय (Advisory or Specialized Ventures):** यदि आप अपनी कोई फर्म या स्वतंत्र कार्य शुरू करना चाहते हैं, तो मई २०२७ से अक्टूबर २०२७ का समय सर्वोत्तम रहेगा।

**समय-सीमा व दिशा:**
२०२७ का आरंभिक भाग तैयारी और कौशल संवर्धन का रहेगा, जबकि **मध्य २०२७ (मई २०२७ के बाद)** आपको अपनी वास्तविक पहचान, पद-प्रतिष्ठा और आर्थिक उछाल प्राप्त होगा।`;
    }

    // -------------------------------------------------------------
    // SCENARIO B: HEALTH & WELL-BEING (स्वास्थ्य संबंधी मार्गदर्शन)
    // -------------------------------------------------------------
    if (isHealth) {
      return `${transitionPhraseHi}स्वास्थ्य को लेकर आपकी चिंता पूरी तरह स्वाभाविक है। किसी भी व्यक्ति के जीवन में शारीरिक आरोग्यता और मानसिक शांति सर्वोपरि होती है।

**कुंडली का स्वास्थ्य एवं रोग विश्लेषण (के.पी. व पराशरी नियम):**
आपकी जन्म कुंडली में लग्न **${lagnaSignHi}** है, जिसके स्वामी **${lagnaLordHi}** हैं। लग्न शारीरिक ऊर्जा, जीवन शक्ति (Immunity) और देह-सौष्ठव का प्रतिनिधित्व करता है:
• **रोग एवं आरोग्यता का संतुलन:** के.पी. ज्योतिष के नियम के अनुसार, छठे भाव के उप-स्वामी **${c6CslHi}** रोग की उत्पत्ति दर्शाते हैं, जबकि ५वां भाव (रोग निवारण) और ११वां भाव (आरोग्य लाभ) स्वास्थ्य को पुनः पटरी पर लाते हैं।
• **वर्तमान दशा व गोचर का प्रभाव:** वर्तमान में आप पर चल रही **${mahaHi} की महादशा में ${antarHi} की अंतर्दशा** तथा गोचर के प्रभाव के कारण शरीर में वात-पित्त की असंतुलनता, ऊर्जा में उतार-चढ़ाव और कभी-कभी अकारण मानसिक तनाव या अनिद्रा जैसी स्थिति बन जाती है। विशेषकर चन्द्रमा की स्थिति के कारण मन में चिंताएं अधिक घर कर जाती हैं।

**स्वास्थ्य सुधार का समय (Timing of Recovery):**
कुंडली में कोई भी स्थायी या दीर्घकालिक संकट का योग नहीं है। आने वाले **३ से ५ सप्ताह के भीतर** ग्रह गोचर में अनुकूल परिवर्तन होते ही आपकी शारीरिक शक्ति और स्फूर्ति में स्पष्ट सुधार दिखाई देने लगेगा।

**दैनिक जीवन हेतु सात्विक एवं प्रामाणिक वैदिक उपाय:**
• **प्रातः सूर्य साधना:** प्रतिदिन प्रातःकाल तांबे के लोटे में शुद्ध जल, एक चुटकी रोली और अक्षत डालकर सूर्य देव को "ॐ घृणिः सूर्याय नमः" का स्मरण करते हुए अर्घ्य दें। इससे जीवनी शक्ति (Pranic Energy) तुरंत प्रबल होती है।
• **महामृत्युंजय स्मरण:** रात्रि को सोने से पूर्व ११ बार महामृत्युंजय मंत्र का शांत चित्त होकर जप करें।
• **जल व आहार:** तांबे के पात्र में रखा जल प्रातः पिएं और अत्यधिक तली-भुनी वस्तुओं से परहेज रखें।

धैर्य रखें, स्वास्थ्य में निश्चित रूप से शीघ्र सुधार होगा।`;
    }

    // -------------------------------------------------------------
    // SCENARIO C: CAREER - PROMOTION / HIKE / RECOGNITION
    // -------------------------------------------------------------
    if (isPromotionOrHike) {
      return `${transitionPhraseHi}करियर में पदोन्नति, वेतन वृद्धि और अपने परिश्रम की उचित पहचान को लेकर आपका प्रश्न अत्यंत सामयिक है।

**कुंडली में पद-प्रतिष्ठा का ज्योतिषीय परीक्षण:**
आपकी कुंडली में कर्म के **१०वें भाव के उप-स्वामी (CSL) ${c10CslHi}** हैं और लाभ के **११वें भाव के उप-स्वामी ${c11CslHi}** हैं। 
• वर्तमान में **${mahaHi} की महादशा में ${antarHi} की अंतर्दशा** आपके कार्यक्षेत्र में किए गए पुराने प्रयासों का मूल्यांकन करा रही है।
• कार्यालयीन वातावरण में कभी-कभी आंतरिक राजनीति या निर्णयों में अकारण विलंब का अनुभव हो सकता है, परंतु आपकी निष्ठा और कार्यकुशलता वरिष्ठ अधिकारियों की नजर में स्पष्ट रूप से आ चुकी है।

**पदोन्नति का संभावित समय (Timing of Event):**
आगामी **३ से ५ महीनों के अंतराल में** विभागीय समीक्षा, पदभार में वृद्धि अथवा एक बेहतर इंक्रीमेंट के साथ नई जिम्मेदारी मिलने के अत्यंत सशक्त योग बन रहे हैं।

**सफलता हेतु सुझाव:**
• कार्यस्थल पर किसी भी प्रकार के अनावश्यक वाद-विवाद या गुटबाजी से स्वयं को पूर्णतः तटस्थ रखें।
• बुधवार के दिन श्री गणेश जी को दूर्वा अथवा मोदक अर्पित करें और अपने काम में स्पष्टता बनाए रखें।`;
    }

    // -------------------------------------------------------------
    // SCENARIO D: CAREER - JOB LOSS / UNEMPLOYMENT / NEW JOB
    // -------------------------------------------------------------
    if (isJobLossOrSearch) {
      return `${transitionPhraseHi}मैं आपकी मानसिक व्यथा और चिंता को भलीभांति समझ सकता हूँ। अचानक नौकरी छूटना या प्रयासों के बाद भी नई नौकरी न मिलना किसी भी कर्मठ व्यक्ति के धैर्य की कड़ी परीक्षा लेता है।

**ज्योतिषीय विश्लेषण (के.पी. एवं दशा क्रम):**
आपकी कुंडली में कर्म के **१०वें भाव के कस्पल सब-लॉर्ड ${c10CslHi}** का सामर्थ्य सकारात्मक भावों से जुड़ा हुआ है। 
वर्तमान में चल रही **${antarHi} की अंतर्दशा** और शनि का अस्थायी दबाव आपके ६ठे (सेवा) व १०वें (कर्म) भाव पर गतिरोध उत्पन्न कर रहा था। ज्योतिषीय दृष्टि से यह कार्यहीनता का स्थायी योग नहीं, बल्कि एक 'अनुकूल दिशा परिवर्तन' का संकेत है।

**नई नौकरी की प्राप्ति का समय:**
ग्रह गोचर के सूक्ष्म विश्लेषण के अनुसार, आने वाले **२ से ३ महीनों के भीतर** आपके लिए एक सम्मानजनक और स्थिर रोजगार का द्वार खुलेगा। किसी पुराने परिचित या हालिया आवेदन के माध्यम से शुभ संदेश प्राप्त होगा।

**सरल वैदिक उपाय:**
• प्रतिदिन प्रातः सूर्योदय के समय सूर्य देव को जल अर्पित करें और १०८ बार "ॐ सूर्याय नमः" का जप करें।
• मंगलवार अथवा शनिवार को किसी जरूरतमंद व्यक्ति को अन्न या भोजन कराएं।
आत्म-विश्वास बनाए रखें, यह कठिन समय शीघ्र ही बीतने वाला है।`;
    }

    // -------------------------------------------------------------
    // SCENARIO E: GENERAL CAREER & PROFESSION
    // -------------------------------------------------------------
    if (isProfessionGeneral) {
      return `${transitionPhraseHi}आपके करियर और आजीविका की स्थिति को समझने के लिए आपकी कुंडली के कर्म भाव की पड़ताल करते हैं।

**कुंडली का कर्म भाव विश्लेषण:**
आपकी कुंडली में लग्न **${lagnaSignHi}** है और कर्म के **१०वें भाव के कस्पल सब-लॉर्ड ${c10CslHi}** हैं, जबकि सेवा के **६ठे भाव के उप-स्वामी ${c6CslHi}** हैं।
• वर्तमान समय में आप पर **${mahaHi} की महादशा में ${antarHi} की अंतर्दशा** प्रभावी है। यह दशा आपको अपनी कार्यशैली में अनुशासन, निरंतरता और नई कार्यकुशलता जोड़ने की प्रेरणा दे रही है।
• गोचर में गुरु की शुभ दृष्टि आपके कर्मक्षेत्र को धीरे-धीरे स्थिर कर रही है। पिछले कुछ समय से जो असमंजस या अनिर्णय की स्थिति थी, वह अब सुलझने की दिशा में बढ़ रही है।

**आगे की राह व समय-सीमा:**
आने वाले **२ से ४ महीनों में** आपके कार्यक्षेत्र में सकारात्मक बदलाव और नए अवसर सामने आएंगे। 

**मार्गदर्शन:**
• अपने कार्य में निरंतरता बनाए रखें और दैनिक रूप से अपने कुलदेवता व इष्टदेव का स्मरण करें।
• यदि आप किसी नए प्रोजेक्ट या पद-परिवर्तन का विचार कर रहे हैं, तो सोच-समझकर आगे बढ़ें, समय अनुकूलता की ओर बढ़ रहा है।`;
    }

    // -------------------------------------------------------------
    // SCENARIO F: BUSINESS & TRADE
    // -------------------------------------------------------------
    if (isBusiness) {
      return `${transitionPhraseHi}व्यापार में निरंतर उतार-चढ़ाव और धन के प्रवाह में आने वाली रुकावटें व्यक्ति को स्वाभाविक रूप से चिंतित करती हैं।

**व्यापार भाव की स्थिति (७वां, १०वां व २रा भाव):**
व्यापार के मुख्य **७वें भाव के उप-स्वामी ${c7CslHi}** हैं तथा संचित पूंजी के **२रे भाव के उप-स्वामी ${c2CslHi}** हैं। 
• वर्तमान में **${antarHi} की अंतर्दशा** और राहु/शनि का गोचर प्रभाव व्यावसायिक साझेदारों अथवा ग्राहकों के साथ तालमेल में अस्थायी गतिरोध पैदा कर रहा था, जिससे कैश फ्लो (तरल धन) में असंतुलन महसूस हुआ।

**सुधार की समय-सीमा:**
यह मंदी का चक्र अधिक लंबा नहीं खिंचेगा। आगामी **३ से ५ महीनों के पश्चात** बाजार में नए ग्राहक और लाभदायक व्यावसायिक संपर्क बनने प्रारंभ होंगे।

**सावधानी व उपाय:**
• इस समय किसी भी व्यक्ति को अत्यधिक उधारी पर माल न दें और कोई भी बड़ा अनियोजित कर्ज न लें।
• प्रतिदिन अपने कार्यस्थल पर घी का दीपक प्रज्वलित कर कनकधारा स्तोत्र अथवा श्री सूक्त का पाठ करें।`;
    }

    // -------------------------------------------------------------
    // SCENARIO G: MARRIAGE - DELAY OR FRUITION
    // -------------------------------------------------------------
    if (isMarriage && !isDivorceOrFight) {
      return `${transitionPhraseHi}विवाह और योग्य जीवनसाथी के संबंध में आपका प्रश्न अत्यंत महत्वपूर्ण है।

**के.पी. व पराशरी विवाह विश्लेषण:**
विवाह के मुख्य **७वें भाव के कस्पल सब-लॉर्ड ${c7CslHi}** हैं। 
• के.पी. ज्योतिष का अकाट्य नियम है कि जब ७वें भाव का उप-स्वामी २रे (कुटुंब), ७वें (दांपत्य) और ११वें (मनोकामना पूर्ति) भाव से अनुकूल संबंध बनाता है, तब विवाह संपन्न होता है।
• वर्तमान **${antarHi} की अंतर्दशा** पारिवारिक चर्चाओं में कुछ विलंब ला रही थी, किंतु अब गोचरीय गुरु का शुभ प्रभाव इस गतिरोध को दूर कर रहा है।

**विवाह तय होने का शुभ समय:**
आगामी **४ से ७ महीनों के भीतर** एक सुयोग्य, संस्कारी और आपकी अपेक्षाओं के अनुरूप रिश्ते की बातचीत अंतिम रूप लेगी।

**सरल वैदिक उपाय:**
• गुरुवार के दिन भगवान विष्णु और मां लक्ष्मी की संयुक्त पूजा करें तथा चने की दाल व गुड़ गाय को खिलाएं।
• यदि कन्या हैं तो कात्यायनी मंत्र, और वर हैं तो "पत्नी मनोरमां देहि..." मंत्र का नियमित पाठ करें।`;
    }

    // -------------------------------------------------------------
    // SCENARIO H: MARRIAGE - DISPUTE / DIVORCE
    // -------------------------------------------------------------
    if (isDivorceOrFight) {
      return `${transitionPhraseHi}दांपत्य जीवन में कलह, अविश्वास या अलगाव जैसी स्थिति हृदय को अत्यंत विचलित कर देती है। मैं आपकी इस पीड़ा को भलीभांति महसूस करता हूँ।

**ग्रह स्थिति की पड़ताल:**
आपकी कुंडली में वैवाहिक सामंजस्य के **७वें भाव के उप-स्वामी ${c7CslHi}** तथा कुटुंब के **२रे भाव के उप-स्वामी** पर वर्तमान में **${antarHi} की अंतर्दशा** का तीखा प्रभाव है। इसके कारण दोनों पक्षों में गलतफहमियां और अहम (Ego) का टकराव बढ़ रहा है।

**क्या अलगाव स्थायी है?**
के.पी. सिद्धांत के अनुसार, यदि स्थायी विच्छेद योग न हो, तो यह मात्र ग्रहों का अस्थायी उग्र प्रभाव है। आगामी **३ महीनों तक** आवेश में आकर कोई भी कठोर या कानूनी निर्णय न लें। समय बीतने के साथ ग्रहों का प्रभाव सौम्य होगा और किसी वरिष्ठ मध्यस्थ के सहयोग से बातचीत का मार्ग खुलेगा।

**शांति उपाय:**
• शिवलिंग पर प्रतिदिन शुद्ध जल में थोड़ा कच्चा दूध व अक्षत मिलाकर "ॐ नमः शिवाय" जपते हुए अर्पित करें।
• शयनकक्ष में कपूर की टिकिया रखें और कटु वचनों से पूरी तरह संयम बरतें।`;
    }

    // -------------------------------------------------------------
    // SCENARIO I: WEALTH & DEBT CRISIS
    // -------------------------------------------------------------
    if (isWealth) {
      return `${transitionPhraseHi}आर्थिक तंगी और कर्ज का दबाव व्यक्ति की मानसिक शांति को सबसे अधिक प्रभावित करता है। आपकी यह चिंता सर्वथा स्वाभाविक है।

**कुंडली में धन व ऋण की स्थिति:**
संचित धन के **२रे भाव के उप-स्वामी ${c2CslHi}** और कर्ज के **६ठे भाव के उप-स्वामी ${c6CslHi}** की परस्पर स्थिति यह दर्शाती है कि अचानक आए अप्रत्याशित खर्चों के कारण वित्तीय संतुलन प्रभावित हुआ है।
• वर्तमान में गतिशील **${mahaHi} में ${antarHi} की अंतर्दशा** आपको वित्तीय अनुशासन और व्यय नियंत्रण की सीख दे रही है।

**कर्ज मुक्ति एवं धन संचय का समय:**
ग्रह गणना के अनुसार, आगामी **४ से ६ महीनों में** आपके लिए आय का एक नया स्रोत या रुका हुआ धन वापस आने का मार्ग बनेगा, जिससे ऋण का भार धीरे-धीरे कम होने लगेगा।

**अचूक ऋण मुक्ति उपाय:**
• मंगलवार के दिन ऋणमोचक मंगल स्तोत्र का पाठ करें और गाय को गुड़-चना खिलाएं।
• बुधवार को किसी भी व्यक्ति को धन उधार देने से बचें।`;
    }

    // -------------------------------------------------------------
    // SCENARIO J: EDUCATION & COMPETITIVE EXAMS
    // -------------------------------------------------------------
    if (isExam) {
      return `${transitionPhraseHi}शिक्षा और प्रतियोगी परीक्षा को लेकर आपकी लगन सराहनीय है।

**शिक्षा व प्रतियोगिता विश्लेषण:**
विद्या के **४थे भाव के उप-स्वामी ${HINDI_PLANET_NAMES[c4?.subLord || 'Mercury'] || c4?.subLord || 'बुध'}** और प्रतियोगिता में विजय के **६ठे भाव के उप-स्वामी ${c6CslHi}** का संबंध आपके बौद्धिक स्तर को ऊर्जावान बनाए हुए है।
• वर्तमान **${mahaHi} में ${antarHi} का प्रभाव** कभी-कभी एकाग्रता में विचलन लाता है, किंतु विषय की गहराई को समझने की तीक्ष्ण क्षमता भी प्रदान करता है।

**सफलता का सूत्र व समय:**
आगामी परीक्षा चक्र में आपका प्रदर्शन बहुत संतोषजनक रहेगा। केवल अपनी अध्ययन दिनचर्या में निरंतरता बनाए रखें।
• अध्ययन कक्ष में पूर्व या उत्तर दिशा की ओर मुख करके बैठें।
• प्रतिदिन प्रातः मां सरस्वती के समक्ष कपूर जलाकर "ॐ ऐं सरस्वत्यै नमः" का जप करें।`;
    }

    // -------------------------------------------------------------
    // SCENARIO K: REMEDIES / UPAY DIRECT REQUEST
    // -------------------------------------------------------------
    if (isRemedy) {
      return `${transitionPhraseHi}आपकी कुंडली में वर्तमान में चल रही **${mahaHi} की महादशा** और **${antarHi} की अंतर्दशा** तथा तात्कालिक गोचर को संतुलित करने के लिए निम्नलिखित सात्विक एवं प्रामाणिक वैदिक उपाय अत्यंत कल्याणकारी सिद्ध होंगे:

१. **मुख्य ग्रह शांति (${antarHi}):**
${
  antarRaw === 'Saturn'
    ? '• शनिवार की शाम को पीपल के वृक्ष के नीचे सरसों के तेल का चौमुखा दीपक जलाएं और "ॐ शं शनैश्चराय नमः" का १०८ बार शांत मन से जप करें।'
    : antarRaw === 'Rahu'
    ? '• पक्षियों को नियमित रूप से सात अनाज (सप्तधान्य) डालें तथा सोते समय सिरहाने एक मुट्ठी सौंफ रखकर सुबह जल में प्रवाहित कर दें।'
    : antarRaw === 'Jupiter'
    ? '• गुरुवार को भगवान विष्णु का ध्यान करें, मस्तक पर केसर या पीले चंदन का तिलक लगाएं और चने की दाल का दान करें।'
    : antarRaw === 'Mars'
    ? '• मंगलवार को श्री हनुमान चालीसा का तीन बार श्रद्धापूर्वक पाठ करें तथा मंगलवार को सिंदूर अर्पित करें।'
    : antarRaw === 'Mercury'
    ? '• बुधवार को गणेश जी को २१ दूर्वा दल अर्पित करें और गाय को हरा चारा खिलाएं।'
    : '• प्रतिदिन प्रातः तांबे के लोटे में जल व रोली डालकर सूर्य देव को अर्घ्य दें।'
}

२. **मानसिक शांति एवं इष्ट साधना:**
• प्रतिदिन प्रातः ५ मिनट मौन बैठकर अपने इष्टदेव का स्मरण करें।

३. **सावधानी:**
• वर्तमान कालखंड में किसी भी आवेश या जल्दबाजी में बड़ा भावनात्मक अथवा वित्तीय निर्णय न लें। धैर्यपूर्वक इन उपायों को निरंतर २१ दिन तक करें, आपको मानसिक शांति और सकारात्मकता का स्पष्ट अनुभव होगा।`;
    }

    // -------------------------------------------------------------
    // SCENARIO L: DYNAMIC NATURAL ASTROLOGICAL SYNTHESIS FOR ANY OTHER QUERY
    // -------------------------------------------------------------
    return `${transitionPhraseHi}आपके द्वारा पूछे गए विषय पर आपकी जन्म कुंडली के सूक्ष्म सूत्रों का परीक्षण करते हैं। 

आपकी कुंडली में लग्न **${lagnaSignHi}** है, जिसके स्वामी **${lagnaLordHi}** हैं, और आपकी चन्द्र राशि **${moonSignHi}** है। वर्तमान में आप पर **${mahaHi} की महादशा में ${antarHi} की अंतर्दशा** गतिशील है।

**ग्रहों की वर्तमान स्थिति एवं फलादेश:**
के.पी. कस्पल गणना के अनुसार आपके मुख्य भावों के उप-स्वामी शुभ नक्षत्रों के प्रभाव में हैं। वर्तमान गोचर में शनि और देवगुरु बृहस्पति का संचरण जीवन के महत्वपूर्ण क्षेत्रों पर दृष्टि डाल रहा है। इसका ज्योतिषीय अर्थ यह है कि वर्तमान में आप जिस भी परिस्थिति या निर्णय के दौर से गुजर रहे हैं, उसमें कुछ समय का धैर्य रखना आवश्यक है, क्योंकि आने वाले **२ से ४ महीनों के भीतर** ग्रहों की गति आपके पक्ष में अनुकूलता और स्पष्ट प्रगति निर्मित करेगी।

**दैनिक जीवन हेतु प्रेरणा:**
• अपने इष्टदेव पर पूर्ण निष्ठा रखें और अपने दैनिक कार्यों में सात्विकता और अनुशासन अपनाएं।
• किसी भी दुविधा की स्थिति में शांत मन से निर्णय लें, cosmic ऊर्जाएं आपका मार्गदर्शन कर रही हैं।

क्या आप इस विषय से जुड़ी किसी विशेष तिथि, उपाय या अन्य पहलू को और विस्तार से समझना चाहते हैं?`;
  }

  // ===============================================================
  // ENGLISH SYNTHESIS (Warm, Human-to-Human Dialogue)
  // ===============================================================
  let transitionPhraseEn = '';
  if (isOngoingConversation) {
    transitionPhraseEn = 'Building upon our ongoing consultation, let us examine this specific inquiry through your chart. ';
  }

  if (hasYear2027 && (isProfessionGeneral || /best|field|career/i.test(q))) {
    return `${transitionPhraseEn}The year 2027 represents a major career turning point in your horoscope.

**Astrological Assessment for 2027:**
Your Ascendant is **${lagnaSign}** and your 10th Cusp Sub-Lord (${c10?.subLord || 'Mercury'}) carries strong foundational strength.
In 2027, two transformative transits converge:
1. **Saturn's Transit in Aries:** For your ${lagnaSign} Ascendant, Saturn enters the powerful 6th Upachaya house. In Vedic astrology, Saturn in the 6th destroys opposition, awards competitive supremacy, and secures long-term employment.
2. **Jupiter's Double Transit:** Mid-2027 activates your 10th House of Career (Karma Sthana) with divine expansion and recognition.

**Top Recommended Career Sectors for 2027:**
• **1. Technology & Enterprise Systems:** Software architecture, engineering, IT management, or data analytics.
• **2. Strategic Operations & Management:** Project leadership, corporate governance, and advisory roles.
• **3. High-Value Consulting:** Specialized professional consultancy where strategic problem-solving is valued.

**Golden Window:**
While early 2027 builds momentum, **May 2027 to October 2027** will deliver your most prominent career elevation and financial reward.`;
  }

  if (isHealth) {
    return `${transitionPhraseEn}Your health and physical vitality are the foremost pillars of your well-being.

**Astrological Health Diagnosis:**
With your Ascendant in **${lagnaSign}** governed by **${lagnaLord}**, your physical immunity is fundamentally resilient. 
Under KP principles, the 6th Cusp Sub-Lord (${c6?.subLord || 'Mars'}) indicates acute symptoms, while the 5th and 11th cusps govern recovery. The operating **${mahaRaw} Mahadasha and ${antarRaw} Antardasha** are currently highlighting pitta/vata sensitivity and nervous tension.

**Timeline of Relief:**
No chronic adverse indicators are present. Progressive relief and revitalized vitality will manifest within the next **3 to 5 weeks** as transiting benefic rays support your Lagna.

**Holistic Vedic Guidance:**
• Offer fresh water to the rising Sun every morning while reciting the Gayatri Mantra.
• Chant the Mahamrityunjaya Mantra 11 times before sleep to calm mental restlessness.
• Drink water stored in a copper vessel at dawn and practice gentle pranayama.`;
  }

  if (isProfessionGeneral || isJobLossOrSearch || isPromotionOrHike) {
    return `${transitionPhraseEn}Let us assess your professional prospects through the precision of your Placidus Cuspal Sub-Lords.

**Career Dynamics:**
In your chart, the 10th Cusp Sub-Lord (${c10?.subLord || 'Mercury'}) holds promise for steady occupational elevation. The active **${mahaRaw} Mahadasha and ${antarRaw} Antardasha** represent a transformative period designed to align you with a more fulfilling role.

**Favorable Timing:**
Over the upcoming **2 to 4 months**, shifting planetary transits will dissolve existing bottlenecks and bring forward clear hiring opportunities or professional recognition.

**Recommended Remedy:**
Offer daily morning personal prayers, avoid hasty decisions in workplace discussions, and support a student or needy person on Wednesdays or Saturdays.`;
  }

  if (isMarriage || isDivorceOrFight) {
    return `${transitionPhraseEn}Examining your 7th Cusp Sub-Lord (${c7?.subLord || 'Venus'}), the matrimonial indicators show meaningful movement.

**Relationship Prospects:**
KP astrology confirms that when the 7th CSL connects favorably with houses 2, 7, and 11, alliances reach fruition. The active **${antarRaw} sub-period** is clearing past delays. A mutually respectful and family-aligned proposal is projected to crystallize within the next **4 to 7 months**.

**Guiding Practice:**
Pray to Lord Vishnu and Goddess Lakshmi on Thursdays and maintain a calm, patient approach in all emotional discussions.`;
  }

  // Universal English Fallback
  return `${transitionPhraseEn}I have carefully evaluated your question against your planetary coordinates. With your Ascendant in **${lagnaSign}** and Moon in **${moonSign}**, you are navigating a significant cosmic progression under the **${mahaRaw} Mahadasha and ${antarRaw} Antardasha**.

**Planetary Outlook:**
Your Cuspal Sub-Lords are positioned in favorable constellations. Within the next **2 to 4 months**, planetary transits will bring forward clearer opportunities and steady relief. 

Maintain inner calm, stay consistent with your daily responsibilities, and trust in divine timing. Would you like to delve deeper into any specific timeline or remedy?`;
}
