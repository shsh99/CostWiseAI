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

export function buildDecisionBars(
  items: DecisionBarInput[]
): DecisionBarItem[] {
  const maxMagnitude = Math.max(
    ...items.map((item) => Math.abs(item.value)),
    1
  );
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
    <article className="rounded-2xl border border-cw-cardBorder bg-white px-6 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
      <div className="grid gap-2">
        <strong className="text-[30px] font-extrabold leading-none tracking-[-0.02em] text-[#10213d]">
          {title}
        </strong>
        <span className="text-[16px] font-medium text-cw-muted">
          {subtitle}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-[12px] font-semibold text-[#476286]">
        <span className="inline-flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full bg-blue-600"
            aria-hidden="true"
          />
          결정 기여
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full bg-sky-500"
            aria-hidden="true"
          />
          보수 시나리오
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full bg-indigo-500"
            aria-hidden="true"
          />
          분산 리스크
        </span>
      </div>
      <ul className="mt-5 grid gap-4" aria-label={title}>
        {bars.map((bar) => (
          <li
            key={bar.key}
            className="grid gap-2 rounded-xl border border-slate-100 bg-slate-50/45 px-4 py-3 lg:grid-cols-[1fr_1fr_auto] lg:items-center"
          >
            <div className="grid gap-1.5">
              <span
                className={`h-2.5 w-2.5 rounded-full ${cueDotClass(bar.cue)}`}
                aria-hidden="true"
              />
              <strong className="text-[16px] font-bold text-[#142542]">
                {bar.label}
              </strong>
              <small className="text-[12px] font-medium text-[#6b7d9c]">
                {bar.annotation}
              </small>
            </div>
            <div className="h-3.5 overflow-hidden rounded-full bg-slate-200/80">
              <div
                className={`h-full rounded-full ${cueClass(bar.cue)}`}
                style={{ width: `${bar.ratio * 100}%` }}
              />
            </div>
            <div className="grid gap-0.5 justify-self-end text-right">
              <strong className="text-[22px] font-extrabold leading-none text-[#10213d]">
                {bar.formattedValue}
              </strong>
              <span className="text-[12px] font-semibold text-[#6b7d9c]">
                {bar.value < 0 ? '손실 구간' : '기여 구간'}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t border-slate-100 pt-3 text-[14px] font-medium text-[#526582]">
        {summary}
      </p>
    </article>
  );
}

export function DecisionSummary({
  title,
  items
}: {
  title: string;
  items: string[];
}) {
  return (
    <article className="rounded-2xl border border-cw-cardBorder bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
      <strong className="text-[20px] font-extrabold tracking-[-0.01em] text-[#132744]">
        {title}
      </strong>
      <ul className="mt-3 grid gap-2 text-[14px] font-medium text-[#566a89]">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2"
          >
            • {item}
          </li>
        ))}
      </ul>
    </article>
  );
}
