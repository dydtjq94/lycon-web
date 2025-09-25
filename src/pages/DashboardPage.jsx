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
  formatChartData,
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
    const categories = ["incomes", "assets", "debts", "expenses", "pensions"];
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
        selectedCategory,
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
        await dataItemService.deleteItem(profileId, selectedCategory, itemId);
      } catch (error) {
        console.error("데이터 삭제 오류:", error);
        setError("데이터 삭제에 실패했습니다. 다시 시도해주세요.");
      }
    }
  };

  // 시뮬레이션 데이터 계산
  const simulationData = React.useMemo(() => {
    if (!profile) return null;

    const today = new Date().toISOString().split("T")[0];
    const retirementDate = new Date(profile.birthDate);
    retirementDate.setFullYear(
      retirementDate.getFullYear() + profile.retirementAge
    );
    const retirementDateStr = retirementDate.toISOString().split("T")[0];

    // 은퇴 후 30년까지 시뮬레이션
    const endDate = new Date(retirementDate);
    endDate.setFullYear(endDate.getFullYear() + 30);
    const endDateStr = endDate.toISOString().split("T")[0];

    const timeline = generateMonthlyTimeline(today, endDateStr);
    const cashflow = calculateCashflow(data, timeline);
    const assets = calculateAssets(data, timeline, cashflow);
    const assetBreakdown = calculateAssetBreakdown(data, timeline);

    return {
      timeline,
      cashflow: formatYearlyChartData(cashflow, "cashflow"),
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
      <header className={styles.header}>
        <div className={styles.profileInfo}>
          <h1 className={styles.profileName}>{profile.name}</h1>
          <div className={styles.profileDetails}>
            <span>현재 나이: {currentAge}세</span>
            <span>희망 은퇴 나이: {profile.retirementAge}세</span>
            <span>은퇴까지: {yearsToRetirement}년</span>
          </div>
        </div>
        <button className={styles.backButton} onClick={() => navigate("/")}>
          ← 프로필 목록
        </button>
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
