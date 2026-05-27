import {
  BarChart3,
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

export const defaultSidebarItems: SidebarNavItemProps[] = [
  {
    to: '/agenda',
    label: 'Agenda',
    icon: CalendarDays,
    end: true,
  },
  {
    to: '/triagem',
    label: 'Triagem',
    icon: Filter,
    end: true,
  },
  {
    to: '/consultas',
    label: 'Consultas',
    icon: ClipboardList,
    end: true,
  },
  {
    to: '/usuarios',
    label: 'Usuários da rede',
    icon: Users,
    end: true,
  },
  {
    to: '/relatorios',
    label: 'Relatórios',
    icon: BarChart3,
    end: false,
  },
  {
    to: '/notificacoes',
    label: 'Notificações',
    icon: Bell,
    end: true,
  },
  {
    to: '/suporte',
    label: 'Suporte técnico',
    icon: Headphones,
    end: true,
  },
  {
    to: '/credenciais',
    label: 'Credenciais de acesso',
    icon: Key,
    end: true,
  },
  {
    to: '/auditoria',
    label: 'Logs de auditoria',
    icon: ScrollText,
    end: true,
  },
]
