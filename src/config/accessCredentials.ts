import { ubtRoutes } from './ubtRoutes'

export type PermissionAction = 'visualizar' | 'inserir' | 'editar' | 'excluir'

export type AccessLevelId = 'administrador' | 'operador' | 'editor' | 'visualizador'

export type SystemPageId =
  | 'triagem'
  | 'agenda'
  | 'consultas'
  | 'usuarios'
  | 'relatorios'
  | 'suporte'
  | 'credenciais'

export type SystemPageDefinition = {
  id: SystemPageId
  label: string
  description: string
  route: string
}

export const permissionActions: {
  id: PermissionAction
  label: string
  shortLabel: string
}[] = [
  { id: 'visualizar', label: 'Visualizar', shortLabel: 'Ver' },
  { id: 'inserir', label: 'Inserir dados', shortLabel: 'Inserir' },
  { id: 'editar', label: 'Editar', shortLabel: 'Editar' },
  { id: 'excluir', label: 'Excluir', shortLabel: 'Excluir' },
]

export const systemPages: SystemPageDefinition[] = [
  {
    id: 'triagem',
    label: 'Triagem',
    description: 'Terminal de atendimento e fluxo de telemedicina',
    route: ubtRoutes.triagem,
  },
  {
    id: 'agenda',
    label: 'Agenda',
    description: 'Agendamentos e calendário da unidade',
    route: ubtRoutes.agenda,
  },
  {
    id: 'consultas',
    label: 'Consultas',
    description: 'Histórico e gestão de atendimentos',
    route: ubtRoutes.consultas,
  },
  {
    id: 'usuarios',
    label: 'Usuários da rede',
    description: 'Pacientes atendidos na rede',
    route: ubtRoutes.usuarios,
  },
  {
    id: 'relatorios',
    label: 'Relatórios',
    description: 'Indicadores e exportações',
    route: ubtRoutes.relatorios,
  },
  {
    id: 'suporte',
    label: 'Suporte técnico',
    description: 'Chamados e atendimento ao operador',
    route: ubtRoutes.suporte,
  },
  {
    id: 'credenciais',
    label: 'Credenciais de acesso',
    description: 'Gestão de usuários e permissões',
    route: ubtRoutes.credenciais,
  },
]

export const accessLevels: {
  id: AccessLevelId
  label: string
  description: string
}[] = [
  {
    id: 'administrador',
    label: 'Administrador',
    description: 'Acesso total a todas as páginas e ações',
  },
  {
    id: 'operador',
    label: 'Operador',
    description: 'Operação do dia a dia com inserção e edição',
  },
  {
    id: 'editor',
    label: 'Editor',
    description: 'Visualização e edição em páginas selecionadas',
  },
  {
    id: 'visualizador',
    label: 'Visualizador',
    description: 'Somente leitura nas páginas liberadas',
  },
]

const allActions: PermissionAction[] = ['visualizar', 'inserir', 'editar', 'excluir']
const viewOnly: PermissionAction[] = ['visualizar']
const viewEdit: PermissionAction[] = ['visualizar', 'editar']
const operatorActions: PermissionAction[] = ['visualizar', 'inserir', 'editar']

export function buildPresetPagePermissions(level: AccessLevelId): Record<SystemPageId, PermissionAction[]> {
  const empty = Object.fromEntries(
    systemPages.map((page) => [page.id, [] as PermissionAction[]]),
  ) as Record<SystemPageId, PermissionAction[]>

  if (level === 'administrador') {
    for (const page of systemPages) {
      empty[page.id] = [...allActions]
    }
    return empty
  }

  if (level === 'visualizador') {
    for (const page of systemPages) {
      if (page.id !== 'credenciais') {
        empty[page.id] = [...viewOnly]
      }
    }
    return empty
  }

  if (level === 'editor') {
    const editorPages: SystemPageId[] = ['agenda', 'consultas', 'usuarios', 'relatorios']
    for (const pageId of editorPages) {
      empty[pageId] = [...viewEdit]
    }
    empty.triagem = [...viewOnly]
    return empty
  }

  const operatorPages: SystemPageId[] = ['triagem', 'agenda', 'consultas', 'usuarios', 'suporte']
  for (const pageId of operatorPages) {
    empty[pageId] = [...operatorActions]
  }
  empty.relatorios = [...viewOnly]
  return empty
}

export function emptyPagePermissions(): Record<SystemPageId, PermissionAction[]> {
  return Object.fromEntries(
    systemPages.map((page) => [page.id, [] as PermissionAction[]]),
  ) as Record<SystemPageId, PermissionAction[]>
}

export function inferAccessLevelFromPermissions(
  permissions: Record<SystemPageId, PermissionAction[]>,
): AccessLevelId {
  const serialized = JSON.stringify(permissions)
  for (const level of accessLevels) {
    if (JSON.stringify(buildPresetPagePermissions(level.id)) === serialized) {
      return level.id
    }
  }
  return 'operador'
}
