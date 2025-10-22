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
        isActive: true, // 기본값으로 활성 상태 설정
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

  // 모든 활성 프로필 조회 (isActive가 true이거나 undefined인 것들)
  async getAllProfiles() {
    try {
      console.log("프로필 목록 조회 시작");
      const querySnapshot = await getDocs(
        query(collection(db, "profiles"), orderBy("createdAt", "desc"))
      );
      const profiles = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((profile) => profile.isActive !== false); // isActive가 false가 아닌 것만
      console.log("조회된 활성 프로필 수:", profiles.length);
      return profiles;
    } catch (error) {
      console.error("프로필 조회 오류:", error);
      if (error.name === "AbortError") {
        throw new Error("네트워크 연결이 중단되었습니다. 다시 시도해주세요.");
      }
      throw error;
    }
  },

  // 모든 프로필 조회 (삭제된 것 포함)
  async getAllProfilesIncludingDeleted() {
    try {
      console.log("모든 프로필 조회 시작 (삭제된 것 포함)");
      const querySnapshot = await getDocs(
        query(collection(db, "profiles"), orderBy("createdAt", "desc"))
      );
      console.log("조회된 전체 프로필 수:", querySnapshot.docs.length);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("전체 프로필 조회 오류:", error);
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

  // 프로필 소프트 삭제 (isActive를 false로 설정)
  async deleteProfile(profileId) {
    try {
      const docRef = doc(db, "profiles", profileId);
      await updateDoc(docRef, {
        isActive: false,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log("프로필 소프트 삭제 완료:", profileId);
    } catch (error) {
      console.error("프로필 삭제 오류:", error);
      throw error;
    }
  },

  // 프로필 복원 (isActive를 true로 설정)
  async restoreProfile(profileId) {
    try {
      const docRef = doc(db, "profiles", profileId);
      await updateDoc(docRef, {
        isActive: true,
        restoredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log("프로필 복원 완료:", profileId);
    } catch (error) {
      console.error("프로필 복원 오류:", error);
      throw error;
    }
  },

  // 프로필 완전 삭제 (실제 데이터 삭제)
  async permanentDeleteProfile(profileId) {
    try {
      const docRef = doc(db, "profiles", profileId);
      await deleteDoc(docRef);
      console.log("프로필 완전 삭제 완료:", profileId);
    } catch (error) {
      console.error("프로필 완전 삭제 오류:", error);
      throw error;
    }
  },

  // 하위 컬렉션의 모든 문서 삭제 헬퍼 함수
  async deleteSubcollection(profileId, subcollectionName) {
    try {
      const subcollectionRef = collection(
        db,
        "profiles",
        profileId,
        subcollectionName
      );
      const snapshot = await getDocs(subcollectionRef);

      if (snapshot.empty) {
        console.log(`${subcollectionName} 하위 컬렉션이 비어있습니다.`);
        return 0;
      }

      const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      console.log(
        `${subcollectionName} 하위 컬렉션 삭제 완료:`,
        snapshot.docs.length,
        "개"
      );
      return snapshot.docs.length;
    } catch (error) {
      console.error(`${subcollectionName} 하위 컬렉션 삭제 오류:`, error);
      throw error;
    }
  },

  // 프로필과 모든 관련 데이터 완전 삭제 (하위 컬렉션 포함)
  async deleteProfileWithAllData(profileId) {
    try {
      console.log("프로필 및 모든 관련 데이터 삭제 시작:", profileId);

      // 하위 컬렉션들 삭제
      const subcollections = [
        "incomes",
        "expenses",
        "savings",
        "pensions",
        "realEstates",
        "assets",
        "debts",
      ];

      let totalDeleted = 0;
      for (const subcollectionName of subcollections) {
        try {
          const deletedCount = await this.deleteSubcollection(
            profileId,
            subcollectionName
          );
          totalDeleted += deletedCount;
        } catch (error) {
          console.warn(`${subcollectionName} 하위 컬렉션 삭제 실패:`, error);
          // 개별 하위 컬렉션 삭제 실패해도 계속 진행
        }
      }

      // 마지막으로 프로필 문서 삭제
      const profileRef = doc(db, "profiles", profileId);
      await deleteDoc(profileRef);
      console.log("프로필 문서 삭제 완료:", profileId);

      console.log(
        `프로필 및 모든 관련 데이터 삭제 완료: ${totalDeleted}개 문서 삭제됨`
      );
    } catch (error) {
      console.error("프로필 및 관련 데이터 삭제 오류:", error);
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

// 지출 데이터 서비스
export const expenseService = {
  // 지출 데이터 생성
  async createExpense(profileId, expenseData) {
    try {
      const docRef = await addDoc(
        collection(db, "profiles", profileId, "expenses"),
        {
          ...expenseData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
      return { id: docRef.id, ...expenseData };
    } catch (error) {
      console.error("지출 데이터 생성 오류:", error);
      throw error;
    }
  },

  // 지출 데이터 목록 조회
  async getExpenses(profileId) {
    try {
      const q = query(
        collection(db, "profiles", profileId, "expenses"),
        orderBy("createdAt", "asc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("지출 데이터 조회 오류:", error);
      throw error;
    }
  },

  // 지출 데이터 조회
  async getExpense(profileId, expenseId) {
    try {
      const docRef = doc(db, "profiles", profileId, "expenses", expenseId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error("지출 데이터 조회 오류:", error);
      throw error;
    }
  },

  // 지출 데이터 업데이트
  async updateExpense(profileId, expenseId, updateData) {
    try {
      const docRef = doc(db, "profiles", profileId, "expenses", expenseId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("지출 데이터 업데이트 오류:", error);
      throw error;
    }
  },

  // 지출 데이터 삭제
  async deleteExpense(profileId, expenseId) {
    try {
      const docRef = doc(db, "profiles", profileId, "expenses", expenseId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("지출 데이터 삭제 오류:", error);
      throw error;
    }
  },
};

// 저축 데이터 서비스
export const savingsService = {
  // 저축 데이터 생성
  async createSaving(profileId, savingData) {
    try {
      const docRef = await addDoc(
        collection(db, "profiles", profileId, "savings"),
        {
          ...savingData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
      return { id: docRef.id, ...savingData };
    } catch (error) {
      console.error("저축 데이터 생성 오류:", error);
      throw error;
    }
  },

  // 저축 데이터 조회 (전체)
  async getSavings(profileId) {
    try {
      const querySnapshot = await getDocs(
        collection(db, "profiles", profileId, "savings")
      );
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("저축 데이터 조회 오류:", error);
      throw error;
    }
  },

  // 저축 데이터 조회 (단일)
  async getSaving(profileId, savingId) {
    try {
      const docRef = doc(db, "profiles", profileId, "savings", savingId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error("저축 데이터 조회 오류:", error);
      throw error;
    }
  },

  // 저축 데이터 업데이트
  async updateSaving(profileId, savingId, updateData) {
    try {
      const docRef = doc(db, "profiles", profileId, "savings", savingId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("저축 데이터 업데이트 오류:", error);
      throw error;
    }
  },

  // 저축 데이터 삭제
  async deleteSaving(profileId, savingId) {
    try {
      const docRef = doc(db, "profiles", profileId, "savings", savingId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("저축 데이터 삭제 오류:", error);
      throw error;
    }
  },
};

/**
 * 연금 관련 서비스
 */
export const pensionService = {
  // 연금 데이터 생성
  async createPension(profileId, pensionData) {
    try {
      const docRef = await addDoc(
        collection(db, "profiles", profileId, "pensions"),
        {
          ...pensionData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
      return docRef.id;
    } catch (error) {
      console.error("연금 데이터 생성 오류:", error);
      throw error;
    }
  },

  // 연금 데이터 목록 조회
  async getPensions(profileId) {
    try {
      const q = query(
        collection(db, "profiles", profileId, "pensions"),
        orderBy("createdAt", "asc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("연금 데이터 조회 오류:", error);
      throw error;
    }
  },

  // 연금 데이터 단건 조회
  async getPension(profileId, pensionId) {
    try {
      const docRef = doc(db, "profiles", profileId, "pensions", pensionId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error("연금 데이터 조회 오류:", error);
      throw error;
    }
  },

  // 연금 데이터 수정
  async updatePension(profileId, pensionId, updateData) {
    try {
      const docRef = doc(db, "profiles", profileId, "pensions", pensionId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("연금 데이터 업데이트 오류:", error);
      throw error;
    }
  },

  // 연금 데이터 삭제
  async deletePension(profileId, pensionId) {
    try {
      const docRef = doc(db, "profiles", profileId, "pensions", pensionId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("연금 데이터 삭제 오류:", error);
      throw error;
    }
  },
};

/**
 * 자산 데이터 관련 서비스
 */
export const assetService = {
  // 자산 데이터 생성
  async createAsset(profileId, assetData) {
    try {
      const docRef = await addDoc(
        collection(db, "profiles", profileId, "assets"),
        {
          ...assetData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
      return docRef.id;
    } catch (error) {
      console.error("자산 데이터 생성 오류:", error);
      throw error;
    }
  },

  // 자산 목록 조회
  async getAssets(profileId) {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, "profiles", profileId, "assets"),
          orderBy("createdAt", "desc")
        )
      );
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("자산 목록 조회 오류:", error);
      throw error;
    }
  },

  // 자산 조회
  async getAsset(profileId, assetId) {
    try {
      const docRef = doc(db, "profiles", profileId, "assets", assetId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        throw new Error("자산을 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error("자산 조회 오류:", error);
      throw error;
    }
  },

  // 자산 수정
  async updateAsset(profileId, assetId, assetData) {
    try {
      const docRef = doc(db, "profiles", profileId, "assets", assetId);
      await updateDoc(docRef, {
        ...assetData,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("자산 수정 오류:", error);
      throw error;
    }
  },

  // 자산 삭제
  async deleteAsset(profileId, assetId) {
    try {
      const docRef = doc(db, "profiles", profileId, "assets", assetId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("자산 삭제 오류:", error);
      throw error;
    }
  },
};

// 부동산 데이터 서비스
export const realEstateService = {
  // 부동산 데이터 생성
  async createRealEstate(profileId, realEstateData) {
    try {
      const docRef = await addDoc(
        collection(db, "profiles", profileId, "realEstates"),
        {
          ...realEstateData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
      return docRef.id;
    } catch (error) {
      console.error("부동산 데이터 생성 오류:", error);
      throw error;
    }
  },

  // 부동산 데이터 조회
  async getRealEstates(profileId) {
    try {
      const q = query(
        collection(db, "profiles", profileId, "realEstates"),
        orderBy("createdAt", "asc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("부동산 데이터 조회 오류:", error);
      throw error;
    }
  },

  // 부동산 데이터 단일 조회
  async getRealEstate(profileId, realEstateId) {
    try {
      const docRef = doc(
        db,
        "profiles",
        profileId,
        "realEstates",
        realEstateId
      );
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error("부동산 데이터 단일 조회 오류:", error);
      throw error;
    }
  },

  // 부동산 데이터 업데이트
  async updateRealEstate(profileId, realEstateId, updateData) {
    try {
      const docRef = doc(
        db,
        "profiles",
        profileId,
        "realEstates",
        realEstateId
      );
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("부동산 데이터 업데이트 오류:", error);
      throw error;
    }
  },

  // 부동산 데이터 삭제
  async deleteRealEstate(profileId, realEstateId) {
    try {
      const docRef = doc(
        db,
        "profiles",
        profileId,
        "realEstates",
        realEstateId
      );
      await deleteDoc(docRef);
    } catch (error) {
      console.error("부동산 데이터 삭제 오류:", error);
      throw error;
    }
  },
};

/**
 * 부채 데이터 관련 서비스
 */
export const debtService = {
  // 부채 데이터 생성
  async createDebt(profileId, debtData) {
    try {
      console.log("부채 데이터 생성 시작:", debtData);
      const docRef = await addDoc(
        collection(db, "profiles", profileId, "debts"),
        {
          ...debtData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
      console.log("부채 데이터 생성 성공:", docRef.id);
      return { id: docRef.id, ...debtData };
    } catch (error) {
      console.error("부채 데이터 생성 오류:", error);
      throw new Error(
        "부채 데이터 생성 중 오류가 발생했습니다: " + error.message
      );
    }
  },

  // 프로필의 모든 부채 데이터 조회
  async getDebts(profileId) {
    try {
      console.log("부채 데이터 조회 시작:", profileId);
      const querySnapshot = await getDocs(
        query(
          collection(db, "profiles", profileId, "debts"),
          orderBy("createdAt", "desc")
        )
      );
      console.log("조회된 부채 데이터 수:", querySnapshot.docs.length);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("부채 데이터 조회 오류:", error);
      throw error;
    }
  },

  // 부채 데이터 조회 (단일)
  async getDebt(profileId, debtId) {
    try {
      const docRef = doc(db, "profiles", profileId, "debts", debtId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        throw new Error("부채 데이터를 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error("부채 데이터 조회 오류:", error);
      throw error;
    }
  },

  // 부채 데이터 업데이트
  async updateDebt(profileId, debtId, updateData) {
    try {
      const docRef = doc(db, "profiles", profileId, "debts", debtId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("부채 데이터 업데이트 오류:", error);
      throw error;
    }
  },

  // 부채 데이터 삭제
  async deleteDebt(profileId, debtId) {
    try {
      const docRef = doc(db, "profiles", profileId, "debts", debtId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("부채 데이터 삭제 오류:", error);
      throw error;
    }
  },
};
