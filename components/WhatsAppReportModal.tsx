'use client';

import React, { useState, useEffect } from 'react';
import { useAstrologyStore } from '@/store/useAstrologyStore';
import { useAuth } from '@/context/AuthContext';
import {
  compileWhatsAppReportText,
  downloadConsultationPdfDossier,
  extractReportHighlights,
} from '@/lib/reportGenerator';
import {
  X,
  Phone,
  Send,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface WhatsAppReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WhatsAppReportModal({
  isOpen,
  onClose,
}: WhatsAppReportModalProps) {
  const { input, kpMatrix, language, chatMessages, setInput } = useAstrologyStore();
  const { user, uid } = useAuth();

  const [phoneInput, setPhoneInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isHi = language === 'hi';

  // Prepopulate phone number from store or auth profile
  useEffect(() => {
    if (isOpen) {
      const existingPhone =
        input.whatsapp || input.phone || (user as any)?.whatsappNumber || '';
      setPhoneInput(existingPhone);
      setSendSuccess(null);
      setErrorMessage(null);
    }
  }, [isOpen, input.whatsapp, input.phone, user]);

  if (!isOpen) return null;

  const highlights = extractReportHighlights(kpMatrix, language);

  // Count consultation turns
  const questionCount = chatMessages.filter((m) => m.role === 'user').length;

  const handleSendWhatsApp = async () => {
    setErrorMessage(null);
    setSendSuccess(null);

    const digitsOnly = phoneInput.replace(/\D/g, '');
    if (!digitsOnly || digitsOnly.length < 10) {
      setErrorMessage(
        isHi
          ? 'कृपया एक मान्य व्हाट्सएप नंबर (उदा. +91 9876543210) दर्ज करें।'
          : 'Please enter a valid 10+ digit WhatsApp number.'
      );
      return;
    }

    // Update store with verified phone
    setInput({ whatsapp: phoneInput.trim(), phone: phoneInput.trim() });

    setIsSending(true);

    try {
      const reportText = compileWhatsAppReportText({
        input: { ...input, whatsapp: phoneInput.trim(), phone: phoneInput.trim() },
        kpMatrix,
        chatMessages,
        language,
      });

      const res = await fetch('/api/whatsapp-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsappNumber: phoneInput.trim(),
          clientName: input.name || 'Client',
          reportText,
          uid,
        }),
      });

      const data = await res.json();

      if (data.mode === 'cloud_api' && data.success) {
        setSendSuccess(
          isHi
            ? '✅ रिपोर्ट आपके व्हाट्सएप पर सफलता पूर्वक प्रेषित कर दी गई है!'
            : '✅ Consultation report dispatched directly to your WhatsApp!'
        );
      } else {
        // Mode B: Direct instant WhatsApp link fallback
        const cleanPhone = data.cleanPhone || digitsOnly;
        const encoded = data.encodedText || encodeURIComponent(reportText);
        const waUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;

        // Open in new window/tab
        window.open(waUrl, '_blank', 'noopener,noreferrer');

        setSendSuccess(
          isHi
            ? '📲 व्हाट्सएप विंडो खुल गई है! संदेश प्रेषित करने हेतु Send पर क्लिक करें।'
            : '📲 WhatsApp opened! Click Send to deliver your consultation report.'
        );
      }
    } catch (err: any) {
      console.error('WhatsApp send error:', err);
      // Fallback direct link even on network error
      const reportText = compileWhatsAppReportText({
        input: { ...input, whatsapp: phoneInput.trim(), phone: phoneInput.trim() },
        kpMatrix,
        chatMessages,
        language,
      });
      const cleanPhone = digitsOnly.length === 10 ? `91${digitsOnly}` : digitsOnly;
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(reportText)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');

      setSendSuccess(
        isHi
          ? '📲 व्हाट्सएप विंडो खुल गई है!'
          : '📲 WhatsApp window opened with your report!'
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleDownloadPdf = () => {
    setIsDownloadingPdf(true);
    try {
      downloadConsultationPdfDossier({
        input: { ...input, whatsapp: phoneInput.trim() || input.whatsapp },
        kpMatrix,
        chatMessages,
        language,
      });
    } catch (err) {
      console.error('PDF generation error:', err);
      setErrorMessage(
        isHi ? 'PDF निर्माण में त्रुटि हुई।' : 'Error generating PDF report.'
      );
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#231A12]/80 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-[#FFFDF7] dark:bg-[#1A140E] border-2 border-[#D4AF37] rounded-2xl shadow-2xl overflow-hidden p-5 sm:p-6 text-[#231A12] dark:text-[#FFFDF7] space-y-4 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 p-1.5 rounded-lg text-[#5C4D3C] hover:text-[#231A12] dark:text-[#D8C39E] dark:hover:text-white hover:bg-[#F3E8D2] dark:hover:bg-[#2A1F16] transition"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-[#E4D5B7] dark:border-[#443525] pb-3">
          <div className="w-10 h-10 rounded-xl bg-[#B87314]/10 border border-[#D4AF37] flex items-center justify-center shrink-0">
            <span className="text-xl">📲</span>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold font-serif text-[#231A12] dark:text-[#FFFDF7]">
              {isHi
                ? 'व्हाट्सएप ज्योतिष परामर्श रिपोर्ट'
                : 'WhatsApp Astrological Report'}
            </h3>
            <p className="text-xs text-[#5C4D3C] dark:text-[#D8C39E]">
              {isHi
                ? 'अपनी संपूर्ण जन्मकुंडली व चैट परामर्श को व्हाट्सएप पर प्राप्त करें'
                : 'Receive your full Kundli summary & Q&A consultation on WhatsApp'}
            </p>
          </div>
        </div>

        {/* Report Overview Preview Box */}
        <div className="p-3.5 rounded-xl bg-[#F3E8D2]/60 dark:bg-[#2A1F16]/60 border border-[#E4D5B7] dark:border-[#443525] text-xs space-y-2">
          <div className="flex justify-between items-center text-[#5C4D3C] dark:text-[#D8C39E]">
            <span className="font-semibold text-[#231A12] dark:text-[#FFFDF7]">
              👤 {input.name || (isHi ? 'जातक' : 'Client')}
            </span>
            <span>
              {input.dateOfBirth ? `${input.dateOfBirth} (${input.placeName || 'भारत'})` : ''}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-[#E4D5B7] dark:border-[#443525] text-[11px]">
            <div>
              <span className="text-[#8A7967] block">{isHi ? 'लग्न:' : 'Lagna:'}</span>
              <strong className="text-[#B87314] dark:text-[#D4AF37]">{highlights.lagna}</strong>
            </div>
            <div>
              <span className="text-[#8A7967] block">{isHi ? 'राशि:' : 'Rashi:'}</span>
              <strong className="text-[#B87314] dark:text-[#D4AF37]">{highlights.rashi}</strong>
            </div>
            <div>
              <span className="text-[#8A7967] block">{isHi ? 'नक्षत्र:' : 'Nakshatra:'}</span>
              <strong className="text-[#B87314] dark:text-[#D4AF37]">{highlights.nakshatra}</strong>
            </div>
          </div>

          <div className="pt-1 border-t border-[#E4D5B7] dark:border-[#443525] text-[11px] flex justify-between">
            <span className="text-[#5C4D3C] dark:text-[#D8C39E]">
              {isHi ? 'सक्रिय विंशोत्तरी दशा:' : 'Active Vimshottari Period:'}
            </span>
            <strong className="text-[#231A12] dark:text-[#FFFDF7] font-mono">
              {highlights.currentDasha}
            </strong>
          </div>

          <div className="pt-1 text-[11px] flex justify-between items-center text-[#4A6B53] font-semibold">
            <span>✓ {isHi ? 'परामर्श प्रश्न सम्मिलित:' : 'Consultation turns included:'}</span>
            <span className="px-2 py-0.5 rounded-full bg-[#4A6B53]/10 border border-[#4A6B53]/30">
              {questionCount} {isHi ? 'प्रश्न' : 'Questions'}
            </span>
          </div>
        </div>

        {/* WhatsApp Phone Input Field */}
        <div>
          <label className="block text-xs font-semibold text-[#231A12] dark:text-[#FFFDF7] mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#4A6B53]" />
              {isHi ? 'व्हाट्सएप नंबर (WhatsApp Number)' : 'Recipient WhatsApp Number'}
            </span>
            <span className="text-[10px] text-[#8A7967] font-normal">
              {isHi ? 'देश कोड सहित (उदा. +91)' : 'With country code (+91)'}
            </span>
          </label>
          <div className="relative">
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="+91 9876543210"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#FAF4E6]/50 dark:bg-[#1A140E] border border-[#E4D5B7] dark:border-[#443525] text-[#231A12] dark:text-[#FFFDF7] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] font-mono transition"
            />
          </div>
        </div>

        {/* Alert & Feedback Notices */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {sendSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{sendSuccess}</span>
          </div>
        )}

        {/* Action Buttons: WhatsApp Delivery & PDF Download */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={handleSendWhatsApp}
            disabled={isSending || !phoneInput.trim()}
            className="w-full py-3 px-4 rounded-xl bg-[#4A6B53] hover:bg-[#3B5742] text-[#FFFDF7] font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-50"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>
                  {isHi ? 'व्हाट्सएप पर भेजा जा रहा है...' : 'Dispatching to WhatsApp...'}
                </span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>
                  {isHi ? '📲 व्हाट्सएप पर रिपोर्ट भेजें' : '📲 Send Report on WhatsApp'}
                </span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="w-full py-2.5 px-4 rounded-xl bg-[#FFFDF7] dark:bg-[#231A12] hover:bg-[#F3E8D2] dark:hover:bg-[#2A1F16] border border-[#D4AF37] text-[#231A12] dark:text-[#FFFDF7] font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isDownloadingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#B87314]" />
                <span>{isHi ? 'PDF तैयार हो रहा है...' : 'Compiling PDF...'}</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-[#B87314]" />
                <span>
                  {isHi ? '📥 संपूर्ण PDF रिपोर्ट डाउनलोड करें' : '📥 Download Printable PDF Dossier'}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Footer Attribution */}
        <div className="pt-2 border-t border-[#E4D5B7] dark:border-[#443525] text-[10.5px] text-[#8A7967] text-center leading-relaxed">
          <p>
            {isHi
              ? 'संरचना: संदीप के. त्रिपाठी • शास्त्रीय ज्योतिषीय शोध एवं आधुनिक AI सटीकता • vedicwisdom.world'
              : 'Architected by Sandeep K. Tripathi | vedicwisdom.world'}
          </p>
        </div>
      </div>
    </div>
  );
}
