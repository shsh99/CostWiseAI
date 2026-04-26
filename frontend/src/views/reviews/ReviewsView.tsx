import { formatDateTime } from '../../app/format';
import type {
  AuditEvent,
  DataSource,
  PortfolioSummary
} from '../../app/portfolioData';
import { Panel } from '../../shared/components/Panel';
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  Database,
  FileText,
  ShieldCheck,
  UserCheck,
  Users
} from 'lucide-react';

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
  const successCount = auditEvents.filter((item) =>
    item.action.toLowerCase().includes('success')
  ).length;
  const pendingCount = Math.max(0, auditEvents.length - successCount);
  const sourceIsApi = auditSource === 'api';

  return (
    <section className="grid gap-4">
      <header className="rounded-2xl border border-[#d7e2f2] bg-[linear-gradient(130deg,#ffffff_0%,#f4f8ff_52%,#edf3ff_100%)] px-5 py-4 shadow-[0_8px_20px_rgba(24,40,71,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-[#6e86ad]">
              Audit Control Center
            </p>
            <h2 className="mt-1 text-[1.34rem] font-bold tracking-[-0.01em] text-[#1b3156]">
              감사 로그 대시보드
            </h2>
            <p className="mt-1 text-[0.88rem] text-[#5e759b]">
              이벤트 현황, 핵심 가정, 승인 이력을 한 화면에서 점검합니다.
            </p>
          </div>
          <div className="grid gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d1def3] bg-white px-2.5 py-1 text-[0.7rem] font-semibold text-[#4e678f]">
              <Database className="h-3.5 w-3.5" />
              {sourceIsApi ? '감사 API 정상 연결' : 'API 제한 모드'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d1def3] bg-white px-2.5 py-1 text-[0.7rem] font-semibold text-[#4e678f]">
              <FileText className="h-3.5 w-3.5" />
              {selectedProjectName ?? '포트폴리오 전체 기준'}
            </span>
          </div>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-[#d7e2f2] bg-white px-4 py-3.5 shadow-[0_5px_16px_rgba(24,40,71,0.05)]">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d9e5f6] bg-[#f4f8ff] px-2 py-0.5 text-[0.66rem] font-bold text-[#48679a]">
            <Activity className="h-3.5 w-3.5" />
            감사 이벤트
          </span>
          <strong className="mt-2 block text-[1.8rem] font-extrabold leading-none text-[#132744]">
            {auditEvents.length}
          </strong>
          <p className="mt-1.5 text-[0.82rem] text-[#687ea4]">
            현재 컨텍스트 기준 누적 이력
          </p>
        </article>
        <article className="rounded-2xl border border-[#d7e2f2] bg-white px-4 py-3.5 shadow-[0_5px_16px_rgba(24,40,71,0.05)]">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d9e5f6] bg-[#f4f8ff] px-2 py-0.5 text-[0.66rem] font-bold text-[#48679a]">
            <Users className="h-3.5 w-3.5" />
            참여 사용자
          </span>
          <strong className="mt-2 block text-[1.8rem] font-extrabold leading-none text-[#132744]">
            {uniqueActors}
          </strong>
          <p className="mt-1.5 text-[0.82rem] text-[#687ea4]">
            작성/승인 참여 인원
          </p>
        </article>
        <article className="rounded-2xl border border-[#d7e2f2] bg-white px-4 py-3.5 shadow-[0_5px_16px_rgba(24,40,71,0.05)]">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d9e5f6] bg-[#f4f8ff] px-2 py-0.5 text-[0.66rem] font-bold text-[#48679a]">
            <BadgeCheck className="h-3.5 w-3.5" />
            성공 기록
          </span>
          <strong className="mt-2 block text-[1.8rem] font-extrabold leading-none text-[#132744]">
            {successCount}
          </strong>
          <p className="mt-1.5 text-[0.82rem] text-[#687ea4]">
            SUCCESS 포함 이벤트 수
          </p>
        </article>
        <article className="rounded-2xl border border-[#d7e2f2] bg-white px-4 py-3.5 shadow-[0_5px_16px_rgba(24,40,71,0.05)]">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d9e5f6] bg-[#f4f8ff] px-2 py-0.5 text-[0.66rem] font-bold text-[#48679a]">
            <AlertTriangle className="h-3.5 w-3.5" />
            확인 필요
          </span>
          <strong className="mt-2 block text-[1.8rem] font-extrabold leading-none text-[#132744]">
            {pendingCount}
          </strong>
          <p className="mt-1.5 text-[0.82rem] text-[#687ea4]">
            후속 검토가 필요한 이벤트
          </p>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel
          title="감사 검토 기준"
          titleIcon={<ShieldCheck className="h-4 w-4" />}
          subtitle="가치평가 및 리스크 산식의 핵심 가정을 감사 맥락에서 확인합니다."
        >
          <div className="rounded-xl border border-[#d8e3f2] bg-[linear-gradient(130deg,#f8fbff_0%,#eef4ff_100%)] p-3.5">
            <p className="text-[0.74rem] font-semibold uppercase tracking-[0.08em] text-[#60779f]">
              최근 기록
            </p>
            <strong className="mt-1 block text-[0.95rem] font-semibold text-[#1d3358]">
              {recentEvent ? recentEvent.action : '기록 없음'}
            </strong>
            <p className="mt-1 text-[0.8rem] text-[#6a80a6]">
              {recentEvent ? formatDateTime(recentEvent.at) : '-'}
            </p>
          </div>

          <div className="mt-3.5 space-y-2">
            {portfolio.assumptions.map((item, index) => (
              <article
                key={item.label}
                className="flex items-center justify-between rounded-xl border border-[#dce6f4] bg-white px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <span className="text-[0.72rem] font-semibold tracking-[0.05em] text-[#6f86ad]">
                    ASSUMPTION {String(index + 1).padStart(2, '0')}
                  </span>
                  <p className="mt-0.5 truncate text-[0.86rem] font-semibold text-[#1f3458]">
                    {item.label}
                  </p>
                </div>
                <strong className="text-[0.9rem] font-bold text-[#213a62]">
                  {item.value}
                </strong>
              </article>
            ))}
          </div>

          <div className="mt-3.5 rounded-xl border border-[#dbe6f4] bg-[#f8fbff] px-3.5 py-3">
            <p className="text-[0.74rem] font-semibold uppercase tracking-[0.08em] text-[#60779f]">
              감사 메모
            </p>
            <p className="mt-1 text-[0.82rem] leading-6 text-[#4f658d]">
              가정값 변경 시 동일 시점의 승인 로그와 함께 검토하면 이력 신뢰도가
              높아집니다.
            </p>
          </div>
        </Panel>

        <Panel
          title="감사 로그"
          titleIcon={<UserCheck className="h-4 w-4" />}
          subtitle="변경 이력과 승인 흐름을 시간순으로 확인합니다."
        >
          <div
            className="mb-4 flex items-start gap-3 rounded-xl border border-[#dbe6f5] bg-[#f8fbff] px-3.5 py-3"
            aria-live="polite"
          >
            <span
              className={`inline-flex h-6 shrink-0 items-center rounded-full px-2 text-xs font-semibold ${
                sourceIsApi
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {sourceIsApi ? '감사 API' : 'API 제한'}
            </span>
            <p className="text-sm leading-5 text-[#5b7198]">
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
            <div className="overflow-hidden rounded-xl border border-[#dbe6f5] bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] border-collapse text-sm">
                  <thead className="bg-[#f1f6fd]">
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
                          index === 0 ? '' : 'border-t border-[#e4ecf8]'
                        } ${index % 2 === 0 ? 'bg-white' : 'bg-[#fbfdff]'} hover:bg-[#eef4ff]`}
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
                          <span className="rounded-full border border-[#d7e2f2] bg-[#f5f8fd] px-2 py-0.5 text-[12px] font-medium text-slate-700">
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
