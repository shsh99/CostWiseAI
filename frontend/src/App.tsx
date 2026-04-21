import { useEffect, useMemo, useState } from 'react';
import {
  buildDecisionSignals,
  buildProjectDetail,
  defaultPortfolioSummary,
  loadPortfolioSummary,
  navigationItems,
  roleInsights,
  type PortfolioSummary,
  type ProjectStatus,
  type Role
} from './app/portfolioData';
import { formatDateTime, formatKrwCompact, formatPercent, formatYears } from './app/format';
import { MetricCard } from './components/MetricCard';
import { Panel } from './components/Panel';
import { ProgressBar } from './components/ProgressBar';

type NavigationKey = (typeof navigationItems)[number]['key'];

const workspaceSections = ['Project Summary', 'Drivers', 'Decision Surface', 'Next Actions'] as const;

const viewMeta: Record<
  NavigationKey,
  { eyebrow: string; title: string; description: string; breadcrumb: string[] }
> = {
  dashboard: {
    eyebrow: 'Executive overview',
    title: 'Task-first decision shell',
    description: '플랫폼 진입 즉시 포트폴리오 상태와 다음 작업 경로를 이해하도록 셸을 재구성했습니다.',
    breadcrumb: ['Platform', 'Dashboard']
  },
  portfolio: {
    eyebrow: 'Portfolio queue',
    title: 'Portfolio as the default landing context',
    description: '프로젝트를 한곳에서 검토하고, 필요한 워크스페이스로 의도적으로 진입합니다.',
    breadcrumb: ['Platform', 'Portfolio']
  },
  accounting: {
    eyebrow: 'Workspace',
    title: 'Management accounting workspace',
    description: '선택된 프로젝트의 원가·배분 맥락만 집중해서 봅니다.',
    breadcrumb: ['Platform', 'Workspaces', 'Management Accounting']
  },
  valuation: {
    eyebrow: 'Workspace',
    title: 'Financial evaluation workspace',
    description: '투자 타당성, 시나리오, 리스크를 프로젝트 단위로 읽습니다.',
    breadcrumb: ['Platform', 'Workspaces', 'Financial Evaluation']
  },
  reviews: {
    eyebrow: 'Review history',
    title: 'Assumptions and review evidence',
    description: '가정값과 감사 흐름을 별도 검토 레이어로 분리했습니다.',
    breadcrumb: ['Platform', 'Reviews']
  },
  settings: {
    eyebrow: 'Administration',
    title: 'Role and workspace preferences',
    description: '역할과 선호 컨텍스트는 글로벌 네비게이션과 분리된 설정 영역으로 둡니다.',
    breadcrumb: ['Platform', 'Settings']
  }
};

const riskToneMap = {
  낮음: 'low',
  중간: 'mid',
  높음: 'high'
} as const;

