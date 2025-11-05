import React, { useState, useEffect } from "react";
import { calculateKoreanAge, getKoreanAgeInYear } from "../../utils/koreanAge";
import {
  profileService,
  incomeService,
  savingsService,
  expenseService,
  pensionService,
} from "../../services/firestoreService";
import { formatAmountForChart } from "../../utils/format";
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
    targetAssets: "",
    currentCash: "",
    hasSpouse: false,
    spouseName: "",
    spouseBirthYear: "",
    spouseIsWorking: false, // 배우자 근로 여부
    spouseCurrentSalary: "", // 배우자 현재 급여
    spouseRetirementAge: "", // 배우자 은퇴 예상 나이
    familyMembers: [],
  });

  // 가구 구성원 관리 상태
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberBirthYear, setNewMemberBirthYear] = useState("");
  const [newMemberRelation, setNewMemberRelation] = useState("자녀");

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 모달이 열릴 때 프로필 데이터 로드
  useEffect(() => {
    if (isOpen && profileData) {
      console.log("프로필 데이터 로드:", profileData); // 디버깅용
      setFormData({
        name: profileData.name || "",
        birthYear: profileData.birthYear || "",
        retirementAge: profileData.retirementAge || 55,
        targetAssets: profileData.targetAssets || "",
        currentCash: profileData.currentCash || "",
        hasSpouse: profileData.hasSpouse || false,
        spouseName: profileData.spouseName || "",
        spouseBirthYear: profileData.spouseBirthYear || "",
        spouseIsWorking: Boolean(profileData.spouseIsWorking), // 배우자 근로 여부
        spouseCurrentSalary: profileData.spouseCurrentSalary || 0, // 배우자 현재 급여
        spouseRetirementAge: profileData.spouseRetirementAge || "", // 배우자 은퇴 예상 나이
        familyMembers: profileData.familyMembers || [],
      });
    }
  }, [isOpen, profileData]);

  // ESC 키로 모달 닫기 + body 스크롤 막기
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // 모달이 열릴 때 body 스크롤 막기
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      // 모달이 닫힐 때 body 스크롤 복원
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // 폼 검증
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "이름을 입력해주세요.";
    }

    if (
      !formData.birthYear ||
      formData.birthYear < 1900 ||
      formData.birthYear > new Date().getFullYear()
    ) {
      newErrors.birthYear = "올바른 출생년도를 입력해주세요.";
    }

    const retirementAgeNum =
      typeof formData.retirementAge === "string" &&
      formData.retirementAge === ""
        ? null
        : parseInt(formData.retirementAge, 10);
    if (!retirementAgeNum || retirementAgeNum < 30 || retirementAgeNum > 80) {
      newErrors.retirementAge = "은퇴 나이는 30-80세 사이여야 합니다.";
    }

    if (formData.targetAssets && formData.targetAssets < 0) {
      newErrors.targetAssets = "목표 자산은 0 이상이어야 합니다.";
    }

    if (formData.currentCash && formData.currentCash < 0) {
      newErrors.currentCash = "현재 현금은 0 이상이어야 합니다.";
    }

    // 배우자가 있는 경우 검증
    if (formData.hasSpouse) {
      if (!formData.spouseName.trim()) {
        newErrors.spouseName = "배우자 이름을 입력해주세요.";
      }
      if (
        !formData.spouseBirthYear ||
        formData.spouseBirthYear < 1900 ||
        formData.spouseBirthYear > new Date().getFullYear()
      ) {
        newErrors.spouseBirthYear = "올바른 배우자 출생년도를 입력해주세요.";
      }

      // 배우자 근로 정보 검증
      if (formData.spouseIsWorking) {
        if (
          !formData.spouseRetirementAge ||
          formData.spouseRetirementAge < 30 ||
          formData.spouseRetirementAge > 80
        ) {
          newErrors.spouseRetirementAge =
            "배우자 은퇴 예상 나이는 30세에서 80세 사이여야 합니다.";
        }
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

  // 가구 구성원 추가
  const handleAddFamilyMember = () => {
    if (!newMemberName.trim() || !newMemberBirthYear) {
      alert("이름과 출생년도를 모두 입력해주세요.");
      return;
    }

    const newMember = {
      id: Date.now(), // 임시 ID
      name: newMemberName.trim(),
      birthYear: parseInt(newMemberBirthYear),
      relation: newMemberRelation,
    };

    setFormData({
      ...formData,
      familyMembers: [...formData.familyMembers, newMember],
    });

    // 입력 필드 초기화
    setNewMemberName("");
    setNewMemberBirthYear("");
    setNewMemberRelation("자녀");
  };

  // 가구 구성원 삭제
  const handleRemoveFamilyMember = (memberId) => {
    setFormData({
      ...formData,
      familyMembers: formData.familyMembers.filter(
        (member) => member.id !== memberId
      ),
    });
  };

  // 은퇴년도 계산 함수
  const getRetirementYear = (birthYear, retirementAge) => {
    const currentYear = new Date().getFullYear();
    if (birthYear && retirementAge) {
      const birth = parseInt(birthYear, 10);
      const retireAge = parseInt(retirementAge, 10);
      if (Number.isFinite(birth) && Number.isFinite(retireAge)) {
        const currentAge = calculateKoreanAge(birth, currentYear);
        const yearsToRetire = retireAge - currentAge;
        return (
          currentYear + (Number.isFinite(yearsToRetire) ? yearsToRetire : 0)
        );
      }
    }
    return currentYear + 10;
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
        retirementAge:
          typeof formData.retirementAge === "string" &&
          formData.retirementAge === ""
            ? 55
            : parseInt(formData.retirementAge, 10) || 55,
        currentCash: parseInt(formData.currentCash) || 0,
        targetAssets: parseInt(formData.targetAssets) || 0,
        currentKoreanAge: calculateKoreanAge(formData.birthYear),
        spouseKoreanAge: formData.hasSpouse
          ? calculateKoreanAge(formData.spouseBirthYear)
          : null,
        spouseIsWorking: formData.hasSpouse ? formData.spouseIsWorking : false,
        spouseRetirementAge:
          formData.hasSpouse && formData.spouseIsWorking
            ? parseInt(formData.spouseRetirementAge) || 0
            : 0,
        updatedAt: new Date().toISOString(),
      };

      // 은퇴년도 또는 출생년도가 변경되었는지 확인
      const retirementAgeNum =
        typeof formData.retirementAge === "string" &&
        formData.retirementAge === ""
          ? 55
          : parseInt(formData.retirementAge, 10) || 55;
      const retirementAgeChanged =
        profileData.retirementAge !== retirementAgeNum;
      const birthYearChanged = profileData.birthYear !== formData.birthYear;

      // 프로필 업데이트
      await profileService.updateProfile(
        profileData.id || profileData.docId,
        updatedProfile
      );

      // 은퇴년도가 변경된 경우, 고정된 소득/저축/지출/연금 항목들의 endYear 업데이트
      if (retirementAgeChanged || birthYearChanged) {
        try {
          const retirementAgeForCalc =
            typeof formData.retirementAge === "string" &&
            formData.retirementAge === ""
              ? profileData.retirementAge || 55
              : parseInt(formData.retirementAge, 10) ||
                profileData.retirementAge ||
                55;
          const newRetirementYear = getRetirementYear(
            formData.birthYear,
            retirementAgeForCalc
          );

          // 소득, 저축, 지출, 연금 항목을 병렬로 업데이트
          const [incomeCount, savingCount, expenseCount, pensionCount] =
            await Promise.all([
              incomeService.updateFixedIncomesEndYear(
                profileData.id || profileData.docId,
                newRetirementYear
              ),
              savingsService.updateFixedSavingsEndYear(
                profileData.id || profileData.docId,
                newRetirementYear
              ),
              expenseService.updateFixedExpensesEndYear(
                profileData.id || profileData.docId,
                newRetirementYear
              ),
              pensionService.updateFixedPensionsEndYear(
                profileData.id || profileData.docId,
                newRetirementYear
              ),
            ]);

          const totalUpdated =
            incomeCount + savingCount + expenseCount + pensionCount;
          if (totalUpdated > 0) {
            console.log(
              `${totalUpdated}개의 고정된 항목이 자동으로 업데이트되었습니다. (소득: ${incomeCount}, 저축: ${savingCount}, 지출: ${expenseCount}, 연금: ${pensionCount})`
            );
          }
        } catch (error) {
          console.error("고정된 항목 업데이트 오류:", error);
          // 항목 업데이트 실패해도 프로필 업데이트는 성공으로 처리
        }
      }

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
      targetAssets: "",
      currentCash: "",
      hasSpouse: false,
      spouseName: "",
      spouseBirthYear: "",
      familyMembers: [],
    });
    setNewMemberName("");
    setNewMemberBirthYear("");
    setNewMemberRelation("자녀");
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

        <form
          onSubmit={handleSubmit}
          className={styles.form}
          id="profile-edit-modal-form"
        >
          {/* 2열(양쪽)에 배치되는 기본정보 필드 - 이름, 출생년도, 은퇴 나이, 현금, 목표자산, 배우자 관련 */}
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
              className={`${styles.input} ${
                errors.birthYear ? styles.error : ""
              }`}
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
              onChange={(e) => {
                const value = e.target.value;
                // 빈 문자열 허용, 숫자만 허용
                if (value === "" || /^\d+$/.test(value)) {
                  setFormData({
                    ...formData,
                    retirementAge: value === "" ? "" : parseInt(value, 10),
                  });
                }
              }}
              onKeyPress={handleKeyPress}
              className={`${styles.input} ${
                errors.retirementAge ? styles.error : ""
              }`}
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
              className={`${styles.input} ${
                errors.currentCash ? styles.error : ""
              }`}
              placeholder="예: 1000"
            />
            {formData.currentCash && !isNaN(parseInt(formData.currentCash)) && (
              <div className={styles.amountPreview}>
                {formatAmountForChart(parseInt(formData.currentCash))}
              </div>
            )}
            {errors.currentCash && (
              <span className={styles.errorText}>{errors.currentCash}</span>
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
              className={`${styles.input} ${
                errors.targetAssets ? styles.error : ""
              }`}
              placeholder="예: 10000"
            />
            {formData.targetAssets &&
              !isNaN(parseInt(formData.targetAssets)) && (
                <div className={styles.amountPreview}>
                  {formatAmountForChart(parseInt(formData.targetAssets))}
                </div>
              )}
            {errors.targetAssets && (
              <span className={styles.errorText}>{errors.targetAssets}</span>
            )}
          </div>

          {/* 배우자 여부 체크 - 필드 쪽에 2열 채우기 */}
          <div className={styles.field} style={{ alignSelf: "flex-end" }}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.hasSpouse}
                onChange={(e) => {
                  const hasSpouse = e.target.checked;
                  setFormData({
                    ...formData,
                    hasSpouse,
                    spouseName: hasSpouse ? formData.spouseName : "",
                    spouseBirthYear: hasSpouse ? formData.spouseBirthYear : "",
                  });
                }}
                className={styles.checkbox}
              />
              배우자가 있습니다
            </label>
          </div>

          {/* 배우자 정보 입력란 - 2열 중 하나에 배치 */}
          {formData.hasSpouse && (
            <>
              <div className={styles.field}>
                <label className={styles.label}>배우자 이름 *</label>
                <input
                  type="text"
                  value={formData.spouseName}
                  onChange={(e) =>
                    setFormData({ ...formData, spouseName: e.target.value })
                  }
                  className={`${styles.input} ${
                    errors.spouseName ? styles.error : ""
                  }`}
                  placeholder="배우자 이름을 입력하세요"
                />
                {errors.spouseName && (
                  <span className={styles.errorText}>{errors.spouseName}</span>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>배우자 출생년도 *</label>
                <input
                  type="text"
                  value={formData.spouseBirthYear}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      spouseBirthYear: e.target.value,
                    })
                  }
                  onKeyPress={handleKeyPress}
                  className={`${styles.input} ${
                    errors.spouseBirthYear ? styles.error : ""
                  }`}
                  placeholder="예: 1992"
                />
                {errors.spouseBirthYear && (
                  <span className={styles.errorText}>
                    {errors.spouseBirthYear}
                  </span>
                )}
              </div>
            </>
          )}

          {/* 배우자 근로 정보 */}
          {formData.hasSpouse && (
            <>
              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.spouseIsWorking}
                    onChange={(e) => {
                      const isWorking = e.target.checked;
                      setFormData({
                        ...formData,
                        spouseIsWorking: isWorking,
                        spouseRetirementAge: isWorking
                          ? formData.spouseRetirementAge
                          : "",
                      });
                    }}
                    className={styles.checkbox}
                  />
                  배우자가 현재 일하고 있습니다
                </label>
              </div>

              {formData.spouseIsWorking && (
                <div className={styles.field}>
                  <label className={styles.label}>
                    배우자 은퇴 예상 나이 (만 나이) *
                  </label>
                  <input
                    type="text"
                    value={formData.spouseRetirementAge}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        spouseRetirementAge: e.target.value,
                      })
                    }
                    onKeyPress={handleKeyPress}
                    className={`${styles.input} ${
                      errors.spouseRetirementAge ? styles.error : ""
                    }`}
                    placeholder="예: 60"
                  />
                  {errors.spouseRetirementAge && (
                    <span className={styles.errorText}>
                      {errors.spouseRetirementAge}
                    </span>
                  )}
                </div>
              )}
            </>
          )}

          {/* 가구 구성원부터는 한 줄(1컬럼)로 쭉 - familyRowFull 적용 */}
          <div className={styles.familyRowFull}>
            <label className={styles.label}>가구 구성원</label>
            <div className={styles.familyMembersSection}>
              {/* 기존 가구 구성원 목록 */}
              {formData.familyMembers.length > 0 && (
                <div className={styles.familyMembersList}>
                  {formData.familyMembers.map((member) => (
                    <div key={member.id} className={styles.familyMemberItem}>
                      <div className={styles.memberInfo}>
                        <span className={styles.memberName}>{member.name}</span>
                        <span className={styles.memberDetails}>
                          ({member.relationship || member.relation},{" "}
                          {member.birthYear}년생, 현재{" "}
                          {calculateKoreanAge(member.birthYear)}세)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFamilyMember(member.id)}
                        className={styles.removeMemberButton}
                        title="삭제"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* 새 가구 구성원 추가 */}
              <div className={styles.addMemberSection}>
                <div className={styles.addMemberInputs}>
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className={styles.input}
                    placeholder="이름"
                  />
                  <input
                    type="text"
                    value={newMemberBirthYear}
                    onChange={(e) => setNewMemberBirthYear(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className={styles.input}
                    placeholder="출생년도"
                  />
                  <select
                    value={newMemberRelation}
                    onChange={(e) => setNewMemberRelation(e.target.value)}
                    className={styles.select}
                  >
                    <option value="자녀">자녀</option>
                    <option value="부모">부모</option>
                    <option value="형제자매">형제자매</option>
                    <option value="기타">기타</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddFamilyMember}
                    className={styles.addMemberButton}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* 버튼을 모달 바닥 고정 레이어로 분리 */}
        <div className={styles.fixedButtonGroup}>
          <button
            type="button"
            onClick={handleClose}
            className={styles.cancelButton}
          >
            취소
          </button>
          <button
            type="submit"
            form="profile-edit-modal-form"
            disabled={isSubmitting}
            className={styles.submitButton}
          >
            {isSubmitting ? "수정 중..." : "수정"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileEditModal;
