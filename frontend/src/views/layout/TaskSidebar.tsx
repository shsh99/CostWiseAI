/* eslint-disable no-unused-vars */
import { navigationItems, type Role } from '../../app/portfolioData';
import type { NavigationKey } from '../../features/portfolio/explorerState';

type TaskSidebarProps = {
  activeView: NavigationKey;
  selectedRole: Role;
  onChangeView(view: NavigationKey): void;
};

export function TaskSidebar({ activeView, selectedRole, onChangeView }: TaskSidebarProps) {
  return (
    <aside className="sidebar sidebar--task-first">
      <div className="brand">
        <div className="brand__mark">CW</div>
        <div>
          <strong>CostWiseAI</strong>
          <p>Task-first portfolio operating system</p>
        </div>
      </div>

      <nav className="nav nav--stacked" aria-label="제품 맵">
        <p className="nav__label">Product Map</p>
        {navigationItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`nav__item nav__item--stacked ${activeView === item.key ? 'nav__item--active' : ''}`}
            onClick={() => onChangeView(item.key)}
          >
            <span className="nav__eyebrow">{item.label}</span>
            <strong>{item.description}</strong>
          </button>
        ))}
      </nav>

      <div className="sidebar__footer">
        <span>Current role</span>
        <strong>{selectedRole}</strong>
        <small>역할 전환은 상단 컨텍스트 바에서 수행합니다.</small>
      </div>
    </aside>
  );
}
