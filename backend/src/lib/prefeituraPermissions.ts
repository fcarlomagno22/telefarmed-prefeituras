const PREFEITURA_PAGE_IDS = [
  'dashboard',
  'rede',
  'monitor',
  'consultas',
  'agendas',
  'usuarios',
  'contrato',
  'relatorios',
  'notificacoes',
  'suporte',
  'credenciais',
  'auditoria',
] as const

const PERMISSION_ACTIONS = ['visualizar', 'inserir', 'editar', 'excluir'] as const

export type PrefeituraPageId = (typeof PREFEITURA_PAGE_IDS)[number]
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number]

export const PREFEITURA_PAGE_IDS_LIST = PREFEITURA_PAGE_IDS

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function emptyPrefeituraPagePermissions(): Record<PrefeituraPageId, PermissionAction[]> {
  return Object.fromEntries(PREFEITURA_PAGE_IDS.map((page) => [page, []])) as unknown as Record<
    PrefeituraPageId,
    PermissionAction[]
  >
}

export function sanitizePrefeituraPagePermissions(
  input: unknown,
): Record<PrefeituraPageId, PermissionAction[]> {
  const empty = emptyPrefeituraPagePermissions()
  if (!isRecord(input)) return empty

  for (const page of PREFEITURA_PAGE_IDS) {
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

export function fullPrefeituraPagePermissions(): Record<PrefeituraPageId, PermissionAction[]> {
  const allActions: PermissionAction[] = ['visualizar', 'inserir', 'editar', 'excluir']
  return Object.fromEntries(
    PREFEITURA_PAGE_IDS.map((page) => [page, [...allActions]]),
  ) as unknown as Record<PrefeituraPageId, PermissionAction[]>
}

export function prefeituraUserIsAdministrador(accessLevel: string): boolean {
  return accessLevel === 'administrador'
}

export function resolvePrefeituraPagePermissions(
  accessLevel: string,
  permissoesPaginas: unknown,
): Record<PrefeituraPageId, PermissionAction[]> {
  if (prefeituraUserIsAdministrador(accessLevel)) {
    return fullPrefeituraPagePermissions()
  }
  return sanitizePrefeituraPagePermissions(permissoesPaginas)
}

export function hasPrefeituraPagePermission(
  permissions: Record<PrefeituraPageId, PermissionAction[]>,
  page: PrefeituraPageId,
  action: PermissionAction,
  options?: { accessLevel?: string },
): boolean {
  if (options?.accessLevel && prefeituraUserIsAdministrador(options.accessLevel)) {
    return true
  }
  return permissions[page]?.includes(action) ?? false
}

export function hasAnyPrefeituraPagePermission(
  permissions: Record<PrefeituraPageId, PermissionAction[]>,
  options?: { accessLevel?: string },
): boolean {
  if (options?.accessLevel && prefeituraUserIsAdministrador(options.accessLevel)) {
    return true
  }
  return PREFEITURA_PAGE_IDS.some((page) => permissions[page].length > 0)
}
