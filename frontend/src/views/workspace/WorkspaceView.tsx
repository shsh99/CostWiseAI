/* eslint-disable no-unused-vars */
import { useMemo, type KeyboardEvent } from 'react';
import {
  buildProjectDetail,
  detailTabs,
  type ProjectDetail,
  type ProjectSummary,
  type RoleInsight
} from '../../app/portfolioData';
import { formatKrwCompact, formatPercent, formatYears } from '../../app/format';
import {
  DecisionBarChart,
  DecisionSummary,
  type DecisionBarItem
} from '../../features/workspace/decisionVisuals';
import { InfoTile } from '../../shared/components/InfoTile';
import { Panel } from '../../shared/components/Panel';
import { RiskProjectBoard, type RiskProjectRow } from './RiskProjectBoard';
import { ValuationProjectExplorer } from './ValuationProjectExplorer';

type WorkspaceTabKey = (typeof detailTabs)[number]['key'];

type WorkspaceViewProps = {
  activeView: 'accounting' | 'valuation' | 'risk';
  portfolioProjects?: ProjectSummary[];
  selectedProject: ProjectSummary | null;
  selectedDetail: ProjectDetail | null;
  detailStatus: 'idle' | 'loading' | 'ready' | 'error';
  detailError: string | null;
  selectedInsight: RoleInsight;
  activeWorkspaceTab: WorkspaceTabKey;
  selectedWorkspaceKpis: Array<{ label: string; value: string }>;
  cockpitMetaItems: Array<{ label: string; value: string }>;
  cockpitNextAction: string;
  allocationDecisionBars: DecisionBarItem[];
  valuationDecisionBars: DecisionBarItem[];
  riskDecisionBars: DecisionBarItem[];
  valuationExpectedCase: ProjectDetail['scenarioReturns'][number] | null;
  valuationGap: number;
  riskGuardrailGap: number;
  onChangeWorkspaceTab(tab: WorkspaceTabKey): void;
  onWorkspaceTabKeydown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ): void;
  onSelectProjectFromValuation?: (projectCode: string) => void;
  onSelectProjectFromRisk?: (projectCode: string) => void;
  onRetryDetailLoad(): void;
};

