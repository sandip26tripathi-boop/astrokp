'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  moduleName: string;
  title?: string;
  titleHi?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  recoveryAttempts: number;
}

export default class AutoRecoveryBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      recoveryAttempts: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      recoveryAttempts: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Silent diagnostics log
    console.warn(`[AutoRecoveryBoundary:${this.props.moduleName}] Caught crash:`, error, errorInfo);
  }

  handleManualRecover = () => {
    if (this.props.onReset) {
      try {
        this.props.onReset();
      } catch (e) {
        console.warn('Error during boundary reset callback:', e);
      }
    }
    this.setState((prev) => ({
      hasError: false,
      error: null,
      recoveryAttempts: prev.recoveryAttempts + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      const isHi = typeof window !== 'undefined' && localStorage.getItem('language') === 'hi';
      const heading = this.props.title || (isHi ? 'मॉड्यूल पुनः प्रारंभ आवश्यक' : 'Module Auto-Recovery');
      const desc = isHi
        ? 'इस खंड में अप्रत्याशित त्रुटि आई। आपके मुख्य पृष्ठ को सुरक्षित रखते हुए इसे स्वतः पुनर्स्थापित किया जा सकता है।'
        : 'A transient rendering issue occurred in this section. You can auto-recover without reloading the full page.';

      return (
        <div className="w-full my-3 p-4 rounded-xl bg-[#FFFDF7] dark:bg-[#1A140E] border border-[#E4D5B7] dark:border-[#443525] shadow-sandalwood text-center space-y-3 animate-fade-in">
          <div className="inline-flex p-2 rounded-full bg-[#B87314]/15 text-[#B87314] dark:text-[#D4AF37]">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold font-serif text-[#231A12] dark:text-[#FFFDF7]">{heading}</h4>
            <p className="text-xs text-[#5C4D3C] dark:text-[#D8C39E] max-w-md mx-auto mt-1">{desc}</p>
          </div>
          <button
            type="button"
            onClick={this.handleManualRecover}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#B87314] text-[#FFFDF7] hover:bg-[#9A5E0D] shadow-sm transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isHi ? 'पुनः लोड करें (Auto-Recover)' : 'Auto-Recover'}</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
