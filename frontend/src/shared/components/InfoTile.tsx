export function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="group rounded-2xl border border-cw-cardBorder bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-5 py-4 shadow-[0_4px_14px_rgba(15,23,42,0.055)] transition-all hover:border-[#b9cbe7] hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
      <span className="block text-[0.74rem] font-extrabold tracking-[0.07em] text-cw-muted/90">
        {label}
      </span>
      <strong className="mt-2.5 block text-[1.85rem] font-extrabold leading-none tracking-[-0.015em] text-[#142542]">
        {value}
      </strong>
    </div>
  );
}
