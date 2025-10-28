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

  // 프로필과 모든 관련 데이터 완전 삭제 (시뮬레이션 포함)
  async deleteProfileWithAllData(profileId) {
    try {
      console.log("프로필 및 모든 관련 데이터 삭제 시작:", profileId);

      // 먼저 모든 시뮬레이션 조회
      const simulationsRef = collection(
        db,
        "profiles",
        profileId,
        "simulations"
      );
      const simulationsSnapshot = await getDocs(simulationsRef);

      let totalDeleted = 0;

      // 각 시뮬레이션의 하위 컬렉션 삭제
      for (const simDoc of simulationsSnapshot.docs) {
        const simulationId = simDoc.id;
        console.log(`시뮬레이션 ${simulationId} 데이터 삭제 중...`);

        const subcollections = [
          "incomes",
          "expenses",
          "savings",
          "pensions",
          "realEstates",
          "assets",
          "debts",
        ];

        for (const subcollectionName of subcollections) {
          try {
            const subcollectionRef = collection(
              db,
              "profiles",
              profileId,
              "simulations",
              simulationId,
              subcollectionName
            );
            const snapshot = await getDocs(subcollectionRef);

            if (!snapshot.empty) {
              const deletePromises = snapshot.docs.map((doc) =>
                deleteDoc(doc.ref)
              );
              await Promise.all(deletePromises);
              totalDeleted += snapshot.docs.length;
            }
          } catch (error) {
            console.warn(`${subcollectionName} 하위 컬렉션 삭제 실패:`, error);
          }
        }

        // 시뮬레이션 문서 삭제
        await deleteDoc(simDoc.ref);
        console.log(`시뮬레이션 ${simulationId} 삭제 완료`);
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
 * 모든 수입 데이터는 시뮬레이션 하위에 저장됩니다.
 */
export const incomeService = {
  // 수입 데이터 생성
  async createIncome(profileId, simulationId, incomeData) {
    try {
      console.log("수입 데이터 생성 시작:", incomeData);
      const docRef = await addDoc(
        collection(
          db,
          "profiles",
          profileId,
          "simulations",
          simulationId,
          "incomes"
        ),
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
  async getIncomes(profileId, simulationId) {
    try {
      console.log("수입 데이터 조회 시작:", profileId, simulationId);
      const querySnapshot = await getDocs(
        query(
          collection(
            db,
            "profiles",
            profileId,
            "simulations",
            simulationId,
            "incomes"
          ),
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
  async getIncome(profileId, simulationId, incomeId) {
    try {
      const docRef = doc(
        db,
        "profiles",
        profileId,
        "simulations",
        simulationId,
        "incomes",
        incomeId
      );
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
  async updateIncome(profileId, simulationId, incomeId, updateData) {
    try {
      const docRef = doc(
        db,
        "profiles",
        profileId,
        "simulations",
        simulationId,
        "incomes",
        incomeId
      );
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
  async deleteIncome(profileId, simulationId, incomeId) {
    try {
      const docRef = doc(
        db,
        "profiles",
        profileId,
        "simulations",
        simulationId,
        "incomes",
        incomeId
      );
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
  async createExpense(profileId, simulationId, expenseData) {
    try {
      const docRef = await addDoc(
        collection(
          db,
          "profiles",
          profileId,
          "simulations",
          simulationId,
          "expenses"
        ),
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
  async getExpenses(profileId, simulationId) {
    try {
      const q = query(
        collection(
          db,
          "profiles",
          profileId,
          "simulations",
          simulationId,
          "expenses"
        ),
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
  async getExpense(profileId, simulationId, expenseId) {
    try {
      const docRef = doc(
        db,
        "profiles",
        profileId,
        "simulations",
        simulationId,
        "expenses",
        expenseId
      );
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
  async updateExpense(profileId, simulationId, expenseId, updateData) {
    try {
      const docRef = doc(
        db,
        "profiles",
        profileId,
        "simulations",
        simulationId,
        "expenses",
        expenseId
      );
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
  async deleteExpense(profileId, simulationId, expenseId) {
    try {
      const docRef = doc(
        db,
        "profiles",
        profileId,
        "simulations",
        simulationId,
        "expenses",
        expenseId
      );
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
  async createSaving(profileId, simulationId, savingData) {
    try {
      const docRef = await addDoc(
        collection(
          db,
          "profiles",
          profileId,
          "simulations",
          simulationId,
          "savings"
        ),
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
  async getSavings(profileId, simulationId) {
    try {
      const querySnapshot = await getDocs(
        collection(
          db,
          "profiles",
          profileId,
          "simulations",
          simulationId,
          "savings"
        )
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
  async getSaving(profileId, simulationId, savingId) {
    try {
      const docRef = doc(
        db,
        "profiles",
        profileId,
        "simulations",
        simulationId,
        "savings",
        savingId
      );
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
  async updateSaving(profileId, simulationId, savingId, updateData) {
    try {
      const docRef = doc(
        db,
        "profiles",
        profileId,
        "simulations",
        simulationId,
        "savings",
        savingId
      );
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
  async deleteSaving(profileId, simulationId, savingId) {
    try {
      const docRef = doc(
        db,
        "profiles",
        profileId,
        "simulations",
        simulationId,
        "savings",
        savingId
      );
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
  async createPension(profileId, simulationId, pensionData) {
    try {
      const docRef = await addDoc(
        collection(
          db,
          "profiles",
          profileId,
          "simulations",
          simulationId,
          "pensions"
        ),
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
  async getPensions(profileId, simulationId) {
    try {
      const q = query(
        collection(
          db,
          "profiles",
          profileId,
          "simulations",
          simulationId,
          "pensions"
        ),
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
  async getPension(profileId, simulationId, pensionId) {
    try {
      const docRef = doc(
        db,
        "profiles",
        profileId,
        "simulations",
        simulationId,
        "pensions",
        pensionId
      );
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
  async updatePension(profileId, simulationId, pensionId, updateData) {
    try {
      const docRef = doc(
        db,
        "profiles",
        profileId,
        "simulations",
        simulationId,
        "pensions",
        pensionId
      );
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
  async deletePension(profileId, simulationId, pensionId) {
    try {
      const docRef = doc(
        db,
        "profiles",
        profileId,
        "simulations",
        simulationId,
        "pensions",
        pensionId
      );
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
  async createAsset(profileId, simulationId, assetData) {
    try {
      const docRef = await addDoc(
        collection(
          db,
          "profiles",
          profileId,
          "simulations",
          simulationId,
          "assets"
        ),
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
  async getAssets(profileId, simulationId) {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(
            db,
            "profiles",
            profileId,
            "simulations",
            simulationId,
            "assets"
          ),
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
  async getAsset(profileId, simulationId, assetId) {
    try {
      const docRef = doc(
        db,
        "profiles",
        profileId,
        "simulations",
        simulationId,
        "assets",
        assetId
      );
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
  async updateAsset(profileId, simulationId, assetId, assetData) {
    try {
      const docRef = doc(
        db,
        "profiles",
        profileId,
        "simulations",
        simulationId,
        "assets",
        assetId
      );
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
  async deleteAsset(profileId, simulationId, assetId) {
    try {
      const docRef = doc(
        db,
        "profiles",
        profileId,
        "simulations",
        simulationId,
        "assets",
        assetId
      );
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
  async createRealEstate(profileId, simulationId, realEstateData) {
    try {
      const docRef = await addDoc(
        collection(
          db,
          "profiles",
          profileId,
          "simulations",
          simulationId,
          "realEstates"
        ),
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
  async getRealEstates(profileId, simulationId) {
    try {
      const q = query(
        collection(
          db,
          "profiles",
          profileId,
          "simulations",
          simulationId,
          "realEstates"
        ),
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
  async getRealEstate(profileId, simulationId, realEstateId) {
    try {
      const docRef = doc(
        db,
        "profiles",
        profileId,
        "simulations",
        simulationId,
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
  async updateRealEstate(profileId, simulationId, realEstateId, updateData) {
    try {
      const docRef = doc(
        db,
        "profiles",
        profileId,
        "simulations",
        simulationId,
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
  async deleteRealEstate(profileId, simulationId, realEstateId) {
    try {
      const docRef = doc(
        db,
        "profiles",
        profileId,
        "simulations",
        simulationId,
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
  async createDebt(profileId, simulationId, debtData) {
    try {
      console.log("부채 데이터 생성 시작:", debtData);
      const docRef = await addDoc(
        collection(
          db,
          "profiles",
          profileId,
          "simulations",
          simulationId,
          "debts"
        ),
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
  async getDebts(profileId, simulationId) {
    try {
      console.log("부채 데이터 조회 시작:", profileId, simulationId);
      const querySnapshot = await getDocs(
        query(
          collection(
            db,
            "profiles",
            profileId,
            "simulations",
            simulationId,
            "debts"
          ),
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
  async getDebt(profileId, simulationId, debtId) {
    try {
      const docRef = doc(
        db,
        "profiles",
        profileId,
        "simulations",
        simulationId,
        "debts",
        debtId
      );
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
  async updateDebt(profileId, simulationId, debtId, updateData) {
    try {
      const docRef = doc(
        db,
        "profiles",
        profileId,
        "simulations",
        simulationId,
        "debts",
        debtId
      );
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
  async deleteDebt(profileId, simulationId, debtId) {
    try {
      const docRef = doc(
        db,
        "profiles",
        profileId,
        "simulations",
        simulationId,
        "debts",
        debtId
      );
      await deleteDoc(docRef);
    } catch (error) {
      console.error("부채 데이터 삭제 오류:", error);
      throw error;
    }
  },
};

// 체크리스트 서비스 (프로필 단위 저장)
export const checklistService = {
  // 체크리스트 생성
  async createChecklist(profileId, checklistData) {
    try {
      const docRef = await addDoc(
        collection(db, "profiles", profileId, "checklists"),
        {
          ...checklistData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
      return { id: docRef.id, ...checklistData };
    } catch (error) {
      console.error("체크리스트 생성 오류:", error);
      throw error;
    }
  },

  // 체크리스트 조회 (전체)
  async getChecklists(profileId) {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, "profiles", profileId, "checklists"),
          orderBy("createdAt", "asc")
        )
      );
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("체크리스트 조회 오류:", error);
      throw error;
    }
  },

  // 체크리스트 조회 (단일)
  async getChecklist(profileId, checklistId) {
    try {
      const docRef = doc(db, "profiles", profileId, "checklists", checklistId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error("체크리스트 조회 오류:", error);
      throw error;
    }
  },

  // 체크리스트 업데이트
  async updateChecklist(profileId, checklistId, updateData) {
    try {
      const docRef = doc(db, "profiles", profileId, "checklists", checklistId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("체크리스트 업데이트 오류:", error);
      throw error;
    }
  },

  // 체크리스트 삭제
  async deleteChecklist(profileId, checklistId) {
    try {
      const docRef = doc(db, "profiles", profileId, "checklists", checklistId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("체크리스트 삭제 오류:", error);
      throw error;
    }
  },
};
