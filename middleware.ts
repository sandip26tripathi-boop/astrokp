import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Guard premium routes at the middleware level
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const lockedRoutes = [
    '/premium',
    '/pro',
    '/pricing',
    '/checkout',
    '/billing',
    '/monetization',
    '/dossier',
  ];

  if (lockedRoutes.some((route) => pathname.toLowerCase().startsWith(route))) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('locked', 'premium_coming_soon');
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/premium/:path*',
    '/pro/:path*',
    '/pricing/:path*',
    '/checkout/:path*',
    '/billing/:path*',
    '/monetization/:path*',
    '/dossier/:path*',
  ],
};
