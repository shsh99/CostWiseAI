# API First Frontend + Workflow Persistence

## 기준 브랜치

- 기준: `dev` (`f89723f`, PR #64 병합 상태)
- 작업 브랜치: `feat/issue-54-api-and-workflow-persistence`
- 선택 이유: #54의 잔여 항목(프론트 API 중심 전환)과 재시작 내구성 이슈(워크플로우 인메모리 상태 제거)를 한 번에 닫기 위한 통합 슬라이스

## 워킹트리 비교

- 변경 전:
  - 프론트 로더가 API 실패 시 로컬 seed/로컬 fallback 데이터를 반환
  - 워크플로우 상태가 `ApprovalWorkflowService` 내부 메모리 맵에 저장되어 재시작 시 소실
- 변경 후:
  - 프론트는 API-first로 동작하고, 실패 시에는 fallback 데이터 주입 대신 `degraded` 상태와 재시도 UI를 노출
  - 워크플로우 상태는 `workflow_states` 테이블에 영속화(`WorkflowStateRepository`, `JdbcWorkflowStateRepository`)
  - Supabase 마이그레이션/시드 reset에 `workflow_states` 반영

## 검증

- `frontend`: `npm run lint` 통과
- `frontend`: `npm run build` 통과
- `backend`: `.\gradlew.bat test` 통과

## 리스크/후속

- `portfolioData.ts` 내부 seed 기반 default 생성 함수는 여전히 존재하므로, #54 완전 종료를 위해 seed 정의 자체 축소/제거를 후속으로 분리 검토
- `WorkflowControllerSecurityTest`는 영속 테이블 스키마 의존이 생겼으므로, 추후 테스트용 공통 schema fixture 도입 시 중복 DDL 정리 가능
