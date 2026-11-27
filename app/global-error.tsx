'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[VedicWisdom Global Self-Healing] Caught fatal error:', error);
  }, [error]);

  return (
    <html lang="hi">
      <body className="bg-[#FAF4E6] text-[#231A12] min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#FFFDF7] border-2 border-[#D4AF37] rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#B87314]/10 border border-[#D4AF37] flex items-center justify-center text-2xl">
            🛡️
          </div>
          <h2 className="text-xl font-bold font-serif text-[#231A12]">
            VedicWisdom Auto-Recovery
          </h2>
          <p className="text-xs text-[#5C4D3C] leading-relaxed">
            वैदिक विज़डम के वैश्विक अभिभावक ने सिस्टम को सुरक्षित बनाए रखा है। कृपया एप्लिकेशन पुनः लोड करें।
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full py-2.5 px-4 rounded-xl bg-[#B87314] text-[#FFFDF7] font-bold text-xs shadow-md hover:bg-[#9A5E0D] transition"
            >
              रीसेट करें (Reset & Recover)
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/';
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-[#FFFDF7] border border-[#D4AF37] text-[#231A12] font-semibold text-xs hover:bg-[#F3E8D2] transition"
            >
              मुख्य पृष्ठ पर जाएं (Reload Home)
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
