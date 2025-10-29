import React from "react";
import styles from "./ProfileSummary.module.css";

/**
 * 프로필 하단 재무 항목 요약 컴포넌트
 * 모든 재무 항목들을 가로로 나열하고 클릭 시 수정 모달을 열어줍니다.
 */
function ProfileSummary({
  incomes = [],
  expenses = [],
  savings = [],
  pensions = [],
  realEstates = [],
  assets = [],
  debts = [],
  onItemClick,
  onDelete,
  onOpenFinancialModal,
  isLoading = false,
  isReadOnly = false,
}) {
  // 모든 재무 항목을 하나의 배열로 합치기
  const allFinanceItems = [
    ...(incomes || []).map((item) => ({ ...item, category: "income" })),
    ...(expenses || []).map((item) => ({ ...item, category: "expense" })),
    ...(savings || []).map((item) => ({ ...item, category: "saving" })),
    ...(pensions || []).map((item) => ({ ...item, category: "pension" })),
    ...(realEstates || []).map((item) => ({ ...item, category: "realEstate" })),
    ...(assets || []).map((item) => ({ ...item, category: "asset" })),
    ...(debts || []).map((item) => ({ ...item, category: "debt" })),
  ];

  // 로딩 중이거나 항목이 없을 때는 로딩 상태 표시
  if (isLoading || allFinanceItems.length === 0) {
    return (
      <div className={styles.profileSummary}>
        <div className={styles.scrollContainer}>
          <div className={styles.loadingPlaceholder}>
            <div className={styles.loadingSpinner}></div>
          </div>
        </div>
      </div>
    );
  }

  // 카드 클릭 핸들러 (항상 활성화, 권한 확인은 핸들러에서 처리)
  const handleCardClick = (item) => {
    if (onItemClick) {
      onItemClick(item.category, item);
    }
  };

  // 삭제 핸들러
  const handleDelete = (e, item) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지
    if (onDelete) {
      onDelete(item.category, item.id);
    }
  };

  return (
    <div className={styles.profileSummary}>
      <div className={styles.scrollContainer}>
        {allFinanceItems.map((item) => (
          <div
            key={`${item.category}-${item.id}`}
            className={styles.financeCard}
            onClick={() => handleCardClick(item)}
            title={`${item.title} 수정하기`}
          >
            <div className={styles.cardContent}>
              <span className={styles.itemTitle}>{item.title}</span>
            </div>
            <button
              className={styles.deleteButton}
              onClick={(e) => handleDelete(e, item)}
              title="삭제"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProfileSummary;
