import React, { useState, useEffect } from "react";
import styles from "./ExpenseModal.module.css";

/**
 * 지출 데이터 추가/수정 모달
 */
function ExpenseModal({ isOpen, onClose, onSave, editData = null }) {
  const [formData, setFormData] = useState({
    title: "",
    frequency: "monthly", // monthly, yearly
    amount: "",
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear() + 10,
    memo: "",
    growthRate: 2.5, // 기본 상승률 2.5%
  });

  const [errors, setErrors] = useState({});

  // 수정 모드일 때 데이터 로드
  useEffect(() => {
    if (editData) {
      setFormData({
        title: editData.title || "",
        frequency: editData.originalFrequency || editData.frequency || "monthly",
        amount: editData.originalAmount || editData.amount || "",
        startYear: editData.startYear || new Date().getFullYear(),
        endYear: editData.endYear || new Date().getFullYear() + 10,
        memo: editData.memo || "",
        growthRate: editData.growthRate || 2.5,
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
        growthRate: 2.5,
      });
    }
  }, [editData]);

  // 폼 유효성 검사
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "제목을 입력해주세요.";
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = "금액을 입력해주세요.";
    }

    if (formData.startYear > formData.endYear) {
      newErrors.endYear = "종료년도는 시작년도보다 늦어야 합니다.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 숫자만 입력 허용
  const handleKeyPress = (e) => {
    if (!/[0-9]/.test(e.key) && !["Backspace", "Delete", "Tab", "Enter"].includes(e.key)) {
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
      memo: "",
      growthRate: 2.5,
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
                className={`${styles.input} ${errors.amount ? styles.error : ""}`}
                placeholder="예: 300"
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
                onChange={(e) =>
                  setFormData({ ...formData, startYear: e.target.value })
                }
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
                onChange={(e) =>
                  setFormData({ ...formData, endYear: e.target.value })
                }
                onKeyPress={handleKeyPress}
                className={`${styles.input} ${errors.endYear ? styles.error : ""}`}
                placeholder="2035"
              />
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
              onChange={(e) =>
                setFormData({ ...formData, growthRate: e.target.value })
              }
              onKeyPress={handleKeyPress}
              className={styles.input}
              placeholder="2.5"
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
            <button type="button" className={styles.cancelButton} onClick={handleClose}>
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
