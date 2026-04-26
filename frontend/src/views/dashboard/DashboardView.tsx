/* eslint-disable no-unused-vars */
import { type ReactNode, useEffect, useRef } from 'react';
import { formatKrwCompact, formatPercent } from '../../app/format';
import type {
  PortfolioSummary,
  ProjectSummary,
  RoleInsight
} from '../../app/portfolioData';
import { Panel } from '../../shared/components/Panel';
import type { Chart as ChartJS } from 'chart.js';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckSquare,
  Coins,
  Layers3,
  LineChart,
  PieChart,
  WalletCards
} from 'lucide-react';

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

function MetricIcon({
  bgClassName,
  children
}: {
  bgClassName: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-grid h-9 w-9 place-items-center rounded-lg text-white ${bgClassName}`}
    >
      {children}
    </span>
  );
}

function PanelTitleIcon({ children }: { children: ReactNode }) {
  return (
    <span className="inline-grid h-[18px] w-[18px] place-items-center">
      {children}
    </span>
  );
}

export function DashboardView({
  selectedInsight,
  portfolio,
  priorityProjects,
  onOpenWorkspace
}: DashboardViewProps) {
  const divisionChartRef = useRef<HTMLCanvasElement | null>(null);
  const riskChartRef = useRef<HTMLCanvasElement | null>(null);
  const trendChartRef = useRef<HTMLCanvasElement | null>(null);
  const typeChartRef = useRef<HTMLCanvasElement | null>(null);
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

  const riskCounts = portfolio.projects.reduce(
    (acc, project) => {
      if (project.risk === '높음') acc.high += 1;
      else if (project.risk === '중간') acc.mid += 1;
      else acc.low += 1;
      return acc;
    },
    { high: 0, mid: 0, low: 0 }
  );
  useEffect(() => {
    let mounted = true;
    const charts: ChartJS[] = [];

    async function setupCharts() {
      const { default: Chart } = await import('chart.js/auto');
      if (!mounted) {
        return;
      }

      const divisionCanvas = divisionChartRef.current;
      if (divisionCanvas) {
        charts.push(
          new Chart(divisionCanvas, {
            type: 'bar',
            data: {
              labels: orderedHeadquarters.map((item) => item.name),
              datasets: [
                {
                  label: '예산',
                  data: orderedHeadquarters.map(
                    (item) => item.totalInvestmentKrw / 100000000
                  ),
                  borderRadius: 8,
                  maxBarThickness: 30,
                  backgroundColor: '#3f79ea'
                },
                {
                  label: '집행',
                  data: orderedHeadquarters.map(
                    (item) => item.totalExpectedRevenueKrw / 100000000
                  ),
                  borderRadius: 8,
                  maxBarThickness: 30,
                  backgroundColor: '#19b1ca'
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              interaction: { mode: 'index', intersect: false },
              plugins: {
                legend: {
                  position: 'top',
                  labels: { boxWidth: 18, boxHeight: 8, useBorderRadius: true }
                },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const value = Number(context.raw ?? 0);
                      return `${context.dataset.label}: ${value.toFixed(1)}억`;
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: { color: '#e7edf7' },
                  ticks: {
                    callback: (value) => `${value}억`
                  }
                },
                x: {
                  grid: { display: false }
                }
              }
            }
          })
        );
      }

      const riskCanvas = riskChartRef.current;
      if (riskCanvas) {
        const riskData = [0, riskCounts.high, riskCounts.mid, riskCounts.low];
        charts.push(
          new Chart(riskCanvas, {
            type: 'doughnut',
            data: {
              labels: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
              datasets: [
                {
                  data: riskData,
                  backgroundColor: ['#e52f2f', '#f57a14', '#f2a40c', '#24be62'],
                  borderColor: '#ffffff',
                  borderWidth: 3,
                  hoverOffset: 8
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              cutout: '52%',
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: { boxWidth: 22, boxHeight: 8, useBorderRadius: true }
                },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const value = Number(context.raw ?? 0);
                      const total = riskData.reduce(
                        (sum, item) => sum + item,
                        0
                      );
                      const ratio =
                        total === 0 ? 0 : ((value / total) * 100).toFixed(1);
                      return `${context.label}: ${value}건 (${ratio}%)`;
                    }
                  }
                }
              }
            }
          })
        );
      }

      const trendCanvas = trendChartRef.current;
      if (trendCanvas) {
        const ctx = trendCanvas.getContext('2d');
        const actualGradient = ctx?.createLinearGradient(0, 0, 0, 300);
        actualGradient?.addColorStop(0, 'rgba(47,87,216,0.26)');
        actualGradient?.addColorStop(1, 'rgba(47,87,216,0.02)');

        charts.push(
          new Chart(trendCanvas, {
            type: 'line',
            data: {
              labels: monthlyTrend.map((item) => item.month),
              datasets: [
                {
                  label: '실제원가',
                  data: monthlyTrend.map((item) => item.actual),
                  borderColor: '#2f57d8',
                  backgroundColor: actualGradient ?? 'rgba(47,87,216,0.18)',
                  pointRadius: 4,
                  pointHoverRadius: 6,
                  borderWidth: 3,
                  tension: 0.25,
                  fill: true
                },
                {
                  label: '표준원가',
                  data: monthlyTrend.map((item) => item.standard),
                  borderColor: '#18a169',
                  borderDash: [7, 5],
                  pointRadius: 4,
                  pointHoverRadius: 6,
                  borderWidth: 3,
                  tension: 0.25,
                  fill: false
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              interaction: { mode: 'index', intersect: false },
              plugins: {
                legend: {
                  position: 'top',
                  labels: { boxWidth: 20, boxHeight: 8, useBorderRadius: true }
                },
                tooltip: {
                  callbacks: {
                    label: (context) =>
                      `${context.dataset.label}: ${Number(context.raw ?? 0).toFixed(1)}억`
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: false,
                  grid: { color: '#e7edf7' },
                  ticks: {
                    callback: (value) => `${value}억`
                  }
                },
                x: {
                  grid: { color: '#edf2fa' }
                }
              }
            }
          })
        );
      }

      const typeCanvas = typeChartRef.current;
      if (typeCanvas) {
        charts.push(
          new Chart(typeCanvas, {
            type: 'polarArea',
            data: {
              labels: categoryBudgets.map((item) => item.label),
              datasets: [
                {
                  data: categoryBudgets.map((item) => item.value * 100000000),
                  backgroundColor: categoryBudgets.map((item) => item.color),
                  borderColor: '#ffffff',
                  borderWidth: 2
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                r: {
                  grid: { color: '#e7edf7' },
                  angleLines: { color: '#e7edf7' },
                  ticks: {
                    backdropColor: 'transparent',
                    callback: (value) =>
                      Number(value) === 0
                        ? '0'
                        : formatKrwCompact(Number(value))
                  }
                }
              },
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: { boxWidth: 20, boxHeight: 8, useBorderRadius: true }
                },
                tooltip: {
                  callbacks: {
                    label: (context) =>
                      `${context.label}: ${formatKrwCompact(Number(context.raw ?? 0))}`
                  }
                }
              }
            }
          })
        );
      }
    }

    void setupCharts();

    return () => {
      mounted = false;
      charts.forEach((chart) => chart.destroy());
    };
  }, [orderedHeadquarters, riskCounts.high, riskCounts.low, riskCounts.mid]);

  const sortedReviews = [...portfolio.projects]
    .sort((a, b) => b.rank - a.rank)
    .slice(0, 8);

  return (
    <section className="grid gap-4 max-[900px]:gap-3.5">
      <header className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-[#dde6f4] bg-white px-5 py-4 shadow-[0_2px_8px_rgba(12,26,56,0.04)] max-[720px]:px-4 max-[720px]:py-3.5">
        <div>
          <h2 className="m-0 text-[1.52rem] font-extrabold tracking-[-0.012em] text-[#172a4a] max-[720px]:text-[1.28rem]">
            통합 대시보드
          </h2>
        </div>
        <span className="text-[0.86rem] font-semibold text-[#6c82a9] max-[720px]:text-[0.78rem]">
          {now}
        </span>
      </header>

      <section className="grid grid-cols-4 gap-3.5 max-[1280px]:grid-cols-2 max-[720px]:grid-cols-1">
        <article className="rounded-xl border border-[#dce4f2] bg-white px-4 py-3.5 shadow-[0_3px_10px_rgba(12,26,56,0.05)]">
          <MetricIcon bgClassName="bg-[#376de3]">
            <Building2 className="h-[18px] w-[18px]" />
          </MetricIcon>
          <strong className="mt-2.5 block text-[1.72rem] font-extrabold leading-none text-[#192b4b]">
            {portfolio.overview.headquarterCount}
          </strong>
          <span className="mt-1.5 block text-[0.93rem] font-semibold text-[#526a96]">
            운영 본부
          </span>
          <p className="mt-1 text-[0.82rem] text-[#7f92b3]">5개 본부 가동중</p>
        </article>
        <article className="rounded-xl border border-[#dce4f2] bg-white px-4 py-3.5 shadow-[0_3px_10px_rgba(12,26,56,0.05)]">
          <MetricIcon bgClassName="bg-[#1ca9c7]">
            <WalletCards className="h-[18px] w-[18px]" />
          </MetricIcon>
          <strong className="mt-2.5 block text-[1.72rem] font-extrabold leading-none text-[#192b4b]">
            {portfolio.overview.projectCount}
          </strong>
          <span className="mt-1.5 block text-[0.93rem] font-semibold text-[#526a96]">
            활성 프로젝트
          </span>
          <p className="mt-1 text-[0.82rem] text-[#7f92b3]">
            총 20여개 동시 운영
          </p>
        </article>
        <article className="rounded-xl border border-[#dce4f2] bg-white px-4 py-3.5 shadow-[0_3px_10px_rgba(12,26,56,0.05)]">
          <MetricIcon bgClassName="bg-[#28b95d]">
            <Coins className="h-[18px] w-[18px]" />
          </MetricIcon>
          <strong className="mt-2.5 block text-[1.72rem] font-extrabold leading-none text-[#192b4b]">
            {formatKrwCompact(portfolio.overview.totalInvestmentKrw)}
          </strong>
          <span className="mt-1.5 block text-[0.93rem] font-semibold text-[#526a96]">
            총 예산
          </span>
          <p className="mt-1 text-[0.82rem] text-[#7f92b3]">
            집행: {formatKrwCompact(portfolio.overview.totalExpectedRevenueKrw)}
          </p>
        </article>
        <article className="rounded-xl border border-[#dce4f2] bg-white px-4 py-3.5 shadow-[0_3px_10px_rgba(12,26,56,0.05)]">
          <MetricIcon bgClassName="bg-[#ef3b45]">
            <AlertTriangle className="h-[18px] w-[18px]" />
          </MetricIcon>
          <strong className="mt-2.5 block text-[1.72rem] font-extrabold leading-none text-[#192b4b]">
            {portfolio.overview.conditionalCount}
          </strong>
          <span className="mt-1.5 block text-[0.93rem] font-semibold text-[#526a96]">
            미확인 경보
          </span>
          <p className="mt-1 text-[0.82rem] text-[#7f92b3]">클릭하여 확인</p>
        </article>
      </section>

      <section className="grid grid-cols-[1.75fr_1fr] gap-3.5 max-[1280px]:grid-cols-1">
        <Panel
          title="본부별 예산 vs 집행"
          titleIcon={
            <PanelTitleIcon>
              <BarChart3 className="h-4 w-4" />
            </PanelTitleIcon>
          }
        >
          <div className="h-[286px] max-[720px]:h-[236px]">
            <canvas ref={divisionChartRef} />
          </div>
        </Panel>

        <Panel
          title="리스크 분포"
          titleIcon={
            <PanelTitleIcon>
              <PieChart className="h-4 w-4" />
            </PanelTitleIcon>
          }
        >
          <div className="h-[286px] max-[720px]:h-[236px]">
            <canvas ref={riskChartRef} />
          </div>
        </Panel>
      </section>

      <section className="grid grid-cols-[1.75fr_1fr] gap-3.5 max-[1280px]:grid-cols-1">
        <Panel
          title="월별 원가 추이 (실적 vs 표준)"
          titleIcon={
            <PanelTitleIcon>
              <LineChart className="h-4 w-4" />
            </PanelTitleIcon>
          }
        >
          <div className="h-[286px] max-[720px]:h-[236px]">
            <canvas ref={trendChartRef} />
          </div>
        </Panel>

        <Panel
          title="유형별 예산"
          titleIcon={
            <PanelTitleIcon>
              <Layers3 className="h-4 w-4" />
            </PanelTitleIcon>
          }
        >
          <div className="h-[286px] max-[720px]:h-[236px]">
            <canvas ref={typeChartRef} />
          </div>
        </Panel>
      </section>

      <section className="grid grid-cols-[1.75fr_1fr] gap-3.5 max-[1280px]:grid-cols-1">
        <Panel
          title="본부별 현황"
          titleIcon={
            <PanelTitleIcon>
              <Building2 className="h-4 w-4" />
            </PanelTitleIcon>
          }
        >
          <div className="overflow-hidden rounded-xl border border-[#dce5f4] bg-white">
            <table className="min-w-full text-[0.9rem] max-[720px]:text-[0.82rem]">
              <thead className="bg-[#eef3fb] text-[#5c729a]">
                <tr>
                  <th className="px-3.5 py-2.5 text-left">코드</th>
                  <th className="px-3.5 py-2.5 text-left">본부</th>
                  <th className="px-3.5 py-2.5 text-left">프로젝트</th>
                  <th className="px-3.5 py-2.5 text-left">예산</th>
                  <th className="px-3.5 py-2.5 text-left">집행</th>
                  <th className="px-3.5 py-2.5 text-left">집행률</th>
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
                      <td className="px-3.5 py-2.5 font-semibold text-[#21375d]">
                        {item.code.replace('HQ', 'DIV-')}
                      </td>
                      <td className="px-3.5 py-2.5 text-[#223a61]">
                        {item.name}
                      </td>
                      <td className="px-3.5 py-2.5 text-[#2c4168]">
                        {item.projectCount}
                      </td>
                      <td className="px-3.5 py-2.5 text-[#2c4168]">
                        {formatKrwCompact(item.totalInvestmentKrw)}
                      </td>
                      <td className="px-3.5 py-2.5 text-[#2c4168]">
                        {formatKrwCompact(item.totalExpectedRevenueKrw)}
                      </td>
                      <td
                        className={`px-3.5 py-2.5 font-bold ${
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

        <Panel
          title="최근 평가"
          titleIcon={
            <PanelTitleIcon>
              <CheckSquare className="h-4 w-4" />
            </PanelTitleIcon>
          }
        >
          <div className="grid max-h-[384px] gap-2 overflow-y-auto pr-1">
            {sortedReviews.map((project) => (
              <article
                key={project.code}
                className="rounded-xl border border-[#dce5f4] bg-[#f9fbff] px-3.5 py-2.5"
              >
                <span className="text-[0.72rem] text-[#6b83ab]">
                  2026-03-31 · {project.assetCategory.toUpperCase()}
                </span>
                <strong className="mt-1 block text-[0.94rem] text-[#1e3358]">
                  {project.name}
                </strong>
                <p className="mt-1 text-[0.84rem] text-[#667ea7]">
                  NPV {formatKrwCompact(project.npvKrw)} · IRR{' '}
                  {formatPercent(project.irr)} · {project.status}
                </p>
              </article>
            ))}
            <article className="rounded-xl border border-[#dce5f4] bg-[#f9fbff] px-3.5 py-2.5 text-[0.84rem] text-[#6279a3]">
              {selectedInsight.nextAction}
            </article>
            {priorityProjects[0] ? (
              <div className="grid grid-cols-2 gap-2 max-[620px]:grid-cols-1">
                <button
                  type="button"
                  onClick={() =>
                    onOpenWorkspace('accounting', priorityProjects[0].code)
                  }
                  className="rounded-lg border border-[#c8d5ea] bg-[#eef3fc] px-2.5 py-2 text-[0.72rem] font-semibold text-[#2f57c8]"
                >
                  원가 워크스페이스
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onOpenWorkspace('valuation', priorityProjects[0].code)
                  }
                  className="rounded-lg border border-[#ccd8eb] bg-white px-2.5 py-2 text-[0.72rem] font-semibold text-[#3a517a]"
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
