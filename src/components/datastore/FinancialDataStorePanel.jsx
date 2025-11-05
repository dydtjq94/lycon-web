import React, { useState, useEffect } from "react";
import { financialLibraryService } from "../../services/firestoreService";
import { calculateKoreanAge } from "../../utils/koreanAge";
import styles from "./FinancialDataStorePanel.module.css";

/**
 * 재무 라이브러리 패널
 * 가족 구성원별 재무 데이터 템플릿을 Firebase에서 불러와 관리하고 추가할 수 있는 패널
 * 
 * 구조:
 * - 상단: 가족 구성원 타입 탭 (본인/배우자/자녀/부모/공통)
 * - 왼쪽: 카테고리 필터 (전체/소득/지출/저축/연금/부동산/자산/부채)
 * - 메인: 템플릿 리스트 (체크박스로 선택)
 * - 하단: 선택한 항목 추가 버튼
 * - 관리자: 템플릿 관리 버튼
 */
function FinancialDataStorePanel({ onAddItems, profileData, onClose, isAdmin }) {
  const [templates, setTemplates] = useState([]); // 모든 템플릿
  const [loading, setLoading] = useState(true);
  const [selectedFamilyType, setSelectedFamilyType] = useState("common"); // 선택된 가족 구성원 타입
  const [selectedCategory, setSelectedCategory] = useState("all"); // 선택된 카테고리
  const [selectedItems, setSelectedItems] = useState({}); // 선택된 항목들
  const [isManageMode, setIsManageMode] = useState(false); // 관리자 모드

  // 가족 구성원 타입 목록
  const familyTypes = [
    { value: "common", label: "공통" },
    { value: "self", label: "본인" },
    { value: "spouse", label: "배우자" },
    { value: "child", label: "자녀" },
    { value: "parent", label: "부모" },
  ];

  // 카테고리 목록
  const categories = [
    { value: "all", label: "전체" },
    { value: "income", label: "소득" },
    { value: "expense", label: "지출" },
    { value: "saving", label: "저축/투자" },
    { value: "pension", label: "연금" },
    { value: "realEstate", label: "부동산" },
    { value: "asset", label: "자산" },
    { value: "debt", label: "부채" },
  ];

  // 템플릿 불러오기
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      
      // Firebase에서 템플릿 조회
      const allTemplates = await financialLibraryService.getTemplates();
      
      // 템플릿이 없으면 기본 템플릿 초기화
      if (allTemplates.length === 0) {
        await financialLibraryService.initializeDefaultTemplates();
        const newTemplates = await financialLibraryService.getTemplates();
        setTemplates(newTemplates);
      } else {
        setTemplates(allTemplates);
      }
    } catch (error) {
      console.error("템플릿 로딩 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  // 필터링된 템플릿 가져오기
  const getFilteredTemplates = () => {
    return templates.filter((template) => {
      // 가족 구성원 타입 필터
      if (template.familyMemberType !== selectedFamilyType) {
        return false;
      }

      // 카테고리 필터
      if (selectedCategory !== "all" && template.category !== selectedCategory) {
        return false;
      }

      return true;
    });
  };

  // 카테고리별로 템플릿 그룹화
  const groupTemplatesByCategory = () => {
    const filtered = getFilteredTemplates();
    const grouped = {};

    filtered.forEach((template) => {
      const category = template.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(template);
    });

    return grouped;
  };

  // 카테고리 이름 변환
  const getCategoryLabel = (category) => {
    const cat = categories.find((c) => c.value === category);
    return cat ? cat.label : category;
  };

  // 아이템 선택 토글
  const toggleItem = (templateId) => {
    setSelectedItems((prev) => ({
      ...prev,
      [templateId]: !prev[templateId],
    }));
  };

  // 선택된 아이템들을 프로필에 추가
  const handleAddSelected = () => {
    const currentYear = new Date().getFullYear();
    const itemsToAdd = [];

    Object.keys(selectedItems).forEach((templateId) => {
      if (selectedItems[templateId]) {
        const template = templates.find((t) => t.id === templateId);
        if (template) {
          // 템플릿 데이터를 기반으로 실제 재무 데이터 생성
          const { category, data, ageStart, ageEnd, familyMemberType } = template;

          // 나이 범위가 있는 경우 startYear/endYear 자동 계산
          let startYear = currentYear;
          let endYear = currentYear + 30;

          // 가족 구성원의 출생년도를 기반으로 계산
          if (ageStart !== null && ageEnd !== null) {
            if (familyMemberType === "self" && profileData.birthYear) {
              const currentAge = calculateKoreanAge(profileData.birthYear);
              startYear = currentYear + (ageStart - currentAge);
              endYear = currentYear + (ageEnd - currentAge);
            } else if (familyMemberType === "spouse" && profileData.spouseBirthYear) {
              const spouseAge = calculateKoreanAge(profileData.spouseBirthYear);
              startYear = currentYear + (ageStart - spouseAge);
              endYear = currentYear + (ageEnd - spouseAge);
            } else if (familyMemberType === "child" && profileData.familyMembers?.length > 0) {
              // 첫 번째 자녀 기준 (추후 개선 가능)
              const firstChild = profileData.familyMembers.find(m => m.relationship === "자녀");
              if (firstChild && firstChild.birthYear) {
                const childAge = calculateKoreanAge(firstChild.birthYear);
                startYear = currentYear + (ageStart - childAge);
                endYear = currentYear + (ageEnd - childAge);
              }
            }
          }

          itemsToAdd.push({
            category,
            title: template.title,
            ...data,
            startYear,
            endYear,
            memo: `${data.memo || ""} (재무 라이브러리에서 추가됨)`,
          });
        }
      }
    });

    if (itemsToAdd.length > 0) {
      onAddItems(itemsToAdd);
      // 선택 초기화
      setSelectedItems({});
    }
  };

  // 템플릿 삭제
  const handleDeleteTemplate = async (templateId) => {
    if (!confirm("이 템플릿을 삭제하시겠습니까?")) {
      return;
    }

    try {
      await financialLibraryService.deleteTemplate(templateId);
      await loadTemplates();
      alert("템플릿이 삭제되었습니다.");
    } catch (error) {
      console.error("템플릿 삭제 오류:", error);
      alert("템플릿 삭제 중 오류가 발생했습니다.");
    }
  };

  const groupedTemplates = groupTemplatesByCategory();
  const selectedCount = Object.values(selectedItems).filter((v) => v).length;

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>템플릿을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h3 className={styles.title}>재무 라이브러리</h3>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>
        <p className={styles.description}>
          가족 구성원별 재무 데이터 템플릿을 선택하여 추가하세요
        </p>
        
        {/* 관리자 모드 전환 */}
        {isAdmin && (
          <div className={styles.adminControls}>
            <button
              className={styles.manageModeButton}
              onClick={() => setIsManageMode(!isManageMode)}
            >
              {isManageMode ? "선택 모드" : "관리 모드"}
            </button>
          </div>
        )}
      </div>

      {/* 가족 구성원 타입 탭 */}
      <div className={styles.familyTypeTabs}>
        {familyTypes.map((type) => (
          <button
            key={type.value}
            className={`${styles.tab} ${
              selectedFamilyType === type.value ? styles.activeTab : ""
            }`}
            onClick={() => setSelectedFamilyType(type.value)}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* 카테고리 필터 */}
      <div className={styles.categoryFilters}>
        {categories.map((cat) => (
          <button
            key={cat.value}
            className={`${styles.categoryButton} ${
              selectedCategory === cat.value ? styles.activeCategoryButton : ""
            }`}
            onClick={() => setSelectedCategory(cat.value)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 템플릿 리스트 */}
      <div className={styles.content}>
        {Object.keys(groupedTemplates).length === 0 ? (
          <div className={styles.emptyState}>
            선택된 조건에 맞는 템플릿이 없습니다.
          </div>
        ) : (
          Object.keys(groupedTemplates).map((category) => (
            <div key={category} className={styles.categorySection}>
              <h4 className={styles.categoryTitle}>
                {getCategoryLabel(category)}
              </h4>
              <div className={styles.itemsList}>
                {groupedTemplates[category].map((template) => {
                  const isSelected = selectedItems[template.id] || false;

                  return (
                    <div
                      key={template.id}
                      className={`${styles.itemRow} ${
                        isSelected ? styles.selected : ""
                      }`}
                    >
                      {!isManageMode ? (
                        // 선택 모드
                        <label className={styles.itemLabel}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleItem(template.id)}
                            className={styles.checkbox}
                          />
                          <div className={styles.itemInfo}>
                            <span className={styles.itemTitle}>
                              {template.title}
                            </span>
                            <span className={styles.itemDetails}>
                              {template.ageStart !== null && template.ageEnd !== null
                                ? `${template.ageStart}~${template.ageEnd}세`
                                : "연령 제한 없음"}
                              {template.data.memo && ` • ${template.data.memo}`}
                            </span>
                            {template.autoApply && (
                              <span className={styles.autoApplyBadge}>
                                자동 적용
                              </span>
                            )}
                          </div>
                        </label>
                      ) : (
                        // 관리 모드
                        <div className={styles.manageRow}>
                          <div className={styles.itemInfo}>
                            <span className={styles.itemTitle}>
                              {template.title}
                            </span>
                            <span className={styles.itemDetails}>
                              {template.ageStart !== null && template.ageEnd !== null
                                ? `${template.ageStart}~${template.ageEnd}세`
                                : "연령 제한 없음"}
                              {template.data.memo && ` • ${template.data.memo}`}
                            </span>
                          </div>
                          <button
                            className={styles.deleteButton}
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 하단 버튼 */}
      {!isManageMode && (
        <div className={styles.footer}>
          <button
            className={styles.addButton}
            onClick={handleAddSelected}
            disabled={selectedCount === 0}
          >
            선택한 항목 추가 ({selectedCount}개)
          </button>
        </div>
      )}
    </div>
  );
}

export default FinancialDataStorePanel;
