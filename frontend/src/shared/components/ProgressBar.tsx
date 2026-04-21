type ProgressBarProps = {
  label: string;
  value: number;
  max: number;
  tone?: 'amber' | 'violet' | 'teal' | 'rose';
};

const toneStyles: Record<NonNullable<ProgressBarProps['tone']>, string> = {
  amber: 'progress-bar__fill--amber',
  violet: 'progress-bar__fill--violet',
  teal: 'progress-bar__fill--teal',
  rose: 'progress-bar__fill--rose'
};

export function ProgressBar({ label, value, max, tone = 'violet' }: ProgressBarProps) {
  const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className="progress-row" aria-label={`${label} ${value.toLocaleString('ko-KR')}만원 (${percentage}%)`}>
      <div className="progress-row__meta">
        <span>{label}</span>
        <strong>{value.toLocaleString('ko-KR')}만원</strong>
      </div>
      <div className="progress-bar">
        <div className={`progress-bar__fill ${toneStyles[tone]}`} style={{ width: `${percentage}%` }} aria-hidden="true" />
      </div>
      <div className="progress-row__percent">{percentage}%</div>
    </div>
  );
}
