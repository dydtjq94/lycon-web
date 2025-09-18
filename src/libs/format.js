// 1) 숫자만 추출 -> 정수 (만원 단위)
export function onlyDigitsToNumber(str) {
  if (str === "" || str === null || str === undefined) return null;
  const digits = String(str).replace(/[^\d]/g, "");
  return digits ? Number(digits) : null;
}

// 2) 천단위 콤마 (보기용) - 만원 단위 (입력 필드용, 억 단위 변환 없음)
export function formatKRWComma(n) {
  if (n === null || n === undefined || n === "") return "";
  const num = typeof n === "number" ? n : onlyDigitsToNumber(n);
  if (num === null) return "";
  return num.toLocaleString("ko-KR");
}

// 3) 억 단위 변환 헬퍼 함수
function formatWithBillion(n) {
  if (n === null || n === undefined || n === "") return "—";
  const num = Number(n);
  if (Number.isNaN(num)) return "—";

  if (num >= 10000) {
    // 1억 이상인 경우
    const billion = Math.floor(num / 10000);
    const remainder = num % 10000;

    if (remainder === 0) {
      return `${billion.toLocaleString("ko-KR")}억원`;
    } else {
      return `${billion.toLocaleString("ko-KR")}억 ${remainder.toLocaleString(
        "ko-KR"
      )}만원`;
    }
  } else {
    // 1억 미만인 경우
    return num.toLocaleString("ko-KR") + "만원";
  }
}

// 4) 결과 페이지 표기 - 만원 단위 (억 단위 변환 포함)
export function formatKRW(n) {
  return formatWithBillion(n);
}

// 5) 월 단위 표기 - 만원/월 (억 단위 변환 포함)
export function formatKRWMonthly(n) {
  if (n === null || n === undefined || n === "") return "—";
  const num = Number(n);
  if (Number.isNaN(num)) return "—";

  if (num >= 10000) {
    // 1억 이상인 경우
    const billion = Math.floor(num / 10000);
    const remainder = num % 10000;

    if (remainder === 0) {
      return `${billion.toLocaleString("ko-KR")}억원/월`;
    } else {
      return `${billion.toLocaleString("ko-KR")}억 ${remainder.toLocaleString(
        "ko-KR"
      )}만원/월`;
    }
  } else {
    // 1억 미만인 경우
    return num.toLocaleString("ko-KR") + "만원/월";
  }
}

// 5) 퍼센트(숫자 → "12.3%")
export function formatPercent(n) {
  if (n === null || n === undefined || n === "") return "—";
  const num = Number(n);
  if (Number.isNaN(num)) return "—";
  return `${num}%`;
}
