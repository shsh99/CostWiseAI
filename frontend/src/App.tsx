import { useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent } from 'react';
import {
  buildDecisionSignals,
  buildProjectDetail,
  detailTabs,
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
type ExplorerSortKey = 'priority' | 'npv' | 'irr' | 'payback' | 'risk';
type ExplorerQuickFilterKey =
  | 'all'
  | 'needs-review'
  | 'accounting-focus'
  | 'valuation-focus'
  | 'shortlist';
type WorkspaceTabKey = (typeof detailTabs)[number]['key'];

const defaultExplorerSort: ExplorerSortKey = 'priority';
const defaultExplorerQuickFilter: ExplorerQuickFilterKey = 'all';

const explorerSortOptions: Array<{ key: ExplorerSortKey; label: string }> = [
  { key: 'priority', label: '우선순위 순' },
  { key: 'npv', label: 'NPV 높은순' },
  { key: 'irr', label: 'IRR 높은순' },
  { key: 'payback', label: '회수기간 짧은순' },
  { key: 'risk', label: '리스크 높은순' }
];

const explorerQuickFilterOptions: Array<{
  key: ExplorerQuickFilterKey;
  label: string;
  helper: string;
}> = [
  { key: 'all', label: '전체', helper: '전체 프로젝트' },
  { key: 'needs-review', label: '즉시 검토', helper: '승인 전 검토 대상' },
  { key: 'accounting-focus', label: '관리회계 중심', helper: '원가·배분 우선 후보' },
  { key: 'valuation-focus', label: '재무평가 중심', helper: '사업성 검토 우선 후보' },
  { key: 'shortlist', label: '고우선순위', helper: '숏리스트 후보' }
];

const riskOrder = {
  높음: 3,
  중간: 2,
  낮음: 1
} as const;

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
  const initialExplorerState = useMemo(() => parseExplorerState(window.location.search), []);
  const [selectedRole, setSelectedRole] = useState<Role>('임원');
  const [activeView, setActiveView] = useState<NavigationKey>(initialExplorerState.view);
  const [portfolio, setPortfolio] = useState<PortfolioSummary>(defaultPortfolioSummary);
  const [source, setSource] = useState<'api' | 'local'>('local');
  const [searchTerm, setSearchTerm] = useState(initialExplorerState.search);
  const [explorerSort, setExplorerSort] = useState<ExplorerSortKey>(initialExplorerState.sort);
  const [explorerQuickFilter, setExplorerQuickFilter] = useState<ExplorerQuickFilterKey>(
    initialExplorerState.quickFilter
  );
  const [headquarterFilter, setHeadquarterFilter] = useState<string>(initialExplorerState.headquarter);
  const [selectedProjectCode, setSelectedProjectCode] = useState(initialExplorerState.projectCode);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<WorkspaceTabKey>('allocation');

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

  const hasSelectedProject = useMemo(
    () => portfolio.projects.some((project) => project.code === selectedProjectCode),
    [portfolio.projects, selectedProjectCode]
  );
  const selectedProject = hasSelectedProject
    ? portfolio.projects.find((project) => project.code === selectedProjectCode) ?? null
    : null;
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
        { label: '회수기간', value: formatYears(selectedProject.paybackYears) }
      ]
    : [];
  const cockpitMetaItems = [
    { label: '우선순위', value: selectedProject ? `${selectedProject.rank}위` : '-' },
    { label: 'Owner', value: selectedDetail?.manager ?? '-' },
    { label: 'Current Stage', value: selectedDetail?.workflow.currentStage ?? '-' },
    { label: '리스크 상태', value: selectedProject?.risk ?? '-' }
  ];
  const cockpitNextAction =
    activeWorkspaceTab === 'allocation'
      ? '원가담당자와 재무검토자가 배부 기준 변경안을 합의 후 재배분을 실행합니다.'
      : activeWorkspaceTab === 'valuation'
        ? '기대값 기준 승인 조건을 확정하고 비관 시나리오 한계를 검토합니다.'
        : activeWorkspaceTab === 'risk'
          ? '비관 시나리오 확률을 재추정하고 손실 한계 조건을 재설정합니다.'
          : selectedInsight.nextAction;
  const valuationExpectedCase =
    selectedDetail?.scenarioReturns.find((scenario) => scenario.label === '기준') ?? null;
  const riskDownsideScenario =
    selectedDetail?.scenarioReturns.find((scenario) => scenario.label === '비관') ?? null;
  const riskGuardrailGap =
    selectedDetail && riskDownsideScenario
      ? Math.abs(selectedDetail.valuation.var95Krw - riskDownsideScenario.npvKrw)
      : 0;
  const valuationGap =
    Math.abs((valuationExpectedCase?.npvKrw ?? 0) - (riskDownsideScenario?.npvKrw ?? 0));
  const allocationDecisionBars = selectedDetail
    ? buildDecisionBars([
        {
          key: 'project',
          label: '프로젝트 직접원가',
          value: selectedDetail.allocation.projectCostKrw,
          formattedValue: formatKrwCompact(selectedDetail.allocation.projectCostKrw),
          cue: 'solid',
          annotation: '투입 원가의 기준점'
        },
        {
          key: 'personnel',
          label: '인력원가',
          value: selectedDetail.allocation.personnelCostKrw,
          formattedValue: formatKrwCompact(selectedDetail.allocation.personnelCostKrw),
          cue: 'stripe',
          annotation: '배부 기준 재조정 우선 후보'
        },
        {
          key: 'hq',
          label: '본부 공통원가',
          value: selectedDetail.allocation.headquarterCostKrw,
          formattedValue: formatKrwCompact(selectedDetail.allocation.headquarterCostKrw),
          cue: 'dot',
          annotation: '공통비 배분 근거 확인 필요'
        }
      ])
    : [];
  const valuationDecisionBars = selectedDetail
    ? buildDecisionBars(
        selectedDetail.scenarioReturns.map((scenario) => ({
          key: scenario.label,
          label: `${scenario.label} 시나리오`,
          value: scenario.npvKrw,
          formattedValue: formatKrwCompact(scenario.npvKrw),
          cue: scenario.label === '기준' ? 'solid' : scenario.label === '낙관' ? 'stripe' : 'dot',
          annotation: `발생 확률 ${formatPercent(scenario.probability)}`
        }))
      )
    : [];
  const riskDecisionBars = selectedDetail
    ? buildDecisionBars([
        {
          key: 'var95',
          label: 'VaR 95%',
          value: selectedDetail.valuation.var95Krw,
          formattedValue: formatKrwCompact(selectedDetail.valuation.var95Krw),
          cue: 'solid',
          annotation: '95% 신뢰수준 손실 하한'
        },
        {
          key: 'cvar95',
          label: 'CVaR 95%',
          value: selectedDetail.valuation.cvar95Krw,
          formattedValue: formatKrwCompact(selectedDetail.valuation.cvar95Krw),
          cue: 'stripe',
          annotation: '극단 구간 평균 손실'
        },
        {
          key: 'downside',
          label: '비관 시나리오 NPV',
          value: riskDownsideScenario?.npvKrw ?? 0,
          formattedValue: formatKrwCompact(riskDownsideScenario?.npvKrw ?? 0),
          cue: 'dot',
          annotation: '시나리오 하방 기준선'
        }
      ])
    : [];
  const headquarterOptions = useMemo(
    () => ['all', ...portfolio.headquarters.map((headquarter) => headquarter.name)],
    [portfolio.headquarters]
  );
  const filteredProjects = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return portfolio.projects
      .filter((project) => {
        if (headquarterFilter !== 'all' && project.headquarter !== headquarterFilter) {
          return false;
        }

        if (normalizedSearchTerm) {
          const haystack = `${project.name} ${project.code} ${project.headquarter}`.toLowerCase();
          if (!haystack.includes(normalizedSearchTerm)) {
            return false;
          }
        }

        if (explorerQuickFilter === 'all') {
          return true;
        }

        if (explorerQuickFilter === 'needs-review') {
          return project.status !== '승인';
        }

        if (explorerQuickFilter === 'accounting-focus') {
          return project.assetCategory === '프로젝트' || project.status === '검토중';
        }

        if (explorerQuickFilter === 'valuation-focus') {
          return project.npvKrw > 0 && project.irr >= 0.14;
        }

        return project.rank <= 5 || (project.status === '승인' && project.risk !== '높음');
      })
      .sort((left, right) => {
        if (explorerSort === 'npv') {
          return right.npvKrw - left.npvKrw;
        }

        if (explorerSort === 'irr') {
          return right.irr - left.irr;
        }

        if (explorerSort === 'payback') {
          return left.paybackYears - right.paybackYears;
        }

        if (explorerSort === 'risk') {
          return riskOrder[right.risk] - riskOrder[left.risk];
        }

        return left.rank - right.rank;
      });
  }, [portfolio.projects, headquarterFilter, searchTerm, explorerQuickFilter, explorerSort]);

  useEffect(() => {
    if (headquarterFilter !== 'all' && !headquarterOptions.includes(headquarterFilter)) {
      setHeadquarterFilter('all');
    }
  }, [headquarterFilter, headquarterOptions]);

  useEffect(() => {
    if (!selectedProjectCode) {
      if (filteredProjects.length > 0) {
        setSelectedProjectCode(filteredProjects[0].code);
      }
      return;
    }

    const isSelectedProjectVisible = filteredProjects.some(
      (project) => project.code === selectedProjectCode
    );
    if (!isSelectedProjectVisible) {
      setSelectedProjectCode('');
    }
  }, [selectedProjectCode, filteredProjects]);

  useEffect(() => {
    const query = new URLSearchParams();
    if (activeView !== 'dashboard') {
      query.set('view', activeView);
    }
    if (searchTerm.trim()) {
      query.set('q', searchTerm.trim());
    }
    if (explorerSort !== defaultExplorerSort) {
      query.set('sort', explorerSort);
    }
    if (explorerQuickFilter !== defaultExplorerQuickFilter) {
      query.set('quick', explorerQuickFilter);
    }
    if (headquarterFilter !== 'all') {
      query.set('hq', headquarterFilter);
    }
    if (selectedProjectCode) {
      query.set('project', selectedProjectCode);
    }

    const nextQuery = query.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (nextUrl !== currentUrl) {
      window.history.replaceState(null, '', nextUrl);
    }
  }, [activeView, searchTerm, explorerSort, explorerQuickFilter, headquarterFilter, selectedProjectCode]);

  useEffect(() => {
    if (activeView === 'accounting') {
      setActiveWorkspaceTab('allocation');
      return;
    }

    if (activeView === 'valuation') {
      setActiveWorkspaceTab('valuation');
    }
  }, [activeView]);

  useEffect(() => {
    const handlePopState = () => {
      const restored = parseExplorerState(window.location.search);
      setActiveView(restored.view);
      setSearchTerm(restored.search);
      setExplorerSort(restored.sort);
      setExplorerQuickFilter(restored.quickFilter);
      setHeadquarterFilter(restored.headquarter);
      setSelectedProjectCode(restored.projectCode);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  function openWorkspace(target: 'accounting' | 'valuation', projectCode: string) {
    setSelectedProjectCode(projectCode);
    setActiveView(target);
  }

  function resetExplorerControls() {
    setSearchTerm('');
    setExplorerSort(defaultExplorerSort);
    setExplorerQuickFilter(defaultExplorerQuickFilter);
    setHeadquarterFilter('all');
  }

  function handleWorkspaceTabKeydown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const tabCount = detailTabs.length;

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setActiveWorkspaceTab(detailTabs[(index + 1) % tabCount].key);
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setActiveWorkspaceTab(detailTabs[(index - 1 + tabCount) % tabCount].key);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      setActiveWorkspaceTab(detailTabs[0].key);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      setActiveWorkspaceTab(detailTabs[tabCount - 1].key);
    }
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
                <div className="explorer-controls" aria-label="프로젝트 탐색 컨트롤">
                  <div className="explorer-controls__row">
                    <label className="explorer-search" htmlFor="project-search-input">
                      <span>프로젝트 검색</span>
                      <input
                        id="project-search-input"
                        type="search"
                        value={searchTerm}
                        placeholder="프로젝트명, 코드, 본부 검색"
                        onChange={(event) => setSearchTerm(event.target.value)}
                      />
                    </label>

                    <label className="explorer-sort" htmlFor="project-sort-select">
                      <span>정렬</span>
                      <select
                        id="project-sort-select"
                        value={explorerSort}
                        onChange={(event) => setExplorerSort(event.target.value as ExplorerSortKey)}
                      >
                        {explorerSortOptions.map((option) => (
                          <option key={option.key} value={option.key}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="explorer-controls__group" aria-label="빠른 필터">
                    {explorerQuickFilterOptions.map((filter) => (
                      <button
                        key={filter.key}
                        type="button"
                        className={`explorer-pill ${
                          explorerQuickFilter === filter.key ? 'explorer-pill--active' : ''
                        }`}
                        aria-pressed={explorerQuickFilter === filter.key}
                        onClick={() => setExplorerQuickFilter(filter.key)}
                        title={filter.helper}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>

                  <div className="explorer-controls__group" aria-label="본부 필터">
                    {headquarterOptions.map((headquarter) => (
                      <button
                        key={headquarter}
                        type="button"
                        className={`explorer-pill explorer-pill--subtle ${
                          headquarterFilter === headquarter ? 'explorer-pill--active' : ''
                        }`}
                        aria-pressed={headquarterFilter === headquarter}
                        onClick={() => setHeadquarterFilter(headquarter)}
                      >
                        {headquarter === 'all' ? '전체 본부' : headquarter}
                      </button>
                    ))}
                  </div>

                  <div className="explorer-controls__footer">
                    <p>
                      결과 <strong>{filteredProjects.length}</strong> / {portfolio.projects.length}
                    </p>
                    <button type="button" className="explorer-reset" onClick={resetExplorerControls}>
                      필터 초기화
                    </button>
                  </div>
                </div>

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
                      {filteredProjects.map((project) => (
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
                              <button type="button" onClick={() => setSelectedProjectCode(project.code)}>
                                선택
                              </button>
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
                  {filteredProjects.length === 0 ? (
                    <div className="empty-state">
                      <p>조건에 맞는 프로젝트가 없습니다.</p>
                      <button type="button" onClick={resetExplorerControls}>
                        탐색 조건 초기화
                      </button>
                    </div>
                  ) : null}
                </div>
              </Panel>
            </section>
          ) : null}

          {activeView === 'accounting' || activeView === 'valuation' ? (
            <section className="workspace-stage cockpit-stage">
              <div className="workspace-stage__summary cockpit-summary-strip" aria-label="프로젝트 요약 스트립">
                <div className="cockpit-summary-strip__intro">
                  <p className="workspace-stage__eyebrow">
                    {activeView === 'accounting' ? 'Management Accounting' : 'Financial Evaluation'}
                  </p>
                  <h2>{selectedProject?.name ?? '선택된 프로젝트 없음'}</h2>
                  <p>
                    {selectedProject?.headquarter} · {selectedDetail?.assetCategory} · {selectedDetail?.headline}
                  </p>
                </div>
                <div className="cockpit-summary-strip__focus" aria-label="핵심 신호와 다음 행동">
                  <div className="workspace-stage__meta cockpit-summary-strip__kpis">
                    {selectedWorkspaceKpis.map((item) => (
                      <InfoTile key={item.label} label={item.label} value={item.value} />
                    ))}
                    <InfoTile label="다음 단계" value={selectedDetail?.workflow.nextStep ?? '-'} />
                  </div>
                  <article className="cockpit-next-action">
                    <span>Next action</span>
                    <strong>{selectedDetail?.workflow.nextStep ?? '검토 단계 확인 필요'}</strong>
                    <p>{cockpitNextAction}</p>
                  </article>
                </div>
              </div>

              <div className="cockpit-meta-band" aria-label="요약 메타 정보">
                {cockpitMetaItems.map((item) => (
                  <InfoTile key={item.label} label={item.label} value={item.value} />
                ))}
              </div>
              <div className="cockpit-scan-rail" aria-label="의사결정 스캔 경로">
                <article className="cockpit-scan-rail__step">
                  <span>01</span>
                  <strong>Focus signal</strong>
                  <p>{selectedProject ? `${selectedProject.name} 핵심 KPI를 먼저 확인합니다.` : '프로젝트를 선택하세요.'}</p>
                </article>
                <article className="cockpit-scan-rail__step">
                  <span>02</span>
                  <strong>Decision point</strong>
                  <p>{selectedDetail?.workflow.nextStep ?? '다음 결정을 확인합니다.'}</p>
                </article>
                <article className="cockpit-scan-rail__step">
                  <span>03</span>
                  <strong>Validation</strong>
                  <p>탭별 근거를 확인한 뒤 승인/보류를 확정합니다.</p>
                </article>
              </div>

              <div className="cockpit-tabs" role="tablist" aria-label="프로젝트 분석 탭">
                {detailTabs.map((tab, index) => {
                  const tabId = `workspace-tab-${tab.key}`;
                  const panelId = `workspace-panel-${tab.key}`;
                  const selected = activeWorkspaceTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      id={tabId}
                      type="button"
                      role="tab"
                      aria-controls={panelId}
                      aria-selected={selected}
                      tabIndex={selected ? 0 : -1}
                      className={`cockpit-tab ${selected ? 'cockpit-tab--active' : ''}`}
                      onClick={() => setActiveWorkspaceTab(tab.key)}
                      onKeyDown={(event) => handleWorkspaceTabKeydown(event, index)}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div
                id={`workspace-panel-${activeWorkspaceTab}`}
                role="tabpanel"
                aria-labelledby={`workspace-tab-${activeWorkspaceTab}`}
                className="cockpit-panel-shell"
              >
                {activeWorkspaceTab === 'allocation' && selectedDetail ? (
                  <>
                    <section className="cockpit-kpi-group" aria-label="배분 핵심 지표">
                      <InfoTile label="배분 원가" value={formatKrwCompact(selectedDetail.allocation.allocatedCostKrw)} />
                      <InfoTile label="표준 원가" value={formatKrwCompact(selectedDetail.allocation.standardCostKrw)} />
                      <InfoTile label="효율 갭" value={formatKrwCompact(selectedDetail.allocation.efficiencyGapKrw)} />
                      <InfoTile label="성과 갭" value={formatKrwCompact(selectedDetail.allocation.performanceGapKrw)} />
                    </section>
                    <section className="cockpit-dominant-surface" aria-label="배분 비교 surface">
                      <DecisionBarChart
                        title="Cost Driver 기여도"
                        subtitle={`총 배분원가 ${formatKrwCompact(selectedDetail.allocation.allocatedCostKrw)}`}
                        bars={allocationDecisionBars}
                        summary={`표준원가 대비 ${formatKrwCompact(selectedDetail.allocation.efficiencyGapKrw)} 초과 상태`}
                      />
                    </section>
                    <section className="cockpit-support-grid" aria-label="배분 해석 및 다음 행동">
                      <DecisionSummary
                        title="배분 해석"
                        items={[
                          `표준 대비 ${formatKrwCompact(selectedDetail.allocation.efficiencyGapKrw)} 초과`,
                          `성과 갭 ${formatKrwCompact(selectedDetail.allocation.performanceGapKrw)}로 수익성 압박`,
                          '인력·공통원가 배부 룰 검증 우선'
                        ]}
                      />
                      <DecisionSummary
                        title="다음 행동"
                        items={[
                          '원가담당자/재무검토자가 기준안 합의',
                          '배부 기준 변경 후 재배분 시뮬레이션 실행',
                          '승인 전 기준안과 수정안 차이 기록'
                        ]}
                      />
                    </section>
                  </>
                ) : null}

                {activeWorkspaceTab === 'valuation' && selectedDetail ? (
                  <>
                    <section className="cockpit-kpi-group" aria-label="가치평가 핵심 지표">
                      <InfoTile label="공정가치" value={formatKrwCompact(selectedDetail.valuation.fairValueKrw)} />
                      <InfoTile label="기준 시나리오 NPV" value={formatKrwCompact(valuationExpectedCase?.npvKrw ?? 0)} />
                      <InfoTile label="IRR" value={formatPercent(selectedProject?.irr ?? 0)} />
                      <InfoTile label="회수기간" value={formatYears(selectedProject?.paybackYears ?? 0)} />
                    </section>
                    <section className="cockpit-dominant-surface" aria-label="시나리오 가치 비교 surface">
                      <DecisionBarChart
                        title="시나리오 가치 비교"
                        subtitle="확률 가중 흐름을 한 화면에서 비교"
                        bars={valuationDecisionBars}
                        summary={`기준 대비 비관 격차 ${formatKrwCompact(valuationGap)}`}
                      />
                    </section>
                    <section className="cockpit-support-grid" aria-label="가치평가 보조 정보">
                      <DecisionSummary
                        title="의사결정 포인트"
                        items={[
                          '기준 시나리오를 승인 기준선으로 사용',
                          `비관 시나리오 하방 여유 ${formatKrwCompact(valuationGap)} 확보 필요`,
                          '확률 가정 변경 시 재계산 후 승인'
                        ]}
                      />
                      <InfoTile label="신용등급" value={selectedDetail.valuation.creditGrade} />
                      <InfoTile label="Credit Score" value={`${selectedDetail.valuation.creditRiskScore}점`} />
                      <InfoTile label="Duration" value={`${selectedDetail.valuation.duration}년`} />
                      <InfoTile label="Convexity" value={`${selectedDetail.valuation.convexity}`} />
                    </section>
                  </>
                ) : null}

                {activeWorkspaceTab === 'risk' && selectedDetail ? (
                  <>
                    <section className="cockpit-kpi-group" aria-label="리스크 핵심 지표">
                      <InfoTile label="현재 리스크" value={selectedProject?.risk ?? '-'} />
                      <InfoTile label="VaR 95%" value={formatKrwCompact(selectedDetail.valuation.var95Krw)} />
                      <InfoTile label="CVaR 95%" value={formatKrwCompact(selectedDetail.valuation.cvar95Krw)} />
                      <InfoTile label="하방 격차" value={formatKrwCompact(riskGuardrailGap)} />
                    </section>
                    <section className="cockpit-dominant-surface" aria-label="하방 노출 surface">
                      <DecisionBarChart
                        title="Downside Exposure"
                        subtitle="손실 한계와 시나리오 하방을 동시 비교"
                        bars={riskDecisionBars}
                        summary={`VaR 대비 하방 격차 ${formatKrwCompact(riskGuardrailGap)}`}
                      />
                    </section>
                    <section className="cockpit-support-grid" aria-label="리스크 해석">
                      <DecisionSummary
                        title="리스크 의미"
                        items={[
                          '심각도 등급이 아니라 현금흐름 방어력 확인이 핵심',
                          `하방 격차 ${formatKrwCompact(riskGuardrailGap)}는 승인 임계치 근거`,
                          '손실 허용 범위와 승인 조건을 함께 검증'
                        ]}
                      />
                      <DecisionSummary
                        title="권장 액션"
                        items={[
                          '비관 확률 재추정',
                          '민감도 재평가 후 조건부 승인안 작성',
                          '승인 코멘트에 하방 한계 수치 명시'
                        ]}
                      />
                    </section>
                  </>
                ) : null}

                {activeWorkspaceTab === 'workflow' && selectedDetail ? (
                  <>
                    <section className="cockpit-kpi-group" aria-label="워크플로우 핵심 지표">
                      <InfoTile label="현재 단계" value={selectedDetail.workflow.currentStage} />
                      <InfoTile label="담당자" value={selectedDetail.workflow.owner} />
                      <InfoTile label="검토자" value={selectedDetail.workflow.financeReviewer} />
                      <InfoTile label="다음 단계" value={selectedDetail.workflow.nextStep} />
                    </section>
                    <section className="cockpit-dominant-surface" aria-label="워크플로우 진행 surface">
                      <div className="workflow-steps">
                        {(['기획', '검토', '승인', '보류'] as const).map((step) => (
                          <div
                            key={step}
                            className={`workflow-step ${
                              selectedDetail.workflow.currentStage === step ? 'workflow-step--active' : ''
                            }`}
                          >
                            {step}
                          </div>
                        ))}
                      </div>
                    </section>
                    <section className="cockpit-support-grid" aria-label="워크플로우 상세">
                      <article className="workflow-note">
                        <strong>승인 코멘트</strong>
                        <p>{selectedDetail.workflow.executiveComment}</p>
                      </article>
                      <article className="workflow-note">
                        <strong>다음 행동</strong>
                        <p>{selectedInsight.nextAction}</p>
                      </article>
                    </section>
                  </>
                ) : null}
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

function parseExplorerState(search: string): {
  view: NavigationKey;
  search: string;
  sort: ExplorerSortKey;
  quickFilter: ExplorerQuickFilterKey;
  headquarter: string;
  projectCode: string;
} {
  const query = new URLSearchParams(search);
  const rawView = query.get('view');
  const rawSort = query.get('sort');
  const rawQuickFilter = query.get('quick');
  const rawHeadquarter = query.get('hq');
  const rawSearch = query.get('q');
  const rawProjectCode = query.get('project');

  const view: NavigationKey =
    rawView && navigationItems.some((item) => item.key === rawView)
      ? (rawView as NavigationKey)
      : 'dashboard';
  const sort: ExplorerSortKey =
    rawSort && explorerSortOptions.some((option) => option.key === rawSort)
      ? (rawSort as ExplorerSortKey)
      : defaultExplorerSort;
  const quickFilter: ExplorerQuickFilterKey =
    rawQuickFilter && explorerQuickFilterOptions.some((option) => option.key === rawQuickFilter)
      ? (rawQuickFilter as ExplorerQuickFilterKey)
      : defaultExplorerQuickFilter;
  const headquarter = rawHeadquarter?.trim() ? rawHeadquarter : 'all';
  const searchTerm = rawSearch?.trim() ?? '';
  const projectCode =
    rawProjectCode?.trim() || defaultPortfolioSummary.projects[0]?.code || '';

  return {
    view,
    search: searchTerm,
    sort,
    quickFilter,
    headquarter,
    projectCode
  };
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

type DecisionBarCue = 'solid' | 'stripe' | 'dot';

type DecisionBarInput = {
  key: string;
  label: string;
  value: number;
  formattedValue: string;
  cue: DecisionBarCue;
  annotation: string;
};

type DecisionBarItem = DecisionBarInput & {
  ratio: number;
};

function buildDecisionBars(items: DecisionBarInput[]): DecisionBarItem[] {
  const maxMagnitude = Math.max(...items.map((item) => Math.abs(item.value)), 1);
  return items.map((item) => ({
    ...item,
    ratio: Math.max(Math.abs(item.value) / maxMagnitude, 0.08)
  }));
}

function DecisionBarChart({
  title,
  subtitle,
  bars,
  summary
}: {
  title: string;
  subtitle: string;
  bars: DecisionBarItem[];
  summary: string;
}) {
  return (
    <article className="decision-chart-card">
      <div className="decision-chart-card__header">
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
      <ul className="decision-chart" aria-label={title}>
        {bars.map((bar) => (
          <li key={bar.key} className="decision-chart__row">
            <div className="decision-chart__meta">
              <span className={`decision-cue decision-cue--${bar.cue}`} aria-hidden="true" />
              <strong>{bar.label}</strong>
              <small>{bar.annotation}</small>
            </div>
            <div
              className={`decision-bar decision-bar--${bar.cue}`}
              style={{ '--bar-ratio': `${bar.ratio * 100}%` } as CSSProperties}
            />
            <div className="decision-chart__value">
              <strong>{bar.formattedValue}</strong>
              <span>{bar.value < 0 ? '손실 구간' : '기여 구간'}</span>
            </div>
          </li>
        ))}
      </ul>
      <p className="decision-chart-card__summary">{summary}</p>
    </article>
  );
}

function DecisionSummary({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="decision-summary">
      <strong>{title}</strong>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}
