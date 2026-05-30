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
  Users,
} from 'lucide-react'
import type { SidebarNavSection } from '../components/layout/SidebarNavItem'
import type { SidebarNavItemProps } from '../components/layout/SidebarNavItem'

export type AdminSidebarNavItem = SidebarNavItemProps & {
  description: string
}

export const adminNavItems: AdminSidebarNavItem[] = [
  {
    to: '/admin/dashboard',
    label: 'Dashboard',
    description:
      'Visão consolidada de todas as prefeituras, contratos e indicadores da operação em tempo real.',
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: '/admin/clientes',
    label: 'Clientes',
    description:
      'Cadastro, contratos e vínculos das prefeituras atendidas na plataforma Telefarmed.',
    icon: Building2,
    end: true,
  },
  {
    to: '/admin/monitor-operacional',
    label: 'Monitor Operacional',
    description:
      'Painel operacional em tempo real de toda a rede: filas, SLA e situação por região.',
    icon: Activity,
    end: true,
  },
  {
    to: '/admin/pessoas',
    label: 'Pessoas',
    description:
      'Base consolidada de pacientes, médicos e operadores dos municípios contratantes.',
    icon: Users,
    end: true,
  },
  {
    to: '/admin/escala',
    label: 'Gestão de Escala',
    description:
      'Plantões por prefeitura e UBT, médico titular e fila de reserva se alguém faltar.',
    icon: Layers,
    end: true,
  },
  {
    to: '/admin/financeiro',
    label: 'Financeiro',
    description:
      'Faturamento, consumo de pacotes, repasses e indicadores financeiros por contrato.',
    icon: Receipt,
    end: true,
  },
  {
    to: '/admin/notificacoes',
    label: 'Notificações',
    description:
      'Comunicados, avisos e campanhas enviados às prefeituras e unidades da rede.',
    icon: Bell,
    end: true,
  },
  {
    to: '/admin/suporte',
    label: 'Suporte',
    description:
      'Central de chamados das prefeituras e UBTs com a equipe Telefarmed.',
    icon: Headphones,
    end: true,
  },
  {
    to: '/admin/auditoria',
    label: 'Auditoria',
    description:
      'Logs de auditoria e rastreabilidade de ações em toda a plataforma.',
    icon: ScrollText,
    end: true,
  },
  {
    to: '/admin/credenciais',
    label: 'Credenciais',
    description:
      'Acessos internos Telefarmed e credenciais de gestores e operadores dos clientes.',
    icon: Key,
    end: true,
  },
  {
    to: '/admin/configuracoes',
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
    items: adminSidebarItems.filter((item) => item.to === '/admin/dashboard'),
  },
  {
    id: 'operacao',
    label: 'Operação',
    items: adminSidebarItems.filter((item) =>
      ['/admin/clientes', '/admin/monitor-operacional', '/admin/pessoas'].includes(
        item.to,
      ),
    ),
  },
  {
    id: 'gestao',
    label: 'Gestão',
    items: adminSidebarItems.filter((item) =>
      [
        '/admin/escala',
        '/admin/financeiro',
        '/admin/notificacoes',
        '/admin/suporte',
      ].includes(item.to),
    ),
  },
  {
    id: 'seguranca',
    label: 'Governança e segurança',
    items: adminSidebarItems.filter((item) =>
      ['/admin/auditoria', '/admin/credenciais', '/admin/configuracoes'].includes(item.to),
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
