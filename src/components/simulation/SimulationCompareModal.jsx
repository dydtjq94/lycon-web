import React, { useEffect, useMemo, useState, useCallback } from "react";
import styles from "./SimulationCompareModal.module.css";
import incomeStyles from "../income/IncomeList.module.css";
import expenseStyles from "../expense/ExpenseList.module.css";
import savingStyles from "../saving/SavingList.module.css";
import pensionStyles from "../pension/PensionList.module.css";
import realEstateStyles from "../realestate/RealEstateList.module.css";
import assetStyles from "../asset/AssetList.module.css";
import debtStyles from "../debt/DebtList.module.css";
import IncomeList from "../income/IncomeList";
import ExpenseList from "../expense/ExpenseList";
import SavingList from "../saving/SavingList";
import PensionList from "../pension/PensionList";
import RealEstateList from "../realestate/RealEstateList";
import AssetList from "../asset/AssetList";
import DebtList from "../debt/DebtList";
import IncomeModal from "../income/IncomeModal";
import ExpenseModal from "../expense/ExpenseModal";
import SavingModal from "../saving/SavingModal";
import PensionModal from "../pension/PensionModal";
import RealEstateModal from "../realestate/RealEstateModal";
import AssetModal from "../asset/AssetModal";
import DebtModal from "../debt/DebtModal";
import { calculateLifetimeCashFlowTotals } from "../../utils/presentValueCalculator";
import { formatAmountForChart, formatAmount } from "../../utils/format";
import {
  calculateAssetSimulation,
  calculateCashflowSimulation,
} from "../../utils/cashflowSimulator";
import { trackEvent } from "../../libs/mixpanel";
import {
  incomeService,
  expenseService,
  savingsService,
  pensionService,
  realEstateService,
  assetService,
  debtService,
} from "../../services/firestoreService";

const categoryConfigs = [
  {
    key: "incomes",
    label: "소득",
    component: IncomeList,
    propName: "incomes",
    modalComponent: IncomeModal,
  },
  {
    key: "expenses",
    label: "지출",
    component: ExpenseList,
    propName: "expenses",
    modalComponent: ExpenseModal,
  },
  {
    key: "savings",
    label: "저축/투자",
    component: SavingList,
    propName: "savings",
    modalComponent: SavingModal,
  },
  {
    key: "pensions",
    label: "연금",
    component: PensionList,
    propName: "pensions",
    modalComponent: PensionModal,
  },
  {
    key: "realEstates",
    label: "부동산",
    component: RealEstateList,
    propName: "realEstates",
    modalComponent: RealEstateModal,
  },
  {
    key: "assets",
    label: "자산",
    component: AssetList,
    propName: "assets",
    modalComponent: AssetModal,
  },
  {
    key: "debts",
    label: "부채",
    component: DebtList,
    propName: "debts",
    modalComponent: DebtModal,
  },
];

// 컴포넌트 외부로 이동: cashflow 데이터 필터링 함수 (React Hook 의존성 문제 해결)
const filterCashflowByPeriod = (cashflow, period, retirementYear) => {
  if (!cashflow || !retirementYear) return cashflow;

  switch (period) {
    case "beforeRetirement": // 은퇴전(포함)
      return cashflow.filter((cf) => cf.year <= retirementYear);
    case "afterRetirement": // 은퇴 이후
      return cashflow.filter((cf) => cf.year > retirementYear);
    case "all": // 전체
    default:
      return cashflow;
  }
};

