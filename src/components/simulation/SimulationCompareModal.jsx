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

const renderBreakdownRows = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    <div className={styles.pvDetailList}>
      {items.map((item, index) => (
        <div
          key={`${item.category || "기타"}-${item.name}-${index}`}
          className={styles.pvDetailRow}
        >
          <span className={styles.pvItemLabel}>
            {item.category ? `${item.category} · ${item.name}` : item.name}
          </span>
          <span className={styles.pvValue}>
            {formatAmountForChart(item.amount)}
          </span>
        </div>
      ))}
    </div>
  );
};

const renderGroupColumn = (
  title,
  pvData,
  sectionType,
  keySuffix = sectionType
) => {
  if (!pvData) return null;

  const isSupply = sectionType === "supply";
  const isDemand = sectionType === "demand";
  const isNet = sectionType === "net";

  const totalValue = isSupply
    ? pvData.totalSupply
    : isDemand
    ? pvData.totalDemand
    : pvData.netCashFlow;

  const breakdownItems = isSupply
    ? pvData.supply
    : isDemand
    ? pvData.demand
    : [];

  const labelClass = isSupply
    ? styles.pvSupplyLabel
    : isDemand
    ? styles.pvDemandLabel
    : "";

  const netClass = isNet
    ? totalValue >= 0
      ? styles.positive
      : styles.negative
    : "";

  const labelText = isSupply
    ? "자금 공급 (총)"
    : isDemand
    ? "자금 수요 (총)"
    : "순현금흐름";

  return (
    <div className={styles.pvGroupColumn} key={`${sectionType}-${keySuffix}`}>
      <div className={styles.pvColumnHeader}>{title || "현재 시뮬레이션"}</div>
      <div className={styles.pvRow}>
        <span className={`${styles.pvLabel} ${labelClass}`}>{labelText}</span>
        <span className={`${styles.pvValue} ${netClass}`}>
          {formatAmountForChart(totalValue)}
        </span>
      </div>
      {!isNet &&
        breakdownItems &&
        breakdownItems.length > 0 &&
        renderBreakdownRows(breakdownItems)}
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

  const supplyColumns = [
    renderGroupColumn(defaultTitle, defaultPV, "supply", "default"),
    renderGroupColumn(
      targetTitle || "비교 시뮬레이션",
      targetPV,
      "supply",
      "target"
    ),
  ].filter(Boolean);

  const demandColumns = [
    renderGroupColumn(defaultTitle, defaultPV, "demand", "default"),
    renderGroupColumn(
      targetTitle || "비교 시뮬레이션",
      targetPV,
      "demand",
      "target"
    ),
  ].filter(Boolean);

  const netColumns = [
    renderGroupColumn(defaultTitle, defaultPV, "net", "default"),
    renderGroupColumn(
      targetTitle || "비교 시뮬레이션",
      targetPV,
      "net",
      "target"
    ),
  ].filter(Boolean);

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
    <div className={styles.overlay}>
      <div className={styles.modal}>
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
                <div className={styles.pvSection}>
                  <h4 className={styles.pvTitle}>생애 자금 수급/수요</h4>

                  <div className={styles.pvGroups}>
                    {supplyColumns.length > 0 && (
                      <div className={styles.pvGroup}>
                        <div className={styles.pvGroupHeader}>
                          자금 공급 (총)
                        </div>
                        <div className={styles.pvGroupColumns}>
                          {supplyColumns}
                        </div>
                      </div>
                    )}
                    {demandColumns.length > 0 && (
                      <div className={styles.pvGroup}>
                        <div className={styles.pvGroupHeader}>
                          자금 수요 (총)
                        </div>
                        <div className={styles.pvGroupColumns}>
                          {demandColumns}
                        </div>
                      </div>
                    )}
                    {netColumns.length > 0 && (
                      <div className={styles.pvGroup}>
                        <div className={styles.pvGroupHeader}>순현금흐름</div>
                        <div className={styles.pvGroupColumns}>
                          {netColumns}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 기존 재무 데이터 비교 */}
              <div className={styles.sections}>
                {categoryConfigs.map((config) => (
                  <div key={config.key} className={styles.section}>
                    <div className={styles.sectionTitle}>{config.label}</div>
                    <div className={styles.sectionColumns}>
                      <div className={styles.column}>
                        <div className={styles.columnHeader}>
                          {defaultTitle}
                        </div>
                        {renderList(config, defaultData?.[config.key])}
                      </div>
                      <div className={styles.column}>
                        <div className={styles.columnHeader}>{targetTitle}</div>
                        {renderList(config, targetData?.[config.key])}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SimulationCompareModal;
