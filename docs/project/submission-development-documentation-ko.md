# CostWiseAI 제출용 개발 문서

작성일: 2026-04-26  
문서 버전: v1.0

## 1. 시스템 개요

CostWiseAI는 프론트엔드(React), 백엔드(Spring Boot), 데이터/인증(Supabase)로 구성된 3계층 구조다.  
핵심 목적은 원가관리회계 데이터와 금융평가 데이터를 동일 프로젝트 식별자로 연결하고, 승인/감사 이력까지 API 기반으로 일관 관리하는 것이다.

## 2. 기술 스택

- Frontend: React 18, TypeScript, Vite, Tailwind CSS
- Backend: Java 21, Spring Boot 3.x, Spring Security, Spring JDBC
- Database/Auth: Supabase PostgreSQL, Supabase Auth(JWT)
- Build/Quality: npm, ESLint, Gradle, JUnit
- Deployment: Cloudflare Pages(Frontend), Railway(Backend)

## 3. 아키텍처

```text
[Client: React SPA]
        |
        v
[Spring Boot API]
        |
        v
[Supabase Postgres + Auth(JWT)]
```

### 3.1 프론트엔드 책임

- 대시보드/포트폴리오/원가/평가/리뷰/사용자 화면 렌더링
- 사용자 입력값 검증 및 API 호출
- 역할 기반 메뉴/기능 노출 제어

### 3.2 백엔드 책임

- JWT 인증 및 역할 기반 인가 정책 적용
- 원가/평가/워크플로우 도메인 로직 계산 및 제공
- 감사 로그, 프로젝트/시나리오/워크플로우 상태 영속화

### 3.3 데이터 계층 책임

- 운영 데이터 저장(`projects`, `scenarios`, `workflow_states`, `audit_logs`, `users`)
- Supabase Auth 기반 토큰 발급 및 검증 연계

## 4. 백엔드 모듈 구성

### 4.1 API 계층

- `com.costwise.api.dashboard.DashboardController`
- `com.costwise.api.compute.ComputeController`
- `com.costwise.api.workflow.WorkflowController`
- `com.costwise.api.audit.AuditLogController`
- `com.costwise.api.users.UsersController`
- `com.costwise.api.auth.AuthController`
- `com.costwise.api.persistence.PersistenceController`

### 4.2 서비스 계층

- `PortfolioSummaryService`: 포트폴리오 KPI 집계
- `CostAccountingService`: 원가관리회계 요약/배부 분석
- `ValuationRiskService`: 가치평가 및 리스크 지표 산출
- `DcfValuationService`: DCF 기반 가치 산출
- `ApprovalWorkflowService`: 승인 상태 전이 및 리뷰 처리
- `AuditLogService`: 감사 로그 처리
- `PersistenceService`: 프로젝트/시나리오 저장 로직

### 4.3 리포지토리 계층

- `JdbcProjectPersistenceRepository`
- `JdbcWorkflowStateRepository`
- `JdbcAuditLogRepository`
- `JdbcUserRepository`

## 5. 보안 설계

### 5.1 인증/인가

- Supabase JWT 기반 인증
- Spring Security 정책(`SecurityConfig`)으로 엔드포인트별 권한 강제
- 주요 역할: `ADMIN`, `MANAGER`, `AUDITOR`

### 5.2 운영 보안 정책

- API 문서/액추에이터 공개 범위 환경변수로 제어
- CORS allowlist 최소화
- 서비스 키/비밀값 클라이언트 노출 금지

## 6. 데이터 모델 개요

주요 마이그레이션 파일(`supabase/migrations`) 기준 핵심 엔티티는 다음과 같다.

- 사용자/권한: `users`
- 프로젝트/시나리오: `projects`, `scenarios`
- 워크플로우: `workflow_states`
- 감사: `audit_logs`

관계는 프로젝트를 중심으로 시나리오/상태/감사 기록이 연결되는 구조이며, 사용자 권한이 접근 범위를 제어한다.

## 7. 핵심 API 목록

- `GET /api/dashboard`
- `GET /api/portfolio/summary`
- `GET /api/cost-accounting/summary`
- `GET /api/valuation-risk/projects/{projectId}`
- `POST /api/compute`
- `GET|POST /api/persistence/**`
- `GET|POST /api/audit-logs`
- `GET|POST|PUT /api/users/**`
- `POST /api/auth/login`
- `GET|POST /api/projects/{id}/workflow`, `POST /api/projects/{id}/review`

## 8. 프론트엔드 구현 구조

`frontend/src` 기준으로 화면은 기능 단위로 분리되어 있다.

- `views/dashboard`: KPI 요약
- `views/portfolio`: 프로젝트 상세/분석
- `views/accounting`: 원가관리 화면
- `views/reviews`: 승인/감사 확인
- `views/users`: 사용자 관리
- `views/auth`: 로그인

공통 컴포넌트는 `shared/components`, 스타일은 `styles/tailwind.css` 기준으로 관리한다.

## 9. 품질 검증 및 테스트

### 9.1 백엔드 테스트

- 단위/통합 테스트: `.\gradlew.bat test`
- 주요 검증 축: 보안 정책/권한, 워크플로우 상태 전이, 원가/평가 계산 서비스, JDBC 영속화

### 9.2 프론트엔드 검증

- 정적 분석: `npm run lint`
- 빌드 검증: `npm run build`

### 9.3 변경 이력 관리

- 개발 변경 근거는 `docs/dev-logs/*.md`에 기록
- 기능 단위 검증 결과와 리스크를 함께 문서화

## 10. 배포/운영

### 10.1 환경

- Frontend URL: `https://costwiseai-frontend.pages.dev`
- Backend URL: `https://costwiseai-production.up.railway.app`
- API 문서: `/swagger-ui/index.html`, `/v3/api-docs`

### 10.2 운영 점검 항목

- 헬스체크: `/api/health`, `/actuator/health`
- 인증서버/DB 연결 상태 확인
- 권한별 API 접근 및 감사로그 생성 여부 확인

## 11. 향후 개선 과제

1. 원가 입력/배부 UI 고도화 및 사용자 피드백 반영
2. 평가 모델/시나리오 확장(고급 리스크 지표 포함)
3. 운영 모니터링/자동화 강화(CI, 관측성 대시보드)
