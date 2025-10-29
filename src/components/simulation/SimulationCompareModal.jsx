import React, { useEffect, useMemo } from "react";
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

  // 생애 자금 수급/수요 총합 계산 (할인율 미적용)
  const defaultPV = useMemo(() => {
    if (!defaultData || !isOpen) return null;
    return calculateLifetimeCashFlowTotals(defaultData.cashflow || []);
  }, [defaultData, isOpen]);

  const targetPV = useMemo(() => {
    if (!targetData || !isOpen) return null;
    return calculateLifetimeCashFlowTotals(targetData.cashflow || []);
  }, [targetData, isOpen]);

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
  const gridTemplateColumns = `minmax(80px, 0.4fr) repeat(${valueColumnCount}, minmax(140px, 1fr))`;

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
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <div
      className={styles.overlay}
      onClick={() => {
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
            onClick={onClose}
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
                  <h4 className={styles.summaryTitle}>생애 자금 수급/수요</h4>
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
                      <div
                        key={row.key}
                        className={styles.summaryRow}
                        style={{ gridTemplateColumns }}
                      >
                        <div
                          className={`${styles.summaryCell} ${styles.summaryLabel}`}
                        >
                          {row.label}
                        </div>
                        {showDefaultColumn && (
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
                        {showTargetColumn && (
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
                            {showDefaultColumn &&
                              renderDifference(
                                row.defaultValue,
                                row.targetValue,
                                row.key === "demand" ? "demand" : "supply"
                              )}
                            {row.key !== "net" &&
                              renderBreakdownList(
                                row.targetBreakdown,
                                `target-${row.key}`
                              )}
                          </div>
                        )}
                      </div>
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
                      <div
                        key={row.key}
                        className={styles.summaryRow}
                        style={{ gridTemplateColumns }}
                      >
                        <div
                          className={`${styles.summaryCell} ${styles.summaryLabel}`}
                        >
                          {row.label}
                        </div>
                        {showDefaultColumn && (
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
                        {showTargetColumn && (
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
                            {showDefaultColumn &&
                              renderDifference(
                                row.defaultValue,
                                row.targetValue,
                                "supply"
                              )}
                            {!row.isGoal &&
                              row.targetBreakdown.length > 0 &&
                              renderBreakdownList(
                                row.targetBreakdown,
                                `target-networth-${row.key}`
                              )}
                          </div>
                        )}
                      </div>
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
