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
    } catch (error) {
      console.error("데이터 추가 오류:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 모달 닫기 핸들러
  const handleClose = () => {
    if (!isSubmitting) {
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
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {config.icon} {config.title}
          </h2>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
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
              placeholder="예: 급여, 주택담보대출, 생활비 등"
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
              종료일 (선택)
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              min={formData.startDate}
              className={`${styles.input} ${
                errors.endDate ? styles.inputError : ""
              }`}
              disabled={isSubmitting}
            />
            {errors.endDate && (
              <span className={styles.errorText}>{errors.endDate}</span>
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
              onChange={handleChange}
              className={styles.input}
              disabled={isSubmitting}
            >
              <option value="daily">일일</option>
              <option value="monthly">월</option>
              <option value="quarterly">분기</option>
              <option value="yearly">년</option>
              <option value="once">일회성</option>
            </select>
          </div>

          {config.showRate && (
            <div className={styles.field}>
              <label htmlFor="rate" className={styles.label}>
                {config.rateLabel} (선택)
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
                className={`${styles.input} ${
                  errors.rate ? styles.inputError : ""
                }`}
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
              메모 (선택)
            </label>
            <input
              type="text"
              id="note"
              name="note"
              value={formData.note}
              onChange={handleChange}
              className={styles.input}
              placeholder="추가 정보나 설명"
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleClose}
              disabled={isSubmitting}
            >
              취소
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? "추가 중..." : "추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
