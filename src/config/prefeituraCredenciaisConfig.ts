import {
  accessLevels,
  type AccessLevelId,
  type PermissionAction,
} from './accessCredentials'
import { prefeituraRoutes } from './prefeituraRoutes'

export type PrefeituraPortalPageId =
  | 'dashboard'
  | 'rede'
  | 'monitor'
  | 'consultas'
  | 'agendas'
  | 'usuarios'
  | 'faturamento'
  | 'contrato'
  | 'relatorios'
  | 'notificacoes'
  | 'suporte'
  | 'credenciais'
  | 'auditoria'

export type PrefeituraPortalPageDefinition = {
  id: PrefeituraPortalPageId
  label: string
  description: string
  route: string
}

export const prefeituraPortalPages: PrefeituraPortalPageDefinition[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Visão consolidada da operação da entidade',
    get route() {
      return prefeituraRoutes.dashboard
    },
  },
  {
    id: 'rede',
    label: 'UBTs',
    description: 'Rede de unidades e cobertura territorial',
    get route() {
      return prefeituraRoutes.rede
    },
  },
  {
    id: 'monitor',
    label: 'Monitor operacional',
    description: 'Filas e SLA em tempo real',
    get route() {
      return prefeituraRoutes.monitor
    },
  },
  {
    id: 'consultas',
    label: 'Consultas',
    description: 'Histórico e gestão de atendimentos',
    get route() {
      return prefeituraRoutes.consultas
    },
  },
  {
    id: 'agendas',
    label: 'Agenda',
    description: 'Agendamentos e calendário da entidade',
    get route() {
      return prefeituraRoutes.agendas
    },
  },
  {
    id: 'usuarios',
    label: 'Pacientes',
    description: 'Usuários atendidos na rede da entidade',
    get route() {
      return prefeituraRoutes.usuarios
    },
  },
  {
    id: 'faturamento',
    label: 'Faturamento SUS',
    description: 'Notas fiscais, competências e cobranças do contrato',
    get route() {
      return prefeituraRoutes.faturamento
    },
  },
  {
    id: 'contrato',
    label: 'Gestão de contrato',
    description: 'Contrato Telefarmed e consumo do pacote',
    get route() {
      return prefeituraRoutes.contrato
    },
  },
  {
    id: 'relatorios',
    label: 'Relatórios',
    description: 'Indicadores e exportações',
    get route() {
      return prefeituraRoutes.relatorios
    },
  },
  {
    id: 'notificacoes',
    label: 'Notificações',
    description: 'Comunicados à rede da entidade',
    get route() {
      return prefeituraRoutes.notificacoes
    },
  },
  {
    id: 'suporte',
    label: 'Suporte',
    description: 'Chamados e atendimento ao gestor',
    get route() {
      return prefeituraRoutes.suporte
    },
  },
  {
    id: 'credenciais',
    label: 'Credenciais de acesso',
    description: 'Gestão de usuários do portal',
    get route() {
      return prefeituraRoutes.credenciais
    },
  },
  {
    id: 'auditoria',
    label: 'Logs de auditoria',
    description: 'Rastreabilidade de ações no portal',
    get route() {
      return prefeituraRoutes.auditoria
    },
  },
]

export type PrefeituraCredentialUser = {
  id: string
  name: string
  email: string
  cpf: string
  role: string
  contractingEntityId: string
  contractingEntity: {
    id: string
    razaoSocial: string
    municipality: string
    uf: string
  }
  accessLevel: AccessLevelId
  status: 'ativo' | 'inativo'
  initials: string
  avatarClassName: string
  hasPassword: boolean
  hasAuthorizationPin: boolean
  lastAccessLabel: string
  pagePermissions: Record<PrefeituraPortalPageId, PermissionAction[]>
}

const allActions: PermissionAction[] = ['visualizar', 'inserir', 'editar', 'excluir']
const viewOnly: PermissionAction[] = ['visualizar']
const viewEdit: PermissionAction[] = ['visualizar', 'editar']
const operatorActions: PermissionAction[] = ['visualizar', 'inserir', 'editar']

const restrictedPages: PrefeituraPortalPageId[] = ['credenciais', 'auditoria']

export function emptyPrefeituraPagePermissions(): Record<
  PrefeituraPortalPageId,
  PermissionAction[]
> {
  return Object.fromEntries(
    prefeituraPortalPages.map((page) => [page.id, [] as PermissionAction[]]),
  ) as Record<PrefeituraPortalPageId, PermissionAction[]>
}

export function buildPrefeituraPagePermissions(
  level: AccessLevelId,
): Record<PrefeituraPortalPageId, PermissionAction[]> {
  const empty = emptyPrefeituraPagePermissions()

  if (level === 'administrador') {
    for (const page of prefeituraPortalPages) {
      empty[page.id] = [...allActions]
    }
    return empty
  }

  if (level === 'visualizador') {
    for (const page of prefeituraPortalPages) {
      if (!restrictedPages.includes(page.id)) {
        empty[page.id] = [...viewOnly]
      }
    }
    return empty
  }

  if (level === 'editor') {
    const editorPages: PrefeituraPortalPageId[] = [
      'rede',
      'consultas',
      'agendas',
      'usuarios',
      'faturamento',
      'contrato',
      'notificacoes',
      'suporte',
    ]
    for (const pageId of editorPages) {
      empty[pageId] = [...viewEdit]
    }
    for (const pageId of ['dashboard', 'monitor', 'relatorios'] as PrefeituraPortalPageId[]) {
      empty[pageId] = [...viewOnly]
    }
    return empty
  }

  const operatorPages: PrefeituraPortalPageId[] = [
    'dashboard',
    'monitor',
    'consultas',
    'agendas',
    'notificacoes',
    'suporte',
  ]
  for (const pageId of operatorPages) {
    empty[pageId] = [...operatorActions]
  }
  empty.rede = [...viewOnly]
  empty.usuarios = [...viewOnly]
  empty.faturamento = [...viewOnly]
  empty.contrato = [...viewOnly]
  empty.relatorios = [...viewOnly]
  empty.auditoria = [...viewOnly]
  return empty
}

export function inferPrefeituraAccessLevelFromPermissions(
  permissions: Record<PrefeituraPortalPageId, PermissionAction[]>,
): AccessLevelId {
  const serialized = JSON.stringify(permissions)
  for (const level of accessLevels) {
    if (JSON.stringify(buildPrefeituraPagePermissions(level.id)) === serialized) {
      return level.id
    }
  }
  return 'operador'
}
