import React from "react";
import styles from "./Survey.module.css";
import { track } from "../libs/analytics";

export default function Survey() {
  React.useEffect(() => track("설문 페이지_진입"), []);
  return (
    <div className={`container ${styles.page}`}>
      <h2>설문 페이지 (준비 중)</h2>
      <p>다음 단계에서 실제 질문 구성과 저장(Firestore), 트래킹을 붙일게요.</p>
    </div>
  );
}
