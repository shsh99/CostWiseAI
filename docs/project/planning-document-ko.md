# CostWiseAI 기획서
## 금융 의사결정 지원 통합 플랫폼

📌 **Executive Summary**  
CostWiseAI는 보험·금융사의 프로젝트 투자 의사결정 프로세스를 지원하기 위해 설계된 통합 플랫폼이다.  
원가관리회계(ABC 기반 원가배부, 원가분석)와 금융평가(DCF, 리스크 지표)를 단일 시스템에서 일관되게 운영하고, 모든 의사결정의 근거와 이력을 추적할 수 있도록 한다.

핵심 가치

- ✅ 통합된 데이터 기준: 동일 프로젝트를 기획자·재무검토자·임원이 같은 근거로 검토
- ✅ 추적 가능한 의사결정: 결과값뿐 아니라 입력값, 계산 근거, 변경 이력을 기록
- ✅ 역할 기반 워크플로우: 기획 → 검토 → 승인의 프로세스를 시스템으로 강제
- ✅ AI 협업 운영 체계: LLM의 확률적 출력을 하네스 엔지니어링으로 통제

문서 버전: v1.0  
작성일: 2026-04-26  
최종 수정일: 2026-04-26

## 1. 문제 정의

### 1.1 기존 프로세스의 한계

문제 1. 데이터 분절  
원가 데이터는 회계팀 시스템에, 평가 데이터는 재무팀 엑셀에 흩어져 있다. 동일 프로젝트의 수치가 시스템마다 다르게 나타나 의사결정의 정확성·신뢰성이 저하된다.

문제 2. 추적성 부족  
원가 배부 기준과 가정값이 문서로만 관리된다. 누가, 언제, 어떤 근거로 판단했는지 기록이 없어 사후 재검토 시 의사결정 과정 재구성이 어렵다.

문제 3. 프로세스 비효율  
기획자가 작성한 안건이 재무검토자에게 전달되는 과정에서 수정 요청이 반복되고, 검토 의견이 기획자에게 제대로 전달되지 않아 수정 작업이 비효율적이다. 감사자는 감사 추적을 위해 여러 시스템에 접근해야 한다.

### 1.2 본 프로젝트의 출발점

작성자는 경영학 전공 과정에서 관리회계와 재무관리를 학습하며, 동일 사업 단위를 원가 관점과 평가 관점에서 동시에 봐야 함에도 시스템이 분절되어 있다는 점을 문제로 인식했다. CostWiseAI는 이 문제의식을 풀스택 + LLM 운영 체계로 풀어낸 결과물이다.

## 2. 목표 및 기대효과

### 2.1 프로젝트 목표

| 목표 | 설명 |
| --- | --- |
| 통합 데이터 플랫폼 구축 | 원가·평가·리스크 데이터를 단일 데이터베이스에서 관리 |
| 의사결정 근거 가시화 | 계산 근거(입력값·계산식·가정)를 화면에서 직접 확인 |
| 감사 추적 시스템 | 모든 주요 액션을 권한·시간·내용과 함께 기록 |
| 역할 기반 워크플로우 | 기획→검토→승인 프로세스를 시스템으로 강제 |
| AI 협업 운영 체계 | LLM 산출물의 일관성·검증 가능성을 코드 변경 시점부터 강제 |

### 2.2 기대효과

- 정량 KPI(가설, 1차 운영 후 측정 예정): 의사결정 사이클 단축, 원가 데이터 오류 감소, 감사 대응 가시성 확보
- 선행 프로젝트(MZC-LMS 인턴십)에서 동일 방법론(컨텍스트 표준화 + 검증 게이트)으로 환각·컨벤션 위반 약 70% 감소를 측정
- 본 프로젝트에서도 동등 수준의 품질 개선을 목표로 함
- 정성 효과: 의사결정의 투명성·신뢰성 향상, 조직 내 원가 인식 개선, 임원 레벨 의사결정 신속화

## 3. 사용자 및 역할

### 3.1 역할 정의 (RBAC)

요청 기준에 따라 역할 권한을 아래 5개로 정의한다.

