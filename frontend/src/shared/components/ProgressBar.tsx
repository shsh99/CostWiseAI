type ProgressBarProps = {
  label: string;
  value: number;
  max: number;
  tone?: 'amber' | 'violet' | 'teal' | 'rose';
};

const toneStyles: Record<NonNullable<ProgressBarProps['tone']>, string> = {
  amber: 'bg-[linear-gradient(90deg,#d89520,#efc87b)]',
  violet: 'bg-[linear-gradient(90deg,#5c6fff,#9ea9ff)]',
  teal: 'bg-[linear-gradient(90deg,#2bb6a4,#77d9c8)]',
  rose: 'bg-[linear-gradient(90deg,#dc6271,#f2a3ac)]'
};

export function ProgressBar({
  label,
  value,
  max,
  tone = 'violet'
}: ProgressBarProps) {
  const percentage =
    max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div
      className="grid items-center gap-3.5 lg:grid-cols-[minmax(140px,1fr)_minmax(170px,260px)_auto]"
      aria-label={`${label} ${value.toLocaleString('ko-KR')}만원 (${percentage}%)`}
    >
      <div className="grid gap-1">
        <span className="text-[0.78rem] font-semibold tracking-[0.04em] text-slate-500">
          {label}
        </span>
        <strong className="text-[0.96rem] text-[#132441]">
          {value.toLocaleString('ko-KR')}만원
        </strong>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200/90 ring-1 ring-slate-200">
        <div
          className={`h-full rounded-full ${toneStyles[tone]}`}
          style={{ width: `${percentage}%` }}
          aria-hidden="true"
        />
      </div>
      <div className="text-[0.82rem] font-semibold text-slate-500">
        {percentage}%
      </div>
    </div>
  );
}
