# Valuation Basis Phase 1

## 기준 브랜치

- 기준: `dev` (`7f161da`)
- 작업 브랜치: `feat/issue-51-valuation-basis-phase1`
- 선택 이유: #51을 단계적으로 진행하기 위해, 평가 근거 데이터/시나리오 구조를 API와 화면에 먼저 노출

## 워킹트리 비교

- 변경 전:
  - `/api/valuation-risk/projects/{id}`는 평가 수치 중심 응답이며 할인율/리스크프리미엄/해석/시나리오 근거 메타데이터가 부족
  - 프론트 금융평가 탭은 결과 수치 위주로 표시되어 평가 근거 설명력이 제한됨
- 변경 후:
  - `ValuationRiskResponse`에 `valuationBasis`(discountRate, riskPremium, ownerDepartment, interpretation, scenarioAssumptions) 추가
  - `ValuationRiskService`에서 프로젝트 리스크 수준 기반 할인율/리스크프리미엄과 시나리오 가정 구조를 함께 생성
  - 프론트 상세 모델(`ProjectDetail.valuation`)에 평가근거 필드 반영
  - 금융평가 탭에 평가 근거/시나리오 가정 섹션 추가

## 검증

- `backend`: `.\\gradlew.bat test` 통과
- `frontend`: `npm run lint` 통과
- `frontend`: `npm run build` 통과

## 리스크/후속

- #51의 “프로젝트 평가/금융상품 평가의 공통·개별 모델 정교화”는 후속 단계에서 입력 모델/API 분리 수준으로 확장 필요
- 현재 시나리오 가정은 서비스 내부 생성값이므로, 저장된 시나리오 입력과 직접 연결하는 작업은 추가 필요
