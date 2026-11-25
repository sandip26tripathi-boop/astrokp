import { KPMatrix } from '@/types/astrology';

export interface ClassifiedTopic {
  topic: string;
  topicHi: string;
  primaryCusps: number[];
  positiveHouses: number[];
  negatingHouses: number[];
  descriptionHi: string;
}

export function classifyQuestionTopic(query: string, previousContext?: string): ClassifiedTopic {
  const combined = `${previousContext || ''} ${query}`.toLowerCase();

  // Father's query context (पिता / father / dad / papa)
  if (/पिता|father|dad|papa|बाबूजी/i.test(combined)) {
    if (/स्वास्थ्य|health|रोग|बीमारी|medical|doctor|तबीयत/i.test(query)) {
      return {
        topic: "Father's Health",
        topicHi: 'पिता का स्वास्थ्य एवं आरोग्यता',
        primaryCusps: [9, 2], // 9th is father, 6th from 9th is 2nd house
        positiveHouses: [9, 1, 6], // 1st from 9th, 5th from 9th (1st), 11th from 9th (7th)
        negatingHouses: [2, 4, 8],
        descriptionHi: 'पिता के स्वास्थ्य हेतु ९वें भाव (पिता) से ६ठे भाव (२रा भाव - रोग) एवं रोग मुक्ति भावों का परीक्षण।',
      };
    }
    return {
      topic: "Father's Business / Career",
      topicHi: 'पिता का व्यवसाय, नौकरी एवं स्थिति',
      primaryCusps: [9, 6, 10], // 10th from 9th is 6th house
      positiveHouses: [6, 10, 11, 2], // 10th from 9th (6th), 2nd from 9th (10th), 11th
      negatingHouses: [8, 5, 12],
      descriptionHi: 'पिता के कार्यक्षेत्र हेतु ९वें भाव (पिता) से १०वें भाव (६ठा भाव) और धन भाव (१०वां भाव) का परीक्षण।',
    };
  }

  // Career / Profession / Job / Service
  if (/\b(career|profession|job|jobs|service|employment|interview|boss|office|work|workplace|occupation)\b|करियर|पेशा|नौकरी|आजीविका|रोजगार|कामकाज|काम|सेवा|दफ्तर/i.test(combined)) {
    return {
      topic: 'Career & Profession',
      topicHi: 'करियर, आजीविका एवं कार्यक्षेत्र',
      primaryCusps: [10, 6],
      positiveHouses: [2, 6, 10, 11],
      negatingHouses: [5, 8, 12],
      descriptionHi: 'आजीविका, पद-प्रतिष्ठा और कार्यक्षेत्र उन्नति हेतु १०वें व ६ठे भाव के कस्पल सब-लॉर्ड का विश्लेषण।',
    };
  }

  // Promotion
  if (/promotion|पदोन्नति|प्रमोशन|तरक्की|इंक्रीमेंट|increment|elevation/i.test(combined)) {
    return {
      topic: 'Promotion',
      topicHi: 'पदोन्नति एवं पद-वृद्धि',
      primaryCusps: [10, 11],
      positiveHouses: [2, 6, 10, 11],
      negatingHouses: [5, 8, 12],
      descriptionHi: 'पद-प्रतिष्ठा और वेतन वृद्धि हेतु १०वें एवं ११वें भाव के कस्पल सब-लॉर्ड का विश्लेषण।',
    };
  }

  // Job / Service
  if (/नौकरी|job|service|employment|interview|बॉस|boss|office/i.test(combined)) {
    return {
      topic: 'Job / Service',
      topicHi: 'नौकरी एवं सेवा क्षेत्र',
      primaryCusps: [6, 10],
      positiveHouses: [2, 6, 10, 11],
      negatingHouses: [5, 8, 12],
      descriptionHi: 'आजीविका और सेवा प्राप्ति हेतु ६ठे व १०वें भाव के कस्पल सब-लॉर्ड का विश्लेषण।',
    };
  }

  // Business
  if (/व्यापार|business|दुकान|कंपनी|फर्म|startup|स्टार्टअप|partnership|साझेदारी|दुकानदारी/i.test(combined)) {
    return {
      topic: 'Business',
      topicHi: 'स्वतंत्र व्यापार एवं व्यवसाय',
      primaryCusps: [7, 10],
      positiveHouses: [2, 7, 10, 11],
      negatingHouses: [5, 6, 8, 12],
      descriptionHi: 'ग्राहकों व व्यावसायिक विस्तार हेतु ७वें एवं १०वें भाव के कस्पल सब-लॉर्ड का विश्लेषण।',
    };
  }

  // Education / Competitive Exams
  if (/शिक्षा|study|education|jee|neet|iit|upsc|exam|परीक्षा|12\s*(th|वीं|vi|वी|class|कक्षा)|कॉलेज|college|admission|डिग्री/i.test(combined)) {
    return {
      topic: 'Education & Competitive Exams',
      topicHi: 'शिक्षा, प्रतियोगी परीक्षा एवं उच्च अध्ययन',
      primaryCusps: [4, 9, 11],
      positiveHouses: [4, 6, 9, 11],
      negatingHouses: [3, 5, 8, 12],
      descriptionHi: 'ज्ञान, एकाग्रता व प्रतियोगिता विजय हेतु ४थे, ९वें व ११वें भाव के कस्पल सब-लॉर्ड का विश्लेषण।',
    };
  }

  // Marriage / Relationship
  if (/विवाह|शादी|marriage|wife|husband|पत्नी|पति|जीवनसाथी|रिश्ता|spouse|partner|relationship|सगाई/i.test(combined)) {
    return {
      topic: 'Marriage',
      topicHi: 'विवाह एवं दांपत्य जीवन',
      primaryCusps: [7],
      positiveHouses: [2, 7, 11],
      negatingHouses: [1, 6, 10, 12],
      descriptionHi: 'दांपत्य सुख और परिणय सूत्र हेतु ७वें भाव के कस्पल सब-लॉर्ड का विश्लेषण।',
    };
  }

  // Childbirth / Progeny
  if (/संतान|बच्चा|baby|child|pregnancy|गर्भ|कंसीव|progeny/i.test(combined)) {
    return {
      topic: 'Childbirth',
      topicHi: 'संतान प्राप्ति एवं सुख',
      primaryCusps: [5],
      positiveHouses: [2, 5, 11],
      negatingHouses: [1, 4, 10],
      descriptionHi: 'वंश वृद्धि और संतान सुख हेतु ५वें भाव के कस्पल सब-लॉर्ड का विश्लेषण।',
    };
  }

  // Property / Vehicle (Strict word boundaries to never match "career")
  if (/संपत्ति|मकान|घर|गाड़ी|वाहन|ज़मीन|जमीन|भूमि|\b(property|properties|flat|flats|plot|plots|vehicle|vehicles|car|cars|automobile|real\s*estate)\b/i.test(combined)) {
    return {
      topic: 'Property & Vehicle',
      topicHi: 'भूमि, भवन एवं वाहन सुख',
      primaryCusps: [4],
      positiveHouses: [4, 11, 12],
      negatingHouses: [3, 5, 8],
      descriptionHi: 'अचल संपत्ति व वाहन क्रय हेतु ४थे भाव के कस्पल सब-लॉर्ड का विश्लेषण।',
    };
  }

  // Foreign Travel / Settlement
  if (/विदेश|travel|foreign|visa|\bpr\b|settlement|पासपोर्ट|विदेशी/i.test(combined)) {
    return {
      topic: 'Foreign Travel & Settlement',
      topicHi: 'विदेश यात्रा एवं निवास',
      primaryCusps: [12, 9],
      positiveHouses: [3, 9, 12],
      negatingHouses: [2, 4, 11],
      descriptionHi: 'स्थान परिवर्तन व विदेश गमन हेतु ९वें व १२वें भाव के कस्पल सब-लॉर्ड का विश्लेषण।',
    };
  }

  // Health / Disease
  if (/स्वास्थ्य|health|रोग|बीमारी|medical|doctor|तबीयत|बीमार|दवा|pain|दर्द|इलाज/i.test(combined)) {
    return {
      topic: 'Health & Disease Recovery',
      topicHi: 'स्वास्थ्य एवं रोग मुक्ति',
      primaryCusps: [6, 1],
      positiveHouses: [1, 5, 11], // Recovery
      negatingHouses: [6, 8, 12], // Disease & Hospitalization
      descriptionHi: 'रोग प्रतिरोधक क्षमता व आरोग्यता हेतु ६ठे व १ले भाव के कस्पल सब-लॉर्ड का विश्लेषण।',
    };
  }

  // Litigation / Dispute
  if (/मुकदमा|court|legal|case|विवाद|शत्रु|police|मुक़दमा|कचहरी/i.test(combined)) {
    return {
      topic: 'Litigation & Disputes',
      topicHi: 'मुकदमा विजय एवं विवाद निवारण',
      primaryCusps: [6],
      positiveHouses: [6, 10, 11],
      negatingHouses: [5, 8, 12],
      descriptionHi: 'विवाद निस्तारण व विजय हेतु ६ठे भाव के कस्पल सब-लॉर्ड का विश्लेषण।',
    };
  }

  // Wealth / Finance
  if (/धन|पैसा|wealth|money|finance|loan|कर्ज|income|कमाई|रुपया/i.test(combined)) {
    return {
      topic: 'Wealth & Finance',
      topicHi: 'धन, संपत्ति एवं आर्थिक स्थिति',
      primaryCusps: [2, 11],
      positiveHouses: [2, 6, 11],
      negatingHouses: [5, 8, 12],
      descriptionHi: 'धन संचय व लाभ हेतु २रे व ११वें भाव के कस्पल सब-लॉर्ड का विश्लेषण।',
    };
  }

  // Default General Career / Life
  return {
    topic: 'Career & Life Objective',
    topicHi: 'करियर, आजीविका एवं कार्य-सिद्धि',
    primaryCusps: [10],
    positiveHouses: [2, 6, 10, 11],
    negatingHouses: [5, 8, 12],
    descriptionHi: 'कार्य सिद्धि व जीवन दिशा हेतु मुख्य भाव एवं दशा-गोचर का विश्लेषण।',
  };
}

