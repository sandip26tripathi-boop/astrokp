import { NextResponse } from 'next/server';
import { generateMasterKundli } from '@/lib/master-kundli-engine';
import { sanitizeBirthInput, withSelfHealing } from '@/lib/system/selfHealingGuard';

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const chartInput = sanitizeBirthInput(rawBody);

    const masterKundli = await withSelfHealing(
      async () => generateMasterKundli(chartInput),
      {
        tag: 'KundliCalculateApi',
        retries: 2,
        initialDelayMs: 200,
      }
    );

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
