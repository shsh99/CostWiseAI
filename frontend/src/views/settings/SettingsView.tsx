import type { RoleInsight, Role } from '../../app/portfolioData';
import { getRoleLabel } from '../../features/auth/permissions';
import { InfoTile } from '../../shared/components/InfoTile';
import { Panel } from '../../shared/components/Panel';

type SettingsViewProps = {
  selectedRole: Role;
  selectedInsight: RoleInsight;
};

export function SettingsView({ selectedRole, selectedInsight }: SettingsViewProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Panel title="Role context" subtitle="역할 전환은 탐색 계층과 분리된 설정/선호 영역에 둡니다.">
        <div className="grid gap-3">
          <InfoTile label="현재 역할" value={getRoleLabel(selectedRole)} />
          <InfoTile label="기본 진입" value="Portfolio overview" />
          <InfoTile label="선호 워크스페이스" value="Management Accounting / Financial Evaluation" />
        </div>
      </Panel>
      <Panel title="Role guidance" subtitle="현재 역할이 주로 봐야 할 신호를 설정 영역에서 요약합니다.">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="text-base font-semibold leading-6 text-[#142542]">
            {selectedInsight.headline}
          </p>
          <p className="mt-2 text-sm leading-6 text-cw-muted">{selectedInsight.summary}</p>
        </div>
      </Panel>
    </section>
  );
}
