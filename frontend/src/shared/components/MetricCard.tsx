type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  tone?: 'primary' | 'success' | 'warning';
};

const toneStyles: Record<NonNullable<MetricCardProps['tone']>, string> = {
  primary: 'metric-card--primary',
  success: 'metric-card--success',
  warning: 'metric-card--warning'
};

export function MetricCard({ label, value, detail, tone = 'primary' }: MetricCardProps) {
  return (
    <section className={`metric-card ${toneStyles[tone]}`}>
      <div className="metric-card__label">{label}</div>
      <div className="metric-card__value">{value}</div>
      <div className="metric-card__detail">{detail}</div>
    </section>
  );
}
