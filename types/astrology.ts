export type AyanamsaType = 'KP_NEW' | 'KP_OLD' | 'LAHIRI';
export type Language = 'en' | 'hi';

export interface ChartInput {
  name: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string; // YYYY-MM-DD
  timeOfBirth: string; // HH:mm:ss or HH:mm
  placeName: string;
  latitude: number;
  longitude: number;
  timezone: number; // e.g. 5.5 for IST
  ayanamsa: AyanamsaType;
  isHorary: boolean;
  horaryNumber?: number; // 1 to 249
  language: Language;
  whatsapp?: string;
  phone?: string;
}

export interface PlanetPosition {
  id: string;
  name: string;
  hindiName: string;
  symbol: string;
  longitude: number; // 0 - 360
  formattedDMS: string;
  signId: number; // 1 - 12
  signName: string;
  hindiSignName: string;
  degreeInSign: number;
  formattedSignDMS: string;
  signLord: string;
  isRetrograde: boolean;
  nakshatraId: number; // 1 - 27
  nakshatraName: string;
  hindiNakshatraName: string;
  nakshatraPada: number;
  starLord: string;
  starLordIsRetrograde: boolean; // Retrograde Star-Lord Warning flag
  subLord: string;
  subSubLord: string;
  houseOccupied: number; // Placidus Bhava Chalit House
}

export interface CuspData {
  houseNumber: number; // 1 - 12
  longitude: number;
  formattedDMS: string;
  signId: number;
  signName: string;
  hindiSignName: string;
  degreeInSign: number;
  formattedSignDMS: string;
  signLord: string;
  starLord: string;
  starLordIsRetrograde: boolean; // Flag if cusp star lord is retrograde
  subLord: string;
  subSubLord: string;
  occupants: string[];
}

export interface HouseSignificator {
  houseNumber: number;
  level1: string[]; // Planets in star of occupants
  level2: string[]; // Occupants
  level3: string[]; // Planets in star of lord
  level4: string[]; // Lord
}

export interface PlanetSignification {
  planetId: string;
  planetName: string;
  housesSignified: {
    level1: number[];
    level2: number[];
    level3: number[];
    level4: number[];
    all: number[];
  };
}

export interface RulingPlanets {
  timestamp: string;
  dayLord: string;
  moonSignLord: string;
  moonStarLord: string;
  moonSubLord: string;
  lagnaSignLord: string;
  lagnaStarLord: string;
  lagnaSubLord: string;
  isRealtime?: boolean;
  purifiedRulingPlanets?: string[];
  retrogradePlanets?: string[];
  eventTimingWindow?: string;
  eventTimingWindowHi?: string;
  timestampIST?: string;
  sunriseTodayIST?: string;
  vedicWeekday?: string;
}

export interface DashaPeriod {
  planet: string;
  hindiPlanet: string;
  startDate: string;
  endDate: string;
  durationYears: number;
}

export interface CurrentDasha {
  mahadasha: {
    planet: string;
    startDate: string;
    endDate: string;
  };
  antardasha: {
    planet: string;
    startDate: string;
    endDate: string;
  };
  pratyantardasha: {
    planet: string;
    startDate: string;
    endDate: string;
  };
}

export interface ParsFortuna {
  longitude: number;
  formattedDMS: string;
  signName: string;
  hindiSignName: string;
  degreeInSign: number;
  formattedSignDMS: string;
  signLord: string;
  starLord: string;
  subLord: string;
  houseOccupied: number;
}

export interface EventChecklistItem {
  id: 'career' | 'marriage' | 'wealth' | 'property' | 'foreign' | 'childbirth' | 'litigation';
  title: string;
  hindiTitle: string;
  primaryHouse: number;
  cuspSubLord: string;
  cuspStarLord: string;
  starLordIsRetro: boolean;
  favorableHouses: number[];
  negatingHouses: number[];
  activatedFavorable: number[];
  activatedNegating: number[];
  probabilityScore: number; // 0 - 100%
  verdict: 'Highly Favorable' | 'Promising with Effort' | 'Delayed / Obstacles' | 'Unfavorable / Negated';
  hindiVerdict: string;
  timingWindow: string;
  hindiTimingWindow: string;
  remedy: {
    color: string;
    donation: string;
    mantra: string;
    favorablePlanet: string;
  };
}

export interface BTRAdjustment {
  offsetSeconds: number; // -120 to +120 seconds
  adjustedTime: string;
  adjustedAscLongitude: number;
  adjustedAscDMS: string;
  ascSignLord: string;
  ascStarLord: string;
  ascSubLord: string;
  matchesRulingPlanet: boolean;
  matchScore: number;
}

export interface KPMatrix {
  input: ChartInput;
  calculationTimestamp: string;
  julianDay: number;
  ayanamsaType: AyanamsaType;
  ayanamsaValue: number;
  formattedAyanamsa: string;
  ascendant: number;
  midheaven: number;
  planets: PlanetPosition[];
  cusps: CuspData[];
  houseSignificators: HouseSignificator[];
  planetSignifications: PlanetSignification[];
  rulingPlanets: RulingPlanets;
  currentDasha: CurrentDasha;
  vimshottariDashaTree: DashaPeriod[];
  parsFortuna: ParsFortuna;
  eventChecklist: EventChecklistItem[];
  horaryData?: {
    seed: number;
    subLordSpan: string;
    signLord: string;
    starLord: string;
    subLord: string;
  };
}

export interface GeminiDebugInfo {
  modelUsed: string;
  topic?: string;
  activeCsl?: {
    houseNumber: number;
    houseName: string;
    signLord?: string;
    starLord?: string;
    subLord?: string;
    subSubLord?: string;
  }[];
  currentDasha?: {
    mahadasha?: string;
    antardasha?: string;
    pratyantardasha?: string;
  } | string | any;
  rulingPlanets?: any;
  sentKundliDataSummary?: any;
  rawJsonSent?: any;
  timestamp?: string;
}

export interface GeminiConsultMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  debugInfo?: GeminiDebugInfo;
}

export interface GeminiContextPayload {
  kpMatrix: KPMatrix;
  messages: GeminiConsultMessage[];
  presetQuery?: string;
  language: Language;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  provider: 'google' | 'email';
  isLoggedIn: boolean;
}
