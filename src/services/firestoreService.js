// Firestore 서비스 - 프로필 및 재무 데이터 관리
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  getDoc,
  where,
} from "firebase/firestore";
import { db } from "../libs/firebase.js";

/**
 * 프로필 관련 서비스
 */
export const profileService = {
  // 프로필 생성
  async createProfile(profileData) {
    try {
      console.log("프로필 생성 시작:", profileData);
      const docRef = await addDoc(collection(db, "profiles"), {
        ...profileData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log("프로필 생성 성공:", docRef.id);
      return { id: docRef.id, ...profileData };
    } catch (error) {
      console.error("프로필 생성 오류:", error);
      if (error.code === "unavailable") {
        throw new Error(
          "Firebase 서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요."
        );
      } else if (error.code === "permission-denied") {
        throw new Error("프로필 생성 권한이 없습니다.");
      } else {
        throw new Error("프로필 생성 중 오류가 발생했습니다: " + error.message);
      }
    }
  },

  // 모든 프로필 조회
  async getAllProfiles() {
    try {
      console.log("프로필 목록 조회 시작");
      const querySnapshot = await getDocs(
        query(collection(db, "profiles"), orderBy("createdAt", "desc"))
      );
      console.log("조회된 프로필 수:", querySnapshot.docs.length);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("프로필 조회 오류:", error);
      if (error.name === "AbortError") {
        throw new Error("네트워크 연결이 중단되었습니다. 다시 시도해주세요.");
      }
      throw error;
    }
  },

  // 프로필 조회
  async getProfile(profileId) {
    try {
      console.log("프로필 조회 시작:", profileId);
      const docRef = doc(db, "profiles", profileId);

      // 타임아웃 설정 (10초)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("요청 시간이 초과되었습니다.")),
          10000
        );
      });

      const docSnap = await Promise.race([getDoc(docRef), timeoutPromise]);

      if (docSnap.exists()) {
        console.log("프로필 조회 성공:", docSnap.data());
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        throw new Error("프로필을 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error("프로필 조회 오류:", error);
      if (error.name === "AbortError") {
        console.warn(
          "AbortError 발생 - 요청이 중단되었지만 정상적인 상황일 수 있습니다."
        );
        // AbortError는 무시하고 빈 결과 반환
        return null;
      }
      throw error;
    }
  },

  // 프로필 업데이트
  async updateProfile(profileId, updateData) {
    try {
      const docRef = doc(db, "profiles", profileId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("프로필 업데이트 오류:", error);
      throw error;
    }
  },

  // 프로필 삭제
  async deleteProfile(profileId) {
    try {
      const docRef = doc(db, "profiles", profileId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("프로필 삭제 오류:", error);
      throw error;
    }
  },
};

/**
 * 수입 데이터 관련 서비스
 */
export const incomeService = {
  // 수입 데이터 생성
  async createIncome(profileId, incomeData) {
    try {
      console.log("수입 데이터 생성 시작:", incomeData);
      const docRef = await addDoc(
        collection(db, "profiles", profileId, "incomes"),
        {
          ...incomeData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
      console.log("수입 데이터 생성 성공:", docRef.id);
      return { id: docRef.id, ...incomeData };
    } catch (error) {
      console.error("수입 데이터 생성 오류:", error);
      throw new Error(
        "수입 데이터 생성 중 오류가 발생했습니다: " + error.message
      );
    }
  },

  // 프로필의 모든 수입 데이터 조회
  async getIncomes(profileId) {
    try {
      console.log("수입 데이터 조회 시작:", profileId);
      const querySnapshot = await getDocs(
        query(
          collection(db, "profiles", profileId, "incomes"),
          orderBy("createdAt", "desc")
        )
      );
      console.log("조회된 수입 데이터 수:", querySnapshot.docs.length);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("수입 데이터 조회 오류:", error);
      throw error;
    }
  },

  // 수입 데이터 조회
  async getIncome(profileId, incomeId) {
    try {
      const docRef = doc(db, "profiles", profileId, "incomes", incomeId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        throw new Error("수입 데이터를 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error("수입 데이터 조회 오류:", error);
      throw error;
    }
  },

  // 수입 데이터 업데이트
  async updateIncome(profileId, incomeId, updateData) {
    try {
      const docRef = doc(db, "profiles", profileId, "incomes", incomeId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("수입 데이터 업데이트 오류:", error);
      throw error;
    }
  },

  // 수입 데이터 삭제
  async deleteIncome(profileId, incomeId) {
    try {
      const docRef = doc(db, "profiles", profileId, "incomes", incomeId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("수입 데이터 삭제 오류:", error);
      throw error;
    }
  },
};
