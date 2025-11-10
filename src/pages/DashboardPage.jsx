import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getAdminInfo, checkProfileAccess } from "../services/authService";
import { calculateKoreanAge, getKoreanAgeInYear } from "../utils/koreanAge";
import { formatAmount } from "../utils/format";
import {
  calculateCashflowSimulation,
  calculateAssetSimulation,
  extractAIAnalysisData,
} from "../utils/cashflowSimulator";
import {
  profileService,
  incomeService,
  expenseService,
  savingsService,
  pensionService,
  realEstateService,
  assetService,
  debtService,
  checklistService,
} from "../services/firestoreService";
import { simulationService } from "../services/simulationService";
import { migrateProfileData } from "../utils/dataMigration";
import SimulationTabs from "../components/simulation/SimulationTabs";
import RechartsCashflowChart from "../components/charts/RechartsCashflowChart";
import RechartsAssetChart from "../components/charts/RechartsAssetChart";
import IncomeModal from "../components/income/IncomeModal";
import IncomeList from "../components/income/IncomeList";
import ExpenseModal from "../components/expense/ExpenseModal";
import ExpenseList from "../components/expense/ExpenseList";
import SavingModal from "../components/saving/SavingModal";
import SavingList from "../components/saving/SavingList";
import PensionModal from "../components/pension/PensionModal";
import PensionList from "../components/pension/PensionList";
import RealEstateModal from "../components/realestate/RealEstateModal";
import RealEstateList from "../components/realestate/RealEstateList";
import AssetModal from "../components/asset/AssetModal";
import AssetList from "../components/asset/AssetList";
import DebtModal from "../components/debt/DebtModal";
import DebtList from "../components/debt/DebtList";
import ProfileEditModal from "../components/profile/ProfileEditModal";
import ProfileSummary from "../components/profile/ProfileSummary";
import FinancialDataModal from "../components/profile/FinancialDataModal";
import CalculatorModal from "../components/common/CalculatorModal";
import SimulationCompareModal from "../components/simulation/SimulationCompareModal";
import ProfileChecklistPanel from "../components/checklist/ProfileChecklistPanel";
import ChecklistTemplateModal from "../components/checklist/ChecklistTemplateModal";
import { normalizeChecklistItems } from "../constants/profileChecklist";
import FinancialDataStorePanel from "../components/datastore/FinancialDataStorePanel";
import TemplateManageModal from "../components/datastore/TemplateManageModal";
import { trackEvent, trackPageView } from "../libs/mixpanel";
import styles from "./DashboardPage.module.css";

/**
 * 프로필 대시보드 페이지
 * 재무 상담사가 내담자의 재무 상태를 관리하고 시뮬레이션을 확인할 수 있습니다.
 */
