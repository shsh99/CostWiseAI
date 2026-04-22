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
  auditStatus: 'idle' | 'loading' | 'ready';
  selectedProjectName: string | null;
};

export function ReviewsView({
  portfolio,
  auditEvents,
  auditSource,
  auditStatus,
  selectedProjectName
}: ReviewsViewProps) {
  const isAuditLoading = auditStatus === 'loading';
  const hasAuditEvents = auditEvents.length > 0;

  return (
    <section className="reviews-grid">
      <Panel
        title="Assumptions"
        subtitle="검토 레이어에서 가정값과 전제 조건을 따로 읽습니다."
      >
        <div className="assumption-list">
          {portfolio.assumptions.map((item) => (
            <div key={item.label} className="assumption-list__item">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        title="Audit trail"
        subtitle="운영 이력은 포트폴리오/워크스페이스 화면과 분리된 리뷰 레이어에 둡니다."
      >
        <div className="audit-status" aria-live="polite">
          <span
            className={`status-pill status-pill--${auditSource === 'api' ? 'low' : 'mid'}`}
          >
            {auditSource === 'api' ? '감사 API' : '로컬 fallback'}
          </span>
          <p>
            {selectedProjectName
              ? `${selectedProjectName} 기준 감사 이력을 표시합니다.`
              : '선택된 프로젝트가 없어 포트폴리오 기준 감사 이력을 표시합니다.'}
          </p>
        </div>

        {isAuditLoading ? (
          <div className="audit-state" role="status">
            <strong>감사 이력을 불러오는 중입니다.</strong>
            <p>권한과 프로젝트 기준을 확인하고 있습니다.</p>
          </div>
        ) : null}

        {!isAuditLoading && !hasAuditEvents ? (
          <div className="empty-state">
            <strong>표시할 감사 이력이 없습니다.</strong>
            <p>승인, 평가, 원가 검토 이벤트가 기록되면 이곳에 표시됩니다.</p>
          </div>
        ) : null}

        {!isAuditLoading && hasAuditEvents ? (
          <ol className="audit-list audit-list--wide">
            {auditEvents.map((item) => (
              <li key={`${item.actor}-${item.action}-${item.at}`}>
                <strong>{item.actor}</strong>
                <span>{item.action}</span>
                <small>
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
