# 2026-04-24 Issue #46 Tailwind Complete Conversion Slice

## Scope
- Branch: `feat/46-tailwind-next-slice`
- Slice: remove remaining legacy `global.css` class dependencies from active frontend screens and render with Tailwind utility classes only.

## A/B Comparison
- A안: `global.css` 유지 + 남은 레거시 클래스만 부분 유지.
  - 장점: 수정량 최소.
  - 단점: 화면별 스타일 출처가 혼합되어 재발 가능성이 높고, 일부 환경에서 레거시 클래스 누락 시 레이아웃 붕괴 위험 지속.
- B안: 컴포넌트 레거시 클래스 전량 제거 + Tailwind 유틸로 직접 치환 + 엔트리에서 `global.css` import 제거.
  - 장점: 스타일 소스 일원화, 미전환 클래스 재발 방지, 추적/검증 단순화.
  - 단점: 초기 치환 범위가 큼.

선택: **B안**

## Changed Areas
- `frontend/src/views/workspace/WorkspaceView.tsx`
- `frontend/src/views/dashboard/DashboardView.tsx`
- `frontend/src/features/workspace/decisionVisuals.tsx`
- `frontend/src/shared/components/ProgressBar.tsx`
- `frontend/src/views/layout/TaskSidebar.tsx`
- `frontend/src/views/layout/TaskTopbar.tsx`
- `frontend/src/App.tsx`
- `frontend/src/styles/tailwind.css`
- `frontend/src/main.tsx`

## Validation
- `frontend`: `npm run lint` ✅
- `frontend`: `npm run build` ✅
- 레거시 클래스 패턴(`cockpit-*`, `workspace-stage*`, `table-shell`, `data-table`, `audit-state`, `empty-state`, `workflow-*`, `status-pill`)의 TSX 사용 검색 결과 없음 ✅

## Decision
- 레퍼런스 동형화를 유지하면서 Tailwind-only 렌더 경로로 정리 가능하다고 판단.
