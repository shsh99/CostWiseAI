import type { RoleInsight, Role } from '../../app/portfolioData';
import { InfoTile } from '../../shared/components/InfoTile';
import { Panel } from '../../shared/components/Panel';

type SettingsViewProps = {
  selectedRole: Role;
  selectedInsight: RoleInsight;
};

export function SettingsView({ selectedRole, selectedInsight }: SettingsViewProps) {
  return (
    <section className="settings-grid">
      <Panel title="Role context" subtitle="역할 전환은 탐색 계층과 분리된 설정/선호 영역에 둡니다.">
        <div className="preference-stack">
          <InfoTile label="현재 역할" value={selectedRole} />
          <InfoTile label="기본 진입" value="Portfolio overview" />
          <InfoTile label="선호 워크스페이스" value="Management Accounting / Financial Evaluation" />
        </div>
      </Panel>
      <Panel title="Role guidance" subtitle="현재 역할이 주로 봐야 할 신호를 설정 영역에서 요약합니다.">
        <div className="insight-card">
          <p className="insight-card__headline">{selectedInsight.headline}</p>
          <p className="insight-card__summary">{selectedInsight.summary}</p>
        </div>
      </Panel>
    </section>
  );
}
