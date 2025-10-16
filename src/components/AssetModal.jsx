import React, { useState, useEffect } from "react";
import { formatAmount } from "../utils/format";
import styles from "./AssetModal.module.css";

/**
 * 자산 추가/수정 모달
 * 기본적인 자산 정보를 관리합니다.
 */
function AssetModal({ isOpen, onClose, onSave, editData, profileData }) {
  const [formData, setFormData] = useState({
    title: "",
    currentValue: "",
    growthRate: "",
    startYear: new Date().getFullYear(),
    endYear: "",
    memo: "",
  });

  const [errors, setErrors] = useState({});

  // 모달이 열릴 때 데이터 로드
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          title: editData.title || "",
          currentValue: editData.currentValue || "",
          growthRate: editData.growthRate || "",
          startYear: editData.startYear || new Date().getFullYear(),
          endYear: editData.endYear || "",
          memo: editData.memo || "",
        });
      } else {
        // 새 데이터인 경우 기본값 설정
        const currentYear = new Date().getFullYear();
        const deathYear = profileData ? profileData.birthYear + 90 - 1 : currentYear + 50;
        
        setFormData({
          title: "",
          currentValue: "",
          growthRate: "",
          startYear: currentYear,
          endYear: deathYear,
          memo: "",
        });
      }
    }
  }, [isOpen, editData, profileData]);

  // 폼 검증
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "자산명을 입력해주세요.";
    }

    if (!formData.currentValue || parseFloat(formData.currentValue) <= 0) {
      newErrors.currentValue = "현재 가치는 0보다 큰 값을 입력해주세요.";
    }

    if (!formData.growthRate || parseFloat(formData.growthRate) < 0) {
      newErrors.growthRate = "상승률은 0 이상이어야 합니다.";
    }

    if (!formData.endYear || parseInt(formData.endYear) <= formData.startYear) {
      newErrors.endYear = "종료 연도는 시작 연도보다 커야 합니다.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 숫자만 입력 허용
  const handleKeyPress = (e) => {
    if (
      !/[0-9]/.test(e.key) &&
      !["Backspace", "Delete", "Tab", "Enter", "."].includes(e.key)
    ) {
      e.preventDefault();
    }
  };

  // 폼 제출
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const assetData = {
      title: formData.title.trim(),
      currentValue: parseFloat(formData.currentValue),
      growthRate: parseFloat(formData.growthRate) / 100, // 백분율을 소수로 변환
      startYear: parseInt(formData.startYear),
      endYear: parseInt(formData.endYear),
      memo: formData.memo.trim(),
    };

    onSave(assetData);
  };

  // 모달 닫기
  const handleClose = () => {
    setFormData({
      title: "",
      currentValue: "",
      growthRate: "",
      startYear: new Date().getFullYear(),
      endYear: "",
      memo: "",
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{editData ? "자산 수정" : "자산 추가"}</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>자산명 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className={`${styles.input} ${errors.title ? styles.error : ""}`}
              placeholder="예: 주식, 채권, 금, 예금 등"
            />
            {errors.title && (
              <span className={styles.errorText}>{errors.title}</span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>현재 가치 (만원) *</label>
            <input
              type="text"
              value={formData.currentValue}
              onChange={(e) =>
                setFormData({ ...formData, currentValue: e.target.value })
              }
              onKeyPress={handleKeyPress}
              className={`${styles.input} ${errors.currentValue ? styles.error : ""}`}
              placeholder="예: 1000"
            />
            {errors.currentValue && (
              <span className={styles.errorText}>{errors.currentValue}</span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>연간 상승률 (%) *</label>
            <input
              type="text"
              value={formData.growthRate}
              onChange={(e) =>
                setFormData({ ...formData, growthRate: e.target.value })
              }
              onKeyPress={handleKeyPress}
              className={`${styles.input} ${errors.growthRate ? styles.error : ""}`}
              placeholder="예: 5.0"
            />
            {errors.growthRate && (
              <span className={styles.errorText}>{errors.growthRate}</span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>보유 기간 *</label>
            <div className={styles.yearInputs}>
              <input
                type="text"
                value={formData.startYear}
                onChange={(e) =>
                  setFormData({ ...formData, startYear: e.target.value })
                }
                onKeyPress={handleKeyPress}
                className={`${styles.input} ${styles.yearInput} ${errors.startYear ? styles.error : ""}`}
                placeholder="시작 연도"
              />
              <span className={styles.yearSeparator}>~</span>
              <input
                type="text"
                value={formData.endYear}
                onChange={(e) =>
                  setFormData({ ...formData, endYear: e.target.value })
                }
                onKeyPress={handleKeyPress}
                className={`${styles.input} ${styles.yearInput} ${errors.endYear ? styles.error : ""}`}
                placeholder="종료 연도"
              />
            </div>
            {(errors.startYear || errors.endYear) && (
              <span className={styles.errorText}>
                {errors.startYear || errors.endYear}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>메모</label>
            <textarea
              value={formData.memo}
              onChange={(e) =>
                setFormData({ ...formData, memo: e.target.value })
              }
              className={styles.textarea}
              placeholder="자산에 대한 추가 정보나 설명을 입력하세요"
              rows={3}
            />
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={handleClose}
              className={styles.cancelButton}
            >
              취소
            </button>
            <button type="submit" className={styles.submitButton}>
              {editData ? "수정" : "추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AssetModal;
