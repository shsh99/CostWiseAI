import {
  assumptions,
  auditTrail,
  cashFlows,
  costLines,
  projectSummary,
  roles
} from './app/data';
import { MetricCard } from './components/MetricCard';
import { Panel } from './components/Panel';
import { ProgressBar } from './components/ProgressBar';

function currency(value: number) {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0
  }).format(value);
}

export function App() {
  const maxCost = Math.max(...costLines.map((line) => line.cost));
  const totalCost = costLines.reduce((sum, line) => sum + line.cost, 0);
  const totalFreeCashFlow = cashFlows.reduce(
    (sum, item) => sum + item.freeCashFlow,
    0
  );

  return (
    <div className="shell">
      <div className="ambient ambient--one" />
      <div className="ambient ambient--two" />

      <header className="hero">
        <div className="hero__copy">
          <p className="eyebrow">Financial Decision Support Platform</p>
          <h1>
            ABC 원가배분과 DCF 투자평가를 한 화면에서 판단하는 운영 대시보드
          </h1>
          <p className="hero__text">
            보험사와 금융사의 신규 사업을 대상으로, 기획자·재무팀·임원이 같은
            프로젝트를 서로 다른 깊이로 검토할 수 있도록 설계한 의사결정 지원
            화면입니다.
          </p>

          <div className="hero__chips" aria-label="주요 역할">
            {roles.map((role) => (
              <span key={role} className="chip">
                {role}
              </span>
            ))}
          </div>
        </div>

        <aside className="hero__summary">
          <div className="summary-card">
            <div className="summary-card__title">{projectSummary.name}</div>
            <div className="summary-card__grid">
              <div>
                <span>상태</span>
                <strong>{projectSummary.status}</strong>
              </div>
              <div>
                <span>예산</span>
                <strong>{projectSummary.budget}</strong>
              </div>
              <div>
                <span>NPV</span>
                <strong>{projectSummary.npv}</strong>
              </div>
              <div>
                <span>IRR</span>
                <strong>{projectSummary.expectedIRR}</strong>
              </div>
            </div>
          </div>
        </aside>
      </header>

      <main className="layout">
        <section className="metrics">
          <MetricCard
            label="ABC 배분 총액"
            value={currency(totalCost)}
            detail="활동 기준으로 분해된 총 운영비"
            tone="primary"
          />
          <MetricCard
            label="DCF 예상 NPV"
            value={projectSummary.npv}
            detail="할인율 11.5% 기준 순현재가치"
            tone="success"
          />
          <MetricCard
            label="회수기간"
            value={projectSummary.payback}
            detail="누적 현금흐름 기준 회수 시점"
            tone="warning"
          />
        </section>

        <div className="grid">
          <Panel
            title="ABC 원가배분"
            subtitle="부서별 활동과 원가동인을 함께 보여줍니다."
          >
            <div className="stack">
              {costLines.map((line) => (
                <div
                  key={`${line.department}-${line.activity}`}
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
                    value={Math.round(line.cost / 10000)}
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
                  {cashFlows.map((row) => (
                    <tr key={row.year}>
                      <td>{row.year}년</td>
                      <td>{currency(row.revenue)}</td>
                      <td>{currency(row.operatingCashFlow)}</td>
                      <td>{currency(row.freeCashFlow)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mini-summary">
              <div>
                <span>누적 FCF</span>
                <strong>{currency(totalFreeCashFlow)}</strong>
              </div>
              <div>
                <span>승인 판단</span>
                <strong>조건부 진행</strong>
              </div>
            </div>
          </Panel>

          <Panel
            title="가정값"
            subtitle="보안과 감사가 필요한 값만 추려서 보여줍니다."
          >
            <div className="assumption-list">
              {assumptions.map((item) => (
                <div key={item.label} className="assumption-list__item">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="검토 이력" subtitle="누가 무엇을 바꿨는지 추적합니다.">
            <ol className="audit-list">
              {auditTrail.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </Panel>
        </div>
      </main>
    </div>
  );
}
