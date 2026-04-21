import { formatDateTime } from '../../app/format';
import type { PortfolioSummary } from '../../app/portfolioData';
import { Panel } from '../../shared/components/Panel';

type ReviewsViewProps = {
  portfolio: PortfolioSummary;
};

export function ReviewsView({ portfolio }: ReviewsViewProps) {
  return (
    <section className="reviews-grid">
      <Panel title="Assumptions" subtitle="검토 레이어에서 가정값과 전제 조건을 따로 읽습니다.">
        <div className="assumption-list">
          {portfolio.assumptions.map((item) => (
            <div key={item.label} className="assumption-list__item">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Audit trail" subtitle="운영 이력은 포트폴리오/워크스페이스 화면과 분리된 리뷰 레이어에 둡니다.">
        <ol className="audit-list audit-list--wide">
          {portfolio.auditEvents.map((item) => (
            <li key={`${item.actor}-${item.at}`}>
              <strong>{item.actor}</strong>
              <span>{item.action}</span>
              <small>
                {item.domain} · {formatDateTime(item.at)}
              </small>
            </li>
          ))}
        </ol>
      </Panel>
    </section>
  );
}
