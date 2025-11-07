import React from "react";
import { formatAmount } from "../../utils/format";
import styles from "./RealEstateList.module.css";

const RealEstateList = ({
  realEstates,
  onEdit = () => {},
  onDelete = () => {},
  isReadOnly = false,
}) => {
  if (!realEstates || realEstates.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>등록된 부동산이 없습니다.</p>
        <p>부동산을 추가해보세요.</p>
      </div>
    );
  }

  return (
    <div className={styles.realEstateList}>
      {realEstates.map((realEstate) => (
        <div
          key={realEstate.id}
          className={styles.realEstateItem}
          onClick={() => {
            onEdit(realEstate);
          }}
        >
          <div className={styles.realEstateHeader}>
            <div className={styles.realEstateTitle}>
              <span className={styles.title}>{realEstate.title}</span>
            </div>
            <button
              className={styles.deleteButton}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(realEstate.id);
              }}
            >
              ×
            </button>
          </div>

          <div className={styles.realEstateContent}>
            <div className={styles.realEstateValue}>
              부동산 가치: {formatAmount(realEstate.currentValue)}
            </div>
            <div className={styles.realEstateRate}>
              연평균 가치 상승률: {realEstate.growthRate.toFixed(2)}%
            </div>
            <div className={styles.realEstatePeriod}>
              {new Date().getFullYear()}년 - {realEstate.endYear}년
            </div>

            {realEstate.hasRentalIncome && (
              <div className={styles.rentalInfo}>
                <div className={styles.rentalPeriod}>
                  임대 수입: {realEstate.rentalIncomeStartYear}년 -{" "}
                  {realEstate.rentalIncomeEndYear}년
                </div>
                <div className={styles.rentalAmount}>
                  월 임대 수입: {formatAmount(realEstate.monthlyRentalIncome)}
                  /월
                </div>
              </div>
            )}

            {realEstate.convertToPension && (
              <div className={styles.pensionInfo}>
                <div className={styles.pensionPeriod}>
                  주택연금: {realEstate.pensionStartYear}년 -{" "}
                  {realEstate.pensionEndYear}년
                </div>
                <div className={styles.pensionAmount}>
                  월 수령액: {formatAmount(realEstate.monthlyPensionAmount)}/월
                </div>
              </div>
            )}

            {realEstate.memo && (
              <div className={styles.memo}>
                <span className={styles.memoText}>{realEstate.memo}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RealEstateList;
