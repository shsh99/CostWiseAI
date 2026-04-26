export function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="group rounded-[1rem] border border-cw-cardBorder bg-[linear-gradient(180deg,#ffffff_0%,#fafcff_100%)] px-3.5 py-3 shadow-[0_2px_8px_rgba(15,23,42,0.035)] transition-all hover:border-[#c2d2eb] hover:shadow-[0_5px_14px_rgba(15,23,42,0.055)]">
      <span className="block text-[0.64rem] font-extrabold tracking-[0.05em] text-cw-muted/80">
        {label}
      </span>
      <strong className="mt-1.5 block text-[1.45rem] font-extrabold leading-none tracking-[-0.015em] text-[#142542]">
        {value}
      </strong>
    </div>
  );
}
