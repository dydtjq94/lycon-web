import React from "react";
import styles from "./Loading.module.css";
import { track } from "../libs/analytics";

export default function Loading() {
  React.useEffect(() => track("결과 로딩 페이지_진입"), []);
  return (
    <div className={styles.wrap}>
      <div className={styles.spinner} />
      <p className={styles.caption}>맞춤 리포트를 생성 중입니다…</p>
    </div>
  );
}
