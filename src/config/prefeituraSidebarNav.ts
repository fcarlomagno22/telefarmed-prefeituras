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
  Receipt,
  ScrollText,
  Key,
  Users,
} from 'lucide-react'
import type {
  SidebarNavItemProps,
  SidebarNavSection,
} from '../components/layout/SidebarNavItem'
import { prefeituraRoutes } from './prefeituraRoutes'

/** Rotas resolvidas em runtime (host dedicado vs `/prefeitura/*` local). */
export function getPrefeituraSidebarSections(): SidebarNavSection[] {
  return [
    {
      id: 'visao-geral',
      label: 'Visão geral',
      items: [
        {
          to: prefeituraRoutes.dashboard,
          label: 'Dashboard',
          icon: LayoutDashboard,
          end: true,
        },
      ],
    },
    {
      id: 'rede-operacao',
      label: 'Rede e operação',
      items: [
        {
          to: prefeituraRoutes.rede,
          label: 'UBTs',
          icon: Network,
          end: true,
        },
        {
          to: prefeituraRoutes.monitor,
          label: 'Monitor Operacional',
          icon: Activity,
          end: true,
        },
        {
          to: prefeituraRoutes.consultas,
          label: 'Consultas',
          icon: ClipboardList,
          end: true,
        },
        {
          to: prefeituraRoutes.agendas,
          label: 'Agenda',
          icon: CalendarDays,
          end: true,
        },
        {
          to: prefeituraRoutes.usuarios,
          label: 'Pacientes',
          icon: Users,
          end: true,
        },
      ],
    },
    {
      id: 'financeiro',
      label: 'Financeiro',
      items: [
        {
          to: prefeituraRoutes.faturamento,
          label: 'Faturamento SUS',
          icon: Receipt,
          end: true,
        },
      ],
    },
    {
      id: 'contrato-indicadores',
      label: 'Contrato e indicadores',
      items: [
        {
          to: prefeituraRoutes.contrato,
          label: 'Gestão de Contrato',
          icon: FileSignature,
          end: true,
        },
        {
          to: prefeituraRoutes.relatorios,
          label: 'Relatórios',
          icon: BarChart3,
          end: true,
        },
      ],
    },
    {
      id: 'comunicacao',
      label: 'Comunicação',
      items: [
        {
          to: prefeituraRoutes.notificacoes,
          label: 'Notificações',
          icon: Bell,
          end: true,
        },
        {
          to: prefeituraRoutes.suporte,
          label: 'Suporte',
          icon: Headphones,
          end: true,
        },
      ],
    },
    {
      id: 'governanca',
      label: 'Governança',
      items: [
        {
          to: prefeituraRoutes.credenciais,
          label: 'Credenciais de acesso',
          icon: Key,
          end: true,
        },
        {
          to: prefeituraRoutes.auditoria,
          label: 'Logs de Auditoria',
          icon: ScrollText,
          end: true,
        },
      ],
    },
  ]
}

/** Lista plana — útil para buscas e compatibilidade. */
export function getPrefeituraSidebarItems(): SidebarNavItemProps[] {
  return getPrefeituraSidebarSections().flatMap((section) => section.items)
}
