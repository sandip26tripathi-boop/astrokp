/**
 * lib/firestoreService.ts
 * Cloud Firestore Service for VedicWisdom
 * Manages User Profiles, WhatsApp numbers, Kundlis, and Chat history
 */

import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import { ChartInput, KPMatrix, GeminiConsultMessage } from '@/types/astrology';

export interface UserProfileData {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  whatsappNumber?: string;
}

/**
 * Saves or merges user profile & WhatsApp number in users/{uid}
 */
export async function saveUserProfileToFirestore(
  uid: string,
  data: Partial<UserProfileData>
): Promise<void> {
  const db = getFirebaseDb();
  if (!db || !uid) return;

  try {
    const userRef = doc(db, 'users', uid);
    const existingSnap = await getDoc(userRef);

    const payload: Record<string, any> = {
      uid,
      lastLoginAt: serverTimestamp(),
    };

    if (data.displayName) payload.displayName = data.displayName;
    if (data.email) payload.email = data.email;
    if (data.photoURL) payload.photoURL = data.photoURL;
    if (data.whatsappNumber) payload.whatsappNumber = data.whatsappNumber;

    if (!existingSnap.exists()) {
      payload.createdAt = serverTimestamp();
    }

    await setDoc(userRef, payload, { merge: true });
  } catch (error) {
    console.warn('Firestore saveUserProfile notice:', error);
  }
}

/**
 * Saves a Kundli birth record in users/{uid}/kundlis/{kundliId}
 */
export async function saveKundliToFirestore(
  uid: string,
  chartInput: ChartInput,
  kpMatrix?: KPMatrix | null,
  kundliId: string = 'primary'
): Promise<void> {
  const db = getFirebaseDb();
  if (!db || !uid) return;

  try {
    const kundliRef = doc(db, 'users', uid, 'kundlis', kundliId);

    // Compress planetary positions to essential fields for fast query & storage
    const planetarySummary = kpMatrix?.planets?.map((p) => ({
      name: p.name,
      sign: p.signName,
      deg: p.degreeInSign,
      starLord: p.starLord,
      subLord: p.subLord,
      house: p.houseOccupied,
      isRetro: p.isRetrograde,
    })) || [];

    const dashaSummary = kpMatrix?.currentDasha ? {
      mahadasha: (kpMatrix.currentDasha.mahadasha as any)?.planet || kpMatrix.currentDasha.mahadasha,
      antardasha: (kpMatrix.currentDasha.antardasha as any)?.planet || kpMatrix.currentDasha.antardasha,
      pratyantardasha: (kpMatrix.currentDasha.pratyantardasha as any)?.planet || kpMatrix.currentDasha.pratyantardasha,
    } : null;

    const payload = {
      name: chartInput.name || 'Native',
      dob: chartInput.dateOfBirth,
      tob: chartInput.timeOfBirth,
      pob: chartInput.placeName,
      lat: Number(chartInput.latitude) || 0,
      lon: Number(chartInput.longitude) || 0,
      timezone: Number(chartInput.timezone) || 5.5,
      whatsappNumber: chartInput.whatsapp || chartInput.phone || '',
      planetaryData: planetarySummary,
      dashaSummary,
      updatedAt: serverTimestamp(),
    };

    await setDoc(kundliRef, payload, { merge: true });

    // Also update WhatsApp number on user's parent document if present
    if (payload.whatsappNumber) {
      await saveUserProfileToFirestore(uid, { whatsappNumber: payload.whatsappNumber });
    }
  } catch (error) {
    console.warn('Firestore saveKundli notice:', error);
  }
}

/**
 * Saves a chat message to users/{uid}/chats subcollection
 */
export async function saveChatMessageToFirestore(
  uid: string,
  message: {
    role: 'user' | 'assistant' | 'model';
    content: string;
    language?: string;
  }
): Promise<void> {
  const db = getFirebaseDb();
  if (!db || !uid || !message.content) return;

  try {
    const chatsRef = collection(db, 'users', uid, 'chats');
    await addDoc(chatsRef, {
      role: message.role === 'assistant' || message.role === 'model' ? 'assistant' : 'user',
      content: message.content,
      language: message.language || 'hi',
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.warn('Firestore saveChatMessage notice:', error);
  }
}

/**
 * Loads user profile, latest saved kundli, and recent chat history for returning user
 */
export async function loadUserDataFromFirestore(uid: string): Promise<{
  profile: any | null;
  latestKundli: any | null;
  chats: GeminiConsultMessage[];
}> {
  const db = getFirebaseDb();
  if (!db || !uid) {
    return { profile: null, latestKundli: null, chats: [] };
  }

  try {
    // 1. Load user profile
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    const profile = userSnap.exists() ? userSnap.data() : null;

    // 2. Load latest kundli
    const kundliRef = doc(db, 'users', uid, 'kundlis', 'primary');
    const kundliSnap = await getDoc(kundliRef);
    const latestKundli = kundliSnap.exists() ? kundliSnap.data() : null;

    // 3. Load recent chat history (ordered by timestamp)
    const chatsRef = collection(db, 'users', uid, 'chats');
    const chatQuery = query(chatsRef, orderBy('timestamp', 'asc'), limit(30));
    const chatSnap = await getDocs(chatQuery);
    const chats: GeminiConsultMessage[] = [];

    chatSnap.forEach((docItem) => {
      const data = docItem.data();
      chats.push({
        role: data.role === 'user' ? 'user' : 'model',
        content: data.content,
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString(),
      });
    });

    return { profile, latestKundli, chats };
  } catch (error) {
    console.warn('Firestore loadUserData notice:', error);
    return { profile: null, latestKundli: null, chats: [] };
  }
}
