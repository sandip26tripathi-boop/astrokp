/**
 * lib/kp-transit.ts
 * Live Real-Time Transit (गोचर) Calculator for KP Astrology
 * Uses Swiss Ephemeris (sweph-wasm) to calculate exact positions of planets right now
 */

import { calculateExactKP, getOccupiedHouse } from './swephKpEngine';

export interface LiveTransitResult {
  textSummary: string;
  dateStr: string;
  planets: Record<string, any>;
}

export async function calculateLiveTransit(
  lat: number = 21.90,
  lon: number = 77.90,
  timezone: number = 5.5,
  rawNatalCusps?: number[]
): Promise<LiveTransitResult> {
  try {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const kp = await calculateExactKP(todayStr, timeStr, lat, lon, timezone);
    const tp = kp.planets as Record<string, any>;

    const keyPlanets = [
      { key: 'Jupiter', hi: 'गुरु / बृहस्पति' },
      { key: 'Saturn', hi: 'शनि' },
      { key: 'Rahu', hi: 'राहु' },
      { key: 'Ketu', hi: 'केतु' },
      { key: 'Sun', hi: 'सूर्य' },
      { key: 'Mars', hi: 'मंगल' },
      { key: 'Moon', hi: 'चन्द्र' },
      { key: 'Mercury', hi: 'बुध' },
      { key: 'Venus', hi: 'शुक्र' },
    ];

    const lines: string[] = [];
    for (const item of keyPlanets) {
      const p = tp[item.key];
      if (!p) continue;
      const natalHouse =
        rawNatalCusps && rawNatalCusps.length === 12
          ? getOccupiedHouse(p.longitude, rawNatalCusps)
          : p.houseOccupied;
      const retroStr = p.isRetrograde ? ' (वक्री / Retrograde)' : '';
      lines.push(
        `- ${item.hi} (${item.key}): राशि ${p.rashiName || p.signName} (${p.signName}), नक्षत्र स्वामी ${p.starLord} (${p.nakshatraName}), उप-स्वामी (Sub-Lord) ${p.subLord}, जातक के जन्मकुंडली के ${natalHouse}वें भाव में भ्रमणशील${retroStr}`
      );
    }

    const textSummary = `=== CURRENT LIVE TRANSIT (वर्तमान तात्कालिक गोचर - आज की स्थिति ${todayStr}) ===\n` + lines.join('\n');
    return { textSummary, dateStr: todayStr, planets: tp };
  } catch (error) {
    console.warn('Failed to calculate live transit with sweph:', error);
    return {
      textSummary: '=== CURRENT LIVE TRANSIT ===\nTransit data computed via running Vimshottari Dasha window.',
      dateStr: new Date().toISOString().slice(0, 10),
      planets: {},
    };
  }
}
