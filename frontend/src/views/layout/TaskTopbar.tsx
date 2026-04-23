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
  const now = new Date().toLocaleString('sv-SE').replace('T', ' ');
  const pendingCount = Math.max(0, conditionalCount);

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#d4dceb] bg-[#f8fbff] px-4 py-2.5">
      <div className="flex items-center">
        <p className="m-0 text-[0.95rem] font-bold text-[#6c7e9f]">{meta.eyebrow}</p>
      </div>

      <div className="flex items-center gap-2.5">
        <span className="rounded-full border border-[#d8e0ef] bg-[#eff4fb] px-3 py-1.5 text-[0.8rem] font-bold text-[#556a93]">
          {source === 'api'
            ? `${projectCount}개 프로젝트`
            : `CostWise API 일부 제한 · ${projectCount}개 프로젝트`}
        </span>
        {divisionScope ? (
          <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
            <span className="text-xs font-bold text-cw-muted">본부 범위</span>
            <select
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm"
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
        <div className="flex items-center gap-2.5">
          <span
            className="grid h-5 w-5 place-items-center rounded-full bg-[#ef4444] text-[0.72rem] font-extrabold text-white"
            aria-label={`알림 ${pendingCount}건`}
          >
            {pendingCount}
          </span>
          <div className="grid h-[34px] w-[34px] place-items-center rounded-full bg-[linear-gradient(135deg,#2f67e3,#23b3db)] font-extrabold text-white">
            {username.charAt(0)}
          </div>
          <div>
            <strong className="block text-[0.84rem] text-[#182844]">{username}</strong>
            <small className="block text-[0.76rem] tracking-[0.05em] text-[#62759a]">
              {getRoleLabel(selectedRole).toUpperCase()}
            </small>
          </div>
          <span className="text-[0.8rem] text-[#6c7e9f]">{now}</span>
          <button
            className="bg-transparent text-[0.8rem] font-bold text-[#4c5f85]"
            type="button"
            onClick={onLogout}
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
