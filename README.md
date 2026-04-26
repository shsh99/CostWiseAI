# CostWiseAI

**금융 의사결정을 위한 통합 원가·평가 분석 플랫폼**

![Status](https://img.shields.io/badge/Status-Production-green)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Spring%20Boot%20%7C%20PostgreSQL-blue)
![License](https://img.shields.io/badge/License-MIT-orange)

> 보험·금융 도메인의 원가 관리, 프로젝트 평가, 의사결정 이력을 단일 플랫폼에서 관리합니다.  
> 원가배부(ABC), 가치평가(DCF), 리스크 지표(VaR)를 통합하고 권한 기반 승인 체계로 추적 가능성을 확보합니다.

---

## 🎯 핵심 기능

| 기능 | 설명 |
|------|------|
| **포트폴리오 대시보드** | 본부별, 프로젝트별 원가·수익성 KPI 요약 |
| **원가 분석** | ABC 기반 원가배부 및 원가 차이 분석 |
| **금융 평가** | DCF 기반 가치평가, VaR·Duration·Convexity 리스크 지표 |
| **시나리오 분석** | 시나리오별 프로젝트 가치 변화 시뮬레이션 |
| **승인 워크플로우** | 역할 기반 검토·승인 프로세스 및 감사 추적 |
| **감사 로그** | 모든 의사결정의 권한·이력·근거 기록 |

---

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────┐
│         Cloudflare Pages (Frontend)                 │
│  React 18 + TypeScript + Tailwind CSS               │
└──────────────────┬──────────────────────────────────┘
                   │ HTTPS API
┌──────────────────▼──────────────────────────────────┐
│      Railway (Spring Boot Backend)                  │
│  • Java 21 / Spring Boot 3.x                        │
│  • Spring Security (JWT)                            │
│  • 도메인 계산 (원가·평가·리스크)                    │
│  • 감사 로그 / 워크플로우                            │
└──────────────────┬──────────────────────────────────┘
                   │ JDBC
┌──────────────────▼──────────────────────────────────┐
│      Supabase (PostgreSQL + Auth)                   │
│  • 운영 데이터 영속화                               │
│  • JWT 토큰 발급                                    │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 배포 및 접속

### 운영 환경

| 구성 | URL |
|------|-----|
| **Frontend** | https://costwiseai-frontend.pages.dev |
| **Backend API** | https://costwiseai-production.up.railway.app |
| **API 명세** | https://costwiseai-production.up.railway.app/swagger-ui |
| **Health Check** | https://costwiseai-production.up.railway.app/api/health |


---

## 📊 권한별 기능

| 권한 | 접근 가능 기능 |
|------|---|
| **ADMIN** | 모든 API + 감사 로그 + 사용자 관리 |
| **PLANNER** | 대시보드 · 포트폴리오 · 원가 · 평가 · 워크플로우 |
| **FINANCE_REVIEWER** | 재무 검토 · 평가 분석 · 워크플로우 리뷰 |
| **EXECUTIVE** | 최종 승인 결정 · 감사 로그 조회 |
| **PM** | 프로젝트 단위 조회 · 평가 · 워크플로우 참여 |
| **ACCOUNTANT** | 원가 · 관리회계 · 포트폴리오 조회 |
| **AUDITOR** | 감사 로그 중심 접근 |

---

## 🛠️ 기술 스택

### Frontend
- **Framework**: React 18, TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS
- **State**: React Query, Zustand
- **API Client**: Axios

### Backend
- **Runtime**: Java 21
- **Framework**: Spring Boot 3.x, Spring Security
- **Data Access**: Spring JDBC
- **API Docs**: Springdoc OpenAPI (Swagger UI)
- **Auth**: Supabase JWT

### Infrastructure
- **Database**: PostgreSQL (Supabase)
- **Frontend Hosting**: Cloudflare Pages
- **Backend Hosting**: Railway
- **Container**: Docker

---

## 📁 프로젝트 구조

```
CostWiseAI/
├── frontend/                    # React 애플리케이션
│   ├── src/
│   │   ├── components/          # UI 컴포넌트
│   │   ├── pages/               # 페이지 레이아웃
│   │   ├── services/            # API 클라이언트
│   │   ├── hooks/               # Custom React Hooks
│   │   └── App.tsx              # 메인 앱
│   ├── .env.local               # 환경변수 (로컬)
│   └── package.json
│
├── backend/                     # Spring Boot API
│   ├── src/main/java/
│   │   └── com/costwiseai/
│   │       ├── controller/      # REST 엔드포인트
│   │       ├── service/         # 비즈니스 로직
│   │       ├── domain/          # 도메인 모델 (원가·평가·리스크)
│   │       ├── config/          # Spring 설정 (보안·CORS)
│   │       └── repository/      # 데이터 영속화
│   ├── build.gradle             # 의존성 관리
│   └── application.yml          # Spring 설정
│
├── supabase/                    # DB 마이그레이션 & 시드
│   ├── migrations/              # SQL 스키마
│   └── seed.sql                 # 초기 데이터
│
├── docs/                        # 설계·운영 문서
│   ├── architecture.md          # 아키텍처 상세 설명
│   ├── api-guide.md             # API 사용 가이드
│   ├── deployment.md            # 배포 절차
│   └── dev-logs/                # 개발 로그
│
├── DEPLOYMENT.md                # 배포 안내
└── README.md                    # 이 파일
```

---

## 🏃 빠른 시작

### 사전 요구사항

- **Node.js** 20+ 
- **Java** 21
- **PostgreSQL** 또는 Supabase 계정
- **npm** 또는 **yarn**

### 1️⃣ 저장소 클론

```bash
git clone https://github.com/shsh99/CostWiseAI.git
cd CostWiseAI
git checkout dev
```

### 2️⃣ 환경변수 설정

**Frontend** (`frontend/.env.local`)
```env
VITE_API_BASE_URL=http://127.0.0.1:8080
VITE_API_ACCESS_TOKEN=your_test_token_here
```

**Backend** (셸 환경변수 또는 `application.yml`)
```bash
export SUPABASE_JDBC_URL=jdbc:postgresql://db.supabase.co/postgres?sslmode=require
export SUPABASE_DB_USERNAME=postgres
export SUPABASE_DB_PASSWORD=your_password
export SUPABASE_JWT_SECRET_BASE64=your_base64_secret
export SUPABASE_JWT_ISSUER_URI=https://your-project.supabase.co/auth/v1
export SUPABASE_JWT_AUDIENCE=authenticated
```

### 3️⃣ 로컬 실행

**Frontend**
```bash
cd frontend
npm install
npm run dev
# http://localhost:5173에서 접속 가능
```

**Backend** (다른 터미널에서)
```bash
cd backend
./gradlew bootRun
# http://localhost:8080/api/health에서 확인
```

### 4️⃣ 동작 확인

```bash
# Frontend 접속
open http://localhost:5173

# Backend API 명세
open http://localhost:8080/swagger-ui

# 헬스 체크
curl http://localhost:8080/api/health
```

---

## 📚 API 엔드포인트

### 대시보드 & 포트폴리오
```
GET  /api/dashboard                    # 전체 대시보드 요약
GET  /api/portfolio/summary            # 포트폴리오 KPI
```

### 원가 분석
```
GET  /api/cost-accounting/summary      # 원가 요약
GET  /api/cost-accounting/detail       # 원가 상세 (본부별·프로젝트별)
```

### 금융 평가 & 리스크
```
GET  /api/valuation-risk/projects/{projectId}    # 프로젝트 평가·리스크 지표
GET  /api/valuation-risk/scenarios                # 시나리오별 분석
```

### 워크플로우 & 승인
```
GET  /api/projects/{id}/workflow               # 승인 상태 조회
POST /api/projects/{id}/submit-review          # 검토 요청
POST /api/review/{id}/approve                  # 승인
POST /api/review/{id}/reject                   # 반려
```

### 감사 로그
```
GET  /api/audit-logs                   # 감사 로그 조회 (권한 제한)
POST /api/audit-logs                   # 감사 로그 등록 (권한 제한)
```

### 사용자 & 인증
```
GET  /api/users                        # 사용자 목록 (ADMIN만)
POST /api/users                        # 사용자 생성 (ADMIN만)
```

**Swagger 접속**: http://localhost:8080/swagger-ui

---

## 🔒 보안

### 인증 & 인가
- **JWT 기반 토큰**: Supabase에서 발급
- **역할 기반 접근 제어 (RBAC)**: 7개 권한 역할 정의
- **API 엔드포인트별 권한 검증**: Spring Security로 강제

### 데이터 보호
- **CORS**: 운영 도메인만 허용
- **HTTPS Only**: 모든 통신 암호화
- **민감한 시크릿**: `.gitignore`로 추적 제외

### 운영 체크포인트
```
✅ APP_SECURITY_DOCS_PUBLIC=false        # Swagger 공개 제한
✅ APP_SECURITY_ACTUATOR_ALL_PUBLIC=false # Actuator 공개 제한
✅ service_role 키: 프론트 미노출
✅ JWT issuer/secret: Supabase 운영값
```

---

## 🚢 배포

### 전체 배포 절차

**1. Supabase 준비**
```bash
# 마이그레이션 적용
supabase migration up

# 초기 데이터 로드
psql -d $SUPABASE_JDBC_URL < supabase/seed.sql
```

**2. Backend 배포 (Railway)**
```bash
# Railway 환경변수 설정 (웹 대시보드)
# - SUPABASE_JDBC_URL
# - SUPABASE_DB_USERNAME
# - SUPABASE_DB_PASSWORD
# - SUPABASE_JWT_SECRET_BASE64 등

# Git push 시 자동 배포
git push origin dev
```

**3. Frontend 배포 (Cloudflare Pages)**
```bash
# 환경변수 설정 (Cloudflare 대시보드)
# - VITE_API_BASE_URL=https://costwiseai-production.up.railway.app

# Git push 시 자동 배포
git push origin dev
```

**상세 가이드**: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 📖 문서

| 문서 | 설명 |
|------|------|
| [DEPLOYMENT.md](./DEPLOYMENT.md) | 배포 상세 절차 및 트러블슈팅 |
| [docs/architecture.md](./docs/architecture.md) | 시스템 아키텍처 및 설계 원리 |
| [docs/api-guide.md](./docs/api-guide.md) | API 사용 가이드 및 예제 |
| [docs/dev-logs/](./docs/dev-logs/) | 개발 진행 로그 및 회의록 |

---

## 🤝 협업 규칙

### 브랜치 전략
```
main          → 릴리스 (프로덕션 안정 버전)
dev           → 통합 (다음 릴리스 후보)
feat/*        → 기능 개발
fix/*         → 버그 수정
chore/*       → 설정·의존성 변경
docs/*        → 문서 작성
```

### Pull Request 체크리스트
- [ ] 범위 최소화 (단일 슬라이스)
- [ ] 로컬 테스트 완료
- [ ] 검증 로그 포함
- [ ] 변경 이유 및 리스크 명시
- [ ] 코드 리뷰 완료

### AI 협업 방식
이 프로젝트는 AI를 단순 코드 생성이 아닌 **운영 체계**로 활용합니다:
- **작업 분해**: 슬라이스 단위 계약 기반
- **오케스트레이션**: 병렬·순차 작업 관리
- **검증 루프**: 차단 이슈(보안·품질·회귀) 판정
- **문서화**: 의사결정 근거 기록

자세히 보기: [docs/ai-collaboration.md](./docs/ai-collaboration.md)

---

## 📊 프로젝트 현황

### 구현 범위
- ✅ 대시보드 & 포트폴리오 API
- ✅ 원가 분석 (ABC 기반 배부)
- ✅ 금융 평가 (DCF/VaR)
- ✅ 승인 워크플로우
- ✅ 감사 로그 시스템
- ✅ 권한 기반 접근 제어
- ✅ 프로덕션 배포

### 개발 현황
| 구성 | 상태 |
|------|------|
| Frontend | ✅ Production Ready |
| Backend | ✅ Production Ready |
| Database | ✅ Production Ready |
| CI/CD | ✅ Cloudflare Pages + Railway Auto Deploy |

---

## 💡 주요 설계 결정

### 1. 원가 + 평가 통합
**문제**: 원가 데이터와 평가 결과가 분절되어 의사결정 근거 추적이 어려움

**해결**: 동일 프로젝트 ID를 기준으로 데이터 연결, 대시보드에서 함께 조회

### 2. 권한 기반 워크플로우
**문제**: 승인자마다 역할이 다르지만 일괄 처리되는 문제

**해결**: RBAC 모델로 역할별 접근 범위 정의, API 레벨에서 강제

### 3. 감사 추적
**문제**: 누가, 언제, 무엇을 기준으로 의사결정했는지 기록 부족

**해결**: 모든 주요 액션에 감사 로그 기록, 권한자만 조회 가능

---

## 📄 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능

---


<div align="center">

[⬆ 맨 위로](#costwiseai)

</div>
