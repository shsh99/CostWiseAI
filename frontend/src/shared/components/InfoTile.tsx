export function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="group rounded-2xl border border-cw-cardBorder bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-colors hover:border-[#b9cbe7]">
      <span className="block text-[12px] font-semibold tracking-[0.08em] text-cw-muted/90">
        {label}
      </span>
      <strong className="mt-2 block text-[34px] font-extrabold leading-none text-[#142542]">
        {value}
      </strong>
    </div>
  );
}
