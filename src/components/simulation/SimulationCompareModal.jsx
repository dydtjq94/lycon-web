import React, { useEffect, useMemo, useState } from "react";
import styles from "./SimulationCompareModal.module.css";
import IncomeList from "../income/IncomeList";
import ExpenseList from "../expense/ExpenseList";
import SavingList from "../saving/SavingList";
import PensionList from "../pension/PensionList";
import RealEstateList from "../realestate/RealEstateList";
import AssetList from "../asset/AssetList";
import DebtList from "../debt/DebtList";
import { calculateLifetimeCashFlowTotals } from "../../utils/presentValueCalculator";
import { formatAmountForChart } from "../../utils/format";
import { calculateAssetSimulation } from "../../utils/cashflowSimulator";
import { trackEvent } from "../../libs/mixpanel";

const categoryConfigs = [
  { key: "incomes", label: "소득", component: IncomeList, propName: "incomes" },
  {
    key: "expenses",
    label: "지출",
    component: ExpenseList,
    propName: "expenses",
  },
  {
    key: "savings",
    label: "저축/투자",
    component: SavingList,
    propName: "savings",
  },
  {
    key: "pensions",
    label: "연금",
    component: PensionList,
    propName: "pensions",
  },
  {
    key: "realEstates",
    label: "부동산",
    component: RealEstateList,
    propName: "realEstates",
  },
  { key: "assets", label: "자산", component: AssetList, propName: "assets" },
  { key: "debts", label: "부채", component: DebtList, propName: "debts" },
];
const renderList = (config, data) => {
  const Component = config.component;
  if (!Component) {
    return <div className={styles.empty}>지원되지 않는 카테고리입니다.</div>;
  }

  const props = {
    [config.propName]: data || [],
    onEdit: () => {},
    onDelete: () => {},
    isReadOnly: true,
  };

  return (
    <div className={styles.listWrapper}>
      <Component {...props} />
    </div>
  );
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
}) {
  if (!isOpen) return null;

  // 세부 항목 토글 상태 (기본값: 접혀있음)
  const [expandedRows, setExpandedRows] = useState({});

  // 생애 자금 수급/수요 탭 상태 (기본값: 전체)
  const [cashflowPeriod, setCashflowPeriod] = useState("all");

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

  // cashflow 데이터 필터링 함수
  const filterCashflowByPeriod = (cashflow, period) => {
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

  // 생애 자금 수급/수요 총합 계산 (할인율 미적용)
  const defaultPV = useMemo(() => {
    if (!defaultData || !isOpen) return null;
    const filteredCashflow = filterCashflowByPeriod(
      defaultData.cashflow || [],
      cashflowPeriod
    );
    return calculateLifetimeCashFlowTotals(filteredCashflow);
  }, [defaultData, isOpen, cashflowPeriod, retirementYear]);

  const targetPV = useMemo(() => {
    if (!targetData || !isOpen) return null;
    const filteredCashflow = filterCashflowByPeriod(
      targetData.cashflow || [],
      cashflowPeriod
    );
    return calculateLifetimeCashFlowTotals(filteredCashflow);
  }, [targetData, isOpen, cashflowPeriod, retirementYear]);

  const defaultAssetsTimeline = useMemo(() => {
    if (!profileData || !defaultData || !isOpen) return null;
    return calculateAssetSimulation(
      profileData,
      defaultData.incomes || [],
      defaultData.expenses || [],
      defaultData.savings || [],
      defaultData.pensions || [],
      defaultData.realEstates || [],
      defaultData.assets || [],
      defaultData.cashflow || [],
      defaultData.debts || []
    );
  }, [defaultData, profileData, isOpen]);

  const targetAssetsTimeline = useMemo(() => {
    if (!profileData || !targetData || !isOpen) return null;
    return calculateAssetSimulation(
      profileData,
      targetData.incomes || [],
      targetData.expenses || [],
      targetData.savings || [],
      targetData.pensions || [],
      targetData.realEstates || [],
      targetData.assets || [],
      targetData.cashflow || [],
      targetData.debts || []
    );
  }, [targetData, profileData, isOpen]);

  const showDefaultColumn =
    Boolean(defaultTitle) || Boolean(defaultPV) || Boolean(defaultData);
  const showTargetColumn =
    Boolean(targetTitle) || Boolean(targetPV) || Boolean(targetData);

  const summaryRows = useMemo(
    () => [
      {
        key: "supply",
        label: "자금 공급 (총)",
        defaultValue: defaultPV?.totalSupply ?? null,
        targetValue: targetPV?.totalSupply ?? null,
        defaultBreakdown: defaultPV?.supply || [],
        targetBreakdown: targetPV?.supply || [],
      },
      {
        key: "demand",
        label: "자금 수요 (총)",
        defaultValue: defaultPV?.totalDemand ?? null,
        targetValue: targetPV?.totalDemand ?? null,
        defaultBreakdown: defaultPV?.demand || [],
        targetBreakdown: targetPV?.demand || [],
      },
      {
        key: "net",
        label: "순현금흐름",
        defaultValue: defaultPV?.netCashFlow ?? null,
        targetValue: targetPV?.netCashFlow ?? null,
        defaultBreakdown: [],
        targetBreakdown: [],
      },
    ],
    [defaultPV, targetPV]
  );

  const valueColumnCount =
    Number(showDefaultColumn) + Number(showTargetColumn) || 1;
  const gridTemplateColumns = `minmax(160px, 1.2fr) repeat(${valueColumnCount}, minmax(140px, 1fr))`;

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
      name.includes("비용") ||
      name.includes("세금")
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
      name.includes("이자")
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
    };

    return colorMap[categoryType] || "#06b6d4";
  };

  // 두 breakdown을 비교하여 같은 이름끼리 행을 맞춰서 표시
  const renderBreakdownComparison = (
    defaultItems,
    targetItems,
    prefix,
    gridTemplateColumns
  ) => {
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

    const filteredDefault = filterItems(defaultItems);
    const filteredTarget = filterItems(targetItems);

    // 현재(default)에 있는 항목들과 새로 추가된 항목들을 분리
    const defaultNames = new Set(filteredDefault.map((item) => item.name));
    const targetNames = new Set(filteredTarget.map((item) => item.name));

    // 현재에 있는 항목들 (공통 + 삭제될 항목)
    const existingNames = Array.from(defaultNames);

    // 새로 추가된 항목들 (시뮬레이션에만 있음)
    const newNames = Array.from(targetNames).filter(
      (name) => !defaultNames.has(name)
    );

    if (existingNames.length === 0 && newNames.length === 0) {
      return null;
    }

    // 카테고리별 정렬 순서
    const categoryOrder = [
      "income", // 소득
      "expense", // 지출
      "savings", // 저축/투자
      "pension", // 연금
      "realEstate", // 부동산
      "assets", // 자산
      "debt", // 부채
    ];

    // 카테고리별 정렬 함수
    const sortByCategory = (names) => {
      return names.sort((a, b) => {
        const categoryA = getCategoryType(a);
        const categoryB = getCategoryType(b);

        const orderA = categoryOrder.indexOf(categoryA);
        const orderB = categoryOrder.indexOf(categoryB);

        // 카테고리 순서가 다르면 카테고리 순서로 정렬
        if (orderA !== orderB) {
          return orderA - orderB;
        }

        // 같은 카테고리 내에서는 이름순으로 정렬
        return a.localeCompare(b, "ko");
      });
    };

    // 1. 현재에 있는 항목들을 카테고리별로 정렬
    const sortedExistingNames = sortByCategory(existingNames);

    // 2. 새로 추가된 항목들을 카테고리별로 정렬
    const sortedNewNames = sortByCategory(newNames);

    // 3. 현재 항목 + 신규 항목 순서로 병합
    const sortedNames = [...sortedExistingNames, ...sortedNewNames];

    // 이름으로 아이템 찾기
    const findItem = (items, name) => items.find((item) => item.name === name);

    return (
      <>
        {sortedNames.map((name, index) => {
          const defaultItem = findItem(filteredDefault, name);
          const targetItem = findItem(filteredTarget, name);

          // 추가/삭제 여부 확인
          const isNew = !defaultItem && targetItem; // 새로 추가됨
          const isRemoved = defaultItem && !targetItem; // 삭제됨

          // 카테고리 색상 가져오기
          const borderColor = getCategoryColor(name);

          return (
            <div
              key={`${prefix}-${name}-${index}`}
              className={styles.breakdownComparisonRow}
              style={{ gridTemplateColumns, borderLeftColor: borderColor }}
            >
              <div className={styles.breakdownComparisonName}>{name}</div>
              <div className={styles.breakdownComparisonValue}>
                {defaultItem ? (
                  <>
                    <span>{formatAmountForChart(defaultItem.amount)}</span>
                    {isRemoved && (
                      <span className={styles.breakdownComparisonRemoved}>
                        삭제됨
                      </span>
                    )}
                  </>
                ) : (
                  <span className={styles.summaryEmpty}>-</span>
                )}
              </div>
              <div className={styles.breakdownComparisonValue}>
                {targetItem ? (
                  <>
                    <span>{formatAmountForChart(targetItem.amount)}</span>
                    {isNew && (
                      <span className={styles.breakdownComparisonNew}>
                        신규
                      </span>
                    )}
                    {defaultItem && targetItem && (
                      <span className={styles.breakdownComparisonDiff}>
                        {renderDifference(
                          defaultItem.amount,
                          targetItem.amount,
                          "supply"
                        )}
                      </span>
                    )}
                  </>
                ) : (
                  <span className={styles.summaryEmpty}>-</span>
                )}
              </div>
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

    // 시스템 필드들을 명시적으로 제외
    const systemFields = ["totalAmount", "year", "age"];

    // 모든 자산과 부채 항목을 포함 (시스템 필드 제외)
    const items = [];

    Object.entries(entry).forEach(([key, value]) => {
      // 시스템 필드 제외
      if (systemFields.includes(key)) return;

      // 숫자가 아니면 제외
      if (typeof value !== "number") return;

      // 0이 아닌 모든 항목 포함 (양수는 자산, 음수는 부채)
      items.push({
        name: key,
        amount: value,
        isAsset: value > 0,
      });
    });

    // 디버깅: 모든 항목과 총합 확인
    console.log("Asset breakdown:", {
      entry,
      items,
      totalAmount: entry.totalAmount,
      calculatedSum: items.reduce((sum, item) => sum + item.amount, 0),
      allKeys: Object.keys(entry),
      filteredKeys: Object.keys(entry).filter(
        (key) => !systemFields.includes(key)
      ),
      allValues: Object.entries(entry).map(([key, value]) => ({
        key,
        value,
        type: typeof value,
        isSystemField: systemFields.includes(key),
      })),
    });

    // 금액 절댓값 기준으로 정렬
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
      rows.push({
        key: "goal",
        label: "목표 자산",
        defaultValue: targetAssetGoal,
        targetValue: targetAssetGoal,
        defaultBreakdown: [],
        targetBreakdown: [],
        isGoal: true,
      });
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

    checkpoints.forEach((checkpoint) => {
      if (checkpoint.age === null || Number.isNaN(checkpoint.age)) {
        return;
      }

      const defaultEntry = findEntryByAge(
        defaultAssetsTimeline,
        checkpoint.age
      );
      const targetEntry = findEntryByAge(targetAssetsTimeline, checkpoint.age);

      // 해당 시점에 데이터가 없으면 건너뛰기
      if (!defaultEntry && !targetEntry) {
        return;
      }

      // year와 age를 제외한 실제 순자산 계산
      const calculateNetWorth = (entry) => {
        if (!entry) return null;

        const systemFields = ["totalAmount", "year", "age"];
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

      rows.push({
        key: checkpoint.key,
        label: checkpoint.label,
        defaultValue: calculateNetWorth(defaultEntry), // year와 age 제외한 순자산
        targetValue: calculateNetWorth(targetEntry), // year와 age 제외한 순자산
        defaultBreakdown: buildAssetBreakdown(defaultEntry),
        targetBreakdown: buildAssetBreakdown(targetEntry),
      });
    });

    return rows;
  }, [
    startAge,
    retirementAge,
    defaultAssetsTimeline,
    targetAssetsTimeline,
    targetAssetGoal,
  ]);

  useEffect(() => {
    if (!isOpen) return;

    // Mixpanel: 시뮬레이션 비교 모달 열림
    trackEvent("시뮬레이션 비교 모달 열림", {
      defaultTitle: defaultTitle || "현재 시뮬레이션",
      targetTitle: targetTitle || "비교 시뮬레이션",
      hasDefaultData: !!defaultData,
      hasTargetData: !!targetData,
    });

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
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
  }, [isOpen, onClose, defaultTitle, targetTitle, defaultData, targetData]);

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
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <div className={styles.header}>
          <div>
            <h3>시뮬레이션 비교</h3>
            <p>
              {defaultTitle} vs {targetTitle || "현재 시뮬레이션"}
            </p>
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
          {isLoading ? (
            <div className={styles.loading}>데이터를 불러오는 중...</div>
          ) : (
            <>
              {/* 생애 자금 수급/수요 현재가 요약 */}
              {(defaultPV || targetPV) && (
                <div className={styles.summarySection}>
                  <div className={styles.sectionHeader}>
                    <h4 className={styles.summaryTitle}>생애 자금 수급/수요</h4>
                    <div className={styles.periodTabs}>
                      <button
                        className={`${styles.periodTab} ${
                          cashflowPeriod === "all" ? styles.periodTabActive : ""
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
                      {showDefaultColumn && (
                        <div className={styles.summaryCell}>
                          {defaultTitle || "현재 시뮬레이션"}
                        </div>
                      )}
                      {showTargetColumn && (
                        <div className={styles.summaryCell}>
                          {targetTitle || "비교 시뮬레이션"}
                        </div>
                      )}
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
                          {showDefaultColumn && !showTargetColumn && (
                            <div className={styles.summaryCell}>
                              {row.defaultValue !== null ? (
                                <span
                                  className={`${styles.summaryValue} ${
                                    row.key === "net"
                                      ? row.defaultValue >= 0
                                        ? styles.positive
                                        : styles.negative
                                      : ""
                                  }`}
                                >
                                  {formatAmountForChart(row.defaultValue)}
                                </span>
                              ) : (
                                <span className={styles.summaryEmpty}>-</span>
                              )}
                              {row.key !== "net" &&
                                renderBreakdownList(
                                  row.defaultBreakdown,
                                  `default-${row.key}`
                                )}
                            </div>
                          )}
                          {!showDefaultColumn && showTargetColumn && (
                            <div className={styles.summaryCell}>
                              {row.targetValue !== null ? (
                                <span
                                  className={`${styles.summaryValue} ${
                                    row.key === "net"
                                      ? row.targetValue >= 0
                                        ? styles.positive
                                        : styles.negative
                                      : ""
                                  }`}
                                >
                                  {formatAmountForChart(row.targetValue)}
                                </span>
                              ) : (
                                <span className={styles.summaryEmpty}>-</span>
                              )}
                              {row.key !== "net" &&
                                renderBreakdownList(
                                  row.targetBreakdown,
                                  `target-${row.key}`
                                )}
                            </div>
                          )}
                          {showDefaultColumn && showTargetColumn && (
                            <>
                              <div className={styles.summaryCell}>
                                {row.defaultValue !== null ? (
                                  <span
                                    className={`${styles.summaryValue} ${
                                      row.key === "net"
                                        ? row.defaultValue >= 0
                                          ? styles.positive
                                          : styles.negative
                                        : ""
                                    }`}
                                  >
                                    {formatAmountForChart(row.defaultValue)}
                                  </span>
                                ) : (
                                  <span className={styles.summaryEmpty}>-</span>
                                )}
                              </div>
                              <div className={styles.summaryCell}>
                                {row.targetValue !== null ? (
                                  <span
                                    className={`${styles.summaryValue} ${
                                      row.key === "net"
                                        ? row.targetValue >= 0
                                          ? styles.positive
                                          : styles.negative
                                        : ""
                                    }`}
                                  >
                                    {formatAmountForChart(row.targetValue)}
                                  </span>
                                ) : (
                                  <span className={styles.summaryEmpty}>-</span>
                                )}
                                {renderDifference(
                                  row.defaultValue,
                                  row.targetValue,
                                  row.key === "demand" ? "demand" : "supply"
                                )}
                              </div>
                            </>
                          )}
                        </div>
                        {/* 세부 내용을 별도 행으로 표시 (양쪽 비교) - 펼쳐졌을 때만 */}
                        {showDefaultColumn &&
                          showTargetColumn &&
                          row.key !== "net" &&
                          expandedRows[row.key] &&
                          renderBreakdownComparison(
                            row.defaultBreakdown,
                            row.targetBreakdown,
                            `comparison-${row.key}`,
                            gridTemplateColumns
                          )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
              {netWorthRows.length > 0 && (
                <div className={styles.netWorthSection}>
                  <h4 className={styles.netWorthTitle}>시점별 순자산</h4>
                  <div className={styles.summaryTable}>
                    <div
                      className={`${styles.summaryRow} ${styles.summaryHeader}`}
                      style={{ gridTemplateColumns }}
                    >
                      <div className={styles.summaryCell}>시점</div>
                      {showDefaultColumn && (
                        <div className={styles.summaryCell}>
                          {defaultTitle || "현재 시뮬레이션"}
                        </div>
                      )}
                      {showTargetColumn && (
                        <div className={styles.summaryCell}>
                          {targetTitle || "비교 시뮬레이션"}
                        </div>
                      )}
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
                                {expandedRows[`networth-${row.key}`] ? "▼" : "▶"}
                              </button>
                            )}
                            {row.label}
                          </div>
                          {showDefaultColumn && !showTargetColumn && (
                            <div className={styles.summaryCell}>
                              {row.defaultValue !== null &&
                              !Number.isNaN(row.defaultValue) ? (
                                <span
                                  className={`${styles.summaryValue} ${
                                    row.isGoal
                                      ? ""
                                      : row.defaultValue >= 0
                                      ? styles.positive
                                      : styles.negative
                                  }`}
                                >
                                  {formatAmountForChart(row.defaultValue)}
                                </span>
                              ) : (
                                <span className={styles.summaryEmpty}>-</span>
                              )}
                              {!row.isGoal &&
                                row.defaultBreakdown.length > 0 &&
                                renderBreakdownList(
                                  row.defaultBreakdown,
                                  `default-networth-${row.key}`
                                )}
                            </div>
                          )}
                          {!showDefaultColumn && showTargetColumn && (
                            <div className={styles.summaryCell}>
                              {row.targetValue !== null &&
                              !Number.isNaN(row.targetValue) ? (
                                <span
                                  className={`${styles.summaryValue} ${
                                    row.isGoal
                                      ? ""
                                      : row.targetValue >= 0
                                      ? styles.positive
                                      : styles.negative
                                  }`}
                                >
                                  {formatAmountForChart(row.targetValue)}
                                </span>
                              ) : (
                                <span className={styles.summaryEmpty}>-</span>
                              )}
                              {!row.isGoal &&
                                row.targetBreakdown.length > 0 &&
                                renderBreakdownList(
                                  row.targetBreakdown,
                                  `target-networth-${row.key}`
                                )}
                            </div>
                          )}
                          {showDefaultColumn && showTargetColumn && (
                            <>
                              <div className={styles.summaryCell}>
                                {row.defaultValue !== null &&
                                !Number.isNaN(row.defaultValue) ? (
                                  <span
                                    className={`${styles.summaryValue} ${
                                      row.isGoal
                                        ? ""
                                        : row.defaultValue >= 0
                                        ? styles.positive
                                        : styles.negative
                                    }`}
                                  >
                                    {formatAmountForChart(row.defaultValue)}
                                  </span>
                                ) : (
                                  <span className={styles.summaryEmpty}>-</span>
                                )}
                              </div>
                              <div className={styles.summaryCell}>
                                {row.targetValue !== null &&
                                !Number.isNaN(row.targetValue) ? (
                                  <span
                                    className={`${styles.summaryValue} ${
                                      row.isGoal
                                        ? ""
                                        : row.targetValue >= 0
                                        ? styles.positive
                                        : styles.negative
                                    }`}
                                  >
                                    {formatAmountForChart(row.targetValue)}
                                  </span>
                                ) : (
                                  <span className={styles.summaryEmpty}>-</span>
                                )}
                                {renderDifference(
                                  row.defaultValue,
                                  row.targetValue,
                                  "supply"
                                )}
                              </div>
                            </>
                          )}
                        </div>
                        {/* 세부 내용을 별도 행으로 표시 (양쪽 비교) - 펼쳐졌을 때만 */}
                        {showDefaultColumn &&
                          showTargetColumn &&
                          !row.isGoal &&
                          expandedRows[`networth-${row.key}`] &&
                          (row.defaultBreakdown.length > 0 ||
                            row.targetBreakdown.length > 0) &&
                          renderBreakdownComparison(
                            row.defaultBreakdown,
                            row.targetBreakdown,
                            `networth-comparison-${row.key}`,
                            gridTemplateColumns
                          )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* 상세 재무 데이터 비교 */}
              <div className={styles.financialDataSection}>
                <h4 className={styles.financialDataTitle}>상세 재무 데이터</h4>
                <div className={styles.summaryTable}>
                  <div
                    className={`${styles.summaryRow} ${styles.summaryHeader}`}
                    style={{ gridTemplateColumns }}
                  >
                    <div className={styles.summaryCell}>재무 항목</div>
                    {showDefaultColumn && (
                      <div className={styles.summaryCell}>
                        {defaultTitle || "현재 시뮬레이션"}
                      </div>
                    )}
                    {showTargetColumn && (
                      <div className={styles.summaryCell}>
                        {targetTitle || "비교 시뮬레이션"}
                      </div>
                    )}
                  </div>
                  {categoryConfigs.map((config) => (
                    <div
                      key={config.key}
                      className={styles.summaryRow}
                      style={{ gridTemplateColumns }}
                    >
                      <div
                        className={`${styles.summaryCell} ${styles.summaryLabel}`}
                      >
                        {config.label}
                      </div>
                      {showDefaultColumn && (
                        <div className={styles.summaryCell}>
                          {renderList(config, defaultData?.[config.key])}
                        </div>
                      )}
                      {showTargetColumn && (
                        <div className={styles.summaryCell}>
                          {renderList(config, targetData?.[config.key])}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SimulationCompareModal;
