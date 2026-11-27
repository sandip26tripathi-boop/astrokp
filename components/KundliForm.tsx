'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAstrologyStore, DEFAULT_CHART_INPUT } from '@/store/useAstrologyStore';
import { t } from '@/lib/i18n';
import { AyanamsaType, ChartInput } from '@/types/astrology';
import TriangleLogo from './TriangleLogo';
import SavedKundlisModal from './SavedKundlisModal';
import { useAuth } from '@/context/AuthContext';
import { generateHorary249Table, HorarySegment } from '@/lib/kp-calculator';
import {
  Compass,
  MapPin,
  Calendar,
  Clock,
  User,
  Sparkles,
  BookOpen,
  Search,
  CheckCircle2,
  Bookmark,
  Loader2,
  Navigation,
  Phone,
} from 'lucide-react';

interface GeoPlaceItem {
  name: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: number;
}

export default function KundliForm() {
  const { input, setInput, computeChart, language, saveCurrentChart, savedCharts, loadSavedChart } =
    useAstrologyStore();
  const { user, savedKundlis, saveCurrentKundli } = useAuth();

  const [localInput, setLocalInput] = useState<ChartInput>({
    ...DEFAULT_CHART_INPUT,
    language,
  });
  const [cityQuery, setCityQuery] = useState(input.placeName || '');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [cityResults, setCityResults] = useState<GeoPlaceItem[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [horarySegments, setHorarySegments] = useState<HorarySegment[]>([]);
  const [showSavedList, setShowSavedList] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [isSavingToVault, setIsSavingToVault] = useState(false);
  const [vaultSuccessNotice, setVaultSuccessNotice] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSuccess, setGeneratedSuccess] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalInput(input);
    setCityQuery(input.placeName || '');
  }, [input]);

  useEffect(() => {
    setHorarySegments(generateHorary249Table());
    // Initial fetch of popular cities
    fetch('/api/geo/search')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCityResults(data);
      })
      .catch(() => {});
  }, []);

  const handleCitySearch = (query: string) => {
    setCityQuery(query);
    setShowCityDropdown(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim() || query.length < 2) {
      return;
    }

    setIsSearchingPlaces(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geo/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setCityResults(data);
          }
        }
      } catch (err) {
        console.error('Place search error:', err);
      } finally {
        setIsSearchingPlaces(false);
      }
    }, 280);
  };

  const selectCity = (city: GeoPlaceItem) => {
    setCityQuery(city.name);
    setLocalInput((prev) => ({
      ...prev,
      placeName: city.name,
      latitude: city.latitude,
      longitude: city.longitude,
      timezone: city.timezone,
    }));
    setShowCityDropdown(false);
  };

  const handleDetectCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(4));
        const lon = parseFloat(pos.coords.longitude.toFixed(4));

        try {
          const res = await fetch(`/api/geo/search?lat=${lat}&lon=${lon}`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              const detected = data[0];
              selectCity(detected);
            } else {
              setLocalInput((prev) => ({
                ...prev,
                placeName: `Current Location (${lat}°N, ${lon}°E)`,
                latitude: lat,
                longitude: lon,
                timezone: 5.5,
              }));
              setCityQuery(`Current Location (${lat}°N, ${lon}°E)`);
            }
          }
        } catch {
          setLocalInput((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lon,
          }));
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        console.warn('Geolocation denied or failed:', err);
        alert('Could not access GPS location. Please allow location permissions or search your city.');
        setIsDetectingLocation(false);
      },
      { timeout: 10000 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localInput.dateOfBirth || !localInput.timeOfBirth || !cityQuery.trim()) {
      alert(
        language === 'hi'
          ? 'कृपया अपनी जन्म तिथि, जन्म समय एवं जन्म स्थान भरें।'
          : 'Please enter Date of Birth, Time of Birth, and Birth Place.'
      );
      return;
    }

    const rawWhatsapp = (localInput.whatsapp || localInput.phone || '').trim();
    const digitsOnly = rawWhatsapp.replace(/\D/g, '');
    if (!digitsOnly || digitsOnly.length < 10) {
      alert(
        language === 'hi'
          ? 'कृपया एक मान्य व्हाट्सएप नंबर (उदा. +91 9876543210) दर्ज करें।'
          : 'Please enter a valid WhatsApp number (e.g. +91 9876543210).'
      );
      return;
    }

    setIsGenerating(true);
    try {
      let activeLat = typeof localInput.latitude === 'string' ? parseFloat(localInput.latitude) : Number(localInput.latitude) || 0;
      let activeLon = typeof localInput.longitude === 'string' ? parseFloat(localInput.longitude) : Number(localInput.longitude) || 0;
      let activeTz = typeof localInput.timezone === 'string' ? parseFloat(localInput.timezone) : Number(localInput.timezone) || 5.5;
      let activePlace = localInput.placeName || cityQuery.trim();

      // Auto-resolve city if typed but not clicked from dropdown
      if (cityResults.length > 0 && cityQuery.trim() && cityQuery.trim().toLowerCase() !== (localInput.placeName || '').trim().toLowerCase()) {
        const found = cityResults.find(c => c.name.toLowerCase().includes(cityQuery.trim().toLowerCase())) || cityResults[0];
        if (found) {
          activeLat = found.latitude;
          activeLon = found.longitude;
          activeTz = found.timezone;
          activePlace = found.name;
          setLocalInput(prev => ({
            ...prev,
            placeName: found.name,
            latitude: found.latitude,
            longitude: found.longitude,
            timezone: found.timezone
          }));
        }
      }

      const parsedInput: ChartInput = {
        ...localInput,
        name: localInput.name.trim() || 'Native',
        whatsapp: (localInput.whatsapp || localInput.phone || '').trim(),
        phone: (localInput.whatsapp || localInput.phone || '').trim(),
        placeName: activePlace,
        latitude: activeLat,
        longitude: activeLon,
        timezone: activeTz,
        horaryNumber: Number(localInput.horaryNumber || 1),
      };
      setInput(parsedInput);
      computeChart(parsedInput);
      setGeneratedSuccess(true);
      setTimeout(() => setGeneratedSuccess(false), 3000);

      // Smoothly scroll to the chart viewer section so user sees the newly calculated kundli
      const chartElem = document.getElementById('chart-viewer-section');
      if (chartElem) {
        chartElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (err) {
      console.error('Error generating chart:', err);
      alert(language === 'hi' ? 'कुंडली गणना में त्रुटि हुई। कृपया इनपुट जांचें।' : 'Error calculating Kundli. Please check inputs.');
    } finally {
      setTimeout(() => setIsGenerating(false), 300);
    }
  };

  const handleSave = async () => {
    saveCurrentChart();
    if (user?.isLoggedIn && localInput.dateOfBirth) {
      setIsSavingToVault(true);
      try {
        const savedId = await saveCurrentKundli(localInput);
        if (savedId) {
          setVaultSuccessNotice(language === 'hi' ? 'खाते में सुरक्षित!' : 'Saved to Vault!');
          setTimeout(() => setVaultSuccessNotice(null), 3000);
        }
      } finally {
        setIsSavingToVault(false);
      }
    } else {
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    }
  };

  const currentHorarySeg = horarySegments.find(
    (s) => s.number === (localInput.horaryNumber || 1)
  );

  return (
    <div className="w-full max-w-full overflow-hidden relative bg-[#FFFDF7] dark:bg-[#231A12] border border-[#E4D5B7] dark:border-[#443525] rounded-2xl p-4 sm:p-6 shadow-sandalwood">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between pb-5 border-b border-[#E4D5B7] dark:border-[#443525] gap-3">
        <div className="flex items-center space-x-3">
          <TriangleLogo size="md" />
          <div>
            <h2 className="text-xl font-bold font-serif text-[#231A12] dark:text-[#FFFDF7] flex items-center gap-2">
              {t('birthDetails', language)}
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F3E8D2] text-[#B87314] dark:bg-[#2A1F16] dark:text-[#D4AF37] border border-[#E4D5B7] dark:border-[#443525] font-semibold">
                Live Geocoding Active
              </span>
            </h2>
            <p className="text-xs text-[#5C4D3C] dark:text-[#D8C39E]">
              High-Precision Placidus Semi-Arc Cusps & Auto-Timezone
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Save Chart Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSavingToVault || !localInput.dateOfBirth}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all disabled:opacity-50 ${
              vaultSuccessNotice
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                : 'bg-[#F3E8D2] hover:bg-[#E4D5B7] text-[#231A12] dark:bg-[#2A1F16] dark:text-[#FFFDF7] border-[#E4D5B7] dark:border-[#443525]'
            }`}
          >
            {isSavingToVault ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#B87314]" />
            ) : vaultSuccessNotice ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <Bookmark className="w-3.5 h-3.5 text-[#B87314]" />
            )}
            <span>
              {vaultSuccessNotice
                ? vaultSuccessNotice
                : savedNotice
                ? (language === 'hi' ? 'सेव हो गया!' : 'Saved!')
                : (language === 'hi' ? 'कुंडली सेव करें' : 'Save Chart')}
            </span>
          </button>

          {/* Saved Kundlis Vault Trigger Button */}
          <button
            type="button"
            onClick={() => setShowVaultModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#FFFDF7] dark:bg-[#2A1F16] hover:bg-[#F3E8D2] dark:hover:bg-[#34261B] text-[#231A12] dark:text-[#FFFDF7] border border-[#D4AF37] transition shadow-sm"
          >
            <span>📂</span>
            <span>
              {language === 'hi' ? 'सेव कुंडलियाँ' : 'Saved Kundlis'} (
              {savedKundlis.length > 0 ? savedKundlis.length : savedCharts.length})
            </span>
          </button>
        </div>
      </div>

      {/* Saved charts drawer */}
      {showSavedList && savedCharts.length > 0 && (
        <div className="my-4 p-3 bg-amber-50 dark:bg-slate-900/90 border border-amber-400/30 rounded-xl">
          <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">
            {t('savedKundlis', language)}:
          </div>
          <div className="flex flex-wrap gap-2">
            {savedCharts.map((sc) => (
              <button
                key={sc.id}
                onClick={() => {
                  loadSavedChart(sc.id);
                  setShowSavedList(false);
                }}
                className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs hover:border-amber-500 transition text-slate-800 dark:text-slate-200"
              >
                {sc.name} ({sc.date})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {/* Name, WhatsApp & Gender */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs sm:text-sm font-semibold text-[#231A12] dark:text-[#FFFDF7] mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#B87314]" />
              {t('fullName', language)}
            </label>
            <input
              type="text"
              required
              value={localInput.name}
              onChange={(e) => setLocalInput({ ...localInput, name: e.target.value })}
              placeholder={language === 'hi' ? 'नाम लिखें (उदा. राहुल शर्मा)' : 'e.g. Rahul Verma'}
              className="w-full px-3.5 py-2.5 text-base sm:text-sm rounded-xl bg-[#FAF4E6]/50 dark:bg-[#1A140E] border border-[#E4D5B7] dark:border-[#443525] text-[#231A12] dark:text-[#FFFDF7] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-[#231A12] dark:text-[#FFFDF7] mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#4A6B53]" />
              <span>{language === 'hi' ? 'व्हाट्सएप नंबर' : 'WhatsApp'}</span>
              <span className="text-[#B87314]">*</span>
            </label>
            <input
              type="tel"
              required
              value={localInput.whatsapp || ''}
              onChange={(e) => {
                const val = e.target.value;
                setLocalInput({ ...localInput, whatsapp: val, phone: val });
              }}
              placeholder={language === 'hi' ? '+91 9876543210' : '+91 9876543210'}
              className="w-full px-3.5 py-2.5 text-base sm:text-sm rounded-xl bg-[#FAF4E6]/50 dark:bg-[#1A140E] border border-[#E4D5B7] dark:border-[#443525] text-[#231A12] dark:text-[#FFFDF7] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] font-mono transition"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-[#231A12] dark:text-[#FFFDF7] mb-1.5">
              {t('gender', language)}
            </label>
            <select
              value={localInput.gender}
              onChange={(e) =>
                setLocalInput({ ...localInput, gender: e.target.value as 'male' | 'female' | 'other' })
              }
              className="w-full px-3.5 py-2.5 text-base sm:text-sm rounded-xl bg-[#FAF4E6]/50 dark:bg-[#1A140E] border border-[#E4D5B7] dark:border-[#443525] text-[#231A12] dark:text-[#FFFDF7] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition"
            >
              <option value="male">{t('male', language)}</option>
              <option value="female">{t('female', language)}</option>
              <option value="other">{t('other', language)}</option>
            </select>
          </div>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-[#231A12] dark:text-[#FFFDF7] mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#B87314]" />
              {t('dateOfBirth', language)}
            </label>
            <input
              type="date"
              required
              value={localInput.dateOfBirth}
              onChange={(e) => setLocalInput({ ...localInput, dateOfBirth: e.target.value })}
              className="w-full px-3.5 py-2.5 text-base sm:text-sm rounded-xl bg-[#FAF4E6]/50 dark:bg-[#1A140E] border border-[#E4D5B7] dark:border-[#443525] text-[#231A12] dark:text-[#FFFDF7] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-[#231A12] dark:text-[#FFFDF7] mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#B87314]" />
              {t('timeOfBirth', language)} (24-Hour)
            </label>
            <input
              type="time"
              required
              step="1"
              value={localInput.timeOfBirth}
              onChange={(e) => setLocalInput({ ...localInput, timeOfBirth: e.target.value })}
              className="w-full px-3.5 py-2.5 text-base sm:text-sm rounded-xl bg-[#FAF4E6]/50 dark:bg-[#1A140E] border border-[#E4D5B7] dark:border-[#443525] text-[#231A12] dark:text-[#FFFDF7] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition"
            />
          </div>
        </div>

        {/* Dynamic Place Autocomplete & GPS Detection */}
        <div className="relative">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs sm:text-sm font-semibold text-[#231A12] dark:text-[#FFFDF7] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#B87314]" />
              {t('birthPlace', language)}
            </label>

            <button
              type="button"
              onClick={handleDetectCurrentLocation}
              disabled={isDetectingLocation}
              className="text-[11px] font-semibold text-[#B87314] hover:text-[#9A5E0D] dark:text-[#D4AF37] flex items-center gap-1 transition"
            >
              {isDetectingLocation ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Locating GPS...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3 h-3" />
                  <span>Use Current GPS Location</span>
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              required
              value={cityQuery}
              onChange={(e) => handleCitySearch(e.target.value)}
              onFocus={() => setShowCityDropdown(true)}
              placeholder={
                language === 'hi'
                  ? 'जन्म स्थान खोजें (उदा. दिल्ली, मुंबई, इंदौर, भोपाल, लखनऊ, लंदन...)'
                  : 'Search ANY city, town or village (e.g. Delhi, Mumbai, London)...'
              }
              className="w-full pl-10 pr-10 py-2.5 text-base sm:text-sm rounded-xl bg-[#FAF4E6]/50 dark:bg-[#1A140E] border border-[#E4D5B7] dark:border-[#443525] text-[#231A12] dark:text-[#FFFDF7] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition"
            />
            <Search className="w-4 h-4 text-[#8A7967] absolute left-3.5 top-3.5" />

            {isSearchingPlaces && (
              <Loader2 className="w-4 h-4 text-[#B87314] animate-spin absolute right-3.5 top-3.5" />
            )}
          </div>

          {/* Autocomplete Dropdown List */}
          {showCityDropdown && cityResults.length > 0 && (
            <div className="absolute z-30 w-full mt-1.5 max-h-56 overflow-y-auto rounded-xl bg-[#FFFDF7] dark:bg-[#231A12] border border-[#E4D5B7] dark:border-[#443525] shadow-2xl py-1 divide-y divide-[#E4D5B7] dark:divide-[#443525]">
              {cityResults.map((city, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => selectCity(city)}
                  className="w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between hover:bg-[#F3E8D2] dark:hover:bg-[#2A1F16] text-[#231A12] dark:text-[#FFFDF7] transition"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#B87314] shrink-0" />
                    <div>
                      <span className="font-semibold text-[#231A12] dark:text-[#FFFDF7] block">
                        {city.name}
                      </span>
                      <span className="text-[10px] text-[#5C4D3C] dark:text-[#D8C39E]">
                        {city.state ? `${city.state}, ` : ''}{city.country}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 font-mono text-[10px] text-[#5C4D3C] dark:text-[#D8C39E]">
                    <div>{city.latitude.toFixed(2)}°N, {city.longitude.toFixed(2)}°E</div>
                    <div className="text-[#B87314] dark:text-[#D4AF37] font-bold">
                      UTC {city.timezone >= 0 ? `+${city.timezone}` : city.timezone}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {/* Active coordinates status badge */}
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#5C4D3C] dark:text-[#D8C39E] font-mono">
            <span>📍 Lat: <strong className="text-[#B87314] dark:text-[#D4AF37]">{Number(localInput.latitude).toFixed(2)}°</strong>, Lon: <strong className="text-[#B87314] dark:text-[#D4AF37]">{Number(localInput.longitude).toFixed(2)}°</strong>, TZ: <strong className="text-[#B87314] dark:text-[#D4AF37]">{Number(localInput.timezone) >= 0 ? `+${localInput.timezone}` : localInput.timezone}</strong></span>
            <span className="text-[10px] text-[#4A6B53] font-semibold flex items-center gap-1">✓ Active Coordinates</span>
          </div>
        </div>

        {/* Lat / Lon / Timezone coordinates preview with manual adjustment */}
        <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-[#F3E8D2]/40 dark:bg-[#1A140E]/60 border border-[#E4D5B7] dark:border-[#443525] text-[11px] text-[#5C4D3C] dark:text-[#D8C39E]">
          <div>
            <span className="text-[#8A7967] block">{t('latitude', language)}</span>
            <input
              type="number"
              step="0.0001"
              value={localInput.latitude}
              onChange={(e) =>
                setLocalInput({ ...localInput, latitude: parseFloat(e.target.value) || 0 })
              }
              className="w-full bg-transparent font-mono text-[#231A12] dark:text-[#D4AF37] font-semibold focus:outline-none"
            />
          </div>
          <div>
            <span className="text-[#8A7967] block">{t('longitude', language)}</span>
            <input
              type="number"
              step="0.0001"
              value={localInput.longitude}
              onChange={(e) =>
                setLocalInput({ ...localInput, longitude: parseFloat(e.target.value) || 0 })
              }
              className="w-full bg-transparent font-mono text-[#231A12] dark:text-[#D4AF37] font-semibold focus:outline-none"
            />
          </div>
          <div>
            <span className="text-[#8A7967] block">{t('timezone', language)}</span>
            <input
              type="number"
              step="0.25"
              value={localInput.timezone}
              onChange={(e) =>
                setLocalInput({ ...localInput, timezone: parseFloat(e.target.value) || 0 })
              }
              className="w-full bg-transparent font-mono text-[#231A12] dark:text-[#D4AF37] font-semibold focus:outline-none"
            />
          </div>
        </div>

        {/* Ayanamsa & Horary Switch */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-[#231A12] dark:text-[#FFFDF7] mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#B87314]" />
              {t('ayanamsa', language)}
            </label>
            <select
              value={localInput.ayanamsa}
              onChange={(e) =>
                setLocalInput({ ...localInput, ayanamsa: e.target.value as AyanamsaType })
              }
              className="w-full px-3.5 py-2.5 text-base sm:text-sm rounded-xl bg-[#FAF4E6]/50 dark:bg-[#1A140E] border border-[#E4D5B7] dark:border-[#443525] text-[#231A12] dark:text-[#FFFDF7] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition"
            >
              <option value="KP_NEW">{t('kpNewAyanamsa', language)}</option>
              <option value="KP_OLD">{t('kpOldAyanamsa', language)}</option>
              <option value="LAHIRI">{t('lahiriAyanamsa', language)}</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs sm:text-sm font-semibold text-[#231A12] dark:text-[#FFFDF7] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#B87314]" />
                {t('horaryToggle', language)}
              </label>
              <input
                type="checkbox"
                checked={localInput.isHorary}
                onChange={(e) => setLocalInput({ ...localInput, isHorary: e.target.checked })}
                className="w-4 h-4 rounded text-[#B87314] focus:ring-[#D4AF37] cursor-pointer"
              />
            </div>

            {localInput.isHorary ? (
              <div className="space-y-1">
                <input
                  type="number"
                  min="1"
                  max="249"
                  value={localInput.horaryNumber || 1}
                  onChange={(e) =>
                    setLocalInput({
                      ...localInput,
                      horaryNumber: Math.min(249, Math.max(1, parseInt(e.target.value, 10) || 1)),
                    })
                  }
                  className="w-full px-3.5 py-2 text-sm rounded-xl bg-[#F3E8D2] border border-[#B87314]/40 text-[#231A12] dark:text-[#FFFDF7] font-semibold focus:outline-none"
                />
                {currentHorarySeg && (
                  <p className="text-[10px] text-[#B87314] dark:text-[#D4AF37] leading-tight">
                    Seed #{currentHorarySeg.number}: Sign {currentHorarySeg.sign} ({currentHorarySeg.signLord}) •
                    Star {currentHorarySeg.star} ({currentHorarySeg.starLord}) • Sub-Lord: <strong>{currentHorarySeg.subLord}</strong>
                  </p>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-[#5C4D3C] dark:text-[#D8C39E] py-2">
                Standard Natal Horoscope calculated from exact Local Mean Time & Placidus Cusps.
              </p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isGenerating}
          className="w-full mt-3 py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base bg-[#B87314] hover:bg-[#9A5E0D] text-[#FFFDF7] shadow-lg shadow-[#B87314]/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-80"
        >
          {isGenerating ? (
            <>
              <Compass className="w-4 h-4 animate-spin" />
              <span>{language === 'hi' ? 'गणना हो रही है...' : 'Calculating Kundli...'}</span>
            </>
          ) : generatedSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-950" />
              <span>{language === 'hi' ? 'कुंडली तैयार हो गई!' : 'Kundli Generated Successfully!'}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{t('generateKundli', language)}</span>
            </>
          )}
        </button>
      </form>

      <SavedKundlisModal isOpen={showVaultModal} onClose={() => setShowVaultModal(false)} />
    </div>
  );
}
