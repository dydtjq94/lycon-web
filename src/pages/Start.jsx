import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "./Start.module.css";
import Logo from "../components/Logo.jsx";
import { track } from "../libs/analytics.js";

/**
 * Start (랜딩)
 * - 모바일 퍼스트 + 데스크톱 대응
 * - 페이지 단위 CSS Modules로 스타일 캡슐화
 * - Mixpanel 이벤트: 진입/CTA 클릭
 * - 이유:
 *   1) 랜딩에서 신뢰/명확성(큰 타이포 + 충분한 여백)
 *   2) CTA가 맨 아래 고정되어 모바일에서도 쉽게 누를 수 있게
 *   3) 접근성 향상 (aria-label, focus-visible, 명도 대비)
 */
export default function Start() {
  useEffect(() => {
    track("시작 페이지_진입", { page: "Start" });
  }, []);

  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <Logo size="18px" />
      </header>

      <section className="container">
        <div className={styles.heroCard}>
          {/* 상단 소제목 */}
          <div className={styles.caption}>[954만명 2차 베이비 부머 전용]</div>

          {/* 큰 타이틀 */}
          <h1 className={styles.title}>
            은퇴 후 <strong>자동 월급</strong>을 위한
            <br />
            <strong>노후 자금 진단</strong>
          </h1>

          {/* 설명 */}
          <p className={styles.desc}>
            입력은 3분, 결과는 평생. 복잡한 금융용어는 줄이고,{" "}
            <strong>월 현금흐름</strong>과 <strong>부채/자산</strong>을 한 눈에.
            맞춤형 개선 가이드까지 받아보세요.
          </p>

          {/* 신뢰 표기(간단 뱃지) */}
          <ul className={styles.badges} aria-label="서비스 특징">
            <li>무료 시작</li>
            <li>개인정보 최소 수집</li>
            <li>금융 데이터 안전 관리</li>
          </ul>
        </div>
      </section>

      {/* 하단 CTA 고정 바 */}
      <div className={styles.ctaBar}>
        <div className={styles.ctaInner}>
          <div className={styles.madeBy}>
            은퇴자를 위한 재무 설계 전문 서비스
            <br />
            <b>Lycon</b>에 의해 제작되었습니다.
          </div>

          <Link
            to="/survey"
            className="btn"
            onClick={() => track("시작하기_클릭", { from: "Start" })}
            aria-label="설문 시작하기"
          >
            시작하기
          </Link>
        </div>
      </div>
    </main>
  );
}
