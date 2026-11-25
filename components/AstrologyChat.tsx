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

function formatDashaDisplay(dasha: any, isEn: boolean = false): string {
  if (!dasha) return isEn ? 'N/A' : 'उपलब्ध नहीं';
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

  if (isEn) {
    if (prat) {
      return `Mahadasha: ${maha} → Antardasha: ${antar} → Pratyantardasha: ${prat}`;
    }
    return `Mahadasha: ${maha} → Antardasha: ${antar}`;
  }

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
        <strong key={index} className="font-bold text-[#231A12] dark:text-[#D4AF37]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={index} className="italic text-[#5C4D3C] dark:text-[#D8C39E]">
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
          className="font-bold text-[#B87314] dark:text-[#D4AF37] mt-2.5 mb-1 text-sm sm:text-base border-b border-[#E4D5B7] dark:border-[#443525] pb-0.5"
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
          <span className="text-[#B87314] font-bold shrink-0">•</span>
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
    <div className="space-y-1 text-sm sm:text-base leading-relaxed text-[#231A12] dark:text-[#FAF4E6]">
      {elements}

      {followUpQuestions.length > 0 && onSelectQuestion && (
        <div className="mt-3 pt-2 border-t border-[#E4D5B7] dark:border-[#443525]">
          <div className="text-xs sm:text-sm font-bold text-[#B87314] dark:text-[#D4AF37] mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#B87314]" />
            <span>सुझाए गए प्रश्न (क्लिक करके पूछें):</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {followUpQuestions.map((q, qIdx) => (
              <button
                key={qIdx}
                type="button"
                onClick={() => onSelectQuestion(q)}
                className="text-left px-3 py-2 rounded-xl bg-[#F3E8D2] hover:bg-[#E4D5B7] dark:bg-[#2A1F16] dark:hover:bg-[#443525] border border-[#E4D5B7] dark:border-[#443525] text-[#231A12] dark:text-[#FFFDF7] text-xs sm:text-sm font-medium transition flex items-center justify-between group shadow-sm"
              >
                <span>{q}</span>
                <span className="text-[#B87314] group-hover:translate-x-0.5 transition-transform text-xs sm:text-sm">
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
  const [streamingText, setStreamingText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const isInitialMount = useRef(true);
  const wasLoadingRef = useRef(false);

  useEffect(() => {
    setIsMounted(true);
    // Initial auto-focus
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 100);
  }, []);

  // Auto-focus input when AI response finishes (isLoading goes from true to false)
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
  }, [chatMessages, isLoading, streamingText]);

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
    setStreamingText('');

    // Immediately restore cursor focus to input box
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 50);

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
          stream: true,
        }),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => null);
        const errDetail = errorJson?.details || errorJson?.error || 'Prediction request failed';
        throw new Error(errDetail);
      }

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/event-stream') && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.slice(6).trim();
              if (dataStr === '[DONE]') continue;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  accumulated += parsed.text;
                  setStreamingText(accumulated);
                }
              } catch (e) {
                // Ignore split JSON
              }
            }
          }
        }

        if (accumulated.trim()) {
          addChatMessage({
            role: 'model',
            content: accumulated.trim(),
            timestamp: new Date().toISOString(),
          });
        }
        setStreamingText('');
      } else {
        const data = await res.json();
        const modelMsg: GeminiConsultMessage = {
          role: 'model',
          content: data.reply || data.text || 'Unable to generate prediction response.',
          timestamp: new Date().toISOString(),
          debugInfo: data.debug || data.debugInfo,
        };
        addChatMessage(modelMsg);
      }
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
      setStreamingText('');
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 50);
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
      className={`w-full max-w-full overflow-hidden bg-[#FFFDF7] dark:bg-[#231A12] border border-[#E4D5B7] dark:border-[#443525] rounded-2xl shadow-sandalwood flex flex-col transition-all duration-300 ${
        isExpanded ? 'min-h-[750px]' : 'min-h-[580px]'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-[#E4D5B7] dark:border-[#443525] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PanditJiIcon size={40} />
          <div>
            <h3 className="text-base sm:text-lg font-bold font-serif text-[#231A12] dark:text-[#FFFDF7] flex items-center gap-2">
              {language === 'hi' ? 'Gemini Astro (ज्योतिषीय परामर्श)' : 'Gemini Astro (Vedic AI Consult)'}
              <span className="w-2 h-2 rounded-full bg-[#4A6B53] animate-pulse" />
            </h3>
            <p className="text-xs sm:text-sm text-[#5C4D3C] dark:text-[#D8C39E]">
              {language === 'hi' ? 'वैदिक, पराशरी एवं नक्षत्र आधारित प्रामाणिक फलादेश' : 'Vedic & Parashari Astrological Guidance'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clearChat}
            title="Clear Chat History"
            className="p-1.5 rounded-lg text-[#8A7967] hover:text-[#C2592B] hover:bg-[#F3E8D2] dark:hover:bg-[#2A1F16] transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse' : 'Expand'}
            className="p-1.5 rounded-lg text-[#8A7967] hover:text-[#231A12] dark:hover:text-[#FFFDF7] hover:bg-[#F3E8D2] dark:hover:bg-[#2A1F16] transition"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Active Kundli Calculation HUD Status Bar */}
      <div className="px-4 py-2.5 bg-[#F3E8D2] dark:bg-[#1A140E] border-b border-[#E4D5B7] dark:border-[#443525] text-xs sm:text-sm flex flex-wrap items-center justify-between gap-2 text-[#231A12] dark:text-[#FFFDF7]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-[#B87314] dark:text-[#D4AF37] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#B87314]" />
            {input.name
              ? language === 'hi'
                ? `${input.name} की कुंडली:`
                : `${input.name}'s Chart:`
              : language === 'hi'
              ? 'सक्रिय कुंडली गणना:'
              : 'Active Kundli Grounding:'}
          </span>
          <span className="bg-[#FFFDF7] dark:bg-[#2A1F16] border border-[#E4D5B7] dark:border-[#443525] px-2.5 py-1 rounded text-xs">
            {language === 'hi' ? 'लग्न: ' : 'Asc: '}
            <strong className="text-[#231A12] dark:text-[#D4AF37]">
              {language === 'hi'
                ? kpMatrix?.cusps?.[0]?.hindiSignName || kpMatrix?.cusps?.[0]?.signName || 'वृश्चिक'
                : kpMatrix?.cusps?.[0]?.signName || 'Scorpio'}
            </strong>
          </span>
          <span className="bg-[#FFFDF7] dark:bg-[#2A1F16] border border-[#E4D5B7] dark:border-[#443525] px-2.5 py-1 rounded text-xs">
            {language === 'hi' ? 'चन्द्र: ' : 'Moon: '}
            <strong className="text-[#231A12] dark:text-[#D4AF37]">
              {language === 'hi'
                ? kpMatrix?.planets?.find((p) => p.name.toLowerCase() === 'moon')?.hindiSignName || kpMatrix?.planets?.find((p) => p.name.toLowerCase() === 'moon')?.signName || 'वृश्चिक'
                : kpMatrix?.planets?.find((p) => p.name.toLowerCase() === 'moon')?.signName || 'Scorpio'}
            </strong>
          </span>
          <span className="hidden sm:inline bg-[#FFFDF7] dark:bg-[#2A1F16] border border-[#E4D5B7] dark:border-[#443525] px-2.5 py-1 rounded text-xs">
            {formatDashaDisplay(kpMatrix?.currentDasha, language === 'en')}
          </span>
        </div>
        {input.dateOfBirth && (
          <div className="text-xs text-[#5C4D3C] dark:text-[#D8C39E] font-medium">
            {input.dateOfBirth} | {input.timeOfBirth || '12:00'} | {input.placeName || (language === 'hi' ? 'भारत' : 'India')}
          </div>
        )}
      </div>

      {/* Preset Inquiry Chips */}
      <div className="p-3 border-b border-[#E4D5B7] dark:border-[#443525] bg-[#FAF4E6]/50 dark:bg-[#1A140E]/30 overflow-x-auto">
        <div className="flex items-center gap-2 text-xs sm:text-sm whitespace-nowrap">
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
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#FFFDF7] dark:bg-[#2A1F16] border border-[#E4D5B7] dark:border-[#443525] hover:border-[#D4AF37] text-[#231A12] dark:text-[#FFFDF7] hover:text-[#B87314] font-medium transition disabled:opacity-50 text-xs sm:text-sm shadow-sm hover:bg-[#F3E8D2]"
              >
                <Icon className="w-3.5 h-3.5 text-[#B87314]" />
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
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold bg-[#B87314] text-[#FFFDF7]">
                  <User className="w-4 h-4" />
                </div>
              ) : (
                <PanditJiIcon size={28} />
              )}

              <div
                className={`max-w-[88%] sm:max-w-[85%] rounded-2xl p-3.5 sm:p-4 text-sm sm:text-base leading-relaxed ${
                  isUser
                    ? 'bg-[#F3E8D2] dark:bg-[#2A1F16] text-[#231A12] dark:text-[#FFFDF7] border border-[#D8C39E] dark:border-[#443525]'
                    : 'bg-[#FFFDF7] dark:bg-[#1A140E] text-[#231A12] dark:text-[#FAF4E6] border border-[#E4D5B7] dark:border-[#443525] shadow-sm'
                }`}
              >
                {isUser ? (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                ) : (
                  renderFormattedContent(
                    index === 0 &&
                      (msg.content === 'नमस्ते! मैं Gemini Astro हूँ। आप क्या मार्गदर्शन चाहते हैं?' ||
                        msg.content === 'Namaste! I am Gemini Astro. What guidance do you seek?' ||
                        msg.content === 'Namaste! I am Gemini Astro. How may I guide you today?')
                      ? language === 'hi'
                        ? 'नमस्ते! मैं Gemini Astro हूँ। आप क्या मार्गदर्शन चाहते हैं?'
                        : 'Namaste! I am Gemini Astro. How may I guide you today?'
                      : msg.content,
                    (q) => handleSend(q)
                  )
                )}
                <div
                  suppressHydrationWarning
                  className={`text-[10.5px] sm:text-xs mt-1.5 ${
                    isUser ? 'text-[#8A7967]' : 'text-[#8A7967]'
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

        {streamingText && (
          <div className="flex items-start gap-3 animate-fade-in">
            <PanditJiIcon size={28} />
            <div className="max-w-[88%] sm:max-w-[85%] rounded-2xl p-3.5 sm:p-4 text-sm sm:text-base leading-relaxed bg-[#FFFDF7] dark:bg-[#1A140E] text-[#231A12] dark:text-[#FAF4E6] border border-[#E4D5B7] dark:border-[#443525] shadow-sm">
              <div className="whitespace-pre-wrap">{streamingText}</div>
              <span className="inline-block w-1.5 h-3 ml-1 bg-[#B87314] animate-pulse rounded-full align-middle" />
            </div>
          </div>
        )}

        {isLoading && !streamingText && (
          <div className="flex items-start gap-3 animate-fade-in">
            <PanditJiIcon size={28} />
            <div className="bg-[#FFFDF7] dark:bg-[#1A140E] rounded-2xl p-3 sm:p-3.5 text-xs sm:text-sm text-[#5C4D3C] dark:text-[#D8C39E] flex items-center gap-2 border border-[#E4D5B7] dark:border-[#443525]">
              <Sparkles className="w-4 h-4 text-[#B87314] animate-spin" />
              <span>{language === 'hi' ? 'Gemini Astro गणना कर रहे हैं...' : 'Gemini Astro is evaluating kundli coordinates...'}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Sticky Mobile Input Bar with Debouncing & 44px Touch Targets */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="sticky bottom-0 z-20 p-2.5 sm:p-3 border-t border-[#E4D5B7] dark:border-[#443525] flex items-center gap-2 bg-[#FFFDF7]/95 dark:bg-[#1A140E]/95 backdrop-blur-md"
      >
        <button
          type="button"
          disabled={isLoading}
          onClick={toggleSpeechRecognition}
          title={isListening ? 'Stop listening' : 'Start voice input'}
          className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border transition disabled:opacity-50 ${
            isListening
              ? 'bg-[#C2592B] text-white border-[#C2592B] animate-pulse'
              : 'bg-[#FFFDF7] dark:bg-[#231A12] text-[#5C4D3C] dark:text-[#D8C39E] border-[#E4D5B7] dark:border-[#443525] hover:text-[#B87314]'
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          ref={chatInputRef}
          type="text"
          value={inputMessage}
          autoFocus
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
          className="flex-1 min-h-[44px] px-3.5 sm:px-4 py-2.5 rounded-xl bg-[#FFFDF7] dark:bg-[#231A12] border border-[#E4D5B7] dark:border-[#443525] text-base sm:text-xs text-[#231A12] dark:text-[#FFFDF7] placeholder:text-[#8A7967] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition"
        />

        <button
          type="submit"
          disabled={!inputMessage.trim() || isLoading}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-[#B87314] hover:bg-[#9A5E0D] text-[#FFFDF7] font-bold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-[#B87314]/25"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
