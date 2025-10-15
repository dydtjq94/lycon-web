import React from "react";
import { formatAmount } from "../utils/format";
import styles from "./ExpenseList.module.css";

/**
 * 지출 데이터 목록 컴포넌트
 */
function ExpenseList({ expenses, onEdit, onDelete }) {
  if (!expenses || expenses.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyMessage}>지출 데이터가 없습니다.</p>
        <p className={styles.emptySubMessage}>
          + 추가 버튼을 눌러 지출을 추가해보세요.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.expenseList}>
      {expenses.map((expense) => (
        <div key={expense.id} className={styles.expenseItem}>
          <div className={styles.expenseInfo}>
            <div className={styles.expenseHeader}>
              <h4 className={styles.expenseTitle}>{expense.title}</h4>
              <div className={styles.expenseActions}>
                <button
                  className={styles.editButton}
                  onClick={() => onEdit(expense)}
                  title="수정"
                >
                  ✏️
                </button>
                <button
                  className={styles.deleteButton}
                  onClick={() => onDelete(expense.id)}
                  title="삭제"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className={styles.expenseAmount}>
              {formatAmount(expense.amount)}/
              {expense.frequency === "monthly" ? "월" : "년"}
            </div>
            
            <div className={styles.expensePeriod}>
              {expense.startYear}년 - {expense.endYear}년
              <br />
              (상승률 {expense.growthRate}% 적용)
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ExpenseList;
