import { useEffect, useMemo, useRef } from 'react';
import type { Chart as ChartJS } from 'chart.js';
import type { ProjectSummary } from '../../app/portfolioData';
import { formatKrwCompact, formatPercent } from '../../app/format';

export type ValuationProjectExplorerProps = {
  projects: ProjectSummary[];
  selectedProjectCode: string | null;
  // eslint-disable-next-line no-unused-vars
  onSelectProject: (projectCode: string) => void;
  emptyMessage?: string;
};

export function ValuationProjectExplorer({
  projects,
  selectedProjectCode,
  onSelectProject,
  emptyMessage = '표시할 프로젝트 데이터가 없습니다.'
}: ValuationProjectExplorerProps) {
  const chartRef = useRef<HTMLCanvasElement | null>(null);

  const kpis = useMemo(() => {
    if (projects.length === 0) {
      return { projectCount: 0, averageIrr: 0, averageNpvKrw: 0 };
    }

    const averageIrr =
      projects.reduce((sum, project) => sum + project.irr, 0) / projects.length;
    const averageNpvKrw =
      projects.reduce((sum, project) => sum + project.npvKrw, 0) /
      projects.length;

    return {
      projectCount: projects.length,
      averageIrr,
      averageNpvKrw: Math.round(averageNpvKrw)
    };
  }, [projects]);

  const topProjectsByNpv = useMemo(
    () => [...projects].sort((a, b) => b.npvKrw - a.npvKrw).slice(0, 8),
    [projects]
  );

  useEffect(() => {
    if (topProjectsByNpv.length === 0) {
      return;
    }

    const canvas = chartRef.current;
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
          labels: topProjectsByNpv.map((project) => project.code),
          datasets: [
            {
              label: 'NPV',
              data: topProjectsByNpv.map((project) => project.npvKrw),
              borderRadius: 10,
              maxBarThickness: 36,
              backgroundColor: topProjectsByNpv.map((project) =>
                project.code === selectedProjectCode
                  ? 'rgba(35, 98, 220, 0.95)'
                  : 'rgba(30, 169, 198, 0.78)'
              )
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                title: (items) => {
                  const code = items[0]?.label;
                  const found = topProjectsByNpv.find(
                    (project) => project.code === code
                  );
                  return found ? `${found.code} · ${found.name}` : (code ?? '');
                },
                label: (context) => {
                  const rawValue = Number(context.raw ?? 0);
                  return `NPV: ${formatKrwCompact(rawValue)}`;
                },
                afterLabel: (context) => {
                  const code = context.label;
                  const found = topProjectsByNpv.find(
                    (project) => project.code === code
                  );
                  return found
                    ? `IRR: ${formatPercent(found.irr)} · 상태: ${found.status}`
                    : '';
                }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                color: '#5d7298',
                font: { size: 12, weight: 600 }
              }
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
    });

    return () => {
      mounted = false;
      chart?.destroy();
    };
  }, [selectedProjectCode, topProjectsByNpv]);

  return (
    <section className="grid gap-4">
      <section className="grid grid-cols-3 gap-3 max-[1100px]:grid-cols-1">
        <article className="rounded-2xl border border-[#d9e4f4] bg-white px-4 py-3.5 shadow-[0_4px_12px_rgba(16,24,40,0.05)]">
          <p className="text-[0.84rem] font-semibold text-[#6980a7]">
            프로젝트 수
          </p>
          <strong className="mt-1 block text-[1.95rem] font-extrabold leading-none text-[#192b4b]">
            {kpis.projectCount}
          </strong>
        </article>
        <article className="rounded-2xl border border-[#d9e4f4] bg-white px-4 py-3.5 shadow-[0_4px_12px_rgba(16,24,40,0.05)]">
          <p className="text-[0.84rem] font-semibold text-[#6980a7]">
            평균 IRR
          </p>
          <strong className="mt-1 block text-[1.95rem] font-extrabold leading-none text-[#192b4b]">
            {formatPercent(kpis.averageIrr)}
          </strong>
        </article>
        <article className="rounded-2xl border border-[#d9e4f4] bg-white px-4 py-3.5 shadow-[0_4px_12px_rgba(16,24,40,0.05)]">
          <p className="text-[0.84rem] font-semibold text-[#6980a7]">
            평균 NPV
          </p>
          <strong className="mt-1 block text-[1.95rem] font-extrabold leading-none text-[#192b4b]">
            {formatKrwCompact(kpis.averageNpvKrw)}
          </strong>
        </article>
      </section>

      <section className="rounded-2xl border border-[#d9e4f4] bg-white p-4 shadow-[0_4px_12px_rgba(16,24,40,0.05)]">
        <header className="mb-3 flex items-center justify-between">
          <h3 className="text-[1.1rem] font-extrabold text-[#1a2d4d]">
            상위 8개 프로젝트 NPV 비교
          </h3>
        </header>
        {topProjectsByNpv.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#c8d6ec] bg-[#f8fbff] px-4 py-10 text-center text-[0.94rem] text-[#5f7499]">
            {emptyMessage}
          </div>
        ) : (
          <div className="h-[300px]">
            <canvas ref={chartRef} />
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#d9e4f4] bg-white shadow-[0_4px_12px_rgba(16,24,40,0.05)]">
        <header className="border-b border-[#e7eef9] px-4 py-3.5">
          <h3 className="text-[1.1rem] font-extrabold text-[#1a2d4d]">
            프로젝트 목록
          </h3>
        </header>
        {projects.length === 0 ? (
          <div className="px-4 py-10 text-center text-[0.94rem] text-[#5f7499]">
            {emptyMessage}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-[0.95rem]">
              <thead className="bg-[#eef3fb] text-[#5d7298]">
                <tr>
                  <th className="px-4 py-3 text-left">코드</th>
                  <th className="px-4 py-3 text-left">프로젝트</th>
                  <th className="px-4 py-3 text-left">본부</th>
                  <th className="px-4 py-3 text-right">NPV</th>
                  <th className="px-4 py-3 text-right">IRR</th>
                  <th className="px-4 py-3 text-left">상태</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => {
                  const isSelected = selectedProjectCode === project.code;
                  return (
                    <tr
                      key={project.code}
                      className={`cursor-pointer border-t border-[#e6edf8] text-[#1e3358] transition-colors ${
                        isSelected ? 'bg-[#eaf2ff]' : 'hover:bg-[#f6f9ff]'
                      }`}
                      onClick={() => onSelectProject(project.code)}
                    >
                      <td className="px-4 py-3 font-semibold">
                        {project.code}
                      </td>
                      <td className="px-4 py-3">{project.name}</td>
                      <td className="px-4 py-3">{project.headquarter}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatKrwCompact(project.npvKrw)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatPercent(project.irr)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-[#e7eefb] px-2.5 py-1 text-[0.82rem] font-semibold text-[#375781]">
                          {project.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
