import React from "react";
import styles from "./PensionList.module.css";

/**
 * 연금 목록 컴포넌트
 */
function PensionList({
  pensions,
  onEdit = () => {},
  onDelete = () => {},
  isReadOnly = false,
}) {
  const getTypeLabel = (type) => {
    switch (type) {
      case "national":
        return "국민연금";
      case "retirement":
        return "퇴직연금";
      case "personal":
        return "개인연금";
      default:
        return "연금";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "national":
        return "#3b82f6"; // 파란색
      case "retirement":
        return "#10b981"; // 초록색
      case "personal":
        return "#f59e0b"; // 주황색
      default:
        return "#6b7280"; // 회색
    }
  };

  const formatAmount = (amount) => {
    if (amount >= 10000) {
      const eok = Math.floor(amount / 10000);
      const man = amount % 10000;
      return man > 0 ? `${eok}억 ${man.toLocaleString()}만원` : `${eok}억원`;
    }
    return `${amount.toLocaleString()}만원`;
  };

  if (pensions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>등록된 연금이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className={styles.pensionList}>
      {pensions.map((pension) => (
        <div
          key={pension.id}
          className={styles.pensionItem}
          onClick={() => {
            onEdit(pension);
          }}
        >
          <div className={styles.pensionHeader}>
            <div className={styles.pensionTitle}>
              {pension.title && (
                <span
                  className={styles.pensionName}
                  style={{ color: getTypeColor(pension.type) }}
                >
                  {pension.title}
                </span>
              )}
            </div>
            <button
              className={styles.deleteButton}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(pension.id);
              }}
            >
              ×
            </button>
          </div>

          <div className={styles.pensionContent}>
            {pension.type === "national" ? (
              // 국민연금 정보
              <>
                <div className={styles.pensionAmount}>
                  {formatAmount(pension.monthlyAmount)}/월
                </div>
                <div className={styles.pensionPeriod}>
                  {pension.startYear}년 - {pension.endYear}년
                  <br />
                  (물가상승률 {pension.inflationRate || 2.5}% 적용)
                </div>
              </>
            ) : (
              // 퇴직연금/개인연금 정보
              <>
                {pension.currentAmount > 0 && (
                  <div className={styles.pensionCurrentAmount}>
                    현재 보유: {formatAmount(pension.currentAmount)}
                  </div>
                )}
                <div className={styles.pensionAmount}>
                  {formatAmount(pension.contributionAmount)}/
                  {pension.contributionFrequency === "monthly" ? "월" : "년"}
                </div>
                <div className={styles.pensionPeriod}>
                  적립: {pension.contributionStartYear}년 -{" "}
                  {pension.contributionEndYear}년
                  <br />
                  수령: {pension.paymentStartYear}년 - {pension.paymentEndYear}
                  년
                  <br />
                  (수익률 {pension.returnRate}% 적용)
                </div>
              </>
            )}

            {pension.memo && (
              <div className={styles.pensionMemo}>{pension.memo}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default PensionList;
