# CostWiseAI 개발 문서
## Technical Implementation Guide

📌 `Document Overview`  
이 문서는 CostWiseAI의 기술 구현 세부사항을 정의한다.  
대상 독자: Backend 개발자(Java/Spring Boot), Frontend 개발자(React/TypeScript), DevOps 엔지니어, QA 테스터.  
주요 차별점: 일반적인 기술 문서와 달리 본 문서는 AI 협업 운영 체계(하네스 엔지니어링)를 별도 챕터로 다룬다(§6).

작성일: 2026-04-26

## 1. 기술 스택

### 1.1 Frontend

| 계층 | 기술 | 버전 | 용도 |
| --- | --- | --- | --- |
| UI Framework | React | 18.x | 컴포넌트 기반 UI |
| Language | TypeScript | 5.x | 타입 안전성 |
| Build Tool | Vite | 5.x | 고속 빌드 |
| Styling | Tailwind CSS | 3.x | Utility-first CSS |
| Icon | lucide-react | 1.x | 아이콘 시스템 |
| Chart | Chart.js | 4.x | 데이터 시각화 |
| Deployment | Cloudflare Pages | - | 정적 배포 |

개발 환경: Node.js 20+, npm 10+

### 1.2 Backend

| 계층 | 기술 | 버전 | 용도 |
| --- | --- | --- | --- |
| Runtime | Java | 21 | 언어 |
| Framework | Spring Boot | 3.3.x | 웹 프레임워크 |
| Security | Spring Security | 6.x | 인증/인가 |
| Resource Server | OAuth2 Resource Server | 6.x | JWT 검증 |
| Data Access | Spring JDBC | - | DB 접근 (성능·쿼리 통제) |
| Validation | Jakarta Validation | 3.x | 입력 검증 |
| API Docs | Springdoc OpenAPI | 2.x | Swagger |
| JSON | Jackson | 2.x | JSON 처리 |
| Testing | JUnit 5 | 5.x | 테스트 |
| Deployment | Docker | - | 컨테이너 빌드/실행 |

개발 환경: Java 21(OpenJDK), Gradle 8.x, PostgreSQL 14+

### 1.3 Database & Auth

| 계층 | 기술 | 용도 |
| --- | --- | --- |
| DB | PostgreSQL 14+ | 관계형 데이터 저장 |
| Hosting | Supabase | 관리형 PostgreSQL + Auth |
| Auth | Supabase Auth | JWT 기반 인증 |
| Protocol | JDBC | Java DB 연결 |

### 1.4 Infrastructure

| 계층 | 서비스 | 용도 |
| --- | --- | --- |
| Frontend CDN | Cloudflare Pages | 정적 자산 배포 |
| Backend Hosting | Railway | 컨테이너 실행 환경 |
| Database | Supabase PostgreSQL | 데이터 영속화 |
| CI/CD | GitHub Actions + Auto Deploy | 자동 배포 |
| AI 협업 | `docs/ai-collaboration.md`, `harness` 자산 | 하네스 운영 규약 |

## 2. 시스템 아키텍처

### 2.1 계층형 아키텍처

```text
┌─────────────────────────────────────────────────────┐
│             Presentation Layer                      │
│  (React Components, Views, Shared UI)              │
└────────────────┬────────────────────────────────────┘
                 │ HTTP / REST API + JWT
┌────────────────▼────────────────────────────────────┐
│         API Layer (Controllers)                      │
│  • DashboardController                               │
│  • ComputeController                                 │
│  • AnalyticsController                               │
│  • PersistenceController                             │
│  • WorkflowController                                │
│  • AuditLogController                                │
│  • UsersController, AuthController                   │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│       Business Logic Layer (Services)               │
│  • PortfolioSummaryService                          │
│  • ComputeFacade                                    │
│  • CostAccountingService (ABC)                      │
│  • ValuationRiskService (DCF, VaR)                  │
│  • ApprovalWorkflowService                          │
│  • AuditLogService                                  │
│  • PersistenceService, UserService                  │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│       Data Access Layer (Repositories)              │
│  • JdbcProjectPersistenceRepository                 │
│  • JdbcWorkflowStateRepository                      │
│  • JdbcAuditLogRepository                           │
│  • JdbcUserRepository                               │
└────────────────┬────────────────────────────────────┘
                 │ JDBC (TLS)
┌────────────────▼────────────────────────────────────┐
│        Database Layer (PostgreSQL via Supabase)     │
└─────────────────────────────────────────────────────┘
```

