# Code Size and Splitting Guidelines

**Status:** Active guidance  
**Last updated:** 2026-04-20  
**Scope:** Java(Spring) classes and methods, React components/hooks, and file-splitting decision rules

## Purpose

이 문서는 "언제 파일을 쪼갤지"에 대한 기준을 정한다.

핵심 기준은 코드 길이 그 자체가 아니라, **한 파일이 한 가지 이유로만 변경되는가**이다.

## Java / Spring Rules

### Class Size

- 권장: `150~250`줄
- 최대: `300`줄

### Method Size

- 권장: `20~30`줄
- 최대: `40`줄

### Why These Limits Matter

- 클래스에 책임이 2개 이상 섞이기 시작하는 지점이기 때문이다.
- 테스트 작성이 어려워진다.
- 변경 시 영향 범위가 커진다.

### Service Layer Split Rules

Service는 특히 역할별로 나눈다.

예:

- `ProjectService.java` -> 프로젝트 오케스트레이션만 담당
- `ProjectCalculationService.java` -> 계산 로직 담당
- `ProjectValidationService.java` -> 검증 로직 담당

### Split Triggers

아래 신호가 보이면 분리를 우선 검토한다.

- `if/else`가 5개 이상
- 로직 중첩이 깊음
- 변수 수가 15개 이상
- 한 메서드가 여러 책임을 가짐
- 같은 클래스에서 입력 검증, 계산, 저장, 응답 조립이 섞임

### Bad Example

- `ProjectService.java`가 600줄

문제:

- 비즈니스 로직이 몰린다.
- 유지보수가 어려워진다.
- 테스트가 커지고 느려진다.

## React Rules

### Component Size

- 권장: `100~200`줄
- 최대: `250`줄

### Split Triggers

아래 3개 중 하나라도 강하게 보이면 쪼갠다.

1. UI가 길다
   - 하위 컴포넌트로 분리한다.
2. 상태가 많다
   - custom hook으로 분리한다.
3. API 로직이 있다
   - service로 분리한다.

### Bad Example

- `ProjectDetail.tsx`가 500줄

문제:

- 상태 + UI + API가 섞인다.
- 테스트와 유지보수가 모두 어려워진다.

### Good Structure Example

- `ProjectDetail.tsx` -> 화면 조립
- `useProjectDetail.ts` -> 상태/로직
- `NpvChart.tsx` -> 차트 UI
- `AllocationTable.tsx` -> 테이블 UI

## File Split Decision Rule

가장 중요한 판단 기준은 이 문장이다.

> 한 파일이 한 가지 이유로만 변경되는가?

이 기준을 깨면 분리한다.

### Strong Split Signals

- `if/else` 5개 이상
- 중첩 `for` loop
- 변수 15개 이상
- `useState` 5개 이상
- 역할이 다른 로직이 한 파일에 섞임

### Practical Rule

- 코드가 길어서 쪼개는 것이 아니라, 책임이 섞여서 쪼갠다.
- 길이는 경고 신호이고, 책임 분리가 최종 판단 기준이다.
- 분리 후에는 각 파일이 독립적으로 읽히고, 테스트 가능해야 한다.

## Review Checklist

- 이 파일은 한 가지 책임만 가지는가
- 이 변경이 다른 영역까지 같이 흔드는가
- 메서드가 너무 길어서 조건 분기와 중첩이 쌓였는가
- 상태, UI, API 로직이 한 컴포넌트에 섞였는가
- Service가 오케스트레이션과 계산을 동시에 하고 있는가

## Default Action

기준을 넘으면 "나중에 리팩토링"으로 미루지 말고, 먼저 역할별로 분리한다.

