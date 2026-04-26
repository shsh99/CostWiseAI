import { formatDateTime } from '../../app/format';
import type {
  AuditEvent,
  DataSource,
  PortfolioSummary
} from '../../app/portfolioData';
import { Panel } from '../../shared/components/Panel';

export type AuditOverviewSectionProps = {
  auditEvents: AuditEvent[];
  auditSource: DataSource;
  selectedProjectName: string | null;
  assumptions: PortfolioSummary['assumptions'];
};

type OverviewCardProps = {
  label: string;
  value: string | number;
  helper: string;
  valueClassName?: string;
};

function OverviewCard({
  label,
  value,
  helper,
  valueClassName = 'text-[#142542]'
}: OverviewCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </span>
      <strong
        className={`mt-1 block text-[1.5rem] font-semibold leading-none ${valueClassName}`}
      >
        {value}
      </strong>
      <p className="mt-2 text-sm text-cw-muted">{helper}</p>
    </article>
  );
}

export function AuditOverviewSection({
  auditEvents,
  auditSource,
  selectedProjectName,
  assumptions
}: AuditOverviewSectionProps) {
  const hasAuditEvents = auditEvents.length > 0;
  const recentEvent = hasAuditEvents ? auditEvents[0] : null;
  const uniqueActors = new Set(auditEvents.map((event) => event.actor)).size;

  return (
    <section className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewCard
          label="감사 이벤트"
          value={auditEvents.length}
          helper="현재 컨텍스트 기준 누적 이력"
        />

        <OverviewCard
          label="참여 사용자"
          value={uniqueActors}
          helper="감사 이력 작성/승인 참여 인원"
        />

        <OverviewCard
          label="최근 기록"
          value={recentEvent ? recentEvent.action : '-'}
          helper={recentEvent ? formatDateTime(recentEvent.at) : '기록 없음'}
          valueClassName="text-base text-[#142542]"
        />

        <article className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-start justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              데이터 소스
            </span>
            <span
              className={`inline-flex h-6 shrink-0 items-center rounded-full px-2 text-[11px] font-semibold ${
                auditSource === 'api'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {auditSource === 'api' ? '감사 API' : 'API 제한'}
            </span>
          </div>
          <strong className="mt-1 block text-base font-semibold text-[#142542]">
            {selectedProjectName
              ? `${selectedProjectName} 기준`
              : '포트폴리오 전체 기준'}
          </strong>
          <p className="mt-2 text-sm text-cw-muted">
            {auditSource === 'api'
              ? '실시간 감사 로그를 기반으로 표시됩니다.'
              : '네트워크/권한 제한으로 샘플 데이터가 표시될 수 있습니다.'}
          </p>
        </article>
      </div>

      <Panel
        title="가정·전제 조건"
        subtitle="가치평가 및 리스크 산식의 핵심 가정을 감사 맥락에서 확인합니다."
      >
        {!assumptions.length ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm">
            <strong className="block font-semibold text-[#142542]">
              등록된 가정이 없습니다.
            </strong>
            <p className="mt-1 text-cw-muted">
              프로젝트 설정에서 핵심 가정을 추가하면 감사 검토 맥락을 더 명확히
              볼 수 있습니다.
            </p>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {assumptions.map((item) => (
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
        )}
      </Panel>
    </section>
  );
}
