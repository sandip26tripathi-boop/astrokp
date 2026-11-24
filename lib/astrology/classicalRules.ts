/**
 * lib/astrology/classicalRules.ts
 * Classical Knowledge Base & Codified Rules of
 * Krishnamurti Paddhati (KP Astrology) & Parashari Vedic Astrology
 */

export interface PlanetElementalProperties {
  tattva: 'Agni (Fire)' | 'Jal (Water)' | 'Prithvi (Earth)' | 'Vayu (Air)' | 'Akash (Ether)';
  tattvaHi: string;
  dosha: 'Vata' | 'Pitta' | 'Kapha' | 'Tridosha' | 'Vata-Kapha' | 'Vata-Pitta';
  doshaHi: string;
  bodyParts: string[];
  healthSensitivities: string[];
  naturalKarakatva: string[];
  geminiDiagnosticManifestation: string;
}

export const PLANET_ELEMENTAL_MAP: Record<string, PlanetElementalProperties> = {
  Sun: {
    tattva: 'Agni (Fire)',
    tattvaHi: 'अग्नि तत्त्व',
    dosha: 'Pitta',
    doshaHi: 'पित्त दोष',
    bodyParts: ['Heart (हृदय)', 'Bones (अस्थि)', 'Eyes (नेत्र/दृष्टि)', 'Head (मस्तिष्क)', 'Spine (रीढ़ की हड्डी)'],
    healthSensitivities: ['High fever (तीव्र ज्वर)', 'Heat exhaustion (पित्त प्रकोप)', 'Heart palpitations', 'Eye strain', 'Bone density issues'],
    naturalKarakatva: ['Authority (सत्ता/प्रशासन)', 'Father (पिता)', 'Self-respect (आत्मबल)', 'Vitality (जीवन शक्ति)'],
    geminiDiagnosticManifestation: 'सूर्य अग्नि तत्त्व और पित्त के कारक हैं; 6/8/12 भाव संबंध में यह सिरदर्द, आंखों में जलन, पित्त विकार या हड्डियों की कमजोरी दर्शाते हैं।'
  },
  Moon: {
    tattva: 'Jal (Water)',
    tattvaHi: 'जल तत्त्व',
    dosha: 'Vata-Kapha',
    doshaHi: 'कफ एवं वात दोष',
    bodyParts: ['Mind/Emotions (मन/मस्तिष्क)', 'Fluids (शारीरिक तरल/रक्त रस)', 'Chest/Lungs (छाती व फेफड़े)', 'Stomach (आमाशय)', 'Left Eye'],
    healthSensitivities: ['Cold/Sinus/Cough (जुकाम, साइनोसाइटिस, कफ विकार)', 'Respiratory allergies (श्वास संवेदनशीलता)', 'Fluid retention (जल भराव)', 'Anxiety/Insomnia (मानसिक बेचैनी)'],
    naturalKarakatva: ['Mind (मन)', 'Mother (माता)', 'Public relations (जनता/जनसंपर्क)', 'Peace (मानसिक शांति)'],
    geminiDiagnosticManifestation: 'चन्द्रमा जल तत्त्व और कफ के कारक हैं; रोग भावों से जुड़ने पर कफ, साइनसाइटिस, श्वसन एलर्जी, फेफड़ों में जकड़न या मानसिक तनाव की सीधी प्रवृत्ति बनती है।'
  },
  Mars: {
    tattva: 'Agni (Fire)',
    tattvaHi: 'अग्नि तत्त्व',
    dosha: 'Pitta',
    doshaHi: 'तीव्र पित्त दोष',
    bodyParts: ['Muscles (मांसपेशियां)', 'Blood/Marrow (रक्त व मज्जा)', 'Head (सिर)', 'Immunity (प्रतिरोधक तंत्र)'],
    healthSensitivities: ['Inflammation (सूजन/दाह)', 'Infections/Boils (संक्रमण/फोड़े-फुंसी)', 'Accidents/Cuts/Surgeries (रक्तस्राव/शल्यक्रिया)', 'Acid reflux (अम्लपित्त)'],
    naturalKarakatva: ['Courage (साहस/पराक्रम)', 'Brothers (सहोदर/भाई)', 'Real Estate/Property (भूमि/अचल संपत्ति)', 'Engineering/Executive (प्रबंधन/तकनीकी)'],
    geminiDiagnosticManifestation: 'मंगल तीक्ष्ण अग्नि और पित्त के स्वामी हैं; 6ठे या 8वें भाव में बैठने अथवा रोग भाव को देखने पर अचानक जलन, फोड़े-फुंसी, सर्जरी, चोट या रक्त विकार की स्थिति बनती है।'
  },
  Mercury: {
    tattva: 'Prithvi (Earth)',
    tattvaHi: 'पृथ्वी तत्त्व',
    dosha: 'Tridosha',
    doshaHi: 'त्रिदोष (वात प्रधान)',
    bodyParts: ['Nervous System (तंत्रिका तंत्र)', 'Skin (त्वचा)', 'Speech/Throat (वाणी/गला)', 'Lungs/Bronchial tubes (श्वसन नलिका)'],
    healthSensitivities: ['Nerve weakness (नाड़ी दुर्बलता)', 'Skin allergies (त्वचा रोग/एक्जिमा)', 'Speech hesitation (वाणी दोष)', 'Digestive dysbiosis (अग्निमांद्य)'],
    naturalKarakatva: ['Intellect (बुद्धि/तर्क)', 'Trade/Commerce (व्यापार/वाणिज्य)', 'Analytics/Writing (विश्लेषण/लेखन)', 'Communication (संचार)'],
    geminiDiagnosticManifestation: 'बुध पृथ्वी तत्त्व व त्रिदोष के अधिपति हैं; पाप प्रभाव में त्वचा एलर्जी, नसों में खिंचाव, फेफड़ों की नलियों में संवेदनशीलता या पाचन विकार लाते हैं।'
  },
  Jupiter: {
    tattva: 'Akash (Ether)',
    tattvaHi: 'आकाश तत्त्व',
    dosha: 'Kapha',
    doshaHi: 'कफ दोष',
    bodyParts: ['Liver (यकृत/लीवर)', 'Gallbladder (पित्ताशय)', 'Fat tissue (मेदा/वसा)', 'Ears (कर्ण/श्रवण)', 'Pancreas'],
    healthSensitivities: ['Liver sluggishness (लीवर की कार्यक्षमता में कमी)', 'Lipid/Cholesterol imbalance (वसा वृद्धि)', 'Sugar imbalance (मधुमेह)', 'Ear infections'],
    naturalKarakatva: ['Wisdom/Knowledge (ज्ञान/सद्बुद्धि)', 'Children (संतान)', 'Wealth/Prosperity (धन/समृद्धि)', 'Dharma/Advising (धर्म/परामर्श)'],
    geminiDiagnosticManifestation: 'गुरु आकाश तत्त्व और मेद (कफ) के कारक हैं; रोग भाव में होने पर लीवर की शिथिलता, पाचन में वसा का धीमा चयापचय अथवा कोलेस्ट्रॉल/शर्करा की संवेदनशीलता उत्पन्न करते हैं।'
  },
  Venus: {
    tattva: 'Jal (Water)',
    tattvaHi: 'जल तत्त्व',
    dosha: 'Vata-Kapha',
    doshaHi: 'कफ व वात दोष',
    bodyParts: ['Reproductive System (प्रजनन तंत्र)', 'Kidneys/Urinary tract (वृक्क/मूत्र प्रणाली)', 'Hormones (हार्मोनल संतुलन)', 'Throat/Face (चेहरा व गला)'],
    healthSensitivities: ['Hormonal imbalance (हार्मोन विकार)', 'Urinary/Kidney sensitivity (मूत्र नलिका संक्रमण)', 'Diabetes (प्रमेह)', 'Skin moisture loss'],
    naturalKarakatva: ['Marriage/Partnership (विवाह/जीवनसाथी)', 'Luxury/Vehicles (वैभव/वाहन)', 'Arts/Creativity (कला/सौंदर्य)', 'Finance (भौतिक समृद्धि)'],
    geminiDiagnosticManifestation: 'शुक्र जल तत्त्व के ग्रह हैं; रोग भावों से युक्त होने पर हार्मोनल असंतुलन, गुर्दे या मूत्र संस्थान में संवेदनशीलता तथा शर्करा विकार देते हैं।'
  },
  Saturn: {
    tattva: 'Vayu (Air)',
    tattvaHi: 'वायु तत्त्व',
    dosha: 'Vata',
    doshaHi: 'तीव्र वात दोष',
    bodyParts: ['Joints/Knees (जोड़/घुटने)', 'Bones/Teeth (हड्डियां व दांत)', 'Sciatic/Nerves (वात नाड़ियां)', 'Legs/Feet (टांगें व पैर)'],
    healthSensitivities: ['Arthritis/Joint pains (संधिवात/जोड़ों का दर्द)', 'Chronic stiffness (पुराने असाध्य रोग)', 'Gas/Constipation (वायु विकार/कब्ज)', 'Depression/Lethargy (अवसाद व थकान)'],
    naturalKarakatva: ['Discipline/Karma (कर्म/अनुशासन)', 'Longevity (आयु)', 'Service/Hard work (श्रम/सेवा)', 'Patience/Delay (धैर्य व विलंब)'],
    geminiDiagnosticManifestation: 'शनि देव वायु तत्त्व और तीव्र वात दोष के अधिपति हैं; इनकी दृष्टि या दशा में पुराने वात रोग, जोड़ों में दर्द, हड्डियों में कड़ापन और काम में विलंब/रुकावटें आती हैं।'
  },
  Rahu: {
    tattva: 'Vayu (Air)',
    tattvaHi: 'वायु एवं छाया तत्त्व',
    dosha: 'Tridosha',
    doshaHi: 'वात-पित्त त्रिदोष',
    bodyParts: ['Immunity/CNS (केंद्रीय तंत्रिका तंत्र)', 'Respiratory tract (श्वसन नली)', 'Intestines (आंतें)', 'Undiagnosed areas'],
    healthSensitivities: ['Sudden allergies (अचानक एलर्जी/अस्थमा)', 'Undiagnosed viral issues (गूढ़ संक्रमण)', 'Phobias/Panic (अकारण भय/अनिद्रा)', 'Toxin reactions (खाद्य विषाक्तता)'],
    naturalKarakatva: ['Sudden transformation (आकस्मिक परिवर्तन)', 'Technology/AI (नवीन तकनीक/अनुसंधान)', 'Foreign connections (विदेशी संबंध)', 'Illusion/Ambition (महत्वाकांक्षा)'],
    geminiDiagnosticManifestation: 'राहु छाया ग्रह हैं और आकस्मिकता लाते हैं; जल राशि या चन्द्रमा के नक्षत्र में होने पर फेफड़ों, साइनोसाइटिस, श्वास संवेदनशीलता और रहस्यमय एलर्जी पैदा करते हैं।'
  },
  Ketu: {
    tattva: 'Agni (Fire)',
    tattvaHi: 'अग्नि एवं छाया तत्त्व',
    dosha: 'Pitta',
    doshaHi: 'पित्त दोष',
    bodyParts: ['Skin/Nerves (सूक्ष्म नाड़ियां)', 'Spine (सुषुम्ना नाड़ी)', 'Anus/Excretory (गुदा व मलाशय)', 'Wounds (सूक्ष्म घाव)'],
    healthSensitivities: ['Sudden cuts/surgeries (शल्यक्रिया/घाव)', 'Viral outbreaks (विषाणु जनित बुखार)', 'Unknown aches (अकथनीय दर्द)', 'Sensory numbness (अंग शून्यता)'],
    naturalKarakatva: ['Moksha/Spirituality (मोक्ष/अध्यात्म)', 'Occult/Detachment (वैराग्य/गूढ़ विद्या)', 'Root cause research (गहन शोध)', 'Mathematics/Coding (तर्क व कूटनीति)'],
    geminiDiagnosticManifestation: 'केतु सूक्ष्म अग्नि व पीड़ा के कारक हैं; यह सूक्ष्म नस-नाड़ियों में अवरोध, अचानक शल्यक्रिया या किसी छिपे हुए रोग की पहचान में भ्रम पैदा करते हैं।'
  }
};

