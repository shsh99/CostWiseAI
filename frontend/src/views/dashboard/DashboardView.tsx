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

export function DashboardView({
  portfolio,
  selectedInsight,
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
  const totalInvestment = Math.max(
    1,
    orderedHeadquarters.reduce(
      (sum, headquarter) => sum + headquarter.totalInvestmentKrw,
      0
    )
  );

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
  const riskTotal = Math.max(
    1,
    riskCounts.high + riskCounts.mid + riskCounts.low
  );
  const monthlyTrend = [
    { month: '2026-01', actual: 1120, standard: 1080 },
    { month: '2026-02', actual: 1065, standard: 1010 },
    { month: '2026-03', actual: 825, standard: 780 }
  ];
  const categoryBudgets = [
    { label: 'BOND', value: 150 },
    { label: 'DERIVATIVE', value: 95 },
    { label: 'EQUITY', value: 65 },
    { label: 'INFRA', value: 110 },
    { label: 'PROJECT', value: 28 },
    { label: 'REAL_ESTATE', value: 45 },
    { label: 'STOCK', value: 92 }
  ];
  const maxCategoryBudget = Math.max(
    ...categoryBudgets.map((item) => item.value),
    1
  );
  const recentReviews = portfolio.projects.slice(0, 6);

  return (
    <section className="grid gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-[2.05rem] font-extrabold tracking-[-0.01em] text-[#192a49]">
            통합 대시보드
          </h2>
          <p className="mt-1 text-[1.05rem] text-[#62779d]">
            전사 5개 본부 · 프로젝트 원가/평가 현황
          </p>
        </div>
        <span className="text-sm text-[#667ca4]">{now}</span>
      </header>

      <section className="grid grid-cols-4 gap-4 max-[1280px]:grid-cols-2">
        <article className="rounded-2xl border border-cw-cardBorder bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <span className="inline-grid h-12 w-12 place-items-center rounded-xl bg-[#2f67e3] text-xl text-white">
            ▦
          </span>
          <strong className="mt-3 block text-[2.15rem] font-extrabold text-[#172747]">
            {portfolio.overview.headquarterCount}
          </strong>
          <span className="block text-[1.02rem] font-semibold text-[#536c96]">
            운영 본부
          </span>
          <p className="mt-1 text-[0.9rem] text-[#8092b1]">5개 본부 가동중</p>
        </article>
        <article className="rounded-2xl border border-cw-cardBorder bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <span className="inline-grid h-12 w-12 place-items-center rounded-xl bg-[#17a8c8] text-xl text-white">
            ⊞
          </span>
          <strong className="mt-3 block text-[2.15rem] font-extrabold text-[#172747]">
            {portfolio.overview.projectCount}
          </strong>
          <span className="block text-[1.02rem] font-semibold text-[#536c96]">
            활성 프로젝트
          </span>
          <p className="mt-1 text-[0.9rem] text-[#8092b1]">
            총 20여개 동시 운영
          </p>
        </article>
        <article className="rounded-2xl border border-cw-cardBorder bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <span className="inline-grid h-12 w-12 place-items-center rounded-xl bg-[#22b659] text-xl text-white">
            ⛁
          </span>
          <strong className="mt-3 block text-[2.15rem] font-extrabold text-[#172747]">
            {formatKrwCompact(portfolio.overview.totalInvestmentKrw)}
          </strong>
          <span className="block text-[1.02rem] font-semibold text-[#536c96]">
            총 예산
          </span>
          <p className="mt-1 text-[0.9rem] text-[#8092b1]">
            집행: {formatKrwCompact(portfolio.overview.totalExpectedRevenueKrw)}
          </p>
        </article>
        <article className="rounded-2xl border border-cw-cardBorder bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <span className="inline-grid h-12 w-12 place-items-center rounded-xl bg-[#ef3b45] text-xl text-white">
            ⚠
          </span>
          <strong className="mt-3 block text-[2.15rem] font-extrabold text-[#172747]">
            {portfolio.overview.conditionalCount}
          </strong>
          <span className="block text-[1.02rem] font-semibold text-[#536c96]">
            미확인 경보
          </span>
          <p className="mt-1 text-[0.9rem] text-[#8092b1]">클릭하여 확인</p>
        </article>
      </section>

      <section className="grid grid-cols-[2fr_1fr] gap-4 max-[1280px]:grid-cols-1">
        <Panel title="본부별 예산 vs 집행">
          <div className="mb-3 flex items-center justify-center gap-5 text-sm font-semibold text-[#5e739a]">
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-8 rounded bg-[#3f79ea]" />
              예산
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-8 rounded bg-[#17acc8]" />
              집행
            </span>
          </div>
          <div className="grid gap-3">
            {orderedHeadquarters.map((headquarter) => {
              const budgetWidth = Math.max(
                3,
                Math.round(
                  (headquarter.totalInvestmentKrw / totalInvestment) * 100
                )
              );
              const expenseWidth = Math.max(
                3,
                Math.round(
                  (headquarter.totalExpectedRevenueKrw / totalInvestment) * 100
                )
              );
              return (
                <article key={headquarter.code} className="grid gap-1.5">
                  <div className="flex items-center justify-between text-[0.88rem] text-[#5f7399]">
                    <strong className="text-[#1d2c4d]">
                      {headquarter.name}
                    </strong>
                    <span>
                      {formatKrwCompact(headquarter.totalInvestmentKrw)} /{' '}
                      {formatKrwCompact(headquarter.totalExpectedRevenueKrw)}
                    </span>
                  </div>
                  <div className="grid gap-1">
                    <div className="h-2.5 overflow-hidden rounded-full bg-[#edf2fa]">
                      <span
                        className="block h-full rounded-full bg-[#3f79ea]"
                        style={{ width: `${budgetWidth}%` }}
                      />
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[#edf2fa]">
                      <span
                        className="block h-full rounded-full bg-[#17acc8]"
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
              className="relative h-[270px] w-[270px] rounded-full after:absolute after:inset-[68px] after:rounded-full after:bg-white after:content-['']"
              style={{
                background: `conic-gradient(
                  #e52f2f 0% ${(riskCounts.high / riskTotal) * 100}%,
                  #fa7a15 ${(riskCounts.high / riskTotal) * 100}% ${((riskCounts.high + riskCounts.mid) / riskTotal) * 100}%,
                  #24be62 ${((riskCounts.high + riskCounts.mid) / riskTotal) * 100}% 100%
                )`
              }}
            />
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-[#63779f]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-6 rounded bg-[#e52f2f]" />
                CRITICAL
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-6 rounded bg-[#fa7a15]" />
                HIGH
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-6 rounded bg-[#f0a20b]" />
                MEDIUM
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-6 rounded bg-[#24be62]" />
                LOW
              </span>
            </div>
          </div>
        </Panel>
      </section>

      <section className="grid grid-cols-[2fr_1fr] gap-4 max-[1280px]:grid-cols-1">
        <Panel title="월별 원가 추이 (실적 vs 표준)">
          <div className="overflow-hidden rounded-xl border border-[#dbe4f2] bg-[#f9fbff]">
            <table className="min-w-full text-sm">
              <thead className="bg-[#eef3fb] text-[#5b7097]">
                <tr>
                  <th className="px-4 py-3 text-left">월</th>
                  <th className="px-4 py-3 text-left">실제원가</th>
                  <th className="px-4 py-3 text-left">표준원가</th>
                  <th className="px-4 py-3 text-left">차이율</th>
                </tr>
              </thead>
              <tbody>
                {monthlyTrend.map((item) => {
                  const diffRate =
                    item.standard === 0
                      ? 0
                      : (item.actual - item.standard) / item.standard;
                  return (
                    <tr key={item.month} className="border-t border-[#e6edf8]">
                      <td className="px-4 py-3 font-semibold text-[#1f3458]">
                        {item.month}
                      </td>
                      <td className="px-4 py-3 text-[#2d446b]">
                        {item.actual.toFixed(1)}억
                      </td>
                      <td className="px-4 py-3 text-[#2d446b]">
                        {item.standard.toFixed(1)}억
                      </td>
                      <td
                        className={`px-4 py-3 font-semibold ${
                          diffRate > 0 ? 'text-[#db3a3a]' : 'text-[#1b9a62]'
                        }`}
                      >
                        {formatPercent(diffRate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="유형별 예산">
          <div className="grid gap-2">
            {categoryBudgets.map((item) => (
              <article key={item.label} className="grid gap-1">
                <div className="flex items-center justify-between text-[0.86rem] text-[#5f7399]">
                  <strong className="text-[#1e2f4c]">{item.label}</strong>
                  <span>{item.value.toFixed(1)}억</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[#eaf0f9]">
                  <span
                    className="block h-full rounded-full bg-[linear-gradient(90deg,#3f79ea,#17acc8)]"
                    style={{
                      width: `${Math.round((item.value / maxCategoryBudget) * 100)}%`
                    }}
                  />
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid grid-cols-[2fr_1fr] gap-4 max-[1280px]:grid-cols-1">
        <Panel title="본부별 현황">
          <div className="overflow-hidden rounded-xl border border-[#dbe4f2] bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-[#eef3fb] text-[#5b7097]">
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
                {orderedHeadquarters.map((headquarter) => {
                  const runRate =
                    headquarter.totalInvestmentKrw === 0
                      ? 0
                      : headquarter.totalExpectedRevenueKrw /
                        headquarter.totalInvestmentKrw;
                  return (
                    <tr
                      key={headquarter.code}
                      className="border-t border-[#e6edf8]"
                    >
                      <td className="px-4 py-3 font-semibold text-[#22375d]">
                        {headquarter.code.replace('HQ', 'DIV-')}
                      </td>
                      <td className="px-4 py-3 text-[#22375d]">
                        {headquarter.name}
                      </td>
                      <td className="px-4 py-3 text-[#2b3f63]">
                        {headquarter.projectCount}
                      </td>
                      <td className="px-4 py-3 text-[#2b3f63]">
                        {formatKrwCompact(headquarter.totalInvestmentKrw)}
                      </td>
                      <td className="px-4 py-3 text-[#2b3f63]">
                        {formatKrwCompact(headquarter.totalExpectedRevenueKrw)}
                      </td>
                      <td
                        className={`px-4 py-3 font-bold ${
                          runRate > 0.9 ? 'text-[#d73333]' : 'text-[#16955f]'
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
          <div className="grid max-h-[440px] gap-2 overflow-y-auto pr-1">
            {recentReviews.map((project) => (
              <article
                key={project.code}
                className="rounded-xl border border-[#dbe4f2] bg-[#f9fbff] px-3 py-2.5"
              >
                <span className="text-xs text-[#6b82aa]">
                  {project.code} · {project.assetCategory}
                </span>
                <strong className="mt-1 block text-[0.96rem] text-[#1e2f4c]">
                  {project.name}
                </strong>
                <p className="mt-1 text-sm text-[#647ca5]">
                  NPV {formatKrwCompact(project.npvKrw)} · IRR{' '}
                  {formatPercent(project.irr)} · {project.status}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenWorkspace('valuation', project.code)}
                    className="rounded-lg border border-[#ccd7ea] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#395078]"
                  >
                    평가 상세
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenWorkspace('accounting', project.code)}
                    className="rounded-lg border border-[#c7d4ea] bg-[#eef3fc] px-2.5 py-1.5 text-xs font-semibold text-[#2f57c8]"
                  >
                    원가 보기
                  </button>
                </div>
              </article>
            ))}
            <article className="rounded-xl border border-[#dbe4f2] bg-[#f9fbff] px-3 py-2.5 text-sm text-[#62779d]">
              {selectedInsight.nextAction}
            </article>
          </div>
        </Panel>
      </section>
    </section>
  );
}
