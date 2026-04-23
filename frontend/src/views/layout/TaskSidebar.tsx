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
  users: '시스템',
  audit: '시스템',
  settings: '시스템'
};

const iconByKey: Partial<Record<NavigationKey, string>> = {
  dashboard: '▦',
  portfolio: '▣',
  accounting: '◍',
  valuation: '⌬',
  users: '◉',
  audit: '◈',
  settings: '⚙'
};

export function TaskSidebar({
  activeView,
  selectedRole,
  onChangeView
}: TaskSidebarProps) {
  const visibleNavigationItems = getNavigationItemsForRole(selectedRole);
  const renderedSections = new Set<string>();

  return (
    <aside className="sidebar sidebar--finops">
      <div className="brand brand--finops">
        <div className="brand__mark brand__mark--finops">↗</div>
        <div>
          <strong>FinOps</strong>
          <p>원가·평가 통합관리</p>
        </div>
      </div>

      <nav className="nav nav--finops" aria-label="메뉴">
        {visibleNavigationItems.map((item) => {
          const section = sectionLabelByKey[item.key] ?? '메뉴';
          const showSection = !renderedSections.has(section);
          if (showSection) {
            renderedSections.add(section);
          }

          return (
            <div key={item.key}>
              {showSection ? <p className="nav__section">{section}</p> : null}
              <button
                type="button"
                className={`nav__item nav__item--finops ${activeView === item.key ? 'nav__item--active' : ''}`}
                onClick={() => onChangeView(item.key)}
              >
                <span className="nav__icon">{iconByKey[item.key] ?? '•'}</span>
                <span>{item.label}</span>
              </button>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
