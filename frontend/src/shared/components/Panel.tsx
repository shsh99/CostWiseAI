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
      className="overflow-hidden rounded-[22px] border border-cw-cardBorder bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)] shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
      id={id}
    >
      <header className="border-b border-slate-100 px-7 pb-3.5 pt-5">
        <div>
          <h2 className="m-0 text-[1.82rem] font-extrabold leading-[1.08] tracking-[-0.02em] text-[#132445]">
            {title}
          </h2>
        </div>
      </header>
      <div className="p-7 pt-5">{children}</div>
    </section>
  );
}
