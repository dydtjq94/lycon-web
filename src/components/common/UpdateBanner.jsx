import React, { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../libs/firebase";
import versionData from "../../../version.json";
import styles from "./UpdateBanner.module.css";

/**
 * 업데이트 배너 컴포넌트
 * Firebase의 버전과 로컬 버전을 비교하여
 * 새 버전이 있으면 새로고침을 유도하는 배너를 표시합니다.
 */
function UpdateBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [latestVersion, setLatestVersion] = useState(null);

  useEffect(() => {
    // Firebase의 appVersion 문서를 실시간으로 구독
    const unsubscribe = onSnapshot(
      doc(db, "settings", "appVersion"),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const firebaseVersion = data.version;
          setLatestVersion(firebaseVersion);

          // 버전 비교 (로컬 버전과 Firebase 버전이 다르면 배너 표시)
          if (firebaseVersion && firebaseVersion !== versionData.version) {
            setShowBanner(true);
          } else {
            setShowBanner(false);
          }
        }
      },
      (error) => {
        console.error("버전 정보 구독 오류:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // 새로고침 핸들러
  const handleRefresh = () => {
    window.location.reload(true);
  };

  // 배너 닫기 (이번 세션에서만)
  const handleDismiss = () => {
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <span className={styles.icon}>🔄</span>
        <span className={styles.message}>
          새 버전이 있습니다 (v{latestVersion})
        </span>
        <button className={styles.refreshButton} onClick={handleRefresh}>
          새로고침
        </button>
        <button
          className={styles.dismissButton}
          onClick={handleDismiss}
          aria-label="닫기"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default UpdateBanner;
