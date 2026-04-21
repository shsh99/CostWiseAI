import { useEffect, useMemo, useState } from 'react';
import {
  buildDecisionSignals,
  buildProjectDetail,
  defaultPortfolioSummary,
  detailTabs,
  headquarterPalette,
  loadPortfolioSummary,
  navigationItems,
  roleInsights,
  type PortfolioSummary,
  type ProjectStatus,
  type Role
} from './app/portfolioData';
import {
  formatDateTime,
  formatKrwCompact,
  formatPercent,
  formatYears
} from './app/format';
import { MetricCard } from './components/MetricCard';
import { Panel } from './components/Panel';
import { ProgressBar } from './components/ProgressBar';

type NavigationKey = (typeof navigationItems)[number]['key'];
type DetailTabKey = (typeof detailTabs)[number]['key'];

const riskToneMap = {
  낮음: 'low',
  중간: 'mid',
  높음: 'high'
} as const;

export function App() {
  const [selectedRole, setSelectedRole] = useState<Role>('임원');
  const [activeView, setActiveView] = useState<NavigationKey>('dashboard');
  const [activeTab, setActiveTab] = useState<DetailTabKey>('allocation');
  const [selectedHeadquarter, setSelectedHeadquarter] = useState('전체 본부');
  const [portfolio, setPortfolio] = useState<PortfolioSummary>(
    defaultPortfolioSummary
  );
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

  const filteredProjects = useMemo(() => {
    if (selectedHeadquarter === '전체 본부') {
      return portfolio.projects;
    }

    return portfolio.projects.filter(
      (project) => project.headquarter === selectedHeadquarter
    );
  }, [portfolio.projects, selectedHeadquarter]);

  useEffect(() => {
    if (
      !filteredProjects.some((project) => project.code === selectedProjectCode)
    ) {
      setSelectedProjectCode(
        filteredProjects[0]?.code ?? portfolio.projects[0]?.code ?? ''
      );
    }
  }, [filteredProjects, portfolio.projects, selectedProjectCode]);

  const selectedProject =
    portfolio.projects.find(
      (project) => project.code === selectedProjectCode
    ) ?? portfolio.projects[0];
  const selectedDetail = selectedProject
    ? buildProjectDetail(selectedProject.code)
    : null;
  const selectedInsight = roleInsights[selectedRole];
  const latestAudit = portfolio.auditEvents.at(-1);
  const decisionSignals = buildDecisionSignals(portfolio);
  const maxHeadquarterInvestment = useMemo(
    () =>
      Math.max(
        ...portfolio.headquarters.map(
          (headquarter) => headquarter.totalInvestmentKrw
        )
      ),
    [portfolio.headquarters]
  );
  const selectedRank =
    portfolio.projects.find((project) => project.code === selectedProjectCode)
      ?.rank ?? '-';
  const selectedTabLabel =
    detailTabs.find((tab) => tab.key === activeTab)?.label ??
    detailTabs[0].label;
  const maxScenarioNpv = selectedDetail
    ? Math.max(
        ...selectedDetail.scenarioReturns.map((item) => Math.abs(item.npvKrw))
      )
    : 1;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        본문으로 건너뛰기
      </a>

      <aside className="sidebar">
        <div className="brand">
          <div className="brand__mark">CW</div>
          <div>
            <strong>CostWiseAI</strong>
            <p>Multi-Project Portfolio Management Platform</p>
          </div>
        </div>

        <nav className="nav" aria-label="메인 탐색">
          <p className="nav__label">Navigation</p>
          {navigationItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`nav__item ${activeView === item.key ? 'nav__item--active' : ''}`}
              onClick={() => setActiveView(item.key)}
            >
              <span className="nav__icon" aria-hidden="true">
                {item.key === 'dashboard'
                  ? '▦'
                  : item.key === 'projects'
                    ? '▤'
                    : '◷'}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <section className="sidebar__section" aria-label="본부 필터">
          <p className="nav__label">본부별 필터</p>
          <button
            type="button"
            className={`hq-filter ${selectedHeadquarter === '전체 본부' ? 'hq-filter--active' : ''}`}
            onClick={() => setSelectedHeadquarter('전체 본부')}
          >
            <span className="hq-filter__dot hq-chip--neutral" />
            <span>전체 본부</span>
            <small>{portfolio.overview.projectCount}</small>
          </button>
          {portfolio.headquarters.map((headquarter) => (
            <button
              key={headquarter.code}
              type="button"
              className={`hq-filter ${selectedHeadquarter === headquarter.name ? 'hq-filter--active' : ''}`}
              onClick={() => setSelectedHeadquarter(headquarter.name)}
            >
              <span
                className={`hq-filter__dot ${headquarterPalette[headquarter.name]}`}
              />
              <span>{headquarter.name.replace('본부', '')}</span>
              <small>{headquarter.projectCount}</small>
            </button>
          ))}
        </section>

        <section className="sidebar__summary" aria-label="운영 요약">
          <div className="sidebar__summary-card">
            <span>승인 완료</span>
            <strong>{portfolio.overview.approvedCount}건</strong>
            <small>현재 포트폴리오 승인된 프로젝트</small>
          </div>
          <div className="sidebar__summary-card">
            <span>조건부 진행</span>
            <strong>{portfolio.overview.conditionalCount}건</strong>
            <small>추가 검토가 필요한 안건</small>
          </div>
          <div className="sidebar__summary-card">
            <span>예상 수익</span>
            <strong>
              {formatKrwCompact(portfolio.overview.totalExpectedRevenueKrw)}
            </strong>
            <small>전사 포트폴리오 기준 기대 수익</small>
          </div>
        </section>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div>
            <p className="topbar__eyebrow">Portfolio Control Room</p>
            <h1>전사 포트폴리오 및 상세 대시보드</h1>
          </div>
          <div className="topbar__meta">
            <div className="topbar__date">
              {source === 'api' ? '백엔드 연동' : '로컬 시드'}
            </div>
            <div className="topbar__user">박재영 (CFO)</div>
            <div className="topbar__date">2026.04.20</div>
          </div>
        </header>

        <main id="main-content" className="content">
          <section className="hero-strip" aria-label="포트폴리오 현재 상태">
            <div className="hero-strip__content">
              <a className="hero-strip__back" href="#portfolio-overview">
                포트폴리오 개요로 돌아가기
              </a>
              <p className="hero-strip__eyebrow">Portfolio Control Room</p>
              <h2>5개 본부 · 20개 프로젝트 포트폴리오</h2>
              <p>
                {selectedProject
                  ? `${selectedProject.name} · ${selectedProject.headquarter} · ${selectedDetail?.manager} · 착수 ${selectedDetail?.startDate}`
                  : '5개 본부와 20개 프로젝트를 함께 모니터링하는 전사 포트폴리오 화면'}
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
              <div className="hero-strip__status-stack">
                <span
                  className={`status-pill status-pill--${
                    selectedProject
                      ? riskToneMap[selectedProject.risk]
                      : 'active'
                  }`}
                >
                  {selectedProject ? selectedProject.status : portfolio.status}
                </span>
                <span className="risk-badge">
                  {selectedProject
                    ? `${selectedProject.risk.toUpperCase?.() ?? selectedProject.risk} Risk`
                    : `${portfolio.risk} 리스크`}
                </span>
              </div>
              <div className="hero-strip__note">
                <span>현재 포커스</span>
                <strong>{selectedTabLabel}</strong>
                <small>{selectedInsight.decisionFocus}</small>
              </div>
            </div>
          </section>

          <section className="metrics metrics--hero" aria-label="핵심 KPI">
            <MetricCard
              label="총 투자액"
              value={formatKrwCompact(portfolio.overview.totalInvestmentKrw)}
              detail="20개 프로젝트 누적 투자 규모"
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
              label="회수기간"
              value={formatYears(portfolio.overview.averagePaybackYears)}
              detail="전사 포트폴리오 평균"
              tone="primary"
            />
            <MetricCard
              label="배분원가"
              value={formatKrwCompact(
                selectedDetail?.allocation.allocatedCostKrw ?? 0
              )}
              detail="선택 프로젝트 기준 ABC 배부"
              tone="warning"
            />
            <MetricCard
              label="VaR(95%)"
              value={formatKrwCompact(selectedDetail?.valuation.var95Krw ?? 0)}
              detail="선택 프로젝트 기준 리스크 한계"
              tone="warning"
            />
          </section>

          <section className="role-tabs" aria-label="역할별 인사이트">
            {Object.keys(roleInsights).map((role) => {
              const typedRole = role as Role;
              return (
                <button
                  key={typedRole}
                  type="button"
                  className={`role-tab ${typedRole === selectedRole ? 'role-tab--active' : ''}`}
                  aria-pressed={typedRole === selectedRole}
                  onClick={() => setSelectedRole(typedRole)}
                >
                  <span>{typedRole}</span>
                  <small>{roleInsights[typedRole].headline}</small>
                </button>
              );
            })}
          </section>

          <section className="main-grid">
            <div className="main-grid__primary">
              <Panel
                id="portfolio-overview"
                title="포트폴리오 개요"
                subtitle="5개 본부와 20개 프로젝트를 포트폴리오 우선순위 관점에서 정리합니다."
              >
                <div className="headquarter-grid">
                  {portfolio.headquarters.map((headquarter) => (
                    <article
                      key={headquarter.code}
                      className="headquarter-card"
                    >
                      <div className="headquarter-card__header">
                        <div>
                          <div className="headquarter-card__title">
                            <span
                              className={`hq-filter__dot ${headquarterPalette[headquarter.name]}`}
                            />
                            <strong>{headquarter.name}</strong>
                          </div>
                          <span>{headquarter.projectCount}개 프로젝트</span>
                        </div>
                        <span
                          className={`status-pill status-pill--${riskToneMap[headquarter.risk]}`}
                        >
                          {headquarter.risk}
                        </span>
                      </div>
                      <div className="headquarter-card__metrics">
                        <div>
                          <span>총 투자액</span>
                          <strong>
                            {formatKrwCompact(headquarter.totalInvestmentKrw)}
                          </strong>
                        </div>
                        <div>
                          <span>평균 NPV</span>
                          <strong>
                            {formatKrwCompact(headquarter.averageNpvKrw)}
                          </strong>
                        </div>
                      </div>
                      <ProgressBar
                        label="투자 비중"
                        value={Math.round(
                          headquarter.totalInvestmentKrw / 10000
                        )}
                        max={Math.round(maxHeadquarterInvestment / 10000)}
                        tone={
                          headquarter.risk === '높음'
                            ? 'rose'
                            : headquarter.risk === '중간'
                              ? 'amber'
                              : 'teal'
                        }
                      />
                      <p className="headquarter-card__footer">
                        우선 추진 프로젝트 · {headquarter.priorityProject}
                      </p>
                    </article>
                  ))}
                </div>
              </Panel>

              <Panel
                title={
                  activeView === 'audit'
                    ? '감사 로그'
                    : activeView === 'projects'
                      ? '프로젝트 목록'
                      : '프로젝트 랭킹'
                }
                subtitle={
                  activeView === 'audit'
                    ? '승인, 접근, 원가 배부 변경 이력을 시간순으로 추적합니다.'
                    : '선택한 본부 필터를 기준으로 프로젝트 우선순위와 리스크를 확인합니다.'
                }
              >
                {activeView === 'audit' ? (
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
                ) : (
                  <div className="table-shell">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>순위</th>
                          <th>프로젝트</th>
                          <th>본부</th>
                          <th>자산군</th>
                          <th>상태</th>
                          <th>NPV</th>
                          <th>IRR</th>
                          <th>회수기간</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProjects.map((project) => (
                          <tr
                            key={project.code}
                            className={
                              project.code === selectedProjectCode
                                ? 'data-table__row--selected'
                                : ''
                            }
                            onClick={() => setSelectedProjectCode(project.code)}
                            role="button"
                            tabIndex={0}
                            aria-pressed={project.code === selectedProjectCode}
                            aria-label={`${project.name} 상세 보기`}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                setSelectedProjectCode(project.code);
                              }
                            }}
                          >
                            <td>{project.rank}</td>
                            <td>
                              <strong>{project.name}</strong>
                              <div className="table-subtle">{project.code}</div>
                            </td>
                            <td>{project.headquarter}</td>
                            <td>{project.assetCategory}</td>
                            <td>
                              <span
                                className={`status-pill status-pill--${statusTone(project.status)}`}
                              >
                                {project.status}
                              </span>
                            </td>
                            <td>{formatKrwCompact(project.npvKrw)}</td>
                            <td>{formatPercent(project.irr)}</td>
                            <td>{formatYears(project.paybackYears)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>
            </div>

            <aside className="main-grid__detail">
              <Panel
                title={selectedProject ? selectedProject.name : '프로젝트 상세'}
                subtitle={
                  selectedDetail
                    ? `${selectedProject?.headquarter} · ${selectedDetail.assetCategory} · ${selectedDetail.headline}`
                    : '프로젝트를 선택하면 상세 정보를 표시합니다.'
                }
              >
                {selectedProject && selectedDetail ? (
                  <div className="detail-shell">
                    <section
                      className="project-spotlight"
                      aria-label="선택 프로젝트 요약"
                    >
                      <div className="project-spotlight__header">
                        <div>
                          <span className="project-spotlight__code">
                            {selectedProject.code}
                          </span>
                          <strong>{selectedProject.name}</strong>
                        </div>
                        <span
                          className={`status-pill status-pill--${riskToneMap[selectedProject.risk]}`}
                        >
                          {selectedProject.risk}
                        </span>
                      </div>
                      <div className="project-spotlight__band">
                        <InfoTile
                          label="우선순위"
                          value={`${selectedRank}위`}
                        />
                        <InfoTile
                          label="자산군"
                          value={selectedDetail.assetCategory}
                        />
                        <InfoTile
                          label="책임 PM"
                          value={selectedDetail.manager}
                        />
                        <InfoTile
                          label="현재 단계"
                          value={selectedDetail.workflow.currentStage}
                        />
                      </div>
                    </section>

                    <div
                      className="detail-tabs"
                      role="tablist"
                      aria-label="상세 탭"
                    >
                      {detailTabs.map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          className={`detail-tab ${activeTab === tab.key ? 'detail-tab--active' : ''}`}
                          onClick={() => setActiveTab(tab.key)}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {activeTab === 'allocation' ? (
                      <div className="detail-stack">
                        <div className="detail-kpis">
                          <InfoTile
                            label="인력 원가"
                            value={formatKrwCompact(
                              selectedDetail.allocation.personnelCostKrw
                            )}
                          />
                          <InfoTile
                            label="프로젝트 원가"
                            value={formatKrwCompact(
                              selectedDetail.allocation.projectCostKrw
                            )}
                          />
                          <InfoTile
                            label="본부 공통원가"
                            value={formatKrwCompact(
                              selectedDetail.allocation.headquarterCostKrw
                            )}
                          />
                          <InfoTile
                            label="전사 공통원가"
                            value={formatKrwCompact(
                              selectedDetail.allocation.enterpriseCostKrw
                            )}
                          />
                        </div>
                        <div className="callout callout--accent">
                          <strong>내부대체가액</strong>
                          <span>
                            {formatKrwCompact(
                              selectedDetail.allocation.internalTransferPriceKrw
                            )}
                          </span>
                        </div>
                        <div className="detail-grid">
                          <InfoTile
                            label="표준원가"
                            value={formatKrwCompact(
                              selectedDetail.allocation.standardCostKrw
                            )}
                          />
                          <InfoTile
                            label="배분원가"
                            value={formatKrwCompact(
                              selectedDetail.allocation.allocatedCostKrw
                            )}
                          />
                          <InfoTile
                            label="원가 효율 차이"
                            value={formatKrwCompact(
                              selectedDetail.allocation.efficiencyGapKrw
                            )}
                          />
                          <InfoTile
                            label="성과 요인 차이"
                            value={formatKrwCompact(
                              selectedDetail.allocation.performanceGapKrw
                            )}
                          />
                        </div>
                      </div>
                    ) : null}

                    {activeTab === 'valuation' ? (
                      <div className="detail-stack">
                        <div className="detail-kpis">
                          <InfoTile
                            label="공정가치"
                            value={formatKrwCompact(
                              selectedDetail.valuation.fairValueKrw
                            )}
                          />
                          <InfoTile
                            label="NPV"
                            value={formatKrwCompact(selectedProject.npvKrw)}
                          />
                          <InfoTile
                            label="IRR"
                            value={formatPercent(selectedProject.irr)}
                          />
                          <InfoTile
                            label="회수기간"
                            value={formatYears(selectedProject.paybackYears)}
                          />
                        </div>
                        <div className="scenario-panel">
                          {selectedDetail.scenarioReturns.map((scenario) => (
                            <div
                              key={scenario.label}
                              className="scenario-panel__item"
                            >
                              <span>{scenario.label}</span>
                              <strong>
                                {formatKrwCompact(scenario.npvKrw)}
                              </strong>
                              <small>
                                확률 {formatPercent(scenario.probability)}
                              </small>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {activeTab === 'risk' ? (
                      <div className="detail-stack">
                        <div className="risk-banner">
                          <strong>
                            {selectedProject.risk === '높음'
                              ? 'CRITICAL RISK'
                              : selectedProject.risk === '중간'
                                ? 'MEDIUM RISK'
                                : 'CONTROLLED RISK'}
                          </strong>
                        </div>
                        <div className="detail-grid">
                          <InfoTile
                            label="VaR (95%)"
                            value={formatKrwCompact(
                              selectedDetail.valuation.var95Krw
                            )}
                          />
                          <InfoTile
                            label="VaR (99%)"
                            value={formatKrwCompact(
                              selectedDetail.valuation.var99Krw
                            )}
                          />
                          <InfoTile
                            label="CVaR"
                            value={formatKrwCompact(
                              selectedDetail.valuation.cvar95Krw
                            )}
                          />
                          <InfoTile
                            label="신용등급"
                            value={selectedDetail.valuation.creditGrade}
                          />
                          <InfoTile
                            label="Duration"
                            value={`${selectedDetail.valuation.duration}년`}
                          />
                          <InfoTile
                            label="Convexity"
                            value={selectedDetail.valuation.convexity.toFixed(
                              2
                            )}
                          />
                        </div>
                        <div className="distribution-card">
                          <div className="distribution-card__header">
                            <strong>NPV 시나리오 분포</strong>
                            <span>낙관/기준/비관 기준 확률 가중</span>
                          </div>
                          <div className="distribution-chart">
                            {selectedDetail.scenarioReturns.map((scenario) => (
                              <div
                                key={scenario.label}
                                className="distribution-chart__item"
                              >
                                <div
                                  className="distribution-chart__bar"
                                  style={{
                                    height: `${Math.max(
                                      18,
                                      Math.round(
                                        (Math.abs(scenario.npvKrw) /
                                          maxScenarioNpv) *
                                          180
                                      )
                                    )}px`
                                  }}
                                />
                                <strong>{scenario.label}</strong>
                                <span>{formatKrwCompact(scenario.npvKrw)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="risk-method">
                          <strong>신용평가 리스크 점수</strong>
                          <span>
                            {selectedDetail.valuation.creditRiskScore} / 100
                          </span>
                          <p>
                            기준 시나리오 NPV, 변동성, 자산군별 민감도, 상태
                            리스크를 결합한 내부 평가 점수입니다.
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {activeTab === 'workflow' ? (
                      <div className="detail-stack">
                        <div className="workflow-steps">
                          {['기획', '검토', '승인', '보류'].map((stage) => (
                            <div
                              key={stage}
                              className={`workflow-step ${
                                selectedDetail.workflow.currentStage === stage
                                  ? 'workflow-step--active'
                                  : ''
                              }`}
                            >
                              {stage}
                            </div>
                          ))}
                        </div>
                        <div className="detail-grid">
                          <InfoTile
                            label="프로젝트 오너"
                            value={selectedDetail.workflow.owner}
                          />
                          <InfoTile
                            label="재무 검토"
                            value={selectedDetail.workflow.financeReviewer}
                          />
                        </div>
                        <div className="workflow-note">
                          <strong>임원 코멘트</strong>
                          <p>{selectedDetail.workflow.executiveComment}</p>
                          <small>
                            다음 단계 · {selectedDetail.workflow.nextStep}
                          </small>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </Panel>

              <Panel
                title={`역할별 검토 패널 · ${selectedRole}`}
                subtitle="같은 포트폴리오를 다른 책임 관점에서 봅니다."
              >
                <div className="insight-card">
                  <p className="insight-card__headline">
                    {selectedInsight.headline}
                  </p>
                  <p className="insight-card__summary">
                    {selectedInsight.summary}
                  </p>
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
                      <dt>최종 이벤트</dt>
                      <dd>{latestAudit?.action ?? '이력 없음'}</dd>
                    </div>
                  </dl>
                </div>
              </Panel>

              <Panel
                title="가정값 및 감사"
                subtitle="포트폴리오 가정값과 최근 변경 이력을 함께 유지합니다."
              >
                <div className="assumption-list">
                  {portfolio.assumptions.map((item) => (
                    <div key={item.label} className="assumption-list__item">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
                <div className="audit-inline">
                  {portfolio.auditEvents.slice(-2).map((item) => (
                    <div
                      key={`${item.actor}-${item.at}`}
                      className="audit-inline__item"
                    >
                      <strong>{item.actor}</strong>
                      <span>{item.action}</span>
                      <small>{formatDateTime(item.at)}</small>
                    </div>
                  ))}
                </div>
              </Panel>
            </aside>
          </section>
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
