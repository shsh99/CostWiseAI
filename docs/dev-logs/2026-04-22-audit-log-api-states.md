# Audit Log API States

## 기준 브랜치

- 기준: `dev` (`2bd380b`, PR #62 병합 후 최신)
- 작업 브랜치: `feat/54-audit-log-states`
- 선택 이유: #54 잔여 범위 중 감사로그 API 전환과 상태 UI는 프론트 단독 변경으로 분리 가능하다.

## 워킹트리 비교

- 변경 전: Reviews 화면은 `portfolio.auditEvents` seed/fallback 이벤트를 항상 렌더링했다.
- 변경 후: 선택 프로젝트의 `projectId`로 `/api/audit-logs`를 우선 호출하고, 실패 시 기존 로컬 이벤트를 fallback으로 표시한다.
- 감사로그 영역에 API/fallback 소스, loading, empty 상태를 명시했다.
- 백엔드 응답 계약은 기존 `AuditLogListResponse.items`를 그대로 사용한다.

## 검증

- `frontend`: `npm run build`
- `frontend`: `npm run lint`
- `frontend`: `npx prettier --check src/App.tsx src/app/portfolioData.ts src/views/reviews/ReviewsView.tsx`

## 후속 확인

- `npm run format:check`는 기존 프론트 전체 포맷 불일치가 남아 있어 별도 정리가 필요하다.
- 실제 API 수동 확인은 EXECUTIVE 권한 JWT와 실행 중인 백엔드가 필요하다.
