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
      className="overflow-hidden rounded-2xl border border-cw-cardBorder bg-[linear-gradient(180deg,#ffffff_0%,#fcfdff_100%)] shadow-[0_2px_8px_rgba(15,23,42,0.06)]"
      id={id}
    >
      <header className="border-b border-slate-100 px-6 pb-3.5 pt-4.5">
        <div>
          <h2 className="text-[1.35rem] font-extrabold tracking-[-0.01em] text-[#10213d]">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1.5 text-[0.95rem] font-medium leading-relaxed text-cw-muted">
              {subtitle}
            </p>
          ) : null}
        </div>
      </header>
      <div className="p-6 pt-5">{children}</div>
    </section>
  );
}
