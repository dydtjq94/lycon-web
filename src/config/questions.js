// 그룹 탭: 순서 유지
export const GROUP_ORDER = ["은퇴 연령", "연금&소득", "지출", "자산", "부채"];

/**
 * type:
 * - number        : 단일 숫자 입력
 * - yesno_amount  : 예/아니오 + 금액(예일 때 필수)
 * - yesno_multi   : 예/아니오 + 복합 필드(예일 때 각 항목 필수)
 *
 * 각 항목 id는 상태키로 사용됨.
 */
export const QUESTIONS = [
  // 1~2 은퇴 연령
  {
    no: 1,
    id: "retireAge",
    group: "은퇴 연령",
    type: "number",
    title: "희망 은퇴 연령",
    unit: "세",
    min: 40,
    max: 80,
    placeholder: "희망 은퇴 연령",
  },
  {
    no: 2,
    id: "currentAge",
    group: "은퇴 연령",
    type: "number",
    title: "현재 나이",
    unit: "세",
    min: 20,
    max: 100,
    placeholder: "현재 나이",
  },

  // 3~6 연금&소득
  {
    no: 3,
    id: "nps",
    group: "연금&소득",
    type: "yesno_amount",
    title: "국민연금 예상 수령액이 있나요?",
    amountLabel: "월 수령액",
    unit: "만원",
  },
  {
    no: 4,
    id: "retirePension",
    group: "연금&소득",
    type: "yesno_amount",
    title: "퇴직연금 예상 수령액이 있나요?",
    amountLabel: "월 수령액",
    unit: "만원",
  },
  {
    no: 5,
    id: "personalPension",
    group: "연금&소득",
    type: "yesno_amount",
    title: "개인연금 예상 수령액이 있나요?",
    amountLabel: "월 수령액",
    unit: "만원",
  },
  {
    no: 6,
    id: "otherIncome",
    group: "연금&소득",
    type: "yesno_amount",
    title: "기타 은퇴 후 소득이 있나요?",
    amountLabel: "월 합계",
    unit: "만원",
  },

  // 7~10 지출
  {
    no: 7,
    id: "currentLiving",
    group: "지출",
    type: "number",
    title: "현재 월평균 생활비",
    unit: "만원",
    min: 0,
    placeholder: "금액",
  },
  {
    no: 8,
    id: "retireBaseLiving",
    group: "지출",
    type: "number",
    title: "은퇴 후 예상 생활비(기본)",
    unit: "만원",
    min: 0,
    placeholder: "금액",
  },
  {
    no: 9,
    id: "retireLeisureLiving",
    group: "지출",
    type: "number",
    title: "은퇴 후 예상 생활비(여유)",
    unit: "만원",
    min: 0,
    placeholder: "금액",
  },
  {
    no: 10,
    id: "eventSpending",
    group: "지출",
    type: "yesno_amount",
    title: "예상 이벤트 지출(결혼/교육/여행 등)이 있나요?",
    amountLabel: "총액",
    unit: "만원",
  },

  // 11~13 자산
  {
    no: 11,
    id: "financialAssets",
    group: "자산",
    type: "number",
    title: "금융자산 총액",
    unit: "만원",
    min: 0,
    placeholder: "금액",
  },
  {
    no: 12,
    id: "investmentReturn",
    group: "자산",
    type: "number",
    title: "투자 수익률(연평균)",
    unit: "%",
    min: -100,
    max: 100,
    placeholder: "예: 5",
    isPercent: true,
  },
  {
    no: 13,
    id: "realEstateValue",
    group: "자산",
    type: "number",
    title: "현재 부동산 가치",
    unit: "만원",
    min: 0,
    placeholder: "금액",
  },

  // 14 부채
  {
    no: 14,
    id: "debt",
    group: "부채",
    type: "yesno_multi",
    title: "부채가 있나요?",
    fields: [
      { key: "totalDebt", label: "부채 총액", unit: "만원", kind: "money" },
      {
        key: "avgInterestRate",
        label: "평균 이자율",
        unit: "%",
        kind: "percent",
      },
      { key: "repaymentYears", label: "상환 기간", unit: "년", kind: "number" },
      {
        key: "mortgagePrincipal",
        label: "담보대출 원금",
        unit: "만원",
        kind: "money",
      },
      {
        key: "mortgageInterestRate",
        label: "담보대출 연이율",
        unit: "%",
        kind: "percent",
      },
    ],
  },
];
