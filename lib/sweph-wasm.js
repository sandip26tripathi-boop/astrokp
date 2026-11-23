/**
 * lib/sweph-wasm.js
 * High-performance Swiss Ephemeris WebAssembly compatibility layer
 * Providing sweph.init(), sweph.julday(), sweph.set_sid_mode(),
 * sweph.houses_ex(), sweph.calc_ut() and standard constants.
 */

import {
  createSwissEph,
  Ayanamsa,
  HouseSystem,
  Body,
  Flag,
  Calendar
} from '@kuntay/swisseph';

let sweInstance = null;
let initPromise = null;

export async function init() {
  if (sweInstance) return sweInstance;
  if (!initPromise) {
    initPromise = createSwissEph();
  }
  sweInstance = await initPromise;
  return sweInstance;
}

export const SE_GREG_CAL = Calendar.Gregorian;
export const SE_JUL_CAL = Calendar.Julian;

export const SE_SIDM_KRISHNAMURTI = Ayanamsa.Krishnamurti; // 5
export const SE_SIDM_LAHIRI = Ayanamsa.Lahiri;             // 1

export const SE_SUN = Body.Sun;
export const SE_MOON = Body.Moon;
export const SE_MERCURY = Body.Mercury;
export const SE_VENUS = Body.Venus;
export const SE_MARS = Body.Mars;
export const SE_JUPITER = Body.Jupiter;
export const SE_SATURN = Body.Saturn;
export const SE_MEAN_NODE = Body.MeanNode;
export const SE_TRUE_NODE = Body.TrueNode; // 11

export const SEFLG_SIDEREAL = Flag.Sidereal; // 65536
export const SEFLG_SPEED = Flag.Speed;       // 256

export function julday(year, month, day, hour, calendar = SE_GREG_CAL) {
  if (!sweInstance) {
    throw new Error('sweph is not initialized. Call await sweph.init() first.');
  }
  return sweInstance.julianDay(year, month, day, hour, calendar);
}

export function set_sid_mode(sidMode, t0 = 0, ayan_t0 = 0) {
  if (!sweInstance) {
    throw new Error('sweph is not initialized. Call await sweph.init() first.');
  }
  sweInstance.setSiderealMode(sidMode, t0, ayan_t0);
}

export function houses_ex(jd, iflag, lat, lon, hsys = 'P') {
  if (!sweInstance) {
    throw new Error('sweph is not initialized. Call await sweph.init() first.');
  }
  const res = sweInstance.houses(jd, lat, lon, hsys, { flags: iflag });
  // Standard Swiss Ephemeris houses_ex returns 1-indexed cusps array [0, cusp1, cusp2, ..., cusp12]
  const cusps1Indexed = [0, ...res.cusps];
  return {
    ascendant: res.ascendant,
    mc: res.midheaven,
    armc: res.armc,
    vertex: res.vertex,
    cusps: cusps1Indexed
  };
}

export function calc_ut(jd, planetId, iflag) {
  if (!sweInstance) {
    throw new Error('sweph is not initialized. Call await sweph.init() first.');
  }
  const pos = sweInstance.calc(jd, planetId, { flags: iflag });
  return {
    longitude: pos.longitude,
    latitude: pos.latitude,
    distance: pos.distance,
    longitudeSpeed: pos.longitudeSpeed,
    latitudeSpeed: pos.latitudeSpeed,
    distanceSpeed: pos.distanceSpeed
  };
}

const sweph = {
  init,
  julday,
  set_sid_mode,
  houses_ex,
  calc_ut,
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
  SEFLG_SPEED
};

export default sweph;
