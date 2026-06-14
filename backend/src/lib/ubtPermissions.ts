const UBT_PAGE_IDS = [
  'triagem',
  'agenda',
  'consultas',
  'usuarios',
  'suporte',
  'credenciais',
  'notificacoes',
  'auditoria',
] as const

const PERMISSION_ACTIONS = ['visualizar', 'inserir', 'editar', 'excluir'] as const

export type UbtPageId = (typeof UBT_PAGE_IDS)[number]
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number]

export const UBT_PAGE_IDS_LIST = UBT_PAGE_IDS

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function emptyUbtPagePermissions(): Record<UbtPageId, PermissionAction[]> {
  return Object.fromEntries(UBT_PAGE_IDS.map((page) => [page, []])) as unknown as Record<
    UbtPageId,
    PermissionAction[]
  >
}

export function sanitizeUbtPagePermissions(
  input: unknown,
): Record<UbtPageId, PermissionAction[]> {
  const empty = emptyUbtPagePermissions()
  if (!isRecord(input)) return empty

  for (const page of UBT_PAGE_IDS) {
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

export function fullUbtPagePermissions(): Record<UbtPageId, PermissionAction[]> {
  const allActions: PermissionAction[] = ['visualizar', 'inserir', 'editar', 'excluir']
  return Object.fromEntries(
    UBT_PAGE_IDS.map((page) => [page, [...allActions]]),
  ) as unknown as Record<UbtPageId, PermissionAction[]>
}

export function ubtUserIsAdministrador(accessLevel: string): boolean {
  return accessLevel === 'administrador'
}

export function resolveUbtPagePermissions(
  accessLevel: string,
  permissoesSistema: unknown,
): Record<UbtPageId, PermissionAction[]> {
  if (ubtUserIsAdministrador(accessLevel)) {
    return fullUbtPagePermissions()
  }
  return sanitizeUbtPagePermissions(permissoesSistema)
}

export function hasUbtPagePermission(
  permissions: Record<UbtPageId, PermissionAction[]>,
  page: UbtPageId,
  action: PermissionAction,
  options?: { accessLevel?: string },
): boolean {
  if (options?.accessLevel && ubtUserIsAdministrador(options.accessLevel)) {
    return true
  }
  return permissions[page]?.includes(action) ?? false
}

export function hasAnyUbtPagePermission(
  permissions: Record<UbtPageId, PermissionAction[]>,
  options?: { accessLevel?: string },
): boolean {
  if (options?.accessLevel && ubtUserIsAdministrador(options.accessLevel)) {
    return true
  }
  return UBT_PAGE_IDS.some((page) => permissions[page].length > 0)
}
