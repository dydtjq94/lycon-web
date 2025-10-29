import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./ProfileChecklistPanel.module.css";

const createItemId = () =>
  `chk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

function ProfileChecklistPanel({
  items,
  onItemsChange,
  isLoading,
  isSaving,
  disabled,
}) {
  const [editingState, setEditingState] = useState(null);
  const skipNextBlurCommitRef = useRef(false);

  const topLevelItems = useMemo(() => items || [], [items]);
  const isInteractionDisabled = disabled || isLoading;

  useEffect(() => {
    if (!editingState) return;
    const { id, parentId } = editingState;
    const exists = parentId
      ? topLevelItems.some(
          (item) =>
            item.id === parentId &&
            (item.children || []).some((child) => child.id === id)
        )
      : topLevelItems.some((item) => item.id === id);
    if (!exists) {
      setEditingState(null);
    }
  }, [editingState, topLevelItems]);

  const startEditing = (item, parentId = null, options = {}) => {
    if (isInteractionDisabled) return;
    setEditingState({
      id: item.id,
      parentId,
      value: item.title || "",
      initialValue: item.title || "",
      isNew: options.isNew || false,
    });
    skipNextBlurCommitRef.current = false;
  };

  const applyItemsChange = (nextItems, shouldPersist) => {
    onItemsChange?.(nextItems, { persist: shouldPersist });
  };

  const handleAddTopLevelAfter = (afterId = null) => {
    if (isInteractionDisabled) return;
    const newItem = {
      id: createItemId(),
      title: "",
      checked: false,
      children: [],
    };
    const nextItems = [...topLevelItems];
    if (afterId) {
      const index = nextItems.findIndex((item) => item.id === afterId);
      const insertIndex = index >= 0 ? index + 1 : nextItems.length;
      nextItems.splice(insertIndex, 0, newItem);
    } else {
      nextItems.push(newItem);
    }
    applyItemsChange(nextItems, false);
    startEditing(newItem, null, { isNew: true });
  };

  const handleAddChild = (parentId) => {
    if (isInteractionDisabled) return;
    const newChild = {
      id: createItemId(),
      title: "",
      checked: false,
    };
    const nextItems = topLevelItems.map((item) => {
      if (item.id !== parentId) return item;
      const children = item.children ? [...item.children] : [];
      children.push(newChild);
      return { ...item, children };
    });
    applyItemsChange(nextItems, false);
    startEditing(newChild, parentId, { isNew: true });
  };

  const removeItem = (targetId, parentId) => {
    const nextItems = parentId
      ? topLevelItems.map((item) => {
          if (item.id !== parentId) return item;
          const filteredChildren = (item.children || []).filter(
            (child) => child.id !== targetId
          );
          return { ...item, children: filteredChildren };
        })
      : topLevelItems.filter((item) => item.id !== targetId);
    return nextItems;
  };

  const handleDelete = (target, parentId = null) => {
    if (isInteractionDisabled) return;
    const nextItems = removeItem(target.id, parentId);
    applyItemsChange(nextItems, true);
    if (
      editingState &&
      editingState.id === target.id &&
      editingState.parentId === parentId
    ) {
      setEditingState(null);
    }
  };

  const updateItemTitle = (targetId, parentId, title) => {
    const nextItems = parentId
      ? topLevelItems.map((item) => {
          if (item.id !== parentId) return item;
          const updatedChildren = (item.children || []).map((child) =>
            child.id === targetId ? { ...child, title } : child
          );
          return { ...item, children: updatedChildren };
        })
      : topLevelItems.map((item) =>
          item.id === targetId ? { ...item, title } : item
        );
    return nextItems;
  };

  const handleCommitEdit = (options = {}) => {
    if (!editingState) return;
    if (options.fromBlur && skipNextBlurCommitRef.current) {
      skipNextBlurCommitRef.current = false;
      return;
    }
    if (!options.fromBlur) {
      skipNextBlurCommitRef.current = true;
    }
    const trimmed = editingState.value.trim();
    if (trimmed === "") {
      if (editingState.isNew) {
        const nextItems = removeItem(editingState.id, editingState.parentId);
        applyItemsChange(nextItems, false);
      }
      setEditingState(null);
      return;
    }
    const nextItems = updateItemTitle(
      editingState.id,
      editingState.parentId,
      trimmed
    );
    applyItemsChange(nextItems, true);
    setEditingState(null);
  };

  const handleCancelEdit = () => {
    if (!editingState) return;
    if (editingState.isNew && !editingState.initialValue) {
      const nextItems = removeItem(editingState.id, editingState.parentId);
      applyItemsChange(nextItems, false);
    }
    skipNextBlurCommitRef.current = true;
    setEditingState(null);
  };

  const handleToggleTopLevel = (itemId) => {
    if (isInteractionDisabled) return;
    const nextItems = topLevelItems.map((item) => {
      if (item.id !== itemId) return item;
      const nextChecked = !item.checked;
      const updatedChildren = (item.children || []).map((child) => ({
        ...child,
        checked: nextChecked,
      }));
      return { ...item, checked: nextChecked, children: updatedChildren };
    });
    applyItemsChange(nextItems, true);
  };

  const handleToggleChild = (parentId, childId) => {
    if (isInteractionDisabled) return;
    const nextItems = topLevelItems.map((item) => {
      if (item.id !== parentId) return item;
      const updatedChildren = (item.children || []).map((child) =>
        child.id === childId ? { ...child, checked: !child.checked } : child
      );
      const allChecked =
        updatedChildren.length > 0 &&
        updatedChildren.every((child) => child.checked);
      return {
        ...item,
        children: updatedChildren,
        checked: updatedChildren.length === 0 ? item.checked : allChecked,
      };
    });
    applyItemsChange(nextItems, true);
  };

  const renderInput = (item, parentId = null) => (
    <input
      key={`${parentId || "root"}-${item.id}`}
      className={styles.editInput}
      value={
        editingState && editingState.id === item.id
          ? editingState.value
          : item.title || ""
      }
      onChange={(event) =>
        setEditingState((prev) =>
          prev && prev.id === item.id && prev.parentId === parentId
            ? { ...prev, value: event.target.value }
            : prev
        )
      }
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          handleCommitEdit();
        } else if (event.key === "Escape") {
          event.preventDefault();
          handleCancelEdit();
        }
      }}
      onBlur={() => handleCommitEdit({ fromBlur: true })}
      autoFocus
      placeholder="체크리스트 내용을 입력하세요"
    />
  );

  const renderTopLevelItem = (item) => {
    const isEditing =
      editingState && editingState.id === item.id && !editingState.parentId;
    return (
      <div key={item.id} className={styles.itemBlock}>
        <div className={styles.itemRow}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={!!item.checked}
              onChange={() => handleToggleTopLevel(item.id)}
              disabled={isInteractionDisabled}
            />
            <span className={styles.customCheckbox} />
          </label>
          {isEditing ? (
            renderInput(item)
          ) : (
            <button
              type="button"
              className={`${styles.itemText} ${
                item.checked ? styles.checkedText : ""
              }`}
              onClick={() => startEditing(item)}
              disabled={isInteractionDisabled}
            >
              {item.title || "내용 없는 체크리스트"}
            </button>
          )}
          <button
            type="button"
            className={styles.deleteButton}
            onClick={() => handleDelete(item)}
            disabled={isInteractionDisabled}
            title="체크리스트 삭제"
          >
            ×
          </button>
        </div>
        {(item.children || []).map((child) => renderChildItem(item.id, child))}
        <div className={styles.actionLine}>
          <button
            type="button"
            className={styles.inlineAction}
            onClick={() => handleAddChild(item.id)}
            disabled={isInteractionDisabled}
          >
            + 하위 항목 체크리스트 추가하기
          </button>
        </div>
      </div>
    );
  };

  const renderChildItem = (parentId, child) => {
    const isEditing =
      editingState &&
      editingState.id === child.id &&
      editingState.parentId === parentId;
    return (
      <div key={child.id} className={styles.childRow}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={!!child.checked}
            onChange={() => handleToggleChild(parentId, child.id)}
            disabled={isInteractionDisabled}
          />
          <span className={styles.customCheckbox} />
        </label>
        {isEditing ? (
          renderInput(child, parentId)
        ) : (
          <button
            type="button"
            className={`${styles.itemText} ${
              child.checked ? styles.checkedText : ""
            }`}
            onClick={() => startEditing(child, parentId)}
            disabled={isInteractionDisabled}
          >
            {child.title || "내용 없는 체크리스트"}
          </button>
        )}
        <button
          type="button"
          className={styles.deleteButton}
          onClick={() => handleDelete(child, parentId)}
          disabled={isInteractionDisabled}
          title="체크리스트 삭제"
        >
          ×
        </button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={styles.stateBox}>
        <p className={styles.stateText}>체크리스트를 불러오는 중입니다…</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>체크리스트</h3>
        {isSaving && <span className={styles.savingBadge}>저장 중…</span>}
      </div>
      <div className={styles.list}>{topLevelItems.map(renderTopLevelItem)}</div>
      <button
        type="button"
        className={styles.primaryAddButton}
        onClick={() => handleAddTopLevelAfter(null)}
        disabled={isInteractionDisabled}
      >
        + 새 체크리스트 추가하기
      </button>
    </div>
  );
}

export default ProfileChecklistPanel;
