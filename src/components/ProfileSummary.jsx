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
}) {
  // 모든 재무 항목을 하나의 배열로 합치기
  const allFinanceItems = [
    ...(incomes || []).map((item) => ({ ...item, type: "income" })),
    ...(expenses || []).map((item) => ({ ...item, type: "expense" })),
    ...(savings || []).map((item) => ({ ...item, type: "saving" })),
    ...(pensions || []).map((item) => ({ ...item, type: "pension" })),
    ...(realEstates || []).map((item) => ({ ...item, type: "realEstate" })),
    ...(assets || []).map((item) => ({ ...item, type: "asset" })),
    ...(debts || []).map((item) => ({ ...item, type: "debt" })),
  ];

  // 항목이 없을 때 표시
  if (allFinanceItems.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyMessage}>재무 항목이 없습니다.</p>
        <p className={styles.emptySubMessage}>
          + 추가 버튼을 눌러 재무 항목을 추가해보세요.
        </p>
      </div>
    );
  }

  // 카드 클릭 핸들러
  const handleCardClick = (item) => {
    if (onItemClick) {
      onItemClick(item.type, item);
    }
  };

  return (
    <div className={styles.profileSummary}>
      <div className={styles.scrollContainer}>
        {allFinanceItems.map((item) => (
          <div
            key={`${item.type}-${item.id}`}
            className={styles.financeCard}
            onClick={() => handleCardClick(item)}
            title={`${item.title} 수정하기`}
          >
            <div className={styles.cardContent}>
              <span className={styles.itemTitle}>{item.title}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProfileSummary;
