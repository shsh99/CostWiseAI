/* eslint-disable no-unused-vars */
import { formatKrwCompact, formatPercent } from '../../app/format';
import type { PortfolioSummary, ProjectSummary, RoleInsight } from '../../app/portfolioData';
import { MetricCard } from '../../shared/components/MetricCard';
import { Panel } from '../../shared/components/Panel';

type DashboardViewProps = {
  decisionSignals: ReadonlyArray<{ label: string; value: string }>;
  selectedInsight: RoleInsight;
  portfolio: PortfolioSummary;
  priorityProjects: ProjectSummary[];
  onOpenWorkspace(target: 'accounting' | 'valuation', projectCode: string): void;
};

export function DashboardView({
  decisionSignals,
  selectedInsight,
  portfolio,
  priorityProjects,
  onOpenWorkspace
}: DashboardViewProps) {
  return (
    <>
      <section className="hero-strip hero-strip--workspace" aria-label="현재 방향">
        <div className="hero-strip__content">
          <p className="hero-strip__eyebrow">Default landing</p>
          <h2>포트폴리오에서 시작하고, 프로젝트 워크스페이스로 내려갑니다.</h2>
          <p>
            현재 셸은 플랫폼, 포트폴리오, 프로젝트 워크스페이스를 같은 캔버스에 섞지 않습니다.
            먼저 상태를 파악하고, 필요한 프로젝트만 선택해 관리회계 또는 재무평가 워크스페이스로 진입합니다.
          </p>
          <div className="hero-strip__chips">
            {decisionSignals.map((signal) => (
              <div key={signal.label} className="hero-chip">
                <span>{signal.label}</span>
                <strong>{signal.value}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-strip__status">
          <div className="hero-strip__note">
            <span>Current focus</span>
            <strong>{selectedInsight.decisionFocus}</strong>
            <small>{selectedInsight.nextAction}</small>
          </div>
        </div>
      </section>

      <section className="metrics metrics--hero" aria-label="핵심 KPI">
        <MetricCard
          label="총 투자액"
          value={formatKrwCompact(portfolio.overview.totalInvestmentKrw)}
          detail="포트폴리오 기준"
          tone="primary"
        />
        <MetricCard
          label="평균 NPV"
          value={formatKrwCompact(portfolio.overview.averageNpvKrw)}
          detail="프로젝트 사업성 평균"
          tone="success"
        />
        <MetricCard
          label="평균 IRR"
          value={formatPercent(portfolio.overview.averageIrr)}
          detail="기준 시나리오 가중 평균"
          tone="warning"
        />
        <MetricCard
          label="승인 완료"
          value={`${portfolio.overview.approvedCount}건`}
          detail="최종 승인된 프로젝트"
          tone="primary"
        />
      </section>

      <section className="dashboard-grid">
        <Panel title="Priority queue" subtitle="다음 검토 대상을 빠르게 고르고 워크스페이스로 진입합니다.">
          <div className="queue-list">
            {priorityProjects.map((project) => (
              <article key={project.code} className="queue-card">
                <div>
                  <span className="queue-card__eyebrow">
                    {project.rank}위 · {project.headquarter}
                  </span>
                  <strong>{project.name}</strong>
                  <p>
                    {project.assetCategory} · {project.status} · NPV {formatKrwCompact(project.npvKrw)}
                  </p>
                </div>
                <div className="queue-card__actions">
                  <button type="button" onClick={() => onOpenWorkspace('accounting', project.code)}>
                    관리회계 열기
                  </button>
                  <button type="button" onClick={() => onOpenWorkspace('valuation', project.code)}>
                    재무평가 열기
                  </button>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel
          title="Workspace lanes"
          subtitle="동일한 프로젝트를 역할과 의사결정 목적에 따라 다른 워크스페이스로 읽습니다."
        >
          <div className="lane-grid">
            <article className="lane-card lane-card--accounting">
              <span>Management Accounting</span>
              <strong>원가 구조와 배분 기준 확인</strong>
              <p>활동 기준 원가, 배분 차이, 효율 격차를 프로젝트별로 분리해 봅니다.</p>
            </article>
            <article className="lane-card lane-card--valuation">
              <span>Financial Evaluation</span>
              <strong>투자 타당성과 시나리오 판단</strong>
              <p>NPV, IRR, 회수기간과 시나리오 비교를 프로젝트 단위로 읽습니다.</p>
            </article>
            <article className="lane-card lane-card--review">
              <span>Review Layer</span>
              <strong>가정값과 감사 근거 추적</strong>
              <p>검토 흐름과 이력은 별도 레이어에서 확인해 네비게이션과 경쟁하지 않게 합니다.</p>
            </article>
          </div>
        </Panel>
      </section>
    </>
  );
}
