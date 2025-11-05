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

const renderList = (config, data, onEdit, onDelete, isReadOnly = false) => {
  const Component = config.component;
  if (!Component) {
    return <div className={styles.empty}>지원되지 않는 카테고리입니다.</div>;
  }

  const props = {
    [config.propName]: data || [],
    onEdit: onEdit,
    onDelete: onDelete,
    isReadOnly: isReadOnly,
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
  isReadOnly = false, // 읽기 전용 모드
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
      onClick={() => {
        onClose?.();
      }}
    >
      <div
        className={styles.modal}
        onClick={(event) => {
          // 내부 클릭은 overlay onClick 으로 전파되지 않도록 차단
          event.stopPropagation();
        }}
      >
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

        {/* 현재 자산 현황 섹션 */}
        {profileData && financialData && (
          <div className={styles.currentAssetsSection}>
            <h4 className={styles.currentAssetsTitle}>📊 현재 자산 현황</h4>
            <div className={styles.currentAssetsList}>
              {/* 현재 현금 */}
              <div className={styles.currentAssetItem}>
                <span className={styles.currentAssetLabel}>현재 현금</span>
                <span className={styles.currentAssetValue}>
                  {formatAmount(parseInt(profileData.currentCash || 0))}
                </span>
              </div>

              {/* 저축/투자 현재 보유액 */}
              {(() => {
                const savingsTotal = (financialData.savings || []).reduce(
                  (sum, saving) => sum + (Number(saving.currentAmount) || 0),
                  0
                );
                if (savingsTotal > 0) {
                  return (
                    <div className={styles.currentAssetItem}>
                      <span className={styles.currentAssetLabel}>저축/투자 보유</span>
                      <span className={styles.currentAssetValue}>
                        {formatAmount(savingsTotal)}
                      </span>
                    </div>
                  );
                }
                return null;
              })()}

              {/* 자산 현재 가치 */}
              {(() => {
                const assetsTotal = (financialData.assets || []).reduce(
                  (sum, asset) => sum + (Number(asset.currentValue) || 0),
                  0
                );
                if (assetsTotal > 0) {
                  return (
                    <div className={styles.currentAssetItem}>
                      <span className={styles.currentAssetLabel}>자산 가치</span>
                      <span className={styles.currentAssetValue}>
                        {formatAmount(assetsTotal)}
                      </span>
                    </div>
                  );
                }
                return null;
              })()}

              {/* 부동산 현재 가치 */}
              {(() => {
                const realEstatesTotal = (financialData.realEstates || []).reduce(
                  (sum, realEstate) => sum + (Number(realEstate.currentValue) || 0),
                  0
                );
                if (realEstatesTotal > 0) {
                  return (
                    <div className={styles.currentAssetItem}>
                      <span className={styles.currentAssetLabel}>부동산 가치</span>
                      <span className={styles.currentAssetValue}>
                        {formatAmount(realEstatesTotal)}
                      </span>
                    </div>
                  );
                }
                return null;
              })()}

              {/* 연금 현재 보유액 */}
              {(() => {
                const pensionsTotal = (financialData.pensions || []).reduce(
                  (sum, pension) => sum + (Number(pension.currentAmount) || 0),
                  0
                );
                if (pensionsTotal > 0) {
                  return (
                    <div className={styles.currentAssetItem}>
                      <span className={styles.currentAssetLabel}>연금 보유액</span>
                      <span className={styles.currentAssetValue}>
                        {formatAmount(pensionsTotal)}
                      </span>
                    </div>
                  );
                }
                return null;
              })()}

              {/* 부채 */}
              {(() => {
                const debtsTotal = (financialData.debts || []).reduce(
                  (sum, debt) => sum + (Number(debt.debtAmount) || 0),
                  0
                );
                if (debtsTotal > 0) {
                  return (
                    <div className={styles.currentAssetItem}>
                      <span className={`${styles.currentAssetLabel} ${styles.debt}`}>부채</span>
                      <span className={`${styles.currentAssetValue} ${styles.debt}`}>
                        -{formatAmount(debtsTotal)}
                      </span>
                    </div>
                  );
                }
                return null;
              })()}

              {/* 순자산 (총합) */}
              {(() => {
                const currentCash = parseInt(profileData.currentCash || 0);
                const savingsTotal = (financialData.savings || []).reduce(
                  (sum, saving) => sum + (Number(saving.currentAmount) || 0),
                  0
                );
                const assetsTotal = (financialData.assets || []).reduce(
                  (sum, asset) => sum + (Number(asset.currentValue) || 0),
                  0
                );
                const realEstatesTotal = (financialData.realEstates || []).reduce(
                  (sum, realEstate) => sum + (Number(realEstate.currentValue) || 0),
                  0
                );
                const pensionsTotal = (financialData.pensions || []).reduce(
                  (sum, pension) => sum + (Number(pension.currentAmount) || 0),
                  0
                );
                const debtsTotal = (financialData.debts || []).reduce(
                  (sum, debt) => sum + (Number(debt.debtAmount) || 0),
                  0
                );
                const netAssets = currentCash + savingsTotal + assetsTotal + realEstatesTotal + pensionsTotal - debtsTotal;
                
                return (
                  <div className={`${styles.currentAssetItem} ${styles.total}`}>
                    <span className={styles.currentAssetLabel}>순자산</span>
                    <span className={styles.currentAssetValue}>
                      {formatAmount(netAssets)}
                    </span>
                  </div>
                );
              })()}
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
                  (itemId) => onDelete?.(config.key, itemId),
                  isReadOnly
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
