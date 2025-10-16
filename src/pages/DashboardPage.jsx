import React, { useState, useEffect, useCallback } from "react";
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
  pensionService,
  realEstateService,
  assetService,
} from "../services/firestoreService";
import RechartsCashflowChart from "../components/RechartsCashflowChart";
import RechartsAssetChart from "../components/RechartsAssetChart";
import IncomeModal from "../components/IncomeModal";
import IncomeList from "../components/IncomeList";
import ExpenseModal from "../components/ExpenseModal";
import ExpenseList from "../components/ExpenseList";
import SavingModal from "../components/SavingModal";
import SavingList from "../components/SavingList";
import PensionModal from "../components/PensionModal";
import PensionList from "../components/PensionList";
import RealEstateModal from "../components/RealEstateModal";
import RealEstateList from "../components/RealEstateList";
import AssetModal from "../components/AssetModal";
import AssetList from "../components/AssetList";
import ProfileEditModal from "../components/ProfileEditModal";
import styles from "./DashboardPage.module.css";

/**
 * 프로필 대시보드 페이지
 * 재무 상담사가 내담자의 재무 상태를 관리하고 시뮬레이션을 확인할 수 있습니다.
 */
function DashboardPage() {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("income");
  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);
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
  const [pensions, setPensions] = useState([]);
  const [isPensionModalOpen, setIsPensionModalOpen] = useState(false);
  const [editingPension, setEditingPension] = useState(null);
  const [realEstates, setRealEstates] = useState([]);
  const [isRealEstateModalOpen, setIsRealEstateModalOpen] = useState(false);
  const [editingRealEstate, setEditingRealEstate] = useState(null);
  const [assets, setAssets] = useState([]);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
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
            // generateSimulationData는 별도 useEffect에서 처리
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

  // 연금 데이터 로드
  useEffect(() => {
    const loadPensions = async () => {
      if (!profileId) return;

      try {
        const pensionData = await pensionService.getPensions(profileId);
        // 생성 순서대로 정렬 (createdAt 기준)
        const sortedPensions = pensionData.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        setPensions(sortedPensions);
      } catch (error) {
        console.error("연금 데이터 로드 오류:", error);
      }
    };

    loadPensions();
  }, [profileId]);

  // 부동산 데이터 로드
  useEffect(() => {
    const loadRealEstates = async () => {
      if (!profileId) return;

      try {
        const realEstateData = await realEstateService.getRealEstates(
          profileId
        );
        // 생성 순서대로 정렬 (createdAt 기준)
        const sortedRealEstates = realEstateData.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        setRealEstates(sortedRealEstates);
      } catch (error) {
        console.error("부동산 데이터 로드 오류:", error);
      }
    };

    loadRealEstates();
  }, [profileId]);

  // 자산 데이터 로드
  useEffect(() => {
    const loadAssets = async () => {
      if (!profileId) return;

      try {
        const assetsData = await assetService.getAssets(profileId);
        // 생성 순서대로 정렬 (createdAt 기준)
        const sortedAssets = assetsData.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        setAssets(sortedAssets);
      } catch (error) {
        console.error("자산 데이터 로드 오류:", error);
      }
    };

    loadAssets();
  }, [profileId]);

  // 시뮬레이션 데이터 생성
  const generateSimulationData = useCallback(
    (profileData) => {
      if (!profileData) {
        return;
      }

      const currentYear = new Date().getFullYear();
      const startAge = parseInt(profileData.currentKoreanAge);
      const retirementAge = parseInt(profileData.retirementAge);
      const deathAge = 90;
      const startYear = currentYear;

      // 디버깅을 위한 로그
      console.log("현재 나이:", startAge, "은퇴 나이:", retirementAge);

      // 현재 나이와 은퇴 나이의 차이를 계산해서 은퇴 년도 구하기
      const yearsToRetirement = retirementAge - startAge;
      const retirementYear = currentYear + yearsToRetirement;

      // 현재 나이와 죽을 나이의 차이를 계산해서 죽을 년도 구하기
      const yearsToDeath = deathAge - startAge;
      const deathYear = currentYear + yearsToDeath;

      console.log(
        "은퇴까지 남은 년수:",
        yearsToRetirement,
        "은퇴 년도:",
        retirementYear
      );

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
        pensions, // 연금 데이터 사용
        realEstates, // 부동산 데이터 사용
        assets // 자산 시뮬레이션 데이터 전달
      );

      // 자산 시뮬레이션 데이터 계산 (현금 흐름 데이터 포함)
      const assetSimulation = calculateAssetSimulation(
        profileData,
        incomes,
        expenses,
        savings, // 저축 데이터 사용
        pensions, // 연금 데이터 사용
        realEstates, // 부동산 데이터 사용
        assets, // 자산 데이터 사용
        cashflow // 현금 흐름 데이터 전달
      );

      setSimulationData({ cashflow, assets: assetSimulation });
    },
    [incomes, expenses, savings, pensions, realEstates, assets]
  );

  // 수입 데이터가 변경될 때마다 시뮬레이션 재계산
  useEffect(() => {
    if (profileData) {
      generateSimulationData(profileData);
    }
  }, [
    incomes,
    expenses,
    savings,
    pensions,
    realEstates,
    assets,
    profileData,
    generateSimulationData,
  ]);

  // 프로필 수정 핸들러

  // 프로필 수정 모달 열기
  const handleEditProfile = () => {
    setIsProfileEditModalOpen(true);
  };

  // 프로필 수정 모달 닫기
  const handleCloseProfileEditModal = () => {
    setIsProfileEditModalOpen(false);
  };

  // 프로필 수정 저장
  const handleSaveProfileEdit = (updatedProfile) => {
    setProfileData(updatedProfile);
    // 시뮬레이션 재계산은 useEffect에서 자동 처리
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
    } catch (error) {
      console.error("수입 데이터 저장 오류:", error);
    }
  };

  const handleDeleteIncome = async (incomeId) => {
    if (!window.confirm("이 수입 데이터를 삭제하시겠습니까?")) return;

    try {
      await incomeService.deleteIncome(profileId, incomeId);
      setIncomes(incomes.filter((income) => income.id !== incomeId));
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
    } catch (error) {
      console.error("지출 데이터 저장 오류:", error);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm("이 지출 데이터를 삭제하시겠습니까?")) return;

    try {
      await expenseService.deleteExpense(profileId, expenseId);
      setExpenses(expenses.filter((expense) => expense.id !== expenseId));
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
    } catch (error) {
      console.error("저축 데이터 삭제 오류:", error);
    }
  };

  // 연금 핸들러들
  const handleAddPension = () => {
    setEditingPension(null);
    setIsPensionModalOpen(true);
  };

  const handleEditPension = (pension) => {
    setEditingPension(pension);
    setIsPensionModalOpen(true);
  };

  const handleSavePension = async (pensionData) => {
    try {
      if (editingPension) {
        // 수정
        await pensionService.updatePension(
          profileId,
          editingPension.id,
          pensionData
        );
        setPensions(
          pensions.map((pension) =>
            pension.id === editingPension.id
              ? { ...pension, ...pensionData }
              : pension
          )
        );
      } else {
        // 추가
        const pensionId = await pensionService.createPension(
          profileId,
          pensionData
        );
        setPensions([...pensions, { id: pensionId, ...pensionData }]);
      }

      setEditingPension(null);
      setIsPensionModalOpen(false);
    } catch (error) {
      console.error("연금 데이터 저장 오류:", error);
    }
  };

  const handleDeletePension = async (pensionId) => {
    if (!window.confirm("이 연금 데이터를 삭제하시겠습니까?")) return;

    try {
      await pensionService.deletePension(profileId, pensionId);
      setPensions(pensions.filter((pension) => pension.id !== pensionId));
    } catch (error) {
      console.error("연금 데이터 삭제 오류:", error);
    }
  };

  // 부동산 핸들러들
  const handleAddRealEstate = () => {
    setEditingRealEstate(null);
    setIsRealEstateModalOpen(true);
  };

  const handleEditRealEstate = (realEstate) => {
    setEditingRealEstate(realEstate);
    setIsRealEstateModalOpen(true);
  };

  const handleSaveRealEstate = async (realEstateData) => {
    try {
      if (editingRealEstate) {
        // 수정
        await realEstateService.updateRealEstate(
          profileId,
          editingRealEstate.id,
          realEstateData
        );
        setRealEstates(
          realEstates.map((realEstate) =>
            realEstate.id === editingRealEstate.id
              ? { ...realEstate, ...realEstateData }
              : realEstate
          )
        );
      } else {
        // 추가
        const newRealEstateId = await realEstateService.createRealEstate(
          profileId,
          realEstateData
        );
        setRealEstates([
          ...realEstates,
          { id: newRealEstateId, ...realEstateData },
        ]);
      }

      setIsRealEstateModalOpen(false);
    } catch (error) {
      console.error("부동산 데이터 저장 오류:", error);
    }
  };

  const handleDeleteRealEstate = async (realEstateId) => {
    if (!window.confirm("이 부동산 데이터를 삭제하시겠습니까?")) return;

    try {
      await realEstateService.deleteRealEstate(profileId, realEstateId);
      setRealEstates(
        realEstates.filter((realEstate) => realEstate.id !== realEstateId)
      );
    } catch (error) {
      console.error("부동산 데이터 삭제 오류:", error);
    }
  };

  // 자산 관련 핸들러들
  const handleAddAsset = () => {
    setEditingAsset(null);
    setIsAssetModalOpen(true);
  };

  const handleEditAsset = (asset) => {
    setEditingAsset(asset);
    setIsAssetModalOpen(true);
  };

  const handleSaveAsset = async (assetData) => {
    try {
      if (editingAsset) {
        await assetService.updateAsset(profileId, editingAsset.id, assetData);
        setAssets(
          assets.map((asset) =>
            asset.id === editingAsset.id ? { ...asset, ...assetData } : asset
          )
        );
      } else {
        const newAssetId = await assetService.createAsset(profileId, assetData);
        setAssets([...assets, { id: newAssetId, ...assetData }]);
      }

      setIsAssetModalOpen(false);
    } catch (error) {
      console.error("자산 데이터 저장 오류:", error);
    }
  };

  const handleDeleteAsset = async (assetId) => {
    if (!window.confirm("이 자산 데이터를 삭제하시겠습니까?")) return;

    try {
      await assetService.deleteAsset(profileId, assetId);
      setAssets(assets.filter((asset) => asset.id !== assetId));
    } catch (error) {
      console.error("자산 데이터 삭제 오류:", error);
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
        handleAddPension();
        break;
      case "realEstate":
        handleAddRealEstate();
        break;
      case "assets":
        handleAddAsset();
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
      realEstate: "부동산",
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
    { id: "pension", name: "연금", color: "#8b5cf6", count: pensions.length },
    {
      id: "realEstate",
      name: "부동산",
      color: "#f59e0b",
      count: realEstates.length,
    },
    { id: "assets", name: "자산", color: "#f59e0b", count: assets.length },
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
              <span className={styles.label}>현재 현금:</span>
              <span className={styles.value}>
                {formatAmount(profileData.currentCash)}
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
          <button className={styles.editButton} onClick={handleEditProfile}>
            프로필 수정
          </button>
          <button className={styles.backButton} onClick={() => navigate("/")}>
            목록으로
          </button>
        </div>
      </div>

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
                  >
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
                ) : selectedCategory === "pension" ? (
                  <PensionList
                    pensions={pensions}
                    onEdit={handleEditPension}
                    onDelete={handleDeletePension}
                  />
                ) : selectedCategory === "realEstate" ? (
                  <RealEstateList
                    realEstates={realEstates}
                    onEdit={handleEditRealEstate}
                    onDelete={handleDeleteRealEstate}
                  />
                ) : selectedCategory === "assets" ? (
                  <AssetList
                    assets={assets}
                    onEdit={handleEditAsset}
                    onDelete={handleDeleteAsset}
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

      <PensionModal
        isOpen={isPensionModalOpen}
        onClose={() => setIsPensionModalOpen(false)}
        onSave={handleSavePension}
        editData={editingPension}
      />

      <RealEstateModal
        isOpen={isRealEstateModalOpen}
        onClose={() => setIsRealEstateModalOpen(false)}
        onSave={handleSaveRealEstate}
        editData={editingRealEstate}
        profileData={profileData}
      />

      <ProfileEditModal
        isOpen={isProfileEditModalOpen}
        onClose={handleCloseProfileEditModal}
        onSave={handleSaveProfileEdit}
        profileData={profileData}
      />

      {/* 자산 모달 */}
      <AssetModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        onSave={handleSaveAsset}
        editData={editingAsset}
        profileData={profileData}
      />
    </div>
  );
}

export default DashboardPage;
