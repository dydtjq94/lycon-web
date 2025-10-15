import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { calculateKoreanAge, getKoreanAgeInYear } from "../utils/koreanAge";
import {
  profileService,
  incomeService,
  expenseService,
} from "../services/firestoreService";
import styles from "./ProfileCreatePage.module.css";

/**
 * 프로필 생성 페이지
 * 사용자의 기본 정보와 가구 구성원 정보를 입력받아 프로필을 생성합니다.
 */
function ProfileCreatePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    birthYear: "",
    retirementAge: 55,
    retirementLivingExpenses: "",
    targetAssets: "",
    currentCash: "", // 현재 현금 추가
    hasSpouse: false,
    spouseName: "",
    spouseBirthYear: "",
    familyMembers: [],
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 기본 수입 데이터 생성 함수
  const createDefaultIncomes = async (profileId, birthYear, retirementAge) => {
    const currentYear = new Date().getFullYear();
    const deathYear = birthYear + 90 - 1; // 90세까지
    const retirementYear = birthYear + retirementAge - 1;

    const defaultIncomes = [
      {
        title: "근로소득",
        amount: 0,
        frequency: "monthly",
        startYear: currentYear,
        endYear: retirementYear,
        growthRate: 3.0, // 임금상승률 기본값
        memo: "임금상승률 적용",
        category: "income",
      },
      {
        title: "사업소득",
        amount: 0,
        frequency: "monthly",
        startYear: currentYear,
        endYear: deathYear,
        growthRate: 2.5, // 물가상승률 기본값
        memo: "물가상승률 적용",
        category: "income",
      },
      {
        title: "임대소득",
        amount: 0,
        frequency: "monthly",
        startYear: currentYear,
        endYear: deathYear,
        growthRate: 2.5, // 물가상승률 기본값
        memo: "물가상승률 적용",
        category: "income",
      },
    ];

    // 각 기본 수입 데이터를 Firebase에 저장
    for (const income of defaultIncomes) {
      try {
        await incomeService.createIncome(profileId, income);
      } catch (error) {
        console.error(`기본 수입 데이터 생성 오류 (${income.title}):`, error);
      }
    }
  };

  // 기본 지출 데이터 생성 함수
  const createDefaultExpenses = async (
    profileId,
    birthYear,
    retirementAge,
    retirementLivingExpenses
  ) => {
    const currentYear = new Date().getFullYear();
    const deathYear = birthYear + 90 - 1; // 90세까지
    const retirementYear = birthYear + retirementAge - 1;

    const defaultExpenses = [
      {
        title: "은퇴 전 생활비",
        amount: 0, // 사용자가 입력할 수 있도록 0으로 설정
        frequency: "monthly",
        startYear: currentYear,
        endYear: retirementYear,
        growthRate: 2.5, // 물가상승률 기본값
        memo: "물가상승률 적용",
        category: "expense",
      },
      {
        title: "은퇴 후 생활비",
        amount: retirementLivingExpenses || 0, // 프로필에서 입력한 은퇴 후 생활비 사용
        frequency: "monthly",
        startYear: retirementYear + 1, // 은퇴 다음 년도부터
        endYear: deathYear,
        growthRate: 2.5, // 물가상승률 기본값
        memo: "물가상승률 적용",
        category: "expense",
      },
    ];

    // 각 기본 지출 데이터를 Firebase에 저장
    for (const expense of defaultExpenses) {
      try {
        await expenseService.createExpense(profileId, expense);
      } catch (error) {
        console.error(`기본 지출 데이터 생성 오류 (${expense.title}):`, error);
      }
    }
  };

  // 폼 입력 핸들러
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // 에러 메시지 제거
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // 배우자 정보 핸들러
  const handleSpouseChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 가구원 추가
  const addFamilyMember = () => {
    setFormData((prev) => ({
      ...prev,
      familyMembers: [
        ...prev.familyMembers,
        { name: "", birthYear: "", relationship: "기타" },
      ],
    }));
  };

  // 가구원 제거
  const removeFamilyMember = (index) => {
    setFormData((prev) => ({
      ...prev,
      familyMembers: prev.familyMembers.filter((_, i) => i !== index),
    }));
  };

  // 가구원 정보 변경
  const handleFamilyMemberChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      familyMembers: prev.familyMembers.map((member, i) =>
        i === index ? { ...member, [field]: value } : member
      ),
    }));
  };

  // 폼 유효성 검증
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "이름을 입력해주세요.";
    }

    if (!formData.birthYear) {
      newErrors.birthYear = "출생년도를 입력해주세요.";
    } else {
      const birthYear = parseInt(formData.birthYear);
      const currentYear = new Date().getFullYear();
      if (birthYear < 1900 || birthYear > currentYear) {
        newErrors.birthYear = "올바른 출생년도를 입력해주세요.";
      }
    }

    if (formData.retirementAge < 30 || formData.retirementAge > 80) {
      newErrors.retirementAge = "은퇴 나이는 30세에서 80세 사이여야 합니다.";
    }

    if (
      !formData.retirementLivingExpenses ||
      formData.retirementLivingExpenses <= 0
    ) {
      newErrors.retirementLivingExpenses =
        "은퇴 시점 예상 생활비를 입력해주세요.";
    }

    if (!formData.targetAssets || formData.targetAssets <= 0) {
      newErrors.targetAssets = "목표 자산 규모를 입력해주세요.";
    }

    // 배우자 정보 검증
    if (formData.hasSpouse) {
      if (!formData.spouseName.trim()) {
        newErrors.spouseName = "배우자 이름을 입력해주세요.";
      }
      if (!formData.spouseBirthYear) {
        newErrors.spouseBirthYear = "배우자 출생년도를 입력해주세요.";
      } else {
        const spouseBirthYear = parseInt(formData.spouseBirthYear);
        const currentYear = new Date().getFullYear();
        if (spouseBirthYear < 1900 || spouseBirthYear > currentYear) {
          newErrors.spouseBirthYear = "올바른 배우자 출생년도를 입력해주세요.";
        }
      }
    }

    // 가구원 정보 검증
    formData.familyMembers.forEach((member, index) => {
      if (member.name.trim() && !member.birthYear) {
        newErrors[`member${index}BirthYear`] =
          "가구원 출생년도를 입력해주세요.";
      }
      if (!member.name.trim() && member.birthYear) {
        newErrors[`member${index}Name`] = "가구원 이름을 입력해주세요.";
      }
      if (member.birthYear) {
        const memberBirthYear = parseInt(member.birthYear);
        const currentYear = new Date().getFullYear();
        if (memberBirthYear < 1900 || memberBirthYear > currentYear) {
          newErrors[`member${index}BirthYear`] =
            "올바른 가구원 출생년도를 입력해주세요.";
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
      const birthYear = parseInt(formData.birthYear);
      const currentYear = new Date().getFullYear();
      const currentKoreanAge = calculateKoreanAge(birthYear, currentYear);
      const retirementYear = birthYear + formData.retirementAge - 1;

      // 가구 구성원 정보 정리
      const familyMembers = [];

      if (formData.hasSpouse) {
        familyMembers.push({
          name: formData.spouseName,
          birthYear: parseInt(formData.spouseBirthYear),
          relationship: "spouse",
        });
      }

      formData.familyMembers.forEach((member) => {
        if (member.name.trim() && member.birthYear) {
          familyMembers.push({
            name: member.name,
            birthYear: parseInt(member.birthYear),
            relationship: member.relationship,
          });
        }
      });

      // 프로필 데이터 생성
      const profileData = {
        name: formData.name.trim(),
        birthYear,
        currentKoreanAge,
        retirementAge: parseInt(formData.retirementAge),
        retirementYear,
        retirementLivingExpenses: parseInt(formData.retirementLivingExpenses),
        targetAssets: parseInt(formData.targetAssets),
        currentCash: parseInt(formData.currentCash) || 0, // 현재 현금 추가
        familyMembers,
        createdAt: new Date().toISOString(),
      };

      // Firebase에 프로필 저장
      console.log("프로필 데이터 전송:", profileData);
      const createdProfile = await profileService.createProfile(profileData);
      console.log("생성된 프로필:", createdProfile);

      // 기본 수입 데이터 생성
      try {
        await createDefaultIncomes(
          createdProfile.id,
          birthYear,
          formData.retirementAge
        );
        console.log("기본 수입 데이터 생성 완료");
      } catch (error) {
        console.error("기본 수입 데이터 생성 오류:", error);
        // 기본 수입 데이터 생성 실패해도 프로필은 생성되었으므로 계속 진행
      }

      // 기본 지출 데이터 생성
      try {
        await createDefaultExpenses(
          createdProfile.id,
          birthYear,
          formData.retirementAge,
          formData.retirementLivingExpenses
        );
        console.log("기본 지출 데이터 생성 완료");
      } catch (error) {
        console.error("기본 지출 데이터 생성 오류:", error);
        // 기본 지출 데이터 생성 실패해도 프로필은 생성되었으므로 계속 진행
      }

      // 대시보드로 이동
      navigate(`/dashboard/${createdProfile.id}`);
    } catch (error) {
      console.error("프로필 생성 오류:", error);
      setErrors({
        form: error.message || "프로필 생성 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Lycon Planning</h1>
        <p className={styles.subtitle}>새로운 내담자 프로필을 생성하세요</p>
        <button className={styles.backButton} onClick={() => navigate("/")}>
          ← 목록으로 돌아가기
        </button>
      </div>

      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {errors.form && (
            <div className={styles.errorBanner}>{errors.form}</div>
          )}

          {/* 기본 정보 섹션 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>기본 정보</h3>

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
                placeholder="홍길동"
                disabled={isSubmitting}
              />
              {errors.name && (
                <span className={styles.errorText}>{errors.name}</span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="birthYear" className={styles.label}>
                출생년도 * (현재 한국 나이:{" "}
                {formData.birthYear
                  ? calculateKoreanAge(parseInt(formData.birthYear))
                  : "?"}
                세)
              </label>
              <input
                type="text"
                id="birthYear"
                name="birthYear"
                value={formData.birthYear}
                onChange={handleChange}
                className={`${styles.input} ${
                  errors.birthYear ? styles.inputError : ""
                }`}
                placeholder="1990"
                disabled={isSubmitting}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
              {errors.birthYear && (
                <span className={styles.errorText}>{errors.birthYear}</span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="retirementAge" className={styles.label}>
                은퇴 목표 연령 * (은퇴년도:{" "}
                {formData.birthYear && formData.retirementAge
                  ? parseInt(formData.birthYear) +
                    parseInt(formData.retirementAge) -
                    1
                  : "?"}
                년)
              </label>
              <input
                type="text"
                id="retirementAge"
                name="retirementAge"
                value={formData.retirementAge}
                onChange={handleChange}
                className={`${styles.input} ${
                  errors.retirementAge ? styles.inputError : ""
                }`}
                placeholder="65"
                disabled={isSubmitting}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
              {errors.retirementAge && (
                <span className={styles.errorText}>{errors.retirementAge}</span>
              )}
            </div>

            <div className={styles.field}>
              <label
                htmlFor="retirementLivingExpenses"
                className={styles.label}
              >
                은퇴 시점 예상 생활비 (만원/월) *
              </label>
              <input
                type="text"
                id="retirementLivingExpenses"
                name="retirementLivingExpenses"
                value={formData.retirementLivingExpenses}
                onChange={handleChange}
                className={`${styles.input} ${
                  errors.retirementLivingExpenses ? styles.inputError : ""
                }`}
                placeholder="300"
                disabled={isSubmitting}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
              {errors.retirementLivingExpenses && (
                <span className={styles.errorText}>
                  {errors.retirementLivingExpenses}
                </span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="targetAssets" className={styles.label}>
                은퇴 시점 목표 자산 규모 (만원) *
              </label>
              <input
                type="text"
                id="targetAssets"
                name="targetAssets"
                value={formData.targetAssets}
                onChange={handleChange}
                className={`${styles.input} ${
                  errors.targetAssets ? styles.inputError : ""
                }`}
                placeholder="50000"
                disabled={isSubmitting}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
              {errors.targetAssets && (
                <span className={styles.errorText}>{errors.targetAssets}</span>
              )}
            </div>

            {/* 현재 현금 */}
            <div className={styles.field}>
              <label htmlFor="currentCash" className={styles.label}>
                현재 현금 (만원)
              </label>
              <input
                type="text"
                id="currentCash"
                name="currentCash"
                value={formData.currentCash}
                onChange={handleChange}
                className={`${styles.input} ${
                  errors.currentCash ? styles.inputError : ""
                }`}
                placeholder="1000"
                disabled={isSubmitting}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
              {errors.currentCash && (
                <span className={styles.errorText}>{errors.currentCash}</span>
              )}
            </div>
          </div>

          {/* 가구 구성 섹션 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>가구 구성</h3>

            {/* 배우자 정보 */}
            <div className={styles.field}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="hasSpouse"
                  checked={formData.hasSpouse}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                배우자 있음
              </label>
            </div>

            {formData.hasSpouse && (
              <div className={styles.spouseSection}>
                <div className={styles.field}>
                  <label htmlFor="spouseName" className={styles.label}>
                    배우자 이름 *
                  </label>
                  <input
                    type="text"
                    id="spouseName"
                    name="spouseName"
                    value={formData.spouseName}
                    onChange={handleSpouseChange}
                    className={`${styles.input} ${
                      errors.spouseName ? styles.inputError : ""
                    }`}
                    placeholder="김영희"
                    disabled={isSubmitting}
                  />
                  {errors.spouseName && (
                    <span className={styles.errorText}>
                      {errors.spouseName}
                    </span>
                  )}
                </div>

                <div className={styles.field}>
                  <label htmlFor="spouseBirthYear" className={styles.label}>
                    배우자 출생년도 * (현재 한국 나이:{" "}
                    {formData.spouseBirthYear
                      ? calculateKoreanAge(parseInt(formData.spouseBirthYear))
                      : "?"}
                    세)
                  </label>
                  <input
                    type="text"
                    id="spouseBirthYear"
                    name="spouseBirthYear"
                    value={formData.spouseBirthYear}
                    onChange={handleSpouseChange}
                    className={`${styles.input} ${
                      errors.spouseBirthYear ? styles.inputError : ""
                    }`}
                    placeholder="1992"
                    disabled={isSubmitting}
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                  {errors.spouseBirthYear && (
                    <span className={styles.errorText}>
                      {errors.spouseBirthYear}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 가구원 정보 */}
            <div className={styles.familyMembersSection}>
              <div className={styles.familyMembersHeader}>
                <h4 className={styles.familyMembersTitle}>가구원</h4>
                <button
                  type="button"
                  onClick={addFamilyMember}
                  className={styles.addFamilyMemberButton}
                  disabled={isSubmitting}
                >
                  + 가구원 추가
                </button>
              </div>

              {formData.familyMembers.map((member, index) => (
                <div key={index} className={styles.familyMemberItem}>
                  <div className={styles.field}>
                    <label className={styles.label}>
                      가구원 {index + 1} 이름
                    </label>
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) =>
                        handleFamilyMemberChange(index, "name", e.target.value)
                      }
                      className={`${styles.input} ${
                        errors[`member${index}Name`] ? styles.inputError : ""
                      }`}
                      placeholder="홍철수"
                      disabled={isSubmitting}
                    />
                    {errors[`member${index}Name`] && (
                      <span className={styles.errorText}>
                        {errors[`member${index}Name`]}
                      </span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>관계</label>
                    <select
                      value={member.relationship}
                      onChange={(e) =>
                        handleFamilyMemberChange(
                          index,
                          "relationship",
                          e.target.value
                        )
                      }
                      className={`${styles.input} ${styles.select}`}
                      disabled={isSubmitting}
                    >
                      <option value="부모">부모</option>
                      <option value="자녀">자녀</option>
                      <option value="형제자매">형제자매</option>
                      <option value="조부모">조부모</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>
                      출생년도 (현재 한국 나이:{" "}
                      {member.birthYear
                        ? calculateKoreanAge(parseInt(member.birthYear))
                        : "?"}
                      세)
                    </label>
                    <input
                      type="text"
                      value={member.birthYear}
                      onChange={(e) =>
                        handleFamilyMemberChange(
                          index,
                          "birthYear",
                          e.target.value
                        )
                      }
                      className={`${styles.input} ${
                        errors[`member${index}BirthYear`]
                          ? styles.inputError
                          : ""
                      }`}
                      placeholder="2015"
                      disabled={isSubmitting}
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                    {errors[`member${index}BirthYear`] && (
                      <span className={styles.errorText}>
                        {errors[`member${index}BirthYear`]}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFamilyMember(index)}
                    className={styles.removeFamilyMemberButton}
                    disabled={isSubmitting}
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? "생성 중..." : "프로필 생성"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfileCreatePage;
