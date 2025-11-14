/**
 * 프로필 패스워드 입력 모달
 * 대시보드 접근 시 패스워드를 입력받는 모달
 */

import React, { useState, useEffect } from "react";
import styles from "./ProfilePasswordModal.module.css";
import { trackEvent } from "../../libs/mixpanel";

/**
 * ProfilePasswordModal 컴포넌트
 * @param {boolean} isOpen - 모달 열림 상태
 * @param {function} onClose - 모달 닫기 핸들러
 * @param {function} onSubmit - 패스워드 제출 핸들러 (password) => Promise<boolean>
 * @param {string} profileName - 프로필 이름
 * @param {string} profileId - 프로필 ID (트래킹용)
 */
function ProfilePasswordModal({ isOpen, onClose, onSubmit, profileName, profileId }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 모달이 열릴 때마다 초기화
  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setError("");
      setLoading(false);

      // Mixpanel: 패스워드 모달 열림
      trackEvent("프로필 패스워드 모달 열림", {
        profileId,
        profileName,
      });
    }
  }, [isOpen, profileId, profileName]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen]);

  /**
   * 모달 닫기
   */
  const handleClose = () => {
    if (loading) return; // 로딩 중에는 닫기 불가
    
    // Mixpanel: 패스워드 입력 취소
    trackEvent("프로필 패스워드 입력 취소", {
      profileId,
      profileName,
    });
    
    onClose();
  };

  /**
   * 폼 제출 핸들러
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!password.trim()) {
      setError("패스워드를 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      // Mixpanel: 패스워드 입력 시도
      trackEvent("프로필 패스워드 입력 시도", {
        profileId,
        profileName,
      });

      const isValid = await onSubmit(password);

      if (isValid) {
        // Mixpanel: 패스워드 입력 성공
        trackEvent("프로필 패스워드 입력 성공", {
          profileId,
          profileName,
        });
        // 성공 시 부모 컴포넌트에서 모달을 닫음
      } else {
        setError("패스워드가 올바르지 않습니다. 패스워드가 설정되지 않은 경우 관리자에게 문의하세요.");
        
        // Mixpanel: 패스워드 입력 실패
        trackEvent("프로필 패스워드 입력 실패", {
          profileId,
          profileName,
        });
      }
    } catch (error) {
      console.error("패스워드 확인 오류:", error);
      setError("패스워드 확인 중 오류가 발생했습니다.");
      
      // Mixpanel: 패스워드 확인 오류
      trackEvent("프로필 패스워드 확인 오류", {
        profileId,
        profileName,
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>🔒 프로필 접근 권한 확인</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleClose}
            disabled={loading}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.infoText}>
            <strong>{profileName}</strong> 프로필에 접근하려면
            <br />
            패스워드를 입력해주세요.
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="profile-password" className={styles.label}>
                패스워드
              </label>
              <input
                id="profile-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(""); // 입력 시 에러 메시지 초기화
                }}
                className={styles.input}
                placeholder="프로필 패스워드를 입력하세요"
                disabled={loading}
                autoFocus
              />
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={handleClose}
                disabled={loading}
              >
                취소
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading || !password.trim()}
              >
                {loading ? "확인 중..." : "확인"}
              </button>
            </div>
          </form>

          <div className={styles.helpText}>
            <p>💡 패스워드를 입력하면 대시보드를 조회할 수 있습니다.</p>
            <p>수정하려면 회원가입이 필요합니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePasswordModal;

