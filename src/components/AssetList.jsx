import React from "react";
import { formatAmount } from "../utils/format";
import styles from "./AssetList.module.css";

/**
 * 자산 목록 컴포넌트
 * 기본적인 자산 정보를 표시합니다.
 */
function AssetList({ assets, onEdit, onDelete }) {
  if (!assets || assets.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyMessage}>자산 데이터가 없습니다.</p>
        <p className={styles.emptySubMessage}>
          + 추가 버튼을 눌러 자산을 추가해보세요.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.assetList}>
      {assets.map((asset) => (
        <div 
          key={asset.id} 
          className={styles.assetItem}
          onClick={() => onEdit(asset)}
        >
          <div className={styles.assetInfo}>
            <div className={styles.assetHeader}>
              <h4 className={styles.assetTitle}>{asset.title}</h4>
              <div className={styles.assetActions}>
                <button
                  className={styles.deleteButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(asset.id, asset.title);
                  }}
                  title="삭제"
                >
                  ×
                </button>
              </div>
            </div>

            <div className={styles.assetAmount}>
              {formatAmount(asset.currentValue)}만원
            </div>

            <div className={styles.assetDetails}>
              <div className={styles.detailRow}>
                <span className={styles.label}>상승률:</span>
                <span className={styles.value}>
                  {(asset.growthRate * 100).toFixed(1)}%
                </span>
              </div>
              
              <div className={styles.detailRow}>
                <span className={styles.label}>보유 기간:</span>
                <span className={styles.value}>
                  {asset.startYear}년 - {asset.endYear}년
                </span>
              </div>

              {asset.memo && (
                <div className={styles.memoSection}>
                  <span className={styles.memoLabel}>메모:</span>
                  <p className={styles.memoText}>{asset.memo}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AssetList;
