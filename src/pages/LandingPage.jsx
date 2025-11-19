import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./LandingPage.module.css";

/**
 * LandingPage 컴포넌트
 * 서비스 메인 소개 페이지
 */
function LandingPage() {
  const navigate = useNavigate();

  const handleStartService = () => {
    if (window.mixpanel) {
      window.mixpanel.track("랜딩 - 서비스 시작 클릭");
    }
    navigate("/form");
  };

  return (
    <div className={styles.landingContainer}>
      {/* Hero Section */}
      <div className={styles.heroSection}>
        <h1 className={styles.mainTitle}>Lycon Planning</h1>
        <p className={styles.subtitle}>
          데이터 기반 자산 점검, 전문가의 1:1 맞춤 컨설팅
        </p>
      </div>

      {/* 플로우 섹션 */}
      <section className={styles.flowSection}>
        <div className={styles.flowContainer}>
          <div className={styles.flowCard}>
            <div className={styles.flowNumber}>STEP 1</div>
            <h3 className={styles.flowTitle}>무료 사전상담 (온라인)</h3>
            <div className={styles.flowDuration}>30분</div>
            <ul className={styles.flowList}>
              <li>현재 상황 파악</li>
              <li>목표 확인</li>
              <li>상세 재무 파악</li>
              <li>최적 패키지 제안</li>
            </ul>
          </div>

          <div className={styles.flowArrow}>→</div>

          <div className={styles.flowCard}>
            <div className={styles.flowNumber}>STEP 2</div>
            <h3 className={styles.flowTitle}>본 상담 (1~3회)</h3>
            <div className={styles.flowDuration}>60~90분 /회</div>
            <ul className={styles.flowList}>
              <li>상태 진단 (4종)</li>
              <li>목표 기반 설계 (2종)</li>
              <li>연금 최적화 (Standard+)</li>
              <li>부동산·절세 전략 (Premium)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 패키지 섹션 */}
      <section className={styles.packagesSection}>
        <h2 className={styles.sectionTitle}>본 상담 프로그램</h2>
        <p className={styles.sectionDesc}>
          사전상담 후 고객님께 맞는 패키지로 본 상담이 진행됩니다
        </p>

        <div className={styles.packagesGrid}>
          {/* Basic 패키지 */}
          <div className={styles.packageCard}>
            <div className={styles.packageBanner}>
              은퇴 준비 상태가 궁금하신 분
            </div>
            <div className={styles.packageHeader}>
              <h3 className={styles.packageName}>Basic</h3>
              <div className={styles.packagePrice}>
                <span className={styles.price}>20</span>
                <span className={styles.unit}>만원</span>
              </div>
              <p className={styles.packageSession}>본상담 1회</p>
            </div>

            <div className={styles.packageBody}>
              <div className={styles.sectionBlock}>
                <h4 className={styles.blockTitle}>상태 진단 (4종)</h4>
                <div className={styles.itemList}>
                  <div className={styles.item}>
                    <div className={styles.itemTitle}>은퇴 준비 상태 진단</div>
                    <div className={styles.itemDesc}>
                      현재 준비 수준과 필요 금액 비교 분석
                    </div>
                  </div>
                  <div className={styles.item}>
                    <div className={styles.itemTitle}>소득·지출 패턴 분석</div>
                    <div className={styles.itemDesc}>
                      지출 구조 점검 및 개선 방안 제시
                    </div>
                  </div>
                  <div className={styles.item}>
                    <div className={styles.itemTitle}>은퇴 리스크 진단</div>
                    <div className={styles.itemDesc}>
                      장수·의료비·돌발비용 리스크 분석
                    </div>
                  </div>
                  <div className={styles.item}>
                    <div className={styles.itemTitle}>투자 포트폴리오 진단</div>
                    <div className={styles.itemDesc}>
                      투자 성향 평가 및 리스크/수익률 구조 점검
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.sectionBlock}>
                <h4 className={styles.blockTitle}>목표 기반 설계 (2종)</h4>
                <div className={styles.itemList}>
                  <div className={styles.item}>
                    <div className={styles.itemTitle}>
                      은퇴 후 현금흐름 달성 전략
                    </div>
                    <div className={styles.itemDesc}>
                      필요 월 지출 계산, 실제 인출 가능 금액 산정, 부족분 해결
                      대안 제시
                    </div>
                  </div>
                  <div className={styles.item}>
                    <div className={styles.itemTitle}>
                      목표 은퇴 자산 달성 전략
                    </div>
                    <div className={styles.itemDesc}>
                      목표 대비 격차 분석, 연간 저축/투자 필요금액 설계
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Standard 패키지 */}
          <div className={styles.packageCard}>
            <div className={styles.packageBanner}>
              연금 계좌가 여러 개 있어 복잡하신 분
            </div>
            <div className={styles.packageHeader}>
              <h3 className={styles.packageName}>Standard</h3>
              <div className={styles.packagePrice}>
                <span className={styles.price}>35</span>
                <span className={styles.unit}>만원</span>
              </div>
              <p className={styles.packageSession}>본상담 2회</p>
            </div>

            <div className={styles.packageBody}>
              <div className={styles.includesNote}>
                ✓ Basic 패키지 전체 포함 (1회차)
              </div>

              <div className={styles.sectionBlock}>
                <h4 className={styles.blockTitle}>
                  연금 점검 및 최적화 (2회차)
                </h4>

                <div className={styles.itemList}>
                  <div className={styles.item}>
                    <div className={styles.itemTitle}>3층 연금 점검</div>
                    <div className={styles.itemDesc}>
                      국민연금, 퇴직연금(DB/DC), IRP, 연금저축 분석
                      <br />
                      수령 시점 변경에 따른 효과 비교
                    </div>
                  </div>

                  <div className={styles.item}>
                    <div className={styles.itemTitle}>계좌 구조 설계</div>
                    <div className={styles.itemDesc}>
                      세금 효율을 고려한 자산 배치 전략
                      <br />
                      비과세/저과세 구간 최적화
                    </div>
                  </div>

                  <div className={styles.item}>
                    <div className={styles.itemTitle}>연금 인출 전략</div>
                    <div className={styles.itemDesc}>
                      퇴직연금·개인연금 인출 순서 및 타이밍 전략
                      <br />
                      10년/20년 수령 비교, 세금·소득 변화 시뮬레이션
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Premium 패키지 */}
          <div className={styles.packageCard}>
            <div className={styles.packageBanner}>
              재건축·다주택·금융소득이 많으신 분
            </div>
            <div className={styles.packageHeader}>
              <h3 className={styles.packageName}>Premium</h3>
              <div className={styles.packagePrice}>
                <span className={styles.price}>50</span>
                <span className={styles.unit}>만원</span>
              </div>
              <p className={styles.packageSession}>본상담 3회</p>
            </div>

            <div className={styles.packageBody}>
              <div className={styles.includesNote}>
                ✓ Standard 패키지 전체 포함 (1~2회차)
              </div>

              <div className={styles.sectionBlock}>
                <h4 className={styles.blockTitle}>
                  부동산 기반 은퇴 전략 (3회차)
                </h4>

                <div className={styles.itemList}>
                  <div className={styles.item}>
                    <div className={styles.itemTitle}>주거 전략 분석</div>
                    <div className={styles.itemDesc}>
                      거주 주택 유지 vs 다운사이징 비교 분석
                      <br />
                      주택연금 적합성 진단
                    </div>
                  </div>

                  <div className={styles.item}>
                    <div className={styles.itemTitle}>
                      재건축·재개발 리스크 분석
                    </div>
                    <div className={styles.itemDesc}>
                      예상 일정 및 리스크 시뮬레이션
                    </div>
                  </div>

                  <div className={styles.item}>
                    <div className={styles.itemTitle}>임대 및 거주비 전략</div>
                    <div className={styles.itemDesc}>
                      전세·월세 구조 분석, 보유세·관리비 비교
                      <br />
                      은퇴 후 거주비 예측 모델 (관리비·보험·보유세)
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.sectionBlock}>
                <h4 className={styles.blockTitle}>절세 전략</h4>

                <div className={styles.itemList}>
                  <div className={styles.item}>
                    <div className={styles.itemTitle}>
                      금융소득종합과세 대응
                    </div>
                    <div className={styles.itemDesc}>
                      과세 구간 진입 여부 분석 및 회피 전략
                    </div>
                  </div>

                  <div className={styles.item}>
                    <div className={styles.itemTitle}>종합세액 절감</div>
                    <div className={styles.itemDesc}>
                      은퇴 후 인출세·소득세 구조 최적화
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.packageNote}>
          모든 패키지는 사전상담을 통해 고객님의 상황을 파악한 후 시작됩니다.
          <br />
          사전상담에서 간단한 시뮬레이션 예시를 보여드리고, 가장 적합한 패키지를
          제안드립니다.
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className={styles.ctaSection}>
        <h2 className={styles.ctaTitle}>체계적인 은퇴 준비, 지금 시작하세요</h2>

        <button className={styles.ctaButton} onClick={handleStartService}>
          무료 사전상담 신청하기
        </button>
        <p className={styles.ctaNote}>신청 후 24시간 내 연락드립니다</p>
      </section>
    </div>
  );
}

export default LandingPage;
