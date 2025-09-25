// 프로필 추가 모달 컴포넌트
import React, { useState } from "react";
import { calculateAge, getTodayString, isValidDate } from "../utils/date.js";
import styles from "./AddProfileModal.module.css";

export default function AddProfileModal({ isOpen, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    name: "",
    birthDate: "",
    retirementAge: 65,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    // 이름 검증
    if (!formData.name.trim()) {
      newErrors.name = "이름을 입력해주세요.";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "이름은 2글자 이상이어야 합니다.";
    }

    // 생년월일 검증
    if (!formData.birthDate) {
      newErrors.birthDate = "생년월일을 선택해주세요.";
    } else if (!isValidDate(formData.birthDate)) {
      newErrors.birthDate = "올바른 날짜 형식이 아닙니다.";
    } else {
      const age = calculateAge(formData.birthDate);
      if (age < 0) {
        newErrors.birthDate = "미래 날짜는 선택할 수 없습니다.";
      } else if (age > 120) {
        newErrors.birthDate = "나이가 너무 많습니다.";
      }
    }

    // 은퇴 나이 검증
    if (!formData.retirementAge) {
      newErrors.retirementAge = "희망 은퇴 나이를 입력해주세요.";
    } else if (formData.retirementAge < 40) {
      newErrors.retirementAge = "은퇴 나이는 40세 이상이어야 합니다.";
    } else if (formData.retirementAge > 100) {
      newErrors.retirementAge = "은퇴 나이는 100세 이하여야 합니다.";
    } else if (formData.birthDate) {
      const currentAge = calculateAge(formData.birthDate);
      if (formData.retirementAge <= currentAge) {
        newErrors.retirementAge = "은퇴 나이는 현재 나이보다 커야 합니다.";
      }
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
      await onAdd(formData);
      // 성공 시 폼 초기화
      setFormData({
        name: "",
        birthDate: "",
        retirementAge: 65,
      });
      setErrors({});
    } catch (error) {
      console.error("프로필 추가 오류:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 모달 닫기 핸들러
  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: "",
        birthDate: "",
        retirementAge: 65,
      });
      setErrors({});
      onClose();
    }
  };

  // 현재 나이 계산
  const currentAge =
    formData.birthDate && isValidDate(formData.birthDate)
      ? calculateAge(formData.birthDate)
      : null;

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>새 프로필 추가</h2>
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
            <label htmlFor="name" className={styles.label}>
              이름 *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`${styles.input} ${
                errors.name ? styles.inputError : ""
              }`}
              placeholder="이름을 입력하세요"
              disabled={isSubmitting}
            />
            {errors.name && (
              <span className={styles.errorText}>{errors.name}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="birthDate" className={styles.label}>
              생년월일 *
            </label>
            <input
              type="date"
              id="birthDate"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              max={getTodayString()}
              className={`${styles.input} ${
                errors.birthDate ? styles.inputError : ""
              }`}
              disabled={isSubmitting}
            />
            {currentAge !== null && (
              <div className={styles.calculatedAge}>
                현재 나이: <strong>{currentAge}세</strong>
              </div>
            )}
            {errors.birthDate && (
              <span className={styles.errorText}>{errors.birthDate}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="retirementAge" className={styles.label}>
              희망 은퇴 나이 *
            </label>
            <input
              type="number"
              id="retirementAge"
              name="retirementAge"
              value={formData.retirementAge}
              onChange={handleChange}
              min="40"
              max="100"
              className={`${styles.input} ${
                errors.retirementAge ? styles.inputError : ""
              }`}
              placeholder="65"
              disabled={isSubmitting}
            />
            {currentAge !== null && formData.retirementAge && (
              <div className={styles.calculatedAge}>
                은퇴까지:{" "}
                <strong>{formData.retirementAge - currentAge}년</strong>
              </div>
            )}
            {errors.retirementAge && (
              <span className={styles.errorText}>{errors.retirementAge}</span>
            )}
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
