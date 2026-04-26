# CostWiseAI

CostWiseAI는 보험/금융 도메인에서 관리회계와 투자평가를 한 화면에서 연결해 의사결정을 지원하는 플랫폼입니다.
핵심은 `ABC 기반 원가배부`, `프로젝트 단위 가치평가(DCF/VaR)`, `권한 기반 승인/감사 추적`입니다.

## 프로젝트 개요

- 문제: 본부별 원가, 프로젝트별 수익성, 승인 이력이 분절되어 의사결정 근거 추적이 어렵습니다.
- 해결: 5개 본부/약 20개 프로젝트 기준으로 원가-가치-리스크-승인 이력을 통합 조회합니다.
- 플랫폼 성격: 원가/관리회계와 금융상품·프로젝트 평가를 단일 의사결정 플랫폼으로 통합

| 역할 | 설명 |
| --- | --- |
| `PLANNER` | 사업안 탐색/기획 |
| `FINANCE_REVIEWER` | 재무 관점 검토 |
| `EXECUTIVE` | 최종 승인/보류 의사결정 |

## 선정 주제와 통합 방식

본 프로젝트는 과제 주제 중 아래 2개를 동시에 선택해 구현했습니다.

| 선택 주제 | 플랫폼 내 구현 관점 |
| --- | --- |
| 원가/관리회계 | 본부/프로젝트 단위 원가 집계, 배부 근거, 원가 차이 분석 |
| 금융상품 및 프로젝트 평가 | 프로젝트별 가치평가(DCF), 리스크 지표(VaR/Duration/Convexity), 시나리오 기반 의사결정 |

통합 포인트:

- 동일 프로젝트 ID를 기준으로 원가 데이터와 평가 데이터를 연결 조회
- 대시보드에서 원가 KPI와 평가 KPI를 함께 조회
- 승인/감사 로그를 통해 회계 근거와 평가 결과의 의사결정 이력 추적

## 핵심 기능

- 포트폴리오 대시보드: 본부/프로젝트 KPI 요약
- 프로젝트 상세 분석: 원가 배부 근거 및 차이 분석
- 금융 평가: DCF/VaR 기반 리스크 지표와 시나리오별 가치 변화
- 승인/감사: 승인 워크플로우 및 감사 로그 추적
- 사용자/권한: 역할 기반 API 접근 제어

## 기술 스택

- Frontend: React 18, TypeScript, Vite, Tailwind CSS
- Backend: Java 21, Spring Boot 3.x, Spring Security, Spring JDBC
- Database/Auth: Supabase PostgreSQL, Supabase Auth (JWT)
- Deployment: Frontend(Cloudflare Pages), Backend(Railway), DB/Auth(Supabase)

## 리포지토리 구조

```text
CostWiseAI/
├─ frontend/                 # React 앱
├─ backend/                  # Spring Boot API
├─ supabase/                 # DB migrations, seed
├─ docs/                     # 설계/운영/개발 로그/협업 문서
├─ railway.json              # Railway 배포 설정
├─ .railwayignore            # Railway 업로드 제외
└─ DEPLOYMENT.md             # 배포 상세 가이드
```

## 아키텍처

```text
[Cloudflare Pages: frontend]
          |
          v
[Railway: Spring Boot API]
          |
          v
[Supabase Postgres + Auth]
```

- Frontend: UI 렌더링, API 호출, 사용자 인터랙션 처리
- Backend: 인증/인가, 도메인 계산, 감사 로그, DB 영속화
- Supabase: Postgres(운영 데이터 저장), Auth(JWT 발급)

## 운영 배포 정보

- Frontend(접속 주소): `https://costwiseai-frontend.pages.dev`
- Backend: `https://costwiseai-production.up.railway.app`
- Health: `https://costwiseai-production.up.railway.app/actuator/health`, `https://costwiseai-production.up.railway.app/api/health`
- Swagger/OpenAPI(접속 가능): `https://costwiseai-production.up.railway.app/swagger-ui/index.html`, `https://costwiseai-production.up.railway.app/v3/api-docs`

## 현재 동작 범위 (운영 기준)

아래 범위는 현재 배포본에서 동작 확인된 기능입니다.

