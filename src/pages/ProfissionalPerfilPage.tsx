import { useLocation } from 'react-router-dom'
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
import { profissionalLoggedProfile } from '../data/profissionalPerfilMock'
import { usePageSkeletonLoading } from '../hooks/usePageSkeletonLoading'

const fallbackMeta = {
  title: 'Meu perfil',
  description:
    'Dados profissionais, documentos, empresa, PIX, foto e certificado digital ICP-Brasil do seu conselho.',
}

export function ProfissionalPerfilPage() {
  const { pathname } = useLocation()
  const meta = findProfissionalNavByPathname(pathname) ?? fallbackMeta
  const isLoading = usePageSkeletonLoading(900)

  return (
    <div className={dashboardPageShellClass} aria-busy={isLoading} aria-label={meta.title}>
      <div className={dashboardPageHeaderWrapClass}>
        {isLoading ? (
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
          {isLoading ? (
            <div
              className="grid animate-pulse grid-cols-1 gap-5 @min-[920px]:grid-cols-[1fr_1fr_288px] @min-[920px]:grid-rows-[auto_auto]"
              aria-busy="true"
            >
              <div className="h-[26rem] rounded-xl bg-gray-100 @min-[920px]:col-start-1 @min-[920px]:row-start-1" />
              <div className="h-[26rem] rounded-xl bg-gray-100 @min-[920px]:col-start-2 @min-[920px]:row-start-1" />
              <div className="flex flex-col gap-5 @min-[920px]:row-span-2">
                <div className="h-36 rounded-xl bg-gray-100" />
                <div className="h-44 rounded-xl bg-gray-100" />
                <div className="h-48 rounded-xl bg-gray-100" />
              </div>
              <div className="h-52 rounded-xl bg-gray-100 @min-[920px]:col-span-2" />
            </div>
          ) : (
            <ProfissionalPerfilPageContent profile={profissionalLoggedProfile} />
          )}
        </div>
      </div>
    </div>
  )
}
