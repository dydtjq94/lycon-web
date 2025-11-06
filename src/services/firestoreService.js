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
  writeBatch,
  setDoc,
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

  // 삭제된 프로필만 조회 (휴지통)
  async getDeletedProfiles() {
    try {
      console.log("삭제된 프로필 조회 시작");
      const querySnapshot = await getDocs(
        query(collection(db, "profiles"), orderBy("deletedAt", "desc"))
      );
      const deletedProfiles = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((profile) => profile.isActive === false); // isActive가 false인 것만
      console.log("조회된 삭제 프로필 수:", deletedProfiles.length);
      return deletedProfiles;
    } catch (error) {
      console.error("삭제 프로필 조회 오류:", error);
      throw error;
    }
  },

  // 프로필 휴지통으로 이동 (soft delete)
  async moveToTrash(profileId) {
    try {
      console.log("프로필 휴지통 이동:", profileId);
      const docRef = doc(db, "profiles", profileId);
      await updateDoc(docRef, {
        isActive: false,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log("프로필 휴지통 이동 완료:", profileId);
    } catch (error) {
      console.error("프로필 휴지통 이동 오류:", error);
      throw error;
    }
  },

  // 프로필 복구 (휴지통에서 복원)
  async restoreFromTrash(profileId) {
    try {
      console.log("프로필 복구:", profileId);
      const docRef = doc(db, "profiles", profileId);
      await updateDoc(docRef, {
        isActive: true,
        deletedAt: null,
        updatedAt: new Date().toISOString(),
      });
      console.log("프로필 복구 완료:", profileId);
    } catch (error) {
      console.error("프로필 복구 오류:", error);
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

  // 특정 ID로 수입 데이터 생성 (동일 ID 유지 목적)
  async createIncomeWithId(profileId, simulationId, incomeId, incomeData) {
    const incomeRef = doc(
      db,
      "profiles",
      profileId,
      "simulations",
      simulationId,
      "incomes",
      incomeId
    );
    await setDoc(
      incomeRef,
      {
        ...incomeData,
        createdAt: incomeData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return { id: incomeId, ...incomeData };
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

  // 모든 시뮬레이션의 은퇴년도 고정된 소득 항목들의 endYear 업데이트
  async updateFixedIncomesEndYear(profileId, retirementYear) {
    try {
      console.log(
        "고정된 소득 항목들의 endYear 업데이트 시작:",
        profileId,
        retirementYear
      );

      // 모든 시뮬레이션 조회
      const simulationsRef = collection(
        db,
        "profiles",
        profileId,
        "simulations"
      );
      const simulationsSnapshot = await getDocs(simulationsRef);

      let totalUpdated = 0;

      // 각 시뮬레이션의 소득 데이터 조회 및 업데이트
      for (const simDoc of simulationsSnapshot.docs) {
        const simulationId = simDoc.id;
        const incomesRef = collection(
          db,
          "profiles",
          profileId,
          "simulations",
          simulationId,
          "incomes"
        );
        const incomesSnapshot = await getDocs(incomesRef);

        // isFixedToRetirementYear가 true인 소득 항목들 찾기
        const fixedIncomes = incomesSnapshot.docs.filter(
          (doc) => doc.data().isFixedToRetirementYear === true
        );

        // 일괄 업데이트
        if (fixedIncomes.length > 0) {
          const batch = writeBatch(db);

          fixedIncomes.forEach((incomeDoc) => {
            const incomeRef = doc(
              db,
              "profiles",
              profileId,
              "simulations",
              simulationId,
              "incomes",
              incomeDoc.id
            );
            batch.update(incomeRef, {
              endYear: retirementYear,
              updatedAt: new Date().toISOString(),
            });
            totalUpdated++;
          });

          await batch.commit();
          console.log(
            `시뮬레이션 ${simulationId}: ${fixedIncomes.length}개 소득 항목 업데이트 완료`
          );
        }
      }

      console.log(
        `모든 고정된 소득 항목 업데이트 완료: ${totalUpdated}개 항목 업데이트됨`
      );
      return totalUpdated;
    } catch (error) {
      console.error("고정된 소득 항목 업데이트 오류:", error);
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

  // 특정 ID로 지출 데이터 생성 (동일 ID 유지 목적)
  async createExpenseWithId(profileId, simulationId, expenseId, expenseData) {
    const expenseRef = doc(
      db,
      "profiles",
      profileId,
      "simulations",
      simulationId,
      "expenses",
      expenseId
    );
    await setDoc(
      expenseRef,
      {
        ...expenseData,
        createdAt: expenseData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return { id: expenseId, ...expenseData };
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

  // 모든 시뮬레이션의 은퇴년도 고정된 지출 항목들의 endYear 업데이트
  async updateFixedExpensesEndYear(profileId, retirementYear) {
    try {
      console.log(
        "고정된 지출 항목들의 endYear 업데이트 시작:",
        profileId,
        retirementYear
      );

      // 모든 시뮬레이션 조회
      const simulationsRef = collection(
        db,
        "profiles",
        profileId,
        "simulations"
      );
      const simulationsSnapshot = await getDocs(simulationsRef);

      let totalUpdated = 0;

      // 각 시뮬레이션의 지출 데이터 조회 및 업데이트
      for (const simDoc of simulationsSnapshot.docs) {
        const simulationId = simDoc.id;
        const expensesRef = collection(
          db,
          "profiles",
          profileId,
          "simulations",
          simulationId,
          "expenses"
        );
        const expensesSnapshot = await getDocs(expensesRef);

        // isFixedToRetirementYear가 true인 지출 항목들 찾기
        const fixedExpenses = expensesSnapshot.docs.filter(
          (doc) => doc.data().isFixedToRetirementYear === true
        );

        // 일괄 업데이트
        if (fixedExpenses.length > 0) {
          const batch = writeBatch(db);

          fixedExpenses.forEach((expenseDoc) => {
            const expenseRef = doc(
              db,
              "profiles",
              profileId,
              "simulations",
              simulationId,
              "expenses",
              expenseDoc.id
            );
            batch.update(expenseRef, {
              endYear: retirementYear,
              updatedAt: new Date().toISOString(),
            });
            totalUpdated++;
          });

          await batch.commit();
          console.log(
            `시뮬레이션 ${simulationId}: ${fixedExpenses.length}개 지출 항목 업데이트 완료`
          );
        }
      }

      console.log(
        `모든 고정된 지출 항목 업데이트 완료: ${totalUpdated}개 항목 업데이트됨`
      );
      return totalUpdated;
    } catch (error) {
      console.error("고정된 지출 항목 업데이트 오류:", error);
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

  // 특정 ID로 저축 데이터 생성 (동일 ID 유지 목적)
  async createSavingWithId(profileId, simulationId, savingId, savingData) {
    const savingRef = doc(
      db,
      "profiles",
      profileId,
      "simulations",
      simulationId,
      "savings",
      savingId
    );
    await setDoc(
      savingRef,
      {
        ...savingData,
        createdAt: savingData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return { id: savingId, ...savingData };
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

  // 모든 시뮬레이션의 은퇴년도 고정된 저축 항목들의 endYear 업데이트
  async updateFixedSavingsEndYear(profileId, retirementYear) {
    try {
      console.log(
        "고정된 저축 항목들의 endYear 업데이트 시작:",
        profileId,
        retirementYear
      );

      // 모든 시뮬레이션 조회
      const simulationsRef = collection(
        db,
        "profiles",
        profileId,
        "simulations"
      );
      const simulationsSnapshot = await getDocs(simulationsRef);

      let totalUpdated = 0;

      // 각 시뮬레이션의 저축 데이터 조회 및 업데이트
      for (const simDoc of simulationsSnapshot.docs) {
        const simulationId = simDoc.id;
        const savingsRef = collection(
          db,
          "profiles",
          profileId,
          "simulations",
          simulationId,
          "savings"
        );
        const savingsSnapshot = await getDocs(savingsRef);

        // isFixedToRetirementYear가 true인 저축 항목들 찾기
        const fixedSavings = savingsSnapshot.docs.filter(
          (doc) => doc.data().isFixedToRetirementYear === true
        );

        // 일괄 업데이트
        if (fixedSavings.length > 0) {
          const batch = writeBatch(db);

          fixedSavings.forEach((savingDoc) => {
            const savingRef = doc(
              db,
              "profiles",
              profileId,
              "simulations",
              simulationId,
              "savings",
              savingDoc.id
            );
            batch.update(savingRef, {
              endYear: retirementYear,
              updatedAt: new Date().toISOString(),
            });
            totalUpdated++;
          });

          await batch.commit();
          console.log(
            `시뮬레이션 ${simulationId}: ${fixedSavings.length}개 저축 항목 업데이트 완료`
          );
        }
      }

      console.log(
        `모든 고정된 저축 항목 업데이트 완료: ${totalUpdated}개 항목 업데이트됨`
      );
      return totalUpdated;
    } catch (error) {
      console.error("고정된 저축 항목 업데이트 오류:", error);
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

  // 특정 ID로 연금 데이터 생성 (동일 ID 유지 목적)
  async createPensionWithId(profileId, simulationId, pensionId, pensionData) {
    const pensionRef = doc(
      db,
      "profiles",
      profileId,
      "simulations",
      simulationId,
      "pensions",
      pensionId
    );
    await setDoc(
      pensionRef,
      {
        ...pensionData,
        createdAt: pensionData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return { id: pensionId, ...pensionData };
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

  // 모든 시뮬레이션의 은퇴년도 고정된 연금 항목들의 endYear 업데이트
  async updateFixedPensionsEndYear(profileId, retirementYear) {
    try {
      console.log(
        "고정된 연금 항목들의 endYear 업데이트 시작:",
        profileId,
        retirementYear
      );

      // 모든 시뮬레이션 조회
      const simulationsRef = collection(
        db,
        "profiles",
        profileId,
        "simulations"
      );
      const simulationsSnapshot = await getDocs(simulationsRef);

      let totalUpdated = 0;

      // 각 시뮬레이션의 연금 데이터 조회 및 업데이트
      for (const simDoc of simulationsSnapshot.docs) {
        const simulationId = simDoc.id;
        const pensionsRef = collection(
          db,
          "profiles",
          profileId,
          "simulations",
          simulationId,
          "pensions"
        );
        const pensionsSnapshot = await getDocs(pensionsRef);

        // isFixedContributionEndYearToRetirement가 true인 연금 항목들 찾기
        const fixedPensions = pensionsSnapshot.docs.filter(
          (doc) => doc.data().isFixedContributionEndYearToRetirement === true
        );

        // 일괄 업데이트
        if (fixedPensions.length > 0) {
          const batch = writeBatch(db);

          fixedPensions.forEach((pensionDoc) => {
            const pensionRef = doc(
              db,
              "profiles",
              profileId,
              "simulations",
              simulationId,
              "pensions",
              pensionDoc.id
            );
            batch.update(pensionRef, {
              contributionEndYear: retirementYear,
              updatedAt: new Date().toISOString(),
            });
            totalUpdated++;
          });

          await batch.commit();
          console.log(
            `시뮬레이션 ${simulationId}: ${fixedPensions.length}개 연금 항목 업데이트 완료`
          );
        }
      }

      console.log(
        `모든 고정된 연금 항목 업데이트 완료: ${totalUpdated}개 항목 업데이트됨`
      );
      return totalUpdated;
    } catch (error) {
      console.error("고정된 연금 항목 업데이트 오류:", error);
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

  // 특정 ID로 자산 데이터 생성 (동일 ID 유지 목적)
  async createAssetWithId(profileId, simulationId, assetId, assetData) {
    const assetRef = doc(
      db,
      "profiles",
      profileId,
      "simulations",
      simulationId,
      "assets",
      assetId
    );
    await setDoc(
      assetRef,
      {
        ...assetData,
        createdAt: assetData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return { id: assetId, ...assetData };
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

  // 특정 ID로 부동산 데이터 생성 (동일 ID 유지 목적)
  async createRealEstateWithId(
    profileId,
    simulationId,
    realEstateId,
    realEstateData
  ) {
    const realEstateRef = doc(
      db,
      "profiles",
      profileId,
      "simulations",
      simulationId,
      "realEstates",
      realEstateId
    );
    await setDoc(
      realEstateRef,
      {
        ...realEstateData,
        createdAt: realEstateData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return { id: realEstateId, ...realEstateData };
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

  // 특정 ID로 부채 데이터 생성 (동일 ID 유지 목적)
  async createDebtWithId(profileId, simulationId, debtId, debtData) {
    const debtRef = doc(
      db,
      "profiles",
      profileId,
      "simulations",
      simulationId,
      "debts",
      debtId
    );
    await setDoc(
      debtRef,
      {
        ...debtData,
        createdAt: debtData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return { id: debtId, ...debtData };
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

/**
 * 체크리스트 템플릿 서비스
 * Firebase의 checklistTemplates 컬렉션에 전역 템플릿을 저장하고 관리합니다.
 * 관리자만 수정 가능하며, 프로필 생성 시 이 템플릿을 기반으로 체크리스트를 생성합니다.
 */
export const checklistTemplateService = {
  // 체크리스트 템플릿 조회
  async getTemplate() {
    try {
      const querySnapshot = await getDocs(
        collection(db, "checklistTemplates")
      );
      
      // 가장 최신 템플릿 하나만 사용 (createdAt 기준 정렬)
      const templates = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (templates.length === 0) {
        return null;
      }

      // 가장 최신 템플릿 반환
      templates.sort((a, b) => 
        new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
      );
      
      return templates[0];
    } catch (error) {
      console.error("체크리스트 템플릿 조회 오류:", error);
      throw error;
    }
  },

  // 체크리스트 템플릿 생성 (최초 1회)
  async createTemplate(templateData) {
    try {
      const docRef = await addDoc(collection(db, "checklistTemplates"), {
        title: templateData.title || "상담 체크리스트 템플릿",
        items: templateData.items || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return { id: docRef.id, ...templateData };
    } catch (error) {
      console.error("체크리스트 템플릿 생성 오류:", error);
      throw error;
    }
  },

  // 체크리스트 템플릿 업데이트
  async updateTemplate(templateId, templateData) {
    try {
      const docRef = doc(db, "checklistTemplates", templateId);
      await updateDoc(docRef, {
        title: templateData.title,
        items: templateData.items,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("체크리스트 템플릿 업데이트 오류:", error);
      throw error;
    }
  },

  // 기본 템플릿 초기화 (Firebase에 템플릿이 없을 때)
  async initializeDefaultTemplate(defaultItems) {
    try {
      const existing = await this.getTemplate();
      if (existing) {
        console.log("템플릿이 이미 존재합니다:", existing.id);
        return existing;
      }

      console.log("기본 템플릿 생성 중...");
      return await this.createTemplate({
        title: "상담 체크리스트 템플릿",
        items: defaultItems,
      });
    } catch (error) {
      console.error("기본 템플릿 초기화 오류:", error);
      throw error;
    }
  },
};

/**
 * 버전 히스토리 서비스
 * Firebase의 versionHistory 컬렉션에 버전 변경 내역을 저장하고 조회합니다.
 */
export const versionHistoryService = {
  /**
   * 새 버전 정보를 Firebase에 추가
   * @param {Object} versionData - 버전 정보 (version, date, changes)
   */
  async addVersion(versionData) {
    try {
      // 동일한 버전이 이미 있는지 확인
      const existingQuery = query(
        collection(db, "versionHistory"),
        where("version", "==", versionData.version)
      );
      const existingDocs = await getDocs(existingQuery);

      if (!existingDocs.empty) {
        // 이미 존재하는 버전이면 업데이트
        const existingDoc = existingDocs.docs[0];
        await updateDoc(doc(db, "versionHistory", existingDoc.id), {
          ...versionData,
          updatedAt: new Date().toISOString(),
        });
        console.log("버전 정보 업데이트:", versionData.version);
      } else {
        // 새 버전이면 추가
        const docRef = await addDoc(collection(db, "versionHistory"), {
          ...versionData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        console.log("버전 정보 추가:", versionData.version, docRef.id);
      }
    } catch (error) {
      console.error("버전 정보 저장 오류:", error);
      throw error;
    }
  },

  /**
   * 모든 버전 히스토리를 조회 (최신순)
   * @returns {Array} 버전 히스토리 배열
   */
  async getHistory() {
    try {
      const q = query(
        collection(db, "versionHistory"),
        orderBy("date", "desc")
      );
      const querySnapshot = await getDocs(q);
      const history = [];
      querySnapshot.forEach((doc) => {
        history.push({ id: doc.id, ...doc.data() });
      });
      return history;
    } catch (error) {
      console.error("버전 히스토리 조회 오류:", error);
      throw error;
    }
  },

  /**
   * 특정 버전 정보 조회
   * @param {String} version - 버전 문자열
   * @returns {Object|null} 버전 정보 또는 null
   */
  async getVersion(version) {
    try {
      const q = query(
        collection(db, "versionHistory"),
        where("version", "==", version)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data(),
        };
      }
      return null;
    } catch (error) {
      console.error("버전 정보 조회 오류:", error);
      throw error;
    }
  },
};

/**
 * 재무 라이브러리 서비스
 * Firebase의 financialLibrary 컬렉션에 재무 데이터 템플릿을 저장하고 관리합니다.
 * 가족 구성원 타입별로 분류되며, 프로필 생성 시 자동으로 적용될 수 있습니다.
 */
export const financialLibraryService = {
  /**
   * 재무 라이브러리 템플릿 생성
   * @param {Object} templateData - 템플릿 데이터
   * @returns {String} 생성된 문서 ID
   */
  async createTemplate(templateData) {
    try {
      const docRef = await addDoc(collection(db, "financialLibrary"), {
        ...templateData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log("재무 라이브러리 템플릿 생성 완료:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("재무 라이브러리 템플릿 생성 오류:", error);
      throw error;
    }
  },

  /**
   * 재무 라이브러리 템플릿 추가 (createTemplate의 별칭)
   * @param {Object} templateData - 템플릿 데이터
   * @returns {String} 생성된 문서 ID
   */
  async addTemplate(templateData) {
    return this.createTemplate(templateData);
  },

  /**
   * 모든 재무 라이브러리 템플릿 조회
   * @returns {Array} 템플릿 배열
   */
  async getTemplates() {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, "financialLibrary"), orderBy("createdAt", "asc"))
      );
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("재무 라이브러리 템플릿 조회 오류:", error);
      throw error;
    }
  },

  /**
   * 가족 구성원 타입별 템플릿 조회
   * @param {String} familyMemberType - 가족 구성원 타입 (self/spouse/child/parent/common)
   * @returns {Array} 해당 타입의 템플릿 배열
   */
  async getTemplatesByFamilyType(familyMemberType) {
    try {
      const q = query(
        collection(db, "financialLibrary"),
        where("familyMemberType", "==", familyMemberType),
        orderBy("category", "asc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("가족 구성원 타입별 템플릿 조회 오류:", error);
      throw error;
    }
  },

  /**
   * 자동 적용 템플릿 조회 (프로필 생성 시 자동으로 추가되는 템플릿)
   * @returns {Array} autoApply가 true인 템플릿 배열
   */
  async getAutoApplyTemplates() {
    try {
      const q = query(
        collection(db, "financialLibrary"),
        where("autoApply", "==", true)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("자동 적용 템플릿 조회 오류:", error);
      throw error;
    }
  },

  /**
   * 재무 라이브러리 템플릿 수정
   * @param {String} templateId - 템플릿 ID
   * @param {Object} updateData - 수정할 데이터
   */
  async updateTemplate(templateId, updateData) {
    try {
      const docRef = doc(db, "financialLibrary", templateId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: new Date().toISOString(),
      });
      console.log("재무 라이브러리 템플릿 수정 완료:", templateId);
    } catch (error) {
      console.error("재무 라이브러리 템플릿 수정 오류:", error);
      throw error;
    }
  },

  /**
   * 재무 라이브러리 템플릿 삭제
   * @param {String} templateId - 템플릿 ID
   */
  async deleteTemplate(templateId) {
    try {
      const docRef = doc(db, "financialLibrary", templateId);
      await deleteDoc(docRef);
      console.log("재무 라이브러리 템플릿 삭제 완료:", templateId);
    } catch (error) {
      console.error("재무 라이브러리 템플릿 삭제 오류:", error);
      throw error;
    }
  },

  /**
   * 기본 재무 라이브러리 템플릿 초기화
   * Firebase에 기본 템플릿이 없을 때 초기화합니다.
   */
  async initializeDefaultTemplates() {
    try {
      const existing = await this.getTemplates();
      if (existing.length > 0) {
        console.log("재무 라이브러리 템플릿이 이미 존재합니다.");
        return;
      }

      console.log("기본 재무 라이브러리 템플릿 생성 중...");

      // 기본 템플릿 데이터
      const defaultTemplates = [
        // 본인 (self) 관련
        {
          title: "월급여",
          category: "income",
          familyMemberType: "self",
          ageStart: null,
          ageEnd: null,
          autoApply: false,
          data: {
            amount: 300,
            frequency: "monthly",
            growthRate: 3.3,
            memo: "기본 급여",
            originalAmount: 300,
            originalFrequency: "monthly",
          },
        },
        {
          title: "상여금",
          category: "income",
          familyMemberType: "self",
          ageStart: null,
          ageEnd: null,
          autoApply: false,
          data: {
            amount: 2000,
            frequency: "yearly",
            growthRate: 3.3,
            memo: "연간 상여금",
            originalAmount: 2000,
            originalFrequency: "yearly",
          },
        },
        // 자녀 (child) 관련
        {
          title: "대학 등록금",
          category: "expense",
          familyMemberType: "child",
          ageStart: 19,
          ageEnd: 22,
          autoApply: true,
          data: {
            amount: 1000,
            frequency: "yearly",
            growthRate: 2.0,
            memo: "대학 4년 등록금",
          },
        },
        {
          title: "자녀 용돈",
          category: "expense",
          familyMemberType: "child",
          ageStart: 13,
          ageEnd: 18,
          autoApply: false,
          data: {
            amount: 30,
            frequency: "monthly",
            growthRate: 2.0,
            memo: "중고등학생 용돈",
          },
        },
        {
          title: "자녀 결혼자금",
          category: "expense",
          familyMemberType: "child",
          ageStart: 30,
          ageEnd: 30,
          autoApply: false,
          data: {
            amount: 5000,
            frequency: "onetime",
            growthRate: 0,
            memo: "자녀 결혼 지원금",
          },
        },
        {
          title: "자녀 학원비",
          category: "expense",
          familyMemberType: "child",
          ageStart: 7,
          ageEnd: 18,
          autoApply: false,
          data: {
            amount: 50,
            frequency: "monthly",
            growthRate: 2.0,
            memo: "초중고 학원비",
          },
        },
        // 공통 (common) 관련
        {
          title: "생활비",
          category: "expense",
          familyMemberType: "common",
          ageStart: null,
          ageEnd: null,
          autoApply: false,
          data: {
            amount: 200,
            frequency: "monthly",
            growthRate: 1.89,
            memo: "월 생활비",
            isFixedToRetirementYear: false,
          },
        },
        {
          title: "보험료",
          category: "expense",
          familyMemberType: "common",
          ageStart: null,
          ageEnd: null,
          autoApply: false,
          data: {
            amount: 50,
            frequency: "monthly",
            growthRate: 1.89,
            memo: "월 보험료",
            isFixedToRetirementYear: false,
          },
        },
        {
          title: "국민연금",
          category: "pension",
          familyMemberType: "common",
          ageStart: null,
          ageEnd: null,
          autoApply: false,
          data: {
            type: "national",
            monthlyAmount: 150,
            inflationRate: 1.89,
            memo: "국민연금",
          },
        },
      ];

      // 모든 템플릿 생성
      for (const template of defaultTemplates) {
        await this.createTemplate(template);
      }

      console.log("기본 재무 라이브러리 템플릿 생성 완료");
    } catch (error) {
      console.error("기본 재무 라이브러리 템플릿 초기화 오류:", error);
      throw error;
    }
  },
};
