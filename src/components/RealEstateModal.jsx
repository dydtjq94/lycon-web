import React, { useState, useEffect } from "react";
import styles from "./RealEstateModal.module.css";
import { formatAmountForChart } from "../utils/format";

const RealEstateModal = ({
  isOpen,
  onClose,
  onSave,
  editData,
  profileData,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    currentValue: "",
    growthRate: "2.5",
    endYear: "",
    hasRentalIncome: false,
    monthlyRentalIncome: "",
    rentalIncomeStartYear: "",
    rentalIncomeEndYear: "",
    convertToPension: false,
    pensionStartYear: "",
    monthlyPensionAmount: "",
    memo: "",
  });

  const [errors, setErrors] = useState({});

  // 모달이 열릴 때 폼 초기화
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          title: editData.title || "",
          currentValue: editData.currentValue || "",
          growthRate: editData.growthRate
            ? (editData.growthRate * 100).toString()
            : "2.5",
          endYear: editData.endYear || "",
          hasRentalIncome: editData.hasRentalIncome || false,
          monthlyRentalIncome: editData.monthlyRentalIncome || "",
          rentalIncomeStartYear: editData.rentalIncomeStartYear || "",
          rentalIncomeEndYear: editData.rentalIncomeEndYear || "",
          convertToPension: editData.convertToPension || false,
          pensionStartYear: editData.pensionStartYear || "",
          monthlyPensionAmount: editData.monthlyPensionAmount || "",
          memo: editData.memo || "",
        });
      } else {
        setFormData({
          title: "",
          currentValue: "",
          growthRate: "2.5",
          endYear: "",
          hasRentalIncome: false,
          monthlyRentalIncome: "",
          rentalIncomeStartYear: "",
          rentalIncomeEndYear: "",
          convertToPension: false,
          pensionStartYear: "",
          monthlyPensionAmount: "",
          memo: "",
        });
      }
      setErrors({});
    }
  }, [isOpen, editData]);

  const handleClose = () => {
    setFormData({
      title: "",
      currentValue: "",
      growthRate: "2.5",
      endYear: "",
      hasRentalIncome: false,
      monthlyRentalIncome: "",
      rentalIncomeStartYear: "",
      rentalIncomeEndYear: "",
      convertToPension: false,
      pensionStartYear: "",
      monthlyPensionAmount: "",
      memo: "",
    });
    setErrors({});
    onClose();
  };

  const handleKeyPress = (e) => {
    // 숫자와 소수점만 허용
    if (!/[0-9.]/.test(e.key)) {
      e.preventDefault();
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "부동산명을 입력해주세요";
    }

    if (!formData.currentValue || formData.currentValue < 0) {
      newErrors.currentValue = "현재 가치를 입력해주세요";
    }

    if (!formData.endYear || formData.endYear < 0) {
      newErrors.endYear = "보유 종료년도를 입력해주세요";
    }

    if (formData.hasRentalIncome) {
      if (!formData.monthlyRentalIncome || formData.monthlyRentalIncome < 0) {
        newErrors.monthlyRentalIncome = "월 임대 수입을 입력해주세요";
      }

      if (
        !formData.rentalIncomeStartYear ||
        formData.rentalIncomeStartYear < 0
      ) {
        newErrors.rentalIncomeStartYear = "임대 수입 시작년도를 입력해주세요";
      }

      if (!formData.rentalIncomeEndYear || formData.rentalIncomeEndYear < 0) {
        newErrors.rentalIncomeEndYear = "임대 수입 종료년도를 입력해주세요";
      }
    }

    if (formData.convertToPension) {
      if (!formData.pensionStartYear || formData.pensionStartYear < 0) {
        newErrors.pensionStartYear = "주택연금 시작년도를 입력해주세요";
      }

      if (!formData.monthlyPensionAmount || formData.monthlyPensionAmount < 0) {
        newErrors.monthlyPensionAmount = "월 수령액을 입력해주세요";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const realEstateData = {
      title: formData.title.trim(),
      currentValue: parseInt(formData.currentValue),
      growthRate: parseFloat(formData.growthRate) / 100, // 백분율을 소수로 변환
      endYear: parseInt(formData.endYear),
      hasRentalIncome: formData.hasRentalIncome,
      monthlyRentalIncome: formData.hasRentalIncome
        ? parseInt(formData.monthlyRentalIncome)
        : null,
      rentalIncomeStartYear: formData.hasRentalIncome
        ? parseInt(formData.rentalIncomeStartYear)
        : null,
      rentalIncomeEndYear: formData.hasRentalIncome
        ? parseInt(formData.rentalIncomeEndYear)
        : null,
      convertToPension: formData.convertToPension,
      pensionStartYear: formData.convertToPension
        ? parseInt(formData.pensionStartYear)
        : null,
      monthlyPensionAmount: formData.convertToPension
        ? parseInt(formData.monthlyPensionAmount)
        : null,
      memo: formData.memo.trim(),
    };

    onSave(realEstateData);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {editData ? "부동산 수정" : "부동산 추가"}
          </h2>
          <button className={styles.closeButton} onClick={handleClose}>
            ×
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {/* 부동산명 */}
          <div className={styles.field}>
            <label className={styles.label}>부동산명</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className={`${styles.input} ${errors.title ? styles.error : ""}`}
              placeholder="예: 아파트, 빌라, 상가"
            />
            {errors.title && (
              <span className={styles.errorText}>{errors.title}</span>
            )}
          </div>

          {/* 현재 가치 */}
          <div className={styles.field}>
            <label className={styles.label}>현재 가치 (만원)</label>
            <input
              type="text"
              value={formData.currentValue}
              onChange={(e) =>
                setFormData({ ...formData, currentValue: e.target.value })
              }
              onKeyPress={handleKeyPress}
              className={`${styles.input} ${
                errors.currentValue ? styles.error : ""
              }`}
              placeholder="예: 50000"
            />
            {formData.currentValue &&
              !isNaN(parseInt(formData.currentValue)) && (
                <div className={styles.amountPreview}>
                  {formatAmountForChart(parseInt(formData.currentValue))}
                </div>
              )}
            {errors.currentValue && (
              <span className={styles.errorText}>{errors.currentValue}</span>
            )}
          </div>

          {/* 상승률 */}
          <div className={styles.field}>
            <label className={styles.label}>상승률 (%)</label>
            <input
              type="text"
              value={formData.growthRate}
              onChange={(e) => {
                const value = e.target.value;
                // 숫자와 소수점만 허용
                if (value === "" || /^\d*\.?\d*$/.test(value)) {
                  setFormData({ ...formData, growthRate: value });
                }
              }}
              className={`${styles.input} ${
                errors.growthRate ? styles.error : ""
              }`}
              placeholder="2.5"
            />
            {errors.growthRate && (
              <span className={styles.errorText}>{errors.growthRate}</span>
            )}
          </div>

          {/* 보유 종료년도 */}
          <div className={styles.field}>
            <label className={styles.label}>보유 종료년도</label>
            <input
              type="text"
              value={formData.endYear}
              onChange={(e) =>
                setFormData({ ...formData, endYear: e.target.value })
              }
              onKeyPress={handleKeyPress}
              className={`${styles.input} ${
                errors.endYear ? styles.error : ""
              }`}
              placeholder="예: 2083"
            />
            {errors.endYear && (
              <span className={styles.errorText}>{errors.endYear}</span>
            )}
          </div>

          {/* 임대 수입 여부 */}
          <div className={styles.field}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.hasRentalIncome}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hasRentalIncome: e.target.checked,
                  })
                }
                className={styles.checkbox}
              />
              <span className={styles.checkboxText}>임대 수입 있음</span>
            </label>
          </div>

          {/* 임대 수입 관련 필드들 */}
          {formData.hasRentalIncome && (
            <>
              <div className={styles.field}>
                <label className={styles.label}>월 임대 수입 (만원)</label>
                <input
                  type="text"
                  value={formData.monthlyRentalIncome}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      monthlyRentalIncome: e.target.value,
                    })
                  }
                  onKeyPress={handleKeyPress}
                  className={`${styles.input} ${
                    errors.monthlyRentalIncome ? styles.error : ""
                  }`}
                  placeholder="예: 100"
                />
                {formData.monthlyRentalIncome &&
                  !isNaN(parseInt(formData.monthlyRentalIncome)) && (
                    <div className={styles.amountPreview}>
                      {formatAmountForChart(
                        parseInt(formData.monthlyRentalIncome)
                      )}
                    </div>
                  )}
                {errors.monthlyRentalIncome && (
                  <span className={styles.errorText}>
                    {errors.monthlyRentalIncome}
                  </span>
                )}
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>임대 수입 시작년도</label>
                  <input
                    type="text"
                    value={formData.rentalIncomeStartYear}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rentalIncomeStartYear: e.target.value,
                      })
                    }
                    onKeyPress={handleKeyPress}
                    className={`${styles.input} ${
                      errors.rentalIncomeStartYear ? styles.error : ""
                    }`}
                    placeholder="예: 2025"
                  />
                  {errors.rentalIncomeStartYear && (
                    <span className={styles.errorText}>
                      {errors.rentalIncomeStartYear}
                    </span>
                  )}
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>임대 수입 종료년도</label>
                  <input
                    type="text"
                    value={formData.rentalIncomeEndYear}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rentalIncomeEndYear: e.target.value,
                      })
                    }
                    onKeyPress={handleKeyPress}
                    className={`${styles.input} ${
                      errors.rentalIncomeEndYear ? styles.error : ""
                    }`}
                    placeholder="예: 2083"
                  />
                  {errors.rentalIncomeEndYear && (
                    <span className={styles.errorText}>
                      {errors.rentalIncomeEndYear}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}

          {/* 주택연금 전환 여부 */}
          <div className={styles.field}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.convertToPension}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    convertToPension: e.target.checked,
                  })
                }
                className={styles.checkbox}
              />
              <span className={styles.checkboxText}>주택연금으로 전환</span>
            </label>
          </div>

          {/* 주택연금 관련 필드들 */}
          {formData.convertToPension && (
            <>
              <div className={styles.field}>
                <label className={styles.label}>주택연금 시작년도</label>
                <input
                  type="text"
                  value={formData.pensionStartYear}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pensionStartYear: e.target.value,
                    })
                  }
                  onKeyPress={handleKeyPress}
                  className={`${styles.input} ${
                    errors.pensionStartYear ? styles.error : ""
                  }`}
                  placeholder="예: 2040"
                />
                {errors.pensionStartYear && (
                  <span className={styles.errorText}>
                    {errors.pensionStartYear}
                  </span>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>월 수령액 (만원)</label>
                <input
                  type="text"
                  value={formData.monthlyPensionAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      monthlyPensionAmount: e.target.value,
                    })
                  }
                  onKeyPress={handleKeyPress}
                  className={`${styles.input} ${
                    errors.monthlyPensionAmount ? styles.error : ""
                  }`}
                  placeholder="예: 200"
                />
                {formData.monthlyPensionAmount &&
                  !isNaN(parseInt(formData.monthlyPensionAmount)) && (
                    <div className={styles.amountPreview}>
                      {formatAmountForChart(
                        parseInt(formData.monthlyPensionAmount)
                      )}
                    </div>
                  )}
                {errors.monthlyPensionAmount && (
                  <span className={styles.errorText}>
                    {errors.monthlyPensionAmount}
                  </span>
                )}
              </div>
            </>
          )}

          {/* 메모 */}
          <div className={styles.field}>
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

          {/* 버튼들 */}
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
        </form>
      </div>
    </div>
  );
};

export default RealEstateModal;
