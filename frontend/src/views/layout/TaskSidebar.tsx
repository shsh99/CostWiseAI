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
    <aside className="min-h-screen w-[320px] border-r border-[rgba(136,153,196,0.2)] bg-[linear-gradient(180deg,#0a1433_0%,#1f1b67_58%,#2a2a78_100%)] px-3 pb-4 pt-5 shadow-cw-sidebar">
      <div className="mb-[18px] ml-3 mr-2 flex items-center gap-3">
        <div className="grid h-[42px] w-[42px] place-items-center rounded-[11px] bg-[linear-gradient(135deg,#2d68e4,#19b2db)] text-base font-extrabold text-white">
          CW
        </div>
        <div>
          <strong className="text-[2.65rem] font-bold leading-none tracking-[-0.02em] text-white">
            CostWise
          </strong>
          <p className="m-0 mt-0.5 text-[0.88rem] text-[#8fa7d3]">
            원가·평가 통합관리
          </p>
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
                <p className="mb-1.5 ml-2.5 mr-2.5 mt-3.5 text-[0.78rem] font-extrabold tracking-[0.08em] text-[#6f84b1]">
                  {section}
                </p>
              ) : null}
              <button
                type="button"
                className={`flex w-full items-center gap-3 rounded-xl border-0 bg-transparent px-4 py-3 text-left text-[1.02rem] font-semibold transition-colors ${
                  activeView === item.key
                    ? 'bg-[linear-gradient(90deg,#2666e2_0%,#1ab3dc_100%)] text-white shadow-[0_8px_18px_rgba(27,88,220,0.26)]'
                    : 'text-[#cbd5e1] hover:bg-white/10 hover:text-white'
                }`}
                onClick={() => onChangeView(item.key)}
              >
                <span className="inline-block w-5 text-center opacity-95">
                  {iconByKey[item.key] ?? '•'}
                </span>
                <span>{item.label}</span>
              </button>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
