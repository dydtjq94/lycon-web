// src/utils/date.js

/** YYYY-MM-DD -> Date (로컬 타임존 기준) */
export function parseDate(dateString) {
  if (!dateString) return new Date(NaN);
  const [y, m, d] = dateString.split("-").map(Number);
  // 월은 0부터 시작
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Date -> YYYY-MM-DD */
export function formatDate(date) {
  if (!(date instanceof Date)) date = new Date(date);
  if (Number.isNaN(date.getTime())) return "-";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** 생년월일로 현재 나이 계산 */
export function calculateAge(birthDateString) {
  const today = new Date();
  const birth = parseDate(birthDateString);

  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/** 두 날짜(YYYY-MM-DD) 사이 개월 수 */
export function getMonthsBetween(startDate, endDate) {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const years = end.getFullYear() - start.getFullYear();
  const months = end.getMonth() - start.getMonth();
  return years * 12 + months;
}

/** 시작일에 개월 수 더하기 -> YYYY-MM-DD */
export function addMonths(startDate, months) {
  const d = parseDate(startDate);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);

  // 말일 보정(예: 1/31 + 1개월 -> 2월 말일)
  if (d.getDate() < day) {
    d.setDate(0); // 전달 말일
  }
  return formatDate(d);
}

/** 오늘 YYYY-MM-DD */
export function getTodayString() {
  return formatDate(new Date());
}

/** 유효한 YYYY-MM-DD인지 */
export function isValidDate(dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  const d = parseDate(dateString);
  return !Number.isNaN(d.getTime());
}

/**
 * 월 타임라인 생성 (포함 범위)
 * @param {string} startDate YYYY-MM-DD
 * @param {string} endDate YYYY-MM-DD
 * @param {"ymd"|"ym"} mode - 반환 형식. 기본 "ym" (예: "2025-09")
 * @returns {string[]} ex) ["2025-01","2025-02", ...] 또는 ["2025-01-01", ...]
 */
export function generateMonthlyTimeline(startDate, endDate, mode = "ym") {
  if (!isValidDate(startDate) || !isValidDate(endDate)) return [];
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  // 시작을 해당 월 1일로 정렬
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);

  const out = [];
  while (cur <= last) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    if (mode === "ymd") {
      out.push(`${y}-${m}-01`);
    } else {
      out.push(`${y}-${m}`); // 기본은 YYYY-MM
    }
    cur.setMonth(cur.getMonth() + 1);
  }
  return out;
}

/** 통화 포맷 (₩) */
export function formatCurrency(
  amount,
  locale = "ko-KR",
  currency = "KRW",
  min = 0,
  max = 0
) {
  const n = typeof amount === "number" ? amount : Number(amount) || 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  }).format(n);
}
