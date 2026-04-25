import type { RoleInsight, Role } from '../../app/portfolioData';
import { getRoleLabel } from '../../features/auth/permissions';
import { Panel } from '../../shared/components/Panel';

type SettingsViewProps = {
  selectedRole: Role;
  selectedInsight: RoleInsight;
};

export function SettingsView({
  selectedRole,
  selectedInsight
}: SettingsViewProps) {
  const selectedRoleLabel = getRoleLabel(selectedRole);
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
      roles: ['ADMIN'],
      role: '관리자',
      guide:
        '권한/메뉴 정책 확인 후 사용자·감사 로그 이상 여부를 먼저 점검합니다.'
    },
    {
      roles: ['EXECUTIVE'],
      role: '임원',
      guide:
        '프로젝트 목록에서 우선순위 대상을 선택하고 가치평가·리스크 핵심 수치만 빠르게 판단합니다.'
    },
    {
      roles: ['PM', 'ACCOUNTANT'],
      role: 'PM/원가담당자',
      guide:
        '투자액, 예상매출, 근거 데이터를 최신화하고 검토 상태(검토중/조건부/보류)를 명확히 관리합니다.'
    },
    {
      roles: ['AUDITOR'],
      role: '감사',
      guide:
        '승인·수정 이력이 내부 통제 기준과 일치하는지 감사 로그 중심으로 검증합니다.'
    }
  ];

  return (
    <section className="grid gap-5 xl:grid-cols-[1.38fr_1fr]">
      <Panel
        title="사용 가이드"
        subtitle="실무에서 바로 쓰는 CostWise 운영 절차를 단계별로 안내합니다."
      >
        <div className="rounded-2xl border border-[#d9e3f1] bg-[linear-gradient(135deg,#f7fafc_0%,#eef4fd_100%)] px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6c7d97]">
            Guide Board
          </p>
          <h3 className="mt-1 text-[29px] font-extrabold leading-[1.2] tracking-[-0.02em] text-[#10213d]">
            설정 전 확인하면
            <br />
            운영 정확도가 올라갑니다.
          </h3>
          <p className="mt-2 text-[14px] leading-6 text-[#5e708b]">
            역할별 기준 화면과 검토 절차를 짧은 카드로 정리했습니다.
          </p>
        </div>

        <ul className="mt-3.5 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          <li className="rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[#6d7f99]">
              현재 역할
            </p>
            <p className="mt-1 text-[15px] font-semibold text-[#132744]">
              {selectedRoleLabel}
            </p>
          </li>
          <li className="rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[#6d7f99]">
              기본 진입
            </p>
            <p className="mt-1 text-[15px] font-semibold text-[#132744]">
              프로젝트 목록
            </p>
          </li>
          <li className="rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[#6d7f99]">
              권장 분석
            </p>
            <p className="mt-1 text-[15px] font-semibold text-[#132744]">
              가치평가 / 리스크·VaR
            </p>
          </li>
          <li className="rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[#6d7f99]">
              플랫폼명
            </p>
            <p className="mt-1 text-[15px] font-semibold text-[#132744]">
              CostWise
            </p>
          </li>
        </ul>

        <ol className="mt-4 grid gap-2.5">
          {usageSteps.map((step) => (
            <li
              key={step.title}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            >
              <div className="flex gap-3">
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-[#c7d6eb] bg-[#edf3fc] px-1.5 text-[12px] font-bold text-[#365a84]">
                  {step.title.split('.')[0]}
                </span>
                <div>
                  <strong className="block text-sm font-semibold text-[#142542]">
                    {step.title.replace(/^\d+\.\s*/, '')}
                  </strong>
                  <p className="mt-1 text-sm leading-6 text-cw-muted">
                    {step.description}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-4 rounded-xl border border-[#cfe0f6] bg-[#f2f7ff] px-4 py-3.5">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#275382]">
            운영 팁
          </p>
          <p className="mt-1 text-sm leading-6 text-[#334a68]">
            프로젝트 선택 전 필터를 먼저 고정하면 화면 간 이동 시에도 동일한
            운영 컨텍스트를 유지할 수 있습니다.
          </p>
        </div>
      </Panel>

      <Panel
        title="역할별 운영 체크포인트"
        subtitle="역할마다 반드시 확인할 핵심 점검 항목을 간단히 정리했습니다."
      >
        <div className="grid gap-3.5">
          <div className="rounded-2xl border border-[#cedcf2] bg-[linear-gradient(135deg,#f5f9ff_0%,#edf4ff_100%)] px-[18px] py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[#5a7295]">
              선택 역할 요약 · {selectedRoleLabel}
            </p>
            <p className="mt-1 text-[17px] font-semibold leading-7 text-[#132744]">
              {selectedInsight.headline}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#5c6f8a]">
              {selectedInsight.summary}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.09em] text-[#6d809b]">
              역할별 체크리스트
            </h3>
          </div>

          <ul className="grid gap-2.5">
            {roleChecklist.map((item) => {
              const isSelected = item.roles.includes(selectedRole);
              return (
                <li
                  key={item.role}
                  className={`rounded-xl px-3.5 py-3 ${
                    isSelected
                      ? 'border border-[#9eb8da] bg-[#edf4ff]'
                      : 'border border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      {item.role}
                    </p>
                    {isSelected ? (
                      <span className="rounded-md border border-[#b5c8e5] bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#436a99]">
                        현재 역할
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-700">
                    {item.guide}
                  </p>
                </li>
              );
            })}
          </ul>

          <dl className="grid gap-2 rounded-xl border border-[#d5dfed] bg-[#f9fbff] p-3.5 text-sm text-cw-muted">
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
