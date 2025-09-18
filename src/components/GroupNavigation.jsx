import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSurvey } from "../context/SurveyContext.jsx";
import styles from "./GroupNavigation.module.css";

/**
 * 그룹 간 네비게이션 컴포넌트
 * 각 설문 그룹 페이지에서 다른 그룹으로 이동할 수 있는 메뉴
 */
export default function GroupNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSurvey();

  // 그룹 정보 정의
  const groups = [
    {
      id: "basic",
      name: "기본 정보",
      path: "/survey/basic",
      groupName: "은퇴 연령",
      description: "나이, 은퇴 연령",
    },
    {
      id: "income",
      name: "소득 & 연금",
      path: "/survey/income",
      groupName: "연금&소득",
      description: "연금, 기타 소득",
    },
    {
      id: "expenses",
      name: "지출",
      path: "/survey/expenses",
      groupName: "지출",
      description: "생활비, 이벤트 지출",
    },
    {
      id: "assets",
      name: "자산",
      path: "/survey/assets",
      groupName: "자산",
      description: "금융자산, 부동산",
    },
    {
      id: "debt",
      name: "부채",
      path: "/survey/debt",
      groupName: "부채",
      description: "대출, 이자율",
    },
  ];

  // 현재 활성 그룹 찾기
  const currentGroup = groups.find((group) => location.pathname === group.path);

  // 그룹 클릭 핸들러
  function handleGroupClick(group) {
    if (location.pathname !== group.path) {
      navigate(group.path);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.progressBar}>
        {groups.map((group, index) => {
          const isCompleted = state.completedGroups[group.groupName];
          const isCurrent = location.pathname === group.path;
          const isAccessible =
            index === 0 || state.completedGroups[groups[index - 1].groupName];

          return (
            <button
              key={group.id}
              className={`${styles.progressItem} ${
                isCurrent ? styles.current : ""
              } ${isCompleted ? styles.completed : ""} ${
                !isAccessible ? styles.disabled : ""
              }`}
              onClick={() => isAccessible && handleGroupClick(group)}
              disabled={!isAccessible}
              aria-label={`${group.name} ${
                isCompleted ? "완료" : isCurrent ? "현재" : "미완료"
              }`}
            >
              <div className={styles.progressLabel}>{group.name}</div>
              <div className={styles.progressBarSegment}>
                <div
                  className={`${styles.progressFill} ${
                    isCurrent || isCompleted ? styles.active : ""
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
