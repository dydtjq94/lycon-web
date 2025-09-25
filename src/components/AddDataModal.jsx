// 데이터 추가 모달 컴포넌트 (공통)
import React, { useState } from "react";
import { getTodayString, isValidDate } from "../utils/date.js";
import styles from "./AddDataModal.module.css";

export default function AddDataModal({ isOpen, onClose, onAdd, category }) {
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    startDate: getTodayString(),
    endDate: "",
    frequency: "monthly",
    note: "",
    rate: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 카테고리별 설정
  const categoryConfig = {
    incomes: {
      title: "수입 추가",
      icon: "💰",
      rateLabel: "수익률 (%/년)",
      showRate: false,
    },
    assets: {
      title: "자산 추가",
      icon: "🏦",
      rateLabel: "수익률 (%/년)",
      showRate: true,
    },
    debts: {
      title: "부채 추가",
      icon: "💳",
      rateLabel: "이자율 (%/년)",
      showRate: true,
    },
    expenses: {
      title: "지출 추가",
      icon: "💸",
      rateLabel: "수익률 (%/년)",
      showRate: false,
    },
    pensions: {
      title: "연금 추가",
      icon: "🏛️",
      rateLabel: "수익률 (%/년)",
      showRate: false,
    },
  };

  const config = categoryConfig[category] || categoryConfig.incomes;

  // 폼 데이터 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 해당 필드의 오류 제거
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // 빈도 변경 핸들러
  const handleFrequencyChange = (e) => {
    const frequency = e.target.value;
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const currentQuarter = Math.ceil(currentMonth / 3);

    let newStartDate = "";
    let newEndDate = "";

    switch (frequency) {
      case "yearly":
        newStartDate = `${currentYear}-01-01`;
        newEndDate = `${currentYear}-12-31`;
        break;
      case "quarterly":
        newStartDate = `${currentYear}-01-01`;
        newEndDate = `${currentYear}-03-31`;
        break;
      case "monthly":
        newStartDate = `${currentYear}-${String(currentMonth).padStart(
          2,
          "0"
        )}-01`;
        newEndDate = `${currentYear}-${String(currentMonth).padStart(
          2,
          "0"
        )}-${new Date(currentYear, currentMonth, 0).getDate()}`;
        break;
      case "daily":
        newStartDate = getTodayString();
        newEndDate = getTodayString();
        break;
      case "once":
        newStartDate = `${currentYear}-01-01`;
        newEndDate = `${currentYear}-12-31`;
        break;
      default:
        newStartDate = getTodayString();
        newEndDate = "";
    }

    setFormData((prev) => ({
      ...prev,
      frequency,
      startDate: newStartDate,
      endDate: newEndDate,
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

    // 금액 검증
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = "금액을 입력해주세요.";
    }

    // 시작일 검증
    if (!formData.startDate) {
      newErrors.startDate = "시작일을 선택해주세요.";
    } else if (!isValidDate(formData.startDate)) {
      newErrors.startDate = "올바른 날짜 형식이 아닙니다.";
    }

    // 종료일 검증 (입력된 경우)
    if (formData.endDate && !isValidDate(formData.endDate)) {
      newErrors.endDate = "올바른 날짜 형식이 아닙니다.";
    } else if (
      formData.endDate &&
      formData.startDate &&
      formData.endDate <= formData.startDate
    ) {
      newErrors.endDate = "종료일은 시작일보다 늦어야 합니다.";
    }

    // 수익률/이자율 검증 (해당 카테고리인 경우)
    if (
      config.showRate &&
      formData.rate &&
      (formData.rate < -100 || formData.rate > 100)
    ) {
      newErrors.rate = "수익률/이자율은 -100%에서 100% 사이여야 합니다.";
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
      // 폼 데이터 정리
      const submitData = {
        title: formData.title.trim(),
        amount: Number(formData.amount),
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        frequency: formData.frequency,
        note: formData.note.trim() || null,
        rate: config.showRate && formData.rate ? Number(formData.rate) : null,
      };

      await onAdd(submitData);

      // 성공 시 폼 초기화
      setFormData({
        title: "",
        amount: "",
        startDate: getTodayString(),
        endDate: "",
        frequency: "monthly",
        note: "",
        rate: "",
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error("데이터 추가 실패:", error);
      setErrors({ form: "데이터 추가에 실패했습니다. 다시 시도해주세요." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 모달이 닫힐 때 폼 초기화
  const handleClose = () => {
    setFormData({
      title: "",
      amount: "",
      startDate: getTodayString(),
      endDate: "",
      frequency: "monthly",
      note: "",
      rate: "",
    });
    setErrors({});
    onClose();
  };

  // 년도 옵션 생성 (현재 년도부터 50년 후까지)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 51 }, (_, i) => currentYear + i);

  // 분기 옵션 생성
  const quarterOptions = [];
  for (let year = currentYear; year <= currentYear + 10; year++) {
    for (let quarter = 1; quarter <= 4; quarter++) {
      quarterOptions.push({
        value: JSON.stringify({ year, quarter }),
        label: `${year}년 ${quarter}분기`,
      });
    }
  }

  // 월 옵션 생성
  const monthOptions = [];
  for (let year = currentYear; year <= currentYear + 10; year++) {
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
              placeholder="예: 급여, 사업 소득"
              disabled={isSubmitting}
            />
            {errors.title && (
              <span className={styles.errorText}>{errors.title}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="amount" className={styles.label}>
              금액 (원) *
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              min="0"
              step="1"
              className={`${styles.input} ${
                errors.amount ? styles.inputError : ""
              }`}
              placeholder="예: 5000000"
              disabled={isSubmitting}
            />
            {errors.amount && (
              <span className={styles.errorText}>{errors.amount}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="frequency" className={styles.label}>
              빈도 *
            </label>
            <select
              id="frequency"
              name="frequency"
              value={formData.frequency}
              onChange={handleFrequencyChange}
              className={styles.input}
              disabled={isSubmitting}
            >
              <option value="yearly">년</option>
              <option value="quarterly">분기</option>
              <option value="monthly">월</option>
              <option value="daily">일</option>
              <option value="once">일회성</option>
            </select>
          </div>

          {/* 일회성: 년도만 선택 */}
          {formData.frequency === "once" && (
            <div className={styles.field}>
              <label htmlFor="year" className={styles.label}>
                적용 년도 *
              </label>
              <select
                id="year"
                name="year"
                value={
                  formData.startDate
                    ? formData.startDate.split("-")[0]
                    : currentYear
                }
                onChange={(e) => handleYearChange(e, "start")}
                className={styles.input}
                disabled={isSubmitting}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}년
                  </option>
                ))}
              </select>
              <span className={styles.helpText}>
                일회성 항목은 선택한 년도 전체에 적용됩니다.
              </span>
            </div>
          )}

          {/* 년: 시작년도, 끝년도 */}
          {formData.frequency === "yearly" && (
            <>
              <div className={styles.field}>
                <label htmlFor="startYear" className={styles.label}>
                  시작 년도 *
                </label>
                <select
                  id="startYear"
                  name="startYear"
                  value={
                    formData.startDate
                      ? formData.startDate.split("-")[0]
                      : currentYear
                  }
                  onChange={(e) => handleYearChange(e, "start")}
                  className={styles.input}
                  disabled={isSubmitting}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}년
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="endYear" className={styles.label}>
                  끝 년도
                </label>
                <select
                  id="endYear"
                  name="endYear"
                  value={
                    formData.endDate
                      ? formData.endDate.split("-")[0]
                      : currentYear
                  }
                  onChange={(e) => handleYearChange(e, "end")}
                  className={styles.input}
                  disabled={isSubmitting}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}년
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* 분기: 시작년도&분기, 끝년도&분기 */}
          {formData.frequency === "quarterly" && (
            <>
              <div className={styles.field}>
                <label htmlFor="startQuarter" className={styles.label}>
                  시작 분기 *
                </label>
                <select
                  id="startQuarter"
                  name="startQuarter"
                  value={JSON.stringify({
                    year: formData.startDate
                      ? parseInt(formData.startDate.split("-")[0])
                      : currentYear,
                    quarter: formData.startDate
                      ? Math.ceil(
                          parseInt(formData.startDate.split("-")[1]) / 3
                        )
                      : 1,
                  })}
                  onChange={(e) => handleQuarterChange(e, "start")}
                  className={styles.input}
                  disabled={isSubmitting}
                >
                  {quarterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="endQuarter" className={styles.label}>
                  끝 분기
                </label>
                <select
                  id="endQuarter"
                  name="endQuarter"
                  value={JSON.stringify({
                    year: formData.endDate
                      ? parseInt(formData.endDate.split("-")[0])
                      : currentYear,
                    quarter: formData.endDate
                      ? Math.ceil(parseInt(formData.endDate.split("-")[1]) / 3)
                      : 1,
                  })}
                  onChange={(e) => handleQuarterChange(e, "end")}
                  className={styles.input}
                  disabled={isSubmitting}
                >
                  {quarterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* 월: 시작년도&월, 끝년도&월 */}
          {formData.frequency === "monthly" && (
            <>
              <div className={styles.field}>
                <label htmlFor="startMonth" className={styles.label}>
                  시작 월 *
                </label>
                <select
                  id="startMonth"
                  name="startMonth"
                  value={JSON.stringify({
                    year: formData.startDate
                      ? parseInt(formData.startDate.split("-")[0])
                      : currentYear,
                    month: formData.startDate
                      ? parseInt(formData.startDate.split("-")[1])
                      : 1,
                  })}
                  onChange={(e) => handleMonthChange(e, "start")}
                  className={styles.input}
                  disabled={isSubmitting}
                >
                  {monthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="endMonth" className={styles.label}>
                  끝 월
                </label>
                <select
                  id="endMonth"
                  name="endMonth"
                  value={JSON.stringify({
                    year: formData.endDate
                      ? parseInt(formData.endDate.split("-")[0])
                      : currentYear,
                    month: formData.endDate
                      ? parseInt(formData.endDate.split("-")[1])
                      : 1,
                  })}
                  onChange={(e) => handleMonthChange(e, "end")}
                  className={styles.input}
                  disabled={isSubmitting}
                >
                  {monthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* 일: 시작년도&월&일, 끝년도&월&일 */}
          {formData.frequency === "daily" && (
            <>
              <div className={styles.field}>
                <label htmlFor="startDate" className={styles.label}>
                  시작일 *
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className={`${styles.input} ${
                    errors.startDate ? styles.inputError : ""
                  }`}
                  disabled={isSubmitting}
                />
                {errors.startDate && (
                  <span className={styles.errorText}>{errors.startDate}</span>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="endDate" className={styles.label}>
                  종료일
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className={`${styles.input} ${
                    errors.endDate ? styles.inputError : ""
                  }`}
                  disabled={isSubmitting}
                />
                {errors.endDate && (
                  <span className={styles.errorText}>{errors.endDate}</span>
                )}
              </div>
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
