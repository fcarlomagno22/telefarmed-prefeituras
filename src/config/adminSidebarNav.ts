import {
  Activity,
  Bell,
  Building2,
  Headphones,
  Key,
  Layers,
  LayoutDashboard,
  Receipt,
  ScrollText,
  Settings,
  Stethoscope,
  UserCog,
  UserRound,
} from 'lucide-react'
import type { SidebarNavSection } from '../components/layout/SidebarNavItem'
import type { SidebarNavItemProps } from '../components/layout/SidebarNavItem'
import { adminRoutes } from './adminRoutes'

export type AdminSidebarNavItem = SidebarNavItemProps & {
  description: string
}

export const adminNavItems: AdminSidebarNavItem[] = [
  {
    to: adminRoutes.dashboard,
    label: 'Dashboard',
    description:
      'Visão consolidada de todas as prefeituras, contratos e indicadores da operação em tempo real.',
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: adminRoutes.clientes,
    label: 'Clientes',
    description:
      'Cadastro, contratos e vínculos das prefeituras atendidas na plataforma Telefarmed.',
    icon: Building2,
    end: true,
  },
  {
    to: adminRoutes.monitorOperacional,
    label: 'Monitor Operacional',
    description:
      'Painel operacional em tempo real de toda a rede: filas, SLA e situação por região.',
    icon: Activity,
    end: true,
  },
  {
    to: adminRoutes.pacientes,
    label: 'Pacientes',
    description:
      'Base consolidada de pacientes dos municípios contratantes na plataforma Telefarmed.',
    icon: UserRound,
    end: true,
  },
  {
    to: adminRoutes.operadores,
    label: 'Operadores',
    description:
      'Operadores UBT vinculados aos contratos e unidades da rede municipal.',
    icon: UserCog,
    end: true,
  },
  {
    to: adminRoutes.profissionais,
    label: 'Profissionais',
    description:
      'Fila de candidaturas do portal e profissionais aprovados após finalização do cadastro.',
    icon: Stethoscope,
    end: true,
  },
  {
    to: adminRoutes.escala,
    label: 'Gestão de Escala',
    description:
      'Plantões por prefeitura e UBT, médico titular e fila de reserva se alguém faltar.',
    icon: Layers,
    end: true,
  },
  {
    to: adminRoutes.financeiro,
    label: 'Financeiro',
    description:
      'Faturamento, consumo de pacotes, repasses e indicadores financeiros por contrato.',
    icon: Receipt,
    end: true,
  },
  {
    to: adminRoutes.notificacoes,
    label: 'Notificações',
    description:
      'Comunicados, avisos e campanhas enviados às prefeituras e unidades da rede.',
    icon: Bell,
    end: true,
  },
  {
    to: adminRoutes.suporte,
    label: 'Suporte',
    description:
      'Central de chamados das prefeituras e UBTs com a equipe Telefarmed.',
    icon: Headphones,
    end: true,
  },
  {
    to: adminRoutes.auditoria,
    label: 'Auditoria',
    description:
      'Logs de auditoria e rastreabilidade de ações em toda a plataforma.',
    icon: ScrollText,
    end: true,
  },
  {
    to: adminRoutes.credenciais,
    label: 'Credenciais',
    description:
      'Acessos internos Telefarmed e credenciais de gestores e operadores dos clientes.',
    icon: Key,
    end: true,
  },
  {
    to: adminRoutes.configuracoes,
    label: 'Configurações',
    description:
      'Parâmetros globais, branding, políticas e preferências do sistema.',
    icon: Settings,
    end: true,
  },
]

export const adminSidebarItems: SidebarNavItemProps[] = adminNavItems.map(
  ({ description: _description, ...item }) => item,
)

export const adminSidebarSections: SidebarNavSection[] = [
  {
    id: 'visao-geral',
    label: 'Visão geral',
    items: adminSidebarItems.filter((item) => item.to === adminRoutes.dashboard),
  },
  {
    id: 'operacao',
    label: 'Operação',
    items: adminSidebarItems.filter((item) =>
      [adminRoutes.clientes, adminRoutes.monitorOperacional].includes(item.to),
    ),
  },
  {
    id: 'pessoas',
    label: 'Pessoas',
    items: adminSidebarItems.filter((item) =>
      [adminRoutes.pacientes, adminRoutes.operadores, adminRoutes.profissionais].includes(item.to),
    ),
  },
  {
    id: 'gestao',
    label: 'Gestão',
    items: adminSidebarItems.filter((item) =>
      [adminRoutes.escala, adminRoutes.financeiro, adminRoutes.notificacoes, adminRoutes.suporte].includes(
        item.to,
      ),
    ),
  },
  {
    id: 'seguranca',
    label: 'Governança e segurança',
    items: adminSidebarItems.filter((item) =>
      [adminRoutes.auditoria, adminRoutes.credenciais, adminRoutes.configuracoes].includes(item.to),
    ),
  },
]

export type AdminNavMatch = {
  item: AdminSidebarNavItem
  sectionLabel: string
}

function isNavPathActive(pathname: string, to: string, end?: boolean) {
  return end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`)
}

export function findAdminNavByPathname(pathname: string): AdminNavMatch | null {
  for (const section of adminSidebarSections) {
    const navItem = section.items.find((candidate) =>
      isNavPathActive(pathname, candidate.to, candidate.end),
    )
    if (!navItem) continue
    const item = adminNavItems.find((candidate) => candidate.to === navItem.to)
    if (!item) continue
    return { item, sectionLabel: section.label }
  }

  const item = adminNavItems.find((candidate) =>
    isNavPathActive(pathname, candidate.to, candidate.end),
  )
  if (!item) return null
  return { item, sectionLabel: 'Administração' }
}
