import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: {
    default:
      'VedicWisdom — Personal AI Astrologer | Exact Event Timing & Kundli',
    template:
      '%s | VedicWisdom — Personal AI Astrologer | Exact Event Timing & Kundli',
  },
  description:
    'Ancient Jyotish Wisdom, Modern AI Precision. Get instant, pinpoint accurate answers on career, marriage, finance & exact timing using Classical KP & Parashari Astrology.',
  keywords: [
    'VedicWisdom',
    'Personal AI Astrologer',
    'Exact Event Timing Astrology',
    'KP Astrology Online',
    'Precise Kundli Analysis',
    'Parashari Jyotish AI',
    'Online Astrology Consultation',
    'Vedic Astrology',
    'Kundli Generator',
    'Janam Kundali',
    'Vimshottari Dasha',
    'Gochar Transit Today',
  ],
  authors: [{ name: 'Sandeep K. Tripathi — Astro-Vastu Researcher | Wealth & Business Growth Architect' }],
  creator: 'VedicWisdom',
  publisher: 'VedicWisdom',
  metadataBase: new URL('https://www.vedicwisdom.world'),
  alternates: {
    canonical: 'https://www.vedicwisdom.world',
  },
  openGraph: {
    title:
      'VedicWisdom — Personal AI Astrologer | Exact Event Timing & Kundli',
    description:
      'Ancient Jyotish Wisdom, Modern AI Precision. Get instant, pinpoint accurate answers on career, marriage, finance & exact timing using Classical KP & Parashari Astrology.',
    url: 'https://www.vedicwisdom.world',
    siteName: 'VedicWisdom',
    images: [
      {
        url: '/images/pandit-ji.jpg',
        width: 800,
        height: 800,
        alt: 'VedicWisdom - Personal AI Astrologer',
      },
    ],
    locale: 'en_US',
    alternateLocale: ['hi_IN'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'VedicWisdom — Personal AI Astrologer | Exact Event Timing & Kundli',
    description:
      'Ancient Jyotish Wisdom, Modern AI Precision. Get instant, pinpoint accurate answers on career, marriage, finance & exact timing using Classical KP & Parashari Astrology.',
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
      name: 'VedicWisdom — Personal AI Astrologer | Exact Event Timing & Kundli',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'All',
      url: 'https://www.vedicwisdom.world',
      description:
        'Ancient Jyotish Wisdom, Modern AI Precision. Get instant, pinpoint accurate answers on career, marriage, finance & exact timing using Classical KP & Parashari Astrology.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      name: 'VedicWisdom — Personal AI Astrologer',
      image: 'https://www.vedicwisdom.world/images/pandit-ji.jpg',
      url: 'https://www.vedicwisdom.world',
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
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
