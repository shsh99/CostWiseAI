import type { ReactNode } from 'react';

type PanelProps = {
  id?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function Panel({ id, title, subtitle, children }: PanelProps) {
  return (
    <section
      className="overflow-hidden rounded-3xl border border-cw-cardBorder bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)] shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
      id={id}
    >
      <header className="border-b border-slate-100 px-7 pb-4 pt-5">
        <div>
          <h2 className="text-[1.9rem] font-extrabold tracking-[-0.02em] text-[#132445]">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-2 text-[1.05rem] font-medium leading-relaxed text-cw-muted">
              {subtitle}
            </p>
          ) : null}
        </div>
      </header>
      <div className="p-7 pt-5">{children}</div>
    </section>
  );
}
