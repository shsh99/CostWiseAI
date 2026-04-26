# 2026-04-24 issue46 api data loading fix

## Context
- Issue: #46 follow-up
- Goal: resolve dashboard/detail/user/audit API loading gaps seen in local integration.

## A/B comparison
- A) Keep strict 기존 권한/DB 경로를 유지하고 프론트 토큰만 변경
  - Pros: server code changes are minimal
  - Cons: 일부 핵심 화면 API(요약/상세/사용자)에서 403/500/timeout이 남음
- B) 권한 매트릭스와 DB 연결 해석을 보정하고 요약 경로를 경량화
  - Pros: 화면 데이터 미로딩 원인을 서버에서 제거
  - Cons: backend service/security/config 수정 필요
- Selected: B

## Changes
- `SecurityConfig`: `ADMIN` role can access business summary endpoints.
- `PersistenceController`: `ADMIN` role can access `/api/persistence/**`.
- `AuditPersistenceProperties`: PostgreSQL password resolution guard and fallback behavior refined.
- `PortfolioSummaryService`: DB-backed summary path simplified to avoid slow multi-query loading path.
- Tests:
  - added `AuditPersistencePropertiesTest`
  - updated `PortfolioSummaryServiceTest` expectations to the new summary projection behavior.

## Verification
- `backend`: `./gradlew.bat test` passed.
- Runtime checks:
  - `/api/portfolio/summary` returns `200`
  - `/api/users` returns `200`
  - `/api/audit-logs` returns `200`
  - `/api/persistence/projects/{id}` returns `200`

## Risks
- Project detail endpoint is still slower than summary and may need further query optimization in next slice.
