import React from "react";
import styles from "./Survey.module.css";
import { useNavigate } from "react-router-dom";
import { useSurvey } from "../context/SurveyContext.jsx";
import { QUESTIONS, GROUP_ORDER } from "../config/questions.js";
import Progress from "../components/Progress.jsx";
import MoneyInput from "../components/MoneyInput.jsx";
import { formatKRW, formatKRWComma } from "../libs/format.js";

export default function Survey() {
  const nav = useNavigate();
  const { state, dispatch } = useSurvey();

  const [step, setStep] = React.useState(() => {
    const saved = Number(localStorage.getItem("lycon_survey_step"));
    return Number.isFinite(saved) && saved >= 1 && saved <= QUESTIONS.length
      ? saved
      : 1;
  });

  const q = QUESTIONS[step - 1];
  const total = QUESTIONS.length;

  // 그룹별 진행 통계
  const groupProgress = React.useMemo(() => {
    const map = {};
    GROUP_ORDER.forEach(
      (g) =>
        (map[g] = {
          done: 0,
          total: QUESTIONS.filter((x) => x.group === g).length,
        })
    );
    QUESTIONS.forEach((qq) => {
      const ans = state.answers[qq.id];
      if (isAnswered(qq, ans)) map[qq.group].done += 1;
    });
    return map;
  }, [state.answers]);

  React.useEffect(() => {
    localStorage.setItem("lycon_survey_step", String(step));
  }, [step]);

  function isAnswered(qq, ans) {
    if (qq.type === "number")
      return ans !== null && ans !== "" && !Number.isNaN(ans);
    if (qq.type === "yesno_amount") {
      if (ans?.has === true) return ans.amount !== null && ans.amount > 0;
      if (ans?.has === false) return true;
      return false;
    }
    if (qq.type === "yesno_multi") {
      if (ans?.has === false) return true;
      if (ans?.has === true) {
        return qq.fields.every((f) => {
          const v = ans[f.key];
          if (f.kind === "money" || f.kind === "number")
            return v !== null && v >= 0;
          if (f.kind === "percent") return v !== null && !Number.isNaN(v);
          return false;
        });
      }
      return false;
    }
    return false;
  }

  function setAnswer(id, value) {
    dispatch({ type: "SET_ANSWER", payload: { id, value } });
  }

  function handlePrev() {
    setStep((s) => Math.max(1, s - 1));
  }

  function handleNext() {
    const ans = state.answers[q.id];
    const { valid, message } = validate(q, ans);
    if (!valid) {
      setError(message || "값을 확인해주세요.");
      return;
    }

    // 더미 Mixpanel
    console.log(`Mixpanel: Survey_Q${q.no}_Completed`);

    if (step === total) {
      nav("/loading");
    } else {
      setError(null);
      setStep((s) => s + 1);
    }
  }

  const [error, setError] = React.useState(null);

  function validate(qq, ans) {
    // 기본 검증
    if (qq.type === "number") {
      if (ans === null || ans === "" || Number.isNaN(ans))
        return { valid: false, message: "숫자를 입력하세요." };
      if (typeof qq.min === "number" && ans < qq.min)
        return { valid: false, message: `최소 ${qq.min}${qq.unit} 이상` };
      if (typeof qq.max === "number" && ans > qq.max)
        return { valid: false, message: `최대 ${qq.max}${qq.unit} 이하` };
      return { valid: true };
    }

    if (qq.type === "yesno_amount") {
      if (ans?.has === null)
        return { valid: false, message: "예/아니오를 선택하세요." };
      if (ans?.has === true) {
        if (ans.amount === null || ans.amount <= 0)
          return { valid: false, message: "금액을 입력하세요." };
      }
      return { valid: true };
    }

    if (qq.type === "yesno_multi") {
      if (ans?.has === null)
        return { valid: false, message: "예/아니오를 선택하세요." };
      if (ans?.has === true) {
        for (const f of qq.fields) {
          const v = ans[f.key];
          if (v === null || v === "")
            return { valid: false, message: `${f.label}을(를) 입력하세요.` };
          if (f.kind === "money" || f.kind === "number") {
            if (v < 0)
              return {
                valid: false,
                message: `${f.label}은(는) 0 이상이어야 합니다.`,
              };
          }
        }
      }
      return { valid: true };
    }

    return { valid: false, message: "알 수 없는 문항 유형" };
  }

  // 입력 렌더러들
  function renderNumber() {
    const v = state.answers[q.id];
    const isMoney = q.unit === "원";
    const isPercent = q.isPercent;

    if (isMoney) {
      return (
        <MoneyInput
          id={`q-${q.id}`}
          value={v}
          onChange={(num) => setAnswer(q.id, num)}
          placeholder={q.placeholder}
          rightUnit={q.unit}
        />
      );
    }

    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          id={`q-${q.id}`}
          type="number"
          inputMode={isPercent ? "decimal" : "numeric"}
          step={isPercent ? "0.1" : "1"}
          min={q.min ?? undefined}
          max={q.max ?? undefined}
          value={v ?? ""}
          onChange={(e) =>
            setAnswer(
              q.id,
              e.target.value === "" ? null : Number(e.target.value)
            )
          }
          placeholder={q.placeholder || ""}
          style={{
            flex: 1,
            border: "none",
            borderBottom: "2px solid #0f172a",
            padding: "12px 4px",
            fontSize: "18px",
            outline: "none",
            background: "transparent",
          }}
        />
        <span style={{ color: "#0f172a", fontWeight: 700 }}>{q.unit}</span>
      </div>
    );
  }

  function renderYesNoAmount() {
    const data = state.answers[q.id] || { has: null, amount: null };
    return (
      <>
        <div className={styles.ynRow} role="radiogroup" aria-label="예 아니오">
          <label
            className={`${styles.yn} ${
              data.has === false ? styles.noActive : ""
            }`}
          >
            <input
              type="radio"
              name={`yn-${q.id}`}
              value="no"
              checked={data.has === false}
              onChange={() => setAnswer(q.id, { has: false, amount: null })}
            />
            아니오
          </label>
          <label
            className={`${styles.yn} ${
              data.has === true ? styles.yesActive : ""
            }`}
          >
            <input
              type="radio"
              name={`yn-${q.id}`}
              value="yes"
              checked={data.has === true}
              onChange={() => setAnswer(q.id, { ...data, has: true })}
            />
            예
          </label>
        </div>

        {data.has === true && (
          <div className={styles.amountBox}>
            <label htmlFor={`q-${q.id}-amt`} className={styles.subLabel}>
              {q.amountLabel}
            </label>
            <MoneyInput
              id={`q-${q.id}-amt`}
              value={data.amount}
              onChange={(num) => setAnswer(q.id, { ...data, amount: num })}
              rightUnit={q.unit}
              placeholder="금액"
            />
          </div>
        )}
      </>
    );
  }

  function renderYesNoMulti() {
    const data = state.answers[q.id] || { has: null };
    return (
      <>
        <div className={styles.ynRow} role="radiogroup" aria-label="예 아니오">
          <label
            className={`${styles.yn} ${
              data.has === false ? styles.noActive : ""
            }`}
          >
            <input
              type="radio"
              name={`yn-${q.id}`}
              value="no"
              checked={data.has === false}
              onChange={() => setAnswer(q.id, { has: false })}
            />
            아니오
          </label>
          <label
            className={`${styles.yn} ${
              data.has === true ? styles.yesActive : ""
            }`}
          >
            <input
              type="radio"
              name={`yn-${q.id}`}
              value="yes"
              checked={data.has === true}
              onChange={() => setAnswer(q.id, { ...data, has: true })}
            />
            예
          </label>
        </div>

        {data.has === true && (
          <div className={styles.multiGrid}>
            {q.fields.map((f) => (
              <div key={f.key} className={styles.multiItem}>
                <label
                  htmlFor={`q-${q.id}-${f.key}`}
                  className={styles.subLabel}
                >
                  {f.label}
                </label>
                {f.kind === "money" ? (
                  <MoneyInput
                    id={`q-${q.id}-${f.key}`}
                    value={data[f.key]}
                    onChange={(num) =>
                      setAnswer(q.id, { ...data, [f.key]: num })
                    }
                    rightUnit={f.unit}
                    placeholder="금액"
                  />
                ) : (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <input
                      id={`q-${q.id}-${f.key}`}
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      value={data[f.key] ?? ""}
                      onChange={(e) =>
                        setAnswer(q.id, {
                          ...data,
                          [f.key]:
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                        })
                      }
                      placeholder=""
                      style={{
                        flex: 1,
                        border: "none",
                        borderBottom: "2px solid #0f172a",
                        padding: "12px 4px",
                        fontSize: "18px",
                        outline: "none",
                        background: "transparent",
                      }}
                    />
                    <span style={{ color: "#0f172a", fontWeight: 700 }}>
                      {f.unit}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  function renderField() {
    if (q.type === "number") return renderNumber();
    if (q.type === "yesno_amount") return renderYesNoAmount();
    if (q.type === "yesno_multi") return renderYesNoMulti();
    return null;
  }

  // 요약 미리보기(모바일 차지 방지용으로 간단 표시)
  const preview = (() => {
    const ans = state.answers[q.id];
    if (q.type === "number") {
      if (q.unit === "원") return formatKRW(ans);
      if (q.isPercent) return ans !== null && ans !== "" ? `${ans}%` : "—";
      return ans !== null && ans !== "" ? `${ans}${q.unit}` : "—";
    }
    if (q.type === "yesno_amount") {
      if (ans?.has === true) return `${formatKRW(ans.amount)} /월`;
      if (ans?.has === false) return "아니오";
      return "—";
    }
    if (q.type === "yesno_multi") {
      if (ans?.has === false) return "아니오";
      if (ans?.has === true) {
        return q.fields
          .map(
            (f) =>
              `${f.label}:${
                f.kind === "money"
                  ? formatKRW(ans[f.key])
                  : (ans[f.key] ?? "—") + f.unit
              }`
          )
          .join(" · ");
      }
      return "—";
    }
    return "—";
  })();

  return (
    <div className={`container ${styles.page}`}>
      <Progress
        current={step}
        total={total}
        currentGroup={q.group}
        groupProgress={groupProgress}
      />

      <div className={styles.card}>
        <div className={styles.qHeader}>
          <div className={styles.qNo}>
            [{q.no}/{total}] {q.group}
          </div>
          <h2 className={styles.title}>{q.title}</h2>
        </div>

        <div className={styles.fieldArea}>{renderField()}</div>

        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        <div className={styles.navRow}>
          <button
            className={styles.btnGhost}
            onClick={handlePrev}
            disabled={step === 1}
            aria-label="이전"
          >
            이전
          </button>
          <button
            className={styles.btnPrimary}
            onClick={handleNext}
            aria-label="다음"
          >
            다음
          </button>
        </div>

        <div className={styles.preview} aria-live="polite">
          현재 입력값 미리보기: <span>{preview}</span>
        </div>
      </div>
    </div>
  );
}
