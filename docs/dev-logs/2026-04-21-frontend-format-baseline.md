# 2026-04-21 Frontend Format Baseline

## 대상

- 브랜치: `feat/frontend-format-baseline`
- 범위: 프론트엔드 포맷 기준선 정리

## A/B 비교

### A. 기능 PR마다 `--no-verify`로 우회

- 장점: 당장 빠르다.
- 단점: 저장소 상태가 계속 누적되고, 훅 실패 원인을 매번 다시 해석해야 한다.

### B. 프론트 전체를 현재 Prettier 규칙에 맞춰 한 번 정리

- 장점: `npm run format:check`가 안정적으로 통과하고 기능 PR이 포맷 노이즈에서 벗어난다.
- 단점: 포맷 차이만 반영하는 별도 PR이 필요하다.

## 선택

- `B`를 선택했다.
- 이유: 기능 PR 범위를 유지하면서 훅 실패의 공통 원인을 제거하려면 포맷 정리를 독립 slice로 분리하는 편이 맞다.

## 구현 요약

- `frontend/` 전체에 `prettier --write .` 적용
- 기존 포맷 불일치 파일 23개 정리
- 현재 pre-commit 훅이 요구하는 `frontend`와 `backend` 검증을 모두 확인

## 검증

- `npm run format:check`
- `npm run lint`
- `npm run build`
- `GRADLE_USER_HOME=C:\Users\ggg99\Desktop\CostWiseAI\.gradle-home .\gradlew.bat check`
- 결과: 모두 성공

## 남은 리스크

- 새 worktree에서는 여전히 `frontend/node_modules` 설치가 선행돼야 한다.
- 이 PR은 포맷 정리만 다루므로 기능 동작 변화는 없다.