### 2.2 실제 패키지 구조 (레포 기준)

```text
backend/src/main/java/com/costwise/
├── FinancePlatformApplication.java
├── api/
│   ├── analytics/        AnalyticsController
│   ├── audit/            AuditLogController
│   ├── auth/             AuthController
│   ├── common/           ApiExceptionHandler
│   ├── compute/          ComputeController
│   ├── dashboard/        DashboardController
│   ├── persistence/      PersistenceController
│   ├── users/            UsersController
│   ├── workflow/         WorkflowController
│   └── dto/              API 요청/응답 record
├── service/              계산·조회 서비스
├── persistence/          JDBC 영속화
├── workflow/             승인 워크플로우 서비스
├── audit/                감사 로그 도메인
├── user/                 사용자 관리 도메인
├── auth/                 로그인 처리
└── config/security/      보안·JWT·환경설정
```

설계 원칙:

1. DTO는 Java `record` 중심의 불변 모델
2. Controller는 얇게 유지하고 도메인 로직은 Service에 집중
3. DB 접근은 JDBC 리포지토리로 명시적 제어

### 2.3 주요 모듈별 책임

1. `PortfolioSummaryService`  
대시보드 집계와 KPI 계산을 담당한다.  
API: `GET /api/dashboard`, `GET /api/portfolio/summary`

2. `CostAccountingService`  
ABC 기반 원가 분석을 수행한다.  
API: `GET /api/cost-accounting/summary`

핵심 계산식:

```text
배부액 = 비용풀 금액 × (드라이버값 / 전체 드라이버값)
```

3. `ValuationRiskService`  
DCF 기반 가치평가와 리스크 지표를 계산한다.  
API: `GET /api/valuation-risk/projects/{projectId}`

DCF 계산:

```text
NPV = Σ [현금흐름(t) / (1 + 할인율)^t] - 초기투자
```

VaR 계산(정규분포 가정):

```text
VaR(95%) = 평균값 - 1.645 × 표준편차
```

4. `ApprovalWorkflowService`  
프로젝트 승인 상태 전이 및 리뷰 처리.  
API: `GET /api/projects/{id}/workflow`, `POST /api/projects/{id}/review`

5. `AuditLogService`  
감사 이벤트 적재/조회 담당.  
API: `GET /api/audit-logs`, `POST /api/audit-logs`

## 3. 데이터 모델 상세

핵심 스키마는 `supabase/migrations/001_init.sql`~`005_users_auth.sql`에 정의되어 있다.

주요 테이블:

1. `projects`: 프로젝트 메타, 상태
2. `scenarios`: 시나리오 가정/파라미터
3. `workflow_states`: 승인 상태 및 이력
4. `audit_logs`: 감사 이벤트
5. `users`: 사용자/역할/본부 정보

관계 요약:

```text
users 1 - n projects
projects 1 - n scenarios
projects 1 - n workflow_states
users 1 - n audit_logs
```

## 4. API 설계

### 4.1 구현 상태 표기 규칙

- `✅` 완료
- `🟡` 부분 구현/확장 예정
- `⬜` 설계만 완료

### 4.2 엔드포인트 상태

1. 대시보드/헬스 `✅`
- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/portfolio/summary`

2. 계산 API `✅`
- `POST /api/compute`

3. 평가/리스크 `✅`
- `GET /api/valuation-risk/projects/{projectId}`

4. 원가 분석 `✅`
- `GET /api/cost-accounting/summary`

5. 워크플로우 `✅`
- `GET /api/projects/{id}/workflow`
- `POST /api/projects/{id}/review`

6. 감사 로그 `🟡`
- `GET /api/audit-logs` (기본 조회 완료, 고급 필터/페이징 보강 여지)
- `POST /api/audit-logs` (시스템 내부 적재 경로 포함)

7. 사용자 관리 `✅`
- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/{id}`
- `PUT /api/users/{id}/password`
- `DELETE /api/users/{id}`

