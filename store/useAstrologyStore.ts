import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChartInput, GeminiConsultMessage, KPMatrix, Language, UserProfile } from '@/types/astrology';
import { calculateMasterKPMatrix, formatDMS } from '@/lib/astronomyEngine';
import { calculateSignificators, calculateRulingPlanets, calculateVimshottariDasha } from '@/lib/kp-calculator';
import { calculateParsFortuna, evaluateEventChecklist } from '@/lib/kp-evaluator';

// Baseline reference for initial internal matrix calculation
export const BASELINE_CHART_INPUT: ChartInput = {
  name: '',
  gender: 'male',
  dateOfBirth: '1977-07-26',
  timeOfBirth: '15:22',
  placeName: 'Betul, Madhya Pradesh, India',
  latitude: 21.90,
  longitude: 77.90,
  timezone: 5.5,
  ayanamsa: 'KP_NEW',
  isHorary: false,
  horaryNumber: 1,
  language: 'hi',
};

// Default birth chart starts EMPTY as requested so user can enter fresh details
export const DEFAULT_CHART_INPUT: ChartInput = {
  name: '',
  gender: 'male',
  dateOfBirth: '',
  timeOfBirth: '',
  placeName: '',
  latitude: 21.90,
  longitude: 77.90,
  timezone: 5.5,
  ayanamsa: 'KP_NEW',
  isHorary: false,
  horaryNumber: 1,
  language: 'hi',
};

interface AstrologyState {
  input: ChartInput;
  kpMatrix: KPMatrix | null;
  chartStyle: 'north' | 'south';
  language: Language;
  selectedHouse: number | null;
  selectedPlanet: string | null;
  chatMessages: GeminiConsultMessage[];
  savedCharts: { id: string; name: string; date: string; input: ChartInput }[];
  isChatOpen: boolean;
  user: UserProfile | null;

  // Actions
  setInput: (partial: Partial<ChartInput>) => void;
  setChartStyle: (style: 'north' | 'south') => void;
  setLanguage: (lang: Language) => void;
  setSelectedHouse: (house: number | null) => void;
  setSelectedPlanet: (planet: string | null) => void;
  computeChart: (customInput?: ChartInput) => void;
  addChatMessage: (msg: GeminiConsultMessage) => void;
  clearChat: () => void;
  setIsChatOpen: (open: boolean) => void;
  saveCurrentChart: () => void;
  loadSavedChart: (id: string) => void;
  deleteSavedChart: (id: string) => void;
  loginUser: (profile: Partial<UserProfile>) => void;
  logoutUser: () => void;
}

