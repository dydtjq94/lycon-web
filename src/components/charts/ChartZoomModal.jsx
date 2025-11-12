import React, { useEffect } from "react";
import styles from "./ChartZoomModal.module.css";

/**
 * 차트 확대 모달
 * 차트를 전체 화면으로 확대하여 보여줍니다.
 */
function ChartZoomModal({ isOpen, onClose, children, title }) {
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // 스크롤 방지
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className={`${styles.modalOverlay} ${isOpen ? styles.open : ""}`}
        onClick={onClose}
      />

      {/* 슬라이드 패널 */}
      <div className={`${styles.modalContent} ${isOpen ? styles.open : ""}`}>
        {/* 헤더 */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            type="button"
            title="닫기 (ESC)"
          >
            →
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className={styles.chartContainer}>{children}</div>
      </div>
    </>
  );
}

export default ChartZoomModal;
