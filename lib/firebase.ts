import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  Auth,
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let db: Firestore | null = null;

// Safe client-side initialization avoiding duplicate initialization on Next.js SSR / Fast Refresh
function getFirebaseInstances() {
  if (typeof window === 'undefined') {
    return { app: null, auth: null, googleProvider: null, db: null };
  }

  if (!app) {
    try {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      googleProvider = new GoogleAuthProvider();
      googleProvider.setCustomParameters({
        prompt: 'select_account',
      });
    } catch (error) {
      console.warn('Firebase initialization notice:', error);
    }
  }

  return { app, auth, googleProvider, db };
}

export function getFirebaseAuth(): Auth | null {
  return getFirebaseInstances().auth;
}

export function getFirebaseDb(): Firestore | null {
  return getFirebaseInstances().db;
}

export function getGoogleProvider(): GoogleAuthProvider | null {
  return getFirebaseInstances().googleProvider;
}

/**
 * Triggers Google Sign-In with popup, with graceful fallback to redirect if popups are blocked
 */
export async function signInWithGoogle(forceRedirect = false): Promise<FirebaseUser | null> {
  const { auth, googleProvider } = getFirebaseInstances();
  if (!auth || !googleProvider) {
    throw new Error('Firebase Auth is not available on server or unconfigured');
  }

  if (forceRedirect) {
    await signInWithRedirect(auth, googleProvider);
    return null;
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: any) {
    // If popup is blocked by mobile browser or webview, fall back to redirect
    if (
      err?.code === 'auth/popup-blocked' ||
      err?.code === 'auth/operation-not-supported-in-this-environment'
    ) {
      console.warn('Google Sign-In popup blocked; falling back to redirect flow...');
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw err;
  }
}

/**
 * Initiates Google Sign-In with redirect (ideal for mobile webviews)
 */
export async function signInWithGoogleRedirect(): Promise<void> {
  const { auth, googleProvider } = getFirebaseInstances();
  if (!auth || !googleProvider) {
    throw new Error('Firebase Auth is not available on server or unconfigured');
  }
  await signInWithRedirect(auth, googleProvider);
}

/**
 * Checks for a pending redirect sign-in result on page load
 */
export async function checkRedirectResult(): Promise<FirebaseUser | null> {
  const { auth } = getFirebaseInstances();
  if (!auth) return null;
  try {
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch (error) {
    console.warn('Firebase getRedirectResult error:', error);
    throw error;
  }
}

/**
 * Signs out the current Firebase user
 */
export async function signOutFirebaseUser(): Promise<void> {
  const { auth } = getFirebaseInstances();
  if (!auth) return;
  await signOut(auth);
}

/**
 * Attaches a listener for auth state changes
 */
export function subscribeToAuthChanges(callback: (user: FirebaseUser | null) => void) {
  const { auth } = getFirebaseInstances();
  if (!auth) {
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export { app, auth, googleProvider, db };