| 구분 | 현재 상태 |
| --- | --- |
| 대시보드/포트폴리오 요약 (`/api/dashboard`, `/api/portfolio/summary`) | 동작 |
| 원가 요약 API (`/api/cost-accounting/summary`) | 동작 |
| 프로젝트별 평가/리스크 API (`/api/valuation-risk/projects/{projectId}`) | 동작 |
| 계산 API (`/api/compute`) | 동작 |
| 프로젝트/시나리오 영속화 API (`/api/persistence/**`) | 동작 |
| 승인 워크플로우 (`/api/projects/{id}/workflow`, `/review`) | 동작 |
| 감사 로그 조회/등록 (`/api/audit-logs`) | 동작 (권한 제한) |
| 사용자 관리 (`/api/users`) | 동작 |
| 헬스체크 (`/api/health`, `/actuator/health`) | 동작 |

참고:

- 프론트는 API 실패 시 일부 화면에서 폴백 데이터를 사용할 수 있도록 구성되어 있습니다.
- Swagger는 `APP_SECURITY_DOCS_PUBLIC` 설정에 따라 접근이 제한될 수 있습니다.

## 권한별 사용 가능 기능

백엔드 정책(`SecurityConfig`) 기준으로 주요 기능 접근은 아래와 같습니다.

| 권한 | 사용 가능 기능 |
| --- | --- |
| `ADMIN` | 모든 비즈니스 API + 감사 로그 API + 사용자 관리 |
| `PLANNER` | 대시보드/포트폴리오/원가/평가/계산/워크플로우 조회 및 리뷰 요청 |
| `FINANCE_REVIEWER` | 대시보드/원가/평가/계산/워크플로우 검토 |
| `PM` | 프로젝트 단위 조회/평가/워크플로우 참여 |
| `ACCOUNTANT` | 원가/관리회계 중심 API + 포트폴리오/평가 조회 |
| `EXECUTIVE` | 비즈니스 API + 감사 로그 조회/등록 + 승인 의사결정 |
| `AUDITOR` | 감사 로그 API 중심 접근 |

정책 요약:

- 비즈니스 API: `ADMIN`, `PLANNER`, `PM`, `FINANCE_REVIEWER`, `ACCOUNTANT`, `EXECUTIVE`
- 감사 로그 API: `ADMIN`, `EXECUTIVE`, `AUDITOR`
- 워크플로우 리뷰 API: 인증 사용자 접근

## 로컬 실행

### 0) 다운로드(클론)

```bash
git clone https://github.com/shsh99/CostWiseAI.git
cd CostWiseAI
git checkout dev
```

### 0-1) 사전 준비

- Node.js 20+
- Java 21
- npm

### 0-2) 환경변수 준비

Frontend(`frontend/.env.local`) 예시:

```env
VITE_API_BASE_URL=http://127.0.0.1:8080
VITE_API_ACCESS_TOKEN=<테스트용_토큰>
```

Backend(실행 셸 환경변수) 예시:

```bash
SUPABASE_DATABASE_URL=postgresql://...
SUPABASE_JDBC_URL=jdbc:postgresql://.../postgres?sslmode=require
SUPABASE_DB_USERNAME=...
SUPABASE_DB_PASSWORD=...
SUPABASE_JWT_ISSUER_URI=https://<project-ref>.supabase.co/auth/v1
SUPABASE_JWT_AUDIENCE=authenticated
SUPABASE_JWT_SECRET_BASE64=<base64_secret>
```

### 1) Frontend

```bash
cd frontend
npm install
npm run dev
```

### 2) Backend

```bash
cd backend
./gradlew bootRun
```

