import React, { useState, useEffect } from "react";
import styles from "./DebtModal.module.css";

/**
 * 부채 데이터 추가/수정 모달
 */
function DebtModal({
  isOpen,
  onClose,
  onSave,
  editData = null,
  profileData = null,
}) {
  // 은퇴년도 계산 함수
  const getRetirementYear = () => {
    if (profileData && profileData.birthYear && profileData.retirementAge) {
      return profileData.birthYear + profileData.retirementAge - 1; // 설정된 은퇴 나이
    }
    return new Date().getFullYear() + 5; // 기본값
  };

  const [formData, setFormData] = useState({
    title: "",
    debtType: "bullet", // bullet: 만기일시상환, equal: 원리금균등상환, principal: 원금균등상환, grace: 거치식상환
    debtAmount: "",
    startYear: new Date().getFullYear(),
    endYear: getRetirementYear(),
    interestRate: "5.0", // 이자율 5%
    gracePeriod: 0, // 거치기간 (년)
    memo: "",
  });

  const [errors, setErrors] = useState({});

  // 수정 모드일 때 데이터 로드, 모달이 열릴 때마다 초기화
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          title: editData.title || "",
          debtType: editData.debtType || "bullet",
          debtAmount: editData.debtAmount || "",
          startYear: parseInt(editData.startYear) || new Date().getFullYear(),
          endYear: parseInt(editData.endYear) || getRetirementYear(),
          interestRate: editData.interestRate
            ? (editData.interestRate * 100).toString()
            : "5.0",
          gracePeriod: parseInt(editData.gracePeriod) || 0,
          memo: editData.memo || "",
        });
      } else {
        // 새 데이터일 때 초기화
        setFormData({
          title: "",
          debtType: "bullet",
          debtAmount: "",
          startYear: new Date().getFullYear(),
          endYear: getRetirementYear(),
          interestRate: "5.0",
          gracePeriod: 0,
          memo: "",
        });
      }
    }
  }, [isOpen, editData]);

  // 폼 유효성 검사
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "부채 항목명을 입력해주세요.";
    }

    if (!formData.debtAmount || formData.debtAmount < 0) {
      newErrors.debtAmount = "대출 금액을 입력해주세요.";
    }

    if (formData.startYear > formData.endYear) {
      newErrors.endYear = "종료년도는 시작년도보다 늦어야 합니다.";
    }

    const interestRateNum = parseFloat(formData.interestRate);
    if (
      isNaN(interestRateNum) ||
      interestRateNum < 0 ||
      interestRateNum > 100
    ) {
      newErrors.interestRate = "이자율은 0-100% 사이의 유효한 숫자여야 합니다.";
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

    const debtData = {
      ...formData,
      debtAmount: parseInt(formData.debtAmount),
      startYear: parseInt(formData.startYear),
      endYear: parseInt(formData.endYear),
      interestRate: parseFloat(formData.interestRate) / 100, // 백분율을 소수로 변환
      gracePeriod: parseInt(formData.gracePeriod),
    };

    onSave(debtData);
    onClose();
  };

  // 모달 닫기 핸들러
  const handleClose = () => {
    setFormData({
      title: "",
      debtType: "bullet",
      debtAmount: "",
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear() + 5,
      interestRate: "5.0",
      gracePeriod: 0,
      memo: "",
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
            {editData ? "부채 수정" : "부채 추가"}
          </h2>
          <button className={styles.closeButton} onClick={handleClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* 부채 항목명 */}
          <div className={styles.field}>
            <label htmlFor="title" className={styles.label}>
              부채 항목명 *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className={`${styles.input} ${errors.title ? styles.error : ""}`}
              placeholder="예: 주택담보대출, 자동차 할부, 신용대출"
            />
            {errors.title && (
              <span className={styles.errorText}>{errors.title}</span>
            )}
          </div>

          {/* 상환 방식 */}
          <div className={styles.field}>
            <label htmlFor="debtType" className={styles.label}>
              상환 방식 *
            </label>
            <select
              id="debtType"
              value={formData.debtType}
              onChange={(e) =>
                setFormData({ ...formData, debtType: e.target.value })
              }
              className={styles.select}
            >
              <option value="bullet">만기일시상환</option>
              <option value="equal">원리금균등상환</option>
              <option value="principal">원금균등상환</option>
              <option value="grace">거치식상환</option>
            </select>
            <div className={styles.helpText}>
              {formData.debtType === "bullet" ? (
                <span>매달 이자만 납부하고 만기일에 원금을 한꺼번에 상환</span>
              ) : formData.debtType === "equal" ? (
                <span>매달 원금과 이자를 합친 동일한 금액을 상환</span>
              ) : formData.debtType === "principal" ? (
                <span>
                  매달 같은 금액의 원금을 상환하며, 남은 원금에 대한 이자가 점점
                  줄어듦
                </span>
              ) : (
                <span>일정 기간 동안 이자만 내다가, 이후 본격 상환 시작</span>
              )}
            </div>
          </div>

          {/* 대출 금액과 이자율 */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="debtAmount" className={styles.label}>
                대출 금액 (만원) *
              </label>
              <input
                type="text"
                id="debtAmount"
                value={formData.debtAmount}
                onChange={(e) =>
                  setFormData({ ...formData, debtAmount: e.target.value })
                }
                onKeyPress={handleKeyPress}
                className={`${styles.input} ${
                  errors.debtAmount ? styles.error : ""
                }`}
                placeholder="예: 30000"
              />
              {errors.debtAmount && (
                <span className={styles.errorText}>{errors.debtAmount}</span>
              )}
            </div>

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
                className={`${styles.input} ${
                  errors.interestRate ? styles.error : ""
                }`}
                placeholder="5.0"
              />
              {errors.interestRate && (
                <span className={styles.errorText}>{errors.interestRate}</span>
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
                placeholder="2030"
              />
              {errors.endYear && (
                <span className={styles.errorText}>{errors.endYear}</span>
              )}
            </div>
          </div>

          {/* 거치기간 (거치식상환일 때만 표시) */}
          {formData.debtType === "grace" && (
            <div className={styles.field}>
              <label htmlFor="gracePeriod" className={styles.label}>
                거치기간 (년) *
              </label>
              <input
                type="number"
                id="gracePeriod"
                value={formData.gracePeriod}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  setFormData({ ...formData, gracePeriod: value });
                }}
                className={styles.input}
                min="0"
                max="10"
                placeholder="0"
              />
              <div className={styles.helpText}>
                <span>이자만 납부하는 기간 (년 단위)</span>
              </div>
            </div>
          )}

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

export default DebtModal;