| 역할 | 권한 | API 접근 |
| --- | --- | --- |
| `PLANNER` | 프로젝트 생성/수정 + 검토 요청 | `GET /api/portfolio`, `POST /api/projects`, `POST /api/projects/{id}/submit-review` |
| `FINANCE_REVIEWER` | 원가/평가 검증 + 검토 의견 | `GET /api/cost-accounting`, `GET /api/valuation-risk`, `POST /api/review/{id}/approve` |
| `EXECUTIVE` | 최종 승인/반려 + 감사 로그 등록 | `POST /api/review/{id}/approve` (최종), `POST /api/audit-logs` |
| `ADMIN` | 모든 권한 + 사용자 관리 | 모든 API |
| `AUDITOR` | 감사 로그 조회 | `GET /api/audit-logs` |

## 4. 핵심 기능

### 4.1 포트폴리오 대시보드

```text
┌─────────────────────────────────────────┐
│   포트폴리오 현황 대시보드               │
├─────────────────────────────────────────┤
│ • 전체 프로젝트 수                       │
│ • 총 투자금 / 기대 수익                  │
│ • 평균 NPV / IRR / Payback              │
│ • 평균 리스크 (VaR)                      │
├─────────────────────────────────────────┤
│ 본부별 현황 (표)                         │
│ 프로젝트별 평가 (차트)                  │
│ 의사결정 대기 건 (목록)                 │
│ 분석 가정(Assumption) 패널              │
│ 감사 이벤트 타임라인                    │
└─────────────────────────────────────────┘
```

표시 정보는 본부별 원가 집계 및 배부 현황, 프로젝트별 NPV/IRR/회수기간, 리스크 지표(VaR·Duration·Convexity), 승인 대기 건 알림, 최근 감사 이벤트(actor·action·domain·at)다.

### 4.2 원가 분석 (Cost Accounting)

```text
프로젝트 상세 분석
├─ 원가 배부 근거
│  ├─ 비용풀 (Cost Pool): 직접비, 간접비
│  ├─ 배부 드라이버: 인건비, 운영시간
│  └─ 배부율: 간접비/직접비 = 1.5배
├─ 원가 구성
│  ├─ 본부A 배당액: ₩50M
│  ├─ 본부B 배당액: ₩30M
│  └─ 본부C 배당액: ₩20M
└─ 원가 변화 (시나리오 비교)
   ├─ 기본 시나리오: ₩100M
   ├─ 낙관 시나리오: ₩80M (-20%)
   └─ 비관 시나리오: ₩130M (+30%)
```

핵심 요소는 ABC(Activity-Based Costing) 기반 원가배부, 배부 근거(드라이버)의 투명한 노출, 원가 차이 분석(예산 vs 실제), 시나리오별 원가 민감도 분석이다.

### 4.3 금융 평가 (Valuation & Risk)

```text
프로젝트 평가 분석 (단일 응답 모델)
├─ ProjectValuation
│  ├─ NPV / IRR / Payback / Outlook
├─ ValuationBasis
│  ├─ 할인율 / 리스크 프리미엄 / 담당 부서
│  └─ 시나리오 가정 (label·NPV·확률·note)
├─ StockValuation
│  └─ 종목·현재가·공정가·Upside·배당수익률
├─ BondValuation
│  └─ 종목코드·가격·Macaulay/Modified Duration·Convexity
├─ DerivativeValuation
│  └─ 계약코드·유형·공정가·내재가치·시간가치
├─ RiskMetrics
│  └─ 평균·표준편차·VaR95·VaR99·ES95·시나리오 값 배열
└─ CreditRisk
   └─ 점수·등급
```

핵심 요소는 DCF 기반 가치평가, VaR(Value at Risk) 리스크 측정, Duration/Convexity(금리민감도), 자산 클래스별 평가(주식·채권·파생), 시나리오별 가치 변화 추적이다.

### 4.4 승인 워크플로우

```text
프로젝트 승인 흐름
┌─────────────┐
│  기획자      │  1. 안건 작성 & 제출
│  (Planner)  │
└──────┬──────┘
       │ 제출
       ↓
┌──────────────────┐
│ 재무검토자       │  2. 원가/평가 검증
│ (Finance Review) │     피드백 제공
└──────┬───────────┘
       │ 승인 의견
       ↓
┌──────────────────┐
│ 임원             │  3. 최종 판단
│ (Executive)      │     승인/반려
└──────┬───────────┘
       │
       ↓
┌──────────────────┐
│ 감사 로그        │  4. 의사결정 기록
│ (Audit Log)      │
└──────────────────┘
```

