import React, { useState, useEffect } from "react";
import styles from "./CalculatorModal.module.css";

/**
 * 계산기 모달 컴포넌트
 * 다양한 재무 계산기를 제공
 */
function CalculatorModal({ isOpen, onClose, profileData = null }) {
  // 목표 금액 계산기 상태
  const [goalFormData, setGoalFormData] = useState({
    targetAmount: "",
    years: "",
    returnRate: "5.0",
  });

  const [goalResult, setGoalResult] = useState(null);
  const [goalErrors, setGoalErrors] = useState({});

  // 프로필 데이터가 있으면 기본값 설정
  useEffect(() => {
    if (profileData && isOpen) {
      const currentAge = parseInt(profileData.currentKoreanAge) || 30;
      const retirementAge = parseInt(profileData.retirementAge) || 65;
      const yearsToRetirement = retirementAge - currentAge;

      setGoalFormData((prev) => ({
        ...prev,
        years: yearsToRetirement > 0 ? yearsToRetirement.toString() : "10",
      }));
    }
  }, [profileData, isOpen]);

  // 목표 금액 계산 함수
  const calculateGoalAmount = () => {
    const targetAmount = parseFloat(goalFormData.targetAmount);
    const years = parseFloat(goalFormData.years);
    const annualReturnRate = parseFloat(goalFormData.returnRate) / 100;
    const monthlyReturnRate = annualReturnRate / 12;
    const totalMonths = years * 12;

    if (targetAmount <= 0 || years <= 0 || annualReturnRate < 0) {
      return null;
    }

    const monthlySaving =
      targetAmount /
      ((Math.pow(1 + monthlyReturnRate, totalMonths) - 1) / monthlyReturnRate);

    return {
      monthlySaving: Math.round(monthlySaving),
      totalSaving: Math.round(monthlySaving * totalMonths),
      totalReturn: Math.round(targetAmount - monthlySaving * totalMonths),
      years: years,
      returnRate: goalFormData.returnRate,
    };
  };

  // 목표 금액 폼 유효성 검사
  const validateGoalForm = () => {
    const newErrors = {};

    if (
      !goalFormData.targetAmount ||
      parseFloat(goalFormData.targetAmount) <= 0
    ) {
      newErrors.targetAmount = "목표 금액을 입력해주세요.";
    }

    if (!goalFormData.years || parseFloat(goalFormData.years) <= 0) {
      newErrors.years = "모으는 기간을 입력해주세요.";
    }

    const returnRate = parseFloat(goalFormData.returnRate);
    if (isNaN(returnRate) || returnRate < 0 || returnRate > 100) {
      newErrors.returnRate = "수익률은 0-100% 사이여야 합니다.";
    }

    setGoalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 목표 금액 계산 실행
  const handleGoalCalculate = () => {
    if (!validateGoalForm()) {
      return;
    }

    const calculationResult = calculateGoalAmount();
    if (calculationResult) {
      setGoalResult(calculationResult);
    }
  };

  // 숫자만 입력 허용
  const handleKeyPress = (e) => {
    if (
      !/[0-9.]/.test(e.key) &&
      !["Backspace", "Delete", "Tab", "Enter"].includes(e.key)
    ) {
      e.preventDefault();
    }
  };

  // 엔터키로 계산 실행
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleGoalCalculate();
    }
  };

  // 모달 닫기
  const handleClose = () => {
    setGoalFormData({
      targetAmount: "",
      years: "",
      returnRate: "5.0",
    });
    setGoalResult(null);
    setGoalErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>재무 계산기</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* 목표 금액 계산기 */}
          <div className={styles.calculatorContent}>
            <div className={styles.calculatorHeader}>
              <div className={styles.titleContainer}>
                <h3 className={styles.calculatorTitle}>목표 금액 계산기</h3>
                <button
                  className={styles.calculateButton}
                  onClick={handleGoalCalculate}
                >
                  계산하기
                </button>
              </div>
              <p className={styles.calculatorSubtitle}>
                목표 금액을 달성하기 위해 매월 얼마씩 저축해야 하는지
                계산해보세요
              </p>
            </div>

            <div className={styles.form}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>목표 금액 (만원)</label>
                <input
                  type="text"
                  value={goalFormData.targetAmount}
                  onChange={(e) =>
                    setGoalFormData({
                      ...goalFormData,
                      targetAmount: e.target.value,
                    })
                  }
                  onKeyPress={handleKeyPress}
                  onKeyDown={handleKeyDown}
                  className={`${styles.input} ${
                    goalErrors.targetAmount ? styles.error : ""
                  }`}
                  placeholder="예: 10000"
                />
                {goalErrors.targetAmount && (
                  <span className={styles.errorText}>
                    {goalErrors.targetAmount}
                  </span>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>모으는 기간 (년)</label>
                <input
                  type="text"
                  value={goalFormData.years}
                  onChange={(e) =>
                    setGoalFormData({
                      ...goalFormData,
                      years: e.target.value,
                    })
                  }
                  onKeyPress={handleKeyPress}
                  onKeyDown={handleKeyDown}
                  className={`${styles.input} ${
                    goalErrors.years ? styles.error : ""
                  }`}
                  placeholder="예: 20"
                />
                {goalErrors.years && (
                  <span className={styles.errorText}>{goalErrors.years}</span>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>연간 수익률 (%)</label>
                <input
                  type="text"
                  value={goalFormData.returnRate}
                  onChange={(e) =>
                    setGoalFormData({
                      ...goalFormData,
                      returnRate: e.target.value,
                    })
                  }
                  onKeyPress={handleKeyPress}
                  onKeyDown={handleKeyDown}
                  className={`${styles.input} ${
                    goalErrors.returnRate ? styles.error : ""
                  }`}
                  placeholder="예: 5.0"
                />
                {goalErrors.returnRate && (
                  <span className={styles.errorText}>
                    {goalErrors.returnRate}
                  </span>
                )}
              </div>
            </div>

            {goalResult && (
              <div className={styles.result}>
                <h4 className={styles.resultTitle}>계산 결과</h4>
                <div className={styles.resultGrid}>
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>월 저축 금액</span>
                    <span className={styles.resultValue}>
                      {goalResult.monthlySaving.toLocaleString()}만원
                    </span>
                  </div>
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>총 저축 금액</span>
                    <span className={styles.resultValue}>
                      {goalResult.totalSaving.toLocaleString()}만원
                    </span>
                  </div>
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>투자 수익</span>
                    <span className={styles.resultValue}>
                      {goalResult.totalReturn.toLocaleString()}만원
                    </span>
                  </div>
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>기간</span>
                    <span className={styles.resultValue}>
                      {goalResult.years}년 ({goalResult.returnRate}% 수익률)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalculatorModal;
