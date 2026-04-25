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
      title: '2. 가치평가·리스크 화면 확인',
      description:
        '선택한 프로젝트 기준으로 가치평가와 VaR 지표를 확인하고 의사결정 신호를 정리합니다.'
    },
    {
      title: '3. 감사 로그로 이력 검증',
      description:
        '승인·수정 이력이 정책에 맞게 기록되었는지 감사 로그에서 점검합니다.'
    }
  ];
  const roleChecklist = [
    {
      role: '관리자',
      guide:
        '권한/메뉴 정책 확인 후 사용자·감사 로그 이상 여부를 먼저 점검합니다.'
    },
    {
      role: '임원',
      guide:
        '프로젝트 목록에서 우선순위 대상을 선택하고 가치평가·리스크 핵심 수치만 빠르게 판단합니다.'
    },
    {
      role: 'PM/원가담당자',
      guide:
        '투자액, 예상매출, 근거 데이터를 최신화하고 검토 상태(검토중/조건부/보류)를 명확히 관리합니다.'
    },
    {
      role: '감사',
      guide:
        '승인·수정 이력이 내부 통제 기준과 일치하는지 감사 로그 중심으로 검증합니다.'
    }
  ];

  return (
    <section className="grid gap-4 xl:grid-cols-[1.15fr_1fr]">
      <Panel
        title="사용 가이드"
        subtitle="실무에서 바로 쓰는 CostWise 운영 절차를 단계별로 안내합니다."
      >
        <div className="grid gap-3 md:grid-cols-4">
          <InfoTile label="현재 역할" value={getRoleLabel(selectedRole)} />
          <InfoTile label="기본 진입" value="프로젝트 목록" />
          <InfoTile label="권장 분석 화면" value="가치평가 / 리스크·VaR" />
          <InfoTile label="플랫폼명" value="CostWise" />
        </div>

        <ol className="mt-4 grid gap-2.5">
          {usageSteps.map((step) => (
            <li
              key={step.title}
              className="rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3.5"
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

        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-blue-700">
            운영 팁
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-700">
            프로젝트 선택 전 필터를 먼저 고정하면 화면 간 이동 시에도 동일한
            운영 컨텍스트를 유지할 수 있습니다.
          </p>
        </div>
      </Panel>

      <Panel
        title="역할별 운영 체크포인트"
        subtitle="역할마다 반드시 확인할 핵심 점검 항목을 간단히 정리했습니다."
      >
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="text-base font-semibold leading-6 text-[#142542]">
            {selectedInsight.headline}
          </p>
          <p className="mt-2 text-sm leading-6 text-cw-muted">
            {selectedInsight.summary}
          </p>

          <ul className="mt-4 grid gap-2">
            {roleChecklist.map((item) => (
              <li
                key={item.role}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  {item.role}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  {item.guide}
                </p>
              </li>
            ))}
          </ul>

          <dl className="mt-4 grid gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm text-cw-muted">
            <div className="grid gap-0.5">
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                현재 역할 다음 액션
              </dt>
              <dd className="font-medium text-[#1f2e4a]">
                {selectedInsight.nextAction}
              </dd>
            </div>
            <div className="grid gap-0.5">
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                현재 역할 리스크 워치
              </dt>
              <dd>{selectedInsight.riskWatch}</dd>
            </div>
          </dl>
        </div>
      </Panel>
    </section>
  );
}
