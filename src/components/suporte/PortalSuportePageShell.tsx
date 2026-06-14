import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react'
import { PortalSuporteMainPanel } from './PortalSuporteMainPanel'
import { SuporteMainPanelSkeleton } from './SuporteMainPanelSkeleton'
import { SuporteSidebarPanel } from './SuporteSidebarPanel'
import { SuporteSidebarPanelSkeleton } from './SuporteSidebarPanelSkeleton'
import { SupportPageHeader } from './SupportPageHeader'
import { SupportPageHeaderSkeleton } from './SupportPageHeaderSkeleton'
import {
  suporteColumnFillClass,
  suporteColumnScrollClass,
  suporteColumnsGridClass,
} from './suportePageLayout'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../layout/dashboardPageLayout'
import { Toast } from '../ui/Toast'
import {
  usePortalSuportePage,
  type PortalSuporteVariant,
} from '../../hooks/usePortalSuportePage'
import { usePortalSupportTicketDrawer } from '../../hooks/usePortalSupportTicketDrawer'
import {
  shouldShowPortalPageLoadingBlock,
} from '../../utils/portal/portalPageLoading'
import { usePageSkeletonLoading } from '../../hooks/usePageSkeletonLoading'
import { useProfissionalSuportePageStateOptional } from '../../contexts/ProfissionalSuporteContext'
import { usePrefeituraSuportePageStateOptional } from '../../contexts/PrefeituraSuporteContext'
import { useUbtSuportePageStateOptional } from '../../contexts/UbtSuporteContext'
import type { SupportTicket } from '../../data/suporteMock'
import { PROFISSIONAL_SUPORTE_TOUR_DEMO_TICKET_ID } from '../../config/profissionalSuporteTour'
import {
  filterProfissionalSuporteTourTickets,
  resolveProfissionalSuporteTourSidebar,
  resolveProfissionalSuporteTourTickets,
} from '../../utils/profissional/profissionalTourDemoFallbacks'

type PortalSuportePageShellProps = {
  variant: PortalSuporteVariant
  getAccessToken: () => string | null
  showUbtColumn?: boolean
  summaryTitle?: string
  headerVariant?: 'ubt' | 'prefeitura'
  toolbarActions?: React.ReactNode
  renderToolbarActions?: (openNewTicket: () => void) => React.ReactNode
  readOnlyForTicket?: (ticket: SupportTicket) => boolean
  tourActive?: boolean
  tourLockDrawerClose?: boolean
  newTicketTourLockClose?: boolean
  shellLoadingDelayMs?: number
  headerSlot?: React.ReactNode
  headerSkeleton?: React.ReactNode
  showNewTicketButton?: boolean
  canReplyToTickets?: boolean
}

export type PortalSuportePageShellHandle = {
  openNewTicketDrawer: () => void
  closeNewTicketDrawer: () => void
  openDemoTicket: () => void
  closeTicketDrawer: () => void
  resetFilters: () => void
}

export const PortalSuportePageShell = forwardRef<
  PortalSuportePageShellHandle,
  PortalSuportePageShellProps
