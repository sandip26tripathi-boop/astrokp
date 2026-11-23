import {
  createSwissEph,
  Ayanamsa,
  Body,
  Flag,
  Calendar,
  SwissEph,
  CalcOptions
} from '@kuntay/swisseph';

// Global singleton instance for high performance
let globalSweInstance: SwissEph | null = null;
let globalInitPromise: Promise<SwissEph> | null = null;

export async function getSwissEphInstance(): Promise<SwissEph> {
  if (globalSweInstance) return globalSweInstance;
  if (!globalInitPromise) {
    globalInitPromise = createSwissEph();
  }
  globalSweInstance = await globalInitPromise;
  return globalSweInstance;
}

// Pre-initialize top-level instance
const sweInstance: SwissEph = await getSwissEphInstance();

export const SE_GREG_CAL = Calendar.Gregorian;
export const SE_JUL_CAL = Calendar.Julian;

export const SE_SIDM_KRISHNAMURTI = Ayanamsa.Krishnamurti;
export const SE_SIDM_LAHIRI = Ayanamsa.Lahiri;

export const SE_SUN = Body.Sun;
export const SE_MOON = Body.Moon;
export const SE_MERCURY = Body.Mercury;
export const SE_VENUS = Body.Venus;
export const SE_MARS = Body.Mars;
export const SE_JUPITER = Body.Jupiter;
export const SE_SATURN = Body.Saturn;
export const SE_MEAN_NODE = Body.MeanNode;
export const SE_TRUE_NODE = Body.TrueNode;

export const SEFLG_SIDEREAL = Flag.Sidereal;
export const SEFLG_SPEED = Flag.Speed;

export function swe_julday(
  year: number,
  month: number,
  day: number,
  hour: number,
  gregflag: number = SE_GREG_CAL
): number {
  return sweInstance.julianDay(year, month, day, hour, gregflag as any);
}

export function swe_set_sid_mode(sidMode: number, t0: number = 0, ayan_t0: number = 0): void {
  sweInstance.setSiderealMode(sidMode as any, t0, ayan_t0);
}

export function swe_houses(
  julday: number,
  lat: number,
  lon: number,
  hsys: string = 'P'
): {
  ascendant: number;
  mc: number;
  armc: number;
  vertex: number;
  cusps: number[];
} {
  const res = sweInstance.houses(julday, lat, lon, hsys as any);
  // Standard C swisseph returns 1-indexed cusps [0, cusp1, cusp2, ..., cusp12]
  // res.cusps from @kuntay/swisseph is 12 elements [cusp1, ..., cusp12]
  const cusps1Indexed = [0, ...res.cusps];
  return {
    ascendant: res.ascendant,
    mc: res.midheaven,
    armc: res.armc,
    vertex: res.vertex,
    cusps: cusps1Indexed
  };
}

export function swe_calc_ut(
  julday: number,
  planetId: number,
  flag: number | CalcOptions
): {
  longitude: number;
  latitude: number;
  distance: number;
  longitudeSpeed: number;
  latitudeSpeed: number;
  distanceSpeed: number;
} {
  const options: CalcOptions = typeof flag === 'number' ? { flags: flag } : flag;
  const pos = sweInstance.calc(julday, planetId as any, options);
  return {
    longitude: pos.longitude,
    latitude: pos.latitude,
    distance: pos.distance,
    longitudeSpeed: pos.longitudeSpeed,
    latitudeSpeed: pos.latitudeSpeed,
    distanceSpeed: pos.distanceSpeed
  };
}

const swissephCompat = {
  swe_julday,
  swe_set_sid_mode,
  swe_houses,
  swe_calc_ut,
  getSwissEphInstance,
  SE_GREG_CAL,
  SE_JUL_CAL,
  SE_SIDM_KRISHNAMURTI,
  SE_SIDM_LAHIRI,
  SE_SUN,
  SE_MOON,
  SE_MERCURY,
  SE_VENUS,
  SE_MARS,
  SE_JUPITER,
  SE_SATURN,
  SE_MEAN_NODE,
  SE_TRUE_NODE,
  SEFLG_SIDEREAL,
  SEFLG_SPEED,
  raw: sweInstance
};

export default swissephCompat;
