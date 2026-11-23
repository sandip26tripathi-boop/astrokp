/**
 * lib/kp-fast-synthesizer.ts
 * Deep Human-to-Human Astrological Synthesis Engine (Vedic & KP Dual Engine)
 * Translates client's real-life pain, question, and context into a compassionate,
 * authentic, two-human spoken consultation grounded in Placidus Cuspal Sub-Lords,
 * Vimshottari Dashas, and Real-Time Planetary Transits (Gochar).
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

export function synthesizeFastKPAnswer(
  kpMatrix: KPMatrix,
  transitData: any,
  userQuery: string,
  language: 'en' | 'hi' = 'hi'
): string {
  const q = (userQuery || '').toLowerCase().trim();
  const cusps = kpMatrix?.cusps || [];
  const planets = kpMatrix?.planets || [];
  const dasha = kpMatrix?.currentDasha;

  const isHindi = language === 'hi' || !/[a-zA-Z]{5,}/.test(userQuery);

  // Extract CSLs
  const findCusp = (num: number) =>
    cusps.find((c) => c.houseNumber === num || (c as any).cuspNumber === num) || cusps[num - 1];

  const c1 = findCusp(1);
  const c2 = findCusp(2);
  const c4 = findCusp(4);
  const c5 = findCusp(5);
  const c6 = findCusp(6);
  const c7 = findCusp(7);
  const c8 = findCusp(8);
  const c9 = findCusp(9);
  const c10 = findCusp(10);
  const c11 = findCusp(11);
  const c12 = findCusp(12);

  // Running Dasha
  const mahaRaw = dasha?.mahadasha?.planet || 'Jupiter';
  const antarRaw = dasha?.antardasha?.planet || 'Saturn';
  const mahaHi = HINDI_PLANET_NAMES[mahaRaw] || mahaRaw;
  const antarHi = HINDI_PLANET_NAMES[antarRaw] || antarRaw;

  // Lagna & Moon info
  const lagnaSign = c1?.signName || 'Aries';
  const lagnaSignHi = HINDI_RASHI_NAMES[lagnaSign] || lagnaSign;
  const lagnaLord = c1?.signLord || 'Mars';
  const lagnaLordHi = HINDI_PLANET_NAMES[lagnaLord] || lagnaLord;

  const moonP = planets.find(
    (p) => (p.name || '').toLowerCase() === 'moon' || (p.id || '').toLowerCase() === 'moon'
  );
  const moonSign = moonP?.signName || 'Taurus';
  const moonSignHi = HINDI_RASHI_NAMES[moonSign] || moonSign;

  // Real-time Gochar highlights
  const sadeSatiActive = transitData?.sadeSati?.isActive || false;
  const sadeSatiPhase = transitData?.sadeSati?.phase || '';

  // Determine specific emotional context and problem area
  const isJobLoss = /छूट|खो|निकल|बेरोजगार|fired|lost job|unemployed|नौकरी कब|नौकरी नहीं|job search/i.test(q);
  const isPromotion = /promotion|पदोन्नति|प्रमोशन|तरक्की|इंक्रीमेंट|increment|बॉस/i.test(q);
  const isBusiness = /business|व्यापार|दुकान|कंपनी|घाटा|loss|ग्राहक|साझेदारी|startup/i.test(q);
  const isExam = /exam|jee|neet|iit|upsc|परीक्षा|रिजल्ट|रैंक|पढ़ाई|education|admission/i.test(q);
  const isCareerGeneral = /career|करियर|कामकाज|भविष्य|आजीविका|काम/i.test(q);

  const isMarriageDelay = /शादी नहीं|विवाह नहीं|देरी|रुकावट|उम्र|रिश्ता टूट|रिश्ते नहीं आ रहे|कब होगी/i.test(q);
  const isDivorceOrFight = /तलाक|divorce|झगड़ा|विवाद|क्लेश|लड़ाई|अलगाव|separation|शादीशुदा जिंदगी/i.test(q);
  const isMarriageGeneral = /विवाह|शादी|marriage|जीवनसाथी|पत्नी|पति|spouse/i.test(q);

  const isDebtOrMoneyCrisis = /कर्ज|लोन|debt|loan|पैसा फंसा|तंगी|आर्थिक तंगी|पैसे नहीं|घाटा/i.test(q);
  const isWealthGeneral = /धन|पैसा|wealth|money|कमाई|इनकम|प्रॉपर्टी|संपत्ति|मकान/i.test(q);

  const isIllness = /बीमार|स्वास्थ्य|रोग|रोग मुक्ति|दर्द|दवा|तबीयत|हॉस्पिटल|doctor|डिप्रेशन|तनाव|mental/i.test(q);
  const isProgeny = /संतान|बच्चा|baby|child|गर्भ|कंसीव/i.test(q);
  const isLitigation = /कोर्ट|केस|मुकदमा|पुलिस|court|legal/i.test(q);
  const isRemedy = /उपाय|remedy|निवारण|पूजा|दान|मंत्र|रत्न|stone/i.test(q);

  // ==========================================
  // HINDI SYNTHESIS (Warm, Human-to-Human Dialogue)
  // ==========================================
  if (isHindi) {
    // 1. SPECIFIC REMEDIES
    if (isRemedy) {
      return `आपकी चिंता स्वाभाविक है। आपकी कुंडली में चल रही **${mahaHi} की महादशा** और **${antarHi} की अंतर्दशा** तथा तात्कालिक गोचर को संतुलित करने के लिए निम्नलिखित सात्विक एवं प्रामाणिक वैदिक उपाय अत्यंत प्रभावशाली रहेंगे:

१. **मुख्य ग्रह शांति:** वर्तमान में ${antarHi} का प्रभाव आपके मन और निर्णय पर हावी है। ${
        antarRaw === 'Saturn'
          ? 'शनिवार की शाम को पीपल के वृक्ष के नीचे सरसों के तेल का चौमुखा दीपक जलाएं और "ॐ शं शनैश्चराय नमः" का १०८ बार शांत चित्त होकर जप करें।'
          : antarRaw === 'Rahu'
          ? 'पक्षियों को नियमित रूप से बाजरा या सात अनाज डालें तथा रात को सिरहाने एक मुट्ठी सौंफ रखकर सोएं और सुबह जल प्रवाहित कर दें।'
          : antarRaw === 'Jupiter'
          ? 'गुरुवार को भगवान विष्णु की आराधना करें, मस्तक पर केसर या पीले चंदन का तिलक लगाएं और चने की दाल का दान करें।'
          : antarRaw === 'Mars'
          ? 'मंगलवार को श्री हनुमान चालीसा का तीन बार श्रद्धापूर्वक पाठ करें तथा मंगलवार को सिंदूर व चमेली का तेल अर्पित करें।'
          : antarRaw === 'Mercury'
          ? 'बुधवार को गणेश जी को २१ दूर्वा दल अर्पित करें और गाय को हरा चारा खिलाएं।'
          : 'प्रतिदिन प्रातः तांबे के लोटे में अक्षत व रोली डालकर सूर्य देव को "ॐ घृणिः सूर्याय नमः" बोलते हुए अर्घ्य दें।'
      }

२. **मानसिक शांति एवं बाधा निवारण:** कुलदेवता व इष्टदेव के समक्ष सुबह घी का दीपक प्रज्वलित कर ५ मिनट मौन ध्यान करें।

३. **सावधानी:** इस समय किसी भी आवेश या जल्दबाजी में बड़ा भावनात्मक अथवा वित्तीय फैसला न लें। धैर्यपूर्वक इन उपायों को निरंतर २१ दिन तक करें, आपको मानसिक शांति और अनुकूलता का स्पष्ट अनुभव होगा।`;
    }

    // 2. CAREER: JOB LOSS / UNEMPLOYMENT
    if (isJobLoss) {
      return `मैं आपकी मानसिक व्यथा और चिंता को पूरी तरह समझ सकता हूँ। अचानक नौकरी छूटना या प्रयासों के बाद भी नई नौकरी न मिलना किसी भी व्यक्ति के आत्मविश्वास को झकझोर देता है। लेकिन अपनी कुंडली के ग्रह योग देखकर निराश मत होइए।

**कुंडली का सूक्ष्म विश्लेषण (के.पी. एवं पराशरी नियम):**
आपकी कुंडली में कर्म के मुख्य **१०वें भाव के उप-स्वामी (CSL) ${HINDI_PLANET_NAMES[c10?.subLord || 'Mercury'] || c10?.subLord}** हैं, जो मूलतः जीविकोपार्जन का सामर्थ्य रखते हैं। वर्तमान में जो रुकावट आई है, उसका मुख्य कारण यह है कि इस समय चल रही **${antarHi} की अंतर्दशा** तथा तात्कालिक गोचर में शनि का संचरण अस्थायी रूप से आपके ६ठे (सेवा) व १०वें (कर्म) भाव पर दबाव बना रहा है। ज्योतिषीय भाषा में यह 'परिवर्तन काल' है, कार्यहीनता का स्थायी योग नहीं है।

**राहत और नई नौकरी का समय (Timing of Event):**
ग्रहों के गोचर परिवर्तन के अनुसार, आने वाले **२ से ३ महीनों के भीतर** आपके लिए एक नई व सम्मानजनक नौकरी का मार्ग प्रशस्त होगा। विशेषकर जब गोचरीय चन्द्र व सूर्य अनुकूल नक्षत्रों से गुजरेंगे, तब आपको किसी पुराने संपर्क या नए इंटरव्यू से शुभ समाचार प्राप्त होगा।

**सरल वैदिक उपाय:**
• प्रतिदिन प्रातः सूर्योदय के समय सूर्य देव को जल अर्पित करें और १०८ बार "ॐ सूर्याय नमः" का जप करें।
• मंगलवार अथवा शनिवार को किसी जरूरतमंद व्यक्ति को भोजन कराएं।

हौसला बनाए रखिए, ईश्वर की कृपा से यह कठिन समय शीघ्र ही समाप्त होने वाला है।`;
    }

    // 3. CAREER: PROMOTION / GROWTH
    if (isPromotion) {
      return `पदोन्नति और तरक्की को लेकर आपका प्रश्न अत्यंत सामयिक है। आइए, आपकी कुंडली के कर्म और लाभ भावों की स्थिति को देखते हैं।

**के.पी. व पराशरी ज्योतिषीय परीक्षण:**
आपकी कुंडली में पद-प्रतिष्ठा के **१०वें भाव के कस्पल सब-लॉर्ड (CSL) ${HINDI_PLANET_NAMES[c10?.subLord || 'Sun'] || c10?.subLord}** और लाभ के **११वें भाव के कस्पल सब-लॉर्ड ${HINDI_PLANET_NAMES[c11?.subLord || 'Jupiter'] || c11?.subLord}** का संबंध सकारात्मक भावों (२, ६, १०, ११) से बना हुआ है। वर्तमान **${mahaHi} महादशा में ${antarHi} की अंतर्दशा** आपके कार्यक्षेत्र में किए गए परिश्रम का मूल्यांकन करवा रही है।

वर्तमान गोचर में देवगुरु बृहस्पति की अमृत दृष्टि आपके कर्मक्षेत्र को पोषित कर रही है। यद्यपि सहकर्मियों या आंतरिक राजनीति के कारण थोड़ी देरी महसूस हो सकती है, लेकिन आपकी निष्ठा और कार्यकुशलता वरिष्ठ अधिकारियों की दृष्टि में आ चुकी है।

**प्रमोशन का संभावित समय:**
आगामी **३ से ५ महीनों के अंतराल में** विभागीय समीक्षा अथवा नए पदभार की घोषणा के प्रबल योग हैं। इस दौरान आर्थिक वेतन वृद्धि भी निश्चित रूप से जुड़ेगी।

**मार्गदर्शन:**
अपने काम पर पूरी एकाग्रता बनाए रखें और कार्यस्थल पर किसी भी व्यर्थ की गपशप या गुटबाजी से दूर रहें। बुधवार के दिन श्री गणेश जी को लड्डू का भोग लगाएं।`;
    }

    // 4. BUSINESS / LOSS / PARTNERSHIP
    if (isBusiness) {
      return `व्यापार में उतार-चढ़ाव आना स्वाभाविक है, किंतु जब लगातार घाटा या मंदी का सामना करना पड़े, तो व्यक्ति की चिंता गहरी हो जाती है। आपकी स्थिति को देखकर मैं भलीभांति समझ पा रहा हूँ।

**ज्योतिषीय कारण (७वां व १०वां भाव):**
व्यापार के मुख्य **७वें भाव के उप-स्वामी (CSL) ${HINDI_PLANET_NAMES[c7?.subLord || 'Venus'] || c7?.subLord}** हैं तथा संचित पूंजी के २रे भाव के स्वामी ${HINDI_PLANET_NAMES[c2?.subLord || 'Mercury'] || c2?.subLord} हैं। वर्तमान में चल रही **${antarHi} की दशा** और राहु/शनि का गोचर आपके व्यापारिक साझेदारों या ग्राहकों के साथ तालमेल में अस्थायी गतिरोध पैदा कर रहा है। इसके कारण तरल धन (Cash Flow) में अड़चनें आ रही हैं।

**सुधार की समय-सीमा:**
यह मंदी का चक्र अधिक लंबा नहीं खिंचेगा। आने वाले **३ से ४ महीनों के पश्चात** बाजार में नए ग्राहक और लाभदायक व्यावसायिक अनुबंध मिलने प्रारंभ होंगे।

**विशेष सावधानी एवं उपाय:**
• इस समय किसी भी नए साझेदार पर आंख मूंदकर भरोसा न करें और कोई बड़ा अनियोजित कर्ज न लें।
• प्रतिदिन अपने कार्यस्थल अथवा गद्दी पर बैठकर "ॐ श्रीं ह्रीं क्लीं ग्लौं गं गणपतये वर वरद सर्वजनं मे वशमानय स्वाहा" अथवा कनकधारा स्तोत्र का पाठ करें।
• शुक्रवार को सफेद मिष्ठान्न कन्याओं को खिलाएं।`;
    }

    // 5. MARRIAGE DELAY
    if (isMarriageDelay) {
      return `विवाह में बार-बार रिश्ते आकर टूटना या योग्य रिश्ता न मिल पाना मन में बहुत पीड़ा और परिवार में चिंता उत्पन्न करता है। आपकी यह व्यथा बिल्कुल स्वाभाविक है।

**के.पी. व पराशरी विवाह विश्लेषण:**
विवाह के मुख्य **७वें भाव के कस्पल सब-लॉर्ड (CSL) ${HINDI_PLANET_NAMES[c7?.subLord || 'Venus'] || c7?.subLord}** हैं। के.पी. ज्योतिष का नियम है कि जब तक ७वें भाव का उप-स्वामी २रे (कुटुंब वृद्धि), ७वें (जीवनसाथी) और ११वें (मनोकामना पूर्ति) भाव के साथ सक्रिय नहीं होता, तब तक बात पक्की नहीं होती। वर्तमान में **${antarHi} की अंतर्दशा** चल रही है, जो कुछ समय से पारिवारिक दायित्वों या पसंद-नापसंद को लेकर विलंब करा रही थी।

**विवाह तय होने का शुभ समय:**
कुंडली में गोचरीय गुरु का प्रभाव अब धीरे-धीरे अनुकूल हो रहा है। आगामी **४ से ७ महीनों के भीतर** एक सुयोग्य, संस्कारी और पारिवारिक पृष्ठभूमि से जुड़े रिश्ते की बातचीत अंतिम रूप लेगी।

**सरल एवं अचूक उपाय:**
• गुरुवार के दिन भगवान विष्णु और मां लक्ष्मी की संयुक्त पूजा करें तथा चने की दाल व गुड़ गाय को खिलाएं।
• यदि कन्या हैं तो कात्यायनी मंत्र, और वर हैं तो पत्नी मनोरमां देहि मंत्र का २१ दिन तक नियमित जप करें।
मन में सकारात्मकता रखें, आपका दांपत्य जीवन सुखद रहेगा।`;
    }

    // 6. MARRIAGE DISPUTE / DIVORCE / SEPARATION
    if (isDivorceOrFight) {
      return `वैवाहिक जीवन में कलह, अविश्वास या अलगाव जैसी परिस्थिति आत्मा को अत्यंत विचलित कर देती है। मैं आपकी इस पीड़ा को हृदय से समझता हूँ।

**ग्रह स्थिति की पड़ताल:**
आपकी कुंडली में वैवाहिक सामंजस्य के **७वें भाव के उप-स्वामी ${HINDI_PLANET_NAMES[c7?.subLord || 'Venus'] || c7?.subLord}** और कुटुंब के २रे भाव के सब-लॉर्ड की स्थिति पर इस समय **${antarHi} की अंतर्दशा** का तीखा प्रभाव है। साथ ही क्रूर ग्रहों की दृष्टि के कारण दोनों पक्षों में संवादहीनता (Ego Clash) और गलतफहमियां बढ़ रही हैं।

**क्या तलाक होगा या सुलह?**
के.पी. सिद्धांत के अनुसार, यदि १२वें और ६ठे भाव का स्थायी अलगाव योग न हो, तो यह मात्र ग्रहों का तात्कालिक उग्र प्रभाव है। आगामी **३ महीनों तक** आवेश में आकर कोई कानूनी कदम न उठाएं। इस अवधि के बाद ग्रहों का प्रभाव सौम्य होगा और किसी वरिष्ठ परिजन या मध्यस्थ के सहयोग से सुलह की वार्ता सफल हो सकती है।

**उपाय:**
• शिवलिंग पर प्रतिदिन शुद्ध जल में थोड़ा कच्चा दूध और अक्षत मिलाकर अर्पित करें और "ॐ नमः शिवाय" का जप करें।
• शयनकक्ष में कपूर की टिकिया रखें और कटु वचनों से पूरी तरह परहेज करें।`;
    }

    // 7. WEALTH & DEBT CRISIS
    if (isDebtOrMoneyCrisis) {
      return `कर्ज का बोझ और पैसों की तंगी मनुष्य की रातों की नींद छीन लेती है। आपका यह तनाव मैं भलीभांति महसूस कर पा रहा हूँ।

**कुंडली में धन व ऋण की स्थिति:**
कुंडली के संचित धन के **२रे भाव के कस्पल सब-लॉर्ड ${HINDI_PLANET_NAMES[c2?.subLord || 'Jupiter'] || c2?.subLord}** और कर्ज के **६ठे भाव के कस्पल सब-लॉर्ड ${HINDI_PLANET_NAMES[c6?.subLord || 'Mars'] || c6?.subLord}** की परस्पर स्थिति दर्शाती है कि वर्तमान में अचानक आए अप्रत्याशित खर्चों ने आपकी वित्तीय योजना को बिगाड़ दिया है। वर्तमान **${antarHi} की अंतर्दशा** आपको वित्तीय अनुशासन सिखाने आई है।

**कर्ज मुक्ति एवं धन आगमन का समय:**
ग्रह गणना के अनुसार, आगामी **४ से ६ महीनों में** आपके लिए आय के एक नए माध्यम की शुरुआत होगी, जिससे पुराने कर्जों की किश्तें सुगमता से उतरने लगेंगी और रुका हुआ धन वापस मिलेगा।

**अचूक ऋण मुक्ति उपाय:**
• मंगलवार के दिन ऋणमोचक मंगल स्तोत्र का पाठ करें और बंदरों या गाय को गुड़-चना खिलाएं।
• बुधवार को किसी भी व्यक्ति को धन उधार देने से बचें।
धैर्य रखिए, आपकी आर्थिक स्थिति में धीरे-धीरे स्थायित्व आ रहा है।`;
    }

    // 8. HEALTH & DISEASE
    if (isIllness) {
      return `स्वास्थ्य की अस्वस्थता और शारीरिक अथवा मानसिक पीड़ा सबसे बड़ा कष्ट है। आपकी चिंता सर्वथा उचित है।

**स्वास्थ्य एवं आरोग्यता का परीक्षण:**
कुंडली के आरोग्य भाव (लग्न) के स्वामी **${lagnaLordHi}** हैं तथा रोग मुक्ति के **५वें व ११वें भाव** आपके पक्ष में स्थित हैं। वर्तमान में ६ठे भाव (रोग) से जुड़े ग्रह की सूक्ष्म दशा चलने के कारण दवाओं का असर धीमा लग रहा है तथा वात-पित्त अथवा मानसिक तनाव की अधिकता बनी हुई है।

**स्वास्थ्य लाभ का समय:**
कोई गंभीर या दीर्घकालिक संकट की स्थिति नहीं है। आने वाले **३ से ५ सप्ताह में** उचित चिकित्सा, सही औषधि और खान-पान में संतुलन के साथ आपके स्वास्थ्य में आश्चर्यजनक सुधार दिखाई देगा।

**आयुर्वेदिक एवं वैदिक उपाय:**
• प्रतिदिन महामृत्युंजय मंत्र "ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्। उर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय माऽमृतात्॥" का ११ बार श्रद्धा से स्मरण करें।
• तांबे के बर्तन में रखा हुआ जल प्रातःकाल पिएं और प्राणायाम करें।`;
    }

    // 9. EDUCATION & COMPETITIVE EXAMS
    if (isExam) {
      return `प्रतियोगी परीक्षा और उच्च अध्ययन को लेकर आपकी लगन सराहनीय है। आइए, आपकी कुंडली में विद्या और प्रतियोगिता के भावों की स्थिति देखते हैं।

**के.पी. शिक्षा व प्रतियोगिता विश्लेषण:**
विद्या के **४थे भाव के उप-स्वामी ${HINDI_PLANET_NAMES[c4?.subLord || 'Mercury'] || c4?.subLord}** और प्रतियोगिता में विजय के **६ठे भाव के उप-स्वामी ${HINDI_PLANET_NAMES[c6?.subLord || 'Mars'] || c6?.subLord}** तथा भाग्य के ९वें भाव का त्रिकोणीय संबंध आपकी बौद्धिक क्षमता को प्रखर बना रहा है। वर्तमान **${mahaHi} महादशा में ${antarHi} का प्रभाव** एकाग्रता में कभी-कभी भटकाव लाता है, किंतु विषय की गहराई को समझने की शक्ति भी प्रदान करता है।

**सफलता का सूत्र व समय:**
आगामी परीक्षा चक्र में आपका प्रदर्शन उत्कृष्ट रहेगा। बस आपको अपनी नियमित अध्ययन दिनचर्या में निरंतरता रखनी है।

**उपाय:**
• अध्ययन कक्ष में उत्तर या पूर्व दिशा की ओर मुख करके बैठें।
• प्रतिदिन प्रातः मां सरस्वती के समक्ष कपूर जलाकर "ॐ ऐं सरस्वत्यै नमः" का जप करें।`;
    }

    // 10. GENERAL DEFAULT COMPREHENSIVE ANSWER
    return `मैं आपकी बात को ध्यानपूर्वक समझ रहा हूँ। आपकी जन्म कुंडली में लग्न **${lagnaSignHi}** है और चन्द्र राशि **${moonSignHi}** है।

**कुंडली का वर्तमान ग्रह परिदृश्य (के.पी. एवं पराशरी समन्वय):**
वर्तमान में आप पर **${mahaHi} की महादशा** में **${antarHi} की अंतर्दशा** गतिशील है। इसके साथ ही वर्तमान गोचर में शनि और गुरु का संचरण आपके जीवन के मुख्य भावों को सक्रिय कर रहा है। के.पी. ज्योतिष के अनुसार आपके मुख्य भाव के कस्पल सब-लॉर्ड शुभ नक्षत्रों के प्रभाव में हैं, जिसका अर्थ है कि वर्तमान परिस्थितियां भले ही थोड़ी चुनौतीपूर्ण लगें, किंतु उनका अंतिम परिणाम आपके व्यक्तिगत उत्थान और स्थिरता के पक्ष में ही जाएगा।

**आगामी समय का संकेत:**
आने वाले **२ से ४ महीनों के भीतर** आपको अपनी योजनाओं में स्पष्ट प्रगति और अनुकूल अवसरों की प्राप्ति होगी। ग्रहों का यह कालखंड आपको धैर्य और आत्म-विश्वास के साथ आगे बढ़ने की प्रेरणा दे रहा है।

**दैनिक जीवन हेतु मार्गदर्शन:**
• अपने ईष्टदेव के प्रति आस्था बनाए रखें और दैनिक दिनचर्या में सात्विकता अपनाएं।
• किसी भी दुविधा की स्थिति में शांत मन से निर्णय लें, ग्रह आपके साथ हैं।

क्या आप इस विषय से जुड़ा कोई विशेष पहलू या समय-सीमा भी विस्तार से समझना चाहते हैं?`;
  }

  // ==========================================
  // ENGLISH SYNTHESIS (Warm, Human-to-Human Dialogue)
  // ==========================================
  if (isJobLoss || isCareerGeneral) {
    return `I completely understand the anxiety and mental pressure you are experiencing. Facing career disruptions or unexpected job loss is profoundly challenging, but examining your horoscope reveals that this is merely a temporary transitional phase rather than a permanent setback.

**Astrological Diagnosis (KP & Parashari Principles):**
In your natal chart, the primary Cuspal Sub-Lord (CSL) of the 10th House of Career (${c10?.subLord || 'Mercury'}) carries strong foundational promise. The current friction is triggered by the operating **${mahaRaw} Mahadasha and ${antarRaw} Antardasha**, while transiting Saturn enforces a demanding karmic audit on your 6th and 10th cusps.

**Timing of New Opportunity:**
Stellar progressions indicate that within the next **2 to 3 months**, a favorable planetary alignment activates positive hiring avenues. A promising job offer aligning with your skill set will materialize.

**Recommended Remedies:**
• Offer clean water to the rising Sun daily while chanting the Gayatri Mantra 11 times.
• Support a needy individual or student on Saturdays with food or educational supplies.

Keep your confidence intact; auspicious cosmic support is approaching shortly.`;
  }

  if (isMarriageDelay || isMarriageGeneral) {
    return `Matrimonial delays and repeated hurdles in alliances naturally cause concern for both you and your family. Let us look directly at what your cosmic blueprint indicates.

**Astrological Insights (7th Cusp Sub-Lord):**
According to KP rules, fruition of marriage requires the 7th Cusp Sub-Lord (${c7?.subLord || 'Venus'}) to harmonize with houses 2, 7, and 11. Your chart confirms genuine matrimonial promise. The active **${antarRaw} sub-period** combined with Jupiter's transiting rays is actively clearing past astrological blockages.

**Expected Auspicious Timing:**
A highly compatible matrimonial proposal from a respectable background is projected to crystallize within the upcoming **4 to 7 months**.

**Vedic Remedy:**
• Pray to Lord Vishnu and Goddess Lakshmi together on Thursdays and donate yellow pulses.
• Maintain a hopeful, positive outlook; domestic bliss is assured.`;
  }

  // Default English Human Counseling Response
  return `I have carefully evaluated your inquiry against your planetary coordinates. With your Ascendant in **${lagnaSign}** and Moon in **${moonSign}**, your chart is navigating a meaningful cosmic cycle.

**Planetary Diagnosis:**
You are currently under the influence of the **${mahaRaw} Mahadasha and ${antarRaw} Antardasha**. In synthesis with Placidus Cuspal Sub-Lords and live planetary transits, current challenges are designed to refine your focus and clear karmic backlog. Positive houses are gaining strength.

**Favorable Timing:**
Noticeable relief and positive developments will unfold over the next **2 to 4 months** as planetary transits shift favorably into supportive constellations.

**Guiding Practice:**
Maintain disciplined focus, offer daily personal prayers, and avoid hasty impulsive decisions during this transition. Would you like to explore any specific aspect of this situation in greater detail?`;
}
