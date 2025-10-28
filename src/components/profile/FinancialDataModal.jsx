import React, { useEffect } from "react";
import styles from "./FinancialDataModal.module.css";
import IncomeList from "../income/IncomeList";
import ExpenseList from "../expense/ExpenseList";
import SavingList from "../saving/SavingList";
import PensionList from "../pension/PensionList";
import RealEstateList from "../realestate/RealEstateList";
import AssetList from "../asset/AssetList";
import DebtList from "../debt/DebtList";
import { formatAmountForChart, formatAmount } from "../../utils/format";

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

const renderList = (config, data, onEdit, onDelete) => {
  const Component = config.component;
  if (!Component) {
    return <div className={styles.empty}>지원되지 않는 카테고리입니다.</div>;
  }

  const props = {
    [config.propName]: data || [],
    onEdit: onEdit,
    onDelete: onDelete,
    isReadOnly: false, // 편집 가능하도록 설정
  };

  return (
    <div className={styles.listWrapper}>
      <Component {...props} />
    </div>
  );
};

function FinancialDataModal({
  isOpen,
  onClose,
  isLoading,
  profileData,
  financialData,
  onEdit,
  onDelete,
  onAdd, // 새로 추가: 카테고리별 추가 핸들러
}) {
  if (!isOpen) return null;

  useEffect(() => {
    if (!isOpen) return;
    // Mixpanel 트래킹: 모달 오픈
    try {
      if (typeof window !== "undefined" && window.mixpanel) {
        window.mixpanel.track("FinancialDataModal Opened");
      }
    } catch (_) {}
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
      onClick={(e) => {
        // overlay를 클릭해도 모달이 닫히지 않도록 함 (X 버튼으로만 닫기)
        e.stopPropagation();
      }}
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <div>
            <h3>재무 데이터 전체 보기</h3>
            <p>{profileData?.name}님의 모든 재무 정보</p>
          </div>
          <button
            className={styles.closeButton}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        {/* 프로필 정보 섹션 */}
        {profileData && (
          <div className={styles.profileSection}>
            <div className={styles.profileInfo}>
              <div className={styles.profileItem}>
                <span className={styles.profileLabel}>이름</span>
                <span className={styles.profileValue}>{profileData.name}</span>
              </div>

              <div className={styles.profileItem}>
                <span className={styles.profileLabel}>현재 나이</span>
                <span className={styles.profileValue}>
                  {new Date().getFullYear() - profileData.birthYear}세
                </span>
              </div>
              <div className={styles.profileItem}>
                <span className={styles.profileLabel}>은퇴 예정 나이</span>
                <span className={styles.profileValue}>
                  {profileData.retirementAge}세
                </span>
              </div>
              <div className={styles.profileItem}>
                <span className={styles.profileLabel}>현재 현금</span>
                <span className={styles.profileValue}>
                  {formatAmountForChart(parseInt(profileData.currentCash || 0))}
                </span>
              </div>
              <div className={styles.profileItem}>
                <span className={styles.profileLabel}>목표 자산</span>
                <span className={styles.profileValue}>
                  {profileData.targetAssets
                    ? formatAmount(profileData.targetAssets)
                    : "미설정"}
                </span>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className={styles.loading}>데이터를 불러오는 중...</div>
        ) : (
          <div className={styles.sections}>
            {categoryConfigs.map((config) => (
              <div key={config.key} className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h4 className={styles.sectionTitle}>{config.label}</h4>
                  <button
                    type="button"
                    className={styles.addButton}
                    onClick={() => onAdd?.(config.key)}
                    title={`${config.label} 추가`}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </button>
                </div>
                {renderList(
                  config,
                  financialData[config.key],
                  (item) => onEdit?.(config.key, item),
                  (itemId) => onDelete?.(config.key, itemId)
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FinancialDataModal;
