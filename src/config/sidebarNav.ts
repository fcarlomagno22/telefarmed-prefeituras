import { CalendarDays, Filter, Users } from 'lucide-react'
import type { SidebarNavItemProps } from '../components/layout/SidebarNavItem'

export const defaultSidebarItems: SidebarNavItemProps[] = [
  {
    to: '/triagem',
    label: 'Triagem',
    icon: Filter,
    end: true,
  },
  {
    to: '/agenda',
    label: 'Agenda',
    icon: CalendarDays,
    end: true,
  },
  {
    to: '/usuarios',
    label: 'Usuários da rede',
    icon: Users,
    end: true,
  },
]
