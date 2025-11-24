import React, { useState, useEffect } from "react";
import styles from "./TemplateEditorModal.module.css";

/**
 * 재무 라이브러리 템플릿 생성/편집 모달
 * 관리자가 새로운 템플릿을 추가하거나 기존 템플릿을 수정할 수 있습니다.
 * 
 * 카테고리별 동작:
 * - 소득/지출: 나이 범위 기반, 가족 구성원 타입 선택
 * - 저축/투자: 저축/투자 모달의 모든 필드 입력 (나이/가족 타입 무관)
 */
function TemplateEditorModal({ isOpen, onClose, onSave, editData = null }) {
  const [formData, setFormData] = useState({
    title: "",
    category: "expense", // 기본값: 지출
    familyMemberType: ["self"], // 배열로 변경
    ageStart: null,
    ageEnd: null,
    autoApply: false,
    data: {
      // 소득/지출 공통 필드
      frequency: "monthly",
      amount: "",
      memo: "",
      growthRate: "0",
      
      // 저축/투자 전용 필드
      savingType: "standard", // "standard" (가치성장형) 또는 "income" (수익형)
      currentAmount: "", // 현재 보유 금액
      treatAsInitialPurchase: false, // 현재 보유 금액을 구매로 처리할지 여부
      startYear: new Date().getFullYear(), // 시작년도
      endYear: new Date().getFullYear() + 10, // 종료년도
      interestRate: "2.86", // 연평균 수익률
      yearlyGrowthRate: "1.89", // 연간 저축/투자금액 증가율
      incomeRate: "3", // 수익형: 연간 수익률
      capitalGainsTaxRate: "", // 양도세율
      isFixedToRetirementYear: false, // 은퇴년도 고정 여부
    },
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 카테고리 목록 (소득/지출/저축투자)
  const categories = [
    { value: "income", label: "소득" },
    { value: "expense", label: "지출" },
    { value: "saving", label: "저축/투자" },
  ];

  // 가족 구성원 타입 목록
  const familyTypes = [
    { value: "self", label: "본인" },
    { value: "spouse", label: "배우자" },
    { value: "son", label: "아들" },
    { value: "daughter", label: "딸" },
    { value: "father", label: "부" },
    { value: "mother", label: "모" },
  ];

  // 수정 모드일 때 데이터 로드
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          title: editData.title || "",
          category: editData.category || "income",
          familyMemberType: Array.isArray(editData.familyMemberType)
            ? editData.familyMemberType
            : [editData.familyMemberType || "self"], // 배열로 변환
          ageStart: editData.ageStart,
          ageEnd: editData.ageEnd,
          autoApply: editData.autoApply || false,
          data: {
            frequency: editData.data?.frequency || "monthly",
            amount: editData.data?.amount || "",
            memo: editData.data?.memo || "",
            growthRate: editData.data?.growthRate?.toString() || "0",
            
            // 저축/투자 필드
            savingType: editData.data?.savingType || "standard",
            currentAmount: editData.data?.currentAmount || "",
            treatAsInitialPurchase: editData.data?.treatAsInitialPurchase || false,
            startYear: editData.data?.startYear || new Date().getFullYear(),
            endYear: editData.data?.endYear || new Date().getFullYear() + 10,
            interestRate: editData.data?.interestRate?.toString() || "2.86",
            yearlyGrowthRate: editData.data?.yearlyGrowthRate?.toString() || "1.89",
            incomeRate: editData.data?.incomeRate?.toString() || "3",
            capitalGainsTaxRate: editData.data?.capitalGainsTaxRate?.toString() || "",
            isFixedToRetirementYear: editData.data?.isFixedToRetirementYear || false,
          },
        });
      } else {
        // 초기화
        setFormData({
          title: "",
          category: "expense", // 기본값: 지출
          familyMemberType: ["self"], // 배열로 변경
          ageStart: null,
          ageEnd: null,
          autoApply: false,
          data: {
            frequency: "monthly",
            amount: "",
            memo: "",
            growthRate: "0",
            
            // 저축/투자 필드
            savingType: "standard",
            currentAmount: "",
            treatAsInitialPurchase: false,
            startYear: new Date().getFullYear(),
            endYear: new Date().getFullYear() + 10,
            interestRate: "2.86",
            yearlyGrowthRate: "1.89",
            incomeRate: "3",
            capitalGainsTaxRate: "",
            isFixedToRetirementYear: false,
          },
        });
      }
      setErrors({});
    }
  }, [isOpen, editData]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        e.stopPropagation(); // 이벤트 전파 차단
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

  // 입력 변경 핸들러
  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // 에러 제거
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // 데이터 필드 변경 핸들러
  const handleDataChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value,
      },
    }));
  };

  // 유효성 검사: 필수 입력 및 숫자값 검증
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "제목을 입력해주세요.";
    }

    const amountValue = Number(formData.data.amount);
    // 숫자가 아니거나 비어 있으면 에러 처리 (저축/투자에서도 최소 0원은 허용)
    if (formData.data.amount === "" || Number.isNaN(amountValue)) {
      newErrors.amount = "금액을 숫자로 입력해주세요.";
    } else {
      // 저축/투자는 0원 이상, 소득/지출은 1원 이상만 허용
      if (formData.category === "saving" && amountValue < 0) {
        newErrors.amount = "0원 이상 입력해주세요.";
      }
      if (formData.category !== "saving" && amountValue <= 0) {
        newErrors.amount = "0보다 큰 금액을 입력해주세요.";
      }
    }

    // 저축/투자가 아닐 때만 나이 범위 검증
    if (formData.category !== "saving") {
    if (formData.ageStart !== null && formData.ageEnd !== null) {
      const start = parseInt(formData.ageStart);
      const end = parseInt(formData.ageEnd);
      if (start > end) {
        newErrors.ageRange = "시작 나이는 종료 나이보다 작아야 합니다.";
        }
      }
    }
    
    // 저축/투자일 때 년도 범위 검증
    if (formData.category === "saving") {
      if (parseInt(formData.data.startYear) > parseInt(formData.data.endYear)) {
        newErrors.yearRange = "시작년도는 종료년도보다 작아야 합니다.";
      }
      
      // 수익형일 때 incomeRate 검증
      if (formData.data.savingType === "income") {
        const incomeRateNum = parseFloat(formData.data.incomeRate);
        if (
          isNaN(incomeRateNum) ||
          incomeRateNum < -100 ||
          incomeRateNum > 1000
        ) {
          newErrors.incomeRate = "수익률은 -100%와 1000% 사이의 숫자여야 합니다.";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 저장
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // 데이터 정리
      const templateData = {
        title: formData.title.trim(),
        category: formData.category,
        autoApply: formData.autoApply,
      };
      
      // 저축/투자일 때는 familyMemberType과 나이 범위 제외
      if (formData.category === "saving") {
        templateData.familyMemberType = null; // 저축/투자는 가족 구성원 타입 없음
        templateData.ageStart = null;
        templateData.ageEnd = null;
        templateData.data = {
          // 저축/투자 모달의 모든 필드
          savingType: formData.data.savingType,
          frequency: formData.data.frequency,
          amount: parseFloat(formData.data.amount),
          currentAmount: formData.data.currentAmount
            ? parseFloat(formData.data.currentAmount)
            : 0,
          treatAsInitialPurchase: formData.data.treatAsInitialPurchase || false,
          startYear: parseInt(formData.data.startYear),
          endYear: parseInt(formData.data.endYear),
          memo: formData.data.memo.trim(),
          interestRate: parseFloat(formData.data.interestRate),
          yearlyGrowthRate: parseFloat(formData.data.yearlyGrowthRate),
          incomeRate:
            formData.data.savingType === "income"
              ? parseFloat(formData.data.incomeRate)
              : 0,
          capitalGainsTaxRate: formData.data.capitalGainsTaxRate
            ? parseFloat(formData.data.capitalGainsTaxRate)
            : 0,
          isFixedToRetirementYear: formData.data.isFixedToRetirementYear || false,
        };
      } else {
        // 소득/지출일 때는 기존 로직
        templateData.familyMemberType = formData.familyMemberType;
        templateData.ageStart =
          formData.ageStart === "" || formData.ageStart === null
            ? null
            : parseInt(formData.ageStart);
        templateData.ageEnd =
          formData.ageEnd === "" || formData.ageEnd === null
            ? null
            : parseInt(formData.ageEnd);
        templateData.data = {
          frequency: formData.data.frequency,
          // 0원도 허용하기 위해 Number 변환 (NaN은 위 검증에서 걸러짐)
          amount: Number(formData.data.amount),
          memo: formData.data.memo.trim(),
          growthRate: parseFloat(formData.data.growthRate) || 0,
        };
      }

      // 수정 모드일 경우 id 포함
      if (editData && editData.id) {
        templateData.id = editData.id;
      }

      await onSave(templateData);
      onClose();
    } catch (error) {
      console.error("템플릿 저장 오류:", error);
      setErrors({ form: "저장 중 오류가 발생했습니다." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // 저축/투자 카테고리인지 확인
  const isSaving = formData.category === "saving";

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            {editData ? "템플릿 수정" : "새 템플릿 추가"}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {errors.form && (
            <div className={styles.errorBanner}>{errors.form}</div>
          )}

          <div className={styles.formContent}>
            {/* 기본 정보 */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>기본 정보</h3>

              {/* 제목 */}
              <div className={styles.field}>
                <label className={styles.label}>
                  템플릿 제목 <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder={
                    isSaving
                      ? "예: 퇴직연금 적립"
                      : "예: 초등학교 교육비"
                  }
                />
                {errors.title && (
                  <span className={styles.error}>{errors.title}</span>
                )}
              </div>

              {/* 카테고리 */}
              <div className={styles.field}>
                <label className={styles.label}>
                  카테고리 <span className={styles.required}>*</span>
                </label>
                <div className={styles.tabButtons}>
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      className={`${styles.tabButton} ${
                        formData.category === cat.value
                          ? styles.tabButtonActive
                          : ""
                      }`}
                      onClick={() => handleChange("category", cat.value)}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 소득/지출일 때만 가족 구성원 타입 표시 */}
              {!isSaving && (
              <div className={styles.field}>
                <label className={styles.label}>
                  적용 대상 <span className={styles.required}>*</span>
                  <span className={styles.hint}>(여러 개 선택 가능)</span>
                </label>
                <div className={styles.familyTypeButtons}>
                  {familyTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      className={`${styles.familyTypeButton} ${
                        formData.familyMemberType.includes(type.value)
                          ? styles.familyTypeButtonActive
                          : ""
                      }`}
                      onClick={() => {
                        const currentTypes = formData.familyMemberType;
                        if (currentTypes.includes(type.value)) {
                          // 이미 선택되어 있으면 제거
                          handleChange(
                            "familyMemberType",
                            currentTypes.filter((t) => t !== type.value)
                          );
                        } else {
                          // 선택되어 있지 않으면 추가
                          handleChange("familyMemberType", [
                            ...currentTypes,
                            type.value,
                          ]);
                        }
                      }}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
                {errors.familyMemberType && (
                  <span className={styles.error}>
                    {errors.familyMemberType}
                  </span>
                )}
              </div>
              )}
            </div>

            {/* 저축/투자일 때는 저축/투자 전용 필드 표시 */}
            {isSaving ? (
              <>
                {/* 저축/투자 타입 */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>저축/투자 타입</h3>
                  <div className={styles.field}>
                    <div className={styles.radioGroup}>
                      <label className={styles.radioLabel}>
                        <input
                          type="radio"
                          name="savingType"
                          value="standard"
                          checked={formData.data.savingType === "standard"}
                          onChange={(e) =>
                            handleDataChange("savingType", e.target.value)
                          }
                        />
                        <span className={styles.radioText}>
                          가치성장형 (정기예금, 성장주, 금, 암호화폐 등)
                        </span>
                      </label>
                      <label className={styles.radioLabel}>
                        <input
                          type="radio"
                          name="savingType"
                          value="income"
                          checked={formData.data.savingType === "income"}
                          onChange={(e) =>
                            handleDataChange("savingType", e.target.value)
                          }
                        />
                        <span className={styles.radioText}>
                          수익형 (이자, 배당, 채권 등)
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 주기와 금액 */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>금액 정보</h3>
                  
                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.label}>
                        주기 <span className={styles.required}>*</span>
                      </label>
                      <select
                        className={styles.select}
                        value={formData.data.frequency}
                        onChange={(e) =>
                          handleDataChange("frequency", e.target.value)
                        }
                      >
                        <option value="monthly">월</option>
                        <option value="yearly">년</option>
                        <option value="one_time">일시납</option>
                      </select>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>
                        금액 (만원) <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="number"
                        className={styles.input}
                        value={formData.data.amount}
                        onChange={(e) => handleDataChange("amount", e.target.value)}
                        onWheel={(e) => e.target.blur()}
                        placeholder="예: 100"
                        min="0"
                        step="0.1"
                      />
                      {errors.amount && (
                        <span className={styles.error}>{errors.amount}</span>
                      )}
                    </div>
                  </div>

                  {/* 현재 보유 금액 */}
                  <div className={styles.field}>
                    <div className={styles.fieldHeader}>
                      <label className={styles.label}>
                        기 보유 금액 (만원)
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={formData.data.treatAsInitialPurchase}
                          onChange={(e) =>
                            handleDataChange("treatAsInitialPurchase", e.target.checked)
                          }
                          className={styles.checkbox}
                        />
                        <span>현금유출로 처리</span>
                      </label>
                    </div>
                    <input
                      type="number"
                      className={styles.input}
                      value={formData.data.currentAmount}
                      onChange={(e) =>
                        handleDataChange("currentAmount", e.target.value)
                      }
                      onWheel={(e) => e.target.blur()}
                      placeholder="예: 500"
                      min="0"
                      step="0.1"
                    />
                    <span className={styles.hint}>
                      시작년도 기준으로 이미 보유하고 있는 금액 (선택사항)
                    </span>
                  </div>
                </div>

                {/* 기간 */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>기간</h3>
                  
                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.label}>
                        시작년도 <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="number"
                        className={styles.input}
                        value={formData.data.startYear}
                        onChange={(e) =>
                          handleDataChange("startYear", e.target.value)
                        }
                        onWheel={(e) => e.target.blur()}
                        placeholder="2025"
                        min="1900"
                        max="2100"
                      />
                    </div>

                    <div className={styles.field}>
                      <div className={styles.fieldHeader}>
                        <label className={styles.label}>
                          종료년도 <span className={styles.required}>*</span>
                        </label>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={formData.data.isFixedToRetirementYear}
                            onChange={(e) =>
                              handleDataChange("isFixedToRetirementYear", e.target.checked)
                            }
                            className={styles.checkbox}
                          />
                          <span>은퇴 시점 고정</span>
                        </label>
                      </div>
                      <input
                        type="number"
                        className={styles.input}
                        value={formData.data.endYear}
                        onChange={(e) =>
                          handleDataChange("endYear", e.target.value)
                        }
                        onWheel={(e) => e.target.blur()}
                        disabled={formData.data.isFixedToRetirementYear}
                        placeholder="2035"
                        min="1900"
                        max="2100"
                      />
                      {errors.yearRange && (
                        <span className={styles.error}>{errors.yearRange}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 수익률 */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>수익률</h3>
                  
                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.label}>연평균 수익률 (%)</label>
                      <input
                        type="number"
                        className={styles.input}
                        value={formData.data.interestRate}
                        onChange={(e) =>
                          handleDataChange("interestRate", e.target.value)
                        }
                        onWheel={(e) => e.target.blur()}
                        placeholder="2.86"
                        step="0.01"
                      />
                    </div>

                    {formData.data.frequency !== "one_time" && (
                      <div className={styles.field}>
                        <label className={styles.label}>
                          저축/투자액 증가율 (%)
                        </label>
                        <input
                          type="number"
                          className={styles.input}
                          value={formData.data.yearlyGrowthRate}
                          onChange={(e) =>
                            handleDataChange("yearlyGrowthRate", e.target.value)
                          }
                          onWheel={(e) => e.target.blur()}
                          placeholder="1.89"
                          step="0.01"
                        />
                      </div>
                    )}
                  </div>

                  {/* 수익형일 때만 수익률 표시 */}
                  {formData.data.savingType === "income" && (
                    <div className={styles.field}>
                      <label className={styles.label}>
                        연간 수익률 (배당, 이자 등) (%) <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="number"
                        className={styles.input}
                        value={formData.data.incomeRate}
                        onChange={(e) =>
                          handleDataChange("incomeRate", e.target.value)
                        }
                        onWheel={(e) => e.target.blur()}
                        placeholder="3"
                        step="0.01"
                      />
                      {errors.incomeRate && (
                        <span className={styles.error}>{errors.incomeRate}</span>
                      )}
                      <span className={styles.hint}>
                        매년 자산 가치의 일정 비율을 현금 수입으로 받습니다.
                      </span>
                    </div>
                  )}

                  {/* 양도세율 */}
                  <div className={styles.field}>
                    <label className={styles.label}>양도세율 (%)</label>
                    <input
                      type="number"
                      className={styles.input}
                      value={formData.data.capitalGainsTaxRate}
                      onChange={(e) =>
                        handleDataChange("capitalGainsTaxRate", e.target.value)
                      }
                      onWheel={(e) => e.target.blur()}
                      placeholder={
                        formData.data.savingType === "income"
                          ? "예: 15.4 (배당소득세 + 지방세)"
                          : "예: 22"
                      }
                      step="0.01"
                      min="0"
                      max="100"
                    />
                    <span className={styles.hint}>
                      {formData.data.savingType === "income"
                        ? "종료년도에 (최종가치 - 원금) × 양도세율을 세금으로 납부합니다."
                        : "종료년도에 (최종가치 - 원금) × 양도세율을 세금으로 납부합니다."}
                    </span>
                  </div>
                </div>

                {/* 메모 */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>메모</h3>
                  <div className={styles.field}>
                    <textarea
                      className={styles.textarea}
                      value={formData.data.memo}
                      onChange={(e) => handleDataChange("memo", e.target.value)}
                      placeholder="수익률 : 2020년부터 2024년까지의 5년간 퇴직연금의 연환산수익률&#10;증가율 : 연간 저축/투자금액 증가율 (%) → 1.89%"
                      rows={3}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* 소득/지출일 때는 나이 범위와 기존 필드 표시 */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>나이 범위 (선택)</h3>
              <p className={styles.sectionDescription}>
                특정 나이 범위에만 적용되는 템플릿일 경우 입력하세요.
                <br />
                예: 초등학교 교육비는 7~12세
              </p>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label}>시작 나이</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={formData.ageStart === null ? "" : formData.ageStart}
                    onChange={(e) =>
                      handleChange("ageStart", e.target.value || null)
                    }
                    onWheel={(e) => e.target.blur()}
                    placeholder="예: 7"
                    min="0"
                    max="150"
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>종료 나이</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={formData.ageEnd === null ? "" : formData.ageEnd}
                    onChange={(e) =>
                      handleChange("ageEnd", e.target.value || null)
                    }
                    onWheel={(e) => e.target.blur()}
                    placeholder="예: 12"
                    min="0"
                    max="150"
                  />
                </div>
              </div>
              {errors.ageRange && (
                <span className={styles.error}>{errors.ageRange}</span>
              )}
            </div>

            {/* 재무 데이터 */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>재무 데이터</h3>
              <p className={styles.sectionDescription}>
                💡 <strong>현재 기준 가치로 입력하세요.</strong>
                <br />
                템플릿 적용 시 시작년도까지의 물가상승률/소득상승률이 자동 반영됩니다.
                <br />
                (소득: 연 3.3%, 지출: 연 1.89% 복리 적용)
              </p>

              {/* 빈도 */}
              <div className={styles.field}>
                <label className={styles.label}>
                  빈도 <span className={styles.required}>*</span>
                </label>
                <select
                  className={styles.select}
                  value={formData.data.frequency}
                  onChange={(e) =>
                    handleDataChange("frequency", e.target.value)
                  }
                >
                  <option value="monthly">월간</option>
                  <option value="yearly">연간</option>
                </select>
              </div>

              {/* 금액 */}
              <div className={styles.field}>
                <label className={styles.label}>
                  금액 (만원) <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  className={styles.input}
                  value={formData.data.amount}
                  onChange={(e) => handleDataChange("amount", e.target.value)}
                  onWheel={(e) => e.target.blur()}
                  placeholder="예: 300 (300만원) 또는 10.5 (10만 5천원)"
                  min="0"
                  step="0.1"
                />
                {errors.amount && (
                  <span className={styles.error}>{errors.amount}</span>
                )}
              </div>

              {/* 상승률 */}
              <div className={styles.field}>
                <label className={styles.label}>연간 상승률 (%)</label>
                <input
                  type="number"
                  className={styles.input}
                  value={formData.data.growthRate}
                  onChange={(e) =>
                    handleDataChange("growthRate", e.target.value)
                  }
                  onWheel={(e) => e.target.blur()}
                  placeholder="예: 1.89"
                  step="0.01"
                />
                <span className={styles.hint}>
                  매년 금액이 증가하는 비율 (0이면 고정)
                </span>
              </div>

              {/* 메모 */}
              <div className={styles.field}>
                <label className={styles.label}>메모</label>
                <textarea
                  className={styles.textarea}
                  value={formData.data.memo}
                  onChange={(e) => handleDataChange("memo", e.target.value)}
                  placeholder="예: 2014년부터 2024년까지의 10년간 평균"
                  rows={3}
                />
              </div>
            </div>
              </>
            )}

            {/* 자동 적용 */}
            <div className={styles.section}>
              <div className={styles.checkboxField}>
                <input
                  type="checkbox"
                  id="autoApply"
                  className={styles.checkbox}
                  checked={formData.autoApply}
                  onChange={(e) => handleChange("autoApply", e.target.checked)}
                />
                <label htmlFor="autoApply" className={styles.checkboxLabel}>
                  자동 적용 (프로필 생성 시 자동으로 추가)
                </label>
              </div>
            </div>
          </div>

          {/* 저장 버튼 */}
          <div className={styles.submitButtonContainer}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
            >
              취소
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? "저장 중..." : editData ? "수정" : "추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TemplateEditorModal;
