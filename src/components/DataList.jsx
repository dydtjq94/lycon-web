// 데이터 목록 컴포넌트 (공통)
import React, { useState } from "react";
import { formatDate, getTodayString, isValidDate } from "../utils/date.js";
import styles from "./DataList.module.css";

export default function DataList({ items, category, onEdit, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [errors, setErrors] = useState({});

  // 카테고리별 설정
  const categoryConfig = {
    incomes: {
      title: "수입",
      icon: "💰",
      rateLabel: "수익률 (%/년)",
      showRate: false,
      growthRateLabel: "연간 상승률 (%/년)",
      showGrowthRate: true,
    },
    assets: {
      title: "자산",
      icon: "🏦",
      rateLabel: "수익률 (%/년)",
      showRate: true,
      growthRateLabel: "상승률 (%/년)",
      showGrowthRate: false,
    },
    debts: {
      title: "부채",
      icon: "💳",
      rateLabel: "이자율 (%/년)",
      showRate: true,
      growthRateLabel: "상승률 (%/년)",
      showGrowthRate: false,
    },
    expenses: {
      title: "지출",
      icon: "💸",
      rateLabel: "수익률 (%/년)",
      showRate: false,
      growthRateLabel: "물가 상승률 (%/년)",
      showGrowthRate: true,
    },
    pensions: {
      title: "연금",
      icon: "🏛️",
      rateLabel: "수익률 (%/년)",
      showRate: false,
      growthRateLabel: "상승률 (%/년)",
      showGrowthRate: false,
    },
  };

  const config = categoryConfig[category] || categoryConfig.incomes;

  // 편집 모드 시작
  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditData({
      title: item.title,
      amount: item.amount,
      startDate: item.startDate,
      endDate: item.endDate || "",
      frequency: item.frequency,
      note: item.note || "",
      rate: item.rate || "",
      growthRate: item.growthRate || "",
    });
    setErrors({});
  };

  // 편집 취소
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
    setErrors({});
  };

  // 빈도 변경 핸들러
  const handleFrequencyChange = (e) => {
    const frequency = e.target.value;
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    let newStartDate = editData.startDate;
    let newEndDate = editData.endDate;

    switch (frequency) {
      case "yearly":
        newStartDate = editData.startDate
          ? editData.startDate.split("-")[0] + "-01-01"
          : `${currentYear}-01-01`;
        newEndDate = editData.startDate
          ? editData.startDate.split("-")[0] + "-12-31"
          : `${currentYear}-12-31`;
        break;
      case "quarterly":
        newStartDate = editData.startDate
          ? editData.startDate.split("-")[0] + "-01-01"
          : `${currentYear}-01-01`;
        newEndDate = editData.startDate
          ? editData.startDate.split("-")[0] + "-03-31"
          : `${currentYear}-03-31`;
        break;
      case "monthly":
        newStartDate = editData.startDate
          ? editData.startDate.split("-")[0] +
            "-" +
            editData.startDate.split("-")[1] +
            "-01"
          : `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
        newEndDate = editData.startDate
          ? editData.startDate.split("-")[0] +
            "-" +
            editData.startDate.split("-")[1] +
            "-" +
            new Date(
              parseInt(editData.startDate.split("-")[0]),
              parseInt(editData.startDate.split("-")[1]),
              0
            ).getDate()
          : `${currentYear}-${String(currentMonth).padStart(2, "0")}-${new Date(
              currentYear,
              currentMonth,
              0
            ).getDate()}`;
        break;
      case "daily":
        newStartDate = editData.startDate || getTodayString();
        newEndDate = editData.endDate || getTodayString();
        break;
      case "once":
        newStartDate = editData.startDate
          ? editData.startDate.split("-")[0] + "-01-01"
          : `${currentYear}-01-01`;
        newEndDate = editData.startDate
          ? editData.startDate.split("-")[0] + "-12-31"
          : `${currentYear}-12-31`;
        break;
    }

    setEditData((prev) => ({
      ...prev,
      frequency,
      startDate: newStartDate,
      endDate: newEndDate,
    }));
  };

  // 년도 변경 핸들러
  const handleYearChange = (e, type) => {
    const year = e.target.value;
    const newDate = type === "start" ? `${year}-01-01` : `${year}-12-31`;

    setEditData((prev) => ({
      ...prev,
      [type === "start" ? "startDate" : "endDate"]: newDate,
    }));
  };

  // 분기 변경 핸들러
  const handleQuarterChange = (e, type) => {
    const { year, quarter } = JSON.parse(e.target.value);
    const startMonth = (quarter - 1) * 3 + 1;
    const endMonth = quarter * 3;
    const startDate = new Date(year, startMonth - 1, 1);
    const endDate = new Date(year, endMonth, 0);

    const newDate = `${year}-${String(startMonth).padStart(2, "0")}-01`;

    setEditData((prev) => ({
      ...prev,
      [type === "start" ? "startDate" : "endDate"]: newDate,
    }));
  };

  // 월 변경 핸들러
  const handleMonthChange = (e, type) => {
    const { year, month } = JSON.parse(e.target.value);
    const newDate = `${year}-${String(month).padStart(2, "0")}-01`;

    setEditData((prev) => ({
      ...prev,
      [type === "start" ? "startDate" : "endDate"]: newDate,
    }));
  };

  // 편집 데이터 변경
  const handleEditChange = (field, value) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // 해당 필드의 오류 제거
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  // 폼 유효성 검증
  const validateForm = () => {
    const newErrors = {};

    // 제목 검증
    if (!editData.title?.trim()) {
      newErrors.title = "제목을 입력해주세요.";
    }

    // 금액 검증
    if (!editData.amount || editData.amount <= 0) {
      newErrors.amount = "금액을 입력해주세요.";
    }

    // 시작일 검증
    if (!editData.startDate) {
      newErrors.startDate = "시작일을 선택해주세요.";
    } else if (!isValidDate(editData.startDate)) {
      newErrors.startDate = "올바른 날짜 형식이 아닙니다.";
    }

    // 종료일 검증 (입력된 경우)
    if (editData.endDate && !isValidDate(editData.endDate)) {
      newErrors.endDate = "올바른 날짜 형식이 아닙니다.";
    } else if (
      editData.endDate &&
      editData.startDate &&
      editData.endDate <= editData.startDate
    ) {
      newErrors.endDate = "종료일은 시작일보다 늦어야 합니다.";
    }

    // 수익률/이자율 검증 (해당 카테고리인 경우)
    if (
      config.showRate &&
      editData.rate &&
      (editData.rate < -100 || editData.rate > 100)
    ) {
      newErrors.rate = "수익률/이자율은 -100%에서 100% 사이여야 합니다.";
    }

    // 상승률 검증 (해당 카테고리인 경우)
    if (
      config.showGrowthRate &&
      editData.growthRate &&
      (editData.growthRate < -100 || editData.growthRate > 100)
    ) {
      newErrors.growthRate = "상승률은 -100%에서 100% 사이여야 합니다.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 편집 저장
  const handleSaveEdit = () => {
    if (validateForm()) {
      onEdit(editingId, editData);
      setEditingId(null);
      setEditData({});
      setErrors({});
    }
  };

  // 통화 포맷팅
  const formatAmount = (amount) => {
    if (amount === null || amount === undefined) return "0원";
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // 빈도 한글 변환
  const getFrequencyText = (frequency) => {
    const frequencyMap = {
      daily: "일일",
      monthly: "월",
      quarterly: "분기",
      yearly: "년",
      once: "일회성",
    };
    return frequencyMap[frequency] || frequency;
  };

  // 카테고리명 변환
  const getCategoryName = (category) => {
    const categoryMap = {
      incomes: "수입",
      assets: "자산",
      debts: "부채",
      expenses: "지출",
      pensions: "연금",
    };
    return categoryMap[category] || category;
  };

  // 년도 옵션 생성 (현재 년도부터 2100년까지)
  const currentYear = new Date().getFullYear();
  const endYear = 2100;
  const yearOptions = Array.from(
    { length: endYear - currentYear + 1 },
    (_, i) => currentYear + i
  );

  // 분기 옵션 생성
  const quarterOptions = [];
  for (let year = currentYear; year <= endYear; year++) {
    for (let quarter = 1; quarter <= 4; quarter++) {
      quarterOptions.push({
        value: JSON.stringify({ year, quarter }),
        label: `${year}년 ${quarter}분기`,
      });
    }
  }

  // 월 옵션 생성
  const monthOptions = [];
  for (let year = currentYear; year <= endYear; year++) {
    for (let month = 1; month <= 12; month++) {
      monthOptions.push({
        value: JSON.stringify({ year, month }),
        label: `${year}년 ${month}월`,
      });
    }
  }

  if (items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>아직 {getCategoryName(category)} 데이터가 없습니다.</p>
        <p>새로운 항목을 추가해보세요.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {items.map((item) => (
        <div key={item.id} className={styles.item}>
          {editingId === item.id ? (
            // 편집 모드
            <div className={styles.editForm}>
              <div className={styles.editField}>
                <label>제목 *</label>
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => handleEditChange("title", e.target.value)}
                  className={`${styles.editInput} ${
                    errors.title ? styles.inputError : ""
                  }`}
                />
                {errors.title && (
                  <span className={styles.errorText}>{errors.title}</span>
                )}
              </div>

              <div className={styles.editField}>
                <label>금액 (원) *</label>
                <input
                  type="number"
                  value={editData.amount}
                  onChange={(e) =>
                    handleEditChange("amount", Number(e.target.value))
                  }
                  className={`${styles.editInput} ${
                    errors.amount ? styles.inputError : ""
                  }`}
                  min="0"
                  step="1"
                />
                {errors.amount && (
                  <span className={styles.errorText}>{errors.amount}</span>
                )}
              </div>

              <div className={styles.editField}>
                <label>빈도 *</label>
                <select
                  value={editData.frequency}
                  onChange={handleFrequencyChange}
                  className={styles.editInput}
                >
                  <option value="yearly">년</option>
                  <option value="quarterly">분기</option>
                  <option value="monthly">월</option>
                  <option value="daily">일</option>
                  <option value="once">일회성</option>
                </select>
              </div>

              {/* 일회성: 년도만 선택 */}
              {editData.frequency === "once" && (
                <div className={styles.editField}>
                  <label>적용 년도 *</label>
                  <select
                    value={
                      editData.startDate
                        ? editData.startDate.split("-")[0]
                        : currentYear
                    }
                    onChange={(e) => handleYearChange(e, "start")}
                    className={styles.editInput}
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}년
                      </option>
                    ))}
                  </select>
                  <span className={styles.helpText}>
                    일회성 항목은 선택한 년도 전체에 적용됩니다.
                  </span>
                </div>
              )}

              {/* 년: 시작년도, 끝년도 */}
              {editData.frequency === "yearly" && (
                <>
                  <div className={styles.editField}>
                    <label>시작 년도 *</label>
                    <select
                      value={
                        editData.startDate
                          ? editData.startDate.split("-")[0]
                          : currentYear
                      }
                      onChange={(e) => handleYearChange(e, "start")}
                      className={styles.editInput}
                    >
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}년
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.editField}>
                    <label>끝 년도</label>
                    <select
                      value={
                        editData.endDate
                          ? editData.endDate.split("-")[0]
                          : currentYear
                      }
                      onChange={(e) => handleYearChange(e, "end")}
                      className={styles.editInput}
                    >
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}년
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* 분기: 시작년도&분기, 끝년도&분기 */}
              {editData.frequency === "quarterly" && (
                <>
                  <div className={styles.editField}>
                    <label>시작 분기 *</label>
                    <select
                      value={JSON.stringify({
                        year: editData.startDate
                          ? parseInt(editData.startDate.split("-")[0])
                          : currentYear,
                        quarter: editData.startDate
                          ? Math.ceil(
                              parseInt(editData.startDate.split("-")[1]) / 3
                            )
                          : 1,
                      })}
                      onChange={(e) => handleQuarterChange(e, "start")}
                      className={styles.editInput}
                    >
                      {quarterOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.editField}>
                    <label>끝 분기</label>
                    <select
                      value={JSON.stringify({
                        year: editData.endDate
                          ? parseInt(editData.endDate.split("-")[0])
                          : currentYear,
                        quarter: editData.endDate
                          ? Math.ceil(
                              parseInt(editData.endDate.split("-")[1]) / 3
                            )
                          : 1,
                      })}
                      onChange={(e) => handleQuarterChange(e, "end")}
                      className={styles.editInput}
                    >
                      {quarterOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* 월: 시작년도&월, 끝년도&월 */}
              {editData.frequency === "monthly" && (
                <>
                  <div className={styles.editField}>
                    <label>시작 월 *</label>
                    <select
                      value={JSON.stringify({
                        year: editData.startDate
                          ? parseInt(editData.startDate.split("-")[0])
                          : currentYear,
                        month: editData.startDate
                          ? parseInt(editData.startDate.split("-")[1])
                          : 1,
                      })}
                      onChange={(e) => handleMonthChange(e, "start")}
                      className={styles.editInput}
                    >
                      {monthOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.editField}>
                    <label>끝 월</label>
                    <select
                      value={JSON.stringify({
                        year: editData.endDate
                          ? parseInt(editData.endDate.split("-")[0])
                          : currentYear,
                        month: editData.endDate
                          ? parseInt(editData.endDate.split("-")[1])
                          : 1,
                      })}
                      onChange={(e) => handleMonthChange(e, "end")}
                      className={styles.editInput}
                    >
                      {monthOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* 일: 시작년도&월&일, 끝년도&월&일 */}
              {editData.frequency === "daily" && (
                <>
                  <div className={styles.editField}>
                    <label>시작일 *</label>
                    <input
                      type="date"
                      value={editData.startDate}
                      onChange={(e) =>
                        handleEditChange("startDate", e.target.value)
                      }
                      className={`${styles.editInput} ${
                        errors.startDate ? styles.inputError : ""
                      }`}
                    />
                    {errors.startDate && (
                      <span className={styles.errorText}>
                        {errors.startDate}
                      </span>
                    )}
                  </div>

                  <div className={styles.editField}>
                    <label>종료일</label>
                    <input
                      type="date"
                      value={editData.endDate}
                      onChange={(e) =>
                        handleEditChange("endDate", e.target.value)
                      }
                      className={`${styles.editInput} ${
                        errors.endDate ? styles.inputError : ""
                      }`}
                    />
                    {errors.endDate && (
                      <span className={styles.errorText}>{errors.endDate}</span>
                    )}
                  </div>
                </>
              )}

              {config.showRate && (
                <div className={styles.editField}>
                  <label>{config.rateLabel}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editData.rate}
                    onChange={(e) => handleEditChange("rate", e.target.value)}
                    className={`${styles.editInput} ${
                      errors.rate ? styles.inputError : ""
                    }`}
                    min="-100"
                    max="100"
                  />
                  {errors.rate && (
                    <span className={styles.errorText}>{errors.rate}</span>
                  )}
                </div>
              )}

              {config.showGrowthRate && (
                <div className={styles.editField}>
                  <label>{config.growthRateLabel}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editData.growthRate}
                    onChange={(e) =>
                      handleEditChange("growthRate", e.target.value)
                    }
                    className={`${styles.editInput} ${
                      errors.growthRate ? styles.inputError : ""
                    }`}
                    min="-100"
                    max="100"
                    placeholder="예: 3.0 (기본값: 0)"
                  />
                  {errors.growthRate && (
                    <span className={styles.errorText}>
                      {errors.growthRate}
                    </span>
                  )}
                  <span className={styles.helpText}>
                    {category === "incomes"
                      ? "수입이 매년 상승하는 비율입니다. (예: 급여 3% 상승, 사업 수익 증가 등)"
                      : "물가 상승에 따른 지출 증가 비율입니다. (예: 2% 상승)"}
                  </span>
                </div>
              )}

              <div className={styles.editField}>
                <label>메모</label>
                <textarea
                  value={editData.note}
                  onChange={(e) => handleEditChange("note", e.target.value)}
                  className={styles.editInput}
                  rows="2"
                />
              </div>

              <div className={styles.editActions}>
                <button onClick={handleSaveEdit} className={styles.saveButton}>
                  저장
                </button>
                <button
                  onClick={handleCancelEdit}
                  className={styles.cancelButton}
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            // 표시 모드
            <div className={styles.itemContent}>
              <div className={styles.itemHeader}>
                <h3 className={styles.itemTitle}>{item.title}</h3>
                <div className={styles.itemActions}>
                  <button
                    onClick={() => handleStartEdit(item)}
                    className={styles.editButton}
                    title="수정"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => onDelete(item.id, item.title)}
                    className={styles.deleteButton}
                    title="삭제"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className={styles.itemDetails}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>금액:</span>
                  <span className={styles.detailValue}>
                    {formatAmount(item.amount)}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>빈도:</span>
                  <span className={styles.detailValue}>
                    {getFrequencyText(item.frequency)}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>시작일:</span>
                  <span className={styles.detailValue}>
                    {formatDate(item.startDate)}
                  </span>
                </div>
                {item.endDate && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>종료일:</span>
                    <span className={styles.detailValue}>
                      {formatDate(item.endDate)}
                    </span>
                  </div>
                )}
                {item.rate && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>
                      {config.rateLabel}:
                    </span>
                    <span className={styles.detailValue}>{item.rate}%</span>
                  </div>
                )}
                {item.growthRate && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>
                      {config.growthRateLabel}:
                    </span>
                    <span className={styles.detailValue}>
                      {item.growthRate}%
                    </span>
                  </div>
                )}
                {item.note && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>메모:</span>
                    <span className={styles.detailValue}>{item.note}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