>(function PortalSuportePageShell(
  {
    variant,
    getAccessToken,
    showUbtColumn = false,
    summaryTitle,
    headerVariant,
    toolbarActions,
    renderToolbarActions,
    readOnlyForTicket,
    tourActive = false,
    tourLockDrawerClose = false,
    newTicketTourLockClose = false,
    shellLoadingDelayMs = 800,
    headerSlot,
    headerSkeleton,
    showNewTicketButton = true,
    canReplyToTickets = true,
  },
  ref,
) {
  const profissionalSuporte = useProfissionalSuportePageStateOptional()
  const prefeituraSuporte = usePrefeituraSuportePageStateOptional()
  const ubtSuporte = useUbtSuportePageStateOptional()
  const layoutSuporte =
    variant === 'profissional'
      ? profissionalSuporte
      : variant === 'prefeitura'
        ? prefeituraSuporte
        : variant === 'ubt'
          ? ubtSuporte
          : null
  const useLayoutSuporte = layoutSuporte != null
  const internalSuporte = usePortalSuportePage({
    variant,
    getAccessToken,
    readOnlyForTicket,
    enabled: !useLayoutSuporte,
  })
  const suporte = useLayoutSuporte ? layoutSuporte : internalSuporte

  const isLoadingShellRaw = usePageSkeletonLoading(shellLoadingDelayMs)
  const isLoadingShell = shellLoadingDelayMs > 0 && isLoadingShellRaw

  const newTicketDrawer = usePortalSupportTicketDrawer({
    tourLockClose: newTicketTourLockClose,
    onCreateTicket: suporte.createTicket,
  })

  const resolvedToolbarActions =
    renderToolbarActions?.(newTicketDrawer.openDrawer) ?? toolbarActions

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerClosing, setDrawerClosing] = useState(false)

  const tourSourceTickets = useMemo(
    () => resolveProfissionalSuporteTourTickets(suporte.tickets, tourActive),
    [suporte.tickets, tourActive],
  )

  const tourUsesMock = tourActive && tourSourceTickets.length > 0 && suporte.tickets.length === 0

  const filteredTourTickets = useMemo(() => {
    if (!tourUsesMock) return []
    return filterProfissionalSuporteTourTickets(
      tourSourceTickets,
      suporte.search,
      suporte.statusFilter,
      suporte.openOnly,
    )
  }, [
    suporte.openOnly,
    suporte.search,
    suporte.statusFilter,
    tourSourceTickets,
    tourUsesMock,
  ])

  const displayTickets = useMemo(() => {
    if (!tourUsesMock) return suporte.tickets
    const start = (suporte.currentPage - 1) * suporte.pageSize
    return filteredTourTickets.slice(start, start + suporte.pageSize)
  }, [
    filteredTourTickets,
    suporte.currentPage,
    suporte.pageSize,
    suporte.tickets,
    tourUsesMock,
  ])

  const displayTotal = tourUsesMock ? filteredTourTickets.length : suporte.total
  const displayTotalPages = tourUsesMock
    ? Math.max(1, Math.ceil(filteredTourTickets.length / suporte.pageSize))
    : suporte.totalPages

  const displaySidebar = useMemo(
    () => resolveProfissionalSuporteTourSidebar(suporte.sidebarData, tourActive),
    [suporte.sidebarData, tourActive],
  )

  const displayIsLoadingTickets =
    shouldShowPortalPageLoadingBlock(suporte.isLoadingTickets, suporte.tickets.length > 0) &&
    !(tourActive && tourSourceTickets.length > 0)
  const displayIsLoadingKpis =
    shouldShowPortalPageLoadingBlock(
      suporte.isLoadingKpis,
      suporte.sidebarData.monthlyTotal > 0 || suporte.sidebarData.statusSummary.length > 0,
    ) && !(tourActive && displaySidebar.monthlyTotal > 0)

  const resetFilters = useCallback(() => {
    suporte.setSearch('')
    suporte.setStatusFilter('')
    suporte.setOpenOnly(false)
    suporte.setCurrentPage(1)
  }, [suporte])

  const closeTicketDrawer = useCallback(() => {
    if (tourLockDrawerClose) return
    setDrawerClosing(true)
  }, [tourLockDrawerClose])

  const openDemoTicket = useCallback(() => {
    const demoTicket = tourSourceTickets.find(
      (ticket) => ticket.id === PROFISSIONAL_SUPORTE_TOUR_DEMO_TICKET_ID,
    )
    if (!demoTicket) return
    resetFilters()
    setDrawerClosing(false)
    setDrawerOpen(true)
    suporte.setSelectedTicket(demoTicket)
  }, [resetFilters, suporte, tourSourceTickets])

  useImperativeHandle(
    ref,
    () => ({
      openNewTicketDrawer: newTicketDrawer.openDrawer,
      closeNewTicketDrawer: newTicketDrawer.requestClose,
      openDemoTicket,
      closeTicketDrawer,
      resetFilters,
    }),
    [closeTicketDrawer, newTicketDrawer.openDrawer, newTicketDrawer.requestClose, openDemoTicket, resetFilters],
  )

  const handleOpenTicket = useCallback(
    async (ticket: SupportTicket) => {
      setDrawerClosing(false)
      setDrawerOpen(true)

      if (tourUsesMock) {
        const fullTicket =
          tourSourceTickets.find((row) => row.id === ticket.id) ?? ticket
        suporte.setSelectedTicket(fullTicket)
        return
      }

      await suporte.openTicket(ticket)
    },
    [suporte, tourSourceTickets, tourUsesMock],
  )

  const handleCloseDrawer = useCallback(() => {
    closeTicketDrawer()
  }, [closeTicketDrawer])

  const handleDrawerTransitionEnd = useCallback(() => {
    if (drawerClosing) {
      setDrawerOpen(false)
      setDrawerClosing(false)
      suporte.setSelectedTicket(null)
    }
  }, [drawerClosing, suporte])

  const resolvedHeaderVariant =
    headerVariant ?? (variant === 'prefeitura' ? 'prefeitura' : 'ubt')

  return (
    <>
      <div className={dashboardPageShellClass} aria-busy={isLoadingShell}>
        <div className={dashboardPageHeaderWrapClass}>
          {isLoadingShell ? (
            headerSkeleton ?? <SupportPageHeaderSkeleton variant={resolvedHeaderVariant} />
          ) : headerSlot ? (
            headerSlot
          ) : (
            <SupportPageHeader
              variant={resolvedHeaderVariant}
              onOpenNewTicket={newTicketDrawer.openDrawer}
              showNewTicketButton={showNewTicketButton}
            />
          )}
        </div>

        <div
          className={[
            suporteColumnsGridClass,
            dashboardPageScrollPaddingClass,
            'mt-4 pb-5',
          ].join(' ')}
        >
          <div className={suporteColumnScrollClass}>
            <div className={suporteColumnFillClass}>
              {isLoadingShell ? (
                <SuporteMainPanelSkeleton showUbtColumn={showUbtColumn} />
              ) : (
                <PortalSuporteMainPanel
                  tickets={displayTickets}
                  showUbtColumn={showUbtColumn}
                  isLoading={displayIsLoadingTickets}
                  total={displayTotal}
                  totalPages={displayTotalPages}
                  page={suporte.currentPage}
                  pageSize={suporte.pageSize}
                  search={suporte.search}
                  onSearchChange={suporte.setSearch}
                  statusFilter={suporte.statusFilter}
                  onStatusFilterChange={suporte.setStatusFilter}
                  openOnly={suporte.openOnly}
                  onOpenOnlyChange={suporte.setOpenOnly}
                  onPageChange={suporte.setCurrentPage}
                  selectedTicket={suporte.selectedTicket}
                  isLoadingTicket={tourUsesMock ? false : suporte.isLoadingTicket}
                  onOpenTicket={handleOpenTicket}
                  onTicketUpdate={(ticket) => {
                    suporte.applyTicketUpdate(ticket)
                  }}
                  onCloseTicket={handleCloseDrawer}
                  supportApi={suporte.supportApi}
                  readOnlyForTicket={readOnlyForTicket}
                  canReplyToTickets={canReplyToTickets}
                  toolbarActions={resolvedToolbarActions}
                  drawerOpen={drawerOpen}
                  drawerClosing={drawerClosing}
                  onDrawerClose={handleCloseDrawer}
                  onDrawerTransitionEnd={handleDrawerTransitionEnd}
                  tourLockDrawerClose={tourLockDrawerClose}
                />
              )}
            </div>
          </div>

          <div className={suporteColumnScrollClass}>
            <div className={suporteColumnFillClass}>
              {isLoadingShell || displayIsLoadingKpis ? (
                <SuporteSidebarPanelSkeleton />
              ) : (
                <SuporteSidebarPanel
                  statusSummary={displaySidebar.statusSummary}
                  priorityDistribution={displaySidebar.priorityDistribution}
                  monthlyTrend={displaySidebar.monthlyTrend}
                  monthlyTotal={displaySidebar.monthlyTotal}
                  summaryTitle={summaryTitle}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {!isLoadingShell ? newTicketDrawer.drawerElement : null}

      <Toast
        message={suporte.toast?.message ?? ''}
        visible={suporte.toast !== null}
        variant={suporte.toast?.variant ?? 'success'}
        onClose={suporte.dismissToast}
      />
    </>
  )
})
