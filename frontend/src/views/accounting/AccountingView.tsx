import type { ProjectDetail, ProjectSummary } from '../../app/portfolioData';
import { formatKrwCompact } from '../../app/format';
import { Panel } from '../../shared/components/Panel';

type AccountingViewProps = {
  selectedProject: ProjectSummary | null;
  selectedDetail: ProjectDetail | null;
  detailStatus: 'idle' | 'loading' | 'ready' | 'error';
  detailError: string | null;
  onRetryDetailLoad(): void;
};

const departmentLabelByCode: Record<string, string> = {
  HQ01: '주식운용본부',
  HQ02: '채권운용본부',
  HQ03: '대체투자본부',
  HQ04: '파생상품본부',
  HQ05: '리스크관리본부'
};

export function AccountingView({
  selectedProject,
  selectedDetail,
  detailStatus,
  detailError,
  onRetryDetailLoad
}: AccountingViewProps) {
  const allocationRows = selectedDetail?.allocation.rules ?? [];
  const mergedRows = Object.values(
    allocationRows.reduce<
      Record<
        string,
        {
          department: string;
          actual: number;
          standard: number;
          diff: number;
          rate: number;
        }
      >
    >((acc, row) => {
      const department =
        departmentLabelByCode[row.departmentCode] ?? row.departmentCode;
      const key = department;
      if (!acc[key]) {
        acc[key] = { department, actual: 0, standard: 0, diff: 0, rate: 0 };
      }
      acc[key].actual += row.allocatedAmount;
      acc[key].standard += row.costPoolAmount;
      return acc;
    }, {})
  ).map((row) => {
    const diff = row.actual - row.standard;
    const rate = row.standard === 0 ? 0 : (diff / row.standard) * 100;
    return { ...row, diff, rate };
  });

  const maxActual = Math.max(1, ...mergedRows.map((row) => row.actual));

  return (
    <section className="grid gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-[2.05rem] font-extrabold tracking-[-0.01em] text-[#192a49]">
            원가 집계·분석
          </h2>
          <p className="mt-1 text-[1.05rem] text-[#62779d]">
            본부/프로젝트별 원가 집계 및 표준원가 차이분석
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            className="rounded-[10px] border border-[#cbd6ea] bg-white px-3.5 py-2.5 font-bold text-[#2f4570]"
            type="button"
          >
            CSV
          </button>
          <button
            className="rounded-[10px] bg-[#2b4dbf] px-3.5 py-2.5 font-extrabold text-white"
            type="button"
          >
            + 원가 입력
          </button>
        </div>
      </header>

      {detailStatus === 'loading' ? (
        <article className="rounded-2xl border border-[#d8e2f2] bg-white px-5 py-5 text-[#41557b]">
          원가 상세 데이터를 불러오는 중입니다.
        </article>
      ) : null}

      {detailStatus === 'error' ? (
        <article className="rounded-2xl border border-[#f0c9c9] bg-white px-5 py-5 text-[#7b3333]">
          <p className="m-0">
            {detailError ?? '원가 데이터를 불러오지 못했습니다.'}
          </p>
          <button
            className="mt-3 rounded-[10px] border border-[#cfa5a5] bg-[#fff6f6] px-3 py-2 font-semibold"
            type="button"
            onClick={onRetryDetailLoad}
          >
            다시 시도
          </button>
        </article>
      ) : null}

      {detailStatus === 'ready' && selectedDetail && selectedProject ? (
        <>
          <Panel title="본부별 원가 차이분석 (실제 vs 표준)">
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                className="rounded-xl border border-[#c8d4ea] bg-white px-4 py-2 text-[1rem] font-semibold text-[#2f4570]"
              >
                2026년 02월
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#dce5f4] bg-white">
              <table className="min-w-full text-[1.02rem]">
                <thead className="bg-[#eef3fb] text-[#5b7097]">
                  <tr>
                    <th className="px-4 py-3 text-left">본부</th>
                    <th className="px-4 py-3 text-left">실제원가</th>
                    <th className="px-4 py-3 text-left">표준원가</th>
                    <th className="px-4 py-3 text-left">차이</th>
                    <th className="px-4 py-3 text-left">차이율</th>
                    <th className="px-4 py-3 text-left">판정</th>
                  </tr>
                </thead>
                <tbody>
                  {mergedRows.map((row) => (
                    <tr
                      key={row.department}
                      className="border-t border-[#e6edf8]"
                    >
                      <td className="px-4 py-3 font-semibold text-[#1e2f4c]">
                        {row.department}
                      </td>
                      <td className="px-4 py-3">
                        {formatKrwCompact(row.actual)}
                      </td>
                      <td className="px-4 py-3 text-[#7086ac]">
                        {formatKrwCompact(row.standard)}
                      </td>
                      <td
                        className={`px-4 py-3 font-bold ${
                          row.diff > 0 ? 'text-[#e03131]' : 'text-[#16955f]'
                        }`}
                      >
                        {row.diff > 0 ? '+' : ''}
                        {formatKrwCompact(row.diff)}
                      </td>
                      <td
                        className={`px-4 py-3 font-bold ${
                          row.rate > 0 ? 'text-[#e03131]' : 'text-[#16955f]'
                        }`}
                      >
                        {row.rate.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-[#f7dada] px-3 py-1 text-sm font-bold text-[#b83f3f]">
                          불리
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <section className="grid grid-cols-[2fr_1fr] gap-4 max-[1280px]:grid-cols-1">
            <Panel title="본부별 원가 구성">
              <div className="grid gap-3">
                {mergedRows.map((row) => {
                  const width = Math.max(
                    3,
                    Math.round((row.actual / maxActual) * 100)
                  );
                  return (
                    <article
                      key={`bar-${row.department}`}
                      className="grid gap-1.5"
                    >
                      <div className="flex items-center justify-between text-sm text-[#647ca5]">
                        <strong className="text-[#1e2f4c]">
                          {row.department}
                        </strong>
                        <span>{formatKrwCompact(row.actual)}</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-[#eaf0f9]">
                        <span
                          className="block h-full rounded-full bg-[#2f57c8]"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            </Panel>

            <Panel title="원가 배분 시뮬레이터">
              <div className="grid gap-2.5">
                <input
                  className="w-full rounded-[10px] border border-[#cbd6ea] px-3 py-2.5"
                  type="number"
                  placeholder="배분할 총 금액 (예: 100000000)"
                />
                <textarea
                  className="w-full rounded-[10px] border border-[#cbd6ea] px-3 py-2.5 font-mono text-[0.84rem]"
                  rows={6}
                  defaultValue='{"PRJ-001":30,"PRJ-002":20,"PRJ-003":50}'
                />
                <button
                  className="rounded-[10px] bg-[#2b4dbf] px-3 py-[11px] font-extrabold text-white"
                  type="button"
                >
                  배분 계산
                </button>
              </div>
            </Panel>
          </section>
        </>
      ) : null}
    </section>
  );
}
