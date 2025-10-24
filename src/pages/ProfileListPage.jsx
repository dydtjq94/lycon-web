import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { profileService } from "../services/firestoreService";
import { calculateKoreanAge } from "../utils/koreanAge";
import { formatAmount } from "../utils/format";
import styles from "./ProfileListPage.module.css";

/**
 * 프로필 목록 페이지
 * 재무 상담사가 여러 내담자 프로필을 관리할 수 있습니다.
 */
function ProfileListPage() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 프로필 목록 로드
  useEffect(() => {
    loadProfiles();
  }, []);

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

  // 프로필 완전 삭제 (모든 관련 데이터 포함)
  const handleDeleteProfile = async (profileId, profileName) => {
    if (
      !confirm(
        `"${profileName}" 프로필을 완전히 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 모든 관련 데이터(수입, 지출, 저축, 연금, 부동산, 자산, 부채)가 함께 삭제됩니다.`
      )
    ) {
      return;
    }

    try {
      await profileService.deleteProfileWithAllData(profileId);
      await loadProfiles(); // 목록 새로고침
    } catch (error) {
      console.error("프로필 삭제 오류:", error);
      alert("프로필 삭제 중 오류가 발생했습니다.");
    }
  };

  // 만 나이 계산 (calculateKoreanAge 함수 사용)

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
        <button
          className={styles.createButton}
          onClick={() => navigate("/consult/create")}
        >
          + 새 프로필
        </button>
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
    </div>
  );
}

export default ProfileListPage;
