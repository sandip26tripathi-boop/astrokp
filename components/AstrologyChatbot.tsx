'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAstrologyStore } from '@/store/useAstrologyStore';
import { t } from '@/lib/i18n';
import { GeminiConsultMessage } from '@/types/astrology';
import PanditJiIcon from '@/components/PanditJiIcon';
import {
  Sparkles,
  Send,
  User,
  Trash2,
  Briefcase,
  Heart,
  Coins,
  Plane,
  Baby,
  Activity,
  Maximize2,
  Minimize2,
  ChevronDown,
  Terminal,
} from 'lucide-react';

function formatDashaDisplay(dasha: any): string {
  if (!dasha) return 'N/A';
  if (typeof dasha === 'string') return dasha;

  const extractPlanet = (d: any) => {
    if (!d) return null;
    if (typeof d === 'string') return d;
    if (typeof d === 'object') return d.planet || d.name || d.lord || null;
    return String(d);
  };

  const maha = extractPlanet(dasha.mahadasha) || extractPlanet(dasha.major) || 'N/A';
  const antar =
    extractPlanet(dasha.antardasha) ||
    extractPlanet(dasha.antardasha_Bhukti) ||
    extractPlanet(dasha.sub) ||
    'N/A';
  const prat =
    extractPlanet(dasha.pratyantardasha) ||
    extractPlanet(dasha.pratyantardasha_Antara) ||
    extractPlanet(dasha.pratyantar) ||
    null;

  if (prat) {
    return `महादशा: ${maha} → अंतर्दशा: ${antar} → प्रत्यंतर्दशा: ${prat}`;
  }
  return `महादशा: ${maha} → अंतर्दशा: ${antar}`;
}

function parseInlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-bold text-slate-950 dark:text-amber-200">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={index} className="italic text-slate-800 dark:text-amber-100">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

