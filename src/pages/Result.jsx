import React from "react";
import styles from "./Result.module.css";
import { track } from "../libs/analytics";

export default function Result() {
  React.useEffect(() => track("결과 페이지_진입"), []);
  return (
    <div className={`container ${styles.page}`}>
      <h2>결과 페이지 (준비 중)</h2>
      <p>여기에 월 현금흐름/부채/자산/연금 등 시각화를 붙일 예정입니다.</p>
    </div>
  );
}
