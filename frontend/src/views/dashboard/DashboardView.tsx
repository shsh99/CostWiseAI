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

const hqOrder = [
  '주식운용본부',
  '채권운용본부',
  '대체투자본부',
  '파생상품본부',
  '리스크관리본부'
];

const hqCodeToLabel: Record<string, string> = {
  HQ01: '주식운용본부',
  HQ02: '채권운용본부',
  HQ03: '대체투자본부',
  HQ04: '파생상품본부',
  HQ05: '리스크관리본부'
};

const monthlyTrend = [
  { month: '2026-01', actual: 1120, standard: 1080 },
  { month: '2026-02', actual: 1065, standard: 1010 },
  { month: '2026-03', actual: 825, standard: 780 }
];

const categoryBudgets = [
  { label: 'BOND', value: 150, color: '#3f79ea' },
  { label: 'DERIVATIVE', value: 95, color: '#17acc8' },
  { label: 'EQUITY', value: 65, color: '#7a56dc' },
  { label: 'INFRA', value: 110, color: '#f2a50f' },
  { label: 'PROJECT', value: 28, color: '#22b659' },
  { label: 'REAL_ESTATE', value: 45, color: '#e9509c' },
  { label: 'STOCK', value: 92, color: '#23b2a4' }
];

export function DashboardView({
  decisionSignals,
  selectedInsight,
  portfolio,
  priorityProjects,
  onOpenWorkspace
}: DashboardViewProps) {
  const now = new Date().toLocaleString('sv-SE').replace('T', ' ');
  const headquarterMap = new Map(
    portfolio.headquarters.map((item) => [
      hqCodeToLabel[item.code] ?? item.name,
      item
    ])
  );
  const orderedHeadquarters = hqOrder
    .map((name) => headquarterMap.get(name))
    .filter(
      (item): item is NonNullable<(typeof portfolio.headquarters)[number]> =>
        Boolean(item)
    );

  const maxBudget = Math.max(
    1,
    ...orderedHeadquarters.map((item) => item.totalInvestmentKrw)
  );
  const maxTrend = Math.max(...monthlyTrend.map((item) => item.actual), 1);
  const minTrend = Math.min(...monthlyTrend.map((item) => item.standard), 0);
  const trendRange = Math.max(1, maxTrend - minTrend);
  const chartWidth = 680;
  const chartHeight = 240;
  const xStep = chartWidth / Math.max(1, monthlyTrend.length - 1);
  const actualPoints = monthlyTrend
    .map((point, index) => {
      const x = index * xStep;
      const y =
        chartHeight - ((point.actual - minTrend) / trendRange) * chartHeight;
      return `${x},${y}`;
    })
    .join(' ');
  const standardPoints = monthlyTrend
    .map((point, index) => {
      const x = index * xStep;
      const y =
        chartHeight - ((point.standard - minTrend) / trendRange) * chartHeight;
      return `${x},${y}`;
    })
    .join(' ');

  const riskCounts = portfolio.projects.reduce(
    (acc, project) => {
      if (project.risk === '높음') acc.high += 1;
      else if (project.risk === '중간') acc.mid += 1;
      else acc.low += 1;
      return acc;
    },
    { high: 0, mid: 0, low: 0 }
  );
  const riskTotal = Math.max(
    1,
    riskCounts.high + riskCounts.mid + riskCounts.low
  );
  const quickFocus = priorityProjects.slice(0, 5);
  const maxCategoryBudget = Math.max(
    ...categoryBudgets.map((item) => item.value),
    1
  );

  return (
    <section className="grid gap-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="m-0 text-[2.55rem] font-extrabold tracking-[-0.02em] text-[#172a4a]">
            통합 대시보드
          </h2>
          <p className="mt-1.5 text-[1.2rem] leading-snug text-[#5e759f]">
            전사 5개 본부 · 프로젝트 원가/평가 현황
          </p>
        </div>
        <span className="text-[1.05rem] font-medium text-[#6780aa]">{now}</span>
      </header>

      <section className="grid grid-cols-4 gap-4 max-[1280px]:grid-cols-2">
        <article className="rounded-3xl border border-[#d7e0f0] bg-white px-6 py-5 shadow-[0_10px_24px_rgba(13,28,58,0.07)]">
          <span className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-[#356ee6] text-2xl text-white">
            ▦
          </span>
          <strong className="mt-4 block text-[3rem] font-extrabold leading-none text-[#172a4a]">
            {portfolio.overview.headquarterCount}
          </strong>
          <span className="mt-2 block text-[1.3rem] font-bold text-[#526b96]">
            운영 본부
          </span>
          <p className="mt-1 text-[1.02rem] text-[#8396b6]">5개 본부 가동중</p>
        </article>
        <article className="rounded-3xl border border-[#d7e0f0] bg-white px-6 py-5 shadow-[0_10px_24px_rgba(13,28,58,0.07)]">
          <span className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-[#1ba8c7] text-2xl text-white">
            ⊞
          </span>
          <strong className="mt-4 block text-[3rem] font-extrabold leading-none text-[#172a4a]">
            {portfolio.overview.projectCount}
          </strong>
          <span className="mt-2 block text-[1.3rem] font-bold text-[#526b96]">
            활성 프로젝트
          </span>
          <p className="mt-1 text-[1.02rem] text-[#8396b6]">
            총 20여개 동시 운영
          </p>
        </article>
        <article className="rounded-3xl border border-[#d7e0f0] bg-white px-6 py-5 shadow-[0_10px_24px_rgba(13,28,58,0.07)]">
          <span className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-[#23b45e] text-2xl text-white">
            ⛁
          </span>
          <strong className="mt-4 block text-[3rem] font-extrabold leading-none text-[#172a4a]">
            {formatKrwCompact(portfolio.overview.totalInvestmentKrw)}
          </strong>
          <span className="mt-2 block text-[1.3rem] font-bold text-[#526b96]">
            총 예산
          </span>
          <p className="mt-1 text-[1.02rem] text-[#8396b6]">
            집행: {formatKrwCompact(portfolio.overview.totalExpectedRevenueKrw)}
          </p>
        </article>
        <article className="rounded-3xl border border-[#d7e0f0] bg-white px-6 py-5 shadow-[0_10px_24px_rgba(13,28,58,0.07)]">
          <span className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-[#ef3b45] text-2xl text-white">
            ⚠
          </span>
          <strong className="mt-4 block text-[3rem] font-extrabold leading-none text-[#172a4a]">
            {portfolio.overview.conditionalCount}
          </strong>
          <span className="mt-2 block text-[1.3rem] font-bold text-[#526b96]">
            미확인 경보
          </span>
          <p className="mt-1 text-[1.02rem] text-[#8396b6]">클릭하여 확인</p>
        </article>
      </section>

      <section className="grid grid-cols-[2fr_1fr] gap-4 max-[1280px]:grid-cols-1">
        <Panel title="본부별 예산 vs 집행">
          <div className="mb-4 flex justify-center gap-6 text-[1rem] font-semibold text-[#5e759f]">
            <span className="inline-flex items-center gap-2">
              <span className="h-3.5 w-10 rounded bg-[#3f79ea]" /> 예산
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3.5 w-10 rounded bg-[#1ba8c7]" /> 집행
            </span>
          </div>
          <div className="grid gap-3.5">
            {orderedHeadquarters.map((headquarter) => {
              const budgetWidth = Math.max(
                4,
                Math.round((headquarter.totalInvestmentKrw / maxBudget) * 100)
              );
              const expenseWidth = Math.max(
                4,
                Math.round(
                  (headquarter.totalExpectedRevenueKrw / maxBudget) * 100
                )
              );
              return (
                <article key={headquarter.code} className="grid gap-1.5">
                  <div className="flex items-center justify-between text-[1rem] text-[#5d759f]">
                    <strong className="text-[1.2rem] text-[#1a2f53]">
                      {headquarter.name}
                    </strong>
                    <span>
                      {formatKrwCompact(headquarter.totalInvestmentKrw)} /{' '}
                      {formatKrwCompact(headquarter.totalExpectedRevenueKrw)}
                    </span>
                  </div>
                  <div className="grid gap-1.5">
                    <div className="h-3 overflow-hidden rounded-full bg-[#e8eef8]">
                      <span
                        className="block h-full rounded-full bg-[#3f79ea]"
                        style={{ width: `${budgetWidth}%` }}
                      />
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-[#e8eef8]">
                      <span
                        className="block h-full rounded-full bg-[#1ba8c7]"
                        style={{ width: `${expenseWidth}%` }}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </Panel>

        <Panel title="리스크 분포">
          <div className="grid place-items-center gap-4 py-3">
            <div
              className="relative h-[280px] w-[280px] rounded-full after:absolute after:inset-[68px] after:rounded-full after:bg-white after:shadow-[inset_0_0_0_1px_#e4ebf8] after:content-['']"
              style={{
                background: `conic-gradient(
                  #e52f2f 0% ${(riskCounts.high / riskTotal) * 100}%,
                  #f67a13 ${(riskCounts.high / riskTotal) * 100}% ${((riskCounts.high + riskCounts.mid) / riskTotal) * 100}%,
                  #24be62 ${((riskCounts.high + riskCounts.mid) / riskTotal) * 100}% 100%
                )`
              }}
            />
            <div className="flex flex-wrap items-center justify-center gap-3 text-[1.02rem] font-semibold text-[#5f749d]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-8 rounded bg-[#e52f2f]" /> CRITICAL
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-8 rounded bg-[#f67a13]" /> HIGH
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-8 rounded bg-[#f0a20b]" /> MEDIUM
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-8 rounded bg-[#24be62]" /> LOW
              </span>
            </div>
          </div>
        </Panel>
      </section>

      <section className="grid grid-cols-[2fr_1fr] gap-4 max-[1280px]:grid-cols-1">
        <Panel title="월별 원가 추이 (실적 vs 표준)">
          <div className="mb-3 flex items-center justify-center gap-5 text-[1rem] font-semibold text-[#5f749d]">
            <span className="inline-flex items-center gap-2">
              <span className="h-[3px] w-10 rounded bg-[#2f57d8]" />
              실제원가
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-[3px] w-10 rounded border-2 border-dashed border-[#16a268]" />
              표준원가
            </span>
          </div>
          <div className="rounded-2xl border border-[#dce5f4] bg-[#f9fbff] p-4">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight + 36}`}
              className="w-full"
            >
              <line
                x1="0"
                y1={chartHeight}
                x2={chartWidth}
                y2={chartHeight}
                stroke="#d3dded"
                strokeWidth="1"
              />
              <line
                x1="0"
                y1={chartHeight * 0.66}
                x2={chartWidth}
                y2={chartHeight * 0.66}
                stroke="#e2e9f5"
                strokeWidth="1"
              />
              <line
                x1="0"
                y1={chartHeight * 0.33}
                x2={chartWidth}
                y2={chartHeight * 0.33}
                stroke="#e2e9f5"
                strokeWidth="1"
              />
              <polyline
                points={actualPoints}
                fill="none"
                stroke="#2f57d8"
                strokeWidth="4"
              />
              <polyline
                points={standardPoints}
                fill="none"
                stroke="#16a268"
                strokeWidth="4"
                strokeDasharray="10 8"
              />
              {monthlyTrend.map((point, index) => {
                const x = index * xStep;
                const yActual =
                  chartHeight -
                  ((point.actual - minTrend) / trendRange) * chartHeight;
                const yStandard =
                  chartHeight -
                  ((point.standard - minTrend) / trendRange) * chartHeight;
                return (
                  <g key={point.month}>
                    <circle cx={x} cy={yActual} r="5.5" fill="#2f57d8" />
                    <circle cx={x} cy={yStandard} r="5.5" fill="#16a268" />
                    <text
                      x={x}
                      y={chartHeight + 28}
                      textAnchor="middle"
                      fontSize="14"
                      fill="#62779d"
                    >
                      {point.month}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </Panel>

        <Panel title="유형별 예산">
          <div className="grid gap-3">
            {categoryBudgets.map((item) => (
              <article
                key={item.label}
                className="grid gap-1.5 rounded-xl border border-[#e0e8f5] bg-[#f9fbff] px-3 py-2.5"
              >
                <div className="flex items-center justify-between text-[0.95rem] text-[#5f759f]">
                  <strong className="text-[#1f3359]">{item.label}</strong>
                  <span>{item.value.toFixed(1)}억</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[#e4ebf6]">
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${Math.round((item.value / maxCategoryBudget) * 100)}%`,
                      background: item.color
                    }}
                  />
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid grid-cols-[2fr_1fr] gap-4 max-[1280px]:grid-cols-1">
        <Panel title="최근 평가">
          <div className="grid max-h-[360px] gap-2.5 overflow-y-auto pr-1">
            {quickFocus.map((project) => (
              <article
                key={project.code}
                className="rounded-xl border border-[#dce5f4] bg-[#f9fbff] px-4 py-3"
              >
                <span className="text-xs text-[#6b82aa]">
                  {project.code} · {project.assetCategory}
                </span>
                <strong className="mt-1.5 block text-[1.03rem] text-[#1f3359]">
                  {project.name}
                </strong>
                <p className="mt-1 text-[0.94rem] text-[#657da6]">
                  NPV {formatKrwCompact(project.npvKrw)} · IRR{' '}
                  {formatPercent(project.irr)}
                </p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="다음 액션">
          <article className="rounded-2xl border border-[#dce5f4] bg-[#f9fbff] px-4 py-3">
            <strong className="text-[1.08rem] text-[#1f3359]">
              {selectedInsight.decisionFocus}
            </strong>
            <p className="mt-2 text-[0.97rem] leading-relaxed text-[#5f759f]">
              {selectedInsight.nextAction}
            </p>
          </article>
          <div className="mt-3 grid gap-2.5">
            {decisionSignals.slice(0, 2).map((signal) => (
              <article
                key={signal.label}
                className="rounded-xl border border-[#dce5f4] bg-white px-3 py-2.5 text-[0.93rem]"
              >
                <span className="text-[#6c82aa]">{signal.label}</span>
                <strong className="mt-1 block text-[#1f3359]">
                  {signal.value}
                </strong>
              </article>
            ))}
            {priorityProjects[0] ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onOpenWorkspace('accounting', priorityProjects[0].code)
                  }
                  className="rounded-lg border border-[#c7d4ea] bg-[#eef3fc] px-3 py-2 text-xs font-semibold text-[#2f57c8]"
                >
                  원가 보기
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onOpenWorkspace('valuation', priorityProjects[0].code)
                  }
                  className="rounded-lg border border-[#ccd7ea] bg-white px-3 py-2 text-xs font-semibold text-[#395078]"
                >
                  가치평가
                </button>
              </div>
            ) : null}
          </div>
        </Panel>
      </section>
    </section>
  );
}
