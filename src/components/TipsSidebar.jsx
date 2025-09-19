import React from "react";
import styles from "./TipsSidebar.module.css";

/**
 * 설문 그룹별 꿀팁 사이드바 컴포넌트
 * 각 설문 페이지에서 오른쪽에 표시되는 유용한 정보
 */
export default function TipsSidebar({ groupName }) {
  // 그룹별 꿀팁 데이터
  const tipsData = {
    "은퇴 연령": {
      title: "은퇴 연령 설정 가이드",
      icon: "🎯",
      tips: [
        {
          title: "현실적인 은퇴 연령 설정",
          content:
            "일반적으로 60-65세가 적정 은퇴 연령으로 여겨집니다. 건강 상태와 경제적 여유를 고려하여 설정하세요.",
        },
        {
          title: "은퇴 후 20-30년 계획",
          content:
            "현재 평균 수명을 고려할 때, 은퇴 후 20-30년간의 생활비를 미리 계산해두는 것이 중요합니다.",
        },
        {
          title: "점진적 은퇴 고려",
          content:
            "갑작스러운 은퇴보다는 파트타임 근무나 컨설팅 등으로 점진적으로 은퇴하는 것도 좋은 방법입니다.",
        },
      ],
    },
    "연금&소득": {
      title: "연금 & 소득 관리 팁",
      icon: "💰",
      tips: [
        {
          title: "국민연금 수급액 확인",
          content:
            "국민연금공단 홈페이지에서 '나의 연금'을 통해 정확한 수급액을 미리 확인해보세요.",
        },
        {
          title: "퇴직연금 활용법",
          content:
            "퇴직연금은 일시금보다는 연금형으로 받는 것이 세금 혜택이 더 큽니다.",
        },
        {
          title: "개인연금의 중요성",
          content:
            "국민연금만으로는 부족할 수 있으니 개인연금(IRP, 개인연금저축)을 통해 추가 수입을 확보하세요.",
        },
        {
          title: "기타 소득원 개발",
          content:
            "부동산 임대수익, 배당소득, 부업 등을 통해 은퇴 후 안정적인 수입원을 만들어보세요.",
        },
      ],
    },
    지출: {
      title: "지출 관리 전략",
      icon: "📊",
      tips: [
        {
          title: "현재 생활비 분석",
          content:
            "최근 3개월간의 가계부를 분석하여 정확한 현재 생활비를 파악하세요.",
        },
        {
          title: "은퇴 후 지출 변화",
          content:
            "의료비, 여행비는 증가하지만 교통비, 의류비는 감소할 수 있습니다. 이를 고려하여 계획하세요.",
        },
        {
          title: "예상 이벤트 지출",
          content:
            "자녀 결혼, 손자 교육비, 집 수리 등 큰 지출이 예상되는 이벤트들을 미리 계획해두세요.",
        },
        {
          title: "비상금 확보",
          content:
            "예상치 못한 지출에 대비해 생활비의 6개월분 정도의 비상금을 확보하는 것이 좋습니다.",
        },
      ],
    },
    자산: {
      title: "자산 관리 노하우",
      icon: "🏦",
      tips: [
        {
          title: "금융자산 포트폴리오",
          content:
            "예금, 적금, 펀드, 주식 등 다양한 상품에 분산투자하여 리스크를 줄이세요.",
        },
        {
          title: "현실적인 수익률 설정",
          content:
            "과도한 수익률을 기대하지 말고, 연 3-5% 정도의 안정적인 수익률을 목표로 하세요.",
        },
        {
          title: "부동산 자산 활용",
          content:
            "자택 외 추가 부동산이 있다면 임대수익이나 매각을 통해 자금을 확보할 수 있습니다.",
        },
        {
          title: "자산 재배치",
          content:
            "은퇴가 가까워질수록 고위험 자산 비중을 줄이고 안정적인 자산 비중을 늘리세요.",
        },
      ],
    },
    부채: {
      title: "부채 관리 가이드",
      icon: "📉",
      tips: [
        {
          title: "부채 정리 우선순위",
          content:
            "이자율이 높은 부채부터 우선 상환하고, 담보대출은 은퇴 전에 정리하는 것이 좋습니다.",
        },
        {
          title: "상환 능력 평가",
          content:
            "은퇴 후 수입이 줄어들 것을 고려하여 현재 상환 능력을 현실적으로 평가하세요.",
        },
        {
          title: "담보대출 활용",
          content:
            "자택 담보대출은 이자율이 낮지만, 은퇴 후 상환 부담을 고려하여 신중하게 결정하세요.",
        },
        {
          title: "부채 없는 은퇴",
          content:
            "가능하다면 은퇴 전에 모든 부채를 정리하여 안정적인 노후를 준비하세요.",
        },
      ],
    },
  };

  const currentTips = tipsData[groupName];

  if (!currentTips) {
    return null;
  }

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.icon}>{currentTips.icon}</div>
        <h3 className={styles.title}>{currentTips.title}</h3>
      </div>

      <div className={styles.tipsList}>
        {currentTips.tips.map((tip, index) => (
          <div key={index} className={styles.tipItem}>
            <h4 className={styles.tipTitle}>{tip.title}</h4>
            <p className={styles.tipContent}>{tip.content}</p>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <p className={styles.footerText}>
          💡 이 정보들은 참고용입니다. 개인 상황에 맞게 조정하세요.
        </p>
      </div>
    </div>
  );
}
