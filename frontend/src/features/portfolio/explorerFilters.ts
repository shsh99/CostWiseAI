import type { ProjectSummary } from '../../app/portfolioData';
import type { ExplorerQuickFilterKey, ExplorerSortKey } from './explorerState';

export const explorerSortOptions: Array<{
  key: ExplorerSortKey;
  label: string;
}> = [
  { key: 'priority', label: '우선순위 순' },
  { key: 'npv', label: 'NPV 높은순' },
  { key: 'irr', label: 'IRR 높은순' },
  { key: 'payback', label: '회수기간 짧은순' },
  { key: 'risk', label: '리스크 높은순' }
];

export const explorerQuickFilterOptions: Array<{
  key: ExplorerQuickFilterKey;
  label: string;
  helper: string;
}> = [
  { key: 'all', label: '전체', helper: '전체 프로젝트' },
  { key: 'needs-review', label: '즉시 검토', helper: '승인 전 검토 대상' },
  {
    key: 'accounting-focus',
    label: '관리회계 중심',
    helper: '원가·배분 우선 후보'
  },
  {
    key: 'valuation-focus',
    label: '재무평가 중심',
    helper: '사업성 검토 우선 후보'
  },
  { key: 'shortlist', label: '고우선순위', helper: '숏리스트 후보' }
];

const riskOrder = {
  높음: 3,
  중간: 2,
  낮음: 1
} as const;

export function filterAndSortProjects(
  projects: ProjectSummary[],
  input: {
    headquarterFilter: string;
    searchTerm: string;
    quickFilter: ExplorerQuickFilterKey;
    sort: ExplorerSortKey;
  }
) {
  const normalizedSearchTerm = input.searchTerm.trim().toLowerCase();

  return projects
    .filter((project) => {
      if (
        input.headquarterFilter !== 'all' &&
        project.headquarter !== input.headquarterFilter
      ) {
        return false;
      }

      if (normalizedSearchTerm) {
        const haystack =
          `${project.name} ${project.code} ${project.headquarter}`.toLowerCase();
        if (!haystack.includes(normalizedSearchTerm)) {
          return false;
        }
      }

      if (input.quickFilter === 'all') {
        return true;
      }

      if (input.quickFilter === 'needs-review') {
        return project.status !== '승인';
      }

      if (input.quickFilter === 'accounting-focus') {
        return (
          project.assetCategory === '프로젝트' || project.status === '검토중'
        );
      }

      if (input.quickFilter === 'valuation-focus') {
        return project.npvKrw > 0 && project.irr >= 0.14;
      }

      return (
        project.rank <= 5 ||
        (project.status === '승인' && project.risk !== '높음')
      );
    })
    .sort((left, right) => {
      if (input.sort === 'npv') {
        return right.npvKrw - left.npvKrw;
      }

      if (input.sort === 'irr') {
        return right.irr - left.irr;
      }

      if (input.sort === 'payback') {
        return left.paybackYears - right.paybackYears;
      }

      if (input.sort === 'risk') {
        return riskOrder[right.risk] - riskOrder[left.risk];
      }

      return left.rank - right.rank;
    });
}
