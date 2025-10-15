import React, { useState, useEffect } from "react";
import { calculateKoreanAge, getKoreanAgeInYear } from "../utils/koreanAge";
import { profileService } from "../services/firestoreService";
import styles from "./ProfileEditModal.module.css";

/**
 * 프로필 수정 모달
 * 사용자의 기본 정보를 수정할 수 있습니다.
 */
function ProfileEditModal({ isOpen, onClose, profileData, onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    birthYear: "",
    retirementAge: 55,
    retirementLivingExpenses: "",
    targetAssets: "",
    currentCash: "",
    hasSpouse: false,
    spouseName: "",
    spouseBirthYear: "",
    familyMembers: [],
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 모달이 열릴 때 프로필 데이터 로드
  useEffect(() => {
    if (isOpen && profileData) {
      setFormData({
        name: profileData.name || "",
        birthYear: profileData.birthYear || "",
        retirementAge: profileData.retirementAge || 55,
        retirementLivingExpenses: profileData.retirementLivingExpenses || "",
        targetAssets: profileData.targetAssets || "",
        currentCash: profileData.currentCash || "",
        hasSpouse: profileData.hasSpouse || false,
        spouseName: profileData.spouseName || "",
        spouseBirthYear: profileData.spouseBirthYear || "",
        familyMembers: profileData.familyMembers || [],
      });
    }
  }, [isOpen, profileData]);

  // 폼 검증
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "이름을 입력해주세요.";
    }

    if (!formData.birthYear || formData.birthYear < 1900 || formData.birthYear > new Date().getFullYear()) {
      newErrors.birthYear = "올바른 출생년도를 입력해주세요.";
    }

    if (formData.retirementAge < 30 || formData.retirementAge > 80) {
      newErrors.retirementAge = "은퇴 나이는 30-80세 사이여야 합니다.";
    }

    if (formData.retirementLivingExpenses && formData.retirementLivingExpenses < 0) {
      newErrors.retirementLivingExpenses = "은퇴 후 생활비는 0 이상이어야 합니다.";
    }

    if (formData.targetAssets && formData.targetAssets < 0) {
      newErrors.targetAssets = "목표 자산은 0 이상이어야 합니다.";
    }

    if (formData.currentCash && formData.currentCash < 0) {
      newErrors.currentCash = "현재 현금은 0 이상이어야 합니다.";
    }

    if (formData.hasSpouse) {
      if (!formData.spouseName.trim()) {
        newErrors.spouseName = "배우자 이름을 입력해주세요.";
      }
      if (!formData.spouseBirthYear || formData.spouseBirthYear < 1900 || formData.spouseBirthYear > new Date().getFullYear()) {
        newErrors.spouseBirthYear = "올바른 배우자 출생년도를 입력해주세요.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 숫자만 입력 허용
  const handleKeyPress = (e) => {
    if (
      !/[0-9]/.test(e.key) &&
      !["Backspace", "Delete", "Tab", "Enter"].includes(e.key)
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

    setIsSubmitting(true);

    try {
      const updatedProfile = {
        ...profileData,
        ...formData,
        currentKoreanAge: calculateKoreanAge(formData.birthYear),
        spouseKoreanAge: formData.hasSpouse ? calculateKoreanAge(formData.spouseBirthYear) : null,
        updatedAt: new Date().toISOString(),
      };

      await profileService.updateProfile(profileData.id || profileData.docId, updatedProfile);
      onSave(updatedProfile);
      onClose();
    } catch (error) {
      console.error("프로필 수정 오류:", error);
      alert("프로필 수정 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 모달 닫기
  const handleClose = () => {
    setFormData({
      name: "",
      birthYear: "",
      retirementAge: 55,
      retirementLivingExpenses: "",
      targetAssets: "",
      currentCash: "",
      hasSpouse: false,
      spouseName: "",
      spouseBirthYear: "",
      familyMembers: [],
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>프로필 수정</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>이름 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={`${styles.input} ${errors.name ? styles.error : ""}`}
              placeholder="이름을 입력하세요"
            />
            {errors.name && (
              <span className={styles.errorText}>{errors.name}</span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>출생년도 *</label>
            <input
              type="text"
              value={formData.birthYear}
              onChange={(e) =>
                setFormData({ ...formData, birthYear: e.target.value })
              }
              onKeyPress={handleKeyPress}
              className={`${styles.input} ${errors.birthYear ? styles.error : ""}`}
              placeholder="예: 1990"
            />
            {errors.birthYear && (
              <span className={styles.errorText}>{errors.birthYear}</span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>은퇴 나이 *</label>
            <input
              type="text"
              value={formData.retirementAge}
              onChange={(e) =>
                setFormData({ ...formData, retirementAge: parseInt(e.target.value) || 55 })
              }
              onKeyPress={handleKeyPress}
              className={`${styles.input} ${errors.retirementAge ? styles.error : ""}`}
              placeholder="55"
            />
            {errors.retirementAge && (
              <span className={styles.errorText}>{errors.retirementAge}</span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>현재 현금 (만원)</label>
            <input
              type="text"
              value={formData.currentCash}
              onChange={(e) =>
                setFormData({ ...formData, currentCash: e.target.value })
              }
              onKeyPress={handleKeyPress}
              className={`${styles.input} ${errors.currentCash ? styles.error : ""}`}
              placeholder="예: 1000"
            />
            {errors.currentCash && (
              <span className={styles.errorText}>{errors.currentCash}</span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>은퇴 후 생활비 (만원/월)</label>
            <input
              type="text"
              value={formData.retirementLivingExpenses}
              onChange={(e) =>
                setFormData({ ...formData, retirementLivingExpenses: e.target.value })
              }
              onKeyPress={handleKeyPress}
              className={`${styles.input} ${errors.retirementLivingExpenses ? styles.error : ""}`}
              placeholder="예: 200"
            />
            {errors.retirementLivingExpenses && (
              <span className={styles.errorText}>{errors.retirementLivingExpenses}</span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>목표 자산 (만원)</label>
            <input
              type="text"
              value={formData.targetAssets}
              onChange={(e) =>
                setFormData({ ...formData, targetAssets: e.target.value })
              }
              onKeyPress={handleKeyPress}
              className={`${styles.input} ${errors.targetAssets ? styles.error : ""}`}
              placeholder="예: 10000"
            />
            {errors.targetAssets && (
              <span className={styles.errorText}>{errors.targetAssets}</span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.hasSpouse}
                onChange={(e) =>
                  setFormData({ ...formData, hasSpouse: e.target.checked })
                }
                className={styles.checkbox}
              />
              배우자가 있습니다
            </label>
          </div>

          {formData.hasSpouse && (
            <>
              <div className={styles.field}>
                <label className={styles.label}>배우자 이름</label>
                <input
                  type="text"
                  value={formData.spouseName}
                  onChange={(e) =>
                    setFormData({ ...formData, spouseName: e.target.value })
                  }
                  className={`${styles.input} ${errors.spouseName ? styles.error : ""}`}
                  placeholder="배우자 이름을 입력하세요"
                />
                {errors.spouseName && (
                  <span className={styles.errorText}>{errors.spouseName}</span>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>배우자 출생년도</label>
                <input
                  type="text"
                  value={formData.spouseBirthYear}
                  onChange={(e) =>
                    setFormData({ ...formData, spouseBirthYear: e.target.value })
                  }
                  onKeyPress={handleKeyPress}
                  className={`${styles.input} ${errors.spouseBirthYear ? styles.error : ""}`}
                  placeholder="예: 1992"
                />
                {errors.spouseBirthYear && (
                  <span className={styles.errorText}>{errors.spouseBirthYear}</span>
                )}
              </div>
            </>
          )}

          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={handleClose}
              className={styles.cancelButton}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={styles.submitButton}
            >
              {isSubmitting ? "수정 중..." : "수정"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfileEditModal;