function renderFormattedContent(
  content: string,
  language: string = 'en',
  onSelectQuestion?: (q: string) => void
) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  const followUpQuestions: string[] = [];
  let inFollowUpSection = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      elements.push(<div key={`empty-${i}`} className="h-1.5" />);
      continue;
    }

    if (
      trimmed.includes('अगले संभावित प्रश्न') ||
      trimmed.includes('Suggested Follow-up') ||
      trimmed.includes('Suggested Questions') ||
      trimmed.includes('५.')
    ) {
      inFollowUpSection = true;
    }

    if (inFollowUpSection && /^[1-9]\.\s*[\*\_]?(.*?)[\*\_]?$/.test(trimmed)) {
      const match = trimmed
        .replace(/^[1-9]\.\s*[\*\_]?/, '')
        .replace(/[\*\_]+$/, '')
        .trim();
      if (match.length > 5) {
        followUpQuestions.push(match);
      }
    }

    if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
      const title = trimmed.replace(/^#+\s*/, '');
      elements.push(
        <div
          key={`h-${i}`}
          className="font-bold text-amber-600 dark:text-amber-400 mt-2.5 mb-1 text-[12.5px] border-b border-amber-500/20 pb-0.5"
        >
          {title}
        </div>
      );
      continue;
    }

    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      const bulletText = trimmed.substring(2);
      elements.push(
        <div key={`b-${i}`} className="flex items-start gap-1.5 my-0.5 pl-0.5">
          <span className="text-amber-500 font-bold shrink-0">•</span>
          <span className="flex-1 leading-relaxed">{parseInlineMarkdown(bulletText)}</span>
        </div>
      );
      continue;
    }

    elements.push(
      <p key={`p-${i}`} className="my-0.5 leading-relaxed">
        {parseInlineMarkdown(trimmed)}
      </p>
    );
  }

  return (
    <div className="space-y-0.5 text-xs">
      {elements}

      {followUpQuestions.length > 0 && onSelectQuestion && (
        <div className="mt-3 pt-2 border-t border-amber-500/20">
          <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>
              {language === 'hi'
                ? 'सुझाए गए प्रश्न (क्लिक करके पूछें):'
                : 'Suggested Questions (Click to ask):'}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {followUpQuestions.map((q, qIdx) => (
              <button
                key={qIdx}
                type="button"
                onClick={() => onSelectQuestion(q)}
                className="text-left px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-slate-800 dark:text-amber-100 text-[11px] font-medium transition flex items-center justify-between group shadow-sm"
              >
                <span>{q}</span>
                <span className="text-amber-500 group-hover:translate-x-0.5 transition-transform text-xs">
                  →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AstrologyChatbot() {
  const { kpMatrix, language, chatMessages, addChatMessage, clearChat } = useAstrologyStore();

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const isInitialMount = useRef(true);
  const wasLoadingRef = useRef(false);

  useEffect(() => {
    setIsMounted(true);
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 100);
  }, []);

  // Auto-focus input when AI response finishes
  useEffect(() => {
    if (wasLoadingRef.current && !isLoading) {
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 50);
    }
    wasLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    // Only scroll the internal chat container, NEVER the window/page
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [chatMessages, isLoading]);

  const handleSend = async (customPrompt?: string) => {
    const promptToSend = customPrompt || inputMessage.trim();
    if (!promptToSend || isLoading || !kpMatrix) return;

    const userMsg: GeminiConsultMessage = {
      role: 'user',
      content: promptToSend,
      timestamp: new Date().toISOString(),
    };

    addChatMessage(userMsg);
    if (!customPrompt) setInputMessage('');
    setIsLoading(true);

    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 50);

    try {
      const res = await fetch('/api/gemini-consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kpMatrix,
          kundliData: kpMatrix,
          messages: [...chatMessages, userMsg],
          presetQuery: promptToSend,
          language,
        }),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => null);
        const errDetail = errorJson?.details || errorJson?.error || 'Consultation request failed';
        throw new Error(errDetail);
      }

      const data = await res.json();
      const modelMsg: GeminiConsultMessage = {
        role: 'model',
        content: data.reply || data.text || 'Unable to generate consultation response.',
        timestamp: new Date().toISOString(),
        debugInfo: data.debug || data.debugInfo,
      };
      addChatMessage(modelMsg);
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : String(err);
      let userFriendlyNotice =
        language === 'hi'
          ? 'परामर्श प्राप्त करने में अस्थायी समस्या हुई। कृपया पुनः प्रयास करें।'
          : 'A temporary error occurred while consulting the Astrological AI Engine. Please try again.';

      if (/quota|RESOURCE_EXHAUSTED|limit/i.test(errMsg)) {
        userFriendlyNotice =
          language === 'hi'
            ? 'Google Gemini API का दैनिक कोटा (Free Tier Request Limit) पूरा हो गया है। कृपया कुछ समय बाद प्रयास करें या नया API Key अपडेट करें।'
            : 'Gemini API daily quota limit reached. Please try again later or update the API Key.';
      }

      addChatMessage({
        role: 'model',
        content: userFriendlyNotice,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 50);
    }
  };

  // Preset query buttons
  const PRESET_QUERIES = [
    {
      id: 'career',
      icon: Briefcase,
      labelEn: 'Career Timing (10th & 6th Cusp)',
      labelHi: 'करियर एवं पदोन्नति (१०वां भाव)',
      promptEn:
        'Analyze my career prospects, job promotion, and potential business timing strictly based on the 10th and 6th Cusp Sub-Lords, their Star Lords, and my running Dasha.',
      promptHi:
        'कृपया १०वें एवं ६वें भाव के उप-स्वामी, उनके नक्षत्र स्वामी तथा वर्तमान विंशोत्तरी दशा के आधार पर मेरे करियर एवं पदोन्नति का सटीक विश्लेषण करें।',
    },
    {
      id: 'marriage',
      icon: Heart,
      labelEn: 'Marriage & Partner (7th Cusp)',
      labelHi: 'विवाह एवं दांपत्य (७वां भाव)',
      promptEn:
        'Evaluate my marriage prospects based on the 7th Cusp Sub-Lord. Does it signify houses 2, 7, 11 (fruitful) or 1, 6, 10 (negation/delay)? When is marriage indicated by Dasha and Ruling Planets?',
      promptHi:
        '७वें भाव के उप-स्वामी के आधार पर मेरे विवाह योग का विश्लेषण करें। क्या यह २, ७, ११ (विवाह) अथवा १, ६, १० (विलंब/बाधा) दर्शाता है? विवाह का संभावित समय क्या है?',
    },
    {
      id: 'wealth',
      icon: Coins,
      labelEn: 'Wealth & Liquidity (2nd & 11th Cusp)',
      labelHi: 'धन एवं लाभ (२रा व ११वां भाव)',
      promptEn:
        'Evaluate financial stability, business earnings, and liquidity according to the 2nd and 11th Cusp Sub-Lords. Are houses 2, 6, 10, 11 favored in current dasha?',
      promptHi:
        '२रे एवं ११वें भाव के उप-स्वामी के अनुसार मेरी आर्थिक स्थिति, धन लाभ एवं बचत का विश्लेषण करें। क्या वर्तमान दशा में २, ६, १०, ११ भाव सक्रिय हैं?',
    },
    {
      id: 'travel',
      icon: Plane,
      labelEn: 'Foreign Travel & Settlement (3-9-12)',
      labelHi: 'विदेश यात्रा एवं निवास (३-९-१२ भाव)',
      promptEn:
        'Analyze prospects for foreign travel, higher education, or overseas settlement using the 3rd, 9th, and 12th Cusp Sub-Lords.',
      promptHi:
        '३रे, ९वें एवं १२वें भाव के उप-स्वामी के आधार पर विदेश यात्रा एवं विदेशी भूमि पर निवास का योग बताएं।',
    },
    {
      id: 'childbirth',
      icon: Baby,
      labelEn: 'Childbirth Prospects (5th Cusp)',
      labelHi: 'संतान प्राप्ति योग (५वां भाव)',
      promptEn:
        'Analyze progeny and childbirth according to the 5th Cusp Sub-Lord (connections to 2, 5, 11 vs 1, 4, 10).',
      promptHi:
        '५वें भाव के उप-स्वामी के आधार पर संतान सुख एवं प्राप्ति के समय का विश्लेषण करें।',
    },
    {
      id: 'health',
      icon: Activity,
      labelEn: 'Health & Well-being (1st & 6th Cusp)',
      labelHi: 'स्वास्थ्य एवं रोग मुक्ति (६ठा भाव)',
      promptEn:
        'Evaluate health vulnerability, disease indications, or recovery through the 1st and 6th Cusp Sub-Lords.',
      promptHi:
        'लग्न एवं ६ठे भाव के उप-स्वामी के आधार पर स्वास्थ्य एवं रोग प्रतिरोधक क्षमता का विश्लेषण करें।',
    },
  ];

  return (
    <div
      className={`w-full bg-white/80 dark:bg-cosmic-card/90 backdrop-blur-xl border border-amber-500/20 dark:border-amber-500/30 rounded-2xl shadow-xl flex flex-col transition-all duration-300 ${
        isExpanded ? 'min-h-[750px]' : 'min-h-[560px]'
      }`}
    >
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PanditJiIcon size={40} />
          <div>
            <h3 className="text-sm font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
              {language === 'hi' ? 'Gemini Astro (वैदिक ज्योतिषाचार्य)' : 'Gemini Astro (Vedic Astrologer)'}
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'hi' ? 'कुंडली, दशा, नक्षत्र एवं गोचर आधारित सटीक मार्गदर्शन' : 'Accurate Kundli, Dasha & Transit Guidance'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={clearChat}
            title="Clear Chat History"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse' : 'Expand'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Preset Pills Carousel */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 overflow-x-auto">
        <div className="flex items-center gap-2 text-xs whitespace-nowrap">
          {PRESET_QUERIES.map((preset) => {
            const Icon = preset.icon;
            const label = language === 'hi' ? preset.labelHi : preset.labelEn;
            const prompt = language === 'hi' ? preset.promptHi : preset.promptEn;

            return (
              <button
                key={preset.id}
                type="button"
                disabled={isLoading}
                onClick={() => handleSend(prompt)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-amber-500/60 dark:hover:border-amber-400/60 text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 font-medium transition disabled:opacity-50"
              >
                <Icon className="w-3.5 h-3.5 text-amber-500" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Messages Feed */}
      <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[480px]">
        {chatMessages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={index}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-gradient-to-br from-amber-600 to-orange-700 text-white shadow-sm shadow-amber-500/20'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <PanditJiIcon size={22} />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-amber-500/15 dark:bg-amber-500/20 text-slate-900 dark:text-amber-100 border border-amber-500/30'
                    : 'bg-slate-100 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {isUser ? (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                ) : (
                  renderFormattedContent(msg.content, language, (q) => handleSend(q))
                )}
                <div
                  suppressHydrationWarning
                  className={`text-[9px] mt-1.5 ${
                    isUser ? 'text-amber-700 dark:text-amber-400' : 'text-slate-400'
                  }`}
                >
                  {isMounted && msg.timestamp
                    ? new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-600 to-orange-700 text-white flex items-center justify-center shrink-0">
              <PanditJiIcon size={22} />
            </div>
            <div className="bg-slate-100 dark:bg-slate-900/80 rounded-2xl p-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 border border-slate-200 dark:border-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
              <span>
                {language === 'hi'
                  ? 'वैदिक एवं कस्पल गणना की जा रही है...'
                  : 'Evaluating Vedic & Cuspal alignments...'}
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/40"
      >
        <input
          ref={chatInputRef}
          type="text"
          value={inputMessage}
          autoFocus
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={t('chatPlaceholder', language)}
          className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isLoading}
          className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-amber-500/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
