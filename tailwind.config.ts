import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sandalwood: {
          bg: '#FAF4E6',          // Warm Sandalwood Ivory (Primary Page Background)
          card: '#FFFDF7',        // Pure Cream Silk (Elevated Card & Chat Container Surface)
          panel: '#F3E8D2',       // Soft Chandan Sand (Secondary Panel / Sidebar / Input Field Surface)
          border: '#E4D5B7',      // Warm Sand Border
          borderMuted: '#D8C39E',  // Soft Umber / Client Chat Border
          text: '#231A12',        // Deep Espresso Charcoal (Primary Headings & Body Text)
          textSub: '#5C4D3C',     // Warm Umber Brown (Secondary Subtitles & Labels)
          textMuted: '#8A7967',   // Soft Taupe (Muted Metadata / Timestamps)
          accent: '#B87314',      // Royal Saffron-Gold / Haldi-Chandan (Primary CTA)
          accentHover: '#9A5E0D', // Royal Saffron Hover
          accentText: '#FFFDF7',  // Button Text
          gold: '#D4AF37',        // Antique Metallic Gold (Borders & Active Highlights)
          sage: '#4A6B53',        // Muted Pastel Sage Green (Prosperity/Positive Status Accent)
          terracotta: '#C2592B',  // Deep Kumkum Terracotta (Warm Alert/Highlight)
        },
        cosmic: {
          obsidian: '#1A140E',    // Deep Sandalwood Warm Espresso for dark mode
          deep: '#231A12',
          card: '#2A1F16',
          cardBorder: '#443525',
          royalIndigo: '#2D1F15',
          neonBlue: '#D4AF37',
          gold: '#B87314',
          goldLight: '#D4AF37',
          goldMuted: '#9A5E0D',
          ruby: '#C2592B',
          emerald: '#4A6B53',
          amethyst: '#8A7967',
        },
        ivory: {
          bg: '#FAF4E6',
          card: '#FFFDF7',
          cardBorder: '#E4D5B7',
          text: '#231A12',
          textMuted: '#5C4D3C',
          gold: '#B87314',
          goldBorder: '#D4AF37',
        },
      },
      fontFamily: {
        serif: ['Cinzel', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'sandalwood-gradient': 'radial-gradient(ellipse at top, #F3E8D2 0%, #FAF4E6 70%)',
        'gold-shimmer': 'linear-gradient(135deg, #B87314 0%, #D4AF37 50%, #9A5E0D 100%)',
        'glass-radial': 'radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.15), transparent 70%)',
      },
      boxShadow: {
        'sandalwood': '0 4px 20px -2px rgba(74, 53, 28, 0.06)',
        'sandalwood-lg': '0 8px 30px -4px rgba(74, 53, 28, 0.12)',
        'gold-glow': '0 0 25px -5px rgba(184, 115, 20, 0.25)',
        'metallic-border': '0 0 15px rgba(212, 175, 55, 0.35)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
