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
    <aside className="min-h-screen w-[292px] shrink-0 overflow-x-hidden border-r border-[#1b2f52] bg-[linear-gradient(180deg,#08162f_0%,#0a1c3a_70%,#0b2146_100%)] px-4 pb-6 pt-5">
      <div className="mb-6 rounded-2xl border border-[#2e4671] bg-[linear-gradient(140deg,rgba(16,32,68,0.96),rgba(12,26,56,0.94))] px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="grid h-[44px] w-[44px] place-items-center rounded-xl bg-[linear-gradient(135deg,#2a67e0,#1ba9d4)] text-[0.98rem] font-extrabold text-white">
            CW
          </div>
          <div className="min-w-0">
            <strong className="block text-[1.15rem] font-extrabold leading-tight tracking-[0.005em] text-white">
              CostWise
            </strong>
            <p className="m-0 mt-1 text-[0.74rem] font-semibold tracking-[0.03em] text-[#9bb2db]">
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
                <p className="mb-2 ml-2.5 mr-2 mt-5 text-[0.68rem] font-extrabold tracking-[0.12em] text-[#7f98c6]">
                  {section}
                </p>
              ) : null}
              <button
                type="button"
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-[0.66rem] text-left text-[0.91rem] font-semibold tracking-[0.005em] transition-all duration-150 ${
                  activeView === item.key
                    ? 'border-[#4f78dc] bg-[linear-gradient(96deg,#2b63d7_0%,#239cca_100%)] text-white shadow-[0_4px_10px_rgba(13,53,146,0.24)]'
                    : 'border-transparent text-[#c8d5ec] hover:border-white/10 hover:bg-white/[0.06] hover:text-white'
                }`}
                onClick={() => onChangeView(item.key)}
              >
                <span className="inline-block w-5 text-center text-[0.86rem] opacity-95">
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
