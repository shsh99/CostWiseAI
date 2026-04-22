# Cost Accounting Traceability Phase 1

## 기준 브랜치

- 기준: `dev` (`28dcf79`)
- 작업 브랜치: `feat/issue-49-cost-accounting-traceability`
- 선택 이유: #49를 한 번에 크게 바꾸기보다, 사용자 가시성이 높은 "배부 기준/계산 근거/변경 이력"을 먼저 안정적으로 반영

## 워킹트리 비교

- 변경 전:
  - 원가관리회계 화면에서 합계/지표는 보이지만 배부 기준과 계산식 설명, 변경 이력 노출이 제한적
  - 원가요약 API의 프로젝트 단위 응답에 배부 기준/드라이버/계산 근거 문구가 없음
- 변경 후:
  - `CostAccountingSummaryResponse.ProjectCostSummary`에 `allocationBasis`, `driverVolume`, `calculationTrace` 추가
  - `CostAccountingService`가 프로젝트별 배부 기준 문자열, 드라이버 볼륨, 계산식 추적 문구를 함께 제공
  - 프론트 관리회계 탭에서 배부 규칙 상세 테이블, 계산 근거, 최근 변경 이력(approval logs 기반) 표시

## 검증

- `backend`: `.\\gradlew.bat test` 통과
- `frontend`: `npm run lint` 통과
- `frontend`: `npm run build` 통과

## 리스크/후속

- #49의 "입력 화면/API 보강" 중 입력 작성 UX 자체는 후속 단계에서 별도 구현 필요
- 현재 변경 이력은 승인 로그 기반이며, 배부 규칙 단위의 세분화된 diff 이벤트 모델은 후속 도입 가능
