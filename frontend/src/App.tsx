import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import {
  buildDecisionSignals,
  buildProjectDetail,
  detailTabs,
  defaultPortfolioSummary,
  loadPortfolioSummary,
  roleInsights,
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
  filterAndSortProjects
} from './features/portfolio/explorerFilters';
import { buildDecisionBars } from './features/workspace/decisionVisuals';
import { DashboardView } from './views/dashboard/DashboardView';
import { TaskSidebar } from './views/layout/TaskSidebar';
import { TaskTopbar } from './views/layout/TaskTopbar';
import { viewMeta } from './views/layout/viewMeta';
import { PortfolioView } from './views/portfolio/PortfolioView';
import { ReviewsView } from './views/reviews/ReviewsView';
import { SettingsView } from './views/settings/SettingsView';
import { WorkspaceView } from './views/workspace/WorkspaceView';

type WorkspaceTabKey = (typeof detailTabs)[number]['key'];

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

  const selectedProject = useMemo(
    () => portfolio.projects.find((project) => project.code === selectedProjectCode) ?? null,
    [portfolio.projects, selectedProjectCode]
  );
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
  const valuationGap = Math.abs((valuationExpectedCase?.npvKrw ?? 0) - (riskDownsideScenario?.npvKrw ?? 0));

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

  const filteredProjects = useMemo(
    () =>
      filterAndSortProjects(portfolio.projects, {
        headquarterFilter,
        searchTerm,
        quickFilter: explorerQuickFilter,
        sort: explorerSort
      }),
    [portfolio.projects, headquarterFilter, searchTerm, explorerQuickFilter, explorerSort]
  );

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

    const isSelectedProjectVisible = filteredProjects.some((project) => project.code === selectedProjectCode);
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

      <TaskSidebar activeView={activeView} selectedRole={selectedRole} onChangeView={setActiveView} />

      <div className="workspace workspace--task-first">
        <TaskTopbar
          selectedRole={selectedRole}
          onChangeRole={setSelectedRole}
          source={source}
          projectCount={portfolio.overview.projectCount}
          conditionalCount={portfolio.overview.conditionalCount}
          selectedProject={selectedProject}
          meta={currentViewMeta}
        />

        <main id="main-content" className="content content--task-first">
          {activeView === 'dashboard' ? (
            <DashboardView
              decisionSignals={decisionSignals}
              selectedInsight={selectedInsight}
              portfolio={portfolio}
              priorityProjects={priorityProjects}
              onOpenWorkspace={openWorkspace}
            />
          ) : null}

          {activeView === 'portfolio' ? (
            <PortfolioView
              portfolio={portfolio}
              maxHeadquarterInvestment={maxHeadquarterInvestment}
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
            />
          ) : null}

          {activeView === 'accounting' || activeView === 'valuation' ? (
            <WorkspaceView
              activeView={activeView}
              selectedProject={selectedProject}
              selectedDetail={selectedDetail}
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
            />
          ) : null}

          {activeView === 'reviews' ? <ReviewsView portfolio={portfolio} /> : null}

          {activeView === 'settings' ? (
            <SettingsView selectedRole={selectedRole} selectedInsight={selectedInsight} />
          ) : null}
        </main>
      </div>
    </div>
  );
}
