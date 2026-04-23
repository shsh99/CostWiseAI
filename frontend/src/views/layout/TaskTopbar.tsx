/* eslint-disable no-unused-vars */
import { type DataSource, type ProjectSummary, type Role } from '../../app/portfolioData';
import { getRoleLabel } from '../../features/auth/permissions';

type TaskTopbarProps = {
  selectedRole: Role;
  username: string;
  divisionScope: string | null;
  divisionOptions: string[];
  onChangeDivision(division: string | null): void;
  source: DataSource;
  projectCount: number;
  conditionalCount: number;
  selectedProject: ProjectSummary | null;
  meta: {
    eyebrow: string;
    title: string;
    description: string;
    breadcrumb: string[];
  };
  onLogout(): void;
};

export function TaskTopbar({
  selectedRole,
  username,
  divisionScope,
  divisionOptions,
  onChangeDivision,
  source,
  projectCount,
  conditionalCount,
  selectedProject,
  meta,
  onLogout
}: TaskTopbarProps) {
  return (
    <header className="topbar topbar--finops">
      <div className="topbar__context">
        <p className="topbar__eyebrow">{meta.eyebrow}</p>
        <h1>{meta.title}</h1>
        <p className="topbar__description">{meta.description}</p>
      </div>

      <div className="topbar__cluster">
        <span className="topbar-system-pill">
          {source === 'api'
            ? `${projectCount}개 프로젝트`
            : `API 일부 제한 · ${projectCount}개 프로젝트`}
        </span>
        {divisionScope ? (
          <label className="topbar-division-scope">
            <span>본부 범위</span>
            <select
              value={divisionScope}
              onChange={(event) => onChangeDivision(event.target.value)}
            >
              {divisionOptions.map((division) => (
                <option key={division} value={division}>
                  {division}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="topbar-user">
          <span className="topbar-user__bell" aria-hidden="true">
            ●
          </span>
          <div className="topbar-user__avatar">{username.charAt(0)}</div>
          <div>
            <strong>{username}</strong>
            <small>{getRoleLabel(selectedRole)}</small>
          </div>
          <button type="button" onClick={onLogout}>
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
