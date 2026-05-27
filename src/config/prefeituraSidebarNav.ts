import {
  Activity,
  BarChart3,
  Bell,
  CalendarDays,
  ClipboardList,
  FileSignature,
  Headphones,
  LayoutDashboard,
  Network,
  ScrollText,
  Key,
  Users,
} from 'lucide-react'
import type {
  SidebarNavItemProps,
  SidebarNavSection,
} from '../components/layout/SidebarNavItem'

const visaoGeral: SidebarNavItemProps[] = [
  {
    to: '/prefeitura/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    end: true,
  },
]

const redeEOperacao: SidebarNavItemProps[] = [
  {
    to: '/prefeitura/rede',
    label: 'UBTs',
    icon: Network,
    end: true,
  },
  {
    to: '/prefeitura/monitor',
    label: 'Monitor Operacional',
    icon: Activity,
    end: true,
  },
  {
    to: '/prefeitura/consultas',
    label: 'Consultas',
    icon: ClipboardList,
    end: true,
  },
  {
    to: '/prefeitura/agendas',
    label: 'Agenda',
    icon: CalendarDays,
    end: true,
  },
  {
    to: '/prefeitura/usuarios',
    label: 'Pacientes',
    icon: Users,
    end: true,
  },
]

const contratoEIndicadores: SidebarNavItemProps[] = [
  {
    to: '/prefeitura/contrato',
    label: 'Gestão de Contrato',
    icon: FileSignature,
    end: true,
  },
  {
    to: '/prefeitura/relatorios',
    label: 'Relatórios',
    icon: BarChart3,
    end: true,
    comingSoon: true,
  },
]

const comunicacao: SidebarNavItemProps[] = [
  {
    to: '/prefeitura/notificacoes',
    label: 'Notificações',
    icon: Bell,
    end: true,
  },
  {
    to: '/prefeitura/suporte',
    label: 'Suporte',
    icon: Headphones,
    end: true,
  },
]

const governanca: SidebarNavItemProps[] = [
  {
    to: '/prefeitura/credenciais',
    label: 'Credenciais de acesso',
    icon: Key,
    end: true,
  },
  {
    to: '/prefeitura/auditoria',
    label: 'Logs de Auditoria',
    icon: ScrollText,
    end: true,
  },
]

export const prefeituraSidebarSections: SidebarNavSection[] = [
  { id: 'visao-geral', label: 'Visão geral', items: visaoGeral },
  { id: 'rede-operacao', label: 'Rede e operação', items: redeEOperacao },
  {
    id: 'contrato-indicadores',
    label: 'Contrato e indicadores',
    items: contratoEIndicadores,
  },
  { id: 'comunicacao', label: 'Comunicação', items: comunicacao },
  { id: 'governanca', label: 'Governança', items: governanca },
]

/** Lista plana — útil para buscas e compatibilidade. */
export const prefeituraSidebarItems: SidebarNavItemProps[] =
  prefeituraSidebarSections.flatMap((section) => section.items)