function SimulationCompareModal({
  isOpen,
  onClose,
  isLoading,
  defaultTitle,
  targetTitle,
  defaultData,
  targetData,
  profileData,
  currentSimulationId,
  simulations,
  onDataRefresh, // 데이터 새로고침 콜백 추가
}) {
  // 선택된 시뮬레이션 ID 목록 (현재 시뮬레이션은 항상 포함)
  const defaultSimulationEntry = useMemo(
    () => simulations?.find((sim) => sim.isDefault) || simulations?.[0],
    [simulations]
  );

  const [selectedSimulationIds, setSelectedSimulationIds] = useState(() => {
    const defaultSimId =
      simulations?.find((sim) => sim.isDefault)?.id || simulations?.[0]?.id;
    return defaultSimId ? [defaultSimId] : [];
  });

  // 선택된 시뮬레이션들의 데이터
  const [simulationsData, setSimulationsData] = useState({});

  // 데이터 로딩 상태
  const [isDataLoading, setIsDataLoading] = useState(false);

  // 세부 항목 토글 상태 (기본값: 접혀있음)
  const [expandedRows, setExpandedRows] = useState({});

  // 생애 자금 수급/수요 탭 상태 (기본값: 전체)
  const [cashflowPeriod, setCashflowPeriod] = useState("all");

  // 메인 탭 상태 (기본값: 생애 자금)
  const [activeTab, setActiveTab] = useState("cashflow");

  // 재무 데이터 수정 모달 상태
  const [editModal, setEditModal] = useState({
    isOpen: false,
    type: null, // 'income', 'expense', 'saving', etc.
    data: null,
    simulationId: null, // 수정할 시뮬레이션 ID
  });

  // 시뮬레이션 데이터 로드 함수
  const fetchSimulationData = useCallback(
    async (simulationId) => {
      if (!profileData?.id || !simulationId) return null;

      try {
        const [
          incomeData,
          expenseData,
          savingData,
          pensionData,
          realEstateData,
          assetsData,
          debtData,
        ] = await Promise.all([
          incomeService.getIncomes(profileData.id, simulationId),
          expenseService.getExpenses(profileData.id, simulationId),
          savingsService.getSavings(profileData.id, simulationId),
          pensionService.getPensions(profileData.id, simulationId),
          realEstateService.getRealEstates(profileData.id, simulationId),
          assetService.getAssets(profileData.id, simulationId),
          debtService.getDebts(profileData.id, simulationId),
        ]);

        const sortByCreatedAt = (list) =>
          list
            ? [...list].sort(
                (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
              )
            : [];

        const incomes = sortByCreatedAt(incomeData);
        const expenses = sortByCreatedAt(expenseData);
        const savings = sortByCreatedAt(savingData);
        const pensions = sortByCreatedAt(pensionData);
        const realEstates = sortByCreatedAt(realEstateData);
        const assets = sortByCreatedAt(assetsData);
        const debts = sortByCreatedAt(debtData);

        // 해당 시뮬레이션의 투자 규칙 가져오기
        const simulation = simulations.find((sim) => sim.id === simulationId);
        const profileDataWithSimulation = {
          ...profileData,
          cashflowInvestmentRules: simulation?.cashflowInvestmentRules || {},
        };

        // cashflow 계산 (투자 규칙이 포함된 profileData 사용)
        const cashflow = calculateCashflowSimulation(
          profileDataWithSimulation,
          incomes,
          expenses,
          savings,
          pensions,
          realEstates,
          assets,
          debts
        );

        return {
          incomes,
          expenses,
          savings,
          pensions,
          realEstates,
          assets,
          debts,
          cashflow,
        };
      } catch (error) {
        console.error(`시뮬레이션 ${simulationId} 데이터 로드 오류:`, error);
        return null;
      }
    },
    [profileData, simulations]
  );

  // 선택된 시뮬레이션들의 데이터 로드
  useEffect(() => {
    if (!isOpen || selectedSimulationIds.length === 0) return;

    const loadData = async () => {
      setIsDataLoading(true);
      const newData = {};

      // 모달이 열릴 때마다 최신 데이터를 가져오기 위해 조건 제거
      for (const simId of selectedSimulationIds) {
        const data = await fetchSimulationData(simId);
        if (data) {
          newData[simId] = data;
        }
      }

      if (Object.keys(newData).length > 0) {
        setSimulationsData(newData); // 기존 데이터를 덮어쓰지 않고 완전히 교체
      }
      setIsDataLoading(false);
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedSimulationIds, fetchSimulationData]);

  // 모달이 열릴 때 초기 선택 설정
  useEffect(() => {
    if (isOpen) {
      // 모달이 열리면 기본 시뮬레이션과 현재 활성 시뮬레이션을 선택
      const defaultSimId =
        simulations?.find((sim) => sim.isDefault)?.id || simulations?.[0]?.id;
      const activeSimId = currentSimulationId;

      const initialSelection = new Set();
      if (defaultSimId) initialSelection.add(defaultSimId);
      if (activeSimId && activeSimId !== defaultSimId)
        initialSelection.add(activeSimId);

      if (initialSelection.size > 0) {
        setSelectedSimulationIds(Array.from(initialSelection));
      }
    } else {
      // 모달이 닫히면 선택을 기본으로 리셋하고 캐시 초기화
      const defaultSimId =
        simulations?.find((sim) => sim.isDefault)?.id || simulations?.[0]?.id;
      if (defaultSimId) {
        setSelectedSimulationIds([defaultSimId]);
      }
      // 캐시된 데이터 초기화하여 다음에 열 때 최신 데이터 로드
      setSimulationsData({});
    }
  }, [isOpen, simulations, currentSimulationId]);

  // 시뮬레이션 선택 토글
  const handleToggleSimulation = (simulationId) => {
    const defaultSimId = defaultSimulationEntry?.id;

    // "현재" 시뮬레이션은 항상 선택되어 있어야 함
    if (simulationId === defaultSimId) {
      return;
    }

    setSelectedSimulationIds((prev) => {
      if (prev.includes(simulationId)) {
        // 이미 선택되어 있으면 제거 (최소 1개는 유지)
        return prev.length > 1
          ? prev.filter((id) => id !== simulationId)
          : prev;
      } else {
        // 선택 추가
        return [...prev, simulationId];
      }
    });
  };

  // 재무 데이터 수정 핸들러
  const handleEditData = (type, data, simulationId) => {
    setEditModal({
      isOpen: true,
      type: type,
      data: data,
      simulationId: simulationId,
    });

    trackEvent("시뮬레이션 비교 모달에서 재무 데이터 수정 시작", {
      type: type,
      dataTitle: data?.title || "",
      simulationId: simulationId,
    });
  };

  // 재무 데이터 삭제 핸들러
  const handleDeleteData = async (type, itemId, simulationId) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) {
      return;
    }

    try {
      console.log(`[시뮬레이션 비교] ${type} 데이터 삭제 시작:`, itemId);

      if (!profileData?.id) {
        throw new Error("프로필 ID가 없습니다.");
      }

      // 각 타입별 서비스 선택
      const serviceMap = {
        income: incomeService,
        expense: expenseService,
        saving: savingsService,
        pension: pensionService,
        realEstate: realEstateService,
        asset: assetService,
        debt: debtService,
      };

      const service = serviceMap[type];
      if (!service) {
        throw new Error(`알 수 없는 데이터 타입: ${type}`);
      }

      const deleteMethodName = `delete${
        type.charAt(0).toUpperCase() + type.slice(1)
      }`;
      await service[deleteMethodName](profileData.id, simulationId, itemId);

      console.log(`✅ [시뮬레이션 비교] ${simulationId}에서 ${type} 삭제 완료`);

      trackEvent("시뮬레이션 비교 모달에서 재무 데이터 삭제 완료", {
        type: type,
        simulationId: simulationId,
      });

      // 로컬 state 즉시 업데이트
      const updatedData = await fetchSimulationData(simulationId);
      if (updatedData) {
        setSimulationsData((prev) => ({
          ...prev,
          [simulationId]: updatedData,
        }));
      }

      if (onDataRefresh) {
        await onDataRefresh();
      }
      console.log("✅ 변경사항 반영 완료!");
    } catch (error) {
      console.error(`❌ [시뮬레이션 비교] ${type} 데이터 삭제 오류:`, error);
      alert(`삭제 중 오류가 발생했습니다: ${error.message}`);

      trackEvent("시뮬레이션 비교 모달에서 재무 데이터 삭제 오류", {
        type: type,
        error: error.message,
      });
    }
  };

  // 재무 데이터 수정 모달 닫기
  const handleCloseEditModal = () => {
    setEditModal({
      isOpen: false,
      type: null,
      data: null,
      simulationId: null,
    });
  };

  // 재무 데이터 저장 핸들러
  const handleSaveFinancialData = async (type, data) => {
    try {
      console.log(`[시뮬레이션 비교] ${type} 데이터 저장 시작:`, data);

      // profileId가 없으면 오류
      if (!profileData?.id) {
        throw new Error("프로필 ID가 없습니다.");
      }

      // 저장할 시뮬레이션 ID 목록
      const simulationIdsToSave =
        data.selectedSimulationIds ||
        (currentSimulationId ? [currentSimulationId] : []);

      if (simulationIdsToSave.length === 0) {
        throw new Error("적용할 시뮬레이션을 선택해주세요.");
      }

      // 각 타입별 서비스 선택
      const serviceMap = {
        income: incomeService,
        expense: expenseService,
        saving: savingsService,
        pension: pensionService,
        realEstate: realEstateService,
        asset: assetService,
        debt: debtService,
      };

      const service = serviceMap[type];
      if (!service) {
        throw new Error(`알 수 없는 데이터 타입: ${type}`);
      }

      // 수정 모드인지 확인 (editData에 id가 있으면 수정)
      const isEditMode = data.id ? true : false;

      // 각 시뮬레이션에 저장
      for (const simId of simulationIdsToSave) {
        if (isEditMode) {
          // 수정 모드: 해당 시뮬레이션에 같은 ID가 있는지 확인
          const updateMethodName = `update${
            type.charAt(0).toUpperCase() + type.slice(1)
          }`;
          const createWithIdMethodName = `create${
            type.charAt(0).toUpperCase() + type.slice(1)
          }WithId`;

          // 해당 시뮬레이션의 데이터 가져오기
          const getMethodName = `get${
            type.charAt(0).toUpperCase() + type.slice(1)
          }s`;
          const existingItems = await service[getMethodName](
            profileData.id,
            simId
          );
          const existingItem = existingItems.find(
            (item) => item.id === data.id
          );

          if (existingItem) {
            // 같은 ID가 있으면 업데이트
            await service[updateMethodName](
              profileData.id,
              simId,
              data.id,
              data
            );
            console.log(
              `✅ [시뮬레이션 비교] ${simId}에서 ${type} 업데이트 완료`
            );
          } else {
            // 같은 ID가 없으면 새로 생성 (ID 유지)
            if (service[createWithIdMethodName]) {
              await service[createWithIdMethodName](
                profileData.id,
                simId,
                data.id,
                data
              );
              console.log(
                `✅ [시뮬레이션 비교] ${simId}에 ${type} 추가 완료 (ID 유지)`
              );
            } else {
              console.warn(
                `⚠️ createWithId 메서드가 없음: ${createWithIdMethodName}`
              );
            }
          }
        } else {
          // 추가 모드: 새로 생성
          const createMethodName = `create${
            type.charAt(0).toUpperCase() + type.slice(1)
          }`;
          await service[createMethodName](profileData.id, simId, data);
          console.log(`✅ [시뮬레이션 비교] ${simId}에 ${type} 추가 완료`);
        }
      }

      // 저장 성공
      trackEvent("시뮬레이션 비교 모달에서 재무 데이터 저장 완료", {
        type: type,
        isEditMode: isEditMode,
        simulationCount: simulationIdsToSave.length,
      });

      // 모달 닫기
      handleCloseEditModal();

      // 로컬 state 즉시 업데이트 (서버 요청 없이 빠른 반영)
      console.log("⚡ 로컬 state 즉시 업데이트...");

      // 영향을 받은 시뮬레이션들의 데이터 다시 로드
      const affectedSimIds = simulationIdsToSave.filter((id) =>
        selectedSimulationIds.includes(id)
      );
      if (affectedSimIds.length > 0) {
        const updatedData = {};
        for (const simId of affectedSimIds) {
          const data = await fetchSimulationData(simId);
          if (data) {
            updatedData[simId] = data;
          }
        }
        if (Object.keys(updatedData).length > 0) {
          setSimulationsData((prev) => ({ ...prev, ...updatedData }));
        }
      }

      if (onDataRefresh) {
        await onDataRefresh();
      }
      console.log("✅ 변경사항 반영 완료!");
    } catch (error) {
      console.error(`❌ [시뮬레이션 비교] ${type} 데이터 저장 오류:`, error);
      alert(`저장 중 오류가 발생했습니다: ${error.message}`);

      trackEvent("시뮬레이션 비교 모달에서 재무 데이터 저장 오류", {
        type: type,
        error: error.message,
      });
    }
  };

  // 재무 데이터 수정 모달 렌더링 함수 (React 내부 오류 방지)
  const renderEditModal = () => {
    if (!editModal.isOpen) return null;

    const commonProps = {
      isOpen: editModal.isOpen,
      onClose: handleCloseEditModal,
      profileId: profileData?.id,
      profileData: profileData,
      editData: editModal.data,
      activeSimulationId: editModal.simulationId || currentSimulationId,
      simulations: simulations,
    };

    switch (editModal.type) {
      case "income":
        return (
          <IncomeModal
            key="income-modal"
            {...commonProps}
            onSave={(data) => handleSaveFinancialData("income", data)}
          />
        );
      case "expense":
        return (
          <ExpenseModal
            key="expense-modal"
            {...commonProps}
            onSave={(data) => handleSaveFinancialData("expense", data)}
          />
        );
      case "saving":
        return (
          <SavingModal
            key="saving-modal"
            {...commonProps}
            onSave={(data) => handleSaveFinancialData("saving", data)}
          />
        );
      case "pension":
        return (
          <PensionModal
            key="pension-modal"
            {...commonProps}
            onSave={(data) => handleSaveFinancialData("pension", data)}
          />
        );
      case "realEstate":
        return (
          <RealEstateModal
            key="realEstate-modal"
            {...commonProps}
            onSave={(data) => handleSaveFinancialData("realEstate", data)}
          />
        );
      case "asset":
        return (
          <AssetModal
            key="asset-modal"
            {...commonProps}
            onSave={(data) => handleSaveFinancialData("asset", data)}
          />
        );
      case "debt":
        return (
          <DebtModal
            key="debt-modal"
            {...commonProps}
            onSave={(data) => handleSaveFinancialData("debt", data)}
          />
        );
      default:
        return null;
    }
  };

  // 재무 데이터를 현재 시뮬레이션 기준으로 정렬하는 함수
  const sortByCurrentSimulation = (data, currentData) => {
    if (!Array.isArray(data) || data.length === 0) return data;
    if (!Array.isArray(currentData) || currentData.length === 0) return data;

    // 현재 시뮬레이션의 ID 목록 추출
    const currentIds = new Set(
      currentData.map((item) => item.id).filter(Boolean)
    );

    // 데이터를 두 그룹으로 나눔
    const itemsWithCurrentId = []; // 현재 시뮬레이션에 있는 ID
    const itemsWithoutCurrentId = []; // 새로 추가된 ID

    data.forEach((item) => {
      if (item.id && currentIds.has(item.id)) {
        itemsWithCurrentId.push(item);
      } else {
        itemsWithoutCurrentId.push(item);
      }
    });

    // 현재 시뮬레이션의 ID 순서대로 정렬
    const currentIdOrder = currentData.map((item) => item.id).filter(Boolean);
    itemsWithCurrentId.sort((a, b) => {
      const indexA = currentIdOrder.indexOf(a.id);
      const indexB = currentIdOrder.indexOf(b.id);
      return indexA - indexB;
    });

    // 현재 시뮬레이션에 있는 항목들을 먼저, 새로 추가된 항목들은 뒤에
    return [...itemsWithCurrentId, ...itemsWithoutCurrentId];
  };

  // 카테고리별 필드 정의 (비교용)
  const categoryFieldDefinitions = {
    incomes: [
      { key: "title", label: "제목", format: (v) => v },
      {
        key: "originalAmount",
        label: "금액",
        format: (v, item) =>
          `${formatAmount(v)}/${
            item.originalFrequency === "monthly" ? "월" : "년"
          }`,
      },
      { key: "startYear", label: "시작년도", format: (v) => `${v}년` },
      { key: "endYear", label: "종료년도", format: (v) => `${v}년` },
      { key: "growthRate", label: "상승률", format: (v) => `${v}%` },
      { key: "memo", label: "메모", format: (v) => v || "-" },
    ],
    expenses: [
      { key: "title", label: "제목", format: (v) => v },
      {
        key: "amount",
        label: "금액",
        format: (v, item) =>
          `${formatAmount(v)}/${item.frequency === "monthly" ? "월" : "년"}`,
      },
      { key: "startYear", label: "시작년도", format: (v) => `${v}년` },
      { key: "endYear", label: "종료년도", format: (v) => `${v}년` },
      { key: "growthRate", label: "상승률", format: (v) => `${v}%` },
      { key: "memo", label: "메모", format: (v) => v || "-" },
    ],
    savings: [
      { key: "title", label: "제목", format: (v) => v },
      {
        key: "currentAmount",
        label: "기 보유",
        format: (v) => (v > 0 ? formatAmount(v) : "-"),
      },
      {
        key: "originalAmount",
        label: "납입액",
        format: (v, item) =>
          `${formatAmount(v)}/${
            item.originalFrequency === "monthly"
              ? "월"
              : item.originalFrequency === "yearly"
              ? "년"
              : "일회성"
          }`,
      },
      { key: "startYear", label: "시작년도", format: (v) => `${v}년` },
      { key: "endYear", label: "종료년도", format: (v) => `${v}년` },
      {
        key: "interestRate",
        label: "연평균 수익률",
        format: (v) => `${(v * 100).toFixed(2)}%`,
      },
      {
        key: "yearlyGrowthRate",
        label: "저축/투자액 증가율",
        format: (v) => (v > 0 ? `${(v * 100).toFixed(2)}%` : "-"),
      },
      { key: "memo", label: "메모", format: (v) => v || "-" },
    ],
    pensions: [
      { key: "title", label: "제목", format: (v) => v },
      {
        key: "type",
        label: "연금 타입",
        format: (v) => {
          switch (v) {
            case "national":
              return "국민연금";
            case "retirement":
              return "퇴직연금";
            case "personal":
              return "개인연금";
            case "severance":
              return "퇴직금/DB";
            default:
              return "연금";
          }
        },
      },
      {
        key: "monthlyAmount",
        label: "월 수령액",
        format: (v) => formatAmount(v),
      },
      {
        key: "currentAmount",
        label: "기 보유",
        format: (v) => (v > 0 ? formatAmount(v) : "-"),
      },
      {
        key: "contributionAmount",
        label: "납입액",
        format: (v, item) =>
          v > 0
            ? `${formatAmount(v)}/${
                item.contributionFrequency === "monthly" ? "월" : "년"
              }`
            : "-",
      },
      {
        key: "returnRate",
        label: "연평균 수익률",
        format: (v) => (v ? `${v}%` : "-"),
      },
      {
        key: "inflationRate",
        label: "물가상승률",
        format: (v) => (v ? `${v}%` : "-"),
      },
      { key: "memo", label: "메모", format: (v) => v || "-" },
    ],
    realEstates: [
      { key: "title", label: "제목", format: (v) => v },
      {
        key: "currentValue",
        label: "부동산 가치",
        format: (v) => formatAmount(v),
      },
      {
        key: "growthRate",
        label: "연평균 가치 상승률",
        format: (v) => `${v.toFixed(2)}%`,
      },
      { key: "startYear", label: "시작년도", format: (v) => `${v}년` },
      { key: "endYear", label: "종료년도", format: (v) => `${v}년` },
      {
        key: "hasRentalIncome",
        label: "임대 수입",
        format: (v) => (v ? "있음" : "-"),
      },
      {
        key: "convertToPension",
        label: "주택연금",
        format: (v) => (v ? "전환" : "-"),
      },
      { key: "memo", label: "메모", format: (v) => v || "-" },
    ],
    assets: [
      { key: "title", label: "제목", format: (v) => v },
      {
        key: "currentValue",
        label: "현재 가치",
        format: (v) => formatAmount(v),
      },
      { key: "startYear", label: "시작년도", format: (v) => `${v}년` },
      { key: "endYear", label: "종료년도", format: (v) => `${v}년` },
      {
        key: "growthRate",
        label: "가치 상승률",
        format: (v) => `${(v * 100).toFixed(2)}%`,
      },
      { key: "memo", label: "메모", format: (v) => v || "-" },
    ],
    debts: [
      { key: "title", label: "제목", format: (v) => v },
      {
        key: "debtAmount",
        label: "부채 금액",
        format: (v) => formatAmount(v),
      },
      {
        key: "debtType",
        label: "상환 방식",
        format: (v) => {
          switch (v) {
            case "bullet":
              return "만기일시상환";
            case "equal":
              return "원리금균등상환";
            case "principal":
              return "원금균등상환";
            case "grace":
              return "거치식상환";
            default:
              return "알 수 없음";
          }
        },
      },
      {
        key: "gracePeriod",
        label: "거치 기간",
        format: (v) => (v > 0 ? `${v}년` : "-"),
      },
      { key: "startYear", label: "시작년도", format: (v) => `${v}년` },
      { key: "endYear", label: "종료년도", format: (v) => `${v}년` },
      {
        key: "interestRate",
        label: "이자율",
        format: (v) => `${(v * 100).toFixed(2)}%`,
      },
      { key: "memo", label: "메모", format: (v) => v || "-" },
    ],
  };

  // 두 항목의 필드를 비교하여 변경사항 반환
  const compareItems = (item1, item2, fields) => {
    const changes = [];
    fields.forEach((field) => {
      const val1 = item1?.[field.key];
      const val2 = item2?.[field.key];

      // 값이 다른 경우만 변경으로 간주
      if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        changes.push({
          fieldKey: field.key,
          fieldLabel: field.label,
          oldValue: val1,
          newValue: val2,
          format: field.format,
        });
      }
    });
    return changes;
  };

  // 재무 항목의 주요 정보를 렌더링하는 함수 (카테고리별)
  const renderItemMainInfo = (item, config, changedFields = []) => {
    const type = config.key;

    // 카테고리별 색상 클래스명 매핑
    const categoryColorClass = {
      incomes: "income",
      expenses: "expense",
      savings: "saving",
      pensions: "pension",
      realEstates: "realEstate",
      assets: "asset",
      debts: "debt",
    }[type];

    // 필드가 변경되었는지 확인하는 헬퍼 함수
    const isFieldChanged = (fieldKey) =>
      changedFields.some((c) => c.fieldKey === fieldKey);

    // 변경 표시 아이콘
    const changeIndicator = <span className={styles.changeIndicator}>*</span>;

    switch (type) {
      case "incomes":
        return (
          <>
            <div className={incomeStyles.incomeAmount}>
              {isFieldChanged("originalAmount") && changeIndicator}
              {formatAmount(item.originalAmount)}/
              {item.originalFrequency === "monthly" ? "월" : "년"}
            </div>
            <div className={incomeStyles.incomePeriod}>
              {isFieldChanged("startYear") && changeIndicator}
              {item.startYear}년 -{" "}
              {isFieldChanged("endYear") && changeIndicator}
              {item.endYear}년
              <br />
              (상승률 {isFieldChanged("growthRate") && changeIndicator}
              {item.growthRate}% 적용)
            </div>
            {item.memo && (
              <div className={incomeStyles.incomeMemo}>
                {isFieldChanged("memo") && changeIndicator}
                {item.memo}
              </div>
            )}
          </>
        );

      case "expenses":
        return (
          <>
            <div className={expenseStyles.expenseAmount}>
              {isFieldChanged("amount") && changeIndicator}
              {formatAmount(item.amount)}/
              {item.frequency === "monthly" ? "월" : "년"}
            </div>
            <div className={expenseStyles.expensePeriod}>
              {isFieldChanged("startYear") && changeIndicator}
              {item.startYear}년 -{" "}
              {isFieldChanged("endYear") && changeIndicator}
              {item.endYear}년
              <br />
              (물가 상승률 {isFieldChanged("growthRate") && changeIndicator}
              {item.growthRate}% 적용)
            </div>
            {item.memo && (
              <div className={expenseStyles.expenseMemo}>
                {isFieldChanged("memo") && changeIndicator}
                {item.memo}
              </div>
            )}
          </>
        );

      case "savings":
        return (
          <>
            {/* 시작 보유액 표시 */}
            {item.currentAmount !== undefined &&
              item.currentAmount !== null &&
              item.currentAmount > 0 && (
                <div className={savingStyles.savingCurrent}>
                  기 보유: {formatAmount(item.currentAmount)}
                </div>
              )}

            {/* 납입 주기 및 금액 */}
            <div className={savingStyles.savingFrequency}>
              {isFieldChanged("originalAmount") && changeIndicator}
              {formatAmount(item.originalAmount)}/
              {item.originalFrequency === "monthly"
                ? "월"
                : item.originalFrequency === "yearly"
                ? "년"
                : "일회성"}
            </div>

            <div className={savingStyles.savingPeriod}>
              {isFieldChanged("startYear") && changeIndicator}
              {item.startYear}년 -{" "}
              {isFieldChanged("endYear") && changeIndicator}
              {item.endYear}년
              <br />
              (연평균 수익률 {isFieldChanged("interestRate") && changeIndicator}
              {(item.interestRate * 100).toFixed(2)}% 적용
              {item.yearlyGrowthRate > 0 &&
                `, 저축/투자액 증가율 ${
                  isFieldChanged("yearlyGrowthRate") ? "*" : ""
                }${(item.yearlyGrowthRate * 100).toFixed(2)}%`}
              )
            </div>

            {item.memo && (
              <div className={savingStyles.savingMemo}>
                {isFieldChanged("memo") && changeIndicator}
                {item.memo}
              </div>
            )}
          </>
        );

      case "pensions":
        return (
          <>
            {item.type === "national" ? (
              // 국민연금
              <>
                <div className={pensionStyles.pensionAmount}>
                  {isFieldChanged("monthlyAmount") && changeIndicator}
                  {formatAmount(item.monthlyAmount)}/월
                </div>
                <div className={pensionStyles.pensionPeriod}>
                  {isFieldChanged("startYear") && changeIndicator}
                  {item.startYear}년 -{" "}
                  {isFieldChanged("endYear") && changeIndicator}
                  {item.endYear}년
                  <br />
                  (물가상승률{" "}
                  {isFieldChanged("inflationRate") && changeIndicator}
                  {item.inflationRate || 2.5}% 적용)
                </div>
              </>
            ) : (
              // 퇴직연금/개인연금/퇴직금
              <>
                {item.currentAmount > 0 && (
                  <div className={pensionStyles.pensionCurrentAmount}>
                    {item.type === "severance" ? "퇴직금" : "기 보유"}:{" "}
                    {formatAmount(item.currentAmount)}
                  </div>
                )}
                {/* 추가 적립이 있는 경우만 적립 금액 표시 */}
                {item.contributionAmount > 0 &&
                  !(
                    item.type === "severance" && item.noAdditionalContribution
                  ) && (
                    <div className={pensionStyles.pensionAmount}>
                      {isFieldChanged("contributionAmount") && changeIndicator}
                      {formatAmount(item.contributionAmount)}/
                      {item.contributionFrequency === "monthly" ? "월" : "년"}
                    </div>
                  )}
                <div className={pensionStyles.pensionPeriod}>
                  {/* 추가 적립이 있는 경우만 적립 기간 표시 */}
                  {item.type === "severance" &&
                  !item.noAdditionalContribution ? (
                    <>
                      적립: {item.contributionStartYear}년 -{" "}
                      {item.contributionEndYear}년
                      <br />
                    </>
                  ) : item.type !== "severance" ? (
                    <>
                      적립: {item.contributionStartYear}년 -{" "}
                      {item.contributionEndYear}년
                      <br />
                    </>
                  ) : null}
                  수령: {item.paymentStartYear}년부터{" "}
                  {item.paymentYears ||
                    (item.paymentEndYear
                      ? item.paymentEndYear - item.paymentStartYear + 1
                      : 10)}
                  년간
                  <br />
                  (연평균 수익률{" "}
                  {isFieldChanged("returnRate") && changeIndicator}
                  {item.returnRate}% 적용, 연금인출 방식(PMT))
                </div>
              </>
            )}
            {item.memo && (
              <div className={pensionStyles.pensionMemo}>
                {isFieldChanged("memo") && changeIndicator}
                {item.memo}
              </div>
            )}
          </>
        );

      case "realEstates":
        return (
          <>
            <div className={realEstateStyles.realEstateValue}>
              {isFieldChanged("currentValue") && changeIndicator}
              부동산 가치: {formatAmount(item.currentValue)}
            </div>
            <div className={realEstateStyles.realEstateRate}>
              연평균 가치 상승률:{" "}
              {isFieldChanged("growthRate") && changeIndicator}
              {item.growthRate.toFixed(2)}%
            </div>
            <div className={realEstateStyles.realEstatePeriod}>
              {isFieldChanged("startYear") && changeIndicator}
              {item.startYear}년 -{" "}
              {isFieldChanged("endYear") && changeIndicator}
              {item.endYear}년
            </div>

            {item.hasRentalIncome && (
              <div className={realEstateStyles.rentalInfo}>
                <div className={realEstateStyles.rentalPeriod}>
                  임대 수입: {item.rentalIncomeStartYear}년 -{" "}
                  {item.rentalIncomeEndYear}년
                </div>
                <div className={realEstateStyles.rentalAmount}>
                  월 임대 수입: {formatAmount(item.monthlyRentalIncome)}/월
                </div>
              </div>
            )}

            {item.convertToPension && (
              <div className={realEstateStyles.pensionInfo}>
                <div className={realEstateStyles.pensionPeriod}>
                  주택연금: {item.pensionStartYear}년 - {item.pensionEndYear}년
                </div>
                <div className={realEstateStyles.pensionAmount}>
                  월 수령액: {formatAmount(item.monthlyPensionAmount)}/월
                </div>
              </div>
            )}

            {item.memo && (
              <div className={realEstateStyles.memo}>
                <span className={realEstateStyles.memoText}>
                  {isFieldChanged("memo") && changeIndicator}
                  {item.memo}
                </span>
              </div>
            )}
          </>
        );

      case "assets":
        return (
          <>
            <div className={assetStyles.assetAmount}>
              {isFieldChanged("currentValue") && changeIndicator}
              {formatAmount(item.currentValue)}
            </div>
            <div className={assetStyles.assetPeriod}>
              {isFieldChanged("startYear") && changeIndicator}
              {item.startYear}년 -{" "}
              {isFieldChanged("endYear") && changeIndicator}
              {item.endYear}년
              <br />
              (연평균 가치 상승률{" "}
              {isFieldChanged("growthRate") && changeIndicator}
              {(item.growthRate * 100).toFixed(2)}% 적용
              {item.assetType === "income" &&
                item.incomeRate > 0 &&
                `, 연간 수익률 (배당, 이자 등) ${
                  isFieldChanged("incomeRate") ? "*" : ""
                }${(item.incomeRate * 100).toFixed(2)}%`}
              )
            </div>
            {item.memo && (
              <div className={assetStyles.assetMemo}>
                {isFieldChanged("memo") && changeIndicator}
                {item.memo}
              </div>
            )}
          </>
        );

      case "debts":
        return (
          <>
            <div className={debtStyles.debtAmount}>
              {isFieldChanged("debtAmount") && changeIndicator}
              {formatAmount(item.debtAmount)}
            </div>

            <div className={debtStyles.debtDetails}>
              <div className={debtStyles.debtType}>
                {item.debtType === "bullet"
                  ? "만기일시상환"
                  : item.debtType === "equal"
                  ? "원리금균등상환"
                  : item.debtType === "principal"
                  ? "원금균등상환"
                  : item.debtType === "grace"
                  ? "거치식상환"
                  : "알 수 없음"}
                {item.debtType === "grace" && item.gracePeriod > 0 && (
                  <span className={debtStyles.gracePeriod}>
                    (거치 {item.gracePeriod}년)
                  </span>
                )}
              </div>
              <div className={debtStyles.debtPeriod}>
                {isFieldChanged("startYear") && changeIndicator}
                {item.startYear}년 -{" "}
                {isFieldChanged("endYear") && changeIndicator}
                {item.endYear}년
                <br />
                (이자율 {isFieldChanged("interestRate") && changeIndicator}
                {(item.interestRate * 100).toFixed(2)}% 적용)
              </div>
            </div>

            {item.memo && (
              <div className={debtStyles.debtMemo}>
                {isFieldChanged("memo") && changeIndicator}
                {item.memo}
              </div>
            )}
          </>
        );

      default:
        return null;
    }
  };

  // 상세 재무 항목 렌더링 (변경사항 표시)
  const renderDetailedFinancialItem = (
    item,
    config,
    baseItem,
    isFirstColumn,
    simulationId
  ) => {
    const type = config.key;
    const fields = categoryFieldDefinitions[type] || [];

    // 상태 판별
    const isNew = !baseItem && item;
    const isRemoved = baseItem && !item && isFirstColumn;
    const isModified = baseItem && item;

    // 변경된 필드 찾기
    let changedFields = [];
    if (isModified) {
      changedFields = compareItems(baseItem, item, fields);
    }

    if (!item && !isRemoved) {
      return (
        <div className={styles.detailedFinancialItem}>
          <div className={styles.detailedItemInfo}>
            <span className={styles.empty}>-</span>
          </div>
        </div>
      );
    }

    const displayItem = item || baseItem;

    return (
      <div
        className={`${styles.detailedFinancialItem} ${
          isNew ? styles.detailedItemNew : ""
        } ${isRemoved ? styles.detailedItemRemoved : ""} ${
          changedFields.length > 0 ? styles.detailedItemModified : ""
        }`}
      >
        <div
          className={styles.detailedItemInfo}
          onClick={() => {
            if (item) {
              handleEditData(config.key.slice(0, -1), item, simulationId);
            }
          }}
        >
          <div className={styles.detailedItemHeader}>
            <h4 className={styles.detailedItemTitle}>{displayItem.title}</h4>
            <div className={styles.detailedItemActions}>
              <div className={styles.detailedItemBadges}>
                {isNew && <span className={styles.badgeNew}>신규</span>}
                {isRemoved && (
                  <span className={styles.badgeRemoved}>삭제됨</span>
                )}
                {changedFields.length > 0 && !isNew && (
                  <span className={styles.badgeModified}>수정됨</span>
                )}
              </div>
              {item && !isRemoved && (
                <button
                  className={styles.detailedItemDeleteButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteData(
                      config.key.slice(0, -1),
                      item.id,
                      simulationId
                    );
                  }}
                  title="삭제"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* 기존 IncomeList와 동일한 형식으로 주요 정보 표시 (변경된 필드에 * 표시) */}
          {renderItemMainInfo(displayItem, config, changedFields)}
        </div>
      </div>
    );
  };

  // renderList 함수 - onEdit 핸들러 추가 + 정렬 적용
  const renderList = (config, data, currentData) => {
    const Component = config.component;
    if (!Component) {
      return <div className={styles.empty}>지원되지 않는 카테고리입니다.</div>;
    }

    // 현재 시뮬레이션 기준으로 데이터 정렬
    const sortedData = sortByCurrentSimulation(data, currentData);

    const props = {
      [config.propName]: sortedData || [],
      onEdit: (item) => handleEditData(config.key.slice(0, -1), item), // 's' 제거 (incomes -> income)
      onDelete: () => {}, // 읽기 전용이므로 삭제는 비활성화
      isReadOnly: false, // 클릭 가능하게 설정
    };

    return (
      <div className={styles.listWrapper}>
        <Component {...props} />
      </div>
    );
  };

  // 토글 함수
  const toggleRow = (rowKey) => {
    setExpandedRows((prev) => ({
      ...prev,
      [rowKey]: !prev[rowKey],
    }));
  };

  // 은퇴년도 계산
  const retirementYear = useMemo(() => {
    if (!profileData?.birthYear || !profileData?.retirementAge) return null;
    const currentYear = new Date().getFullYear();
    const currentAge = currentYear - parseInt(profileData.birthYear, 10);
    return currentYear + (parseInt(profileData.retirementAge, 10) - currentAge);
  }, [profileData]);

  // 선택된 시뮬레이션들의 생애 자금 수급/수요 계산
  const simulationsPV = useMemo(() => {
    if (!isOpen || !profileData) return {};

    const result = {};
    selectedSimulationIds.forEach((simId) => {
      const simData = simulationsData[simId];
      if (!simData) return;

      // 해당 시뮬레이션의 투자 규칙을 반영하여 cashflow 재계산
      const simulation = simulations?.find((sim) => sim.id === simId);
      const profileDataWithSimulation = {
        ...profileData,
        cashflowInvestmentRules: simulation?.cashflowInvestmentRules || {},
      };

      // 투자 규칙이 반영된 최신 cashflow 계산
      const cashflow = calculateCashflowSimulation(
        profileDataWithSimulation,
        simData.incomes || [],
        simData.expenses || [],
        simData.savings || [],
        simData.pensions || [],
        simData.realEstates || [],
        simData.assets || [],
        simData.debts || []
      );

      const filteredCashflow = filterCashflowByPeriod(
        cashflow,
        cashflowPeriod,
        retirementYear
      );
      result[simId] = calculateLifetimeCashFlowTotals(filteredCashflow);
    });

    return result;
  }, [
    selectedSimulationIds,
    simulationsData,
    profileData,
    simulations,
    isOpen,
    cashflowPeriod,
    retirementYear,
  ]);

  // 선택된 시뮬레이션들의 자산 타임라인 계산
  const simulationsAssetsTimeline = useMemo(() => {
    if (!profileData || !isOpen) return {};

    const result = {};
    selectedSimulationIds.forEach((simId) => {
      const simData = simulationsData[simId];
      if (!simData) return;

      // 해당 시뮬레이션의 투자 규칙을 반영하여 cashflow 재계산
      const simulation = simulations?.find((sim) => sim.id === simId);
      const profileDataWithSimulation = {
        ...profileData,
        cashflowInvestmentRules: simulation?.cashflowInvestmentRules || {},
      };

      // 투자 규칙이 반영된 최신 cashflow 계산
      const cashflow = calculateCashflowSimulation(
        profileDataWithSimulation,
        simData.incomes || [],
        simData.expenses || [],
        simData.savings || [],
        simData.pensions || [],
        simData.realEstates || [],
        simData.assets || [],
        simData.debts || []
      );

      const assetResult = calculateAssetSimulation(
        profileDataWithSimulation,
        simData.incomes || [],
        simData.expenses || [],
        simData.savings || [],
        simData.pensions || [],
        simData.realEstates || [],
        simData.assets || [],
        cashflow, // 재계산된 cashflow 사용
        simData.debts || []
      );
      result[simId] =
        assetResult?.detailedData || assetResult?.timeline || assetResult;
    });

    return result;
  }, [
    selectedSimulationIds,
    simulationsData,
    profileData,
    isOpen,
    simulations,
  ]);

  // 선택된 시뮬레이션 개수로 컬럼 수 결정
  const valueColumnCount = selectedSimulationIds.length;
  const gridTemplateColumns = `minmax(160px, 1.2fr) repeat(${valueColumnCount}, minmax(140px, 1fr))`;

  // 각 시뮬레이션의 타이틀 가져오기
  const getSimulationTitle = (simId) => {
    const sim = simulations?.find((s) => s.id === simId);
    return sim?.title || (sim?.isDefault ? "현재" : "시뮬레이션");
  };

  // 선택된 시뮬레이션들을 원래 순서대로 정렬
  const sortedSelectedSimulationIds = useMemo(() => {
    if (!simulations || selectedSimulationIds.length === 0)
      return selectedSimulationIds;

    // simulations 배열의 순서대로 필터링
    return simulations
      .filter((sim) => selectedSimulationIds.includes(sim.id))
      .map((sim) => sim.id);
  }, [simulations, selectedSimulationIds]);

  const summaryRows = useMemo(() => {
    const rows = [];

    // 자금 공급
    const supplyRow = {
      key: "supply",
      label: "자금 공급 (총)",
      values: {},
      breakdowns: {},
    };

    sortedSelectedSimulationIds.forEach((simId) => {
      const pv = simulationsPV[simId];
      supplyRow.values[simId] = pv?.totalSupply ?? null;
      supplyRow.breakdowns[simId] = pv?.supply || [];
    });
    rows.push(supplyRow);

    // 자금 수요
    const demandRow = {
      key: "demand",
      label: "자금 수요 (총)",
      values: {},
      breakdowns: {},
    };

    sortedSelectedSimulationIds.forEach((simId) => {
      const pv = simulationsPV[simId];
      demandRow.values[simId] = pv?.totalDemand ?? null;
      demandRow.breakdowns[simId] = pv?.demand || [];
    });
    rows.push(demandRow);

    // 순현금흐름
    const netRow = {
      key: "net",
      label: "순현금흐름",
      values: {},
      breakdowns: {},
    };

    sortedSelectedSimulationIds.forEach((simId) => {
      const pv = simulationsPV[simId];
      netRow.values[simId] = pv?.netCashFlow ?? null;
      netRow.breakdowns[simId] = [];
    });
    rows.push(netRow);

    return rows;
  }, [sortedSelectedSimulationIds, simulationsPV]);

  const renderBreakdownList = (items, prefix) => {
    if (!Array.isArray(items) || items.length === 0) {
      return null;
    }

    // 시스템 필드들을 제외하고 필터링
    const systemFields = ["totalAmount", "year", "age"];
    const filteredItems = items.filter(
      (item) =>
        item &&
        item.name &&
        !systemFields.includes(item.name) &&
        typeof item.amount === "number"
    );

    if (filteredItems.length === 0) {
      return null;
    }

    return (
      <ul className={styles.summaryBreakdown}>
        {filteredItems.map((item, index) => (
          <li
            key={`${prefix}-${item.name}-${item.category || "기타"}-${index}`}
            className={styles.summaryBreakdownItem}
          >
            <span className={styles.summaryBreakdownLabel}>{item.name}</span>
            <span className={styles.summaryBreakdownValue}>
              {formatAmountForChart(item.amount)}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  // 카테고리 판별 함수 (정렬용)
  const getCategoryType = (itemName) => {
    const name = itemName.toLowerCase();

    // 세금 관련 (먼저 확인)
    if (
      name.includes("세금") ||
      name.includes("취득세") ||
      name.includes("양도세") ||
      name.includes("양도소득세")
    ) {
      return "tax";
    }

    // 소득 관련
    if (
      name.includes("소득") ||
      name.includes("급여") ||
      name.includes("수입") ||
      name.includes("인건비")
    ) {
      return "income";
    }

    // 지출 관련
    if (
      name.includes("지출") ||
      name.includes("생활비") ||
      name.includes("비용")
    ) {
      return "expense";
    }

    // 저축/투자 관련
    if (
      name.includes("저축") ||
      name.includes("투자") ||
      name.includes("예금") ||
      name.includes("적금")
    ) {
      return "savings";
    }

    // 연금 관련
    if (
      name.includes("연금") ||
      name.includes("퇴직") ||
      name.includes("국민연금")
    ) {
      return "pension";
    }

    // 부동산 관련
    if (
      name.includes("부동산") ||
      name.includes("아파트") ||
      name.includes("자택") ||
      name.includes("임대") ||
      name.includes("주택")
    ) {
      return "realEstate";
    }

    // 부채 관련
    if (
      name.includes("부채") ||
      name.includes("대출") ||
      name.includes("빚") ||
      name.includes("이자") ||
      name.includes("원금")
    ) {
      return "debt";
    }

    // 자산 관련 (기타)
    return "assets";
  };

  // 카테고리별 색상 결정 함수
  const getCategoryColor = (itemName) => {
    const categoryType = getCategoryType(itemName);

    const colorMap = {
      income: "#10b981", // 소득 - 초록색
      expense: "#ef4444", // 지출 - 빨간색
      savings: "#3b82f6", // 저축/투자 - 파란색
      pension: "#fbbf24", // 연금 - 노란색
      realEstate: "#8b5cf6", // 부동산 - 보라색
      debt: "#6b7280", // 부채 - 회색
      assets: "#06b6d4", // 자산 - 청록색
      tax: "#8b4513", // 세금 - 갈색
    };

    return colorMap[categoryType] || "#06b6d4";
  };

  // 여러 breakdown을 비교하여 같은 이름끼리 행을 맞춰서 표시
  const renderBreakdownComparison = (
    breakdownsMap,
    prefix,
    gridTemplateColumns,
    context = "supply"
  ) => {
    // breakdownsMap: { simId: [items...], ... }
    const allSimIds = sortedSelectedSimulationIds;
    if (allSimIds.length === 0) return null;

    // 시스템 필드들을 제외하고 필터링
    const systemFields = ["totalAmount", "year", "age"];
    const filterItems = (items) => {
      if (!Array.isArray(items)) return [];
      return items.filter(
        (item) =>
          item &&
          item.name &&
          !systemFields.includes(item.name) &&
          typeof item.amount === "number"
      );
    };

    // 모든 시뮬레이션의 breakdown 필터링
    const filteredBreakdowns = {};
    allSimIds.forEach((simId) => {
      filteredBreakdowns[simId] = filterItems(breakdownsMap[simId] || []);
    });

    // 모든 항목 이름 수집
    const allNames = new Set();
    Object.values(filteredBreakdowns).forEach((items) => {
      items.forEach((item) => allNames.add(item.name));
    });

    if (allNames.size === 0) return null;

    // 첫 번째 시뮬레이션(현재)에 있는 항목과 새로 추가된 항목 분리
    const firstSimId = allSimIds[0];
    const firstSimNames = new Set(
      filteredBreakdowns[firstSimId]?.map((item) => item.name) || []
    );

    const existingNames = Array.from(firstSimNames);
    const newNames = Array.from(allNames).filter(
      (name) => !firstSimNames.has(name)
    );

    // 카테고리별 정렬 순서
    const categoryOrder = [
      "income",
      "expense",
      "savings",
      "pension",
      "realEstate",
      "assets",
      "debt",
    ];

    // 카테고리별 정렬 함수
    const sortByCategory = (names) => {
      return names.sort((a, b) => {
        const categoryA = getCategoryType(a);
        const categoryB = getCategoryType(b);
        const orderA = categoryOrder.indexOf(categoryA);
        const orderB = categoryOrder.indexOf(categoryB);

        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return a.localeCompare(b, "ko");
      });
    };

    // 정렬
    const sortedExistingNames = sortByCategory(existingNames);
    const sortedNewNames = sortByCategory(newNames);
    const sortedNames = [...sortedExistingNames, ...sortedNewNames];

    // 이름으로 아이템 찾기
    const findItem = (items, name) => items?.find((item) => item.name === name);

    return (
      <>
        {sortedNames.map((name, index) => {
          // 카테고리 색상 가져오기
          const borderColor = getCategoryColor(name);

          return (
            <div
              key={`${prefix}-${name}-${index}`}
              className={styles.breakdownComparisonRow}
              style={{ gridTemplateColumns, borderLeftColor: borderColor }}
            >
              <div className={styles.breakdownComparisonName}>{name}</div>
              {allSimIds.map((simId, simIndex) => {
                const item = findItem(filteredBreakdowns[simId], name);
                const firstSimItem = findItem(
                  filteredBreakdowns[firstSimId],
                  name
                );
                const isFirstCol = simIndex === 0;
                const isNew = !firstSimItem && item;
                const isRemoved = firstSimItem && !item && simIndex === 0;

                return (
                  <div key={simId} className={styles.breakdownComparisonValue}>
                    {item ? (
                      <>
                        <span>{formatAmountForChart(item.amount)}</span>
                        {isNew && (
                          <span className={styles.breakdownComparisonNew}>
                            신규
                          </span>
                        )}
                        {!isFirstCol && firstSimItem && (
                          <span className={styles.breakdownComparisonDiff}>
                            {renderDifference(
                              firstSimItem.amount,
                              item.amount,
                              context
                            )}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className={styles.summaryEmpty}>-</span>
                        {isRemoved && (
                          <span className={styles.breakdownComparisonRemoved}>
                            삭제됨
                          </span>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </>
    );
  };

  const renderDifference = (defaultValue, targetValue, context = "supply") => {
    const base = parseNumericInput(defaultValue);
    const compare = parseNumericInput(targetValue);
    if (
      base === null ||
      compare === null ||
      Number.isNaN(base) ||
      Number.isNaN(compare)
    ) {
      return null;
    }

    const diff = compare - base;

    if (!Number.isFinite(diff)) {
      return null;
    }

    if (diff === 0) {
      return (
        <span className={`${styles.summaryDelta} ${styles.deltaNeutral}`}>
          변화 없음
        </span>
      );
    }

    const isDemandContext = context === "demand";
    const shouldUsePositiveColor =
      (diff > 0 && !isDemandContext) || (diff < 0 && isDemandContext);

    const formatted =
      diff > 0 ? `+${formatAmountForChart(diff)}` : formatAmountForChart(diff);
    const directionClass = shouldUsePositiveColor
      ? styles.deltaPositive
      : styles.deltaNegative;
    const arrow = diff > 0 ? "↑" : "↓";

    return (
      <span className={`${styles.summaryDelta} ${directionClass}`}>
        {formatted} {arrow}
      </span>
    );
  };

  const parseNumericInput = (value) => {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === "string") {
      const normalized = value.replace(/,/g, "");
      const parsed = Number(normalized);
      return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
  };

  const buildAssetBreakdown = (entry) => {
    if (!entry || typeof entry !== "object") return [];

    // breakdown 정보가 있으면 이를 사용 (새로운 데이터 구조)
    if (entry.breakdown) {
      const items = [];

      // assetItems에서 자산 항목 추출
      if (
        entry.breakdown.assetItems &&
        Array.isArray(entry.breakdown.assetItems)
      ) {
        entry.breakdown.assetItems.forEach((item) => {
          items.push({
            name: item.label || item.name,
            amount: item.amount,
            isAsset: true,
          });
        });
      }

      // debtItems에서 부채 항목 추출
      if (
        entry.breakdown.debtItems &&
        Array.isArray(entry.breakdown.debtItems)
      ) {
        entry.breakdown.debtItems.forEach((item) => {
          items.push({
            name: item.label || item.name,
            amount: -Math.abs(item.amount), // 부채는 음수로
            isAsset: false,
          });
        });
      }

      // 금액 절댓값 기준으로 정렬하고 상위 8개만
      return items
        .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
        .slice(0, 8);
    }

    // 구 데이터 구조 지원 (fallback)
    const systemFields = ["totalAmount", "year", "age", "breakdown"];
    const items = [];

    Object.entries(entry).forEach(([key, value]) => {
      if (systemFields.includes(key)) return;
      if (typeof value !== "number") return;
      if (value === 0) return;

      items.push({
        name: key,
        amount: value,
        isAsset: value > 0,
      });
    });

    return items
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
      .slice(0, 8);
  };

  const findEntryByAge = (timeline, age) => {
    if (!Array.isArray(timeline) || typeof age !== "number") {
      return null;
    }
    const entry = timeline.find((item) => item?.age === age) || null;
    return entry;
  };

  const birthYear = parseNumericInput(profileData?.birthYear);
  const currentYear = new Date().getFullYear();
  const startAge =
    birthYear !== null && !Number.isNaN(birthYear)
      ? currentYear - birthYear
      : null;
  const retirementAge = parseNumericInput(profileData?.retirementAge);
  const targetAssetGoal = parseNumericInput(profileData?.targetAssets);

  const netWorthRows = useMemo(() => {
    const rows = [];

    // 목표 자산 추가
    if (targetAssetGoal !== null && !Number.isNaN(targetAssetGoal)) {
      const goalRow = {
        key: "goal",
        label: "목표 자산",
        values: {},
        breakdowns: {},
        isGoal: true,
      };

      sortedSelectedSimulationIds.forEach((simId) => {
        goalRow.values[simId] = targetAssetGoal;
        goalRow.breakdowns[simId] = [];
      });

      rows.push(goalRow);
    }

    // 시점별 순자산 계산
    const checkpoints = [
      {
        key: "start",
        label: startAge !== null ? `현재 (${startAge}세)` : "현재",
        age: startAge,
      },
      {
        key: "retirement",
        label: retirementAge !== null ? `은퇴 (${retirementAge}세)` : "은퇴",
        age: retirementAge,
      },
      {
        key: "age90",
        label: "90세",
        age: 90,
      },
    ];

    // year와 age를 제외한 실제 순자산 계산
    const calculateNetWorth = (entry) => {
      if (!entry) return null;

      // breakdown 정보가 있으면 이를 우선 사용 (새로운 데이터 구조)
      if (entry.breakdown && typeof entry.breakdown.netAssets === "number") {
        return entry.breakdown.netAssets;
      }

      // 구 데이터 구조 지원 (fallback)
      const systemFields = ["totalAmount", "year", "age", "breakdown"];
      let netWorth = 0;

      Object.entries(entry).forEach(([key, value]) => {
        if (
          !systemFields.includes(key) &&
          typeof value === "number" &&
          Number.isFinite(value)
        ) {
          netWorth += value;
        }
      });

      return netWorth;
    };

    checkpoints.forEach((checkpoint) => {
      if (checkpoint.age === null || Number.isNaN(checkpoint.age)) {
        return;
      }

      const checkpointRow = {
        key: checkpoint.key,
        label: checkpoint.label,
        values: {},
        breakdowns: {},
      };

      let hasAnyData = false;

      sortedSelectedSimulationIds.forEach((simId) => {
        const timeline = simulationsAssetsTimeline[simId];
        const entry = findEntryByAge(timeline, checkpoint.age);

        if (entry) {
          hasAnyData = true;
          checkpointRow.values[simId] = calculateNetWorth(entry);
          checkpointRow.breakdowns[simId] = buildAssetBreakdown(entry);
        } else {
          checkpointRow.values[simId] = null;
          checkpointRow.breakdowns[simId] = [];
        }
      });

      // 해당 시점에 데이터가 하나라도 있으면 추가
      if (hasAnyData) {
        rows.push(checkpointRow);
      }
    });

    return rows;
  }, [
    startAge,
    retirementAge,
    sortedSelectedSimulationIds,
    simulationsAssetsTimeline,
    targetAssetGoal,
  ]);

  // 모달이 열릴 때 토글을 모두 열린 상태로 초기화
  useEffect(() => {
    if (!isOpen) return;

    // 생애 자금 수급/수요 탭의 토글들 (supply, demand)
    // 시점별 순자산 탭의 토글들 (start, retirement, age90)
    const initialExpandedRows = {
      supply: true,
      demand: true,
      "networth-start": true,
      "networth-retirement": true,
      "networth-age90": true,
    };
    setExpandedRows(initialExpandedRows);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    // Mixpanel: 시뮬레이션 비교 모달 열림
    trackEvent("시뮬레이션 비교 모달 열림", {
      simulationCount: selectedSimulationIds.length,
      simulationIds: selectedSimulationIds,
    });

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        // 재무 데이터 수정 모달이 열려있으면 비교 모달은 닫지 않음
        if (editModal.isOpen) {
          return;
        }
        onClose?.();
        trackEvent("시뮬레이션 비교 모달 닫힘", {
          method: "ESC 키",
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    // 모달이 열릴 때 body 스크롤 막기
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      // 모달이 닫힐 때 body 스크롤 복원
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, selectedSimulationIds, editModal.isOpen]);

  // 모달이 닫혀있으면 렌더링하지 않음
  if (!isOpen) return null;

  // 선택된 시뮬레이션 개수에 따라 모달 너비 결정
  const getModalWidth = () => {
    const count = selectedSimulationIds.length;
    if (count <= 2) return "960px";
    if (count === 3) return "1200px";
    if (count === 4) return "1400px";
    return "1600px"; // 5개 이상
  };

  return (
    <div
      className={styles.overlay}
      onClick={() => {
        trackEvent("시뮬레이션 비교 모달 닫힘", {
          method: "오버레이 클릭",
        });
        onClose?.();
      }}
    >
      <div
        className={styles.modal}
        style={{ width: `min(${getModalWidth()}, 95vw)` }}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <div className={styles.header}>
          <div style={{ flex: 1 }}>
            <h3>시뮬레이션 비교</h3>
            <div className={styles.simulationSelector}>
              {simulations?.map((sim) => (
                <label
                  key={sim.id}
                  className={`${styles.simulationCheckbox} ${
                    sim.isDefault ? styles.simulationCheckboxDefault : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSimulationIds.includes(sim.id)}
                    onChange={() => handleToggleSimulation(sim.id)}
                    disabled={sim.isDefault}
                  />
                  <span className={styles.simulationLabel}>
                    {sim.title || (sim.isDefault ? "현재" : "시뮬레이션")}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <button
            className={styles.closeButton}
            onClick={() => {
              trackEvent("시뮬레이션 비교 모달 닫힘", {
                method: "닫기 버튼",
              });
              onClose?.();
            }}
            type="button"
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
          {isLoading || isDataLoading ? (
            <div className={styles.loading}>데이터를 불러오는 중...</div>
          ) : (
            <>
              {/* 메인 탭 네비게이션 */}
              <div className={styles.mainTabs}>
                <button
                  className={`${styles.mainTab} ${
                    activeTab === "cashflow" ? styles.mainTabActive : ""
                  }`}
                  onClick={() => setActiveTab("cashflow")}
                >
                  생애 자금 수급/수요
                </button>
                <button
                  className={`${styles.mainTab} ${
                    activeTab === "networth" ? styles.mainTabActive : ""
                  }`}
                  onClick={() => setActiveTab("networth")}
                >
                  시점별 순자산
                </button>
                <button
                  className={`${styles.mainTab} ${
                    activeTab === "detail" ? styles.mainTabActive : ""
                  }`}
                  onClick={() => setActiveTab("detail")}
                >
                  상세 재무 데이터
                </button>
              </div>

              {/* 생애 자금 수급/수요 현재가 요약 */}
              {activeTab === "cashflow" &&
                Object.keys(simulationsPV).length > 0 && (
                  <div className={styles.summarySection}>
                    <div className={styles.sectionHeader}>
                      <h4 className={styles.summaryTitle}>
                        생애 자금 수급/수요
                      </h4>
                      <div className={styles.periodTabs}>
                        <button
                          className={`${styles.periodTab} ${
                            cashflowPeriod === "all"
                              ? styles.periodTabActive
                              : ""
                          }`}
                          onClick={() => setCashflowPeriod("all")}
                        >
                          전체
                        </button>
                        <button
                          className={`${styles.periodTab} ${
                            cashflowPeriod === "beforeRetirement"
                              ? styles.periodTabActive
                              : ""
                          }`}
                          onClick={() => setCashflowPeriod("beforeRetirement")}
                        >
                          은퇴전(포함)
                        </button>
                        <button
                          className={`${styles.periodTab} ${
                            cashflowPeriod === "afterRetirement"
                              ? styles.periodTabActive
                              : ""
                          }`}
                          onClick={() => setCashflowPeriod("afterRetirement")}
                        >
                          은퇴 이후
                        </button>
                      </div>
                    </div>
                    <div className={styles.summaryTable}>
                      <div
                        className={`${styles.summaryRow} ${styles.summaryHeader}`}
                        style={{ gridTemplateColumns }}
                      >
                        <div className={styles.summaryCell}>항목</div>
                        {sortedSelectedSimulationIds.map((simId) => (
                          <div key={simId} className={styles.summaryCell}>
                            {getSimulationTitle(simId)}
                          </div>
                        ))}
                      </div>
                      {summaryRows.map((row) => (
                        <React.Fragment key={row.key}>
                          <div
                            className={styles.summaryRow}
                            style={{ gridTemplateColumns }}
                          >
                            <div
                              className={`${styles.summaryCell} ${styles.summaryLabel}`}
                            >
                              {row.key !== "net" && (
                                <button
                                  className={styles.toggleButton}
                                  onClick={() => toggleRow(row.key)}
                                  aria-label={
                                    expandedRows[row.key]
                                      ? "세부 항목 접기"
                                      : "세부 항목 펼치기"
                                  }
                                >
                                  {expandedRows[row.key] ? "▼" : "▶"}
                                </button>
                              )}
                              {row.label}
                            </div>
                            {sortedSelectedSimulationIds.map((simId, index) => {
                              const value = row.values[simId];
                              const isFirstCol = index === 0;

                              return (
                                <div key={simId} className={styles.summaryCell}>
                                  {value !== null && value !== undefined ? (
                                    <>
                                      <span
                                        className={`${styles.summaryValue} ${
                                          row.key === "net"
                                            ? value >= 0
                                              ? styles.positive
                                              : styles.negative
                                            : ""
                                        }`}
                                      >
                                        {formatAmountForChart(value)}
                                      </span>
                                      {!isFirstCol &&
                                        sortedSelectedSimulationIds.length >
                                          1 &&
                                        renderDifference(
                                          row.values[
                                            sortedSelectedSimulationIds[0]
                                          ],
                                          value,
                                          row.key === "demand"
                                            ? "demand"
                                            : "supply"
                                        )}
                                    </>
                                  ) : (
                                    <span className={styles.summaryEmpty}>
                                      -
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {/* 세부 내용 표시 - 펼쳐졌을 때만 */}
                          {row.key !== "net" && expandedRows[row.key] && (
                            <div
                              style={{
                                gridColumn: "1 / -1",
                                paddingTop: "0.5rem",
                              }}
                            >
                              {renderBreakdownComparison(
                                row.breakdowns,
                                `comparison-${row.key}`,
                                gridTemplateColumns,
                                row.key === "demand" ? "demand" : "supply"
                              )}
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              {activeTab === "networth" && netWorthRows.length > 0 && (
                <div className={styles.netWorthSection}>
                  <h4 className={styles.netWorthTitle}>시점별 순자산</h4>
                  <div className={styles.summaryTable}>
                    <div
                      className={`${styles.summaryRow} ${styles.summaryHeader}`}
                      style={{ gridTemplateColumns }}
                    >
                      <div className={styles.summaryCell}>시점</div>
                      {sortedSelectedSimulationIds.map((simId) => (
                        <div key={simId} className={styles.summaryCell}>
                          {getSimulationTitle(simId)}
                        </div>
                      ))}
                    </div>
                    {netWorthRows.map((row) => (
                      <React.Fragment key={row.key}>
                        <div
                          className={styles.summaryRow}
                          style={{ gridTemplateColumns }}
                        >
                          <div
                            className={`${styles.summaryCell} ${styles.summaryLabel}`}
                          >
                            {!row.isGoal && (
                              <button
                                className={styles.toggleButton}
                                onClick={() => toggleRow(`networth-${row.key}`)}
                                aria-label={
                                  expandedRows[`networth-${row.key}`]
                                    ? "세부 항목 접기"
                                    : "세부 항목 펼치기"
                                }
                              >
                                {expandedRows[`networth-${row.key}`]
                                  ? "▼"
                                  : "▶"}
                              </button>
                            )}
                            {row.label}
                          </div>
                          {sortedSelectedSimulationIds.map((simId, index) => {
                            const value = row.values[simId];
                            const isFirstCol = index === 0;

                            return (
                              <div key={simId} className={styles.summaryCell}>
                                {value !== null &&
                                value !== undefined &&
                                !Number.isNaN(value) ? (
                                  <>
                                    <span
                                      className={`${styles.summaryValue} ${
                                        row.isGoal
                                          ? ""
                                          : value >= 0
                                          ? styles.positive
                                          : styles.negative
                                      }`}
                                    >
                                      {formatAmountForChart(value)}
                                    </span>
                                    {!isFirstCol &&
                                      sortedSelectedSimulationIds.length > 1 &&
                                      renderDifference(
                                        row.values[
                                          sortedSelectedSimulationIds[0]
                                        ],
                                        value,
                                        "supply"
                                      )}
                                  </>
                                ) : (
                                  <span className={styles.summaryEmpty}>-</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {/* 세부 내용 표시 - 펼쳐졌을 때만 */}
                        {!row.isGoal && expandedRows[`networth-${row.key}`] && (
                          <div
                            style={{
                              gridColumn: "1 / -1",
                              paddingTop: "0.5rem",
                            }}
                          >
                            {renderBreakdownComparison(
                              row.breakdowns,
                              `networth-comparison-${row.key}`,
                              gridTemplateColumns,
                              "supply"
                            )}
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* 상세 재무 데이터 비교 */}
              {activeTab === "detail" && (
                <div className={styles.financialDataSection}>
                  <h4 className={styles.financialDataTitle}>
                    상세 재무 데이터
                  </h4>
                  {categoryConfigs.map((config) => {
                    // 모든 시뮬레이션의 데이터를 ID 기준으로 병합
                    const allItemsById = new Map();
                    const baseSimId = sortedSelectedSimulationIds[0];
                    const baseSimData = simulationsData[baseSimId];

                    // 기준 시뮬레이션의 항목들을 먼저 추가
                    if (baseSimData?.[config.key]) {
                      baseSimData[config.key].forEach((item) => {
                        allItemsById.set(item.id, {
                          id: item.id,
                          baseItem: item,
                          items: { [baseSimId]: item },
                        });
                      });
                    }

                    // 다른 시뮬레이션의 항목들 추가
                    sortedSelectedSimulationIds.forEach((simId) => {
                      if (simId === baseSimId) return;
                      const simData = simulationsData[simId];
                      if (simData?.[config.key]) {
                        simData[config.key].forEach((item) => {
                          if (allItemsById.has(item.id)) {
                            allItemsById.get(item.id).items[simId] = item;
                          } else {
                            allItemsById.set(item.id, {
                              id: item.id,
                              baseItem: null, // 신규 항목
                              items: { [simId]: item },
                            });
                          }
                        });
                      }
                    });

                    // 항목이 없으면 표시 안 함
                    if (allItemsById.size === 0) {
                      return null;
                    }

                    return (
                      <div key={config.key} className={styles.categorySection}>
                        <h5 className={styles.categoryTitle}>{config.label}</h5>
                        <div className={styles.summaryTable}>
                          <div
                            className={`${styles.summaryRow} ${styles.summaryHeader}`}
                            style={{ gridTemplateColumns }}
                          >
                            <div className={styles.summaryCell}>항목</div>
                            {sortedSelectedSimulationIds.map((simId) => (
                              <div key={simId} className={styles.summaryCell}>
                                {getSimulationTitle(simId)}
                              </div>
                            ))}
                          </div>
                          {Array.from(allItemsById.values()).map(
                            (itemGroup) => (
                              <div
                                key={itemGroup.id}
                                className={styles.summaryRow}
                                style={{ gridTemplateColumns }}
                              >
                                <div
                                  className={`${styles.summaryCell} ${styles.summaryLabel}`}
                                >
                                  {itemGroup.baseItem?.title ||
                                    Object.values(itemGroup.items)[0]?.title ||
                                    "항목"}
                                </div>
                                {sortedSelectedSimulationIds.map(
                                  (simId, index) => {
                                    const item = itemGroup.items[simId];
                                    const isFirstColumn = index === 0;

                                    return (
                                      <div
                                        key={simId}
                                        className={styles.summaryCell}
                                      >
                                        {renderDetailedFinancialItem(
                                          item,
                                          config,
                                          itemGroup.baseItem,
                                          isFirstColumn,
                                          simId
                                        )}
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 재무 데이터 수정 모달 (통합 렌더링으로 React 내부 오류 방지) */}
      {renderEditModal()}
    </div>
  );
}

export default SimulationCompareModal;
