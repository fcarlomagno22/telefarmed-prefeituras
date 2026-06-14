import {
  accessLevels,
  type AccessLevelId,
  type PermissionAction,
} from './accessCredentials'

export type AdminPortalPageId =
  | 'dashboard'
  | 'clientes'
  | 'monitor'
  | 'pessoas'
  | 'profissionais'
  | 'gestaoEscala'
  | 'financeiro'
  | 'notificacoes'
  | 'suporte'
  | 'auditoria'
  | 'credenciais'
  | 'configuracoes'

export type AdminPortalPageDefinition = {
  id: AdminPortalPageId
  label: string
  description: string
  route: string
}

export const adminPortalPages: AdminPortalPageDefinition[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Visão consolidada da operação',
    route: '/admin/dashboard',
  },
  {
    id: 'clientes',
    label: 'Clientes',
    description: 'Prefeituras e contratos',
    route: '/admin/clientes',
  },
  {
    id: 'monitor',
    label: 'Monitor operacional',
    description: 'Filas e SLA em tempo real',
    route: '/admin/monitor-operacional',
  },
  {
    id: 'pessoas',
    label: 'Pessoas',
    description: 'Pacientes e operadores UBT',
    route: '/admin/pacientes',
  },
  {
    id: 'profissionais',
    label: 'Profissionais',
    description: 'Candidaturas e profissionais ativos',
    route: '/admin/profissionais',
  },
  {
    id: 'gestaoEscala',
    label: 'Gestão de Escala',
    description: 'Escalas médicas e plantões',
    route: '/admin/escala',
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    description: 'Faturamento e repasses',
    route: '/admin/financeiro',
  },
  {
    id: 'notificacoes',
    label: 'Notificações',
    description: 'Comunicados à rede',
    route: '/admin/notificacoes',
  },
  {
    id: 'suporte',
    label: 'Suporte',
    description: 'Chamados da plataforma',
    route: '/admin/suporte',
  },
  {
    id: 'auditoria',
    label: 'Auditoria',
    description: 'Logs e rastreabilidade',
    route: '/admin/auditoria',
  },
  {
    id: 'credenciais',
    label: 'Credenciais',
    description: 'Gestão de acessos',
    route: '/admin/credenciais',
  },
  {
    id: 'configuracoes',
    label: 'Configurações',
    description: 'Parâmetros globais',
    route: '/admin/configuracoes',
  },
]

export const adminInternoDepartments = [
  { value: 'operacoes', label: 'Operações' },
  { value: 'comercial', label: 'Comercial e clientes' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'suporte', label: 'Suporte e CS' },
  { value: 'ti', label: 'Tecnologia' },
  { value: 'diretoria', label: 'Diretoria' },
] as const

export type AdminInternoDepartmentId = (typeof adminInternoDepartments)[number]['value']

export type AdminInternoCredentialUser = {
  id: string
  name: string
  email: string
  cpf: string
  role: string
  departmentId: AdminInternoDepartmentId
  accessLevel: AccessLevelId
  status: 'ativo' | 'inativo'
  initials: string
  avatarClassName: string
  hasPassword: boolean
  hasAuthorizationPin: boolean
  lastAccessLabel: string
  pagePermissions: Record<AdminPortalPageId, PermissionAction[]>
}

const allActions: PermissionAction[] = ['visualizar', 'inserir', 'editar', 'excluir']
const viewOnly: PermissionAction[] = ['visualizar']
const viewEdit: PermissionAction[] = ['visualizar', 'editar']
const operatorActions: PermissionAction[] = ['visualizar', 'inserir', 'editar']

const restrictedPages: AdminPortalPageId[] = ['credenciais', 'configuracoes']

export function emptyAdminPagePermissions(): Record<AdminPortalPageId, PermissionAction[]> {
  return Object.fromEntries(
    adminPortalPages.map((page) => [page.id, [] as PermissionAction[]]),
  ) as Record<AdminPortalPageId, PermissionAction[]>
}

export function buildAdminInternoPagePermissions(
  level: AccessLevelId,
): Record<AdminPortalPageId, PermissionAction[]> {
  const empty = emptyAdminPagePermissions()

  if (level === 'administrador') {
    for (const page of adminPortalPages) {
      empty[page.id] = [...allActions]
    }
    return empty
  }

  if (level === 'visualizador') {
    for (const page of adminPortalPages) {
      if (!restrictedPages.includes(page.id)) {
        empty[page.id] = [...viewOnly]
      }
    }
    return empty
  }

  if (level === 'editor') {
    const editorPages: AdminPortalPageId[] = [
      'clientes',
      'pessoas',
      'profissionais',
      'gestaoEscala',
      'notificacoes',
      'suporte',
      'financeiro',
    ]
    for (const pageId of editorPages) {
      empty[pageId] = [...viewEdit]
    }
    for (const pageId of ['dashboard', 'monitor', 'auditoria'] as AdminPortalPageId[]) {
      empty[pageId] = [...viewOnly]
    }
    return empty
  }

  const operatorPages: AdminPortalPageId[] = [
    'dashboard',
    'clientes',
    'monitor',
    'suporte',
    'notificacoes',
  ]
  for (const pageId of operatorPages) {
    empty[pageId] = [...operatorActions]
  }
  empty.pessoas = [...viewOnly]
  empty.profissionais = [...viewOnly]
  empty.gestaoEscala = [...viewOnly]
  empty.financeiro = [...viewOnly]
  empty.auditoria = [...viewOnly]
  return empty
}

export function inferAdminInternoAccessLevelFromPermissions(
  permissions: Record<AdminPortalPageId, PermissionAction[]>,
): AccessLevelId {
  const serialized = JSON.stringify(permissions)
  for (const level of accessLevels) {
    if (JSON.stringify(buildAdminInternoPagePermissions(level.id)) === serialized) {
      return level.id
    }
  }
  return 'operador'
}
