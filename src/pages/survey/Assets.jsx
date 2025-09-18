import React from "react";
import styles from "./SurveyGroup.module.css";
import { useNavigate } from "react-router-dom";
import { useSurvey } from "../../context/SurveyContext.jsx";
import { QUESTIONS } from "../../config/questions.js";
import MoneyInput from "../../components/MoneyInput.jsx";
import GroupNavigation from "../../components/GroupNavigation.jsx";
import { formatKRW, formatPercent } from "../../libs/format.js";

/**
 * 자산 페이지 - 금융자산, 투자수익률, 부동산 관련 문항
 * 문항: 금융자산 총액, 투자 수익률, 부동산 가치
 */
export default function Assets() {
  const navigate = useNavigate();
  const { state, dispatch } = useSurvey();

  // 자산 그룹의 문항들만 필터링
  const assetQuestions = QUESTIONS.filter((q) => q.group === "자산");

  const [errors, setErrors] = React.useState({});

  // 답변 설정 함수
  function setAnswer(id, value) {
    dispatch({ type: "SET_ANSWER", payload: { id, value } });
    // 에러가 있었다면 제거
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: null }));
    }
  }

  // 입력 검증
  function validate(question, answer) {
    if (question.type === "number") {
      if (answer === null || answer === "" || Number.isNaN(answer)) {
        return "숫자를 입력해주세요.";
      }
      if (typeof question.min === "number" && answer < question.min) {
        return `최소 ${question.min}${question.unit} 이상 입력해주세요.`;
      }
      if (typeof question.max === "number" && answer > question.max) {
        return `최대 ${question.max}${question.unit} 이하 입력해주세요.`;
      }
    }
    return null;
  }

  // 다음 단계로 이동
  function handleNext() {
    let hasError = false;
    const newErrors = {};

    // 모든 문항 검증
    assetQuestions.forEach((q) => {
      const answer = state.answers[q.id];
      const error = validate(q, answer);
      if (error) {
        newErrors[q.id] = error;
        hasError = true;
      }
    });

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    // Mixpanel 이벤트
    console.log("Mixpanel: Assets_Completed");

    // 그룹 완료 상태 업데이트
    dispatch({ type: "COMPLETE_GROUP", payload: { groupName: "자산" } });

    // 다음 그룹으로 이동
    navigate("/survey/debt");
  }

  // 이전 단계로 이동
  function handlePrev() {
    navigate("/survey/expenses");
  }

  // 문항 렌더링
  function renderQuestion(question) {
    const answer = state.answers[question.id];
    const error = errors[question.id];

    return (
      <div key={question.id} className={styles.questionCard}>
        <div className={styles.questionHeader}>
          <h3 className={styles.questionTitle}>{question.title}</h3>
          <div className={styles.questionNumber}>Q{question.no}</div>
        </div>

        <div className={styles.inputArea}>
          {question.unit === "만원" ? (
            <div className={styles.numberInput}>
              <MoneyInput
                id={`q-${question.id}`}
                value={answer}
                onChange={(value) => setAnswer(question.id, value)}
                rightUnit="만원"
                placeholder={question.placeholder || "금액을 입력하세요"}
              />
            </div>
          ) : (
            <div className={styles.numberInput}>
              <input
                id={`q-${question.id}`}
                type="number"
                inputMode={question.isPercent ? "decimal" : "numeric"}
                step={question.isPercent ? "0.1" : "1"}
                min={question.min ?? undefined}
                max={question.max ?? undefined}
                value={answer ?? ""}
                onChange={(e) => {
                  const value =
                    e.target.value === "" ? null : Number(e.target.value);
                  setAnswer(question.id, value);
                }}
                placeholder={question.placeholder || ""}
                className={styles.input}
              />
              <span className={styles.unit}>{question.unit}</span>
            </div>
          )}
        </div>

        {error && (
          <div className={styles.errorMessage} role="alert">
            {error}
          </div>
        )}

        {/* 입력값 미리보기 */}
        {answer !== null && answer !== "" && (
          <div className={styles.preview}>
            입력값:{" "}
            {question.unit === "만원"
              ? formatKRW(answer)
              : question.isPercent
              ? formatPercent(answer)
              : `${answer}${question.unit}`}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.header}>
        <button
          className={styles.backButton}
          onClick={handlePrev}
          aria-label="이전으로"
        >
          ←
        </button>
        <h1 className={styles.pageTitle}>자산</h1>
        <div className={styles.progress}>
          <span className={styles.currentStep}>4</span>
          <span className={styles.totalSteps}>/ 5</span>
        </div>
      </div>

      <div className={styles.content}>
        <GroupNavigation />

        <div className={styles.groupDescription}>
          <p>현재 보유하고 있는 자산과 예상 수익률을 입력해주세요.</p>
        </div>

        <div className={styles.questionsContainer}>
          {assetQuestions.map(renderQuestion)}
        </div>
      </div>

      <div className={styles.footer}>
        <button className={styles.nextButton} onClick={handleNext}>
          다음 단계 (부채)
        </button>
      </div>
    </div>
  );
}
