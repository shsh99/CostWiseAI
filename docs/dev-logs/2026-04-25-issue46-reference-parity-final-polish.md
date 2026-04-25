# 2026-04-25 - issue46 reference parity final polish

## 브랜치/범위

- base: `dev`
- work: `feat/46-reference-parity-final-polish`
- slice: 레퍼런스 대비 잔여 UI 정합 보정(공용 컴포넌트 + 프로젝트/가이드/가치평가/리스크 화면)

## A/B 비교와 선택

- A안: 개별 화면마다 직접 스타일 패치
- B안: 공용 컴포넌트(`InfoTile`, `Panel`, `DecisionBarChart`) 먼저 개선 후 화면 레벨 미세 조정
- 선택: B안
- 이유: 중복 스타일 패치를 줄이고 화면 간 일관성을 확보할 수 있어 유지보수에 유리

## 변경 요약

- 공용 UI 컴포넌트 시각 밀도 보강
  - `InfoTile` 정보 위계 강화
  - `Panel` 헤더/바디 대비 및 테두리/여백 정밀화
  - `DecisionBarChart`/`DecisionSummary` 가독성 및 범례 톤 개선
- 레이아웃/내비게이션 정합 보강
  - `TaskSidebar`, `TaskTopbar`, `viewMeta` 카피와 시각 톤 보정
- 화면 정합 보강
  - 프로젝트 목록: 필터/테이블/액션 버튼 가시성 강화
  - 사용 가이드: 역할별 체크포인트와 운영 팁 보강
  - 가치평가/리스크: 상단 액션 영역, 분석 테이블, 판단 패널 추가

## 검증

- `cd frontend && npm run lint` 통과
- `cd frontend && npm run build` 통과

## 남은 리스크

- 레퍼런스와 픽셀 단위 1:1 동형(아이콘 세트, 차트 축/눈금, 미세 간격)은 브라우저 실측 기반 추가 보정 여지 존재
- 공용 컴포넌트는 backward-compatible 조건으로 기본 스타일 보강 중심이며, 화면별 특수 variant는 후속 확장 필요
