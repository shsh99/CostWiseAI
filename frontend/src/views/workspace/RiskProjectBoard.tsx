import { useEffect, useMemo, useRef, useState } from 'react';
import type { Chart as ChartJS } from 'chart.js';
import { formatKrwCompact, formatPercent } from '../../app/format';

export type RiskProjectRow = {
  code: string;
  name: string;
  positionKrw: number;
  var95Krw: number;
  var99Krw: number;
  volatility: number;
  creditGrade: string;
  pd: number;
  expectedLossKrw: number;
};

type RiskProjectBoardProps = {
  rows: Array<RiskProjectRow>;
  selectedProjectCode: string | null;
  // eslint-disable-next-line no-unused-vars
  onSelectProject: (projectCode: string) => void;
};

const labels = {
  project: '\ud504\ub85c\uc81d\ud2b8',
  position: '\ud3ec\uc9c0\uc158',
  volatility: '\ubcc0\ub3d9\uc131',
  creditGrade: '\uc2e0\uc6a9\ub4f1\uae09',
  expectedLoss: '\uae30\ub300\uc190\uc2e4',
  projectCount: '\ud504\ub85c\uc81d\ud2b8 \uc218'
};

export function RiskProjectBoard({
  rows,
  selectedProjectCode,
  onSelectProject
}: RiskProjectBoardProps) {
  const varChartRef = useRef<HTMLCanvasElement | null>(null);
  const creditChartRef = useRef<HTMLCanvasElement | null>(null);

  const [positionAmount, setPositionAmount] = useState<number>(10000000000);
  const [annualVolatility, setAnnualVolatility] = useState<number>(0.2);
  const [holdingDays, setHoldingDays] = useState<number>(1);
  const [confidence, setConfidence] = useState<95 | 99>(95);
  const [varResult, setVarResult] = useState<{
    zScore: number;
    varKrw: number;
  } | null>(null);

  const [pdInput, setPdInput] = useState<number>(0.02);
  const [lgdInput, setLgdInput] = useState<number>(0.45);
  const [eadInput, setEadInput] = useState<number>(20000000000);
  const [expectedLossResult, setExpectedLossResult] = useState<number | null>(
    null
  );

  const topVarRows = useMemo(() => rows.slice(0, 8), [rows]);

  const avgIrrLike = useMemo(() => {
    if (rows.length === 0) {
      return 0;
    }
    const syntheticIrr = rows.map((row) =>
      Math.max(0, row.positionKrw) === 0
        ? 0
        : Math.max(-0.5, Math.min(0.5, 1 - row.var95Krw / row.positionKrw))
    );
    return syntheticIrr.reduce((sum, value) => sum + value, 0) / rows.length;
  }, [rows]);

  const avgNpvLike = useMemo(() => {
    if (rows.length === 0) {
      return 0;
    }
    const surrogateValues = rows.map(
      (row) => row.positionKrw - row.expectedLossKrw - row.var95Krw * 0.5
    );
    return (
      surrogateValues.reduce((sum, value) => sum + value, 0) /
      surrogateValues.length
    );
  }, [rows]);

  const creditDistribution = useMemo(() => {
    const bucket = new Map<string, number>();
    rows.forEach((row) => {
      bucket.set(row.creditGrade, (bucket.get(row.creditGrade) ?? 0) + 1);
    });
    return Array.from(bucket.entries()).map(([grade, count]) => ({
      grade,
      count
    }));
  }, [rows]);

  useEffect(() => {
    const varCanvas = varChartRef.current;
    const creditCanvas = creditChartRef.current;
    if (!varCanvas || !creditCanvas) {
      return;
    }

    let mounted = true;
    let varChart: ChartJS | null = null;
    let creditChart: ChartJS | null = null;

    void import('chart.js/auto').then(({ default: Chart }) => {
      if (!mounted) {
        return;
      }

      varChart = new Chart(varCanvas, {
        type: 'bar',
        data: {
          labels: topVarRows.map((row) => row.code),
          datasets: [
            {
              label: 'VaR 95%',
              data: topVarRows.map((row) => row.var95Krw),
              backgroundColor: '#f2a20a',
              borderRadius: 8,
              maxBarThickness: 24
            },
            {
              label: 'VaR 99%',
              data: topVarRows.map((row) => row.var99Krw),
              backgroundColor: '#e13333',
              borderRadius: 8,
              maxBarThickness: 24
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            tooltip: {
              callbacks: {
                title: (items) => {
                  const code = items[0]?.label ?? '';
                  const found = topVarRows.find((row) => row.code === code);
                  return found ? `${found.code} - ${found.name}` : code;
                },
                label: (context) => {
                  const row = topVarRows[context.dataIndex];
                  return `${context.dataset.label}: ${formatKrwCompact(
                    Number(context.raw ?? 0)
                  )} | PD ${formatPercent(row?.pd ?? 0)}`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#5d7298' }
            },
            y: {
              beginAtZero: true,
              grid: { color: '#e6edf8' },
              ticks: {
                color: '#5d7298',
                callback: (value) => formatKrwCompact(Number(value))
              }
            }
          }
        }
      });

      creditChart = new Chart(creditCanvas, {
        type: 'doughnut',
        data: {
          labels: creditDistribution.map((item) => item.grade),
          datasets: [
            {
              data: creditDistribution.map((item) => item.count),
              backgroundColor: [
                '#24be62',
                '#1ea9c6',
                '#3f79ea',
                '#7d5de0',
                '#f2a20a',
                '#f57a14',
                '#e13333',
                '#2cbf5f'
              ],
              borderColor: '#ffffff',
              borderWidth: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '55%',
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => {
                  const total = creditDistribution.reduce(
                    (sum, item) => sum + item.count,
                    0
                  );
                  const value = Number(context.raw ?? 0);
                  const ratio = total === 0 ? 0 : (value / total) * 100;
                  return `${context.label}: ${value} (${ratio.toFixed(1)}%)`;
                }
              }
            }
          }
        }
      });
    });

    return () => {
      mounted = false;
      varChart?.destroy();
      creditChart?.destroy();
    };
  }, [creditDistribution, topVarRows]);

  function computeVar() {
    const zScore = confidence === 99 ? 2.326 : 1.645;
    const holdingPeriodFactor = Math.sqrt(Math.max(holdingDays, 1) / 252);
    const varKrw =
      positionAmount * annualVolatility * zScore * holdingPeriodFactor;
    setVarResult({ zScore, varKrw });
  }

  function computeExpectedLoss() {
    const el = pdInput * lgdInput * eadInput;
    setExpectedLossResult(el);
  }

  return (
    <section className="grid gap-4">
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-[#d7e1f1] bg-white p-4 shadow-[0_6px_20px_rgba(24,40,71,0.05)]">
          <h3 className="text-[1.75rem] font-extrabold tracking-[-0.02em] text-[#172a4a]">
            Parametric VaR Calculator
          </h3>
          <div className="mt-3 grid gap-3">
            <label className="grid gap-1 text-sm font-semibold text-[#2d4266]">
              {labels.position}
              <input
                type="number"
                className="rounded-xl border border-[#ccd8eb] bg-[#f9fbff] px-3 py-2 text-[#1a2d4d]"
                value={positionAmount}
                onChange={(event) =>
                  setPositionAmount(Number(event.target.value))
                }
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold text-[#2d4266]">
                Annual Volatility
                <input
                  type="number"
                  step="0.01"
                  className="rounded-xl border border-[#ccd8eb] bg-[#f9fbff] px-3 py-2 text-[#1a2d4d]"
                  value={annualVolatility}
                  onChange={(event) =>
                    setAnnualVolatility(Number(event.target.value))
                  }
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-[#2d4266]">
                Holding Days
                <input
                  type="number"
                  className="rounded-xl border border-[#ccd8eb] bg-[#f9fbff] px-3 py-2 text-[#1a2d4d]"
                  value={holdingDays}
                  onChange={(event) =>
                    setHoldingDays(Number(event.target.value))
                  }
                />
              </label>
            </div>
            <label className="grid gap-1 text-sm font-semibold text-[#2d4266]">
              Confidence
              <select
                className="rounded-xl border border-[#ccd8eb] bg-[#f9fbff] px-3 py-2 text-[#1a2d4d]"
                value={confidence}
                onChange={(event) =>
                  setConfidence(Number(event.target.value) as 95 | 99)
                }
              >
                <option value={95}>95%</option>
                <option value={99}>99%</option>
              </select>
            </label>
            <button
              type="button"
              className="rounded-xl bg-[#2b4dbf] px-3.5 py-2.5 text-sm font-extrabold text-white"
              onClick={computeVar}
            >
              Compute VaR
            </button>
          </div>
          <div className="mt-3 rounded-xl border border-[#d8e2f2] bg-[#f8fbff] px-3 py-2 text-sm text-[#31476d]">
            <strong className="mr-2 text-[#1b2d4c]">Result:</strong>
            {varResult
              ? `z=${varResult.zScore.toFixed(3)} | VaR=${formatKrwCompact(
                  varResult.varKrw
                )}`
              : '-'}
          </div>
        </article>

        <article className="rounded-2xl border border-[#d7e1f1] bg-white p-4 shadow-[0_6px_20px_rgba(24,40,71,0.05)]">
          <h3 className="text-[1.75rem] font-extrabold tracking-[-0.02em] text-[#172a4a]">
            Expected Loss (EL = PD x LGD x EAD)
          </h3>
          <div className="mt-3 grid gap-3">
            <label className="grid gap-1 text-sm font-semibold text-[#2d4266]">
              PD
              <input
                type="number"
                step="0.001"
                className="rounded-xl border border-[#ccd8eb] bg-[#f9fbff] px-3 py-2 text-[#1a2d4d]"
                value={pdInput}
                onChange={(event) => setPdInput(Number(event.target.value))}
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-[#2d4266]">
              LGD
              <input
                type="number"
                step="0.001"
                className="rounded-xl border border-[#ccd8eb] bg-[#f9fbff] px-3 py-2 text-[#1a2d4d]"
                value={lgdInput}
                onChange={(event) => setLgdInput(Number(event.target.value))}
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-[#2d4266]">
              EAD
              <input
                type="number"
                className="rounded-xl border border-[#ccd8eb] bg-[#f9fbff] px-3 py-2 text-[#1a2d4d]"
                value={eadInput}
                onChange={(event) => setEadInput(Number(event.target.value))}
              />
            </label>
            <button
              type="button"
              className="rounded-xl bg-[#2b4dbf] px-3.5 py-2.5 text-sm font-extrabold text-white"
              onClick={computeExpectedLoss}
            >
              Compute EL
            </button>
          </div>
          <div className="mt-3 rounded-xl border border-[#d8e2f2] bg-[#f8fbff] px-3 py-2 text-sm text-[#31476d]">
            <strong className="mr-2 text-[#1b2d4c]">Result:</strong>
            {expectedLossResult === null
              ? '-'
              : `EL=${formatKrwCompact(expectedLossResult)} | PD ${formatPercent(
                  pdInput
                )}, LGD ${formatPercent(lgdInput)}`}
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#d7e1f1] bg-white shadow-[0_6px_20px_rgba(24,40,71,0.05)]">
        <header className="border-b border-[#e3ebf7] px-4 py-3">
          <h3 className="text-[1.72rem] font-extrabold tracking-[-0.02em] text-[#172a4a]">
            Project Risk Table
          </h3>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-[#2b3f63]">
            <thead className="bg-[#eef3fb] text-[#5c729a]">
              <tr>
                <th className="px-4 py-3 text-left">{labels.project}</th>
                <th className="px-4 py-3 text-right">{labels.position}</th>
                <th className="px-4 py-3 text-right">VAR 95%</th>
                <th className="px-4 py-3 text-right">VAR 99%</th>
                <th className="px-4 py-3 text-right">{labels.volatility}</th>
                <th className="px-4 py-3 text-left">{labels.creditGrade}</th>
                <th className="px-4 py-3 text-right">PD</th>
                <th className="px-4 py-3 text-right">{labels.expectedLoss}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isSelected = selectedProjectCode === row.code;
                return (
                  <tr
                    key={row.code}
                    className={`cursor-pointer border-t border-[#e6edf8] transition-colors ${
                      isSelected ? 'bg-[#e8f0ff]' : 'hover:bg-[#f7faff]'
                    }`}
                    onClick={() => onSelectProject(row.code)}
                  >
                    <td className="px-4 py-3 font-semibold text-[#20375d]">
                      {row.code} - {row.name}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatKrwCompact(row.positionKrw)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[#d73737]">
                      {formatKrwCompact(row.var95Krw)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[#d73737]">
                      {formatKrwCompact(row.var99Krw)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatPercent(row.volatility)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-[#d8f1df] px-2.5 py-1 text-xs font-semibold text-[#1b8d5f]">
                        {row.creditGrade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatPercent(row.pd)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatKrwCompact(row.expectedLossKrw)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-[#d7e1f1] bg-white p-4 shadow-[0_6px_20px_rgba(24,40,71,0.05)]">
          <h3 className="text-[1.72rem] font-extrabold tracking-[-0.02em] text-[#172a4a]">
            VaR Distribution by Project
          </h3>
          <div className="mt-3 h-[290px]">
            <canvas ref={varChartRef} />
          </div>
        </article>

        <article className="rounded-2xl border border-[#d7e1f1] bg-white p-4 shadow-[0_6px_20px_rgba(24,40,71,0.05)]">
          <h3 className="text-[1.72rem] font-extrabold tracking-[-0.02em] text-[#172a4a]">
            Credit Grade Distribution
          </h3>
          <div className="mt-3 h-[290px]">
            <canvas ref={creditChartRef} />
          </div>
        </article>
      </section>

      <section className="grid grid-cols-3 gap-3 max-[1100px]:grid-cols-1">
        <article className="rounded-2xl border border-[#d7e1f1] bg-white px-4 py-3 shadow-[0_6px_20px_rgba(24,40,71,0.05)]">
          <p className="text-sm font-semibold text-[#61789f]">
            {labels.projectCount}
          </p>
          <strong className="mt-1 block text-[1.9rem] font-extrabold text-[#182b4c]">
            {rows.length}
          </strong>
        </article>
        <article className="rounded-2xl border border-[#d7e1f1] bg-white px-4 py-3 shadow-[0_6px_20px_rgba(24,40,71,0.05)]">
          <p className="text-sm font-semibold text-[#61789f]">Average IRR</p>
          <strong className="mt-1 block text-[1.9rem] font-extrabold text-[#182b4c]">
            {formatPercent(avgIrrLike)}
          </strong>
        </article>
        <article className="rounded-2xl border border-[#d7e1f1] bg-white px-4 py-3 shadow-[0_6px_20px_rgba(24,40,71,0.05)]">
          <p className="text-sm font-semibold text-[#61789f]">Average NPV</p>
          <strong className="mt-1 block text-[1.9rem] font-extrabold text-[#182b4c]">
            {formatKrwCompact(avgNpvLike)}
          </strong>
        </article>
      </section>
    </section>
  );
}
