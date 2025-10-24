import React, { useState, useEffect } from "react";
import styles from "./IncomeModal.module.css";
import { formatAmountForChart } from "../../utils/format";

/**
 * 수입 데이터 추가/수정 모달
 */
function IncomeModal({
  isOpen,
  onClose,
  onSave,
  editData = null,
  profileData = null,
}) {
  // 은퇴년도 계산
  const getRetirementYear = () => {
    if (profileData && profileData.birthYear && profileData.retirementAge) {
      return profileData.birthYear + profileData.retirementAge - 1; // 설정된 은퇴 나이
    }
    return new Date().getFullYear() + 10; // 기본값
  };

  const [formData, setFormData] = useState({
    title: "",
    frequency: "monthly", // monthly, yearly
    amount: "",
    startYear: new Date().getFullYear(),
    endYear: getRetirementYear(),
    memo: "",
    growthRate: "2.5", // 기본 상승률 2.5%
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
          endYear: editData.endYear || getRetirementYear(),
          memo: editData.memo || "",
          growthRate: editData.growthRate
            ? editData.growthRate.toString()
            : "2.5",
        });
      } else {
        // 새 데이터일 때 초기화
        setFormData({
          title: "",
          frequency: "monthly",
          amount: "",
          startYear: new Date().getFullYear(),
          endYear: getRetirementYear(),
          memo: "",
          growthRate: "2.5",
        });
      }
    }
  }, [isOpen, editData]);

  // 폼 유효성 검사
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "수입 항목명을 입력해주세요.";
    }

    if (!formData.amount || formData.amount < 0) {
      newErrors.amount = "금액을 입력해주세요.";
    }

    if (formData.startYear > formData.endYear) {
      newErrors.endYear = "종료년도는 시작년도보다 늦어야 합니다.";
    }

    const growthRateNum = parseFloat(formData.growthRate);
    if (isNaN(growthRateNum) || growthRateNum < 0 || growthRateNum > 100) {
      newErrors.growthRate = "상승률은 0-100% 사이의 유효한 숫자여야 합니다.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const incomeData = {
      ...formData,
      amount: parseInt(formData.amount),
      growthRate: parseFloat(formData.growthRate),
      originalAmount: parseInt(formData.amount),
      originalFrequency: formData.frequency,
    };

    onSave(incomeData);
    onClose();
  };

  // 모달이 닫힐 때 폼 초기화
  const handleClose = () => {
    setFormData({
      title: "",
      frequency: "monthly",
      amount: "",
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear() + 10,
      memo: "",
      growthRate: "2.5",
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
            {editData ? "수입 수정" : "수입 추가"}
          </h2>
          <button className={styles.closeButton} onClick={handleClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* 수입 항목명 */}
          <div className={styles.field}>
            <label htmlFor="title" className={styles.label}>
              수입 항목명 *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className={`${styles.input} ${errors.title ? styles.error : ""}`}
              placeholder="예: 근로소득, 사업소득, 임대소득"
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
                className={`${styles.input} ${
                  errors.amount ? styles.error : ""
                }`}
                placeholder="100"
                onKeyPress={(e) => {
                  if (!/[0-9.]/.test(e.key)) e.preventDefault();
                }}
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

          {/* 시작년도와 종료년도 */}
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
                  setFormData({
                    ...formData,
                    startYear: parseInt(e.target.value) || 0,
                  })
                }
                className={styles.input}
                onKeyPress={(e) => {
                  if (!/[0-9.]/.test(e.key)) e.preventDefault();
                }}
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
                  setFormData({
                    ...formData,
                    endYear: parseInt(e.target.value) || 0,
                  })
                }
                className={`${styles.input} ${
                  errors.endYear ? styles.error : ""
                }`}
                onKeyPress={(e) => {
                  if (!/[0-9.]/.test(e.key)) e.preventDefault();
                }}
              />
              {errors.endYear && (
                <span className={styles.errorText}>{errors.endYear}</span>
              )}
            </div>
          </div>

          {/* 상승률 */}
          <div className={styles.field}>
            <label htmlFor="growthRate" className={styles.label}>
              연간 상승률 (%)
            </label>
            <input
              type="text"
              id="growthRate"
              value={formData.growthRate}
              onChange={(e) => {
                const value = e.target.value;
                // 숫자와 소수점만 허용
                if (value === "" || /^\d*\.?\d*$/.test(value)) {
                  setFormData({
                    ...formData,
                    growthRate: value,
                  });
                }
              }}
              className={`${styles.input} ${
                errors.growthRate ? styles.error : ""
              }`}
              placeholder="2.5"
            />
            {errors.growthRate && (
              <span className={styles.errorText}>{errors.growthRate}</span>
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
              placeholder="추가 설명이나 참고사항"
              rows={3}
            />
          </div>

          {/* 버튼 */}
          <div className={styles.buttonGroup}>
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

export default IncomeModal;