export function WorkspaceView({
  activeView,
  portfolioProjects = [],
  selectedProject,
  selectedDetail,
  detailStatus,
  detailError,
  selectedInsight,
  activeWorkspaceTab,
  selectedWorkspaceKpis,
  cockpitMetaItems,
  cockpitNextAction,
  allocationDecisionBars,
  valuationDecisionBars,
  riskDecisionBars,
  valuationExpectedCase,
  valuationGap,
  riskGuardrailGap,
  onChangeWorkspaceTab,
  onWorkspaceTabKeydown,
  onSelectProjectFromValuation,
  onSelectProjectFromRisk,
  onRetryDetailLoad
}: WorkspaceViewProps) {
  const hasSelectedProject = Boolean(selectedProject);
  const workspaceMeta =
    activeView === 'valuation'
      ? {
          title: '가치평가',
          subtitle: '프로젝트 가치평가 및 금융 지표 검토',
          actionLabel: '+ 평가 입력',
          heroLabel: '가치평가 보드'
        }
      : {
          title: '리스크/VaR',
          subtitle: '손실 한계 및 하방 시나리오 점검',
          actionLabel: '+ 리스크 입력',
          heroLabel: '리스크 보드'
        };
  const snapshotTime = new Date().toLocaleString('ko-KR', { hour12: false });
  const statusCardClass =
    'rounded-2xl border border-[#d8e2f2] bg-[#f8fbff] px-5 py-4 text-[#34496d] shadow-[0_6px_18px_rgba(24,40,71,0.06)]';
  const emptyStateClass =
    'rounded-2xl border border-dashed border-[#cfdcf0] bg-white px-5 py-6 text-[#34496d] shadow-[0_4px_14px_rgba(24,40,71,0.04)]';
  const emptyStateButtonClass =
    'mt-3 inline-flex items-center rounded-xl border border-[#b9c9e4] bg-white px-3 py-2 text-sm font-semibold text-[#2f4570] transition hover:bg-[#f3f7ff]';
  const tableShellClass =
    'overflow-x-auto rounded-2xl border border-[#d7e1f1] bg-white shadow-[0_6px_20px_rgba(24,40,71,0.05)]';
  const tableClass =
    'min-w-full border-separate border-spacing-0 text-sm text-[#2b3f63]';
  const kpiGridClass = 'grid gap-3 sm:grid-cols-2 xl:grid-cols-4';
  const dominantSurfaceClass =
    'rounded-2xl border border-[#d7e1f1] bg-white p-4 shadow-[0_8px_24px_rgba(24,40,71,0.06)]';
  const supportGridClass = 'grid gap-4 lg:grid-cols-2';
  const workflowNoteClass =
    'rounded-2xl border border-[#d7e1f1] bg-white p-4 text-[#34496d] shadow-[0_6px_18px_rgba(24,40,71,0.05)]';
  const listClass = 'mt-3 grid gap-2';
  const listItemClass =
    'rounded-xl border border-[#e0e8f5] bg-[#f9fbff] px-3 py-2 text-sm text-[#41557b]';
  const focusCardClass =
    'rounded-2xl border border-[#c6d8f5] bg-[linear-gradient(130deg,#eef4ff_0%,#f8fbff_65%,#ffffff_100%)] p-4 text-[#304668] shadow-[0_8px_22px_rgba(24,40,71,0.08)]';
  const miniStatClass =
    'rounded-xl border border-[#d8e2f2] bg-[#f8fbff] p-3 text-sm text-[#3b4f76]';
  const handleValuationProjectSelect = (projectCode: string) => {
    if (!onSelectProjectFromValuation) {
      return;
    }

    onSelectProjectFromValuation(projectCode);
  };
  const handleRiskProjectSelect = (projectCode: string) => {
    if (!onSelectProjectFromRisk) {
      return;
    }

    onSelectProjectFromRisk(projectCode);
  };
  const riskProjectRows = useMemo<RiskProjectRow[]>(() => {
    if (activeView !== 'risk') {
      return [];
    }

    return portfolioProjects.map((project) => {
      const detail = buildProjectDetail(project.code);
      const positionKrw = Math.max(project.investmentKrw, 1);
      const var95Krw = Math.max(Math.abs(detail.valuation.var95Krw), 1);
      const var99Krw = Math.max(Math.abs(detail.valuation.var99Krw), var95Krw);
      const volatility = Math.min(
        1.0,
        Math.max(
          0.01,
          var95Krw / Math.max(Math.abs(detail.valuation.fairValueKrw), 1)
        )
      );
      const pd = Math.min(
        0.25,
        Math.max(0.001, (100 - detail.valuation.creditRiskScore) / 1000)
      );
      const expectedLossKrw = Math.round(pd * 0.45 * positionKrw);

      return {
        code: project.code,
        name: project.name,
        positionKrw,
        var95Krw,
        var99Krw,
        volatility,
        creditGrade: detail.valuation.creditGrade,
        pd,
        expectedLossKrw
      };
    });
  }, [activeView, portfolioProjects]);

  if (activeView === 'accounting') {
    const allocationRows = selectedDetail?.allocation.rules ?? [];
    const maxAllocatedAmount = Math.max(
      1,
      ...allocationRows.map((row) => row.allocatedAmount)
    );

    return (
      <section>
        <header className="mb-3.5 flex items-center justify-between gap-4">
          <div>
            <h2 className="m-0 text-[1.9rem] font-bold text-[#182847]">
              원가 집계·분석
            </h2>
            <p className="mt-1 text-[#607397]">
              본부/프로젝트별 원가 집계 및 표준원가 차이분석
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              className="rounded-[10px] border border-[#cbd6ea] bg-white px-3.5 py-2.5 font-bold text-[#2f4570]"
              type="button"
            >
              CSV
            </button>
            <button
              className="rounded-[10px] bg-[#2b4dbf] px-3.5 py-2.5 font-extrabold text-white"
              type="button"
            >
              + 원가 입력
            </button>
          </div>
        </header>

        {hasSelectedProject && detailStatus === 'ready' && selectedDetail ? (
          <section
            className="grid gap-3 xl:grid-cols-[1.5fr_1fr]"
            aria-label="원가 집계 핵심 지표"
          >
            <article className={focusCardClass}>
              <span className="text-xs font-semibold uppercase tracking-[0.05em] text-[#607ca8]">
                핵심 KPI
              </span>
              <strong className="mt-1.5 block text-[1.45rem] font-bold text-[#1f3458]">
                총 배분원가{' '}
                {formatKrwCompact(selectedDetail.allocation.allocatedCostKrw)}
              </strong>
              <p className="mt-2 text-sm">
                표준원가{' '}
                {formatKrwCompact(selectedDetail.allocation.standardCostKrw)}{' '}
                대비 효율 갭{' '}
                {formatKrwCompact(selectedDetail.allocation.efficiencyGapKrw)}를
                우선 점검하세요.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className={miniStatClass}>
                  <span className="text-xs text-[#6881aa]">성과 갭</span>
                  <strong className="mt-1 block text-[#1f3458]">
                    {formatKrwCompact(
                      selectedDetail.allocation.performanceGapKrw
                    )}
                  </strong>
                </div>
                <div className={miniStatClass}>
                  <span className="text-xs text-[#6881aa]">배부 룰 수</span>
                  <strong className="mt-1 block text-[#1f3458]">
                    {allocationRows.length}개
                  </strong>
                </div>
              </div>
            </article>
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <InfoTile
                label="표준원가"
                value={formatKrwCompact(
                  selectedDetail.allocation.standardCostKrw
                )}
              />
              <InfoTile
                label="효율 갭"
                value={formatKrwCompact(
                  selectedDetail.allocation.efficiencyGapKrw
                )}
              />
              <InfoTile
                label="성과 갭"
                value={formatKrwCompact(
                  selectedDetail.allocation.performanceGapKrw
                )}
              />
            </div>
          </section>
        ) : null}

        {detailStatus === 'loading' ? (
          <div className={statusCardClass} role="status">
            <strong className="block text-[0.98rem] font-semibold text-[#1d2f52]">
              원가 상세 데이터를 불러오는 중입니다.
            </strong>
            <p className="mt-1 text-sm">
              프로젝트 배부 규칙과 집계 데이터를 확인하고 있습니다.
            </p>
          </div>
        ) : null}

        {detailStatus === 'error' ? (
          <div className={emptyStateClass}>
            <strong className="block text-[1rem] font-semibold text-[#1d2f52]">
              원가 데이터를 불러오지 못했습니다.
            </strong>
            <p className="mt-1 text-sm">
              {detailError ?? '잠시 후 다시 시도하세요.'}
            </p>
            <button
              type="button"
              onClick={onRetryDetailLoad}
              className={emptyStateButtonClass}
            >
              다시 시도
            </button>
          </div>
        ) : null}

        {hasSelectedProject && detailStatus === 'ready' && selectedDetail ? (
          <>
            <Panel
              title="본부별 원가 차이분석 (실제 vs 표준)"
              subtitle="선택 프로젝트 기준 배부 규칙"
            >
              <div className="mb-3 grid gap-2.5 sm:grid-cols-3">
                <article className={miniStatClass}>
                  <span className="text-xs text-[#6881aa]">총 본부</span>
                  <strong className="mt-1 block text-[#1f3458]">
                    {allocationRows.length}개
                  </strong>
                </article>
                <article className={miniStatClass}>
                  <span className="text-xs text-[#6881aa]">기준 원가</span>
                  <strong className="mt-1 block text-[#1f3458]">
                    {formatKrwCompact(
                      selectedDetail.allocation.standardCostKrw
                    )}
                  </strong>
                </article>
                <article className={miniStatClass}>
                  <span className="text-xs text-[#6881aa]">배분 원가</span>
                  <strong className="mt-1 block text-[#1f3458]">
                    {formatKrwCompact(
                      selectedDetail.allocation.allocatedCostKrw
                    )}
                  </strong>
                </article>
              </div>
              <div className={tableShellClass}>
                <table className={tableClass}>
                  <thead className="bg-[#f1f5fc] text-xs uppercase tracking-[0.03em] text-[#5a7096]">
                    <tr>
                      <th className="border-b border-[#d7e1f1] px-4 py-3 text-left font-semibold">
                        본부
                      </th>
                      <th className="border-b border-[#d7e1f1] px-4 py-3 text-left font-semibold">
                        실제원가
                      </th>
                      <th className="border-b border-[#d7e1f1] px-4 py-3 text-left font-semibold">
                        표준원가
                      </th>
                      <th className="border-b border-[#d7e1f1] px-4 py-3 text-left font-semibold">
                        차이
                      </th>
                      <th className="border-b border-[#d7e1f1] px-4 py-3 text-left font-semibold">
                        차이율
                      </th>
                      <th className="border-b border-[#d7e1f1] px-4 py-3 text-left font-semibold">
                        판정
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {allocationRows.map((rule) => {
                      const diff = rule.allocatedAmount - rule.costPoolAmount;
                      const rate =
                        rule.costPoolAmount === 0
                          ? 0
                          : (diff / rule.costPoolAmount) * 100;
                      return (
                        <tr key={`${rule.departmentCode}-${rule.costPoolName}`}>
                          <td className="border-b border-[#e5ecf8] px-4 py-3">
                            {rule.departmentCode}
                          </td>
                          <td className="border-b border-[#e5ecf8] px-4 py-3">
                            {formatKrwCompact(rule.allocatedAmount)}
                          </td>
                          <td className="border-b border-[#e5ecf8] px-4 py-3">
                            {formatKrwCompact(rule.costPoolAmount)}
                          </td>
                          <td
                            className={`border-b border-[#e5ecf8] px-4 py-3 ${diff > 0 ? 'text-[#d14343]' : 'text-[#198b63]'}`}
                          >
                            {diff > 0 ? '+' : ''}
                            {formatKrwCompact(diff)}
                          </td>
                          <td
                            className={`border-b border-[#e5ecf8] px-4 py-3 ${rate > 0 ? 'text-[#d14343]' : 'text-[#198b63]'}`}
                          >
                            {rate.toFixed(2)}%
                          </td>
                          <td className="border-b border-[#e5ecf8] px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                rate > 0
                                  ? 'border-[#f7caca] bg-[#fff0f0] text-[#b64040]'
                                  : 'border-[#b9ecd8] bg-[#ecfbf4] text-[#1f8a63]'
                              }`}
                            >
                              {rate > 0 ? '불리' : '양호'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>

            <section className="grid grid-cols-[2fr_1fr] gap-4 max-[1280px]:grid-cols-1">
              <Panel
                title="본부별 원가 구성"
                subtitle="배부원가 기준 막대 비교"
              >
                <div className="grid gap-2.5">
                  {allocationRows.map((rule) => {
                    const width = Math.round(
                      (rule.allocatedAmount / maxAllocatedAmount) * 100
                    );
                    return (
                      <article
                        key={`${rule.departmentCode}-${rule.basis}`}
                        className="grid gap-2"
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <strong>{rule.departmentCode}</strong>
                          <span className="text-[0.88rem] text-[#7388ac]">
                            {formatKrwCompact(rule.allocatedAmount)}
                          </span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-[#edf2fa]">
                          <span
                            className="block h-full rounded-full bg-[linear-gradient(90deg,#3f79ea,#1db0db)]"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </article>
                    );
                  })}
                </div>
              </Panel>

              <Panel title="원가 배분 시뮬레이터" subtitle="간단 배분 입력 폼">
                <div className="grid gap-2.5">
                  <label className="grid gap-1.5 text-sm text-[#4a6087]">
                    <span className="font-semibold text-[#2a4168]">
                      배분 총액
                    </span>
                    <input
                      className="w-full rounded-[10px] border border-[#cbd6ea] px-3 py-2.5"
                      type="number"
                      placeholder="배분할 총 금액 (예: 100000000)"
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm text-[#4a6087]">
                    <span className="font-semibold text-[#2a4168]">
                      배분 비율 JSON
                    </span>
                    <textarea
                      className="w-full rounded-[10px] border border-[#cbd6ea] px-3 py-2.5 font-mono text-[0.82rem]"
                      rows={6}
                      defaultValue='{"PRJ-001":30,"PRJ-002":20,"PRJ-003":50}'
                    />
                  </label>
                  <article className={miniStatClass}>
                    <strong className="block text-[#1f3458]">
                      입력 가이드
                    </strong>
                    <p className="mt-1 text-xs">
                      키는 코드, 값은 비율(%). 합계 100 기준으로 입력하면 검토가
                      빠릅니다.
                    </p>
                  </article>
                  <button
                    className="rounded-[10px] bg-[#2b4dbf] px-3 py-[11px] font-extrabold text-white"
                    type="button"
                  >
                    배분 계산
                  </button>
                </div>
              </Panel>
            </section>
          </>
        ) : null}

        {!hasSelectedProject && detailStatus !== 'loading' ? (
          <div className={emptyStateClass}>
            <strong className="block text-[1rem] font-semibold text-[#1d2f52]">
              선택된 프로젝트가 없습니다.
            </strong>
            <p className="mt-1 text-sm">
              프로젝트 목록에서 대상을 선택하면 원가 집계·분석 화면이
              활성화됩니다.
            </p>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="grid gap-4">
      <header className="grid gap-4 rounded-2xl border border-[#d7e1f1] bg-white p-5 shadow-[0_8px_22px_rgba(24,40,71,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#6881aa]">
              {workspaceMeta.heroLabel}
            </p>
            <h2 className="mt-1 text-[1.9rem] font-bold text-[#182847]">
              {workspaceMeta.title}
            </h2>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              className="rounded-[10px] border border-[#cbd6ea] bg-white px-3.5 py-2.5 font-bold text-[#2f4570]"
              type="button"
            >
              CSV
            </button>
            <button
              className="rounded-[10px] bg-[#2b4dbf] px-3.5 py-2.5 font-extrabold text-white"
              type="button"
            >
              {workspaceMeta.actionLabel}
            </button>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <h3 className="text-2xl font-bold text-[#182847]">
              {selectedProject?.name ?? '선택된 프로젝트 없음'}
            </h3>
            <p className="mt-2 text-sm text-[#5f7498]">
              {hasSelectedProject && detailStatus === 'ready' && selectedDetail
                ? `${selectedProject?.headquarter} · ${selectedDetail.assetCategory} · ${selectedDetail.headline}`
                : hasSelectedProject
                  ? `${selectedProject?.headquarter} · 상세 데이터 동기화 중`
                  : '포트폴리오에서 프로젝트를 먼저 선택하세요.'}
            </p>
          </div>
          <article className="rounded-xl border border-[#d5e0f1] bg-[#f7faff] p-4 text-[#34496d]">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.04em] text-[#6881aa]">
                최신 스냅샷
              </span>
              <small className="text-xs text-[#6b7fa3]">{snapshotTime}</small>
            </div>
            <strong className="mt-2 block text-base text-[#1f3458]">
              {selectedDetail?.workflow.nextStep ?? '검토 단계 확인 필요'}
            </strong>
            <p className="mt-1 text-sm">{cockpitNextAction}</p>
          </article>
        </div>
      </header>

      {activeView === 'valuation' ? (
        <section
          className="rounded-2xl border border-[#d7e1f1] bg-white p-4 shadow-[0_6px_18px_rgba(24,40,71,0.05)]"
          aria-label="가치평가 프로젝트 탐색기"
        >
          <ValuationProjectExplorer
            projects={portfolioProjects}
            selectedProjectCode={selectedProject?.code ?? null}
            onSelectProject={handleValuationProjectSelect}
            emptyMessage="가치평가 가능한 프로젝트가 없습니다."
          />
        </section>
      ) : null}
      {activeView === 'risk' ? (
        <section
          className="rounded-2xl border border-[#d7e1f1] bg-white p-4 shadow-[0_6px_18px_rgba(24,40,71,0.05)]"
          aria-label="리스크 프로젝트 보드"
        >
          <RiskProjectBoard
            rows={riskProjectRows}
            selectedProjectCode={selectedProject?.code ?? null}
            onSelectProject={handleRiskProjectSelect}
          />
        </section>
      ) : null}

      <div
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="요약 메타 정보"
      >
        {cockpitMetaItems.map((item) => (
          <InfoTile key={item.label} label={item.label} value={item.value} />
        ))}
        <InfoTile
          label="다음 단계"
          value={selectedDetail?.workflow.nextStep ?? '-'}
        />
      </div>
      <div
        className="grid gap-3 md:grid-cols-3"
        aria-label="의사결정 스캔 경로"
      >
        <article className="rounded-2xl border border-[#d7e1f1] bg-white p-4 shadow-[0_6px_18px_rgba(24,40,71,0.05)]">
          <span className="text-xs font-semibold text-[#6c83ab]">01</span>
          <strong className="mt-1 block text-[#1f3458]">핵심 신호</strong>
          <p className="mt-1 text-sm text-[#4a6087]">
            {selectedProject
              ? `${selectedProject.name} 핵심 KPI를 먼저 확인합니다.`
              : '프로젝트를 선택하세요.'}
          </p>
        </article>
        <article className="rounded-2xl border border-[#d7e1f1] bg-white p-4 shadow-[0_6px_18px_rgba(24,40,71,0.05)]">
          <span className="text-xs font-semibold text-[#6c83ab]">02</span>
          <strong className="mt-1 block text-[#1f3458]">의사결정 포인트</strong>
          <p className="mt-1 text-sm text-[#4a6087]">
            {selectedDetail?.workflow.nextStep ?? '다음 결정을 확인합니다.'}
          </p>
        </article>
        <article className="rounded-2xl border border-[#d7e1f1] bg-white p-4 shadow-[0_6px_18px_rgba(24,40,71,0.05)]">
          <span className="text-xs font-semibold text-[#6c83ab]">03</span>
          <strong className="mt-1 block text-[#1f3458]">검증</strong>
          <p className="mt-1 text-sm text-[#4a6087]">
            탭별 근거를 확인한 뒤 승인/보류를 확정합니다.
          </p>
        </article>
      </div>

      <div
        className="rounded-2xl border border-[#d7e1f1] bg-white p-2 shadow-[0_6px_18px_rgba(24,40,71,0.05)]"
        role="tablist"
        aria-label="프로젝트 분석 탭"
      >
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
              className={`inline-flex min-w-[100px] items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                selected
                  ? 'bg-[#2b4dbf] text-white shadow-[0_6px_14px_rgba(43,77,191,0.25)]'
                  : 'text-[#445b83] hover:bg-[#f1f5fc]'
              }`}
              onClick={() => onChangeWorkspaceTab(tab.key)}
              onKeyDown={(event) => onWorkspaceTabKeydown(event, index)}
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
        className="grid gap-5 rounded-2xl border border-[#d7e1f1] bg-[#f7faff] p-5 shadow-[0_8px_22px_rgba(24,40,71,0.06)]"
      >
        {activeView === 'valuation' ? (
          <header className="rounded-2xl border border-[#d8e2f2] bg-white px-4 py-3.5 shadow-[0_4px_14px_rgba(24,40,71,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[#6981a9]">
              Project Detail
            </p>
            <h3 className="mt-1 text-[1.25rem] font-bold text-[#1d3053]">
              프로젝트 상세
            </h3>
            <p className="mt-1 text-sm text-[#60759a]">
              {selectedProject
                ? `${selectedProject.name}의 가치평가 근거와 시나리오를 탭별로 검토합니다.`
                : '상단 탐색기 목록에서 프로젝트를 선택하면 상세 분석이 표시됩니다.'}
            </p>
          </header>
        ) : null}

        {!hasSelectedProject ? (
          <div className={emptyStateClass}>
            <strong className="block text-[1rem] font-semibold text-[#1d2f52]">
              {activeView === 'valuation'
                ? '가치평가 대상 프로젝트를 선택하세요.'
                : '선택된 프로젝트가 없습니다.'}
            </strong>
            <p className="mt-1 text-sm">
              {activeView === 'valuation'
                ? '상단 프로젝트 탐색기에서 행을 클릭하면 프로젝트 상세 분석이 열립니다.'
                : '상단 리스크 프로젝트 테이블에서 행을 클릭하면 상세 분석이 열립니다.'}
            </p>
          </div>
        ) : null}

        {hasSelectedProject && detailStatus === 'loading' ? (
          <div className={statusCardClass} role="status">
            <strong className="block text-[0.98rem] font-semibold text-[#1d2f52]">
              프로젝트 상세 데이터를 불러오는 중입니다.
            </strong>
            <p className="mt-1 text-sm">
              원가, 가치평가, 리스크 정보를 API에서 조회하고 있습니다.
            </p>
          </div>
        ) : null}

        {hasSelectedProject && detailStatus === 'error' ? (
          <div className={emptyStateClass}>
            <strong className="block text-[1rem] font-semibold text-[#1d2f52]">
              프로젝트 상세를 불러오지 못했습니다.
            </strong>
            <p className="mt-1 text-sm">
              {detailError ?? 'API 상태를 확인한 뒤 다시 시도하세요.'}
            </p>
            <button
              type="button"
              onClick={onRetryDetailLoad}
              className={emptyStateButtonClass}
            >
              다시 시도
            </button>
          </div>
        ) : null}

        {hasSelectedProject && detailStatus === 'ready' && !selectedDetail ? (
          <div className={emptyStateClass}>
            <strong className="block text-[1rem] font-semibold text-[#1d2f52]">
              표시할 프로젝트 상세가 없습니다.
            </strong>
            <p className="mt-1 text-sm">
              프로젝트 데이터 구조를 확인한 뒤 다시 시도하세요.
            </p>
            <button
              type="button"
              onClick={onRetryDetailLoad}
              className={emptyStateButtonClass}
            >
              다시 시도
            </button>
          </div>
        ) : null}

        {activeWorkspaceTab === 'allocation' && selectedDetail ? (
          <>
            <section className={kpiGridClass} aria-label="배분 핵심 지표">
              <InfoTile
                label="배분 원가"
                value={formatKrwCompact(
                  selectedDetail.allocation.allocatedCostKrw
                )}
              />
              <InfoTile
                label="표준 원가"
                value={formatKrwCompact(
                  selectedDetail.allocation.standardCostKrw
                )}
              />
              <InfoTile
                label="효율 갭"
                value={formatKrwCompact(
                  selectedDetail.allocation.efficiencyGapKrw
                )}
              />
              <InfoTile
                label="성과 갭"
                value={formatKrwCompact(
                  selectedDetail.allocation.performanceGapKrw
                )}
              />
            </section>
            <section
              className={dominantSurfaceClass}
              aria-label="배분 비교 surface"
            >
              <DecisionBarChart
                title="Cost Driver 기여도"
                subtitle={`총 배분원가 ${formatKrwCompact(selectedDetail.allocation.allocatedCostKrw)}`}
                bars={allocationDecisionBars}
                summary={`표준원가 대비 ${formatKrwCompact(selectedDetail.allocation.efficiencyGapKrw)} 초과 상태`}
              />
            </section>
            <section
              className={supportGridClass}
              aria-label="배분 해석 및 다음 행동"
            >
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
            <section
              className={supportGridClass}
              aria-label="배부 기준과 변경 이력"
            >
              <article className={workflowNoteClass}>
                <strong>계산 근거</strong>
                <p className="mt-2 text-sm">
                  {selectedDetail.allocation.allocationBasis}
                </p>
                <p className="mt-1 text-sm">
                  {selectedDetail.allocation.calculationTrace}
                </p>
              </article>
              <article className={workflowNoteClass}>
                <strong>최근 변경 이력</strong>
                {selectedDetail.allocation.changeHistory.length === 0 ? (
                  <p className="mt-2 text-sm">기록된 변경 이력이 없습니다.</p>
                ) : (
                  <ol className={listClass}>
                    {selectedDetail.allocation.changeHistory
                      .slice(0, 5)
                      .map((history) => (
                        <li
                          key={`${history.at}-${history.actor}-${history.action}`}
                          className={listItemClass}
                        >
                          <strong className="block text-[#1f3458]">
                            {history.actor}
                          </strong>
                          <span className="mt-1 block">
                            {history.action} · {history.comment || '-'}
                          </span>
                          <small className="mt-1 block text-xs text-[#6c82aa]">
                            {new Date(history.at).toLocaleString()}
                          </small>
                        </li>
                      ))}
                  </ol>
                )}
              </article>
            </section>
            <section
              className={dominantSurfaceClass}
              aria-label="배부 규칙 상세"
            >
              <h3>배부 규칙 상세</h3>
              {selectedDetail.allocation.rules.length === 0 ? (
                <p>배부 규칙 상세 데이터가 없습니다.</p>
              ) : (
                <div className={tableShellClass}>
                  <table className={tableClass}>
                    <thead className="bg-[#f1f5fc] text-xs uppercase tracking-[0.03em] text-[#5a7096]">
                      <tr>
                        <th className="border-b border-[#d7e1f1] px-4 py-3 text-left font-semibold">
                          부서
                        </th>
                        <th className="border-b border-[#d7e1f1] px-4 py-3 text-left font-semibold">
                          비용풀
                        </th>
                        <th className="border-b border-[#d7e1f1] px-4 py-3 text-left font-semibold">
                          카테고리
                        </th>
                        <th className="border-b border-[#d7e1f1] px-4 py-3 text-left font-semibold">
                          배부 기준
                        </th>
                        <th className="border-b border-[#d7e1f1] px-4 py-3 text-left font-semibold">
                          배부율
                        </th>
                        <th className="border-b border-[#d7e1f1] px-4 py-3 text-left font-semibold">
                          배부원가
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDetail.allocation.rules.map((rule) => (
                        <tr
                          key={`${rule.departmentCode}-${rule.costPoolName}-${rule.basis}`}
                        >
                          <td className="border-b border-[#e5ecf8] px-4 py-3">
                            {rule.departmentCode}
                          </td>
                          <td className="border-b border-[#e5ecf8] px-4 py-3">
                            {rule.costPoolName}
                          </td>
                          <td className="border-b border-[#e5ecf8] px-4 py-3">
                            {rule.costPoolCategory}
                          </td>
                          <td className="border-b border-[#e5ecf8] px-4 py-3">
                            {rule.basis}
                          </td>
                          <td className="border-b border-[#e5ecf8] px-4 py-3">
                            {formatPercent(rule.allocationRate)}
                          </td>
                          <td className="border-b border-[#e5ecf8] px-4 py-3">
                            {formatKrwCompact(rule.allocatedAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        ) : null}

        {activeWorkspaceTab === 'valuation' && selectedDetail ? (
          <>
            <section className={kpiGridClass} aria-label="가치평가 핵심 지표">
              <InfoTile
                label="공정가치"
                value={formatKrwCompact(selectedDetail.valuation.fairValueKrw)}
              />
              <InfoTile
                label="기준 시나리오 NPV"
                value={formatKrwCompact(valuationExpectedCase?.npvKrw ?? 0)}
              />
              <InfoTile
                label="IRR"
                value={formatPercent(selectedProject?.irr ?? 0)}
              />
              <InfoTile
                label="회수기간"
                value={formatYears(selectedProject?.paybackYears ?? 0)}
              />
            </section>
            <section
              className={dominantSurfaceClass}
              aria-label="시나리오 가치 비교 surface"
            >
              <DecisionBarChart
                title="시나리오 가치 비교"
                subtitle="확률 가중 흐름을 한 화면에서 비교"
                bars={valuationDecisionBars}
                summary={`기준 대비 비관 격차 ${formatKrwCompact(valuationGap)}`}
              />
            </section>
            <section
              className={supportGridClass}
              aria-label="가치평가 보조 정보"
            >
              <DecisionSummary
                title="의사결정 포인트"
                items={[
                  '기준 시나리오를 승인 기준선으로 사용',
                  `비관 시나리오 하방 여유 ${formatKrwCompact(valuationGap)} 확보 필요`,
                  '확률 가정 변경 시 재계산 후 승인'
                ]}
              />
              <article className={workflowNoteClass}>
                <strong>보조 신호 카드</strong>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className={miniStatClass}>
                    <span className="text-xs text-[#6881aa]">신용등급</span>
                    <strong className="mt-1 block text-[#1f3458]">
                      {selectedDetail.valuation.creditGrade}
                    </strong>
                  </div>
                  <div className={miniStatClass}>
                    <span className="text-xs text-[#6881aa]">신용 점수</span>
                    <strong className="mt-1 block text-[#1f3458]">
                      {selectedDetail.valuation.creditRiskScore}점
                    </strong>
                  </div>
                  <div className={miniStatClass}>
                    <span className="text-xs text-[#6881aa]">듀레이션</span>
                    <strong className="mt-1 block text-[#1f3458]">
                      {selectedDetail.valuation.duration}년
                    </strong>
                  </div>
                  <div className={miniStatClass}>
                    <span className="text-xs text-[#6881aa]">컨벡서티</span>
                    <strong className="mt-1 block text-[#1f3458]">
                      {selectedDetail.valuation.convexity}
                    </strong>
                  </div>
                </div>
              </article>
            </section>
            <section className="grid grid-cols-[1.8fr_1fr] gap-4 max-[1280px]:grid-cols-1">
              <Panel
                title="시나리오 가치 분석 테이블"
                subtitle="NPV 및 확률 기여도 비교"
              >
                <div className={tableShellClass}>
                  <table className={tableClass}>
                    <thead className="bg-[#f1f5fc] text-xs uppercase tracking-[0.03em] text-[#5a7096]">
                      <tr>
                        <th className="border-b border-[#d7e1f1] px-4 py-3 text-left font-semibold">
                          시나리오
                        </th>
                        <th className="border-b border-[#d7e1f1] px-4 py-3 text-left font-semibold">
                          확률
                        </th>
                        <th className="border-b border-[#d7e1f1] px-4 py-3 text-left font-semibold">
                          NPV
                        </th>
                        <th className="border-b border-[#d7e1f1] px-4 py-3 text-left font-semibold">
                          확률가중값
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDetail.scenarioReturns.map((scenario) => {
                        const weighted = Math.round(
                          scenario.npvKrw * scenario.probability
                        );
                        const isExpected =
                          scenario.label === valuationExpectedCase?.label;
                        return (
                          <tr
                            key={scenario.label}
                            className={
                              isExpected ? 'bg-[#f3f7ff]' : 'bg-transparent'
                            }
                          >
                            <td className="border-b border-[#e5ecf8] px-4 py-3 font-semibold text-[#2a4168]">
                              {isExpected
                                ? `${scenario.label} (기준)`
                                : scenario.label}
                            </td>
                            <td className="border-b border-[#e5ecf8] px-4 py-3">
                              {formatPercent(scenario.probability)}
                            </td>
                            <td className="border-b border-[#e5ecf8] px-4 py-3">
                              {formatKrwCompact(scenario.npvKrw)}
                            </td>
                            <td className="border-b border-[#e5ecf8] px-4 py-3">
                              {formatKrwCompact(weighted)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#eef3fd] text-[#2a4168]">
                        <td
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.03em]"
                          colSpan={3}
                        >
                          확률가중 합계
                        </td>
                        <td className="px-4 py-3 text-sm font-bold">
                          {formatKrwCompact(
                            Math.round(
                              selectedDetail.scenarioReturns.reduce(
                                (sum, scenario) =>
                                  sum + scenario.npvKrw * scenario.probability,
                                0
                              )
                            )
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Panel>
              <Panel title="평가 판단 패널" subtitle="승인 전 체크 포인트">
                <div className="grid gap-3">
                  <article className={miniStatClass}>
                    <strong className="block text-[#1f3458]">Gap Signal</strong>
                    <p className="mt-1">
                      기준 대비 비관 격차 {formatKrwCompact(valuationGap)}
                    </p>
                  </article>
                  <article className={miniStatClass}>
                    <strong className="block text-[#1f3458]">
                      Valuation Basis
                    </strong>
                    <p className="mt-1">
                      할인율{' '}
                      {formatPercent(selectedDetail.valuation.discountRate)} /
                      리스크 프리미엄{' '}
                      {formatPercent(selectedDetail.valuation.riskPremium)}
                    </p>
                  </article>
                  <article className={miniStatClass}>
                    <strong className="block text-[#1f3458]">
                      Approval Memo
                    </strong>
                    <p className="mt-1">
                      승인 코멘트에 시나리오 근거와 민감도 차이를 함께 남기세요.
                    </p>
                  </article>
                </div>
              </Panel>
            </section>
            <section
              className={supportGridClass}
              aria-label="평가 근거와 시나리오 가정"
            >
              <article className={workflowNoteClass}>
                <strong>평가 근거</strong>
                <p className="mt-2 text-sm">
                  할인율 {formatPercent(selectedDetail.valuation.discountRate)}{' '}
                  · 리스크 프리미엄{' '}
                  {formatPercent(selectedDetail.valuation.riskPremium)}
                </p>
                <p className="mt-1 text-sm">
                  {selectedDetail.valuation.interpretation}
                </p>
              </article>
              <article className={workflowNoteClass}>
                <strong>시나리오 가정</strong>
                {selectedDetail.valuation.assumptions.length === 0 ? (
                  <p className="mt-2 text-sm">
                    등록된 시나리오 가정이 없습니다.
                  </p>
                ) : (
                  <ol className={listClass}>
                    {selectedDetail.valuation.assumptions.map((item) => (
                      <li
                        key={`${item.label}-${item.note}`}
                        className={listItemClass}
                      >
                        <strong className="block text-[#1f3458]">
                          {item.label}
                        </strong>
                        <span className="mt-1 block">
                          NPV {formatKrwCompact(item.npvKrw)} · 확률{' '}
                          {formatPercent(item.probability)}
                        </span>
                        <small className="mt-1 block text-xs text-[#6c82aa]">
                          {item.note || '-'}
                        </small>
                      </li>
                    ))}
                  </ol>
                )}
              </article>
            </section>
          </>
        ) : null}

        {activeWorkspaceTab === 'risk' && selectedDetail ? (
          <>
            <section className={kpiGridClass} aria-label="리스크 핵심 지표">
              <InfoTile
                label="현재 리스크"
                value={selectedProject?.risk ?? '-'}
              />
              <InfoTile
                label="VaR 95%"
                value={formatKrwCompact(selectedDetail.valuation.var95Krw)}
              />
              <InfoTile
                label="CVaR 95%"
                value={formatKrwCompact(selectedDetail.valuation.cvar95Krw)}
              />
              <InfoTile
                label="하방 격차"
                value={formatKrwCompact(riskGuardrailGap)}
              />
            </section>
            <section
              className={dominantSurfaceClass}
              aria-label="하방 노출 surface"
            >
              <DecisionBarChart
                title="하방 노출"
                subtitle="손실 한계와 시나리오 하방을 동시 비교"
                bars={riskDecisionBars}
                summary={`VaR 대비 하방 격차 ${formatKrwCompact(riskGuardrailGap)}`}
              />
            </section>
            <section className={supportGridClass} aria-label="리스크 해석">
              <DecisionSummary
                title="리스크 의미"
                items={[
                  '심각도 등급이 아니라 현금흐름 방어력 확인이 핵심',
                  `하방 격차 ${formatKrwCompact(riskGuardrailGap)}는 승인 임계치 근거`,
                  '손실 허용 범위와 승인 조건을 함께 검증'
                ]}
              />
              <article className={workflowNoteClass}>
                <strong>신호 해석 요약</strong>
                <div className="mt-3 grid gap-2">
                  <div className={miniStatClass}>
                    <span className="text-xs text-[#6881aa]">
                      하방 격차 신호
                    </span>
                    <strong className="mt-1 block text-[#1f3458]">
                      {formatKrwCompact(riskGuardrailGap)}
                    </strong>
                  </div>
                  <div className={miniStatClass}>
                    <span className="text-xs text-[#6881aa]">
                      신용 모니터링
                    </span>
                    <strong className="mt-1 block text-[#1f3458]">
                      {selectedDetail.valuation.creditGrade} ·{' '}
                      {selectedDetail.valuation.creditRiskScore}점
                    </strong>
                  </div>
                  <div className={miniStatClass}>
                    <span className="text-xs text-[#6881aa]">즉시 액션</span>
                    <strong className="mt-1 block text-[#1f3458]">
                      비관 확률 재추정 후 승인 조건 갱신
                    </strong>
                  </div>
                </div>
              </article>
            </section>
            <section className="grid grid-cols-[1.8fr_1fr] gap-4 max-[1280px]:grid-cols-1">
              <Panel
                title="VaR/손실 한계 분석 테이블"
                subtitle="손실 한도와 신용·금리 민감도 점검"
              >
                <div className={tableShellClass}>
                  <table className={tableClass}>
                    <thead className="bg-[#f1f5fc] text-xs uppercase tracking-[0.03em] text-[#5a7096]">
                      <tr>
                        <th className="border-b border-[#d7e1f1] px-4 py-3 text-left font-semibold">
                          지표
                        </th>
                        <th className="border-b border-[#d7e1f1] px-4 py-3 text-left font-semibold">
                          값
                        </th>
                        <th className="border-b border-[#d7e1f1] px-4 py-3 text-left font-semibold">
                          판정
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          label: 'VaR 95%',
                          value: formatKrwCompact(
                            selectedDetail.valuation.var95Krw
                          ),
                          ok:
                            selectedDetail.valuation.var95Krw <=
                            selectedDetail.valuation.fairValueKrw
                        },
                        {
                          label: 'VaR 99%',
                          value: formatKrwCompact(
                            selectedDetail.valuation.var99Krw
                          ),
                          ok:
                            selectedDetail.valuation.var99Krw <=
                            selectedDetail.valuation.fairValueKrw
                        },
                        {
                          label: 'CVaR 95%',
                          value: formatKrwCompact(
                            selectedDetail.valuation.cvar95Krw
                          ),
                          ok:
                            selectedDetail.valuation.cvar95Krw <=
                            selectedDetail.valuation.fairValueKrw
                        },
                        {
                          label: '신용점수',
                          value: `${selectedDetail.valuation.creditRiskScore}점`,
                          ok: selectedDetail.valuation.creditRiskScore >= 70
                        },
                        {
                          label: '듀레이션',
                          value: `${selectedDetail.valuation.duration}년`,
                          ok: selectedDetail.valuation.duration <= 5
                        }
                      ].map((item) => (
                        <tr key={item.label}>
                          <td className="border-b border-[#e5ecf8] px-4 py-3">
                            {item.label}
                          </td>
                          <td className="border-b border-[#e5ecf8] px-4 py-3">
                            {item.value}
                          </td>
                          <td className="border-b border-[#e5ecf8] px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                item.ok
                                  ? 'border-[#b9ecd8] bg-[#ecfbf4] text-[#1f8a63]'
                                  : 'border-[#f7caca] bg-[#fff0f0] text-[#b64040]'
                              }`}
                            >
                              {item.ok ? '관리 범위' : '주의'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
              <Panel title="리스크 대응 패널" subtitle="승인 조건 및 모니터링">
                <div className="grid gap-3">
                  <article className={miniStatClass}>
                    <span className="text-xs font-semibold text-[#6f86ad]">
                      STEP 1
                    </span>
                    <p className="mt-1">
                      하방 격차 {formatKrwCompact(riskGuardrailGap)} 기준으로
                      조건부 한도를 조정합니다.
                    </p>
                  </article>
                  <article className={miniStatClass}>
                    <span className="text-xs font-semibold text-[#6f86ad]">
                      STEP 2
                    </span>
                    <p className="mt-1">
                      신용등급 {selectedDetail.valuation.creditGrade} / 점수{' '}
                      {selectedDetail.valuation.creditRiskScore}점을
                      모니터링합니다.
                    </p>
                  </article>
                  <article className={miniStatClass}>
                    <span className="text-xs font-semibold text-[#6f86ad]">
                      STEP 3
                    </span>
                    <p className="mt-1">
                      다음 승인 단계: {selectedDetail.workflow.nextStep}
                    </p>
                  </article>
                </div>
              </Panel>
            </section>
          </>
        ) : null}

        {activeWorkspaceTab === 'workflow' && selectedDetail ? (
          <>
            <section className={kpiGridClass} aria-label="워크플로우 핵심 지표">
              <InfoTile
                label="현재 단계"
                value={selectedDetail.workflow.currentStage}
              />
              <InfoTile label="담당자" value={selectedDetail.workflow.owner} />
              <InfoTile
                label="검토자"
                value={selectedDetail.workflow.financeReviewer}
              />
              <InfoTile
                label="다음 단계"
                value={selectedDetail.workflow.nextStep}
              />
            </section>
            <section
              className={dominantSurfaceClass}
              aria-label="워크플로우 진행 surface"
            >
              <div className="grid gap-2 sm:grid-cols-4">
                {(['기획', '검토', '승인', '보류'] as const).map((step) => (
                  <div
                    key={step}
                    className={`rounded-xl border px-3 py-2 text-center text-sm font-semibold transition ${
                      selectedDetail.workflow.currentStage === step
                        ? 'border-[#2b4dbf] bg-[#2b4dbf] text-white shadow-[0_6px_14px_rgba(43,77,191,0.25)]'
                        : 'border-[#d5e0f1] bg-[#f8fbff] text-[#41557b]'
                    }`}
                  >
                    {step}
                  </div>
                ))}
              </div>
            </section>
            <section className={supportGridClass} aria-label="워크플로우 상세">
              <article className={workflowNoteClass}>
                <strong>승인 코멘트</strong>
                <p className="mt-2 text-sm">
                  {selectedDetail.workflow.executiveComment}
                </p>
              </article>
              <article className={workflowNoteClass}>
                <strong>다음 행동</strong>
                <p className="mt-2 text-sm">{selectedInsight.nextAction}</p>
              </article>
            </section>
          </>
        ) : null}
      </div>
    </section>
  );
}
