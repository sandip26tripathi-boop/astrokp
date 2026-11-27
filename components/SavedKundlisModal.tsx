'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAstrologyStore } from '@/store/useAstrologyStore';
import { SavedKundliRecord } from '@/lib/firestoreService';
import { ChartInput } from '@/types/astrology';
import {
  X,
  User,
  Calendar,
  Clock,
  MapPin,
  Trash2,
  FolderOpen,
  Sparkles,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Phone,
} from 'lucide-react';

interface SavedKundlisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SavedKundlisModal({ isOpen, onClose }: SavedKundlisModalProps) {
  const { user, savedKundlis, deleteSavedKundli, saveCurrentKundli, signInWithGoogle, isLoading } =
    useAuth();
  const { input, setInput, computeChart, language } = useAstrologyStore();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSavingCurrent, setIsSavingCurrent] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setFeedbackNotice(msg);
    setTimeout(() => {
      setFeedbackNotice((curr) => (curr === msg ? null : curr));
    }, 2800);
  };

  const handleLoadChart = (record: SavedKundliRecord) => {
    const loadedInput: ChartInput = {
      name: record.name,
      gender: (record.gender as any) || 'male',
      dateOfBirth: record.dob,
      timeOfBirth: record.tob || '12:00',
      placeName: record.pob || '',
      latitude: Number(record.lat) || 21.90,
      longitude: Number(record.lon) || 77.90,
      timezone: Number(record.timezone) || 5.5,
      whatsapp: record.whatsappNumber || '',
      phone: record.whatsappNumber || '',
      ayanamsa: 'KP_NEW',
      isHorary: false,
      horaryNumber: 1,
      language,
    };

    setInput(loadedInput);
    computeChart(loadedInput);
    onClose();
  };

  const handleDelete = async (record: SavedKundliRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmMsg =
      language === 'hi'
        ? `क्या आप वास्तव में ${record.name} की कुंडली हटाना चाहते हैं?`
        : `Are you sure you want to delete ${record.name}'s Kundli?`;

    if (!window.confirm(confirmMsg)) return;

    setDeletingId(record.id);
    try {
      const ok = await deleteSavedKundli(record.id);
      if (ok) {
        showToast(
          language === 'hi'
            ? `${record.name} की कुंडली हटा दी गई`
            : `Deleted ${record.name}'s chart`
        );
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveCurrentActive = async () => {
    if (!input.dateOfBirth) {
      showToast(
        language === 'hi'
          ? 'वर्तमान कुंडली में जन्मतिथि उपलब्ध नहीं है।'
          : 'Please enter birth details before saving.'
      );
      return;
    }

    setIsSavingCurrent(true);
    try {
      const id = await saveCurrentKundli();
      if (id) {
        showToast(
          language === 'hi'
            ? `✓ ${input.name || 'कुंडली'} आपके खाते में सुरक्षित हो गई!`
            : `✓ ${input.name || 'Kundli'} successfully saved to your vault!`
        );
      }
    } finally {
      setIsSavingCurrent(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#231A12]/80 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-2xl max-h-[88vh] bg-[#FFFDF7] dark:bg-[#1A140E] border-2 border-[#D4AF37] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E4D5B7] dark:border-[#443525] flex items-center justify-between bg-[#F3E8D2]/60 dark:bg-[#231A12]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#B87314] text-[#FFFDF7] flex items-center justify-center font-bold shadow-sm">
              📂
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-serif text-[#231A12] dark:text-[#FFFDF7] flex items-center gap-2">
                {language === 'hi' ? 'मेरी सुरक्षित कुंडलियाँ' : 'My Saved Kundlis'}
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#B87314]/10 text-[#B87314] dark:text-[#D4AF37] border border-[#D4AF37]/50 font-bold">
                  {savedKundlis.length}
                </span>
              </h3>
              <p className="text-[11px] sm:text-xs text-[#5C4D3C] dark:text-[#D8C39E]">
                {language === 'hi'
                  ? 'आपके खाते में सुरक्षित बहु-कुंडली संग्रह'
                  : 'Multi-Chart Account Vault synced with Cloud Firestore'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5C4D3C] hover:text-[#231A12] dark:text-[#D8C39E] dark:hover:text-white hover:bg-[#F3E8D2] dark:hover:bg-[#2A1F16] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert Banner */}
        {feedbackNotice && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 animate-fade-in font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
        )}

        {/* Action bar for logged in users: Save current chart button */}
        {user?.isLoggedIn && input.dateOfBirth && (
          <div className="px-4 pt-3 flex items-center justify-between gap-2">
            <span className="text-xs text-[#5C4D3C] dark:text-[#D8C39E] font-medium truncate">
              {language === 'hi' ? 'सक्रिय कुंडली:' : 'Active Chart:'}{' '}
              <strong className="text-[#231A12] dark:text-[#FFFDF7]">{input.name || 'Native'}</strong> ({input.dateOfBirth})
            </span>
            <button
              type="button"
              onClick={handleSaveCurrentActive}
              disabled={isSavingCurrent}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-[#B87314] hover:bg-[#9A5E0D] text-[#FFFDF7] font-bold text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-70"
            >
              {isSavingCurrent ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Bookmark className="w-3.5 h-3.5" />
              )}
              <span>{language === 'hi' ? 'वर्तमान कुंडली सेव करें' : 'Save Current Chart'}</span>
            </button>
          </div>
        )}

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {!user?.isLoggedIn ? (
            <div className="p-6 sm:p-8 rounded-2xl bg-[#F3E8D2]/40 dark:bg-[#2A1F16]/40 border border-[#E4D5B7] dark:border-[#443525] text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#B87314]/10 border border-[#D4AF37] flex items-center justify-center text-xl">
                🔒
              </div>
              <h4 className="text-sm sm:text-base font-bold text-[#231A12] dark:text-[#FFFDF7]">
                {language === 'hi'
                  ? 'अपनी कुंडलियाँ सुरक्षित रखने हेतु लॉगिन करें'
                  : 'Sign in to access your Kundli Vault'}
              </h4>
              <p className="text-xs text-[#5C4D3C] dark:text-[#D8C39E] max-w-md mx-auto leading-relaxed">
                {language === 'hi'
                  ? 'Google से लॉगिन करके आप अपने परिवार व ग्राहकों की सभी कुंडलियाँ एक ही स्थान पर सुरक्षित रख सकते हैं और कभी भी पुनः लोड कर सकते हैं।'
                  : 'Sign in with Google to safely preserve multiple charts for family and clients in your private account vault.'}
              </p>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await signInWithGoogle();
                  } catch (e) {}
                }}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FFFDF7] dark:bg-[#231A12] border-2 border-[#D4AF37] text-[#231A12] dark:text-[#FFFDF7] font-bold text-xs shadow-md hover:bg-[#F3E8D2] transition active:scale-95"
              >
                <span>Google (Gmail) से लॉगिन करें</span>
              </button>
            </div>
          ) : savedKundlis.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#F3E8D2]/40 dark:bg-[#2A1F16]/40 border border-[#E4D5B7] dark:border-[#443525] text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#B87314]/10 border border-[#D4AF37] flex items-center justify-center text-xl">
                📜
              </div>
              <h4 className="text-sm sm:text-base font-bold text-[#231A12] dark:text-[#FFFDF7]">
                {language === 'hi'
                  ? 'अभी तक कोई कुंडली सेव नहीं है'
                  : 'No saved Kundlis in your vault'}
              </h4>
              <p className="text-xs text-[#5C4D3C] dark:text-[#D8C39E] max-w-sm mx-auto">
                {language === 'hi'
                  ? 'जन्म विवरण फॉर्म में विवरण भरकर ऊपर "वर्तमान कुंडली सेव करें" पर क्लिक करें।'
                  : 'Enter birth details and click "Save Current Chart" to store it here.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {savedKundlis.map((record) => {
                const isCurrentActive =
                  input.dateOfBirth === record.dob &&
                  input.timeOfBirth === record.tob &&
                  input.name?.toLowerCase() === record.name?.toLowerCase();

                return (
                  <div
                    key={record.id}
                    onClick={() => handleLoadChart(record)}
                    className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                      isCurrentActive
                        ? 'bg-[#F3E8D2] dark:bg-[#2A1F16] border-[#B87314] shadow-md'
                        : 'bg-[#FFFDF7] dark:bg-[#231A12] border-[#E4D5B7] dark:border-[#443525] hover:border-[#D4AF37] hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Name & Active Indicator */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <User className="w-4 h-4 text-[#B87314] shrink-0" />
                          <h4 className="font-bold text-sm text-[#231A12] dark:text-[#FFFDF7] truncate">
                            {record.name}
                          </h4>
                        </div>
                        {isCurrentActive && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#B87314] text-[#FFFDF7]">
                            {language === 'hi' ? 'सक्रिय' : 'Active'}
                          </span>
                        )}
                      </div>

                      {/* DOB & TOB */}
                      <div className="space-y-1 text-xs text-[#5C4D3C] dark:text-[#D8C39E] mb-2">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#8A7967]" />
                          <span>{record.dob}</span>
                          <span className="text-[#8A7967]">•</span>
                          <Clock className="w-3.5 h-3.5 text-[#8A7967]" />
                          <span>{record.tob || '12:00'}</span>
                        </div>
                        {record.pob && (
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-[#8A7967] shrink-0" />
                            <span className="truncate">{record.pob}</span>
                          </div>
                        )}
                        {record.whatsappNumber && (
                          <div className="flex items-center gap-1.5 text-[11px] text-[#4A6B53] dark:text-emerald-400">
                            <Phone className="w-3 h-3" />
                            <span>{record.whatsappNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-[#E4D5B7]/60 dark:border-[#443525]/60 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadChart(record);
                        }}
                        className="flex items-center gap-1 text-xs font-bold text-[#B87314] dark:text-[#D4AF37] hover:underline"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>{language === 'hi' ? 'कुंडली लोड करें' : 'Load Chart'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={deletingId === record.id}
                        onClick={(e) => handleDelete(record, e)}
                        title={language === 'hi' ? 'हटाएं' : 'Delete'}
                        className="p-1 rounded-lg text-[#8A7967] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                      >
                        {deletingId === record.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-[#E4D5B7] dark:border-[#443525] bg-[#FAF4E6]/50 dark:bg-[#1A140E]/30 text-center">
          <p className="text-[11px] text-[#8A7967] dark:text-[#A89886]">
            {language === 'hi'
              ? 'कुंडलियाँ Cloud Firestore में स्वचालित रूप से एन्क्रिप्टेड रूप में सुरक्षित रहती हैं।'
              : 'All charts are securely stored & encrypted under your private Google account.'}
          </p>
        </div>
      </div>
    </div>
  );
}
