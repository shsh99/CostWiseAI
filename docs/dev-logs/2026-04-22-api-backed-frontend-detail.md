# API Backed Frontend Detail

## 기준 브랜치

- 기준: `dev` (`4d113b0`, PR #61 병합 후 최신)
- 작업 브랜치: `feat/54-api-backed-frontend`
- 선택 이유: #54는 프론트엔드 포트폴리오/상세 화면의 데이터 공급원을 바꾸는 작업이라, `dev` 통합선에서 분리한 집중 `feat/*` 브랜치가 적합하다.

## 워킹트리 비교

- 변경 전: `App.tsx`가 선택 프로젝트 상세를 항상 `buildProjectDetail(selectedProject.code)` 로컬 시드에서 동기 생성했다.
- 변경 후: 포트폴리오 목록은 `/api/portfolio/summary`, 선택 상세는 `/api/persistence/projects/{projectId}`와 `/api/valuation-risk/projects/{projectId}`를 우선 호출한다.
- API 실패, 인증 토큰 누락, `projectId` 부재 시에는 기존 로컬 시드 상세로 폴백한다.
- `VITE_API_ACCESS_TOKEN` 또는 `VITE_SUPABASE_ACCESS_TOKEN`이 있으면 API 요청에 Bearer 토큰을 붙인다.

## 검증

- `frontend`: `npm run build`
- `frontend`: `npm run lint`

## 후속 확인

- 실제 백엔드 연동 수동 확인은 유효한 JWT와 실행 중인 백엔드가 필요하다.
- 백엔드 포트폴리오 요약 서비스 자체는 아직 seed 기반이므로, DB 기반 목록 전환은 별도 후속 범위로 남긴다.
