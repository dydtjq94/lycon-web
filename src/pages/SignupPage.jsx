/**
 * 회원가입 페이지
 * Firestore 기반 이메일/비밀번호 회원가입
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { trackEvent, trackPageView } from "../libs/mixpanel";
import styles from "./SignupPage.module.css";

function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signup, userLogin } = useAuth();

  // URL에서 profileId 가져오기
  const profileId = searchParams.get("profileId");

  // Mixpanel: 페이지 진입 이벤트
  useEffect(() => {
    trackPageView("회원가입/로그인 페이지", {
      profileId: profileId || null,
      hasProfileId: !!profileId,
    });
  }, [profileId]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false); // 회원가입 모드 또는 로그인 모드

  /**
   * 회원가입 제출 핸들러
   */
  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    // Mixpanel: 회원가입 시도 이벤트
    trackEvent("회원가입 시도", {
      profileId: profileId || null,
      hasEmail: !!email,
      hasName: !!name,
    });

    if (!profileId) {
      setError("프로필 정보가 없습니다. 다시 시도해주세요.");
      trackEvent("회원가입 실패", {
        reason: "프로필 정보 없음",
      });
      return;
    }

    setLoading(true);

    try {
      const result = await signup(
        email,
        password,
        passwordConfirm,
        name,
        profileId
      );

      if (result.success) {
        // Mixpanel: 회원가입 성공 이벤트
        trackEvent("회원가입 성공", {
          email: email,
          profileId: profileId,
        });

        // 대시보드로 리다이렉트
        navigate(`/consult/dashboard/${profileId}`);
      } else {
        setError(result.error || "회원가입에 실패했습니다.");
        trackEvent("회원가입 실패", {
          email: email,
          error: result.error,
        });
      }
    } catch (error) {
      console.error("회원가입 오류:", error);
      setError("회원가입 중 오류가 발생했습니다.");
      trackEvent("회원가입 오류", {
        email: email,
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * 로그인 제출 핸들러
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    // Mixpanel: 로그인 시도 이벤트
    trackEvent("사용자 로그인 시도", {
      profileId: profileId || null,
      hasEmail: !!email,
    });

    setLoading(true);

    try {
      const result = await userLogin(email, password);

      if (result.success) {
        // Mixpanel: 로그인 성공 이벤트
        trackEvent("사용자 로그인 성공", {
          email: email,
        });

        // 대시보드로 리다이렉트 (profileId가 있으면 해당 프로필로)
        if (profileId) {
          navigate(`/consult/dashboard/${profileId}`);
        } else {
          navigate("/");
        }
      } else {
        setError(result.error || "로그인에 실패했습니다.");
        trackEvent("사용자 로그인 실패", {
          email: email,
          error: result.error,
        });
      }
    } catch (error) {
      console.error("로그인 오류:", error);
      setError("로그인 중 오류가 발생했습니다.");
      trackEvent("사용자 로그인 오류", {
        email: email,
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.signupBox}>
        <div className={styles.header}>
          <h1 className={styles.title}>Lycon Planning</h1>
          <p className={styles.subtitle}>
            {isLoginMode
              ? "로그인하여 수정 권한을 받으세요"
              : "회원가입하여 수정 권한을 받으세요"}
          </p>
        </div>

        {/* 로그인/회원가입 모드 전환 버튼 */}
        <div className={styles.modeSwitch}>
          <button
            type="button"
            className={`${styles.modeButton} ${
              !isLoginMode ? styles.active : ""
            }`}
            onClick={() => {
              setIsLoginMode(false);
              trackEvent("회원가입 모드 전환", {
                profileId: profileId || null,
              });
            }}
            disabled={loading}
          >
            회원가입
          </button>
          <button
            type="button"
            className={`${styles.modeButton} ${
              isLoginMode ? styles.active : ""
            }`}
            onClick={() => {
              setIsLoginMode(true);
              trackEvent("로그인 모드 전환", {
                profileId: profileId || null,
              });
            }}
            disabled={loading}
          >
            로그인
          </button>
        </div>

        {isLoginMode ? (
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="login-email" className={styles.label}>
                이메일
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                placeholder="이메일을 입력하세요"
                required
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="login-password" className={styles.label}>
                비밀번호
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder="비밀번호를 입력하세요"
                required
                disabled={loading}
              />
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                placeholder="이메일을 입력하세요"
                required
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.label}>
                이름
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
                placeholder="이름을 입력하세요"
                required
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder="비밀번호를 입력하세요"
                required
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="passwordConfirm" className={styles.label}>
                비밀번호 확인
              </label>
              <input
                id="passwordConfirm"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className={styles.input}
                placeholder="비밀번호를 다시 입력하세요"
                required
                disabled={loading}
              />
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? "회원가입 중..." : "회원가입"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default SignupPage;
