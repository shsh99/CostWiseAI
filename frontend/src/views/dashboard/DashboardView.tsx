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
  { label: 'DERIVATIVE', value: 95, color: '#19b1ca' },
  { label: 'EQUITY', value: 65, color: '#7d5de0' },
  { label: 'INFRA', value: 110, color: '#f3a108' },
  { label: 'PROJECT', value: 28, color: '#26be60' },
  { label: 'REAL_ESTATE', value: 45, color: '#e84f9d' },
  { label: 'STOCK', value: 92, color: '#22b0a2' }
];

export function DashboardView({
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

  const budgetMax = Math.max(
    1,
    ...orderedHeadquarters.map((item) => item.totalInvestmentKrw)
  );
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

  const chartWidth = 740;
  const chartHeight = 310;
  const tickCount = 5;
  const valueMax = Math.max(
    ...monthlyTrend.map((item) => Math.max(item.actual, item.standard)),
    1
  );
  const paddedMax = Math.ceil(valueMax / 100) * 100;
  const xStep = chartWidth / Math.max(1, monthlyTrend.length - 1);
  const scaleY = (value: number) =>
    chartHeight - (value / paddedMax) * chartHeight;
  const actualPoints = monthlyTrend
    .map((item, index) => `${index * xStep},${scaleY(item.actual)}`)
    .join(' ');
  const standardPoints = monthlyTrend
    .map((item, index) => `${index * xStep},${scaleY(item.standard)}`)
    .join(' ');

  const sortedReviews = [...portfolio.projects]
    .sort((a, b) => b.rank - a.rank)
    .slice(0, 8);

  return (
    <section className="grid gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-[2.05rem] font-extrabold tracking-[-0.015em] text-[#172a4a]">
            통합 대시보드
          </h2>
        </div>
        <span className="text-[1rem] text-[#667da8]">{now}</span>
      </header>

      <section className="grid grid-cols-4 gap-4 max-[1280px]:grid-cols-2">
        <article className="rounded-2xl border border-[#dce4f2] bg-white px-5 py-4 shadow-[0_2px_8px_rgba(12,26,56,0.05)]">
          <span className="inline-grid h-12 w-12 place-items-center rounded-xl bg-[#376de3] text-xl text-white">
            ▦
          </span>
          <strong className="mt-3 block text-[2.15rem] font-extrabold leading-none text-[#192b4b]">
            {portfolio.overview.headquarterCount}
          </strong>
          <span className="mt-2 block text-[1.03rem] font-semibold text-[#526a96]">
            운영 본부
          </span>
          <p className="mt-1 text-[0.94rem] text-[#7f92b3]">5개 본부 가동중</p>
        </article>
        <article className="rounded-2xl border border-[#dce4f2] bg-white px-5 py-4 shadow-[0_2px_8px_rgba(12,26,56,0.05)]">
          <span className="inline-grid h-12 w-12 place-items-center rounded-xl bg-[#1ca9c7] text-xl text-white">
            ⊞
          </span>
          <strong className="mt-3 block text-[2.15rem] font-extrabold leading-none text-[#192b4b]">
            {portfolio.overview.projectCount}
          </strong>
          <span className="mt-2 block text-[1.03rem] font-semibold text-[#526a96]">
            활성 프로젝트
          </span>
          <p className="mt-1 text-[0.94rem] text-[#7f92b3]">
            총 20여개 동시 운영
          </p>
        </article>
        <article className="rounded-2xl border border-[#dce4f2] bg-white px-5 py-4 shadow-[0_2px_8px_rgba(12,26,56,0.05)]">
          <span className="inline-grid h-12 w-12 place-items-center rounded-xl bg-[#28b95d] text-xl text-white">
            ⛁
          </span>
          <strong className="mt-3 block text-[2.15rem] font-extrabold leading-none text-[#192b4b]">
            {formatKrwCompact(portfolio.overview.totalInvestmentKrw)}
          </strong>
          <span className="mt-2 block text-[1.03rem] font-semibold text-[#526a96]">
            총 예산
          </span>
          <p className="mt-1 text-[0.94rem] text-[#7f92b3]">
            집행: {formatKrwCompact(portfolio.overview.totalExpectedRevenueKrw)}
          </p>
        </article>
        <article className="rounded-2xl border border-[#dce4f2] bg-white px-5 py-4 shadow-[0_2px_8px_rgba(12,26,56,0.05)]">
          <span className="inline-grid h-12 w-12 place-items-center rounded-xl bg-[#ef3b45] text-xl text-white">
            ⚠
          </span>
          <strong className="mt-3 block text-[2.15rem] font-extrabold leading-none text-[#192b4b]">
            {portfolio.overview.conditionalCount}
          </strong>
          <span className="mt-2 block text-[1.03rem] font-semibold text-[#526a96]">
            미확인 경보
          </span>
          <p className="mt-1 text-[0.94rem] text-[#7f92b3]">클릭하여 확인</p>
        </article>
      </section>

      <section className="grid grid-cols-[2fr_1fr] gap-4 max-[1280px]:grid-cols-1">
        <Panel title="본부별 예산 vs 집행">
          <div className="mb-4 flex justify-center gap-5 text-[0.97rem] font-semibold text-[#5d749f]">
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-10 rounded bg-[#3f79ea]" />
              예산
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-10 rounded bg-[#1ca9c7]" />
              집행
            </span>
          </div>
          <div className="grid gap-3.5">
            {orderedHeadquarters.map((item) => {
              const budgetWidth = Math.max(
                3,
                Math.round((item.totalInvestmentKrw / budgetMax) * 100)
              );
              const expenseWidth = Math.max(
                3,
                Math.round((item.totalExpectedRevenueKrw / budgetMax) * 100)
              );
              return (
                <article key={item.code} className="grid gap-1.5">
                  <div className="flex items-center justify-between text-[0.95rem] text-[#5f759f]">
                    <strong className="text-[1.08rem] text-[#1d3054]">
                      {item.name}
                    </strong>
                    <span>
                      {formatKrwCompact(item.totalInvestmentKrw)} /{' '}
                      {formatKrwCompact(item.totalExpectedRevenueKrw)}
                    </span>
                  </div>
                  <div className="grid gap-1.5">
                    <div className="h-3 overflow-hidden rounded-full bg-[#e7eef8]">
                      <span
                        className="block h-full rounded-full bg-[#3f79ea]"
                        style={{ width: `${budgetWidth}%` }}
                      />
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-[#e7eef8]">
                      <span
                        className="block h-full rounded-full bg-[#1ca9c7]"
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
          <div className="grid place-items-center gap-3 py-2">
            <div
              className="relative h-[270px] w-[270px] rounded-full after:absolute after:inset-[66px] after:rounded-full after:bg-white after:content-['']"
              style={{
                background: `conic-gradient(
                  #e52f2f 0% ${(riskCounts.high / riskTotal) * 100}%,
                  #f57a14 ${(riskCounts.high / riskTotal) * 100}% ${((riskCounts.high + riskCounts.mid) / riskTotal) * 100}%,
                  #f2a40c ${((riskCounts.high + riskCounts.mid) / riskTotal) * 100}% ${((riskCounts.high + riskCounts.mid) / riskTotal) * 100}%,
                  #24be62 ${((riskCounts.high + riskCounts.mid) / riskTotal) * 100}% 100%
                )`
              }}
            />
            <div className="flex flex-wrap items-center justify-center gap-3 text-[0.98rem] font-semibold text-[#60759f]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-7 rounded bg-[#e52f2f]" /> CRITICAL
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-7 rounded bg-[#f57a14]" /> HIGH
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-7 rounded bg-[#f2a40c]" /> MEDIUM
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-7 rounded bg-[#24be62]" /> LOW
              </span>
            </div>
          </div>
        </Panel>
      </section>

      <section className="grid grid-cols-[2fr_1fr] gap-4 max-[1280px]:grid-cols-1">
        <Panel title="월별 원가 추이 (실적 vs 표준)">
          <div className="mb-4 flex justify-center gap-5 text-[0.97rem] font-semibold text-[#5d749f]">
            <span className="inline-flex items-center gap-2">
              <span className="h-[3px] w-10 rounded bg-[#2f57d8]" /> 실제원가
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-[3px] w-10 rounded border-2 border-dashed border-[#18a169]" />{' '}
              표준원가
            </span>
          </div>
          <div className="rounded-xl border border-[#dce5f4] bg-[#f9fbff] px-3 py-3">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight + 38}`}
              className="w-full"
            >
              {Array.from({ length: tickCount }).map((_, index) => {
                const y = (chartHeight / (tickCount - 1)) * index;
                return (
                  <line
                    key={`grid-${index}`}
                    x1="0"
                    y1={y}
                    x2={chartWidth}
                    y2={y}
                    stroke="#e4ebf6"
                    strokeWidth="1"
                  />
                );
              })}
              <polyline
                points={actualPoints}
                fill="none"
                stroke="#2f57d8"
                strokeWidth="4"
              />
              <polyline
                points={standardPoints}
                fill="none"
                stroke="#18a169"
                strokeWidth="4"
                strokeDasharray="10 8"
              />
              {monthlyTrend.map((item, index) => {
                const x = index * xStep;
                const yActual = scaleY(item.actual);
                const yStandard = scaleY(item.standard);
                return (
                  <g key={item.month}>
                    <circle cx={x} cy={yActual} r="5" fill="#2f57d8" />
                    <circle cx={x} cy={yStandard} r="5" fill="#18a169" />
                    <text
                      x={x}
                      y={chartHeight + 28}
                      textAnchor="middle"
                      fontSize="14"
                      fill="#62789f"
                    >
                      {item.month}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </Panel>

        <Panel title="유형별 예산">
          <div className="relative mx-auto mt-1 grid h-[310px] w-[310px] place-items-center rounded-full border border-[#dee6f4] bg-[#fafdff]">
            <div className="absolute inset-[18%] rounded-full border border-[#e2e9f5]" />
            <div className="absolute inset-[34%] rounded-full border border-[#e2e9f5]" />
            <div className="absolute inset-[50%] rounded-full border border-[#e2e9f5]" />
            <div className="absolute h-[2px] w-full bg-[#e2e9f5]" />
            <div className="absolute h-full w-[2px] bg-[#e2e9f5]" />
            {categoryBudgets.map((item, index) => {
              const angle = (360 / categoryBudgets.length) * index - 90;
              const length =
                46 +
                (item.value /
                  Math.max(...categoryBudgets.map((x) => x.value))) *
                  86;
              return (
                <div
                  key={item.label}
                  className="absolute left-1/2 top-1/2 origin-left rounded-full"
                  style={{
                    width: `${length}px`,
                    height: '12px',
                    transform: `translateY(-50%) rotate(${angle}deg)`,
                    background: item.color
                  }}
                />
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-2 text-[0.9rem] font-semibold text-[#60759f]">
            {categoryBudgets.map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-1.5"
              >
                <span
                  className="h-2.5 w-6 rounded"
                  style={{ background: item.color }}
                />
                {item.label}
              </span>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid grid-cols-[2fr_1fr] gap-4 max-[1280px]:grid-cols-1">
        <Panel title="본부별 현황">
          <div className="overflow-hidden rounded-xl border border-[#dce5f4] bg-white">
            <table className="min-w-full text-[0.98rem]">
              <thead className="bg-[#eef3fb] text-[#5c729a]">
                <tr>
                  <th className="px-4 py-3 text-left">코드</th>
                  <th className="px-4 py-3 text-left">본부</th>
                  <th className="px-4 py-3 text-left">프로젝트</th>
                  <th className="px-4 py-3 text-left">예산</th>
                  <th className="px-4 py-3 text-left">집행</th>
                  <th className="px-4 py-3 text-left">집행률</th>
                </tr>
              </thead>
              <tbody>
                {orderedHeadquarters.map((item) => {
                  const runRate =
                    item.totalInvestmentKrw === 0
                      ? 0
                      : item.totalExpectedRevenueKrw / item.totalInvestmentKrw;
                  return (
                    <tr key={item.code} className="border-t border-[#e6edf8]">
                      <td className="px-4 py-3 font-semibold text-[#21375d]">
                        {item.code.replace('HQ', 'DIV-')}
                      </td>
                      <td className="px-4 py-3 text-[#223a61]">{item.name}</td>
                      <td className="px-4 py-3 text-[#2c4168]">
                        {item.projectCount}
                      </td>
                      <td className="px-4 py-3 text-[#2c4168]">
                        {formatKrwCompact(item.totalInvestmentKrw)}
                      </td>
                      <td className="px-4 py-3 text-[#2c4168]">
                        {formatKrwCompact(item.totalExpectedRevenueKrw)}
                      </td>
                      <td
                        className={`px-4 py-3 font-bold ${
                          runRate > 0.9 ? 'text-[#d73636]' : 'text-[#16965f]'
                        }`}
                      >
                        {formatPercent(runRate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="최근 평가">
          <div className="grid max-h-[420px] gap-2 overflow-y-auto pr-1">
            {sortedReviews.map((project) => (
              <article
                key={project.code}
                className="rounded-xl border border-[#dce5f4] bg-[#f9fbff] px-3.5 py-2.5"
              >
                <span className="text-xs text-[#6b83ab]">
                  2026-03-31 · {project.assetCategory.toUpperCase()}
                </span>
                <strong className="mt-1 block text-[1rem] text-[#1e3358]">
                  {project.name}
                </strong>
                <p className="mt-1 text-[0.92rem] text-[#667ea7]">
                  NPV {formatKrwCompact(project.npvKrw)} · IRR{' '}
                  {formatPercent(project.irr)} · {project.status}
                </p>
              </article>
            ))}
            <article className="rounded-xl border border-[#dce5f4] bg-[#f9fbff] px-3.5 py-2.5 text-[0.92rem] text-[#6279a3]">
              {selectedInsight.nextAction}
            </article>
            {priorityProjects[0] ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onOpenWorkspace('accounting', priorityProjects[0].code)
                  }
                  className="rounded-lg border border-[#c8d5ea] bg-[#eef3fc] px-2.5 py-2 text-xs font-semibold text-[#2f57c8]"
                >
                  원가 워크스페이스
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onOpenWorkspace('valuation', priorityProjects[0].code)
                  }
                  className="rounded-lg border border-[#ccd8eb] bg-white px-2.5 py-2 text-xs font-semibold text-[#3a517a]"
                >
                  가치평가 워크스페이스
                </button>
              </div>
            ) : null}
          </div>
        </Panel>
      </section>
    </section>
  );
}
