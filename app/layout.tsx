import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.vedicwisdom.world'),
  title: {
    default: 'VedicWisdom — Ancient Jyotish Wisdom, Modern AI Precision',
    template: '%s | VedicWisdom — Ancient Jyotish Wisdom, Modern AI Precision',
  },
  description:
    'Generate authentic Vedic D1 and Bhava Chalit Kundlis with exact planetary positions, Placidus Cusps, Vimshottari Dasha, and real-time AI astrological guidance by Sandeep K. Tripathi.',
  keywords: [
    'VedicWisdom',
    'Personal AI Astrologer',
    'Ancient Jyotish Wisdom',
    'Modern AI Precision',
    'Exact Event Timing Astrology',
    'KP Astrology Online',
    'Precise Kundli Analysis',
    'Parashari Jyotish AI',
    'Online Astrology Consultation',
    'Vedic Astrology',
    'Kundli Generator',
    'Janam Kundali',
    'Vimshottari Dasha',
    'Placidus Cusps',
    'Bhava Chalit Kundli',
    'Gochar Transit Today',
  ],
  authors: [{ name: 'Sandeep K. Tripathi — Astro-Vastu Researcher | Wealth & Business Growth Architect' }],
  creator: 'VedicWisdom',
  publisher: 'VedicWisdom',
  alternates: {
    canonical: 'https://www.vedicwisdom.world/',
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
  openGraph: {
    title: 'VedicWisdom — Ancient Jyotish Wisdom, Modern AI Precision',
    description:
      'Generate authentic Vedic D1 and Bhava Chalit Kundlis with exact planetary positions, Placidus Cusps, Vimshottari Dasha, and real-time AI astrological guidance by Sandeep K. Tripathi.',
    url: 'https://www.vedicwisdom.world/',
    siteName: 'VedicWisdom',
    images: [
      {
        url: '/images/pandit-ji.jpg',
        width: 800,
        height: 800,
        alt: 'VedicWisdom - Ancient Jyotish Wisdom, Modern AI Precision',
      },
    ],
    locale: 'en_US',
    alternateLocale: ['hi_IN'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VedicWisdom — Ancient Jyotish Wisdom, Modern AI Precision',
    description:
      'Generate authentic Vedic D1 and Bhava Chalit Kundlis with exact planetary positions, Placidus Cusps, Vimshottari Dasha, and real-time AI astrological guidance by Sandeep K. Tripathi.',
    images: ['/images/pandit-ji.jpg'],
  },
  category: 'Astrology & Horoscope',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF4E6' },
    { media: '(prefers-color-scheme: dark)', color: '#1A140E' },
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
      name: 'VedicWisdom — Ancient Jyotish Wisdom, Modern AI Precision',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'All',
      url: 'https://www.vedicwisdom.world/',
      description:
        'Generate authentic Vedic D1 and Bhava Chalit Kundlis with exact planetary positions, Placidus Cusps, Vimshottari Dasha, and real-time AI astrological guidance by Sandeep K. Tripathi.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      name: 'VedicWisdom — Ancient Jyotish Wisdom, Modern AI Precision',
      image: 'https://www.vedicwisdom.world/images/pandit-ji.jpg',
      url: 'https://www.vedicwisdom.world/',
      priceRange: 'Free / ₹0',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'IN',
      },
      founder: {
        '@type': 'Person',
        name: 'Sandeep K. Tripathi',
        jobTitle: 'Astro-Vastu Researcher | Wealth & Business Growth Architect',
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
        {/* Server-Rendered Semantic Fallback for Search Engines and Non-JS Crawlers */}
        <noscript>
          <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#FAF4E6', color: '#231A12', fontFamily: 'serif' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
              VedicWisdom — Ancient Jyotish Wisdom, Modern AI Precision
            </h1>
            <p style={{ maxWidth: '700px', margin: '0 auto 12px auto', lineHeight: '1.6' }}>
              Generate authentic Vedic D1 and Bhava Chalit Kundlis with exact planetary positions, Placidus Cusps, Vimshottari Dasha, and real-time AI astrological guidance by Sandeep K. Tripathi.
            </p>
            <p style={{ maxWidth: '700px', margin: '0 auto 12px auto', lineHeight: '1.6' }}>
              शास्त्रीय वैदिक ज्योतिष की गहराई, आधुनिक AI की सटीकता। सटीक खगोलीय गणना, कस्पल सब-लॉर्ड विश्लेषण एवं वास्तविक समय गोचर।
            </p>
            <a href="https://www.vedicwisdom.world/" style={{ color: '#B87314', fontWeight: 'bold' }}>
              https://www.vedicwisdom.world/
            </a>
          </div>
        </noscript>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
