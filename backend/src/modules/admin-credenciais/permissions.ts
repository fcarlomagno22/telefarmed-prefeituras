export {
  type AdminPageId,
  type PermissionAction,
  sanitizeAdminPagePermissions,
} from '../../lib/adminPermissions.js'

export {
  sanitizePrefeituraPagePermissions,
  type PrefeituraPageId,
} from '../../lib/prefeituraPermissions.js'

export {
  sanitizeUbtPagePermissions as sanitizeSystemPagePermissions,
  type UbtPageId as SystemPageId,
} from '../../lib/ubtPermissions.js'

export function hasAnyPagePermission(permissions: Record<string, unknown[]>): boolean {
  return Object.values(permissions).some((actions) => actions.length > 0)
}
