'use client';

import React from 'react';

interface TriangleLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function TriangleLogo({ className = '', size = 'md' }: TriangleLogoProps) {
  const containerSizes = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-9 h-9 sm:w-10 sm:h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
  };

  const svgSizes = {
    sm: 22,
    md: 30,
    lg: 40,
  };

  const px = svgSizes[size];

  return (
    <div
      className={`relative flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/60 border border-amber-500/40 shadow-md shadow-amber-500/20 overflow-hidden group transition-all duration-300 hover:border-amber-400 hover:shadow-amber-500/30 ${containerSizes[size]} ${className}`}
      aria-label="Gemini Astro Premium Astrology Upward Triangle Logo"
    >
      {/* Subtle ambient cosmic background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.22),transparent_70%)] pointer-events-none" />

      {/* Sacred Geometry Upward Triangle & Cosmic Astrology Yantra SVG */}
      <svg
        width={px}
        height={px}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 drop-shadow-[0_1px_3px_rgba(245,158,11,0.35)] transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          {/* Rich Gold Metallic Gradient */}
          <linearGradient id="astroGold" x1="14" y1="14" x2="86" y2="86" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="35%" stopColor="#F59E0B" />
            <stop offset="70%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#FBBF24" />
          </linearGradient>

          {/* Soft Gold Fill */}
          <linearGradient id="astroGoldFill" x1="50" y1="14" x2="50" y2="82" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#D97706" stopOpacity="0.05" />
          </linearGradient>

          {/* Delicate Orbit Gradient */}
          <linearGradient id="orbitGlow" x1="15" y1="56" x2="85" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FDE68A" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* 1. Primary Upward Sacred Triangle (Vedic Trikona) */}
        <polygon
          points="50,14 86,78 14,78"
          fill="url(#astroGoldFill)"
          stroke="url(#astroGold)"
          strokeWidth="3.2"
          strokeLinejoin="round"
        />

        {/* 2. Inner Sacred Geometry Triangle (Concentric Harmony) */}
        <polygon
          points="50,28 77,74 23,74"
          fill="none"
          stroke="url(#astroGold)"
          strokeWidth="1.2"
          strokeDasharray="3 2"
          strokeOpacity="0.65"
          strokeLinejoin="round"
        />

        {/* 3. Celestial Planetary Orbit Ellipse (Cosmic Motion) */}
        <ellipse
          cx="50"
          cy="56"
          rx="36"
          ry="13"
          transform="rotate(-15 50 56)"
          fill="none"
          stroke="url(#orbitGlow)"
          strokeWidth="1.2"
          strokeDasharray="4 2.5"
        />

        {/* 4. Orbiting Cosmic Spheres (Planetary Grahas) */}
        <circle cx="81" cy="46" r="2.6" fill="#FDE68A" />
        <circle cx="19" cy="66" r="1.8" fill="#FBBF24" />

        {/* 5. Central 8-Ray Astrological Star of Light (Jyotish Surya Bindu) */}
        {/* Cardinal Rays */}
        <line x1="50" y1="43" x2="50" y2="67" stroke="url(#astroGold)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="38" y1="55" x2="62" y2="55" stroke="url(#astroGold)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Diagonal Rays */}
        <line x1="42" y1="47" x2="58" y2="63" stroke="url(#astroGold)" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.8" />
        <line x1="58" y1="47" x2="42" y2="63" stroke="url(#astroGold)" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.8" />
        {/* Central Luminous Bindu */}
        <circle cx="50" cy="55" r="3.2" fill="url(#astroGold)" />
        <circle cx="50" cy="55" r="1.4" fill="#FFFFFF" />

        {/* 6. Apex Guiding Star (Dhruva Tara / North Star Ascension) */}
        <path
          d="M50 7 L52.2 12 L50 17 L47.8 12 Z"
          fill="url(#astroGold)"
        />
        {/* Corner Accent Bindus */}
        <circle cx="14" cy="78" r="1.8" fill="#FDE68A" />
        <circle cx="86" cy="78" r="1.8" fill="#FDE68A" />
      </svg>
    </div>
  );
}
