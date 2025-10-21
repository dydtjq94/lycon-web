import React, { useState, useEffect } from "react";
import styles from "./SavingModal.module.css";

/**
 * 저축/투자 데이터 추가/수정 모달
 */
function SavingModal({ isOpen, onClose, onSave, editData = null }) {
  const [formData, setFormData] = useState({
    title: "",
    frequency: "monthly", // monthly, yearly, one_time
    amount: "",
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear() + 10,
    memo: "",
    interestRate: "3.0", // 이자율 3%
    yearlyGrowthRate: "0", // 년간 저축 상승률 0%
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
          endYear: parseInt(editData.endYear) || new Date().getFullYear() + 10,
          memo: editData.memo || "",
          interestRate: editData.interestRate
            ? (editData.interestRate * 100).toString()
            : "3.0",
          yearlyGrowthRate: editData.yearlyGrowthRate
            ? (editData.yearlyGrowthRate * 100).toString()
            : "0",
        });
      } else {
        // 새 데이터일 때 초기화
        setFormData({
          title: "",
          frequency: "monthly",
          amount: "",
          startYear: new Date().getFullYear(),
          endYear: new Date().getFullYear() + 10,
          memo: "",
          interestRate: "3.0",
          yearlyGrowthRate: "0",
        });
      }
    }
  }, [isOpen, editData]);

  // 폼 유효성 검사
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "저축/투자 항목명을 입력해주세요.";
    }

    if (!formData.amount || formData.amount < 0) {
      newErrors.amount = "저축/투자 금액을 입력해주세요.";
    }

    if (formData.startYear > formData.endYear) {
      newErrors.endYear = "종료년도는 시작년도보다 늦어야 합니다.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  // 폼 제출 핸들러
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const savingData = {
      ...formData,
      amount: parseInt(formData.amount),
      startYear: parseInt(formData.startYear), // 문자열을 숫자로 변환
      endYear: parseInt(formData.endYear), // 문자열을 숫자로 변환
      interestRate: parseFloat(formData.interestRate) / 100, // 백분율을 소수로 변환
      yearlyGrowthRate: parseFloat(formData.yearlyGrowthRate) / 100, // 백분율을 소수로 변환
      originalAmount: parseInt(formData.amount),
      originalFrequency: formData.frequency,
    };

    onSave(savingData);
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
      memo: "",
      interestRate: "3.0",
      yearlyGrowthRate: "0",
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
            {editData ? "저축/투자 수정" : "저축/투자 추가"}
          </h2>
          <button className={styles.closeButton} onClick={handleClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* 저축 항목명 */}
          <div className={styles.field}>
            <label htmlFor="title" className={styles.label}>
              저축/투자 항목명 *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className={`${styles.input} ${errors.title ? styles.error : ""}`}
              placeholder="예: 정기예금, 적금, 주식투자"
            />
            {errors.title && (
              <span className={styles.errorText}>{errors.title}</span>
            )}
          </div>

          {/* 빈도와 금액 */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="frequency" className={styles.label}>
                빈도 *
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
                <option value="one_time">일회성</option>
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
                placeholder="예: 100"
              />
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
              {errors.endYear && (
                <span className={styles.errorText}>{errors.endYear}</span>
              )}
            </div>
          </div>

          {/* 이자율과 년간 저축 상승률 */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="interestRate" className={styles.label}>
                이자율 (%)
              </label>
              <input
                type="text"
                id="interestRate"
                value={formData.interestRate}
                onChange={(e) => {
                  const value = e.target.value;
                  // 숫자와 소수점만 허용
                  if (value === "" || /^\d*\.?\d*$/.test(value)) {
                    setFormData({ ...formData, interestRate: value });
                  }
                }}
                onKeyPress={handleKeyPress}
                className={styles.input}
                placeholder="3.0"
              />
            </div>

            {formData.frequency !== "one_time" && (
              <div className={styles.field}>
                <label htmlFor="yearlyGrowthRate" className={styles.label}>
                  년간 저축/투자 상승률 (%)
                </label>
                <input
                  type="text"
                  id="yearlyGrowthRate"
                  value={formData.yearlyGrowthRate}
                  onChange={(e) => {
                    const value = e.target.value;
                    // 숫자와 소수점만 허용
                    if (value === "" || /^\d*\.?\d*$/.test(value)) {
                      setFormData({
                        ...formData,
                        yearlyGrowthRate: value,
                      });
                    }
                  }}
                  onKeyPress={handleKeyPress}
                  className={styles.input}
                  placeholder="0"
                />
              </div>
            )}
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

export default SavingModal;
