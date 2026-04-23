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
  function cueClass(cue: DecisionBarCue) {
    if (cue === 'stripe') {
      return 'bg-[repeating-linear-gradient(135deg,#3f79ea_0,#3f79ea_8px,#8bb5ff_8px,#8bb5ff_16px)]';
    }
    if (cue === 'dot') {
      return 'bg-[radial-gradient(circle_at_center,#3f79ea_2px,transparent_2px)] bg-[length:14px_14px] bg-[#dbe8ff]';
    }
    return 'bg-[linear-gradient(90deg,#3f79ea,#1db0db)]';
  }

  function cueDotClass(cue: DecisionBarCue) {
    if (cue === 'stripe') {
      return 'bg-sky-500';
    }
    if (cue === 'dot') {
      return 'bg-indigo-500';
    }
    return 'bg-blue-600';
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="grid gap-1">
        <strong>{title}</strong>
        <span className="text-sm text-slate-500">{subtitle}</span>
      </div>
      <ul className="mt-3 grid gap-3" aria-label={title}>
        {bars.map((bar) => (
          <li key={bar.key} className="grid gap-2 lg:grid-cols-[1fr_1fr_auto] lg:items-center">
            <div className="grid gap-1">
              <span
                className={`h-2.5 w-2.5 rounded-full ${cueDotClass(bar.cue)}`}
                aria-hidden="true"
              />
              <strong>{bar.label}</strong>
              <small className="text-xs text-slate-500">{bar.annotation}</small>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${cueClass(bar.cue)}`}
                style={{ width: `${bar.ratio * 100}%` }}
              />
            </div>
            <div className="grid gap-0.5 justify-self-end text-right">
              <strong>{bar.formattedValue}</strong>
              <span className="text-xs text-slate-500">
                {bar.value < 0 ? '손실 구간' : '기여 구간'}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-slate-600">{summary}</p>
    </article>
  );
}

export function DecisionSummary({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <strong>{title}</strong>
      <ul className="mt-2 grid gap-1 text-sm text-slate-600">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </article>
  );
}
