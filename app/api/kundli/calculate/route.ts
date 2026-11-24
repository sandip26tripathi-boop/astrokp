import { NextResponse } from 'next/server';
import { generateMasterKundli } from '@/lib/master-kundli-engine';
import { ChartInput } from '@/types/astrology';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Normalize date and time
    let dateStr = body.dateOfBirth || body.dateStr || body.date;
    if (!dateStr && body.year !== undefined && body.month !== undefined && body.day !== undefined) {
      dateStr = `${body.year}-${String(body.month).padStart(2, '0')}-${String(body.day).padStart(2, '0')}`;
    }

    let timeStr = body.timeOfBirth || body.timeStr || body.time;
    if (!timeStr && body.hour !== undefined) {
      timeStr = `${String(body.hour).padStart(2, '0')}:${String(body.minute || 0).padStart(2, '0')}:${String(body.second || 0).padStart(2, '0')}`;
    }

    if (!dateStr || !timeStr) {
      return NextResponse.json(
        { success: false, error: 'Missing required birth date or time parameters.' },
        { status: 400 }
      );
    }

    const chartInput: ChartInput = {
      name: body.name || 'Jataka',
      gender: body.gender || 'male',
      dateOfBirth: dateStr,
      timeOfBirth: timeStr,
      placeName: body.placeName || body.city || 'Custom',
      latitude: Number(body.lat ?? body.latitude ?? 28.6139),
      longitude: Number(body.lon ?? body.longitude ?? 77.209),
      timezone: body.timezone !== undefined ? Number(body.timezone) : 5.5,
      ayanamsa: body.ayanamsa || 'KP_NEW',
      isHorary: false,
      horaryNumber: 1,
      language: body.language || 'hi',
    };

    const masterKundli = generateMasterKundli(chartInput);

    return NextResponse.json({
      success: true,
      masterKundli,
    });
  } catch (error: any) {
    console.error('Error in /api/kundli/calculate route:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Master Kundli calculation failed.' },
      { status: 500 }
    );
  }
}
