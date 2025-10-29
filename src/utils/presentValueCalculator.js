/**
 * 생애 자금 수급/수요 총합 계산 (현금흐름 데이터 기반)
 *
 * cashflowData 배열은 calculateCashflowSimulation 결과와 동일한 형태를 기대합니다.
 * 각 항목은 { year, age, amount, ... } 구조이며 amount가 플러스면 자금 유입, 마이너스면 자금 유출입니다.
 */
export function calculateLifetimeCashFlowTotals(cashflowData = []) {
  if (!Array.isArray(cashflowData) || cashflowData.length === 0) {
    return {
      supply: [],
      demand: [],
      totalSupply: 0,
      totalDemand: 0,
      netCashFlow: 0,
    };
  }

  const supplyMap = new Map();
  const demandMap = new Map();
  const EPSILON = 1e-2;

  const accumulate = (map, item) => {
    if (!item || !item.label) return;
    const amount = Number(item.amount) || 0;
    if (amount <= 0) return;
    const category = item.category || "기타";
    const key = `${category}|${item.label}`;
    const existing = map.get(key);
    if (existing) {
      existing.amount += amount;
    } else {
      map.set(key, {
        category,
        name: item.label,
        amount,
      });
    }
  };

  cashflowData.forEach((entry) => {
    const breakdown = entry?.breakdown;
    let positiveSum = 0;
    let negativeSum = 0;

    if (breakdown) {
      (breakdown.positives || []).forEach((item) => {
        const amount = Number(item?.amount) || 0;
        if (amount <= 0) return;
        positiveSum += amount;
        accumulate(supplyMap, {
          label: item.label,
          category: item.category,
          amount,
        });
      });
      (breakdown.negatives || []).forEach((item) => {
        const amount = Number(item?.amount) || 0;
        if (amount <= 0) return;
        negativeSum += amount;
        accumulate(demandMap, {
          label: item.label,
          category: item.category,
          amount,
        });
      });
    }

    const amount = Number(entry?.amount) || 0;
    const netFromBreakdown = positiveSum - negativeSum;
    const residual = amount - netFromBreakdown;

    if (Math.abs(residual) > EPSILON) {
      if (residual > 0) {
        accumulate(supplyMap, {
          label: "기타 수입",
          category: "미분류",
          amount: residual,
        });
      } else if (residual < 0) {
        accumulate(demandMap, {
          label: "기타 지출",
          category: "미분류",
          amount: Math.abs(residual),
        });
      }
    }
  });

  // breakdown 정보가 없는 경우 amount 기준으로 fallback
  if (supplyMap.size === 0 && demandMap.size === 0) {
    cashflowData.forEach((entry) => {
      const amount = Number(entry.amount) || 0;
      if (amount > 0) {
        accumulate(supplyMap, {
          label: "자금 공급",
          category: "현금흐름",
          amount,
        });
      } else if (amount < 0) {
        accumulate(demandMap, {
          label: "자금 수요",
          category: "현금흐름",
          amount: Math.abs(amount),
        });
      }
    });
  }

  const supply = Array.from(supplyMap.values()).sort(
    (a, b) => b.amount - a.amount
  );
  const demand = Array.from(demandMap.values()).sort(
    (a, b) => b.amount - a.amount
  );

  const totalSupply = supply.reduce((sum, item) => sum + item.amount, 0);
  const totalDemand = demand.reduce((sum, item) => sum + item.amount, 0);

  return {
    supply,
    demand,
    totalSupply,
    totalDemand,
    netCashFlow: totalSupply - totalDemand,
  };
}
