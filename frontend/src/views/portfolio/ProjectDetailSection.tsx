import { useEffect, useMemo, useRef, useState } from 'react';
import type { Chart as ChartJS } from 'chart.js';
import { formatKrw, formatKrwCompact, formatPercent } from '../../app/format';

export type ProjectDetailSummaryCardData = {
  headquarter: string;
  budgetKrw: number;
  executedKrw: number;
  periodLabel: string;
};

export type ProjectEvaluationMetric = {
  label: string;
  value: string;
  tone?: 'default' | 'accent' | 'danger';
};

export type ProjectCashFlowRow = {
  period: string;
  cashFlowKrw: number;
  cumulativeKrw: number;
  note?: string;
};

export type ProjectCostEntryRow = {
  date: string;
  period: string;
  department: string;
  projectName: string;
  costItem: string;
  actualKrw: number;
  standardKrw: number;
  note?: string;
};

export type ProjectValuationHistoryRow = {
  valuationDate: string;
  valuationType: string;
  npvKrw: number | null;
  irr: number | null;
  roi: number | null;
  fairValueKrw: number | null;
  duration: number | null;
  var95Krw: number | null;
  grade: string;
};

export type ProjectDetailSectionProps = {
  summary: ProjectDetailSummaryCardData | null;
  latestMetrics: ProjectEvaluationMetric[];
  cashFlowRows: ProjectCashFlowRow[];
  costRows: ProjectCostEntryRow[];
  valuationRows: ProjectValuationHistoryRow[];
  emptyMessage?: string;
};

type DetailTabKey = 'cashflow' | 'cost' | 'valuation';

const tabItems: Array<{ key: DetailTabKey; label: string }> = [
  { key: 'cashflow', label: '현금흐름' },
  { key: 'cost', label: '원가내역' },
  { key: 'valuation', label: '평가 이력' }
];

function toneClassByMetric(metric: ProjectEvaluationMetric) {
  if (metric.tone === 'danger') {
    return 'text-[#d73737]';
  }
  if (metric.tone === 'accent') {
    return 'text-[#1a8f63]';
  }
  return 'text-[#1b2d4c]';
}

function formatNullableKrw(value: number | null) {
  if (value === null) {
    return '-';
  }
  return formatKrwCompact(value);
}

function formatNullablePercent(value: number | null) {
  if (value === null) {
    return '-';
  }
  return formatPercent(value);
}

function formatNullableFixed(value: number | null, suffix = '') {
  if (value === null) {
    return '-';
  }
  return `${value.toFixed(2)}${suffix}`;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[#c9d6eb] bg-[#f8fbff] px-4 py-8 text-center text-[0.95rem] text-[#5f749a]">
      {message}
    </div>
  );
}

