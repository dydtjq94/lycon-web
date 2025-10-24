import React from "react";
import { formatAmount } from "../../utils/format";
import styles from "./SavingList.module.css";

/**
 * 저축/투자 데이터 목록 컴포넌트
 */
function SavingList({ savings, onEdit, onDelete }) {
  if (!savings || savings.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyMessage}>저축/투자 데이터가 없습니다.</p>
        <p className={styles.emptySubMessage}>
          + 추가 버튼을 눌러 저축/투자를 추가해보세요.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.savingList}>
      {savings.map((saving) => (
        <div
          key={saving.id}
          className={styles.savingItem}
          onClick={() => onEdit(saving)}
        >
          <div className={styles.savingInfo}>
            <div className={styles.savingHeader}>
              <h4 className={styles.savingTitle}>{saving.title}</h4>
              <div className={styles.savingActions}>
                <button
                  className={styles.deleteButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(saving.id);
                  }}
                  title="삭제"
                >
                  ×
                </button>
              </div>
            </div>

            <div className={styles.savingAmount}>
              {formatAmount(saving.originalAmount)}/
              {saving.originalFrequency === "monthly"
                ? "월"
                : saving.originalFrequency === "yearly"
                ? "년"
                : "일회성"}
            </div>

            <div className={styles.savingPeriod}>
              {saving.startYear}년 - {saving.endYear}년
              <br />
              (이자율 {(saving.interestRate * 100).toFixed(1)}% 적용
              {saving.yearlyGrowthRate > 0 &&
                `, 년간 상승률 ${(saving.yearlyGrowthRate * 100).toFixed(1)}%`}
              )
            </div>

            {saving.memo && (
              <div className={styles.savingMemo}>{saving.memo}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default SavingList;
