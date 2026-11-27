/**
 * lib/system/selfHealingGuard.ts
 * Autonomous Runtime Resilience & Self-Healing Guard Layer for Gemini Astro
 *
 * Provides:
 * 1. Automatic exponential backoff retries on transient ephemeris/AI timeouts
 * 2. Automatic birth details sanitization & coordinate/timezone fallback resolution
 * 3. LRU Cache integrity validation & autonomous eviction of stale/corrupted entries
 * 4. Ephemeris & Dasha runtime health verification
 */

import { ChartInput } from '@/types/astrology';
import { kundliCalculationCache, gocharTransitCache, geoSearchCache } from '../cache-manager';
import { generateMasterKundli } from '../master-kundli-engine';
import { computeLiveRulingPlanets } from '../astrology/rulingPlanetsEngine';

export interface SelfHealingOptions<T> {
  retries?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
  tag?: string;
  fallback?: T | (() => Promise<T> | T);
}

/**
 * Executes an async operation with automatic exponential backoff retry and fallback
 */
export async function withSelfHealing<T>(
  fn: () => Promise<T>,
  options: SelfHealingOptions<T> = {}
): Promise<T> {
  const retries = options.retries ?? 2;
  const initialDelay = options.initialDelayMs ?? 300;
  const backoff = options.backoffFactor ?? 2;
  const tag = options.tag ?? 'AnonymousOperation';

  let currentDelay = initialDelay;
  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const isLastAttempt = attempt === retries;
      if (!isLastAttempt) {
        console.warn(`[SelfHealing:${tag}] Attempt ${attempt + 1} failed (${err?.message || String(err)}). Retrying in ${currentDelay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, currentDelay));
        currentDelay *= backoff;
      }
    }
  }

  console.error(`[SelfHealing:${tag}] All ${retries + 1} attempts exhausted. Invoking fallback if available.`);
  if (options.fallback !== undefined) {
    if (typeof options.fallback === 'function') {
      return await (options.fallback as () => Promise<T> | T)();
    }
    return options.fallback;
  }

  throw lastError;
}

/**
 * Robust Input Sanitizer and Fallback Resolver
 * Cleans malformed birth parameters, validates dates/times, and assigns safe coordinates.
 */
export function sanitizeBirthInput(raw: any): ChartInput {
  if (!raw || typeof raw !== 'object') {
    raw = {};
  }

  // 1. Date Sanitization (YYYY-MM-DD)
  let dateStr = raw.dateOfBirth || raw.dateStr || raw.date;
  if (!dateStr && raw.year !== undefined && raw.month !== undefined && raw.day !== undefined) {
    const y = Number(raw.year) || 1995;
    const m = Math.max(1, Math.min(12, Number(raw.month) || 1));
    const d = Math.max(1, Math.min(31, Number(raw.day) || 1));
    dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  if (!dateStr || typeof dateStr !== 'string' || !/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr.trim())) {
    dateStr = '1995-10-24'; // Safe baseline
  } else {
    dateStr = dateStr.trim();
  }

  // 2. Time Sanitization (HH:MM:SS or HH:MM)
  let timeStr = raw.timeOfBirth || raw.timeStr || raw.time;
  if (!timeStr && raw.hour !== undefined) {
    const h = Math.max(0, Math.min(23, Number(raw.hour) || 12));
    const min = Math.max(0, Math.min(59, Number(raw.minute) || 0));
    const s = Math.max(0, Math.min(59, Number(raw.second) || 0));
    timeStr = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  if (!timeStr || typeof timeStr !== 'string' || !/^\d{1,2}:\d{1,2}(:\d{1,2})?$/.test(timeStr.trim())) {
    timeStr = '12:00:00';
  } else {
    timeStr = timeStr.trim();
    if (timeStr.split(':').length === 2) {
      timeStr = `${timeStr}:00`;
    }
  }

  // 3. Coordinate & Timezone Fallbacks
  let lat = Number(raw.latitude ?? raw.lat);
  if (isNaN(lat) || lat < -90 || lat > 90) {
    lat = 28.6139; // New Delhi default
  }

  let lon = Number(raw.longitude ?? raw.lon);
  if (isNaN(lon) || lon < -180 || lon > 180) {
    lon = 77.209; // New Delhi default
  }

  let tz = raw.timezone !== undefined ? Number(raw.timezone) : 5.5;
  if (isNaN(tz) || tz < -12 || tz > 14) {
    tz = 5.5; // IST default
  }

  const name = typeof raw.name === 'string' && raw.name.trim().length > 0 ? raw.name.trim().slice(0, 80) : 'Jataka';
  const gender = raw.gender === 'female' || raw.gender === 'other' ? raw.gender : 'male';
  const placeName = typeof raw.placeName === 'string' && raw.placeName.trim().length > 0 ? raw.placeName.trim().slice(0, 100) : 'New Delhi, India';
  const language = raw.language === 'en' ? 'en' : 'hi';

  return {
    name,
    gender,
    dateOfBirth: dateStr,
    timeOfBirth: timeStr,
    placeName,
    latitude: lat,
    longitude: lon,
    timezone: tz,
    ayanamsa: 'KP_NEW',
    isHorary: Boolean(raw.isHorary),
    horaryNumber: Number(raw.horaryNumber) || 1,
    language,
  };
}

/**
 * Safely sanitizes incoming JSON payload
 */
export function sanitizeJsonPayload(payload: any): any {
  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload);
    } catch (_) {
      return {};
    }
  }
  return payload && typeof payload === 'object' ? payload : {};
}

/**
 * Autonomous Cache Cleaner & Memory Health Evaluator
 */
export function validateAndCleanCaches(): {
  kundliCacheSize: number;
  gocharCacheSize: number;
  geoCacheSize: number;
  evictedCount: number;
  status: 'healthy' | 'cleaned';
} {
  const p1 = kundliCalculationCache.pruneExpired();
  const p2 = gocharTransitCache.pruneExpired();
  const p3 = geoSearchCache.pruneExpired();

  const totalEvicted = p1 + p2 + p3;

  return {
    kundliCacheSize: kundliCalculationCache.size(),
    gocharCacheSize: gocharTransitCache.size(),
    geoCacheSize: geoSearchCache.size(),
    evictedCount: totalEvicted,
    status: totalEvicted > 0 ? 'cleaned' : 'healthy',
  };
}

/**
 * Performs a comprehensive ephemeris and calculation self-test
 */
export async function runEphemerisAndDashaSelfTest(): Promise<{
  ephemerisStatus: 'ok' | 'error';
  rulingPlanetsStatus: 'ok' | 'error';
  dashaEngineStatus: 'ok' | 'error';
  isFullyOperational: boolean;
  benchmarkDurationMs: number;
  purifiedRulingPlanetsSample: string[];
  testTimestamp: string;
}> {
  const start = Date.now();
  let ephemerisStatus: 'ok' | 'error' = 'ok';
  let rulingPlanetsStatus: 'ok' | 'error' = 'ok';
  let dashaEngineStatus: 'ok' | 'error' = 'ok';
  let sampleRPs: string[] = [];

  try {
    // 1. Live Ruling Planets Test
    const liveRP = computeLiveRulingPlanets(28.6139, 77.209, new Date());
    sampleRPs = liveRP.purifiedRulingPlanets;
    if (!liveRP.dayLord || !liveRP.moonSignLord || !liveRP.lagnaSignLord) {
      rulingPlanetsStatus = 'error';
    }
  } catch (e) {
    console.error('[SelfTest] Ruling Planets test failure:', e);
    rulingPlanetsStatus = 'error';
  }

  try {
    // 2. Master Kundli Calculation Test
    const testInput: ChartInput = {
      name: 'WatchdogTest',
      gender: 'male',
      dateOfBirth: '2000-01-01',
      timeOfBirth: '12:00:00',
      placeName: 'Delhi',
      latitude: 28.6139,
      longitude: 77.209,
      timezone: 5.5,
      ayanamsa: 'KP_NEW',
      isHorary: false,
      horaryNumber: 1,
      language: 'hi',
    };
    const testKundli = generateMasterKundli(testInput);

    if (!testKundli.ascendant || testKundli.cusps.length < 12 || testKundli.planets.length < 9) {
      ephemerisStatus = 'error';
    }

    if (!testKundli.dashaHierarchy?.mahadasha?.planet || testKundli.full120YearDashaTimeline.length < 9) {
      dashaEngineStatus = 'error';
    }
  } catch (e) {
    console.error('[SelfTest] Ephemeris & Dasha test failure:', e);
    ephemerisStatus = 'error';
    dashaEngineStatus = 'error';
  }

  const duration = Date.now() - start;
  const isFullyOperational =
    ephemerisStatus === 'ok' && rulingPlanetsStatus === 'ok' && dashaEngineStatus === 'ok';

  return {
    ephemerisStatus,
    rulingPlanetsStatus,
    dashaEngineStatus,
    isFullyOperational,
    benchmarkDurationMs: duration,
    purifiedRulingPlanetsSample: sampleRPs,
    testTimestamp: new Date().toISOString(),
  };
}
