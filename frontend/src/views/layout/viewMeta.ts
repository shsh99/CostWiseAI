import type { NavigationKey } from '../../features/portfolio/explorerState';

export const viewMeta: Record<
  NavigationKey,
  { eyebrow: string; title: string; description: string; breadcrumb: string[] }
> = {
  dashboard: {
    eyebrow: 'Executive overview',
    title: 'Task-first decision shell',
    description: '플랫폼 진입 즉시 포트폴리오 상태와 다음 작업 경로를 이해하도록 셸을 재구성했습니다.',
    breadcrumb: ['Platform', 'Dashboard']
  },
  portfolio: {
    eyebrow: 'Portfolio queue',
    title: 'Portfolio as the default landing context',
    description: '프로젝트를 한곳에서 검토하고, 필요한 워크스페이스로 의도적으로 진입합니다.',
    breadcrumb: ['Platform', 'Portfolio']
  },
  accounting: {
    eyebrow: 'Workspace',
    title: 'Management accounting workspace',
    description: '선택된 프로젝트의 원가·배분 맥락만 집중해서 봅니다.',
    breadcrumb: ['Platform', 'Workspaces', 'Management Accounting']
  },
  valuation: {
    eyebrow: 'Workspace',
    title: 'Financial evaluation workspace',
    description: '투자 타당성, 시나리오, 리스크를 프로젝트 단위로 읽습니다.',
    breadcrumb: ['Platform', 'Workspaces', 'Financial Evaluation']
  },
  reviews: {
    eyebrow: 'Review history',
    title: 'Assumptions and review evidence',
    description: '가정값과 감사 흐름을 별도 검토 레이어로 분리했습니다.',
    breadcrumb: ['Platform', 'Reviews']
  },
  settings: {
    eyebrow: 'Administration',
    title: 'Role and workspace preferences',
    description: '역할과 선호 컨텍스트는 글로벌 네비게이션과 분리된 설정 영역으로 둡니다.',
    breadcrumb: ['Platform', 'Settings']
  }
};
