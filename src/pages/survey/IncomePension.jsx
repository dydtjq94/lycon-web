import React from "react";
import styles from "./SurveyGroup.module.css";
import { useNavigate } from "react-router-dom";
import { useSurvey } from "../../context/SurveyContext.jsx";
import { QUESTIONS } from "../../config/questions.js";
import MoneyInput from "../../components/MoneyInput.jsx";
import GroupNavigation from "../../components/GroupNavigation.jsx";
import { formatKRW, formatKRWMonthly } from "../../libs/format.js";

/**
 * 소득 & 연금 페이지 - 연금 및 기타 소득 관련 문항
 * 문항: 국민연금, 퇴직연금, 개인연금, 기타 소득
 */
export default function IncomePension() {
  const navigate = useNavigate();
  const { state, dispatch } = useSurvey();

  // 소득 & 연금 그룹의 문항들만 필터링
  const incomeQuestions = QUESTIONS.filter((q) => q.group === "연금&소득");

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
    if (question.type === "yesno_amount") {
      if (answer?.has === null) {
        return "예/아니오를 선택해주세요.";
      }
      if (answer?.has === true) {
        if (answer.amount === null || answer.amount <= 0) {
          return "금액을 입력해주세요.";
        }
      }
    }
    return null;
  }

  // 다음 단계로 이동
  function handleNext() {
    let hasError = false;
    const newErrors = {};

    // 모든 문항 검증
    incomeQuestions.forEach((q) => {
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
    console.log("Mixpanel: IncomePension_Completed");

    // 그룹 완료 상태 업데이트
    dispatch({ type: "COMPLETE_GROUP", payload: { groupName: "연금&소득" } });

    // 다음 그룹으로 이동
    navigate("/survey/expenses");
  }

  // 이전 단계로 이동
  function handlePrev() {
    navigate("/survey/basic");
  }

  // 문항 렌더링
  function renderQuestion(question) {
    const answer = state.answers[question.id] || { has: null, amount: null };
    const error = errors[question.id];

    return (
      <div key={question.id} className={styles.questionCard}>
        <div className={styles.questionHeader}>
          <h3 className={styles.questionTitle}>{question.title}</h3>
          <div className={styles.questionNumber}>Q{question.no}</div>
        </div>

        <div className={styles.inputArea}>
          <div
            className={styles.yesNoRow}
            role="radiogroup"
            aria-label="예 아니오"
          >
            <label
              className={`${styles.yesNoOption} ${
                answer.has === false ? styles.selected : ""
              }`}
            >
              <input
                type="radio"
                name={`yn-${question.id}`}
                value="no"
                checked={answer.has === false}
                onChange={() =>
                  setAnswer(question.id, { has: false, amount: null })
                }
              />
              <span>아니오</span>
            </label>
            <label
              className={`${styles.yesNoOption} ${
                answer.has === true ? styles.selected : ""
              }`}
            >
              <input
                type="radio"
                name={`yn-${question.id}`}
                value="yes"
                checked={answer.has === true}
                onChange={() =>
                  setAnswer(question.id, { ...answer, has: true })
                }
              />
              <span>예</span>
            </label>
          </div>

          {answer.has === true && (
            <div className={styles.amountInput}>
              <label
                htmlFor={`q-${question.id}-amount`}
                className={styles.amountLabel}
              >
                {question.amountLabel}
              </label>
              <MoneyInput
                id={`q-${question.id}-amount`}
                value={answer.amount}
                onChange={(amount) =>
                  setAnswer(question.id, { ...answer, amount })
                }
                rightUnit="만원/월"
                placeholder="금액을 입력하세요"
              />
            </div>
          )}
        </div>

        {error && (
          <div className={styles.errorMessage} role="alert">
            {error}
          </div>
        )}

        {/* 입력값 미리보기 */}
        {answer.has !== null && (
          <div className={styles.preview}>
            {answer.has === true ? formatKRWMonthly(answer.amount) : "없음"}
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
        <h1 className={styles.pageTitle}>소득 & 연금</h1>
        <div className={styles.progress}>
          <span className={styles.currentStep}>2</span>
          <span className={styles.totalSteps}>/ 5</span>
        </div>
      </div>

      <div className={styles.content}>
        <GroupNavigation />

        <div className={styles.groupDescription}>
          <p>은퇴 후 받을 수 있는 연금 및 기타 소득을 입력해주세요.</p>
        </div>

        <div className={styles.questionsContainer}>
          {incomeQuestions.map(renderQuestion)}
        </div>
      </div>

      <div className={styles.footer}>
        <button className={styles.nextButton} onClick={handleNext}>
          다음 단계 (지출)
        </button>
      </div>
    </div>
  );
}