export function App() {
  const [selectedRole, setSelectedRole] = useState<Role>('임원');
  const [activeView, setActiveView] = useState<NavigationKey>('dashboard');
  const [portfolio, setPortfolio] = useState<PortfolioSummary>(defaultPortfolioSummary);
  const [source, setSource] = useState<'api' | 'local'>('local');
  const [selectedProjectCode, setSelectedProjectCode] = useState(
    defaultPortfolioSummary.projects[0]?.code ?? ''
  );

  useEffect(() => {
    let cancelled = false;

    void loadPortfolioSummary().then(({ summary, source: loadedSource }) => {
      if (!cancelled) {
        setPortfolio(summary);
        setSource(loadedSource);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedProject =
    portfolio.projects.find((project) => project.code === selectedProjectCode) ??
    portfolio.projects[0];
  const selectedDetail = selectedProject ? buildProjectDetail(selectedProject.code) : null;
  const selectedInsight = roleInsights[selectedRole];
  const decisionSignals = buildDecisionSignals(portfolio);
  const currentViewMeta = viewMeta[activeView];
  const priorityProjects = useMemo(() => portfolio.projects.slice(0, 6), [portfolio.projects]);
  const maxHeadquarterInvestment = useMemo(
    () => Math.max(...portfolio.headquarters.map((headquarter) => headquarter.totalInvestmentKrw)),
    [portfolio.headquarters]
  );
  const selectedWorkspaceKpis = selectedProject
    ? [
        { label: 'NPV', value: formatKrwCompact(selectedProject.npvKrw) },
        { label: 'IRR', value: formatPercent(selectedProject.irr) },
        { label: '회수기간', value: formatYears(selectedProject.paybackYears) },
        { label: '리스크', value: selectedProject.risk }
      ]
    : [];

  function openWorkspace(target: 'accounting' | 'valuation', projectCode: string) {
    setSelectedProjectCode(projectCode);
    setActiveView(target);
  }

  return (
    <div className="app-shell app-shell--task-first">
      <a className="skip-link" href="#main-content">
        본문으로 건너뛰기
      </a>

      <aside className="sidebar sidebar--task-first">
        <div className="brand">
          <div className="brand__mark">CW</div>
          <div>
            <strong>CostWiseAI</strong>
            <p>Task-first portfolio operating system</p>
          </div>
        </div>

        <nav className="nav nav--stacked" aria-label="제품 맵">
          <p className="nav__label">Product Map</p>
          {navigationItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`nav__item nav__item--stacked ${
                activeView === item.key ? 'nav__item--active' : ''
              }`}
              onClick={() => setActiveView(item.key)}
            >
              <span className="nav__eyebrow">{item.label}</span>
              <strong>{item.description}</strong>
            </button>
          ))}
        </nav>

        <div className="sidebar__footer">
          <span>Current role</span>
          <strong>{selectedRole}</strong>
          <small>역할 전환은 상단 컨텍스트 바에서 수행합니다.</small>
        </div>
      </aside>

      <div className="workspace workspace--task-first">
        <header className="topbar topbar--task-first">
          <div className="topbar__context">
            <p className="topbar__eyebrow">{currentViewMeta.eyebrow}</p>
            <div className="breadcrumb" aria-label="현재 위치">
              {currentViewMeta.breadcrumb.map((item, index) => (
                <span key={item} className="breadcrumb__item">
                  {index > 0 ? <span className="breadcrumb__divider">/</span> : null}
                  {item}
                </span>
              ))}
            </div>
            <h1>{currentViewMeta.title}</h1>
            <p className="topbar__description">{currentViewMeta.description}</p>
          </div>

          <div className="topbar__cluster">
            <div className="context-pills" aria-label="운영 컨텍스트">
              <span className="context-pill">{source === 'api' ? '백엔드 연동' : '로컬 시드'}</span>
              <span className="context-pill">{portfolio.overview.projectCount}개 프로젝트</span>
              <span className="context-pill">{portfolio.overview.conditionalCount}개 승인 대기</span>
            </div>
            <div className="role-switcher" role="tablist" aria-label="역할 컨텍스트">
              {(Object.keys(roleInsights) as Role[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  className={`role-switcher__item ${
                    selectedRole === role ? 'role-switcher__item--active' : ''
                  }`}
                  aria-pressed={selectedRole === role}
                  onClick={() => setSelectedRole(role)}
                >
                  {role}
                </button>
              ))}
            </div>
            {selectedProject ? (
              <div className="project-context">
                <span>Selected project</span>
                <strong>{selectedProject.name}</strong>
                <small>
                  {selectedProject.code} · {selectedProject.headquarter} · {selectedProject.status}
                </small>
              </div>
            ) : null}
          </div>
        </header>

        <main id="main-content" className="content content--task-first">
          {activeView === 'dashboard' ? (
            <>
              <section className="hero-strip hero-strip--workspace" aria-label="현재 방향">
                <div className="hero-strip__content">
                  <p className="hero-strip__eyebrow">Default landing</p>
                  <h2>포트폴리오에서 시작하고, 프로젝트 워크스페이스로 내려갑니다.</h2>
                  <p>
                    현재 셸은 플랫폼, 포트폴리오, 프로젝트 워크스페이스를 같은 캔버스에
                    섞지 않습니다. 먼저 상태를 파악하고, 필요한 프로젝트만 선택해
                    관리회계 또는 재무평가 워크스페이스로 진입합니다.
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
                <Panel
                  title="Priority queue"
                  subtitle="다음 검토 대상을 빠르게 고르고 워크스페이스로 진입합니다."
                >
                  <div className="queue-list">
                    {priorityProjects.map((project) => (
                      <article key={project.code} className="queue-card">
                        <div>
                          <span className="queue-card__eyebrow">
                            {project.rank}위 · {project.headquarter}
                          </span>
                          <strong>{project.name}</strong>
                          <p>
                            {project.assetCategory} · {project.status} · NPV{' '}
                            {formatKrwCompact(project.npvKrw)}
                          </p>
                        </div>
                        <div className="queue-card__actions">
                          <button type="button" onClick={() => openWorkspace('accounting', project.code)}>
                            관리회계 열기
                          </button>
                          <button type="button" onClick={() => openWorkspace('valuation', project.code)}>
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
          ) : null}

          {activeView === 'portfolio' ? (
            <section className="portfolio-grid">
              <Panel
                title="Portfolio overview"
                subtitle="본부 수준 상태를 먼저 읽고, 이후 프로젝트 워크스페이스로 이동합니다."
              >
                <div className="headquarter-grid">
                  {portfolio.headquarters.map((headquarter) => (
                    <article key={headquarter.code} className="headquarter-card">
                      <div className="headquarter-card__header">
                        <div>
                          <strong>{headquarter.name}</strong>
                          <span>{headquarter.projectCount}개 프로젝트</span>
                        </div>
                        <span className={`status-pill status-pill--${riskToneMap[headquarter.risk]}`}>
                          {headquarter.risk}
                        </span>
                      </div>
                      <ProgressBar
                        label="투자 비중"
                        value={Math.round(headquarter.totalInvestmentKrw / 10000)}
                        max={Math.round(maxHeadquarterInvestment / 10000)}
                        tone={headquarter.risk === '높음' ? 'rose' : headquarter.risk === '중간' ? 'amber' : 'teal'}
                      />
                      <div className="headquarter-card__metrics">
                        <div>
                          <span>총 투자액</span>
                          <strong>{formatKrwCompact(headquarter.totalInvestmentKrw)}</strong>
                        </div>
                        <div>
                          <span>평균 NPV</span>
                          <strong>{formatKrwCompact(headquarter.averageNpvKrw)}</strong>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </Panel>

              <Panel
                title="Project workspace entry"
                subtitle="프로젝트 상세를 항상 펼치지 않고, 필요한 워크스페이스로 선택 진입합니다."
              >
                <div className="table-shell">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>순위</th>
                        <th>프로젝트</th>
                        <th>본부</th>
                        <th>상태</th>
                        <th>NPV</th>
                        <th>워크스페이스</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolio.projects.map((project) => (
                        <tr key={project.code} className={project.code === selectedProjectCode ? 'data-table__row--selected' : ''}>
                          <td>{project.rank}</td>
                          <td>
                            <strong>{project.name}</strong>
                            <div className="table-subtle">{project.code}</div>
                          </td>
                          <td>{project.headquarter}</td>
                          <td>
                            <span className={`status-pill status-pill--${statusTone(project.status)}`}>
                              {project.status}
                            </span>
                          </td>
                          <td>{formatKrwCompact(project.npvKrw)}</td>
                          <td>
                            <div className="table-actions">
                              <button type="button" onClick={() => openWorkspace('accounting', project.code)}>
                                관리회계
                              </button>
                              <button type="button" onClick={() => openWorkspace('valuation', project.code)}>
                                재무평가
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </section>
          ) : null}

          {activeView === 'accounting' || activeView === 'valuation' ? (
            <section className="workspace-stage">
              <div className="workspace-stage__summary">
                <div>
                  <p className="workspace-stage__eyebrow">
                    {activeView === 'accounting' ? 'Management Accounting' : 'Financial Evaluation'}
                  </p>
                  <h2>{selectedProject?.name ?? '선택된 프로젝트 없음'}</h2>
                  <p>
                    {selectedProject?.headquarter} · {selectedDetail?.assetCategory} · {selectedDetail?.headline}
                  </p>
                </div>
                <div className="workspace-stage__meta">
                  {selectedWorkspaceKpis.map((item) => (
                    <InfoTile key={item.label} label={item.label} value={item.value} />
                  ))}
                </div>
              </div>

              <div className="local-nav" aria-label="프로젝트 수준 로컬 네비게이션">
                {workspaceSections.map((section) => (
                  <span key={section} className="local-nav__item">
                    {section}
                  </span>
                ))}
              </div>

              <div className="workspace-columns">
                <Panel
                  title={activeView === 'accounting' ? 'Allocation workspace' : 'Valuation workspace'}
                  subtitle="프로젝트 상세 cockpit 대신, 워크스페이스 진입과 읽기 순서에 집중한 셸 레벨 구조입니다."
                >
                  {activeView === 'accounting' && selectedDetail ? (
                    <div className="workspace-card-grid">
                      <InfoTile label="배분원가" value={formatKrwCompact(selectedDetail.allocation.allocatedCostKrw)} />
                      <InfoTile label="표준원가" value={formatKrwCompact(selectedDetail.allocation.standardCostKrw)} />
                      <InfoTile label="효율 차이" value={formatKrwCompact(selectedDetail.allocation.efficiencyGapKrw)} />
                      <InfoTile label="성과 차이" value={formatKrwCompact(selectedDetail.allocation.performanceGapKrw)} />
                    </div>
                  ) : null}
                  {activeView === 'valuation' && selectedDetail ? (
                    <div className="workspace-card-grid">
                      <InfoTile label="공정가치" value={formatKrwCompact(selectedDetail.valuation.fairValueKrw)} />
                      <InfoTile label="VaR 95%" value={formatKrwCompact(selectedDetail.valuation.var95Krw)} />
                      <InfoTile label="CVaR 95%" value={formatKrwCompact(selectedDetail.valuation.cvar95Krw)} />
                      <InfoTile label="신용등급" value={selectedDetail.valuation.creditGrade} />
                    </div>
                  ) : null}
                </Panel>

                <Panel
                  title="Project context"
                  subtitle="같은 프로젝트에서 관리회계와 재무평가를 오갈 때 잃지 말아야 하는 공통 맥락입니다."
                >
                  <div className="insight-card">
                    <p className="insight-card__headline">{selectedInsight.headline}</p>
                    <p className="insight-card__summary">{selectedInsight.summary}</p>
                    <dl className="insight-grid">
                      <div>
                        <dt>검토 초점</dt>
                        <dd>{selectedInsight.decisionFocus}</dd>
                      </div>
                      <div>
                        <dt>리스크</dt>
                        <dd>{selectedInsight.riskWatch}</dd>
                      </div>
                      <div>
                        <dt>다음 행동</dt>
                        <dd>{selectedInsight.nextAction}</dd>
                      </div>
                      <div>
                        <dt>워크플로우 단계</dt>
                        <dd>{selectedDetail?.workflow.currentStage}</dd>
                      </div>
                    </dl>
                  </div>
                </Panel>
              </div>
            </section>
          ) : null}

          {activeView === 'reviews' ? (
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
          ) : null}

          {activeView === 'settings' ? (
            <section className="settings-grid">
              <Panel title="Role context" subtitle="역할 전환은 탐색 계층과 분리된 설정/선호 영역에 둡니다.">
                <div className="preference-stack">
                  <InfoTile label="현재 역할" value={selectedRole} />
                  <InfoTile label="기본 진입" value="Portfolio overview" />
                  <InfoTile label="선호 워크스페이스" value="Management Accounting / Financial Evaluation" />
                </div>
              </Panel>
              <Panel title="Role guidance" subtitle="현재 역할이 주로 봐야 할 신호를 설정 영역에서 요약합니다.">
                <div className="insight-card">
                  <p className="insight-card__headline">{selectedInsight.headline}</p>
                  <p className="insight-card__summary">{selectedInsight.summary}</p>
                </div>
              </Panel>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function statusTone(status: ProjectStatus) {
  if (status === '승인') {
    return 'low';
  }

  if (status === '조건부 진행') {
    return 'mid';
  }

  if (status === '검토중') {
    return 'active';
  }

  return 'high';
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
