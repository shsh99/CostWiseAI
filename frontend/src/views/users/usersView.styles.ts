export type UserStatusTone = 'active' | 'low' | 'mid' | 'high';

export const stateBoxClass =
  'grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4';
export const stateButtonClass =
  'inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100';
export const actionButtonBaseClass =
  'inline-flex h-10 items-center justify-center rounded-md border px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-45';
export const secondaryActionButtonClass = `${actionButtonBaseClass} border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50`;
export const primaryActionButtonClass = `${actionButtonBaseClass} border-slate-900 bg-slate-900 text-white hover:bg-slate-800`;
export const controlSurfaceClass =
  'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200';
export const formClass = 'mt-4 grid gap-4';
export const formGridClass = 'grid gap-3 sm:grid-cols-2';
export const formFieldClass =
  'grid gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3';
export const formFieldWideClass = `${formFieldClass} sm:col-span-2`;
export const formFieldLabelClass =
  'text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500';
export const formActionsClass =
  'flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between';

export function tonePillClass(tone: UserStatusTone) {
  if (tone === 'low') {
    return 'inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700';
  }
  if (tone === 'mid') {
    return 'inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700';
  }
  if (tone === 'high') {
    return 'inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700';
  }
  return 'inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700';
}
