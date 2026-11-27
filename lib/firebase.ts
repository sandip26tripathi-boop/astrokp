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

function sanitizeEnv(val: string | undefined, fallback: string = ''): string {
  if (!val) return fallback;
  const cleaned = val.trim().replace(/^["']|["']$/g, '');
  return cleaned || fallback;
}

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAhLy09nGt9FL-nBv9JwWZn6nmA23xhZEg',
  authDomain: 'geminiastro-b043e.firebaseapp.com',
  projectId: 'geminiastro-b043e',
  storageBucket: 'geminiastro-b043e.firebasestorage.app',
  messagingSenderId: '239984589273',
  appId: '1:239984589273:web:995dcb2d73dc61d87e45bc',
  measurementId: '',
};

const firebaseConfig = {
  apiKey: sanitizeEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY, DEFAULT_FIREBASE_CONFIG.apiKey),
  authDomain: sanitizeEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, DEFAULT_FIREBASE_CONFIG.authDomain),
  projectId: sanitizeEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, DEFAULT_FIREBASE_CONFIG.projectId),
  storageBucket: sanitizeEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, DEFAULT_FIREBASE_CONFIG.storageBucket),
  messagingSenderId: sanitizeEnv(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, DEFAULT_FIREBASE_CONFIG.messagingSenderId),
  appId: sanitizeEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID, DEFAULT_FIREBASE_CONFIG.appId),
  measurementId: sanitizeEnv(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, DEFAULT_FIREBASE_CONFIG.measurementId),
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
