/* eslint-disable no-unused-vars */
import { formatKrwCompact } from '../../app/format';
import type { PortfolioSummary } from '../../app/portfolioData';
import { Panel } from '../../shared/components/Panel';
import { ProgressBar } from '../../shared/components/ProgressBar';
import {
  explorerQuickFilterOptions,
  explorerSortOptions
} from '../../features/portfolio/explorerFilters';
import {
  statusTone,
  type ExplorerQuickFilterKey,
  type ExplorerSortKey
} from '../../features/portfolio/explorerState';

const riskToneMap = {
  낮음: 'low',
  중간: 'mid',
  높음: 'high'
} as const;

type PortfolioViewProps = {
  portfolio: PortfolioSummary;
  maxHeadquarterInvestment: number;
  selectedProjectCode: string;
  searchTerm: string;
  explorerSort: ExplorerSortKey;
  explorerQuickFilter: ExplorerQuickFilterKey;
  headquarterFilter: string;
  headquarterOptions: string[];
  filteredProjects: PortfolioSummary['projects'];
  onChangeSearchTerm(value: string): void;
  onChangeSort(value: ExplorerSortKey): void;
  onChangeQuickFilter(value: ExplorerQuickFilterKey): void;
  onChangeHeadquarterFilter(value: string): void;
  onResetExplorerControls: () => void;
  onSelectProject(projectCode: string): void;
  onOpenWorkspace(target: 'accounting' | 'valuation', projectCode: string): void;
};

export function PortfolioView({
  portfolio,
  maxHeadquarterInvestment,
  selectedProjectCode,
  searchTerm,
  explorerSort,
  explorerQuickFilter,
  headquarterFilter,
  headquarterOptions,
  filteredProjects,
  onChangeSearchTerm,
  onChangeSort,
  onChangeQuickFilter,
  onChangeHeadquarterFilter,
  onResetExplorerControls,
  onSelectProject,
  onOpenWorkspace
}: PortfolioViewProps) {
  return (
    <section className="portfolio-grid">
      <Panel title="Portfolio overview" subtitle="본부 수준 상태를 먼저 읽고, 이후 프로젝트 워크스페이스로 이동합니다.">
        <div className="headquarter-grid">
          {portfolio.headquarters.map((headquarter) => (
            <article key={headquarter.code} className="headquarter-card">
              <div className="headquarter-card__header">
                <div>
                  <strong>{headquarter.name}</strong>
                  <span>{headquarter.projectCount}개 프로젝트</span>
                </div>
                <span className={`status-pill status-pill--${riskToneMap[headquarter.risk]}`}>
                  {headquarter.risk}
                </span>
              </div>
              <ProgressBar
                label="투자 비중"
                value={Math.round(headquarter.totalInvestmentKrw / 10000)}
                max={Math.round(maxHeadquarterInvestment / 10000)}
                tone={headquarter.risk === '높음' ? 'rose' : headquarter.risk === '중간' ? 'amber' : 'teal'}
              />
              <div className="headquarter-card__metrics">
                <div>
                  <span>총 투자액</span>
                  <strong>{formatKrwCompact(headquarter.totalInvestmentKrw)}</strong>
                </div>
                <div>
                  <span>평균 NPV</span>
                  <strong>{formatKrwCompact(headquarter.averageNpvKrw)}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Panel>

      <Panel
        title="Project workspace entry"
        subtitle="프로젝트 상세를 항상 펼치지 않고, 필요한 워크스페이스로 선택 진입합니다."
      >
        <div className="explorer-controls" aria-label="프로젝트 탐색 컨트롤">
          <div className="explorer-controls__row">
            <label className="explorer-search" htmlFor="project-search-input">
              <span>프로젝트 검색</span>
              <input
                id="project-search-input"
                type="search"
                value={searchTerm}
                placeholder="프로젝트명, 코드, 본부 검색"
                onChange={(event) => onChangeSearchTerm(event.target.value)}
              />
            </label>

            <label className="explorer-sort" htmlFor="project-sort-select">
              <span>정렬</span>
              <select
                id="project-sort-select"
                value={explorerSort}
                onChange={(event) => onChangeSort(event.target.value as ExplorerSortKey)}
              >
                {explorerSortOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="explorer-controls__group" aria-label="빠른 필터">
            {explorerQuickFilterOptions.map((filter) => (
              <button
                key={filter.key}
                type="button"
                className={`explorer-pill ${explorerQuickFilter === filter.key ? 'explorer-pill--active' : ''}`}
                aria-pressed={explorerQuickFilter === filter.key}
                onClick={() => onChangeQuickFilter(filter.key)}
                title={filter.helper}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="explorer-controls__group" aria-label="본부 필터">
            {headquarterOptions.map((headquarter) => (
              <button
                key={headquarter}
                type="button"
                className={`explorer-pill explorer-pill--subtle ${
                  headquarterFilter === headquarter ? 'explorer-pill--active' : ''
                }`}
                aria-pressed={headquarterFilter === headquarter}
                onClick={() => onChangeHeadquarterFilter(headquarter)}
              >
                {headquarter === 'all' ? '전체 본부' : headquarter}
              </button>
            ))}
          </div>

          <div className="explorer-controls__footer">
            <p>
              결과 <strong>{filteredProjects.length}</strong> / {portfolio.projects.length}
            </p>
            <button type="button" className="explorer-reset" onClick={onResetExplorerControls}>
              필터 초기화
            </button>
          </div>
        </div>

        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>순위</th>
                <th>프로젝트</th>
                <th>본부</th>
                <th>상태</th>
                <th>NPV</th>
                <th>워크스페이스</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => (
                <tr
                  key={project.code}
                  className={project.code === selectedProjectCode ? 'data-table__row--selected' : ''}
                >
                  <td>{project.rank}</td>
                  <td>
                    <strong>{project.name}</strong>
                    <div className="table-subtle">{project.code}</div>
                  </td>
                  <td>{project.headquarter}</td>
                  <td>
                    <span className={`status-pill status-pill--${statusTone(project.status)}`}>{project.status}</span>
                  </td>
                  <td>{formatKrwCompact(project.npvKrw)}</td>
                  <td>
                    <div className="table-actions">
                      <button type="button" onClick={() => onSelectProject(project.code)}>
                        선택
                      </button>
                      <button type="button" onClick={() => onOpenWorkspace('accounting', project.code)}>
                        관리회계
                      </button>
                      <button type="button" onClick={() => onOpenWorkspace('valuation', project.code)}>
                        재무평가
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProjects.length === 0 ? (
            <div className="empty-state">
              <p>조건에 맞는 프로젝트가 없습니다.</p>
              <button type="button" onClick={onResetExplorerControls}>
                탐색 조건 초기화
              </button>
            </div>
          ) : null}
        </div>
      </Panel>
    </section>
  );
}
