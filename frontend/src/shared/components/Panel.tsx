import type { ReactNode } from 'react';

type PanelProps = {
  id?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function Panel({ id, title, children }: PanelProps) {
  return (
    <section
      className="overflow-hidden rounded-2xl border border-cw-cardBorder bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)] shadow-[0_4px_14px_rgba(15,23,42,0.06)]"
      id={id}
    >
      <header className="border-b border-slate-100 px-6 pb-3.5 pt-4.5">
        <div>
          <h2 className="text-[2rem] font-extrabold tracking-[-0.02em] text-[#132445]">
            {title}
          </h2>
        </div>
      </header>
      <div className="p-6 pt-5">{children}</div>
    </section>
  );
}
