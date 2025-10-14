// 데이터 목록 컴포넌트 (공통)
import React, { useState } from "react";
import {
  formatDate,
  formatYear,
  getTodayString,
  isValidDate,
} from "../utils/date.js";
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
      showGrowthRate: false, // 전역 설정으로 관리
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
      showDebtFields: true,
    },
    expenses: {
      title: "지출",
      icon: "💸",
      rateLabel: "수익률 (%/년)",
      showRate: false,
      growthRateLabel: "물가 상승률 (%/년)",
      showGrowthRate: false, // 전역 설정으로 관리
    },
    pensions: {
      title: "연금",
      icon: "🏛️",
      rateLabel: "수익률 (%/년)",
      showRate: false,
      growthRateLabel: "상승률 (%/년)",
      showGrowthRate: false, // 전역 설정으로 관리
      showPensionFields: true,
    },
  };

  const config = categoryConfig[category] || categoryConfig.incomes;

  // 편집 모드 시작
  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditData({
      title: item.title,
      amount: item.amount,
      startYear: item.startDate
        ? parseInt(item.startDate.split("-")[0])
        : new Date().getFullYear(),
      endYear: item.endDate
        ? parseInt(item.endDate.split("-")[0])
        : new Date().getFullYear(),
      frequency: item.frequency,
      note: item.note || "",
      rate: item.rate || "",
      growthRate: item.growthRate || "",
      // 부채 관련 필드
      principalAmount: item.principalAmount || "",
      interestRate: item.interestRate || "",
      repaymentType: item.repaymentType || "equal_payment",
      monthlyPayment: item.monthlyPayment || "",
      minimumPaymentRate: item.minimumPaymentRate || "",
      // 연금 관련 필드
      pensionType: item.pensionType || "national",
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
    setEditData((prev) => ({
      ...prev,
      frequency,
    }));
  };

  // 년도 변경 핸들러
  const handleYearChange = (e, type) => {
    const year = parseInt(e.target.value);
    setEditData((prev) => ({
      ...prev,
      [type === "start" ? "startYear" : "endYear"]: year,
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

    // 금액 검증 (부채가 아닌 경우에만)
    if (category !== "debts" && (!editData.amount || editData.amount <= 0)) {
      newErrors.amount = "금액을 입력해주세요.";
    }

    // 시작년도 검증
    if (
      !editData.startYear ||
      editData.startYear < 1900 ||
      editData.startYear > 2100
    ) {
      newErrors.startYear = "올바른 시작년도를 입력해주세요.";
    }
    // 종료년도 검증 (입력된 경우)
    if (
      editData.endYear &&
      (editData.endYear < 1900 || editData.endYear > 2100)
    ) {
      newErrors.endYear = "올바른 종료년도를 입력해주세요.";
    } else if (
      editData.endYear &&
      editData.startYear &&
      editData.endYear < editData.startYear
    ) {
      newErrors.endYear = "종료년도는 시작년도보다 늦어야 합니다.";
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

    // 연금 관련 검증 (단순화)
    if (config.showPensionFields) {
      // 연금 종류는 필수이지만 기본값이 있으므로 검증 생략
    }

    // 부채 관련 검증
    if (config.showDebtFields) {
      // 대출 원금 검증
      if (!editData.principalAmount || editData.principalAmount <= 0) {
        newErrors.principalAmount = "대출 원금을 입력해주세요.";
      }

      // 이자율 검증
      if (
        !editData.interestRate ||
        editData.interestRate < 0 ||
        editData.interestRate > 50
      ) {
        newErrors.interestRate = "이자율을 입력해주세요. (0-50%)";
      }

      // 고정월상환인 경우 월 상환액 검증
      if (editData.repaymentType === "fixed_payment") {
        if (!editData.monthlyPayment || editData.monthlyPayment <= 0) {
          newErrors.monthlyPayment = "월 상환액을 입력해주세요.";
        }
      }

      // 최소상환인 경우 최소 상환 비율 검증
      if (editData.repaymentType === "minimum_payment") {
        if (
          !editData.minimumPaymentRate ||
          editData.minimumPaymentRate <= 0 ||
          editData.minimumPaymentRate > 100
        ) {
          newErrors.minimumPaymentRate =
            "최소 상환 비율을 입력해주세요. (0.1-100%)";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 편집 저장
  const handleSaveEdit = () => {
    if (validateForm()) {
      // AddDataModal과 동일한 형식으로 데이터 변환
      const submitData = {
        title: editData.title.trim(),
        ...(category !== "debts" && { amount: Number(editData.amount) }),
        startDate: `${editData.startYear}-01-01`,
        endDate: editData.endYear ? `${editData.endYear}-12-31` : null,
        ...(category !== "debts" && { frequency: editData.frequency }),
        note: editData.note?.trim() || null,
        rate: config.showRate && editData.rate ? Number(editData.rate) : null,
        growthRate:
          config.showGrowthRate && editData.growthRate
            ? Number(editData.growthRate)
            : null,
        principalAmount:
          config.showDebtFields && editData.principalAmount
            ? Number(editData.principalAmount)
            : null,
        interestRate:
          config.showDebtFields && editData.interestRate
            ? Number(editData.interestRate)
            : null,
        repaymentType: config.showDebtFields ? editData.repaymentType : null,
        monthlyPayment:
          config.showDebtFields && editData.monthlyPayment
            ? Number(editData.monthlyPayment)
            : null,
        minimumPaymentRate:
          config.showDebtFields && editData.minimumPaymentRate
            ? Number(editData.minimumPaymentRate)
            : null,
        pensionType: config.showPensionFields ? editData.pensionType : null,
      };

      onEdit(editingId, submitData);
      setEditingId(null);
      setEditData({});
      setErrors({});
    }
  };

  // 통화 포맷팅 (만원 단위)
  const formatAmount = (amount) => {
    if (amount === null || amount === undefined) return "0만원";
    return new Intl.NumberFormat("ko-KR").format(amount) + "만원";
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
      {items.map((item, index) => (
        <div key={item.id || `item-${index}`} className={styles.item}>
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
                  placeholder={
                    category === "debts"
                      ? "예: 주택담보대출, 신용대출, 카드론"
                      : category === "incomes"
                      ? "예: 급여, 사업 소득"
                      : category === "assets"
                      ? "예: 예금, 주식, 부동산"
                      : category === "expenses"
                      ? "예: 생활비, 교육비, 의료비"
                      : category === "pensions"
                      ? "예: 국민연금, 퇴직연금"
                      : "제목을 입력하세요"
                  }
                />
                {errors.title && (
                  <span className={styles.errorText}>{errors.title}</span>
                )}
              </div>

              {/* 부채가 아닌 경우에만 금액 필드 표시 */}
              {category !== "debts" && (
                <div className={styles.editField}>
                  <label>
                    {category === "pensions"
                      ? "월 연금액 (만원)"
                      : "금액 (만원)"}{" "}
                    *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={editData.amount}
                    onChange={(e) =>
                      handleEditChange("amount", Number(e.target.value))
                    }
                    className={`${styles.editInput} ${
                      errors.amount ? styles.inputError : ""
                    }`}
                    placeholder={
                      category === "pensions"
                        ? "예: 200 (월 200만원)"
                        : "예: 5000"
                    }
                  />
                  {errors.amount && (
                    <span className={styles.errorText}>{errors.amount}</span>
                  )}
                </div>
              )}

              {/* 부채가 아닌 경우에만 빈도 필드 표시 */}
              {category !== "debts" && (
                <div className={styles.editField}>
                  <label>빈도 *</label>
                  <select
                    value={editData.frequency}
                    onChange={handleFrequencyChange}
                    className={styles.editInput}
                  >
                    <option value="yearly">년</option>
                    <option value="monthly">월</option>
                  </select>
                </div>
              )}

              {/* 부채가 아닌 경우의 날짜 입력 */}
              {category !== "debts" && (
                <>
                  {/* 시작년도, 끝년도 (빈도와 관계없이 동일) */}
                  <div className={styles.editField}>
                    <label>시작 년도 *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={editData.startYear}
                      onChange={(e) => handleYearChange(e, "start")}
                      className={`${styles.editInput} ${
                        errors.startYear ? styles.inputError : ""
                      }`}
                    />
                    {errors.startYear && (
                      <span className={styles.errorText}>
                        {errors.startYear}
                      </span>
                    )}
                  </div>

                  <div className={styles.editField}>
                    <label>종료 년도</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={editData.endYear}
                      onChange={(e) => handleYearChange(e, "end")}
                      className={`${styles.editInput} ${
                        errors.endYear ? styles.inputError : ""
                      }`}
                    />
                    {errors.endYear && (
                      <span className={styles.errorText}>{errors.endYear}</span>
                    )}
                  </div>
                </>
              )}

              {/* 부채용 날짜 입력 */}
              {category === "debts" && (
                <>
                  {/* 원리금균등, 원금균등, 고정월상환: 시작년도 + 종료년도 */}
                  {(editData.repaymentType === "equal_payment" ||
                    editData.repaymentType === "equal_principal" ||
                    editData.repaymentType === "fixed_payment") && (
                    <>
                      <div className={styles.editField}>
                        <label>대출 시작년도 *</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={editData.startYear}
                          onChange={(e) => handleYearChange(e, "start")}
                          className={`${styles.editInput} ${
                            errors.startYear ? styles.inputError : ""
                          }`}
                        />
                        {errors.startYear && (
                          <span className={styles.errorText}>
                            {errors.startYear}
                          </span>
                        )}
                      </div>

                      <div className={styles.editField}>
                        <label>대출 만료년도 *</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={editData.endYear}
                          onChange={(e) => handleYearChange(e, "end")}
                          className={`${styles.editInput} ${
                            errors.endYear ? styles.inputError : ""
                          }`}
                        />
                        {errors.endYear && (
                          <span className={styles.errorText}>
                            {errors.endYear}
                          </span>
                        )}
                      </div>
                    </>
                  )}

                  {/* 최소상환: 시작년도만 */}
                  {editData.repaymentType === "minimum_payment" && (
                    <div className={styles.editField}>
                      <label>대출 시작년도 *</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={editData.startYear}
                        onChange={(e) => handleYearChange(e, "start")}
                        className={`${styles.editInput} ${
                          errors.startYear ? styles.inputError : ""
                        }`}
                      />
                      {errors.startYear && (
                        <span className={styles.errorText}>
                          {errors.startYear}
                        </span>
                      )}
                      <span className={styles.helpText}>
                        최소상환은 종료년도가 없으며, 원금이 모두 상환될 때까지
                        계속됩니다.
                      </span>
                    </div>
                  )}

                  {/* 일시상환: 종료년도만 */}
                  {editData.repaymentType === "lump_sum" && (
                    <div className={styles.editField}>
                      <label>상환년도 *</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={editData.endYear}
                        onChange={(e) => handleYearChange(e, "end")}
                        className={`${styles.editInput} ${
                          errors.endYear ? styles.inputError : ""
                        }`}
                      />
                      {errors.endYear && (
                        <span className={styles.errorText}>
                          {errors.endYear}
                        </span>
                      )}
                      <span className={styles.helpText}>
                        일시상환은 지정된 년도에 원금+이자를 일괄 상환합니다.
                      </span>
                    </div>
                  )}
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
                      : category === "pensions"
                      ? "연금이 매년 상승하는 비율입니다. (예: 물가상승률 2% 반영)"
                      : "물가 상승에 따른 지출 증가 비율입니다. (예: 2% 상승)"}
                  </span>
                </div>
              )}

              {/* 연금 관련 필드 - 연금 카테고리에서만 표시 */}
              {category === "pensions" && (
                <div className={styles.editField}>
                  <label>연금 종류 *</label>
                  <select
                    value={editData.pensionType}
                    onChange={(e) =>
                      handleEditChange("pensionType", e.target.value)
                    }
                    className={styles.editInput}
                  >
                    <option value="national">국민연금</option>
                    <option value="private">개인연금</option>
                    <option value="retirement">퇴직연금</option>
                  </select>
                  <span className={styles.helpText}>
                    연금 종류를 선택하세요
                  </span>
                </div>
              )}

              {/* 부채 관련 필드 */}
              {config.showDebtFields && (
                <>
                  <div className={styles.editField}>
                    <label>대출 원금 (만원) *</label>
                    <input
                      type="number"
                      step="1000"
                      value={editData.principalAmount}
                      onChange={(e) =>
                        handleEditChange("principalAmount", e.target.value)
                      }
                      className={`${styles.editInput} ${
                        errors.principalAmount ? styles.inputError : ""
                      }`}
                      min="0"
                      placeholder="예: 30000 (3억원)"
                    />
                    {errors.principalAmount && (
                      <span className={styles.errorText}>
                        {errors.principalAmount}
                      </span>
                    )}
                  </div>

                  <div className={styles.editField}>
                    <label>연 이자율 (%) *</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editData.interestRate}
                      onChange={(e) =>
                        handleEditChange("interestRate", e.target.value)
                      }
                      className={`${styles.editInput} ${
                        errors.interestRate ? styles.inputError : ""
                      }`}
                      min="0"
                      max="50"
                      placeholder="예: 3.5 (주택담보대출 기준)"
                    />
                    {errors.interestRate && (
                      <span className={styles.errorText}>
                        {errors.interestRate}
                      </span>
                    )}
                  </div>

                  <div className={styles.editField}>
                    <label>상환 방식 *</label>
                    <select
                      value={editData.repaymentType}
                      onChange={(e) =>
                        handleEditChange("repaymentType", e.target.value)
                      }
                      className={styles.editInput}
                    >
                      <option value="equal_payment">원리금균등상환</option>
                      <option value="equal_principal">원금균등상환</option>
                      <option value="minimum_payment">최소상환</option>
                      <option value="lump_sum">일시상환</option>
                      <option value="fixed_payment">고정월상환</option>
                    </select>
                    <span className={styles.helpText}>
                      원리금균등: 매월 동일한 금액 상환
                      <br />
                      원금균등: 매월 동일한 원금 + 잔여원금 이자
                      <br />
                      최소상환: 최소 상환 비율로 상환
                      <br />
                      일시상환: 만료일에 원금+이자 일괄 상환
                      <br />
                      고정월상환: 매월 고정 금액 상환
                    </span>
                  </div>

                  {editData.repaymentType === "fixed_payment" && (
                    <div className={styles.editField}>
                      <label>월 상환액 (만원) *</label>
                      <input
                        type="number"
                        step="1000"
                        value={editData.monthlyPayment}
                        onChange={(e) =>
                          handleEditChange("monthlyPayment", e.target.value)
                        }
                        className={`${styles.editInput} ${
                          errors.monthlyPayment ? styles.inputError : ""
                        }`}
                        min="0"
                        placeholder="예: 50 (50만원)"
                      />
                      {errors.monthlyPayment && (
                        <span className={styles.errorText}>
                          {errors.monthlyPayment}
                        </span>
                      )}
                    </div>
                  )}

                  {editData.repaymentType === "minimum_payment" && (
                    <div className={styles.editField}>
                      <label>최소 상환 비율 (%) *</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editData.minimumPaymentRate}
                        onChange={(e) =>
                          handleEditChange("minimumPaymentRate", e.target.value)
                        }
                        className={`${styles.editInput} ${
                          errors.minimumPaymentRate ? styles.inputError : ""
                        }`}
                        min="0.1"
                        max="100"
                        placeholder="예: 2.0 (기본값: 2%)"
                      />
                      <span className={styles.helpText}>
                        매월 잔여 원금의 이 비율만큼 상환합니다.
                      </span>
                      {errors.minimumPaymentRate && (
                        <span className={styles.errorText}>
                          {errors.minimumPaymentRate}
                        </span>
                      )}
                    </div>
                  )}
                </>
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
              {/* 첫 번째 줄: 타이틀 [수정, 삭제 아이콘] */}
              <div className={styles.itemHeader}>
                <h3 className={styles.itemTitle}>{item.title}</h3>
                <div className={styles.itemActions}>
                  <button
                    onClick={() => handleStartEdit(item)}
                    className={styles.editButton}
                    title="수정"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => onDelete(item.id, item.title)}
                    className={styles.deleteButton}
                    title="삭제"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* 두 번째 줄: 금액 빈도 기간 */}
              <div className={styles.itemSummary}>
                <span>{formatAmount(item.amount)}</span>
                <span>{getFrequencyText(item.frequency)}</span>
                <span>
                  {formatYear(item.startDate)}-
                  {item.endDate ? formatYear(item.endDate) : "∞"}
                </span>
              </div>

              {/* 세 번째 줄: 메모 */}
              {item.note && <div className={styles.itemNote}>{item.note}</div>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
