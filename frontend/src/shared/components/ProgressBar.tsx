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

export function ProgressBar({ label, value, max, tone = 'violet' }: ProgressBarProps) {
  const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div
      className="grid items-center gap-3 lg:grid-cols-[1fr_minmax(150px,240px)_auto]"
      aria-label={`${label} ${value.toLocaleString('ko-KR')}만원 (${percentage}%)`}
    >
      <div className="grid gap-1">
        <span className="text-[0.88rem] text-slate-500">{label}</span>
        <strong>{value.toLocaleString('ko-KR')}만원</strong>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full ${toneStyles[tone]}`}
          style={{ width: `${percentage}%` }}
          aria-hidden="true"
        />
      </div>
      <div className="text-[0.88rem] text-slate-500">{percentage}%</div>
    </div>
  );
}
