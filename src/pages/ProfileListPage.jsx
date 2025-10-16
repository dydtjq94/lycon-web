import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { profileService } from "../services/firestoreService";
import { calculateKoreanAge } from "../utils/koreanAge";
import styles from "./ProfileListPage.module.css";

/**
 * 프로필 목록 페이지
 * 재무 상담사가 여러 내담자 프로필을 관리할 수 있습니다.
 */
function ProfileListPage() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [deletedProfiles, setDeletedProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleted, setShowDeleted] = useState(false);

  // 프로필 목록 로드
  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const allProfiles = await profileService.getAllProfilesIncludingDeleted();

      // 활성 프로필과 삭제된 프로필 분리
      const activeProfiles = allProfiles.filter(
        (profile) => profile.isActive !== false
      );
      const deletedProfiles = allProfiles.filter(
        (profile) => profile.isActive === false
      );

      // 생성일 기준으로 오래된 것부터 정렬 (오름차순)
      const sortedActiveProfiles = activeProfiles.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      const sortedDeletedProfiles = deletedProfiles.sort(
        (a, b) =>
          new Date(a.deletedAt || a.createdAt) -
          new Date(b.deletedAt || b.createdAt)
      );

      setProfiles(sortedActiveProfiles);
      setDeletedProfiles(sortedDeletedProfiles);
    } catch (error) {
      console.error("프로필 로드 오류:", error);
      setError("프로필을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 프로필 삭제 (소프트 삭제)
  const handleDeleteProfile = async (profileId, profileName) => {
    if (
      !confirm(
        `"${profileName}" 프로필을 삭제하시겠습니까?\n\n삭제된 프로필은 휴지통에서 복원할 수 있습니다.`
      )
    ) {
      return;
    }

    try {
      await profileService.deleteProfile(profileId);
      await loadProfiles(); // 목록 새로고침
      alert("프로필이 삭제되었습니다.");
    } catch (error) {
      console.error("프로필 삭제 오류:", error);
      alert("프로필 삭제 중 오류가 발생했습니다.");
    }
  };

  // 프로필 복원
  const handleRestoreProfile = async (profileId, profileName) => {
    if (!confirm(`"${profileName}" 프로필을 복원하시겠습니까?`)) {
      return;
    }

    try {
      await profileService.restoreProfile(profileId);
      await loadProfiles(); // 목록 새로고침
      alert("프로필이 복원되었습니다.");
    } catch (error) {
      console.error("프로필 복원 오류:", error);
      alert("프로필 복원 중 오류가 발생했습니다.");
    }
  };

  // 프로필 완전 삭제
  const handlePermanentDeleteProfile = async (profileId, profileName) => {
    if (
      !confirm(
        `"${profileName}" 프로필을 완전히 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다!`
      )
    ) {
      return;
    }

    try {
      await profileService.permanentDeleteProfile(profileId);
      await loadProfiles(); // 목록 새로고침
      alert("프로필이 완전히 삭제되었습니다.");
    } catch (error) {
      console.error("프로필 완전 삭제 오류:", error);
      alert("프로필 완전 삭제 중 오류가 발생했습니다.");
    }
  };

  // 한국 나이 계산 (이미 calculateKoreanAge 함수를 import했으므로 제거)

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
        <p className={styles.subtitle}>재무 상담사용 내담자 관리 시스템</p>
        <div className={styles.headerActions}>
          <button
            className={styles.createButton}
            onClick={() => navigate("/create")}
          >
            + 새 프로필 추가
          </button>
          {deletedProfiles.length > 0 && (
            <button
              className={`${styles.toggleButton} ${
                showDeleted ? styles.active : ""
              }`}
              onClick={() => setShowDeleted(!showDeleted)}
            >
              {showDeleted
                ? "활성 프로필 보기"
                : `삭제된 프로필 (${deletedProfiles.length})`}
            </button>
          )}
        </div>
      </div>

      <div className={styles.profileGrid}>
        {showDeleted ? (
          // 삭제된 프로필 섹션
          deletedProfiles.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>삭제된 프로필이 없습니다</h3>
            </div>
          ) : (
            deletedProfiles.map((profile) => (
              <div
                key={profile.id}
                className={`${styles.profileCard} ${styles.deletedCard}`}
              >
                <div className={styles.profileInfo}>
                  <h3 className={styles.profileName}>{profile.name}</h3>
                  <div className={styles.deletedBadge}>삭제됨</div>
                  <div className={styles.profileDetails}>
                    <div className={styles.detailItem}>
                      <span className={styles.label}>현재 나이:</span>
                      <span className={styles.value}>
                        {profile.currentKoreanAge ||
                          calculateKoreanAge(profile.birthYear)}
                        세
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.label}>삭제일:</span>
                      <span className={styles.value}>
                        {profile.deletedAt
                          ? new Date(profile.deletedAt).toLocaleDateString()
                          : "알 수 없음"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={styles.profileActions}>
                  <button
                    className={styles.restoreButton}
                    onClick={() =>
                      handleRestoreProfile(profile.id, profile.name)
                    }
                  >
                    복원
                  </button>
                  <button
                    className={styles.permanentDeleteButton}
                    onClick={() =>
                      handlePermanentDeleteProfile(profile.id, profile.name)
                    }
                  >
                    완전 삭제
                  </button>
                </div>
              </div>
            ))
          )
        ) : // 활성 프로필 섹션
        profiles.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>등록된 프로필이 없습니다</h3>
            <p>새로운 내담자 프로필을 추가해보세요.</p>
          </div>
        ) : (
          profiles.map((profile) => (
            <div key={profile.id} className={styles.profileCard}>
              <div className={styles.profileInfo}>
                <h3 className={styles.profileName}>{profile.name}</h3>
                <div className={styles.profileDetails}>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>현재 나이:</span>
                    <span className={styles.value}>
                      {profile.currentKoreanAge ||
                        calculateKoreanAge(profile.birthYear)}
                      세
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>은퇴 나이:</span>
                    <span className={styles.value}>
                      {profile.retirementAge}세 ({profile.retirementYear}년)
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>목표 자산:</span>
                    <span className={styles.value}>
                      {profile.targetAssets?.toLocaleString() ||
                        profile.targetAmount?.toLocaleString() ||
                        0}
                      만원
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>가구 구성:</span>
                    <span className={styles.value}>
                      {profile.familyMembers
                        ? profile.familyMembers.length + 1
                        : 1}
                      명
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.profileActions}>
                <button
                  className={styles.selectButton}
                  onClick={() => navigate(`/dashboard/${profile.id}`)}
                >
                  상세 보기
                </button>
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDeleteProfile(profile.id, profile.name)}
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ProfileListPage;
