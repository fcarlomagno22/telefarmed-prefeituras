import { useCallback, useState } from 'react'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import { PrefeituraFaturamentoFechamentoPanel } from '../components/prefeitura/faturamento/fechamento/PrefeituraFaturamentoFechamentoPanel'
import { PrefeituraFaturamentoHistoricoPanel } from '../components/prefeitura/faturamento/historico/PrefeituraFaturamentoHistoricoPanel'
import { PrefeituraFaturamentoPendenciasPanel } from '../components/prefeitura/faturamento/pendencias/PrefeituraFaturamentoPendenciasPanel'
import {
  PrefeituraFaturamentoTabs,
  type PrefeituraFaturamentoTab,
} from '../components/prefeitura/faturamento/PrefeituraFaturamentoTabs'
import { PrefeituraFaturamentoFechamentoProvider, usePrefeituraFaturamentoFechamentoContext } from '../contexts/PrefeituraFaturamentoFechamentoContext'
import { DashboardPageHeader } from '../components/users/DashboardPageHeader'

const mainCardShellClass = [
  'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl',
  'border border-gray-200 bg-white',
  'shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]',
].join(' ')

function PrefeituraFaturamentoPageContent() {
  const [activeTab, setActiveTab] = useState<PrefeituraFaturamentoTab>('pendencias')
  const { openFechamentoView, setSelectedCompetencia } = usePrefeituraFaturamentoFechamentoContext()

  const handleOpenFechamentoFromHistorico = useCallback(
    (competencia: string, recordId: string) => {
      openFechamentoView(competencia, recordId)
      setActiveTab('fechamento')
    },
    [openFechamentoView],
  )

  return (
    <div className={dashboardPageShellClass} aria-label="Faturamento SUS">
      <div className={dashboardPageHeaderWrapClass}>
        <DashboardPageHeader
          title="Faturamento SUS"
          subtitle="Central de correção, fechamento e histórico das consultas faturáveis no SUS."
        />
      </div>

      <div
        className={[
          dashboardPageScrollPaddingClass,
          'mt-4 flex min-h-0 flex-1 flex-col pb-5',
        ].join(' ')}
      >
        <section className={mainCardShellClass}>
          <PrefeituraFaturamentoTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden" role="tabpanel">
            {activeTab === 'pendencias' ? (
              <PrefeituraFaturamentoPendenciasPanel
                onGoToFechamento={(competencia) => {
                  setSelectedCompetencia(competencia)
                  setActiveTab('fechamento')
                }}
              />
            ) : activeTab === 'fechamento' ? (
              <PrefeituraFaturamentoFechamentoPanel
                onGoToPendencias={() => setActiveTab('pendencias')}
              />
            ) : (
              <PrefeituraFaturamentoHistoricoPanel
                onOpenFechamento={handleOpenFechamentoFromHistorico}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export function PrefeituraFaturamentoPage() {
  return (
    <PrefeituraFaturamentoFechamentoProvider>
      <PrefeituraFaturamentoPageContent />
    </PrefeituraFaturamentoFechamentoProvider>
  )
}
