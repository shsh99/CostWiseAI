import { useEffect, useMemo, useState } from 'react';
import {
  buildDecisionSignals,
  defaultPortfolioSummary,
  loadPortfolioSummary,
  roleInsights,
  type PortfolioSummary,
  type Role
} from './app/portfolioData';
import { formatDateTime, formatKrw, formatPercent, formatYears } from './app/format';
import { MetricCard } from './components/MetricCard';
import { Panel } from './components/Panel';
import { ProgressBar } from './components/ProgressBar';

export function App() {
  const [selectedRole, setSelectedRole] = useState<Role>('임원');
  const [portfolio, setPortfolio] = useState<PortfolioSummary>(defaultPortfolioSummary);
  const [source, setSource] = useState<'api' | 'local'>('local');

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

  const selectedInsight = roleInsights[selectedRole];
  const latestAudit = portfolio.auditEvents.at(-1);
  const maxHeadquarterInvestment = useMemo(
    () =>
      Math.max(
        ...portfolio.headquarters.map((headquarter) => headquarter.totalInvestmentKrw)
      ),
    [portfolio.headquarters]
  );
  const decisionSignals = useMemo(
    () => buildDecisionSignals(portfolio),
    [portfolio]
  );

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
            5개 본부, 20개 프로젝트의 원가와 수익성을 한 화면에서 판단
          </h1>
          <p className="hero__text">
            보험사/금융사의 전사 포트폴리오를 대상으로 ABC 원가배분과 DCF 투자평가를
            함께 보여주는 의사결정 화면입니다. 본부별 자원 투입과 프로젝트별 타당성을
            동시에 읽을 수 있게 설계했습니다.
          </p>

          <div className="hero__meta" aria-label="포트폴리오 요약">
            <span className="status-pill status-pill--active">{portfolio.status}</span>
            <span className="hero__meta-item">Owner · {portfolio.owner}</span>
            <span className="hero__meta-item">Risk · {portfolio.risk}</span>
            <span className="hero__meta-item">Source · {source === 'api' ? '백엔드 연동' : '로컬 시드'}</span>
          </div>
        </div>

        <aside className="hero__summary">
          <div className="summary-card">
            <div className="summary-card__title">{portfolio.portfolioName}</div>
            <div className="summary-card__grid">
              <div>
                <span>본부 수</span>
                <strong>{portfolio.overview.headquarterCount}개</strong>
              </div>
              <div>
                <span>프로젝트 수</span>
                <strong>{portfolio.overview.projectCount}개</strong>
              </div>
              <div>
                <span>평균 IRR</span>
                <strong>{formatPercent(portfolio.overview.averageIrr)}</strong>
              </div>
              <div>
                <span>평균 회수기간</span>
                <strong>{formatYears(portfolio.overview.averagePaybackYears)}</strong>
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
            label="총 투자액"
            value={formatKrw(portfolio.overview.totalInvestmentKrw)}
            detail="20개 프로젝트의 누적 투자 규모"
            tone="primary"
          />
          <MetricCard
            label="총 예상수익"
            value={formatKrw(portfolio.overview.totalExpectedRevenueKrw)}
            detail="가정 시나리오 기준 추정 수익"
            tone="success"
          />
          <MetricCard
            label="평균 NPV"
            value={formatKrw(portfolio.overview.averageNpvKrw)}
            detail="프로젝트 평균 순현재가치"
            tone="warning"
          />
          <MetricCard
            label="승인 / 조건부"
            value={`${portfolio.overview.approvedCount} / ${portfolio.overview.conditionalCount}`}
            detail="승인 완료와 추가 검토 대상의 수"
            tone="primary"
          />
        </section>

        <section className="role-tabs" aria-label="검토 역할 전환">
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

        <section className="dashboard">
          <div className="dashboard__main">
            <Panel
              title="본부별 현황"
              subtitle="5개 본부의 투자 규모와 평균 NPV를 함께 보여줍니다."
            >
              <div className="headquarter-grid">
                {portfolio.headquarters.map((headquarter) => (
                  <article key={headquarter.code} className="headquarter-card">
                    <div className="headquarter-card__header">
                      <div>
                        <strong>{headquarter.name}</strong>
                        <span>{headquarter.projectCount}개 프로젝트</span>
                      </div>
                      <span className={`status-pill status-pill--${headquarter.risk === '높음' ? 'high' : headquarter.risk === '중간' ? 'mid' : 'low'}`}>
                        {headquarter.risk}
                      </span>
                    </div>
                    <div className="headquarter-card__metrics">
                      <div>
                        <span>총 투자액</span>
                        <strong>{formatKrw(headquarter.totalInvestmentKrw)}</strong>
                      </div>
                      <div>
                        <span>평균 NPV</span>
                        <strong>{formatKrw(headquarter.averageNpvKrw)}</strong>
                      </div>
                    </div>
                    <ProgressBar
                      label="투자 비중"
                      value={Math.round(headquarter.totalInvestmentKrw / 10000)}
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
              title="프로젝트 랭킹"
              subtitle="NPV 기준으로 20개 프로젝트를 정렬해 전사 우선순위를 읽습니다."
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
                      <th>IRR</th>
                      <th>회수기간</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.projects.map((project) => (
                      <tr key={project.code}>
                        <td>{project.rank}</td>
                        <td>
                          <strong>{project.name}</strong>
                          <div className="table-subtle">{project.code}</div>
                        </td>
                        <td>{project.headquarter}</td>
                        <td>
                          <span
                            className={`status-pill status-pill--${
                              project.status === '승인'
                                ? 'low'
                                : project.status === '조건부 진행'
                                  ? 'mid'
                                  : project.status === '검토중'
                                    ? 'active'
                                    : 'high'
                            }`}
                          >
                            {project.status}
                          </span>
                        </td>
                        <td>{formatKrw(project.npvKrw)}</td>
                        <td>{formatPercent(project.irr)}</td>
                        <td>{formatYears(project.paybackYears)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mini-summary">
                <div>
                  <span>최상위 프로젝트</span>
                  <strong>{portfolio.projects[0]?.name ?? '없음'}</strong>
                </div>
                <div>
                  <span>하위 프로젝트</span>
                  <strong>{portfolio.projects.at(-1)?.name ?? '없음'}</strong>
                </div>
              </div>
            </Panel>
          </div>

          <aside className="dashboard__side" aria-label="세부 검토 패널">
            <Panel
              title={`역할별 검토 패널 · ${selectedRole}`}
              subtitle="같은 포트폴리오를 다른 관점에서 봅니다."
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
              subtitle="투자 판단에 직접 영향을 주는 핵심 가정만 노출합니다."
            >
              <div className="assumption-list">
                {portfolio.assumptions.map((item) => (
                  <div key={item.label} className="assumption-list__item">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="검토 이력" subtitle="누가 무엇을 바꿨는지 추적합니다.">
              <ol className="audit-list">
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
          </aside>
        </section>
      </main>
    </div>
  );
}
