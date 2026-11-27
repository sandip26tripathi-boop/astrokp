'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  signInWithGoogle as firebaseSignInWithGoogle,
  signOutFirebaseUser,
  subscribeToAuthChanges,
} from '@/lib/firebase';
import {
  saveUserProfileToFirestore,
  saveKundliToFirestore,
  loadUserDataFromFirestore,
} from '@/lib/firestoreService';
import { useAstrologyStore } from '@/store/useAstrologyStore';
import { UserProfile } from '@/types/astrology';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  uid: string | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<FirebaseUser | null>;
  signOut: () => Promise<void>;
  error: string | null;
  saveCurrentKundli: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  uid: null,
  isLoading: true,
  signInWithGoogle: async () => null,
  signOut: async () => {},
  error: null,
  saveCurrentKundli: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, loginUser, logoutUser, input, kpMatrix, setInput, computeChart } =
    useAstrologyStore();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync Firebase Auth state
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const cleanName = fbUser.displayName || fbUser.email?.split('@')[0] || 'User';
        const cleanEmail = fbUser.email || '';
        const avatarUrl =
          fbUser.photoURL ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=4285F4`;

        loginUser({
          name: cleanName,
          email: cleanEmail,
          avatar: avatarUrl,
          provider: 'google',
        });

        // 1. Sync User Profile in Firestore
        try {
          await saveUserProfileToFirestore(fbUser.uid, {
            displayName: cleanName,
            email: cleanEmail,
            photoURL: avatarUrl,
            whatsappNumber: input.whatsapp || input.phone || undefined,
          });

          // 2. Load returning user's saved data if birth details in store are empty
          const { profile, latestKundli } = await loadUserDataFromFirestore(fbUser.uid);
          if (latestKundli && !input.dateOfBirth) {
            const restoredInput = {
              name: latestKundli.name || cleanName,
              gender: (latestKundli.gender as any) || 'male',
              dateOfBirth: latestKundli.dob || '',
              timeOfBirth: latestKundli.tob || '',
              placeName: latestKundli.pob || '',
              latitude: Number(latestKundli.lat) || 21.90,
              longitude: Number(latestKundli.lon) || 77.90,
              timezone: Number(latestKundli.timezone) || 5.5,
              whatsapp: latestKundli.whatsappNumber || profile?.whatsappNumber || '',
              phone: latestKundli.whatsappNumber || profile?.whatsappNumber || '',
              ayanamsa: 'KP_NEW' as const,
              isHorary: false,
              horaryNumber: 1,
              language: 'hi' as const,
            };
            setInput(restoredInput);
            computeChart(restoredInput);
          } else if (profile?.whatsappNumber && !input.whatsapp) {
            setInput({ whatsapp: profile.whatsappNumber, phone: profile.whatsappNumber });
          }
        } catch (syncErr) {
          console.warn('Firestore initial sync notice:', syncErr);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [loginUser, input.dateOfBirth, input.whatsapp, input.phone, setInput, computeChart]);

  const saveCurrentKundli = useCallback(async () => {
    if (!firebaseUser?.uid || !input.dateOfBirth) return;
    try {
      await saveKundliToFirestore(firebaseUser.uid, input, kpMatrix);
    } catch (err) {
      console.warn('Save kundli error:', err);
    }
  }, [firebaseUser?.uid, input, kpMatrix]);

  const signInWithGoogle = async (): Promise<FirebaseUser | null> => {
    setError(null);
    setIsLoading(true);
    try {
      const fbUser = await firebaseSignInWithGoogle();
      if (fbUser) {
        const cleanName = fbUser.displayName || fbUser.email?.split('@')[0] || 'User';
        const cleanEmail = fbUser.email || '';
        const avatarUrl =
          fbUser.photoURL ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=4285F4`;

        loginUser({
          name: cleanName,
          email: cleanEmail,
          avatar: avatarUrl,
          provider: 'google',
        });

        // Save profile & current chart to Firestore
        try {
          await saveUserProfileToFirestore(fbUser.uid, {
            displayName: cleanName,
            email: cleanEmail,
            photoURL: avatarUrl,
            whatsappNumber: input.whatsapp || input.phone || undefined,
          });

          if (input.dateOfBirth) {
            await saveKundliToFirestore(fbUser.uid, input, kpMatrix);
          }
        } catch (fsErr) {
          console.warn('Firestore sign-in sync notice:', fsErr);
        }

        // Register lead securely in backend
        try {
          await fetch('/api/auth/client-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: cleanName,
              email: cleanEmail,
              phone: input.whatsapp || input.phone || fbUser.phoneNumber || undefined,
              birthDetails: {
                dateOfBirth: input.dateOfBirth,
                timeOfBirth: input.timeOfBirth,
                placeName: input.placeName,
                gender: input.gender,
              },
            }),
          });
        } catch (leadErr) {
          console.warn('Lead logging notification notice:', leadErr);
        }

        return fbUser;
      }
      return null;
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError(err.message || 'Google Sign-In failed. Please try again.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      await signOutFirebaseUser();
      logoutUser();
      setFirebaseUser(null);
    } catch (err: any) {
      console.error('Sign out error:', err);
      logoutUser();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        uid: firebaseUser?.uid || null,
        isLoading,
        signInWithGoogle,
        signOut,
        error,
        saveCurrentKundli,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
