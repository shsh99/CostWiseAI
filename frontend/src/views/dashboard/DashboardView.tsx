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
    <section>
      <header className="mb-3.5 flex items-baseline justify-between gap-4">
        <div>
          <h2 className="m-0 text-[1.9rem] font-bold text-[#182847]">통합 대시보드</h2>
          <p className="mt-1 text-[#607397]">전사 5개 본부 · 프로젝트 원가/평가 현황</p>
        </div>
      </header>

      <section
        className="mb-4 grid grid-cols-4 gap-3.5 max-[1280px]:grid-cols-2"
        aria-label="핵심 지표"
      >
        <article className="rounded-[14px] border border-cw-cardBorder bg-white p-5">
          <span className="text-sm font-semibold text-[#5f7399]">운영 본부</span>
          <strong className="mt-2 block text-[1.85rem] font-bold text-[#172747]">
            {portfolio.overview.headquarterCount}
          </strong>
          <p className="mt-2 text-sm text-[#7589ad]">5개 본부 가동중</p>
        </article>
        <article className="rounded-[14px] border border-cw-cardBorder bg-white p-5">
          <span className="text-sm font-semibold text-[#5f7399]">활성 프로젝트</span>
          <strong className="mt-2 block text-[1.85rem] font-bold text-[#172747]">
            {portfolio.overview.projectCount}
          </strong>
          <p className="mt-2 text-sm text-[#7589ad]">총 20여개 동시 운영</p>
        </article>
        <article className="rounded-[14px] border border-cw-cardBorder bg-white p-5">
          <span className="text-sm font-semibold text-[#5f7399]">총 예산</span>
          <strong className="mt-2 block text-[1.85rem] font-bold text-[#172747]">
            {formatKrwCompact(portfolio.overview.totalInvestmentKrw)}
          </strong>
          <p className="mt-2 text-sm text-[#7589ad]">
            집행 기준 {formatKrwCompact(portfolio.overview.totalExpectedRevenueKrw)}
          </p>
        </article>
        <article className="rounded-[14px] border border-cw-cardBorder bg-white p-5">
          <span className="text-sm font-semibold text-[#5f7399]">미확인 경보</span>
          <strong className="mt-2 block text-[1.85rem] font-bold text-[#172747]">
            {portfolio.overview.conditionalCount}
          </strong>
          <p className="mt-2 text-sm text-[#7589ad]">클릭하여 확인</p>
        </article>
      </section>

      <section className="mb-4 grid grid-cols-[2fr_1fr] gap-4 max-[1280px]:grid-cols-1">
        <Panel title="본부별 예산 vs 집행" subtitle="본부 단위 집행 차이를 비교합니다.">
          <div className="grid gap-2.5">
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
                <article key={headquarter.code} className="grid gap-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <strong>{headquarter.name}</strong>
                    <span className="text-[0.88rem] text-[#7388ac]">
                      예산 {formatKrwCompact(headquarter.totalInvestmentKrw)} · 집행{' '}
                      {formatKrwCompact(headquarter.totalExpectedRevenueKrw)}
                    </span>
                  </div>
                  <div
                    className="h-3 overflow-hidden rounded-full bg-[#edf2fa]"
                    aria-hidden="true"
                  >
                    <span
                      className="block h-full rounded-full bg-[linear-gradient(90deg,#3f79ea,#1db0db)]"
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        </Panel>

        <Panel title="리스크 분포" subtitle="프로젝트 리스크 등급 분포">
          <div className="grid justify-items-center gap-3 py-2.5" aria-label="리스크 도넛">
            <div
              className="relative h-[220px] w-[220px] rounded-full after:absolute after:inset-[30px] after:rounded-full after:bg-white after:content-['']"
              style={{
                background: `conic-gradient(
                #ef4444 0% ${(riskCounts.high / totalRiskCount) * 100}%,
                #f59e0b ${(riskCounts.high / totalRiskCount) * 100}% ${((riskCounts.high + riskCounts.mid) / totalRiskCount) * 100}%,
                #22c55e ${((riskCounts.high + riskCounts.mid) / totalRiskCount) * 100}% 100%
              )`
              }}
            />
            <div className="flex flex-wrap justify-center gap-2.5 text-[0.86rem] font-bold text-[#546991]">
              <span>CRITICAL {riskCounts.high}</span>
              <span>MEDIUM {riskCounts.mid}</span>
              <span>LOW {riskCounts.low}</span>
            </div>
          </div>
        </Panel>
      </section>

      <section className="grid grid-cols-[2fr_1fr] gap-4 max-[1280px]:grid-cols-1">
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
