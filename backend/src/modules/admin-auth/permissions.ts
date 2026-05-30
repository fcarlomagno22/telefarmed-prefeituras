export {
  type AdminPageId,
  type PermissionAction,
  emptyAdminPagePermissions,
  sanitizeAdminPagePermissions,
  hasAdminPagePermission,
  hasAnyAdminPagePermission,
  httpMethodToPermissionAction,
} from '../../lib/adminPermissions.js'
