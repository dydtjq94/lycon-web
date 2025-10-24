import React, { useState, useEffect } from "react";
import styles from "./ExpenseModal.module.css";
import { formatAmountForChart } from "../../utils/format";
import { calculateKoreanAge } from "../../utils/koreanAge";

/**
 * 지출 데이터 추가/수정 모달
 */
function ExpenseModal({
  isOpen,
  onClose,
  onSave,
  editData = null,
  profileData = null,
}) {
  // 은퇴년도 계산 (55세까지)
  const getRetirementYear = () => {
    if (profileData && profileData.birthYear && profileData.retirementAge) {
      return profileData.birthYear + profileData.retirementAge; // 설정된 은퇴 나이 + 1년
    }
    return new Date().getFullYear() + 11; // 기본값 + 1년
  };

  const [formData, setFormData] = useState({
    title: "",
    frequency: "monthly", // monthly, yearly
    amount: "",
    startYear: new Date().getFullYear(),
    endYear: getRetirementYear(),
    memo: "10년 평균물가상승률 반영",
    growthRate: "2.0", // % 단위로 기본값 설정
  });

  const [errors, setErrors] = useState({});

  // 수정 모드일 때 데이터 로드, 모달이 열릴 때마다 초기화
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          title: editData.title || "",
          frequency:
            editData.originalFrequency || editData.frequency || "monthly",
          amount: editData.originalAmount || editData.amount || "",
          startYear: parseInt(editData.startYear) || new Date().getFullYear(),
          endYear: parseInt(editData.endYear) || getRetirementYear(),
          memo: editData.memo || "",
          growthRate: editData.growthRate
            ? editData.growthRate.toString()
            : "2.0",
        });
      } else {
        // 새 데이터일 때 초기화
        setFormData({
          title: "",
          frequency: "monthly",
          amount: "",
          startYear: new Date().getFullYear(),
          endYear: getRetirementYear(),
          memo: "10년 평균물가상승률 반영",
          growthRate: "2.0",
        });
      }
    }
  }, [isOpen, editData]);

  // 폼 유효성 검사
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "제목을 입력해주세요.";
    }

    if (!formData.amount || formData.amount < 0) {
      newErrors.amount = "금액을 입력해주세요.";
    }

    if (formData.startYear > formData.endYear) {
      newErrors.endYear = "종료년도는 시작년도보다 늦어야 합니다.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 숫자와 마이너스 기호 입력 허용
  const handleKeyPress = (e) => {
    if (
      !/[0-9.-]/.test(e.key) &&
      !["Backspace", "Delete", "Tab", "Enter"].includes(e.key)
    ) {
      e.preventDefault();
    }
  };

  // 폼 제출 핸들러
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const expenseData = {
      ...formData,
      amount: parseInt(formData.amount),
      startYear: parseInt(formData.startYear), // 문자열을 숫자로 변환
      endYear: parseInt(formData.endYear), // 문자열을 숫자로 변환
      growthRate: parseFloat(formData.growthRate), // 백분율 그대로 저장 (마이너스 값 포함)
      originalAmount: parseInt(formData.amount),
      originalFrequency: formData.frequency,
    };

    onSave(expenseData);
    onClose();
  };

  // 모달 닫기 핸들러
  const handleClose = () => {
    setFormData({
      title: "",
      frequency: "monthly",
      amount: "",
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear() + 10,
      memo: "10년 평균물가상승률 반영",
      growthRate: "2.0",
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {editData ? "지출 수정" : "지출 추가"}
          </h2>
          <button className={styles.closeButton} onClick={handleClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* 지출 항목명 */}
          <div className={styles.field}>
            <label htmlFor="title" className={styles.label}>
              지출 항목명 *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className={`${styles.input} ${errors.title ? styles.error : ""}`}
              placeholder="예: 생활비, 교육비, 의료비"
            />
            {errors.title && (
              <span className={styles.errorText}>{errors.title}</span>
            )}
          </div>

          {/* 빈도와 금액 */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="frequency" className={styles.label}>
                주기 *
              </label>
              <select
                id="frequency"
                value={formData.frequency}
                onChange={(e) =>
                  setFormData({ ...formData, frequency: e.target.value })
                }
                className={styles.select}
              >
                <option value="monthly">월</option>
                <option value="yearly">년</option>
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="amount" className={styles.label}>
                금액 (만원) *
              </label>
              <input
                type="text"
                id="amount"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                onKeyPress={handleKeyPress}
                className={`${styles.input} ${
                  errors.amount ? styles.error : ""
                }`}
                placeholder="예: 300"
              />
              {formData.amount && !isNaN(parseInt(formData.amount)) && (
                <div className={styles.amountPreview}>
                  {formatAmountForChart(parseInt(formData.amount))}
                </div>
              )}
              {errors.amount && (
                <span className={styles.errorText}>{errors.amount}</span>
              )}
            </div>
          </div>

          {/* 기간 */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="startYear" className={styles.label}>
                시작년도 *
              </label>
              <input
                type="text"
                id="startYear"
                value={formData.startYear}
                onChange={(e) => {
                  const value = e.target.value;
                  // 숫자만 허용하고 4자리 제한
                  if (value === "" || /^\d{0,4}$/.test(value)) {
                    setFormData({ ...formData, startYear: value });
                  }
                }}
                onKeyPress={handleKeyPress}
                className={styles.input}
                placeholder="2025"
              />
              {/* 시작년도 나이 표시 */}
              {formData.startYear && profileData && profileData.birthYear && (
                <div className={styles.agePreview}>
                  {calculateKoreanAge(
                    profileData.birthYear,
                    formData.startYear
                  )}
                  세
                </div>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="endYear" className={styles.label}>
                종료년도 *
              </label>
              <input
                type="text"
                id="endYear"
                value={formData.endYear}
                onChange={(e) => {
                  const value = e.target.value;
                  // 숫자만 허용하고 4자리 제한
                  if (value === "" || /^\d{0,4}$/.test(value)) {
                    setFormData({ ...formData, endYear: value });
                  }
                }}
                onKeyPress={handleKeyPress}
                className={`${styles.input} ${
                  errors.endYear ? styles.error : ""
                }`}
                placeholder="2035"
              />
              {/* 종료년도 나이 표시 */}
              {formData.endYear && profileData && profileData.birthYear && (
                <div className={styles.agePreview}>
                  {calculateKoreanAge(profileData.birthYear, formData.endYear)}
                  세
                </div>
              )}
              {errors.endYear && (
                <span className={styles.errorText}>{errors.endYear}</span>
              )}
            </div>
          </div>

          {/* 상승률 */}
          <div className={styles.field}>
            <label htmlFor="growthRate" className={styles.label}>
              상승률 (%)
            </label>
            <input
              type="text"
              id="growthRate"
              value={formData.growthRate}
              onChange={(e) => {
                const value = e.target.value;
                // 숫자, 소수점, 마이너스 기호 허용 (마이너스는 맨 앞에만)
                if (value === "" || /^-?\d*\.?\d*$/.test(value)) {
                  setFormData({ ...formData, growthRate: value });
                }
              }}
              onKeyPress={handleKeyPress}
              className={styles.input}
              placeholder="2.0 (마이너스 가능: -1.0)"
            />
          </div>

          {/* 메모 */}
          <div className={styles.field}>
            <label htmlFor="memo" className={styles.label}>
              메모
            </label>
            <textarea
              id="memo"
              value={formData.memo}
              onChange={(e) =>
                setFormData({ ...formData, memo: e.target.value })
              }
              className={styles.textarea}
              rows="3"
              placeholder="추가 설명이나 참고사항을 입력하세요"
            />
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleClose}
            >
              취소
            </button>
            <button type="submit" className={styles.saveButton}>
              {editData ? "수정" : "추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExpenseModal;
