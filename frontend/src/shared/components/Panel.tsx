import type { ReactNode } from 'react';

type PanelProps = {
  id?: string;
  title: string;
  titleIcon?: ReactNode;
  subtitle?: string;
  children: ReactNode;
};

export function Panel({ id, title, titleIcon, children }: PanelProps) {
  return (
    <section
      className="overflow-hidden rounded-[18px] border border-cw-cardBorder bg-[linear-gradient(180deg,#ffffff_0%,#fcfdff_100%)] shadow-[0_4px_14px_rgba(15,23,42,0.04)]"
      id={id}
    >
      <header className="border-b border-slate-100/90 px-5 pb-2.5 pt-4">
        <div>
          <h2 className="m-0 flex items-center gap-2 text-[1.38rem] font-extrabold leading-[1.1] tracking-[-0.018em] text-[#132445]">
            {titleIcon ? (
              <span
                aria-hidden
                className="inline-grid h-7 w-7 place-items-center rounded-lg border border-[#d8e4f8] bg-[#f4f8ff] text-[#2f57c8]"
              >
                {titleIcon}
              </span>
            ) : null}
            {title}
          </h2>
        </div>
      </header>
      <div className="p-5 pt-4">{children}</div>
    </section>
  );
}
