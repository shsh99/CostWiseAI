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

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Panel
        title="Assumptions"
        subtitle="검토 레이어에서 가정값과 전제 조건을 따로 읽습니다."
      >
        <div className="space-y-2">
          {portfolio.assumptions.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2"
            >
              <span className="text-[13px] font-medium text-cw-muted">{item.label}</span>
              <strong className="text-sm font-semibold text-[#1f2e4a]">{item.value}</strong>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        title="Audit trail"
        subtitle="운영 이력은 포트폴리오/워크스페이스 화면과 분리된 리뷰 레이어에 둡니다."
      >
        <div
          className="mb-4 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5"
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
            <p className="mt-1 text-sky-800">권한과 프로젝트 기준을 확인하고 있습니다.</p>
          </div>
        ) : null}

        {isAuditError ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm">
            <strong className="block font-semibold text-[#142542]">
              감사 이력을 불러오지 못했습니다.
            </strong>
            <p className="mt-1 text-cw-muted">{auditError ?? 'API 연결을 확인한 뒤 다시 시도하세요.'}</p>
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
            <strong className="block font-semibold text-[#142542]">표시할 감사 이력이 없습니다.</strong>
            <p className="mt-1 text-cw-muted">
              승인, 평가, 원가 검토 이벤트가 기록되면 이곳에 표시됩니다.
            </p>
          </div>
        ) : null}

        {!isAuditLoading && !isAuditError && hasAuditEvents ? (
          <ol className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {auditEvents.map((item) => (
              <li
                key={`${item.actor}-${item.action}-${item.at}`}
                className="grid gap-1 border-b border-slate-200 px-3 py-2.5 text-sm last:border-b-0"
              >
                <strong className="font-semibold text-[#142542]">{item.actor}</strong>
                <span className="text-cw-muted">{item.action}</span>
                <small className="text-xs text-cw-muted">
                  {item.domain} · {formatDateTime(item.at)}
                </small>
              </li>
            ))}
          </ol>
        ) : null}
      </Panel>
    </section>
  );
}
