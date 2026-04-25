export function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="group rounded-2xl border border-cw-cardBorder bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] px-5 py-4 shadow-[0_2px_8px_rgba(15,23,42,0.05)] transition-all hover:border-[#b9cbe7] hover:shadow-[0_4px_14px_rgba(15,23,42,0.08)]">
      <span className="block text-[0.7rem] font-extrabold tracking-[0.1em] text-cw-muted/90">
        {label}
      </span>
      <strong className="mt-2.5 block text-[1.8rem] font-extrabold leading-none text-[#142542]">
        {value}
      </strong>
    </div>
  );
}
