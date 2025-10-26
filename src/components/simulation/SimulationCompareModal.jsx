import React, { useEffect } from "react";
import styles from "./SimulationCompareModal.module.css";
import IncomeList from "../income/IncomeList";
import ExpenseList from "../expense/ExpenseList";
import SavingList from "../saving/SavingList";
import PensionList from "../pension/PensionList";
import RealEstateList from "../realestate/RealEstateList";
import AssetList from "../asset/AssetList";
import DebtList from "../debt/DebtList";

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
}) {
  if (!isOpen) return null;

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
            <p>{defaultTitle} vs {targetTitle}</p>
          </div>
          <button className={styles.closeButton} onClick={onClose} type="button">
            ×
          </button>
        </div>

        {isLoading ? (
          <div className={styles.loading}>데이터를 불러오는 중...</div>
        ) : (
          <div className={styles.sections}>
            {categoryConfigs.map((config) => (
              <div key={config.key} className={styles.section}>
                <div className={styles.sectionTitle}>{config.label}</div>
                <div className={styles.sectionColumns}>
                  <div className={styles.column}>
                    <div className={styles.columnHeader}>{defaultTitle}</div>
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
        )}
      </div>
    </div>
  );
}

export default SimulationCompareModal;
