import { defaultPortfolioSummary, navigationItems, type ProjectStatus } from '../../app/portfolioData';

export type NavigationKey = (typeof navigationItems)[number]['key'];
export type ExplorerSortKey = 'priority' | 'npv' | 'irr' | 'payback' | 'risk';
export type ExplorerQuickFilterKey =
  | 'all'
  | 'needs-review'
  | 'accounting-focus'
  | 'valuation-focus'
  | 'shortlist';

export const defaultExplorerSort: ExplorerSortKey = 'priority';
export const defaultExplorerQuickFilter: ExplorerQuickFilterKey = 'all';

export function parseExplorerState(search: string): {
  view: NavigationKey;
  search: string;
  sort: ExplorerSortKey;
  quickFilter: ExplorerQuickFilterKey;
  headquarter: string;
  projectCode: string;
} {
  const query = new URLSearchParams(search);
  const rawView = query.get('view');
  const rawSort = query.get('sort');
  const rawQuickFilter = query.get('quick');
  const rawHeadquarter = query.get('hq');
  const rawSearch = query.get('q');
  const rawProjectCode = query.get('project');

  const view: NavigationKey =
    rawView && navigationItems.some((item) => item.key === normalizeLegacyView(rawView))
      ? (normalizeLegacyView(rawView) as NavigationKey)
      : 'dashboard';
  const sort: ExplorerSortKey = isExplorerSortKey(rawSort) ? rawSort : defaultExplorerSort;
  const quickFilter: ExplorerQuickFilterKey = isExplorerQuickFilterKey(rawQuickFilter)
    ? rawQuickFilter
    : defaultExplorerQuickFilter;
  const headquarter = rawHeadquarter?.trim() ? rawHeadquarter : 'all';
  const searchTerm = rawSearch?.trim() ?? '';
  const projectCode = rawProjectCode?.trim() || defaultPortfolioSummary.projects[0]?.code || '';

  return {
    view,
    search: searchTerm,
    sort,
    quickFilter,
    headquarter,
    projectCode
  };
}

function normalizeLegacyView(view: string) {
  if (view === 'reviews') {
    return 'audit';
  }

  return view;
}

export function statusTone(status: ProjectStatus) {
  if (status === '승인') {
    return 'low';
  }

  if (status === '조건부 진행') {
    return 'mid';
  }

  if (status === '검토중') {
    return 'active';
  }

  return 'high';
}

function isExplorerSortKey(value: string | null): value is ExplorerSortKey {
  return value === 'priority' || value === 'npv' || value === 'irr' || value === 'payback' || value === 'risk';
}

function isExplorerQuickFilterKey(value: string | null): value is ExplorerQuickFilterKey {
  return (
    value === 'all' ||
    value === 'needs-review' ||
    value === 'accounting-focus' ||
    value === 'valuation-focus' ||
    value === 'shortlist'
  );
}
