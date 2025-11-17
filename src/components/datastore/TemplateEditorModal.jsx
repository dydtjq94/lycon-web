import React, { useState, useEffect } from "react";
import styles from "./TemplateEditorModal.module.css";

/**
 * 재무 라이브러리 템플릿 생성/편집 모달
 * 관리자가 새로운 템플릿을 추가하거나 기존 템플릿을 수정할 수 있습니다.
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
      frequency: "monthly",
      amount: "",
      memo: "",
      growthRate: "0",
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
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
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

  // 유효성 검사
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "제목을 입력해주세요.";
    }

    if (!formData.data.amount || formData.data.amount <= 0) {
      newErrors.amount = "금액을 입력해주세요.";
    }

    // 나이 범위 검증
    if (formData.ageStart !== null && formData.ageEnd !== null) {
      const start = parseInt(formData.ageStart);
      const end = parseInt(formData.ageEnd);
      if (start > end) {
        newErrors.ageRange = "시작 나이는 종료 나이보다 작아야 합니다.";
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
        familyMemberType: formData.familyMemberType,
        ageStart:
          formData.ageStart === "" || formData.ageStart === null
            ? null
            : parseInt(formData.ageStart),
        ageEnd:
          formData.ageEnd === "" || formData.ageEnd === null
            ? null
            : parseInt(formData.ageEnd),
        autoApply: formData.autoApply,
        data: {
          frequency: formData.data.frequency,
          amount: parseFloat(formData.data.amount),
          memo: formData.data.memo.trim(),
          growthRate: parseFloat(formData.data.growthRate) || 0,
        },
      };

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
                  placeholder="예: 초등학교 교육비"
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

              {/* 가족 구성원 타입 */}
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
            </div>

            {/* 나이 범위 */}
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
