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

type AccountingTransaction = {
  date: string;
  period: string;
  department: string;
  project: string;
  item: string;
  actual: string;
  standard: string;
  note: string;
};

const departmentLabelByCode: Record<string, string> = {
  HQ01: '주식운용본부',
  HQ02: '채권운용본부',
  HQ03: '대체투자본부',
  HQ04: '파생상품본부',
  HQ05: '리스크관리본부'
};

const accountingTransactions: AccountingTransaction[] = [
  {
    date: '2026-03-25',
    period: '2026-03',
    department: '리스크관리본부',
    project: 'PRJ-2025-018 · IFRS17 시스템 구축',
    item: '직접인건비',
    actual: '₩14,000,000',
    standard: '₩13,500,000',
    note: 'IFRS17 개발'
  },
  {
    date: '2026-03-20',
    period: '2026-03',
    department: '파생상품본부',
    project: 'PRJ-2025-015 · 통화 옵션 헤지북',
    item: '직접인건비',
    actual: '₩10,500,000',
    standard: '₩10,000,000',
    note: '통화옵션 운용'
  },
  {
    date: '2026-03-15',
    period: '2026-03',
    department: '대체투자본부',
    project: 'PRJ-2025-010 · 서울권 오피스 리츠',
    item: '자재비',
    actual: '₩32,000,000',
    standard: '₩30,000,000',
    note: '오피스리츠 감정평가'
  },
  {
    date: '2026-03-10',
    period: '2026-03',
    department: '채권운용본부',
    project: 'PRJ-2025-007 · 해외채권 달러표시',
    item: '직접인건비',
    actual: '₩13,500,000',
    standard: '₩13,000,000',
    note: '해외채권 분석'
  },
  {
    date: '2026-03-05',
    period: '2026-03',
    department: '주식운용본부',
    project: 'PRJ-2025-004 · ESG 테마 펀드',
    item: '직접인건비',
    actual: '₩12,500,000',
    standard: '₩12,000,000',
    note: 'ESG펀드 분석'
  },
  {
    date: '2026-02-25',
    period: '2026-02',
    department: '파생상품본부',
    project: 'PRJ-2025-014 · 주가지수 선물 전략',
    item: '직접인건비',
    actual: '₩11,000,000',
    standard: '₩10,500,000',
    note: '선물 운용 인건비'
  },
  {
    date: '2026-02-22',
    period: '2026-02',
    department: '대체투자본부',
    project: 'PRJ-2025-011 · 해상풍력 프로젝트파이낸싱',
    item: '외주용역비',
    actual: '₩45,000,000',
    standard: '₩45,000,000',
    note: '해상풍력 외주실사'
  },
  {
    date: '2026-02-20',
    period: '2026-02',
    department: '채권운용본부',
    project: 'PRJ-2025-005 · 국고채 10년 포지션',
    item: '직접인건비',
    actual: '₩16,000,000',
    standard: '₩15,500,000',
    note: '국고채 운용인건비'
  },
  {
    date: '2026-02-15',
    period: '2026-02',
    department: '주식운용본부',
    project: '공통',
    item: '간접인건비',
    actual: '₩8,500,000',
    standard: '₩8,500,000',
    note: '본부 간접인건비'
  },
  {
    date: '2026-02-10',
    period: '2026-02',
    department: '주식운용본부',
    project: 'PRJ-2025-001 · 삼성전자 전략투자',
    item: '직접인건비',
    actual: '₩13,000,000',
    standard: '₩12,000,000',
    note: '프로젝트1 직접인건비'
  },
  {
    date: '2026-02-10',
    period: '2026-02',
    department: '주식운용본부',
    project: 'PRJ-2025-003 · 코스닥 성장주 포트폴리오',
    item: '직접인건비',
    actual: '₩14,000,000',
    standard: '₩13,500,000',
    note: '코스닥펀드 운용'
  },
  {
    date: '2026-01-28',
    period: '2026-01',
    department: '리스크관리본부',
    project: 'PRJ-2025-017 · 전사 리스크 모델 고도화',
    item: '직접인건비',
    actual: '₩13,000,000',
    standard: '₩12,500,000',
    note: '리스크모델 개발'
  },
  {
    date: '2026-01-25',
    period: '2026-01',
    department: '파생상품본부',
    project: 'PRJ-2025-013 · 금리스왑 헤지',
    item: '직접인건비',
    actual: '₩9,000,000',
    standard: '₩8,500,000',
    note: '금리스왑 운용'
  },
  {
    date: '2026-01-22',
    period: '2026-01',
    department: '대체투자본부',
    project: 'PRJ-2025-009 · A고속도로 인프라펀드',
    item: '직접인건비',
    actual: '₩18,000,000',
    standard: '₩17,500,000',
    note: '인프라펀드 관리'
  },
  {
    date: '2026-01-22',
    period: '2026-01',
    department: '대체투자본부',
    project: 'PRJ-2025-009 · A고속도로 인프라펀드',
    item: '자재비',
    actual: '₩25,000,000',
    standard: '₩25,000,000',
    note: '인프라 실사비용'
  },
  {
    date: '2026-01-20',
    period: '2026-01',
    department: '채권운용본부',
    project: 'PRJ-2025-005 · 국고채 10년 포지션',
    item: '직접인건비',
    actual: '₩15,000,000',
    standard: '₩14,500,000',
    note: '국고채 포지션 모니터링'
  }
];

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
    <section className="grid gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-[2.45rem] font-extrabold tracking-[-0.02em] text-[#172a4a]">
            원가 집계·분석
          </h2>
          <p className="mt-1.5 text-[1.18rem] text-[#5e759f]">
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

            <div className="overflow-hidden rounded-2xl border border-[#dce5f4] bg-white shadow-[inset_0_1px_0_#f6f9ff]">
              <table className="min-w-full text-[1.08rem]">
                <thead className="bg-[#eef3fb] text-[#5b7097]">
                  <tr>
                    <th className="px-5 py-4 text-left">본부</th>
                    <th className="px-5 py-4 text-left">실제원가</th>
                    <th className="px-5 py-4 text-left">표준원가</th>
                    <th className="px-5 py-4 text-left">차이</th>
                    <th className="px-5 py-4 text-left">차이율</th>
                    <th className="px-5 py-4 text-left">판정</th>
                  </tr>
                </thead>
                <tbody>
                  {mergedRows.map((row) => (
                    <tr
                      key={row.department}
                      className="border-t border-[#e6edf8]"
                    >
                      <td className="px-5 py-4 font-semibold text-[#1e2f4c]">
                        {row.department}
                      </td>
                      <td className="px-5 py-4">
                        {formatKrwCompact(row.actual)}
                      </td>
                      <td className="px-5 py-4 text-[#7086ac]">
                        {formatKrwCompact(row.standard)}
                      </td>
                      <td
                        className={`px-5 py-4 font-bold ${
                          row.diff > 0 ? 'text-[#e03131]' : 'text-[#16955f]'
                        }`}
                      >
                        {row.diff > 0 ? '+' : ''}
                        {formatKrwCompact(row.diff)}
                      </td>
                      <td
                        className={`px-5 py-4 font-bold ${
                          row.rate > 0 ? 'text-[#e03131]' : 'text-[#16955f]'
                        }`}
                      >
                        {row.rate.toFixed(2)}%
                      </td>
                      <td className="px-5 py-4">
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

          <Panel title="원가 거래 내역">
            <div className="mb-3 flex flex-wrap items-center justify-end gap-2.5">
              <select className="rounded-[10px] border border-[#cbd6ea] bg-white px-3 py-2 text-sm text-[#2f4570]">
                <option>전체 본부</option>
                <option>주식운용본부</option>
                <option>채권운용본부</option>
                <option>대체투자본부</option>
                <option>파생상품본부</option>
                <option>리스크관리본부</option>
              </select>
              <input
                className="rounded-[10px] border border-[#cbd6ea] bg-white px-3 py-2 text-sm text-[#2f4570]"
                type="month"
              />
            </div>

            <div className="max-h-[560px] overflow-auto rounded-2xl border border-[#dce5f4] bg-white shadow-[inset_0_1px_0_#f6f9ff]">
              <table className="min-w-full text-[1rem]">
                <thead className="sticky top-0 z-[1] bg-[#eef3fb] text-[#5b7097]">
                  <tr>
                    <th className="px-5 py-4 text-left">날짜</th>
                    <th className="px-5 py-4 text-left">기간</th>
                    <th className="px-5 py-4 text-left">본부</th>
                    <th className="px-5 py-4 text-left">프로젝트</th>
                    <th className="px-5 py-4 text-left">원가항목</th>
                    <th className="px-5 py-4 text-left">실제</th>
                    <th className="px-5 py-4 text-left">표준</th>
                    <th className="px-5 py-4 text-left">비고</th>
                  </tr>
                </thead>
                <tbody>
                  {accountingTransactions.map((row) => (
                    <tr
                      key={`${row.date}-${row.project}`}
                      className="border-t border-[#e6edf8]"
                    >
                      <td className="px-5 py-3.5 text-[#2a4168]">{row.date}</td>
                      <td className="px-5 py-3.5 text-[#2a4168]">
                        {row.period}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-[#1e2f4c]">
                        {row.department}
                      </td>
                      <td className="px-5 py-3.5 text-[#2a4168]">
                        {row.project}
                      </td>
                      <td className="px-5 py-3.5 text-[#2a4168]">{row.item}</td>
                      <td className="px-5 py-3.5 font-semibold text-[#1e2f4c]">
                        {row.actual}
                      </td>
                      <td className="px-5 py-3.5 text-[#7086ac]">
                        {row.standard}
                      </td>
                      <td className="px-5 py-3.5 text-[#60779f]">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      ) : null}
    </section>
  );
}
