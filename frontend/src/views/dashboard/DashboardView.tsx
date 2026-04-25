/* eslint-disable no-unused-vars */
import { formatKrwCompact, formatPercent } from '../../app/format';
import type {
  PortfolioSummary,
  ProjectSummary,
  RoleInsight
} from '../../app/portfolioData';
import { Panel } from '../../shared/components/Panel';

type DashboardViewProps = {
  decisionSignals: ReadonlyArray<{ label: string; value: string }>;
  selectedInsight: RoleInsight;
  portfolio: PortfolioSummary;
  priorityProjects: ProjectSummary[];
  onOpenWorkspace(
    target: 'accounting' | 'valuation',
    projectCode: string
  ): void;
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
  const primaryProject = priorityProjects[0] ?? null;

  return (
    <section className="grid gap-4">
      <header className="rounded-2xl border border-cw-cardBorder bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.1em] text-[#5f7399]">
              Executive Overview
            </p>
            <h2 className="m-0 mt-1 text-[1.9rem] font-bold text-[#182847]">
              통합 대시보드
            </h2>
            <p className="mt-1 text-[#607397]">
              전사 5개 본부 · 프로젝트 원가/평가 현황
            </p>
          </div>
          {primaryProject ? (
            <div className="flex flex-wrap gap-2" aria-label="빠른 실행">
              <button
                type="button"
                onClick={() =>
                  onOpenWorkspace('accounting', primaryProject.code)
                }
                className="rounded-xl border border-[rgba(63,121,234,0.24)] bg-[rgba(63,121,234,0.08)] px-3.5 py-2 text-sm font-semibold text-[#2f57c8] transition-colors hover:bg-[rgba(63,121,234,0.14)]"
              >
                {primaryProject.code} 원가 워크스페이스
              </button>
              <button
                type="button"
                onClick={() =>
                  onOpenWorkspace('valuation', primaryProject.code)
                }
                className="rounded-xl border border-[rgba(16,33,61,0.16)] bg-[#f6f8fc] px-3.5 py-2 text-sm font-semibold text-[#22375d] transition-colors hover:bg-[#eef3fb]"
              >
                {primaryProject.code} 가치평가 워크스페이스
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <section
        className="grid grid-cols-4 gap-3.5 max-[1280px]:grid-cols-2"
        aria-label="핵심 지표"
      >
        <article className="rounded-2xl border border-cw-cardBorder bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <span className="inline-flex rounded-full bg-[#eef3ff] px-2.5 py-1 text-xs font-semibold text-[#3f63ba]">
            조직
          </span>
          <span className="mt-3 block text-sm font-semibold text-[#5f7399]">
            운영 본부
          </span>
          <strong className="mt-2 block text-[1.85rem] font-bold text-[#172747]">
            {portfolio.overview.headquarterCount}
          </strong>
          <p className="mt-2 text-sm text-[#7589ad]">5개 본부 가동중</p>
        </article>
        <article className="rounded-2xl border border-cw-cardBorder bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <span className="inline-flex rounded-full bg-[#e8f7ff] px-2.5 py-1 text-xs font-semibold text-[#21739a]">
            운영
          </span>
          <span className="mt-3 block text-sm font-semibold text-[#5f7399]">
            활성 프로젝트
          </span>
          <strong className="mt-2 block text-[1.85rem] font-bold text-[#172747]">
            {portfolio.overview.projectCount}
          </strong>
          <p className="mt-2 text-sm text-[#7589ad]">총 20여개 동시 운영</p>
        </article>
        <article className="rounded-2xl border border-cw-cardBorder bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <span className="inline-flex rounded-full bg-[#ebfff7] px-2.5 py-1 text-xs font-semibold text-[#1d7e61]">
            재무
          </span>
          <span className="mt-3 block text-sm font-semibold text-[#5f7399]">
            총 예산
          </span>
          <strong className="mt-2 block text-[1.85rem] font-bold text-[#172747]">
            {formatKrwCompact(portfolio.overview.totalInvestmentKrw)}
          </strong>
          <p className="mt-2 text-sm text-[#7589ad]">
            집행 기준{' '}
            {formatKrwCompact(portfolio.overview.totalExpectedRevenueKrw)}
          </p>
        </article>
        <article className="rounded-2xl border border-cw-cardBorder bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <span className="inline-flex rounded-full bg-[#fff3f1] px-2.5 py-1 text-xs font-semibold text-[#b0503f]">
            주의
          </span>
          <span className="mt-3 block text-sm font-semibold text-[#5f7399]">
            미확인 경보
          </span>
          <strong className="mt-2 block text-[1.85rem] font-bold text-[#172747]">
            {portfolio.overview.conditionalCount}
          </strong>
          <p className="mt-2 text-sm text-[#7589ad]">클릭하여 확인</p>
        </article>
      </section>

      <section className="grid gap-2">
        <h3 className="m-0 text-lg font-bold text-[#162947]">
          재무 건전성 모니터링
        </h3>
        <p className="m-0 text-sm text-[#6f83a8]">
          본부별 집행률과 리스크 비중을 한 화면에서 확인합니다.
        </p>
      </section>

      <section className="grid grid-cols-[2fr_1fr] gap-4 max-[1280px]:grid-cols-1">
        <Panel
          title="본부별 예산 vs 집행"
          subtitle="본부 단위 집행 차이를 비교합니다."
        >
          <div className="grid gap-3">
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
                <article
                  key={headquarter.code}
                  className="grid gap-2 rounded-xl border border-slate-200/80 bg-[#f8faff] px-3.5 py-3"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <strong className="text-[0.94rem] text-[#1d2c4d]">
                      {headquarter.name}
                    </strong>
                    <span className="text-[0.88rem] text-[#7388ac]">
                      {ratio}% 집행
                    </span>
                  </div>
                  <span className="text-[0.82rem] text-[#7388ac]">
                    예산 {formatKrwCompact(headquarter.totalInvestmentKrw)} ·
                    집행 {formatKrwCompact(headquarter.totalExpectedRevenueKrw)}
                  </span>
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
          <div
            className="grid justify-items-center gap-3 py-2.5"
            aria-label="리스크 도넛"
          >
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
            <div className="grid w-full gap-1.5 rounded-xl border border-slate-200 bg-[#f9fbff] px-3 py-2.5 text-[0.82rem] font-semibold text-[#546991]">
              <span className="flex items-center justify-between">
                <span className="text-[#d14444]">CRITICAL</span>
                <span>
                  {riskCounts.high}건 (
                  {Math.round((riskCounts.high / totalRiskCount) * 100)}%)
                </span>
              </span>
              <span className="flex items-center justify-between">
                <span className="text-[#b0791a]">MEDIUM</span>
                <span>
                  {riskCounts.mid}건 (
                  {Math.round((riskCounts.mid / totalRiskCount) * 100)}%)
                </span>
              </span>
              <span className="flex items-center justify-between">
                <span className="text-[#278f45]">LOW</span>
                <span>
                  {riskCounts.low}건 (
                  {Math.round((riskCounts.low / totalRiskCount) * 100)}%)
                </span>
              </span>
            </div>
          </div>
        </Panel>
      </section>

      <section className="grid gap-2">
        <h3 className="m-0 text-lg font-bold text-[#162947]">집중 검토 대상</h3>
        <p className="m-0 text-sm text-[#6f83a8]">
          우선순위 프로젝트 지표와 즉시 실행 가능한 작업을 제공합니다.
        </p>
      </section>

      <section className="grid grid-cols-[2fr_1fr] gap-4 max-[1280px]:grid-cols-1">
        <Panel
          title="월별 원가 추이 (실적 vs 표준)"
          subtitle="우선순위 프로젝트 기준"
        >
          <ol className="m-0 grid list-none gap-2.5 p-0">
            {priorityProjects.slice(0, 5).map((project) => (
              <li
                key={project.code}
                className="grid gap-2 rounded-[16px] border border-[rgba(123,137,167,0.16)] bg-[#f8faff] px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2.5">
                  <strong className="text-[0.95rem] font-semibold text-[#20293d]">
                    {project.code} · {project.name}
                  </strong>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[0.73rem] font-semibold ${
                      project.risk === '높음'
                        ? 'bg-red-100 text-red-700'
                        : project.risk === '중간'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    리스크 {project.risk}
                  </span>
                </div>
                <div className="grid gap-1 text-[0.83rem] text-[#707a92]">
                  <span>
                    투자 {formatKrwCompact(project.investmentKrw)} / NPV{' '}
                    {formatKrwCompact(project.npvKrw)}
                  </span>
                  <small className="text-[#707a92]">
                    IRR {formatPercent(project.irr)} · 회수{' '}
                    {project.paybackYears.toFixed(1)}년
                  </small>
                </div>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel title="다음 의사결정" subtitle="역할 기반 현재 포커스">
          <article className="grid gap-2 rounded-[20px] border border-[rgba(123,137,167,0.12)] bg-[#f9fafc] p-[18px]">
            <strong className="text-[0.95rem] font-semibold text-[#20293d]">
              {selectedInsight.decisionFocus}
            </strong>
            <p className="m-0 leading-relaxed text-[#707a92]">
              {selectedInsight.summary}
            </p>
            <p className="m-0 leading-relaxed text-[#707a92]">
              {selectedInsight.nextAction}
            </p>
          </article>
          <div className="grid gap-2">
            {priorityProjects.slice(0, 2).map((project) => (
              <div
                key={project.code}
                className="grid gap-2 rounded-xl border border-slate-200 bg-white p-2.5"
              >
                <strong className="text-sm text-[#1d2c4d]">
                  {project.code} · {project.name}
                </strong>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenWorkspace('accounting', project.code)}
                    className="rounded-[12px] border border-[rgba(79,103,246,0.18)] bg-[rgba(79,103,246,0.08)] px-3 py-2 text-xs font-bold text-[#3d52dc] transition-colors hover:bg-[rgba(79,103,246,0.14)]"
                  >
                    원가 분석
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenWorkspace('valuation', project.code)}
                    className="rounded-[12px] border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-[#304564] transition-colors hover:bg-slate-50"
                  >
                    가치평가
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </section>
  );
}
