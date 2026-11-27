'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  signInWithGoogle as firebaseSignInWithGoogle,
  signOutFirebaseUser,
  subscribeToAuthChanges,
} from '@/lib/firebase';
import { useAstrologyStore } from '@/store/useAstrologyStore';
import { UserProfile } from '@/types/astrology';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  isLoading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  error: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, loginUser, logoutUser, input } = useAstrologyStore();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync Firebase Auth state
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((fbUser) => {
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
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [loginUser]);

  const signInWithGoogle = async () => {
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

        // Register lead securely in backend
        try {
          await fetch('/api/auth/client-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: cleanName,
              email: cleanEmail,
              phone: fbUser.phoneNumber || undefined,
              birthDetails: {
                dateOfBirth: input.dateOfBirth,
                timeOfBirth: input.timeOfBirth,
                placeName: input.placeName,
                gender: input.gender,
              },
            }),
          });
        } catch (leadErr) {
          // Non-blocking for client experience
          console.warn('Lead logging notification notice:', leadErr);
        }
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      // Don't show cryptic error if user simply closed the popup
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
        isLoading,
        signInWithGoogle,
        signOut,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
