import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { ProfissionalAtendimentosChartsSidebar } from '../components/profissional/atendimentos/ProfissionalAtendimentosChartsSidebar'
import {
  ProfissionalAtendimentosMainPanel,
  type ProfissionalAtendimentosMainPanelHandle,
} from '../components/profissional/atendimentos/ProfissionalAtendimentosMainPanel'
import {
  profissionalAtendimentosColumnFillClass,
  profissionalAtendimentosColumnsGridClass,
  profissionalAtendimentosColumnScrollClass,
} from '../components/profissional/atendimentos/profissionalAtendimentosPageLayout'
import { ProfissionalOnboardingTour } from '../components/profissional/onboarding/ProfissionalOnboardingTour'
import { ProfissionalTourInviteModal } from '../components/profissional/onboarding/ProfissionalTourInviteModal'
import { ProfissionalPageHeader } from '../components/profissional/ProfissionalPageHeader'
import {
  dashboardPageFillScrollAreaClass,
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import {
  profissionalAtendimentosDrawerTourStepIds,
  PROFISSIONAL_ATENDIMENTOS_TOUR_PREVIEW_ATTACHMENT_ID,
  type ProfissionalAtendimentosTourStep,
} from '../config/profissionalAtendimentosTour'
import { profissionalTourInviteMeta } from '../config/profissionalTourInvite'
import { PROFISSIONAL_HISTORICO_DEMO_RECORD_ID } from '../config/profissionalHistoricoDemo'
import { findProfissionalNavByPathname } from '../config/profissionalSidebarNav'
import { useProfissionalAtendimentosTour } from '../hooks/useProfissionalAtendimentosTour'
import type { ProfissionalAttendanceRecord } from '../types/profissionalAtendimentos'

const fallbackMeta = {
  title: 'Atendimentos',
  description:
    'Consultas realizadas, documentos emitidos e situação de cada atendimento.',
}

const LIST_TOUR_STEP_IDS = new Set([
  'main-panel',
  'filters',
  'table',
  'view-details',
  'pagination',
])

const OVERLAY_PREP_STEP_IDS = new Set([
  'drawer-header',
  'drawer-notes',
  'full-record-btn',
  'drawer-sent',
  'drawer-received',
  'attachment-preview-btn',
])

export function ProfissionalAtendimentosPage() {
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const meta = findProfissionalNavByPathname(pathname) ?? fallbackMeta
  const forceTourStart = searchParams.get('tour') === 'atendimentos'
  const abrirRecordId = searchParams.get('abrir')
  const initialOpenRecordId =
    abrirRecordId === PROFISSIONAL_HISTORICO_DEMO_RECORD_ID ? abrirRecordId : null
  const mainPanelRef = useRef<ProfissionalAtendimentosMainPanelHandle>(null)

  const [filteredRecords, setFilteredRecords] = useState<ProfissionalAttendanceRecord[]>([])
  const [listLoading, setListLoading] = useState(true)

  const handleFilteredRecordsChange = useCallback((records: ProfissionalAttendanceRecord[]) => {
    setFilteredRecords(records)
  }, [])

  const handleListLoadingChange = useCallback((loading: boolean) => {
    setListLoading(loading)
  }, [])

  const handleTourStepActive = useCallback((step: ProfissionalAtendimentosTourStep) => {
    if (step.id === 'full-record-modal') {
      mainPanelRef.current?.openDemoRecord()
      mainPanelRef.current?.openFullRecord()
      return
    }

    if (step.id === 'attachment-viewer') {
      mainPanelRef.current?.openDemoRecord()
      mainPanelRef.current?.openReceivedPreview(PROFISSIONAL_ATENDIMENTOS_TOUR_PREVIEW_ATTACHMENT_ID)
      return
    }

    if (OVERLAY_PREP_STEP_IDS.has(step.id)) {
      mainPanelRef.current?.openDemoRecord()
      mainPanelRef.current?.closeAttachmentPreview()
      if (step.id !== 'full-record-btn') {
        mainPanelRef.current?.closeFullRecord()
      }
      return
    }

    if (LIST_TOUR_STEP_IDS.has(step.id) || step.id === 'welcome' || step.id === 'charts-sidebar') {
      mainPanelRef.current?.closeAllOverlays()
    }
  }, [])

  const handleTourBeforeAdvance = useCallback(
    (step: ProfissionalAtendimentosTourStep, source: 'next' | 'target-click') => {
      if (step.id === 'view-details') {
        mainPanelRef.current?.openDemoRecord()
      }

      if (step.id === 'full-record-btn') {
        mainPanelRef.current?.openFullRecord()
      }

      if (step.id === 'attachment-preview-btn') {
        mainPanelRef.current?.openReceivedPreview(PROFISSIONAL_ATENDIMENTOS_TOUR_PREVIEW_ATTACHMENT_ID)
      }

      if (step.id === 'attachment-viewer' && source === 'next') {
        mainPanelRef.current?.closeAttachmentPreview()
      }

      if (step.id === 'full-record-modal' && source === 'next') {
        mainPanelRef.current?.closeFullRecord()
      }

      if (step.id === 'charts-sidebar') {
        mainPanelRef.current?.closeAllOverlays()
      }
    },
    [],
  )

  const tour = useProfissionalAtendimentosTour({
    forceStart: forceTourStart,
    onStepActive: handleTourStepActive,
    onBeforeAdvance: handleTourBeforeAdvance,
  })

  const tourLockDrawerClose =
    tour.active && profissionalAtendimentosDrawerTourStepIds.has(tour.step.id)

  useEffect(() => {
    if (tour.active) return
    mainPanelRef.current?.closeAllOverlays()
  }, [tour.active])

  return (
    <div className={dashboardPageShellClass} aria-label={meta.title}>
      <div className={dashboardPageHeaderWrapClass}>
        <ProfissionalPageHeader
          title={meta.title}
          description={meta.description}
          actions={
            !tour.active ? (
              <button
                type="button"
                onClick={() => tour.startTour({ replay: true })}
                className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50/80 px-3 py-2 text-xs font-semibold text-[var(--brand-primary)] transition hover:bg-orange-100"
              >
                Ver tour guiado
              </button>
            ) : null
          }
        />
      </div>

      <div className={dashboardPageFillScrollAreaClass}>
        <div
          className={[
            profissionalAtendimentosColumnsGridClass,
            dashboardPageScrollPaddingClass,
            'mt-4 pb-5',
          ].join(' ')}
        >
          <div className={profissionalAtendimentosColumnScrollClass}>
            <div className={profissionalAtendimentosColumnFillClass}>
              <ProfissionalAtendimentosMainPanel
                ref={mainPanelRef}
                onFilteredRecordsChange={handleFilteredRecordsChange}
                onLoadingChange={handleListLoadingChange}
                tourLockDrawerClose={tourLockDrawerClose}
                tourActive={tour.active}
                initialOpenRecordId={initialOpenRecordId}
              />
            </div>
          </div>

          <div className={profissionalAtendimentosColumnScrollClass}>
            <div className={profissionalAtendimentosColumnFillClass}>
              <ProfissionalAtendimentosChartsSidebar records={filteredRecords} isLoading={listLoading} />
            </div>
          </div>
        </div>
      </div>

      <ProfissionalTourInviteModal
        open={tour.inviteOpen}
        {...profissionalTourInviteMeta.atendimentos}
        onStart={tour.acceptInvite}
        onDismiss={tour.dismissInvite}
      />

      <ProfissionalOnboardingTour
        open={tour.active}
        title={tour.step.title}
        body={tour.step.body}
        hint={tour.step.hint}
        stepIndex={tour.stepIndex}
        totalSteps={tour.totalSteps}
        placement={tour.step.placement}
        targetRect={tour.targetRect}
        advanceOn={tour.step.advanceOn}
        isLastStep={tour.isLastStep}
        nextLabel={tour.step.nextLabel}
        blockBackground={
          tour.step.advanceOn !== 'target-click' &&
          tour.step.advanceOn !== 'next-or-target-click'
        }
        onNext={tour.goNext}
        onBack={tour.goBack}
      />
    </div>
  )
}
