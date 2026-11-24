import { NextResponse } from 'next/server';
import { calculateExactKP, calculateSwephKPChart } from '@/lib/swephKpEngine';
import { kundliCalculationCache } from '@/lib/cache-manager';
import { generateMasterKundli } from '@/lib/master-kundli-engine';
import { ChartInput } from '@/types/astrology';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Extract and normalize dateStr
    let dateStr = body.dateStr || body.date;
    if (!dateStr && body.year !== undefined && body.month !== undefined && body.day !== undefined) {
      dateStr = `${body.year}-${String(body.month).padStart(2, '0')}-${String(body.day).padStart(2, '0')}`;
    }

    // 2. Extract and normalize timeStr
    let timeStr = body.timeStr || body.time;
    if (!timeStr && body.hour !== undefined) {
      timeStr = `${String(body.hour).padStart(2, '0')}:${String(body.minute || 0).padStart(2, '0')}:${String(body.second || 0).padStart(2, '0')}`;
    }

    if (!dateStr || !timeStr) {
      return NextResponse.json(
        { success: false, error: 'Missing required birth date or time parameters (dateStr/date/year-month-day, timeStr/time/hour-minute).' },
        { status: 400 }
      );
    }

    const lat = Number(body.lat ?? body.latitude ?? 0);
    const lon = Number(body.lon ?? body.longitude ?? 0);
    const timezone = body.timezone !== undefined ? Number(body.timezone) : 5.5;

    // Master Kundli Calculation (Pure TS, 100% thread-safe & stateless)
    const chartInput: ChartInput = {
      name: body.name || 'Jataka',
      gender: body.gender || 'male',
      dateOfBirth: dateStr,
      timeOfBirth: timeStr,
      placeName: body.placeName || 'Unknown',
      latitude: lat,
      longitude: lon,
      timezone,
      ayanamsa: body.ayanamsa || (body.mode === 'LAHIRI' ? 'LAHIRI' : 'KP_NEW'),
      isHorary: false,
      horaryNumber: 1,
      language: body.language || 'hi',
    };
    const masterKundli = generateMasterKundli(chartInput);

    // 3. Fast In-Memory Deterministic LRU Cache lookup
    const cacheKey = `sweph:${dateStr}_${timeStr}_${lat.toFixed(4)}_${lon.toFixed(4)}_${timezone}`;
    let chart: any = kundliCalculationCache.get(cacheKey);

    if (!chart) {
      try {
        // 100% Free, Open-Source & Fast WebAssembly Swiss Ephemeris KP Calculation
        chart = await calculateExactKP(dateStr, timeStr, lat, lon, timezone);
        kundliCalculationCache.set(cacheKey, chart);
      } catch (swephErr) {
        console.warn('WASM calculateExactKP error, activating pure TS fallback:', swephErr);
        // Resilient Fallback Engine: synthesize compatible chart structure from masterKundli
        const cuspsData: Record<string, any> = {};
        const cuspsList: any[] = [];
        masterKundli.cusps.forEach((c, idx) => {
          const cuspObj = {
            houseNumber: c.houseNumber || idx + 1,
            longitude: c.longitude,
            signName: c.signName,
            rashiName: c.signName,
            signLord: c.signLord,
            starLord: c.starLord,
            subLord: c.subLord,
            subSubLord: c.subSubLord,
          };
          cuspsData[`Cusp_${c.houseNumber || idx + 1}`] = cuspObj;
          cuspsList.push(cuspObj);
        });

        const planetsData: Record<string, any> = {};
        const planetKeyMap: Record<string, string> = {
          Sun: 'Surya', Moon: 'Chandra', Mars: 'Mangal', Mercury: 'Budh',
          Jupiter: 'Guru', Venus: 'Shukra', Saturn: 'Shani', Rahu: 'Rahu', Ketu: 'Ketu'
        };

        masterKundli.planets.forEach((p) => {
          const pObj = {
            planetEn: p.name,
            longitude: p.longitude,
            signName: p.signName,
            signLord: p.signLord,
            starLord: p.starLord,
            subLord: p.subLord,
            subSubLord: p.subSubLord,
            isRetrograde: Boolean(p.isRetrograde),
            houseOccupied: p.houseOccupied,
          };
          planetsData[p.name] = pObj;
          if (planetKeyMap[p.name]) {
            planetsData[planetKeyMap[p.name]] = pObj;
          }
        });

        chart = {
          engine: 'master-astronomy-fail-safe',
          jd: masterKundli.meta.julianDay,
          ascendant: masterKundli.ascendant,
          lagna: masterKundli.ascendant,
          cusps: cuspsData,
          cuspsList,
          cuspsDetail: cuspsList,
          planets: planetsData,
        };
        kundliCalculationCache.set(cacheKey, chart);
      }
    }

    // Array of degrees for compatibility
    const cuspsArray = chart.cuspsList ? chart.cuspsList.map((c: any) => c.longitude) : [];

    return NextResponse.json({
      success: true,
      engine: chart.engine || 'sweph-wasm',
      jd: chart.jd,
      meta: {
        dateStr,
        timeStr,
        lat,
        lon,
        timezone,
        jd: chart.jd
      },
      lagna: chart.lagna || chart.ascendant,
      ascendant: chart.ascendant,
      cusps: chart.cusps,          // Object: { Cusp_1: { ... }, Cusp_2: { ... }, ... }
      cuspsArray: cuspsArray,      // Array: [deg1, deg2, ..., deg12]
      cuspsDetail: chart.cuspsList, // Array of 12 cusp objects with Star Lord, Sub Lord, etc.
      planets: chart.planets,      // Object with both English (Sun, Moon...) and Hindi (Surya, Chandra...)
      masterKundli,
    });
  } catch (error: any) {
    console.error('Error in /api/kundli route:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'KP Kundli calculation failed.' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get('date') || '1977-07-26';
  const timeStr = searchParams.get('time') || '15:22';
  const lat = parseFloat(searchParams.get('lat') || '21.90');
  const lon = parseFloat(searchParams.get('lon') || '77.90');
  const tz = parseFloat(searchParams.get('tz') || '5.5');

  try {
    const cacheKey = `sweph:${dateStr}_${timeStr}_${lat.toFixed(4)}_${lon.toFixed(4)}_${tz}`;
    let chart: any = kundliCalculationCache.get(cacheKey);
    if (!chart) {
      chart = await calculateExactKP(dateStr, timeStr, lat, lon, tz);
      kundliCalculationCache.set(cacheKey, chart);
    }
    return NextResponse.json({
      success: true,
      engine: chart.engine || 'sweph-wasm',
      ...chart
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
