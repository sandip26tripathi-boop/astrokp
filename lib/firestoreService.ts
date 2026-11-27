/**
 * lib/firestoreService.ts
 * Cloud Firestore Service for VedicWisdom
 * Manages User Profiles, WhatsApp numbers, Kundlis, and Chat history
 */

import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
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

export interface SavedKundliRecord {
  id: string;
  name: string;
  gender?: string;
  dob: string;
  tob: string;
  pob: string;
  lat: number;
  lon: number;
  timezone: number;
  whatsappNumber?: string;
  planetaryData?: any[];
  dashaSummary?: any;
  updatedAt?: any;
}

/**
 * Generates a clean, deterministic document key for multi-kundli deduplication
 * E.g. 'sandeep_19850315_1430'
 */
export function generateKundliId(name: string, dob: string, tob?: string): string {
  const cleanName = (name || 'native').trim().toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 24);
  const cleanDob = (dob || '').trim().replace(/[^0-9]/g, '');
  const cleanTob = (tob || '1200').trim().replace(/[^0-9]/g, '').slice(0, 4);
  return `${cleanName}_${cleanDob}_${cleanTob}` || 'primary';
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
 * Deduplicates charts cleanly by generating an ID from Name + DOB + TOB
 */
export async function saveKundliToFirestore(
  uid: string,
  chartInput: ChartInput,
  kpMatrix?: KPMatrix | null,
  customId?: string
): Promise<string> {
  const db = getFirebaseDb();
  if (!db || !uid || !chartInput.dateOfBirth) return '';

  try {
    const targetId = customId || generateKundliId(chartInput.name, chartInput.dateOfBirth, chartInput.timeOfBirth);
    const kundliRef = doc(db, 'users', uid, 'kundlis', targetId);
    const primaryRef = doc(db, 'users', uid, 'kundlis', 'primary');

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
      id: targetId,
      name: chartInput.name || 'Native',
      gender: chartInput.gender || 'male',
      dob: chartInput.dateOfBirth,
      tob: chartInput.timeOfBirth || '12:00',
      pob: chartInput.placeName || '',
      lat: Number(chartInput.latitude) || 0,
      lon: Number(chartInput.longitude) || 0,
      timezone: Number(chartInput.timezone) || 5.5,
      whatsappNumber: chartInput.whatsapp || chartInput.phone || '',
      planetaryData: planetarySummary,
      dashaSummary,
      updatedAt: serverTimestamp(),
    };

    // Save to the specific unique chart record
    await setDoc(kundliRef, payload, { merge: true });

    // Also update the primary reference for quick single-query recovery
    await setDoc(primaryRef, payload, { merge: true });

    // Also update WhatsApp number on user's parent document if present
    if (payload.whatsappNumber) {
      await saveUserProfileToFirestore(uid, { whatsappNumber: payload.whatsappNumber });
    }

    return targetId;
  } catch (error) {
    console.warn('Firestore saveKundli notice:', error);
    return '';
  }
}

/**
 * Retrieves all saved kundlis for a user from users/{uid}/kundlis
 */
export async function getAllSavedKundlisFromFirestore(uid: string): Promise<SavedKundliRecord[]> {
  const db = getFirebaseDb();
  if (!db || !uid) return [];

  try {
    const kundlisRef = collection(db, 'users', uid, 'kundlis');
    const kundliQuery = query(kundlisRef, orderBy('updatedAt', 'desc'), limit(50));
    const snapshot = await getDocs(kundliQuery);

    const list: SavedKundliRecord[] = [];
    const seenSignatures = new Set<string>();

    snapshot.forEach((docItem) => {
      // Ignore the 'primary' shadow doc if the dedicated unique doc is present
      if (docItem.id === 'primary') return;

      const data = docItem.data();
      const sig = `${(data.name || '').toLowerCase()}_${data.dob}_${data.tob}`;
      if (seenSignatures.has(sig)) return;
      seenSignatures.add(sig);

      list.push({
        id: docItem.id,
        name: data.name || 'Native',
        gender: data.gender || 'male',
        dob: data.dob || '',
        tob: data.tob || '',
        pob: data.pob || '',
        lat: Number(data.lat) || 0,
        lon: Number(data.lon) || 0,
        timezone: Number(data.timezone) || 5.5,
        whatsappNumber: data.whatsappNumber || '',
        planetaryData: data.planetaryData,
        dashaSummary: data.dashaSummary,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null,
      });
    });

    // If list is empty but 'primary' exists, include primary
    if (list.length === 0) {
      const primaryDoc = snapshot.docs.find((d) => d.id === 'primary');
      if (primaryDoc) {
        const data = primaryDoc.data();
        if (data.dob) {
          list.push({
            id: 'primary',
            name: data.name || 'Native',
            gender: data.gender || 'male',
            dob: data.dob || '',
            tob: data.tob || '',
            pob: data.pob || '',
            lat: Number(data.lat) || 0,
            lon: Number(data.lon) || 0,
            timezone: Number(data.timezone) || 5.5,
            whatsappNumber: data.whatsappNumber || '',
            planetaryData: data.planetaryData,
            dashaSummary: data.dashaSummary,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null,
          });
        }
      }
    }

    return list;
  } catch (error) {
    console.warn('Firestore getAllSavedKundlis error:', error);
    return [];
  }
}

/**
 * Deletes a specific saved Kundli from users/{uid}/kundlis/{kundliId}
 */
export async function deleteKundliFromFirestore(uid: string, kundliId: string): Promise<boolean> {
  const db = getFirebaseDb();
  if (!db || !uid || !kundliId) return false;

  try {
    const kundliRef = doc(db, 'users', uid, 'kundlis', kundliId);
    await deleteDoc(kundliRef);
    return true;
  } catch (error) {
    console.warn('Firestore deleteKundli error:', error);
    return false;
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
