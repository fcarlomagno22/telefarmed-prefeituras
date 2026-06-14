import { ProfissionalPageHeader } from '../components/profissional/ProfissionalPageHeader'
import { ProfissionalPageHeaderSkeleton } from '../components/profissional/ProfissionalPageHeaderSkeleton'
import { ProfissionalPerfilPageContent } from '../components/profissional/perfil/ProfissionalPerfilPageContent'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollAreaClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import { findProfissionalNavByPathname } from '../config/profissionalSidebarNav'
import { useProfissionalPerfilPage } from '../hooks/useProfissionalPerfilPage'
import { shouldShowPortalPageLoadingBlock } from '../utils/portal/portalPageLoading'
import { ProfissionalPerfilPageSkeleton } from '../components/profissional/skeletons/ProfissionalPerfilPageSkeleton'
import { useLocation } from 'react-router-dom'

const fallbackMeta = {
  title: 'Meu perfil',
  description:
    'Dados profissionais, documentos, empresa, PIX, foto e certificado digital ICP-Brasil do seu conselho.',
}

export function ProfissionalPerfilPage() {
  const { pathname } = useLocation()
  const meta = findProfissionalNavByPathname(pathname) ?? fallbackMeta
  const { profile, isLoading, loadError, isSaving, saveProfile } = useProfissionalPerfilPage()
  const showLoadingBlock = shouldShowPortalPageLoadingBlock(isLoading, profile != null)

  return (
    <div className={dashboardPageShellClass} aria-busy={showLoadingBlock} aria-label={meta.title}>
      <div className={dashboardPageHeaderWrapClass}>
        {showLoadingBlock ? (
          <ProfissionalPageHeaderSkeleton />
        ) : (
          <ProfissionalPageHeader
            title={meta.title}
            description={meta.description}
            hideProfileLink
          />
        )}
      </div>

      <div className={dashboardPageScrollAreaClass}>
        <div className={['@container', dashboardPageScrollPaddingClass, 'mt-4'].join(' ')}>
          {showLoadingBlock ? (
            <ProfissionalPerfilPageSkeleton />
          ) : loadError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {loadError}
            </div>
          ) : profile ? (
            <ProfissionalPerfilPageContent
              profile={profile}
              isSaving={isSaving}
              onSaveProfile={saveProfile}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
