'use client';

import React, { useState } from 'react';

interface PanditJiIconProps {
  className?: string;
  size?: number;
}

export default function PanditJiIcon({ className = 'w-9 h-9', size = 36 }: PanditJiIconProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`relative rounded-full overflow-hidden shrink-0 flex items-center justify-center shadow-md border-2 border-amber-400 bg-gradient-to-b from-amber-100 via-amber-200 to-orange-200 dark:from-amber-900/60 dark:via-orange-950/70 dark:to-amber-950/90 ${className}`}
      style={{ width: size, height: size }}
    >
      {!imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/images/pandit-ji.jpg"
          alt="VedicWisdom"
          className="w-full h-full object-cover rounded-full"
          onError={() => setImgError(true)}
        />
      ) : (
        /* Graceful Vedic vector fallback */
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full object-cover"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="48" fill="#F59E0B" />
          <path
            d="M15 88 C20 70, 35 65, 50 65 C65 65, 80 70, 85 88 L85 100 L15 100 Z"
            fill="#D97706"
          />
          <ellipse cx="50" cy="42" rx="19" ry="21" fill="#FDE68A" />
          <path d="M47 30 L53 30 L50 44 Z" fill="#DC2626" />
          <circle cx="50" cy="45" r="2.5" fill="#F59E0B" />
        </svg>
      )}
    </div>
  );
}