### 3) 기본 확인

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:8080/api/health`

## 배포 절차 요약

1. Supabase 마이그레이션/시드 적용
2. Railway에 백엔드 환경변수 설정 후 배포
3. Cloudflare Pages에 프론트 배포 (백엔드 URL 반영)

상세 절차: [DEPLOYMENT.md](/C:/Users/ggg99/Desktop/CostWiseAI/CostWiseAI/DEPLOYMENT.md)

## 보안/운영 체크포인트

- JWT issuer/secret은 Supabase 운영값 사용
- CORS allowlist를 운영 도메인으로 최소화
- `service_role` 키는 프론트에 노출 금지
- `APP_SECURITY_DOCS_PUBLIC=false`, `APP_SECURITY_ACTUATOR_ALL_PUBLIC=false` 유지
- 로컬 비밀파일은 `.gitignore`로 추적 제외

## AI 활용 방법

AI는 단순 코드 생성이 아니라, `작업 분해`, `오케스트레이션`, `검증 루프`, `문서화`를 포함한 개발 운영 체계로 사용합니다.

핵심 참고 문서:

- [AI Collaboration Guide](/C:/Users/ggg99/Desktop/CostWiseAI/CostWiseAI/docs/ai-collaboration.md)
- [Orchestrator Agent Playbook](/C:/Users/ggg99/Desktop/CostWiseAI/CostWiseAI/docs/ops/orchestrator-agent-playbook.md)
- [Orchestrator Manager Automation](/C:/Users/ggg99/Desktop/CostWiseAI/CostWiseAI/docs/ops/orchestrator-manager-automation.md)
- [Worktree Strategy](/C:/Users/ggg99/Desktop/CostWiseAI/CostWiseAI/docs/worktree-strategy.md)

### 1) 하네스 사용 방식

- 하네스는 에이전트 역할과 책임을 분리한 실행 프레임워크입니다.
- 오케스트레이터가 범위를 고정하고, 워커는 단일 슬라이스만 구현합니다.
- 리뷰어는 차단 이슈(보안/품질/회귀)를 판정하며, 근거 없는 완료 선언을 허용하지 않습니다.

### 2) 오케스트레이션 방식

프로젝트에서 사용하는 기본 파이프라인:

1. 이슈/요구사항 분석과 우선순위 분류
2. 슬라이스 단위 작업 계약 확정(범위, 비대상 파일, 검증 명령)
3. 서브에이전트 할당(병렬/순차 결정)
4. 구현 결과 수집
5. QA/리뷰 게이트 통과 여부 판정
6. 실패 시 동일 슬라이스 재시도, 통과 시 다음 슬라이스 진행

실행 자동화는 `scripts/orchestrator-manager.ts`를 통해 dry-run/실행 모드로 운영합니다.

### 3) 워크트리 사용 방식

- `dev`를 기준으로 `feat/*` 브랜치마다 전용 worktree를 생성해 충돌을 줄입니다.
- 프론트/백엔드/DB/보안/문서 슬라이스를 분리해 병렬 작업 가능성을 높입니다.
- 비정상 종료/충돌 시 특정 worktree만 정리하면 되므로 복구 비용이 낮습니다.
- PR 전 `docs/dev-logs/`에 worktree 선택 근거와 검증 결과를 기록합니다.

### 4) 서브에이전트 팀 구성

현재 저장소의 운영 기준 팀 구성(예시):

- `agents-orchestrator`: 전체 파이프라인 통제, 우선순위/순서/게이트 결정
- `project-manager-senior`: 스펙을 실행 가능한 태스크로 분해
- `engineering-frontend-developer`: UI/상호작용 구현
- `engineering-backend-architect`: API/보안/영속화 구현
- `engineering-code-reviewer`: 코드 품질/회귀 리스크 리뷰
- `testing-api-tester`, `testing-test-results-analyzer`: API 검증 및 결과 분석
- `engineering-minimal-change-engineer`: 범위 최소화 패치와 안정화

### 5) 이 프로젝트에서의 AI 활용 성과

- 원가/관리회계 + 금융상품/프로젝트 평가 도메인을 슬라이스 단위로 병행 구현
- 배포 파이프라인(Cloudflare/Railway/Supabase) 설정 자동화 및 반복 검증
- 권한/보안/CORS 이슈를 운영 환경에서 탐지-수정-재배포까지 폐루프 처리
- 작업 근거를 문서(`docs/*`)와 PR로 남겨 재현 가능한 협업 체계 유지

## 협업 규칙

- 브랜치 전략: `main`(릴리스 안정화), `dev`(통합), `feat/*`/`fix/*`/`chore/*`/`docs/*`(작업 브랜치)
- PR 원칙:
- 범위 작은 슬라이스 유지
- 검증 로그 포함
- 변경 이유와 리스크 명시

## 이 README가 충족하는 항목

- [x] 프로젝트 소개
- [x] 프로젝트 구조
- [x] 아키텍처 설명
- [x] 배포 구조/실제 URL
- [x] Swagger/OpenAPI 접근 정보
- [x] AI 활용 방법
- [x] 협업 방법
