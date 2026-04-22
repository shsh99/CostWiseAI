# DB Backed Portfolio Summary

## 기준 브랜치

- 기준: `dev` (`63dd92a`, PR #63 병합 후 최신)
- 작업 브랜치: `feat/54-db-portfolio-summary`
- 선택 이유: #54 잔여 범위 중 포트폴리오 목록 API를 DB 기반으로 전환하는 백엔드 슬라이스를 프론트 변경과 분리해 충돌을 줄인다.

## 워킹트리 비교

- 변경 전: `/api/portfolio/summary`는 `PortfolioSummaryService`의 고정 seed(`PROJECTS`)만 사용했다.
- 변경 후: `ProjectPersistenceRepository`에서 프로젝트 목록을 읽어 DB 기반 요약을 우선 생성하고, DB 조회 실패/빈 결과일 때 기존 seed 요약으로 폴백한다.
- DB 경로에서는 시나리오/분석/승인로그를 조합해 project/headquarter/overview/audit 이벤트를 계산한다.
- API 계약(`PortfolioSummaryResponse` 필드 구조)은 유지한다.

## 검증

- `backend`: `.\gradlew.bat test --tests com.costwise.service.PortfolioSummaryServiceTest --tests com.costwise.service.CostAccountingServiceTest --tests com.costwise.service.ValuationRiskServiceTest --tests com.costwise.api.workflow.WorkflowControllerSecurityTest --tests com.costwise.workflow.ApprovalWorkflowServiceTest`

## 리스크/후속

- 프로젝트 상태(`draft/in_review/...`)와 화면 상태(`검토중/조건부 진행/...`) 간 1:1 매핑 정보가 스키마에 완전하지 않아 일부는 가정 매핑을 사용한다.
- 본부/리스크는 valuation assumptions 메타데이터가 없으면 코드 prefix/기본값으로 폴백한다.
