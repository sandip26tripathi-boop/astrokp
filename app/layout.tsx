import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: {
    default: 'Astro Gemini | Authentic Vedic & KP Astrology Platform',
    template: '%s | Astro Gemini Vedic Astrology',
  },
  description:
    'Generate authentic Vedic D1 Lagna Kundli, Bhava Chalit chart, Vimshottari Dasha, Real-time Planetary Transits (Gochar), and accurate AI predictions with Astro Gemini. Free personalized horoscope consultation.',
  keywords: [
    'Vedic Astrology',
    'KP Astrology',
    'Astro Gemini',
    'Kundli Generator',
    'Janam Kundali',
    'Horoscope Predictions',
    'Bhava Chalit Chart',
    'Vimshottari Dasha',
    'Gochar Transit Today',
    'Sade Sati Analysis',
    'Free Kundli Hindi',
    'Astrology AI Chatbot',
    'Marriage Matchmaking',
    'Career Astrology',
    'BTR Birth Time Rectification',
  ],
  authors: [{ name: 'Astro Gemini & Pandit Sandeep Tripathi' }],
  creator: 'Astro Gemini',
  publisher: 'Astro Gemini Vedic AI',
  metadataBase: new URL('https://vedic-ai-astrology.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Astro Gemini | Authentic Vedic & KP Astrology Platform',
    description:
      'High-precision astronomical Kundli calculations, D1 & Bhava Chalit charts, 10-year comprehensive life predictions, and live astrological AI consultation.',
    url: 'https://vedic-ai-astrology.vercel.app',
    siteName: 'Astro Gemini Vedic AI',
    images: [
      {
        url: '/images/pandit-ji.jpg',
        width: 800,
        height: 800,
        alt: 'Astro Gemini - Vedic Astrologer',
      },
    ],
    locale: 'hi_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Astro Gemini | Authentic Vedic Astrology & Kundli',
    description:
      'Generate authentic Kundli with exact Cuspal Sub-Lords, Dasha, Gochar, and personalized Astrological AI consultation.',
    images: ['/images/pandit-ji.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'Astrology & Horoscope',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfaf6' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Astro Gemini Vedic Astrology',
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'All',
    url: 'https://vedic-ai-astrology.vercel.app',
    description:
      'High-precision Vedic and KP Astrology Kundli generation with Astro Gemini AI consultation, 10-year life forecasts, and transit evaluations.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
    },
    author: {
      '@type': 'Person',
      name: 'Astro Gemini (Sandeep Tripathi)',
      jobTitle: 'Vedic Astrologer & Astrological Data Scientist',
    },
  };

  return (
    <html lang="hi" suppressHydrationWarning className="overflow-x-hidden max-w-full w-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-screen antialiased bg-ivory-bg text-ivory-text dark:bg-cosmic-obsidian dark:text-slate-100 overflow-x-hidden max-w-full w-full selection:bg-amber-500 selection:text-black">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
