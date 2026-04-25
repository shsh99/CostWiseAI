import { formatDateTime } from '../../app/format';
import type {
  AuditEvent,
  DataSource,
  PortfolioSummary
} from '../../app/portfolioData';
import { Panel } from '../../shared/components/Panel';

type ReviewsViewProps = {
  portfolio: PortfolioSummary;
  auditEvents: AuditEvent[];
  auditSource: DataSource;
  auditStatus: 'idle' | 'loading' | 'ready' | 'error';
  auditError: string | null;
  selectedProjectName: string | null;
  onRetryAuditLoad(): void;
};

export function ReviewsView({
  portfolio,
  auditEvents,
  auditSource,
  auditStatus,
  auditError,
  selectedProjectName,
  onRetryAuditLoad
}: ReviewsViewProps) {
  const isAuditLoading = auditStatus === 'loading';
  const isAuditError = auditStatus === 'error';
  const hasAuditEvents = auditEvents.length > 0;
  const recentEvent = hasAuditEvents ? auditEvents[0] : null;
  const uniqueActors = new Set(auditEvents.map((event) => event.actor)).size;

  return (
    <section className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            감사 이벤트
          </span>
          <strong className="mt-1 block text-[1.75rem] font-semibold leading-none text-[#142542]">
            {auditEvents.length}
          </strong>
          <p className="mt-2 text-sm text-cw-muted">
            현재 컨텍스트 기준 누적 이력
          </p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            데이터 소스
          </span>
          <strong className="mt-1 block text-base font-semibold text-[#142542]">
            {auditSource === 'api' ? '감사 API' : 'API 제한 모드'}
          </strong>
          <p className="mt-2 text-sm text-cw-muted">
            {selectedProjectName
              ? `${selectedProjectName} 프로젝트 기준`
              : '포트폴리오 전체 기준'}
          </p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            최근 기록
          </span>
          <strong className="mt-1 block text-base font-semibold text-[#142542]">
            {recentEvent ? recentEvent.action : '-'}
          </strong>
          <p className="mt-2 text-sm text-cw-muted">
            {recentEvent ? formatDateTime(recentEvent.at) : '기록 없음'}
          </p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            참여 사용자
          </span>
          <strong className="mt-1 block text-[1.25rem] font-semibold leading-none text-[#142542]">
            {uniqueActors}
          </strong>
          <p className="mt-2 text-sm text-cw-muted">
            감사 이력 작성/승인 참여 인원
          </p>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel
          title="가정·전제 조건"
          subtitle="가치평가 및 리스크 산식의 핵심 가정을 감사 맥락에서 확인합니다."
        >
          <div className="space-y-2">
            {portfolio.assumptions.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2"
              >
                <span className="text-[13px] font-medium text-cw-muted">
                  {item.label}
                </span>
                <strong className="text-sm font-semibold text-[#1f2e4a]">
                  {item.value}
                </strong>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="감사 로그"
          subtitle="변경 이력과 승인 흐름을 시간순으로 확인합니다."
        >
          <div
            className="mb-4 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5"
            aria-live="polite"
          >
            <span
              className={`inline-flex h-6 shrink-0 items-center rounded-full px-2 text-xs font-semibold ${
                auditSource === 'api'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {auditSource === 'api' ? '감사 API' : 'API 제한'}
            </span>
            <p className="text-sm leading-5 text-cw-muted">
              {selectedProjectName
                ? `${selectedProjectName} 기준 감사 이력을 표시합니다.`
                : '선택된 프로젝트가 없어 포트폴리오 기준 감사 이력을 표시합니다.'}
            </p>
          </div>

          {isAuditLoading ? (
            <div
              className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm"
              role="status"
            >
              <strong className="block font-semibold text-sky-900">
                감사 이력을 불러오는 중입니다.
              </strong>
              <p className="mt-1 text-sky-800">
                권한과 프로젝트 기준을 확인하고 있습니다.
              </p>
            </div>
          ) : null}

          {isAuditError ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm">
              <strong className="block font-semibold text-[#142542]">
                감사 이력을 불러오지 못했습니다.
              </strong>
              <p className="mt-1 text-cw-muted">
                {auditError ?? 'API 연결을 확인한 뒤 다시 시도하세요.'}
              </p>
              <button
                type="button"
                onClick={onRetryAuditLoad}
                className="mt-3 inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-[#142542] transition hover:bg-slate-100"
              >
                다시 시도
              </button>
            </div>
          ) : null}

          {!isAuditLoading && !isAuditError && !hasAuditEvents ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm">
              <strong className="block font-semibold text-[#142542]">
                표시할 감사 이력이 없습니다.
              </strong>
              <p className="mt-1 text-cw-muted">
                승인, 평가, 원가 검토 이벤트가 기록되면 이곳에 표시됩니다.
              </p>
            </div>
          ) : null}

          {!isAuditLoading && !isAuditError && hasAuditEvents ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] border-collapse text-sm">
                  <thead className="bg-slate-100/80">
                    <tr>
                      <th
                        scope="col"
                        className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500"
                      >
                        사용자
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500"
                      >
                        액션
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500"
                      >
                        도메인
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500"
                      >
                        시각
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditEvents.map((item, index) => (
                      <tr
                        key={`${item.actor}-${item.action}-${item.at}`}
                        className={`align-top ${
                          index === 0 ? '' : 'border-t border-slate-200'
                        } ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/35'} hover:bg-[#eef4ff]`}
                      >
                        <th
                          scope="row"
                          className="whitespace-nowrap px-3 py-2.5 text-left text-[13px] font-semibold text-[#142542]"
                        >
                          {item.actor}
                        </th>
                        <td className="px-3 py-2.5 text-[13px] text-cw-muted">
                          {item.action}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-[13px] text-cw-muted">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[12px] font-medium text-slate-700">
                            {item.domain}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-[13px] text-cw-muted">
                          {formatDateTime(item.at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </Panel>
      </div>
    </section>
  );
}
