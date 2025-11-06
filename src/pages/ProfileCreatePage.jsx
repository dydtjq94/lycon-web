import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { calculateKoreanAge, getKoreanAgeInYear } from "../utils/koreanAge";
import {
  profileService,
  incomeService,
  expenseService,
  pensionService,
  realEstateService,
  checklistService,
  checklistTemplateService,
  financialLibraryService,
} from "../services/firestoreService";
import { simulationService } from "../services/simulationService";
import { formatAmountForChart } from "../utils/format";
import { buildChecklistTemplateItems } from "../constants/profileChecklist";
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
    currentSalary: "", // 본인 현재 급여 (월)
    currentLivingExpenses: "", // 은퇴 후 생활비 → 현재 생활비로 변경
    targetAssets: "",
    currentCash: "", // 현재 현금 추가
    spouse: null, // 배우자 객체 (없으면 null)
    children: [], // 자녀 배열
    parents: [], // 부모 배열
    otherFamilyMembers: [], // 기타 가구원 배열
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 기본 소득 데이터 생성 함수 (본인)
  const createDefaultIncomes = async (
    profileId,
    simulationId,
    birthYear,
    retirementAge,
    currentSalary = 450 // 입력받은 현재 급여 (기본값 450)
  ) => {
    const currentYear = new Date().getFullYear();
    const currentAge = currentYear - birthYear; // 현재 만 나이 계산
    const yearsToRetirement = retirementAge - currentAge; // 은퇴까지 남은 년수
    const retirementYear = currentYear + yearsToRetirement; // 은퇴 년도

    // 나이대별 소득 데이터를 최대 3개로 분할
    // ~50세: 3.3%, 50~60세: 0%, 60세~: -3.3%

    const incomes = [];
    let segmentStartYear = currentYear;
    let segmentStartAge = currentAge;
    let segmentSalary = currentSalary;

    // 1. ~50세 구간 (3.3% 상승)
    if (currentAge <= 50 && retirementAge > currentAge) {
      const segmentEndAge = Math.min(50, retirementAge);
      const segmentEndYear = birthYear + segmentEndAge;

      incomes.push({
        title: "근로소득 (본인, ~50세)",
        amount: segmentSalary,
        originalAmount: segmentSalary,
        frequency: "monthly",
        originalFrequency: "monthly",
        startYear: segmentStartYear,
        endYear: segmentEndYear,
        growthRate: 3.3, // 50세까지 상승률 3.3%
        memo: `프로필 생성 시 입력한 현재 급여 기반 (만 ${currentAge}~${segmentEndAge}세, 상승률 3.3%)`,
        category: "income",
      });

      // 다음 구간 준비: 51세 시점의 급여 계산 (50세까지 상승 적용)
      const yearsInSegment = segmentEndAge - currentAge;
      segmentSalary = Math.round(
        segmentSalary * Math.pow(1.033, yearsInSegment)
      );
      segmentStartYear = segmentEndYear + 1; // 51세부터
      segmentStartAge = segmentEndAge + 1; // 51세
    }

    // 2. 51~60세 구간 (0% 유지)
    if (segmentStartAge <= 60 && retirementAge >= segmentStartAge) {
      const segmentEndAge = Math.min(60, retirementAge);
      const segmentEndYear = birthYear + segmentEndAge;

      incomes.push({
        title: "근로소득 (본인, 51~60세)",
        amount: segmentSalary,
        originalAmount: segmentSalary,
        frequency: "monthly",
        originalFrequency: "monthly",
        startYear: segmentStartYear,
        endYear: segmentEndYear,
        growthRate: 0, // 51~60세 상승률 0%
        memo: `프로필 생성 시 입력한 현재 급여 기반 (만 ${segmentStartAge}~${segmentEndAge}세, 상승률 0%)`,
        category: "income",
      });

      // 다음 구간 준비 (금액 변화 없음)
      segmentStartYear = segmentEndYear + 1; // 61세부터
      segmentStartAge = segmentEndAge + 1; // 61세
    }

    // 3. 61세~ 구간 (-3.3% 하락)
    if (segmentStartAge <= retirementAge) {
      const segmentEndYear = retirementYear;

      incomes.push({
        title: "근로소득 (본인, 61세~)",
        amount: segmentSalary,
        originalAmount: segmentSalary,
        frequency: "monthly",
        originalFrequency: "monthly",
        startYear: segmentStartYear,
        endYear: segmentEndYear,
        growthRate: -3.3, // 61세 이후 하락률 -3.3%
        memo: `프로필 생성 시 입력한 현재 급여 기반 (만 ${segmentStartAge}~${retirementAge}세, 하락률 -3.3%)`,
        category: "income",
      });
    }

    // 모든 소득 데이터를 Firebase에 저장
    for (const incomeData of incomes) {
      try {
        await incomeService.createIncome(profileId, simulationId, incomeData);
        console.log(
          `소득 데이터 생성 완료: ${incomeData.startYear}~${incomeData.endYear}년 (${incomeData.growthRate}%)`
        );
      } catch (error) {
        console.error(`소득 데이터 생성 오류 (${incomeData.title}):`, error);
      }
    }
  };

  // 배우자 소득 데이터 생성 함수
  const createSpouseIncome = async (
    profileId,
    simulationId,
    spouseBirthYear,
    spouseRetirementAge,
    spouseCurrentSalary
  ) => {
    const currentYear = new Date().getFullYear();
    const spouseCurrentAge = currentYear - spouseBirthYear; // 배우자 현재 만 나이
    const yearsToRetirement = spouseRetirementAge - spouseCurrentAge; // 은퇴까지 남은 년수
    const retirementYear = currentYear + yearsToRetirement; // 은퇴 년도

    // 나이대별 소득 데이터를 최대 3개로 분할
    // ~50세: 3.3%, 50~60세: 0%, 60세~: -3.3%

    const incomes = [];
    let segmentStartYear = currentYear;
    let segmentStartAge = spouseCurrentAge;
    let segmentSalary = spouseCurrentSalary;

    // 1. ~50세 구간 (3.3% 상승)
    if (spouseCurrentAge <= 50 && spouseRetirementAge > spouseCurrentAge) {
      const segmentEndAge = Math.min(50, spouseRetirementAge);
      const segmentEndYear = spouseBirthYear + segmentEndAge;

      incomes.push({
        title: "근로소득 (배우자, ~50세)",
        amount: segmentSalary,
        originalAmount: segmentSalary,
        frequency: "monthly",
        originalFrequency: "monthly",
        startYear: segmentStartYear,
        endYear: segmentEndYear,
        growthRate: 3.3, // 50세까지 상승률 3.3%
        memo: `프로필 생성 시 입력한 배우자 현재 급여 기반 (만 ${spouseCurrentAge}~${segmentEndAge}세, 상승률 3.3%)`,
        category: "income",
      });

      // 다음 구간 준비: 51세 시점의 급여 계산 (50세까지 상승 적용)
      const yearsInSegment = segmentEndAge - spouseCurrentAge;
      segmentSalary = Math.round(
        segmentSalary * Math.pow(1.033, yearsInSegment)
      );
      segmentStartYear = segmentEndYear + 1; // 51세부터
      segmentStartAge = segmentEndAge + 1; // 51세
    }

    // 2. 51~60세 구간 (0% 유지)
    if (segmentStartAge <= 60 && spouseRetirementAge >= segmentStartAge) {
      const segmentEndAge = Math.min(60, spouseRetirementAge);
      const segmentEndYear = spouseBirthYear + segmentEndAge;

      incomes.push({
        title: "근로소득 (배우자, 51~60세)",
        amount: segmentSalary,
        originalAmount: segmentSalary,
        frequency: "monthly",
        originalFrequency: "monthly",
        startYear: segmentStartYear,
        endYear: segmentEndYear,
        growthRate: 0, // 51~60세 상승률 0%
        memo: `프로필 생성 시 입력한 배우자 현재 급여 기반 (만 ${segmentStartAge}~${segmentEndAge}세, 상승률 0%)`,
        category: "income",
      });

      // 다음 구간 준비 (금액 변화 없음)
      segmentStartYear = segmentEndYear + 1; // 61세부터
      segmentStartAge = segmentEndAge + 1; // 61세
    }

    // 3. 61세~ 구간 (-3.3% 하락)
    if (segmentStartAge <= spouseRetirementAge) {
      const segmentEndYear = retirementYear;

      incomes.push({
        title: "근로소득 (배우자, 61세~)",
        amount: segmentSalary,
        originalAmount: segmentSalary,
        frequency: "monthly",
        originalFrequency: "monthly",
        startYear: segmentStartYear,
        endYear: segmentEndYear,
        growthRate: -3.3, // 61세 이후 하락률 -3.3%
        memo: `프로필 생성 시 입력한 배우자 현재 급여 기반 (만 ${segmentStartAge}~${spouseRetirementAge}세, 하락률 -3.3%)`,
        category: "income",
      });
    }

    // 모든 소득 데이터를 Firebase에 저장
    for (const incomeData of incomes) {
      try {
        await incomeService.createIncome(profileId, simulationId, incomeData);
        console.log(
          `배우자 소득 데이터 생성 완료: ${incomeData.startYear}~${incomeData.endYear}년 (${incomeData.growthRate}%)`
        );
      } catch (error) {
        console.error(
          `배우자 소득 데이터 생성 오류 (${incomeData.title}):`,
          error
        );
      }
    }
  };

  // 기본 국민연금 데이터 생성 함수
  const createDefaultPension = async (profileId, simulationId, birthYear) => {
    const currentYear = new Date().getFullYear();
    const age65Year = birthYear + 65; // 만 65세가 되는 년도
    const age90Year = birthYear + 90; // 만 90세가 되는 년도

    const nationalPension = {
      title: "국민연금",
      type: "national",
      monthlyAmount: 103, // 월 수령액 103만원
      startYear: age65Year,
      endYear: age90Year,
      inflationRate: 1.89, // 물가상승률 1.89%
      memo: "기본 국민연금",
    };

    await pensionService.createPension(
      profileId,
      simulationId,
      nationalPension
    );
  };

  // 기본 부동산 데이터 생성 함수
  const createDefaultRealEstate = async (profileId, simulationId) => {
    const currentYear = new Date().getFullYear();

    const defaultRealEstate = {
      title: "자택",
      currentValue: 50000, // 5억원 (만원 단위)
      growthRate: 2.4, // 상승률 2.5%
      startYear: currentYear,
      endYear: 2099, // 보유 연도 2099년까지
      isResidential: true, // 거주용으로 기본 설정
      hasRentalIncome: false,
      monthlyRentalIncome: null,
      rentalIncomeStartYear: null,
      rentalIncomeEndYear: null,
      convertToPension: false,
      pensionStartYear: null,
      monthlyPensionAmount: null,
      memo: "(서울) 연평균 : 9.3%\n(디폴트) 10년간 전국 주택의 총 매매가 연평균 상승률 : 2.4%\n주택연금은 12억원 미만만 가능",
    };

    await realEstateService.createRealEstate(
      profileId,
      simulationId,
      defaultRealEstate
    );
  };

  // 기본 지출 데이터 생성 함수
  const createDefaultExpenses = async (
    profileId,
    simulationId,
    birthYear,
    retirementAge,
    currentLivingExpenses
  ) => {
    const currentYear = new Date().getFullYear();
    const currentAge = currentYear - birthYear; // 현재 만 나이 계산
    const yearsToRetirement = retirementAge - currentAge; // 은퇴까지 남은 년수
    const retirementYear = currentYear + yearsToRetirement; // 은퇴 년도 (예: 1994년생 55살 은퇴 = 2049년)
    const yearsToDeath = 90 - currentAge; // 죽을 때까지 남은 년수
    const deathYear = currentYear + yearsToDeath; // 죽을 년도

    // 물가상승률 1.89%를 적용하여 은퇴 시점 생활비 계산
    const inflationRateToRetirement = 0.0189; // 물가상승률 1.89%
    const retirementLivingExpensesAtRetirement = Math.round(
      (currentLivingExpenses || 0) *
        Math.pow(1 + inflationRateToRetirement, yearsToRetirement)
    );

    // 은퇴 후 생활비 = 은퇴 시점 생활비 * 0.7
    const retirementLivingExpensesAfter = Math.round(
      retirementLivingExpensesAtRetirement * 0.7
    );

    const defaultExpenses = [
      {
        title: "은퇴 전 생활비",
        amount: currentLivingExpenses || 0, // 현재 생활비
        frequency: "monthly",
        startYear: currentYear,
        endYear: retirementYear,
        growthRate: 1.89, // 물가상승률 1.89% 적용
        memo: "물가상승률 1.89% 적용",
        category: "expense",
      },
      {
        title: "은퇴 후 생활비",
        amount: retirementLivingExpensesAfter, // 은퇴 시점 생활비 * 0.7
        frequency: "monthly",
        startYear: retirementYear + 1, // 은퇴 다음 년도부터
        endYear: deathYear,
        growthRate: 1.0, // 기본 물가상승률 1% 적용
        memo: "물가상승률 1% 적용",
        category: "expense",
      },
    ];

    // 각 기본 지출 데이터를 Firebase에 저장
    for (const expense of defaultExpenses) {
      try {
        await expenseService.createExpense(profileId, simulationId, expense);
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
  // 배우자 추가
  const addSpouse = () => {
    setFormData((prev) => ({
      ...prev,
      spouse: {
        name: "",
        birthYear: "",
        isWorking: false,
        currentSalary: "",
        retirementAge: "",
      },
    }));
  };

  // 배우자 제거
  const removeSpouse = () => {
    setFormData((prev) => ({
      ...prev,
      spouse: null,
    }));
  };

  // 배우자 정보 변경
  const handleSpouseChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      spouse: { ...prev.spouse, [field]: value },
    }));
  };

  // 자녀 추가
  const addChild = () => {
    setFormData((prev) => ({
      ...prev,
      children: [...prev.children, { name: "", birthYear: "", gender: "아들" }],
    }));
  };

  // 자녀 제거
  const removeChild = (index) => {
    setFormData((prev) => ({
      ...prev,
      children: prev.children.filter((_, i) => i !== index),
    }));
  };

  // 자녀 정보 변경
  const handleChildChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      children: prev.children.map((child, i) =>
        i === index ? { ...child, [field]: value } : child
      ),
    }));
  };

  // 부모 추가
  const addParent = () => {
    setFormData((prev) => ({
      ...prev,
      parents: [...prev.parents, { name: "", birthYear: "", relation: "부" }],
    }));
  };

  // 부모 제거
  const removeParent = (index) => {
    setFormData((prev) => ({
      ...prev,
      parents: prev.parents.filter((_, i) => i !== index),
    }));
  };

  // 부모 정보 변경
  const handleParentChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      parents: prev.parents.map((parent, i) =>
        i === index ? { ...parent, [field]: value } : parent
      ),
    }));
  };

  // 기타 가구원 추가
  const addOtherMember = () => {
    setFormData((prev) => ({
      ...prev,
      otherFamilyMembers: [
        ...prev.otherFamilyMembers,
        { name: "", birthYear: "", relationship: "기타" },
      ],
    }));
  };

  // 기타 가구원 제거
  const removeOtherMember = (index) => {
    setFormData((prev) => ({
      ...prev,
      otherFamilyMembers: prev.otherFamilyMembers.filter((_, i) => i !== index),
    }));
  };

  // 기타 가구원 정보 변경
  const handleOtherMemberChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      otherFamilyMembers: prev.otherFamilyMembers.map((member, i) =>
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

    // 본인 현재 급여 검증
    if (!formData.currentSalary || formData.currentSalary < 0) {
      newErrors.currentSalary = "현재 급여를 입력해주세요.";
    }

    if (!formData.currentLivingExpenses || formData.currentLivingExpenses < 0) {
      newErrors.currentLivingExpenses = "현재 생활비를 입력해주세요.";
    }

    if (!formData.targetAssets || formData.targetAssets < 0) {
      newErrors.targetAssets = "목표 자산 규모를 입력해주세요.";
    }

    // 배우자 정보 검증
    if (formData.spouse) {
      if (!formData.spouse.name.trim()) {
        newErrors.spouseName = "배우자 이름을 입력해주세요.";
      }
      if (!formData.spouse.birthYear) {
        newErrors.spouseBirthYear = "배우자 출생년도를 입력해주세요.";
      } else {
        const spouseBirthYear = parseInt(formData.spouse.birthYear);
        const currentYear = new Date().getFullYear();
        if (spouseBirthYear < 1900 || spouseBirthYear > currentYear) {
          newErrors.spouseBirthYear = "올바른 배우자 출생년도를 입력해주세요.";
        }
      }

      // 배우자 근로 정보 검증
      if (formData.spouse.isWorking) {
        if (
          !formData.spouse.currentSalary ||
          formData.spouse.currentSalary < 0
        ) {
          newErrors.spouseCurrentSalary = "배우자 현재 급여를 입력해주세요.";
        }
        if (
          !formData.spouse.retirementAge ||
          formData.spouse.retirementAge < 30 ||
          formData.spouse.retirementAge > 80
        ) {
          newErrors.spouseRetirementAge =
            "배우자 은퇴 예상 나이는 30세에서 80세 사이여야 합니다.";
        }
      }
    }

    // 자녀 정보 검증
    formData.children.forEach((child, index) => {
      if (child.name.trim() && !child.birthYear) {
        newErrors[`child${index}BirthYear`] = "자녀 출생년도를 입력해주세요.";
      }
      if (!child.name.trim() && child.birthYear) {
        newErrors[`child${index}Name`] = "자녀 이름을 입력해주세요.";
      }
      if (child.birthYear) {
        const childBirthYear = parseInt(child.birthYear);
        const currentYear = new Date().getFullYear();
        if (childBirthYear < 1900 || childBirthYear > currentYear) {
          newErrors[`child${index}BirthYear`] =
            "올바른 자녀 출생년도를 입력해주세요.";
        }
      }
    });

    // 부모 정보 검증
    formData.parents.forEach((parent, index) => {
      if (parent.name.trim() && !parent.birthYear) {
        newErrors[`parent${index}BirthYear`] = "부모 출생년도를 입력해주세요.";
      }
      if (!parent.name.trim() && parent.birthYear) {
        newErrors[`parent${index}Name`] = "부모 이름을 입력해주세요.";
      }
      if (parent.birthYear) {
        const parentBirthYear = parseInt(parent.birthYear);
        const currentYear = new Date().getFullYear();
        if (parentBirthYear < 1900 || parentBirthYear > currentYear) {
          newErrors[`parent${index}BirthYear`] =
            "올바른 부모 출생년도를 입력해주세요.";
        }
      }
    });

    // 기타 가구원 정보 검증
    formData.otherFamilyMembers.forEach((member, index) => {
      if (member.name.trim() && !member.birthYear) {
        newErrors[`other${index}BirthYear`] = "가구원 출생년도를 입력해주세요.";
      }
      if (!member.name.trim() && member.birthYear) {
        newErrors[`other${index}Name`] = "가구원 이름을 입력해주세요.";
      }
      if (member.birthYear) {
        const memberBirthYear = parseInt(member.birthYear);
        const currentYear = new Date().getFullYear();
        if (memberBirthYear < 1900 || memberBirthYear > currentYear) {
          newErrors[`other${index}BirthYear`] =
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
      const yearsToRetirement = formData.retirementAge - currentKoreanAge; // 은퇴까지 남은 년수
      const retirementYear = currentYear + yearsToRetirement; // 은퇴 년도

      // 가구 구성원 정보 정리
      const familyMembers = [];

      // 자녀 추가
      formData.children.forEach((child) => {
        if (child.name.trim() && child.birthYear) {
          familyMembers.push({
            name: child.name,
            birthYear: parseInt(child.birthYear),
            relationship: "자녀",
            gender: child.gender || "아들", // 성별 추가 (딸/아들)
          });
        }
      });

      // 부모 추가
      formData.parents.forEach((parent) => {
        if (parent.name.trim() && parent.birthYear) {
          familyMembers.push({
            name: parent.name,
            birthYear: parseInt(parent.birthYear),
            relationship: parent.relation === "부" ? "부" : "모",
          });
        }
      });

      // 기타 가구원 추가
      formData.otherFamilyMembers.forEach((member) => {
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
        currentSalary: parseInt(formData.currentSalary), // 본인 현재 급여
        currentLivingExpenses: parseInt(formData.currentLivingExpenses), // 현재 생활비로 변경
        targetAssets: parseInt(formData.targetAssets),
        currentCash: parseInt(formData.currentCash) || 0, // 현재 현금 추가
        hasSpouse: formData.spouse !== null,
        spouseName: formData.spouse?.name || "",
        spouseBirthYear: formData.spouse?.birthYear || "",
        spouseIsWorking: formData.spouse?.isWorking || false, // 배우자 근로 여부
        spouseCurrentSalary: formData.spouse?.isWorking
          ? parseInt(formData.spouse.currentSalary)
          : 0, // 배우자 현재 급여
        spouseRetirementAge: formData.spouse?.isWorking
          ? parseInt(formData.spouse.retirementAge)
          : 0, // 배우자 은퇴 예상 나이
        familyMembers,
        createdAt: new Date().toISOString(),
      };

      // Firebase에 프로필 저장
      console.log("프로필 데이터 전송:", profileData);
      const createdProfile = await profileService.createProfile(profileData);
      console.log("생성된 프로필:", createdProfile);

      // Firebase에서 체크리스트 템플릿 가져오기
      try {
        let templateItems = [];

        // Firebase에서 템플릿 조회
        const template = await checklistTemplateService.getTemplate();

        if (template && template.items) {
          // Firebase 템플릿이 있으면 사용
          templateItems = template.items;
          console.log("Firebase 템플릿을 사용합니다:", template);
        } else {
          // 템플릿이 없으면 기본 템플릿으로 초기화 후 사용
          console.log("Firebase 템플릿이 없어서 기본 템플릿으로 초기화합니다.");
          const defaultItems = buildChecklistTemplateItems();
          await checklistTemplateService.initializeDefaultTemplate(
            defaultItems
          );
          templateItems = defaultItems;
        }

        // 프로필에 체크리스트 생성
        await checklistService.createChecklist(createdProfile.id, {
          title: "체크리스트",
          items: templateItems,
        });
      } catch (error) {
        console.error("기본 체크리스트 생성 오류:", error);
      }

      // 기본 시뮬레이션("현재") 생성
      let defaultSimulationId;
      try {
        defaultSimulationId = await simulationService.createSimulation(
          createdProfile.id,
          {
            title: "현재",
            isDefault: true,
          }
        );
        console.log("기본 시뮬레이션 생성 완료:", defaultSimulationId);
      } catch (error) {
        console.error("기본 시뮬레이션 생성 오류:", error);
        throw new Error("기본 시뮬레이션 생성에 실패했습니다.");
      }

      // 기본 소득 데이터 생성 (본인)
      try {
        await createDefaultIncomes(
          createdProfile.id,
          defaultSimulationId,
          birthYear,
          formData.retirementAge,
          parseInt(formData.currentSalary) // 입력받은 현재 급여
        );
        console.log("기본 소득 데이터 생성 완료 (본인)");
      } catch (error) {
        console.error("기본 소득 데이터 생성 오류 (본인):", error);
        // 기본 소득 데이터 생성 실패해도 프로필은 생성되었으므로 계속 진행
      }

      // 배우자 소득 데이터 생성
      if (formData.spouse && formData.spouse.isWorking) {
        try {
          await createSpouseIncome(
            createdProfile.id,
            defaultSimulationId,
            parseInt(formData.spouse.birthYear),
            parseInt(formData.spouse.retirementAge),
            parseInt(formData.spouse.currentSalary)
          );
          console.log("배우자 소득 데이터 생성 완료");
        } catch (error) {
          console.error("배우자 소득 데이터 생성 오류:", error);
        }
      }

      // 기본 지출 데이터 생성
      try {
        await createDefaultExpenses(
          createdProfile.id,
          defaultSimulationId,
          birthYear,
          formData.retirementAge,
          formData.currentLivingExpenses
        );
        console.log("기본 지출 데이터 생성 완료");
      } catch (error) {
        console.error("기본 지출 데이터 생성 오류:", error);
        // 기본 지출 데이터 생성 실패해도 프로필은 생성되었으므로 계속 진행
      }

      // 기본 국민연금 데이터 생성
      try {
        await createDefaultPension(
          createdProfile.id,
          defaultSimulationId,
          birthYear
        );
        console.log("기본 국민연금 데이터 생성 완료");
      } catch (error) {
        console.error("기본 국민연금 데이터 생성 오류:", error);
        // 기본 국민연금 데이터 생성 실패해도 프로필은 생성되었으므로 계속 진행
      }

      // 기본 부동산 데이터 생성
      try {
        await createDefaultRealEstate(createdProfile.id, defaultSimulationId);
        console.log("기본 부동산 데이터 생성 완료");
      } catch (error) {
        console.error("기본 부동산 데이터 생성 오류:", error);
        // 기본 부동산 데이터 생성 실패해도 프로필은 생성되었으므로 계속 진행
      }

      // 대시보드로 이동
      navigate(`/consult/dashboard/${createdProfile.id}`);
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
        <button
          className={styles.backIconButton}
          onClick={() => navigate("/consult")}
          title="목록으로"
        >
          ←
        </button>
        <h1 className={styles.title}>새 프로필 생성</h1>
      </div>

      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {errors.form && (
            <div className={styles.errorBanner}>{errors.form}</div>
          )}

          <div className={styles.twoColumnLayout}>
            {/* 왼쪽: 기본 정보 */}
            <div className={styles.leftColumn}>
              <h3 className={styles.columnTitle}>기본 정보</h3>

              {/* 이름, 출생년도 (2개) */}
              <div className={styles.fieldGrid}>
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
                    출생년도 * (현재 만 나이:{" "}
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
              </div>

              {/* 은퇴 목표 연령, 은퇴 시점 목표 자산 규모 (2개) */}
              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <label htmlFor="retirementAge" className={styles.label}>
                    은퇴 목표 연령 * (은퇴년도:{" "}
                    {formData.birthYear && formData.retirementAge
                      ? (() => {
                          const currentYear = new Date().getFullYear();
                          const birth = parseInt(formData.birthYear, 10);
                          const retireAge = parseInt(
                            formData.retirementAge,
                            10
                          );
                          if (
                            Number.isFinite(birth) &&
                            Number.isFinite(retireAge)
                          ) {
                            const currentAge = currentYear - birth;
                            const yearsToRetire = retireAge - currentAge;
                            return (
                              currentYear +
                              (Number.isFinite(yearsToRetire)
                                ? yearsToRetire
                                : 0)
                            );
                          }
                          return "?";
                        })()
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
                    <span className={styles.errorText}>
                      {errors.retirementAge}
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
                  {formData.targetAssets &&
                    !isNaN(parseInt(formData.targetAssets)) && (
                      <div className={styles.amountPreview}>
                        {formatAmountForChart(parseInt(formData.targetAssets))}
                      </div>
                    )}
                  {errors.targetAssets && (
                    <span className={styles.errorText}>
                      {errors.targetAssets}
                    </span>
                  )}
                </div>
              </div>

              {/* 현재 현금, 현재 생활비, 현재 급여 (3개) */}
              <div className={styles.fieldGrid3}>
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
                  {formData.currentCash &&
                    !isNaN(parseInt(formData.currentCash)) && (
                      <div className={styles.amountPreview}>
                        {formatAmountForChart(parseInt(formData.currentCash))}
                      </div>
                    )}
                  {errors.currentCash && (
                    <span className={styles.errorText}>
                      {errors.currentCash}
                    </span>
                  )}
                </div>

                <div className={styles.field}>
                  <label
                    htmlFor="currentLivingExpenses"
                    className={styles.label}
                  >
                    현재 생활비 (만원/월) *
                  </label>
                  <input
                    type="text"
                    id="currentLivingExpenses"
                    name="currentLivingExpenses"
                    value={formData.currentLivingExpenses}
                    onChange={handleChange}
                    className={`${styles.input} ${
                      errors.currentLivingExpenses ? styles.inputError : ""
                    }`}
                    placeholder="300"
                    disabled={isSubmitting}
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                  {formData.currentLivingExpenses &&
                    !isNaN(parseInt(formData.currentLivingExpenses)) && (
                      <div className={styles.amountPreview}>
                        {formatAmountForChart(
                          parseInt(formData.currentLivingExpenses)
                        )}
                      </div>
                    )}
                  {errors.currentLivingExpenses && (
                    <span className={styles.errorText}>
                      {errors.currentLivingExpenses}
                    </span>
                  )}
                </div>

                <div className={styles.field}>
                  <label htmlFor="currentSalary" className={styles.label}>
                    현재 급여 (만원/월) *
                  </label>
                  <input
                    type="text"
                    id="currentSalary"
                    name="currentSalary"
                    value={formData.currentSalary}
                    onChange={handleChange}
                    className={`${styles.input} ${
                      errors.currentSalary ? styles.inputError : ""
                    }`}
                    placeholder="450"
                    disabled={isSubmitting}
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                  {formData.currentSalary &&
                    !isNaN(parseInt(formData.currentSalary)) && (
                      <div className={styles.amountPreview}>
                        {formatAmountForChart(parseInt(formData.currentSalary))}
                      </div>
                    )}
                  {errors.currentSalary && (
                    <span className={styles.errorText}>
                      {errors.currentSalary}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 오른쪽: 가족 구성원 */}
            <div className={styles.rightColumn}>
              <h3 className={styles.columnTitle}>가족 구성원</h3>

              {/* 배우자 섹션 */}
              <div className={styles.familySection}>
                <div className={styles.familySectionHeader}>
                  <h4 className={styles.familySectionTitle}>배우자</h4>
                  {!formData.spouse && (
                    <button
                      type="button"
                      onClick={addSpouse}
                      className={styles.addFamilyButton}
                      disabled={isSubmitting}
                    >
                      + 추가
                    </button>
                  )}
                </div>

                {formData.spouse && (
                  <div className={styles.familyMemberItem}>
                    <button
                      type="button"
                      onClick={removeSpouse}
                      className={styles.removeButton}
                      disabled={isSubmitting}
                      aria-label="배우자 삭제"
                    >
                      ×
                    </button>
                    <div className={styles.fieldGrid}>
                      <div className={styles.field}>
                        <label className={styles.label}>이름</label>
                        <input
                          type="text"
                          value={formData.spouse.name}
                          onChange={(e) =>
                            handleSpouseChange("name", e.target.value)
                          }
                          className={`${styles.input} ${
                            errors.spouseName ? styles.inputError : ""
                          }`}
                          placeholder="배우자 이름"
                          disabled={isSubmitting}
                        />
                        {errors.spouseName && (
                          <span className={styles.errorText}>
                            {errors.spouseName}
                          </span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label className={styles.label}>
                          출생년도 (만 나이:{" "}
                          {formData.spouse.birthYear
                            ? calculateKoreanAge(
                                parseInt(formData.spouse.birthYear)
                              )
                            : "?"}
                          세)
                        </label>
                        <input
                          type="text"
                          value={formData.spouse.birthYear}
                          onChange={(e) =>
                            handleSpouseChange("birthYear", e.target.value)
                          }
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

                    <div className={styles.checkboxField}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={formData.spouse.isWorking}
                          onChange={(e) =>
                            handleSpouseChange("isWorking", e.target.checked)
                          }
                          disabled={isSubmitting}
                        />
                        현재 일하고 있습니다
                      </label>
                    </div>

                    {formData.spouse.isWorking && (
                      <div className={styles.fieldGrid}>
                        <div className={styles.field}>
                          <label className={styles.label}>
                            현재 급여 (만원/월)
                          </label>
                          <input
                            type="text"
                            value={formData.spouse.currentSalary}
                            onChange={(e) =>
                              handleSpouseChange(
                                "currentSalary",
                                e.target.value
                              )
                            }
                            className={`${styles.input} ${
                              errors.spouseCurrentSalary
                                ? styles.inputError
                                : ""
                            }`}
                            placeholder="350"
                            disabled={isSubmitting}
                            onKeyPress={(e) => {
                              if (!/[0-9]/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                          />
                          {errors.spouseCurrentSalary && (
                            <span className={styles.errorText}>
                              {errors.spouseCurrentSalary}
                            </span>
                          )}
                        </div>

                        <div className={styles.field}>
                          <label className={styles.label}>
                            은퇴 예상 나이 (만)
                          </label>
                          <input
                            type="text"
                            value={formData.spouse.retirementAge}
                            onChange={(e) =>
                              handleSpouseChange(
                                "retirementAge",
                                e.target.value
                              )
                            }
                            className={`${styles.input} ${
                              errors.spouseRetirementAge
                                ? styles.inputError
                                : ""
                            }`}
                            placeholder="60"
                            disabled={isSubmitting}
                            onKeyPress={(e) => {
                              if (!/[0-9]/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                          />
                          {errors.spouseRetirementAge && (
                            <span className={styles.errorText}>
                              {errors.spouseRetirementAge}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 자녀 정보 */}
              <div className={styles.familySection}>
                <div className={styles.familySectionHeader}>
                  <h4 className={styles.familySectionTitle}>자녀</h4>
                  <button
                    type="button"
                    onClick={addChild}
                    className={styles.addFamilyButton}
                    disabled={isSubmitting}
                  >
                    + 추가
                  </button>
                </div>

                {formData.children.map((child, index) => (
                  <div key={index} className={styles.familyMemberItem}>
                    <button
                      type="button"
                      onClick={() => removeChild(index)}
                      className={styles.removeButton}
                      disabled={isSubmitting}
                      aria-label={`${index + 1}째 자녀 삭제`}
                    >
                      ×
                    </button>
                    <div className={styles.fieldGrid}>
                      <div className={styles.field}>
                        <label className={styles.label}>
                          {index + 1}째 자녀 이름
                        </label>
                        <input
                          type="text"
                          value={child.name}
                          onChange={(e) =>
                            handleChildChange(index, "name", e.target.value)
                          }
                          className={`${styles.input} ${
                            errors[`child${index}Name`] ? styles.inputError : ""
                          }`}
                          placeholder="홍길동"
                          disabled={isSubmitting}
                        />
                        {errors[`child${index}Name`] && (
                          <span className={styles.errorText}>
                            {errors[`child${index}Name`]}
                          </span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label className={styles.label}>성별</label>
                        <select
                          value={child.gender || "아들"}
                          onChange={(e) =>
                            handleChildChange(index, "gender", e.target.value)
                          }
                          className={styles.select}
                          disabled={isSubmitting}
                        >
                          <option value="아들">아들</option>
                          <option value="딸">딸</option>
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label className={styles.label}>
                          출생년도 (현재 만 나이:{" "}
                          {child.birthYear
                            ? calculateKoreanAge(parseInt(child.birthYear))
                            : "?"}
                          세)
                        </label>
                        <input
                          type="text"
                          value={child.birthYear}
                          onChange={(e) =>
                            handleChildChange(
                              index,
                              "birthYear",
                              e.target.value
                            )
                          }
                          className={`${styles.input} ${
                            errors[`child${index}BirthYear`]
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
                        {errors[`child${index}BirthYear`] && (
                          <span className={styles.errorText}>
                            {errors[`child${index}BirthYear`]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 부모 정보 */}
              <div className={styles.familySection}>
                <div className={styles.familySectionHeader}>
                  <h4 className={styles.familySectionTitle}>부모</h4>
                  <button
                    type="button"
                    onClick={addParent}
                    className={styles.addFamilyButton}
                    disabled={isSubmitting}
                  >
                    + 추가
                  </button>
                </div>

                {formData.parents.map((parent, index) => (
                  <div key={index} className={styles.familyMemberItem}>
                    <button
                      type="button"
                      onClick={() => removeParent(index)}
                      className={styles.removeButton}
                      disabled={isSubmitting}
                      aria-label="부모 삭제"
                    >
                      ×
                    </button>
                    <div className={styles.fieldGrid}>
                      <div className={styles.field}>
                        <label className={styles.label}>부모 이름</label>
                        <input
                          type="text"
                          value={parent.name}
                          onChange={(e) =>
                            handleParentChange(index, "name", e.target.value)
                          }
                          className={`${styles.input} ${
                            errors[`parent${index}Name`]
                              ? styles.inputError
                              : ""
                          }`}
                          placeholder="홍아무개"
                          disabled={isSubmitting}
                        />
                        {errors[`parent${index}Name`] && (
                          <span className={styles.errorText}>
                            {errors[`parent${index}Name`]}
                          </span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label className={styles.label}>관계</label>
                        <select
                          value={parent.relation}
                          onChange={(e) =>
                            handleParentChange(
                              index,
                              "relation",
                              e.target.value
                            )
                          }
                          className={`${styles.input} ${styles.select}`}
                          disabled={isSubmitting}
                        >
                          <option value="부">부</option>
                          <option value="모">모</option>
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label className={styles.label}>
                          출생년도 (현재 만 나이:{" "}
                          {parent.birthYear
                            ? calculateKoreanAge(parseInt(parent.birthYear))
                            : "?"}
                          세)
                        </label>
                        <input
                          type="text"
                          value={parent.birthYear}
                          onChange={(e) =>
                            handleParentChange(
                              index,
                              "birthYear",
                              e.target.value
                            )
                          }
                          className={`${styles.input} ${
                            errors[`parent${index}BirthYear`]
                              ? styles.inputError
                              : ""
                          }`}
                          placeholder="1950"
                          disabled={isSubmitting}
                          onKeyPress={(e) => {
                            if (!/[0-9]/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                        />
                        {errors[`parent${index}BirthYear`] && (
                          <span className={styles.errorText}>
                            {errors[`parent${index}BirthYear`]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 기타 가구원 정보 */}
              <div className={styles.familySection}>
                <div className={styles.familySectionHeader}>
                  <h4 className={styles.familySectionTitle}>기타 가구원</h4>
                  <button
                    type="button"
                    onClick={addOtherMember}
                    className={styles.addFamilyButton}
                    disabled={isSubmitting}
                  >
                    + 추가
                  </button>
                </div>

                {formData.otherFamilyMembers.map((member, index) => (
                  <div key={index} className={styles.familyMemberItem}>
                    <button
                      type="button"
                      onClick={() => removeOtherMember(index)}
                      className={styles.removeButton}
                      disabled={isSubmitting}
                      aria-label="기타 가구원 삭제"
                    >
                      ×
                    </button>
                    <div className={styles.fieldGrid}>
                      <div className={styles.field}>
                        <label className={styles.label}>가구원 이름</label>
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) =>
                            handleOtherMemberChange(
                              index,
                              "name",
                              e.target.value
                            )
                          }
                          className={`${styles.input} ${
                            errors[`other${index}Name`] ? styles.inputError : ""
                          }`}
                          placeholder="이름"
                          disabled={isSubmitting}
                        />
                        {errors[`other${index}Name`] && (
                          <span className={styles.errorText}>
                            {errors[`other${index}Name`]}
                          </span>
                        )}
                      </div>

                      <div className={styles.field}>
                        <label className={styles.label}>관계</label>
                        <select
                          value={member.relationship}
                          onChange={(e) =>
                            handleOtherMemberChange(
                              index,
                              "relationship",
                              e.target.value
                            )
                          }
                          className={`${styles.input} ${styles.select}`}
                          disabled={isSubmitting}
                        >
                          <option value="형제">형제</option>
                          <option value="자매">자매</option>
                          <option value="조부">조부</option>
                          <option value="조모">조모</option>
                          <option value="기타">기타</option>
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label className={styles.label}>
                          출생년도 (현재 만 나이:{" "}
                          {member.birthYear
                            ? calculateKoreanAge(parseInt(member.birthYear))
                            : "?"}
                          세)
                        </label>
                        <input
                          type="text"
                          value={member.birthYear}
                          onChange={(e) =>
                            handleOtherMemberChange(
                              index,
                              "birthYear",
                              e.target.value
                            )
                          }
                          className={`${styles.input} ${
                            errors[`other${index}BirthYear`]
                              ? styles.inputError
                              : ""
                          }`}
                          placeholder="1990"
                          disabled={isSubmitting}
                          onKeyPress={(e) => {
                            if (!/[0-9]/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                        />
                        {errors[`other${index}BirthYear`] && (
                          <span className={styles.errorText}>
                            {errors[`other${index}BirthYear`]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 프로필 생성 버튼 (2단 레이아웃 하단) */}
          <div className={styles.submitButtonContainer}>
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
