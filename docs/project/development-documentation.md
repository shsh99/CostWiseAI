# CostWiseAI 개발문서 (Development Documentation)

## 1) 기술 스택

- Frontend: React 18, TypeScript, Vite
- Backend: Java 21, Spring Boot 3.x
- DB/Auth: Supabase PostgreSQL, Supabase Auth(JWT)
- 배포: Frontend(Cloudflare Pages), Backend(Spring Runtime)

## 2) 아키텍처 개요

- 프론트는 API 응답을 기준으로 Portfolio/Workspace/Reviews 화면을 렌더링한다.
- 백엔드는 도메인 서비스(원가/평가/워크플로우)와 API 컨트롤러로 구성된다.
- 영속화 계층은 JDBC 기반 리포지토리로 projects/scenarios/analysis/approval/workflow 상태를 저장한다.

## 3) 주요 도메인/모듈

- `PortfolioSummaryService`: 포트폴리오/프로젝트 요약
- `CostAccountingService`: 원가관리회계 요약(배부 기준/드라이버/차이)
- `ValuationRiskService`: 금융평가/리스크/신용위험
- `ApprovalWorkflowService`: 승인 상태 전이 및 감사 연동
- `PersistenceService` + `JdbcProjectPersistenceRepository`: 분석 데이터 CRUD
- `JdbcWorkflowStateRepository`: 워크플로우 상태 영속화

## 4) 데이터/엔티티 관점

- 프로젝트/시나리오: `projects`, `scenarios`
- 원가/배분: `cost_pools`, `allocation_rules`, `departments`
- 현금흐름/평가: `cash_flows`, `valuation_results`
- 승인/감사: `approval_logs`, `audit_logs`, `workflow_states`

## 5) API 관점(핵심)

- `/api/portfolio/summary`
- `/api/persistence/projects/{id}`
- `/api/cost-accounting/summary`
- `/api/valuation-risk/projects/{id}`
- `/api/projects/{id}/workflow`, `/api/projects/{id}/review`
- `/api/audit-logs`

## 6) 품질/검증 체계

- Backend: `.\gradlew.bat test`
- Frontend: `npm run lint`, `npm run build`
- 변경 단위마다 `docs/dev-logs/*.md`로 근거/검증/리스크 기록

## 7) 브랜치/PR 운영

- 브랜치: `feat/*` 중심
- 기준 브랜치: `dev`
- PR 본문은 템플릿 기반(요약/변경/이유/검증/체크리스트)
- 완료 조건을 충족한 이슈만 close

## 8) 현재 남은 핵심 작업 축

- #49: 원가 입력 UX/API 고도화(현재는 근거 가시화 1차까지 반영)
- #51: 평가 모델/시나리오 구조 심화(현재는 근거 데이터 노출 1차까지 반영)
- #46: 디자인 레퍼런스 반영
