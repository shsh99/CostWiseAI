# 2026-04-21 Detail Visualization 강화

## 대상 이슈
- #39 `[후속] 상세 탭 그래프/시각 자료 강화`

## 작업 범위
- Frontend only
- 파일:
  - `frontend/src/App.tsx`
  - `frontend/src/styles/global.css`

## A/B 비교
- A안: 기존 카드 구조 유지 + 기존 막대 높이/텍스트만 부분 수정
  - 장점: 변경량이 적고 리스크가 낮음
  - 단점: hover 없이 이해 가능한 설명력 개선 폭이 제한적
- B안: 탭별 공통 의사결정 차트(`DecisionBarChart`)와 요약(`DecisionSummary`) 구조 도입
  - 장점: 라벨/주석/요약을 한 화면에서 일관 제공, 비색상 cue(패턴) 적용이 쉬움
  - 단점: 컴포넌트/스타일 변경량 증가

## 선택안
- B안 채택
- 선택 근거:
  - 이슈의 핵심 수용 기준(의사결정형 차트, hover 없는 이해, 비색상 cue)을 직접 충족
  - Allocation/Valuation/Risk 탭을 동일한 시각 문법으로 통일 가능

## 구현 요약
- `App.tsx`
  - 데이터 비율 기반 바 차트 생성 로직 추가
  - `DecisionBarChart` / `DecisionSummary` 컴포넌트 추가
  - Allocation/Valuation/Risk 탭에 공통 차트+요약 구조 적용
- `global.css`
  - 차트 행 레이아웃, 요약 카드, 패턴 cue(솔리드/스트라이프/도트) 스타일 추가
  - 모바일 구간에서 차트 row 단일 컬럼 전환

## 검증
- `npm run lint` 통과
- `npm run build` 통과

## 잔여 리스크
- CSS 기반 커스텀 차트이므로 데이터 포인트 증가 시 밀집도 대응(스크롤/그룹화) 후속 필요
- 일부 요약 문구는 규칙 기반 정적 생성이라, 백엔드 분석 규칙 변경 시 동기화 점검 필요
