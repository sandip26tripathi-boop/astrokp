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

    // 3. Fast In-Memory Deterministic LRU Cache lookup
    const cacheKey = `sweph:${dateStr}_${timeStr}_${lat.toFixed(4)}_${lon.toFixed(4)}_${timezone}`;
    let chart: any = kundliCalculationCache.get(cacheKey);

    if (!chart) {
      // 100% Free, Open-Source & Fast WebAssembly Swiss Ephemeris KP Calculation
      chart = await calculateExactKP(dateStr, timeStr, lat, lon, timezone);
      kundliCalculationCache.set(cacheKey, chart);
    }

    // Array of degrees for compatibility
    const cuspsArray = chart.cuspsList ? chart.cuspsList.map((c: any) => c.longitude) : [];

    // Master Kundli Calculation
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

    return NextResponse.json({
      success: true,
      engine: 'sweph-wasm',
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
    const chart: any = await calculateExactKP(dateStr, timeStr, lat, lon, tz);
    return NextResponse.json({
      success: true,
      engine: 'sweph-wasm',
      ...chart
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
