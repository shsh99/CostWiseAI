import { formatDateTime } from '../../app/format';
import type { AuditEvent, DataSource } from '../../app/portfolioData';
import { Panel } from '../../shared/components/Panel';

type AuditLogPanelProps = {
  auditEvents: AuditEvent[];
  auditSource: DataSource;
  auditStatus: 'idle' | 'loading' | 'ready' | 'error';
  auditError: string | null;
  selectedProjectName: string | null;
  onRetryAuditLoad(): void;
  title?: string;
  subtitle?: string;
};

const domainChipClass: Record<string, string> = {
  ABC: 'bg-cyan-100 text-cyan-800',
  DCF: 'bg-violet-100 text-violet-800',
  ASSUMPTION: 'bg-amber-100 text-amber-800',
  ACCESS: 'bg-emerald-100 text-emerald-800'
};

function getDomainLabel(domain: string): string {
  if (domain === 'ASSUMPTION') {
    return 'ASSUMPTION';
  }
  return domain;
}

export function AuditLogPanel({
  auditEvents,
  auditSource,
  auditStatus,
  auditError,
  selectedProjectName,
  onRetryAuditLoad,
  title = '감사 로그',
  subtitle = '변경 이력과 승인 흐름을 시간순으로 확인합니다.'
}: AuditLogPanelProps) {
  const isAuditLoading = auditStatus === 'loading';
  const isAuditError = auditStatus === 'error';
  const hasAuditEvents = auditEvents.length > 0;

  return (
    <Panel title={title} subtitle={subtitle}>
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
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead className="bg-slate-100/80">
                <tr>
                  <th
                    scope="col"
                    className="w-[38%] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500"
                  >
                    Actor / Action
                  </th>
                  <th
                    scope="col"
                    className="w-[18%] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500"
                  >
                    Domain
                  </th>
                  <th
                    scope="col"
                    className="w-[26%] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500"
                  >
                    Timestamp
                  </th>
                  <th
                    scope="col"
                    className="w-[18%] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {auditEvents.map((item, index) => {
                  const chipClass =
                    domainChipClass[item.domain] ??
                    'bg-slate-100 text-slate-700';

                  return (
                    <tr
                      key={`${item.actor}-${item.action}-${item.at}`}
                      className={`align-top ${
                        index === 0 ? '' : 'border-t border-slate-200'
                      } ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/35'} hover:bg-[#eef4ff]`}
                    >
                      <th scope="row" className="px-4 py-3 text-left">
                        <div className="space-y-1">
                          <div className="text-[13px] font-semibold text-[#142542]">
                            {item.actor}
                          </div>
                          <div className="text-[12px] text-cw-muted">
                            {item.action}
                          </div>
                        </div>
                      </th>
                      <td className="whitespace-nowrap px-4 py-3 text-[13px] text-cw-muted">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${chipClass}`}
                        >
                          {getDomainLabel(item.domain)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13px] text-cw-muted">
                        {formatDateTime(item.at)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[13px] text-cw-muted">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                          Logged
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </Panel>
  );
}
