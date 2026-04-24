# 2026-04-24 - issue46 parity + project detail optimization

## 브랜치/워크트리

- base: `dev`
- work branch: `feat/46-parity-and-project-detail-optimization`
- reason: #46의 잔여 화면 정합(프로젝트/가치평가-리뷰/가이드)과 프로젝트 상세 API 지연 이슈를 한 슬라이스에서 같이 닫기 위해 분리 브랜치 사용

## A/B 비교와 선택

- A안(프론트): 레퍼런스와 동일하게 보이도록 기존 화면을 전면 재작성
- B안(프론트): 현재 Tailwind 구조를 유지하고 레퍼런스와 다른 카피/액션/정보구조만 정밀 보정
- 선택: B안
- 선택 이유: 기존 #46 슬라이스에서 이미 Tailwind 전환이 진행되어 있어 재작성보다 보정이 회귀 위험이 낮고 범위 통제가 쉬움

- A안(백엔드): `getProjectDetail` 경로를 조인 기반 단일 쿼리로 대폭 재구성
- B안(백엔드): 시나리오별 분석 조회에서 커넥션 재사용으로 연결 오버헤드만 우선 절감
- 선택: B안
- 선택 이유: API 계약/도메인 구조를 바꾸지 않고 지연 핵심 원인(반복 connection open)을 바로 줄일 수 있어 안정적

## 변경 요약

- 프론트
  - 프로젝트 목록 화면에 CSV 내보내기 액션 추가 및 레퍼런스 톤에 맞춘 카피 정합
  - 리뷰 화면을 카드 + 감사로그 테이블 구조로 개선
  - 가이드 화면을 실제 운영 절차(프로젝트 선택 → 가치평가/리스크 확인 → 감사 검증) 중심으로 보강
- 백엔드
  - `JdbcProjectPersistenceRepository.findAnalysis`에서 단일 커넥션으로 배분/현금흐름/가치평가 조회 재사용
  - 상세 조회 다중 시나리오 회귀 방지 테스트 추가

## 검증

- frontend
  - `npm run lint` ✅
  - `npm run build` ✅
- backend
  - `.\gradlew.bat test` ✅

## 성능 관찰

- 프로젝트 상세 경로에서 시나리오별 분석 조회의 커넥션 오픈 횟수
  - before: `3N + 3`
  - after: `N + 3`
  - `N`은 시나리오 수

## 남은 리스크

- `getProjectDetail`의 시나리오당 쿼리 수(배분/현금흐름/가치평가)는 유지되어, 대규모 시나리오 데이터에서는 추가 최적화 여지 존재
- `DriverManager` 기반 접근은 유지되어 고동시성 환경의 풀링 최적화는 후속 슬라이스 필요