export function ProjectDetailSection({
  summary,
  latestMetrics,
  cashFlowRows,
  costRows,
  valuationRows,
  emptyMessage = '표시할 데이터가 없습니다.'
}: ProjectDetailSectionProps) {
  const [activeTab, setActiveTab] = useState<DetailTabKey>('cashflow');
  const cashFlowCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const executionRate = useMemo(() => {
    if (!summary || summary.budgetKrw <= 0) {
      return null;
    }
    return summary.executedKrw / summary.budgetKrw;
  }, [summary]);

  useEffect(() => {
    if (activeTab !== 'cashflow' || cashFlowRows.length === 0) {
      return;
    }

    const canvas = cashFlowCanvasRef.current;
    if (!canvas) {
      return;
    }

    let mounted = true;
    let chart: ChartJS | null = null;

    void import('chart.js/auto').then(({ default: Chart }) => {
      if (!mounted) {
        return;
      }

      chart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: cashFlowRows.map((row) => row.period),
          datasets: [
            {
              type: 'bar',
              label: '현금흐름',
              data: cashFlowRows.map((row) => row.cashFlowKrw),
              borderRadius: 8,
              maxBarThickness: 26,
              backgroundColor: 'rgba(56, 106, 222, 0.88)'
            },
            {
              type: 'line',
              label: '누적',
              data: cashFlowRows.map((row) => row.cumulativeKrw),
              borderColor: '#1ea9c6',
              backgroundColor: 'rgba(30, 169, 198, 0.16)',
              borderWidth: 3,
              pointRadius: 3.5,
              pointHoverRadius: 5,
              pointBackgroundColor: '#1ea9c6',
              tension: 0.24,
              fill: false,
              yAxisID: 'y1'
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
                label: (context) =>
                  `${context.dataset.label}: ${formatKrw(Number(context.raw ?? 0))}`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#5f7399' }
            },
            y: {
              beginAtZero: true,
              position: 'left',
              grid: { color: '#e6edf8' },
              ticks: {
                color: '#5f7399',
                callback: (value) => formatKrwCompact(Number(value))
              }
            },
            y1: {
              beginAtZero: true,
              position: 'right',
              grid: { drawOnChartArea: false },
              ticks: {
                color: '#5f7399',
                callback: (value) => formatKrwCompact(Number(value))
              }
            }
          }
        }
      });
    });

    return () => {
      mounted = false;
      chart?.destroy();
    };
  }, [activeTab, cashFlowRows]);

  return (
    <section className="grid gap-4">
      <section className="grid grid-cols-4 gap-3 max-[1200px]:grid-cols-2 max-[720px]:grid-cols-1">
        <article className="rounded-2xl border border-[#dce6f5] bg-white px-4 py-3.5 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
          <p className="text-[0.82rem] font-semibold text-[#6a7fa5]">본부</p>
          <strong className="mt-1 block text-[2rem] font-extrabold leading-none text-[#172a4a]">
            {summary?.headquarter ?? '-'}
          </strong>
        </article>
        <article className="rounded-2xl border border-[#dce6f5] bg-white px-4 py-3.5 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
          <p className="text-[0.82rem] font-semibold text-[#6a7fa5]">예산</p>
          <strong className="mt-1 block text-[2rem] font-extrabold leading-none text-[#172a4a]">
            {summary ? formatKrwCompact(summary.budgetKrw) : '-'}
          </strong>
        </article>
        <article className="rounded-2xl border border-[#dce6f5] bg-white px-4 py-3.5 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
          <p className="text-[0.82rem] font-semibold text-[#6a7fa5]">집행</p>
          <strong className="mt-1 block text-[2rem] font-extrabold leading-none text-[#172a4a]">
            {summary ? formatKrwCompact(summary.executedKrw) : '-'}
          </strong>
          <p className="mt-1 text-[0.84rem] font-semibold text-[#6a7fa5]">
            {executionRate === null
              ? '-'
              : `${formatPercent(executionRate)} 집행`}
          </p>
        </article>
        <article className="rounded-2xl border border-[#dce6f5] bg-white px-4 py-3.5 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
          <p className="text-[0.82rem] font-semibold text-[#6a7fa5]">기간</p>
          <strong className="mt-1 block text-[1.75rem] font-extrabold leading-tight text-[#172a4a]">
            {summary?.periodLabel ?? '-'}
          </strong>
        </article>
      </section>

      <section className="rounded-2xl border border-[#dce6f5] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
        <header className="border-b border-[#e7edf8] px-5 py-4">
          <h3 className="text-[1.65rem] font-extrabold tracking-[-0.012em] text-[#172a4a]">
            최근 평가 결과
          </h3>
        </header>
        <div className="grid grid-cols-4 gap-3 px-5 py-4 max-[1280px]:grid-cols-3 max-[980px]:grid-cols-2 max-[640px]:grid-cols-1">
          {latestMetrics.length === 0 ? (
            <div className="col-span-full">
              <EmptyState message={emptyMessage} />
            </div>
          ) : (
            latestMetrics.map((metric) => (
              <article
                key={metric.label}
                className="rounded-xl border border-[#e2e9f6] bg-[#f8fbff] px-3.5 py-3"
              >
                <p className="text-[0.9rem] font-semibold text-[#6b80a5]">
                  {metric.label}
                </p>
                <strong
                  className={`mt-1 block text-[1.95rem] font-extrabold leading-none ${toneClassByMetric(metric)}`}
                >
                  {metric.value}
                </strong>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-[#dce6f5] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
        <div className="border-b border-[#e7edf8] px-5 pt-4">
          <div className="flex flex-wrap gap-1.5">
            {tabItems.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`rounded-t-xl border border-b-0 px-4 py-2 text-[1.02rem] font-semibold ${
                  activeTab === tab.key
                    ? 'border-[#2959d4] bg-[#2959d4] text-white'
                    : 'border-transparent bg-transparent text-[#5f7499] hover:bg-[#f2f6fd]'
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 py-4">
          {activeTab === 'cashflow' ? (
            <div className="grid gap-4">
              {cashFlowRows.length === 0 ? (
                <EmptyState message={emptyMessage} />
              ) : (
                <>
                  <div className="h-[320px] rounded-xl border border-[#dfe8f6] bg-white p-3">
                    <canvas ref={cashFlowCanvasRef} />
                  </div>
                  <div className="overflow-hidden rounded-xl border border-[#dfe8f6]">
                    <table className="min-w-full text-[0.95rem]">
                      <thead className="bg-[#eef3fb] text-[#586e96]">
                        <tr>
                          <th className="px-4 py-3 text-left">기간</th>
                          <th className="px-4 py-3 text-right">현금흐름</th>
                          <th className="px-4 py-3 text-right">누적</th>
                          <th className="px-4 py-3 text-left">비고</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cashFlowRows.map((row) => (
                          <tr
                            key={row.period}
                            className="border-t border-[#e6edf8] text-[#1e3358]"
                          >
                            <td className="px-4 py-3 font-semibold">
                              {row.period}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold">
                              {formatKrw(row.cashFlowKrw)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {formatKrw(row.cumulativeKrw)}
                            </td>
                            <td className="px-4 py-3 text-[#5f7499]">
                              {row.note ?? '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          ) : null}

          {activeTab === 'cost' ? (
            costRows.length === 0 ? (
              <EmptyState message={emptyMessage} />
            ) : (
              <div className="overflow-hidden rounded-xl border border-[#dfe8f6]">
                <table className="min-w-full text-[0.95rem]">
                  <thead className="bg-[#eef3fb] text-[#586e96]">
                    <tr>
                      <th className="px-4 py-3 text-left">날짜</th>
                      <th className="px-4 py-3 text-left">기간</th>
                      <th className="px-4 py-3 text-left">본부</th>
                      <th className="px-4 py-3 text-left">프로젝트</th>
                      <th className="px-4 py-3 text-left">원가항목</th>
                      <th className="px-4 py-3 text-right">실제</th>
                      <th className="px-4 py-3 text-right">표준</th>
                      <th className="px-4 py-3 text-left">비고</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costRows.map((row) => (
                      <tr
                        key={`${row.date}-${row.projectName}-${row.costItem}`}
                        className="border-t border-[#e6edf8] text-[#1e3358]"
                      >
                        <td className="px-4 py-3 font-semibold">{row.date}</td>
                        <td className="px-4 py-3">{row.period}</td>
                        <td className="px-4 py-3">{row.department}</td>
                        <td className="px-4 py-3">{row.projectName}</td>
                        <td className="px-4 py-3">{row.costItem}</td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {formatKrw(row.actualKrw)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatKrw(row.standardKrw)}
                        </td>
                        <td className="px-4 py-3 text-[#5f7499]">
                          {row.note ?? '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : null}

          {activeTab === 'valuation' ? (
            valuationRows.length === 0 ? (
              <EmptyState message={emptyMessage} />
            ) : (
              <div className="overflow-hidden rounded-xl border border-[#dfe8f6]">
                <table className="min-w-full text-[0.95rem]">
                  <thead className="bg-[#eef3fb] text-[#586e96]">
                    <tr>
                      <th className="px-4 py-3 text-left">평가일</th>
                      <th className="px-4 py-3 text-left">유형</th>
                      <th className="px-4 py-3 text-right">NPV</th>
                      <th className="px-4 py-3 text-right">IRR</th>
                      <th className="px-4 py-3 text-right">ROI</th>
                      <th className="px-4 py-3 text-right">공정가치</th>
                      <th className="px-4 py-3 text-right">DURATION</th>
                      <th className="px-4 py-3 text-right">VAR 95%</th>
                      <th className="px-4 py-3 text-left">등급</th>
                    </tr>
                  </thead>
                  <tbody>
                    {valuationRows.map((row) => (
                      <tr
                        key={`${row.valuationDate}-${row.valuationType}-${row.grade}`}
                        className="border-t border-[#e6edf8] text-[#1e3358]"
                      >
                        <td className="px-4 py-3 font-semibold">
                          {row.valuationDate}
                        </td>
                        <td className="px-4 py-3">{row.valuationType}</td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {formatNullableKrw(row.npvKrw)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatNullablePercent(row.irr)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatNullablePercent(row.roi)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatNullableKrw(row.fairValueKrw)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatNullableFixed(row.duration)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-[#d73737]">
                          {formatNullableKrw(row.var95Krw)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-[#d8f1df] px-2.5 py-1 text-[0.82rem] font-semibold text-[#1c8d5f]">
                            {row.grade}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : null}
        </div>
      </section>
    </section>
  );
}
