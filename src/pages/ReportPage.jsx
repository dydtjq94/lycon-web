import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { profileService } from "../services/firestoreService";
import { simulationService } from "../services/simulationService";
import {
  extractAIAnalysisData,
  calculateCashflowSimulation,
  calculateAssetSimulation,
} from "../utils/cashflowSimulator";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../libs/firebase";
import CoverPage from "../components/report/CoverPage";
import TableOfContentsPage from "../components/report/TableOfContentsPage";
import SectionOverviewPage from "../components/report/SectionOverviewPage";
import GoalVerificationPage from "../components/report/GoalVerificationPage";
import AssetReadinessPage from "../components/report/AssetReadinessPage";
import CashflowReadinessPage from "../components/report/CashflowReadinessPage";
import Section2OverviewPage from "../components/report/Section2OverviewPage";
import AssetOverviewPage from "../components/report/AssetOverviewPage";
import styles from "./ReportPage.module.css";

/**
 * 상담 보고서 메인 페이지
 * 프로필별로 사전, Basic, Standard, Premium 보고서를 표시
 *
 * URL: /consult/report/:profileId?type=basic
 */
function ReportPage() {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [simulationData, setSimulationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState("basic"); // 기본값: basic
  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지 번호

  // 전체 페이지 수 (표지 + 목차 + 섹션1 개요 + 목표 확인 + 자산 준비율 + 현금흐름 준비율 + 섹션2 개요)
  const totalPages = 8;

  useEffect(() => {
    // URL 쿼리 파라미터에서 보고서 타입 읽기
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type") || "basic";
    setReportType(type);

    // location.state에서 시뮬레이션 데이터 가져오기
    if (location.state?.simulationData) {
      setSimulationData(location.state.simulationData);
    }
  }, [location]);

  useEffect(() => {
    loadProfileData();
  }, [profileId]);

  // 방향키로 페이지 네비게이션
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "ArrowLeft") {
        setCurrentPage((prev) => Math.max(1, prev - 1));
      } else if (event.key === "ArrowRight") {
        setCurrentPage((prev) => Math.min(totalPages, prev + 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalPages]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const profileData = await profileService.getProfile(profileId);

      if (!profileData) {
        alert("프로필을 찾을 수 없습니다.");
        navigate("/consult");
        return;
      }

      setProfile(profileData);

      // 시뮬레이션 데이터가 없으면 실행
      if (!simulationData) {
        await loadSimulationData(profileId, profileData);
      }
    } catch (error) {
      console.error("프로필 로드 실패:", error);
      alert("프로필을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const loadSimulationData = async (profileId, profileData) => {
    try {
      // 기본 시뮬레이션 가져오기
      const defaultSimulation = await simulationService.getDefaultSimulation(
        profileId
      );

      if (!defaultSimulation) {
        console.warn("기본 시뮬레이션이 없습니다.");
        return;
      }

      const simulationId = defaultSimulation.id;

      // 모든 재무 데이터 불러오기
      const [incomes, expenses, savings, pensions, realEstates, assets, debts] =
        await Promise.all([
          getDocs(
            collection(
              db,
              "profiles",
              profileId,
              "simulations",
              simulationId,
              "incomes"
            )
          ),
          getDocs(
            collection(
              db,
              "profiles",
              profileId,
              "simulations",
              simulationId,
              "expenses"
            )
          ),
          getDocs(
            collection(
              db,
              "profiles",
              profileId,
              "simulations",
              simulationId,
              "savings"
            )
          ),
          getDocs(
            collection(
              db,
              "profiles",
              profileId,
              "simulations",
              simulationId,
              "pensions"
            )
          ),
          getDocs(
            collection(
              db,
              "profiles",
              profileId,
              "simulations",
              simulationId,
              "realEstates"
            )
          ),
          getDocs(
            collection(
              db,
              "profiles",
              profileId,
              "simulations",
              simulationId,
              "assets"
            )
          ),
          getDocs(
            collection(
              db,
              "profiles",
              profileId,
              "simulations",
              simulationId,
              "debts"
            )
          ),
        ]);

      // Firestore 데이터를 배열로 변환
      const incomesData = incomes.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const expensesData = expenses.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const savingsData = savings.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const pensionsData = pensions.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const realEstatesData = realEstates.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const assetsData = assets.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const debtsData = debts.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 전체 cashflow 계산 (20년 제한 없이)
      const fullCashflow = calculateCashflowSimulation(
        profileData,
        incomesData,
        expensesData,
        savingsData,
        pensionsData,
        realEstatesData,
        assetsData,
        debtsData
      );

      const fullAssets = calculateAssetSimulation(
        profileData,
        incomesData,
        expensesData,
        savingsData,
        pensionsData,
        realEstatesData,
        assetsData,
        fullCashflow,
        debtsData
      );

      // AI 분석 데이터 생성 (전체 기간 데이터 포함)
      const aiData = extractAIAnalysisData(
        profileData,
        incomesData,
        expensesData,
        savingsData,
        pensionsData,
        realEstatesData,
        assetsData,
        debtsData
      );

      // 전체 cashflow와 assets로 덮어쓰기
      aiData.simulation.cashflow = fullCashflow;
      // detailedData를 사용하여 assetItems, debtItems 접근 가능하도록
      aiData.simulation.assets = fullAssets.detailedData || fullAssets.data || fullAssets;

      setSimulationData(aiData);
    } catch (error) {
      console.error("시뮬레이션 데이터 로드 실패:", error);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>보고서를 불러오는 중...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.errorContainer}>
        <p>프로필 정보를 찾을 수 없습니다.</p>
        <button onClick={() => navigate("/consult")}>목록으로 돌아가기</button>
      </div>
    );
  }

  // 현재 페이지 렌더링
  const renderCurrentPage = () => {
    // 프로필에서 재무 데이터 추출
    const financialData = {
      totalAssets: profile?.currentCash || 0,
      annualIncome: profile?.currentSalary
        ? (profile.currentSalary * 12 * 10000)
        : 0, // 월급 → 연봉 (만원 단위)
      annualExpense: profile?.currentLivingExpenses
        ? (profile.currentLivingExpenses * 12 * 10000)
        : 0, // 월 생활비 → 연간 (만원 단위)
      hasIncomeData: !!profile?.currentSalary,
      hasAssetData: !!profile?.currentCash,
      hasPensionData: false,
      lifeEvents: [], // AI가 예측할 것
      preRetirementExpense: profile?.currentLivingExpenses
        ? (profile.currentLivingExpenses * 12 * 10000)
        : 0,
      debtRepaymentPlan: null,
      realEstateStrategy: null,
      realEstates: [], // 실제로는 Firestore에서 가져와야 함
      debts: [], // 실제로는 Firestore에서 가져와야 함
    };

    switch (currentPage) {
      case 1:
        return <CoverPage profile={profile} reportType={reportType} />;
      case 2:
        return <TableOfContentsPage />;
      case 3:
        return <SectionOverviewPage />;
      case 4:
        return (
          <GoalVerificationPage
            profile={profile}
            financialData={financialData}
            simulationData={simulationData}
          />
        );
      case 5:
        return (
          <AssetReadinessPage profile={profile} simulationData={simulationData} />
        );
      case 6:
        return (
          <CashflowReadinessPage profile={profile} simulationData={simulationData} />
        );
      case 7:
        return <Section2OverviewPage />;
      case 8:
        return (
          <AssetOverviewPage profile={profile} simulationData={simulationData} />
        );
      default:
        return <CoverPage profile={profile} reportType={reportType} />;
    }
  };

  return (
    <div className={styles.reportContainer}>
      {/* 현재 페이지만 표시 */}
      {renderCurrentPage()}

      {/* 페이지 네비게이션 */}
      <div className={styles.pageNavigation}>
        <button
          className={styles.navButton}
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        <div className={styles.pageInfo}>
          <span className={styles.currentPage}>{currentPage}</span>
          <span className={styles.pageSeparator}>/</span>
          <span className={styles.totalPages}>{totalPages}</span>
        </div>
        <button
          className={styles.navButton}
          onClick={() =>
            setCurrentPage((prev) => Math.min(totalPages, prev + 1))
          }
          disabled={currentPage === totalPages}
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  );
}

export default ReportPage;
