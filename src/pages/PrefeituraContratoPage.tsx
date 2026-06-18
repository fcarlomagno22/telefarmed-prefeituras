import { useMemo } from 'react'
import { useEntidadeCopy } from '../hooks/useEntidadeCopy'
import { usePrefeituraAuth } from '../contexts/PrefeituraAuthContext'
import { usePrefeituraContratoMonthDrawer } from '../hooks/usePrefeituraContratoMonthDrawer'
import { usePrefeituraContratoPage } from '../hooks/usePrefeituraContratoPage'
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
  const copy = useEntidadeCopy()
  const { getAccessToken } = usePrefeituraAuth()
  const {
    contractOptions,
    selectedContractId,
    contract,
    utilizacao,
    packageUsage,
    isLoading,
    isContractLoading,
    loadError,
    selectContract,
  } = usePrefeituraContratoPage()

  const expiry = useMemo(
    () => (contract ? computePrefeituraContratoExpiry(contract.info) : null),
    [contract],
  )
  const currentUsage = useMemo(() => {
    if (packageUsage) return packageUsage
    if (contract) return getPrefeituraContratoCycleUsage(contract, utilizacao)
    return null
  }, [contract, packageUsage, utilizacao])
  const cycleSectionTitle = useMemo(
    () => (contract ? getPrefeituraContratoCycleSectionTitle(contract) : ''),
    [contract],
  )
  const monthDrawer = usePrefeituraContratoMonthDrawer({ getAccessToken })

  const isPageLoading = isLoading || isContractLoading
  const showContent = contract && expiry && currentUsage && selectedContractId

  const handleSelectContract = (contractId: string) => {
    selectContract(contractId)
    monthDrawer.requestClose()
  }

  return (
    <>
      <div
        className={[dashboardPageShellClass, 'flex-1 bg-slate-50/80 py-5'].join(' ')}
        aria-label="Gestão de contrato"
        aria-busy={isPageLoading}
      >
        <header className="relative z-30 shrink-0 overflow-visible">
          {isPageLoading && !contract ? (
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
                  Acompanhe o pacote mensal de consultas, consumo histórico e vigência do {copy.contrato}.
                </p>
              </div>
            </div>
          )}
        </header>

        {loadError ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </p>
        ) : null}

        {!isPageLoading && !loadError && contractOptions.length === 0 ? (
          <p className="mt-4 rounded-xl border border-gray-200 bg-white px-4 py-6 text-sm text-gray-600">
            Nenhum contrato cadastrado para este município.
          </p>
        ) : null}

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
              {isPageLoading && !contract ? (
                <>
                  <PrefeituraContratoExpiryBannerSkeleton />
                  <PrefeituraContratoMainPanelSkeleton />
                </>
              ) : showContent ? (
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
              ) : null}
            </div>
          </div>

          <div className={contratoColumnScrollClass}>
            <div className="flex min-h-full min-w-0 flex-col gap-3 pb-4">
              {contractOptions.length > 0 && selectedContractId ? (
                <div className="relative z-20 shrink-0">
                  <PrefeituraContratoSelector
                    options={contractOptions}
                    selectedId={selectedContractId}
                    onSelect={handleSelectContract}
                    variant="sidebar"
                  />
                </div>
              ) : null}
              {isPageLoading && !contract ? (
                <PrefeituraContratoSidebarPanelSkeleton />
              ) : showContent ? (
                <PrefeituraContratoSidebarPanel
                  contract={contract.info}
                  expiry={expiry}
                  currentUsage={currentUsage}
                  cycleSectionTitle={cycleSectionTitle}
                  usageAnimationKey={contract.id}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {monthDrawer.drawerElement}
    </>
  )
}
