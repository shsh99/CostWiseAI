import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import {
  buildDecisionSignals,
  detailTabs,
  emptyPortfolioSummary,
  isForbiddenApiError,
  loadAuditEvents,
  loadProjectDetail,
  loadPortfolioSummary,
  roleInsights,
  type AuditEvent,
  type DataSource,
  type ProjectDetail,
  type PortfolioSummary,
  type Role
} from './app/portfolioData';
import { formatKrwCompact, formatPercent, formatYears } from './app/format';
import {
  defaultExplorerQuickFilter,
  defaultExplorerSort,
  parseExplorerState,
  type ExplorerQuickFilterKey,
  type ExplorerSortKey,
  type NavigationKey
} from './features/portfolio/explorerState';
import {
  canAccessMenu,
  getDefaultMenuForRole,
  isDivisionScopedRole,
  resolveDivisionScope
} from './features/auth/permissions';
import { filterAndSortProjects } from './features/portfolio/explorerFilters';
import { buildDecisionBars } from './features/workspace/decisionVisuals';
import { DashboardView } from './views/dashboard/DashboardView';
import { TaskSidebar } from './views/layout/TaskSidebar';
import { TaskTopbar } from './views/layout/TaskTopbar';
import { viewMeta } from './views/layout/viewMeta';
import { LoginView } from './views/auth/LoginView';
import { PortfolioView } from './views/portfolio/PortfolioView';
import { ReviewsView } from './views/reviews/ReviewsView';
import { SettingsView } from './views/settings/SettingsView';
import { UsersView } from './views/users/UsersView';
import { WorkspaceView } from './views/workspace/WorkspaceView';

type WorkspaceTabKey = (typeof detailTabs)[number]['key'];

type AuthSession = {
  username: string;
  displayName: string;
  role: Role;
};

type DemoAccount = AuthSession & { password: string };

const demoAccounts: DemoAccount[] = [
  {
    username: 'admin',
    password: 'admin123',
    displayName: 'CostWise 관리자',
    role: 'ADMIN'
  },
  {
    username: 'cfo',
    password: 'user123',
    displayName: '원가·평가 본부장',
    role: 'EXECUTIVE'
  },
  {
    username: 'analyst',
    password: 'user123',
    displayName: '원가·평가 담당',
    role: 'ACCOUNTANT'
  },
  {
    username: 'viewer',
    password: 'user123',
    displayName: '감사/열람 담당',
    role: 'AUDITOR'
  }
];

