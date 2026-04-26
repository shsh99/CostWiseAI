# CostWiseAI

![Status](https://img.shields.io/badge/status-MVP%20Live-22c55e)
![Frontend](https://img.shields.io/badge/frontend-React%2018.3.1-61dafb)
![Backend](https://img.shields.io/badge/backend-Spring%20Boot%203.3.4-6db33f)
![License](https://img.shields.io/badge/license-MIT-blue)

- Frontend: [costwiseai-frontend.pages.dev](https://costwiseai-frontend.pages.dev)
- Swagger UI: [costwiseai-production.up.railway.app/swagger-ui/index.html](https://costwiseai-production.up.railway.app/swagger-ui/index.html)
- Health: [costwiseai-production.up.railway.app/api/health](https://costwiseai-production.up.railway.app/api/health)
- OpenAPI JSON: [costwiseai-production.up.railway.app/v3/api-docs](https://costwiseai-production.up.railway.app/v3/api-docs)

보험·금융사의 투자 의사결정은 원가(ABC), 가치평가(DCF), 리스크(VaR)가 ERP·엑셀·메일에 분산돼 추적이 어렵습니다.  
CostWiseAI는 이 세 축을 단일 프로젝트 ID로 통합하고, 모든 주요 액션을 감사 로그에 남겨 의사결정의 근거와 책임 소재를 가시화합니다.

## What Is CostWiseAI

- 원가관리회계 + 금융평가 통합 의사결정 플랫폼
- 5개 본부, 20개 프로젝트 운영 시나리오 기반
- 승인 워크플로우와 감사 추적을 API/DB 수준에서 강제

## Screenshots

아래 경로에 스크린샷을 배치하면 README에서 바로 노출됩니다.

- `docs/screenshots/dashboard.png`
- `docs/screenshots/valuation-risk.png`
- `docs/screenshots/workflow.png`
- `docs/screenshots/workflow-demo.gif` (선택)

```md
![Dashboard](docs/screenshots/dashboard.png)
![Valuation & Risk](docs/screenshots/valuation-risk.png)
![Approval Workflow](docs/screenshots/workflow.png)
![Workflow Demo](docs/screenshots/workflow-demo.gif)
```

## Architecture

```text
[Cloudflare Pages: Frontend]
            |
            v
[Railway: Spring Boot API + JWT Validation]
            |
            v
[Supabase Postgres + Supabase Auth]
```

## Role & Access

### 기획서 기준 역할 정의 (5역할)

| Role | 권한 | API 접근 |
| --- | --- | --- |
| `PLANNER` | 프로젝트 생성/수정 + 검토 요청 | `GET /api/portfolio`, `POST /api/projects`, `POST /api/projects/{id}/submit-review` |
| `FINANCE_REVIEWER` | 원가/평가 검증 + 검토 의견 | `GET /api/cost-accounting`, `GET /api/valuation-risk`, `POST /api/review/{id}/approve` |
| `EXECUTIVE` | 최종 승인/반려 + 감사 로그 등록 | `POST /api/review/{id}/approve`, `POST /api/audit-logs` |
| `ADMIN` | 모든 권한 + 사용자 관리 | 모든 API |
| `AUDITOR` | 감사 로그 조회 | `GET /api/audit-logs` |

### 현재 SecurityConfig 기준 접근 정책

- 비즈니스 API: `ADMIN`, `MANAGER`, `PLANNER`, `PM`, `FINANCE_REVIEWER`, `ACCOUNTANT`, `EXECUTIVE`
- 감사 로그 API: `ADMIN`, `AUDITOR`, `EXECUTIVE`
- 워크플로우 API: 인증 사용자 접근

## API Implementation Status (2026-04-26)

| API | Status | 비고 |
| --- | --- | --- |
| `GET /api/health` | ✅ | 공개 헬스체크 |
| `GET /api/dashboard` | ✅ | 포트폴리오 KPI |
| `GET /api/portfolio/summary` | ✅ | 요약 데이터 |
| `GET /api/cost-accounting/summary` | ✅ | 원가 요약 |
| `GET /api/valuation-risk/projects/{projectId}` | ✅ | 평가/리스크 |
| `POST /api/compute` | ✅ | 계산 실행 |
| `GET|POST /api/persistence/**` | ✅ | 프로젝트/시나리오 영속화 |
| `GET /api/projects/{id}/workflow` | ✅ | 상태 조회 |
| `POST /api/projects/{id}/review` | ✅ | 리뷰 전이 |
| `GET|POST /api/audit-logs` | 🟡 | 고급 필터/페이지네이션 보강 예정 |
| `GET|POST|PUT|DELETE /api/users/**` | ✅ | 사용자 관리 |

## Tech Stack (Exact Versions)

### Frontend

- React `18.3.1`
- React DOM `18.3.1`
- TypeScript `5.6.3`
- Vite `5.4.9`
- Tailwind CSS `3.4.13`
- Chart.js `4.5.1`
- lucide-react `1.11.0`

### Backend

- Java `21`
- Spring Boot `3.3.4`
- Spring Security `6.x` (via Boot 3.3.4)
- Spring JDBC
- Springdoc OpenAPI Starter `2.6.0`
- PostgreSQL Driver (runtime)

### Infrastructure

- Frontend Hosting: Cloudflare Pages
- Backend Hosting: Railway
- Database/Auth: Supabase PostgreSQL + Supabase Auth

## Quick Start

### Prerequisites

- Node.js `20+`
- npm `10+`
- Java `21`

### Clone

```bash
git clone https://github.com/shsh99/CostWiseAI.git
cd CostWiseAI
git checkout dev
```

### Frontend Env (`frontend/.env.local`)

```env
VITE_API_BASE_URL=http://127.0.0.1:8080
```

### Backend Env (shell)

```bash
SUPABASE_DATABASE_URL=postgresql://...
SUPABASE_JDBC_URL=jdbc:postgresql://.../postgres?sslmode=require
SUPABASE_DB_USERNAME=...
SUPABASE_DB_PASSWORD=...
SUPABASE_JWT_ISSUER_URI=https://<project-ref>.supabase.co/auth/v1
SUPABASE_JWT_AUDIENCE=authenticated
SUPABASE_JWT_SECRET_BASE64=<base64_secret>
```

### Run

```bash
cd frontend && npm install && npm run dev
```

```powershell
cd backend
.\gradlew.bat bootRun
```

### Smoke Check

- Frontend: `http://localhost:5173`
- API Health: `http://127.0.0.1:8080/api/health`
- Login API: `POST http://127.0.0.1:8080/api/auth/login`
- Seed users:
  - `admin / admin123`
  - `cfo / user123`
  - `analyst / user123`
  - `viewer / user123`

```powershell
powershell -ExecutionPolicy Bypass -File scripts/auth-login-smoke.ps1 -ApiBaseUrl "http://127.0.0.1:8080" -Username "admin" -Password "admin123"
```

## Quality Gates

- Backend tests: JUnit 5 기반 자동 테스트 `18`개 (`backend/src/test/java`)
- Frontend checks: ESLint + TypeScript build (`npm run lint`, `npm run build`)
- Pre-commit/CI에서 차단 이슈를 우회하지 않는 정책 운영

## AI Collaboration - Harness Engineering

CostWiseAI의 차별점은 코드 생성 자체가 아니라 `AI 협업 운영 체계`입니다.

- `.codex/` 구조: `agents = who`, `skills = how`
- 하네스 워크플로우: Audit → Analysis → Team Design → Agent/Skill 설계 → Orchestration → QA → Evolution
- QA Inspector 원칙: API/타입/라우팅/상태머신의 `boundary-cross validation`

자세한 내용: `docs/ai-collaboration.md`

## Repository Structure

```text
CostWiseAI/
├─ frontend/
├─ backend/
├─ supabase/
├─ docs/
├─ scripts/
├─ DEPLOYMENT.md
└─ README.md
```

## Documentation

- 기획서: `docs/project/planning-document-ko.md`
- 개발 문서: `docs/project/technical-implementation-guide-ko.md`
- 제출용 기획서: `docs/project/submission-planning-brief-ko.md`
- 제출용 개발 문서: `docs/project/submission-development-documentation-ko.md`
- AI 협업 가이드: `docs/ai-collaboration.md`
- 오케스트레이터 플레이북: `docs/ops/orchestrator-agent-playbook.md`
- 워크트리 전략: `docs/worktree-strategy.md`
- 배포 가이드: `DEPLOYMENT.md`

## Security Notes

- JWT issuer/audience/secret은 운영값으로 관리
- CORS allowlist 최소화
- Supabase `service_role` 키 프론트 노출 금지
- Swagger/Actuator 공개 범위는 환경변수 정책으로 제어

## License

MIT License. See `LICENSE`.

## Contact

- Maintainer: [@shsh99](https://github.com/shsh99)
- Issues: [GitHub Issues](https://github.com/shsh99/CostWiseAI/issues)
