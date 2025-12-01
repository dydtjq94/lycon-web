import React, { useState, useEffect } from "react";
import styles from "./AssetWithdrawalModal.module.css";
import { formatAmount } from "../../utils/format";

/**
 * 자산 인출 설정 모달
 * 저축/투자 자산에서 현금으로 인출하는 금액 설정
 */
function AssetWithdrawalModal({
  isOpen,
  onClose,
  year,
  savings = [],
  detailedData = [], // 해당 연도의 자산 잔액 정보
  currentRule = null, // { withdrawals: [{sourceType, sourceId, amount}] }
  withdrawableYears = [], // 인출 가능한 년도 목록 (자산이 있는 년도)
  onSave,
  onYearChange,
}) {
  // 선택된 년도들 (기본: 현재 년도만)
  const [selectedYears, setSelectedYears] = useState([year]);

  // 범위 슬라이더용 상태 (인덱스 기반)
  const [rangeStartIdx, setRangeStartIdx] = useState(0);
  const [rangeEndIdx, setRangeEndIdx] = useState(0);

  // 인출 금액 (각 자산별)
  const [withdrawals, setWithdrawals] = useState({});

  // 모달이 열릴 때 배경 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    // 현재 년도의 인덱스 찾기
    const currentYearIdx = withdrawableYears.findIndex(
      (item) => item.year === year
    );

    if (currentYearIdx !== -1) {
      setRangeStartIdx(currentYearIdx);
      setRangeEndIdx(currentYearIdx);
      setSelectedYears([year]);
    } else {
      setRangeStartIdx(0);
      setRangeEndIdx(0);
      setSelectedYears([year]);
    }

    // 기존 규칙이 있으면 로드
    if (currentRule && currentRule.withdrawals && currentRule.withdrawals.length > 0) {
      const newWithdrawals = {};
      currentRule.withdrawals.forEach((withdrawal) => {
        newWithdrawals[withdrawal.sourceId] = withdrawal.amount;
      });
      setWithdrawals(newWithdrawals);
    } else {
      setWithdrawals({});
    }
  }, [currentRule, isOpen, year, withdrawableYears]);

  // ESC 키로 모달 닫기 및 방향키로 연도 이동
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        if (!withdrawableYears || withdrawableYears.length === 0) return;

        const currentIndex = withdrawableYears.findIndex(
          (item) => item.year === year
        );
        if (currentIndex === -1) return;

        let newIndex = currentIndex;
        if (e.key === "ArrowRight") {
          newIndex = currentIndex + 1;
        } else if (e.key === "ArrowLeft") {
          newIndex = currentIndex - 1;
        }

        if (newIndex >= 0 && newIndex < withdrawableYears.length) {
          const newYearData = withdrawableYears[newIndex];
          if (onYearChange) {
            onYearChange(newYearData.year);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, year, withdrawableYears, onYearChange]);

  // 범위 변경 시 선택된 년도 업데이트 (훅은 조기 반환 전에 호출되어야 함)
  useEffect(() => {
    if (withdrawableYears.length === 0) return;

    const yearsInRange = withdrawableYears
      .slice(rangeStartIdx, rangeEndIdx + 1)
      .map((item) => item.year);

    setSelectedYears(yearsInRange);
  }, [rangeStartIdx, rangeEndIdx, withdrawableYears]);

  if (!isOpen) return null;

  // 해당 연도의 자산 잔액 가져오기
  const yearData = detailedData.find((d) => d.year === year);
  const breakdown = yearData?.breakdown || {};

  // 활성 저축 상품 필터링 (잔액이 있는 저축만, label/title로 비교)
  const activeSavings = savings.filter((saving) => {
    // 잔액 확인 (label로 비교)
    const assetItem = breakdown.assetItems?.find(
      (item) => item.label === saving.title && item.sourceType === "saving"
    );
    return assetItem && assetItem.amount > 0;
  });

  // 자산별 현재 잔액 가져오기 (label/title로 비교, 정수로 반환)
  const getAssetBalance = (title) => {
    const assetItem = breakdown.assetItems?.find(
      (item) => item.label === title && item.sourceType === "saving"
    );
    return Math.round(assetItem?.amount || 0);
  };

  // 총 인출 금액 계산
  const totalWithdrawal = Object.values(withdrawals).reduce(
    (sum, amount) => sum + (amount || 0),
    0
  );

  // 인출 금액 업데이트
  const handleWithdrawalChange = (id, value) => {
    const numValue = value === "" ? 0 : parseInt(value);
    setWithdrawals({
      ...withdrawals,
      [id]: isNaN(numValue) ? 0 : Math.max(0, numValue),
    });
  };

  // 전액 인출 버튼 (title로 잔액을 찾고, id로 상태 업데이트)
  const handleWithdrawAll = (id, title) => {
    const balance = getAssetBalance(title);
    setWithdrawals({
      ...withdrawals,
      [id]: balance,
    });
  };

  // 저장
  const handleSave = () => {
    // 잔액 초과 검사
    for (const [id, amount] of Object.entries(withdrawals)) {
      if (amount > 0) {
        const saving = activeSavings.find((s) => s.id === id);
        if (saving) {
          const balance = getAssetBalance(saving.title);
          if (amount > balance) {
            alert(`${saving.title}의 잔액(${formatAmount(balance)})을 초과할 수 없습니다.`);
            return;
          }
        }
      }
    }

    // withdrawals 배열 생성
    const withdrawalList = [];

    activeSavings.forEach((saving) => {
      const amount = withdrawals[saving.id] || 0;
      if (amount > 0) {
        withdrawalList.push({
          sourceType: "saving",
          sourceId: saving.id,
          sourceTitle: saving.title,
          amount: amount,
        });
      }
    });

    // 인출 데이터가 없으면 규칙 삭제 (null 전달)
    const rule = withdrawalList.length === 0
      ? null
      : { withdrawals: withdrawalList };

    onSave(selectedYears, rule);
    onClose();
  };

  // 초기화
  const handleReset = () => {
    setWithdrawals({});
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className={styles.modalHeader}>
          <h2>{year}년 자산 인출 설정</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* 본문 */}
        <div className={styles.modalBody}>
          {/* 설명 */}
          <div className={styles.description}>
            <p>
              저축/투자 또는 연금 자산에서 현금으로 인출할 금액을 설정합니다.
              인출된 금액은 현금흐름 시뮬레이션에 수입으로 반영됩니다.
            </p>
          </div>

          {/* 적용 범위 선택 - 범위 슬라이더 */}
          {withdrawableYears.length > 1 && (
            <div className={styles.rangeSliderSection}>
              <div className={styles.sectionLabel}>적용 범위 선택</div>

              <div className={styles.sliderContainer}>
                <div className={styles.dualSlider}>
                  <div className={styles.sliderTrack}>
                    <div
                      className={styles.sliderRange}
                      style={{
                        left:
                          rangeStartIdx === 0
                            ? "0px"
                            : `calc(${
                                (rangeStartIdx / (withdrawableYears.length - 1)) *
                                100
                              }% - 12px)`,
                        right:
                          rangeEndIdx === withdrawableYears.length - 1
                            ? "0px"
                            : `calc(${
                                100 -
                                (rangeEndIdx / (withdrawableYears.length - 1)) * 100
                              }% - 12px)`,
                      }}
                    />
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={withdrawableYears.length - 1}
                    value={rangeStartIdx}
                    onChange={(e) => {
                      const newStartIdx = parseInt(e.target.value);
                      if (newStartIdx <= rangeEndIdx) {
                        setRangeStartIdx(newStartIdx);
                      }
                    }}
                    className={`${styles.sliderInput} ${styles.sliderInputStart}`}
                  />

                  <input
                    type="range"
                    min={0}
                    max={withdrawableYears.length - 1}
                    value={rangeEndIdx}
                    onChange={(e) => {
                      const newEndIdx = parseInt(e.target.value);
                      if (newEndIdx >= rangeStartIdx) {
                        setRangeEndIdx(newEndIdx);
                      }
                    }}
                    className={`${styles.sliderInput} ${styles.sliderInputEnd}`}
                  />
                </div>

                <div className={styles.minMaxLabels}>
                  <span>{withdrawableYears[0]?.year}</span>
                  <span>{withdrawableYears[withdrawableYears.length - 1]?.year}</span>
                </div>
              </div>

              <div className={styles.rangeInfo}>
                {rangeStartIdx === rangeEndIdx ? (
                  <span className={styles.rangeYears}>
                    {withdrawableYears[rangeStartIdx]?.year}년
                  </span>
                ) : (
                  <span className={styles.rangeYears}>
                    {withdrawableYears[rangeStartIdx]?.year}년 ~{" "}
                    {withdrawableYears[rangeEndIdx]?.year}년
                  </span>
                )}
                <span className={styles.selectedCount}>
                  {selectedYears.length}개 년도
                </span>
              </div>
            </div>
          )}

          {/* 인출 대상 목록 */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <label className={styles.sectionLabel}>인출 대상</label>
              {totalWithdrawal > 0 && (
                <span className={styles.totalWithdrawal}>
                  총 {formatAmount(totalWithdrawal)}
                </span>
              )}
            </div>

            {/* 저축 상품들 */}
            {activeSavings.length > 0 && (
              <div className={styles.categorySection}>
                <div className={styles.categoryLabel}>저축/투자</div>
                {activeSavings.map((saving) => {
                  const balance = getAssetBalance(saving.title);
                  const withdrawalAmount = withdrawals[saving.id] || 0;

                  return (
                    <div key={saving.id} className={styles.withdrawalItem}>
                      <div className={styles.withdrawalRow}>
                        <div className={styles.assetInfo}>
                          <span className={styles.assetName}>{saving.title}</span>
                          <span className={styles.assetBalance}>
                            잔액: {formatAmount(balance)}
                          </span>
                        </div>
                        <div className={styles.inputGroup}>
                          <input
                            type="number"
                            min="0"
                            max={balance}
                            value={withdrawalAmount === 0 ? "" : withdrawalAmount}
                            placeholder="0"
                            onChange={(e) =>
                              handleWithdrawalChange(saving.id, e.target.value)
                            }
                            onWheel={(e) => e.target.blur()}
                            className={styles.amountInput}
                          />
                          <span className={styles.unit}>만원</span>
                          <button
                            className={styles.allButton}
                            onClick={() => handleWithdrawAll(saving.id, saving.title)}
                            type="button"
                          >
                            전액
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeSavings.length === 0 && (
              <div className={styles.noAssets}>
                해당 년도에 인출 가능한 자산이 없습니다.
              </div>
            )}
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
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssetWithdrawalModal;
