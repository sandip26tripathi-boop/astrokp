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
  Mic,
  MicOff,
  Maximize2,
  Minimize2,
  Briefcase,
  Heart,
  Coins,
  Plane,
  Home,
  Baby,
  Terminal,
  Code,
  Cpu,
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

function renderFormattedContent(content: string, onSelectQuestion?: (q: string) => void) {
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
            <span>सुझाए गए प्रश्न (क्लिक करके पूछें):</span>
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

export default function AstrologyChat() {
  const { input, kpMatrix, language, chatMessages, addChatMessage, clearChat } = useAstrologyStore();

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  // Voice Recognition Handler
  const toggleSpeechRecognition = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition: unknown }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        language === 'hi'
          ? 'आपके ब्राउज़र में वॉयस इनपुट समर्थित नहीं है। कृपया Chrome या Edge का उपयोग करें।'
          : 'Speech recognition is not supported in this browser. Please use Chrome or Edge.'
      );
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new (SpeechRecognition as any)();
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

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

    try {
      const res = await fetch('/api/gemini/kp-predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDetails: input,
          kpMatrix,
          kundliData: kpMatrix,
          messages: [...chatMessages, userMsg],
          presetQuery: promptToSend,
          language,
        }),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => null);
        const errDetail = errorJson?.details || errorJson?.error || 'Prediction request failed';
        throw new Error(errDetail);
      }

      const data = await res.json();
      const modelMsg: GeminiConsultMessage = {
        role: 'model',
        content: data.reply || data.text || 'Unable to generate prediction response.',
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
          : 'A temporary error occurred while communicating with the Astrological AI Engine. Please try again.';

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
    }
  };

  const PRESET_CHIPS = [
    {
      id: 'career',
      icon: Briefcase,
      labelEn: 'Career Window',
      labelHi: 'करियर समय (१०वां भाव)',
      promptEn:
        'Evaluate my career trajectory and promotion window based on the 10th and 6th Cusp Sub-Lords and active Dasha.',
      promptHi:
        '१०वें एवं ६वें भाव के उप-स्वामी तथा वर्तमान दशा के आधार पर मेरे करियर एवं पदोन्नति का सटीक विश्लेषण करें।',
    },
    {
      id: 'marriage',
      icon: Heart,
      labelEn: 'Marriage Timing',
      labelHi: 'विवाह मुहूर्त (७वां भाव)',
      promptEn:
        'Does the 7th Cusp Sub-Lord promise marriage (2, 7, 11) or show separation/negation (1, 6, 10)? When is marriage indicated?',
      promptHi:
        '७वें भाव के उप-स्वामी के आधार पर मेरे विवाह योग का विश्लेषण करें। विवाह की संभावित तिथि क्या है?',
    },
    {
      id: 'wealth',
      icon: Coins,
      labelEn: 'Financial Inflow',
      labelHi: 'धन लाभ (२रा व ११वां)',
      promptEn:
        'Analyze wealth accumulation, windfall gain, and business liquidity from the 2nd and 11th Cusp Sub-Lords.',
      promptHi:
        '२रे एवं ११वें भाव के उप-स्वामी के अनुसार मेरी आर्थिक स्थिति एवं धन लाभ का विश्लेषण करें।',
    },
    {
      id: 'property',
      icon: Home,
      labelEn: 'Property Purchase',
      labelHi: 'संपत्ति क्रय योग (४था भाव)',
      promptEn:
        'Evaluate real estate or vehicle purchase prospects from the 4th and 11th Cusp Sub-Lords.',
      promptHi:
        '४थे एवं ११वें भाव के उप-स्वामी के अनुसार भूमि, मकान एवं वाहन प्राप्ति का योग बताएं।',
    },
    {
      id: 'foreign',
      icon: Plane,
      labelEn: 'Foreign Travel & PR',
      labelHi: 'विदेश यात्रा (३-९-१२ भाव)',
      promptEn:
        'Evaluate overseas relocation and settlement prospects from the 3rd, 9th, and 12th Cusp Sub-Lords.',
      promptHi:
        '३रे, ९वें एवं १२वें भाव के उप-स्वामी के आधार पर विदेश यात्रा एवं निवास का योग बताएं।',
    },
    {
      id: 'childbirth',
      icon: Baby,
      labelEn: 'Childbirth Window',
      labelHi: 'संतान योग (५वां भाव)',
      promptEn:
        'Assess childbirth promise and timing using the 5th and 11th Cusp Sub-Lords.',
      promptHi:
        '५वें भाव के उप-स्वामी के अनुसार संतान प्राप्ति के योग एवं समय का विश्लेषण करें।',
    },
  ];

  return (
    <div
      className={`w-full max-w-full overflow-hidden bg-white/80 dark:bg-cosmic-card/90 backdrop-blur-xl border border-amber-500/20 dark:border-amber-500/30 rounded-2xl shadow-xl flex flex-col transition-all duration-300 ${
        isExpanded ? 'min-h-[750px]' : 'min-h-[580px]'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PanditJiIcon size={40} />
          <div>
            <h3 className="text-sm font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
              {language === 'hi' ? 'Astro Gemini (पंडित जी परामर्श)' : 'Astro Gemini (Vedic AI Consult)'}
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'hi' ? 'वैदिक, पराशरी एवं नक्षत्र आधारित प्रामाणिक फलादेश' : 'Vedic & Parashari Astrological Guidance'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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

      {/* Active Kundli Calculation HUD Status Bar */}
      <div className="px-4 py-2 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-500/20 text-[11px] flex flex-wrap items-center justify-between gap-2 text-slate-700 dark:text-slate-300">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            {input.name ? `${input.name} की कुंडली:` : (language === 'hi' ? 'सक्रिय कुंडली गणना:' : 'Active Kundli Grounding:')}
          </span>
          <span className="bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 rounded text-[10.5px]">
            लग्न: <strong className="text-slate-900 dark:text-amber-200">{kpMatrix?.cusps?.[0]?.hindiSignName || kpMatrix?.cusps?.[0]?.signName || 'वृश्चिक'}</strong>
          </span>
          <span className="bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 rounded text-[10.5px]">
            चन्द्र: <strong className="text-slate-900 dark:text-amber-200">{kpMatrix?.planets?.find((p) => p.name.toLowerCase() === 'moon')?.hindiSignName || kpMatrix?.planets?.find((p) => p.name.toLowerCase() === 'moon')?.signName || 'वृश्चिक'}</strong>
          </span>
          <span className="hidden sm:inline bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 rounded text-[10.5px]">
            {formatDashaDisplay(kpMatrix?.currentDasha)}
          </span>
        </div>
        {input.dateOfBirth && (
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            {input.dateOfBirth} | {input.timeOfBirth || '12:00'} | {input.placeName || 'भारत'}
          </div>
        )}
      </div>

      {/* Preset Inquiry Chips */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 overflow-x-auto">
        <div className="flex items-center gap-2 text-xs whitespace-nowrap">
          {PRESET_CHIPS.map((chip) => {
            const Icon = chip.icon;
            const label = language === 'hi' ? chip.labelHi : chip.labelEn;
            const prompt = language === 'hi' ? chip.promptHi : chip.promptEn;

            return (
              <button
                key={chip.id}
                type="button"
                disabled={isLoading}
                onClick={() => handleSend(prompt)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-500/60 text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 font-medium transition disabled:opacity-50 text-[11px]"
              >
                <Icon className="w-3.5 h-3.5 text-amber-500" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed */}
      <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[490px]">
        {chatMessages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={index}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {isUser ? (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold bg-amber-500 text-slate-950">
                  <User className="w-4 h-4" />
                </div>
              ) : (
                <PanditJiIcon size={28} />
              )}

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
                  renderFormattedContent(msg.content, (q) => handleSend(q))
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

        {isLoading && (
          <div className="flex items-start gap-3">
            <PanditJiIcon size={28} />
            <div className="bg-slate-100 dark:bg-slate-900/80 rounded-2xl p-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 border border-slate-200 dark:border-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
              {language === 'hi' ? 'पंडित जी गणना कर रहे हैं...' : 'Consulting astrological calculations...'}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar with Voice Recognition */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/40"
      >
        <button
          type="button"
          onClick={toggleSpeechRecognition}
          title={isListening ? 'Stop listening' : 'Start voice input'}
          className={`p-2.5 rounded-xl border transition ${
            isListening
              ? 'bg-red-500 text-white border-red-600 animate-pulse'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:text-amber-500'
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={
            isListening
              ? language === 'hi'
                ? 'सुन रहा हूँ... बोलिए...'
                : 'Listening... Speak now...'
              : language === 'hi'
              ? 'अपनी शंका पूछें (उदा. क्या मुझे इस वर्ष पदोन्नति मिलेगी?)...'
              : 'Ask specific question (e.g., When will I get a job promotion?)...'
          }
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
