// 데이터 추가 모달 컴포넌트 (공통)
import React, { useState, useEffect } from "react";
import { getTodayString, isValidDate } from "../utils/date.js";
import styles from "./AddDataModal.module.css";

export default function AddDataModal({ isOpen, onClose, onAdd, category }) {
  const today = getTodayString();
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    startYear: new Date().getFullYear(), // 년도만 관리
    endYear: new Date().getFullYear(), // 년도만 관리
    frequency: "monthly",
    note: "",
    rate: "",
    growthRate: "", // 상승률 추가
    // 부채 관련 필드
    principalAmount: "",
    interestRate: "",
    repaymentType: "equal_payment", // equal_payment, equal_principal, minimum_payment, lump_sum
    monthlyPayment: "",
    minimumPaymentRate: "",
    // 연금 관련 필드
    pensionType: "national", // national, private, retirement
    startAge: 65, // 수령 시작 나이
    endAge: 100, // 수령 종료 나이 (생존 가정)
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 모달이 열릴 때 폼 초기화
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      // 모달이 열릴 때마다 폼 초기화
      const currentYear = new Date().getFullYear();
      setFormData({
        title: "",
        amount: "",
        startYear: currentYear,
        endYear: currentYear,
        frequency: "monthly",
        note: "",
        rate: "",
        growthRate: "",
        // 부채 관련 필드 초기화
        principalAmount: "",
        interestRate: "",
        repaymentType: "equal_payment",
        monthlyPayment: "",
        minimumPaymentRate: "",
        // 연금 관련 필드 초기화
        pensionType: "national",
        startAge: 65,
        endAge: 100,
      });
    }
  }, [isOpen]);

  // 카테고리별 설정
  const categoryConfig = {
    incomes: {
      title: "수입 추가",
      icon: "💰",
      rateLabel: "수익률 (%/년)",
      showRate: false,
      growthRateLabel: "연간 상승률 (%/년)",
      showGrowthRate: false, // 전역 설정으로 관리
    },
    assets: {
      title: "자산 추가",
      icon: "🏦",
      rateLabel: "수익률 (%/년)",
      showRate: true,
      growthRateLabel: "상승률 (%/년)",
      showGrowthRate: false,
    },
    debts: {
      title: "부채 추가",
      icon: "💳",
      rateLabel: "이자율 (%/년)",
      showRate: true,
      growthRateLabel: "상승률 (%/년)",
      showGrowthRate: false,
      showDebtFields: true,
    },
    expenses: {
      title: "지출 추가",
      icon: "💸",
      rateLabel: "수익률 (%/년)",
      showRate: false,
      growthRateLabel: "물가 상승률 (%/년)",
      showGrowthRate: false, // 전역 설정으로 관리
    },
    savings: {
      title: "저축 추가",
      icon: "🏦",
      rateLabel: "수익률 (%/년)",
      showRate: false,
      growthRateLabel: "물가 상승률 (%/년)",
      showGrowthRate: false, // 전역 설정으로 관리
    },
    pensions: {
      title: "연금 추가",
      icon: "🏛️",
      rateLabel: "수익률 (%/년)",
      showRate: false,
      growthRateLabel: "상승률 (%/년)",
      showGrowthRate: false,
      showPensionFields: true,
    },
  };

  const config = categoryConfig[category] || categoryConfig.incomes;

  // 폼 데이터 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;

    // 연금 종류 변경 시 기본값 설정
    if (name === "pensionType") {
      let defaultStartAge = 65;
      let defaultEndAge = 100;

      switch (value) {
        case "national":
          defaultStartAge = 65;
          defaultEndAge = 100;
          break;
        case "private":
          defaultStartAge = 60;
          defaultEndAge = 100;
          break;
        case "retirement":
          defaultStartAge = 55;
          defaultEndAge = 100;
          break;
      }

      setFormData((prev) => ({
        ...prev,
        [name]: value,
        startAge: defaultStartAge,
        endAge: defaultEndAge,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // 해당 필드의 오류 제거
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // 시작일 변경 핸들러 (끝일을 시작일과 같게 설정)
  const handleStartDateChange = (e) => {
    const startDate = e.target.value;
    setFormData((prev) => ({
      ...prev,
      startDate,
      endDate: startDate, // 끝일을 시작일과 같게 설정
    }));
  };

  // 년도 변경 핸들러
  const handleYearChange = (e, type) => {
    const year = e.target.value;
    const newDate = type === "start" ? `${year}-01-01` : `${year}-12-31`;

    setFormData((prev) => ({
      ...prev,
      [type === "start" ? "startDate" : "endDate"]: newDate,
    }));
  };

  // 분기 변경 핸들러
  const handleQuarterChange = (e, type) => {
    const { year, quarter } = JSON.parse(e.target.value);
    const startMonth = (quarter - 1) * 3 + 1;
    const endMonth = quarter * 3;
    const startDate = new Date(year, startMonth - 1, 1);
    const endDate = new Date(year, endMonth, 0);

    const newDate = `${year}-${String(startMonth).padStart(2, "0")}-01`;

    setFormData((prev) => ({
      ...prev,
      [type === "start" ? "startDate" : "endDate"]: newDate,
    }));
  };

  // 월 변경 핸들러
  const handleMonthChange = (e, type) => {
    const { year, month } = JSON.parse(e.target.value);
    const newDate = `${year}-${String(month).padStart(2, "0")}-01`;

    setFormData((prev) => ({
      ...prev,
      [type === "start" ? "startDate" : "endDate"]: newDate,
    }));
  };

  // 폼 유효성 검증
  const validateForm = () => {
    const newErrors = {};

    // 제목 검증
    if (!formData.title.trim()) {
      newErrors.title = "제목을 입력해주세요.";
    }

    // 금액 검증 (부채가 아닌 경우에만)
    if (category !== "debts" && (!formData.amount || formData.amount <= 0)) {
      newErrors.amount = "금액을 입력해주세요.";
    }

    // 시작년도 검증
    if (
      !formData.startYear ||
      formData.startYear < 1900 ||
      formData.startYear > 2100
    ) {
      newErrors.startYear = "올바른 시작년도를 입력해주세요.";
    }

    // 종료년도 검증 (입력된 경우)
    if (
      formData.endYear &&
      (formData.endYear < 1900 || formData.endYear > 2100)
    ) {
      newErrors.endYear = "올바른 종료년도를 입력해주세요.";
    } else if (
      formData.endYear &&
      formData.startYear &&
      formData.endYear < formData.startYear
    ) {
      newErrors.endYear = "종료년도는 시작년도보다 늦어야 합니다.";
    }

    // 수익률/이자율 검증 (해당 카테고리인 경우)
    if (
      config.showRate &&
      formData.rate &&
      (formData.rate < -100 || formData.rate > 100)
    ) {
      newErrors.rate = "수익률/이자율은 -100%에서 100% 사이여야 합니다.";
    }

    // 상승률 검증 (해당 카테고리인 경우)
    if (
      config.showGrowthRate &&
      formData.growthRate &&
      (formData.growthRate < -100 || formData.growthRate > 100)
    ) {
      newErrors.growthRate = "상승률은 -100%에서 100% 사이여야 합니다.";
    }

    // 연금 관련 검증 (단순화)
    if (config.showPensionFields) {
      // 연금 종류는 필수이지만 기본값이 있으므로 검증 생략
    }

    // 부채 관련 검증
    if (config.showDebtFields) {
      // 대출 원금 검증
      if (!formData.principalAmount || formData.principalAmount <= 0) {
        newErrors.principalAmount = "대출 원금을 입력해주세요.";
      }

      // 이자율 검증
      if (
        !formData.interestRate ||
        formData.interestRate < 0 ||
        formData.interestRate > 50
      ) {
        newErrors.interestRate = "이자율을 입력해주세요. (0-50%)";
      }

      // 고정월상환인 경우 월 상환액 검증
      if (formData.repaymentType === "fixed_payment") {
        if (!formData.monthlyPayment || formData.monthlyPayment <= 0) {
          newErrors.monthlyPayment = "월 상환액을 입력해주세요.";
        }
      }

      // 최소상환인 경우 최소 상환 비율 검증
      if (formData.repaymentType === "minimum_payment") {
        if (
          !formData.minimumPaymentRate ||
          formData.minimumPaymentRate <= 0 ||
          formData.minimumPaymentRate > 100
        ) {
          newErrors.minimumPaymentRate =
            "최소 상환 비율을 입력해주세요. (0.1-100%)";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // 폼 데이터 정리 (년도를 날짜로 변환)
      const submitData = {
        title: formData.title.trim(),
        // 부채가 아닌 경우에만 amount 저장
        ...(category !== "debts" && { amount: Number(formData.amount) }),
        startDate: `${formData.startYear}-01-01`,
        endDate: formData.endYear ? `${formData.endYear}-12-31` : null,
        // 부채가 아닌 경우에만 frequency 저장
        ...(category !== "debts" && { frequency: formData.frequency }),
        note:
          formData.note.trim() ||
          (category === "incomes"
            ? `${formData.title}상승률 적용`
            : category === "expenses"
            ? `${formData.title}상승률 적용`
            : category === "savings"
            ? `${formData.title}상승률 적용`
            : null),
        rate: config.showRate && formData.rate ? Number(formData.rate) : null,
        growthRate:
          config.showGrowthRate && formData.growthRate
            ? Number(formData.growthRate)
            : null,
        // 부채 관련 필드
        principalAmount:
          config.showDebtFields && formData.principalAmount
            ? Number(formData.principalAmount)
            : null,
        interestRate:
          config.showDebtFields && formData.interestRate
            ? Number(formData.interestRate)
            : null,
        repaymentType: config.showDebtFields ? formData.repaymentType : null,
        monthlyPayment:
          config.showDebtFields && formData.monthlyPayment
            ? Number(formData.monthlyPayment)
            : null,
        minimumPaymentRate:
          config.showDebtFields && formData.minimumPaymentRate
            ? Number(formData.minimumPaymentRate)
            : null,
        // 연금 관련 필드
        pensionType: config.showPensionFields ? formData.pensionType : null,
      };

      await onAdd(submitData);

      // 성공 시 모달 닫기 (폼 초기화는 모달이 다시 열릴 때)
      setErrors({});
      onClose();
    } catch (error) {
      console.error("데이터 추가 실패:", error);
      setErrors({ form: "데이터 추가에 실패했습니다. 다시 시도해주세요." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 모달이 닫힐 때
  const handleClose = () => {
    setErrors({});
    onClose();
  };

  // 년도 옵션 생성 (현재 년도부터 2100년까지)
  const currentYear = new Date().getFullYear();
  const endYear = 2100;
  const yearOptions = Array.from(
    { length: endYear - currentYear + 1 },
    (_, i) => currentYear + i
  );

  // 분기 옵션 생성
  const quarterOptions = [];
  for (let year = currentYear; year <= endYear; year++) {
    for (let quarter = 1; quarter <= 4; quarter++) {
      quarterOptions.push({
        value: JSON.stringify({ year, quarter }),
        label: `${year}년 ${quarter}분기`,
      });
    }
  }

  // 월 옵션 생성
  const monthOptions = [];
  for (let year = currentYear; year <= endYear; year++) {
    for (let month = 1; month <= 12; month++) {
      monthOptions.push({
        value: JSON.stringify({ year, month }),
        label: `${year}년 ${month}월`,
      });
    }
  }

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {config.icon} {config.title}
          </h2>
          <button className={styles.closeButton} onClick={handleClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {errors.form && (
            <div className={styles.errorBanner}>{errors.form}</div>
          )}

          <div className={styles.field}>
            <label htmlFor="title" className={styles.label}>
              제목 *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`${styles.input} ${
                errors.title ? styles.inputError : ""
              }`}
              placeholder={
                category === "debts"
                  ? "예: 주택담보대출, 신용대출, 카드론"
                  : category === "incomes"
                  ? "예: 급여, 사업 소득"
                  : category === "expenses"
                  ? "예: 생활비, 교육비, 의료비"
                  : category === "savings"
                  ? "예: 정기저축, 적금, 목돈마련"
                  : category === "pensions"
                  ? "예: 국민연금, 개인연금(IRP), 퇴직연금"
                  : category === "assets"
                  ? "예: 예금, 주식, 부동산"
                  : "제목을 입력하세요"
              }
              disabled={isSubmitting}
            />
            {errors.title && (
              <span className={styles.errorText}>{errors.title}</span>
            )}
          </div>

          {/* 부채가 아닌 경우에만 금액 필드 표시 */}
          {category !== "debts" && (
            <div className={styles.field}>
              <label htmlFor="amount" className={styles.label}>
                {category === "pensions" ? "월 연금액 (만원)" : "금액 (만원)"} *
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className={`${styles.input} ${
                  errors.amount ? styles.inputError : ""
                }`}
                placeholder={
                  category === "pensions" ? "예: 200 (월 200만원)" : "예: 5000"
                }
                disabled={isSubmitting}
              />
              {errors.amount && (
                <span className={styles.errorText}>{errors.amount}</span>
              )}
            </div>
          )}

          {/* 부채가 아닌 경우에만 빈도 필드 표시 */}
          {category !== "debts" && (
            <div className={styles.field}>
              <label htmlFor="frequency" className={styles.label}>
                빈도 *
              </label>
              <select
                id="frequency"
                name="frequency"
                value={formData.frequency}
                onChange={handleChange}
                className={styles.input}
                disabled={isSubmitting}
              >
                <option value="yearly">년</option>
                <option value="monthly">월</option>
              </select>
            </div>
          )}

          {/* 부채가 아닌 경우의 날짜 입력 */}
          {category !== "debts" && (
            <>
              {/* 시작년도, 끝년도 (빈도와 관계없이 동일) */}
              <div className={styles.field}>
                <label htmlFor="startYear" className={styles.label}>
                  시작 년도 *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  id="startYear"
                  name="startYear"
                  value={formData.startYear}
                  onChange={handleChange}
                  className={`${styles.input} ${
                    errors.startYear ? styles.inputError : ""
                  }`}
                  disabled={isSubmitting}
                />
                {errors.startYear && (
                  <span className={styles.errorText}>{errors.startYear}</span>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="endYear" className={styles.label}>
                  종료 년도
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  id="endYear"
                  name="endYear"
                  value={formData.endYear}
                  onChange={handleChange}
                  className={`${styles.input} ${
                    errors.endYear ? styles.inputError : ""
                  }`}
                  disabled={isSubmitting}
                />
                {errors.endYear && (
                  <span className={styles.errorText}>{errors.endYear}</span>
                )}
              </div>
            </>
          )}

          {/* 부채용 날짜 입력 */}
          {category === "debts" && (
            <>
              {/* 원리금균등, 원금균등, 고정월상환: 시작일 + 종료일 */}
              {(formData.repaymentType === "equal_payment" ||
                formData.repaymentType === "equal_principal" ||
                formData.repaymentType === "fixed_payment") && (
                <>
                  <div className={styles.field}>
                    <label htmlFor="startYear" className={styles.label}>
                      대출 시작년도 *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      id="startYear"
                      name="startYear"
                      value={formData.startYear}
                      onChange={handleChange}
                      className={`${styles.input} ${
                        errors.startYear ? styles.inputError : ""
                      }`}
                      disabled={isSubmitting}
                    />
                    {errors.startYear && (
                      <span className={styles.errorText}>
                        {errors.startYear}
                      </span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="endYear" className={styles.label}>
                      대출 만료년도 *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      id="endYear"
                      name="endYear"
                      value={formData.endYear}
                      onChange={handleChange}
                      className={`${styles.input} ${
                        errors.endYear ? styles.inputError : ""
                      }`}
                      disabled={isSubmitting}
                    />
                    {errors.endYear && (
                      <span className={styles.errorText}>{errors.endYear}</span>
                    )}
                  </div>
                </>
              )}

              {/* 최소상환: 시작년도만 */}
              {formData.repaymentType === "minimum_payment" && (
                <div className={styles.field}>
                  <label htmlFor="startYear" className={styles.label}>
                    대출 시작년도 *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    id="startYear"
                    name="startYear"
                    value={formData.startYear}
                    onChange={handleChange}
                    className={`${styles.input} ${
                      errors.startYear ? styles.inputError : ""
                    }`}
                    disabled={isSubmitting}
                  />
                  {errors.startYear && (
                    <span className={styles.errorText}>{errors.startYear}</span>
                  )}
                  <span className={styles.helpText}>
                    최소상환은 종료일이 없으며, 원금이 모두 상환될 때까지
                    계속됩니다.
                  </span>
                </div>
              )}

              {/* 일시상환: 종료년도만 */}
              {formData.repaymentType === "lump_sum" && (
                <div className={styles.field}>
                  <label htmlFor="endYear" className={styles.label}>
                    상환년도 *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    id="endYear"
                    name="endYear"
                    value={formData.endYear}
                    onChange={handleChange}
                    className={`${styles.input} ${
                      errors.endYear ? styles.inputError : ""
                    }`}
                    disabled={isSubmitting}
                  />
                  {errors.endYear && (
                    <span className={styles.errorText}>{errors.endYear}</span>
                  )}
                  <span className={styles.helpText}>
                    일시상환은 지정된 날짜에 원금+이자를 일괄 상환합니다.
                  </span>
                </div>
              )}
            </>
          )}

          {config.showRate && (
            <div className={styles.field}>
              <label htmlFor="rate" className={styles.label}>
                {config.rateLabel}
              </label>
              <input
                type="number"
                id="rate"
                name="rate"
                value={formData.rate}
                onChange={handleChange}
                min="-100"
                max="100"
                step="0.1"
                className={styles.input}
                placeholder="예: 5.0"
                disabled={isSubmitting}
              />
              {errors.rate && (
                <span className={styles.errorText}>{errors.rate}</span>
              )}
            </div>
          )}

          {config.showGrowthRate && (
            <div className={styles.field}>
              <label htmlFor="growthRate" className={styles.label}>
                {config.growthRateLabel}
              </label>
              <input
                type="number"
                id="growthRate"
                name="growthRate"
                value={formData.growthRate}
                onChange={handleChange}
                min="-100"
                max="100"
                step="0.1"
                className={styles.input}
                placeholder="예: 3.0 (기본값: 0)"
                disabled={isSubmitting}
              />
              {errors.growthRate && (
                <span className={styles.errorText}>{errors.growthRate}</span>
              )}
              <span className={styles.helpText}>
                {category === "incomes"
                  ? "수입이 매년 상승하는 비율입니다. (예: 급여 3% 상승, 사업 수익 증가 등)"
                  : category === "pensions"
                  ? "연금이 매년 상승하는 비율입니다. (예: 물가상승률 2% 반영)"
                  : "물가 상승에 따른 지출 증가 비율입니다. (예: 2% 상승)"}
              </span>
            </div>
          )}

          {/* 연금 관련 필드 - 연금 카테고리에서만 표시 */}
          {category === "pensions" && (
            <>
              <div className={styles.field}>
                <label htmlFor="pensionType" className={styles.label}>
                  연금 종류 *
                </label>
                <select
                  id="pensionType"
                  name="pensionType"
                  value={formData.pensionType}
                  onChange={handleChange}
                  className={styles.input}
                  disabled={isSubmitting}
                >
                  <option value="national">국민연금</option>
                  <option value="private">개인연금</option>
                  <option value="retirement">퇴직연금</option>
                </select>
                <span className={styles.helpText}>연금 종류를 선택하세요</span>
              </div>
            </>
          )}

          {/* 부채 관련 필드 */}
          {config.showDebtFields && (
            <>
              <div className={styles.field}>
                <label htmlFor="principalAmount" className={styles.label}>
                  대출 원금 (만원) *
                </label>
                <input
                  type="number"
                  id="principalAmount"
                  name="principalAmount"
                  value={formData.principalAmount}
                  onChange={handleChange}
                  min="0"
                  step="1000"
                  className={styles.input}
                  placeholder="예: 30000 (3억원)"
                  disabled={isSubmitting}
                />
                {errors.principalAmount && (
                  <span className={styles.errorText}>
                    {errors.principalAmount}
                  </span>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="interestRate" className={styles.label}>
                  연 이자율 (%) *
                </label>
                <input
                  type="number"
                  id="interestRate"
                  name="interestRate"
                  value={formData.interestRate}
                  onChange={handleChange}
                  min="0"
                  max="50"
                  step="0.1"
                  className={styles.input}
                  placeholder="예: 3.5 (주택담보대출 기준)"
                  disabled={isSubmitting}
                />
                {errors.interestRate && (
                  <span className={styles.errorText}>
                    {errors.interestRate}
                  </span>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="repaymentType" className={styles.label}>
                  상환 방식 *
                </label>
                <select
                  id="repaymentType"
                  name="repaymentType"
                  value={formData.repaymentType}
                  onChange={handleChange}
                  className={styles.input}
                  disabled={isSubmitting}
                >
                  <option value="equal_payment">원리금균등상환</option>
                  <option value="equal_principal">원금균등상환</option>
                  <option value="minimum_payment">최소상환</option>
                  <option value="lump_sum">일시상환</option>
                  <option value="fixed_payment">고정월상환</option>
                </select>
                <span className={styles.helpText}>
                  원리금균등: 매월 동일한 금액 상환
                  <br />
                  원금균등: 매월 동일한 원금 + 잔여원금 이자
                  <br />
                  최소상환: 최소 상환 비율로 상환
                  <br />
                  일시상환: 만료일에 원금+이자 일괄 상환
                  <br />
                  고정월상환: 매월 고정 금액 상환
                </span>
              </div>

              {formData.repaymentType === "fixed_payment" && (
                <div className={styles.field}>
                  <label htmlFor="monthlyPayment" className={styles.label}>
                    월 상환액 (만원) *
                  </label>
                  <input
                    type="number"
                    id="monthlyPayment"
                    name="monthlyPayment"
                    value={formData.monthlyPayment}
                    onChange={handleChange}
                    min="0"
                    step="1000"
                    className={styles.input}
                    placeholder="예: 50 (50만원)"
                    disabled={isSubmitting}
                  />
                  {errors.monthlyPayment && (
                    <span className={styles.errorText}>
                      {errors.monthlyPayment}
                    </span>
                  )}
                </div>
              )}

              {formData.repaymentType === "minimum_payment" && (
                <div className={styles.field}>
                  <label htmlFor="minimumPaymentRate" className={styles.label}>
                    최소 상환 비율 (%) *
                  </label>
                  <input
                    type="number"
                    id="minimumPaymentRate"
                    name="minimumPaymentRate"
                    value={formData.minimumPaymentRate}
                    onChange={handleChange}
                    min="0.1"
                    max="100"
                    step="0.1"
                    className={styles.input}
                    placeholder="예: 2.0 (기본값: 2%)"
                    disabled={isSubmitting}
                  />
                  <span className={styles.helpText}>
                    매월 잔여 원금의 이 비율만큼 상환합니다.
                  </span>
                  {errors.minimumPaymentRate && (
                    <span className={styles.errorText}>
                      {errors.minimumPaymentRate}
                    </span>
                  )}
                </div>
              )}
            </>
          )}

          <div className={styles.field}>
            <label htmlFor="note" className={styles.label}>
              메모
            </label>
            <textarea
              id="note"
              name="note"
              value={formData.note}
              onChange={handleChange}
              rows="3"
              className={styles.input}
              placeholder="선택사항"
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleClose}
              className={styles.cancelButton}
              disabled={isSubmitting}
            >
              취소
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
