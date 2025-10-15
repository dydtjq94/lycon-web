import React, { useState, useEffect } from "react";
import styles from "./PensionModal.module.css";

/**
 * 연금 데이터 추가/수정 모달
 * 국민연금, 퇴직연금, 개인연금 지원
 */
function PensionModal({ isOpen, onClose, onSave, editData = null }) {
  const [formData, setFormData] = useState({
    type: "", // national, retirement, personal
    title: "",
    monthlyAmount: "", // 월 수령 금액
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear() + 20,
    inflationRate: 2.5, // 물가상승률 (국민연금용)
    // 퇴직연금/개인연금용 필드
    contributionAmount: "", // 월/년 적립 금액
    contributionFrequency: "monthly", // monthly, yearly
    contributionStartYear: new Date().getFullYear(),
    contributionEndYear: new Date().getFullYear() + 10,
    returnRate: 5.0, // 투자 수익률
    paymentYears: 10, // 수령 년수
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
          contributionAmount: editData.contributionAmount || "",
          contributionFrequency: editData.contributionFrequency || "monthly",
          contributionStartYear:
            editData.contributionStartYear || new Date().getFullYear(),
          contributionEndYear:
            editData.contributionEndYear || new Date().getFullYear() + 10,
          returnRate: editData.returnRate || 5.0,
          paymentYears: editData.paymentYears || 10,
          memo: editData.memo || "",
        });
      } else {
        // 새 데이터일 때 초기화
        setFormData({
          type: "",
          title: "",
          monthlyAmount: "",
          startYear: new Date().getFullYear(),
          endYear: new Date().getFullYear() + 20,
          inflationRate: 2.5,
          contributionAmount: "",
          contributionFrequency: "monthly",
          contributionStartYear: new Date().getFullYear(),
          contributionEndYear: new Date().getFullYear() + 10,
          returnRate: 5.0,
          paymentYears: 10,
          memo: "",
        });
      }
    }
  }, [isOpen, editData]);

  // 연금 타입 변경 시 기본값 설정
  const handleTypeChange = (newType) => {
    const currentYear = new Date().getFullYear();
    const birthYear = 1994; // 기본값, 실제로는 프로필에서 가져와야 함
    const age65Year = birthYear + 65 - 1;
    const age90Year = birthYear + 90 - 1;

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
        break;
      case "personal":
        newFormData.title = "개인연금";
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
      if (!formData.monthlyAmount || formData.monthlyAmount <= 0) {
        newErrors.monthlyAmount = "월 수령 금액을 입력해주세요.";
      }
      if (formData.startYear > formData.endYear) {
        newErrors.endYear = "종료년도는 시작년도보다 늦어야 합니다.";
      }
    } else {
      // 퇴직연금/개인연금
      if (!formData.contributionAmount || formData.contributionAmount <= 0) {
        newErrors.contributionAmount = "적립 금액을 입력해주세요.";
      }
      if (formData.contributionStartYear > formData.contributionEndYear) {
        newErrors.contributionEndYear =
          "적립 종료년도는 시작년도보다 늦어야 합니다.";
      }
      if (formData.paymentYears <= 0) {
        newErrors.paymentYears = "수령 년수를 입력해주세요.";
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
      !/[0-9.]/.test(e.key) &&
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
      contributionAmount:
        formData.type !== "national"
          ? parseInt(formData.contributionAmount)
          : 0,
      returnRate:
        formData.type !== "national" ? parseFloat(formData.returnRate) : 0,
      paymentYears:
        formData.type !== "national" ? parseInt(formData.paymentYears) : 0,
    };

    onSave(pensionData);
    onClose();
  };

  // 모달 닫기 핸들러
  const handleClose = () => {
    setFormData({
      type: "national",
      title: "",
      monthlyAmount: "",
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear() + 20,
      contributionAmount: "",
      contributionFrequency: "monthly",
      contributionStartYear: new Date().getFullYear(),
      contributionEndYear: new Date().getFullYear() + 10,
      returnRate: 5.0,
      paymentYears: 10,
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
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          inflationRate: e.target.value,
                        })
                      }
                      onKeyPress={handleKeyPress}
                      className={`${styles.input} ${
                        errors.inflationRate ? styles.error : ""
                      }`}
                      placeholder="2.5"
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
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            returnRate: e.target.value,
                          })
                        }
                        onKeyPress={handleKeyPress}
                        className={`${styles.input} ${
                          errors.returnRate ? styles.error : ""
                        }`}
                        placeholder="5.0"
                      />
                      {errors.returnRate && (
                        <span className={styles.errorText}>
                          {errors.returnRate}
                        </span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>수령 년수</label>
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
                        placeholder="10"
                      />
                      {errors.paymentYears && (
                        <span className={styles.errorText}>
                          {errors.paymentYears}
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
