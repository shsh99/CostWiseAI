/* eslint-disable no-unused-vars */
import {
  type DataSource,
  type ProjectSummary,
  type Role
} from '../../app/portfolioData';
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
    <header className="sticky top-0 z-10 flex min-h-[68px] items-center justify-between gap-4 border-b border-[#d9e1ee] bg-[#f3f7fc] px-5 py-2.5">
      <div className="flex items-center pl-0.5">
        <p className="m-0 text-[0.74rem] font-extrabold tracking-[0.06em] text-[#6e82a8]">
          {meta.eyebrow}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="rounded-full border border-[#ced8e8] bg-white px-3 py-1.5 text-[0.73rem] font-bold tracking-[0.01em] text-[#4e658f]">
          {source === 'api'
            ? `CostWise API 정상 연결 · ${projectCount}개 프로젝트`
            : `CostWise API 일부 제한 · ${projectCount}개 프로젝트`}
        </span>
        {divisionScope ? (
          <label className="inline-flex items-center gap-2 rounded-full border border-[#ced8e8] bg-white px-3 py-1.5">
            <span className="text-[0.71rem] font-extrabold tracking-[0.03em] text-cw-muted">
              본부 범위
            </span>
            <select
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[0.81rem] text-[#1e2f4c]"
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
        <div className="flex items-center gap-2 rounded-full border border-[#d3dae9] bg-white px-2.5 py-1.5">
          <span
            className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#e53935] px-1 text-[0.64rem] font-extrabold leading-none text-white ring-2 ring-white"
            aria-label={`알림 ${pendingCount}건`}
          >
            {pendingCount}
          </span>
          <div className="grid h-[31px] w-[31px] place-items-center rounded-full bg-[linear-gradient(135deg,#2f67e3,#25afd7)] text-[0.8rem] font-extrabold text-white">
            {username.charAt(0)}
          </div>
          <div className="pr-1">
            <strong className="block text-[0.8rem] leading-tight text-[#182844]">
              {username}
            </strong>
            <small className="block text-[0.71rem] tracking-[0.01em] text-[#63769b]">
              {getRoleLabel(selectedRole)}
            </small>
          </div>
          <span className="whitespace-nowrap border-l border-[#e1e6f0] pl-2 text-[0.73rem] text-[#63779f]">
            {now}
          </span>
          <button
            className="whitespace-nowrap rounded-full border border-[#cbd5e6] bg-[#f7f9fc] px-2.5 py-1 text-[0.72rem] font-bold text-[#4f6289] transition-colors hover:bg-[#edf2f9]"
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
