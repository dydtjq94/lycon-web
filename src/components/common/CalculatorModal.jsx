import React, { useState, useEffect } from "react";
import styles from "./CalculatorModal.module.css";
import { formatAmountForChart } from "../../utils/format";

/**
 * 계산기 모달 컴포넌트
 * 다양한 재무 계산기를 제공
 */
function CalculatorModal({ isOpen, onClose, profileData = null }) {
  // 계산기 타입 선택 상태
  const [selectedCalculator, setSelectedCalculator] = useState("goal");

  // 목표 금액 계산기 상태
  const [goalFormData, setGoalFormData] = useState({
    targetAmount: "",
    years: "",
    returnRate: "5.0",
  });

  const [goalResult, setGoalResult] = useState(null);
  const [goalErrors, setGoalErrors] = useState({});

  // DC형 퇴직연금 계산기 상태
  const [dcFormData, setDcFormData] = useState({
    afterTaxSalary: "", // 세후 월급 (만원)
  });

  const [dcResult, setDcResult] = useState(null);
  const [dcErrors, setDcErrors] = useState({});

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

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // === 목표 금액 계산기 관련 함수 ===

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

  // === DC형 퇴직연금 계산기 관련 함수 ===

  /**
   * 2024년 소득세율표 (과세표준 기준, 만원 단위)
   * 출처: https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=6594&cntntsId=7873
   */
  const TAX_BRACKETS = [
    { min: 0, max: 1400, rate: 0.06, deduction: 0 },
    { min: 1400, max: 5000, rate: 0.15, deduction: 126 },
    { min: 5000, max: 8800, rate: 0.24, deduction: 576 },
    { min: 8800, max: 15000, rate: 0.35, deduction: 1544 },
    { min: 15000, max: 30000, rate: 0.38, deduction: 1994 },
    { min: 30000, max: 50000, rate: 0.4, deduction: 2594 },
    { min: 50000, max: 100000, rate: 0.42, deduction: 3594 },
    { min: 100000, max: Infinity, rate: 0.45, deduction: 6594 },
  ];

  /**
   * 4대 보험 공제율 (2024년 기준)
   * - 국민연금: 4.5%
   * - 건강보험: 3.545%
   * - 장기요양보험: 0.4591% (건강보험료의 12.95%)
   * - 고용보험: 0.9%
   * - 합계: 약 9.4041%
   */
  const INSURANCE_RATE = 0.094041;

  /**
   * 세후 월급으로부터 세전 월급 역산
   * 반복적으로 세전 월급을 추정하여 가장 근접한 값을 찾음
   */
  const calculatePreTaxSalary = (afterTaxMonthly) => {
    // 초기 추정치: 세후 월급의 1.3배부터 시작
    let estimatedPreTax = afterTaxMonthly * 1.3;
    let iteration = 0;
    const maxIterations = 100;
    const tolerance = 1; // 1만원 이내 오차 허용

    while (iteration < maxIterations) {
      const annualPreTax = estimatedPreTax * 12;

      // 4대 보험 공제
      const insurance = estimatedPreTax * INSURANCE_RATE;

      // 소득 공제 (간이세액표 기준 - 기본공제 150만원 가정)
      const deduction = 150; // 만원 단위
      const taxableIncome = Math.max(0, annualPreTax - deduction);

      // 소득세 계산
      let incomeTax = 0;
      for (const bracket of TAX_BRACKETS) {
        if (taxableIncome > bracket.min) {
          incomeTax = taxableIncome * bracket.rate - bracket.deduction;
          break;
        }
      }
      const monthlyIncomeTax = incomeTax / 12;

      // 지방소득세 (소득세의 10%)
      const localTax = monthlyIncomeTax * 0.1;

      // 총 공제액
      const totalDeduction = insurance + monthlyIncomeTax + localTax;

      // 세후 월급 계산
      const calculatedAfterTax = estimatedPreTax - totalDeduction;

      // 오차 확인
      const difference = afterTaxMonthly - calculatedAfterTax;

      if (Math.abs(difference) < tolerance) {
        break;
      }

      // 다음 추정치 조정
      estimatedPreTax += difference * 0.5; // 오차의 50%만큼 조정
      iteration++;
    }

    return estimatedPreTax;
  };

  /**
   * 소득세 구간 찾기
   */
  const getTaxBracket = (annualIncome) => {
    for (const bracket of TAX_BRACKETS) {
      if (annualIncome > bracket.min && annualIncome <= bracket.max) {
        return bracket;
      }
    }
    return TAX_BRACKETS[TAX_BRACKETS.length - 1];
  };

  /**
   * DC형 퇴직연금 계산
   */
  const calculateDCPension = () => {
    const afterTaxMonthly = parseFloat(dcFormData.afterTaxSalary);

    if (afterTaxMonthly <= 0) {
      return null;
    }

    // 세전 월급 역산
    const preTaxMonthly = calculatePreTaxSalary(afterTaxMonthly);
    const annualPreTax = preTaxMonthly * 12;

    // 소득세 구간 확인
    const taxBracket = getTaxBracket(annualPreTax);

    // DC 적립금 (세전 월급의 1/12, 즉 세전 월급과 동일)
    const monthlyDC = preTaxMonthly;
    const annualDC = monthlyDC * 12;

    return {
      preTaxMonthly: Math.round(preTaxMonthly),
      preTaxAnnual: Math.round(annualPreTax),
      taxBracket: {
        min: taxBracket.min,
        max: taxBracket.max === Infinity ? "초과" : taxBracket.max,
        rate: (taxBracket.rate * 100).toFixed(0),
      },
      monthlyDC: Math.round(monthlyDC),
      annualDC: Math.round(annualDC),
    };
  };

  // DC형 퇴직연금 폼 유효성 검사
  const validateDCForm = () => {
    const newErrors = {};

    if (
      !dcFormData.afterTaxSalary ||
      parseFloat(dcFormData.afterTaxSalary) <= 0
    ) {
      newErrors.afterTaxSalary = "세후 월급을 입력해주세요.";
    }

    setDcErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // DC형 퇴직연금 계산 실행
  const handleDCCalculate = () => {
    if (!validateDCForm()) {
      return;
    }

    const calculationResult = calculateDCPension();
    if (calculationResult) {
      setDcResult(calculationResult);
    }
  };

  // === 공통 함수 ===

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
      if (selectedCalculator === "goal") {
        handleGoalCalculate();
      } else if (selectedCalculator === "dc") {
        handleDCCalculate();
      }
    }
  };

  // 계산기 변경 시 결과 초기화
  const handleCalculatorChange = (type) => {
    setSelectedCalculator(type);
    setGoalResult(null);
    setDcResult(null);
  };

  // 모달 닫기
  const handleClose = () => {
    setSelectedCalculator("goal");
    setGoalFormData({
      targetAmount: "",
      years: "",
      returnRate: "5.0",
    });
    setDcFormData({
      afterTaxSalary: "",
    });
    setGoalResult(null);
    setDcResult(null);
    setGoalErrors({});
    setDcErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>계산기</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            ×
          </button>
        </div>

        {/* 계산기 선택 탭 */}
        <div className={styles.calculatorTabs}>
          <button
            className={`${styles.tabButton} ${
              selectedCalculator === "goal" ? styles.active : ""
            }`}
            onClick={() => handleCalculatorChange("goal")}
          >
            목표 금액 계산기
          </button>
          <button
            className={`${styles.tabButton} ${
              selectedCalculator === "dc" ? styles.active : ""
            }`}
            onClick={() => handleCalculatorChange("dc")}
          >
            DC형 퇴직연금 계산기
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* 목표 금액 계산기 */}
          {selectedCalculator === "goal" && (
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
                  {goalFormData.targetAmount &&
                    !isNaN(parseInt(goalFormData.targetAmount)) && (
                      <div className={styles.amountPreview}>
                        {formatAmountForChart(
                          parseInt(goalFormData.targetAmount)
                        )}
                      </div>
                    )}
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
          )}

          {/* DC형 퇴직연금 계산기 */}
          {selectedCalculator === "dc" && (
            <div className={styles.calculatorContent}>
              <div className={styles.calculatorHeader}>
                <div className={styles.titleContainer}>
                  <h3 className={styles.calculatorTitle}>
                    DC형 퇴직연금 적립금액 계산기
                  </h3>
                  <button
                    className={styles.calculateButton}
                    onClick={handleDCCalculate}
                  >
                    계산하기
                  </button>
                </div>
                <p className={styles.calculatorSubtitle}>
                  세후 월급을 입력하면 추정 세전 월급과 연간 DC형 퇴직연금
                  적립금을 계산해드립니다
                </p>
              </div>

              <div className={styles.form}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>세후 월급 (만원)</label>
                  <input
                    type="text"
                    value={dcFormData.afterTaxSalary}
                    onChange={(e) =>
                      setDcFormData({
                        ...dcFormData,
                        afterTaxSalary: e.target.value,
                      })
                    }
                    onKeyPress={handleKeyPress}
                    onKeyDown={handleKeyDown}
                    className={`${styles.input} ${
                      dcErrors.afterTaxSalary ? styles.error : ""
                    }`}
                    placeholder="예: 300"
                  />
                  {dcFormData.afterTaxSalary &&
                    !isNaN(parseInt(dcFormData.afterTaxSalary)) && (
                      <div className={styles.amountPreview}>
                        {formatAmountForChart(
                          parseInt(dcFormData.afterTaxSalary)
                        )}
                      </div>
                    )}
                  {dcErrors.afterTaxSalary && (
                    <span className={styles.errorText}>
                      {dcErrors.afterTaxSalary}
                    </span>
                  )}
                </div>
              </div>

              {dcResult && (
                <div className={styles.result}>
                  <h4 className={styles.resultTitle}>계산 결과</h4>
                  <div className={styles.resultGrid}>
                    <div className={styles.resultItem}>
                      <span className={styles.resultLabel}>
                        추정 세전 월급
                      </span>
                      <span className={styles.resultValue}>
                        {dcResult.preTaxMonthly.toLocaleString()}만원
                      </span>
                    </div>
                    <div className={styles.resultItem}>
                      <span className={styles.resultLabel}>
                        추정 세전 연봉
                      </span>
                      <span className={styles.resultValue}>
                        {dcResult.preTaxAnnual.toLocaleString()}만원
                      </span>
                    </div>
                    <div className={styles.resultItem}>
                      <span className={styles.resultLabel}>소득세 구간</span>
                      <span className={styles.resultValue}>
                        {dcResult.taxBracket.min.toLocaleString()}~
                        {typeof dcResult.taxBracket.max === "number"
                          ? dcResult.taxBracket.max.toLocaleString()
                          : dcResult.taxBracket.max}
                        만원 → {dcResult.taxBracket.rate}%
                      </span>
                    </div>
                    <div className={styles.resultItem}>
                      <span className={styles.resultLabel}>
                        월 DC 적립금
                      </span>
                      <span className={styles.resultValue}>
                        {dcResult.monthlyDC.toLocaleString()}만원
                      </span>
                    </div>
                    <div className={styles.resultItem}>
                      <span className={styles.resultLabel}>
                        연간 DC 적립금
                      </span>
                      <span className={styles.resultValue}>
                        {dcResult.annualDC.toLocaleString()}만원
                      </span>
                    </div>
                  </div>

                  {/* 계산 방법 설명 */}
                  <div className={styles.calculationInfo}>
                    <h5 className={styles.infoTitle}>💡 계산 방법</h5>
                    <ul className={styles.infoList}>
                      <li>
                        <strong>4대 보험 공제율:</strong> 약 9.4% (국민연금
                        4.5%, 건강보험 3.545%, 장기요양보험 0.46%, 고용보험
                        0.9%)
                      </li>
                      <li>
                        <strong>소득세율:</strong> 2024년 국세청 소득세율표
                        적용
                      </li>
                      <li>
                        <strong>지방소득세:</strong> 소득세의 10%
                      </li>
                      <li>
                        <strong>DC 적립금:</strong> 연봉의 1/12 = 세전 월급과
                        동일
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CalculatorModal;