export function App() {
  const initialExplorerState = useMemo(
    () => parseExplorerState(window.location.search),
    []
  );
  const initialProjectFromQuery = useMemo(
    () =>
      new URLSearchParams(window.location.search).get('project')?.trim() ?? '',
    []
  );
  const [session, setSession] = useState<AuthSession | null>(() => {
    try {
      const raw = window.localStorage.getItem('costwise_session');
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as AuthSession;
      return parsed?.role ? parsed : null;
    } catch {
      return null;
    }
  });
  const [selectedRole, setSelectedRole] = useState<Role>(
    session?.role ?? 'EXECUTIVE'
  );
  const [activeView, setActiveView] = useState<NavigationKey>(
    initialExplorerState.view
  );
  const [portfolio, setPortfolio] = useState<PortfolioSummary>(
    emptyPortfolioSummary
  );
  const [portfolioSource, setPortfolioSource] = useState<DataSource>('api');
  const [portfolioStatus, setPortfolioStatus] = useState<
    'loading' | 'ready' | 'error'
  >('loading');
  const [portfolioError, setPortfolioError] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<ProjectDetail | null>(
    null
  );
  const [selectedDetailSource, setSelectedDetailSource] =
    useState<DataSource>('api');
  const [selectedDetailStatus, setSelectedDetailStatus] = useState<
    'idle' | 'loading' | 'ready' | 'error'
  >('idle');
  const [selectedDetailError, setSelectedDetailError] = useState<string | null>(
    null
  );
  const [portfolioReloadKey, setPortfolioReloadKey] = useState(0);
  const [selectedDetailReloadKey, setSelectedDetailReloadKey] = useState(0);
  const [auditReloadKey, setAuditReloadKey] = useState(0);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [auditSource, setAuditSource] = useState<DataSource>('api');
  const [auditStatus, setAuditStatus] = useState<
    'idle' | 'loading' | 'ready' | 'error'
  >('idle');
  const [auditError, setAuditError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(initialExplorerState.search);
  const [explorerSort, setExplorerSort] = useState<ExplorerSortKey>(
    initialExplorerState.sort
  );
  const [explorerQuickFilter, setExplorerQuickFilter] =
    useState<ExplorerQuickFilterKey>(initialExplorerState.quickFilter);
  const [headquarterFilter, setHeadquarterFilter] = useState<string>(
    initialExplorerState.headquarter
  );
  const [selectedProjectCode, setSelectedProjectCode] = useState(
    initialProjectFromQuery
  );
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [activeWorkspaceTab, setActiveWorkspaceTab] =
    useState<WorkspaceTabKey>('allocation');

  useEffect(() => {
    document.title = session
      ? 'CostWise | 원가·평가 통합관리'
      : 'CostWise 로그인 | 원가·평가 통합관리';
  }, [session]);

  useEffect(() => {
    let cancelled = false;

    setPortfolioStatus('loading');
    setPortfolioError(null);

    void loadPortfolioSummary()
      .then(({ summary, source: loadedSource }) => {
        if (!cancelled) {
          setPortfolio(summary);
          setPortfolioSource(loadedSource);
          setPortfolioStatus('ready');
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setPortfolioSource('degraded');
          setPortfolioStatus('error');
          setPortfolioError(
            isForbiddenApiError(error)
              ? '포트폴리오 조회 권한이 없습니다(403). 관리자에게 읽기 권한을 요청하세요.'
              : error instanceof Error
                ? error.message
                : '포트폴리오 데이터를 불러오지 못했습니다.'
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [portfolioReloadKey]);

  const selectedProject = useMemo(
    () =>
      portfolio.projects.find(
        (project) => project.code === selectedProjectCode
      ) ?? null,
    [portfolio.projects, selectedProjectCode]
  );
  useEffect(() => {
    if (!selectedProject) {
      setSelectedDetail(null);
      setSelectedDetailSource(portfolioSource);
      setSelectedDetailStatus('idle');
      setSelectedDetailError(null);
      return;
    }

    let cancelled = false;
    setSelectedDetail(null);
    setSelectedDetailStatus('loading');
    setSelectedDetailError(null);
    setSelectedDetailSource('api');

    void loadProjectDetail(selectedProject)
      .then(({ detail, source }) => {
        if (!cancelled) {
          setSelectedDetail(detail);
          setSelectedDetailSource(source);
          setSelectedDetailStatus('ready');
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setSelectedDetailSource('degraded');
          setSelectedDetailStatus('error');
          setSelectedDetailError(
            isForbiddenApiError(error)
              ? '프로젝트 상세 조회 권한이 없습니다(403). 접근 권한을 확인하세요.'
              : error instanceof Error
                ? error.message
                : '프로젝트 상세를 불러오지 못했습니다.'
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedProject, selectedDetailReloadKey, portfolioSource]);

  useEffect(() => {
    if (!selectedProject) {
      setAuditEvents(portfolio.auditEvents);
      setAuditSource(portfolioSource);
      setAuditError(portfolioError);
      setAuditStatus(
        portfolioStatus === 'loading'
          ? 'loading'
          : portfolioStatus === 'error'
            ? 'error'
            : 'ready'
      );
      return;
    }

    let cancelled = false;
    setAuditStatus('loading');
    setAuditError(null);
    setAuditSource('api');

    void loadAuditEvents(selectedProject)
      .then(({ events, source }) => {
        if (!cancelled) {
          setAuditEvents(events);
          setAuditSource(source);
          setAuditStatus('ready');
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setAuditEvents([]);
          setAuditSource('degraded');
          setAuditStatus('error');
          setAuditError(
            isForbiddenApiError(error)
              ? '감사 이력 조회 권한이 없습니다(403). 감사 로그 열람 권한을 요청하세요.'
              : error instanceof Error
                ? error.message
                : '감사 이력을 불러오지 못했습니다.'
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    selectedProject,
    portfolio.auditEvents,
    portfolioError,
    portfolioSource,
    portfolioStatus,
    auditReloadKey
  ]);

  const source: DataSource =
    portfolioSource === 'degraded' || selectedDetailSource === 'degraded'
      ? 'degraded'
      : 'api';
  const divisionOptions = useMemo(
    () => portfolio.headquarters.map((headquarter) => headquarter.name),
    [portfolio.headquarters]
  );
  const divisionScope = resolveDivisionScope(
    selectedRole,
    selectedDivision,
    divisionOptions
  );
  const scopedPortfolio = useMemo(() => {
    if (!divisionScope) {
      return portfolio;
    }

    const projects = portfolio.projects.filter(
      (project) => project.headquarter === divisionScope
    );
    const headquarters = portfolio.headquarters.filter(
      (headquarter) => headquarter.name === divisionScope
    );
    const projectCodeSet = new Set(projects.map((project) => project.code));
    const auditEvents = portfolio.auditEvents.filter((event) =>
      projectCodeSet.has(event.domain)
    );
    const approvedCount = projects.filter(
      (project) => project.status === '승인'
    ).length;
    const conditionalCount = projects.filter(
      (project) => project.status === '조건부 진행'
    ).length;
    const totalInvestmentKrw = projects.reduce(
      (sum, project) => sum + project.investmentKrw,
      0
    );
    const totalExpectedRevenueKrw = projects.reduce(
      (sum, project) => sum + project.expectedRevenueKrw,
      0
    );
    const averageNpvKrw =
      projects.length > 0
        ? Math.round(
            projects.reduce((sum, project) => sum + project.npvKrw, 0) /
              projects.length
          )
        : 0;
    const averageIrr =
      projects.length > 0
        ? projects.reduce((sum, project) => sum + project.irr, 0) /
          projects.length
        : 0;
    const averagePaybackYears =
      projects.length > 0
        ? projects.reduce((sum, project) => sum + project.paybackYears, 0) /
          projects.length
        : 0;

    return {
      ...portfolio,
      overview: {
        ...portfolio.overview,
        headquarterCount: headquarters.length,
        projectCount: projects.length,
        totalInvestmentKrw,
        totalExpectedRevenueKrw,
        averageNpvKrw,
        averageIrr,
        averagePaybackYears,
        approvedCount,
        conditionalCount
      },
      headquarters,
      projects,
      auditEvents
    };
  }, [divisionScope, portfolio]);
  const selectedInsight = roleInsights[selectedRole];
  const decisionSignals = buildDecisionSignals(scopedPortfolio);
  const currentViewMeta = viewMeta[activeView];
  const priorityProjects = useMemo(
    () => scopedPortfolio.projects.slice(0, 6),
    [scopedPortfolio.projects]
  );
  const maxHeadquarterInvestment = useMemo(() => {
    if (scopedPortfolio.headquarters.length === 0) {
      return 0;
    }

    return Math.max(
      ...scopedPortfolio.headquarters.map(
        (headquarter) => headquarter.totalInvestmentKrw
      )
    );
  }, [scopedPortfolio.headquarters]);

  const selectedWorkspaceKpis = selectedProject
    ? [
        { label: 'NPV', value: formatKrwCompact(selectedProject.npvKrw) },
        { label: 'IRR', value: formatPercent(selectedProject.irr) },
        { label: '회수기간', value: formatYears(selectedProject.paybackYears) }
      ]
    : [];

  const cockpitMetaItems = [
    {
      label: '우선순위',
      value: selectedProject ? `${selectedProject.rank}위` : '-'
    },
    { label: 'Owner', value: selectedDetail?.manager ?? '-' },
    {
      label: 'Current Stage',
      value: selectedDetail?.workflow.currentStage ?? '-'
    },
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
    selectedDetail?.scenarioReturns.find(
      (scenario) => scenario.label === '기준'
    ) ?? null;
  const riskDownsideScenario =
    selectedDetail?.scenarioReturns.find(
      (scenario) => scenario.label === '비관'
    ) ?? null;
  const riskGuardrailGap =
    selectedDetail && riskDownsideScenario
      ? Math.abs(
          selectedDetail.valuation.var95Krw - riskDownsideScenario.npvKrw
        )
      : 0;
  const valuationGap = Math.abs(
    (valuationExpectedCase?.npvKrw ?? 0) - (riskDownsideScenario?.npvKrw ?? 0)
  );

  const allocationDecisionBars = selectedDetail
    ? buildDecisionBars([
        {
          key: 'project',
          label: '프로젝트 직접원가',
          value: selectedDetail.allocation.projectCostKrw,
          formattedValue: formatKrwCompact(
            selectedDetail.allocation.projectCostKrw
          ),
          cue: 'solid',
          annotation: '투입 원가의 기준점'
        },
        {
          key: 'personnel',
          label: '인력원가',
          value: selectedDetail.allocation.personnelCostKrw,
          formattedValue: formatKrwCompact(
            selectedDetail.allocation.personnelCostKrw
          ),
          cue: 'stripe',
          annotation: '배부 기준 재조정 우선 후보'
        },
        {
          key: 'hq',
          label: '본부 공통원가',
          value: selectedDetail.allocation.headquarterCostKrw,
          formattedValue: formatKrwCompact(
            selectedDetail.allocation.headquarterCostKrw
          ),
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
          cue:
            scenario.label === '기준'
              ? 'solid'
              : scenario.label === '낙관'
                ? 'stripe'
                : 'dot',
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
    () => [
      'all',
      ...scopedPortfolio.headquarters.map((headquarter) => headquarter.name)
    ],
    [scopedPortfolio.headquarters]
  );

  const filteredProjects = useMemo(
    () =>
      filterAndSortProjects(scopedPortfolio.projects, {
        headquarterFilter,
        searchTerm,
        quickFilter: explorerQuickFilter,
        sort: explorerSort
      }),
    [
      scopedPortfolio.projects,
      headquarterFilter,
      searchTerm,
      explorerQuickFilter,
      explorerSort
    ]
  );

  useEffect(() => {
    if (!isDivisionScopedRole(selectedRole)) {
      return;
    }

    if (
      selectedDivision &&
      divisionOptions.some((division) => division === selectedDivision)
    ) {
      return;
    }

    setSelectedDivision(divisionOptions[0] ?? null);
  }, [selectedDivision, selectedRole, divisionOptions]);

  useEffect(() => {
    if (!divisionScope || !selectedProject) {
      return;
    }

    if (selectedProject.headquarter !== divisionScope) {
      setSelectedProjectCode('');
    }
  }, [divisionScope, selectedProject]);

  useEffect(() => {
    if (
      headquarterFilter !== 'all' &&
      !headquarterOptions.includes(headquarterFilter)
    ) {
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
  }, [
    activeView,
    searchTerm,
    explorerSort,
    explorerQuickFilter,
    headquarterFilter,
    selectedProjectCode
  ]);

  useEffect(() => {
    if (!canAccessMenu(selectedRole, activeView)) {
      setActiveView(getDefaultMenuForRole(selectedRole));
    }
  }, [activeView, selectedRole]);

  useEffect(() => {
    if (!session) {
      return;
    }
    setSelectedRole(session.role);
  }, [session]);

  useEffect(() => {
    if (activeView === 'accounting') {
      setActiveWorkspaceTab('allocation');
      return;
    }

    if (activeView === 'valuation') {
      setActiveWorkspaceTab('valuation');
      return;
    }

    if (activeView === 'risk') {
      setActiveWorkspaceTab('risk');
    }
  }, [activeView]);

  useEffect(() => {
    const handlePopState = () => {
      const restored = parseExplorerState(window.location.search);
      const restoredProjectCode =
        new URLSearchParams(window.location.search).get('project')?.trim() ??
        '';
      setActiveView(restored.view);
      setSearchTerm(restored.search);
      setExplorerSort(restored.sort);
      setExplorerQuickFilter(restored.quickFilter);
      setHeadquarterFilter(restored.headquarter);
      setSelectedProjectCode(restoredProjectCode);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  function openWorkspace(
    target: 'accounting' | 'valuation',
    projectCode: string
  ) {
    setSelectedProjectCode(projectCode);
    setActiveView(target);
  }

  function resetExplorerControls() {
    setSearchTerm('');
    setExplorerSort(defaultExplorerSort);
    setExplorerQuickFilter(defaultExplorerQuickFilter);
    setHeadquarterFilter('all');
  }

  function retryPortfolioLoad() {
    setPortfolioReloadKey((current) => current + 1);
  }

  function retryDetailLoad() {
    setSelectedDetailReloadKey((current) => current + 1);
  }

  function retryAuditLoad() {
    setAuditReloadKey((current) => current + 1);
  }

  function handleWorkspaceTabKeydown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) {
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

  function handleLogin(username: string, password: string) {
    const resolved = demoAccounts.find(
      (account) => account.username === username && account.password === password
    );

    if (!resolved) {
      return false;
    }

    const nextSession: AuthSession = {
      username: resolved.username,
      displayName: resolved.displayName,
      role: resolved.role
    };
    window.localStorage.setItem('costwise_session', JSON.stringify(nextSession));
    setSession(nextSession);
    setSelectedRole(nextSession.role);
    return true;
  }

  function handleLogout() {
    window.localStorage.removeItem('costwise_session');
    setSession(null);
  }

  if (!session) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="grid min-h-screen bg-cw-page lg:grid-cols-[260px_1fr]">
      <a
        className="absolute left-2.5 top-2.5 z-50 -translate-y-[140%] rounded-full bg-white px-3.5 py-2.5 text-cw-text no-underline transition-transform duration-150 focus:translate-y-0"
        href="#main-content"
      >
        본문으로 건너뛰기
      </a>

      <TaskSidebar
        activeView={activeView}
        selectedRole={selectedRole}
        onChangeView={setActiveView}
      />

      <div className="min-h-screen">
        <TaskTopbar
          selectedRole={selectedRole}
          username={session.displayName}
          divisionScope={divisionScope}
          divisionOptions={divisionOptions}
          onChangeDivision={setSelectedDivision}
          source={source}
          projectCount={scopedPortfolio.overview.projectCount}
          conditionalCount={scopedPortfolio.overview.conditionalCount}
          selectedProject={selectedProject}
          meta={currentViewMeta}
          onLogout={handleLogout}
        />

        <main id="main-content" className="grid gap-4 px-[22px] pb-[26px] pt-[18px]">
          {activeView === 'dashboard' ? (
            <DashboardView
              decisionSignals={decisionSignals}
              selectedInsight={selectedInsight}
              portfolio={scopedPortfolio}
              priorityProjects={priorityProjects}
              onOpenWorkspace={openWorkspace}
            />
          ) : null}

          {activeView === 'portfolio' ? (
            <PortfolioView
              selectedRole={selectedRole}
              portfolio={scopedPortfolio}
              portfolioStatus={portfolioStatus}
              portfolioError={portfolioError}
              maxHeadquarterInvestment={maxHeadquarterInvestment}
              divisionScope={divisionScope}
              selectedProjectCode={selectedProjectCode}
              searchTerm={searchTerm}
              explorerSort={explorerSort}
              explorerQuickFilter={explorerQuickFilter}
              headquarterFilter={headquarterFilter}
              headquarterOptions={headquarterOptions}
              filteredProjects={filteredProjects}
              onChangeSearchTerm={setSearchTerm}
              onChangeSort={setExplorerSort}
              onChangeQuickFilter={setExplorerQuickFilter}
              onChangeHeadquarterFilter={setHeadquarterFilter}
              onResetExplorerControls={resetExplorerControls}
              onSelectProject={setSelectedProjectCode}
              onOpenWorkspace={openWorkspace}
              onRetryPortfolioLoad={retryPortfolioLoad}
            />
          ) : null}

          {activeView === 'accounting' || activeView === 'valuation' || activeView === 'risk' ? (
            <WorkspaceView
              activeView={activeView}
              selectedProject={selectedProject}
              selectedDetail={selectedDetail}
              detailStatus={selectedDetailStatus}
              detailError={selectedDetailError}
              selectedInsight={selectedInsight}
              activeWorkspaceTab={activeWorkspaceTab}
              selectedWorkspaceKpis={selectedWorkspaceKpis}
              cockpitMetaItems={cockpitMetaItems}
              cockpitNextAction={cockpitNextAction}
              allocationDecisionBars={allocationDecisionBars}
              valuationDecisionBars={valuationDecisionBars}
              riskDecisionBars={riskDecisionBars}
              valuationExpectedCase={valuationExpectedCase}
              valuationGap={valuationGap}
              riskGuardrailGap={riskGuardrailGap}
              onChangeWorkspaceTab={setActiveWorkspaceTab}
              onWorkspaceTabKeydown={handleWorkspaceTabKeydown}
              onRetryDetailLoad={retryDetailLoad}
            />
          ) : null}

          {activeView === 'audit' ? (
            <ReviewsView
              portfolio={scopedPortfolio}
              auditEvents={auditEvents}
              auditSource={auditSource}
              auditStatus={auditStatus}
              auditError={auditError}
              selectedProjectName={selectedProject?.name ?? null}
              onRetryAuditLoad={retryAuditLoad}
            />
          ) : null}

          {activeView === 'users' ? (
            <UsersView
              selectedRole={selectedRole}
              divisionScope={divisionScope}
              divisionOptions={divisionOptions}
            />
          ) : null}

          {activeView === 'settings' ? (
            <SettingsView
              selectedRole={selectedRole}
              selectedInsight={selectedInsight}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}
