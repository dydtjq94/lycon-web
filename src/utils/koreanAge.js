/**
 * 한국 나이 계산 유틸리티
 * 한국 나이: 출생년도 기준으로 1살부터 시작, 매년 1월 1일에 한 살씩 증가
 */

/**
 * 출생년도로부터 한국 나이 계산
 * @param {number} birthYear - 출생년도
 * @param {number} currentYear - 현재 년도 (기본값: 2025)
 * @returns {number} 한국 나이
 */
export function calculateKoreanAge(birthYear, currentYear = 2025) {
  return currentYear - birthYear + 1;
}

/**
 * 한국 나이로부터 출생년도 계산
 * @param {number} koreanAge - 한국 나이
 * @param {number} currentYear - 현재 년도 (기본값: 2025)
 * @returns {number} 출생년도
 */
export function calculateBirthYearFromKoreanAge(koreanAge, currentYear = 2025) {
  return currentYear - koreanAge + 1;
}

/**
 * 특정 년도의 한국 나이 계산
 * @param {number} birthYear - 출생년도
 * @param {number} targetYear - 대상 년도
 * @returns {number} 해당 년도의 한국 나이
 */
export function getKoreanAgeInYear(birthYear, targetYear) {
  return targetYear - birthYear + 1;
}

/**
 * 가구 구성원의 한국 나이 계산
 * @param {Array} familyMembers - 가구 구성원 배열 [{name, birthYear}, ...]
 * @param {number} currentYear - 현재 년도 (기본값: 2025)
 * @returns {Array} 나이 정보가 포함된 가구 구성원 배열
 */
export function calculateFamilyAges(familyMembers, currentYear = 2025) {
  return familyMembers.map((member) => ({
    ...member,
    koreanAge: calculateKoreanAge(member.birthYear, currentYear),
  }));
}
