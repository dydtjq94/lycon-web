import React, { useState, useEffect } from "react";
import { financialLibraryService } from "../../services/firestoreService";
import styles from "./TemplateManageModal.module.css";
import TemplateEditorModal from "./TemplateEditorModal";

/**
 * 템플릿 관리 모달
 * 모든 템플릿을 보여주고 편집/삭제할 수 있는 관리자 전용 모달
 */
function TemplateManageModal({ isOpen, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  // 카테고리 목록
  const categories = [
    { value: "income", label: "소득" },
    { value: "expense", label: "지출" },
  ];

  // 가족 구성원 타입 목록
  const familyTypes = [
    { value: "self", label: "본인" },
    { value: "spouse", label: "배우자" },
    { value: "son", label: "아들" },
    { value: "daughter", label: "딸" },
    { value: "father", label: "부" },
    { value: "mother", label: "모" },
  ];

  // 템플릿 불러오기
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const allTemplates = await financialLibraryService.getTemplates();
      setTemplates(allTemplates);
    } catch (error) {
      console.error("템플릿 로딩 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen && !isEditorModalOpen) {
        e.stopPropagation();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, isEditorModalOpen, onClose]);

  // 새 템플릿 추가
  const handleAddTemplate = () => {
    setEditingTemplate(null);
    setIsEditorModalOpen(true);
  };

  // 템플릿 편집
  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setIsEditorModalOpen(true);
  };

  // 템플릿 삭제
  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm("이 템플릿을 삭제하시겠습니까?")) {
      try {
        await financialLibraryService.deleteTemplate(templateId);
        await loadTemplates();
      } catch (error) {
        console.error("템플릿 삭제 오류:", error);
        alert("템플릿 삭제 중 오류가 발생했습니다.");
      }
    }
  };

  // 템플릿 저장
  const handleSaveTemplate = async (templateData) => {
    try {
      if (editingTemplate && editingTemplate.id) {
        // 수정
        await financialLibraryService.updateTemplate(
          editingTemplate.id,
          templateData
        );
      } else {
        // 새로 추가
        await financialLibraryService.addTemplate(templateData);
      }
      await loadTemplates();
      setIsEditorModalOpen(false);
    } catch (error) {
      console.error("템플릿 저장 오류:", error);
      alert("템플릿 저장 중 오류가 발생했습니다.");
    }
  };

  // 카테고리 라벨 가져오기
  const getCategoryLabel = (value) => {
    const cat = categories.find((c) => c.value === value);
    return cat ? cat.label : value;
  };

  // 가족 타입 라벨 가져오기 (배열 또는 단일 값 처리)
  const getFamilyTypeLabel = (value) => {
    // 배열인 경우 각 항목을 변환하여 쉼표로 연결
    if (Array.isArray(value)) {
      return value
        .map((v) => {
          const type = familyTypes.find((t) => t.value === v);
          return type ? type.label : v;
        })
        .join(", ");
    }
    
    // 단일 값인 경우
    const type = familyTypes.find((t) => t.value === value);
    return type ? type.label : value;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div
          className={styles.modalContent}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className={styles.header}>
            <h2 className={styles.title}>템플릿 관리</h2>
            <button className={styles.closeButton} onClick={onClose}>
              ×
            </button>
          </div>

          {/* 새 템플릿 추가 버튼 */}
          <div className={styles.addButtonContainer}>
            <button
              className={styles.addButton}
              onClick={handleAddTemplate}
            >
              + 새 템플릿 추가
            </button>
          </div>

          {/* 템플릿 목록 */}
          <div className={styles.content}>
            {loading ? (
              <div className={styles.loading}>로딩 중...</div>
            ) : templates.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📋</span>
                <span className={styles.emptyText}>
                  등록된 템플릿이 없습니다
                </span>
              </div>
            ) : (
              <div className={styles.templateList}>
                {templates.map((template) => (
                  <div key={template.id} className={styles.templateItem}>
                    <div className={styles.templateInfo}>
                      <div className={styles.templateHeader}>
                        <span className={styles.templateTitle}>
                          {template.title}
                        </span>
                        <div className={styles.templateBadges}>
                          <span
                            className={`${styles.categoryBadge} ${
                              template.category === "income"
                                ? styles.categoryBadgeIncome
                                : template.category === "expense"
                                ? styles.categoryBadgeExpense
                                : ""
                            }`}
                          >
                            <span
                              className={`${styles.badgeDot} ${
                                template.category === "income"
                                  ? styles.badgeDotIncome
                                  : template.category === "expense"
                                  ? styles.badgeDotExpense
                                  : ""
                              }`}
                            />
                            {getCategoryLabel(template.category)}
                          </span>
                          <span className={styles.familyBadge}>
                            {getFamilyTypeLabel(template.familyMemberType)}
                          </span>
                        </div>
                      </div>
                      <div className={styles.templateDetails}>
                        {template.ageStart !== null &&
                        template.ageEnd !== null ? (
                          <span>
                            {template.ageStart}~{template.ageEnd}세
                          </span>
                        ) : (
                          <span>연령 제한 없음</span>
                        )}
                        <span className={styles.separator}>•</span>
                        <span>
                          {template.data?.amount?.toLocaleString()}만원/{" "}
                          {template.data?.frequency === "monthly"
                            ? "월"
                            : "년"}
                        </span>
                      </div>
                    </div>
                    <div className={styles.templateActions}>
                      <button
                        className={styles.editButton}
                        onClick={() => handleEditTemplate(template)}
                      >
                        수정
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 템플릿 편집 모달 */}
      <TemplateEditorModal
        isOpen={isEditorModalOpen}
        onClose={() => setIsEditorModalOpen(false)}
        onSave={handleSaveTemplate}
        editData={editingTemplate}
      />
    </>
  );
}

export default TemplateManageModal;

