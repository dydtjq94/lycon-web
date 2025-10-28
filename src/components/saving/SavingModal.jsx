import React, { useState, useEffect } from "react";
import styles from "./SavingModal.module.css";
import { formatAmountForChart } from "../../utils/format";
import { calculateKoreanAge } from "../../utils/koreanAge";

/**
 * 저축/투자 데이터 추가/수정 모달
 */
function SavingModal({
  isOpen,
  onClose,
  onSave,
  editData = null,
  profileData = null,
}) {
  // 은퇴년도 계산 함수 (만 나이 기준)
  const getRetirementYear = () => {
    if (profileData && profileData.birthYear && profileData.retirementAge) {
      return profileData.birthYear + profileData.retirementAge; // 설정된 은퇴 나이 (만 나이 기준)
    }
    return new Date().getFullYear() + 11; // 기본값
  };

  const [formData, setFormData] = useState({
    title: "",
    frequency: "monthly", // monthly, yearly, one_time
    amount: "",
    currentAmount: "", // 현재 보유 금액
    startYear: new Date().getFullYear(),
    endYear: getRetirementYear(),
    memo: "수익률 : 2020년부터 2024년까지의 5년간 퇴직연금의 연환산수익률\n증가율 : 연간 저축/투자금액 증가율 (%) → 1.89%",
    interestRate: "2.86", // 기본 수익률 2.86%
    yearlyGrowthRate: "1.89", // 연간 저축/투자금액 증가율 1.89%
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
          currentAmount: editData.currentAmount || "",
          startYear: parseInt(editData.startYear) || new Date().getFullYear(),
          endYear: parseInt(editData.endYear) || getRetirementYear(),
          memo: editData.memo || "",
          interestRate: editData.interestRate
            ? (editData.interestRate * 100).toString()
            : "2.86",
          yearlyGrowthRate: editData.yearlyGrowthRate
            ? (editData.yearlyGrowthRate * 100).toString()
            : "1.89",
        });
      } else {
        // 새 데이터일 때 초기화
        setFormData({
          title: "",
          frequency: "monthly",
          amount: "",
          currentAmount: "",
          startYear: new Date().getFullYear(),
          endYear: getRetirementYear(),
          memo: "수익률 : 2020년부터 2024년까지의 5년간 퇴직연금의 연환산수익률\n증가율 : 연간 저축/투자금액 증가율 (%) → 1.89%",
          interestRate: "2.86",
          yearlyGrowthRate: "1.89",
        });
      }
    }
  }, [isOpen, editData]);

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
      !/[0-9.\-]/.test(e.key) &&
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
      currentAmount: formData.currentAmount
        ? parseInt(formData.currentAmount)
        : 0,
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
      currentAmount: "",
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear() + 10,
      memo: "수익률 : 2020년부터 2024년까지의 5년간 퇴직연금의 연환산수익률\n증가율 : 연간 저축/투자금액 증가율 (%) → 1.89%",
      interestRate: "2.86",
      yearlyGrowthRate: "1.89",
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

          {/* 주기와 금액 */}
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

          {/* 현재 보유 금액 */}
          <div className={styles.field}>
            <label htmlFor="currentAmount" className={styles.label}>
              현재 보유 금액 (만원)
            </label>
            <input
              type="text"
              id="currentAmount"
              value={formData.currentAmount}
              onChange={(e) =>
                setFormData({ ...formData, currentAmount: e.target.value })
              }
              onKeyPress={handleKeyPress}
              className={styles.input}
              placeholder="예: 500"
            />
            {formData.currentAmount &&
              !isNaN(parseInt(formData.currentAmount)) && (
                <div className={styles.amountPreview}>
                  {formatAmountForChart(parseInt(formData.currentAmount))}
                </div>
              )}
            <div className={styles.helperText}>
              시작년도 기준 현재 이미 보유하고 있는 금액입니다 (선택사항)
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

          {/* 이자율과 연간 저축/투자금액 증가율 */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="interestRate" className={styles.label}>
                연평균 수익률 (%)
              </label>
              <input
                type="text"
                id="interestRate"
                value={formData.interestRate}
                onChange={(e) => {
                  const value = e.target.value;
                  // 숫자와 소수점, 마이너스 허용
                  if (value === "" || /^-?\d*\.?\d*$/.test(value)) {
                    setFormData({ ...formData, interestRate: value });
                  }
                }}
                onKeyPress={handleKeyPress}
                className={styles.input}
                placeholder="2.86"
              />
            </div>

            {formData.frequency !== "one_time" && (
              <div className={styles.field}>
                <label htmlFor="yearlyGrowthRate" className={styles.label}>
                  연간 저축/투자금액 증가율 (%)
                </label>
                <input
                  type="text"
                  id="yearlyGrowthRate"
                  value={formData.yearlyGrowthRate}
                  onChange={(e) => {
                    const value = e.target.value;
                    // 숫자와 소수점, 마이너스 허용
                    if (value === "" || /^-?\d*\.?\d*$/.test(value)) {
                      setFormData({
                        ...formData,
                        yearlyGrowthRate: value,
                      });
                    }
                  }}
                  onKeyPress={handleKeyPress}
                  className={styles.input}
                  placeholder="1.89"
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
