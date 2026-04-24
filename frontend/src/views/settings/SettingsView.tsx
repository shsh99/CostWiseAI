import type { RoleInsight, Role } from '../../app/portfolioData';
import { getRoleLabel } from '../../features/auth/permissions';
import { InfoTile } from '../../shared/components/InfoTile';
import { Panel } from '../../shared/components/Panel';

type SettingsViewProps = {
  selectedRole: Role;
  selectedInsight: RoleInsight;
};

export function SettingsView({
  selectedRole,
  selectedInsight
}: SettingsViewProps) {
  const usageSteps = [
    {
      title: '1. 프로젝트 목록에서 대상 선택',
      description:
        '프로젝트 목록 화면에서 본부/상태 필터를 적용하고 검토 대상을 선택합니다.'
    },
    {
      title: '2. 가치평가·리스크 레인 확인',
      description:
        '선택한 프로젝트 기준으로 가치평가와 VaR 지표를 확인하고 의사결정 신호를 정리합니다.'
    },
    {
      title: '3. 감사 로그로 이력 검증',
      description:
        '승인·수정 이력이 정책에 맞게 기록되었는지 감사 로그에서 점검합니다.'
    }
  ];

  return (
    <section className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
      <Panel
        title="사용 가이드"
        subtitle="CostWise 운영 흐름과 역할별 기본 진입 절차를 안내합니다."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <InfoTile label="현재 역할" value={getRoleLabel(selectedRole)} />
          <InfoTile label="기본 진입" value="프로젝트 목록" />
          <InfoTile label="권장 분석 레인" value="가치평가 / 리스크·VaR" />
          <InfoTile label="플랫폼명" value="CostWise" />
        </div>

        <ol className="mt-4 grid gap-2.5">
          {usageSteps.map((step) => (
            <li
              key={step.title}
              className="rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3"
            >
              <strong className="block text-sm font-semibold text-[#142542]">
                {step.title}
              </strong>
              <p className="mt-1 text-sm leading-6 text-cw-muted">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel
        title="역할별 운영 포커스"
        subtitle="현재 역할의 핵심 시그널과 다음 액션을 설정 화면에서 고정해 확인합니다."
      >
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="text-base font-semibold leading-6 text-[#142542]">
            {selectedInsight.headline}
          </p>
          <p className="mt-2 text-sm leading-6 text-cw-muted">
            {selectedInsight.summary}
          </p>
          <dl className="mt-4 grid gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm text-cw-muted">
            <div className="grid gap-0.5">
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                다음 액션
              </dt>
              <dd className="font-medium text-[#1f2e4a]">
                {selectedInsight.nextAction}
              </dd>
            </div>
            <div className="grid gap-0.5">
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                리스크 워치
              </dt>
              <dd>{selectedInsight.riskWatch}</dd>
            </div>
          </dl>
        </div>
      </Panel>
    </section>
  );
}
