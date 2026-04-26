/* eslint-disable no-unused-vars */
import type { Role } from '../../app/portfolioData';
import { getNavigationItemsForRole } from '../../features/auth/permissions';
import type { NavigationKey } from '../../features/portfolio/explorerState';
import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Calculator,
  ClipboardList,
  Coins,
  FolderOpen,
  LayoutDashboard,
  Settings2,
  Shield,
  Wallet
} from 'lucide-react';

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

const iconByKey: Partial<Record<NavigationKey, LucideIcon>> = {
  dashboard: LayoutDashboard,
  portfolio: FolderOpen,
  accounting: Coins,
  valuation: Calculator,
  risk: Shield,
  audit: ClipboardList,
  settings: BookOpen
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
    <aside className="min-h-0 w-full shrink-0 overflow-x-hidden border-r border-[#1b2f52] bg-[linear-gradient(180deg,#08162f_0%,#0a1c3a_70%,#0b2146_100%)] px-3.5 pb-5 pt-4 md:min-h-screen md:w-[286px]">
      <div className="mb-5 rounded-2xl border border-[#2e4671] bg-[linear-gradient(140deg,rgba(16,32,68,0.96),rgba(12,26,56,0.94))] px-3.5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-[40px] w-[40px] place-items-center rounded-xl bg-[linear-gradient(135deg,#2a67e0,#1ba9d4)] text-[0.9rem] font-extrabold text-white">
            CW
          </div>
          <div className="min-w-0">
            <strong className="block text-[1.06rem] font-extrabold leading-tight tracking-[0.005em] text-white">
              CostWise
            </strong>
            <p className="m-0 mt-0.5 text-[0.7rem] font-semibold tracking-[0.03em] text-[#9bb2db]">
              원가·평가 통합관리
            </p>
          </div>
        </div>
      </div>

      <nav className="grid gap-1.5 px-1" aria-label="메뉴">
        {orderedNavigationItems.map((item) => {
          const ItemIcon = iconByKey[item.key] ?? Wallet;
          const section = sectionLabelByKey[item.key] ?? '메뉴';
          const showSection = !renderedSections.has(section);
          if (showSection) {
            renderedSections.add(section);
          }

          return (
            <div key={item.key}>
              {showSection ? (
                <p className="mb-1.5 ml-2.5 mr-2 mt-4 text-[0.64rem] font-extrabold tracking-[0.12em] text-[#7f98c6]">
                  {section}
                </p>
              ) : null}
              <button
                type="button"
                className={`flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-[0.58rem] text-left text-[0.86rem] font-semibold tracking-[0.005em] transition-all duration-150 ${
                  activeView === item.key
                    ? 'border-[#4f78dc] bg-[linear-gradient(96deg,#2b63d7_0%,#239cca_100%)] text-white shadow-[0_4px_10px_rgba(13,53,146,0.24)]'
                    : 'border-transparent text-[#c8d5ec] hover:border-white/10 hover:bg-white/[0.06] hover:text-white'
                }`}
                onClick={() => onChangeView(item.key)}
              >
                <span className="grid h-4 w-4 shrink-0 place-items-center text-center text-[0.78rem] leading-none opacity-95">
                  <ItemIcon className="h-4 w-4" />
                </span>
                <span className="leading-[1.1]">{item.label}</span>
              </button>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
