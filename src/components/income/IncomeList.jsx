import React from "react";
import { formatAmount } from "../../utils/format";
import styles from "./IncomeList.module.css";

/**
 * 소득 데이터 목록 컴포넌트
 */
function IncomeList({ incomes, onEdit, onDelete }) {
  if (!incomes || incomes.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>등록된 소득이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className={styles.incomeList}>
      {incomes.map((income) => (
        <div
          key={income.id}
          className={styles.incomeItem}
          onClick={() => onEdit(income)}
        >
          <div className={styles.incomeInfo}>
            <div className={styles.incomeHeader}>
              <h4 className={styles.incomeTitle}>{income.title}</h4>
              <div className={styles.incomeActions}>
                <button
                  className={styles.deleteButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(income.id);
                  }}
                  title="삭제"
                >
                  ×
                </button>
              </div>
            </div>

            <div className={styles.incomeAmount}>
              {formatAmount(income.originalAmount)}/
              {income.originalFrequency === "monthly" ? "월" : "년"}
            </div>

            <div className={styles.incomePeriod}>
              {income.startYear}년 - {income.endYear}년
              <br />
              (상승률 {income.growthRate}% 적용)
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default IncomeList;
