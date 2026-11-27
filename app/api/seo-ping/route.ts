import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Autonomous Search Engine Ping & IndexNow Notification Route
 * Pings Google & Bing with the updated sitemap to speed up indexing of VedicWisdom
 */
export async function GET(request: Request) {
  const sitemapUrl = 'https://www.vedicwisdom.world/sitemap.xml';
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    sitemap: sitemapUrl,
  };

  // 1. Google Sitemap Ping
  try {
    const googlePingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    const googleRes = await fetch(googlePingUrl, { method: 'GET', cache: 'no-store' });
    results.google = { status: googleRes.status, ok: googleRes.ok };
  } catch (err: any) {
    results.google = { error: err?.message || 'Google ping failed' };
  }

  // 2. Bing / IndexNow Ping
  try {
    const bingPingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    const bingRes = await fetch(bingPingUrl, { method: 'GET', cache: 'no-store' });
    results.bing = { status: bingRes.status, ok: bingRes.ok };
  } catch (err: any) {
    results.bing = { error: err?.message || 'Bing ping failed' };
  }

  return NextResponse.json({
    message: 'Autonomous SEO Ping executed for VedicWisdom.',
    results,
  });
}
