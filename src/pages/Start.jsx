// ✅ 변경: Link 대신 useNavigate + useSurvey로 초기화 후 이동
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ← 변경: Link 제거, useNavigate 추가
import styles from "./Start.module.css";
import Logo from "../components/Logo.jsx";
import { useSurvey } from "../context/SurveyContext.jsx"; // ← 추가: 전역 설문 상태 접근

export default function Start() {
  const navigate = useNavigate(); // ← 추가
  const { dispatch } = useSurvey(); // ← 추가

  useEffect(() => {
    console.log("Mixpanel: Start_Viewed");
  }, []);

  // ✅ 핵심: 시작 버튼 클릭 시 항상 새 설문으로 초기화
  const handleStart = () => {
    // 1) 로컬 저장된 진행 삭제
    localStorage.removeItem("lycon_survey_v1");
    localStorage.removeItem("lycon_survey_step");

    // 2) 컨텍스트 상태 초기화
    dispatch({ type: "RESET" });

    // 3) 트래킹 더미
    console.log("Mixpanel: Start_Click_New");

    // 4) 새로운 그룹별 설문 첫 페이지로 이동
    navigate("/survey/basic", { replace: true });
  };

  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <Logo size="18px" />
      </header>

      <section className="container">
        <div className={styles.heroCard}>
          <div className={styles.caption}>[954만명 2차 베이비 부머 전용]</div>
          <h1 className={styles.title}>
            은퇴 후 <strong>자동 월급</strong>을 위한
            <br /> <strong>노후 자금 진단</strong>
          </h1>
          <p className={styles.desc}>
            입력은 3분, 결과는 평생. <strong>월 현금흐름</strong>과{" "}
            <strong>자산·부채</strong>를 한눈에 보고, 맞춤형 개선 가이드를
            받아보세요.
          </p>
          <ul className={styles.badges} aria-label="서비스 특징">
            <li>무료 시작</li>
            <li>개인정보 최소 수집</li>
            <li>데이터 안전 관리</li>
          </ul>
        </div>
      </section>

      <div className={styles.ctaBar}>
        <div className={styles.ctaInner}>
          <div className={styles.madeBy}>
            은퇴자를 위한 재무 설계 전문 서비스
            <br />
            <b>Lycon</b>이 제작했습니다.
          </div>

          {/* ✅ 변경: Link → button, onClick으로 초기화 후 이동 */}
          <button
            type="button"
            className="btn"
            aria-label="설문 시작하기"
            onClick={handleStart}
          >
            시작하기
          </button>
        </div>
      </div>
    </main>
  );
}
