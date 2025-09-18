import React from "react";
import styles from "./Result.module.css";
import { useNavigate } from "react-router-dom";
import { useSurvey } from "../context/SurveyContext.jsx";
import { QUESTIONS } from "../config/questions.js";
import { formatKRW, formatKRWMonthly, formatPercent } from "../libs/format.js";

export default function Result() {
  const nav = useNavigate();
  const { state } = useSurvey();

  const invalids = React.useMemo(() => {
    // 간단 재검증 (설문 페이지 검증과 동일한 기준 요약)
    const bad = [];
    for (const q of QUESTIONS) {
      const ans = state.answers[q.id];
      const v = validate(q, ans);
      if (!v.valid) bad.push({ no: q.no, title: q.title, reason: v.message });
    }
    return bad;
  }, [state.answers]);

  function validate(q, ans) {
    if (q.type === "number") {
      if (ans === null || ans === "" || Number.isNaN(ans))
        return { valid: false, message: "숫자 필요" };
      if (typeof q.min === "number" && ans < q.min)
        return { valid: false, message: `${q.min}${q.unit} 이상` };
      if (typeof q.max === "number" && ans > q.max)
        return { valid: false, message: `${q.max}${q.unit} 이하` };
      return { valid: true };
    }
    if (q.type === "yesno_amount") {
      if (ans?.has === null) return { valid: false, message: "예/아니오 필요" };
      if (ans?.has === true && !(ans.amount > 0))
        return { valid: false, message: "금액 필요" };
      return { valid: true };
    }
    if (q.type === "yesno_multi") {
      if (ans?.has === null) return { valid: false, message: "예/아니오 필요" };
      if (ans?.has === true) {
        for (const f of q.fields) {
          const v = ans[f.key];
          if (v === null || v === "")
            return { valid: false, message: `${f.label} 필요` };
          if ((f.kind === "money" || f.kind === "number") && v < 0)
            return { valid: false, message: `${f.label} 0 이상` };
        }
      }
      return { valid: true };
    }
    return { valid: false, message: "알 수 없음" };
  }

  function renderRow(q) {
    const a = state.answers[q.id];
    if (q.type === "number") {
      let val = a;
      if (q.unit === "만원") {
        // 월 단위 생활비인지 확인
        const isMonthly =
          q.id === "currentLiving" ||
          q.id === "retireBaseLiving" ||
          q.id === "retireLeisureLiving";
        val = isMonthly ? formatKRWMonthly(a) : formatKRW(a);
      } else if (q.isPercent) val = formatPercent(a);
      else val = `${a}${q.unit}`;
      return row(q.title, val);
    }
    if (q.type === "yesno_amount") {
      if (a?.has === true) {
        // 월 단위 수령액인지 확인 (연금&소득 그룹)
        const isMonthly = q.group === "연금&소득";
        return row(
          q.title,
          `${isMonthly ? formatKRWMonthly(a.amount) : formatKRW(a.amount)} (예)`
        );
      }
      if (a?.has === false) return row(q.title, "아니오");
      return row(q.title, "—");
    }
    if (q.type === "yesno_multi") {
      if (a?.has === false) return row(q.title, "아니오");
      if (a?.has === true) {
        const parts = q.fields.map((f) => {
          let v = a[f.key];
          if (f.kind === "money") v = formatKRW(v);
          else if (f.kind === "percent") v = formatPercent(v);
          else v = `${v}${f.unit}`;
          return `${f.label}: ${v}`;
        });
        return row(q.title, parts.join(" · "));
      }
      return row(q.title, "—");
    }
  }

  function row(label, value) {
    return (
      <div className={styles.row} key={label}>
        <div className={styles.key}>{label}</div>
        <div className={styles.val}>{value}</div>
      </div>
    );
  }

  return (
    <div className={`container ${styles.page}`}>
      <h2 className={styles.h2}>진단 요약</h2>

      {invalids.length > 0 && (
        <div className={styles.warn}>
          제출 전 확인이 필요합니다. 미완료 항목:{" "}
          {invalids
            .slice(0, 5)
            .map((x) => `Q${x.no}`)
            .join(", ")}
          {invalids.length > 5 ? "…" : ""}
        </div>
      )}

      <div className={styles.card}>{QUESTIONS.map(renderRow)}</div>

      <div className={styles.actions}>
        <button className={styles.btnGhost} onClick={() => nav("/survey")}>
          수정하기
        </button>
        <button
          className={styles.btnPrimary}
          onClick={() => {
            console.log("Mixpanel: Survey_Submit");
            alert("제출 완료(더미).");
          }}
        >
          제출
        </button>
      </div>
    </div>
  );
}
