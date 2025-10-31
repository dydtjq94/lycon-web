import React, { useState, useEffect } from "react";
import { formatAmount, formatAmountForChart } from "../../utils/format";
import { calculateKoreanAge } from "../../utils/koreanAge";
import styles from "./AssetModal.module.css";
import { assetService } from "../../services/firestoreService";

/**
 * 자산 추가/수정 모달
 * 기본적인 자산 정보를 관리합니다.
 */
function AssetModal({
  isOpen,
  onClose,
  onSave,
  editData,
  profileData,
  simulations = [],
  activeSimulationId = null,
  profileId = null,
}) {
  const [formData, setFormData] = useState({
    title: "",
    currentValue: "",
    growthRate: "2.86", // % 단위로 기본값 설정
    startYear: new Date().getFullYear(),
    endYear: "",
    assetType: "general", // "general" 또는 "income"
    incomeRate: "3", // % 단위로 기본값 설정
    memo: "2020년부터 2024년까지의 5년간 퇴직연금의 연환산수익률",
    isPurchase: false, // 구매 여부
  });

  const [errors, setErrors] = useState({});
  const [selectedSimulationIds, setSelectedSimulationIds] = useState([]);
  const [availableSimulationIds, setAvailableSimulationIds] = useState([]);
  const [isSimSelectionLoading, setIsSimSelectionLoading] = useState(false);

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
          const checkPromises = simulations.map(async (sim) => {
            try {
              await assetService.getAsset(profileId, sim.id, editData.id);
              return sim.id;
            } catch (error) {
              return null;
            }
          });
          const results = await Promise.all(checkPromises);
          const availableIds = results.filter((id) => id !== null);
          setAvailableSimulationIds(availableIds);
          const defaultSelected = availableIds.includes(activeSimulationId)
            ? [activeSimulationId]
            : availableIds.length > 0
            ? [availableIds[0]]
            : [];
          setSelectedSimulationIds(defaultSelected);
          const elapsedTime = Date.now() - startTime;
          const remainingTime = Math.max(0, 1000 - elapsedTime);
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
        } catch (error) {
          console.error("시뮬레이션 확인 오류:", error);
          setAvailableSimulationIds(simulations.map((s) => s.id));
          setSelectedSimulationIds(
            activeSimulationId ? [activeSimulationId] : []
          );
          const elapsedTime = Date.now() - startTime;
          const remainingTime = Math.max(0, 1000 - elapsedTime);
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
        } finally {
          setIsSimSelectionLoading(false);
        }
      } else {
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

  // 모달이 열릴 때 데이터 로드
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          title: editData.title || "",
          currentValue: editData.currentValue || "",
          growthRate:
            editData.growthRate !== undefined
              ? (editData.growthRate * 100).toFixed(2)
              : "2.86",
          startYear: editData.startYear || new Date().getFullYear(),
          endYear: editData.endYear || "",
          assetType: editData.assetType || "general",
          incomeRate:
            editData.incomeRate !== undefined
              ? (editData.incomeRate * 100).toFixed(2)
              : "3",
          memo: editData.memo || "",
          isPurchase: editData.isPurchase || false,
        });
      } else {
        // 새 데이터인 경우 기본값 설정
        const currentYear = new Date().getFullYear();
        const deathYear = profileData
          ? profileData.birthYear + 90 - 1
          : currentYear + 50;

        setFormData({
          title: "",
          currentValue: "",
          growthRate: "2.86",
          startYear: currentYear,
          endYear: deathYear,
          assetType: "general",
          incomeRate: "3",
          memo: "2020년부터 2024년까지의 5년간 퇴직연금의 연환산수익률",
          isPurchase: false,
        });
      }
    }
  }, [isOpen, editData, profileData]);

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

  // 폼 검증
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "자산명을 입력해주세요.";
    } else if (formData.title.trim() === "현금") {
      newErrors.title = "'현금'은 이미 추가된 자산입니다.";
    }

    if (!formData.currentValue || parseFloat(formData.currentValue) < 0) {
      newErrors.currentValue = "가치는 0보다 큰 값을 입력해주세요.";
    }

    const growthRateNum = parseFloat(formData.growthRate);
    if (isNaN(growthRateNum) || growthRateNum < -100 || growthRateNum > 1000) {
      newErrors.growthRate = "상승률은 -100%와 1000% 사이의 숫자여야 합니다.";
    }

    if (!formData.endYear || parseInt(formData.endYear) <= formData.startYear) {
      newErrors.endYear = "종료 연도는 시작 연도보다 커야 합니다.";
    }

    if (formData.assetType === "income") {
      const incomeRateNum = parseFloat(formData.incomeRate);
      if (
        isNaN(incomeRateNum) ||
        incomeRateNum < -100 ||
        incomeRateNum > 1000
      ) {
        newErrors.incomeRate = "수익률은 -100%와 1000% 사이의 숫자여야 합니다.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 숫자만 입력 허용
  const handleKeyPress = (e) => {
    if (
      !/[0-9]/.test(e.key) &&
      !["Backspace", "Delete", "Tab", "Enter", "."].includes(e.key)
    ) {
      e.preventDefault();
    }
  };

  // 폼 제출
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const assetData = {
      title: formData.title.trim(),
      currentValue: parseFloat(formData.currentValue),
      growthRate: parseFloat(formData.growthRate) / 100, // 백분율을 소수로 변환
      startYear: parseInt(formData.startYear),
      endYear: parseInt(formData.endYear),
      assetType: formData.assetType,
      incomeRate:
        formData.assetType === "income"
          ? parseFloat(formData.incomeRate) / 100
          : 0, // 수익형 자산일 때만 수익률 적용
      memo: formData.memo.trim(),
      isPurchase: formData.isPurchase, // 구매 여부
      selectedSimulationIds:
        selectedSimulationIds && selectedSimulationIds.length > 0
          ? selectedSimulationIds
          : activeSimulationId
          ? [activeSimulationId]
          : [],
    };

    onSave(assetData);
  };

  // 모달 닫기
  const handleClose = () => {
    setFormData({
      title: "",
      currentValue: "",
      growthRate: "",
      startYear: new Date().getFullYear(),
      endYear: "",
      assetType: "general",
      incomeRate: "",
      memo: "",
      isPurchase: false,
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{editData ? "자산 수정" : "자산 추가"}</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>자산명 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className={`${styles.input} ${errors.title ? styles.error : ""}`}
              placeholder="예: 주식, 채권, 금, 예금 등"
            />
            {errors.title && (
              <span className={styles.errorText}>{errors.title}</span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>가치 (만원) *</label>
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
              placeholder="예: 1000"
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
          <div className={styles.field}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.isPurchase}
                onChange={(e) =>
                  setFormData({ ...formData, isPurchase: e.target.checked })
                }
                className={styles.checkbox}
              />
              <span className={styles.checkboxText}>구매로 처리</span>
            </label>
            {formData.isPurchase && (
              <div className={styles.purchaseNotice}>
                💡 {formData.startYear}년에{" "}
                {formatAmountForChart(parseInt(formData.currentValue) || 0)}의
                현금이 차감됩니다.
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>자산 타입 *</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="assetType"
                  value="general"
                  checked={formData.assetType === "general"}
                  onChange={(e) =>
                    setFormData({ ...formData, assetType: e.target.value })
                  }
                />
                <span className={styles.radioText}>일반 자산</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="assetType"
                  value="income"
                  checked={formData.assetType === "income"}
                  onChange={(e) =>
                    setFormData({ ...formData, assetType: e.target.value })
                  }
                />
                <span className={styles.radioText}>수익형 자산</span>
              </label>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>연간 상승률 (%) *</label>
            <input
              type="text"
              value={formData.growthRate}
              onChange={(e) => {
                const value = e.target.value;
                // 숫자, 소수점, 마이너스 기호 허용 (마이너스는 맨 앞에만)
                if (value === "" || /^-?\d*\.?\d*$/.test(value)) {
                  setFormData({ ...formData, growthRate: value });
                }
              }}
              className={`${styles.input} ${
                errors.growthRate ? styles.error : ""
              }`}
              placeholder="예: 2.86"
            />
            {errors.growthRate && (
              <span className={styles.errorText}>{errors.growthRate}</span>
            )}
          </div>

          {formData.assetType === "income" && (
            <div className={styles.field}>
              <label className={styles.label}>
                연간 수익률(배당, 이자 등) (%) *
              </label>
              <input
                type="text"
                value={formData.incomeRate}
                onChange={(e) => {
                  const value = e.target.value;
                  // 숫자, 소수점, 마이너스 기호 허용 (마이너스는 맨 앞에만)
                  if (value === "" || /^-?\d*\.?\d*$/.test(value)) {
                    setFormData({ ...formData, incomeRate: value });
                  }
                }}
                className={`${styles.input} ${
                  errors.incomeRate ? styles.error : ""
                }`}
                placeholder="예: 2.86"
              />
              {errors.incomeRate && (
                <span className={styles.errorText}>{errors.incomeRate}</span>
              )}
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>보유 기간 *</label>
            <div className={styles.yearInputs}>
              <input
                type="text"
                value={formData.startYear}
                onChange={(e) =>
                  setFormData({ ...formData, startYear: e.target.value })
                }
                onKeyPress={handleKeyPress}
                className={`${styles.input} ${styles.yearInput} ${
                  errors.startYear ? styles.error : ""
                }`}
                placeholder="시작 연도"
              />
              <span className={styles.yearSeparator}>~</span>
              <input
                type="text"
                value={formData.endYear}
                onChange={(e) =>
                  setFormData({ ...formData, endYear: e.target.value })
                }
                onKeyPress={handleKeyPress}
                className={`${styles.input} ${styles.yearInput} ${
                  errors.endYear ? styles.error : ""
                }`}
                placeholder="종료 연도"
              />
            </div>
            {/* 년도별 나이 표시 */}
            {formData.startYear && profileData && profileData.birthYear && (
              <div className={styles.agePreview}>
                {calculateKoreanAge(profileData.birthYear, formData.startYear)}
                세
                {formData.endYear &&
                  ` ~ ${calculateKoreanAge(
                    profileData.birthYear,
                    formData.endYear
                  )}세`}
              </div>
            )}
            {(errors.startYear || errors.endYear) && (
              <span className={styles.errorText}>
                {errors.startYear || errors.endYear}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>메모</label>
            <textarea
              value={formData.memo}
              onChange={(e) =>
                setFormData({ ...formData, memo: e.target.value })
              }
              className={styles.textarea}
              placeholder="자산에 대한 추가 정보나 설명을 입력하세요"
              rows={3}
            />
          </div>

          {/* 적용할 시뮬레이션 선택 */}
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
                      editData ? availableSimulationIds.includes(sim.id) : true
                    )
                    .map((sim) => (
                      <label key={sim.id} className={styles.fixedCheckboxLabel}>
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
                              return (prev || []).filter((id) => id !== sim.id);
                            });
                          }}
                          className={styles.fixedCheckbox}
                        />
                        <span className={styles.fixedCheckboxText}>
                          {sim.title || (sim.isDefault ? "현재" : "시뮬레이션")}
                        </span>
                      </label>
                    ))
                )}
              </div>
            </div>
          )}

          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={handleClose}
              className={styles.cancelButton}
            >
              취소
            </button>
            <button type="submit" className={styles.submitButton}>
              {editData ? "수정" : "추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AssetModal;