export function extractCleanKPJson(kpMatrix: KPMatrix) {
  if (!kpMatrix) return null;

  const cusps = kpMatrix.cusps || [];
  const planets = kpMatrix.planets || [];
  const significators = kpMatrix.houseSignificators || [];
  const currentDasha = kpMatrix.currentDasha;
  const rulingPlanets = kpMatrix.rulingPlanets;
  const horary = kpMatrix.horaryData;

  return {
    clientInfo: {
      name: kpMatrix.input?.name || 'जातक',
      gender: kpMatrix.input?.gender || 'male',
      dob: kpMatrix.input?.dateOfBirth,
      tob: kpMatrix.input?.timeOfBirth,
      place: kpMatrix.input?.placeName,
      ayanamsa: kpMatrix.formattedAyanamsa || kpMatrix.input?.ayanamsa,
      horarySeed: horary?.seed || null,
    },
    cusps12: cusps.map((c) => ({
      houseNumber: c.houseNumber,
      signName: c.signName,
      longitudeDMS: c.formattedSignDMS || c.formattedDMS,
      signLord: c.signLord,
      starLord: c.starLord,
      starLordIsRetrograde: Boolean(c.starLordIsRetrograde),
      subLord: c.subLord,
      subSubLord: c.subSubLord,
      occupants: c.occupants || [],
    })),
    planets: planets.map((p) => ({
      name: p.name,
      signName: p.signName,
      houseOccupied: p.houseOccupied,
      longitudeDMS: p.formattedSignDMS || p.formattedDMS,
      signLord: p.signLord,
      starLord: p.starLord,
      starLordIsRetrograde: Boolean(p.starLordIsRetrograde),
      subLord: p.subLord,
      subSubLord: p.subSubLord,
      isRetrograde: Boolean(p.isRetrograde && p.name !== 'Rahu' && p.name !== 'Ketu'),
    })),
    significators4Fold: significators.map((s) => ({
      houseNumber: s.houseNumber,
      levelA_StarOfOccupants: s.level1 || [],
      levelB_Occupants: s.level2 || [],
      levelC_StarOfLord: s.level3 || [],
      levelD_SignLord: s.level4 || [],
    })),
    currentRunningDBA: {
      mahadasha: {
        planet:
          (typeof currentDasha?.mahadasha === 'string'
            ? currentDasha.mahadasha
            : currentDasha?.mahadasha?.planet) || 'N/A',
        endDate: (currentDasha?.mahadasha as any)?.endDate || null,
      },
      antardasha_Bhukti: {
        planet:
          (typeof currentDasha?.antardasha === 'string'
            ? currentDasha.antardasha
            : currentDasha?.antardasha?.planet) || 'N/A',
        endDate: (currentDasha?.antardasha as any)?.endDate || null,
      },
      pratyantardasha_Antara: {
        planet:
          (typeof currentDasha?.pratyantardasha === 'string'
            ? currentDasha.pratyantardasha
            : currentDasha?.pratyantardasha?.planet) || 'N/A',
        endDate: (currentDasha?.pratyantardasha as any)?.endDate || null,
      },
    },
    rulingPlanets: {
      dayLord: rulingPlanets?.dayLord || 'N/A',
      moonSignLord: rulingPlanets?.moonSignLord || 'N/A',
      moonStarLord: rulingPlanets?.moonStarLord || 'N/A',
      lagnaSignLord: rulingPlanets?.lagnaSignLord || 'N/A',
      lagnaStarLord: rulingPlanets?.lagnaStarLord || 'N/A',
      lagnaSubLord: rulingPlanets?.lagnaSubLord || 'N/A',
    },
  };
}

