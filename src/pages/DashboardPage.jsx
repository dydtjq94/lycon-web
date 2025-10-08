// 대시보드 페이지 (프로필별)
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  profileService,
  dataItemService,
} from "../services/firestoreService.js";
import {
  calculateAge,
  generateMonthlyTimeline,
  formatDate,
} from "../utils/date.js";

import {
  calculateCashflow,
  calculateAssets,
  formatYearlyChartData,
  calculateAssetBreakdown,
} from "../utils/simulators.js";
import CashflowChart from "../components/CashflowChart.jsx";
import AssetProjectionChart from "../components/AssetProjectionChart.jsx";
import DataList from "../components/DataList.jsx";
import AddDataModal from "../components/AddDataModal.jsx";
import styles from "./DashboardPage.module.css";

export default function DashboardPage() {
  const { profileId } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [data, setData] = useState({
    incomes: [],
    assets: [],
    debts: [],
    expenses: [],
    pensions: [],
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("incomes"); // 기본값: 수입
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 프로필 데이터 로드
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const profileData = await profileService.getProfile(profileId);
        if (profileData) {
          setProfile(profileData);
        } else {
          setError("프로필을 찾을 수 없습니다.");
        }
      } catch (error) {
        console.error("프로필 로드 오류:", error);
        setError("프로필을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [profileId]);

  // 재무 데이터 실시간 구독
  useEffect(() => {
    if (!profileId) return;
    const categories = ["incomes", "expenses", "pensions", "assets", "debts"];
    const unsubscribes = [];
    categories.forEach((category) => {
      const unsubscribe = dataItemService.subscribeToItems(
        profileId,
        category,
        (items) => {
          setData((prev) => ({
            ...prev,
            [category]: items,
          }));
          setLoading(false);
        }
      );
      unsubscribes.push(unsubscribe);
    });
    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [profileId]);

  // 모달 열기 핸들러
  const handleOpenModal = (category) => {
    setModalCategory(category);
    setIsModalOpen(true);
  };

  // 카테고리 선택 핸들러
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalCategory("");
  };

  // 데이터 추가 핸들러
  const handleAddData = async (itemData) => {
    try {
      setError(null);
      await dataItemService.createItem(profileId, modalCategory, itemData);
      handleCloseModal();
    } catch (error) {
      console.error("데이터 추가 오류:", error);
      setError("데이터 추가에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // 데이터 수정 핸들러
  const handleUpdateData = async (itemId, updateData) => {
    try {
      setError(null);
      await dataItemService.updateItem(
        profileId,
        selectedCategory, // Use selectedCategory here
        itemId,
        updateData
      );
    } catch (error) {
      console.error("데이터 수정 오류:", error);
      setError("데이터 수정에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // 데이터 삭제 핸들러
  const handleDeleteData = async (itemId, itemTitle) => {
    if (window.confirm(`"${itemTitle}" 항목을 삭제하시겠습니까?`)) {
      try {
        setError(null);
        await dataItemService.deleteItem(profileId, selectedCategory, itemId); // Use selectedCategory here
      } catch (error) {
        console.error("데이터 삭제 오류:", error);
        setError("데이터 삭제에 실패했습니다. 다시 시도해주세요.");
      }
    }
  };

  // 시뮬레이션 데이터 계산
  const simulationData = React.useMemo(() => {
    console.log("=== 시뮬레이션 데이터 계산 시작 ===");
    console.log("profile:", profile);
    console.log("data:", data);

    if (!profile) {
      console.log("프로필이 없어서 시뮬레이션 중단");
      return null;
    }

    // 데이터가 비어있는지 확인
    const hasData =
      data &&
      ((data.incomes && data.incomes.length > 0) ||
        (data.assets && data.assets.length > 0) ||
        (data.debts && data.debts.length > 0) ||
        (data.expenses && data.expenses.length > 0) ||
        (data.pensions && data.pensions.length > 0));

    console.log("데이터 존재 여부:", hasData);
    console.log("incomes 길이:", data.incomes?.length || 0);
    console.log("assets 길이:", data.assets?.length || 0);
    console.log("debts 길이:", data.debts?.length || 0);
    console.log("expenses 길이:", data.expenses?.length || 0);
    console.log("pensions 길이:", data.pensions?.length || 0);

    if (!hasData) {
      console.log("재무 데이터가 없어서 시뮬레이션 중단");
      return null;
    }

    const today = new Date().toISOString().split("T")[0];

    // 은퇴일 계산 (안전하게)
    const birthDate = new Date(profile.birthDate);
    const retirementYear = birthDate.getFullYear() + profile.retirementAge;
    const retirementDate = new Date(
      retirementYear,
      birthDate.getMonth(),
      birthDate.getDate()
    );
    const retirementDateStr = retirementDate.toISOString().split("T")[0];

    // 시뮬레이션 종료일: 2100년까지 또는 은퇴 후 30년 중 더 짧은 것
    const maxEndYear = Math.min(retirementYear + 30, 2100);
    const endDate = new Date(maxEndYear, 11, 31); // 12월 31일
    const endDateStr = endDate.toISOString().split("T")[0];

    console.log("생년월일:", profile.birthDate);
    console.log("은퇴나이:", profile.retirementAge);
    console.log("은퇴년도:", retirementYear);
    console.log("은퇴일:", retirementDateStr);
    console.log("시뮬레이션 종료년도:", maxEndYear);
    console.log("시뮬레이션 종료일:", endDateStr);

    console.log("타임라인 기간:", today, "~", endDateStr);
    console.log("today 유효성:", /^\d{4}-\d{2}-\d{2}$/.test(today));
    console.log("endDateStr 유효성:", /^\d{4}-\d{2}-\d{2}$/.test(endDateStr));
    console.log("endDateStr 길이:", endDateStr.length);
    console.log("endDateStr 문자:", endDateStr);

    const timeline = generateMonthlyTimeline(today, endDateStr);
    console.log("생성된 타임라인 길이:", timeline.length);
    console.log("타임라인 샘플:", timeline.slice(0, 3));

    const cashflow = calculateCashflow(data, timeline);
    console.log("현금흐름 계산 결과 길이:", cashflow.length);
    console.log("현금흐름 샘플:", cashflow.slice(0, 3));

    const assets = calculateAssets(data, timeline, cashflow);
    const assetBreakdown = calculateAssetBreakdown(data, timeline);

    const yearlyCashflow = formatYearlyChartData(cashflow, "cashflow");
    console.log("년별 현금흐름 데이터:", yearlyCashflow);

    return {
      timeline,
      cashflow: yearlyCashflow,
      assets: formatYearlyChartData(assets, "assets"),
      assetBreakdown,
    };
  }, [profile, data]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>오류가 발생했습니다</h2>
          <p>{error}</p>
          <button className={styles.backButton} onClick={() => navigate("/")}>
            프로필 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>프로필을 찾을 수 없습니다</h2>
          <button className={styles.backButton} onClick={() => navigate("/")}>
            프로필 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const currentAge = calculateAge(profile.birthDate);
  const yearsToRetirement = profile.retirementAge - currentAge;

  return (
    <div className={styles.container}>
      <div className={styles.topNavigation}>
        <button
          className={styles.backToProfilesButton}
          onClick={() => navigate("/")}
        >
          ← 프로필 목록
        </button>
      </div>
      <header className={styles.header}>
        <div className={styles.profileInfo}>
          <h1 className={styles.profileName}>{profile.name}</h1>
          {profile.retirementGoal > 0 && (
            <div className={styles.retirementGoalSection}>
              <div className={styles.retirementGoal}>
                <span className={styles.goalLabel}>은퇴 목표</span>
                <span className={styles.goalAmount}>
                  {new Intl.NumberFormat("ko-KR").format(
                    profile.retirementGoal
                  )}
                  원
                </span>
              </div>
              {profile.goalDescription && (
                <div className={styles.goalDescription}>
                  {profile.goalDescription}
                </div>
              )}
            </div>
          )}
          <div className={styles.profileDetails}>
            <span>현재 나이: {currentAge}세</span>
            <span>희망 은퇴 나이: {profile.retirementAge}세</span>
            <span>은퇴까지: {yearsToRetirement}년</span>
            <span>
              가계 구성원: {profile.householdSize || 1}명
              {profile.hasSpouse && (
                <span className={styles.spouseIndicator}> (배우자 포함)</span>
              )}
            </span>
          </div>
          {profile.householdMembers && profile.householdMembers.length > 0 && (
            <div className={styles.householdInfo}>
              <h3>가계 구성원</h3>
              <div className={styles.memberList}>
                {profile.householdMembers.map((member, index) => (
                  <div key={member.id || index} className={styles.memberItem}>
                    <span className={styles.memberName}>{member.name}</span>
                    <span className={styles.memberRelationship}>
                      ({member.relationship})
                    </span>
                    <span className={styles.memberAge}>
                      {member.birthDate
                        ? calculateAge(member.birthDate) + "세"
                        : "나이 미상"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {error && (
        <div className={styles.errorBanner} role="alert">
          {error}
        </div>
      )}

      <main className={styles.main}>
        {/* 3단 분할 레이아웃 */}
        <div className={styles.layout}>
          {/* 왼쪽: 카테고리 버튼들 */}
          <div className={styles.categorySidebar}>
            <div className={styles.categoryButtons}>
              <button
                className={`${styles.categoryButton} ${
                  selectedCategory === "incomes" ? styles.active : ""
                }`}
                onClick={() => handleCategorySelect("incomes")}
              >
                💰 수입
              </button>
              <button
                className={`${styles.categoryButton} ${
                  selectedCategory === "expenses" ? styles.active : ""
                }`}
                onClick={() => handleCategorySelect("expenses")}
              >
                💸 지출
              </button>
              <button
                className={`${styles.categoryButton} ${
                  selectedCategory === "pensions" ? styles.active : ""
                }`}
                onClick={() => handleCategorySelect("pensions")}
              >
                🏛️ 연금
              </button>
              <button
                className={`${styles.categoryButton} ${
                  selectedCategory === "assets" ? styles.active : ""
                }`}
                onClick={() => handleCategorySelect("assets")}
              >
                🏦 자산
              </button>
              <button
                className={`${styles.categoryButton} ${
                  selectedCategory === "debts" ? styles.active : ""
                }`}
                onClick={() => handleCategorySelect("debts")}
              >
                💳 부채
              </button>
            </div>
          </div>

          {/* 가운데: 선택된 항목 리스트 */}
          <div className={styles.dataPanel}>
            <div className={styles.dataPanelHeader}>
              <h2 className={styles.dataPanelTitle}>
                {selectedCategory === "incomes" && "수입"}
                {selectedCategory === "assets" && "자산"}
                {selectedCategory === "debts" && "부채"}
                {selectedCategory === "expenses" && "지출"}
                {selectedCategory === "pensions" && "연금"}
              </h2>
              <button
                className={styles.addButton}
                onClick={() => handleOpenModal(selectedCategory)}
              >
                + 추가
              </button>
            </div>
            <div className={styles.dataListWrapper}>
              <DataList
                items={data[selectedCategory] || []}
                category={selectedCategory}
                onEdit={(itemId, updateData) =>
                  handleUpdateData(itemId, updateData)
                }
                onDelete={(itemId, itemTitle) =>
                  handleDeleteData(itemId, itemTitle)
                }
              />
            </div>
          </div>

          {/* 오른쪽: 차트들 */}
          <div className={styles.chartsPanel}>
            <div className={styles.chartContainer}>
              <h2 className={styles.chartTitle}>현금 흐름 시뮬레이션</h2>
              <CashflowChart data={simulationData?.cashflow || []} />
            </div>

            <div className={styles.chartContainer}>
              <h2 className={styles.chartTitle}>자산 시뮬레이션</h2>
              <AssetProjectionChart
                data={simulationData?.assets || []}
                assetBreakdown={simulationData?.assetBreakdown || {}}
              />
            </div>
          </div>
        </div>
      </main>

      <AddDataModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAdd={handleAddData}
        category={modalCategory}
      />
    </div>
  );
}
