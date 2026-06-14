const PROFISSIONAL_PAGE_IDS = [
  'agenda',
  'atendimentos',
  'escala',
  'financeiro',
  'avaliacao',
  'suporte',
  'notificacoes',
  'perfil',
] as const

const PERMISSION_ACTIONS = ['visualizar', 'inserir', 'editar', 'excluir'] as const

export type ProfissionalPageId = (typeof PROFISSIONAL_PAGE_IDS)[number]
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number]

export const PROFISSIONAL_PAGE_IDS_LIST = PROFISSIONAL_PAGE_IDS

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function emptyProfissionalPagePermissions(): Record<ProfissionalPageId, PermissionAction[]> {
  return Object.fromEntries(
    PROFISSIONAL_PAGE_IDS.map((page) => [page, []]),
  ) as unknown as Record<ProfissionalPageId, PermissionAction[]>
}

export function sanitizeProfissionalPagePermissions(
  input: unknown,
): Record<ProfissionalPageId, PermissionAction[]> {
  const empty = emptyProfissionalPagePermissions()
  if (!isRecord(input)) return empty

  for (const page of PROFISSIONAL_PAGE_IDS) {
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

export function fullProfissionalPagePermissions(): Record<ProfissionalPageId, PermissionAction[]> {
  const allActions: PermissionAction[] = ['visualizar', 'inserir', 'editar', 'excluir']
  return Object.fromEntries(
    PROFISSIONAL_PAGE_IDS.map((page) => [page, [...allActions]]),
  ) as unknown as Record<ProfissionalPageId, PermissionAction[]>
}

export function resolveProfissionalPagePermissions(
  input: unknown,
): Record<ProfissionalPageId, PermissionAction[]> {
  const sanitized = sanitizeProfissionalPagePermissions(input)
  const hasAny = PROFISSIONAL_PAGE_IDS.some((page) => sanitized[page].length > 0)
  if (!hasAny) {
    return fullProfissionalPagePermissions()
  }
  return sanitized
}

export function hasProfissionalPagePermission(
  permissions: Record<ProfissionalPageId, PermissionAction[]>,
  page: ProfissionalPageId,
  action: PermissionAction,
): boolean {
  return permissions[page]?.includes(action) ?? false
}

export function hasAnyProfissionalPagePermission(
  permissions: Record<ProfissionalPageId, PermissionAction[]>,
  pages: ProfissionalPageId[],
  action: PermissionAction,
): boolean {
  return pages.some((page) => hasProfissionalPagePermission(permissions, page, action))
}
