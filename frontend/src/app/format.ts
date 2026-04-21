const krwFormatter = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0
});

const percentFormatter = new Intl.NumberFormat('ko-KR', {
  style: 'percent',
  maximumFractionDigits: 1
});

export function formatKrw(valueKrw: number) {
  return krwFormatter.format(valueKrw);
}

export function formatKrwCompact(valueKrw: number) {
  const abs = Math.abs(valueKrw);
  const sign = valueKrw < 0 ? '-' : '';

  if (abs >= 100_000_000) {
    const eok = abs / 100_000_000;
    return `${sign}₩${eok.toFixed(eok >= 10 ? 0 : 1)}억`;
  }

  if (abs >= 10_000) {
    const man = abs / 10_000;
    return `${sign}₩${man.toFixed(man >= 100 ? 0 : 1)}만`;
  }

  return `${sign}${formatKrw(abs)}`;
}

export function formatPercent(value: number) {
  return percentFormatter.format(value);
}

export function formatYears(value: number) {
  return `${value.toFixed(1)}년`;
}

export function formatDateTime(iso: string) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}
