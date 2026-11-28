/**
 * lib/astrology/bhavatBhavam.ts
 * Master Bhavat Bhavam (Derived Houses / भावात भावम) Engine for VedicWisdom
 *
 * Maps questions about family members & relatives to their primary Base House (Lagna = X)
 * and rotates the chart to determine the exact derived house for any life aspect
 * (career, health, education, wealth, property, longevity, etc.).
 */

export interface RelativeProfile {
  id: string;
  nameEn: string;
  nameHi: string;
  baseHouse: number;
  descriptionEn: string;
  descriptionHi: string;
  regex: RegExp;
}

export const RELATIVE_PROFILES: RelativeProfile[] = [
  // 4th Child (must be before child 1 to avoid greedy match)
  {
    id: 'child_4',
    nameEn: '4th Child',
    nameHi: 'चौथी संतान',
    baseHouse: 11,
    descriptionEn: '4th Child (3rd from 9th house = 11th House)',
    descriptionHi: 'चौथी संतान (९वें से ३रा भाव = ११वाँ भाव)',
    regex: /\b(4th child|fourth child|4th son|4th daughter)\b|चौथी\s*संतान|चौथा\s*बेटा|चौथी\s*बेटी|चौथा\s*बच्चा/i,
  },
  // 3rd Child
  {
    id: 'child_3',
    nameEn: '3rd Child',
    nameHi: 'तीसरी संतान',
    baseHouse: 9,
    descriptionEn: '3rd Child (3rd from 7th house = 9th House)',
    descriptionHi: 'तीसरी संतान (७वें से ३रा भाव = ९वाँ भाव)',
    regex: /\b(3rd child|third child|3rd son|3rd daughter)\b|तीसरी\s*संतान|तीसरा\s*बेटा|तीसरी\s*बेटी|तीसरा\s*बच्चा/i,
  },
  // 2nd Child
  {
    id: 'child_2',
    nameEn: '2nd Child',
    nameHi: 'दूसरी संतान',
    baseHouse: 7,
    descriptionEn: '2nd Child (3rd from 5th house = 7th House)',
    descriptionHi: 'दूसरी संतान (५वें से ३रा भाव = ७वाँ भाव)',
    regex: /\b(2nd child|second child|2nd son|2nd daughter|younger child)\b|दूसरी\s*संतान|दूसरा\s*बेटा|दूसरी\s*बेटी|दूसरा\s*बच्चा/i,
  },
  // Paternal Grandfather (दादा - 9th from 9th = 5th)
  {
    id: 'paternal_grandfather',
    nameEn: 'Paternal Grandfather',
    nameHi: 'दादाजी',
    baseHouse: 5,
    descriptionEn: "Father's Father / Paternal Grandfather (9th from 9th = 5th House)",
    descriptionHi: 'दादाजी (९वें से ९वाँ भाव = ५वाँ भाव)',
    regex: /\b(grandfather|paternal grandfather|father'?s father|dada|dadaji)\b|दादा|दादाजी/i,
  },
  // Paternal Grandmother (दादी - 4th from 9th = 12th)
  {
    id: 'paternal_grandmother',
    nameEn: 'Paternal Grandmother',
    nameHi: 'दादीजी',
    baseHouse: 12,
    descriptionEn: "Father's Mother / Paternal Grandmother (4th from 9th = 12th House)",
    descriptionHi: 'दादीजी (९वें से ४था भाव = १२वाँ भाव)',
    regex: /\b(grandmother|paternal grandmother|father'?s mother|dadi|dadiji)\b|दादी|दादीजी/i,
  },
  // Maternal Grandfather (नाना - 9th from 4th = 12th)
  {
    id: 'maternal_grandfather',
    nameEn: 'Maternal Grandfather',
    nameHi: 'नानाजी',
    baseHouse: 12,
    descriptionEn: "Mother's Father / Maternal Grandfather (9th from 4th = 12th House)",
    descriptionHi: 'नानाजी (४थे से ९वाँ भाव = १२वाँ भाव)',
    regex: /\b(maternal grandfather|mother'?s father|nana|nanaji)\b|नाना|नानाजी/i,
  },
  // Maternal Grandmother (नानी - 4th from 4th = 7th)
  {
    id: 'maternal_grandmother',
    nameEn: 'Maternal Grandmother',
    nameHi: 'नानीजी',
    baseHouse: 7,
    descriptionEn: "Mother's Mother / Maternal Grandmother (4th from 4th = 7th House)",
    descriptionHi: 'नानीजी (४थे से ४था भाव = ७वाँ भाव)',
    regex: /\b(maternal grandmother|mother'?s mother|nani|naniji)\b|नानी|नानीजी/i,
  },
  // Maternal Uncle / Aunt (मामा / मामी - 6th House)
  {
    id: 'maternal_uncle',
    nameEn: 'Maternal Uncle / Aunt',
    nameHi: 'मामा / मामी',
    baseHouse: 6,
    descriptionEn: 'Maternal Uncle / Aunt (6th House)',
    descriptionHi: 'मामा अथवा मामी (६ठा भाव)',
    regex: /\b(maternal uncle|mama|mamaji|mami|mamiji)\b|मामा|मामाजी|मामी|मामीजी/i,
  },
  // Spouse / Partner / Business Partner (पत्नी / पति / साझेदार - 7th House)
  {
    id: 'spouse',
    nameEn: 'Spouse / Life Partner / Business Partner',
    nameHi: 'जीवनसाथी (पति/पत्नी) अथवा व्यापारिक साझेदार',
    baseHouse: 7,
    descriptionEn: 'Spouse / Partner / Business Partner (7th House)',
    descriptionHi: 'जीवनसाथी अथवा व्यापारिक साझेदार (७वाँ भाव)',
    regex: /\b(spouse|wife|husband|partner|life partner|business partner|patni|pati|jeevansathi|ardhangini|sajhedar)\b|पत्नी|पति|जीवनसाथी|धर्मपत्नी|श्रीमती|साझेदार|पार्टनर|संगी/i,
  },
  // 1st Child / Progeny (संतान / पहला बच्चा - 5th House)
  {
    id: 'child_1',
    nameEn: '1st Child',
    nameHi: 'पहली संतान (बेटा/बेटी)',
    baseHouse: 5,
    descriptionEn: '1st Child / Progeny (5th House)',
    descriptionHi: 'पहली संतान अथवा संतान भाव (५वाँ भाव)',
    regex: /\b(child|children|son|daughter|kid|baby|santan|beta|beti|putra|putri|1st child|first child)\b|संतान|बच्चा|बच्चे|बेटा|बेटी|पुत्र|पुत्री|पहला\s*बेटा|पहली\s*बेटी|पहली\s*संतान|गर्भ/i,
  },
  // Father (पिता - 9th House)
  {
    id: 'father',
    nameEn: 'Father',
    nameHi: 'पिताजी',
    baseHouse: 9,
    descriptionEn: 'Father (9th House)',
    descriptionHi: 'पिताजी (९वाँ भाव)',
    regex: /\b(father|dad|papa|pitaji|pita)\b|पिता|पिताजी|पापा|पिताश्री/i,
  },
  // Mother (माता - 4th House)
  {
    id: 'mother',
    nameEn: 'Mother',
    nameHi: 'माताजी',
    baseHouse: 4,
    descriptionEn: 'Mother (4th House)',
    descriptionHi: 'माताजी (४था भाव)',
    regex: /\b(mother|mom|mummy|mataji|mata|maa)\b|माता|माताजी|माँ|मम्मी|मातृ/i,
  },
  // Younger Sibling (छोटे भाई-बहन - 3rd House)
  {
    id: 'younger_sibling',
    nameEn: 'Younger Sibling',
    nameHi: 'छोटे भाई-बहन',
    baseHouse: 3,
    descriptionEn: 'Younger Sibling (3rd House)',
    descriptionHi: 'छोटे भाई-बहन (३रा भाव)',
    regex: /\b(younger brother|younger sister|younger sibling|chhota bhai|chhoti bahen)\b|छोटे\s*भाई|छोटी\s*बहन|छोटा\s*भाई|अनुज/i,
  },
  // Elder Sibling / Friend (बड़े भाई-बहन / मित्र - 11th House)
  {
    id: 'elder_sibling',
    nameEn: 'Elder Sibling / Friend',
    nameHi: 'बड़े भाई-बहन अथवा मित्र',
    baseHouse: 11,
    descriptionEn: 'Elder Sibling / Close Friend (11th House)',
    descriptionHi: 'बड़े भाई-बहन अथवा मित्र (११वाँ भाव)',
    regex: /\b(elder brother|elder sister|elder sibling|bada bhai|badi bahen|best friend|friend)\b|बड़े\s*भाई|बड़ी\s*बहन|बड़ा\s*भाई|अग्रज|मित्र|दोस्त/i,
  },
  // Siblings generic (Defaults to 3rd House)
  {
    id: 'sibling_generic',
    nameEn: 'Sibling',
    nameHi: 'भाई-बहन',
    baseHouse: 3,
    descriptionEn: 'Sibling (3rd House)',
    descriptionHi: 'भाई अथवा बहन (३रा भाव)',
    regex: /\b(brother|sister|sibling|siblings|bhai|bahen)\b|भाई|बहन|सहोदर/i,
  },
];

export interface LifeAspectProfile {
  id: string;
  nameEn: string;
  nameHi: string;
  offset: number; // 1 to 12 inclusive
  descriptionEn: string;
  descriptionHi: string;
  regex: RegExp;
}

export const LIFE_ASPECTS: LifeAspectProfile[] = [
  // 10th from X: Career, Job, Profession, Business
  {
    id: 'career',
    nameEn: 'Career, Job & Profession',
    nameHi: 'करियर, नौकरी एवं व्यवसाय',
    offset: 10,
    descriptionEn: 'Career, Profession, Status & Karma (10th from X)',
    descriptionHi: 'करियर, व्यवसाय और पद-प्रतिष्ठा (X से १०वाँ भाव)',
    regex: /\b(career|job|jobs|profession|business|firm|work|promotion|service|occupation|pesha|naukri|vyapar)\b|करियर|नौकरी|पेशा|व्यवसाय|व्यापार|काम|कामकाज|रोजगार|प्रमोशन|तरक्की|आजीविका/i,
  },
  // 6th from X: Health Issues, Diseases, Debts
  {
    id: 'health',
    nameEn: 'Health & Disease',
    nameHi: 'स्वास्थ्य, रोग एवं शारीरिक कष्ट',
    offset: 6,
    descriptionEn: 'Health Issues, Diseases, Debts & Enemies (6th from X)',
    descriptionHi: 'रोग, स्वास्थ्य, बीमारी और शत्रु (X से ६ठा भाव)',
    regex: /\b(health|disease|illness|sick|pain|hospital|doctor|treatment|swasthya|bimari|rog|dard|ilaj)\b|स्वास्थ्य|रोग|बीमारी|तबीयत|दर्द|इलाज|अस्पताल|दवा|कष्ट/i,
  },
  // 5th from X: Education, Intelligence, Speculation
  {
    id: 'education',
    nameEn: 'Education & Intelligence',
    nameHi: 'शिक्षा, विद्या एवं बौद्धिक क्षमता',
    offset: 5,
    descriptionEn: 'Education, Intelligence & Studies (5th from X)',
    descriptionHi: 'शिक्षा, बुद्धि और विद्या (X से ५वाँ भाव)',
    regex: /\b(education|study|studies|school|college|exam|exams|intelligence|degree|padhai|shiksha|pariksha)\b|शिक्षा|पढ़ाई|विद्या|परीक्षा|कॉलेज|स्कूल|दाखिला|बुद्धि/i,
  },
  // 2nd from X: Wealth, Bank Balance & Speech
  {
    id: 'wealth',
    nameEn: 'Wealth & Bank Balance',
    nameHi: 'धन, संपत्ति एवं बैंक बैलेंस',
    offset: 2,
    descriptionEn: 'Wealth, Savings & Speech (2nd from X)',
    descriptionHi: 'धन, बचत और कुटुंब (X से २रा भाव)',
    regex: /\b(wealth|money|finance|financial|income|savings?|bank balance|dhan|paisa|kamai|bachat)\b|धन|पैसा|रुपया|कमाई|बचत|बैंक बैलेंस|आर्थिक/i,
  },
  // 4th from X: Property, Home, Vehicles
  {
    id: 'property',
    nameEn: 'Property, Vehicle & Home',
    nameHi: 'भूमि, भवन, मकान एवं वाहन',
    offset: 4,
    descriptionEn: 'Home, Property, Vehicles & Peace (4th from X)',
    descriptionHi: 'सुख, संपत्ति, मकान और वाहन (X से ४था भाव)',
    regex: /\b(property|house|home|flat|plot|vehicle|car|gadi|makan|ghar|zameen)\b|संपत्ति|मकान|घर|वाहन|गाड़ी|प्लॉट|भूमि/i,
  },
  // 7th from X: Marriage, Life Partner of Relative
  {
    id: 'marriage',
    nameEn: 'Marriage & Relationship',
    nameHi: 'विवाह एवं दांपत्य संबंध',
    offset: 7,
    descriptionEn: 'Spouse & Marriage of Relative (7th from X)',
    descriptionHi: 'विवाह व दांपत्य जीवन (X से ७वाँ भाव)',
    regex: /\b(marriage|wedding|spouse|vivah|shadi|rishta)\b|विवाह|शादी|दांपत्य|रिश्ता|सगाई/i,
  },
  // 9th from X: Luck, Higher Education & Foreign Travel
  {
    id: 'luck',
    nameEn: 'Luck & Higher Studies',
    nameHi: 'भाग्य एवं उच्च शिक्षा',
    offset: 9,
    descriptionEn: 'Luck, Dharma & Higher Education (9th from X)',
    descriptionHi: 'भाग्य, धर्म और उच्च अध्ययन (X से ९वाँ भाव)',
    regex: /\b(luck|fortune|higher study|higher studies|phd|foreign travel|bhagya|kismat)\b|भाग्य|किस्मत|उच्च\s*शिक्षा|विदेश/i,
  },
  // 11th from X: Gains & Fulfillment
  {
    id: 'gains',
    nameEn: 'Gains & Fulfillment',
    nameHi: 'लाभ, आय एवं इच्छापूर्ति',
    offset: 11,
    descriptionEn: 'Gains & Fulfillment of Desires (11th from X)',
    descriptionHi: 'आय, लाभ और इच्छापूर्ति (X से ११वाँ भाव)',
    regex: /\b(gains|fulfillment|profit|labh|ichha|kamana)\b|लाभ|मुनाफा|इच्छापूर्ति|सफलता/i,
  },
  // 8th from X: Longevity & Sudden Events
  {
    id: 'longevity',
    nameEn: 'Longevity & Longevity Crisis',
    nameHi: 'आयु एवं आकस्मिक घटनाएं',
    offset: 8,
    descriptionEn: 'Longevity & Sudden Events (8th from X)',
    descriptionHi: 'आयु और आकस्मिक संकट (X से ८वाँ भाव)',
    regex: /\b(longevity|life span|accident|crisis|ayu|aayu|sankat)\b|आयु|उम्र|संकट|आकस्मिक/i,
  },
  // 1st from X: Personality, General Nature & Appearance (Default)
  {
    id: 'personality',
    nameEn: 'Personality & Nature',
    nameHi: 'व्यक्तित्व, स्वभाव एवं रूप-रंग',
    offset: 1,
    descriptionEn: 'Personality, Nature & Overall Well-Being (1st from X = X itself)',
    descriptionHi: 'व्यक्तित्व और स्वभाव (X स्वयं)',
    regex: /\b(nature|personality|behavior|looks|future|general|swabhav|kaisa rahega|bhavishya)\b|स्वभाव|व्यक्तित्व|रूप|भविष्य|कैसा\s*रहेगा|कैसी\s*रहेगी|सामान्य/i,
  },
];

export interface BhavatBhavamResult {
  hasRelativeQuery: boolean;
  relative: RelativeProfile;
  aspect: LifeAspectProfile;
  baseHouseX: number;
  offset: number;
  derivedHouse: number;
  formulaDisplayEn: string;
  formulaDisplayHi: string;
  relativeSupportiveHouses: number[]; // natal house numbers supportive for this relative's aspect
  relativeNegatingHouses: number[];   // natal house numbers negating this relative's aspect
  explanationEn: string;
  explanationHi: string;
}

/**
 * Inclusive formula: Derived House = ((X + Offset - 2) % 12) + 1
 */
export function calculateDerivedHouse(baseHouseX: number, offset: number): number {
  return (((baseHouseX + offset - 2) % 12) + 12) % 12 + 1;
}

/**
 * Detects if the query pertains to a family member or relative,
 * and calculates the exact Bhavat Bhavam derived house.
 */
export function resolveBhavatBhavam(
  userQuery: string,
  previousTurns: Array<{ role: string; content?: string; text?: string }> = []
): BhavatBhavamResult | null {
  const q = (userQuery || '').trim().toLowerCase();

  // Also check previous turn if this is a follow-up query
  let combinedQuery = q;
  if (previousTurns.length > 0) {
    const lastUserTurn = [...previousTurns].reverse().find((t) => t.role === 'user');
    if (lastUserTurn) {
      combinedQuery = `${(lastUserTurn.content || lastUserTurn.text || '').toLowerCase()} ${q}`;
    }
  }

  // Find target relative
  let matchedRelative: RelativeProfile | null = null;
  for (const rel of RELATIVE_PROFILES) {
    if (rel.regex.test(q)) {
      matchedRelative = rel;
      break;
    }
  }

  // If not found in current query, check if follow-up refers to relative from previous turn
  if (!matchedRelative && previousTurns.length > 0) {
    for (const rel of RELATIVE_PROFILES) {
      if (rel.regex.test(combinedQuery)) {
        matchedRelative = rel;
        break;
      }
    }
  }

  // If no relative mentioned, return null (native's own chart query)
  if (!matchedRelative) {
    return null;
  }

  // Find target life aspect (Career, Health, Education, Wealth, Property, etc.)
  let matchedAspect: LifeAspectProfile = LIFE_ASPECTS[LIFE_ASPECTS.length - 1]; // default to personality / 1st from X
  for (const asp of LIFE_ASPECTS) {
    if (asp.regex.test(q) || asp.regex.test(combinedQuery)) {
      matchedAspect = asp;
      break;
    }
  }

  const baseHouseX = matchedRelative.baseHouse;
  const offset = matchedAspect.offset;
  const derivedHouse = calculateDerivedHouse(baseHouseX, offset);

  // Compute supportive & negating houses relative to baseHouseX mapped to natal chart
  let relativeSupportiveOffsets: number[] = [1, 5, 11];
  let relativeNegatingOffsets: number[] = [6, 8, 12];

  if (matchedAspect.id === 'career' || matchedAspect.id === 'wealth') {
    relativeSupportiveOffsets = [2, 6, 10, 11];
    relativeNegatingOffsets = [5, 8, 12];
  } else if (matchedAspect.id === 'education') {
    relativeSupportiveOffsets = [4, 9, 11];
    relativeNegatingOffsets = [3, 8];
  } else if (matchedAspect.id === 'marriage') {
    relativeSupportiveOffsets = [2, 7, 11];
    relativeNegatingOffsets = [1, 6, 10, 12];
  } else if (matchedAspect.id === 'health') {
    // For health inquiry: 1, 5, 11 from X indicate recovery; 6, 8, 12 from X indicate illness
    relativeSupportiveOffsets = [1, 5, 11];
    relativeNegatingOffsets = [6, 8, 12];
  }

  const relativeSupportiveHouses = relativeSupportiveOffsets.map((off) => calculateDerivedHouse(baseHouseX, off));
  const relativeNegatingHouses = relativeNegatingOffsets.map((off) => calculateDerivedHouse(baseHouseX, off));

  const formulaDisplayEn = `${matchedRelative.nameEn} Base Lagna = House ${baseHouseX}. ${matchedAspect.nameEn} = ${offset}th from House ${baseHouseX} -> Derived Natal House = House ${derivedHouse}.`;
  const formulaDisplayHi = `${matchedRelative.nameHi} का मुख्य भाव = ${baseHouseX}वाँ भाव। ${matchedAspect.nameHi} के लिए ${baseHouseX}वें से ${offset}वाँ भाव -> जन्मकुंडली का ${derivedHouse}वाँ भाव देखा जाएगा।`;

  const explanationEn = `Bhavat Bhavam Rotation Applied: To analyze ${matchedRelative.nameEn}'s ${matchedAspect.nameEn}, we treat House ${baseHouseX} as their personal Lagna. Counting ${offset} houses from House ${baseHouseX} lands on Natal House ${derivedHouse}. The Cuspal Sub-Lord (CSL) of House ${derivedHouse} and its Star Lord govern this outcome.`;
  const explanationHi = `भावात भावम (व्युत्पन्न भाव) नियम: ${matchedRelative.nameHi} के ${matchedAspect.nameHi} का विश्लेषण करने के लिए जातक की कुंडली के ${baseHouseX}वें भाव को उनका लग्न मानकर, वहाँ से ${offset}वें भाव की गणना करने पर कुंडली का ${derivedHouse}वाँ भाव प्राप्त होता है। अतः ${derivedHouse}वें भाव के कस्पल सब-लॉर्ड (CSL) व नक्षत्र स्वामी से इसका निर्णय होगा।`;

  return {
    hasRelativeQuery: true,
    relative: matchedRelative,
    aspect: matchedAspect,
    baseHouseX,
    offset,
    derivedHouse,
    formulaDisplayEn,
    formulaDisplayHi,
    relativeSupportiveHouses,
    relativeNegatingHouses,
    explanationEn,
    explanationHi,
  };
}
