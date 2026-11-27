import { NextResponse } from 'next/server';
import { validateAndCleanCaches, runEphemerisAndDashaSelfTest } from '@/lib/system/selfHealingGuard';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cacheStats = validateAndCleanCaches();
    const selfTest = await runEphemerisAndDashaSelfTest();

    const mem = process.memoryUsage();
    const memoryStats = {
      rssMB: Math.round(mem.rss / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
    };

    const isHealthy = selfTest.isFullyOperational;
    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

    return NextResponse.json(
      {
        status: isHealthy ? 'healthy' : 'degraded',
        uptimeSeconds: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
        geminiApiReady: hasGeminiKey,
        firebaseConfigured: true,
        memory: memoryStats,
        caches: cacheStats,
        diagnostics: selfTest,
        version: '1.0.0-pro',
        environment: process.env.NODE_ENV || 'production',
      },
      {
        status: isHealthy ? 200 : 503,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('Health API error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: error?.message || 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