/**
 * 12 Ascendant Functional Status Table (पाराशरी कारक, मारक, बाधक व्यवस्था)
 */
export interface AscendantFunctionalNature {
  ascendantName: string;
  lagnaSignId: number;
  yogakaraka: string[];
  functionalBenefics: string[];
  functionalMalefics: string[];
  marakas: string[];
  badhakaHouse: number;
  badhakeshPlanet: string;
  modality: 'Movable' | 'Fixed' | 'Dual';
}

export const ASCENDANT_FUNCTIONAL_MAP: Record<number, AscendantFunctionalNature> = {
  1: { // Aries (मेष)
    ascendantName: 'Aries (मेष)',
    lagnaSignId: 1,
    yogakaraka: ['Sun (सूर्य)', 'Jupiter (गुरु)'],
    functionalBenefics: ['Mars (मंगल)', 'Sun (सूर्य)', 'Jupiter (गुरु)'],
    functionalMalefics: ['Mercury (बुध)', 'Venus (शुक्र)', 'Saturn (शनि)'],
    marakas: ['Venus (शुक्र)', 'Mercury (बुध)'],
    badhakaHouse: 11,
    badhakeshPlanet: 'Saturn (शनि)',
    modality: 'Movable'
  },
  2: { // Taurus (वृषभ)
    ascendantName: 'Taurus (वृषभ)',
    lagnaSignId: 2,
    yogakaraka: ['Saturn (शनि)'],
    functionalBenefics: ['Saturn (शनि)', 'Mercury (बुध)', 'Venus (शुक्र)'],
    functionalMalefics: ['Jupiter (गुरु)', 'Moon (चन्द्र)', 'Mars (मंगल)'],
    marakas: ['Mars (मंगल)', 'Jupiter (गुरु)'],
    badhakaHouse: 9,
    badhakeshPlanet: 'Saturn (शनि)',
    modality: 'Fixed'
  },
  3: { // Gemini (मिथुन)
    ascendantName: 'Gemini (मिथुन)',
    lagnaSignId: 3,
    yogakaraka: ['Venus (शुक्र)'],
    functionalBenefics: ['Venus (शुक्र)', 'Mercury (बुध)'],
    functionalMalefics: ['Mars (मंगल)', 'Jupiter (गुरु)', 'Sun (सूर्य)'],
    marakas: ['Jupiter (गुरु)', 'Mars (मंगल)'],
    badhakaHouse: 7,
    badhakeshPlanet: 'Jupiter (गुरु)',
    modality: 'Dual'
  },
  4: { // Cancer (कर्क)
    ascendantName: 'Cancer (कर्क)',
    lagnaSignId: 4,
    yogakaraka: ['Mars (मंगल)'],
    functionalBenefics: ['Mars (मंगल)', 'Moon (चन्द्र)', 'Jupiter (गुरु)'],
    functionalMalefics: ['Mercury (बुध)', 'Venus (शुक्र)', 'Saturn (शनि)'],
    marakas: ['Saturn (शनि)', 'Mercury (बुध)'],
    badhakaHouse: 11,
    badhakeshPlanet: 'Venus (शुक्र)',
    modality: 'Movable'
  },
  5: { // Leo (सिंह)
    ascendantName: 'Leo (सिंह)',
    lagnaSignId: 5,
    yogakaraka: ['Mars (मंगल)'],
    functionalBenefics: ['Sun (सूर्य)', 'Mars (मंगल)', 'Jupiter (गुरु)'],
    functionalMalefics: ['Mercury (बुध)', 'Venus (शुक्र)', 'Saturn (शनि)'],
    marakas: ['Mercury (बुध)', 'Saturn (शनि)'],
    badhakaHouse: 9,
    badhakeshPlanet: 'Mars (मंगल)',
    modality: 'Fixed'
  },
  6: { // Virgo (कन्या)
    ascendantName: 'Virgo (कन्या)',
    lagnaSignId: 6,
    yogakaraka: ['Venus (शुक्र)'],
    functionalBenefics: ['Venus (शुक्र)', 'Mercury (बुध)'],
    functionalMalefics: ['Mars (मंगल)', 'Jupiter (गुरु)', 'Moon (चन्द्र)'],
    marakas: ['Jupiter (गुरु)', 'Mars (मंगल)'],
    badhakaHouse: 7,
    badhakeshPlanet: 'Jupiter (गुरु)',
    modality: 'Dual'
  },
  7: { // Libra (तुला)
    ascendantName: 'Libra (तुला)',
    lagnaSignId: 7,
    yogakaraka: ['Saturn (शनि)'],
    functionalBenefics: ['Saturn (शनि)', 'Mercury (बुध)', 'Venus (शुक्र)'],
    functionalMalefics: ['Jupiter (गुरु)', 'Sun (सूर्य)', 'Mars (मंगल)'],
    marakas: ['Mars (मंगल)', 'Jupiter (गुरु)'],
    badhakaHouse: 11,
    badhakeshPlanet: 'Sun (सूर्य)',
    modality: 'Movable'
  },
  8: { // Scorpio (वृश्चिक)
    ascendantName: 'Scorpio (वृश्चिक)',
    lagnaSignId: 8,
    yogakaraka: ['Jupiter (गुरु)', 'Moon (चन्द्र)'],
    functionalBenefics: ['Mars (मंगल)', 'Jupiter (गुरु)', 'Moon (चन्द्र)'],
    functionalMalefics: ['Mercury (बुध)', 'Venus (शुक्र)'],
    marakas: ['Venus (शुक्र)', 'Mercury (बुध)'],
    badhakaHouse: 9,
    badhakeshPlanet: 'Moon (चन्द्र)',
    modality: 'Fixed'
  },
  9: { // Sagittarius (धनु)
    ascendantName: 'Sagittarius (धनु)',
    lagnaSignId: 9,
    yogakaraka: ['Mars (मंगल)', 'Sun (सूर्य)'],
    functionalBenefics: ['Jupiter (गुरु)', 'Sun (सूर्य)', 'Mars (मंगल)'],
    functionalMalefics: ['Venus (शुक्र)', 'Mercury (बुध)'],
    marakas: ['Venus (शुक्र)', 'Mercury (बुध)'],
    badhakaHouse: 7,
    badhakeshPlanet: 'Mercury (बुध)',
    modality: 'Dual'
  },
  10: { // Capricorn (मकर)
    ascendantName: 'Capricorn (मकर)',
    lagnaSignId: 10,
    yogakaraka: ['Venus (शुक्र)'],
    functionalBenefics: ['Venus (शुक्र)', 'Mercury (बुध)', 'Saturn (शनि)'],
    functionalMalefics: ['Mars (मंगल)', 'Jupiter (गुरु)', 'Moon (चन्द्र)'],
    marakas: ['Mars (मंगल)', 'Jupiter (गुरु)'],
    badhakaHouse: 11,
    badhakeshPlanet: 'Mars (मंगल)',
    modality: 'Movable'
  },
  11: { // Aquarius (कुंभ)
    ascendantName: 'Aquarius (कुंभ)',
    lagnaSignId: 11,
    yogakaraka: ['Venus (शुक्र)'],
    functionalBenefics: ['Venus (शुक्र)', 'Saturn (शनि)'],
    functionalMalefics: ['Jupiter (गुरु)', 'Moon (चन्द्र)', 'Mars (मंगल)'],
    marakas: ['Jupiter (गुरु)', 'Mars (मंगल)'],
    badhakaHouse: 9,
    badhakeshPlanet: 'Venus (शुक्र)',
    modality: 'Fixed'
  },
  12: { // Pisces (मीन)
    ascendantName: 'Pisces (मीन)',
    lagnaSignId: 12,
    yogakaraka: ['Mars (मंगल)', 'Moon (चन्द्र)'],
    functionalBenefics: ['Jupiter (गुरु)', 'Moon (चन्द्र)', 'Mars (मंगल)'],
    functionalMalefics: ['Saturn (शनि)', 'Sun (सूर्य)', 'Venus (शुक्र)', 'Mercury (बुध)'],
    marakas: ['Mercury (बुध)', 'Venus (शुक्र)'],
    badhakaHouse: 7,
    badhakeshPlanet: 'Mercury (बुध)',
    modality: 'Dual'
  }
};

