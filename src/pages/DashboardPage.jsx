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
  calculateYearlyCashflow,
  calculateYearlyAssets,
  calculateYearlyAssetBreakdown,
  createDefaultIncomes,
  updateWageGrowthRate,
  updateBusinessGrowthRate,
  updateRentalGrowthRate,
  updateInflationRate,
  updateDefaultReturnRate,
  getWageGrowthRate,
  getBusinessGrowthRate,
  getRentalGrowthRate,
  getInflationRate,
  getDefaultReturnRate,
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
  const [simulationCache, setSimulationCache] = useState(null);
  const [lastDataHash, setLastDataHash] = useState(null);
  
  // 설정값 상태
  const [settings, setSettings] = useState({
    wageGrowthRate: getWageGrowthRate(),
    businessGrowthRate: getBusinessGrowthRate(),
    rentalGrowthRate: getRentalGrowthRate(),
    inflationRate: getInflationRate(),
    defaultReturnRate: getDefaultReturnRate(),
  });

  // 데이터 해시 계산 함수 (데이터 변경 감지용)
  const calculateDataHash = (profile, data) => {
    if (!profile || !data) return null;
    
    const dataString = JSON.stringify({
      profile: {
        birthDate: profile.birthDate,
        retirementAge: profile.retirementAge,
      },
      data: {
        incomes: data.incomes || [],
        assets: data.assets || [],
        debts: data.debts || [],
        expenses: data.expenses || [],
        pensions: data.pensions || [],
      }
    });
    
    // 간단한 해시 함수
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit 정수로 변환
    }
    return hash.toString();
  };

  // 시뮬레이션 계산 함수
  const calculateSimulation = (profile, data) => {
    if (!profile || !data) return null;

    // 데이터가 비어있는지 확인
    const hasData =
      data &&
      ((data.incomes && data.incomes.length > 0) ||
        (data.assets && data.assets.length > 0) ||
        (data.debts && data.debts.length > 0) ||
        (data.expenses && data.expenses.length > 0) ||
        (data.pensions && data.pensions.length > 0));

    if (!hasData) {
      console.log("재무 데이터가 없어서 시뮬레이션 중단");
      return null;
    }

    // 새로운 효율적인 년별 계산 방식
    const currentYear = new Date().getFullYear();
    const birthDate = new Date(profile.birthDate);
    const retirementYear = birthDate.getFullYear() + profile.retirementAge;
    
    // 시뮬레이션 종료년도: 90세가 되는 년도
    const maxEndYear = birthDate.getFullYear() + 89; // 90세까지 (89 + 1 = 90)

    console.log("=== 시뮬레이션 시작 (년별 방식) ===");
    console.log("현재 년도:", currentYear);
    console.log("생년월일:", profile.birthDate);
    console.log("은퇴나이:", profile.retirementAge);
    console.log("은퇴년도:", retirementYear);
    console.log("시뮬레이션 종료년도 (90세):", maxEndYear);

    // 새로운 년별 계산 방식 사용
    const yearlyCashflow = calculateYearlyCashflow(data, currentYear, maxEndYear, profile.birthDate);
    console.log("년별 현금흐름 데이터:", yearlyCashflow);

    const yearlyAssets = calculateYearlyAssets(data, currentYear, maxEndYear, yearlyCashflow, profile.birthDate);
    console.log("년별 자산 데이터:", yearlyAssets);

    // 자산 세부 내역도 년별로 효율적으로 계산
    const assetBreakdown = calculateYearlyAssetBreakdown(data, currentYear, maxEndYear, profile.birthDate);
    console.log("년별 자산 세부 내역:", assetBreakdown);

    return {
      cashflow: formatYearlyChartData(yearlyCashflow, "cashflow"),
      assets: formatYearlyChartData(yearlyAssets, "assets"),
      assetBreakdown,
    };
  };

  // 데이터 변경 감지 및 시뮬레이션 업데이트
  useEffect(() => {
    if (!profile || !data) return;

    const currentDataHash = calculateDataHash(profile, data);
    
    // 데이터가 변경되었거나 캐시가 없는 경우에만 시뮬레이션 재계산
    if (currentDataHash !== lastDataHash) {
      console.log("데이터 변경 감지, 시뮬레이션 재계산");
      const simulationResult = calculateSimulation(profile, data);
      setSimulationCache(simulationResult);
      setLastDataHash(currentDataHash);
    }
  }, [profile, data, lastDataHash]);

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
        async (items) => {
          // 수입 데이터가 비어있고 프로필이 있으면 기본 수입 항목들 추가
          if (category === "incomes" && items.length === 0 && profile) {
            try {
              const defaultIncomes = createDefaultIncomes(profile);
              for (const income of defaultIncomes) {
                await dataItemService.createItem(profileId, "incomes", income);
              }
              console.log("기본 수입 항목들 추가됨:", defaultIncomes);
            } catch (error) {
              console.error("기본 수입 항목 추가 오류:", error);
            }
          }
          
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
  }, [profileId, profile]);

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
      // 캐시 무효화 (다음 렌더링에서 시뮬레이션 재계산)
      setLastDataHash(null);
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
      // 캐시 무효화 (다음 렌더링에서 시뮬레이션 재계산)
      setLastDataHash(null);
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
        // 캐시 무효화 (다음 렌더링에서 시뮬레이션 재계산)
        setLastDataHash(null);
      } catch (error) {
        console.error("데이터 삭제 오류:", error);
        setError("데이터 삭제에 실패했습니다. 다시 시도해주세요.");
      }
    }
  };

  // 시뮬레이션 데이터 (캐시된 결과 사용)
  const simulationData = simulationCache;

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
                  만원
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
          
          {/* 인라인 설정 패널 */}
          <div className={styles.inlineSettings}>
            <h4>비율 설정</h4>
            <div className={styles.settingsRow}>
              <div className={styles.settingField}>
                <label>임금상승률</label>
                <input
                  type="number"
                  value={settings.wageGrowthRate}
                  onChange={(e) => setSettings(prev => ({...prev, wageGrowthRate: parseFloat(e.target.value)}))}
                  step="0.1"
                  min="0"
                  max="20"
                />
                <span>%</span>
              </div>
              
              <div className={styles.settingField}>
                <label>사업소득상승률</label>
                <input
                  type="number"
                  value={settings.businessGrowthRate}
                  onChange={(e) => setSettings(prev => ({...prev, businessGrowthRate: parseFloat(e.target.value)}))}
                  step="0.1"
                  min="0"
                  max="20"
                />
                <span>%</span>
              </div>
              
              <div className={styles.settingField}>
                <label>임대소득상승률</label>
                <input
                  type="number"
                  value={settings.rentalGrowthRate}
                  onChange={(e) => setSettings(prev => ({...prev, rentalGrowthRate: parseFloat(e.target.value)}))}
                  step="0.1"
                  min="0"
                  max="20"
                />
                <span>%</span>
              </div>
              
              <div className={styles.settingField}>
                <label>물가상승률</label>
                <input
                  type="number"
                  value={settings.inflationRate}
                  onChange={(e) => setSettings(prev => ({...prev, inflationRate: parseFloat(e.target.value)}))}
                  step="0.1"
                  min="0"
                  max="20"
                />
                <span>%</span>
              </div>
              
              <div className={styles.settingField}>
                <label>기본 수익률</label>
                <input
                  type="number"
                  value={settings.defaultReturnRate}
                  onChange={(e) => setSettings(prev => ({...prev, defaultReturnRate: parseFloat(e.target.value)}))}
                  step="0.1"
                  min="0"
                  max="20"
                />
                <span>%</span>
              </div>
              
              <button 
                className={styles.applyButton}
                onClick={() => {
                  updateWageGrowthRate(settings.wageGrowthRate);
                  updateBusinessGrowthRate(settings.businessGrowthRate);
                  updateRentalGrowthRate(settings.rentalGrowthRate);
                  updateInflationRate(settings.inflationRate);
                  updateDefaultReturnRate(settings.defaultReturnRate);
                  setLastDataHash(null);
                }}
              >
                적용하기
              </button>
            </div>
          </div>
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
              <CashflowChart 
                data={simulationData?.cashflow || []} 
                profile={profile}
              />
            </div>

            <div className={styles.chartContainer}>
              <h2 className={styles.chartTitle}>자산 시뮬레이션</h2>
              <AssetProjectionChart
                data={simulationData?.assets || []}
                assetBreakdown={simulationData?.assetBreakdown || {}}
                profile={profile}
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