기획자가 프로젝트/시나리오를 제출해 검토를 요청하면, 재무검토자가 검토하여 코멘트 또는 승인 의견을 제공한다. 기획자는 피드백을 반영해 재제출(필요 시 반복)하며, 임원이 최종 승인/반려를 결정한다. 시스템은 모든 액션을 감사 로그로 자동 기록한다.

### 4.5 감사 추적 (Audit Trail)

```text
감사 로그 예시
┌──────────────────────────────────────────────────────┐
│ 액션           │ 사용자  │ 시간        │ 상세         │
├──────────────────────────────────────────────────────┤
│ 프로젝트 생성  │ 김기획  │ 2026-04-20 │ Project A    │
│ 안건 제출      │ 김기획  │ 2026-04-21 │ v1.0         │
│ 코멘트 작성    │ 이재무  │ 2026-04-22 │ "원가 재검토" │
│ 안건 수정      │ 김기획  │ 2026-04-23 │ v1.1         │
│ 검토 완료      │ 이재무  │ 2026-04-23 │ "승인 가능"   │
│ 최종 승인      │ 박임원  │ 2026-04-24 │ APPROVED     │
└──────────────────────────────────────────────────────┘
```

추적 항목은 누가(actor·user_id), 언제(timestamp), 무엇을(action), 어떻게(상세 내용·이전값/변경값), 왜(코멘트·근거)다.

## 5. 데이터 모델

### 5.1 핵심 엔티티

```text
Projects (프로젝트)
  ├─ project_id, name, description
  ├─ status (draft, submitted, in_review, approved, rejected)
  ├─ division_id (FK, 본부)
  ├─ created_by (FK, 기획자)
  └─ created_at, updated_at

Scenarios (시나리오)
  ├─ scenario_id, project_id (FK)
  ├─ name (Base Case, Bull Case, Bear Case)
  ├─ discount_rate, growth_rate
  └─ assumptions (JSONB)

CostPools (비용풀)
  ├─ cost_pool_id, name (직접비/간접비)
  ├─ amount, allocation_driver_id (FK)

AllocationRules (배부 규칙)
  ├─ rule_id, cost_pool_id (FK), driver_id (FK)
  ├─ target_department_id (FK), allocation_rate

CashFlows (현금흐름)
  ├─ cash_flow_id, scenario_id (FK)
  ├─ period, inflow, outflow, net_flow

ValuationResults (평가 결과)
  ├─ valuation_id, scenario_id (FK)
  ├─ npv, irr, payback_period
  └─ var_95, duration, convexity

ApprovalWorkflows (승인 워크플로우)
  ├─ workflow_id, project_id (FK)
  ├─ current_stage, assigned_to, status

AuditLogs (감사 로그)
  ├─ log_id, entity_type, entity_id
  ├─ action, actor_id, timestamp
  ├─ old_value (JSONB), new_value (JSONB), comment
```

## 6. 시스템 아키텍처

### 6.1 전체 아키텍처

```text
┌─────────────────────────────────────────────────────┐
│                  사용자 (브라우저)                   │
│   기획자 / 재무검토자 / 임원 / 감사자 / 관리자       │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS + JWT Bearer
┌────────────────────▼────────────────────────────────┐
│  Cloudflare Pages — Frontend (React 18 + TS)        │
│   • 포트폴리오 대시보드                              │
│   • 프로젝트 상세 분석 (원가/평가/리스크)            │
│   • 워크플로우 UI / 감사 로그 조회                   │
└────────────────────┬────────────────────────────────┘
                     │ REST API
┌────────────────────▼────────────────────────────────┐
│  Railway — Backend (Spring Boot 3.x + Java 21)      │
│   Controllers → Services → Repositories             │
│   Spring Security (Supabase JWT Resource Server)    │
└────────────────────┬────────────────────────────────┘
                     │ JDBC (TLS)
┌────────────────────▼────────────────────────────────┐
│  Supabase — PostgreSQL + Auth                       │
│   운영 데이터 영속화 / JWT 토큰 발급                 │
└─────────────────────────────────────────────────────┘
```

### 6.2 핵심 모듈

