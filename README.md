# 재무 상담 대시보드

React + Firebase로 구축된 재무 상담가용 웹 서비스입니다. 내담자의 수입/자산/부채/지출/연금 데이터를 입력받아 자산 시뮬레이션 그래프와 현금 흐름 시뮬레이션 그래프를 제공합니다.

## 주요 기능

### 📊 프로필 관리

- 다중 프로필 지원 (이름, 생년월일, 희망 은퇴 나이)
- 프로필별 독립적인 재무 데이터 관리
- 실시간 데이터 동기화

### 💰 재무 데이터 관리

- **수입**: 급여, 부업, 투자 수익 등
- **자산**: 현금, 주식, 부동산, 펀드 등 (수익률 설정 가능)
- **부채**: 대출, 신용카드, 담보대출 등 (이자율 설정 가능)
- **지출**: 생활비, 보험료, 세금 등
- **연금**: 국민연금, 퇴직연금, 개인연금 등

### 📈 시뮬레이션 차트

- **현금 흐름 시뮬레이션**: 월별 수입/지출/부채상환 분석
- **자산 시뮬레이션**: 자산 성장률을 고려한 장기 자산 변화 예측
- 은퇴 전후 30년간의 시뮬레이션 제공

## 기술 스택

- **Frontend**: React 18, React Router
- **Backend**: Firebase (Firestore, Authentication)
- **Charts**: Recharts
- **Styling**: CSS Modules
- **Build Tool**: Vite

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 Firebase 설정을 추가하세요:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. 개발 서버 실행

```bash
npm run dev
```

### 4. 프로덕션 빌드

```bash
npm run build
```

## 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── AddDataModal.jsx        # 데이터 추가 모달
│   ├── AddProfileModal.jsx     # 프로필 추가 모달
│   ├── AssetProjectionChart.jsx # 자산 시뮬레이션 차트
│   ├── CashflowChart.jsx       # 현금 흐름 차트
│   └── DataList.jsx            # 데이터 목록 컴포넌트
├── pages/              # 페이지 컴포넌트
│   ├── DashboardPage.jsx       # 대시보드 페이지
│   └── ProfileListPage.jsx     # 프로필 목록 페이지
├── services/           # Firebase 서비스
│   └── firestoreService.js     # Firestore CRUD 함수들
├── utils/              # 유틸리티 함수
│   ├── date.js                 # 날짜 관련 함수
│   └── simulators.js           # 시뮬레이션 계산 함수
└── libs/               # 라이브러리 설정
    └── firebase.js             # Firebase 초기화
```

## Firestore 데이터 구조

### Profiles Collection

```javascript
profiles/{profileId} {
  name: string,
  birthDate: string, // YYYY-MM-DD
  retirementAge: number,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Data Items (Subcollections)

```javascript
profiles/{profileId}/{category}/{itemId} {
  title: string,
  amount: number,
  startDate: string, // YYYY-MM-DD
  endDate: string | null,
  frequency: "daily" | "monthly" | "quarterly" | "yearly" | "once",
  note: string | null,
  rate: number | null, // %/year (for assets/debts)
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 주요 기능 설명

### 1. 프로필 관리

- 프로필 추가 시 현재 나이 자동 계산
- 프로필별 독립적인 재무 데이터 관리
- 실시간 데이터 동기화로 여러 탭에서 동시 작업 가능

### 2. 재무 데이터 입력

- 각 카테고리별 맞춤형 입력 폼
- 빈도 설정 (일일/월/분기/년/일회성)
- 자산/부채의 경우 수익률/이자율 설정 가능
- 시작일/종료일 설정으로 기간 제한 가능

### 3. 시뮬레이션 계산

- **현금 흐름**: 모든 수입 + 연금 - 지출 - 부채상환
- **자산 시뮬레이션**: 초기 자산 + 누적 현금흐름 - 부채잔액 + 자산성장률
- 복리 계산을 통한 정확한 장기 예측
- 빈도별 월 단위 변환으로 정밀한 계산

### 4. 차트 시각화

- Recharts를 활용한 반응형 차트
- 월별 데이터 포인트로 상세한 분석
- 누적 현금흐름과 순자산 변화 추이 확인
- 툴팁을 통한 상세 정보 표시

## 개발 가이드

### 새로운 데이터 카테고리 추가

1. `AddDataModal.jsx`에서 `categoryConfig`에 새 카테고리 추가
2. `DashboardPage.jsx`에서 데이터 버튼과 목록 추가
3. `simulators.js`에서 계산 로직 추가

### 차트 커스터마이징

- `CashflowChart.jsx`와 `AssetProjectionChart.jsx`에서 차트 설정 수정
- Recharts 컴포넌트를 활용한 다양한 차트 타입 지원

### 스타일링

- CSS Modules를 사용한 컴포넌트별 스타일 관리
- 반응형 디자인으로 모바일/데스크톱 대응
- CSS 변수를 활용한 일관된 디자인 시스템

## 라이선스

MIT License
