// 프로필 관리/선택 페이지
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { profileService } from "../services/firestoreService.js";
import { calculateAge } from "../utils/date.js";
import AddProfileModal from "../components/AddProfileModal.jsx";
import styles from "./ProfileListPage.module.css";

export default function ProfileListPage() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 프로필 목록 실시간 구독
  useEffect(() => {
    const unsubscribe = profileService.subscribeToProfiles((profilesData) => {
      setProfiles(profilesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 프로필 추가 핸들러
  const handleAddProfile = async (profileData) => {
    try {
      setError(null);
      const profileId = await profileService.createProfile(profileData);

      // 프로필 추가 후 해당 프로필의 대시보드로 이동
      navigate(`/dashboard/${profileId}`);
    } catch (error) {
      console.error("프로필 추가 오류:", error);
      setError("프로필 추가에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // 프로필 수정 핸들러
  const handleEditProfile = async (profileData) => {
    try {
      setError(null);
      await profileService.updateProfile(editingProfile.id, profileData);
      setEditingProfile(null);
    } catch (error) {
      console.error("프로필 수정 오류:", error);
      setError("프로필 수정에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // 프로필 수정 시작
  const handleStartEdit = (profile) => {
    setEditingProfile(profile);
  };

  // 프로필 삭제 핸들러
  const handleDeleteProfile = async (profileId, profileName) => {
    if (window.confirm(`"${profileName}" 프로필을 삭제하시겠습니까?`)) {
      try {
        setError(null);
        await profileService.deleteProfile(profileId);
      } catch (error) {
        console.error("프로필 삭제 오류:", error);
        setError("프로필 삭제에 실패했습니다. 다시 시도해주세요.");
      }
    }
  };

  // 프로필 카드 클릭 핸들러
  const handleProfileClick = (profileId) => {
    navigate(`/dashboard/${profileId}`);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>프로필을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>재무 상담 대시보드</h1>
        <button
          className={styles.addButton}
          onClick={() => setIsModalOpen(true)}
          aria-label="프로필 추가"
        >
          + 프로필 추가
        </button>
      </header>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <main className={styles.main}>
        {profiles.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>아직 프로필이 없습니다</h2>
            <p>새로운 프로필을 추가하여 재무 상담을 시작해보세요.</p>
            <button
              className={styles.emptyAddButton}
              onClick={() => setIsModalOpen(true)}
            >
              첫 프로필 추가하기
            </button>
          </div>
        ) : (
          <div className={styles.profileGrid}>
            {profiles.map((profile) => {
              const currentAge = calculateAge(profile.birthDate);
              return (
                <div
                  key={profile.id}
                  className={styles.profileCard}
                  onClick={() => handleProfileClick(profile.id)}
                >
                  <div className={styles.profileHeader}>
                    <h3 className={styles.profileName}>{profile.name}</h3>
                    <div className={styles.profileActions}>
                      <button
                        className={styles.editButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(profile);
                        }}
                        aria-label={`${profile.name} 프로필 수정`}
                        title="수정"
                      >
                        ✏️
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProfile(profile.id, profile.name);
                        }}
                        aria-label={`${profile.name} 프로필 삭제`}
                        title="삭제"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div className={styles.profileInfo}>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>현재 나이:</span>
                      <span className={styles.value}>{currentAge}세</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>희망 은퇴 나이:</span>
                      <span className={styles.value}>
                        {profile.retirementAge}세
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>은퇴까지:</span>
                      <span className={styles.value}>
                        {profile.retirementAge - currentAge}년
                      </span>
                    </div>
                    {profile.retirementGoal > 0 && (
                      <div className={styles.infoItem}>
                        <span className={styles.label}>은퇴 목표:</span>
                        <span className={styles.value}>
                          {new Intl.NumberFormat("ko-KR").format(
                            profile.retirementGoal
                          )}
                          원
                        </span>
                      </div>
                    )}
                    <div className={styles.infoItem}>
                      <span className={styles.label}>가계 구성원:</span>
                      <span className={styles.value}>
                        {profile.householdSize || 1}명
                        {profile.hasSpouse && (
                          <span className={styles.spouseIndicator}>
                            {" "}
                            (배우자 포함)
                          </span>
                        )}
                      </span>
                    </div>
                    {profile.householdMembers &&
                      profile.householdMembers.length > 0 && (
                        <div className={styles.householdMembers}>
                          <span className={styles.label}>구성원:</span>
                          <div className={styles.memberList}>
                            {profile.householdMembers.map((member, index) => (
                              <span
                                key={member.id || index}
                                className={styles.memberTag}
                              >
                                {member.name} ({member.relationship})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                  <div className={styles.profileFooter}>
                    <span className={styles.clickHint}>
                      클릭하여 대시보드 열기
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <AddProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddProfile}
      />

      {editingProfile && (
        <AddProfileModal
          isOpen={!!editingProfile}
          onClose={() => setEditingProfile(null)}
          onAdd={handleEditProfile}
          editingProfile={editingProfile}
          isEdit={true}
        />
      )}
    </div>
  );
}
