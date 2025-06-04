# 교보문고 핫트랙스 송도점 재고관리 시스템 - 개발자 문서

## 기술 스택

- **백엔드**: Node.js 18 + Express (TypeScript), PostgreSQL 15 (Prisma ORM)
- **프론트엔드**: React 18 + Vite (TypeScript), Tailwind CSS + shadcn/ui
- **배포**: Docker, Docker Compose, Nginx

## 프로젝트 구조

```
inventory-system/
├── backend/                  # 백엔드 애플리케이션
│   ├── prisma/               # Prisma ORM 설정 및 마이그레이션
│   ├── src/                  # 소스 코드
│   │   ├── controllers/      # API 컨트롤러
│   │   ├── middlewares/      # 미들웨어
│   │   ├── models/           # 데이터 모델
│   │   ├── routes/           # API 라우트
│   │   ├── services/         # 비즈니스 로직
│   │   └── utils/            # 유틸리티 함수
│   ├── tests/                # 테스트 코드
│   ├── Dockerfile            # 백엔드 Docker 설정
│   ├── package.json          # 의존성 관리
│   └── tsconfig.json         # TypeScript 설정
├── frontend/                 # 프론트엔드 애플리케이션
│   ├── public/               # 정적 파일
│   ├── src/                  # 소스 코드
│   │   ├── components/       # 리액트 컴포넌트
│   │   ├── contexts/         # 컨텍스트 API
│   │   ├── hooks/            # 커스텀 훅
│   │   ├── lib/              # 유틸리티 라이브러리
│   │   ├── pages/            # 페이지 컴포넌트
│   │   ├── services/         # API 서비스
│   │   └── types/            # TypeScript 타입 정의
│   ├── tests/                # 테스트 코드
│   ├── Dockerfile            # 프론트엔드 Docker 설정
│   ├── nginx.conf            # Nginx 설정
│   ├── package.json          # 의존성 관리
│   └── vite.config.ts        # Vite 설정
├── docker-compose.yml        # Docker Compose 설정
└── README.md                 # 사용자 문서
```

## 데이터베이스 스키마

