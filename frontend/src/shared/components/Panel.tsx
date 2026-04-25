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
      className="overflow-hidden rounded-2xl border border-cw-cardBorder bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
      id={id}
    >
      <header className="border-b border-slate-100 px-6 pb-4 pt-5">
        <div>
          <h2 className="text-[34px] font-extrabold tracking-[-0.02em] text-[#10213d]">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-2 text-[17px] font-medium text-cw-muted">
              {subtitle}
            </p>
          ) : null}
        </div>
      </header>
      <div className="p-6">{children}</div>
    </section>
  );
}
