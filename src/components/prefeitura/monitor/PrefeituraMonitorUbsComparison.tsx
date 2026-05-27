import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import {
  monitorComparisonByTab,
  type MonitorComparisonTab,
} from '../../../data/prefeituraMonitorMock'
import { DashCard, DashLinkAction } from '../prefeituraDashboardUi'
import { PrefeituraMonitorUbsComparisonTable } from './PrefeituraMonitorUbsComparisonTable'

type PrefeituraMonitorUbsComparisonProps = {
  onOpenFullRanking: (tab: MonitorComparisonTab) => void
  className?: string
}

export function PrefeituraMonitorUbsComparison({
  onOpenFullRanking,
  className = '',
}: PrefeituraMonitorUbsComparisonProps) {
  const [activeTab, setActiveTab] = useState<MonitorComparisonTab>('produtividade')
  const rows = monitorComparisonByTab[activeTab]

  return (
    <DashCard
      fillHeight
      className={className}
      title="Comparativo entre UBS"
      subtitle="Ranking por indicadores chave."
      bodyClassName="flex min-h-0 flex-1 flex-col p-0"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <PrefeituraMonitorUbsComparisonTable
          activeTab={activeTab}
          onTabChange={setActiveTab}
          rows={rows}
          scrollable
        />
      </div>

      <div className="flex shrink-0 justify-end border-t border-gray-100 px-4 py-2.5">
        <DashLinkAction onClick={() => onOpenFullRanking(activeTab)}>
          Ver ranking completo
          <ChevronRight className="ml-0.5 inline h-3.5 w-3.5" strokeWidth={2.5} />
        </DashLinkAction>
      </div>
    </DashCard>
  )
}
