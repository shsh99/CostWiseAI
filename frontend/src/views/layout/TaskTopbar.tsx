/* eslint-disable no-unused-vars */
import {
  roleInsights,
  type DataSource,
  type ProjectSummary,
  type Role
} from '../../app/portfolioData';

type TaskTopbarProps = {
  selectedRole: Role;
  onChangeRole(role: Role): void;
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
};

export function TaskTopbar({
  selectedRole,
  onChangeRole,
  source,
  projectCount,
  conditionalCount,
  selectedProject,
  meta
}: TaskTopbarProps) {
  return (
    <header className="topbar topbar--task-first">
      <div className="topbar__context">
        <p className="topbar__eyebrow">{meta.eyebrow}</p>
        <div className="breadcrumb" aria-label="현재 위치">
          {meta.breadcrumb.map((item, index) => (
            <span key={item} className="breadcrumb__item">
              {index > 0 ? (
                <span className="breadcrumb__divider">/</span>
              ) : null}
              {item}
            </span>
          ))}
        </div>
        <h1>{meta.title}</h1>
        <p className="topbar__description">{meta.description}</p>
      </div>

      <div className="topbar__cluster">
        <div className="context-pills" aria-label="운영 컨텍스트">
          <span className="context-pill">{dataSourceLabel(source)}</span>
          <span className="context-pill">{projectCount}개 프로젝트</span>
          <span className="context-pill">{conditionalCount}개 승인 대기</span>
        </div>
        <div
          className="role-switcher"
          role="tablist"
          aria-label="역할 컨텍스트"
        >
          {(Object.keys(roleInsights) as Role[]).map((role) => (
            <button
              key={role}
              type="button"
              className={`role-switcher__item ${selectedRole === role ? 'role-switcher__item--active' : ''}`}
              aria-pressed={selectedRole === role}
              onClick={() => onChangeRole(role)}
            >
              {role}
            </button>
          ))}
        </div>
        {selectedProject ? (
          <div className="project-context">
            <span>Selected project</span>
            <strong>{selectedProject.name}</strong>
            <small>
              {selectedProject.code} · {selectedProject.headquarter} ·{' '}
              {selectedProject.status}
            </small>
          </div>
        ) : null}
      </div>
    </header>
  );
}

function dataSourceLabel(source: DataSource) {
  if (source === 'api') {
    return '백엔드 연동';
  }

  if (source === 'mixed') {
    return 'API/로컬 혼합';
  }

  return '로컬 시드';
}
