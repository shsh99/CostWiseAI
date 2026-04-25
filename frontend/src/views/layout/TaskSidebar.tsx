/* eslint-disable no-unused-vars */
import type { Role } from '../../app/portfolioData';
import { getNavigationItemsForRole } from '../../features/auth/permissions';
import type { NavigationKey } from '../../features/portfolio/explorerState';

type TaskSidebarProps = {
  activeView: NavigationKey;
  selectedRole: Role;
  onChangeView(view: NavigationKey): void;
};

const sectionLabelByKey: Partial<Record<NavigationKey, string>> = {
  dashboard: '메인',
  accounting: '원가/관리회계',
  portfolio: '프로젝트·평가',
  valuation: '프로젝트·평가',
  risk: '프로젝트·평가',
  audit: '시스템',
  settings: '시스템'
};

const iconByKey: Partial<Record<NavigationKey, string>> = {
  dashboard: '▦',
  portfolio: '▣',
  accounting: '◍',
  valuation: '⌬',
  risk: '◉',
  audit: '◈',
  settings: '⚙'
};

export function TaskSidebar({
  activeView,
  selectedRole,
  onChangeView
}: TaskSidebarProps) {
  const visibleNavigationItems = getNavigationItemsForRole(selectedRole);
  const navigationOrder: NavigationKey[] = [
    'dashboard',
    'accounting',
    'portfolio',
    'valuation',
    'risk',
    'audit',
    'settings'
  ];
  const orderedNavigationItems = navigationOrder
    .map((key) => visibleNavigationItems.find((item) => item.key === key))
    .filter((item): item is (typeof visibleNavigationItems)[number] =>
      Boolean(item)
    );
  const renderedSections = new Set<string>();

  return (
    <aside className="min-h-screen w-[306px] border-r border-[#21345b] bg-[linear-gradient(180deg,#071227_0%,#0b1c3f_52%,#102652_100%)] px-4 pb-6 pt-5 shadow-[8px_0_26px_rgba(4,8,22,0.35)]">
      <div className="mb-6 rounded-2xl border border-[#355487] bg-[linear-gradient(140deg,rgba(22,40,84,0.96),rgba(14,29,62,0.92))] px-4 py-3.5 shadow-[0_10px_20px_rgba(4,12,34,0.28)]">
        <div className="flex items-center gap-3">
          <div className="grid h-[46px] w-[46px] place-items-center rounded-xl bg-[linear-gradient(135deg,#2b68e4,#1bb3db)] text-base font-extrabold text-white shadow-[0_8px_16px_rgba(25,82,212,0.45)]">
            CW
          </div>
          <div className="min-w-0">
            <strong className="block text-[1.2rem] font-extrabold leading-tight tracking-[0.01em] text-white">
              CostWise
            </strong>
            <p className="m-0 mt-1 text-[0.76rem] font-semibold tracking-[0.04em] text-[#9eb5de]">
              원가·평가 통합관리
            </p>
          </div>
        </div>
      </div>

      <nav className="grid gap-2 px-1" aria-label="메뉴">
        {orderedNavigationItems.map((item) => {
          const section = sectionLabelByKey[item.key] ?? '메뉴';
          const showSection = !renderedSections.has(section);
          if (showSection) {
            renderedSections.add(section);
          }

          return (
            <div key={item.key}>
              {showSection ? (
                <p className="mb-2 ml-2.5 mr-2 mt-5 text-[0.69rem] font-extrabold tracking-[0.16em] text-[#809ac8]">
                  {section}
                </p>
              ) : null}
              <button
                type="button"
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-[0.7rem] text-left text-[0.93rem] font-semibold tracking-[0.01em] transition-all duration-150 ${
                  activeView === item.key
                    ? 'border-[#5480ec] bg-[linear-gradient(96deg,#2a64de_0%,#1da8d1_100%)] text-white shadow-[0_10px_20px_rgba(20,71,188,0.33)]'
                    : 'border-transparent text-[#c8d6ee] hover:border-white/15 hover:bg-white/[0.07] hover:text-white'
                }`}
                onClick={() => onChangeView(item.key)}
              >
                <span className="inline-block w-5 text-center text-[0.88rem] opacity-95">
                  {iconByKey[item.key] ?? '•'}
                </span>
                <span className="leading-none">{item.label}</span>
              </button>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