/**
 * Validates whether user query is in the domain of Vedic Astrology, Kundli,
 * Horoscopes, Planetary Dashas, Gochar or genuine personal life guidance.
 * Protects against generic AI chatbot deflection (coding, recipes, politics, math, etc.)
 */
export function isAstrologicalQuery(query: string): boolean {
  const q = (query || '').trim().toLowerCase();
  if (!q || q.length < 2) return true;

  // Obvious non-astrology / bot-like requests
  const nonAstroPatterns = [
    /\b(write|create|solve|run|generate|execute)\s+(a\s+)?(python|javascript|typescript|java|c\+\+|sql|code|script|program|app|html|css|function|algorithm|class)\b/i,
    /\b(recipe|how to cook|how to bake|ingredients of|bake a cake|cook|cooking|pizza recipe|pasta recipe)\b/i,
    /\b(who is the (prime minister|president|ceo|king|queen|governor))\b/i,
    /\b(capital of|population of|distance between|currency of|translate this into (french|german|spanish|russian))\b/i,
    /\b(tell me a joke|write a poem about|write an essay|solve this math|what is \d+[\+\-\*\/]\d+)\b/i,
    /\b(what is (photosynthesis|quantum computing|mitochondria|newton's law|gravity|relativity))\b/i,
    /\b(who made you|are you gemini|who is sundar pichai|what model are you|ignore previous instructions)\b/i,
  ];

  for (const pattern of nonAstroPatterns) {
    if (pattern.test(q)) {
      // If it contains explicit astrological words, allow it
      const hasAstroTerms = /\b(kundli|kundali|astrolog|jyotish|planet|graha|rashi|nakshatra|dasha|dasa|gochar|transit|career|job|marriage|health|wealth|remedy|upay|future|bhava|house|horoscope|shani|guru|mangal|rahu|ketu|surya|chandra|budh|shukra)\b/i.test(q);
      if (!hasAstroTerms) {
        return false;
      }
    }
  }

  return true;
}