export const useAstrologyStore = create<AstrologyState>()(
  persist(
    (set, get) => ({
      input: DEFAULT_CHART_INPUT,
      kpMatrix: calculateMasterKPMatrix(BASELINE_CHART_INPUT),
      chartStyle: 'north',
      language: 'hi',
      selectedHouse: 1,
      selectedPlanet: null,
      user: null,
      chatMessages: [
        {
          role: 'model',
          content: 'नमस्ते! मैं Gemini Astro हूँ। आप क्या मार्गदर्शन चाहते हैं?',
          timestamp: '2026-01-01T00:00:00.000Z',
        },
      ],
      savedCharts: [],
      isChatOpen: false,

      setInput: (partial) => {
        set((state) => ({ input: { ...state.input, ...partial } }));
      },

      setChartStyle: (style) => set({ chartStyle: style }),
      setLanguage: (lang) => {
        set((state) => ({
          language: lang,
          input: { ...state.input, language: lang },
        }));
      },

      setSelectedHouse: (house) => set({ selectedHouse: house, selectedPlanet: null }),
      setSelectedPlanet: (planet) => set({ selectedPlanet: planet, selectedHouse: null }),

      computeChart: (customInput) => {
        const inp = customInput || get().input;
        try {
          // 1. Immediate local compute so UI never flickers
          const matrix = calculateMasterKPMatrix(inp);
          set({ kpMatrix: matrix, input: inp });

          // 2. High-precision Swiss Ephemeris API call (/api/kundli)
          const dobParts = (inp.dateOfBirth || '1995-10-24').split('-').map(Number);
          const tobParts = (inp.timeOfBirth || '12:00').split(':').map(Number);
          const lat = typeof inp.latitude === 'string' ? parseFloat(inp.latitude) : Number(inp.latitude) || 28.6139;
          const lon = typeof inp.longitude === 'string' ? parseFloat(inp.longitude) : Number(inp.longitude) || 77.2090;
          const tz = typeof inp.timezone === 'string' ? parseFloat(inp.timezone) : Number(inp.timezone) || 5.5;

          const payload = {
            dateStr: inp.dateOfBirth || `${dobParts[0]}-${String(dobParts[1]).padStart(2, '0')}-${String(dobParts[2]).padStart(2, '0')}`,
            timeStr: inp.timeOfBirth || `${String(tobParts[0]).padStart(2, '0')}:${String(tobParts[1]).padStart(2, '0')}:00`,
            year: dobParts[0],
            month: dobParts[1],
            day: dobParts[2],
            hour: tobParts[0],
            minute: tobParts[1],
            second: tobParts[2] || 0,
            timezone: tz,
            lat,
            lon,
            mode: inp.ayanamsa === 'LAHIRI' ? 'LAHIRI' : 'KP'
          };

          fetch('/api/kundli', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.success && data.planets && data.lagna) {
                console.log('Swiss Ephemeris Sync Complete from /api/kundli:', data);
                const currentMatrix = get().kpMatrix;
                if (!currentMatrix) return;

                const nameMap: Record<string, string> = {
                  Surya: 'Sun',
                  Chandra: 'Moon',
                  Mangal: 'Mars',
                  Budh: 'Mercury',
                  Guru: 'Jupiter',
                  Shukra: 'Venus',
                  Shani: 'Saturn',
                  Rahu: 'Rahu',
                  Ketu: 'Ketu'
                };

                // 1. Build updated planets array
                const updatedPlanets = currentMatrix.planets.map((p) => {
                  const sweGrahaKey = Object.keys(nameMap).find((k) => nameMap[k] === p.name);
                  const sweData = (sweGrahaKey && data.planets[sweGrahaKey]) || data.planets[p.name] || null;
                  if (!sweData) return p;

                  const degInSign = sweData.degInSign !== undefined ? sweData.degInSign : (sweData.totalDegree % 30);

                  return {
                    ...p,
                    longitude: sweData.totalDegree,
                    formattedDMS: sweData.dms || p.formattedDMS,
                    signId: sweData.rashiNo || p.signId,
                    signName: sweData.signName || p.signName,
                    hindiSignName: sweData.rashiName || p.hindiSignName,
                    degreeInSign: degInSign,
                    formattedSignDMS: formatDMS(degInSign),
                    isRetrograde: ['Rahu', 'Ketu'].includes(p.name) ? false : (sweData.isRetrograde !== undefined ? sweData.isRetrograde : p.isRetrograde),
                    starLord: sweData.starLord || p.starLord,
                    subLord: sweData.subLord || p.subLord,
                    subSubLord: sweData.subSubLord || p.subSubLord,
                    signLord: sweData.signLord || p.signLord,
                    nakshatraName: sweData.nakshatraName || p.nakshatraName,
                    nakshatraPada: sweData.pada || p.nakshatraPada || 1,
                    houseOccupied: sweData.houseOccupied || sweData.house || p.houseOccupied
                  };
                });

                // 2. Build updated 12 cusps array with exact occupants
                let updatedCusps = currentMatrix.cusps;
                if (Array.isArray(data.cuspsDetail) && data.cuspsDetail.length === 12) {
                  updatedCusps = data.cuspsDetail.map((cd: any, idx: number) => {
                    const houseNum = idx + 1;
                    const degInSign = cd.degInSign !== undefined ? cd.degInSign : (cd.totalDegree % 30);
                    // Find all planets that occupy this house
                    const occupants = updatedPlanets
                      .filter((p) => p.houseOccupied === houseNum)
                      .map((p) => p.name);

                    return {
                      houseNumber: houseNum,
                      longitude: cd.totalDegree,
                      formattedDMS: cd.dms || formatDMS(cd.totalDegree),
                      signId: cd.rashiNo || (Math.floor(cd.totalDegree / 30) + 1),
                      signName: cd.signName || '',
                      hindiSignName: cd.rashiName || '',
                      degreeInSign: degInSign,
                      formattedSignDMS: formatDMS(degInSign),
                      signLord: cd.signLord || '',
                      starLord: cd.starLord || '',
                      starLordIsRetrograde: false,
                      subLord: cd.subLord || '',
                      subSubLord: cd.subSubLord || '',
                      occupants
                    };
                  });
                }

                // 3. 4-Fold Significators Recalculation
                const { houseSignificators, planetSignifications } = calculateSignificators(updatedPlanets, updatedCusps);

                // 4. Exact Vimshottari Dasha with Swiss Ephemeris Moon Longitude
                const moonPlanet = updatedPlanets.find((p) => p.name === 'Moon') || updatedPlanets[1];
                const sunPlanet = updatedPlanets.find((p) => p.name === 'Sun') || updatedPlanets[0];
                const birthDateObj = new Date(Date.UTC(dobParts[0], dobParts[1] - 1, dobParts[2], tobParts[0], tobParts[1]));
                const { tree, current } = calculateVimshottariDasha(moonPlanet.longitude, birthDateObj);

                // 5. Ruling Planets
                const ascDeg = data.lagna ? (data.lagna.totalDegree || data.lagna.longitude) : updatedCusps[0].longitude;
                const rulingPlanets = calculateRulingPlanets(ascDeg, moonPlanet.longitude, birthDateObj.getUTCDay());

                // 6. Pars Fortuna
                const isDayBirth = sunPlanet.houseOccupied >= 7 && sunPlanet.houseOccupied <= 12;
                const rawCuspDegs = updatedCusps.map((c: any) => c.longitude);
                const parsFortuna = calculateParsFortuna(ascDeg, sunPlanet.longitude, moonPlanet.longitude, isDayBirth, rawCuspDegs);

                // 7. Event Checklist
                const eventChecklist = evaluateEventChecklist(updatedCusps, updatedPlanets, planetSignifications, current);

                set({
                  kpMatrix: {
                    ...currentMatrix,
                    ascendant: ascDeg,
                    midheaven: updatedCusps[9] ? updatedCusps[9].longitude : currentMatrix.midheaven,
                    planets: updatedPlanets,
                    cusps: updatedCusps,
                    houseSignificators,
                    planetSignifications,
                    rulingPlanets,
                    currentDasha: current,
                    vimshottariDashaTree: tree,
                    eventChecklist,
                    parsFortuna
                  }
                });
              }
            })
            .catch((apiErr) => {
              console.warn('Notice: Background /api/kundli sync fell back to local engine:', apiErr);
            });
        } catch (err) {
          console.error('Failed to compute real-time KP chart:', err);
          try {
            const matrix = calculateMasterKPMatrix(DEFAULT_CHART_INPUT);
            set({ kpMatrix: matrix, input: DEFAULT_CHART_INPUT });
          } catch (e) {
            console.error('Fallback chart calculation failed:', e);
          }
        }
      },

      addChatMessage: (msg) => {
        set((state) => ({ chatMessages: [...state.chatMessages, msg] }));
      },

      clearChat: () => {
        const lang = get().language;
        set({
          chatMessages: [
            {
              role: 'model',
              content:
                lang === 'hi'
                  ? 'नमस्ते! मैं Gemini Astro हूँ। आप क्या मार्गदर्शन चाहते हैं?'
                  : 'Namaste! I am Gemini Astro. What guidance do you seek?',
              timestamp: new Date().toISOString(),
            },
          ],
        });
      },

      setIsChatOpen: (open) => set({ isChatOpen: open }),

      saveCurrentChart: () => {
        const currentInput = get().input;
        const newEntry = {
          id: `${Date.now()}`,
          name: currentInput.name || 'Untitled Kundli',
          date: `${currentInput.dateOfBirth} ${currentInput.timeOfBirth}`,
          input: currentInput,
        };
        set((state) => ({
          savedCharts: [newEntry, ...state.savedCharts.filter((c) => c.name !== newEntry.name)],
        }));
      },

      loadSavedChart: (id) => {
        const found = get().savedCharts.find((c) => c.id === id);
        if (found) {
          const matrix = calculateMasterKPMatrix(found.input);
          set({ input: found.input, kpMatrix: matrix });
        }
      },

      deleteSavedChart: (id) => {
        set((state) => ({
          savedCharts: state.savedCharts.filter((c) => c.id !== id),
        }));
      },

      loginUser: (profile) => {
        set({
          user: {
            name: profile.name || 'User',
            email: profile.email || 'user@gmail.com',
            avatar: profile.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name || 'User')}`,
            provider: profile.provider || 'google',
            isLoggedIn: true,
          },
        });
      },

      logoutUser: () => {
        set({ user: null });
      },
    }),
    {
      name: 'kp-astrology-session-storage-v5',
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Always ensure birth details start clean and blank on open / refresh
          state.input = { ...DEFAULT_CHART_INPUT, language: state.language || 'hi' };
          try {
            state.kpMatrix = calculateMasterKPMatrix(BASELINE_CHART_INPUT);
          } catch (e) {
            console.warn('Rehydration fallback to baseline chart:', e);
            state.kpMatrix = calculateMasterKPMatrix(BASELINE_CHART_INPUT);
          }
        }
      },
      partialize: (state) => ({
        // DO NOT persist input so refresh/open always starts clean and blank
        chartStyle: state.chartStyle,
        language: state.language,
        savedCharts: state.savedCharts,
        user: state.user,
      }),
    }
  )
);
