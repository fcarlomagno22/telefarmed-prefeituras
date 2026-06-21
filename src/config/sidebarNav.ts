import {
  Bell,
  CalendarDays,
  ClipboardList,
  Filter,
  Headphones,
  Key,
  ScrollText,
  Users,
} from 'lucide-react'
import type { SidebarNavItemProps } from '../components/layout/SidebarNavItem'
import { ubtRoutes } from './ubtRoutes'

/** Rotas resolvidas em runtime (host dedicado vs `/ubt/*` local). */
export function getDefaultSidebarItems(): SidebarNavItemProps[] {
  return [
    {
      to: ubtRoutes.agenda,
      label: 'Agenda',
      icon: CalendarDays,
      end: true,
    },
    {
      to: ubtRoutes.triagem,
      label: 'Triagem',
      icon: Filter,
      end: true,
    },
    {
      to: ubtRoutes.consultas,
      label: 'Consultas',
      icon: ClipboardList,
      end: true,
    },
    {
      to: ubtRoutes.usuarios,
      label: 'Usuários da rede',
      icon: Users,
      end: true,
    },
    {
      to: ubtRoutes.notificacoes,
      label: 'Notificações',
      icon: Bell,
      end: true,
    },
    {
      to: ubtRoutes.suporte,
      label: 'Suporte técnico',
      icon: Headphones,
      end: true,
    },
    {
      to: ubtRoutes.credenciais,
      label: 'Credenciais de acesso',
      icon: Key,
      end: true,
    },
    {
      to: ubtRoutes.auditoria,
      label: 'Logs de auditoria',
      icon: ScrollText,
      end: true,
    },
  ]
}
