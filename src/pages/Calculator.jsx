import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Calculator.module.css";
import MoneyInput from "../components/MoneyInput.jsx";
import { formatKRW, formatKRWMonthly } from "../libs/format.js";

/**
 * 은퇴 자금 계산기 페이지
 * 보유 자산, 저축 금액, 은퇴시기, 명목 수익률, 저축 증가율을 입력받아
 * 은퇴 후 자산과 월 수입을 실시간으로 계산
 */
export default function Calculator() {
  const navigate = useNavigate();

  // 입력값 상태
  const [inputs, setInputs] = React.useState({
    currentAssets: null, // 보유 자산 (만원)
    annualSavings: null, // 저축금액(연) (만원)
    yearsToRetirement: null, // 은퇴시기 (년)
    nominalReturnRate: null, // 명목 수익률 (%)
    savingsGrowthRate: 3, // 저축 증가율 (%)
  });

  // 계산된 결과
  const [results, setResults] = React.useState({
    retirementAssets: null, // 은퇴 후 자산 (만원)
    monthlyIncome: null, // 은퇴 후 월 수입 (만원)
    realReturnRate: null, // 실질 수익률 (%)
  });

  // 입력값 변경 핸들러
  function handleInputChange(field, value) {
    setInputs((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  // 실질 수익률 계산 (명목 수익률 - 저축 증가율)
  const realReturnRate = React.useMemo(() => {
    if (
      inputs.nominalReturnRate === null ||
      inputs.savingsGrowthRate === null
    ) {
      return null;
    }
    return inputs.nominalReturnRate - inputs.savingsGrowthRate;
  }, [inputs.nominalReturnRate, inputs.savingsGrowthRate]);

  // 은퇴 후 자산 계산
  const retirementAssets = React.useMemo(() => {
    const {
      currentAssets,
      annualSavings,
      yearsToRetirement,
      nominalReturnRate,
      savingsGrowthRate,
    } = inputs;

    // 모든 필수 값이 입력되었는지 확인
    if (
      currentAssets === null ||
      annualSavings === null ||
      yearsToRetirement === null ||
      nominalReturnRate === null ||
      savingsGrowthRate === null ||
      yearsToRetirement <= 0 ||
      nominalReturnRate <= 0
    ) {
      return null;
    }

    const r = nominalReturnRate / 100; // 명목 수익률 (소수)
    const g = savingsGrowthRate / 100; // 저축 증가율 (소수)
    const n = yearsToRetirement; // 은퇴까지 남은 기간

    // 공식: 자산 * (1 + 수익률)^은퇴시기 + 저축금액 * ((1 + 수익률)^은퇴시기 - (1 + 저축증가율)^은퇴시기) / (수익률 - 저축증가율)
    const assetGrowth = currentAssets * Math.pow(1 + r, n);

    let savingsGrowth = 0;
    if (Math.abs(r - g) > 0.001) {
      // 수익률과 저축증가율이 다를 때
      savingsGrowth =
        (annualSavings * (Math.pow(1 + r, n) - Math.pow(1 + g, n))) / (r - g);
    } else {
      // 수익률과 저축증가율이 같을 때
      savingsGrowth = annualSavings * n * Math.pow(1 + r, n - 1);
    }

    return assetGrowth + savingsGrowth;
  }, [inputs]);

  // 은퇴 후 월 수입 계산
  const monthlyIncome = React.useMemo(() => {
    if (
      retirementAssets === null ||
      realReturnRate === null ||
      realReturnRate <= 0
    ) {
      return null;
    }

    // 월 수입 = 은퇴 후 자산 * (실질 수익률 / 12)
    const monthlyRate = realReturnRate / 100 / 12;
    return retirementAssets * monthlyRate;
  }, [retirementAssets, realReturnRate]);

  // 결과 업데이트
  React.useEffect(() => {
    setResults({
      retirementAssets,
      monthlyIncome,
      realReturnRate,
    });
  }, [retirementAssets, monthlyIncome, realReturnRate]);

  // 홈으로 돌아가기
  function handleGoHome() {
    navigate("/");
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button
          className={styles.backButton}
          onClick={handleGoHome}
          aria-label="홈으로"
        >
          ←
        </button>
        <h1 className={styles.title}>은퇴 자금 계산기</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.inputSection}>
          <h2 className={styles.sectionTitle}>입력 정보</h2>
          <div className={styles.inputGrid}>
            {/* 보유 자산 */}
            <div className={styles.inputGroup}>
              <label htmlFor="currentAssets" className={styles.inputLabel}>
                보유 자산
              </label>

              <MoneyInput
                id="currentAssets"
                value={inputs.currentAssets}
                onChange={(value) => handleInputChange("currentAssets", value)}
                rightUnit="만원"
                placeholder="자산 금액"
              />
            </div>

            {/* 저축금액(연) */}
            <div className={styles.inputGroup}>
              <label htmlFor="annualSavings" className={styles.inputLabel}>
                저축금액(연)
              </label>

              <MoneyInput
                id="annualSavings"
                value={inputs.annualSavings}
                onChange={(value) => handleInputChange("annualSavings", value)}
                rightUnit="만원"
                placeholder="연간 저축 금액"
              />
            </div>

            {/* 은퇴시기 */}
            <div className={styles.inputGroup}>
              <label htmlFor="yearsToRetirement" className={styles.inputLabel}>
                은퇴시기
              </label>

              <div className={styles.numberInput}>
                <input
                  id="yearsToRetirement"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="50"
                  value={inputs.yearsToRetirement ?? ""}
                  onChange={(e) =>
                    handleInputChange(
                      "yearsToRetirement",
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                  placeholder="년수"
                  className={styles.input}
                />
                <span className={styles.unit}>년 후</span>
              </div>
            </div>

            {/* 명목 수익률 */}
            <div className={styles.inputGroup}>
              <label htmlFor="nominalReturnRate" className={styles.inputLabel}>
                명목 수익률
              </label>

              <div className={styles.numberInput}>
                <input
                  id="nominalReturnRate"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  max="50"
                  value={inputs.nominalReturnRate ?? ""}
                  onChange={(e) =>
                    handleInputChange(
                      "nominalReturnRate",
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                  placeholder="수익률"
                  className={styles.input}
                />
                <span className={styles.unit}>%</span>
              </div>
            </div>

            {/* 저축 증가율 */}
            <div className={styles.inputGroup}>
              <p className={styles.inputDescription}>연간 저축금액 증가율</p>
              <div className={styles.numberInput}>
                <input
                  id="savingsGrowthRate"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  max="20"
                  value={inputs.savingsGrowthRate ?? ""}
                  onChange={(e) =>
                    handleInputChange(
                      "savingsGrowthRate",
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                  placeholder="증가율"
                  className={styles.input}
                />
                <span className={styles.unit}>%</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.outputSection}>
          <h2 className={styles.sectionTitle}>계산 결과</h2>

          {/* 은퇴 후 자산 */}
          <div className={styles.outputGroup}>
            <h3 className={styles.outputLabel}>은퇴 후 자산</h3>
            <div className={styles.formula}>
              자산 × (1 + 수익률)^은퇴시기 + 저축금액 × ((1 + 수익률)^은퇴시기 -
              (1 + 저축증가율)^은퇴시기) ÷ (수익률 - 저축증가율)
            </div>
            <div className={styles.outputValue}>
              {results.retirementAssets !== null
                ? formatKRW(results.retirementAssets)
                : "—"}
            </div>
          </div>

          {/* 은퇴 후 월 수입 */}
          <div className={styles.outputGroup}>
            <h3 className={styles.outputLabel}>은퇴 후 월 수입</h3>
            <div className={styles.formula}>
              은퇴 후 자산과 실질 수익률로 벌어들이는 월 수입
            </div>
            <div className={styles.outputValue}>
              {results.monthlyIncome !== null
                ? formatKRWMonthly(results.monthlyIncome)
                : "—"}
              {results.realReturnRate !== null && (
                <span className={styles.rateInfo}>
                  / {results.realReturnRate.toFixed(1)}% (명목:{" "}
                  {inputs.nominalReturnRate}%)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
