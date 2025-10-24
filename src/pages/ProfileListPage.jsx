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
      alert("프로필과 모든 관련 데이터가 완전히 삭제되었습니다.");
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
        <p className={styles.subtitle}>재무 상담사용 내담자 관리 시스템</p>
        <div className={styles.headerActions}>
          <button
            className={styles.createButton}
            onClick={() => navigate("/consult/create")}
          >
            + 새 프로필 추가
          </button>
        </div>
      </div>

      <div className={styles.profileGrid}>
        {profiles.length === 0 ? (
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
                      {calculateKoreanAge(profile.birthYear)}세
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>은퇴 나이:</span>
                    <span className={styles.value}>
                      {profile.retirementAge}세 (
                      {profile.birthYear + profile.retirementAge}년)
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>목표 자산:</span>
                    <span className={styles.value}>
                      {formatAmount(
                        profile.targetAssets || profile.targetAmount || 0
                      )}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>가구 구성:</span>
                    <span className={styles.value}>
                      {(() => {
                        let count = 1; // 본인
                        if (profile.hasSpouse) count += 1; // 배우자
                        if (profile.familyMembers)
                          count += profile.familyMembers.length; // 기타 가구 구성원
                        return count;
                      })()}
                      명
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.profileActions}>
                <button
                  className={styles.selectButton}
                  onClick={() => navigate(`/consult/dashboard/${profile.id}`)}
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
