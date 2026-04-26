# 2026-04-21 Pre-commit Scope Split

## 대상

- 브랜치: `feat/38-precommit-scope-split`
- 범위: 이슈 `#38` pre-commit 훅 검사 범위 분리

## 검증 기준(사전 고정)

- backend-only staged 변경에서는 frontend lint/format이 실행되지 않아야 한다.
- frontend staged 변경에서는 frontend lint/format 보호가 유지되어야 한다.
- 기존 개발 스크립트 흐름(`npm run lint`, `npm run format:check`, `./gradlew check`)과 충돌이 없어야 한다.

## A/B 비교

### A. 기존 전역 검사 유지

- 장점: 단순하다.
- 단점: backend-only 커밋도 frontend 의존성/포맷 상태에 의해 차단된다.

### B. staged path 기반 라우팅

- 장점: 변경된 영역만 검사하여 불필요한 차단을 줄인다.
- 단점: 경로 매칭 규칙을 유지보수해야 한다.

## 선택

- `B`를 선택했다.
- 이유: 이슈 목표(backend-only 차단 해소, frontend 보호 유지)를 직접 만족한다.

## 구현 요약

- `.githooks/pre-commit`을 staged file 기반 분기 로직으로 변경
- `frontend/*` 변경 시에만 `npm run lint`, `npm run format:check` 실행
- `backend/*` 변경 시에만 `./gradlew --no-daemon check` 실행
- 변경 영역이 없으면 훅을 건너뛰도록 처리

## 검증

- backend-only staged 시나리오: frontend 검사 skip, backend check 실행 확인
- frontend-only staged 시나리오: frontend lint/format 실행, backend 검사 skip 확인

## 남은 리스크

- 현재 경로 규칙은 `frontend/*`, `backend/*`만 대상으로 한다.
- 루트 설정 파일 변경 시 어떤 검사까지 강제할지(예: 공통 설정 파일)는 별도 정책 확장이 필요하다.
