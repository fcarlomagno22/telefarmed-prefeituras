import { useLocation } from 'react-router-dom'
import { AdminPageHeader } from '../components/admin/AdminPageHeader'
import { AdminPlaceholderPanel } from '../components/admin/AdminPlaceholderPanel'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollAreaClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import { findAdminNavByPathname } from '../config/adminSidebarNav'

const defaultSectionLabel = 'Plataforma'
const defaultTitle = 'Dashboard'
const defaultDescription =
  'Gestão centralizada das prefeituras, contratos e operação da plataforma Telefarmed.'

export function AdminPlaceholderPage() {
  const { pathname } = useLocation()
  const match = findAdminNavByPathname(pathname)

  const title = match?.item.label ?? defaultTitle
  const sectionLabel = match?.sectionLabel ?? defaultSectionLabel
  const description = match?.item.description ?? defaultDescription

  return (
    <div className={dashboardPageShellClass} aria-label={title}>
      <div className={dashboardPageHeaderWrapClass}>
        <AdminPageHeader
          sectionLabel={sectionLabel}
          title={title}
          description={description}
        />
      </div>

      <div className={dashboardPageScrollAreaClass}>
        <div className={[dashboardPageScrollPaddingClass, 'mt-4 pb-5'].join(' ')}>
          <AdminPlaceholderPanel title={title} />
        </div>
      </div>
    </div>
  )
}
