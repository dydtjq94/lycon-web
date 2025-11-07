import React from "react";
import { formatAmount } from "../../utils/format";
import styles from "./SavingList.module.css";

/**
 * 저축/투자 데이터 목록 컴포넌트
 */
function SavingList({
  savings,
  onEdit = () => {},
  onDelete = () => {},
  isReadOnly = false,
}) {
  if (!savings || savings.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>등록된 저축/투자가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className={styles.savingList}>
      {savings.map((saving) => (
        <div
          key={saving.id}
          className={styles.savingItem}
          onClick={() => {
            onEdit(saving);
          }}
        >
          <div className={styles.savingInfo}>
            <div className={styles.savingHeader}>
              <h4 className={styles.savingTitle}>{saving.title}</h4>
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

            <div className={styles.savingContent}>
              {/* 시작 보유액 표시 */}
              {saving.currentAmount !== undefined &&
                saving.currentAmount !== null &&
                saving.currentAmount > 0 && (
                  <div className={styles.savingCurrent}>
                    기 보유: {formatAmount(saving.currentAmount)}
                  </div>
                )}

              {/* 납입 주기 및 금액 */}
              <div className={styles.savingFrequency}>
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
                (연평균 수익률 {(saving.interestRate * 100).toFixed(2)}% 적용
                {saving.yearlyGrowthRate > 0 &&
                  `, 저축/투자액 증가율 ${(
                    saving.yearlyGrowthRate * 100
                  ).toFixed(2)}%`}
                )
              </div>

              {saving.memo && (
                <div className={styles.savingMemo}>{saving.memo}</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SavingList;
