// 프로필 추가 모달 컴포넌트
import React, { useState } from "react";
import { calculateAge, getTodayString, isValidDate } from "../utils/date.js";
import styles from "./AddProfileModal.module.css";

export default function AddProfileModal({
  isOpen,
  onClose,
  onAdd,
  editingProfile = null,
  isEdit = false,
}) {
  const [formData, setFormData] = useState({
    name: "",
    birthDate: "",
    retirementAge: 55,
    retirementGoal: 0,
    goalDescription: "",
    hasSpouse: false,
    householdSize: 1,
    householdMembers: [],
  });

  // 수정 모드일 때 기존 데이터로 폼 초기화
  React.useEffect(() => {
    if (isEdit && editingProfile) {
      const familyMembers =
        editingProfile.householdMembers?.filter((member) => !member.isSpouse) ||
        [];
      const hasSpouse =
        editingProfile.householdMembers?.some((member) => member.isSpouse) ||
        false;

      setFormData({
        name: editingProfile.name || "",
        birthDate: editingProfile.birthDate || "",
        retirementAge: editingProfile.retirementAge || 55,
        retirementGoal: editingProfile.retirementGoal || 0,
        goalDescription: editingProfile.goalDescription || "",
        hasSpouse: hasSpouse,
        householdSize: editingProfile.householdSize || 1,
        householdMembers: familyMembers,
      });
    } else {
      // 새 프로필 모드일 때 기본값으로 초기화
      setFormData({
        name: "",
        birthDate: "",
        retirementAge: 55,
        retirementGoal: 0,
        goalDescription: "",
        hasSpouse: false,
        householdSize: 1,
        householdMembers: [],
      });
    }
  }, [isEdit, editingProfile]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 폼 데이터 변경 핸들러
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // 가계 구성원 수는 자동 계산되므로 변경 불가
    if (name === "householdSize") {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // 해당 필드의 오류 제거
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // 가계 구성원 추가
  const addHouseholdMember = () => {
    const newId =
      Math.max(0, ...formData.householdMembers.map((m) => m.id)) + 1;
    setFormData((prev) => {
      const newMembers = [
        ...prev.householdMembers,
        {
          id: newId,
          name: "",
          relationship: "자녀",
          birthDate: "",
          isSpouse: false,
        },
      ];
      return {
        ...prev,
        householdMembers: newMembers,
        householdSize: 1 + newMembers.length, // 본인 + 가족 구성원
      };
    });
  };

  // 가계 구성원 삭제
  const removeHouseholdMember = (id) => {
    if (formData.householdMembers.length <= 0) return;

    setFormData((prev) => {
      const newMembers = prev.householdMembers.filter(
        (member) => member.id !== id
      );
      return {
        ...prev,
        householdMembers: newMembers,
        householdSize: 1 + newMembers.length, // 본인 + 가족 구성원
      };
    });
  };

  // 가계 구성원 정보 변경
  const handleMemberChange = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      householdMembers: prev.householdMembers.map((member) =>
        member.id === id ? { ...member, [field]: value } : member
      ),
    }));
  };

  // 배우자 유무 변경 시 처리
  const handleSpouseChange = (checked) => {
    setFormData((prev) => {
      const newMembers = [...prev.householdMembers];

      if (checked) {
        // 배우자 추가
        const spouseId = Math.max(0, ...newMembers.map((m) => m.id)) + 1;
        newMembers.push({
          id: spouseId,
          name: "",
          relationship: "배우자",
          birthDate: "",
          isSpouse: true,
        });
      } else {
        // 배우자 제거
        const filteredMembers = newMembers.filter((member) => !member.isSpouse);
        newMembers.splice(0, newMembers.length, ...filteredMembers);
      }

      // 가계 구성원 수 자동 계산 (본인 + 가족 구성원)
      const totalSize = 1 + newMembers.length;

      return {
        ...prev,
        hasSpouse: checked,
        householdMembers: newMembers,
        householdSize: totalSize,
      };
    });
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

    // 은퇴 목표 금액 검증
    if (formData.retirementGoal && formData.retirementGoal < 0) {
      newErrors.retirementGoal = "은퇴 목표 금액은 0만원 이상이어야 합니다.";
    }

    // 가계 구성원 검증
    formData.householdMembers.forEach((member, index) => {
      if (!member.name.trim()) {
        newErrors[
          `member_${member.id}_name`
        ] = `${member.relationship}의 이름을 입력해주세요.`;
      }

      if (!member.birthDate) {
        newErrors[
          `member_${member.id}_birthDate`
        ] = `${member.relationship}의 생년월일을 선택해주세요.`;
      } else if (!isValidDate(member.birthDate)) {
        newErrors[`member_${member.id}_birthDate`] =
          "올바른 날짜 형식이 아닙니다.";
      } else {
        const age = calculateAge(member.birthDate);
        if (age < 0) {
          newErrors[`member_${member.id}_birthDate`] =
            "미래 날짜는 선택할 수 없습니다.";
        } else if (age > 120) {
          newErrors[`member_${member.id}_birthDate`] = "나이가 너무 많습니다.";
        }
      }
    });

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
      // 본인 정보를 가계 구성원에 자동 추가
      const profileData = {
        ...formData,
        householdMembers: [
          {
            id: 1,
            name: formData.name,
            relationship: "본인",
            birthDate: formData.birthDate,
            isSpouse: false,
          },
          ...formData.householdMembers,
        ],
      };

      await onAdd(profileData);
      // 성공 시 폼 초기화
      setFormData({
        name: "",
        birthDate: "",
        retirementAge: 55,
        retirementGoal: 0,
        goalDescription: "",
        hasSpouse: false,
        householdSize: 1,
        householdMembers: [],
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
        retirementAge: 55,
        retirementGoal: 0,
        goalDescription: "",
        hasSpouse: false,
        householdSize: 1,
        householdMembers: [],
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
          <h2 className={styles.title}>
            {isEdit ? "프로필 수정" : "새 프로필 추가"}
          </h2>
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
              placeholder="55"
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

          <div className={styles.field}>
            <label htmlFor="retirementGoal" className={styles.label}>
              은퇴 목표 금액 (만원)
            </label>
            <input
              type="number"
              id="retirementGoal"
              name="retirementGoal"
              value={formData.retirementGoal}
              onChange={handleChange}
              min="0"
              step="100"
              className={`${styles.input} ${
                errors.retirementGoal ? styles.inputError : ""
              }`}
              placeholder="예: 50000 (5억원)"
              disabled={isSubmitting}
            />
            {formData.retirementGoal > 0 && (
              <div className={styles.calculatedAge}>
                목표 금액:{" "}
                <strong>
                  {new Intl.NumberFormat("ko-KR").format(
                    formData.retirementGoal
                  )}
                  만원
                </strong>
              </div>
            )}
            {errors.retirementGoal && (
              <span className={styles.errorText}>{errors.retirementGoal}</span>
            )}
          </div>


          <div className={styles.field}>
            <label htmlFor="goalDescription" className={styles.label}>
              목표 설명
            </label>
            <textarea
              id="goalDescription"
              name="goalDescription"
              value={formData.goalDescription}
              onChange={handleChange}
              className={styles.input}
              rows="3"
              placeholder="예: 안정적인 은퇴 생활을 위한 목표, 여행 자금 등"
              disabled={isSubmitting}
            />
            <span className={styles.helpText}>
              은퇴 목표에 대한 간단한 설명을 작성해주세요. (선택사항)
            </span>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              <input
                type="checkbox"
                name="hasSpouse"
                checked={formData.hasSpouse}
                onChange={(e) => handleSpouseChange(e.target.checked)}
                disabled={isSubmitting}
                className={styles.checkbox}
              />
              배우자 있음
            </label>
          </div>

          <div className={styles.field}>
            <label htmlFor="householdSize" className={styles.label}>
              가계 구성원 수
            </label>
            <input
              type="number"
              id="householdSize"
              name="householdSize"
              value={formData.householdSize}
              readOnly
              className={`${styles.input} ${styles.readOnly}`}
            />
            <span className={styles.helpText}>
              본인을 포함한 총 가계 구성원 수입니다. (자동 계산)
            </span>
          </div>

          <div className={styles.householdSection}>
            <h3 className={styles.sectionTitle}>
              가족 구성원 정보 (본인 제외)
            </h3>
            {formData.householdMembers.map((member, index) => (
              <div
                key={member.id || `member-${index}`}
                className={styles.memberCard}
              >
                <div className={styles.memberHeader}>
                  <h4 className={styles.memberTitle}>{member.relationship}</h4>
                  {!member.isSpouse && formData.householdMembers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeHouseholdMember(member.id)}
                      className={styles.removeMemberButton}
                      disabled={isSubmitting}
                    >
                      삭제
                    </button>
                  )}
                </div>

                <div className={styles.memberFields}>
                  <div className={styles.memberField}>
                    <label className={styles.memberLabel}>이름 *</label>
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) =>
                        handleMemberChange(member.id, "name", e.target.value)
                      }
                      className={`${styles.memberInput} ${
                        errors[`member_${member.id}_name`]
                          ? styles.inputError
                          : ""
                      }`}
                      placeholder="이름을 입력하세요"
                      disabled={isSubmitting}
                    />
                    {errors[`member_${member.id}_name`] && (
                      <span className={styles.errorText}>
                        {errors[`member_${member.id}_name`]}
                      </span>
                    )}
                  </div>

                  <div className={styles.memberField}>
                    <label className={styles.memberLabel}>관계</label>
                    <select
                      value={member.relationship}
                      onChange={(e) =>
                        handleMemberChange(
                          member.id,
                          "relationship",
                          e.target.value
                        )
                      }
                      className={styles.memberInput}
                      disabled={isSubmitting || member.isSpouse}
                    >
                      <option value="배우자">배우자</option>
                      <option value="자녀">자녀</option>
                      <option value="부모">부모</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>

                  <div className={styles.memberField}>
                    <label className={styles.memberLabel}>생년월일 *</label>
                    <input
                      type="date"
                      value={member.birthDate}
                      onChange={(e) =>
                        handleMemberChange(
                          member.id,
                          "birthDate",
                          e.target.value
                        )
                      }
                      max={getTodayString()}
                      className={`${styles.memberInput} ${
                        errors[`member_${member.id}_birthDate`]
                          ? styles.inputError
                          : ""
                      }`}
                      disabled={isSubmitting}
                    />
                    {member.birthDate && isValidDate(member.birthDate) && (
                      <div className={styles.calculatedAge}>
                        현재 나이:{" "}
                        <strong>{calculateAge(member.birthDate)}세</strong>
                      </div>
                    )}
                    {errors[`member_${member.id}_birthDate`] && (
                      <span className={styles.errorText}>
                        {errors[`member_${member.id}_birthDate`]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addHouseholdMember}
              className={styles.addMemberButton}
              disabled={isSubmitting || formData.householdMembers.length >= 9}
            >
              + 가족 구성원 추가
            </button>
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
              {isSubmitting
                ? isEdit
                  ? "수정 중..."
                  : "추가 중..."
                : isEdit
                ? "수정"
                : "추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
