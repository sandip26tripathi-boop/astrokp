'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, FileText, AlertTriangle } from 'lucide-react';

export type LegalTab = 'privacy' | 'terms' | 'disclaimer';

interface LegalModalProps {
  isOpen: boolean;
  initialTab?: LegalTab;
  language: 'hi' | 'en';
  onClose: () => void;
}

export default function LegalModal({
  isOpen,
  initialTab = 'privacy',
  language,
  onClose,
}: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const isHi = language === 'hi';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#231A12]/80 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-[#FFFDF7] dark:bg-[#1A140E] border-2 border-[#D4AF37] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E4D5B7] dark:border-[#443525] flex items-center justify-between bg-[#F3E8D2]/60 dark:bg-[#231A12]/60">
          <div className="flex items-center gap-2">
            <span className="text-lg">📜</span>
            <h3 className="text-base sm:text-lg font-bold font-serif text-[#231A12] dark:text-[#FFFDF7]">
              {isHi ? 'कानूनी एवं नीतिगत विवरण' : 'Legal & Policy Information'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#5C4D3C] hover:text-[#231A12] dark:text-[#D8C39E] dark:hover:text-white hover:bg-[#F3E8D2] dark:hover:bg-[#2A1F16] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#E4D5B7] dark:border-[#443525] bg-[#FAF4E6] dark:bg-[#15100B] p-1.5 gap-1.5 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'privacy'
                ? 'bg-[#B87314] text-[#FFFDF7] shadow-sm'
                : 'text-[#5C4D3C] dark:text-[#D8C39E] hover:bg-[#F3E8D2] dark:hover:bg-[#231A12]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>{isHi ? 'गोपनीयता नीति' : 'Privacy Policy'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'terms'
                ? 'bg-[#B87314] text-[#FFFDF7] shadow-sm'
                : 'text-[#5C4D3C] dark:text-[#D8C39E] hover:bg-[#F3E8D2] dark:hover:bg-[#231A12]'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>{isHi ? 'उपयोग की शर्तें' : 'Terms of Use'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('disclaimer')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'disclaimer'
                ? 'bg-[#B87314] text-[#FFFDF7] shadow-sm'
                : 'text-[#5C4D3C] dark:text-[#D8C39E] hover:bg-[#F3E8D2] dark:hover:bg-[#231A12]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{isHi ? 'अस्वीकरण' : 'Disclaimer'}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6 overflow-y-auto text-xs sm:text-sm text-[#231A12] dark:text-[#FAF4E6] leading-relaxed space-y-4">
          {activeTab === 'privacy' && (
            <div className="space-y-3 animate-fade-in">
              <h4 className="text-sm sm:text-base font-bold font-serif text-[#B87314] dark:text-[#D4AF37] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#B87314]" />
                <span>{isHi ? 'गोपनीयता नीति (Privacy Policy)' : 'Privacy Policy'}</span>
              </h4>
              <p>
                {isHi
                  ? 'VedicWisdom (vedicwisdom.world) पर आपकी व्यक्तिगत गोपनीयता हमारे लिए सर्वोच्च प्राथमिकता है। उपयोगकर्ता की जन्म तिथि, जन्म समय, जन्म स्थान तथा सहेजी गई कुंडलियाँ केवल व्यक्तिगत ज्योतिषीय फलादेश एवं सटीक कस्पल विश्लेषण उत्पन्न करने हेतु उनके सुरक्षित निजी खाते में संग्रहीत की जाती हैं।'
                  : 'At VedicWisdom (vedicwisdom.world), your personal privacy is our utmost priority. User birth details (date, time, place of birth) and saved Kundlis are stored securely under their private authenticated account solely to generate personalized astrological calculations and precise cuspal insights.'}
              </p>
              <div className="p-3.5 rounded-xl bg-[#F3E8D2]/60 dark:bg-[#2A1F16]/60 border border-[#E4D5B7] dark:border-[#443525] space-y-1.5 text-xs">
                <p className="font-semibold text-[#231A12] dark:text-[#FFFDF7]">
                  {isHi ? '🔒 डेटा सुरक्षा प्रतिज्ञा:' : '🔒 Data Protection Commitment:'}
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[#5C4D3C] dark:text-[#D8C39E]">
                  <li>
                    {isHi
                      ? 'आपका व्यक्तिगत डेटा, जन्म विवरण या फ़ोन नंबर कभी भी किसी तीसरे पक्ष (Third Party) के साथ बेचा, साझा या किराए पर नहीं दिया जाता है।'
                      : 'Your birth coordinates, consultation inquiries, or contact numbers are never sold, shared, or rented to third-party marketing brokers.'}
                  </li>
                  <li>
                    {isHi
                      ? 'क्लाउड फायरस्टोर में आपका रिकॉर्ड गूगल सुरक्षा मानकों के अनुसार सुरक्षित एन्क्रिप्टेड रूप में रहता है।'
                      : 'All account records and saved charts in Cloud Firestore are protected using industry-standard Google Security protocols.'}
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-3 animate-fade-in">
              <h4 className="text-sm sm:text-base font-bold font-serif text-[#B87314] dark:text-[#D4AF37] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#B87314]" />
                <span>{isHi ? 'उपयोग की शर्तें (Terms of Use)' : 'Terms of Use'}</span>
              </h4>
              <p>
                {isHi
                  ? 'VedicWisdom एक व्यक्तिगत और गैर-व्यावसायिक ज्योतिषीय मार्गदर्शन मंच है। इस प्लेटफ़ॉर्म का उपयोग करके आप निम्नलिखित शर्तों से सहमत होते हैं:'
                  : 'VedicWisdom is a personal, non-commercial astrological guidance platform. By accessing or utilizing this website, you acknowledge and agree to the following conditions:'}
              </p>
              <div className="p-3.5 rounded-xl bg-[#F3E8D2]/60 dark:bg-[#2A1F16]/60 border border-[#E4D5B7] dark:border-[#443525] space-y-1.5 text-xs">
                <ul className="list-disc pl-4 space-y-1 text-[#5C4D3C] dark:text-[#D8C39E]">
                  <li>
                    {isHi
                      ? 'सटीक कस्पल व ग्रहीय फलादेश हेतु उपयोगकर्ता स्वयं सही एवं प्रामाणिक जन्म विवरण दर्ज करने के लिए पूर्णतः उत्तरदायी हैं।'
                      : 'Users are strictly responsible for providing accurate and verifiable birth coordinates (Date, Time, and City of Birth).'}
                  </li>
                  <li>
                    {isHi
                      ? 'यह प्रणाली केवल व्यक्तिगत अध्ययन, शोध एवं आत्म-चिंतन हेतु तैयार की गई है।'
                      : 'The calculation engine and conversational insights are provided strictly for individual study, research, and self-reflection.'}
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'disclaimer' && (
            <div className="space-y-3 animate-fade-in">
              <h4 className="text-sm sm:text-base font-bold font-serif text-[#B87314] dark:text-[#D4AF37] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#B87314]" />
                <span>{isHi ? 'अस्वीकरण (Disclaimer)' : 'Disclaimer'}</span>
              </h4>
              <p>
                {isHi
                  ? 'VedicWisdom पर प्रस्तुत सभी ज्योतिषीय अंतर्दृष्टियां, ग्रह स्थिति विश्लेषण एवं समयावधि गणनाएं पारंपरिक पराशरी एवं कृष्णमूर्ति पद्धति (KP Jyotish) के गणितीय सिद्धांतों पर आधारित हैं।'
                  : 'All astrological insights, cuspal sub-lord analyses, and planetary event timings presented on VedicWisdom are calculated based on classical Parashari and Krishnamurti Padhdhati (KP Jyotish) mathematical models.'}
              </p>
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5 text-xs">
                <p className="font-semibold text-[#B87314] dark:text-[#D4AF37]">
                  {isHi ? '⚠️ महत्वपूर्ण वैधानिक सूचना:' : '⚠️ Important Advisory:'}
                </p>
                <p className="text-[#5C4D3C] dark:text-[#D8C39E] leading-relaxed">
                  {isHi
                    ? 'यह विश्लेषण केवल शैक्षणिक व सामान्य मार्गदर्शन के उद्देश्य से प्रस्तुत किया गया है। यह किसी भी प्रकार की वित्तीय गारंटी, कानूनी सलाह अथवा चिकित्सकीय (स्वास्थ्य) उपचार का विकल्प नहीं है। किसी भी बड़े जीवन या वित्तीय निर्णय से पूर्व संबंधित योग्य एवं प्रमाणित विशेषज्ञों से व्यक्तिगत परामर्श अवश्य लें।'
                    : 'This system is created solely for educational, personal reflection, and exploratory purposes. Astrological timings do not constitute guaranteed financial, medical, psychiatric, or legal advice. For any life-altering professional decisions, always consult licensed, qualified practitioners.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-[#E4D5B7] dark:border-[#443525] bg-[#FAF4E6]/50 dark:bg-[#15100B] flex items-center justify-between text-xs">
          <span className="text-[11px] text-[#8A7967] dark:text-[#A89886]">
            vedicwisdom.world • Ancient Jyotish Wisdom, Modern AI Precision
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#B87314] hover:bg-[#9A5E0D] text-[#FFFDF7] font-bold text-xs transition shadow-sm"
          >
            {isHi ? 'बंद करें' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
