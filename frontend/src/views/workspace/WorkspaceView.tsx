/* eslint-disable no-unused-vars */
import type { KeyboardEvent } from 'react';
import {
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

type WorkspaceTabKey = (typeof detailTabs)[number]['key'];

type WorkspaceViewProps = {
  activeView: 'accounting' | 'valuation';
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
  onRetryDetailLoad(): void;
};

export function WorkspaceView({
  activeView,
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
  onRetryDetailLoad
}: WorkspaceViewProps) {
  const hasSelectedProject = Boolean(selectedProject);

  if (activeView === 'accounting') {
    const allocationRows = selectedDetail?.allocation.rules ?? [];

    return (
      <section className="finops-cost-page">
        <header className="finops-page-header finops-page-header--actions">
          <div>
            <h2>원가 집계·분석</h2>
            <p>본부/프로젝트별 원가 집계 및 표준원가 차이분석</p>
          </div>
          <div className="table-actions">
            <button type="button">CSV</button>
            <button type="button">+ 원가 입력</button>
          </div>
        </header>

        {detailStatus === 'loading' ? (
          <div className="audit-state" role="status">
            <strong>원가 상세 데이터를 불러오는 중입니다.</strong>
            <p>프로젝트 배부 규칙과 집계 데이터를 확인하고 있습니다.</p>
          </div>
        ) : null}

        {detailStatus === 'error' ? (
          <div className="empty-state">
            <strong>원가 데이터를 불러오지 못했습니다.</strong>
            <p>{detailError ?? '잠시 후 다시 시도하세요.'}</p>
            <button type="button" onClick={onRetryDetailLoad}>
              다시 시도
            </button>
          </div>
        ) : null}

        {hasSelectedProject && detailStatus === 'ready' && selectedDetail ? (
          <>
            <Panel title="본부별 원가 차이분석 (실제 vs 표준)" subtitle="선택 프로젝트 기준 배부 규칙">
              <div className="table-shell">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>본부</th>
                      <th>실제원가</th>
                      <th>표준원가</th>
                      <th>차이</th>
                      <th>차이율</th>
                      <th>판정</th>
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
                          <td>{rule.departmentCode}</td>
                          <td>{formatKrwCompact(rule.allocatedAmount)}</td>
                          <td>{formatKrwCompact(rule.costPoolAmount)}</td>
                          <td className={diff > 0 ? 'text-danger' : 'text-success'}>
                            {diff > 0 ? '+' : ''}
                            {formatKrwCompact(diff)}
                          </td>
                          <td className={rate > 0 ? 'text-danger' : 'text-success'}>
                            {rate.toFixed(2)}%
                          </td>
                          <td>
                            <span className={`status-pill status-pill--${rate > 0 ? 'high' : 'low'}`}>
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

            <section className="finops-dashboard-grid">
              <Panel title="본부별 원가 구성" subtitle="배부원가 기준 막대 비교">
                <div className="finops-bar-list">
                  {allocationRows.map((rule) => {
                    const maxAmount = Math.max(
                      1,
                      ...allocationRows.map((row) => row.allocatedAmount)
                    );
                    const width = Math.round((rule.allocatedAmount / maxAmount) * 100);
                    return (
                      <article key={`${rule.departmentCode}-${rule.basis}`} className="finops-bar-item">
                        <div className="finops-bar-item__meta">
                          <strong>{rule.departmentCode}</strong>
                          <span>{formatKrwCompact(rule.allocatedAmount)}</span>
                        </div>
                        <div className="finops-bar-track">
                          <span className="finops-bar-fill" style={{ width: `${width}%` }} />
                        </div>
                      </article>
                    );
                  })}
                </div>
              </Panel>

              <Panel title="원가 배분 시뮬레이터" subtitle="간단 배분 입력 폼">
                <div className="finops-simulator">
                  <input type="number" placeholder="배분할 총 금액 (예: 100000000)" />
                  <textarea rows={6} defaultValue='{"PRJ-001":30,"PRJ-002":20,"PRJ-003":50}' />
                  <button type="button">배분 계산</button>
                </div>
              </Panel>
            </section>
          </>
        ) : null}

        {!hasSelectedProject && detailStatus !== 'loading' ? (
          <div className="empty-state">
            <strong>선택된 프로젝트가 없습니다.</strong>
            <p>프로젝트 목록에서 대상을 선택하면 원가 집계·분석 화면이 활성화됩니다.</p>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="workspace-stage cockpit-stage">
      <div
        className="workspace-stage__summary cockpit-summary-strip"
        aria-label="프로젝트 요약 스트립"
      >
        <div className="cockpit-summary-strip__intro">
          <p className="workspace-stage__eyebrow">
            Financial Evaluation
          </p>
          <h2>{selectedProject?.name ?? '선택된 프로젝트 없음'}</h2>
          <p>
            {hasSelectedProject && detailStatus === 'ready' && selectedDetail
              ? `${selectedProject?.headquarter} · ${selectedDetail.assetCategory} · ${selectedDetail.headline}`
              : hasSelectedProject
                ? `${selectedProject?.headquarter} · API 상세 데이터 동기화 중`
                : '포트폴리오에서 프로젝트를 먼저 선택하세요.'}
          </p>
        </div>
        <div
          className="cockpit-summary-strip__focus"
          aria-label="핵심 신호와 다음 행동"
        >
          <div className="workspace-stage__meta cockpit-summary-strip__kpis">
            {selectedWorkspaceKpis.map((item) => (
              <InfoTile
                key={item.label}
                label={item.label}
                value={item.value}
              />
            ))}
            <InfoTile
              label="다음 단계"
              value={selectedDetail?.workflow.nextStep ?? '-'}
            />
          </div>
          <article className="cockpit-next-action">
            <span>Next action</span>
            <strong>
              {selectedDetail?.workflow.nextStep ?? '검토 단계 확인 필요'}
            </strong>
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
          <p>
            {selectedProject
              ? `${selectedProject.name} 핵심 KPI를 먼저 확인합니다.`
              : '프로젝트를 선택하세요.'}
          </p>
        </article>
        <article className="cockpit-scan-rail__step">
          <span>02</span>
          <strong>Decision point</strong>
          <p>
            {selectedDetail?.workflow.nextStep ?? '다음 결정을 확인합니다.'}
          </p>
        </article>
        <article className="cockpit-scan-rail__step">
          <span>03</span>
          <strong>Validation</strong>
          <p>탭별 근거를 확인한 뒤 승인/보류를 확정합니다.</p>
        </article>
      </div>

      <div
        className="cockpit-tabs"
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
              className={`cockpit-tab ${selected ? 'cockpit-tab--active' : ''}`}
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
        className="cockpit-panel-shell"
      >
        {!hasSelectedProject ? (
          <div className="empty-state">
            <strong>선택된 프로젝트가 없습니다.</strong>
            <p>
              Portfolio 화면에서 프로젝트를 선택하면 상세 분석을 표시합니다.
            </p>
          </div>
        ) : null}

        {hasSelectedProject && detailStatus === 'loading' ? (
          <div className="audit-state" role="status">
            <strong>프로젝트 상세 데이터를 불러오는 중입니다.</strong>
            <p>원가, 가치평가, 리스크 정보를 API에서 조회하고 있습니다.</p>
          </div>
        ) : null}

        {hasSelectedProject && detailStatus === 'error' ? (
          <div className="empty-state">
            <strong>프로젝트 상세를 불러오지 못했습니다.</strong>
            <p>{detailError ?? 'API 상태를 확인한 뒤 다시 시도하세요.'}</p>
            <button type="button" onClick={onRetryDetailLoad}>
              다시 시도
            </button>
          </div>
        ) : null}

        {hasSelectedProject && detailStatus === 'ready' && !selectedDetail ? (
          <div className="empty-state">
            <strong>표시할 프로젝트 상세가 없습니다.</strong>
            <p>프로젝트 데이터 구조를 확인한 뒤 다시 시도하세요.</p>
            <button type="button" onClick={onRetryDetailLoad}>
              다시 시도
            </button>
          </div>
        ) : null}

        {activeWorkspaceTab === 'allocation' && selectedDetail ? (
          <>
            <section className="cockpit-kpi-group" aria-label="배분 핵심 지표">
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
              className="cockpit-dominant-surface"
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
              className="cockpit-support-grid"
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
            <section className="cockpit-support-grid" aria-label="배부 기준과 변경 이력">
              <article className="workflow-note">
                <strong>계산 근거</strong>
                <p>{selectedDetail.allocation.allocationBasis}</p>
                <p>{selectedDetail.allocation.calculationTrace}</p>
              </article>
              <article className="workflow-note">
                <strong>최근 변경 이력</strong>
                {selectedDetail.allocation.changeHistory.length === 0 ? (
                  <p>기록된 변경 이력이 없습니다.</p>
                ) : (
                  <ol className="audit-list">
                    {selectedDetail.allocation.changeHistory
                      .slice(0, 5)
                      .map((history) => (
                        <li
                          key={`${history.at}-${history.actor}-${history.action}`}
                        >
                          <strong>{history.actor}</strong>
                          <span>
                            {history.action} · {history.comment || '-'}
                          </span>
                          <small>{new Date(history.at).toLocaleString()}</small>
                        </li>
                      ))}
                  </ol>
                )}
              </article>
            </section>
            <section
              className="cockpit-dominant-surface"
              aria-label="배부 규칙 상세"
            >
              <h3>배부 규칙 상세</h3>
              {selectedDetail.allocation.rules.length === 0 ? (
                <p>배부 규칙 상세 데이터가 없습니다.</p>
              ) : (
                <div className="table-shell">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>부서</th>
                        <th>비용풀</th>
                        <th>카테고리</th>
                        <th>배부 기준</th>
                        <th>배부율</th>
                        <th>배부원가</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDetail.allocation.rules.map((rule) => (
                        <tr
                          key={`${rule.departmentCode}-${rule.costPoolName}-${rule.basis}`}
                        >
                          <td>{rule.departmentCode}</td>
                          <td>{rule.costPoolName}</td>
                          <td>{rule.costPoolCategory}</td>
                          <td>{rule.basis}</td>
                          <td>{formatPercent(rule.allocationRate)}</td>
                          <td>{formatKrwCompact(rule.allocatedAmount)}</td>
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
            <section
              className="cockpit-kpi-group"
              aria-label="가치평가 핵심 지표"
            >
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
              className="cockpit-dominant-surface"
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
              className="cockpit-support-grid"
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
              <InfoTile
                label="신용등급"
                value={selectedDetail.valuation.creditGrade}
              />
              <InfoTile
                label="Credit Score"
                value={`${selectedDetail.valuation.creditRiskScore}점`}
              />
              <InfoTile
                label="Duration"
                value={`${selectedDetail.valuation.duration}년`}
              />
              <InfoTile
                label="Convexity"
                value={`${selectedDetail.valuation.convexity}`}
              />
            </section>
            <section className="cockpit-support-grid" aria-label="평가 근거와 시나리오 가정">
              <article className="workflow-note">
                <strong>평가 근거</strong>
                <p>
                  할인율 {formatPercent(selectedDetail.valuation.discountRate)} ·
                  리스크 프리미엄{' '}
                  {formatPercent(selectedDetail.valuation.riskPremium)}
                </p>
                <p>{selectedDetail.valuation.interpretation}</p>
              </article>
              <article className="workflow-note">
                <strong>시나리오 가정</strong>
                {selectedDetail.valuation.assumptions.length === 0 ? (
                  <p>등록된 시나리오 가정이 없습니다.</p>
                ) : (
                  <ol className="audit-list">
                    {selectedDetail.valuation.assumptions.map((item) => (
                      <li key={`${item.label}-${item.note}`}>
                        <strong>{item.label}</strong>
                        <span>
                          NPV {formatKrwCompact(item.npvKrw)} · 확률{' '}
                          {formatPercent(item.probability)}
                        </span>
                        <small>{item.note || '-'}</small>
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
            <section
              className="cockpit-kpi-group"
              aria-label="리스크 핵심 지표"
            >
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
              className="cockpit-dominant-surface"
              aria-label="하방 노출 surface"
            >
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
            <section
              className="cockpit-kpi-group"
              aria-label="워크플로우 핵심 지표"
            >
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
              className="cockpit-dominant-surface"
              aria-label="워크플로우 진행 surface"
            >
              <div className="workflow-steps">
                {(['기획', '검토', '승인', '보류'] as const).map((step) => (
                  <div
                    key={step}
                    className={`workflow-step ${
                      selectedDetail.workflow.currentStage === step
                        ? 'workflow-step--active'
                        : ''
                    }`}
                  >
                    {step}
                  </div>
                ))}
              </div>
            </section>
            <section
              className="cockpit-support-grid"
              aria-label="워크플로우 상세"
            >
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
  );
}
