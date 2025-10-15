import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { calculateKoreanAge, getKoreanAgeInYear } from "../utils/koreanAge";
import { formatAmount } from "../utils/format";
import {
  calculateCashflowSimulation,
  calculateAssetSimulation,
} from "../utils/cashflowSimulator";
import {
  profileService,
  incomeService,
  expenseService,
  savingsService,
} from "../services/firestoreService";
import RechartsCashflowChart from "../components/RechartsCashflowChart";
import RechartsAssetChart from "../components/RechartsAssetChart";
import IncomeModal from "../components/IncomeModal";
import IncomeList from "../components/IncomeList";
import ExpenseModal from "../components/ExpenseModal";
import ExpenseList from "../components/ExpenseList";
import SavingModal from "../components/SavingModal";
import SavingList from "../components/SavingList";
import styles from "./DashboardPage.module.css";

/**
 * 프로필 대시보드 페이지
 * 재무 상담사가 내담자의 재무 상태를 관리하고 시뮬레이션을 확인할 수 있습니다.
 */
function DashboardPage() {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("income");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState("cashflow");
  const [simulationData, setSimulationData] = useState({
    cashflow: [],
    assets: [],
  });
  const [incomes, setIncomes] = useState([]);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [savings, setSavings] = useState([]);
  const [isSavingModalOpen, setIsSavingModalOpen] = useState(false);
  const [editingSaving, setEditingSaving] = useState(null);
  const [sidebarView, setSidebarView] = useState("categories"); // "categories" or "list"

  // 프로필 데이터 로드
  useEffect(() => {
    let isMounted = true; // 컴포넌트가 마운트된 상태인지 확인

    const loadProfile = async () => {
      if (!profileId) return;

      try {
        setLoading(true);
        const profile = await profileService.getProfile(profileId);

        // 컴포넌트가 여전히 마운트된 상태에서만 상태 업데이트
        if (isMounted) {
          if (profile) {
            setProfileData(profile);
            generateSimulationData(profile);
          } else {
            navigate("/");
          }
        }
      } catch (error) {
        console.error("프로필 로드 오류:", error);
        if (isMounted) {
          navigate("/");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    // cleanup 함수로 중복 요청 방지
    return () => {
      isMounted = false;
    };
  }, [profileId, navigate]);

  // 수입 데이터 로드
  useEffect(() => {
    const loadIncomes = async () => {
      if (!profileId) return;

      try {
        const incomeData = await incomeService.getIncomes(profileId);
        // 생성 순서대로 정렬 (createdAt 기준)
        const sortedIncomes = incomeData.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        setIncomes(sortedIncomes);
      } catch (error) {
        console.error("수입 데이터 로드 오류:", error);
      }
    };

    loadIncomes();
  }, [profileId]);

  // 지출 데이터 로드
  useEffect(() => {
    const loadExpenses = async () => {
      if (!profileId) return;

      try {
        const expenseData = await expenseService.getExpenses(profileId);
        // 생성 순서대로 정렬 (createdAt 기준)
        const sortedExpenses = expenseData.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        setExpenses(sortedExpenses);
      } catch (error) {
        console.error("지출 데이터 로드 오류:", error);
      }
    };

    loadExpenses();
  }, [profileId]);

  // 저축 데이터 로드
  useEffect(() => {
    const loadSavings = async () => {
      if (!profileId) return;

      try {
        const savingData = await savingsService.getSavings(profileId);
        // 생성 순서대로 정렬 (createdAt 기준)
        const sortedSavings = savingData.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        setSavings(sortedSavings);
      } catch (error) {
        console.error("저축 데이터 로드 오류:", error);
      }
    };

    loadSavings();
  }, [profileId]);

  // 수입 데이터가 변경될 때마다 시뮬레이션 재계산
  useEffect(() => {
    if (profileData) {
      generateSimulationData(profileData);
    }
  }, [incomes, expenses, savings, profileData]);

  // 시뮬레이션 데이터 생성
  const generateSimulationData = (profileData) => {
    const currentYear = new Date().getFullYear();
    const startAge = profileData.currentKoreanAge;
    const retirementAge = profileData.retirementAge;
    const deathAge = 90;
    const startYear = currentYear;
    const retirementYear = profileData.birthYear + retirementAge - 1;
    const deathYear = profileData.birthYear + deathAge - 1;

    const years = [];
    for (let year = startYear; year <= deathYear; year++) {
      const age = getKoreanAgeInYear(profileData.birthYear, year);
      years.push({ year, age });
    }

    // 실제 수입 데이터를 기반으로 현금흐름 시뮬레이션 계산
    const cashflow = calculateCashflowSimulation(
      profileData,
      incomes,
      expenses, // 지출 데이터 사용
      savings, // 저축 데이터 사용
      [] // 연금 (추후 구현)
    );

    // 자산 시뮬레이션 데이터
    const assets = calculateAssetSimulation(
      profileData,
      incomes,
      expenses,
      savings, // 저축 데이터 사용
      [] // 연금 (추후 구현)
    );

    setSimulationData({ cashflow, assets });
  };

  // 프로필 수정 핸들러
  const handleProfileUpdate = async (field, value) => {
    const updatedProfile = {
      ...profileData,
      [field]: value,
    };

    setProfileData(updatedProfile);

    try {
      await profileService.updateProfile(profileId, updatedProfile);
    } catch (error) {
      console.error("프로필 업데이트 오류:", error);
      alert("프로필 업데이트 중 오류가 발생했습니다.");
    }
  };

  // 프로필 저장
  const handleSaveProfile = async () => {
    try {
      await profileService.updateProfile(profileId, profileData);
      setIsEditingProfile(false);
      alert("프로필이 저장되었습니다!");
    } catch (error) {
      console.error("프로필 저장 오류:", error);
      alert("프로필 저장 중 오류가 발생했습니다.");
    }
  };

  // 사이드바 뷰 핸들러들
  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    setSidebarView("list");
  };

  const handleBackToCategories = () => {
    setSidebarView("categories");
  };

  // 수입 데이터 핸들러들
  const handleAddIncome = () => {
    setEditingIncome(null);
    setIsIncomeModalOpen(true);
  };

  const handleEditIncome = (income) => {
    setEditingIncome(income);
    setIsIncomeModalOpen(true);
  };

  const handleSaveIncome = async (incomeData) => {
    try {
      if (editingIncome) {
        // 수정
        await incomeService.updateIncome(
          profileId,
          editingIncome.id,
          incomeData
        );
        setIncomes(
          incomes.map((income) =>
            income.id === editingIncome.id
              ? { ...income, ...incomeData }
              : income
          )
        );
      } else {
        // 추가
        const newIncome = await incomeService.createIncome(
          profileId,
          incomeData
        );
        setIncomes([...incomes, newIncome]);
      }

      // 시뮬레이션 데이터 재생성
      generateSimulationData(profileData);
    } catch (error) {
      console.error("수입 데이터 저장 오류:", error);
    }
  };

  const handleDeleteIncome = async (incomeId) => {
    if (!window.confirm("이 수입 데이터를 삭제하시겠습니까?")) return;

    try {
      await incomeService.deleteIncome(profileId, incomeId);
      setIncomes(incomes.filter((income) => income.id !== incomeId));

      // 시뮬레이션 데이터 재생성
      generateSimulationData(profileData);
    } catch (error) {
      console.error("수입 데이터 삭제 오류:", error);
    }
  };

  // 지출 핸들러들
  const handleAddExpense = () => {
    setEditingExpense(null);
    setIsExpenseModalOpen(true);
  };

  // 저축 핸들러들
  const handleAddSaving = () => {
    setEditingSaving(null);
    setIsSavingModalOpen(true);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = async (expenseData) => {
    try {
      if (editingExpense) {
        // 수정
        await expenseService.updateExpense(
          profileId,
          editingExpense.id,
          expenseData
        );
        setExpenses(
          expenses.map((expense) =>
            expense.id === editingExpense.id
              ? { ...expense, ...expenseData }
              : expense
          )
        );
      } else {
        // 추가
        const newExpense = await expenseService.createExpense(
          profileId,
          expenseData
        );
        setExpenses([...expenses, newExpense]);
      }

      // 시뮬레이션 데이터 재생성
      generateSimulationData(profileData);
    } catch (error) {
      console.error("지출 데이터 저장 오류:", error);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm("이 지출 데이터를 삭제하시겠습니까?")) return;

    try {
      await expenseService.deleteExpense(profileId, expenseId);
      setExpenses(expenses.filter((expense) => expense.id !== expenseId));

      // 시뮬레이션 데이터 재생성
      generateSimulationData(profileData);
    } catch (error) {
      console.error("지출 데이터 삭제 오류:", error);
    }
  };

  // 저축 저장 핸들러
  const handleSaveSaving = async (savingData) => {
    try {
      if (editingSaving) {
        // 수정
        await savingsService.updateSaving(
          profileId,
          editingSaving.id,
          savingData
        );
        setSavings(
          savings.map((saving) =>
            saving.id === editingSaving.id
              ? { ...saving, ...savingData }
              : saving
          )
        );
        setEditingSaving(null);
      } else {
        // 추가
        const newSaving = await savingsService.createSaving(
          profileId,
          savingData
        );
        setSavings([...savings, newSaving]);
      }

      // 시뮬레이션 데이터 재생성
      generateSimulationData(profileData);
    } catch (error) {
      console.error("저축 데이터 저장 오류:", error);
    }
  };

  // 저축 수정 핸들러
  const handleEditSaving = (saving) => {
    setEditingSaving(saving);
    setIsSavingModalOpen(true);
  };

  // 저축 삭제 핸들러
  const handleDeleteSaving = async (savingId) => {
    if (!window.confirm("이 저축 데이터를 삭제하시겠습니까?")) return;

    try {
      await savingsService.deleteSaving(profileId, savingId);
      setSavings(savings.filter((saving) => saving.id !== savingId));

      // 시뮬레이션 데이터 재생성
      generateSimulationData(profileData);
    } catch (error) {
      console.error("저축 데이터 삭제 오류:", error);
    }
  };

  // 카테고리별 추가 핸들러
  const handleAddData = () => {
    switch (selectedCategory) {
      case "income":
        handleAddIncome();
        break;
      case "expense":
        handleAddExpense();
        break;
      case "savings":
        handleAddSaving();
        break;
      case "pension":
        // TODO: 연금 추가 기능
        alert("연금 추가 기능은 준비 중입니다.");
        break;
      case "assets":
        // TODO: 자산 추가 기능
        alert("자산 추가 기능은 준비 중입니다.");
        break;
      case "debt":
        // TODO: 부채 추가 기능
        alert("부채 추가 기능은 준비 중입니다.");
        break;
      default:
        break;
    }
  };

  // 카테고리별 이름 매핑
  const getCategoryName = (categoryId) => {
    const categoryMap = {
      income: "수입",
      expense: "지출",
      savings: "저축",
      pension: "연금",
      assets: "자산",
      debt: "부채",
    };
    return categoryMap[categoryId] || "데이터";
  };

  // 로딩 상태 처리
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>프로필을 불러오는 중...</div>
      </div>
    );
  }

  // 프로필이 없는 경우
  if (!profileData) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>프로필을 찾을 수 없습니다.</div>
        <button onClick={() => navigate("/")}>목록으로 돌아가기</button>
      </div>
    );
  }

  // 카테고리 설정
  const categories = [
    { id: "income", name: "수입", color: "#10b981", count: incomes.length },
    { id: "expense", name: "지출", color: "#ef4444", count: expenses.length },
    { id: "savings", name: "저축", color: "#3b82f6", count: savings.length },
    { id: "pension", name: "연금", color: "#8b5cf6", count: 0 },
    { id: "assets", name: "자산", color: "#f59e0b", count: 0 },
    { id: "debt", name: "부채", color: "#6b7280", count: 0 },
  ];

  if (!profileData) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>프로필을 찾을 수 없습니다.</div>
        <button onClick={() => navigate("/")}>목록으로 돌아가기</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 상단 프로필 정보 */}
      <div className={styles.profileHeader}>
        <div className={styles.profileInfo}>
          <h1 className={styles.profileName}>
            {profileData.name}님의 은퇴 준비 현황
          </h1>
          <div className={styles.profileDetails}>
            <span className={styles.detailItem}>
              <span className={styles.label}>현재 나이:</span>
              <span className={styles.value}>
                {profileData.currentKoreanAge}세
              </span>
            </span>
            <span className={styles.detailItem}>
              <span className={styles.label}>은퇴 나이:</span>
              <span className={styles.value}>
                {profileData.retirementAge}세
              </span>
            </span>
            <span className={styles.detailItem}>
              <span className={styles.label}>목표 자산:</span>
              <span className={styles.value}>
                {formatAmount(profileData.targetAssets)}
              </span>
            </span>
            <span className={styles.detailItem}>
              <span className={styles.label}>가구 구성:</span>
              <span className={styles.value}>
                {profileData.familyMembers
                  ? profileData.familyMembers.length + 1
                  : 1}
                명
              </span>
            </span>
          </div>
        </div>
        <div className={styles.profileActions}>
          <button
            className={styles.editButton}
            onClick={() => setIsEditingProfile(!isEditingProfile)}
          >
            {isEditingProfile ? "취소" : "수정"}
          </button>
          {isEditingProfile && (
            <button className={styles.saveButton} onClick={handleSaveProfile}>
              저장
            </button>
          )}
          <button className={styles.backButton} onClick={() => navigate("/")}>
            목록으로
          </button>
        </div>
      </div>

      {/* 프로필 수정 폼 */}
      {isEditingProfile && (
        <div className={styles.editForm}>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label>은퇴 나이</label>
              <input
                type="text"
                value={profileData.retirementAge}
                onChange={(e) =>
                  handleProfileUpdate(
                    "retirementAge",
                    parseInt(e.target.value) || 0
                  )
                }
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) e.preventDefault();
                }}
              />
            </div>
            <div className={styles.formField}>
              <label>목표 자산 (만원)</label>
              <input
                type="text"
                value={profileData.targetAssets}
                onChange={(e) =>
                  handleProfileUpdate(
                    "targetAssets",
                    parseInt(e.target.value) || 0
                  )
                }
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) e.preventDefault();
                }}
              />
            </div>
            <div className={styles.formField}>
              <label>은퇴 시점 생활비 (만원/월)</label>
              <input
                type="text"
                value={profileData.retirementLivingExpenses}
                onChange={(e) =>
                  handleProfileUpdate(
                    "retirementLivingExpenses",
                    parseInt(e.target.value) || 0
                  )
                }
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) e.preventDefault();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 메인 대시보드 */}
      <div className={styles.dashboardMain}>
        {/* 좌측 동적 사이드바 */}
        <div className={styles.sidebar}>
          {sidebarView === "categories" ? (
            // 카테고리 목록 뷰
            <>
              <h3 className={styles.sidebarTitle}>재무 카테고리</h3>
              <div className={styles.categoryList}>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    className={styles.categoryButton}
                    onClick={() => handleCategoryClick(category.id)}
                    style={{ "--category-color": category.color }}
                  >
                    <div className={styles.categoryColor}></div>
                    <span className={styles.categoryName}>{category.name}</span>
                    <span className={styles.categoryCount}>
                      ({category.count}개)
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            // 리스트 뷰
            <>
              <div className={styles.listHeader}>
                <button
                  className={styles.backButton}
                  onClick={handleBackToCategories}
                >
                  ← 뒤로
                </button>
                <button className={styles.addButton} onClick={handleAddData}>
                  + {getCategoryName(selectedCategory)} 추가
                </button>
              </div>
              <div className={styles.listContent}>
                {selectedCategory === "income" ? (
                  <IncomeList
                    incomes={incomes}
                    onEdit={handleEditIncome}
                    onDelete={handleDeleteIncome}
                  />
                ) : selectedCategory === "expense" ? (
                  <ExpenseList
                    expenses={expenses}
                    onEdit={handleEditExpense}
                    onDelete={handleDeleteExpense}
                  />
                ) : selectedCategory === "savings" ? (
                  <SavingList
                    savings={savings}
                    onEdit={handleEditSaving}
                    onDelete={handleDeleteSaving}
                  />
                ) : (
                  <div className={styles.emptyList}>
                    <p>데이터가 없습니다.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* 우측 메인 콘텐츠 - 그래프만 */}
        <div className={styles.mainContent}>
          <div className={styles.chartSection}>
            <div className={styles.chartGrid}>
              {/* 현금 흐름 시뮬레이션 */}
              <div className={styles.chartContainer}>
                <RechartsCashflowChart
                  data={simulationData.cashflow}
                  retirementAge={profileData.retirementAge}
                />
              </div>

              {/* 자산 시뮬레이션 */}
              <div className={styles.chartContainer}>
                <RechartsAssetChart
                  data={simulationData.assets}
                  retirementAge={profileData.retirementAge}
                  targetAssets={profileData.targetAssets}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 수입 모달 */}
      <IncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        onSave={handleSaveIncome}
        editData={editingIncome}
      />

      {/* 지출 모달 */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={handleSaveExpense}
        editData={editingExpense}
      />

      {/* 저축 모달 */}
      <SavingModal
        isOpen={isSavingModalOpen}
        onClose={() => setIsSavingModalOpen(false)}
        onSave={handleSaveSaving}
        editData={editingSaving}
      />
    </div>
  );
}

export default DashboardPage;
