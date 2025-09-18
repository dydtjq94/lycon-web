import React, { createContext, useContext, useEffect, useReducer } from "react";
import { QUESTIONS } from "../config/questions.js";

const STORAGE_KEY = "lycon_survey_v1";

const SurveyContext = createContext(null);

function buildInitialAnswers() {
  // 스키마 기반 기본값
  const base = {};
  for (const q of QUESTIONS) {
    if (q.type === "number") {
      base[q.id] = null; // 숫자
    } else if (q.type === "yesno_amount") {
      base[q.id] = { has: null, amount: null }; // 예/아니오 + 금액
    } else if (q.type === "yesno_multi") {
      const m = { has: null };
      q.fields.forEach((f) => (m[f.key] = null));
      base[q.id] = m;
    }
  }
  return base;
}

const initialState = {
  answers: buildInitialAnswers(),
  // 그룹별 완료 상태 추적
  completedGroups: {
    "은퇴 연령": false,
    "연금&소득": false,
    지출: false,
    자산: false,
    부채: false,
  },
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_ANSWER": {
      const { id, value } = action.payload;
      return { ...state, answers: { ...state.answers, [id]: value } };
    }
    case "LOAD_SAVED": {
      return { ...state, answers: action.payload };
    }
    case "RESET": {
      return {
        ...state,
        answers: buildInitialAnswers(),
        completedGroups: {
          "은퇴 연령": false,
          "연금&소득": false,
          지출: false,
          자산: false,
          부채: false,
        },
      };
    }
    case "COMPLETE_GROUP": {
      const { groupName } = action.payload;
      return {
        ...state,
        completedGroups: {
          ...state.completedGroups,
          [groupName]: true,
        },
      };
    }
    default:
      return state;
  }
}

export function SurveyProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // 초기 로드: localStorage 복원
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // 간단한 키 교차 검증
        if (parsed && typeof parsed === "object") {
          dispatch({
            type: "LOAD_SAVED",
            payload: { ...buildInitialAnswers(), ...parsed },
          });
        }
      }
    } catch (e) {
      console.warn("restore failed", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 변경 시 자동 저장
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.answers));
    } catch (e) {
      /* ignore */
    }
  }, [state.answers]);

  const value = { state, dispatch };
  return (
    <SurveyContext.Provider value={value}>{children}</SurveyContext.Provider>
  );
}

export function useSurvey() {
  const ctx = useContext(SurveyContext);
  if (!ctx) throw new Error("useSurvey must be used within SurveyProvider");
  return ctx;
}