function DashboardPage() {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const { adminId, userId, isAdmin: isAdminFromAuth } = useAuth(); // 관리자 및 사용자 정보
  const [isAdmin, setIsAdmin] = useState(false); // 실제 편집 권한 여부 (관리자 또는 권한 있는 사용자)
  const [hasEditPermission, setHasEditPermission] = useState(false); // 편집 권한 여부
  const [selectedCategory, setSelectedCategory] = useState("income");
  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState("cashflow");
  const [simulationData, setSimulationData] = useState({
    cashflow: [],
    assets: [],
  });

  // 시뮬레이션 관련 state
  const [simulations, setSimulations] = useState([]); // 모든 시뮬레이션 목록
  const [activeSimulationId, setActiveSimulationId] = useState(null); // 현재 활성화된 시뮬레이션 ID
  const [isFinancialDataLoading, setIsFinancialDataLoading] = useState(true); // 재무 데이터 로딩 상태
  const [simulationMemo, setSimulationMemo] = useState("");
  const [isMemoSaving, setIsMemoSaving] = useState(false);
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false);
  const [profilePanelTab, setProfilePanelTab] = useState("memo");
  const [isDataStorePanelOpen, setIsDataStorePanelOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false); // 재무 라이브러리 관리 모달
  const [libraryRefreshKey, setLibraryRefreshKey] = useState(0); // 재무 라이브러리 새로고침 키
  const [profileMemo, setProfileMemo] = useState("");
  const [isProfileMemoSaving, setIsProfileMemoSaving] = useState(false);
  const [profileChecklist, setProfileChecklist] = useState(null);
  const [isChecklistLoading, setIsChecklistLoading] = useState(false);
  const [isChecklistSaving, setIsChecklistSaving] = useState(false);
  const checklistIdRef = useRef(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false); // 템플릿 수정 모달
  const fetchSimulationFinancialData = useCallback(
    async (simulationId) => {
      if (!profileId || !simulationId || !profileData) return null;

      const [
        incomeData,
        expenseData,
        savingData,
        pensionData,
        realEstateData,
        assetsData,
        debtData,
      ] = await Promise.all([
        incomeService.getIncomes(profileId, simulationId),
        expenseService.getExpenses(profileId, simulationId),
        savingsService.getSavings(profileId, simulationId),
        pensionService.getPensions(profileId, simulationId),
        realEstateService.getRealEstates(profileId, simulationId),
        assetService.getAssets(profileId, simulationId),
        debtService.getDebts(profileId, simulationId),
      ]);

      const sortByCreatedAt = (list) =>
        list
          ? [...list].sort(
              (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            )
          : [];

      const sortedIncomes = sortByCreatedAt(incomeData);
      const sortedExpenses = sortByCreatedAt(expenseData);
      const sortedSavings = sortByCreatedAt(savingData);
      const sortedPensions = sortByCreatedAt(pensionData);
      const sortedRealEstates = sortByCreatedAt(realEstateData);
      const sortedAssets = sortByCreatedAt(assetsData);
      const sortedDebts = sortByCreatedAt(debtData);

      const cashflow = calculateCashflowSimulation(
        profileData,
        sortedIncomes,
        sortedExpenses,
        sortedSavings,
        sortedPensions,
        sortedRealEstates,
        sortedAssets,
        sortedDebts
      );

      return {
        incomes: sortedIncomes,
        expenses: sortedExpenses,
        savings: sortedSavings,
        pensions: sortedPensions,
        realEstates: sortedRealEstates,
        assets: sortedAssets,
        debts: sortedDebts,
        cashflow,
      };
    },
    [profileId, profileData]
  );

  const loadProfileChecklist = useCallback(async () => {
    if (!profileId) return;
    setIsChecklistLoading(true);
    try {
      const checklists = await checklistService.getChecklists(profileId);
      if (!checklists || checklists.length === 0) {
        checklistIdRef.current = null;
        setProfileChecklist({
          id: null,
          title: "체크리스트",
          items: [],
        });
        return;
      }

      const first = {
        ...checklists[0],
      };
      const normalizedItems = normalizeChecklistItems(first.items || []);
      checklistIdRef.current = first.id;
      setProfileChecklist({
        id: first.id,
        title: first.title || "체크리스트",
        items: normalizedItems,
      });
    } catch (error) {
      console.error("체크리스트 로드 오류:", error);
      alert("체크리스트를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsChecklistLoading(false);
    }
  }, [profileId]);

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
  const [debts, setDebts] = useState([]);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [sidebarView, setSidebarView] = useState("categories"); // "categories" or "list"
  const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState(false);
  const [isFinancialDataModalOpen, setIsFinancialDataModalOpen] =
    useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isAIOptionModalOpen, setIsAIOptionModalOpen] = useState(false); // AI 옵션 선택 모달
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // 사이드바 접기/펼치기 상태
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [initialIncomeData, setInitialIncomeData] = useState(null); // 재무 라이브러리에서 선택한 소득 템플릿 데이터
  const [initialExpenseData, setInitialExpenseData] = useState(null); // 재무 라이브러리에서 선택한 지출 템플릿 데이터
  const [isCompareLoading, setIsCompareLoading] = useState(false);
  const [comparisonData, setComparisonData] = useState({
    defaultData: null,
    targetData: null,
    defaultTitle: "",
    targetTitle: "",
  });
  const defaultSimulationEntry = useMemo(
    () => simulations.find((sim) => sim.isDefault),
    [simulations]
  );
  const isActiveSimulationDefault = !!(
    defaultSimulationEntry &&
    activeSimulationId &&
    defaultSimulationEntry.id === activeSimulationId
  );

  // 권한 확인: 관리자 또는 해당 프로필에 권한이 있는 사용자
  useEffect(() => {
    const checkPermissions = async () => {
      if (!profileId) {
        setIsAdmin(false);
        setHasEditPermission(false);
        return;
      }

      // 1. 관리자 권한 확인
      if (adminId) {
        try {
          const result = await getAdminInfo(adminId);
          if (result.success && result.admin) {
            const adminIsAdmin = result.admin.isAdmin !== false;
            setIsAdmin(adminIsAdmin);
            setHasEditPermission(adminIsAdmin); // 관리자는 항상 편집 가능
            return;
          }
        } catch (error) {
          console.error("관리자 상태 확인 오류:", error);
        }
      }

      // 2. 사용자 권한 확인
      if (userId) {
        try {
          const hasAccess = await checkProfileAccess(userId, profileId);
          setIsAdmin(false); // 관리자가 아님
          setHasEditPermission(hasAccess); // 프로필 접근 권한이 있으면 편집 가능
          return;
        } catch (error) {
          console.error("사용자 권한 확인 오류:", error);
        }
      }

      // 3. 비로그인 사용자
      setIsAdmin(false);
      setHasEditPermission(false);
    };

    checkPermissions();
  }, [adminId, userId, profileId]);

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
            setProfileMemo(profile.memo || "");
            // generateSimulationData는 별도 useEffect에서 처리
          } else {
            navigate("/consult");
          }
        }
      } catch (error) {
        console.error("프로필 로드 오류:", error);
        if (isMounted) {
          navigate("/consult");
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

  // 사이드바가 열릴 때 배경 스크롤 막기
  useEffect(() => {
    const isSidebarOpen = isProfilePanelOpen || isDataStorePanelOpen;

    if (isSidebarOpen) {
      // 현재 스크롤 위치 저장
      const scrollY = window.scrollY;

      // body 스크롤 막기
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";

      return () => {
        // 원래 상태로 복구
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";

        // 스크롤 위치 복원
        window.scrollTo(0, scrollY);
      };
    }
  }, [isProfilePanelOpen, isDataStorePanelOpen]);

  useEffect(() => {
    if (!profileId) {
      setProfileChecklist(null);
      checklistIdRef.current = null;
      return;
    }
    checklistIdRef.current = null;
    setProfileChecklist(null);
    loadProfileChecklist();
  }, [profileId, loadProfileChecklist]);

  // 시뮬레이션 목록 로드 및 자동 마이그레이션
  useEffect(() => {
    const loadSimulations = async () => {
      if (!profileId) return;

      try {
        const simulationList = await simulationService.getSimulations(
          profileId
        );

        if (simulationList.length === 0) {
          // 기존 데이터를 새 구조로 자동 마이그레이션
          const migrationResult = await migrateProfileData(profileId);

          if (migrationResult.success) {
            // 마이그레이션 후 시뮬레이션 다시 로드
            const updatedSimulations = await simulationService.getSimulations(
              profileId
            );
            setSimulations(updatedSimulations);

            // 기본 시뮬레이션 활성화
            const defaultSim = updatedSimulations.find(
              (sim) => sim.isDefault === true
            );
            if (defaultSim) {
              setActiveSimulationId(defaultSim.id);
            }
          } else {
            console.error("마이그레이션 실패:", migrationResult);
            // 마이그레이션이 필요없는 경우(이미 완료된 경우)는 무시
            if (migrationResult.simulationCount > 0) {
              const updatedSimulations = await simulationService.getSimulations(
                profileId
              );
              setSimulations(updatedSimulations);
              const defaultSim = updatedSimulations.find(
                (sim) => sim.isDefault === true
              );
              if (defaultSim) {
                setActiveSimulationId(defaultSim.id);
              }
            }
          }
          return;
        }

        setSimulations(simulationList);

        // 기본 시뮬레이션을 활성화
        const defaultSim = simulationList.find((sim) => sim.isDefault === true);
        if (defaultSim) {
          setActiveSimulationId(defaultSim.id);
        } else {
          // 기본 시뮬레이션이 없으면 첫 번째 시뮬레이션 활성화
          setActiveSimulationId(simulationList[0].id);
        }
      } catch (error) {
        console.error("시뮬레이션 목록 조회 오류:", error);
      }
    };

    loadSimulations();
  }, [profileId]);

  // 모든 재무 데이터를 한 번에 병렬로 로드
  useEffect(() => {
    const loadAllFinancialData = async () => {
      if (!profileId || !activeSimulationId) return;

      try {
        // 시뮬레이션 변경 시 이전 데이터 즉시 초기화
        setIncomes([]);
        setExpenses([]);
        setSavings([]);
        setPensions([]);
        setRealEstates([]);
        setAssets([]);
        setDebts([]);

        setIsFinancialDataLoading(true); // 로딩 시작

        // Promise.all을 사용하여 모든 데이터를 동시에 가져오기
        const [
          incomeData,
          expenseData,
          savingData,
          pensionData,
          realEstateData,
          assetsData,
          debtData,
        ] = await Promise.all([
          incomeService.getIncomes(profileId, activeSimulationId),
          expenseService.getExpenses(profileId, activeSimulationId),
          savingsService.getSavings(profileId, activeSimulationId),
          pensionService.getPensions(profileId, activeSimulationId),
          realEstateService.getRealEstates(profileId, activeSimulationId),
          assetService.getAssets(profileId, activeSimulationId),
          debtService.getDebts(profileId, activeSimulationId),
        ]);

        // 모든 데이터를 생성 순서대로 정렬 (createdAt 기준)
        const sortedIncomes = incomeData.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        const sortedExpenses = expenseData.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        const sortedSavings = savingData.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        const sortedPensions = pensionData.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        const sortedRealEstates = realEstateData.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        const sortedAssets = assetsData.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        const sortedDebts = debtData.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );

        // 모든 상태를 한 번에 업데이트
        setIncomes(sortedIncomes);
        setExpenses(sortedExpenses);
        setSavings(sortedSavings);
        setPensions(sortedPensions);
        setRealEstates(sortedRealEstates);
        setAssets(sortedAssets);
        setDebts(sortedDebts);

        setIsFinancialDataLoading(false); // 로딩 완료
      } catch (error) {
        console.error("재무 데이터 로드 오류:", error);
        setIsFinancialDataLoading(false); // 오류 시에도 로딩 완료 처리
      }
    };

    loadAllFinancialData();
  }, [profileId, activeSimulationId]);

  // 시뮬레이션 메모 동기화
  useEffect(() => {
    if (!activeSimulationId) {
      setSimulationMemo("");
      return;
    }

    const currentSimulation = simulations.find(
      (sim) => sim.id === activeSimulationId
    );
    const memoText = currentSimulation?.memo || "";
    setSimulationMemo(memoText);
  }, [activeSimulationId, simulations]);

  useEffect(() => {
    setProfileMemo(profileData?.memo || "");
  }, [profileData?.memo]);

  // Mixpanel: Dashboard 페이지 진입 이벤트
  useEffect(() => {
    if (profileData && !loading) {
      trackPageView("Dashboard 페이지", {
        profileId: profileId,
        profileName: profileData.name,
        retirementAge: profileData.retirementAge,
        simulationCount: simulations.length,
        hasEditPermission: hasEditPermission,
        isAdmin: isAdmin,
      });
    }
  }, [
    profileData,
    loading,
    profileId,
    simulations.length,
    hasEditPermission,
    isAdmin,
  ]);

  // useMemo를 사용해 시뮬레이션 데이터를 메모이제이션하여 불필요한 재계산 방지
  // 재무 데이터나 프로필이 실제로 변경될 때만 계산 수행
  const memoizedSimulationData = useMemo(() => {
    // profileData가 없거나 재무 데이터 로딩 중이면 빈 데이터 반환
    if (!profileData || isFinancialDataLoading) {
      return { cashflow: [], cashflowDetailed: [], assets: [] };
    }

    const currentYear = new Date().getFullYear();
    const startAge = calculateKoreanAge(profileData.birthYear, currentYear); // 만 나이로 실시간 계산
    const retirementAge = parseInt(profileData.retirementAge);
    const deathAge = 90;
    const startYear = currentYear;

    // 현재 나이와 은퇴 나이의 차이를 계산해서 은퇴 년도 구하기
    const yearsToRetirement = retirementAge - startAge;
    const retirementYear = currentYear + yearsToRetirement;

    // 현재 나이와 죽을 나이의 차이를 계산해서 죽을 년도 구하기
    const yearsToDeath = deathAge - startAge;
    const deathYear = currentYear + yearsToDeath;

    const years = [];
    for (let year = startYear; year <= deathYear; year++) {
      const age = getKoreanAgeInYear(profileData.birthYear, year);
      years.push({ year, age });
    }

    // 실제 소득 데이터를 기반으로 현금흐름 시뮬레이션 계산
    const cashflow = calculateCashflowSimulation(
      profileData,
      incomes,
      expenses, // 지출 데이터 사용
      savings, // 저축/투자 데이터 사용
      pensions, // 연금 데이터 사용
      realEstates, // 부동산 데이터 사용
      assets, // 자산 데이터 사용
      debts // 부채 데이터 사용
    );

    // 자산 시뮬레이션 데이터 계산 (현금 흐름 데이터 포함)
    const assetSimulation = calculateAssetSimulation(
      profileData,
      incomes,
      expenses,
      savings, // 저축/투자 데이터 사용
      pensions, // 연금 데이터 사용
      realEstates, // 부동산 데이터 사용
      assets, // 자산 데이터 사용
      cashflow, // 현금 흐름 데이터 전달
      debts // 부채 데이터 사용
    );

    return {
      cashflow,
      cashflowDetailed: cashflow, // 상세 데이터는 cashflow와 동일
      assets: assetSimulation,
    };
  }, [
    profileData,
    incomes,
    expenses,
    savings,
    pensions,
    realEstates,
    assets,
    debts,
    isFinancialDataLoading,
  ]);

  // 메모이제이션된 데이터를 state에 동기화
  // 이렇게 하면 패널 열기 등 다른 state 변경 시에는 재계산되지 않음
  useEffect(() => {
    setSimulationData(memoizedSimulationData);
  }, [memoizedSimulationData]);

  // 프로필 수정 핸들러

  // 프로필 수정 모달 열기
  // 수정/삭제 권한 확인 함수 (권한이 없으면 회원가입 페이지로 이동)
  const checkEditPermission = (actionName = "수정") => {
    if (!hasEditPermission) {
      if (
        confirm(
          `${actionName} 권한이 필요합니다. 로그인 또는 회원가입을 진행하시겠습니까?`
        )
      ) {
        navigate(`/signup?profileId=${profileId}`);
      }
      return false;
    }
    return true;
  };

  const handleEditProfile = () => {
    if (!checkEditPermission("프로필 수정")) return;
    setIsProfileEditModalOpen(true);
  };

  // 프로필 수정 모달 닫기
  const handleCloseProfileEditModal = () => {
    setIsProfileEditModalOpen(false);
  };

  // 프로필 수정 저장
  const handleSaveProfileEdit = async (updatedProfile) => {
    setProfileData(updatedProfile);
    // 시뮬레이션 재계산은 useEffect에서 자동 처리

    // 프로필 업데이트 후 소득/저축/지출/연금 데이터 다시 로드 (은퇴년도 변경 시 고정된 항목 업데이트 반영)
    if (activeSimulationId) {
      try {
        const [incomeData, savingData, expenseData, pensionData] =
          await Promise.all([
            incomeService.getIncomes(profileId, activeSimulationId),
            savingsService.getSavings(profileId, activeSimulationId),
            expenseService.getExpenses(profileId, activeSimulationId),
            pensionService.getPensions(profileId, activeSimulationId),
          ]);

        const sortedIncomes = incomeData.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        const sortedSavings = savingData.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        const sortedExpenses = expenseData.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        const sortedPensions = pensionData.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );

        setIncomes(sortedIncomes);
        setSavings(sortedSavings);
        setExpenses(sortedExpenses);
        setPensions(sortedPensions);
      } catch (error) {
        console.error("재무 데이터 리로드 오류:", error);
        // 데이터 리로드 실패해도 프로필 업데이트는 성공으로 처리
      }
    }
  };

  // 사이드바 뷰 핸들러들
  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    setSidebarView("list");
  };

  const handleBackToCategories = useCallback(() => {
    setSidebarView("categories");
  }, []);

  // 키보드 이벤트 핸들러 (백틱 키로 뒤로가기)
  useEffect(() => {
    const handleKeyDown = (event) => {
      // 백틱 키 (`) 또는 ₩ 키로 뒤로가기
      if (event.key === "`" || event.key === "₩") {
        // 사이드바가 리스트 뷰일 때만 뒤로가기 작동
        if (sidebarView === "list") {
          handleBackToCategories();
        }
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener("keydown", handleKeyDown);

    // 컴포넌트 언마운트 시 리스너 제거
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [sidebarView, handleBackToCategories]);

  // 소득 데이터 핸들러들
  const handleAddIncome = () => {
    if (!checkEditPermission("소득 추가")) return;
    trackEvent("소득 추가 버튼 클릭", { profileId });
    setEditingIncome(null);
    setInitialIncomeData(null); // initialData 초기화
    setIsIncomeModalOpen(true);
  };

  const handleEditIncome = (income) => {
    if (!checkEditPermission("소득 수정")) return;
    setEditingIncome(income);
    setInitialIncomeData(null); // initialData 초기화
    setIsIncomeModalOpen(true);
  };

  const handleSaveIncome = async (incomeData) => {
    try {
      if (editingIncome) {
        // 수정 모드: 각 시뮬레이션에서 ID 존재 여부 확인 후 업데이트 또는 생성
        trackEvent("소득 수정", {
          profileId,
          simulationId: activeSimulationId,
          incomeId: editingIncome.id,
        });
        const targetSimIds = incomeData.selectedSimulationIds?.length
          ? incomeData.selectedSimulationIds
          : [activeSimulationId];

        // 각 시뮬레이션에서 해당 ID가 존재하는지 확인
        const checkPromises = targetSimIds.map(async (simId) => {
          try {
            const items = await incomeService.getIncomes(profileId, simId);
            const exists = items.some((item) => item.id === editingIncome.id);
            return { simId, exists };
          } catch (error) {
            return { simId, exists: false };
          }
        });
        const checkResults = await Promise.all(checkPromises);

        // 존재하는 시뮬레이션은 업데이트, 없는 시뮬레이션은 생성
        const updatePromises = checkResults.map(({ simId, exists }) => {
          if (exists) {
            return incomeService.updateIncome(
              profileId,
              simId,
              editingIncome.id,
              incomeData
            );
          } else {
            return incomeService.createIncomeWithId(
              profileId,
              simId,
              editingIncome.id,
              incomeData
            );
          }
        });
        await Promise.all(updatePromises);

        // 현재 탭 상태만 즉시 반영
        if (targetSimIds.includes(activeSimulationId)) {
          setIncomes(
            incomes.map((income) =>
              income.id === editingIncome.id
                ? { ...income, ...incomeData }
                : income
            )
          );
        }
      } else {
        // 추가
        trackEvent("소득 추가", {
          profileId,
          simulationId: activeSimulationId,
        });
        const targetSimIds = incomeData.selectedSimulationIds?.length
          ? incomeData.selectedSimulationIds
          : [activeSimulationId];
        // 첫 번째 시뮬레이션에 생성하여 id 획득
        const primarySimId = targetSimIds[0];
        const newIncome = await incomeService.createIncome(
          profileId,
          primarySimId,
          incomeData
        );
        const newId = newIncome.id;
        // 나머지 시뮬레이션들에 동일 id로 생성
        await Promise.all(
          targetSimIds
            .filter((sid) => sid !== primarySimId)
            .map((sid) =>
              incomeService.createIncomeWithId(
                profileId,
                sid,
                newId,
                incomeData
              )
            )
        );
        if (primarySimId === activeSimulationId) {
          setIncomes([...incomes, newIncome]);
        }
      }
    } catch (error) {
      console.error("소득 데이터 저장 오류:", error);
    }
  };

  const handleDeleteIncome = async (incomeId) => {
    if (!checkEditPermission("소득 삭제")) return;
    if (!window.confirm("이 소득 데이터를 삭제하시겠습니까?")) return;

    try {
      await incomeService.deleteIncome(profileId, activeSimulationId, incomeId);
      setIncomes(incomes.filter((income) => income.id !== incomeId));
    } catch (error) {
      console.error("소득 데이터 삭제 오류:", error);
    }
  };

  // 지출 핸들러들
  const handleAddExpense = () => {
    if (!checkEditPermission("지출 추가")) return;
    setEditingExpense(null);
    setInitialExpenseData(null); // initialData 초기화
    setIsExpenseModalOpen(true);
  };

  // 저축/투자 핸들러들
  const handleAddSaving = () => {
    if (!checkEditPermission("저축 추가")) return;
    setEditingSaving(null);
    setIsSavingModalOpen(true);
  };

  const handleEditExpense = (expense) => {
    if (!checkEditPermission("지출 수정")) return;
    setEditingExpense(expense);
    setInitialExpenseData(null); // initialData 초기화
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = async (expenseData) => {
    try {
      if (editingExpense) {
        // 수정 모드: 각 시뮬레이션에서 ID 존재 여부 확인 후 업데이트 또는 생성
        const targetSimIds = expenseData.selectedSimulationIds?.length
          ? expenseData.selectedSimulationIds
          : [activeSimulationId];

        // 각 시뮬레이션에서 해당 ID가 존재하는지 확인
        const checkPromises = targetSimIds.map(async (simId) => {
          try {
            const items = await expenseService.getExpenses(profileId, simId);
            const exists = items.some((item) => item.id === editingExpense.id);
            return { simId, exists };
          } catch (error) {
            return { simId, exists: false };
          }
        });
        const checkResults = await Promise.all(checkPromises);

        // 존재하는 시뮬레이션은 업데이트, 없는 시뮬레이션은 생성
        const updatePromises = checkResults.map(({ simId, exists }) => {
          if (exists) {
            return expenseService.updateExpense(
              profileId,
              simId,
              editingExpense.id,
              expenseData
            );
          } else {
            return expenseService.createExpenseWithId(
              profileId,
              simId,
              editingExpense.id,
              expenseData
            );
          }
        });
        await Promise.all(updatePromises);

        // 현재 탭 상태만 즉시 반영
        if (targetSimIds.includes(activeSimulationId)) {
          setExpenses(
            expenses.map((expense) =>
              expense.id === editingExpense.id
                ? { ...expense, ...expenseData }
                : expense
            )
          );
        }
      } else {
        // 추가
        const targetSimIds = expenseData.selectedSimulationIds?.length
          ? expenseData.selectedSimulationIds
          : [activeSimulationId];
        // 첫 번째 시뮬레이션에 생성하여 id 획득
        const primarySimId = targetSimIds[0];
        const newExpense = await expenseService.createExpense(
          profileId,
          primarySimId,
          expenseData
        );
        const newId = newExpense.id;
        // 나머지 시뮬레이션들에 동일 id로 생성
        await Promise.all(
          targetSimIds
            .filter((sid) => sid !== primarySimId)
            .map((sid) =>
              expenseService.createExpenseWithId(
                profileId,
                sid,
                newId,
                expenseData
              )
            )
        );
        if (primarySimId === activeSimulationId) {
          setExpenses([...expenses, newExpense]);
        }
      }
    } catch (error) {
      console.error("지출 데이터 저장 오류:", error);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!checkEditPermission("지출 삭제")) return;
    if (!window.confirm("이 지출 데이터를 삭제하시겠습니까?")) return;

    try {
      await expenseService.deleteExpense(
        profileId,
        activeSimulationId,
        expenseId
      );
      setExpenses(expenses.filter((expense) => expense.id !== expenseId));
    } catch (error) {
      console.error("지출 데이터 삭제 오류:", error);
    }
  };

  // 저축/투자 저장 핸들러
  const handleSaveSaving = async (savingData) => {
    try {
      if (editingSaving) {
        // 수정 모드: 각 시뮬레이션에서 ID 존재 여부 확인 후 업데이트 또는 생성
        const targetSimIds = savingData.selectedSimulationIds?.length
          ? savingData.selectedSimulationIds
          : [activeSimulationId];

        // 각 시뮬레이션에서 해당 ID가 존재하는지 확인
        const checkPromises = targetSimIds.map(async (simId) => {
          try {
            const items = await savingsService.getSavings(profileId, simId);
            const exists = items.some((item) => item.id === editingSaving.id);
            return { simId, exists };
          } catch (error) {
            return { simId, exists: false };
          }
        });
        const checkResults = await Promise.all(checkPromises);

        // 존재하는 시뮬레이션은 업데이트, 없는 시뮬레이션은 생성
        const updatePromises = checkResults.map(({ simId, exists }) => {
          if (exists) {
            return savingsService.updateSaving(
              profileId,
              simId,
              editingSaving.id,
              savingData
            );
          } else {
            return savingsService.createSavingWithId(
              profileId,
              simId,
              editingSaving.id,
              savingData
            );
          }
        });
        await Promise.all(updatePromises);

        // 현재 탭 상태만 즉시 반영
        if (targetSimIds.includes(activeSimulationId)) {
          setSavings(
            savings.map((saving) =>
              saving.id === editingSaving.id
                ? { ...saving, ...savingData }
                : saving
            )
          );
        }
        setEditingSaving(null);
      } else {
        // 추가
        const targetSimIds = savingData.selectedSimulationIds?.length
          ? savingData.selectedSimulationIds
          : [activeSimulationId];
        // 첫 번째 시뮬레이션에 생성하여 id 획득
        const primarySimId = targetSimIds[0];
        const newSaving = await savingsService.createSaving(
          profileId,
          primarySimId,
          savingData
        );
        const newId = newSaving.id;
        // 나머지 시뮬레이션들에 동일 id로 생성
        await Promise.all(
          targetSimIds
            .filter((sid) => sid !== primarySimId)
            .map((sid) =>
              savingsService.createSavingWithId(
                profileId,
                sid,
                newId,
                savingData
              )
            )
        );
        if (primarySimId === activeSimulationId) {
          setSavings([...savings, newSaving]);
        }
      }
    } catch (error) {
      console.error("저축/투자 데이터 저장 오류:", error);
    }
  };

  // 저축/투자 수정 핸들러
  const handleEditSaving = (saving) => {
    if (!checkEditPermission("저축 수정")) return;
    setEditingSaving(saving);
    setIsSavingModalOpen(true);
  };

  // 저축/투자 삭제 핸들러
  const handleDeleteSaving = async (savingId) => {
    if (!checkEditPermission("저축 삭제")) return;
    if (!window.confirm("이 저축/투자 데이터를 삭제하시겠습니까?")) return;

    try {
      await savingsService.deleteSaving(
        profileId,
        activeSimulationId,
        savingId
      );
      setSavings(savings.filter((saving) => saving.id !== savingId));
    } catch (error) {
      console.error("저축/투자 데이터 삭제 오류:", error);
    }
  };

  // 연금 핸들러들
  const handleAddPension = () => {
    if (!checkEditPermission("연금 추가")) return;
    setEditingPension(null);
    setIsPensionModalOpen(true);
  };

  const handleEditPension = (pension) => {
    if (!checkEditPermission("연금 수정")) return;
    setEditingPension(pension);
    setIsPensionModalOpen(true);
  };

  const handleSavePension = async (pensionData) => {
    try {
      if (editingPension) {
        // 수정 모드: 각 시뮬레이션에서 ID 존재 여부 확인 후 업데이트 또는 생성
        const targetSimIds = pensionData.selectedSimulationIds?.length
          ? pensionData.selectedSimulationIds
          : [activeSimulationId];

        // 각 시뮬레이션에서 해당 ID가 존재하는지 확인
        const checkPromises = targetSimIds.map(async (simId) => {
          try {
            const items = await pensionService.getPensions(profileId, simId);
            const exists = items.some((item) => item.id === editingPension.id);
            return { simId, exists };
          } catch (error) {
            return { simId, exists: false };
          }
        });
        const checkResults = await Promise.all(checkPromises);

        // 존재하는 시뮬레이션은 업데이트, 없는 시뮬레이션은 생성
        const updatePromises = checkResults.map(({ simId, exists }) => {
          if (exists) {
            return pensionService.updatePension(
              profileId,
              simId,
              editingPension.id,
              pensionData
            );
          } else {
            return pensionService.createPensionWithId(
              profileId,
              simId,
              editingPension.id,
              pensionData
            );
          }
        });
        await Promise.all(updatePromises);

        // 현재 탭 상태만 즉시 반영
        if (targetSimIds.includes(activeSimulationId)) {
          setPensions(
            pensions.map((pension) =>
              pension.id === editingPension.id
                ? { ...pension, ...pensionData }
                : pension
            )
          );
        }
      } else {
        // 추가
        const targetSimIds = pensionData.selectedSimulationIds?.length
          ? pensionData.selectedSimulationIds
          : [activeSimulationId];
        // 첫 번째 시뮬레이션에 생성하여 id 획득
        const primarySimId = targetSimIds[0];
        const pensionId = await pensionService.createPension(
          profileId,
          primarySimId,
          pensionData
        );
        // 나머지 시뮬레이션들에 동일 id로 생성
        await Promise.all(
          targetSimIds
            .filter((sid) => sid !== primarySimId)
            .map((sid) =>
              pensionService.createPensionWithId(
                profileId,
                sid,
                pensionId,
                pensionData
              )
            )
        );
        if (primarySimId === activeSimulationId) {
          setPensions([...pensions, { id: pensionId, ...pensionData }]);
        }
      }

      setEditingPension(null);
      setIsPensionModalOpen(false);
    } catch (error) {
      console.error("연금 데이터 저장 오류:", error);
    }
  };

  const handleDeletePension = async (pensionId) => {
    if (!checkEditPermission("연금 삭제")) return;
    if (!window.confirm("이 연금 데이터를 삭제하시겠습니까?")) return;

    try {
      await pensionService.deletePension(
        profileId,
        activeSimulationId,
        pensionId
      );
      setPensions(pensions.filter((pension) => pension.id !== pensionId));
    } catch (error) {
      console.error("연금 데이터 삭제 오류:", error);
    }
  };

  // 부동산 핸들러들
  const handleAddRealEstate = () => {
    if (!checkEditPermission("부동산 추가")) return;
    setEditingRealEstate(null);
    setIsRealEstateModalOpen(true);
  };

  const handleEditRealEstate = (realEstate) => {
    if (!checkEditPermission("부동산 수정")) return;
    setEditingRealEstate(realEstate);
    setIsRealEstateModalOpen(true);
  };

  const handleSaveRealEstate = async (realEstateData) => {
    try {
      if (editingRealEstate) {
        // 수정 모드: 각 시뮬레이션에서 ID 존재 여부 확인 후 업데이트 또는 생성
        const targetSimIds = realEstateData.selectedSimulationIds?.length
          ? realEstateData.selectedSimulationIds
          : [activeSimulationId];

        // 각 시뮬레이션에서 해당 ID가 존재하는지 확인
        const checkPromises = targetSimIds.map(async (simId) => {
          try {
            const items = await realEstateService.getRealEstates(
              profileId,
              simId
            );
            const exists = items.some(
              (item) => item.id === editingRealEstate.id
            );
            return { simId, exists };
          } catch (error) {
            return { simId, exists: false };
          }
        });
        const checkResults = await Promise.all(checkPromises);

        // 존재하는 시뮬레이션은 업데이트, 없는 시뮬레이션은 생성
        const updatePromises = checkResults.map(({ simId, exists }) => {
          if (exists) {
            return realEstateService.updateRealEstate(
              profileId,
              simId,
              editingRealEstate.id,
              realEstateData
            );
          } else {
            return realEstateService.createRealEstateWithId(
              profileId,
              simId,
              editingRealEstate.id,
              realEstateData
            );
          }
        });
        await Promise.all(updatePromises);

        // 현재 탭 상태만 즉시 반영
        if (targetSimIds.includes(activeSimulationId)) {
          setRealEstates(
            realEstates.map((realEstate) =>
              realEstate.id === editingRealEstate.id
                ? { ...realEstate, ...realEstateData }
                : realEstate
            )
          );
        }
      } else {
        // 추가
        const targetSimIds = realEstateData.selectedSimulationIds?.length
          ? realEstateData.selectedSimulationIds
          : [activeSimulationId];
        // 첫 번째 시뮬레이션에 생성하여 id 획득
        const primarySimId = targetSimIds[0];
        const newRealEstateId = await realEstateService.createRealEstate(
          profileId,
          primarySimId,
          realEstateData
        );
        // 나머지 시뮬레이션들에 동일 id로 생성
        await Promise.all(
          targetSimIds
            .filter((sid) => sid !== primarySimId)
            .map((sid) =>
              realEstateService.createRealEstateWithId(
                profileId,
                sid,
                newRealEstateId,
                realEstateData
              )
            )
        );
        if (primarySimId === activeSimulationId) {
          setRealEstates([
            ...realEstates,
            { id: newRealEstateId, ...realEstateData },
          ]);
        }
      }

      setIsRealEstateModalOpen(false);
    } catch (error) {
      console.error("부동산 데이터 저장 오류:", error);
    }
  };

  const handleDeleteRealEstate = async (realEstateId) => {
    if (!checkEditPermission("부동산 삭제")) return;
    if (!window.confirm("이 부동산 데이터를 삭제하시겠습니까?")) return;

    try {
      await realEstateService.deleteRealEstate(
        profileId,
        activeSimulationId,
        realEstateId
      );
      setRealEstates(
        realEstates.filter((realEstate) => realEstate.id !== realEstateId)
      );
    } catch (error) {
      console.error("부동산 데이터 삭제 오류:", error);
    }
  };

  // 자산 관련 핸들러들
  const handleAddAsset = () => {
    if (!checkEditPermission("자산 추가")) return;
    setEditingAsset(null);
    setIsAssetModalOpen(true);
  };

  const handleEditAsset = (asset) => {
    if (!checkEditPermission("자산 수정")) return;
    setEditingAsset(asset);
    setIsAssetModalOpen(true);
  };

  const handleSaveAsset = async (assetData) => {
    try {
      if (editingAsset) {
        // 수정 모드: 각 시뮬레이션에서 ID 존재 여부 확인 후 업데이트 또는 생성
        const targetSimIds = assetData.selectedSimulationIds?.length
          ? assetData.selectedSimulationIds
          : [activeSimulationId];

        // 각 시뮬레이션에서 해당 ID가 존재하는지 확인
        const checkPromises = targetSimIds.map(async (simId) => {
          try {
            const items = await assetService.getAssets(profileId, simId);
            const exists = items.some((item) => item.id === editingAsset.id);
            return { simId, exists };
          } catch (error) {
            return { simId, exists: false };
          }
        });
        const checkResults = await Promise.all(checkPromises);

        // 존재하는 시뮬레이션은 업데이트, 없는 시뮬레이션은 생성
        const updatePromises = checkResults.map(({ simId, exists }) => {
          if (exists) {
            return assetService.updateAsset(
              profileId,
              simId,
              editingAsset.id,
              assetData
            );
          } else {
            return assetService.createAssetWithId(
              profileId,
              simId,
              editingAsset.id,
              assetData
            );
          }
        });
        await Promise.all(updatePromises);

        if (targetSimIds.includes(activeSimulationId)) {
          setAssets(
            assets.map((asset) =>
              asset.id === editingAsset.id ? { ...asset, ...assetData } : asset
            )
          );
        }
      } else {
        const targetSimIds = assetData.selectedSimulationIds?.length
          ? assetData.selectedSimulationIds
          : [activeSimulationId];
        const primarySimId = targetSimIds[0];
        const newAssetId = await assetService.createAsset(
          profileId,
          primarySimId,
          assetData
        );
        await Promise.all(
          targetSimIds
            .filter((sid) => sid !== primarySimId)
            .map((sid) =>
              assetService.createAssetWithId(
                profileId,
                sid,
                newAssetId,
                assetData
              )
            )
        );
        if (primarySimId === activeSimulationId) {
          setAssets([...assets, { id: newAssetId, ...assetData }]);
        }
      }

      setIsAssetModalOpen(false);
    } catch (error) {
      console.error("자산 데이터 저장 오류:", error);
    }
  };

  const handleDeleteAsset = async (assetId) => {
    if (!checkEditPermission("자산 삭제")) return;
    if (!window.confirm("이 자산 데이터를 삭제하시겠습니까?")) return;

    try {
      await assetService.deleteAsset(profileId, activeSimulationId, assetId);
      setAssets(assets.filter((asset) => asset.id !== assetId));
    } catch (error) {
      console.error("자산 데이터 삭제 오류:", error);
    }
  };

  // 부채 핸들러들
  const handleAddDebt = () => {
    if (!checkEditPermission("부채 추가")) return;
    setEditingDebt(null);
    setIsDebtModalOpen(true);
  };

  const handleEditDebt = (debt) => {
    if (!checkEditPermission("부채 수정")) return;
    setEditingDebt(debt);
    setIsDebtModalOpen(true);
  };

  const handleSaveDebt = async (debtData) => {
    try {
      if (editingDebt) {
        // 수정 모드: 각 시뮬레이션에서 ID 존재 여부 확인 후 업데이트 또는 생성
        const targetSimIds = debtData.selectedSimulationIds?.length
          ? debtData.selectedSimulationIds
          : [activeSimulationId];

        // 각 시뮬레이션에서 해당 ID가 존재하는지 확인
        const checkPromises = targetSimIds.map(async (simId) => {
          try {
            const items = await debtService.getDebts(profileId, simId);
            const exists = items.some((item) => item.id === editingDebt.id);
            return { simId, exists };
          } catch (error) {
            return { simId, exists: false };
          }
        });
        const checkResults = await Promise.all(checkPromises);

        // 존재하는 시뮬레이션은 업데이트, 없는 시뮬레이션은 생성
        const updatePromises = checkResults.map(({ simId, exists }) => {
          if (exists) {
            return debtService.updateDebt(
              profileId,
              simId,
              editingDebt.id,
              debtData
            );
          } else {
            return debtService.createDebtWithId(
              profileId,
              simId,
              editingDebt.id,
              debtData
            );
          }
        });
        await Promise.all(updatePromises);

        if (targetSimIds.includes(activeSimulationId)) {
          setDebts(
            debts.map((debt) =>
              debt.id === editingDebt.id ? { ...debt, ...debtData } : debt
            )
          );
        }
        setEditingDebt(null);
      } else {
        // 추가
        const targetSimIds = debtData.selectedSimulationIds?.length
          ? debtData.selectedSimulationIds
          : [activeSimulationId];
        const primarySimId = targetSimIds[0];
        const newDebt = await debtService.createDebt(
          profileId,
          primarySimId,
          debtData
        );
        const newId = newDebt.id;
        await Promise.all(
          targetSimIds
            .filter((sid) => sid !== primarySimId)
            .map((sid) =>
              debtService.createDebtWithId(profileId, sid, newId, debtData)
            )
        );
        if (primarySimId === activeSimulationId) {
          setDebts([...debts, newDebt]);
        }
      }

      setIsDebtModalOpen(false);
    } catch (error) {
      console.error("부채 데이터 저장 오류:", error);
    }
  };

  const handleDeleteDebt = async (debtId) => {
    if (!checkEditPermission("부채 삭제")) return;
    if (!window.confirm("이 부채 데이터를 삭제하시겠습니까?")) return;

    try {
      await debtService.deleteDebt(profileId, activeSimulationId, debtId);
      setDebts(debts.filter((debt) => debt.id !== debtId));
    } catch (error) {
      console.error("부채 데이터 삭제 오류:", error);
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
        handleAddDebt();
        break;
      default:
        break;
    }
  };

  // 재무 데이터 모달 핸들러
  const handleOpenFinancialModal = () => {
    setIsFinancialDataModalOpen(true);
  };

  const handleCloseFinancialModal = () => {
    setIsFinancialDataModalOpen(false);
  };

  const handleFinancialDataEdit = (category, item) => {
    // 기존 편집 핸들러들을 재사용
    switch (category) {
      case "incomes":
        setEditingIncome(item);
        setIsIncomeModalOpen(true);
        break;
      case "expenses":
        setEditingExpense(item);
        setIsExpenseModalOpen(true);
        break;
      case "savings":
        setEditingSaving(item);
        setIsSavingModalOpen(true);
        break;
      case "pensions":
        setEditingPension(item);
        setIsPensionModalOpen(true);
        break;
      case "realEstates":
        setEditingRealEstate(item);
        setIsRealEstateModalOpen(true);
        break;
      case "assets":
        setEditingAsset(item);
        setIsAssetModalOpen(true);
        break;
      case "debts":
        setEditingDebt(item);
        setIsDebtModalOpen(true);
        break;
      default:
        break;
    }
    // 재무 데이터 모달은 열어둠 (수정 모달 위에 표시)
    // setIsFinancialDataModalOpen(false);
  };

  const handleFinancialDataDelete = (category, itemId) => {
    // 기존 삭제 핸들러들을 재사용
    switch (category) {
      case "incomes":
        handleDeleteIncome(itemId);
        break;
      case "expenses":
        handleDeleteExpense(itemId);
        break;
      case "savings":
        handleDeleteSaving(itemId);
        break;
      case "pensions":
        handleDeletePension(itemId);
        break;
      case "realEstates":
        handleDeleteRealEstate(itemId);
        break;
      case "assets":
        handleDeleteAsset(itemId);
        break;
      case "debts":
        handleDeleteDebt(itemId);
        break;
      default:
        break;
    }
  };

  const handleFinancialDataAdd = (category) => {
    switch (category) {
      case "incomes":
        handleAddIncome();
        break;
      case "expenses":
        handleAddExpense();
        break;
      case "savings":
        handleAddSaving();
        break;
      case "pensions":
        handleAddPension();
        break;
      case "realEstates":
        handleAddRealEstate();
        break;
      case "assets":
        handleAddAsset();
        break;
      case "debts":
        handleAddDebt();
        break;
      default:
        break;
    }
  };
  const handleProfileSummaryItemClick = (type, item) => {
    switch (type) {
      case "income":
        handleEditIncome(item);
        break;
      case "expense":
        handleEditExpense(item);
        break;
      case "saving":
        handleEditSaving(item);
        break;
      case "pension":
        handleEditPension(item);
        break;
      case "realEstate":
        handleEditRealEstate(item);
        break;
      case "asset":
        handleEditAsset(item);
        break;
      case "debt":
        handleEditDebt(item);
        break;
      default:
        break;
    }
  };

  // ProfileSummary에서 항목 삭제 시 해당 삭제 핸들러 호출
  const handleProfileSummaryDelete = (type, itemId) => {
    switch (type) {
      case "income":
        handleDeleteIncome(itemId);
        break;
      case "expense":
        handleDeleteExpense(itemId);
        break;
      case "saving":
        handleDeleteSaving(itemId);
        break;
      case "pension":
        handleDeletePension(itemId);
        break;
      case "realEstate":
        handleDeleteRealEstate(itemId);
        break;
      case "asset":
        handleDeleteAsset(itemId);
        break;
      case "debt":
        handleDeleteDebt(itemId);
        break;
      default:
        break;
    }
  };

  // 시뮬레이션 관련 핸들러들
  const handleSaveSimulationMemo = useCallback(
    async (nextMemo) => {
      if (!checkEditPermission("시뮬레이션 메모 저장")) return;
      if (!profileId || !activeSimulationId) return;
      if ((simulationMemo || "") === nextMemo) return;

      try {
        setIsMemoSaving(true);
        trackEvent("시뮬레이션 메모 저장", {
          profileId,
          simulationId: activeSimulationId,
          memoLength: nextMemo.length,
        });
        await simulationService.updateSimulation(
          profileId,
          activeSimulationId,
          {
            memo: nextMemo,
          }
        );
        setSimulationMemo(nextMemo);
        setSimulations((prev) =>
          prev.map((sim) =>
            sim.id === activeSimulationId ? { ...sim, memo: nextMemo } : sim
          )
        );
      } catch (error) {
        console.error("시뮬레이션 메모 저장 오류:", error);
      } finally {
        setIsMemoSaving(false);
      }
    },
    [profileId, activeSimulationId, simulationMemo]
  );

  const handleSimulationTabChange = (simulationId) => {
    setActiveSimulationId(simulationId);
  };

  const openProfilePanel = (tab) => {
    // 권한이 없으면 회원가입 유도
    if (!hasEditPermission) {
      trackEvent("메모/체크리스트 접근 시도 (권한 없음)", {
        profileId,
        tab: tab,
      });
      if (
        confirm(
          `${
            tab === "memo" ? "프로필 메모" : "상담 체크리스트"
          }를 수정하려면 회원가입이 필요합니다. 회원가입 페이지로 이동하시겠습니까?`
        )
      ) {
        trackEvent("회원가입 페이지로 이동", {
          profileId,
          source: "메모/체크리스트",
        });
        navigate(`/signup?profileId=${profileId}`);
      }
      return;
    }
    trackEvent("프로필 패널 열기", {
      profileId,
      tab: tab,
    });
    setProfilePanelTab(tab);
    setIsProfilePanelOpen(true);
  };

  const closeProfilePanel = () => setIsProfilePanelOpen(false);

  const openDataStorePanel = () => {
    // 권한이 없으면 회원가입 유도
    if (!hasEditPermission) {
      trackEvent("재무 라이브러리 접근 시도 (권한 없음)", {
        profileId,
      });
      if (
        confirm(
          "재무 라이브러리를 사용하려면 회원가입이 필요합니다. 회원가입 페이지로 이동하시겠습니까?"
        )
      ) {
        trackEvent("회원가입 페이지로 이동", {
          profileId,
          source: "재무 라이브러리",
        });
        navigate(`/signup?profileId=${profileId}`);
      }
      return;
    }
    trackEvent("재무 라이브러리 열기", {
      profileId,
    });
    setIsDataStorePanelOpen(true);
  };

  const closeDataStorePanel = () => setIsDataStorePanelOpen(false);

  useEffect(() => {
    if (!isProfilePanelOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeProfilePanel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isProfilePanelOpen]);

  useEffect(() => {
    if (!isDataStorePanelOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeDataStorePanel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDataStorePanelOpen]);

  // 재무 라이브러리에서 템플릿 선택 시 처리
  const handleSelectTemplate = (templateData) => {
    const { category } = templateData;

    // 카테고리에 따라 적절한 모달 열기
    if (category === "income") {
      setInitialIncomeData(templateData);
      setIsIncomeModalOpen(true);
    } else if (category === "expense") {
      setInitialExpenseData(templateData);
      setIsExpenseModalOpen(true);
    }
  };

  // 재무 라이브러리에서 선택한 항목들 추가 (구버전, 호환성 유지)
  const handleAddDataStoreItems = async (items) => {
    if (!checkEditPermission("재무 데이터 추가")) return;
    if (!profileId || !activeSimulationId) return;

    try {
      for (const item of items) {
        const { category, ...itemData } = item;

        // 현재 연도와 은퇴년도 계산
        const currentYear = new Date().getFullYear();
        let retirementYear = currentYear + 10;
        if (profileData && profileData.birthYear && profileData.retirementAge) {
          const birth = parseInt(profileData.birthYear, 10);
          const retireAge = parseInt(profileData.retirementAge, 10);
          if (Number.isFinite(birth) && Number.isFinite(retireAge)) {
            const currentAge = calculateKoreanAge(birth, currentYear);
            const yearsToRetire = retireAge - currentAge;
            retirementYear =
              currentYear +
              (Number.isFinite(yearsToRetire) ? yearsToRetire : 10);
          }
        }

        // 카테고리별 필수 필드 보완
        let itemWithDefaults = {
          ...itemData,
          startYear: itemData.startYear || currentYear,
          endYear:
            itemData.endYear ||
            (category === "expense" ||
            category === "income" ||
            category === "saving"
              ? retirementYear
              : currentYear + 30),
        };

        // 카테고리별 추가 필드 설정
        if (category === "income" || category === "expense") {
          itemWithDefaults = {
            ...itemWithDefaults,
            amount: itemData.amount || 0,
            originalAmount: itemData.originalAmount || itemData.amount || 0,
            originalFrequency:
              itemData.originalFrequency || itemData.frequency || "monthly",
            growthRate: itemData.growthRate || 0,
            isFixedToRetirementYear: itemData.isFixedToRetirementYear || false,
          };
        } else if (category === "saving") {
          itemWithDefaults = {
            ...itemWithDefaults,
            amount: itemData.amount || 0,
            originalAmount: itemData.originalAmount || itemData.amount || 0,
            originalFrequency:
              itemData.originalFrequency || itemData.frequency || "monthly",
            interestRate: itemData.interestRate || 0,
            yearlyGrowthRate: itemData.yearlyGrowthRate || 0,
            currentAmount: itemData.currentAmount || 0,
            isFixedToRetirementYear: itemData.isFixedToRetirementYear || false,
          };
        } else if (category === "pension") {
          itemWithDefaults = {
            ...itemWithDefaults,
            type: itemData.type || "national",
            monthlyAmount: itemData.monthlyAmount || 0,
            inflationRate: itemData.inflationRate || 1.89,
          };
        }

        switch (category) {
          case "income":
            await incomeService.createIncome(
              profileId,
              activeSimulationId,
              itemWithDefaults
            );
            break;
          case "expense":
            await expenseService.createExpense(
              profileId,
              activeSimulationId,
              itemWithDefaults
            );
            break;
          case "saving":
            await savingsService.createSaving(
              profileId,
              activeSimulationId,
              itemWithDefaults
            );
            break;
          case "pension":
            // 연금 데이터 형식 변환
            const pensionData = {
              ...itemWithDefaults,
              title: itemData.title || itemWithDefaults.title,
              monthlyAmount: itemWithDefaults.monthlyAmount || 0,
              startYear: itemWithDefaults.startYear || currentYear,
              endYear: itemWithDefaults.endYear || currentYear + 30,
              inflationRate: itemWithDefaults.inflationRate || 1.89,
              memo: itemWithDefaults.memo || "",
            };
            await pensionService.createPension(
              profileId,
              activeSimulationId,
              pensionData
            );
            break;
          default:
            console.warn(`Unknown category: ${category}`);
        }
      }

      // 데이터 다시 로드
      await fetchSimulationFinancialData(activeSimulationId);

      // 패널 닫기
      closeDataStorePanel();

      trackEvent("재무 라이브러리 항목 추가", {
        profileId,
        itemCount: items.length,
      });
    } catch (error) {
      console.error("재무 라이브러리 항목 추가 오류:", error);
      alert("항목 추가 중 오류가 발생했습니다.");
    }
  };

  const handleSaveProfileMemo = async (memoValue) => {
    if (!checkEditPermission("프로필 메모 저장")) return;
    if (!profileId) return;
    if ((profileMemo || "") === memoValue) return;

    try {
      setIsProfileMemoSaving(true);
      trackEvent("프로필 메모 저장", {
        profileId,
        memoLength: memoValue.length,
      });
      await profileService.updateProfile(profileId, {
        memo: memoValue,
      });
      setProfileMemo(memoValue);
      setProfileData((prev) => (prev ? { ...prev, memo: memoValue } : prev));
    } catch (error) {
      console.error("프로필 메모 저장 오류:", error);
      alert("프로필 메모 저장 중 오류가 발생했습니다.");
    } finally {
      setIsProfileMemoSaving(false);
    }
  };

  const handleChecklistItemsChange = useCallback(
    async (nextItems, { persist }) => {
      // persist가 false면 로컬 상태만 업데이트 (권한 확인 안 함)
      if (persist && !checkEditPermission("상담 체크리스트 저장")) {
        return;
      }

      setProfileChecklist((prev) => {
        if (prev) {
          return { ...prev, items: nextItems };
        }
        if (checklistIdRef.current) {
          return {
            id: checklistIdRef.current,
            title: "체크리스트",
            items: nextItems,
          };
        }
        return prev;
      });

      if (persist && profileId) {
        try {
          setIsChecklistSaving(true);
          trackEvent("상담 체크리스트 저장", {
            profileId,
            itemCount: nextItems.length,
            isNew: !checklistIdRef.current,
          });
          if (!checklistIdRef.current) {
            const created = await checklistService.createChecklist(profileId, {
              title: "체크리스트",
              items: nextItems,
            });
            checklistIdRef.current = created.id;
            setProfileChecklist((prev) => ({
              id: created.id,
              title: created.title || "체크리스트",
              items: nextItems,
            }));
          } else {
            await checklistService.updateChecklist(
              profileId,
              checklistIdRef.current,
              {
                items: nextItems,
              }
            );
          }
        } catch (error) {
          console.error("체크리스트 저장 오류:", error);
          alert("체크리스트 저장 중 오류가 발생했습니다.");
        } finally {
          setIsChecklistSaving(false);
        }
      }
    },
    [profileId, checkEditPermission]
  );

  const handleOpenCompareModal = async () => {
    if (!defaultSimulationEntry) {
      alert("기본 시뮬레이션을 찾을 수 없습니다.");
      return;
    }
    if (!activeSimulationId) {
      alert("비교할 시뮬레이션을 선택하세요.");
      return;
    }

    // 현재 시뮬레이션이 기본 시뮬레이션과 같을 때는 기본 시뮬레이션만 표시
    const isCurrentSimulation =
      defaultSimulationEntry.id === activeSimulationId;

    setIsCompareModalOpen(true);
    setIsCompareLoading(true);
    try {
      if (isCurrentSimulation) {
        // 현재 시뮬레이션만 보이도록 기본 시뮬레이션 데이터만 로드
        const defaultData = await fetchSimulationFinancialData(
          defaultSimulationEntry.id
        );
        setComparisonData({
          defaultData,
          targetData: null, // null로 설정하여 비교하지 않음
          defaultTitle: defaultSimulationEntry.title || "현재",
          targetTitle: null,
        });
      } else {
        // 기존처럼 두 시뮬레이션 비교
        const [defaultData, targetData] = await Promise.all([
          fetchSimulationFinancialData(defaultSimulationEntry.id),
          fetchSimulationFinancialData(activeSimulationId),
        ]);

        const targetSimulation =
          simulations.find((sim) => sim.id === activeSimulationId) || {};

        setComparisonData({
          defaultData,
          targetData,
          defaultTitle: defaultSimulationEntry.title || "현재",
          targetTitle: targetSimulation.title || "선택된 시뮬레이션",
        });
      }
    } catch (error) {
      console.error("시뮬레이션 비교 데이터 로드 오류:", error);
      alert("시뮬레이션 비교 데이터를 불러오지 못했습니다.");
      setComparisonData({
        defaultData: null,
        targetData: null,
        defaultTitle: "",
        targetTitle: "",
      });
    } finally {
      setIsCompareLoading(false);
    }
  };

  const handleAddSimulation = async () => {
    if (!checkEditPermission("시뮬레이션 추가")) return;
    try {
      // 기본 시뮬레이션(현재) 찾기
      const defaultSimulation = simulations.find(
        (sim) => sim.isDefault === true
      );
      if (!defaultSimulation) {
        alert("기본 시뮬레이션을 찾을 수 없습니다.");
        return;
      }

      // 시뮬레이션 개수에 따라 자동으로 제목 생성 (시뮬레이션 2, 시뮬레이션 3, ...)
      const simulationNumber = simulations.length;
      const title = `시뮬레이션 ${simulationNumber}`;

      // 기본 시뮬레이션의 데이터를 복사하여 새 시뮬레이션 생성
      const newSimulationId = await simulationService.copySimulation(
        profileId,
        defaultSimulation.id,
        title
      );

      // 시뮬레이션 목록 다시 로드
      const updatedSimulations = await simulationService.getSimulations(
        profileId
      );
      setSimulations(updatedSimulations);

      // 새로 생성한 시뮬레이션으로 전환
      setActiveSimulationId(newSimulationId);
    } catch (error) {
      console.error("시뮬레이션 생성 오류:", error);
      alert("시뮬레이션 생성 중 오류가 발생했습니다: " + error.message);
    }
  };

  // 시뮬레이션 복제 핸들러 (우클릭 컨텍스트 메뉴에서 호출)
  const handleCopySimulation = async (sourceSimulationId) => {
    if (!checkEditPermission("시뮬레이션 복제")) return;
    try {
      // 복제할 시뮬레이션 찾기
      const sourceSimulation = simulations.find(
        (sim) => sim.id === sourceSimulationId
      );
      if (!sourceSimulation) {
        alert("복제할 시뮬레이션을 찾을 수 없습니다.");
        return;
      }

      // 시뮬레이션 개수에 따라 자동으로 제목 생성
      const simulationNumber = simulations.length;
      const title = `${sourceSimulation.title} 복사본`;

      // 선택된 시뮬레이션의 데이터를 복사하여 새 시뮬레이션 생성
      const newSimulationId = await simulationService.copySimulation(
        profileId,
        sourceSimulationId,
        title
      );

      // 시뮬레이션 목록 다시 로드
      const updatedSimulations = await simulationService.getSimulations(
        profileId
      );
      setSimulations(updatedSimulations);

      // 새로 생성한 시뮬레이션으로 전환
      setActiveSimulationId(newSimulationId);

      // Mixpanel 트래킹
      if (window.mixpanel) {
        window.mixpanel.track("시뮬레이션 복제", {
          sourceSimulationId: sourceSimulationId,
          sourceSimulationTitle: sourceSimulation.title,
          newSimulationId: newSimulationId,
        });
      }
    } catch (error) {
      console.error("시뮬레이션 복제 오류:", error);
      alert("시뮬레이션 복제 중 오류가 발생했습니다: " + error.message);
    }
  };

  const handleCreateSimulation = async (title) => {
    try {
      setIsCreatingSimulation(true);

      // 기본 시뮬레이션(현재) 찾기
      const defaultSimulation = simulations.find(
        (sim) => sim.isDefault === true
      );
      if (!defaultSimulation) {
        alert("기본 시뮬레이션을 찾을 수 없습니다.");
        return;
      }

      // 기본 시뮬레이션의 데이터를 복사하여 새 시뮬레이션 생성
      const newSimulationId = await simulationService.copySimulation(
        profileId,
        defaultSimulation.id,
        title
      );

      // 시뮬레이션 목록 다시 로드
      const updatedSimulations = await simulationService.getSimulations(
        profileId
      );
      setSimulations(updatedSimulations);

      // 새로 생성한 시뮬레이션으로 전환
      setActiveSimulationId(newSimulationId);

      alert(`"${title}" 시뮬레이션이 생성되었습니다!`);
    } catch (error) {
      console.error("시뮬레이션 생성 오류:", error);
      alert("시뮬레이션 생성 중 오류가 발생했습니다: " + error.message);
    }
  };

  const handleDeleteSimulation = async (simulationId) => {
    if (!checkEditPermission("시뮬레이션 삭제")) return;
    try {
      await simulationService.deleteSimulation(profileId, simulationId);

      // 시뮬레이션 목록 다시 로드
      const updatedSimulations = await simulationService.getSimulations(
        profileId
      );
      setSimulations(updatedSimulations);

      // 삭제한 시뮬레이션이 현재 활성화된 것이면 기본 시뮬레이션으로 전환
      if (activeSimulationId === simulationId) {
        const defaultSim = updatedSimulations.find(
          (sim) => sim.isDefault === true
        );
        if (defaultSim) {
          setActiveSimulationId(defaultSim.id);
        } else if (updatedSimulations.length > 0) {
          setActiveSimulationId(updatedSimulations[0].id);
        }
      }
    } catch (error) {
      console.error("시뮬레이션 삭제 오류:", error);
      alert(error.message || "시뮬레이션 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleRenameSimulation = async (simulationId, newTitle) => {
    if (!checkEditPermission("시뮬레이션 이름 변경")) return;
    try {
      await simulationService.updateSimulation(profileId, simulationId, {
        title: newTitle,
      });

      // 시뮬레이션 목록 업데이트
      setSimulations(
        simulations.map((sim) =>
          sim.id === simulationId ? { ...sim, title: newTitle } : sim
        )
      );
    } catch (error) {
      console.error("시뮬레이션 이름 변경 오류:", error);
      alert("시뮬레이션 이름 변경 중 오류가 발생했습니다.");
    }
  };

  // AI 분석 데이터 생성 핸들러 (옵션: "single" 또는 "compare")
  const handleGenerateAIAnalysis = async (option = "single") => {
    if (!profileData) return;

    setIsGeneratingAI(true);
    setIsAIOptionModalOpen(false);
    try {
      // 현재 선택된 시뮬레이션 정보
      const currentSimulation = simulations.find(
        (sim) => sim.id === activeSimulationId
      );
      const simulationTitle = currentSimulation
        ? currentSimulation.title
        : "알 수 없음";

      // 기본 시뮬레이션(현재) 찾기
      const defaultSimulation = simulations.find((sim) => sim.isDefault);
      const isCurrentDefault = defaultSimulation?.id === activeSimulationId;

      let promptText;

      // 옵션이 "compare"이고 기본 시뮬레이션이 아닌 경우: 기본 + 현재 두 개 비교
      if (option === "compare" && !isCurrentDefault && defaultSimulation) {
        // 기본 시뮬레이션 데이터 가져오기
        const defaultData = await fetchSimulationFinancialData(
          defaultSimulation.id
        );
        const defaultAnalysisData = extractAIAnalysisData(
          profileData,
          defaultData.incomes,
          defaultData.expenses,
          defaultData.savings,
          defaultData.pensions,
          defaultData.realEstates,
          defaultData.assets,
          defaultData.debts
        );

        // 현재 시뮬레이션 데이터
        const currentAnalysisData = extractAIAnalysisData(
          profileData,
          incomes,
          expenses,
          savings,
          pensions,
          realEstates,
          assets,
          debts
        );

        // 비교 프롬프트 생성
        promptText = `당신은 20년 경력의 전문 재무 상담사입니다. 두 가지 재무 시뮬레이션을 비교 분석하여 상세한 재무 상담과 구체적인 액션 플랜을 제시해주세요.

**비교 대상 시뮬레이션:**
- A: ${defaultSimulation.title} (기본 시뮬레이션)
- B: ${simulationTitle} (선택된 시뮬레이션)

## 비교 분석 요청사항

### 1. 두 시뮬레이션 차이점 분석
- A와 B의 주요 차이점 3가지 요약
- 각 시뮬레이션의 현금흐름 패턴 비교
- 은퇴 후 현금흐름 지속 가능성 비교

### 2. 자산 구조 비교
- A와 B의 자산 구성 비교
- 목표 자산 달성 가능성과 시점 비교
- 각 시뮬레이션의 리스크 수준 비교

### 3. 장단점 분석
- A 시뮬레이션의 장점과 단점
- B 시뮬레이션의 장점과 단점
- 어떤 시뮬레이션이 더 적합한지 판단

### 4. 권장 사항
- 두 시뮬레이션 중 어느 것을 선택하는 것이 좋은지
- 선택한 시뮬레이션에서 개선할 점
- 구체적인 액션 플랜 (금액과 시점 포함)

### 5. 시나리오별 대응
- 각 시뮬레이션에서 최악/최선의 시나리오 비교
- 리스크 관리 방안 비교

## 출력 형식
1. **시뮬레이션 비교 요약** (3-4줄)
2. **주요 차이점 3가지** (우선순위별)
3. **각 시뮬레이션 장단점**
4. **권장 시뮬레이션 및 이유**
5. **개선 방안 및 액션 플랜** (구체적 금액과 방법)
6. **위험 관리 방안 비교**
7. **예상 결과 비교** (구체적 수치로)

모든 제안은 한국의 금융 환경과 세제를 고려하여 현실적이고 실행 가능한 수준으로 제시해주세요.

## 💡 중요: 금액 단위 안내
**우리는 만원 단위를 사용합니다.**
- 1000 = 1,000만원 (1천만원)
- 10000 = 1억원 (1억원)
- 예: amount가 5000이면 → 5,000만원 (5천만원)

## 재무 데이터

### A: ${defaultSimulation.title} (기본 시뮬레이션)
${JSON.stringify(defaultAnalysisData, null, 2)}

### B: ${simulationTitle} (선택된 시뮬레이션)
${JSON.stringify(currentAnalysisData, null, 2)}`;

        alert(
          "현재 데이터와 선택된 시뮬레이션 데이터가 비교 형식으로 클립보드에 복사되었습니다!\nChatGPT에 붙여넣기하여 AI 비교 분석을 받아보세요."
        );
      } else {
        // 단일 시뮬레이션 분석 (option === "single" 또는 기본 시뮬레이션)
        const analysisData = extractAIAnalysisData(
          profileData,
          incomes,
          expenses,
          savings,
          pensions,
          realEstates,
          assets,
          debts
        );

        // 시뮬레이션 정보 추가
        analysisData.시뮬레이션 = simulationTitle;

        // AI 분석용 프롬프트와 데이터를 함께 구성
        promptText = `당신은 20년 경력의 전문 재무 상담사입니다. 제공된 재무 데이터를 분석하여 상세한 재무 상담과 구체적인 액션 플랜을 제시해주세요.

**분석 대상 시뮬레이션: ${simulationTitle}**

## 분석 요청사항

### 1. 현금흐름 분석
- 현재부터 은퇴까지의 현금흐름 패턴 분석
- 현금흐름이 마이너스가 되는 시점과 원인 파악
- 은퇴 후 현금흐름의 지속 가능성 평가
- 비상금 확보 필요 시점과 금액 제안

### 2. 자산 구조 분석
- 현재 자산 구성의 적절성 평가
- 목표 자산 달성 가능성과 시점 예측
- 자산 배분의 리스크 분석
- 부채 구조의 적정성 검토

### 3. 위험 요소 식별
- 재무적 위험 요소들을 우선순위별로 정리
- 각 위험 요소의 발생 시점과 영향도 분석
- 위험 완화를 위한 구체적 방안 제시

### 4. 구체적 액션 플랜
다음과 같은 구체적인 액션을 제시해주세요:

#### 즉시 실행 (1개월 내)
- 구체적인 금액과 함께 실행할 수 있는 행동들
- 예: "매월 50만원 추가 저축", "기존 대출 100만원 조기상환"

#### 단기 계획 (1년 내)
- 구체적인 목표와 달성 방법
- 예: "비상금 1000만원 확보", "투자 포트폴리오 재조정"

#### 중장기 계획 (3-5년)
- 구체적인 목표와 실행 전략
- 예: "부동산 투자 2억원", "연금 보험 가입"

### 5. 시나리오별 대응 방안
- 최악의 시나리오 (경기침체, 실직 등)
- 최선의 시나리오 (예상보다 높은 수익)
- 각 시나리오별 대응 전략

### 6. 구체적 수치 제시
- 모든 제안에 구체적인 금액과 시점 명시
- 예상 수익률과 리스크 수준 제시
- ROI(투자수익률) 계산 포함

## 출력 형식
1. **현재 상황 요약** (3-4줄)
2. **핵심 문제점 3가지** (우선순위별)
3. **즉시 실행 액션** (구체적 금액과 방법)
4. **단기 계획** (1년 내 목표와 방법)
5. **중장기 전략** (3-5년 계획)
6. **위험 관리 방안**
7. **예상 결과** (구체적 수치로)

모든 제안은 한국의 금융 환경과 세제를 고려하여 현실적이고 실행 가능한 수준으로 제시해주세요.

## 💡 중요: 금액 단위 안내
**우리는 만원 단위를 사용합니다.**
- 1000 = 1,000만원 (1천만원)
- 10000 = 1억원 (1억원)
- 예: amount가 5000이면 → 5,000만원 (5천만원)

## 재무 데이터
${JSON.stringify(analysisData, null, 2)}`;

        alert(
          "AI 분석용 프롬프트와 데이터가 클립보드에 복사되었습니다!\nChatGPT에 붙여넣기하여 AI 조언을 받아보세요."
        );
      }

      // 클립보드에 프롬프트와 데이터를 함께 복사
      await navigator.clipboard.writeText(promptText);
    } catch (error) {
      console.error("AI 분석 데이터 생성 오류:", error);
      alert("AI 분석 데이터 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // 카테고리별 이름 매핑
  const getCategoryName = (categoryId) => {
    const categoryMap = {
      income: "소득",
      expense: "지출",
      savings: "저축/투자",
      pension: "연금",
      realEstate: "부동산",
      assets: "자산",
      debt: "부채",
    };
    return categoryMap[categoryId] || "데이터";
  };

  // 로딩 상태 처리 (프로필 또는 시뮬레이션 로드 중)
  if (loading || !activeSimulationId) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>데이터를 불러오는 중...</div>
      </div>
    );
  }

  // 프로필이 없는 경우
  if (!profileData) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>프로필을 찾을 수 없습니다.</div>
        <button onClick={() => navigate("/consult")}>목록으로 돌아가기</button>
      </div>
    );
  }

  // 카테고리 설정
  const categories = [
    { id: "income", name: "소득", color: "#10b981", count: incomes.length },
    { id: "expense", name: "지출", color: "#ef4444", count: expenses.length },
    {
      id: "savings",
      name: "저축/투자",
      color: "#3b82f6",
      count: savings.length,
    },
    { id: "pension", name: "연금", color: "#8b5cf6", count: pensions.length },
    {
      id: "realEstate",
      name: "부동산",
      color: "#f59e0b",
      count: realEstates.length,
    },
    { id: "assets", name: "자산", color: "#f59e0b", count: assets.length },
    { id: "debt", name: "부채", color: "#6b7280", count: debts.length },
  ];

  if (!profileData) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>프로필을 찾을 수 없습니다.</div>
        <button onClick={() => navigate("/consult")}>목록으로 돌아가기</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 상단 프로필 정보 */}
      <div className={styles.profileHeader}>
        {isAdmin && (
          <button
            className={styles.backIconButton}
            onClick={() => navigate("/consult")}
            title="목록으로"
          >
            ←
          </button>
        )}
        <div className={styles.profileInfo}>
          <h1
            className={styles.profileName}
            onClick={handleEditProfile}
            title="클릭하여 수정"
          >
            {profileData.name}님
          </h1>
          <span
            className={styles.infoText}
            onClick={handleEditProfile}
            title="클릭하여 수정"
          >
            현재 {calculateKoreanAge(profileData.birthYear)}세
          </span>
          <span className={styles.infoDivider}>|</span>
          <span
            className={styles.infoText}
            onClick={handleEditProfile}
            title="클릭하여 수정"
          >
            은퇴 {profileData.retirementAge}세 (
            {(() => {
              const currentYear = new Date().getFullYear();
              const birth = parseInt(profileData.birthYear, 10);
              const retireAge = parseInt(profileData.retirementAge, 10);
              if (Number.isFinite(birth) && Number.isFinite(retireAge)) {
                const currentAge = calculateKoreanAge(birth, currentYear);
                const yearsToRetire = retireAge - currentAge;
                return (
                  currentYear +
                  (Number.isFinite(yearsToRetire) ? yearsToRetire : 0)
                );
              }
              return "?";
            })()}
            년)
          </span>
          <span className={styles.infoDivider}>|</span>
          <span
            className={styles.infoText}
            onClick={handleEditProfile}
            title="클릭하여 수정"
          >
            현금 {formatAmount(profileData.currentCash)}
          </span>
          <span className={styles.infoDivider}>|</span>
          <span
            className={styles.infoText}
            onClick={handleEditProfile}
            title="클릭하여 수정"
          >
            목표 {formatAmount(profileData.targetAssets)}
          </span>
          <span className={styles.infoDivider}>|</span>
          <span
            className={styles.infoText}
            onClick={handleEditProfile}
            title="클릭하여 수정"
          >
            가구{" "}
            {(() => {
              let count = 1;
              if (profileData.hasSpouse) count += 1;
              if (profileData.familyMembers)
                count += profileData.familyMembers.length;
              return count;
            })()}
            명
            {(profileData.hasSpouse ||
              (profileData.familyMembers &&
                profileData.familyMembers.length > 0)) && (
              <span className={styles.familyDetail}>
                {profileData.hasSpouse &&
                  `배우자(${calculateKoreanAge(
                    profileData.spouseBirthYear
                  )}세)${
                    profileData.familyMembers &&
                    profileData.familyMembers.length > 0
                      ? ", "
                      : ""
                  }`}
                {profileData.familyMembers &&
                  profileData.familyMembers.length > 0 &&
                  profileData.familyMembers.map((member, index) => {
                    // 자녀인 경우 성별 표시
                    const isChild = member.relationship === "자녀";
                    const currentAge = calculateKoreanAge(member.birthYear);

                    return (
                      <span key={member.id || `family-${index}`}>
                        {index > 0 && ", "}
                        {isChild && member.gender
                          ? `자녀(${member.gender}, ${currentAge}세)`
                          : `${
                              member.relationship || member.relation || "가족"
                            }(${currentAge}세)`}
                      </span>
                    );
                  })}
              </span>
            )}
          </span>
        </div>
        <div className={styles.profileActions}>
          <button className={styles.iconButton} onClick={openDataStorePanel}>
            <span className={styles.buttonText}>재무 라이브러리</span>
          </button>
          <button
            className={styles.iconButton}
            onClick={() => setIsCalculatorModalOpen(true)}
          >
            <span className={styles.buttonText}>목표 계산기</span>
          </button>
          <button
            className={styles.iconButton}
            onClick={() => openProfilePanel("memo")}
          >
            <span className={styles.buttonText}>프로필 메모</span>
          </button>
          <button
            className={styles.iconButton}
            onClick={() => openProfilePanel("checklist")}
          >
            <span className={styles.buttonText}>체크리스트</span>
          </button>
        </div>
      </div>

      {/* 시뮬레이션 탭 */}
      {simulations.length > 0 && activeSimulationId && (
        <SimulationTabs
          simulations={simulations}
          activeSimulationId={activeSimulationId}
          onTabChange={handleSimulationTabChange}
          onAddSimulation={handleAddSimulation}
          onDeleteSimulation={handleDeleteSimulation}
          onRenameSimulation={handleRenameSimulation}
          onCopySimulation={handleCopySimulation}
          isReadOnly={false}
        />
      )}

      {/* 사이드바 토글 버튼 & 재무 항목 요약 */}
      <div className={styles.summaryContainer}>
        <div className={styles.sidebarControlGroup}>
          <button
            className={styles.sidebarToggleButton}
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </button>
          <div className={styles.sidebarControlRightGroup}>
            {isAdmin && (
              <button
                className={styles.sidebarIconButton}
                title="AI 분석 데이터 추출"
                onClick={() => setIsAIOptionModalOpen(true)}
                disabled={isGeneratingAI || !activeSimulationId}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3v12" />
                  <path d="M8 11l4 4 4-4" />
                  <path d="M5 19h14" />
                </svg>
              </button>
            )}
            <button
              className={styles.sidebarIconButton}
              title="재무 데이터 전체 보기"
              onClick={handleOpenFinancialModal}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M7 8h10" />
                <path d="M7 12h10" />
                <path d="M7 16h6" />
              </svg>
            </button>
            {!isActiveSimulationDefault && (
              <button
                className={styles.sidebarIconButton}
                title="시뮬레이션 비교"
                onClick={handleOpenCompareModal}
                disabled={!activeSimulationId}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="4" y="4" width="6" height="12" rx="1" />
                  <rect x="14" y="8" width="6" height="12" rx="1" />
                  <path d="M4 20h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
        {/* 프로필 하단 빈 공간 */}
        <ProfileSummary />
      </div>

      {/* 메인 대시보드 */}
      <div className={styles.dashboardMain}>
        {/* 좌측 동적 사이드바 */}
        <div
          className={`${styles.sidebar} ${
            isSidebarCollapsed ? styles.collapsed : ""
          }`}
        >
          {sidebarView === "categories" ? (
            // 카테고리 목록 뷰
            <div className={`${styles.sidebarView} ${styles.categoriesView}`}>
              <div className={styles.categoryList}>
                {categories.map((category) => (
                  <div key={category.id} className={styles.categoryItem}>
                    <button
                      className={styles.categoryButton}
                      onClick={() => handleCategoryClick(category.id)}
                      data-category={category.id}
                    >
                      <span className={styles.categoryName}>
                        {category.name}
                      </span>
                      <span className={styles.categoryCount}>
                        {category.count}개
                      </span>
                    </button>
                    {/* 수정/삭제 버튼은 모두 표시, 클릭 시 권한 확인 */}
                    <button
                      className={styles.categoryAddButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCategory(category.id);
                        // 직접 해당 카테고리의 추가 함수 호출
                        switch (category.id) {
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
                            handleAddDebt();
                            break;
                          default:
                            break;
                        }
                      }}
                      title={`${category.name} 추가`}
                    >
                      +
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // 리스트 뷰
            <div className={`${styles.sidebarView} ${styles.listView}`}>
              <div className={styles.listHeader}>
                <button
                  className={styles.backIconButton}
                  onClick={handleBackToCategories}
                  title="뒤로가기"
                >
                  ←
                </button>
                <h2 className={styles.listTitle}>
                  {getCategoryName(selectedCategory)}
                </h2>
                <button
                  className={styles.addIconButton}
                  onClick={handleAddData}
                  title="추가"
                >
                  +
                </button>
              </div>
              <div className={styles.listContent}>
                {selectedCategory === "income" ? (
                  <IncomeList
                    incomes={incomes}
                    onEdit={handleEditIncome}
                    onDelete={handleDeleteIncome}
                    isReadOnly={false}
                  />
                ) : selectedCategory === "expense" ? (
                  <ExpenseList
                    expenses={expenses}
                    onEdit={handleEditExpense}
                    onDelete={handleDeleteExpense}
                    isReadOnly={false}
                  />
                ) : selectedCategory === "savings" ? (
                  <SavingList
                    savings={savings}
                    onEdit={handleEditSaving}
                    onDelete={handleDeleteSaving}
                    isReadOnly={false}
                  />
                ) : selectedCategory === "pension" ? (
                  <PensionList
                    pensions={pensions}
                    onEdit={handleEditPension}
                    onDelete={handleDeletePension}
                    isReadOnly={false}
                  />
                ) : selectedCategory === "realEstate" ? (
                  <RealEstateList
                    realEstates={realEstates}
                    onEdit={handleEditRealEstate}
                    onDelete={handleDeleteRealEstate}
                    isReadOnly={false}
                  />
                ) : selectedCategory === "assets" ? (
                  <AssetList
                    assets={assets}
                    onEdit={handleEditAsset}
                    onDelete={handleDeleteAsset}
                    isReadOnly={false}
                  />
                ) : selectedCategory === "debt" ? (
                  <DebtList
                    debts={debts}
                    onEdit={handleEditDebt}
                    onDelete={handleDeleteDebt}
                    isReadOnly={false}
                  />
                ) : (
                  <div className={styles.emptyList}>
                    <p>데이터가 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {sidebarView === "categories" && !isSidebarCollapsed && (
            <SimulationMemoPanel
              memo={simulationMemo}
              onSave={handleSaveSimulationMemo}
              isSaving={isMemoSaving}
              isDisabled={!activeSimulationId || !hasEditPermission}
            />
          )}
        </div>

        {/* 우측 메인 콘텐츠 - 그래프만 */}
        <div className={styles.mainContent}>
          <div className={styles.chartSection}>
            <div className={styles.chartGrid}>
              <div className={styles.chartContainer}>
                <RechartsCashflowChart
                  data={simulationData.cashflow}
                  retirementAge={profileData.retirementAge}
                  detailedData={simulationData.cashflowDetailed}
                  profileData={profileData} // 배우자 은퇴 정보를 위해 전체 프로필 데이터 전달
                  incomes={incomes}
                  expenses={expenses}
                  savings={savings}
                  pensions={pensions}
                  realEstates={realEstates}
                  assets={assets}
                  debts={debts}
                />
              </div>

              <div className={styles.chartContainer}>
                <RechartsAssetChart
                  data={simulationData.assets}
                  retirementAge={profileData.retirementAge}
                  spouseRetirementAge={profileData.spouseRetirementAge}
                  targetAssets={profileData.targetAssets}
                  profileData={profileData}
                  savings={savings}
                  pensions={pensions}
                  realEstates={realEstates}
                  assets={assets}
                  debts={debts}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 프로필 패널 오버레이 */}
      {isProfilePanelOpen && (
        <div
          className={styles.profilePanelOverlay}
          onClick={closeProfilePanel}
        />
      )}
      {/* 재무 라이브러리 패널 오버레이 */}
      {isDataStorePanelOpen && (
        <div
          className={styles.profilePanelOverlay}
          onClick={closeDataStorePanel}
        />
      )}

      {/* 프로필 패널 */}
      <div
        className={`${styles.profileSidePanel} ${
          isProfilePanelOpen ? styles.open : ""
        }`}
      >
        <div className={styles.profileSidePanelHeader}>
          <div className={styles.profileSidePanelTabs}>
            <button
              className={`${styles.panelTab} ${
                profilePanelTab === "memo" ? styles.active : ""
              }`}
              onClick={() => setProfilePanelTab("memo")}
              type="button"
            >
              프로필 메모
            </button>
            <button
              className={`${styles.panelTab} ${
                profilePanelTab === "checklist" ? styles.active : ""
              }`}
              onClick={() => setProfilePanelTab("checklist")}
              type="button"
            >
              체크리스트
            </button>
          </div>
          <button
            className={styles.profilePanelClose}
            onClick={closeProfilePanel}
            type="button"
          >
            →
          </button>
        </div>
        <div className={styles.profileSidePanelContent}>
          {profilePanelTab === "memo" ? (
            <ProfileMemoPanel
              memo={profileMemo}
              onSave={handleSaveProfileMemo}
              isSaving={isProfileMemoSaving}
              isDisabled={!hasEditPermission}
            />
          ) : (
            <ProfileChecklistPanel
              items={profileChecklist?.items || []}
              onItemsChange={handleChecklistItemsChange}
              isLoading={isChecklistLoading}
              isSaving={isChecklistSaving}
              disabled={isChecklistSaving || !hasEditPermission}
              isAdmin={isAdmin}
              onOpenTemplateModal={() => setIsTemplateModalOpen(true)}
            />
          )}
        </div>
      </div>

      {/* 재무 라이브러리 패널 */}
      <div
        className={`${styles.profileSidePanel} ${
          isDataStorePanelOpen ? styles.open : ""
        }`}
      >
        <div className={styles.profileSidePanelHeader}>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>
            재무 라이브러리
          </h3>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {isAdmin && (
              <button
                className={styles.profilePanelSettings}
                onClick={() => setIsManageModalOpen(true)}
                type="button"
                title="템플릿 관리"
              >
                ⚙
              </button>
            )}
            <button
              className={styles.profilePanelClose}
              onClick={closeDataStorePanel}
              type="button"
            >
              →
            </button>
          </div>
        </div>
        <div className={styles.profileSidePanelContent}>
          <FinancialDataStorePanel
            key={libraryRefreshKey}
            onSelectTemplate={handleSelectTemplate}
            profileData={profileData}
            onClose={closeDataStorePanel}
            isAdmin={isAdmin}
          />
        </div>
      </div>

      {/* 재무 라이브러리 관리 모달 */}
      <TemplateManageModal
        isOpen={isManageModalOpen}
        onClose={() => {
          setIsManageModalOpen(false);
          setLibraryRefreshKey((prev) => prev + 1); // 템플릿 목록 새로고침
        }}
      />

      {/* 소득 모달 */}
      <IncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => {
          setIsIncomeModalOpen(false);
          setInitialIncomeData(null);
          setEditingIncome(null); // 수정 데이터 초기화
        }}
        onSave={handleSaveIncome}
        editData={editingIncome}
        initialData={initialIncomeData}
        profileData={profileData}
        simulations={simulations}
        activeSimulationId={activeSimulationId}
        profileId={profileId}
      />

      {/* 지출 모달 */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setInitialExpenseData(null);
          setEditingExpense(null); // 수정 데이터 초기화
        }}
        onSave={handleSaveExpense}
        editData={editingExpense}
        initialData={initialExpenseData}
        profileData={profileData}
        simulations={simulations}
        activeSimulationId={activeSimulationId}
        profileId={profileId}
      />

      {/* 저축/투자 모달 */}
      <SavingModal
        isOpen={isSavingModalOpen}
        onClose={() => {
          setIsSavingModalOpen(false);
          setEditingSaving(null); // 수정 데이터 초기화
        }}
        onSave={handleSaveSaving}
        editData={editingSaving}
        profileData={profileData}
        simulations={simulations}
        activeSimulationId={activeSimulationId}
        profileId={profileId}
      />

      <PensionModal
        isOpen={isPensionModalOpen}
        onClose={() => {
          setIsPensionModalOpen(false);
          setEditingPension(null); // 수정 데이터 초기화
        }}
        onSave={handleSavePension}
        editData={editingPension}
        profileData={profileData}
        simulations={simulations}
        activeSimulationId={activeSimulationId}
        profileId={profileId}
      />

      <RealEstateModal
        isOpen={isRealEstateModalOpen}
        onClose={() => {
          setIsRealEstateModalOpen(false);
          setEditingRealEstate(null); // 수정 데이터 초기화
        }}
        onSave={handleSaveRealEstate}
        editData={editingRealEstate}
        profileData={profileData}
        simulations={simulations}
        activeSimulationId={activeSimulationId}
        profileId={profileId}
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
        onClose={() => {
          setIsAssetModalOpen(false);
          setEditingAsset(null); // 수정 데이터 초기화
        }}
        onSave={handleSaveAsset}
        editData={editingAsset}
        profileData={profileData}
        simulations={simulations}
        activeSimulationId={activeSimulationId}
        profileId={profileId}
      />

      {/* 부채 모달 */}
      <DebtModal
        isOpen={isDebtModalOpen}
        onClose={() => {
          setIsDebtModalOpen(false);
          setEditingDebt(null); // 수정 데이터 초기화
        }}
        onSave={handleSaveDebt}
        editData={editingDebt}
        profileData={profileData}
        simulations={simulations}
        activeSimulationId={activeSimulationId}
        profileId={profileId}
      />

      {/* 계산기 모달 */}
      <CalculatorModal
        isOpen={isCalculatorModalOpen}
        onClose={() => setIsCalculatorModalOpen(false)}
        profileData={profileData}
      />

      {/* 재무 데이터 모달 */}
      <FinancialDataModal
        isOpen={isFinancialDataModalOpen}
        onClose={handleCloseFinancialModal}
        isLoading={isFinancialDataLoading}
        profileData={profileData}
        financialData={{
          incomes,
          expenses,
          savings,
          pensions,
          realEstates,
          assets,
          debts,
        }}
        onEdit={handleFinancialDataEdit}
        onDelete={handleFinancialDataDelete}
        onAdd={handleFinancialDataAdd}
        isReadOnly={false}
      />

      <SimulationCompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        isLoading={isCompareLoading}
        defaultTitle={comparisonData.defaultTitle}
        targetTitle={comparisonData.targetTitle}
        defaultData={comparisonData.defaultData}
        targetData={comparisonData.targetData}
        profileData={profileData}
        currentSimulationId={activeSimulationId}
        simulations={simulations}
      />

      {/* AI 옵션 선택 모달 */}
      {isAIOptionModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsAIOptionModalOpen(false)}
        >
          <div
            className={styles.aiOptionModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.aiOptionHeader}>
              <h3 className={styles.aiOptionTitle}>AI 데이터 추출 옵션</h3>
              <button
                className={styles.aiOptionCloseButton}
                onClick={() => setIsAIOptionModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.aiOptionContent}>
              <p className={styles.aiOptionDescription}>
                어떤 방식으로 데이터를 추출하시겠습니까?
              </p>
              <div className={styles.aiOptionButtons}>
                <button
                  className={styles.aiOptionButton}
                  onClick={() => handleGenerateAIAnalysis("single")}
                  disabled={isGeneratingAI}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                  <div>
                    <strong>해당 시뮬레이션만 추출</strong>
                    <span>현재 시뮬레이션 데이터만 분석</span>
                  </div>
                </button>
                <button
                  className={styles.aiOptionButton}
                  onClick={() => handleGenerateAIAnalysis("compare")}
                  disabled={
                    isGeneratingAI ||
                    !simulations.some(
                      (sim) => sim.isDefault && sim.id !== activeSimulationId
                    )
                  }
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <path d="M9 15h6" />
                  </svg>
                  <div>
                    <strong>현재와 비교</strong>
                    <span>기본 시뮬레이션과 비교 분석</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 체크리스트 템플릿 수정 모달 (관리자 전용) */}
      <ChecklistTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
      />
    </div>
  );
}

const ProfileMemoPanel = React.memo(function ProfileMemoPanel({
  memo,
  onSave,
  isSaving,
  isDisabled,
}) {
  const [value, setValue] = useState(memo || "");
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setValue(memo || "");
    setIsDirty(false);
  }, [memo]);

  const handleChange = (event) => {
    if (isDisabled) return;
    const nextValue = event.target.value;
    setValue(nextValue);
    setIsDirty(nextValue !== (memo || ""));
  };

  const handleSave = () => {
    if (isDisabled || !isDirty || isSaving) return;
    onSave?.(value);
  };

  return (
    <div className={styles.profileMemoSection}>
      <div className={styles.profileMemoHeader}>
        <label className={styles.profileMemoLabel} htmlFor="profileMemo">
          프로필 메모
        </label>
        <button
          className={styles.profileMemoSaveButton}
          type="button"
          onClick={handleSave}
          disabled={isDisabled || isSaving || !isDirty}
        >
          {isSaving ? "저장 중..." : "저장"}
        </button>
      </div>
      <textarea
        id="profileMemo"
        className={styles.profileMemoTextarea}
        value={value}
        onChange={handleChange}
        placeholder={
          isDisabled
            ? "수정하려면 회원가입이 필요합니다."
            : "프로필 전반에 대한 메모를 기록하세요."
        }
        disabled={isDisabled}
      />
    </div>
  );
});

export default DashboardPage;

const SimulationMemoPanel = React.memo(function SimulationMemoPanel({
  memo,
  onSave,
  isSaving,
  isDisabled,
}) {
  const [value, setValue] = useState(memo || "");
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setValue(memo || "");
    setIsDirty(false);
  }, [memo]);

  const handleChange = (event) => {
    const nextValue = event.target.value;
    setValue(nextValue);
    setIsDirty(nextValue !== (memo || ""));
  };

  const handleSave = () => {
    if (isDisabled || !isDirty || isSaving) return;
    onSave?.(value);
  };

  return (
    <div className={styles.sidebarMemoSection}>
      <div className={styles.memoHeader}>
        <span className={styles.memoTitle}>시뮬레이션 메모</span>
        <button
          className={styles.memoSaveButton}
          onClick={handleSave}
          disabled={isDisabled || !isDirty || isSaving}
          type="button"
        >
          {isSaving ? "저장 중..." : "저장"}
        </button>
      </div>
      <textarea
        className={styles.memoTextarea}
        placeholder={
          isDisabled
            ? "수정하려면 회원가입이 필요합니다."
            : "메모를 작성하세요."
        }
        value={value}
        onChange={handleChange}
        disabled={isDisabled}
      />
    </div>
  );
});
