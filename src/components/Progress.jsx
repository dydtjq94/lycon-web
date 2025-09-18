import React from "react";
import styles from "./Progress.module.css";
import { GROUP_ORDER } from "../config/questions.js";

export default function Progress({
  current,
  total,
  currentGroup,
  groupProgress,
}) {
  // groupProgress: {그룹명: {done:number, total:number}}
  return (
    <div className={styles.wrap} role="region" aria-label="설문 진행 현황">
      <div className={styles.tabs} role="tablist" aria-label="설문 그룹">
        {GROUP_ORDER.map((g) => (
          <div
            key={g}
            className={`${styles.tab} ${
              currentGroup === g ? styles.active : ""
            }`}
            role="tab"
          >
            <span>{g}</span>
            <div className={styles.bar}>
              <div
                className={styles.barFill}
                style={{
                  width: `${Math.round(
                    ((groupProgress[g]?.done || 0) /
                      (groupProgress[g]?.total || 1)) *
                      100
                  )}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className={styles.counter}>
        <b>
          [{current}/{total}]
        </b>{" "}
        {currentGroup}
      </div>
    </div>
  );
}
