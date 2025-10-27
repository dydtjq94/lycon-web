import React, { useState, useEffect } from "react";
import styles from "./PensionModal.module.css";
import { formatAmountForChart } from "../../utils/format";
import { calculateKoreanAge } from "../../utils/koreanAge";

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
}) {
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
    type: "", // national, retirement, personal
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
    paymentEndYear: age90Year, // 수령 종료년도
    memo: "",
  });

  const [errors, setErrors] = useState({});

  // 수정 모드일 때 데이터 로드, 모달이 열릴 때마다 초기화
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          type: editData.type || "national",
          title: editData.title || "",
          monthlyAmount: editData.monthlyAmount || "",
          startYear: editData.startYear || new Date().getFullYear(),
          endYear: editData.endYear || new Date().getFullYear() + 20,
          currentAmount: editData.currentAmount || "",
          contributionAmount: editData.contributionAmount || "",
          contributionFrequency: editData.contributionFrequency || "monthly",
          contributionStartYear:
            editData.contributionStartYear || new Date().getFullYear(),
          contributionEndYear:
            editData.contributionEndYear || new Date().getFullYear() + 10,
          returnRate: editData.returnRate || 2.86,
          paymentStartYear:
            editData.paymentStartYear || new Date().getFullYear() + 11,
          paymentEndYear:
            editData.paymentEndYear || new Date().getFullYear() + 20,
          memo: editData.memo || "",
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
          paymentEndYear: age90Year,
          memo: "",
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
    const retirementAge = profileData?.retirementAge || 54;
    const retirementYear = birthYear + retirementAge; // 은퇴 년도
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
        break;
      case "retirement":
        newFormData.title = "퇴직연금";
        newFormData.contributionEndYear = retirementYear; // 은퇴 나이까지 적립
        newFormData.paymentStartYear = retirementYearPlus1; // 은퇴 나이 + 1부터 수령
        newFormData.paymentEndYear = paymentEndYear; // 10년간 수령
        break;
      case "personal":
        newFormData.title = "개인연금";
        newFormData.contributionEndYear = retirementYear; // 은퇴 나이까지 적립
        newFormData.paymentStartYear = retirementYearPlus1; // 은퇴 나이 + 1부터 수령
        newFormData.paymentEndYear = paymentEndYear; // 10년간 수령
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
      if (formData.paymentStartYear > formData.paymentEndYear) {
        newErrors.paymentEndYear =
          "수령 종료년도는 시작년도보다 늦어야 합니다.";
      }
      if (formData.contributionEndYear >= formData.paymentStartYear) {
        newErrors.paymentStartYear =
          "수령 시작년도는 적립 종료년도보다 늦어야 합니다.";
      }
      if (formData.returnRate < 0 || formData.returnRate > 100) {
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
        formData.type !== "national"
          ? parseInt(formData.contributionAmount)
          : 0,
      returnRate:
        formData.type !== "national" ? parseFloat(formData.returnRate) : 0,
      paymentStartYear:
        formData.type !== "national" ? parseInt(formData.paymentStartYear) : 0,
      paymentEndYear:
        formData.type !== "national" ? parseInt(formData.paymentEndYear) : 0,
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
      paymentEndYear: age90Year,
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
              ) : (
                // 퇴직연금/개인연금 필드
                <>
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
                      <label className={styles.label}>적립 종료년도</label>
                      <input
                        type="text"
                        value={formData.contributionEndYear}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contributionEndYear: parseInt(e.target.value) || 0,
                          })
                        }
                        onKeyPress={handleKeyPress}
                        className={`${styles.input} ${
                          errors.contributionEndYear ? styles.error : ""
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
                      <label className={styles.label}>수령 종료년도</label>
                      <input
                        type="text"
                        value={formData.paymentEndYear}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            paymentEndYear: e.target.value,
                          })
                        }
                        onKeyPress={handleKeyPress}
                        className={`${styles.input} ${
                          errors.paymentEndYear ? styles.error : ""
                        }`}
                        placeholder="2050"
                      />
                      {/* 수령 종료년도 나이 표시 */}
                      {formData.paymentEndYear &&
                        profileData &&
                        profileData.birthYear && (
                          <div className={styles.agePreview}>
                            {calculateKoreanAge(
                              profileData.birthYear,
                              formData.paymentEndYear
                            )}
                            세
                          </div>
                        )}
                      {errors.paymentEndYear && (
                        <span className={styles.errorText}>
                          {errors.paymentEndYear}
                        </span>
                      )}
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