/**
 * 12-House KP Event vs. Negation Matrix
 */
export interface HouseGroupRule {
  domain: string;
  domainHi: string;
  primaryHouse: number;
  supportiveHouses: number[];
  negatingHouses: number[];
  cslEvaluationFormula: string;
}

export const KP_HOUSE_GROUPINGS: Record<string, HouseGroupRule> = {
  health: {
    domain: 'Health & Disease',
    domainHi: 'स्वास्थ्य, रोग व शारीरिक ऊर्जा',
    primaryHouse: 6,
    supportiveHouses: [1, 5, 11], // 1=Vitality, 5=Immunity/Recovery, 11=Cure/Overcoming disease
    negatingHouses: [6, 8, 12],   // 6=Disease, 8=Chronic/Surgery/Pain, 12=Hospitalization
    cslEvaluationFormula: '6th CSL indicates disease susceptibility. If 6th CSL star lord signifies 6, 8, or 12, disease occurs; if 1, 5, 11, fast recovery and sound health.'
  },
  career: {
    domain: 'Career & Profession',
    domainHi: 'आजीविका, पदोन्नति व कार्यक्षेत्र',
    primaryHouse: 10,
    supportiveHouses: [2, 6, 10, 11], // 2=Wealth, 6=Job/Service, 10=Status, 11=Gains/Promotion
    negatingHouses: [5, 8, 12],       // 5=Resignation/Loss of post, 8=Harassment/Obstacles, 12=Change/Transfer/Exit
    cslEvaluationFormula: '10th CSL star lord signifying 2, 6, 10, 11 promises career growth. Connection to 5, 8, 12 causes sudden breaks, transfer, or dissatisfaction.'
  },
  marriage: {
    domain: 'Marriage & Relationship',
    domainHi: 'विवाह, वैवाहिक जीवन व साझेदारी',
    primaryHouse: 7,
    supportiveHouses: [2, 7, 11], // 2=Family addition, 7=Spouse/Union, 11=Fulfilment
    negatingHouses: [1, 6, 10],   // 1=Separation/Self, 6=Dispute/Litigation, 10=Separation from 11th
    cslEvaluationFormula: '7th CSL star lord must signify 2, 7, or 11 for marriage. If it exclusively signifies 1, 6, 10 without 2, 7, 11, denial or discord is indicated.'
  },
  wealth: {
    domain: 'Wealth & Finance',
    domainHi: 'धन, आर्थिक संचय व लाभ',
    primaryHouse: 2,
    supportiveHouses: [2, 6, 11], // 2=Bank balance, 6=Income through effort/recovery, 11=Gains
    negatingHouses: [5, 8, 12],   // 5=Speculative loss, 8=Blocked money, 12=Expenditure/Loss
    cslEvaluationFormula: '2nd CSL star lord connected to 2, 6, 11 indicates prosperity and savings. 8, 12 connection indicates sudden financial drain or blocked funds.'
  },
  education: {
    domain: 'Education & Intellect',
    domainHi: 'शिक्षा, विद्या व एकाग्रता',
    primaryHouse: 4,
    supportiveHouses: [4, 9, 11], // 4=Basic education, 9=Higher studies, 11=Success
    negatingHouses: [3, 8],       // 3=Break in study (12th to 4th), 8=Obstacles/Disappointment
    cslEvaluationFormula: '4th and 9th CSL star lords signifying 4, 9, 11 promise academic distinction; 3 and 8 cause distraction and academic gaps.'
  },
  property: {
    domain: 'Property & Vehicle',
    domainHi: 'भूमि, भवन, मकान व वाहन',
    primaryHouse: 4,
    supportiveHouses: [4, 11, 12], // 4=Asset, 11=Fulfillment, 12=Investment/Purchase
    negatingHouses: [3, 8],        // 3=Sale/Relinquishing, 8=Disputed property
    cslEvaluationFormula: '4th CSL star lord signifying 4, 11, 12 indicates successful purchase and construction of property.'
  },
  foreign: {
    domain: 'Foreign Travel & Settlement',
    domainHi: 'विदेश यात्रा, प्रवास व विदेश वास',
    primaryHouse: 12,
    supportiveHouses: [3, 9, 12],  // 3=Leaving homeland, 9=Long journey, 12=Foreign soil
    negatingHouses: [2, 4, 11],    // 2=Family at home, 4=Homeland residence, 11=Local prosperity
    cslEvaluationFormula: '12th CSL star lord connected with 3, 9, 12 promises foreign travel and long-term settlement.'
  },
  litigation: {
    domain: 'Litigation, Disputes & Enemies',
    domainHi: 'शत्रु, विवाद, मुक़दमा व ऋण',
    primaryHouse: 6,
    supportiveHouses: [6, 10, 11], // 6=Litigation, 10=Honor, 11=Victory/Settlement
    negatingHouses: [5, 8, 12],    // 5=Compromise/Relief, 8=Disgrace, 12=Defeat/Financial penalty
    cslEvaluationFormula: '6th CSL signifying 11th house guarantees victory over opponents; signifying 8, 12 causes distress or defeat.'
  }
};

