/* eslint-disable no-unused-vars */
import { formatKrwCompact, formatPercent } from '../../app/format';
import type { PortfolioSummary, ProjectSummary, RoleInsight } from '../../app/portfolioData';
import { Panel } from '../../shared/components/Panel';

type DashboardViewProps = {
  decisionSignals: ReadonlyArray<{ label: string; value: string }>;
  selectedInsight: RoleInsight;
  portfolio: PortfolioSummary;
  priorityProjects: ProjectSummary[];
  onOpenWorkspace(target: 'accounting' | 'valuation', projectCode: string): void;
};

export function DashboardView({
  portfolio,
  selectedInsight,
  priorityProjects,
  onOpenWorkspace
}: DashboardViewProps) {
  const riskCounts = portfolio.projects.reduce(
    (acc, project) => {
      if (project.risk === '높음') {
        acc.high += 1;
      } else if (project.risk === '중간') {
        acc.mid += 1;
      } else {
        acc.low += 1;
      }
      return acc;
    },
    { high: 0, mid: 0, low: 0 }
  );

  const totalRiskCount = Math.max(
    1,
    riskCounts.high + riskCounts.mid + riskCounts.low
  );

  return (
    <section className="finops-dashboard">
      <header className="finops-page-header">
        <div>
          <h2>통합 대시보드</h2>
          <p>전사 5개 본부 · 프로젝트 원가/평가 현황</p>
        </div>
      </header>

      <section className="finops-kpi-grid" aria-label="핵심 지표">
        <article className="finops-kpi-card">
          <span>운영 본부</span>
          <strong>{portfolio.overview.headquarterCount}</strong>
          <p>5개 본부 가동중</p>
        </article>
        <article className="finops-kpi-card">
          <span>활성 프로젝트</span>
          <strong>{portfolio.overview.projectCount}</strong>
          <p>총 20여개 동시 운영</p>
        </article>
        <article className="finops-kpi-card">
          <span>총 예산</span>
          <strong>{formatKrwCompact(portfolio.overview.totalInvestmentKrw)}</strong>
          <p>집행 기준 {formatKrwCompact(portfolio.overview.totalExpectedRevenueKrw)}</p>
        </article>
        <article className="finops-kpi-card">
          <span>미확인 경보</span>
          <strong>{portfolio.overview.conditionalCount}</strong>
          <p>클릭하여 확인</p>
        </article>
      </section>

      <section className="finops-dashboard-grid">
        <Panel title="본부별 예산 vs 집행" subtitle="본부 단위 집행 차이를 비교합니다.">
          <div className="finops-bar-list">
            {portfolio.headquarters.map((headquarter) => {
              const ratio = Math.min(
                100,
                Math.round(
                  (headquarter.totalExpectedRevenueKrw /
                    Math.max(1, headquarter.totalInvestmentKrw)) *
                    100
                )
              );
              return (
                <article key={headquarter.code} className="finops-bar-item">
                  <div className="finops-bar-item__meta">
                    <strong>{headquarter.name}</strong>
                    <span>
                      예산 {formatKrwCompact(headquarter.totalInvestmentKrw)} · 집행{' '}
                      {formatKrwCompact(headquarter.totalExpectedRevenueKrw)}
                    </span>
                  </div>
                  <div className="finops-bar-track" aria-hidden="true">
                    <span className="finops-bar-fill" style={{ width: `${ratio}%` }} />
                  </div>
                </article>
              );
            })}
          </div>
        </Panel>

        <Panel title="리스크 분포" subtitle="프로젝트 리스크 등급 분포">
          <div className="finops-risk-donut" aria-label="리스크 도넛">
            <div
              className="finops-risk-donut__ring"
              style={{
                background: `conic-gradient(
                #ef4444 0% ${(riskCounts.high / totalRiskCount) * 100}%,
                #f59e0b ${(riskCounts.high / totalRiskCount) * 100}% ${((riskCounts.high + riskCounts.mid) / totalRiskCount) * 100}%,
                #22c55e ${((riskCounts.high + riskCounts.mid) / totalRiskCount) * 100}% 100%
              )`
              }}
            />
            <div className="finops-risk-donut__legend">
              <span>CRITICAL {riskCounts.high}</span>
              <span>MEDIUM {riskCounts.mid}</span>
              <span>LOW {riskCounts.low}</span>
            </div>
          </div>
        </Panel>
      </section>

      <section className="finops-dashboard-grid finops-dashboard-grid--bottom">
        <Panel title="월별 원가 추이 (실적 vs 표준)" subtitle="우선순위 프로젝트 기준">
          <ol className="audit-list audit-list--wide">
            {priorityProjects.slice(0, 5).map((project) => (
              <li key={project.code}>
                <strong>
                  {project.code} · {project.name}
                </strong>
                <span>
                  투자 {formatKrwCompact(project.investmentKrw)} / NPV{' '}
                  {formatKrwCompact(project.npvKrw)}
                </span>
                <small>
                  IRR {formatPercent(project.irr)} · 회수 {project.paybackYears.toFixed(1)}년
                </small>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel title="다음 의사결정" subtitle="역할 기반 현재 포커스">
          <article className="workflow-note">
            <strong>{selectedInsight.decisionFocus}</strong>
            <p>{selectedInsight.summary}</p>
            <p>{selectedInsight.nextAction}</p>
          </article>
          <div className="table-actions">
            {priorityProjects.slice(0, 2).map((project) => (
              <button
                key={project.code}
                type="button"
                onClick={() => onOpenWorkspace('accounting', project.code)}
              >
                {project.code} 원가 분석
              </button>
            ))}
          </div>
        </Panel>
      </section>
    </section>
  );
}
