// 데이터 목록 컴포넌트 (공통)
import React, { useState } from "react";
import { formatDate } from "../utils/date.js";
import styles from "./DataList.module.css";

export default function DataList({ items, category, onEdit, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  // 편집 모드 시작
  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditData({
      title: item.title,
      amount: item.amount,
      startDate: item.startDate,
      endDate: item.endDate || "",
      frequency: item.frequency,
      note: item.note || "",
      rate: item.rate || "",
    });
  };

  // 편집 취소
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  // 편집 저장
  const handleSaveEdit = () => {
    if (editData.title && editData.amount && editData.startDate) {
      onEdit(editingId, editData);
      setEditingId(null);
      setEditData({});
    }
  };

  // 편집 데이터 변경
  const handleEditChange = (field, value) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 통화 포맷팅
  const formatAmount = (amount) => {
    if (amount === null || amount === undefined) return "0원";
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // 빈도 한글 변환
  const getFrequencyText = (frequency) => {
    const frequencyMap = {
      daily: "일일",
      monthly: "월",
      quarterly: "분기",
      yearly: "년",
      once: "일회성",
    };
    return frequencyMap[frequency] || frequency;
  };

  if (items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>아직 {getCategoryName(category)} 데이터가 없습니다.</p>
        <p>새로운 항목을 추가해보세요.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {items.map((item) => (
        <div key={item.id} className={styles.item}>
          {editingId === item.id ? (
            // 편집 모드
            <div className={styles.editForm}>
              <div className={styles.editField}>
                <label>제목:</label>
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => handleEditChange("title", e.target.value)}
                  className={styles.editInput}
                />
              </div>
              <div className={styles.editField}>
                <label>금액:</label>
                <input
                  type="number"
                  value={editData.amount}
                  onChange={(e) =>
                    handleEditChange("amount", Number(e.target.value))
                  }
                  className={styles.editInput}
                />
              </div>
              <div className={styles.editField}>
                <label>시작일:</label>
                <input
                  type="date"
                  value={editData.startDate}
                  onChange={(e) =>
                    handleEditChange("startDate", e.target.value)
                  }
                  className={styles.editInput}
                />
              </div>
              <div className={styles.editField}>
                <label>종료일:</label>
                <input
                  type="date"
                  value={editData.endDate}
                  onChange={(e) => handleEditChange("endDate", e.target.value)}
                  className={styles.editInput}
                />
              </div>
              <div className={styles.editField}>
                <label>빈도:</label>
                <select
                  value={editData.frequency}
                  onChange={(e) =>
                    handleEditChange("frequency", e.target.value)
                  }
                  className={styles.editInput}
                >
                  <option value="daily">일일</option>
                  <option value="monthly">월</option>
                  <option value="quarterly">분기</option>
                  <option value="yearly">년</option>
                  <option value="once">일회성</option>
                </select>
              </div>
              {(category === "assets" || category === "debts") && (
                <div className={styles.editField}>
                  <label>수익률/이자율 (%/년):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editData.rate}
                    onChange={(e) =>
                      handleEditChange("rate", Number(e.target.value))
                    }
                    className={styles.editInput}
                    placeholder="예: 5.0"
                  />
                </div>
              )}
              <div className={styles.editField}>
                <label>메모:</label>
                <input
                  type="text"
                  value={editData.note}
                  onChange={(e) => handleEditChange("note", e.target.value)}
                  className={styles.editInput}
                  placeholder="선택사항"
                />
              </div>
              <div className={styles.editActions}>
                <button className={styles.saveButton} onClick={handleSaveEdit}>
                  저장
                </button>
                <button
                  className={styles.cancelButton}
                  onClick={handleCancelEdit}
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            // 보기 모드
            <div className={styles.itemContent}>
              <div className={styles.itemHeader}>
                <h4 className={styles.itemTitle}>{item.title}</h4>
                <div className={styles.itemActions}>
                  <button
                    className={styles.editButton}
                    onClick={() => handleStartEdit(item)}
                    aria-label="편집"
                  >
                    ✏️
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() => onDelete(item.id, item.title)}
                    aria-label="삭제"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className={styles.itemDetails}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>금액:</span>
                  <span className={styles.detailValue}>
                    {formatAmount(item.amount)}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>빈도:</span>
                  <span className={styles.detailValue}>
                    {getFrequencyText(item.frequency)}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>시작일:</span>
                  <span className={styles.detailValue}>
                    {formatDate(new Date(item.startDate))}
                  </span>
                </div>
                {item.endDate && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>종료일:</span>
                    <span className={styles.detailValue}>
                      {formatDate(new Date(item.endDate))}
                    </span>
                  </div>
                )}
                {item.rate && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>
                      {category === "assets" ? "수익률" : "이자율"}:
                    </span>
                    <span className={styles.detailValue}>{item.rate}%/년</span>
                  </div>
                )}
                {item.note && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>메모:</span>
                    <span className={styles.detailValue}>{item.note}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// 카테고리 한글명 반환
function getCategoryName(category) {
  const categoryMap = {
    incomes: "수입",
    assets: "자산",
    debts: "부채",
    expenses: "지출",
    pensions: "연금",
  };
  return categoryMap[category] || category;
}