/**
 * 9 Navtara Chakra Calculation from Natal Moon Star
 */
export const NAVTARA_NAMES = [
  { name: 'Janma', hindi: 'जन्म तारा', nature: 'Body / Initial Struggle (शरीर व संघर्ष)' },
  { name: 'Sampat', hindi: 'सम्पत् तारा', nature: 'Wealth & Prosperity (धन व समृद्धि)' },
  { name: 'Vipat', hindi: 'विपत् तारा', nature: 'Obstacles & Misfortune (विघ्न व संकट)' },
  { name: 'Kshema', hindi: 'क्षेम तारा', nature: 'Wellbeing & Protection (कल्याण व सुरक्षा)' },
  { name: 'Pratyari', hindi: 'प्रत्यरि तारा', nature: 'Enmity & Opposition (शत्रुता व बाधा)' },
  { name: 'Sadhaka', hindi: 'साधक तारा', nature: 'Success & Achievement (सिद्धि व सफलता)' },
  { name: 'Vadha', hindi: 'वध तारा', nature: 'Severe Affliction (अति कष्ट व हानि)' },
  { name: 'Mitra', hindi: 'मित्र तारा', nature: 'Friendship & Support (मित्रता व सहयोग)' },
  { name: 'Ati-Mitra', hindi: 'अति-मित्र तारा', nature: 'Great Fortune & Victory (परम मित्र व लाभ)' },
];

export function calculateNavtara(natalMoonNakIndex: number, targetNakIndex: number): {
  taraIndex: number;
  taraName: string;
  taraHindi: string;
  taraNature: string;
  isFavorable: boolean;
} {
  const diff = ((targetNakIndex - natalMoonNakIndex) % 27 + 27) % 27;
  const taraNum = (diff % 9); // 0 to 8
  const info = NAVTARA_NAMES[taraNum];
  // Favorable: Sampat (1), Kshema (3), Sadhaka (5), Mitra (7), Ati-Mitra (8)
  const isFavorable = [1, 3, 5, 7, 8].includes(taraNum);

  return {
    taraIndex: taraNum + 1,
    taraName: info.name,
    taraHindi: info.hindi,
    taraNature: info.nature,
    isFavorable
  };
}