단일 진실 공급원(SSOT)은 운영 Swagger UI(`/swagger-ui/index.html`)를 사용한다.

## 5. 인증 & 인가 (Security)

### 5.1 JWT 기반 인증

```text
1) 사용자 로그인 (/api/auth/login)
2) Supabase 기반 JWT 발급/검증 정보 획득
3) Frontend가 Authorization: Bearer <token> 헤더로 API 호출
4) Spring Security Resource Server가 토큰 검증
   - issuer: SUPABASE_JWT_ISSUER_URI
   - audience: SUPABASE_JWT_AUDIENCE
   - signature: SUPABASE_JWT_SECRET_BASE64
```

백엔드는 상태 저장 세션 대신 토큰 검증 중심으로 동작한다.

### 5.2 RBAC

주요 역할:

- `ADMIN`: 전체 API + 사용자/권한 관리
- `MANAGER`: 대시보드/원가/평가/워크플로우 운영
- `AUDITOR`: 감사 로그 중심 조회

호환 역할(`PLANNER`, `PM`, `FINANCE_REVIEWER`, `ACCOUNTANT`, `EXECUTIVE`)은 보안 정책에서 함께 처리한다.

### 5.3 데이터 보호 체크포인트

1. `APP_SECURITY_CORS_ALLOWED_ORIGINS`로 운영 도메인 제한
2. HTTPS only
3. `APP_SECURITY_DOCS_PUBLIC=false`, `APP_SECURITY_ACTUATOR_ALL_PUBLIC=false` 권장
4. Supabase `service_role` 키 프론트 노출 금지

## 6. AI 협업 운영 체계 — Harness Engineering

CostWiseAI의 핵심 자산은 코드를 생성하는 단발 프롬프트가 아니라, AI 산출물의 편차를 통제하는 운영 체계다.

### 6.1 핵심 원칙

1. 에이전트와 스킬을 분리한다.
- 에이전트는 `누가(역할)`를 담당
- 스킬은 `어떻게(절차)`를 담당

2. 오케스트레이터만 완료 여부를 선언한다.

3. 구현과 검증을 분리한다.
- Worker 구현
- Spec/Quality/Security 리뷰
- QA 경계면 교차 검증

### 6.2 자산 위치

- 운영 가이드: `docs/ai-collaboration.md`
- 오케스트레이션: `docs/ops/orchestrator-agent-playbook.md`
- 개발 로그: `docs/dev-logs/*.md`
- 워크트리 전략: `docs/worktree-strategy.md`

### 6.3 하네스 워크플로우 요약

1. 범위 고정(Contract Freeze)
2. 슬라이스 단위 구현(Dispatch)
3. 결과 수집(Collect)
4. 리뷰 게이트(Gate)
5. 통합(Integrate)

핵심은 "존재 확인"이 아니라 "경계면 교차 비교"다.  
예: API 응답 필드와 프론트 타입/훅의 일치 여부를 동시에 검증한다.

### 6.4 검증 게이트

1. 로컬 게이트: pre-commit 훅, `npm run lint`, `npm run format:check`, `./gradlew check`
2. CI 게이트: GitHub Actions + AI PR review
3. 휴먼 게이트: PR 템플릿 기반 검증 로그/리스크 명시

차단 이슈를 `--no-verify`로 우회하지 않는 원칙을 적용한다.

## 7. 검증 및 운영 체크리스트

1. 로컬 실행
- Frontend: `cd frontend && npm install && npm run dev`
- Backend: `cd backend && .\gradlew.bat bootRun`

2. 품질 검증
- Frontend: `npm run lint`, `npm run build`
- Backend: `.\gradlew.bat test`, `.\gradlew.bat check`

3. 운영 확인
- Health: `/api/health`, `/actuator/health`
- Swagger: `/swagger-ui/index.html`
- 권한별 API 호출 및 감사로그 생성 확인

## 8. 향후 개선 항목

1. 원가 분석 상세 API(필터/드릴다운) 고도화
2. 감사로그 고급 검색/페이지네이션 강화
3. 워크플로우 상태 머신 시각화 및 운영 대시보드 추가
4. AI 하네스 성능 지표(리드타임, 결함 검출률) 정량 리포트화
