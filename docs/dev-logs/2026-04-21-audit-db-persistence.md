# 2026-04-21 Audit DB Persistence (#40)

## Scope

- Issue: `#40 [후속] 감사 이벤트 DB 영속화(Supabase/Postgres)`
- Branch/worktree: `feat/40-audit-db-persistence`
- Goal: 인메모리 감사 로그를 DB 영속화로 전환하고 append-only/필터 정합성/마스킹 저장 경로를 보장

## A/B Comparison

### A. 인메모리 저장 유지 + API 레이어 보강

- 장점: 변경 범위가 작고 빠름
- 단점: 재기동 시 유실 문제를 해결하지 못해 이슈 목표 미충족

### B. JDBC Repository + Supabase 마이그레이션

- 장점: 재기동 내구성 확보, 필터/커서 로직을 DB 정렬 기준으로 일관화, 운영 이행 가능
- 단점: 연결 설정/테스트 정합성 보강 필요

### Selected

- **B 선택**
- 이유: 이슈 수용 기준(영속 저장, 필터 조회, append-only 보장)을 충족하는 유일한 경로

## Implementation Notes

- `AuditLogService`를 저장소 추상화(`AuditLogRepository`) 기반으로 전환
- `JdbcAuditLogRepository` 추가:
  - append insert
  - `projectId/eventType/from/to/cursor(id<cursor)` 필터 쿼리
  - `id desc` 정렬 + limit 조회
- `AuditPersistenceProperties`/`AuditPersistenceConfig` 추가:
  - `app.persistence.jdbc-url` 또는 `app.persistence.supabase-url` 해석
  - SSL mode 옵션 반영
  - 테스트(H2) 공백 비밀번호 허용
- `supabase/migrations/002_audit_logs.sql` 추가:
  - `audit_logs` 테이블/인덱스
  - `lower(event_type)` 조회 인덱스
  - update/delete 차단 트리거로 DB 레벨 append-only 보강
- 민감정보 마스킹은 기존 `AuditLogService.sanitize(...)` 경로를 유지해 DB 저장 전 적용

## Verification

- Targeted tests:
  - `./gradlew.bat test --tests com.costwise.service.JdbcAuditLogRepositoryTest --tests com.costwise.api.AuditLogControllerTest --tests com.costwise.service.ApprovalWorkflowServiceTest --tests com.costwise.api.WorkflowControllerSecurityTest`
  - 결과: **PASS**
- Full backend check:
  - `./gradlew.bat check`
  - 결과: **PASS**
- Supabase remote apply (CLI):
  - `npx supabase db push --db-url ...`
  - `002_audit_logs.sql` 적용 로그 확인

## Residual Risks

- Pooler(6543) 경로에서 Supabase CLI 재조회 시 prepared statement 충돌이 발생할 수 있어, 최종 운영 검증은 대시보드 SQL 확인을 병행하는 것이 안전
- 현재 저장소는 직접 `DriverManager` 연결이므로 고부하 환경에서는 커넥션 풀 전환 검토 필요
