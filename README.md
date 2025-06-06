# 교보문고 핫트랙스 송도점 재고관리 시스템 사용 설명서

## 시스템 개요

이 재고관리 시스템은 교보문고 핫트랙스 송도점의 재고를 효율적으로 관리하기 위해 개발되었습니다. 주요 기능으로는 제품 관리, 입/출고 관리, 위치 변경 및 이력 관리, 바코드/QR 스캔, 대량 업로드/다운로드, 오프라인 지원 등이 있습니다.

## 시스템 요구사항

- Docker 및 Docker Compose 설치
- 인터넷 연결 (초기 설치 및 동기화용)
- 최신 웹 브라우저 (Chrome, Firefox, Safari, Edge 등)

## 설치 및 실행 방법

### 1. 시스템 다운로드

```bash
git clone https://github.com/kyobobook-hottracks/inventory-system.git
cd inventory-system
```

### 2. 환경 변수 설정

 프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 다음 내용을 입력합니다. `JWT_SECRET`은 반드시 설정해야 합니다.

```
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/inventory
JWT_SECRET=your_jwt_secret_key_here
PORT=3001
VITE_API_URL=http://localhost:3001/api
```
**참고:**
- `DATABASE_URL`은 Docker Compose를 사용하여 백엔드를 실행할 경우 Docker 내부 네트워크의 PostgreSQL을 가리킵니다. Docker 없이 로컬에서 백엔드를 직접 실행하는 경우, 이 값을 로컬 PostgreSQL 인스턴스의 연결 문자열로 변경해야 합니다. (아래 "Local Development" 섹션 참조)
- `VITE_API_URL`은 프론트엔드가 백엔드 API와 통신하기 위한 URL입니다. 로컬 개발 시 백엔드 PORT와 맞춰주세요.

### 3. Docker Compose로 시스템 실행

```bash
docker-compose up -d
```

### 4. 시스템 접속

웹 브라우저에서 다음 주소로 접속합니다:
- http://localhost:3000

## 사용자 계정

시스템에는 기본적으로 두 가지 계정이 설정되어 있습니다:

1. 관리자 계정
   - 이메일: admin@kyobobook.com
   - 비밀번호: admin123
   - 권한: 모든 기능 사용 가능

2. 직원 계정
   - 이메일: staff@kyobobook.com
   - 비밀번호: staff123
   - 권한: 조회, 입/출고, 위치 변경 가능

## 주요 기능 사용법

### 1. 로그인

- 제공된 이메일과 비밀번호로 로그인합니다.
- 로그인 후 대시보드 화면으로 이동합니다.

### 2. 대시보드

- 총 제품 수, 총 재고량, 저재고 제품 수, 카테고리 수 등 주요 통계를 확인할 수 있습니다.
- 저재고 알림 섹션에서 안전재고 미만인 제품 목록을 확인할 수 있습니다.
- 최근 추가된 제품 목록을 확인할 수 있습니다.

### 3. 제품 관리

#### 3.1 제품 목록 조회

- 제품 관리 메뉴를 클릭하여 제품 목록 페이지로 이동합니다.
- 검색창을 사용하여 상품명 또는 SKU로 제품을 검색할 수 있습니다.
- 카테고리, 브랜드, 위치 필터를 사용하여 제품을 필터링할 수 있습니다.
- 저재고 상품만 보기 옵션을 선택하여 안전재고 미만인 제품만 표시할 수 있습니다.

#### 3.2 제품 상세 조회

- 제품 목록에서 제품명 또는 상세 버튼을 클릭하여 제품 상세 페이지로 이동합니다.
- 제품의 상세 정보, 현재 재고 상태, 위치 등을 확인할 수 있습니다.

#### 3.3 제품 추가 (관리자 전용)

- 제품 목록 페이지에서 "신규 제품" 버튼을 클릭합니다.
- 제품 정보를 입력하고 저장합니다.

#### 3.4 제품 수정 (관리자 전용)

- 제품 상세 페이지에서 "수정" 버튼을 클릭합니다.
- 제품 정보를 수정하고 저장합니다.

#### 3.5 제품 삭제 (관리자 전용)

- 제품 상세 페이지에서 "삭제" 버튼을 클릭합니다.
- 확인 메시지가 표시되면 "확인"을 클릭하여 제품을 삭제합니다.

### 4. 재고 관리

#### 4.1 입/출고 처리

- 제품 상세 페이지에서 "입/출고" 버튼을 클릭합니다.
- 입고 또는 출고를 선택합니다.
- 수량을 입력합니다.
- 메모를 입력합니다 (선택 사항).
- "재고 조정" 버튼을 클릭하여 저장합니다.

#### 4.2 위치 변경

- 제품 상세 페이지에서 "위치변경" 버튼을 클릭합니다.
- 새 위치를 입력합니다.
- "위치 변경" 버튼을 클릭하여 저장합니다.

#### 4.3 위치 이력 조회

- 제품 상세 페이지에서 "위치이력" 버튼을 클릭합니다.
- 위치 변경 이력 목록이 표시됩니다.

### 5. 바코드/QR 스캔

- 대시보드 또는 제품 목록 페이지에서 "바코드 스캔" 버튼을 클릭합니다.
- 카메라가 활성화되면 제품의 바코드 또는 QR 코드를 스캔합니다.
- 스캔 결과에 따라 해당 제품 페이지로 이동합니다.

### 6. 대량 업로드/다운로드