### User 모델
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  role      Role     @default(STAFF)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  ADMIN
  STAFF
}
```

### Product 모델
```prisma
model Product {
  id                 String               @id @default(uuid())
  sku                String               @unique
  name               String
  description        String?
  category           String
  brand              String
  price              Float
  quantity           Int                  @default(0)
  safetyStock        Int                  @default(10)
  location           String
  createdAt          DateTime             @default(now())
  updatedAt          DateTime             @updatedAt
  inventoryAdjustments InventoryAdjustment[]
  locationHistory    LocationHistory[]
}
```

### InventoryAdjustment 모델
```prisma
model InventoryAdjustment {
  id        String   @id @default(uuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  quantity  Int
  memo      String?
  createdBy String
  createdAt DateTime @default(now())
}
```

### LocationHistory 모델
```prisma
model LocationHistory {
  id         String   @id @default(uuid())
  productId  String
  product    Product  @relation(fields: [productId], references: [id])
  fromLocation String
  toLocation  String
  createdBy  String
  createdAt  DateTime @default(now())
}
```

## API 엔드포인트

### 인증 API
- `POST /api/auth/login` - 로그인
- `POST /api/auth/refresh` - 토큰 갱신

### 제품 API
- `GET /api/products` - 제품 목록 조회
- `GET /api/products/:id` - 제품 상세 조회
- `POST /api/products` - 제품 생성
- `PUT /api/products/:id` - 제품 수정
- `DELETE /api/products/:id` - 제품 삭제
- `POST /api/products/:id/adjust` - 재고 조정
- `POST /api/products/:id/move` - 위치 변경
- `GET /api/products/:id/history` - 위치 이력 조회
- `GET /api/products/low-stock` - 저재고 제품 조회

### 업로드/다운로드 API
- `POST /api/upload/products` - 제품 대량 업로드
- `GET /api/download/products` - 제품 목록 다운로드

### 동기화 API
- `POST /api/sync/offline-actions` - 오프라인 작업 동기화

## 프론트엔드 구조

### 주요 페이지
- `/login` - 로그인 페이지
- `/` - 대시보드
- `/products` - 제품 목록
- `/products/:id` - 제품 상세
- `/products/new` - 제품 생성
- `/products/:id/edit` - 제품 수정
- `/products/:id/adjust` - 재고 조정
- `/products/:id/move` - 위치 변경
- `/scanner` - 바코드/QR 스캔
- `/upload` - 대량 업로드

### 상태 관리
- `AuthContext` - 인증 상태 관리
- `useAuth` - 인증 커스텀 훅
- `useSyncOffline` - 오프라인 동기화 커스텀 훅
- `usePwaInstall` - PWA 설치 커스텀 훅

## 오프라인 기능

오프라인 기능은 IndexedDB를 사용하여 구현되었습니다. 주요 기능은 다음과 같습니다:

1. **오프라인 감지**: `navigator.onLine` 속성과 `online`/`offline` 이벤트를 사용하여 네트워크 상태를 감지합니다.
2. **오프라인 작업 저장**: 오프라인 상태에서 수행된 작업(재고 조정, 위치 변경 등)은 IndexedDB에 저장됩니다.
3. **자동 동기화**: 온라인 상태로 전환되면 저장된 작업을 서버에 자동으로 동기화합니다.

## PWA 구현

Progressive Web App(PWA) 기능은 다음과 같이 구현되었습니다:

1. **서비스 워커**: 오프라인 지원 및 캐싱을 위한 서비스 워커를 등록합니다.
2. **매니페스트 파일**: 앱 설치 및 홈 화면 추가를 위한 웹 앱 매니페스트를 제공합니다.
3. **설치 프롬프트**: `beforeinstallprompt` 이벤트를 사용하여 사용자에게 앱 설치를 안내합니다.

## 배포 가이드

### 개발 환경 설정

1. 저장소 클론:
```bash
git clone https://github.com/kyobobook-hottracks/inventory-system.git
cd inventory-system
```

2. 백엔드 설정:
```bash
cd backend
npm install
cp .env.example .env  # 환경 변수 설정
npx prisma migrate dev  # 데이터베이스 마이그레이션
npx prisma db seed  # 샘플 데이터 생성
npm run dev  # 개발 서버 실행
```

3. 프론트엔드 설정:
```bash
cd frontend
npm install
cp .env.example .env  # 환경 변수 설정
npm run dev  # 개발 서버 실행
```

### 프로덕션 배포

1. Docker Compose 사용:
```bash
docker-compose up -d
```

2. 개별 서비스 배포:
   - 백엔드: `cd backend && npm run build && npm start`
   - 프론트엔드: `cd frontend && npm run build`

## 테스트

### 백엔드 테스트:
```bash
cd backend
npm test
```

### 프론트엔드 테스트:
```bash
cd frontend
npm test
```

### 통합 테스트:
```bash
cd frontend
npm run test:integration
```

## 확장 및 커스터마이징

### 새로운 기능 추가

1. 백엔드 API 추가:
   - `src/controllers`에 새 컨트롤러 추가
   - `src/routes`에 새 라우트 추가
   - 필요한 경우 `prisma/schema.prisma`에 새 모델 추가

2. 프론트엔드 기능 추가:
   - `src/pages`에 새 페이지 컴포넌트 추가
   - `src/services`에 새 API 서비스 추가
   - `src/App.tsx`에 새 라우트 추가

### 스타일 커스터마이징

- `frontend/src/index.css`에서 Tailwind 테마 설정 수정
- `frontend/tailwind.config.js`에서 색상 및 기타 테마 옵션 수정

## 문제 해결

### 일반적인 문제

1. **API 연결 오류**:
   - 백엔드 서버가 실행 중인지 확인
   - 환경 변수 설정 확인 (`VITE_API_URL`)
   - CORS 설정 확인

2. **데이터베이스 연결 오류**:
   - PostgreSQL 서버가 실행 중인지 확인
   - 환경 변수 설정 확인 (`DATABASE_URL`)
   - Prisma 마이그레이션이 적용되었는지 확인

3. **빌드 오류**:
   - 의존성 패키지가 올바르게 설치되었는지 확인
   - TypeScript 오류 해결
   - Node.js 버전 확인 (v18 이상 권장)

## 성능 최적화

1. **백엔드 최적화**:
   - 데이터베이스 인덱스 활용
   - 캐싱 전략 구현
   - 비동기 작업 처리

2. **프론트엔드 최적화**:
   - 코드 분할 및 지연 로딩
   - 메모이제이션 활용
   - 이미지 최적화

## 보안 고려사항

1. **인증 및 권한**:
   - JWT 토큰 만료 시간 설정
   - 역할 기반 접근 제어 구현
   - HTTPS 사용

2. **데이터 보안**:
   - 비밀번호 해싱
   - 입력 유효성 검사
   - SQL 인젝션 방지

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.
