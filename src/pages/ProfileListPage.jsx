import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { profileService } from "../services/firestoreService";
import { calculateKoreanAge } from "../utils/koreanAge";
import { formatAmount } from "../utils/format";
import { trackPageView, trackEvent } from "../libs/mixpanel";
import TrashModal from "../components/trash/TrashModal";
import styles from "./ProfileListPage.module.css";

/**
 * 프로필 목록 페이지
 * 재무 상담사가 여러 내담자 프로필을 관리할 수 있습니다.
 */
function ProfileListPage() {
  const navigate = useNavigate();
  const { logout, admin, adminId, isAdmin, loading: authLoading } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false); // 휴지통 모달

  // 프로필 목록 로드
  useEffect(() => {
    loadProfiles();
  }, []);

  // Mixpanel: Consult 화면 진입 이벤트
  useEffect(() => {
    // 로딩이 완료되고 프로필 목록이 로드된 후 이벤트 트래킹
    if (!loading) {
      trackPageView("Consult 화면", {
        profileCount: profiles.length,
        hasProfiles: profiles.length > 0,
      });
    }
  }, [loading, profiles.length]);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const allProfiles = await profileService.getAllProfiles();

      // 생성일 기준으로 오래된 것부터 정렬 (오름차순)
      const sortedProfiles = allProfiles.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );

      setProfiles(sortedProfiles);
    } catch (error) {
      console.error("프로필 로드 오류:", error);
      setError("프로필을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    trackEvent("로그아웃", {
      email: admin?.email,
    });
    logout();
    navigate("/login");
  };

  // 프로필 휴지통으로 이동 (soft delete)
  const handleDeleteProfile = async (profileId, profileName) => {
    if (!confirm(`"${profileName}" 프로필을 삭제하시겠습니까?\n\n휴지통으로 이동되며, 나중에 복구할 수 있습니다.`)) {
      return;
    }

    try {
      await profileService.moveToTrash(profileId);
      trackEvent("프로필 삭제 (휴지통 이동)", { profileId, profileName });
      await loadProfiles(); // 목록 새로고침
    } catch (error) {
      console.error("프로필 삭제 오류:", error);
      alert("프로필 삭제 중 오류가 발생했습니다.");
    }
  };

  // 만 나이 계산 (calculateKoreanAge 함수 사용)

  // 인증 로딩 중
  if (authLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>로딩 중...</div>
      </div>
    );
  }

  // 관리자가 아니면 로그인 페이지로 연결하는 안내 표시
  if (!adminId || !isAdmin) {
    return (
      <div className={styles.container}>
        <div className={styles.loginPrompt}>
          <h2 className={styles.loginTitle}>관리자 로그인이 필요합니다</h2>
          <p className={styles.loginMessage}>
            이 페이지에 접근하려면 관리자 계정으로 로그인해주세요.
          </p>
          <button
            className={styles.loginButton}
            onClick={() => navigate("/login")}
          >
            관리자 로그인하기
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>프로필을 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Lycon Planning</h1>
        <div className={styles.headerActions}>
          <button
            className={styles.trashButton}
            onClick={() => setIsTrashModalOpen(true)}
          >
            휴지통
          </button>
          <button
            className={styles.createButton}
            onClick={() => navigate("/consult/create")}
          >
            + 새 프로필
          </button>
          <button
            className={styles.logoutButton}
            onClick={handleLogout}
            title={`${admin?.email || "사용자"} 로그아웃`}
          >
            로그아웃
          </button>
        </div>
      </div>

      <div className={styles.profileList}>
        {profiles.length === 0 && (
          <div className={styles.emptyState}>
            <p>등록된 프로필이 없습니다</p>
          </div>
        )}

        {profiles.map((profile) => (
          <div
            key={profile.id}
            className={styles.profileItem}
            onClick={() => navigate(`/consult/dashboard/${profile.id}`)}
          >
            <div className={styles.profileInfo}>
              <h3 className={styles.profileName}>{profile.name}님</h3>
              <span className={styles.infoText}>
                현재 {calculateKoreanAge(profile.birthYear)}세
              </span>
              <span className={styles.infoDivider}>|</span>
              <span className={styles.infoText}>
                은퇴 {profile.retirementAge}세 (
                {profile.birthYear + profile.retirementAge}년)
              </span>
              <span className={styles.infoDivider}>|</span>
              <span className={styles.infoText}>
                현금 {formatAmount(profile.currentCash || 0)}
              </span>
              <span className={styles.infoDivider}>|</span>
              <span className={styles.infoText}>
                목표{" "}
                {formatAmount(
                  profile.targetAssets || profile.targetAmount || 0
                )}
              </span>
              <span className={styles.infoDivider}>|</span>
              <span className={styles.infoText}>
                가구{" "}
                {(() => {
                  let count = 1;
                  if (profile.hasSpouse) count += 1;
                  if (profile.familyMembers)
                    count += profile.familyMembers.length;
                  return count;
                })()}
                명
              </span>
            </div>
            <div className={styles.profileActions}>
              <button
                className={styles.deleteButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteProfile(profile.id, profile.name);
                }}
              >
                삭제
              </button>
            </div>
          </div>
        ))}

        {/* 프로필 추가 아이템 */}
        <div
          className={styles.addProfileItem}
          onClick={() => navigate("/consult/create")}
        >
          <div className={styles.addProfileContent}>
            <span className={styles.addIcon}>+</span>
            <span className={styles.addText}>새 프로필 추가</span>
          </div>
        </div>
      </div>

      {/* 휴지통 모달 */}
      <TrashModal
        isOpen={isTrashModalOpen}
        onClose={() => setIsTrashModalOpen(false)}
        onUpdate={loadProfiles}
      />
    </div>
  );
}

export default ProfileListPage;