| 모듈 | 책임 | 핵심 기능 |
| --- | --- | --- |
| PortfolioSummary | 대시보드 집계 | 본부별·프로젝트별 KPI 요약 |
| CostAccounting | 원가 분석 | ABC 배부, 원가 차이 분석 |
| ValuationRisk | 금융 평가 | DCF, VaR, Duration/Convexity, 자산 클래스별 평가 |
| ApprovalWorkflow | 워크플로우 관리 | 상태 전이, 담당자 할당 |
| AuditLog | 감사 추적 | 모든 액션 기록 및 조회 |
| Security | 인증/인가 | Supabase JWT 기반 RBAC |

## 7. 추진 계획

### 7.1 Phase별 추진 (구현 상태 표기: ✅ 완료 / 🟡 부분 완료 / ⬜ 설계만)

1. Phase 1 — 기초 구축
- ✅ 데이터 모델 설계
- ✅ Backend 기본 구조 (패키지 분리)
- ✅ Frontend 기본 레이아웃 (Vite + Tailwind)
- ✅ 대시보드 API 구현 (`/api/dashboard`, `/api/portfolio/summary`, `/api/health`)
- ✅ Swagger UI 노출 (Springdoc)

2. Phase 2 — 핵심 기능 구현
- ✅ 포트폴리오 KPI 응답 모델 (`PortfolioSummaryResponse`)
- ✅ 평가·리스크 통합 응답 모델 (`ValuationRiskResponse`)
- ✅ Compute API (`POST /api/compute`)
- ✅ Audit Log API 기초 구현
- 🟡 원가 분석 상세 API/UI 고도화
- 🟡 시나리오 관리 UI 고도화
- 🟡 워크플로우 고급 전이/운영 UX 개선

3. Phase 3 — 운영 고도화
- 🟡 감사 로그 조회 UI 고도화(필터/페이징 강화)
- 🟡 사용자 관리 Admin UX 고도화
- ⬜ 성능 최적화(캐싱·인덱싱 정교화)
- ✅ 배포 파이프라인 자동화(Cloudflare Pages + Railway)

4. Phase 4 — 검증 및 론칭
- ⬜ 사용성 테스트 체계화
- ⬜ 보안 감사(외부 점검 포함)
- ⬜ 실제 데이터 로드 테스트 확장
- ✅ MVP 운영 환경 배포

## 8. 성공 기준

### 8.1 기능적 기준

| 기준 | 판단 |
| --- | --- |
| 동일 프로젝트 수치 일관성 | 프론트·백엔드·DB 수치 동일 |
| 의사결정 근거 추적 | 입력값·계산식·이력 화면에서 확인 가능 |
| 워크플로우 자동화 | 상태 전이·검토 흐름 작동 |
| 권한 기반 접근 | 역할별 접근 범위 강제 |

### 8.2 비기능적 기준

| 기준 | 목표 |
| --- | --- |
| 성능 | 대시보드 API 응답 시간 < 1초(목표) |
| 가용성 | 99.5% uptime(목표) |
| 보안 | OWASP Top 10 준수, 감사 로그 누락 0건 |
| 확장성 | 데이터 증가 대응 가능한 구조 유지 |

## 9. 위험 및 대응

| 위험 | 영향 | 대응 |
| --- | --- | --- |
| 데이터 불일치 | 높음 | 중앙 DB 중심 설계, 정밀 계산/검증 |
| LLM 산출물 편차 | 높음 | 하네스 엔지니어링(스킬·에이전트·QA 게이트) |
| 성능 저하 | 중간 | 캐싱 전략, 인덱싱 최적화 |
| 보안 취약 | 높음 | 보안 감사, 침투 테스트, Swagger·Actuator 비공개 |
| 사용자 채택 부진 | 중간 | 사용성 테스트, 사용자 교육 |

## 10. 참고 자료

- 저장소: [CostWiseAI](https://github.com/shsh99/CostWiseAI)
- 운영 환경(Frontend): [costwiseai-frontend.pages.dev](https://costwiseai-frontend.pages.dev)
- API Swagger: [production Swagger UI](https://costwiseai-production.up.railway.app/swagger-ui/index.html)
- Health Check: [production health](https://costwiseai-production.up.railway.app/api/health)
- 배포 가이드: `DEPLOYMENT.md`
- AI 협업 가이드: `docs/ai-collaboration.md`