#### 6.1 CSV 내보내기 (관리자 전용)

- 제품 목록 페이지에서 "CSV 내보내기" 버튼을 클릭합니다.
- 현재 필터링된 제품 목록이 CSV 파일로 다운로드됩니다.

#### 6.2 대량 업로드 (관리자 전용)

- 제품 목록 페이지에서 "대량 업로드" 버튼을 클릭합니다.
- CSV 파일을 선택하거나 드래그 앤 드롭합니다.
- "업로드" 버튼을 클릭하여 파일을 업로드합니다.
- 업로드 결과가 표시됩니다.

### 7. 오프라인 기능

- 인터넷 연결이 끊어진 상태에서도 시스템을 사용할 수 있습니다.
- 오프라인 상태에서 수행한 작업은 로컬에 저장되며, 인터넷 연결이 복구되면 자동으로 동기화됩니다.
- 오프라인 상태는 화면 상단에 표시됩니다.

## 문제 해결

### 시스템이 시작되지 않는 경우

1. Docker 서비스가 실행 중인지 확인합니다.
2. 다음 명령어로 로그를 확인합니다:
   ```bash
   docker-compose logs
   ```
3. 포트 충돌이 있는 경우 `docker-compose.yml` 파일에서 포트 매핑을 수정합니다.

### 로그인이 되지 않는 경우

1. 이메일과 비밀번호를 정확히 입력했는지 확인합니다.
2. 백엔드 서비스가 실행 중인지 확인합니다:
   ```bash
   docker-compose ps
   ```

### 데이터베이스 초기화가 필요한 경우

1. 다음 명령어로 컨테이너를 중지하고 볼륨을 삭제합니다:
   ```bash
   docker-compose down -v
   ```
2. 시스템을 다시 시작합니다:
   ```bash
   docker-compose up -d
   ```

## 지원 및 문의

문제가 발생하거나 추가 지원이 필요한 경우 다음 연락처로 문의해 주세요:
- 이메일: support@kyobobook.com
- 전화: 02-1234-5678

---

## Local Development (Without Docker)

Docker를 사용하지 않고 로컬 환경에서 직접 프론트엔드와 백엔드를 실행할 수 있습니다.

### Prerequisites

- Node.js (권장 버전: v18 또는 최신 LTS)
- npm 또는 yarn
- 로컬 PostgreSQL 데이터베이스 인스턴스 실행 중

### Steps

1.  **저장소 복제:**
    ```bash
    git clone https://github.com/kyobobook-hottracks/inventory-system.git
    cd inventory-system
    ```

2.  **루트 디렉토리에서 의존성 설치:**
    ```bash
    npm install
    ```
    (또는 `yarn install`)

3.  **PostgreSQL 설정:**
    로컬에 PostgreSQL을 설치하고 실행합니다. 데이터베이스를 생성하고 연결 문자열(Connection String)을 준비합니다. (예: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`)

4.  **`.env` 파일 생성:**
    프로젝트 루트 디렉토리에 `.env` 파일을 생성합니다. (존재하는 경우, `.env.example` 파일을 복사하여 사용하거나 아래 내용을 참고하여 작성합니다.)
    ```env
    DATABASE_URL="your_local_postgres_connection_string" # 예: postgresql://user:password@localhost:5432/inventory_db
    JWT_SECRET="your_very_strong_and_secret_jwt_key"    # 강력한 비밀키로 변경하세요
    PORT=3001                                           # 백엔드 서버 포트
    VITE_API_URL=http://localhost:3001/api              # 프론트엔드가 백엔드 API를 호출할 URL
    ```

5.  **데이터베이스 마이그레이션:**
    Prisma를 사용하여 데이터베이스 스키마를 적용합니다.
    ```bash
    npx prisma migrate deploy
    ```
    (개발 중 스키마 변경이 잦을 경우 `npx prisma migrate dev` 사용 가능)

6.  **백엔드 서버 실행:**
    다음 명령어로 백엔드 개발 서버를 시작합니다. (아직 `package.json`에 `dev:server` 스크립트가 없다면 추가 필요)
    ```bash
    # package.json에 "dev:server": "ts-node-dev --respawn --transpile-only src/server/index.ts" 와 같이 추가 가정
    npm run dev:server
    ```
    기본적으로 `http://localhost:3001` 에서 실행됩니다.

7.  **프론트엔드 개발 서버 실행:**
    다음 명령어로 프론트엔드 개발 서버(Vite)를 시작합니다. (아직 `package.json`에 `dev:client` 스크립트가 없다면 추가 필요)
    ```bash
    # package.json에 "dev:client": "vite --config vite.config.ts --port 3000" 와 같이 추가 가정 (Vite가 src 폴더 기준이 아닐 경우 경로 조정 필요)
    npm run dev:client
    ```
    기본적으로 `http://localhost:3000` 에서 실행되며, 백엔드 API (`http://localhost:3001/api`)와 통신합니다.

    **Note on Local Builds:** Both the backend build (`npm run build`) and frontend build (`npm run build:frontend`) output to the root `dist/` directory. If you are building both locally without Docker, ensure you clean the `dist/` directory between builds or configure Vite's `outDir` in `vite.config.ts` (e.g., to `dist-frontend`) to avoid conflicts.

## Running Tests

프로젝트의 테스트를 실행하려면 다음 명령어를 사용합니다:

```bash
npm run test
```
이 명령어는 Jest 테스트 스위트를 실행하여 서비스 로직의 정확성을 검증합니다.
