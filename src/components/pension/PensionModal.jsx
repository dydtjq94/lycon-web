import React, { useState, useEffect } from "react";
import styles from "./PensionModal.module.css";
import { formatAmountForChart } from "../../utils/format";
import { calculateKoreanAge } from "../../utils/koreanAge";
import { pensionService } from "../../services/firestoreService";

/**
 * 연금 데이터 추가/수정 모달
 * 국민연금, 퇴직연금, 개인연금 지원
 */
function PensionModal({
  isOpen,
  onClose,
  onSave,
  editData = null,
  profileData = null,
  simulations = [],
  activeSimulationId = null,
  profileId = null,
}) {
  // 은퇴년도 계산 함수
  const getRetirementYear = () => {
    const currentYear = new Date().getFullYear();
    if (profileData && profileData.birthYear && profileData.retirementAge) {
      const birth = parseInt(profileData.birthYear, 10);
      const retireAge = parseInt(profileData.retirementAge, 10);
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

  // 기본값 계산 함수
  const getDefaultYears = () => {
    const currentYear = new Date().getFullYear();

    // 프로필 데이터에서 현재 나이 가져오기
    let currentAge = 40; // 기본값 (프로필 데이터가 없을 때만 사용)

    if (profileData) {
      // birthYear가 있는 경우 (만 나이로 계산)
      if (profileData.birthYear) {
        currentAge = currentYear - parseInt(profileData.birthYear);
      }
      // currentKoreanAge가 있는 경우 (이미 만 나이로 저장됨)
      else if (profileData.currentKoreanAge) {
        currentAge = parseInt(profileData.currentKoreanAge);
      }
      // birthDate가 있는 경우
      else if (profileData.birthDate) {
        const birthDate = new Date(profileData.birthDate);
        const today = new Date();
        currentAge = today.getFullYear() - birthDate.getFullYear();

        // 생일이 아직 지나지 않았다면 나이에서 1 빼기
        if (
          today.getMonth() < birthDate.getMonth() ||
          (today.getMonth() === birthDate.getMonth() &&
            today.getDate() < birthDate.getDate())
        ) {
          currentAge--;
        }
      }
    }

    // 만 나이 기준으로 65세와 90세가 되는 년도 계산
    // 출생년도 + 65 = 만 65세가 되는 년도
    // 출생년도 + 90 = 만 90세가 되는 년도
    const birthYear = profileData?.birthYear
      ? parseInt(profileData.birthYear)
      : currentYear - currentAge;
    const age65Year = birthYear + 65; // 만 65세가 되는 년도
    const age90Year = birthYear + 90; // 만 90세가 되는 년도

    return { age65Year, age90Year, currentAge };
  };

  const { age65Year, age90Year } = getDefaultYears();

  const [formData, setFormData] = useState({
    type: "", // national, retirement, personal, severance
    title: "",
    monthlyAmount: "", // 월 수령 금액
    startYear: age65Year,
    endYear: age90Year,
    inflationRate: 1.89, // 물가상승률 (국민연금용)
    // 퇴직연금/개인연금용 필드
    currentAmount: "", // 현재 보유액
    contributionAmount: "", // 월/년 적립 금액
    contributionFrequency: "monthly", // monthly, yearly
    contributionStartYear: new Date().getFullYear(),
    contributionEndYear: new Date().getFullYear() + 10,
    returnRate: 2.86, // 투자 수익률
    paymentStartYear: age65Year, // 수령 시작년도
    paymentYears: 10, // 수령 기간(년) - PMT 방식
    memo: "",
    isFixedContributionEndYearToRetirement: false, // 적립 종료년도 은퇴년도 고정 여부
    // 퇴직금/DB형용 필드
    averageSalary: "", // 평균 임금 (월 단위, 만원)
    yearsOfService: "", // 재직 년도
    noAdditionalContribution: false, // 퇴직금/DB 추가 적립 안함
  });

  const [errors, setErrors] = useState({});
  const [selectedSimulationIds, setSelectedSimulationIds] = useState([]);
  const [availableSimulationIds, setAvailableSimulationIds] = useState([]);
  const [isSimSelectionLoading, setIsSimSelectionLoading] = useState(false);

  // 퇴직금/DB형: 평균 임금 × 재직 년도로 보유액 자동 계산
  useEffect(() => {
    if (formData.type === "severance") {
      const salary = parseFloat(formData.averageSalary) || 0;
      const years = parseFloat(formData.yearsOfService) || 0;
      if (salary > 0 && years > 0) {
        const calculatedAmount = salary * years;
        setFormData((prev) => ({
          ...prev,
          currentAmount: calculatedAmount.toString(),
        }));
      }
    }
  }, [formData.averageSalary, formData.yearsOfService, formData.type]);

  // 은퇴년도 고정이 켜져있으면 적립 종료년도를 자동으로 은퇴년도로 업데이트
  useEffect(() => {
    if (
      formData.isFixedContributionEndYearToRetirement &&
      profileData &&
      formData.type !== "national"
    ) {
      const retirementYear = getRetirementYear();
      if (formData.contributionEndYear !== retirementYear) {
        setFormData((prev) => ({
          ...prev,
          contributionEndYear: retirementYear,
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.isFixedContributionEndYearToRetirement,
    profileData?.retirementAge,
    profileData?.birthYear,
    formData.type,
  ]);

  // 수정 모드일 때 해당 id가 존재하는 시뮬레이션 확인
  useEffect(() => {
    const checkAvailableSimulations = async () => {
      setIsSimSelectionLoading(true);
      const startTime = Date.now();

      if (
        isOpen &&
        editData &&
        editData.id &&
        profileId &&
        simulations.length > 0
      ) {
        try {
          // 모든 시뮬레이션에서 해당 id 존재 여부 확인
          const checkPromises = simulations.map(async (sim) => {
            try {
              await pensionService.getPension(profileId, sim.id, editData.id);
              return sim.id; // 존재하면 시뮬레이션 id 반환
            } catch (error) {
              return null; // 존재하지 않으면 null
            }
          });
          const results = await Promise.all(checkPromises);
          const availableIds = results.filter((id) => id !== null);
          setAvailableSimulationIds(availableIds);
          // 기본 선택: 현재 활성 시뮬레이션이 availableIds에 있으면 그것만, 없으면 전체
          const defaultSelected = availableIds.includes(activeSimulationId)
            ? [activeSimulationId]
            : availableIds.length > 0
            ? [availableIds[0]]
            : [];
          setSelectedSimulationIds(defaultSelected);

          // 최소 1초 로딩 유지
          const elapsedTime = Date.now() - startTime;
          const remainingTime = Math.max(0, 1000 - elapsedTime);
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
        } catch (error) {
          console.error("시뮬레이션 확인 오류:", error);
          // 오류 시 모든 시뮬레이션 표시 (기존 동작)
          setAvailableSimulationIds(simulations.map((s) => s.id));
          setSelectedSimulationIds(
            activeSimulationId ? [activeSimulationId] : []
          );

          // 최소 1초 로딩 유지
          const elapsedTime = Date.now() - startTime;
          const remainingTime = Math.max(0, 1000 - elapsedTime);
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
        } finally {
          setIsSimSelectionLoading(false);
        }
      } else {
        // 추가 모드이거나 editData가 없으면 모든 시뮬레이션 표시
        // 최소 1초 로딩 유지
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1000 - elapsedTime);
        await new Promise((resolve) => setTimeout(resolve, remainingTime));

        setAvailableSimulationIds(simulations.map((s) => s.id));
        const defaultSelected = activeSimulationId ? [activeSimulationId] : [];
        setSelectedSimulationIds(defaultSelected);
        setIsSimSelectionLoading(false);
      }
    };
    checkAvailableSimulations();
  }, [isOpen, editData, profileId, simulations, activeSimulationId]);

  // 수정 모드일 때 데이터 로드, 모달이 열릴 때마다 초기화
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          type: editData.type || "national",
          title: editData.title || "",
          monthlyAmount:
            editData.monthlyAmount !== undefined &&
            editData.monthlyAmount !== null
              ? editData.monthlyAmount.toString()
              : "",
          startYear: editData.startYear || new Date().getFullYear(),
          endYear: editData.endYear || new Date().getFullYear() + 20,
          inflationRate: editData.inflationRate
            ? editData.inflationRate.toFixed(2)
            : 1.89,
          currentAmount:
            editData.currentAmount !== undefined &&
            editData.currentAmount !== null
              ? editData.currentAmount.toString()
              : "",
          contributionAmount:
            editData.contributionAmount !== undefined &&
            editData.contributionAmount !== null
              ? editData.contributionAmount.toString()
              : "",
          contributionFrequency: editData.contributionFrequency || "monthly",
          contributionStartYear:
            editData.contributionStartYear || new Date().getFullYear(),
          contributionEndYear:
            editData.contributionEndYear || new Date().getFullYear() + 10,
          returnRate:
            editData.returnRate !== undefined
              ? editData.returnRate.toFixed(2)
              : 2.86,
          paymentStartYear:
            editData.paymentStartYear || new Date().getFullYear() + 11,
          paymentYears: editData.paymentYears
            ? editData.paymentYears
            : editData.paymentEndYear
            ? editData.paymentEndYear - editData.paymentStartYear
            : 10, // 기존 데이터 호환성 (paymentEndYear가 있으면 기간 계산)
          memo: editData.memo || "",
          isFixedContributionEndYearToRetirement:
            editData.isFixedContributionEndYearToRetirement || false,
          averageSalary:
            editData.averageSalary !== undefined &&
            editData.averageSalary !== null
              ? editData.averageSalary.toString()
              : "",
          yearsOfService:
            editData.yearsOfService !== undefined &&
            editData.yearsOfService !== null
              ? editData.yearsOfService.toString()
              : "",
          noAdditionalContribution: editData.noAdditionalContribution || false,
        });
      } else {
        // 새 데이터일 때 초기화
        const { age65Year, age90Year } = getDefaultYears();
        setFormData({
          type: "",
          title: "",
          monthlyAmount: "",
          startYear: age65Year,
          endYear: age90Year,
          inflationRate: 1.89,
          currentAmount: "",
          contributionAmount: "",
          contributionFrequency: "monthly",
          contributionStartYear: new Date().getFullYear(),
          contributionEndYear: new Date().getFullYear() + 10,
          returnRate: 2.86,
          paymentStartYear: age65Year,
          paymentYears: 10,
          memo: "",
          isFixedContributionEndYearToRetirement: false,
          averageSalary: "",
          yearsOfService: "",
          noAdditionalContribution: false,
        });
      }
    }
  }, [isOpen, editData]);

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
      // 모달이 닫힐 때 body 스크롤 복원
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // 연금 타입 변경 시 기본값 설정
  const handleTypeChange = (newType) => {
    const currentYear = new Date().getFullYear();

    // 프로필 데이터에서 현재 나이 가져오기
    let currentAge = 30; // 기본값 (프로필 데이터가 없을 때만 사용)

    if (profileData) {
      // birthDate가 있는 경우
      if (profileData.birthDate) {
        const birthDate = new Date(profileData.birthDate);
        const today = new Date();
        currentAge = today.getFullYear() - birthDate.getFullYear();

        // 생일이 아직 지나지 않았다면 나이에서 1 빼기
        if (
          today.getMonth() < birthDate.getMonth() ||
          (today.getMonth() === birthDate.getMonth() &&
            today.getDate() < birthDate.getDate())
        ) {
          currentAge--;
        }
      }
      // currentKoreanAge가 있는 경우 (더 정확한 나이)
      else if (profileData.currentKoreanAge) {
        currentAge = parseInt(profileData.currentKoreanAge);
      }
      // birthYear가 있는 경우
      else if (profileData.birthYear) {
        currentAge = currentYear - parseInt(profileData.birthYear);
      }
    }

    // 출생년도 기준으로 나이 계산 (만 나이 기준)
    const birthYear = profileData?.birthYear
      ? parseInt(profileData.birthYear)
      : currentYear - currentAge;

    // 은퇴 나이 계산
    const retirementAge = parseInt(profileData?.retirementAge || 54, 10);
    // 현재 연도 기준 은퇴년도 계산 (문자열 결합 방지)
    const currentYearSafe = new Date().getFullYear();
    const currentAgeSafe = Math.max(0, currentYearSafe - birthYear);
    const retirementYear = currentYearSafe + (retirementAge - currentAgeSafe);
    const retirementYearPlus1 = retirementYear + 1; // 은퇴 년도 + 1
    const paymentEndYear = retirementYearPlus1 + 9; // 은퇴 년도 + 1부터 10년간

    // 국민연금용 (65세, 90세)
    const age65Year = birthYear + 65;
    const age90Year = birthYear + 90;

    let newFormData = { ...formData, type: newType };

    // 연금 항목명 자동 설정
    switch (newType) {
      case "national":
        newFormData.title = "국민연금";
        newFormData.startYear = age65Year;
        newFormData.endYear = age90Year;
        newFormData.noAdditionalContribution = false; // 국민연금은 추가 적립 안함 해제
        break;
      case "retirement":
        newFormData.title = "퇴직연금";
        newFormData.contributionStartYear = currentYear; // 현재년도부터 적립 시작
        newFormData.contributionEndYear = retirementYear; // 은퇴 나이까지 적립
        newFormData.paymentStartYear = retirementYear; // 은퇴년도부터 수령
        newFormData.paymentYears = 10; // 10년간 수령
        newFormData.noAdditionalContribution = false; // 퇴직연금은 추가 적립 안함 해제
        break;
      case "personal":
        newFormData.title = "개인연금";
        newFormData.contributionStartYear = currentYear; // 현재년도부터 적립 시작
        newFormData.contributionEndYear = retirementYear; // 은퇴 나이까지 적립
        newFormData.paymentStartYear = retirementYear; // 은퇴년도부터 수령
        newFormData.paymentYears = 10; // 10년간 수령
        newFormData.noAdditionalContribution = false; // 개인연금은 추가 적립 안함 해제
        break;
      case "severance":
        newFormData.title = "퇴직금/DB";
        newFormData.noAdditionalContribution = true; // 추가 적립 안함 기본 체크
        newFormData.contributionStartYear = retirementYear; // 은퇴년도 (추가 적립 안함이므로 의미 없음)
        newFormData.contributionEndYear = retirementYear; // 은퇴년도 (추가 적립 안함이므로 의미 없음)
        newFormData.paymentStartYear = retirementYear; // 은퇴년도 즉시 수령
        newFormData.paymentYears = 1; // 은퇴년도 즉시 수령 (한번에 현금으로)
        break;
    }

    setFormData(newFormData);
  };

  // 폼 유효성 검사
  const validateForm = () => {
    const newErrors = {};

    if (!formData.type) {
      newErrors.type = "연금 타입을 선택해주세요.";
    }

    if (!formData.title.trim()) {
      newErrors.title = "연금 항목명을 입력해주세요.";
    }

    if (formData.type === "national") {
      // 국민연금
      if (!formData.monthlyAmount || formData.monthlyAmount < 0) {
        newErrors.monthlyAmount = "월 수령 금액을 입력해주세요.";
      }
      if (formData.startYear > formData.endYear) {
        newErrors.endYear = "종료년도는 시작년도보다 늦어야 합니다.";
      }
    } else if (formData.type === "severance") {
      // 퇴직금/DB형
      if (!formData.averageSalary || formData.averageSalary < 0) {
        newErrors.averageSalary = "평균 임금을 입력해주세요.";
      }
      if (!formData.yearsOfService || formData.yearsOfService < 0) {
        newErrors.yearsOfService = "재직 년도를 입력해주세요.";
      }

      // 추가 적립 안함이 아닐 때만 적립 관련 검증
      if (!formData.noAdditionalContribution) {
        // 적립 금액은 선택사항이므로 검증 제외
        if (formData.contributionAmount && formData.contributionAmount < 0) {
          newErrors.contributionAmount = "적립 금액은 0 이상이어야 합니다.";
        }
        if (formData.contributionStartYear > formData.contributionEndYear) {
          newErrors.contributionEndYear =
            "적립 종료년도는 시작년도보다 늦어야 합니다.";
        }
        if (formData.contributionEndYear > formData.paymentStartYear) {
          newErrors.paymentStartYear =
            "수령 시작년도는 적립 종료년도와 같거나 늦어야 합니다.";
        }
      }

      // 수령 기간 검증
      const paymentYearsNum = parseInt(formData.paymentYears);
      if (!paymentYearsNum || paymentYearsNum <= 0) {
        newErrors.paymentYears = "수령 기간은 1년 이상이어야 합니다.";
      }

      const returnRateNum = parseFloat(formData.returnRate);
      if (isNaN(returnRateNum) || returnRateNum < 0 || returnRateNum > 100) {
        newErrors.returnRate = "투자 수익률은 0-100% 사이여야 합니다.";
      }
    } else {
      // 퇴직연금/개인연금
      if (formData.currentAmount && formData.currentAmount < 0) {
        newErrors.currentAmount = "현재 보유액은 0 이상이어야 합니다.";
      }
      if (!formData.contributionAmount || formData.contributionAmount < 0) {
        newErrors.contributionAmount = "적립 금액을 입력해주세요.";
      }
      if (formData.contributionStartYear > formData.contributionEndYear) {
        newErrors.contributionEndYear =
          "적립 종료년도는 시작년도보다 늦어야 합니다.";
      }

      // 수령 기간 검증
      const paymentYearsNum = parseInt(formData.paymentYears);
      if (!paymentYearsNum || paymentYearsNum <= 0) {
        newErrors.paymentYears = "수령 기간은 1년 이상이어야 합니다.";
      }
      if (formData.contributionEndYear > formData.paymentStartYear) {
        newErrors.paymentStartYear =
          "수령 시작년도는 적립 종료년도와 같거나 늦어야 합니다.";
      }
      const returnRateNum = parseFloat(formData.returnRate);
      if (isNaN(returnRateNum) || returnRateNum < 0 || returnRateNum > 100) {
        newErrors.returnRate = "투자 수익률은 0-100% 사이여야 합니다.";
      }
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

    const pensionData = {
      ...formData,
      monthlyAmount:
        formData.type === "national" ? parseInt(formData.monthlyAmount) : 0,
      inflationRate:
        formData.type === "national" ? parseFloat(formData.inflationRate) : 0,
      currentAmount:
        formData.type !== "national" && formData.currentAmount
          ? parseInt(formData.currentAmount)
          : 0,
      contributionAmount:
        formData.type !== "national" && formData.contributionAmount
          ? parseInt(formData.contributionAmount)
          : 0,
      returnRate:
        formData.type !== "national" ? parseFloat(formData.returnRate) : 0, // 백분율로 저장 (사용 시 /100 해야 함)
      paymentStartYear:
        formData.type !== "national" ? parseInt(formData.paymentStartYear) : 0,
      paymentYears:
        formData.type !== "national" ? parseInt(formData.paymentYears) : 0,
      isFixedContributionEndYearToRetirement:
        formData.type !== "national"
          ? formData.isFixedContributionEndYearToRetirement || false
          : false,
      // 퇴직금/DB형 전용 필드
      averageSalary:
        formData.type === "severance" && formData.averageSalary
          ? parseFloat(formData.averageSalary)
          : 0,
      yearsOfService:
        formData.type === "severance" && formData.yearsOfService
          ? parseFloat(formData.yearsOfService)
          : 0,
      selectedSimulationIds:
        selectedSimulationIds && selectedSimulationIds.length > 0
          ? selectedSimulationIds
          : activeSimulationId
          ? [activeSimulationId]
          : [],
    };

    onSave(pensionData);
    onClose();
  };

  // 모달 닫기 핸들러
  const handleClose = () => {
    const { age65Year, age90Year } = getDefaultYears();
    setFormData({
      type: "",
      title: "",
      monthlyAmount: "",
      startYear: age65Year,
      endYear: age90Year,
      inflationRate: 1.89,
      currentAmount: "",
      contributionAmount: "",
      contributionFrequency: "monthly",
      contributionStartYear: new Date().getFullYear(),
      contributionEndYear: new Date().getFullYear() + 10,
      returnRate: 2.86,
      paymentStartYear: age65Year,
      paymentYears: 10,
      memo: "",
      isFixedContributionEndYearToRetirement: false,
      averageSalary: "",
      yearsOfService: "",
      noAdditionalContribution: false,
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
            {editData ? "연금 수정" : "연금 추가"}
          </h2>
          <button className={styles.closeButton} onClick={handleClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* 연금 타입 선택 */}
          <div className={styles.field}>
            <label className={styles.label}>연금 타입 선택</label>
            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.type === "national"}
                  onChange={(e) =>
                    handleTypeChange(e.target.checked ? "national" : "")
                  }
                  className={styles.checkbox}
                />
                <span className={styles.checkboxText}>국민연금</span>
              </label>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.type === "retirement"}
                  onChange={(e) =>
                    handleTypeChange(e.target.checked ? "retirement" : "")
                  }
                  className={styles.checkbox}
                />
                <span className={styles.checkboxText}>퇴직연금</span>
              </label>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.type === "personal"}
                  onChange={(e) =>
                    handleTypeChange(e.target.checked ? "personal" : "")
                  }
                  className={styles.checkbox}
                />
                <span className={styles.checkboxText}>개인연금</span>
              </label>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.type === "severance"}
                  onChange={(e) =>
                    handleTypeChange(e.target.checked ? "severance" : "")
                  }
                  className={styles.checkbox}
                />
                <span className={styles.checkboxText}>퇴직금/DB</span>
              </label>
            </div>
            {errors.type && (
              <span className={styles.errorText}>{errors.type}</span>
            )}
          </div>

          {/* 연금 타입이 선택된 경우에만 표시 */}
          {formData.type && (
            <>
              {/* 연금 항목명 */}
              <div className={styles.field}>
                <label className={styles.label}>연금 항목명</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className={`${styles.input} ${
                    errors.title ? styles.error : ""
                  }`}
                  placeholder="예: 국민연금, 퇴직연금"
                />
                {errors.title && (
                  <span className={styles.errorText}>{errors.title}</span>
                )}
              </div>

              {formData.type === "national" ? (
                // 국민연금 필드
                <>
                  <div className={styles.field}>
                    <label className={styles.label}>월 수령 금액 (만원)</label>
                    <input
                      type="text"
                      value={formData.monthlyAmount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          monthlyAmount: e.target.value,
                        })
                      }
                      onKeyPress={handleKeyPress}
                      className={`${styles.input} ${
                        errors.monthlyAmount ? styles.error : ""
                      }`}
                      placeholder="예: 100"
                    />
                    {formData.monthlyAmount &&
                      !isNaN(parseInt(formData.monthlyAmount)) && (
                        <div className={styles.amountPreview}>
                          {formatAmountForChart(
                            parseInt(formData.monthlyAmount)
                          )}
                        </div>
                      )}
                    {errors.monthlyAmount && (
                      <span className={styles.errorText}>
                        {errors.monthlyAmount}
                      </span>
                    )}
                  </div>

                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label className={styles.label}>수령 시작년도</label>
                      <input
                        type="text"
                        value={formData.startYear}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            startYear: parseInt(e.target.value) || 0,
                          })
                        }
                        onKeyPress={handleKeyPress}
                        className={styles.input}
                        placeholder="2025"
                      />
                      {/* 수령 시작년도 나이 표시 */}
                      {formData.startYear &&
                        profileData &&
                        profileData.birthYear && (
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
                      <label className={styles.label}>수령 종료년도</label>
                      <input
                        type="text"
                        value={formData.endYear}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            endYear: parseInt(e.target.value) || 0,
                          })
                        }
                        onKeyPress={handleKeyPress}
                        className={`${styles.input} ${
                          errors.endYear ? styles.error : ""
                        }`}
                        placeholder="2045"
                      />
                      {/* 수령 종료년도 나이 표시 */}
                      {formData.endYear &&
                        profileData &&
                        profileData.birthYear && (
                          <div className={styles.agePreview}>
                            {calculateKoreanAge(
                              profileData.birthYear,
                              formData.endYear
                            )}
                            세
                          </div>
                        )}
                      {errors.endYear && (
                        <span className={styles.errorText}>
                          {errors.endYear}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={`${styles.field} ${styles.fieldWithMargin}`}>
                    <label className={styles.label}>물가상승률 (%)</label>
                    <input
                      type="text"
                      value={formData.inflationRate}
                      onChange={(e) => {
                        const value = e.target.value;
                        // 숫자, 소수점, 마이너스 기호 허용 (마이너스는 맨 앞에만)
                        if (value === "" || /^-?\d*\.?\d*$/.test(value)) {
                          setFormData({
                            ...formData,
                            inflationRate: value,
                          });
                        }
                      }}
                      onKeyPress={handleKeyPress}
                      className={`${styles.input} ${
                        errors.inflationRate ? styles.error : ""
                      }`}
                      placeholder="1.89"
                    />
                    {errors.inflationRate && (
                      <span className={styles.errorText}>
                        {errors.inflationRate}
                      </span>
                    )}
                  </div>
                </>
              ) : formData.type === "severance" ? (
                // 퇴직금/DB 필드
                <>
                  {/* 평균 임금 & 재직 년도 (같은 행에 배치) */}
                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label className={styles.label}>
                        평균 임금 (월, 만원)
                      </label>
                      <input
                        type="text"
                        value={formData.averageSalary}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            averageSalary: e.target.value,
                          })
                        }
                        onKeyPress={handleKeyPress}
                        className={`${styles.input} ${
                          errors.averageSalary ? styles.error : ""
                        }`}
                        placeholder="예: 400"
                      />
                      {formData.averageSalary &&
                        !isNaN(parseFloat(formData.averageSalary)) && (
                          <div className={styles.amountPreview}>
                            {formatAmountForChart(
                              parseFloat(formData.averageSalary)
                            )}
                          </div>
                        )}
                      {errors.averageSalary && (
                        <span className={styles.errorText}>
                          {errors.averageSalary}
                        </span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>재직 년도 (년)</label>
                      <input
                        type="text"
                        value={formData.yearsOfService}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            yearsOfService: e.target.value,
                          })
                        }
                        onKeyPress={handleKeyPress}
                        className={`${styles.input} ${
                          errors.yearsOfService ? styles.error : ""
                        }`}
                        placeholder="예: 20"
                      />
                      {errors.yearsOfService && (
                        <span className={styles.errorText}>
                          {errors.yearsOfService}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 자동 계산된 보유액 표시 (읽기 전용) */}
                  <div className={styles.field}>
                    <label className={styles.label}>
                      퇴직금 보유액 (자동 계산, 만원)
                    </label>
                    <input
                      type="text"
                      value={formData.currentAmount}
                      readOnly
                      disabled
                      className={`${styles.input} ${styles.disabled}`}
                      placeholder="평균 임금 × 재직 년도"
                    />
                    {formData.currentAmount &&
                      !isNaN(parseInt(formData.currentAmount)) && (
                        <div className={styles.amountPreview}>
                          {formatAmountForChart(
                            parseInt(formData.currentAmount)
                          )}
                        </div>
                      )}
                  </div>

                  {/* 추가 적립 안함 체크박스 */}
                  <div className={styles.field}>
                    <label className={styles.fixedCheckboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.noAdditionalContribution}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          const retirementYear = getRetirementYear();
                          setFormData({
                            ...formData,
                            noAdditionalContribution: isChecked,
                            contributionAmount: isChecked
                              ? ""
                              : formData.contributionAmount,
                            // 추가 적립 안함 체크 시:
                            // - 적립년도를 은퇴년도로 고정 (시작/종료 모두)
                            // - 수령 시작년도를 은퇴년도로 변경
                            contributionStartYear: isChecked
                              ? retirementYear
                              : formData.contributionStartYear,
                            contributionEndYear: isChecked
                              ? retirementYear
                              : formData.contributionEndYear,
                            paymentStartYear: isChecked
                              ? retirementYear
                              : formData.paymentStartYear,
                          });
                        }}
                        className={styles.fixedCheckbox}
                      />
                      <span className={styles.fixedCheckboxText}>
                        추가 적립 안함 (퇴직금 보유액만으로 수령)
                      </span>
                    </label>
                  </div>

                  {/* 적립 금액 (추가 적립 안함이 체크되지 않았을 때만 표시) */}
                  {!formData.noAdditionalContribution && (
                    <div className={styles.field}>
                      <label className={styles.label}>
                        추가 적립 금액 (만원)
                      </label>
                      <div className={styles.row}>
                        <input
                          type="text"
                          value={formData.contributionAmount}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              contributionAmount: e.target.value,
                            })
                          }
                          onKeyPress={handleKeyPress}
                          className={`${styles.input} ${
                            errors.contributionAmount ? styles.error : ""
                          }`}
                          placeholder="예: 50 (선택사항)"
                        />
                        <select
                          value={formData.contributionFrequency}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              contributionFrequency: e.target.value,
                            })
                          }
                          className={styles.select}
                        >
                          <option value="monthly">월</option>
                          <option value="yearly">년</option>
                        </select>
                      </div>
                      {formData.contributionAmount &&
                        !isNaN(parseInt(formData.contributionAmount)) && (
                          <div className={styles.amountPreview}>
                            {formatAmountForChart(
                              parseInt(formData.contributionAmount)
                            )}
                          </div>
                        )}
                      {errors.contributionAmount && (
                        <span className={styles.errorText}>
                          {errors.contributionAmount}
                        </span>
                      )}
                    </div>
                  )}

                  {/* 적립년도 (시작, 종료) - 추가 적립 안함이 체크되지 않았을 때만 표시 */}
                  {!formData.noAdditionalContribution && (
                    <div className={styles.row}>
                      <div className={styles.field}>
                        <label className={styles.label}>적립 시작년도</label>
                        <input
                          type="text"
                          value={formData.contributionStartYear}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              contributionStartYear:
                                parseInt(e.target.value) || 0,
                            })
                          }
                          onKeyPress={handleKeyPress}
                          className={styles.input}
                          placeholder="은퇴년도"
                        />
                        {/* 적립 시작년도 나이 표시 */}
                        {formData.contributionStartYear &&
                          profileData &&
                          profileData.birthYear && (
                            <div className={styles.agePreview}>
                              {calculateKoreanAge(
                                profileData.birthYear,
                                formData.contributionStartYear
                              )}
                              세
                            </div>
                          )}
                      </div>

                      <div className={styles.field}>
                        <label className={styles.label}>적립 종료년도</label>
                        <input
                          type="text"
                          value={formData.contributionEndYear}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              contributionEndYear:
                                parseInt(e.target.value) || 0,
                            })
                          }
                          onKeyPress={handleKeyPress}
                          className={`${styles.input} ${
                            errors.contributionEndYear ? styles.error : ""
                          }`}
                          placeholder="은퇴년도"
                        />
                        {/* 적립 종료년도 나이 표시 */}
                        {formData.contributionEndYear &&
                          profileData &&
                          profileData.birthYear && (
                            <div className={styles.agePreview}>
                              {calculateKoreanAge(
                                profileData.birthYear,
                                formData.contributionEndYear
                              )}
                              세
                            </div>
                          )}
                        {errors.contributionEndYear && (
                          <span className={styles.errorText}>
                            {errors.contributionEndYear}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 투자 수익률 */}
                  <div className={`${styles.field} ${styles.fieldWithMargin}`}>
                    <label className={styles.label}>투자 수익률 (%)</label>
                    <input
                      type="text"
                      value={formData.returnRate}
                      onChange={(e) => {
                        const value = e.target.value;
                        // 숫자, 소수점, 마이너스 기호 허용 (마이너스는 맨 앞에만)
                        if (value === "" || /^-?\d*\.?\d*$/.test(value)) {
                          setFormData({
                            ...formData,
                            returnRate: value,
                          });
                        }
                      }}
                      onKeyPress={handleKeyPress}
                      className={`${styles.input} ${
                        errors.returnRate ? styles.error : ""
                      }`}
                      placeholder="2.86"
                    />
                    {errors.returnRate && (
                      <span className={styles.errorText}>
                        {errors.returnRate}
                      </span>
                    )}
                  </div>

                  {/* 수령년도 (시작, 종료) */}
                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label className={styles.label}>수령 시작년도</label>
                      <input
                        type="text"
                        value={formData.paymentStartYear}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            paymentStartYear: e.target.value,
                          })
                        }
                        onKeyPress={handleKeyPress}
                        className={`${styles.input} ${
                          errors.paymentStartYear ? styles.error : ""
                        }`}
                        placeholder="은퇴년도 + 1"
                      />
                      {/* 수령 시작년도 나이 표시 */}
                      {formData.paymentStartYear &&
                        profileData &&
                        profileData.birthYear && (
                          <div className={styles.agePreview}>
                            {calculateKoreanAge(
                              profileData.birthYear,
                              formData.paymentStartYear
                            )}
                            세
                          </div>
                        )}
                      {errors.paymentStartYear && (
                        <span className={styles.errorText}>
                          {errors.paymentStartYear}
                        </span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>수령 기간(년)</label>
                      <input
                        type="text"
                        value={formData.paymentYears}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            paymentYears: e.target.value,
                          })
                        }
                        onKeyPress={handleKeyPress}
                        className={`${styles.input} ${
                          errors.paymentYears ? styles.error : ""
                        }`}
                        placeholder="예: 10"
                      />
                      {errors.paymentYears && (
                        <span className={styles.errorText}>
                          {errors.paymentYears}
                        </span>
                      )}
                      <div className={styles.helperText}>PMT 방식</div>
                    </div>
                  </div>
                </>
              ) : (
                // 퇴직연금/개인연금 필드
                <>
                  {/* 현재 보유액 */}
                  <div className={styles.field}>
                    <label className={styles.label}>현재 보유액 (만원)</label>
                    <input
                      type="text"
                      value={formData.currentAmount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          currentAmount: e.target.value,
                        })
                      }
                      onKeyPress={handleKeyPress}
                      className={`${styles.input} ${
                        errors.currentAmount ? styles.error : ""
                      }`}
                      placeholder="예: 1000 (선택사항)"
                    />
                    {formData.currentAmount &&
                      !isNaN(parseInt(formData.currentAmount)) && (
                        <div className={styles.amountPreview}>
                          {formatAmountForChart(
                            parseInt(formData.currentAmount)
                          )}
                        </div>
                      )}
                    {errors.currentAmount && (
                      <span className={styles.errorText}>
                        {errors.currentAmount}
                      </span>
                    )}
                  </div>

                  {/* 적립 금액 */}
                  <div className={styles.field}>
                    <label className={styles.label}>적립 금액 (만원)</label>
                    <div className={styles.row}>
                      <input
                        type="text"
                        value={formData.contributionAmount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contributionAmount: e.target.value,
                          })
                        }
                        onKeyPress={handleKeyPress}
                        className={`${styles.input} ${
                          errors.contributionAmount ? styles.error : ""
                        }`}
                        placeholder="예: 50"
                      />
                      <select
                        value={formData.contributionFrequency}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contributionFrequency: e.target.value,
                          })
                        }
                        className={styles.select}
                      >
                        <option value="monthly">월</option>
                        <option value="yearly">년</option>
                      </select>
                    </div>
                    {formData.contributionAmount &&
                      !isNaN(parseInt(formData.contributionAmount)) && (
                        <div className={styles.amountPreview}>
                          {formatAmountForChart(
                            parseInt(formData.contributionAmount)
                          )}
                        </div>
                      )}
                    {errors.contributionAmount && (
                      <span className={styles.errorText}>
                        {errors.contributionAmount}
                      </span>
                    )}
                  </div>

                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label className={styles.label}>적립 시작년도</label>
                      <input
                        type="text"
                        value={formData.contributionStartYear}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contributionStartYear:
                              parseInt(e.target.value) || 0,
                          })
                        }
                        onKeyPress={handleKeyPress}
                        className={styles.input}
                        placeholder="2025"
                      />
                      {/* 적립 시작년도 나이 표시 */}
                      {formData.contributionStartYear &&
                        profileData &&
                        profileData.birthYear && (
                          <div className={styles.agePreview}>
                            {calculateKoreanAge(
                              profileData.birthYear,
                              formData.contributionStartYear
                            )}
                            세
                          </div>
                        )}
                    </div>

                    <div className={styles.field}>
                      <div className={styles.endYearWrapper}>
                        <label className={styles.label}>적립 종료년도</label>
                        <label className={styles.fixedCheckboxLabel}>
                          <input
                            type="checkbox"
                            checked={
                              formData.isFixedContributionEndYearToRetirement
                            }
                            onChange={(e) => {
                              const isFixed = e.target.checked;
                              setFormData({
                                ...formData,
                                isFixedContributionEndYearToRetirement: isFixed,
                                // 체크 시 은퇴년도로 자동 설정
                                contributionEndYear: isFixed
                                  ? getRetirementYear()
                                  : formData.contributionEndYear,
                              });
                            }}
                            className={styles.fixedCheckbox}
                          />
                          <span className={styles.fixedCheckboxText}>
                            은퇴 년도 고정
                          </span>
                        </label>
                      </div>
                      <input
                        type="text"
                        value={formData.contributionEndYear}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setFormData({
                            ...formData,
                            contributionEndYear: value,
                            // 수동으로 변경하면 고정 해제
                            isFixedContributionEndYearToRetirement: false,
                          });
                        }}
                        disabled={
                          formData.isFixedContributionEndYearToRetirement
                        }
                        onKeyPress={handleKeyPress}
                        className={`${styles.input} ${
                          errors.contributionEndYear ? styles.error : ""
                        } ${
                          formData.isFixedContributionEndYearToRetirement
                            ? styles.disabled
                            : ""
                        }`}
                        placeholder="2035"
                      />
                      {/* 적립 종료년도 나이 표시 */}
                      {formData.contributionEndYear &&
                        profileData &&
                        profileData.birthYear && (
                          <div className={styles.agePreview}>
                            {calculateKoreanAge(
                              profileData.birthYear,
                              formData.contributionEndYear
                            )}
                            세
                          </div>
                        )}
                      {errors.contributionEndYear && (
                        <span className={styles.errorText}>
                          {errors.contributionEndYear}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={`${styles.row} ${styles.rowWithMargin}`}>
                    <div className={styles.field}>
                      <label className={styles.label}>투자 수익률 (%)</label>
                      <input
                        type="text"
                        value={formData.returnRate}
                        onChange={(e) => {
                          const value = e.target.value;
                          // 숫자, 소수점, 마이너스 기호 허용 (마이너스는 맨 앞에만)
                          if (value === "" || /^-?\d*\.?\d*$/.test(value)) {
                            setFormData({
                              ...formData,
                              returnRate: value,
                            });
                          }
                        }}
                        onKeyPress={handleKeyPress}
                        className={`${styles.input} ${
                          errors.returnRate ? styles.error : ""
                        }`}
                        placeholder="2.86"
                      />
                      {errors.returnRate && (
                        <span className={styles.errorText}>
                          {errors.returnRate}
                        </span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>수령 시작년도</label>
                      <input
                        type="text"
                        value={formData.paymentStartYear}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            paymentStartYear: e.target.value,
                          })
                        }
                        onKeyPress={handleKeyPress}
                        className={`${styles.input} ${
                          errors.paymentStartYear ? styles.error : ""
                        }`}
                        placeholder="2041"
                      />
                      {/* 수령 시작년도 나이 표시 */}
                      {formData.paymentStartYear &&
                        profileData &&
                        profileData.birthYear && (
                          <div className={styles.agePreview}>
                            {calculateKoreanAge(
                              profileData.birthYear,
                              formData.paymentStartYear
                            )}
                            세
                          </div>
                        )}
                      {errors.paymentStartYear && (
                        <span className={styles.errorText}>
                          {errors.paymentStartYear}
                        </span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>수령 기간(년)</label>
                      <input
                        type="text"
                        value={formData.paymentYears}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            paymentYears: e.target.value,
                          })
                        }
                        onKeyPress={handleKeyPress}
                        className={`${styles.input} ${
                          errors.paymentYears ? styles.error : ""
                        }`}
                        placeholder="예: 10"
                      />
                      {errors.paymentYears && (
                        <span className={styles.errorText}>
                          {errors.paymentYears}
                        </span>
                      )}
                      <div className={styles.helperText}>PMT 방식</div>
                    </div>
                  </div>
                </>
              )}

              {/* 메모 */}
              <div className={`${styles.field} ${styles.fieldWithMargin}`}>
                <label className={styles.label}>메모</label>
                <textarea
                  value={formData.memo}
                  onChange={(e) =>
                    setFormData({ ...formData, memo: e.target.value })
                  }
                  className={styles.textarea}
                  placeholder="추가 정보를 입력하세요"
                  rows={3}
                />
              </div>

              {/* 적용할 시뮬레이션 선택 (하단 영역) */}
              {simulations && simulations.length > 0 && (
                <div className={styles.field}>
                  <label className={styles.label}>
                    적용할 시뮬레이션
                    {editData && (
                      <span className={styles.hintText}>
                        {" "}
                        (동일한 항목이 있는 시뮬레이션만 표시됨)
                      </span>
                    )}
                  </label>
                  <div>
                    {isSimSelectionLoading ? (
                      <span className={styles.hintText}>
                        시뮬레이션 목록 불러오는 중…
                      </span>
                    ) : (
                      simulations
                        .filter((sim) =>
                          editData
                            ? availableSimulationIds.includes(sim.id)
                            : true
                        )
                        .map((sim) => (
                          <label
                            key={sim.id}
                            className={styles.fixedCheckboxLabel}
                          >
                            <input
                              type="checkbox"
                              checked={selectedSimulationIds.includes(sim.id)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setSelectedSimulationIds((prev) => {
                                  if (checked)
                                    return Array.from(
                                      new Set([...(prev || []), sim.id])
                                    );
                                  return (prev || []).filter(
                                    (id) => id !== sim.id
                                  );
                                });
                              }}
                              className={styles.fixedCheckbox}
                            />
                            <span className={styles.fixedCheckboxText}>
                              {sim.title ||
                                (sim.isDefault ? "현재" : "시뮬레이션")}
                            </span>
                          </label>
                        ))
                    )}
                  </div>
                </div>
              )}

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
            </>
          )}
        </form>
      </div>
    </div>
  );
}

export default PensionModal;
