export const ROLES = {
  ADMIN: 'ADMIN',
  SUPERADMIN: 'SUPERADMIN',
  CUSTOMER: 'CUSTOMER',
};

export const ADMIN_ROLES = [ROLES.ADMIN, ROLES.SUPERADMIN];

export const normalizeRole = (role) => {
  if (!role) return '';
  return String(role).replace(/^ROLE_/i, '').replace(/-/g, '_').toUpperCase();
};

export const hasAnyRole = (currentRole, allowedRoles = []) => {
  const normalizedRole = normalizeRole(currentRole);
  return allowedRoles.map(normalizeRole).includes(normalizedRole);
};

export const ADMIN_ROUTE_PERMISSIONS = {
  '/admin/dashboard': ADMIN_ROLES,
  '/admin/bookings': ADMIN_ROLES,
  '/admin/invoices': ADMIN_ROLES,
  '/admin/vehicles': ADMIN_ROLES,
  '/admin/mechanics': ADMIN_ROLES,
  '/admin/services': ADMIN_ROLES,
  '/admin/parts': ADMIN_ROLES,
  '/admin/chats': ADMIN_ROLES,
  '/admin/branch-settings': [ROLES.ADMIN],
  '/admin/users': [ROLES.SUPERADMIN],
  '/admin/branches': [ROLES.SUPERADMIN],
  '/admin/settings': [ROLES.SUPERADMIN],
};

export const canAccessAdminPath = (path, role) => {
  const allowedRoles = ADMIN_ROUTE_PERMISSIONS[path];
  return allowedRoles ? hasAnyRole(role, allowedRoles) : false;
};

export const getFirstAllowedAdminPath = (role) =>
  Object.entries(ADMIN_ROUTE_PERMISSIONS).find(([, allowedRoles]) => hasAnyRole(role, allowedRoles))?.[0] ||
  '/login';
