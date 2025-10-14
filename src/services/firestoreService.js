// Firestore CRUD 서비스
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  setDoc,
} from "firebase/firestore";
import { db } from "../libs/firebase.js"; // ✅ 중앙 초기화만 사용

// 프로필 관련 서비스
export const profileService = {
  async createProfile(profileData) {
    const docRef = await addDoc(collection(db, "profiles"), {
      ...profileData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async getProfile(profileId) {
    const ref = doc(db, "profiles", profileId);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async updateProfile(profileId, updateData) {
    const ref = doc(db, "profiles", profileId);
    await updateDoc(ref, { ...updateData, updatedAt: serverTimestamp() });
  },

  async deleteProfile(profileId) {
    const ref = doc(db, "profiles", profileId);
    await deleteDoc(ref);
  },

  // onError 콜백 옵션 추가
  subscribeToProfiles(onData, onError) {
    const q = query(collection(db, "profiles"), orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snapshot) => {
        const profiles = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        onData(profiles);
      },
      (err) => {
        console.error("[subscribeToProfiles] onSnapshot error:", err);
        onError && onError(err.message || String(err));
      }
    );
  },
};

// 데이터 항목 관련 서비스
export const dataItemService = {
  async createItem(profileId, category, itemData) {
    const docRef = await addDoc(
      collection(db, "profiles", profileId, category),
      {
        ...itemData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );
    return docRef.id;
  },

  async getItem(profileId, category, itemId) {
    const ref = doc(db, "profiles", profileId, category, itemId);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async updateItem(profileId, category, itemId, updateData) {
    const ref = doc(db, "profiles", profileId, category, itemId);
    await updateDoc(ref, { ...updateData, updatedAt: serverTimestamp() });
  },

  async deleteItem(profileId, category, itemId) {
    const ref = doc(db, "profiles", profileId, category, itemId);
    await deleteDoc(ref);
  },

  async getItems(profileId, category) {
    const q = query(
      collection(db, "profiles", profileId, category),
      orderBy("createdAt", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  subscribeToItems(profileId, category, onData, onError) {
    const q = query(
      collection(db, "profiles", profileId, category),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        onData(items);
      },
      (err) => {
        console.error(`[subscribeToItems:${category}] onSnapshot error:`, err);
        onError && onError(err.message || String(err));
      }
    );
  },
};

// 비율 설정 관련 서비스
export const rateSettingsService = {
  async saveRateSettings(profileId, rateSettings) {
    const ref = doc(db, "profiles", profileId, "settings", "rates");
    await setDoc(
      ref,
      {
        ...rateSettings,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  },

  async getRateSettings(profileId) {
    const ref = doc(db, "profiles", profileId, "settings", "rates");
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  },

  subscribeToRateSettings(profileId, onData, onError) {
    const ref = doc(db, "profiles", profileId, "settings", "rates");
    return onSnapshot(
      ref,
      (snapshot) => {
        const data = snapshot.exists() ? snapshot.data() : null;
        onData(data);
      },
      (err) => {
        console.error("[subscribeToRateSettings] onSnapshot error:", err);
        onError && onError(err.message || String(err));
      }
    );
  },
};
