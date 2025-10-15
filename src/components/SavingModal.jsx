import React, { useState, useEffect } from "react";
import styles from "./SavingModal.module.css";

/**
 * 저축 데이터 추가/수정 모달
 */
function SavingModal({ isOpen, onClose, onSave, editData = null }) {
  const [formData, setFormData] = useState({
    title: "",
    frequency: "monthly", // monthly, yearly, one_time
    amount: "",
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear() + 10,
    memo: "",
    interestRate: 3.0, // 이자율 3%
    monthlyGrowthRate: 0, // 월간 저축 상승률 0%
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
          startYear: editData.startYear || new Date().getFullYear(),
          endYear: editData.endYear || new Date().getFullYear() + 10,
          memo: editData.memo || "",
          interestRate: editData.interestRate || 3.0,
          monthlyGrowthRate: editData.monthlyGrowthRate || 0,
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
          interestRate: 3.0,
          monthlyGrowthRate: 0,
        });
      }
    }
  }, [isOpen, editData]);

  // 폼 유효성 검사
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "저축 항목명을 입력해주세요.";
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = "저축 금액을 입력해주세요.";
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
      originalAmount: parseInt(formData.amount),
      originalFrequency: formData.frequency,
      // 일회성 저축도 사용자가 설정한 endYear 사용
      endYear: formData.endYear,
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
      interestRate: 3.0,
      monthlyGrowthRate: 0,
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
            {editData ? "저축 수정" : "저축 추가"}
          </h2>
          <button className={styles.closeButton} onClick={handleClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* 저축 항목명 */}
          <div className={styles.field}>
            <label htmlFor="title" className={styles.label}>
              저축 항목명 *
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

          {/* 이자율과 월간 저축 상승률 */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="interestRate" className={styles.label}>
                이자율 (%)
              </label>
              <input
                type="text"
                id="interestRate"
                value={formData.interestRate}
                onChange={(e) =>
                  setFormData({ ...formData, interestRate: e.target.value })
                }
                onKeyPress={handleKeyPress}
                className={styles.input}
                placeholder="3.0"
              />
            </div>

            {formData.frequency !== "one_time" && (
              <div className={styles.field}>
                <label htmlFor="monthlyGrowthRate" className={styles.label}>
                  월간 저축 상승률 (%)
                </label>
                <input
                  type="text"
                  id="monthlyGrowthRate"
                  value={formData.monthlyGrowthRate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      monthlyGrowthRate: e.target.value,
                    })
                  }
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
