# CostWiseAI

보험/금융 도메인에서 **관리회계(ABC 원가배부)**와 **투자평가(DCF/VaR)**를 함께 다루는 의사결정 지원 플랫폼입니다.

## 1. 프로젝트 소개

- 목표: 5개 본부, 약 20개 프로젝트 기준으로 원가·수익·리스크를 통합 분석
- 핵심 사용자: 기획(PLANNER), 재무 검토(FINANCE_REVIEWER), 경영진(EXECUTIVE)
- 핵심 가치:
  - 본부/프로젝트 단위 원가 배부 근거 추적
  - 투자안 가치평가 및 리스크 신호의 일관된 조회
  - 감사 이력 기반의 승인/검토 투명성

## 2. 기술 스택

- Frontend: React 18, TypeScript, Vite, Tailwind CSS
- Backend: Java 21, Spring Boot 3.x, Spring Security, Spring JDBC
- Database/Auth: Supabase PostgreSQL, Supabase Auth(JWT)
- Deployment:
  - Frontend: Cloudflare Pages
  - Backend: Railway
  - DB/Auth: Supabase

## 3. 프로젝트 구조

```text
CostWiseAI/
├─ frontend/        # React UI
├─ backend/         # Spring Boot API
├─ supabase/        # migrations, seed
├─ docs/            # 설계/운영/협업 문서
├─ railway.json     # Railway 배포 설정
└─ .railwayignore   # Railway 업로드 제외 설정
```

## 4. 아키텍처 개요

- Frontend는 API 중심으로 데이터 조회/표시 담당
- Backend는 인증/인가, 계산 로직, 감사 로그, 영속화의 신뢰 경계(trust boundary)
- Supabase는 운영 데이터(Postgres)와 토큰 발급(Auth) 담당
- 권한 모델:
  - JWT 기반 인증
  - 역할 기반 API 접근 제어
  - CORS allowlist 기반 프론트 출처 제한

## 5. 배포 구조

- Frontend URL: `https://costwiseai-frontend.pages.dev`
- Backend URL: `https://costwiseai-production.up.railway.app`
- Backend Health:
  - `https://costwiseai-production.up.railway.app/actuator/health`
  - `https://costwiseai-production.up.railway.app/api/health`
- Swagger URL:
  - `https://costwiseai-production.up.railway.app/swagger-ui/index.html`
  - `https://costwiseai-production.up.railway.app/v3/api-docs`
- 배포 흐름:
  1. Supabase 마이그레이션/시드 적용
  2. Railway 백엔드 배포 및 환경변수 주입
  3. Cloudflare Pages 프론트 배포 (백엔드 URL 반영)

상세 배포 절차는 [DEPLOYMENT.md](/C:/Users/ggg99/Desktop/CostWiseAI/CostWiseAI/DEPLOYMENT.md) 참고.
운영 정책에 따라 Swagger/API docs 접근은 제한될 수 있습니다.

## 6. AI 활용 방법

- 저장소는 AI 협업을 전제로 문서/작업 규칙을 분리 관리
- 주요 문서:
  - [AI Collaboration Guide](/C:/Users/ggg99/Desktop/CostWiseAI/CostWiseAI/docs/ai-collaboration.md)
  - [Documentation Index](/C:/Users/ggg99/Desktop/CostWiseAI/CostWiseAI/docs/index.md)
- 권장 방식:
  - 작업 단위를 작은 슬라이스로 분리
  - 구현과 리뷰를 분리
  - 작업 범위, 검증 명령, 비대상 파일을 명시한 뒤 진행

## 7. 협업 방법

- 브랜치 전략:
  - `main`: 릴리스 안정화
  - `dev`: 통합 브랜치
  - `feat/*`: 기능 단위 작업
- 리뷰 원칙:
  - 동작 회귀, 보안, 누락 테스트 우선 점검
  - 변경 파일/검증 결과/잔여 리스크를 함께 공유
- 문서화 원칙:
  - 구현 결과는 `docs/dev-logs/`에 기록
  - 운영/보안 가이드는 `docs/ops/`에 반영

## 8. 로컬 실행 요약

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
./gradlew bootRun
```

## 9. 주제 충족 체크

- [x] 프로젝트 소개
- [x] 프로젝트 구조
- [x] 아키텍처
- [x] 배포 구조
- [x] AI 활용 방법
- [x] 협업 방법
