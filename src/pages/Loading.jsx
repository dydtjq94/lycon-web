import React from "react";
import styles from "./Loading.module.css";
import { useNavigate } from "react-router-dom";

export default function Loading() {
  const nav = useNavigate();
  React.useEffect(() => {
    console.log("Mixpanel: Loading_Viewed");
    const t = setTimeout(() => nav("/result"), 1200); // 1.2초 후 결과로 이동
    return () => clearTimeout(t);
  }, [nav]);

  return (
    <div className={styles.wrap}>
      <div className={styles.spinner} />
      <p className={styles.caption}>맞춤 리포트를 생성 중입니다…</p>
    </div>
  );
}
