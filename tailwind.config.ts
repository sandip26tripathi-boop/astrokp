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
        cosmic: {
          obsidian: '#0B0F19',
          deep: '#0F172A',
          card: '#131B2E',
          cardBorder: '#1E293B',
          royalIndigo: '#1E1B4B',
          neonBlue: '#38BDF8',
          gold: '#F59E0B',
          goldLight: '#FDE047',
          goldMuted: '#B45309',
          ruby: '#F43F5E',
          emerald: '#10B981',
          amethyst: '#A855F7',
        },
        ivory: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          cardBorder: '#E2E8F0',
          text: '#0F172A',
          textMuted: '#64748B',
          gold: '#D97706',
          goldBorder: '#FCD34D',
        },
      },
      fontFamily: {
        serif: ['Cinzel', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'cosmic-gradient': 'radial-gradient(ellipse at top, #1E1B4B 0%, #0B0F19 70%)',
        'gold-shimmer': 'linear-gradient(135deg, #F59E0B 0%, #FDE047 50%, #D97706 100%)',
        'glass-radial': 'radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.15), transparent 70%)',
      },
      boxShadow: {
        cosmic: '0 0 25px -5px rgba(245, 158, 11, 0.25)',
        'cosmic-glow': '0 0 35px -5px rgba(99, 102, 241, 0.3)',
        'neon-border': '0 0 15px rgba(56, 189, 248, 0.4)',
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
