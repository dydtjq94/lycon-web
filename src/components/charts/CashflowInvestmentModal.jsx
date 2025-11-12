import React, { useState, useEffect } from "react";
import styles from "./CashflowInvestmentModal.module.css";

/**
 * 현금흐름 투자 설정 모달 (고급 버전)
 * 특정 연도의 잉여 현금을 여러 자산에 비율로 분배
 */
function CashflowInvestmentModal({
  isOpen,
  onClose,
  year,
  amount,
  savings = [],
  currentRule = null, // { allocations: [{targetType, targetId, ratio}] }
  positiveYears = [], // 양수 현금흐름이 있는 모든 년도 목록
  onSave,
}) {
  // 초기 배분: 현금 100%
  const [allocations, setAllocations] = useState([
    { targetType: "cash", targetId: "", ratio: 100 },
  ]);

  // 선택된 년도 목록 (기본: 현재 년도만 선택)
  const [selectedYears, setSelectedYears] = useState([year]);

  useEffect(() => {
    if (currentRule && currentRule.allocations) {
      setAllocations(currentRule.allocations);
    } else {
      // 기본값: 현금 100%
      setAllocations([{ targetType: "cash", targetId: "", ratio: 100 }]);
    }
    // 년도 초기화
    setSelectedYears([year]);
  }, [currentRule, isOpen, year]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleEscKey = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 활성 저축 상품 필터링 (해당 연도에 활성화된 저축만)
  const activeSavings = savings.filter(
    (saving) => year >= saving.startYear && year < saving.endYear
  );

  // 총 비율 계산
  const totalRatio = allocations.reduce((sum, item) => sum + item.ratio, 0);

  // 배분 항목 추가
  const handleAddAllocation = () => {
    setAllocations([
      ...allocations,
      { targetType: "cash", targetId: "", ratio: 0 },
    ]);
  };

  // 배분 항목 제거
  const handleRemoveAllocation = (index) => {
    if (allocations.length > 1) {
      setAllocations(allocations.filter((_, i) => i !== index));
    }
  };

  // 배분 항목 업데이트
  const handleUpdateAllocation = (index, field, value) => {
    const updated = [...allocations];
    if (field === "targetType") {
      updated[index].targetType = value;
      updated[index].targetId = ""; // 타입 변경 시 ID 초기화
    } else {
      updated[index][field] = value;
    }
    setAllocations(updated);
  };

  // 년도 선택/해제 토글
  const toggleYear = (yearToToggle) => {
    if (selectedYears.includes(yearToToggle)) {
      // 최소 1개는 선택되어야 함
      if (selectedYears.length > 1) {
        setSelectedYears(selectedYears.filter((y) => y !== yearToToggle));
      }
    } else {
      setSelectedYears([...selectedYears, yearToToggle].sort((a, b) => a - b));
    }
  };

  // 모두 선택/해제
  const toggleAllYears = () => {
    if (selectedYears.length === positiveYears.length) {
      // 모두 선택된 상태 -> 현재 년도만 선택
      setSelectedYears([year]);
    } else {
      // 일부만 선택된 상태 -> 모두 선택
      setSelectedYears(positiveYears.map((item) => item.year));
    }
  };

  // 저장
  const handleSave = () => {
    // 비율이 100%가 아니면 경고
    if (totalRatio !== 100) {
      alert("총 비율이 100%가 되어야 합니다.");
      return;
    }

    // 저축 선택 시 ID가 없으면 경고
    const hasInvalidSaving = allocations.some(
      (item) => item.targetType === "saving" && !item.targetId
    );
    if (hasInvalidSaving) {
      alert("저축/투자 상품을 선택해주세요.");
      return;
    }

    const rule = {
      allocations: allocations.filter((item) => item.ratio > 0),
    };

    // 선택된 년도들에 모두 적용
    onSave(selectedYears, rule);
    onClose();
  };

  // 초기화
  const handleReset = () => {
    setAllocations([{ targetType: "cash", targetId: "", ratio: 100 }]);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className={styles.modalHeader}>
          <h2>{year}년 잉여 현금 투자 설정</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* 본문 */}
        <div className={styles.modalBody}>
          {/* 현금흐름 정보 */}
          <div className={styles.infoBox}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>연도</span>
              <span className={styles.infoValue}>{year}년</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>순 현금흐름</span>
              <span className={styles.infoValue}>
                +{Math.round(amount).toLocaleString()}만원
              </span>
            </div>
          </div>

          {/* 적용 년도 선택 */}
          {positiveYears.length > 1 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <label className={styles.sectionLabel}>적용 년도 선택</label>
                <button
                  className={styles.toggleAllButton}
                  onClick={toggleAllYears}
                  type="button"
                >
                  {selectedYears.length === positiveYears.length
                    ? "현재만"
                    : "모두 선택"}
                </button>
              </div>
              <div className={styles.yearSelectGrid}>
                {positiveYears.map((item) => (
                  <label key={item.year} className={styles.yearCheckbox}>
                    <input
                      type="checkbox"
                      checked={selectedYears.includes(item.year)}
                      onChange={() => toggleYear(item.year)}
                      disabled={
                        item.year === year && selectedYears.length === 1
                      }
                    />
                    <span className={styles.yearLabel}>
                      {item.year}년
                      <span className={styles.yearAmount}>
                        +{Math.round(item.amount).toLocaleString()}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <div className={styles.yearSelectHint}>
                💡 선택한 {selectedYears.length}개 년도에 동일한 투자 규칙이
                적용됩니다
              </div>
            </div>
          )}

          {/* 배분 목록 */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <label className={styles.sectionLabel}>투자 배분</label>
              <span
                className={
                  totalRatio === 100
                    ? styles.ratioStatus
                    : styles.ratioStatusError
                }
              >
                총 {totalRatio}%
              </span>
            </div>

            {allocations.map((allocation, index) => (
              <div key={index} className={styles.allocationItem}>
                {/* 투자 대상 선택 */}
                <div className={styles.allocationRow}>
                  <select
                    className={styles.select}
                    value={allocation.targetType}
                    onChange={(e) =>
                      handleUpdateAllocation(index, "targetType", e.target.value)
                    }
                  >
                    <option value="cash">현금</option>
                    <option value="saving">저축/투자</option>
                  </select>

                  {/* 저축 상품 선택 */}
                  {allocation.targetType === "saving" && (
                    <select
                      className={styles.select}
                      value={allocation.targetId}
                      onChange={(e) =>
                        handleUpdateAllocation(index, "targetId", e.target.value)
                      }
                    >
                      <option value="">상품 선택</option>
                      {activeSavings.map((saving) => (
                        <option key={saving.id} value={saving.id}>
                          {saving.title}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* 비율 입력 */}
                  <div className={styles.ratioInput}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={allocation.ratio === 0 ? "" : allocation.ratio}
                      placeholder="0"
                      onChange={(e) => {
                        const value = e.target.value;
                        // 빈 문자열이면 0으로, 숫자가 있으면 parseInt 적용
                        const numValue = value === "" ? 0 : parseInt(value);
                        handleUpdateAllocation(
                          index,
                          "ratio",
                          isNaN(numValue) ? 0 : Math.min(100, Math.max(0, numValue))
                        );
                      }}
                    />
                    <span>%</span>
                  </div>

                  {/* 삭제 버튼 */}
                  {allocations.length > 1 && (
                    <button
                      className={styles.removeButton}
                      onClick={() => handleRemoveAllocation(index)}
                      title="삭제"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* 예상 투자액 */}
                <div className={styles.allocationAmount}>
                  예상 투자액: {Math.round((amount * allocation.ratio) / 100).toLocaleString()}만원
                </div>
              </div>
            ))}

            {/* 추가 버튼 */}
            {activeSavings.length > 0 && (
              <button
                className={styles.addButton}
                onClick={handleAddAllocation}
              >
                + 배분 추가
              </button>
            )}
          </div>

          {/* 설명 */}
          <div className={styles.description}>
            <p>💡 투자된 금액은 다음 해부터 해당 자산의 수익률이 적용됩니다.</p>
          </div>
        </div>

        {/* 푸터 */}
        <div className={styles.modalFooter}>
          <button className={styles.resetButton} onClick={handleReset}>
            초기화
          </button>
          <div className={styles.buttonGroup}>
            <button className={styles.cancelButton} onClick={onClose}>
              취소
            </button>
            <button
              className={styles.saveButton}
              onClick={handleSave}
              disabled={totalRatio !== 100}
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CashflowInvestmentModal;
