import React, { useState, useEffect } from "react";
import styles from "./SavingModal.module.css";
import { formatAmountForChart } from "../../utils/format";
import { calculateKoreanAge } from "../../utils/koreanAge";
import { savingsService } from "../../services/firestoreService";

/**
 * 저축/투자 데이터 추가/수정 모달
 */
function SavingModal({
  isOpen,
  onClose,
  onSave,
  editData = null,
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
    savingType: "standard", // "standard" (기본형) 또는 "income" (수익형 현금)
    frequency: "monthly", // monthly, yearly, one_time
    amount: "",
    currentAmount: "", // 현재 보유 금액
    treatAsInitialPurchase: false, // 현재 보유 금액을 구매로 처리할지 여부
    startYear: new Date().getFullYear(),
    endYear: getRetirementYear(),
    memo: "수익률 : 2020년부터 2024년까지의 5년간 퇴직연금의 연환산수익률\n증가율 : 연간 저축/투자금액 증가율 (%) → 1.89%",
    interestRate: "2.86", // 기본 수익률 2.86%
    yearlyGrowthRate: "1.89", // 연간 저축/투자금액 증가율 1.89%
    incomeRate: "3", // 수익형 현금: 연간 수익률 (배당, 이자 등)
    capitalGainsTaxRate: "", // 양도세율 (%)
    isFixedToRetirementYear: false, // 은퇴년도 고정 여부
  });

  const [errors, setErrors] = useState({});
  const [selectedSimulationIds, setSelectedSimulationIds] = useState([]);
  // 각 시뮬레이션이 수정인지 추가인지 상태 저장: { simId: 'update' | 'create' }
  const [simulationStatusMap, setSimulationStatusMap] = useState({});
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

  // 수정 모드일 때 각 시뮬레이션에 해당 ID가 존재하는지 확인
  useEffect(() => {
    // 모달이 닫혀있으면 아무것도 안함
    if (!isOpen) {
      return;
    }

    // 모달이 열리면 즉시 이전 상태 초기화 및 로딩 시작
    setIsSimSelectionLoading(true);
    setSimulationStatusMap({});
    setSelectedSimulationIds([]);

    let cancelled = false;

    const checkSimulationStatus = async () => {
      const startTime = Date.now();

      if (editData && editData.id && profileId && simulations.length > 0) {
        try {
          // 모든 시뮬레이션에서 해당 ID가 존재하는지 확인
          const checkPromises = simulations.map(async (sim) => {
            try {
              const savings = await savingsService.getSavings(
                profileId,
                sim.id
              );
              // 같은 ID의 항목이 있는지 확인
              const hasSameId = savings.some(
                (saving) => saving.id === editData.id
              );
              return { simId: sim.id, status: hasSameId ? "update" : "create" };
            } catch (error) {
              return { simId: sim.id, status: "create" }; // 오류 시 추가로 처리
            }
          });
          const results = await Promise.all(checkPromises);

          // 작업이 취소되었으면 상태 업데이트 안함
          if (cancelled) return;

          // 상태 맵 생성
          const statusMap = {};
          results.forEach(({ simId, status }) => {
            statusMap[simId] = status;
          });
          setSimulationStatusMap(statusMap);

          // 현재 활성 시뮬레이션을 기본 선택
          const defaultSelected = activeSimulationId ? [activeSimulationId] : [];
          setSelectedSimulationIds(defaultSelected);

          // 최소 1초 로딩 유지
          const elapsedTime = Date.now() - startTime;
          const remainingTime = Math.max(0, 1000 - elapsedTime);
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
        } catch (error) {
          console.error("시뮬레이션 상태 확인 오류:", error);

          if (cancelled) return;

          // 오류 시 모든 시뮬레이션을 추가 상태로 설정
          const statusMap = {};
          simulations.forEach((sim) => {
            statusMap[sim.id] = "create";
          });
          setSimulationStatusMap(statusMap);
          setSelectedSimulationIds(
            activeSimulationId ? [activeSimulationId] : []
          );

          // 최소 1초 로딩 유지
          const elapsedTime = Date.now() - startTime;
          const remainingTime = Math.max(0, 1000 - elapsedTime);
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
        } finally {
          if (!cancelled) {
            setIsSimSelectionLoading(false);
          }
        }
      } else {
        // 추가 모드일 때는 모든 시뮬레이션을 추가 상태로
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1000 - elapsedTime);
        await new Promise((resolve) => setTimeout(resolve, remainingTime));

        if (cancelled) return;

        const statusMap = {};
        simulations.forEach((sim) => {
          statusMap[sim.id] = "create";
        });
        setSimulationStatusMap(statusMap);
        const defaultSelected = activeSimulationId ? [activeSimulationId] : [];
        setSelectedSimulationIds(defaultSelected);
        setIsSimSelectionLoading(false);
      }
    };

    checkSimulationStatus();

    // cleanup 함수: 다음 useEffect 실행 전이나 컴포넌트 언마운트 시 호출
    return () => {
      cancelled = true;
    };
  }, [isOpen, editData?.id, profileId, simulations, activeSimulationId]);

  // 수정 모드일 때 데이터 로드, 모달이 열릴 때마다 초기화
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          title: editData.title || "",
          savingType: editData.savingType || "standard",
          frequency:
            editData.originalFrequency || editData.frequency || "monthly",
          amount: editData.originalAmount ?? editData.amount ?? "",
          currentAmount: editData.currentAmount ?? "",
          treatAsInitialPurchase: editData.treatAsInitialPurchase || false,
          startYear: parseInt(editData.startYear) || new Date().getFullYear(),
          endYear: parseInt(editData.endYear) || getRetirementYear(),
          memo: editData.memo || "",
          interestRate:
            editData.interestRate !== undefined &&
            editData.interestRate !== null
              ? (editData.interestRate * 100).toFixed(2)
              : "2.86",
          yearlyGrowthRate:
            editData.yearlyGrowthRate !== undefined &&
            editData.yearlyGrowthRate !== null
              ? (editData.yearlyGrowthRate * 100).toFixed(2)
              : "1.89",
          incomeRate:
            editData.incomeRate !== undefined && editData.incomeRate !== null
              ? (editData.incomeRate * 100).toFixed(2)
              : "3",
          capitalGainsTaxRate:
            editData.capitalGainsTaxRate !== undefined &&
            editData.capitalGainsTaxRate !== null
              ? (editData.capitalGainsTaxRate * 100).toFixed(2)
              : "",
          isFixedToRetirementYear: editData.isFixedToRetirementYear || false,
        });
      } else {
        // 새 데이터일 때 초기화
        setFormData({
          title: "",
          savingType: "standard",
          frequency: "monthly",
          amount: "",
          currentAmount: "",
          treatAsInitialPurchase: false,
          startYear: new Date().getFullYear(),
          endYear: getRetirementYear(),
          memo: "수익률 : 2020년부터 2024년까지의 5년간 퇴직연금의 연환산수익률\n증가율 : 연간 저축/투자금액 증가율 (%) → 1.89%",
          interestRate: "2.86",
          yearlyGrowthRate: "1.89",
          incomeRate: "3",
          capitalGainsTaxRate: "",
          isFixedToRetirementYear: false,
        });
      }
    }
  }, [isOpen, editData]);

  // ESC 키로 모달 닫기 + body 스크롤 막기
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        e.stopImmediatePropagation(); // 다른 ESC 핸들러 실행 방지
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
      newErrors.title = "저축/투자 항목명을 입력해주세요.";
    }

    // 금액이 없거나 0보다 작으면 에러 (0은 허용)
    if (
      formData.amount === "" ||
      formData.amount === null ||
      formData.amount === undefined ||
      parseFloat(formData.amount) < 0
    ) {
      newErrors.amount = "저축/투자 금액을 입력해주세요. (0 이상)";
    }

    if (formData.startYear > formData.endYear) {
      newErrors.endYear = "종료년도는 시작년도보다 늦어야 합니다.";
    }

    // 수익형일 때 incomeRate 검증
    if (formData.savingType === "income") {
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

    const savingData = {
      ...formData,
      savingType: formData.savingType, // "standard" 또는 "income"
      amount: parseInt(formData.amount),
      currentAmount: formData.currentAmount
        ? parseInt(formData.currentAmount)
        : 0,
      treatAsInitialPurchase: formData.treatAsInitialPurchase || false,
      startYear: parseInt(formData.startYear), // 문자열을 숫자로 변환
      endYear: parseInt(formData.endYear), // 문자열을 숫자로 변환
      interestRate: parseFloat(formData.interestRate) / 100, // 백분율을 소수로 변환
      yearlyGrowthRate: parseFloat(formData.yearlyGrowthRate) / 100, // 백분율을 소수로 변환
      incomeRate:
        formData.savingType === "income"
          ? parseFloat(formData.incomeRate) / 100
          : 0, // 수익형일 때만 수익률 적용
      capitalGainsTaxRate: formData.capitalGainsTaxRate
        ? parseFloat(formData.capitalGainsTaxRate) / 100
        : 0, // 양도세율 (백분율을 소수로 변환)
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

    onSave(savingData);
    onClose();
  };

  // 모달 닫기 핸들러
  const handleClose = () => {
    setFormData({
      title: "",
      savingType: "standard",
      frequency: "monthly",
      amount: "",
      currentAmount: "",
      treatAsInitialPurchase: false,
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear() + 10,
      memo: "수익률 : 2020년부터 2024년까지의 5년간 퇴직연금의 연환산수익률\n증가율 : 연간 저축/투자금액 증가율 (%) → 1.89%",
      interestRate: "2.86",
      yearlyGrowthRate: "1.89",
      incomeRate: "3",
      capitalGainsTaxRate: "",
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
            {editData ? "저축/투자 수정" : "저축/투자 추가"}
          </h2>
          <button className={styles.closeButton} onClick={handleClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* 저축 항목명 */}
          <div className={styles.field}>
            <label htmlFor="title" className={styles.label}>
              항목명 *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className={`${styles.input} ${errors.title ? styles.error : ""}`}
              placeholder="예: 정기예금, 적금, 주식투자"
            />
            {errors.title && (
              <span className={styles.errorText}>{errors.title}</span>
            )}
          </div>

          {/* 저축 타입 선택 */}
          <div className={styles.field}>
            <label className={styles.label}>저축/투자 타입 *</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="savingType"
                  value="standard"
                  checked={formData.savingType === "standard"}
                  onChange={(e) =>
                    setFormData({ ...formData, savingType: e.target.value })
                  }
                />
                <span className={styles.radioText}>
                  가치성장형(정기예금, 성장주, 금, 암호화폐 등)
                </span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="savingType"
                  value="income"
                  checked={formData.savingType === "income"}
                  onChange={(e) =>
                    setFormData({ ...formData, savingType: e.target.value })
                  }
                />
                <span className={styles.radioText}>
                  수익형(이자, 배당, 채권 등)
                </span>
              </label>
            </div>
          </div>

          {/* 주기와 금액 */}
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
                <option value="one_time">일시납</option>
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
                placeholder="예: 100"
              />
              {formData.amount !== "" && !isNaN(parseInt(formData.amount)) && (
                <div className={styles.amountPreview}>
                  {formatAmountForChart(parseInt(formData.amount))}
                </div>
              )}
              {errors.amount && (
                <span className={styles.errorText}>{errors.amount}</span>
              )}
            </div>
          </div>

          {/* 현재 보유 금액 */}
          <div className={styles.field}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.5rem",
              }}
            >
              <label
                htmlFor="currentAmount"
                className={styles.label}
                style={{ marginBottom: 0 }}
              >
                기 보유 금액 (만원)
              </label>
              <label
                className={styles.fixedCheckboxLabel}
                style={{ marginBottom: 0 }}
              >
                <input
                  type="checkbox"
                  checked={formData.treatAsInitialPurchase}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      treatAsInitialPurchase: e.target.checked,
                    })
                  }
                  className={styles.fixedCheckbox}
                />
                <span className={styles.fixedCheckboxText}>
                  현금유출로 처리
                </span>
              </label>
            </div>
            <input
              type="text"
              id="currentAmount"
              value={formData.currentAmount}
              onChange={(e) =>
                setFormData({ ...formData, currentAmount: e.target.value })
              }
              onKeyPress={handleKeyPress}
              className={styles.input}
              placeholder="예: 500"
            />
            {formData.currentAmount !== "" &&
              !isNaN(parseInt(formData.currentAmount)) && (
                <div className={styles.amountPreview}>
                  {formatAmountForChart(parseInt(formData.currentAmount))}
                </div>
              )}
            <div className={styles.helperText}>
              시작년도 기준으로 이미 보유하고 있는 금액입니다 (선택사항)
              {formData.treatAsInitialPurchase && (
                <span
                  style={{
                    display: "block",
                    color: "#ef4444",
                    marginTop: "0.25rem",
                  }}
                >
                  ※ 구매로 처리 시 시작년도에 현금흐름에서 차감됩니다
                </span>
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
                    은퇴 시점 고정
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

          {/* 이자율과 연간 저축/투자금액 증가율 */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="interestRate" className={styles.label}>
                연평균 수익률 (%)
              </label>
              <input
                type="text"
                id="interestRate"
                value={formData.interestRate}
                onChange={(e) => {
                  const value = e.target.value;
                  // 숫자와 소수점, 마이너스 허용
                  if (value === "" || /^-?\d*\.?\d*$/.test(value)) {
                    setFormData({ ...formData, interestRate: value });
                  }
                }}
                onKeyPress={handleKeyPress}
                className={styles.input}
                placeholder="2.86"
              />
            </div>

            {formData.frequency !== "one_time" && (
              <div className={styles.field}>
                <label htmlFor="yearlyGrowthRate" className={styles.label}>
                  저축/투자액 증가율 (%)
                </label>
                <input
                  type="text"
                  id="yearlyGrowthRate"
                  value={formData.yearlyGrowthRate}
                  onChange={(e) => {
                    const value = e.target.value;
                    // 숫자와 소수점, 마이너스 허용
                    if (value === "" || /^-?\d*\.?\d*$/.test(value)) {
                      setFormData({
                        ...formData,
                        yearlyGrowthRate: value,
                      });
                    }
                  }}
                  onKeyPress={handleKeyPress}
                  className={styles.input}
                  placeholder="1.89"
                />
              </div>
            )}
          </div>

          {/* 양도세율 (기본형일 때만) - 가로 전체 사용 */}
          {formData.savingType === "standard" && (
            <div className={styles.field}>
              <label htmlFor="capitalGainsTaxRate" className={styles.label}>
                양도세율 (%) <span className={styles.optional}>- 선택</span>
              </label>
              <input
                type="text"
                id="capitalGainsTaxRate"
                value={formData.capitalGainsTaxRate}
                onChange={(e) => {
                  const value = e.target.value;
                  // 숫자와 소수점만 허용 (0-100)
                  if (value === "" || /^\d*\.?\d*$/.test(value)) {
                    setFormData({
                      ...formData,
                      capitalGainsTaxRate: value,
                    });
                  }
                }}
                onKeyPress={handleKeyPress}
                className={styles.input}
                placeholder="예: 22 (수익의 22%를 세금으로 납부)"
              />
              <div className={styles.fieldHelper}>
                만기 시 (최종가치 - 원금) × 양도세율을 세금으로 납부합니다.
              </div>
            </div>
          )}

          {/* 수익형 현금: 연간 수익률 (배당, 이자 등) */}
          {formData.savingType === "income" && (
            <div className={styles.field}>
              <label htmlFor="incomeRate" className={styles.label}>
                연간 수익률 (배당, 이자 등) (%) *
              </label>
              <input
                type="text"
                id="incomeRate"
                value={formData.incomeRate}
                onChange={(e) => {
                  const value = e.target.value;
                  // 숫자와 소수점, 마이너스 허용
                  if (value === "" || /^-?\d*\.?\d*$/.test(value)) {
                    setFormData({ ...formData, incomeRate: value });
                  }
                }}
                onKeyPress={handleKeyPress}
                className={`${styles.input} ${
                  errors.incomeRate ? styles.error : ""
                }`}
                placeholder="3"
              />
              {errors.incomeRate && (
                <span className={styles.errorText}>{errors.incomeRate}</span>
              )}
              <div className={styles.fieldHelper}>
                매년 자산 가치의 일정 비율을 현금 수입으로 받습니다.
              </div>
            </div>
          )}

          {/* 메모 */}
          <div className={styles.field}>
            <label htmlFor="memo" className={styles.label}>
              비고
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

          {/* 적용 시뮬레이션 선택 (하단 영역) */}
          {simulations && simulations.length > 0 && (
            <div className={styles.field}>
              <label className={styles.label}>
                적용 시뮬레이션
                {editData && (
                  <span className={styles.hintText}>
                    {" "}
                    (수정: 같은 ID 항목 업데이트, 추가: 새로 생성)
                  </span>
                )}
              </label>
              <div>
                {isSimSelectionLoading ? (
                  <span className={styles.hintText}>
                    시뮬레이션 목록 불러오는 중…
                  </span>
                ) : (
                  simulations.map((sim) => {
                    const status = simulationStatusMap[sim.id] || "create";
                    const statusText = status === "update" ? "(수정)" : "(추가)";
                    return (
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
                          {sim.title || (sim.isDefault ? "현재" : "시뮬레이션")}{" "}
                          <span
                            style={{
                              color: status === "update" ? "#2196F3" : "#4CAF50",
                            }}
                          >
                            {statusText}
                          </span>
                        </span>
                      </label>
                    );
                  })
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

export default SavingModal;
