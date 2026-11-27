/**
 * lib/reportGenerator.ts
 * Structured Consultation Report Compiler for VedicWisdom
 * Generates formatted WhatsApp text reports and branded PDF dossiers
 */

import { jsPDF } from 'jspdf';
import { ChartInput, KPMatrix, GeminiConsultMessage, Language } from '@/types/astrology';

export interface ConsultationReportData {
  input: ChartInput;
  kpMatrix: KPMatrix | null;
  chatMessages: GeminiConsultMessage[];
  language: Language;
}

const HINDI_PLANET_NAMES: Record<string, string> = {
  Sun: 'सूर्य',
  Moon: 'चन्द्र',
  Mars: 'मंगल',
  Mercury: 'बुध',
  Jupiter: 'बृहस्पति',
  Venus: 'शुक्र',
  Saturn: 'शनि',
  Rahu: 'राहु',
  Ketu: 'केतु',
};

/**
 * Extracts and formats key astrological highlights from the KP matrix
 */
export function extractReportHighlights(kpMatrix: KPMatrix | null, language: Language) {
  const isHi = language === 'hi';
  const c1 = kpMatrix?.cusps?.find((c) => c.houseNumber === 1);
  const moon = kpMatrix?.planets?.find((p) => p.name.toLowerCase() === 'moon');

  const lagna = isHi ? c1?.hindiSignName || c1?.signName || 'मेष' : c1?.signName || 'Aries';
  const rashi = isHi ? moon?.hindiSignName || moon?.signName || 'मेष' : moon?.signName || 'Aries';
  const nakshatra = isHi
    ? moon?.hindiNakshatraName || moon?.nakshatraName || 'अश्विनी'
    : moon?.nakshatraName || 'Ashwini';

  const dashaObj = kpMatrix?.currentDasha;
  const extractName = (d: any) => {
    if (!d) return isHi ? 'अज्ञात' : 'N/A';
    if (typeof d === 'string') return isHi ? HINDI_PLANET_NAMES[d] || d : d;
    const name = d.planet || d.name || d.lord || '';
    return isHi ? HINDI_PLANET_NAMES[name] || name : name;
  };

  const md = extractName(dashaObj?.mahadasha);
  const ad = extractName(dashaObj?.antardasha);
  const pd = extractName(dashaObj?.pratyantardasha);

  return {
    lagna,
    rashi,
    nakshatra,
    currentDasha: `${md} → ${ad} → ${pd}`,
  };
}

/**
 * Compiles a WhatsApp-formatted markdown text report with bold tags (*)
 */
