import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: {
    default:
      'Gemini Astro — Astronomical Precision Meets Cosmic Intelligence | सटीक खगोलीय गणना, गहन ज्योतिषीय समझ।',
    template:
      '%s | Gemini Astro — Astronomical Precision Meets Cosmic Intelligence | सटीक खगोलीय गणना, गहन ज्योतिषीय समझ।',
  },
  description:
    'Gemini Astro — Astronomical Precision Meets Cosmic Intelligence | सटीक खगोलीय गणना, गहन ज्योतिषीय समझ। Authentic Vedic D1 Lagna Kundli, Placidus Cuspal Sub-Lords, Vimshottari Dasha, real-time Gochar transits, and logic-based AI astrological counseling.',
  keywords: [
    'Vedic Astrology',
    'KP Astrology',
    'Gemini Astro',
    'Astronomical Precision Meets Cosmic Intelligence',
    'सटीक खगोलीय गणना गहन ज्योतिषीय समझ',
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
  authors: [{ name: 'Gemini Astro & Sandeep K. Tripathi' }],
  creator: 'Gemini Astro',
  publisher: 'Gemini Astro Vedic AI',
  metadataBase: new URL('https://vedic-ai-astrology.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title:
      'Gemini Astro — Astronomical Precision Meets Cosmic Intelligence | सटीक खगोलीय गणना, गहन ज्योतिषीय समझ।',
    description:
      'Gemini Astro — Astronomical Precision Meets Cosmic Intelligence | सटीक खगोलीय गणना, गहन ज्योतिषीय समझ। High-precision astronomical Kundli calculations, D1 & Bhava Chalit charts, 10-year comprehensive life predictions, and live astrological AI consultation.',
    url: 'https://vedic-ai-astrology.vercel.app',
    siteName: 'Gemini Astro Vedic AI',
    images: [
      {
        url: '/images/pandit-ji.jpg',
        width: 800,
        height: 800,
        alt: 'Gemini Astro - Vedic Astrologer',
      },
    ],
    locale: 'hi_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'Gemini Astro — Astronomical Precision Meets Cosmic Intelligence | सटीक खगोलीय गणना, गहन ज्योतिषीय समझ।',
    description:
      'Gemini Astro — Astronomical Precision Meets Cosmic Intelligence | सटीक खगोलीय गणना, गहन ज्योतिषीय समझ। Generate authentic Kundli with exact Cuspal Sub-Lords, Dasha, Gochar, and personalized Astrological AI consultation.',
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
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Gemini Astro — Astronomical Precision Meets Cosmic Intelligence | सटीक खगोलीय गणना, गहन ज्योतिषीय समझ।',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'All',
      url: 'https://vedic-ai-astrology.vercel.app',
      description:
        'Gemini Astro — Astronomical Precision Meets Cosmic Intelligence | सटीक खगोलीय गणना, गहन ज्योतिषीय समझ। High-precision Vedic and KP Astrology Kundli generation with Gemini Astro AI consultation, 10-year life forecasts, and transit evaluations.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      name: 'Gemini Astro — Astronomical Precision Meets Cosmic Intelligence | सटीक खगोलीय गणना, गहन ज्योतिषीय समझ।',
      image: 'https://vedic-ai-astrology.vercel.app/images/pandit-ji.jpg',
      url: 'https://vedic-ai-astrology.vercel.app',
      priceRange: 'Free / ₹0',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'IN',
      },
      founder: {
        '@type': 'Person',
        name: 'Gemini Astro (Sandeep K. Tripathi)',
        jobTitle: 'AstroVastu Researcher, Educator & App Developer',
      },
    },
  ];

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
