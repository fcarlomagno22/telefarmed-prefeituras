export {
  type AdminPageId,
  type PermissionAction,
  sanitizeAdminPagePermissions,
} from '../../lib/adminPermissions.js'

// System pages (portal UBT/prefeitura) — mantido aqui para não misturar com admin interno
const SYSTEM_PAGE_IDS = [
  'triagem',
  'agenda',
  'consultas',
  'usuarios',
  'relatorios',
  'suporte',
  'credenciais',
] as const

export type SystemPageId = (typeof SYSTEM_PAGE_IDS)[number]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const PERMISSION_ACTIONS = ['visualizar', 'inserir', 'editar', 'excluir'] as const

export function sanitizeSystemPagePermissions(
  input: unknown,
): Record<SystemPageId, import('../../lib/adminPermissions.js').PermissionAction[]> {
  const empty = Object.fromEntries(SYSTEM_PAGE_IDS.map((page) => [page, []])) as unknown as Record<
    SystemPageId,
    import('../../lib/adminPermissions.js').PermissionAction[]
  >

  if (!isRecord(input)) return empty

  for (const page of SYSTEM_PAGE_IDS) {
    const actions = input[page]
    if (!Array.isArray(actions)) continue
    const filtered = actions.filter(
      (action): action is import('../../lib/adminPermissions.js').PermissionAction =>
        typeof action === 'string' &&
        (PERMISSION_ACTIONS as readonly string[]).includes(action),
    )
    empty[page] = [...new Set(filtered)]
  }

  return empty
}

export function hasAnyPagePermission(permissions: Record<string, unknown[]>): boolean {
  return Object.values(permissions).some((actions) => actions.length > 0)
}
