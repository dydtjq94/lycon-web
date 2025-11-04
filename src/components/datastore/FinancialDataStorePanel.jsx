import React, { useState } from "react";
import styles from "./FinancialDataStorePanel.module.css";

/**
 * 재무 라이브러리 패널
 * 미리 정의된 재무 데이터 템플릿을 선택하여 추가할 수 있는 패널
 */
function FinancialDataStorePanel({ onAddItems, profileData }) {
  // 미리 정의된 재무 데이터 템플릿
  const dataTemplates = [
    // 소득 템플릿
    {
      category: "income",
      items: [
        {
          id: "income_salary",
          title: "월급여",
          frequency: "monthly",
          amount: 300,
          growthRate: 3.3,
          memo: "기본 급여",
          originalAmount: 300,
          originalFrequency: "monthly",
        },
        {
          id: "income_bonus",
          title: "상여금",
          frequency: "yearly",
          amount: 2000,
          growthRate: 3.3,
          memo: "연간 상여금",
          originalAmount: 2000,
          originalFrequency: "yearly",
        },
      ],
    },
    // 지출 템플릿
    {
      category: "expense",
      items: [
        {
          id: "expense_living",
          title: "생활비",
          frequency: "monthly",
          amount: 200,
          growthRate: 1.89,
          memo: "월 생활비",
          originalAmount: 200,
          originalFrequency: "monthly",
          isFixedToRetirementYear: false,
        },
        {
          id: "expense_insurance",
          title: "보험료",
          frequency: "monthly",
          amount: 50,
          growthRate: 1.89,
          memo: "월 보험료",
          originalAmount: 50,
          originalFrequency: "monthly",
          isFixedToRetirementYear: false,
        },
      ],
    },
    // 저축/투자 템플릿
    {
      category: "saving",
      items: [
        {
          id: "saving_retirement",
          title: "퇴직연금",
          frequency: "monthly",
          amount: 100,
          interestRate: 2.86 / 100, // 백분율을 소수로 변환
          yearlyGrowthRate: 1.89 / 100, // 백분율을 소수로 변환
          currentAmount: 5000,
          memo: "퇴직연금 적립",
          originalAmount: 100,
          originalFrequency: "monthly",
          isFixedToRetirementYear: false,
        },
      ],
    },
    // 연금 템플릿
    {
      category: "pension",
      items: [
        {
          id: "pension_national",
          title: "국민연금",
          type: "national",
          monthlyAmount: 150,
          inflationRate: 1.89,
          memo: "국민연금",
        },
      ],
    },
  ];

  const [selectedItems, setSelectedItems] = useState({});

  // 아이템 선택 토글
  const toggleItem = (category, itemId) => {
    setSelectedItems((prev) => {
      const categoryKey = `${category}_${itemId}`;
      return {
        ...prev,
        [categoryKey]: !prev[categoryKey],
      };
    });
  };

  // 선택된 아이템들 추가
  const handleAddSelected = () => {
    const itemsToAdd = [];
    Object.keys(selectedItems).forEach((key) => {
      if (selectedItems[key]) {
        const [category, itemId] = key.split("_");
        const template = dataTemplates.find((t) => t.category === category);
        if (template) {
          const item = template.items.find((i) => i.id === itemId);
          if (item) {
            itemsToAdd.push({ category, ...item });
          }
        }
      }
    });

    if (itemsToAdd.length > 0) {
      onAddItems(itemsToAdd);
      // 선택 초기화
      setSelectedItems({});
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>재무 라이브러리</h3>
        <p className={styles.description}>
          미리 준비된 재무 데이터를 선택하여 추가하세요
        </p>
      </div>

      <div className={styles.content}>
        {dataTemplates.map((template) => (
          <div key={template.category} className={styles.categorySection}>
            <h4 className={styles.categoryTitle}>
              {template.category === "income" && "소득"}
              {template.category === "expense" && "지출"}
              {template.category === "saving" && "저축/투자"}
              {template.category === "pension" && "연금"}
            </h4>
            <div className={styles.itemsList}>
              {template.items.map((item) => {
                const categoryKey = `${template.category}_${item.id}`;
                const isSelected = selectedItems[categoryKey] || false;

                return (
                  <label
                    key={item.id}
                    className={`${styles.itemRow} ${
                      isSelected ? styles.selected : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleItem(template.category, item.id)}
                      className={styles.checkbox}
                    />
                    <div className={styles.itemInfo}>
                      <span className={styles.itemTitle}>{item.title}</span>
                      {item.memo && (
                        <span className={styles.itemMemo}>{item.memo}</span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <button
          className={styles.addButton}
          onClick={handleAddSelected}
          disabled={Object.values(selectedItems).filter((v) => v).length === 0}
        >
          선택한 항목 추가 (
          {Object.values(selectedItems).filter((v) => v).length}개)
        </button>
      </div>
    </div>
  );
}

export default FinancialDataStorePanel;
