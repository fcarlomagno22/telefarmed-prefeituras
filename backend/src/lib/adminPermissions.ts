const ADMIN_PAGE_IDS = [
  'dashboard',
  'clientes',
  'monitor',
  'pessoas',
  'gestaoEscala',
  'financeiro',
  'notificacoes',
  'suporte',
  'auditoria',
  'credenciais',
  'configuracoes',
] as const

const PERMISSION_ACTIONS = ['visualizar', 'inserir', 'editar', 'excluir'] as const

export type AdminPageId = (typeof ADMIN_PAGE_IDS)[number]
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number]

export const ADMIN_PAGE_IDS_LIST = ADMIN_PAGE_IDS

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function emptyAdminPagePermissions(): Record<AdminPageId, PermissionAction[]> {
  return Object.fromEntries(ADMIN_PAGE_IDS.map((page) => [page, []])) as unknown as Record<
    AdminPageId,
    PermissionAction[]
  >
}

export function sanitizeAdminPagePermissions(
  input: unknown,
): Record<AdminPageId, PermissionAction[]> {
  const empty = emptyAdminPagePermissions()
  if (!isRecord(input)) return empty

  for (const page of ADMIN_PAGE_IDS) {
    const actions = input[page]
    if (!Array.isArray(actions)) continue
    const filtered = actions.filter(
      (action): action is PermissionAction =>
        typeof action === 'string' &&
        (PERMISSION_ACTIONS as readonly string[]).includes(action),
    )
    empty[page] = [...new Set(filtered)]
  }

  return empty
}

export function hasAdminPagePermission(
  permissions: Record<AdminPageId, PermissionAction[]>,
  page: AdminPageId,
  action: PermissionAction,
  options?: { isMaster?: boolean },
): boolean {
  if (options?.isMaster) return true
  return permissions[page]?.includes(action) ?? false
}

export function fullAdminPagePermissions(): Record<AdminPageId, PermissionAction[]> {
  const allActions: PermissionAction[] = ['visualizar', 'inserir', 'editar', 'excluir']
  return Object.fromEntries(
    ADMIN_PAGE_IDS.map((page) => [page, [...allActions]]),
  ) as unknown as Record<AdminPageId, PermissionAction[]>
}

export function hasAnyAdminPagePermission(
  permissions: Record<AdminPageId, PermissionAction[]>,
  options?: { isMaster?: boolean },
): boolean {
  if (options?.isMaster) return true
  return ADMIN_PAGE_IDS.some((page) => permissions[page].length > 0)
}

export function httpMethodToPermissionAction(method: string): PermissionAction | null {
  switch (method.toUpperCase()) {
    case 'GET':
    case 'HEAD':
      return 'visualizar'
    case 'POST':
      return 'inserir'
    case 'PUT':
    case 'PATCH':
      return 'editar'
    case 'DELETE':
      return 'excluir'
    default:
      return null
  }
}
