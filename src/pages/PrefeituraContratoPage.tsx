import { useMemo, useState } from 'react'
import { usePrefeituraContratoMonthDrawer } from '../hooks/usePrefeituraContratoMonthDrawer'
import { usePageSkeletonLoading } from '../hooks/usePageSkeletonLoading'
import { PrefeituraContratoExpiryBanner } from '../components/prefeitura/contrato/PrefeituraContratoExpiryBanner'
import { PrefeituraContratoExpiryBannerSkeleton } from '../components/prefeitura/contrato/PrefeituraContratoExpiryBannerSkeleton'
import { PrefeituraContratoMainPanel } from '../components/prefeitura/contrato/PrefeituraContratoMainPanel'
import { PrefeituraContratoMainPanelSkeleton } from '../components/prefeitura/contrato/PrefeituraContratoMainPanelSkeleton'
import { PrefeituraContratoPageHeaderSkeleton } from '../components/prefeitura/contrato/PrefeituraContratoPageHeaderSkeleton'
import { PrefeituraContratoSelector } from '../components/prefeitura/contrato/PrefeituraContratoSelector'
import { PrefeituraContratoSidebarPanel } from '../components/prefeitura/contrato/PrefeituraContratoSidebarPanel'
import { PrefeituraContratoSidebarPanelSkeleton } from '../components/prefeitura/contrato/PrefeituraContratoSidebarPanelSkeleton'
import {
  dashboardPageContentStackClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import {
  getPrefeituraContratoById,
  prefeituraContratoDefaultId,
} from '../data/prefeituraContratoMock'
import {
  computePrefeituraContratoExpiry,
  getPrefeituraContratoCycleSectionTitle,
  getPrefeituraContratoCycleUsage,
} from '../utils/prefeituraContrato'

const contratoColumnScrollClass = [
  'min-h-0 min-w-0',
  'xl:overflow-y-auto xl:overscroll-y-contain',
  'xl:[-ms-overflow-style:none] xl:[scrollbar-width:thin]',
  'xl:[&::-webkit-scrollbar]:w-1.5',
  'xl:[&::-webkit-scrollbar-thumb]:rounded-full',
  'xl:[&::-webkit-scrollbar-thumb]:bg-gray-300',
  'xl:[&::-webkit-scrollbar-track]:bg-transparent',
].join(' ')

export function PrefeituraContratoPage() {
  const isLoading = usePageSkeletonLoading(1200)
  const [selectedContractId, setSelectedContractId] = useState(prefeituraContratoDefaultId)
  const contract = useMemo(
    () => getPrefeituraContratoById(selectedContractId),
    [selectedContractId],
  )
  const expiry = useMemo(() => computePrefeituraContratoExpiry(contract.info), [contract.info])
  const currentUsage = useMemo(() => getPrefeituraContratoCycleUsage(contract), [contract])
  const cycleSectionTitle = useMemo(
    () => getPrefeituraContratoCycleSectionTitle(contract),
    [contract],
  )
  const monthDrawer = usePrefeituraContratoMonthDrawer()

  const handleSelectContract = (contractId: string) => {
    setSelectedContractId(contractId)
    monthDrawer.requestClose()
  }

  return (
    <>
      <div
        className={[dashboardPageShellClass, 'flex-1 bg-slate-50/80 py-5'].join(' ')}
        aria-label="Gestão de contrato"
        aria-busy={isLoading}
      >
        <header className="relative z-30 shrink-0 overflow-visible">
          {isLoading ? (
            <PrefeituraContratoPageHeaderSkeleton />
          ) : (
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
                  Gestão de contrato
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-[1.65rem]">
                  Contrato
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Acompanhe o pacote mensal de consultas, consumo histórico e vigência do contrato
                  municipal.
                </p>
              </div>
              <PrefeituraContratoSelector
                selectedId={selectedContractId}
                onSelect={handleSelectContract}
              />
            </div>
          )}
        </header>

        <div
          className={[
            'mt-4 flex min-h-0 flex-1 flex-col gap-4',
            'max-xl:overflow-y-auto max-xl:overscroll-y-contain',
            'max-xl:[-ms-overflow-style:none] max-xl:[scrollbar-width:thin]',
            'max-xl:[&::-webkit-scrollbar]:w-1.5',
            'max-xl:[&::-webkit-scrollbar-thumb]:rounded-full',
            'max-xl:[&::-webkit-scrollbar-thumb]:bg-gray-300',
            'max-xl:[&::-webkit-scrollbar-track]:bg-transparent',
            'xl:grid xl:grid-cols-[minmax(0,1fr)_320px] xl:grid-rows-1 xl:items-stretch xl:gap-4 xl:overflow-hidden',
          ].join(' ')}
        >
          <div className={contratoColumnScrollClass}>
            <div
              className={[
                dashboardPageContentStackClass,
                'flex min-h-full min-w-0 flex-col pb-4',
              ].join(' ')}
            >
              {isLoading ? (
                <>
                  <PrefeituraContratoExpiryBannerSkeleton />
                  <PrefeituraContratoMainPanelSkeleton />
                </>
              ) : (
                <>
                  <PrefeituraContratoExpiryBanner expiry={expiry} />
                  <PrefeituraContratoMainPanel
                    key={contract.id}
                    contract={contract}
                    rows={contract.monthlyHistory}
                    monthDrawer={monthDrawer}
                    className="min-h-0 flex-1"
                  />
                </>
              )}
            </div>
          </div>

          <div className={contratoColumnScrollClass}>
            <div className="flex min-h-full min-w-0 flex-col pb-4">
              {isLoading ? (
                <PrefeituraContratoSidebarPanelSkeleton />
              ) : (
                <PrefeituraContratoSidebarPanel
                  contract={contract.info}
                  expiry={expiry}
                  currentUsage={currentUsage}
                  cycleSectionTitle={cycleSectionTitle}
                  usageAnimationKey={contract.id}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {monthDrawer.drawerElement}
    </>
  )
}
