import React, { useState, useEffect, useRef } from "react";
import versionData from "../../../version.json";
import styles from "./VersionDisplay.module.css";

/**
 * 버전 표시 컴포넌트 (개발자용)
 * 마우스를 올리면 버전 히스토리가 표시됩니다.
 * 클릭하면 툴팁이 고정되어 더 편하게 볼 수 있습니다.
 */
function VersionDisplay() {
  const [isHovered, setIsHovered] = useState(false);
  const [isFixed, setIsFixed] = useState(false);
  const tooltipRef = useRef(null);
  const history = versionData.history || [];

  // 클릭으로 고정 토글
  const handleVersionClick = (e) => {
    e.stopPropagation();
    setIsFixed(!isFixed);
  };

  // 바깥쪽 클릭 시 고정 해제
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isFixed &&
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target) &&
        !event.target.closest(`.${styles.versionText}`)
      ) {
        setIsFixed(false);
      }
    };

    if (isFixed) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isFixed]);

  const showTooltip = isHovered || isFixed;

  return (
    <div className={styles.versionDisplay}>
      <div
        className={styles.versionText}
        onClick={handleVersionClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => !isFixed && setIsHovered(false)}
      >
        v{versionData.version}
      </div>

      {showTooltip && (
        <div
          ref={tooltipRef}
          className={styles.historyTooltip}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => !isFixed && setIsHovered(false)}
        >
          <div className={styles.tooltipHeader}>
            버전 히스토리
            {isFixed && (
              <button
                className={styles.closeButton}
                onClick={() => setIsFixed(false)}
                aria-label="닫기"
              >
                ×
              </button>
            )}
          </div>
          <div className={styles.tooltipContent}>
            {history.length > 0 ? (
              history.map((item, index) => (
                <div key={index} className={styles.historyItem}>
                  <div className={styles.historyVersion}>
                    v{item.version}
                    <span className={styles.historyDate}> ({item.date})</span>
                  </div>
                  {item.changes && item.changes.length > 0 && (
                    <ul className={styles.historyChanges}>
                      {item.changes.map((change, changeIndex) => (
                        <li key={changeIndex}>{change}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            ) : (
              <div className={styles.noHistory}>버전 히스토리가 없습니다.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default VersionDisplay;
