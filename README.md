# CosmicKP Astrolabs - Commercial Astrology SaaS & Gemini AI Astrology Assistant

A high-performance, commercial-grade, multi-lingual Vedic Astrology Web Application inspired by modern SaaS platforms like AstroLabs (`theastrolabs.in`).

Combining astronomical precision (KP New / Old Ayanamsa, Placidus House System, Sub-Lords, Sub-Sub Lords, 4-Fold Significators, and Horary 1-249) with an ultra-luxurious cosmic aesthetic and an intelligent Gemini AI Astrology Assistant.

---

## 🚀 Key Highlights & Architecture

### 1. Astronomical Calculation Engine (`lib/kp-calculator.ts`)
- **Ayanamsa:** KP New (Default), KP Old, and Lahiri (Chitra Paksha).
- **House System:** Exact Placidus Semi-Arc Cusp computation (Ascendant, Midheaven, and Intermediate Cusps 1–12).
- **KP Sub-Lord & Sub-Sub Lord Division:**
  - 27 Nakshatras divided into 9 unequal sub-lords proportional to the Vimshottari Dasha years of the 9 planets ($800' \times \frac{\text{Years}}{120}$).
  - Sub-sub lord precision for micro-timing.
- **Horary / Prashna (1 to 249):**
  - Generates the authoritative 249 KP Horary table mapping every seed number to its exact Sign Lord, Star Lord, and Sub-Lord boundaries.
- **KP 4-Fold Significators:**
  - **Level 1:** Planets in the constellation (Star Lord) of the house occupants (Strongest).
  - **Level 2:** Planets occupying the house.
  - **Level 3:** Planets in the constellation of the house lord.
  - **Level 4:** House Lord (Sign Lord of cusp).
- **Ruling Planets (RP):** Real-time Day Lord, Moon Sign Lord, Moon Star Lord, Lagna Sign Lord, Lagna Star Lord, and Lagna Sub-Lord.
- **120-Year Vimshottari Dasha Engine:** Full tree down to Mahadasha, Antardasha, and Pratyantardasha.

### 2. Interactive Visual Kundli Display (`components/ChartViewer.tsx`)
- **North Indian Style (Diamond Chart):** Dynamic SVG with Bhava Chalit overlays and retrograde planetary notations (`(R)`).
- **South Indian Style (Box Chart):** Fixed sign layout with dynamic Ascendant orientation.
- **Interactive Inspector:** Clicking any House Cusp or Planet highlights its exact Star Lord, Sub-Lord, and 4-step significators.

### 3. Gemini AI Astrology Assistant (`app/api/gemini-consult/route.ts` & `components/AstrologyChatbot.tsx`)
- Powered by official `@google/genai` SDK using `gemini-3.8-flash`.
- Injects full astronomical payload: Cuspal Sub-Lords, Planetary Significators, Active Dasha, and Ruling Planets.
- Adheres strictly to K.S. Krishnamurti's rules (evaluating 7th cusp sub-lord for marriage, 10th/6th for career, 2nd/11th for wealth, 5th/11th for childbirth).

### 4. Commercial & Localization Readiness
- **Dual Language Support:** Instant English & Hindi toggle with comprehensive astrological terminology.
- **Day & Night Mode:** Cosmic Obsidian (`#0B0F19`) with royal indigo and gold shimmer, and Pristine Ivory Day mode.
- **High-Definition 15-Page Dossier Export:** Print-optimized PDF dossier generation (`components/ReportView.tsx`).
- **Monetization Hooks:** Pre-built checkout modal for Razorpay / Stripe integrations.

---

## 🛠️ Quick Start

```bash
# Install dependencies
npm install

# Set your Gemini API Key in .env.local
echo GEMINI_API_KEY=your_key_here > .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
