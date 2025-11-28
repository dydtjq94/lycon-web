import React, { useRef, useEffect } from "react";
import * as echarts from "echarts";
import styles from "./DeficitBreakdownPage.module.css";

/**
 * 이벤트성 적자 vs 구조적 적자 상세 분석 (Page 20)
 * @param {Object} profile - 프로필 데이터
 * @param {Object} simulationData - 시뮬레이션 전체 데이터
 */
function DeficitBreakdownPage({ profile, simulationData }) {
  const chartRef = useRef(null);

  // 현재 나이와 은퇴 나이
  const currentAge =
    simulationData?.profile?.currentAge || profile?.age || 42;
  const retirementAge =
    simulationData?.profile?.retirementAge || profile?.retirementAge || 65;

  // 은퇴 후 기간 계산
  const retirementYears = 90 - retirementAge;
  const retirementStartIndex = retirementAge - currentAge;

  // 현금흐름 데이터
  const cashflow = simulationData?.simulation?.cashflow || [];
  const retirementCashflow = cashflow.slice(
    retirementStartIndex,
    retirementStartIndex + retirementYears
  );

  // 구조적 수입 계산 (정기 수입)
  let structuralIncome = {
    pension: 0,
    rentalIncome: 0,
  };

  // 구조적 지출 계산 (정기 지출)
  let structuralExpense = {
    livingCost: 0,
    medicalCost: 0,
    rentalManagement: 0,
    debtInterest: 0,
  };

  // 이벤트성 수입 (일시적 유입)
  let eventIncome = [];
  let totalEventIncome = 0;

  // 이벤트성 지출 (일시적 유출)
  let eventExpense = [];
  let totalEventExpense = 0;

  retirementCashflow.forEach((year, index) => {
    const yearNum = new Date().getFullYear() + retirementStartIndex + index;

    // 구조적 수입
    structuralIncome.pension += year.pension || 0;
    structuralIncome.rentalIncome += year.rentalIncome || 0;

    // 구조적 지출
    structuralExpense.livingCost += year.expense || 0;
    structuralExpense.debtInterest += Math.abs(year.debtInterest || 0);

    // 이벤트성 수입 (자산 매각, 대출 유입 등)
    if (year.savingsWithdrawal > 0) {
      eventIncome.push({
        item: "저축인출",
        year: yearNum,
        amount: year.savingsWithdrawal,
      });
      totalEventIncome += year.savingsWithdrawal;
    }
    if (year.realEstateSale > 0) {
      eventIncome.push({
        item: "부동산 매각",
        year: yearNum,
        amount: year.realEstateSale,
      });
      totalEventIncome += year.realEstateSale;
    }

    // 이벤트성 지출 (부채 상환, 부동산 구매 등)
    if (year.debtPrincipal < 0) {
      eventExpense.push({
        item: "대출 원금 상환",
        year: yearNum,
        amount: Math.abs(year.debtPrincipal),
      });
      totalEventExpense += Math.abs(year.debtPrincipal);
    }
    if (year.realEstatePurchase < 0) {
      eventExpense.push({
        item: "부동산 구매/분담금",
        year: yearNum,
        amount: Math.abs(year.realEstatePurchase),
      });
      totalEventExpense += Math.abs(year.realEstatePurchase);
    }
  });

  const totalStructuralIncome =
    structuralIncome.pension + structuralIncome.rentalIncome;
  const totalStructuralExpense =
    structuralExpense.livingCost +
    structuralExpense.medicalCost +
    structuralExpense.rentalManagement +
    structuralExpense.debtInterest;

  const structuralDeficit = totalStructuralIncome - totalStructuralExpense;
  const eventDeficit = totalEventIncome - totalEventExpense;
  const totalDeficit = structuralDeficit + eventDeficit;

  // 차트 초기화
  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    const option = {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(11, 24, 40, 0.95)",
        borderColor: "#374151",
        textStyle: { color: "#fff" },
        formatter: "{b}: {c} 만원 ({d}%)",
      },
      legend: {
        orient: "horizontal",
        bottom: "0%",
        left: "center",
        textStyle: { color: "#9CA3AF", fontSize: 11 },
        itemWidth: 10,
        itemHeight: 10,
      },
      series: [
        {
          name: "적자 유형",
          type: "pie",
          radius: ["40%", "60%"],
          center: ["50%", "45%"],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 4,
            borderColor: "#0B1828",
            borderWidth: 2,
          },
          label: {
            show: true,
            position: "inside",
            color: "#fff",
            fontWeight: "bold",
            fontSize: 11,
            formatter: (params) =>
              (params.value / 10000).toFixed(1) + "만원",
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 12,
              fontWeight: "bold",
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
          labelLine: {
            show: false,
          },
          data: [
            {
              value: Math.abs(structuralDeficit),
              name: "구조적 적자",
              itemStyle: { color: "#3B82F6" },
            },
            {
              value: Math.abs(eventDeficit),
              name: "이벤트성 적자",
              itemStyle: { color: "#EAB308" },
            },
          ],
        },
      ],
    };

    chart.setOption(option);

    return () => chart.dispose();
  }, [structuralDeficit, eventDeficit]);

  return (
    <div className={styles.slideContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.headerBadges}>
            <span className={styles.stepBadge}>STEP 2-2</span>
            <span className={styles.sectionBadge}>
              Deficit Breakdown Analysis
            </span>
          </div>
          <h1 className={styles.headerTitle}>
            이벤트성 적자 vs 구조적 적자 상세 분석
          </h1>
        </div>
        <div className={styles.headerDescription}>
          <p>은퇴 기간 중 발생할 적자의 성격을 구조적 요인과 일시적 이벤트</p>
          <p>요인으로 분리하여 분석하고, 구체적인 발생 시기와 규모를 파악합니다.</p>
        </div>
      </div>

      {/* Divider */}
      <div className={styles.divider}></div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          {/* Chart Card */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3 className={styles.chartTitle}>
                <i className="fas fa-chart-pie"></i>
                <span>적자 유형별 비중 및 규모</span>
              </h3>
            </div>
            <div className={styles.chartContainer} ref={chartRef}></div>

            {/* Total Summary */}
            <div className={styles.totalSummary}>
              <div className={styles.summaryLeft}>
                <div className={styles.summaryIcon}>
                  <i className="fas fa-minus-circle"></i>
                </div>
                <div>
                  <p className={styles.summaryLabel}>총 부족 자금</p>
                  <p className={styles.summaryValue}>
                    -{(Math.abs(totalDeficit) / 10000).toFixed(1)}{" "}
                    <span>만원</span>
                  </p>
                </div>
              </div>
              <div className={styles.summaryRight}>
                <div className={styles.summaryRatio}>
                  <span className={styles.ratioBlue}></span>
                  <span>
                    구조적:{" "}
                    {(
                      (Math.abs(structuralDeficit) / Math.abs(totalDeficit)) *
                      100
                    ).toFixed(0)}
                    %
                  </span>
                </div>
                <div className={styles.summaryRatio}>
                  <span className={styles.ratioYellow}></span>
                  <span>
                    이벤트성:{" "}
                    {(
                      (Math.abs(eventDeficit) / Math.abs(totalDeficit)) *
                      100
                    ).toFixed(0)}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Insight Box */}
          <div className={styles.insightBox}>
            <h3 className={styles.insightTitle}>
              <i className="fas fa-lightbulb"></i> 핵심 진단
            </h3>
            <p className={styles.insightText}>
              전체 부족 자금 중{" "}
              <strong>
                구조적 적자가{" "}
                {(
                  (Math.abs(structuralDeficit) / Math.abs(totalDeficit)) *
                  100
                ).toFixed(0)}
                %
              </strong>
              를 차지하여 장기적인 현금흐름 개선이 시급합니다. 이벤트성 적자는
              특정 시점에 집중되므로 해당 시점의 유동성 관리가 핵심입니다.
            </p>
          </div>
        </div>

        {/* Right Column */}
        <div className={styles.rightColumn}>
          {/* Structural Balance */}
          <div className={styles.structuralCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                <i className="fas fa-layer-group"></i> 구조적 수지 (Structural
                Balance)
              </h3>
              <div className={styles.cardHeaderRight}>
                <span className={styles.cardSummary}>
                  수입 {(totalStructuralIncome / 10000).toFixed(1)}만원 vs
                  지출 {(totalStructuralExpense / 10000).toFixed(1)}만원
                </span>
                <span className={styles.cardBadgeBlue}>
                  {(structuralDeficit / 10000).toFixed(1)} 만원
                </span>
              </div>
            </div>

            <div className={styles.cardContent}>
              {/* Income */}
              <div className={styles.tableSection}>
                <h4 className={styles.tableTitleBlue}>정기 수입</h4>
                <div className={styles.tableContainer}>
                  <table className={styles.detailTable}>
                    <thead>
                      <tr>
                        <th>항목</th>
                        <th className={styles.thCenter}>기간</th>
                        <th className={styles.thRight}>금액</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>연금소득 (국민+퇴직)</td>
                        <td className={styles.tdYear}>
                          {new Date().getFullYear() + retirementStartIndex}-
                          {new Date().getFullYear() +
                            retirementStartIndex +
                            retirementYears -
                            1}
                        </td>
                        <td className={styles.tdAmount}>
                          {(structuralIncome.pension / 10000).toFixed(2)} 만원
                        </td>
                      </tr>
                      {structuralIncome.rentalIncome > 0 && (
                        <tr>
                          <td>임대소득</td>
                          <td className={styles.tdYear}>일부 기간</td>
                          <td className={styles.tdAmount}>
                            {(structuralIncome.rentalIncome / 10000).toFixed(2)}{" "}
                            만원
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="2" className={styles.tfootLabel}>
                          합계
                        </td>
                        <td className={styles.tfootAmount}>
                          {(totalStructuralIncome / 10000).toFixed(1)} 만원
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Expense */}
              <div className={styles.tableSection}>
                <h4 className={styles.tableTitleRed}>정기 지출</h4>
                <div className={styles.tableContainer}>
                  <table className={styles.detailTable}>
                    <thead>
                      <tr>
                        <th>항목</th>
                        <th className={styles.thCenter}>기간</th>
                        <th className={styles.thRight}>금액</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>생활비</td>
                        <td className={styles.tdYear}>전체 기간</td>
                        <td className={styles.tdAmount}>
                          {(structuralExpense.livingCost / 10000).toFixed(2)}{" "}
                          만원
                        </td>
                      </tr>
                      {structuralExpense.debtInterest > 0 && (
                        <tr>
                          <td>대출이자</td>
                          <td className={styles.tdYear}>일부 기간</td>
                          <td className={styles.tdAmount}>
                            {(structuralExpense.debtInterest / 10000).toFixed(
                              2
                            )}{" "}
                            만원
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="2" className={styles.tfootLabel}>
                          합계
                        </td>
                        <td className={styles.tfootAmount}>
                          {(totalStructuralExpense / 10000).toFixed(1)} 만원
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Event Balance */}
          <div className={styles.eventCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitleYellow}>
                <i className="fas fa-bolt"></i> 이벤트성 수지 (Event Balance)
              </h3>
              <div className={styles.cardHeaderRight}>
                <span className={styles.cardSummary}>
                  수입 {(totalEventIncome / 10000).toFixed(1)}만원 vs 지출{" "}
                  {(totalEventExpense / 10000).toFixed(1)}만원
                </span>
                <span className={styles.cardBadgeYellow}>
                  {(eventDeficit / 10000).toFixed(1)} 만원
                </span>
              </div>
            </div>

            <div className={styles.cardContent}>
              {/* Event Income */}
              <div className={styles.tableSection}>
                <h4 className={styles.tableTitleBlue}>이벤트 수입</h4>
                <div className={styles.tableContainerScroll}>
                  <table className={styles.detailTable}>
                    <thead>
                      <tr>
                        <th>항목</th>
                        <th className={styles.thCenter}>발생년도</th>
                        <th className={styles.thRight}>금액</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventIncome.map((item, index) => (
                        <tr key={index}>
                          <td>{item.item}</td>
                          <td className={styles.tdYear}>{item.year}</td>
                          <td className={styles.tdAmount}>
                            {(item.amount / 10000).toFixed(2)} 만원
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="2" className={styles.tfootLabel}>
                          합계
                        </td>
                        <td className={styles.tfootAmount}>
                          {(totalEventIncome / 10000).toFixed(1)} 만원
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Event Expense */}
              <div className={styles.tableSection}>
                <h4 className={styles.tableTitleRed}>이벤트 지출</h4>
                <div className={styles.tableContainerScroll}>
                  <table className={styles.detailTable}>
                    <thead>
                      <tr>
                        <th>항목</th>
                        <th className={styles.thCenter}>발생년도</th>
                        <th className={styles.thRight}>금액</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventExpense.map((item, index) => (
                        <tr key={index}>
                          <td>{item.item}</td>
                          <td className={styles.tdYear}>{item.year}</td>
                          <td className={styles.tdAmount}>
                            {(item.amount / 10000).toFixed(2)} 만원
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="2" className={styles.tfootLabel}>
                          합계
                        </td>
                        <td className={styles.tfootAmount}>
                          {(totalEventExpense / 10000).toFixed(1)} 만원
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeficitBreakdownPage;
