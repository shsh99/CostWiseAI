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
      className="overflow-hidden rounded-[14px] border border-cw-cardBorder bg-white"
      id={id}
    >
      <header className="px-5 pt-5">
        <div>
          <h2 className="text-[1.2rem] font-bold text-[#142542]">{title}</h2>
          {subtitle ? <p className="mt-2 text-cw-muted">{subtitle}</p> : null}
        </div>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}
