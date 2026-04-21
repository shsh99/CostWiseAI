import type { CSSProperties } from 'react';

export type DecisionBarCue = 'solid' | 'stripe' | 'dot';

export type DecisionBarInput = {
  key: string;
  label: string;
  value: number;
  formattedValue: string;
  cue: DecisionBarCue;
  annotation: string;
};

export type DecisionBarItem = DecisionBarInput & {
  ratio: number;
};

export function buildDecisionBars(items: DecisionBarInput[]): DecisionBarItem[] {
  const maxMagnitude = Math.max(...items.map((item) => Math.abs(item.value)), 1);
  return items.map((item) => ({
    ...item,
    ratio: Math.max(Math.abs(item.value) / maxMagnitude, 0.08)
  }));
}

export function DecisionBarChart({
  title,
  subtitle,
  bars,
  summary
}: {
  title: string;
  subtitle: string;
  bars: DecisionBarItem[];
  summary: string;
}) {
  return (
    <article className="decision-chart-card">
      <div className="decision-chart-card__header">
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
      <ul className="decision-chart" aria-label={title}>
        {bars.map((bar) => (
          <li key={bar.key} className="decision-chart__row">
            <div className="decision-chart__meta">
              <span className={`decision-cue decision-cue--${bar.cue}`} aria-hidden="true" />
              <strong>{bar.label}</strong>
              <small>{bar.annotation}</small>
            </div>
            <div
              className={`decision-bar decision-bar--${bar.cue}`}
              style={{ '--bar-ratio': `${bar.ratio * 100}%` } as CSSProperties}
            />
            <div className="decision-chart__value">
              <strong>{bar.formattedValue}</strong>
              <span>{bar.value < 0 ? '손실 구간' : '기여 구간'}</span>
            </div>
          </li>
        ))}
      </ul>
      <p className="decision-chart-card__summary">{summary}</p>
    </article>
  );
}

export function DecisionSummary({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="decision-summary">
      <strong>{title}</strong>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}
