export function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="group rounded-2xl border border-cw-cardBorder bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-6 py-5 shadow-[0_6px_18px_rgba(15,23,42,0.06)] transition-all hover:border-[#b9cbe7] hover:shadow-[0_10px_26px_rgba(15,23,42,0.09)]">
      <span className="block text-[0.78rem] font-extrabold tracking-[0.08em] text-cw-muted/90">
        {label}
      </span>
      <strong className="mt-3 block text-[2.2rem] font-extrabold leading-none tracking-[-0.02em] text-[#142542]">
        {value}
      </strong>
    </div>
  );
}
