# 2026-04-24 Issue #46 Reference Dummy DB Seed

## Scope
- Branch: `feat/46-reference-dummy-seed`
- Goal: `C:\Users\ggg99\Desktop\CostWiseAI\webapp` 레퍼런스 더미데이터(5본부/20프로젝트 축)를 우리 Postgres(Supabase) 시드에 이식하고, 백엔드 DB 조회 경로에서 바로 노출되도록 정리.

## A/B Comparison
- A안: 기존 `supabase/seed.sql` 유지(보험 도메인 시드), 프론트/백엔드 코드만 조정.
  - 장점: 변경량 적음.
  - 단점: 레퍼런스 데이터 축과 괴리, DB 연결 후 보이는 데이터가 레퍼런스와 다름.
- B안: `webapp` 더미데이터를 우리 스키마에 맞게 변환해 `supabase/seed.sql`/`reset_seed.sql`을 갱신하고, 코드에서 신규 본부 코드 매핑(HQ01~HQ05)을 수용.
  - 장점: 레퍼런스 데이터 축 반영, DB 시드 후 즉시 조회 가능.
  - 단점: 시드 SQL 변경 범위 큼.

선택: **B안**

## Changes
- `supabase/seed.sql`
  - 본부 5개를 `HQ01~HQ05` + 레퍼런스 본부명으로 교체.
  - 프로젝트 20개를 레퍼런스 프로젝트명/예산 축으로 교체.
  - `users`, `workflow_states`, `audit_logs` 시드 추가.
  - truncate 대상에 `users`, `audit_logs` 포함.
- `supabase/reset_seed.sql`
  - reset 대상에 `users`, `audit_logs` 포함.
- `backend/src/main/java/com/costwise/service/PortfolioSummaryService.java`
  - DB 기반 `ownerDepartment` 코드 매핑에 `HQ01~HQ05` 추가.
  - 본부명→코드 역매핑에 `HQ01~HQ05` 추가.

## Validation
- `backend`: `./gradlew.bat test` 통과.
- 시드 파일 점검:
  - `seed.sql`에 `users`, `workflow_states`, `audit_logs` insert 존재 확인.
  - `reset_seed.sql`에 동일 테이블 truncate 포함 확인.

## Notes
- 레퍼런스 `webapp/seed.sql`은 SQLite 문법(`INSERT OR IGNORE`) 기반이므로, Postgres 스키마에 맞춰 값/컬럼을 재매핑했다.
