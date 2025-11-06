import React from "react";
import { calculateKoreanAge } from "../../utils/koreanAge";
import styles from "./ProfileSummary.module.css";

/**
 * 프로필 상단 요약 정보 컴포넌트
 * 가족 구성원 정보를 표시합니다.
 */
function ProfileSummary({ profileData }) {
  if (!profileData) {
    return null;
  }

  const { hasSpouse, spouseName, spouseBirthYear, familyMembers } = profileData;

  return (
    <div className={styles.profileSummary}>
      {/* 배우자 정보 */}
      {hasSpouse && spouseName && (
        <div className={styles.familySection}>
          <h3 className={styles.sectionTitle}>배우자</h3>
          <div className={styles.memberItem}>
            <span className={styles.memberName}>{spouseName}</span>
            {spouseBirthYear && (
              <span className={styles.memberDetails}>
                ({spouseBirthYear}년생, 현재 {calculateKoreanAge(spouseBirthYear)}세)
              </span>
            )}
          </div>
        </div>
      )}

      {/* 가족 구성원 정보 */}
      {familyMembers && familyMembers.length > 0 && (
        <div className={styles.familySection}>
          <h3 className={styles.sectionTitle}>가족 구성원</h3>
          <div className={styles.membersList}>
            {familyMembers.map((member, index) => {
              // 자녀인 경우 "자녀 (딸, 10세)" 형식으로 표시
              const isChild = member.relationship === "자녀";
              const currentAge = calculateKoreanAge(member.birthYear);
              
              if (isChild && member.gender) {
                // 자녀 + 성별 + 나이 표시
                return (
                  <div key={index} className={styles.memberItem}>
                    <span className={styles.memberName}>
                      {member.name}
                    </span>
                    <span className={styles.memberDetails}>
                      (자녀, {member.gender}, {currentAge}세)
                    </span>
                  </div>
                );
              } else {
                // 기타 가족 구성원
                return (
                  <div key={index} className={styles.memberItem}>
                    <span className={styles.memberName}>
                      {member.name}
                    </span>
                    <span className={styles.memberDetails}>
                      ({member.relationship || member.relation},{" "}
                      {member.birthYear}년생, 현재 {currentAge}세)
                    </span>
                  </div>
                );
              }
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileSummary;
