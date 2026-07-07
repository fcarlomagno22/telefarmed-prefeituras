import {
  BarChart3,
  Handshake,
  LayoutDashboard,
  Receipt,
  Users,
} from 'lucide-react'
import type { SidebarNavItemProps } from '../components/layout/SidebarNavItem'
import { crmPartnersRoutes } from './crmPartnersRoutes'

export const crmPartnersSidebarItems: SidebarNavItemProps[] = [
  {
    to: crmPartnersRoutes.dashboard,
    label: 'Dashboard',
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: crmPartnersRoutes.parceiros,
    label: 'Parceiros',
    icon: Handshake,
    end: true,
  },
  {
    to: crmPartnersRoutes.clientes,
    label: 'Clientes',
    icon: Users,
    end: true,
  },
  {
    to: crmPartnersRoutes.financeiro,
    label: 'Financeiro',
    icon: Receipt,
    end: true,
  },
  {
    to: crmPartnersRoutes.relatorios,
    label: 'Relatórios',
    icon: BarChart3,
    end: true,
  },
]
