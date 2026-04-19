import { useMemo, useState } from 'react';
import {
  dashboardData,
  decisionSignals,
  roleInsights,
  type Role
} from './app/data';
import {
  formatDateTime,
  formatKrw,
  formatPercent,
  formatYears
} from './app/format';
import { MetricCard } from './components/MetricCard';
import { Panel } from './components/Panel';
import { ProgressBar } from './components/ProgressBar';

export function App() {
  const [selectedRole, setSelectedRole] = useState<Role>('임원');

  const totalCost = useMemo(
    () => dashboardData.abc.lines.reduce((sum, line) => sum + line.costKrw, 0),
    []
  );

  const totalFreeCashFlow = useMemo(
    () =>
      dashboardData.dcf.years.reduce(
        (sum, year) => sum + year.freeCashFlowKrw,
        0
      ),
    []
  );

  const maxCost = useMemo(
    () => Math.max(...dashboardData.abc.lines.map((line) => line.costKrw)),
    []
  );

  const selectedInsight = roleInsights[selectedRole];
  const latestAudit = dashboardData.audit.events.at(-1);

  return (
    <div className="shell">
      <a className="skip-link" href="#main-content">
        본문으로 건너뛰기
      </a>
      <div className="ambient ambient--one" />
      <div className="ambient ambient--two" />

      <header className="hero">
        <div className="hero__copy">
          <p className="eyebrow">Financial Decision Support Platform</p>
          <h1>
            보험사/금융사 신규 사업의 ABC 원가배분과 DCF 투자평가를 한 화면에서
            판단
          </h1>
          <p className="hero__text">
            기획자, 재무팀, 임원이 같은 프로젝트를 서로 다른 깊이로 검토하도록
            설계한 의사결정 화면입니다. 입력값은 간결하게, 판단 근거는 선명하게
            보여줍니다.
          </p>

          <div className="hero__meta" aria-label="프로젝트 요약">
            <span className="status-pill status-pill--active">
              {dashboardData.project.status}
            </span>
            <span className="hero__meta-item">
              Owner · {dashboardData.project.owner}
            </span>
            <span className="hero__meta-item">
              Risk · {dashboardData.project.risk}
            </span>
          </div>
        </div>

        <aside className="hero__summary">
          <div className="summary-card">
            <div className="summary-card__title">{dashboardData.project.name}</div>
              <div className="summary-card__grid">
                <div>
                  <span>예산</span>
                  <strong>{formatKrw(dashboardData.project.budgetKrw)}</strong>
                </div>
                <div>
                  <span>NPV</span>
                  <strong>{formatKrw(dashboardData.project.npvKrw)}</strong>
                </div>
                <div>
                  <span>IRR</span>
                  <strong>{formatPercent(dashboardData.project.expectedIrr)}</strong>
                </div>
                <div>
                  <span>회수기간</span>
                  <strong>{formatYears(dashboardData.project.paybackYears)}</strong>
                </div>
              </div>
            <div className="summary-card__footer">
              {decisionSignals.map((signal) => (
                <div key={signal.label} className="summary-chip">
                  <span>{signal.label}</span>
                  <strong>{signal.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </header>

      <main id="main-content" className="layout">
        <section className="metrics" aria-label="핵심 지표">
          <MetricCard
            label="ABC 배분 총액"
            value={formatKrw(totalCost)}
            detail="활동 기준으로 분해된 총 운영비"
            tone="primary"
          />
          <MetricCard
            label="DCF 예상 NPV"
            value={formatKrw(dashboardData.project.npvKrw)}
            detail="할인율 11.5% 기준 순현재가치"
            tone="success"
          />
          <MetricCard
            label="회수기간"
            value={formatYears(dashboardData.project.paybackYears)}
            detail={`누적 자유현금흐름 ${formatKrw(totalFreeCashFlow)}`}
            tone="warning"
          />
        </section>

        <section className="role-tabs" aria-label="검토 역할 전환">
          {dashboardData.roles.map((role) => (
            <button
              key={role}
              type="button"
              className={`role-tab ${role === selectedRole ? 'role-tab--active' : ''}`}
              aria-pressed={role === selectedRole}
              onClick={() => setSelectedRole(role)}
            >
              <span>{role}</span>
              <small>{roleInsights[role].headline}</small>
            </button>
          ))}
        </section>

        <section className="dashboard">
          <div className="dashboard__main">
            <Panel
              title="ABC 원가배분"
              subtitle="부서별 활동과 원가동인을 함께 보여줍니다."
            >
              <div className="stack">
                {dashboardData.abc.lines.map((line) => (
                  <div
                    key={line.id}
                    className="allocation-row"
                  >
                    <div className="allocation-row__meta">
                      <strong>{line.department}</strong>
                      <span>
                        {line.activity} · 기준: {line.driver}
                      </span>
                    </div>
                    <ProgressBar
                      label="배부 금액"
                      value={Math.round(line.costKrw / 10000)}
                      max={Math.round(maxCost / 10000)}
                      tone={
                        line.department.includes('보안')
                          ? 'rose'
                          : line.department.includes('데이터')
                            ? 'teal'
                            : 'violet'
                      }
                    />
                  </div>
                ))}
              </div>
            </Panel>

            <Panel
              title="DCF 현금흐름 시나리오"
              subtitle="사업 1건, 5개년 가정으로 타당성을 빠르게 봅니다."
            >
              <div className="table-shell">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>연도</th>
                      <th>매출</th>
                      <th>영업현금흐름</th>
                      <th>자유현금흐름</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.dcf.years.map((row) => (
                      <tr key={row.year}>
                        <td>{row.year}년</td>
                        <td>{formatKrw(row.revenueKrw)}</td>
                        <td>{formatKrw(row.operatingCashFlowKrw)}</td>
                        <td>{formatKrw(row.freeCashFlowKrw)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mini-summary">
                <div>
                  <span>누적 FCF</span>
                  <strong>{formatKrw(totalFreeCashFlow)}</strong>
                </div>
                <div>
                  <span>승인 판단</span>
                  <strong>{dashboardData.project.status}</strong>
                </div>
              </div>
            </Panel>
          </div>

          <aside className="dashboard__side" aria-label="세부 검토 패널">
            <Panel
              title={`역할별 검토 패널 · ${selectedRole}`}
              subtitle="역할을 전환해 같은 사업안을 다른 관점에서 봅니다."
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
                    <dt>마지막 변경</dt>
                    <dd>{latestAudit?.action ?? '변경 없음'}</dd>
                  </div>
                </dl>
              </div>
            </Panel>

            <Panel
              title="가정값"
              subtitle="보안과 감사가 필요한 값만 추려서 보여줍니다."
            >
              <div className="assumption-list">
                {dashboardData.assumptions.map((item) => (
                  <div key={item.id} className="assumption-list__item">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel
              title="검토 이력"
              subtitle="누가 무엇을 바꿨는지 추적합니다."
            >
              <ol className="audit-list">
                {dashboardData.audit.events.map((item) => (
                  <li key={item.id}>
                    <strong>{item.actor}</strong>
                    <span>{item.action}</span>
                    <small>{formatDateTime(item.at)}</small>
                  </li>
                ))}
              </ol>
            </Panel>
          </aside>
        </section>
      </main>
    </div>
  );
}
