import { navigationItems, type Role } from '../../app/portfolioData';

export type MenuAccessKey = (typeof navigationItems)[number]['key'];

export const roleOptions: readonly Role[] = [
  'ADMIN',
  'MANAGER',
  'AUDITOR'
] as const;

const roleLabels: Record<Role, string> = {
  ADMIN: '관리자',
  MANAGER: '매니저',
  AUDITOR: '감사'
};

const menuAccessByRole: Record<Role, readonly MenuAccessKey[]> = {
  ADMIN: [
    'dashboard',
    'portfolio',
    'accounting',
    'valuation',
    'risk',
    'users',
    'audit',
    'settings'
  ],
  MANAGER: [
    'dashboard',
    'portfolio',
    'accounting',
    'valuation',
    'risk',
    'settings'
  ],
  AUDITOR: [
    'dashboard',
    'portfolio',
    'accounting',
    'valuation',
    'risk',
    'users',
    'audit',
    'settings'
  ]
};

const projectWriteRoles = new Set<Role>(['ADMIN', 'MANAGER']);
const divisionScopedRoles = new Set<Role>(['MANAGER']);

export function getRoleLabel(role: Role) {
  return roleLabels[role];
}

export function canAccessMenu(role: Role, menuKey: MenuAccessKey) {
  return menuAccessByRole[role].includes(menuKey);
}

export function getNavigationItemsForRole(role: Role) {
  return navigationItems.filter((item) => canAccessMenu(role, item.key));
}

export function getDefaultMenuForRole(role: Role): MenuAccessKey {
  return menuAccessByRole[role][0] ?? 'portfolio';
}

export function canWriteProjects(role: Role) {
  return projectWriteRoles.has(role);
}

export function canManageUsers(role: Role) {
  return role === 'ADMIN';
}

export function isDivisionScopedRole(role: Role) {
  return divisionScopedRoles.has(role);
}

export function resolveDivisionScope(
  role: Role,
  selectedDivision: string | null,
  availableDivisions: string[]
) {
  if (!isDivisionScopedRole(role)) {
    return null;
  }

  if (
    selectedDivision &&
    availableDivisions.some((division) => division === selectedDivision)
  ) {
    return selectedDivision;
  }

  return availableDivisions[0] ?? null;
}