export function compileWhatsAppReportText(data: ConsultationReportData): string {
  const { input, kpMatrix, chatMessages, language } = data;
  const isHi = language === 'hi';
  const highlights = extractReportHighlights(kpMatrix, language);

  const clientName = input.name?.trim() || (isHi ? 'प्रिय जातक' : 'Esteemed Client');
  const consultationDate = new Date().toLocaleDateString(isHi ? 'hi-IN' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Filter actual Q&A turns (skip default initial greetings)
  const qaTurns: { q: string; a: string }[] = [];
  let pendingQ = '';

  for (const msg of chatMessages) {
    if (msg.role === 'user') {
      pendingQ = msg.content.trim();
    } else if (pendingQ && (msg.role === 'model' || (msg as any).role === 'assistant')) {
      // Clean leading/trailing markdown for crisp WhatsApp read
      const cleanAnswer = msg.content
        .replace(/#{1,6}\s?/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      qaTurns.push({ q: pendingQ, a: cleanAnswer });
      pendingQ = '';
    }
  }

  // Header & Brand Banner
  let text = isHi
    ? `✨ *VedicWisdom — ज्योतिषीय परामर्श रिपोर्ट* ✨\n`
    : `✨ *VedicWisdom — Astrological Consultation Report* ✨\n`;
  text += isHi
    ? `_शास्त्रीय ज्योतिष की गहराई, आधुनिक AI की सटीकता।_\n\n`
    : `_Ancient Jyotish Wisdom, Modern AI Precision._\n\n`;

  // Client Profile
  text += isHi ? `👤 *जातक विवरण:* ${clientName}\n` : `👤 *Client Name:* ${clientName}\n`;
  if (input.dateOfBirth) {
    text += isHi
      ? `📅 *जन्म विवरण:* ${input.dateOfBirth} | ${input.timeOfBirth || '12:00'} | ${input.placeName || 'भारत'}\n`
      : `📅 *Birth Details:* ${input.dateOfBirth} | ${input.timeOfBirth || '12:00'} | ${input.placeName || 'India'}\n`;
  }
  if (input.whatsapp || input.phone) {
    text += `📲 *WhatsApp:* ${input.whatsapp || input.phone}\n`;
  }
  text += isHi ? `🗓️ *परामर्श तिथि:* ${consultationDate}\n\n` : `🗓️ *Consultation Date:* ${consultationDate}\n\n`;

  // Astrological Key Factors
  text += isHi ? `🪐 *कुंडली मुख्य बिंदु:*\n` : `🪐 *Astrological Key Factors:*\n`;
  text += isHi ? `• *लग्न (Ascendant):* ${highlights.lagna}\n` : `• *Ascendant (Lagna):* ${highlights.lagna}\n`;
  text += isHi ? `• *राशि (Moon Sign):* ${highlights.rashi}\n` : `• *Moon Sign (Rashi):* ${highlights.rashi}\n`;
  text += isHi ? `• *नक्षत्र (Birth Star):* ${highlights.nakshatra}\n` : `• *Nakshatra:* ${highlights.nakshatra}\n`;
  text += isHi ? `• *सक्रिय दशा (Active Dasha):* ${highlights.currentDasha}\n\n` : `• *Active Dasha:* ${highlights.currentDasha}\n\n`;

  // Q&A Consultations
  text += isHi ? `📜 *परामर्श सारांश (Q&A Consultation):*\n` : `📜 *Consultation Summary (Q&A):*\n`;
  text += `──────────────────────\n`;

  if (qaTurns.length === 0) {
    text += isHi
      ? `(सत्र में अभी कोई सीधा प्रश्न नहीं पूछा गया है।)\n\n`
      : `(No consultation questions recorded in this session yet.)\n\n`;
  } else {
    qaTurns.forEach((turn, idx) => {
      text += `*Q${idx + 1}: ${turn.q}*\n\n`;
      // Keep individual answer truncated gracefully for WhatsApp length limit if very long
      const trimmedAnswer = turn.a.length > 900 ? `${turn.a.slice(0, 890)}...` : turn.a;
      text += `${trimmedAnswer}\n\n`;
      text += `──────────────────────\n`;
    });
  }

  // Footer Attribution
  text += isHi
    ? `🏛️ *संरचना एवं शोध:* संदीप के. त्रिपाठी — एस्ट्रो-वास्तु शोधकर्ता | वेल्थ एवं बिज़नेस ग्रोथ आर्किटेक्ट\n`
    : `🏛️ *Architected by:* Sandeep K. Tripathi — Astro-Vastu Researcher | Wealth & Business Growth Architect\n`;
  text += `🌐 *Online Platform:* https://www.vedicwisdom.world\n`;

  return text;
}

/**
 * Generates and downloads a client PDF Dossier using jsPDF
 */
export function downloadConsultationPdfDossier(data: ConsultationReportData): void {
  const { input, kpMatrix, chatMessages, language } = data;
  const isHi = language === 'hi';
  const highlights = extractReportHighlights(kpMatrix, language);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = 16;

  // Header Banner
  doc.setFillColor(250, 244, 230); // #FAF4E6 Sandalwood
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFillColor(184, 115, 20); // #B87314 Gold Ribbon
  doc.rect(0, 27, pageWidth, 1.5, 'F');

  // Brand Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(35, 26, 18); // #231A12
  doc.text('VEDICWISDOM', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(92, 77, 60); // #5C4D3C
  doc.text('Classical Jyotish & KP Astrological Consultation Dossier', margin, 18);

  doc.setFontSize(8);
  doc.setTextColor(184, 115, 20);
  doc.text('Ancient Jyotish Wisdom, Modern AI Precision | vedicwisdom.world', margin, 24);

  cursorY = 36;

  // Client Details Card
  doc.setFillColor(255, 253, 247); // #FFFDF7
  doc.setDrawColor(228, 213, 183); // #E4D5B7
  doc.roundedRect(margin, cursorY, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(35, 26, 18);
  const clientName = input.name || 'Esteemed Client';
  doc.text(`Client: ${clientName}`, margin + 4, cursorY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(92, 77, 60);

  const dobLine = `Birth: ${input.dateOfBirth || 'N/A'} at ${input.timeOfBirth || '12:00'} | Place: ${input.placeName || 'India'}`;
  doc.text(dobLine, margin + 4, cursorY + 12);

  const phoneLine = `WhatsApp: ${input.whatsapp || input.phone || 'N/A'} | Date: ${new Date().toLocaleDateString()}`;
  doc.text(phoneLine, margin + 4, cursorY + 18);

  cursorY += 30;

  // Astrological Key Markers Box
  doc.setFillColor(243, 232, 210); // #F3E8D2
  doc.roundedRect(margin, cursorY, contentWidth, 18, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(184, 115, 20);

  const line1 = `Lagna (Ascendant): ${highlights.lagna}   |   Moon Sign (Rashi): ${highlights.rashi}   |   Nakshatra: ${highlights.nakshatra}`;
  doc.text(line1, margin + 4, cursorY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(35, 26, 18);
  const line2 = `Active Vimshottari Period: ${highlights.currentDasha}`;
  doc.text(line2, margin + 4, cursorY + 13);

  cursorY += 24;

  // Section: Consultation Q&A
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(35, 26, 18);
  doc.text('Astrological Consultation & Guidance', margin, cursorY);
  cursorY += 6;

  // Extract Q&A
  const qaTurns: { q: string; a: string }[] = [];
  let pendingQ = '';

  for (const msg of chatMessages) {
    if (msg.role === 'user') {
      pendingQ = msg.content.trim();
    } else if (pendingQ && (msg.role === 'model' || (msg as any).role === 'assistant')) {
      qaTurns.push({ q: pendingQ, a: msg.content.trim() });
      pendingQ = '';
    }
  }

  if (qaTurns.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(138, 121, 103);
    doc.text('No interactive questions logged in this session.', margin, cursorY + 6);
    cursorY += 14;
  } else {
    qaTurns.forEach((turn, idx) => {
      // Check page break
      if (cursorY > pageHeight - 35) {
        doc.addPage();
        cursorY = 20;
      }

      // Question
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(184, 115, 20);
      const qLines = doc.splitTextToSize(`Q${idx + 1}: ${turn.q}`, contentWidth);
      doc.text(qLines, margin, cursorY);
      cursorY += qLines.length * 4.5 + 2;

      // Answer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(35, 26, 18);

      const cleanAns = turn.a
        .replace(/#{1,6}\s?/g, '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '');

      const aLines = doc.splitTextToSize(cleanAns, contentWidth);

      // Render lines with pagination check
      for (const line of aLines) {
        if (cursorY > pageHeight - 20) {
          doc.addPage();
          cursorY = 20;
        }
        doc.text(line, margin, cursorY);
        cursorY += 4.2;
      }

      cursorY += 5;
      doc.setDrawColor(228, 213, 183);
      doc.line(margin, cursorY, margin + contentWidth, cursorY);
      cursorY += 6;
    });
  }

  // Footer on final page
  if (cursorY > pageHeight - 25) {
    doc.addPage();
    cursorY = 20;
  }

  cursorY = Math.max(cursorY + 6, pageHeight - 22);
  doc.setDrawColor(184, 115, 20);
  doc.line(margin, cursorY, margin + contentWidth, cursorY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(138, 121, 103);
  doc.text(
    'Architected by Sandeep K. Tripathi — Astro-Vastu Researcher | Wealth & Business Growth Architect | vedicwisdom.world',
    margin,
    cursorY + 4
  );
  doc.text(
    `Certified High-Precision Classical KP & Parashari Calculation System • Generated on ${new Date().toISOString()}`,
    margin,
    cursorY + 8
  );

  const safeFileName = `VedicWisdom-Report-${(input.name || 'Client').replace(/\s+/g, '_')}.pdf`;
  doc.save(safeFileName);
}
