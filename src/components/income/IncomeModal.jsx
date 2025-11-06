import React, { useState, useEffect } from "react";
import styles from "./IncomeModal.module.css";
import { formatAmountForChart } from "../../utils/format";
import { calculateKoreanAge } from "../../utils/koreanAge";
import { incomeService } from "../../services/firestoreService";

/**
 * 소득 데이터 추가/수정 모달
 */
function IncomeModal({
  isOpen,
  onClose,
  onSave,
  editData = null,
  initialData = null, // 재무 라이브러리에서 전달된 템플릿 데이터
  profileData = null,
  simulations = [],
  activeSimulationId = null,
  profileId = null,
}) {
  // 은퇴년도 계산 (문자열 결합 방지 및 현재 연도 기준)
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
    growthRate: "3.3", // 기본 상승률 3.3%
    isFixedToRetirementYear: false, // 은퇴년도 고정 여부
  });

  const [errors, setErrors] = useState({});
  const [selectedSimulationIds, setSelectedSimulationIds] = useState([]);
  const [availableSimulationIds, setAvailableSimulationIds] = useState([]); // 해당 id가 존재하는 시뮬레이션만
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

  // 수정 모드일 때 해당 항목(제목 기준)이 존재하는 시뮬레이션 확인
  useEffect(() => {
    const checkAvailableSimulations = async () => {
      setIsSimSelectionLoading(true);
      const startTime = Date.now();

      if (
        isOpen &&
        editData &&
        editData.title &&
        profileId &&
        simulations.length > 0
      ) {
        try {
          // 모든 시뮬레이션에서 같은 제목을 가진 항목 존재 여부 확인
          const checkPromises = simulations.map(async (sim) => {
            try {
              const incomes = await incomeService.getIncomes(profileId, sim.id);
              // 같은 제목의 항목이 있는지 확인
              const hasSameTitle = incomes.some(income => income.title === editData.title);
              return hasSameTitle ? sim.id : null;
            } catch (error) {
              return null; // 오류 시 null
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

          // 최소 3초 로딩 유지
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

          // 최소 3초 로딩 유지
          const elapsedTime = Date.now() - startTime;
          const remainingTime = Math.max(0, 1000 - elapsedTime);
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
        } finally {
          setIsSimSelectionLoading(false);
        }
      } else {
        // 추가 모드이거나 editData가 없으면 모든 시뮬레이션 표시
        // 최소 3초 로딩 유지
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
        // 수정 모드
        setFormData({
          title: editData.title || "",
          frequency:
            editData.originalFrequency || editData.frequency || "monthly",
          amount: editData.originalAmount || editData.amount || "",
          startYear: editData.startYear || new Date().getFullYear(),
          endYear: editData.endYear || getRetirementYear(),
          memo: editData.memo || "",
          growthRate:
            editData.growthRate !== undefined
              ? editData.growthRate.toString()
              : "",
          isFixedToRetirementYear: editData.isFixedToRetirementYear || false,
        });
      } else if (initialData) {
        // 재무 라이브러리에서 선택된 템플릿 데이터로 초기화
        setFormData({
          title: initialData.title || "",
          frequency: initialData.frequency || "monthly",
          amount: initialData.amount || "",
          startYear: initialData.startYear || new Date().getFullYear(),
          endYear: initialData.endYear || getRetirementYear(),
          memo: initialData.memo || "",
          growthRate:
            initialData.growthRate !== undefined
              ? initialData.growthRate.toString()
              : "3.3",
          isFixedToRetirementYear: initialData.isFixedToRetirementYear || false,
        });
      } else {
        // 새 데이터일 때 기본값
        setFormData({
          title: "",
          frequency: "monthly",
          amount: "",
          startYear: new Date().getFullYear(),
          endYear: getRetirementYear(),
          memo: "2014년부터 2024년까지의 10년간 평균",
          growthRate: "3.3",
          isFixedToRetirementYear: false,
        });
      }
    }
  }, [isOpen, editData, initialData]);

  // ESC 키로 모달 닫기 + body 스크롤 막기
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        e.stopPropagation(); // 이벤트 전파 막기 (상위 사이드바 닫힘 방지)
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // 모달이 열릴 때 body 스크롤 막기
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      // 모달이 닫힐 때 body 스크롤 복원
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // 폼 유효성 검사
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "소득 항목명을 입력해주세요.";
    }

    if (!formData.amount || formData.amount < 0) {
      newErrors.amount = "금액을 입력해주세요.";
    }

    if (formData.startYear > formData.endYear) {
      newErrors.endYear = "종료년도는 시작년도보다 늦어야 합니다.";
    }

    // 상승률이 비어있으면 0으로 처리
    if (formData.growthRate === "") {
      // 빈 값은 허용 (기본값 0으로 처리됨)
    } else {
      const growthRateNum = parseFloat(formData.growthRate);
      if (isNaN(growthRateNum) || growthRateNum < -100 || growthRateNum > 100) {
        newErrors.growthRate =
          "상승률은 -100% ~ +100% 사이의 유효한 숫자여야 합니다.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const incomeData = {
      ...formData,
      amount: parseInt(formData.amount),
      growthRate:
        formData.growthRate === "" ? 0 : parseFloat(formData.growthRate),
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

    onSave(incomeData);
    onClose();
  };

  // 모달이 닫힐 때 폼 초기화
  const handleClose = () => {
    setFormData({
      title: "",
      frequency: "monthly",
      amount: "",
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear() + 10,
      memo: "2014년부터 2024년까지의 10년간 평균",
      growthRate: "",
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
            {editData ? "소득 수정" : "소득 추가"}
          </h2>
          <button className={styles.closeButton} onClick={handleClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* 소득 항목명 */}
          <div className={styles.field}>
            <label htmlFor="title" className={styles.label}>
              소득 항목명 *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className={`${styles.input} ${errors.title ? styles.error : ""}`}
              placeholder="예: 근로소득, 사업소득, 임대소득"
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
                className={`${styles.input} ${
                  errors.amount ? styles.error : ""
                }`}
                placeholder="100"
                onKeyPress={(e) => {
                  if (!/[0-9.]/.test(e.key)) e.preventDefault();
                }}
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

          {/* 시작년도와 종료년도 */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="startYear" className={styles.label}>
                시작년도 *
              </label>
              <input
                type="text"
                id="startYear"
                value={formData.startYear}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    startYear: parseInt(e.target.value) || 0,
                  })
                }
                className={styles.input}
                onKeyPress={(e) => {
                  if (!/[0-9.]/.test(e.key)) e.preventDefault();
                }}
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
                  const newEndYear = parseInt(e.target.value) || 0;
                  setFormData({
                    ...formData,
                    endYear: newEndYear,
                    // 수동으로 변경하면 고정 해제
                    isFixedToRetirementYear: false,
                  });
                }}
                disabled={formData.isFixedToRetirementYear}
                className={`${styles.input} ${
                  errors.endYear ? styles.error : ""
                } ${formData.isFixedToRetirementYear ? styles.disabled : ""}`}
                onKeyPress={(e) => {
                  if (!/[0-9.]/.test(e.key)) e.preventDefault();
                }}
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
              연간 상승률 (%)
            </label>
            <input
              type="text"
              id="growthRate"
              value={formData.growthRate}
              onChange={(e) => {
                const value = e.target.value;
                // 숫자, 소수점, 마이너스 기호 허용 (마이너스는 맨 앞에만)
                if (value === "" || /^-?\d*\.?\d*$/.test(value)) {
                  setFormData({
                    ...formData,
                    growthRate: value,
                  });
                }
              }}
              className={`${styles.input} ${
                errors.growthRate ? styles.error : ""
              }`}
              placeholder="3.3"
            />
            {errors.growthRate && (
              <span className={styles.errorText}>{errors.growthRate}</span>
            )}
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
              placeholder="추가 설명이나 참고사항"
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
        </form>
      </div>
    </div>
  );
}

export default IncomeModal;
