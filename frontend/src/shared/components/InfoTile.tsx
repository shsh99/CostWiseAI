export function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <span className="block text-sm font-medium text-cw-muted">{label}</span>
      <strong className="mt-2 block text-lg font-bold text-[#1f2e4a]">
        {value}
      </strong>
    </div>
  );
}
