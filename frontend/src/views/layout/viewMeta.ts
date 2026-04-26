import type { NavigationKey } from '../../features/portfolio/explorerState';

export const viewMeta: Record<
  NavigationKey,
  { eyebrow: string; title: string; description: string; breadcrumb: string[] }
> = {
  dashboard: {
    eyebrow: '대시보드',
    title: '대시보드',
    description: '전사 KPI와 리스크 분포를 확인합니다.',
    breadcrumb: ['메인', '대시보드']
  },
  portfolio: {
    eyebrow: '프로젝트 목록',
    title: '프로젝트 목록',
    description: '프로젝트 목록과 상태를 필터링하여 관리합니다.',
    breadcrumb: ['프로젝트·평가', '프로젝트 목록']
  },
  accounting: {
    eyebrow: '원가·관리회계',
    title: '원가·관리회계',
    description: '원가 집계와 표준원가 차이를 분석합니다.',
    breadcrumb: ['원가·관리회계', '원가 집계·분석']
  },
  valuation: {
    eyebrow: '프로젝트·평가',
    title: '가치평가',
    description: '프로젝트 가치평가와 리스크 지표를 확인합니다.',
    breadcrumb: ['프로젝트·평가', '가치평가']
  },
  risk: {
    eyebrow: '프로젝트·평가',
    title: '리스크/VaR',
    description: '프로젝트 리스크 등급과 VaR 기준을 확인합니다.',
    breadcrumb: ['프로젝트·평가', '리스크/VaR']
  },
  users: {
    eyebrow: '시스템',
    title: '사용자 관리',
    description: '사용자 권한과 계정 상태를 관리합니다.',
    breadcrumb: ['시스템', '사용자 관리']
  },
  audit: {
    eyebrow: '시스템',
    title: '감사 로그',
    description: '시스템 활동 이력을 조회합니다.',
    breadcrumb: ['시스템', '감사 로그']
  },
  settings: {
    eyebrow: '시스템',
    title: '사용 가이드',
    description: '역할별 사용 절차를 확인합니다.',
    breadcrumb: ['시스템', '사용 가이드']
  }
};
