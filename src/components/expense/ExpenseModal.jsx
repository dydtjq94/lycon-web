import React, { useState, useEffect } from "react";
import styles from "./ExpenseModal.module.css";
import { formatAmountForChart } from "../../utils/format";
import { calculateKoreanAge } from "../../utils/koreanAge";
import { expenseService } from "../../services/firestoreService";

/**
 * 지출 데이터 추가/수정 모달
 */
function ExpenseModal({
  isOpen,
  onClose,
  onSave,
  editData = null,
  profileData = null,
  simulations = [],
  activeSimulationId = null,
  profileId = null,
}) {
  // 은퇴년도 계산 (문자열 결합 방지 및 현재 연도 기준 계산)
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

  const [formData, setFormData] = useState({
    title: "",
    frequency: "monthly", // monthly, yearly
    amount: "",
    startYear: new Date().getFullYear(),
    endYear: getRetirementYear(),
    memo: "2014년부터 2024년까지의 10년간 평균",
    growthRate: "1.89", // 기본 상승률 1.89%
    isFixedToRetirementYear: false, // 은퇴년도 고정 여부
  });

  const [errors, setErrors] = useState({});
  const [selectedSimulationIds, setSelectedSimulationIds] = useState([]);
  const [availableSimulationIds, setAvailableSimulationIds] = useState([]);
  const [isSimSelectionLoading, setIsSimSelectionLoading] = useState(false);

  // 은퇴년도 고정이 켜져있으면 endYear를 자동으로 은퇴년도로 업데이트
  useEffect(() => {
    if (formData.isFixedToRetirementYear && profileData) {
      const retirementYear = getRetirementYear();
      if (formData.endYear !== retirementYear) {
        setFormData((prev) => ({ ...prev, endYear: retirementYear }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.isFixedToRetirementYear,
    profileData?.retirementAge,
    profileData?.birthYear,
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
              await expenseService.getExpense(profileId, sim.id, editData.id);
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
          title: editData.title || "",
          frequency:
            editData.originalFrequency || editData.frequency || "monthly",
          amount: editData.originalAmount || editData.amount || "",
          startYear: parseInt(editData.startYear) || new Date().getFullYear(),
          endYear: parseInt(editData.endYear) || getRetirementYear(),
          memo: editData.memo || "",
          growthRate: editData.growthRate
            ? editData.growthRate.toString()
            : "1.89",
          isFixedToRetirementYear: editData.isFixedToRetirementYear || false,
        });
      } else {
        // 새 데이터일 때 초기화
        setFormData({
          title: "",
          frequency: "monthly",
          amount: "",
          startYear: new Date().getFullYear(),
          endYear: getRetirementYear(),
          memo: "2014년부터 2024년까지의 10년간 평균",
          growthRate: "1.89",
          isFixedToRetirementYear: false,
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

  // 폼 유효성 검사
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "제목을 입력해주세요.";
    }

    if (!formData.amount || formData.amount < 0) {
      newErrors.amount = "금액을 입력해주세요.";
    }

    if (formData.startYear > formData.endYear) {
      newErrors.endYear = "종료년도는 시작년도보다 늦어야 합니다.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 숫자와 마이너스 기호 입력 허용
  const handleKeyPress = (e) => {
    if (
      !/[0-9.-]/.test(e.key) &&
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

    const expenseData = {
      ...formData,
      amount: parseInt(formData.amount),
      startYear: parseInt(formData.startYear), // 문자열을 숫자로 변환
      endYear: parseInt(formData.endYear), // 문자열을 숫자로 변환
      growthRate: parseFloat(formData.growthRate), // 백분율 그대로 저장 (마이너스 값 포함)
      originalAmount: parseInt(formData.amount),
      originalFrequency: formData.frequency,
      isFixedToRetirementYear: formData.isFixedToRetirementYear || false,
      selectedSimulationIds:
        selectedSimulationIds && selectedSimulationIds.length > 0
          ? selectedSimulationIds
          : activeSimulationId
          ? [activeSimulationId]
          : [],
    };

    onSave(expenseData);
    onClose();
  };

  // 모달 닫기 핸들러
  const handleClose = () => {
    setFormData({
      title: "",
      frequency: "monthly",
      amount: "",
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear() + 10,
      memo: "2014년부터 2024년까지의 10년간 평균",
      growthRate: "1.89",
      isFixedToRetirementYear: false,
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
            {editData ? "지출 수정" : "지출 추가"}
          </h2>
          <button className={styles.closeButton} onClick={handleClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* 지출 항목명 */}
          <div className={styles.field}>
            <label htmlFor="title" className={styles.label}>
              지출 항목명 *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className={`${styles.input} ${errors.title ? styles.error : ""}`}
              placeholder="예: 생활비, 교육비, 의료비"
            />
            {errors.title && (
              <span className={styles.errorText}>{errors.title}</span>
            )}
          </div>

          {/* 빈도와 금액 */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="frequency" className={styles.label}>
                주기 *
              </label>
              <select
                id="frequency"
                value={formData.frequency}
                onChange={(e) =>
                  setFormData({ ...formData, frequency: e.target.value })
                }
                className={styles.select}
              >
                <option value="monthly">월</option>
                <option value="yearly">년</option>
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="amount" className={styles.label}>
                금액 (만원) *
              </label>
              <input
                type="text"
                id="amount"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                onKeyPress={handleKeyPress}
                className={`${styles.input} ${
                  errors.amount ? styles.error : ""
                }`}
                placeholder="예: 300"
              />
              {formData.amount && !isNaN(parseInt(formData.amount)) && (
                <div className={styles.amountPreview}>
                  {formatAmountForChart(parseInt(formData.amount))}
                </div>
              )}
              {errors.amount && (
                <span className={styles.errorText}>{errors.amount}</span>
              )}
            </div>
          </div>

          {/* 기간 */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="startYear" className={styles.label}>
                시작년도 *
              </label>
              <input
                type="text"
                id="startYear"
                value={formData.startYear}
                onChange={(e) => {
                  const value = e.target.value;
                  // 숫자만 허용하고 4자리 제한
                  if (value === "" || /^\d{0,4}$/.test(value)) {
                    setFormData({ ...formData, startYear: value });
                  }
                }}
                onKeyPress={handleKeyPress}
                className={styles.input}
                placeholder="2025"
              />
              {/* 시작년도 나이 표시 */}
              {formData.startYear && profileData && profileData.birthYear && (
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
              <div className={styles.endYearWrapper}>
                <label htmlFor="endYear" className={styles.label}>
                  종료년도 *
                </label>
                <label className={styles.fixedCheckboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.isFixedToRetirementYear}
                    onChange={(e) => {
                      const isFixed = e.target.checked;
                      setFormData({
                        ...formData,
                        isFixedToRetirementYear: isFixed,
                        // 체크 시 은퇴년도로 자동 설정
                        endYear: isFixed
                          ? getRetirementYear()
                          : formData.endYear,
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
                id="endYear"
                value={formData.endYear}
                onChange={(e) => {
                  const value = e.target.value;
                  // 숫자만 허용하고 4자리 제한
                  if (value === "" || /^\d{0,4}$/.test(value)) {
                    setFormData({
                      ...formData,
                      endYear: value,
                      // 수동으로 변경하면 고정 해제
                      isFixedToRetirementYear: false,
                    });
                  }
                }}
                disabled={formData.isFixedToRetirementYear}
                onKeyPress={handleKeyPress}
                className={`${styles.input} ${
                  errors.endYear ? styles.error : ""
                } ${formData.isFixedToRetirementYear ? styles.disabled : ""}`}
                placeholder="2035"
              />
              {/* 종료년도 나이 표시 */}
              {formData.endYear && profileData && profileData.birthYear && (
                <div className={styles.agePreview}>
                  {calculateKoreanAge(profileData.birthYear, formData.endYear)}
                  세
                </div>
              )}
              {errors.endYear && (
                <span className={styles.errorText}>{errors.endYear}</span>
              )}
            </div>
          </div>

          {/* 상승률 */}
          <div className={styles.field}>
            <label htmlFor="growthRate" className={styles.label}>
              상승률 (%)
            </label>
            <input
              type="text"
              id="growthRate"
              value={formData.growthRate}
              onChange={(e) => {
                const value = e.target.value;
                // 숫자, 소수점, 마이너스 기호 허용 (마이너스는 맨 앞에만)
                if (value === "" || /^-?\d*\.?\d*$/.test(value)) {
                  setFormData({ ...formData, growthRate: value });
                }
              }}
              onKeyPress={handleKeyPress}
              className={styles.input}
              placeholder="1.89"
            />
          </div>

          {/* 메모 */}
          <div className={styles.field}>
            <label htmlFor="memo" className={styles.label}>
              메모
            </label>
            <textarea
              id="memo"
              value={formData.memo}
              onChange={(e) =>
                setFormData({ ...formData, memo: e.target.value })
              }
              className={styles.textarea}
              rows="3"
              placeholder="추가 설명이나 참고사항을 입력하세요"
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

          <div className={styles.modalFooter}>
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
}

export default ExpenseModal;
