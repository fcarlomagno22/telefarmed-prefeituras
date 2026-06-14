import type { PrefeituraHourlyPoint } from '../../../utils/prefeituraDashboardFilters'
import { PrefeituraHourlyChart } from '../../prefeitura/PrefeituraHourlyChart'
import { DashCard } from '../../prefeitura/prefeituraDashboardUi'
import { adminDashboardHourlyBodyClass } from './adminDashboardUi'

type AdminHourlyChartPanelProps = {
  data: PrefeituraHourlyPoint[]
  animationKey: string
  period: string
  className?: string
}

function hourlySubtitle(period: string): string {
  if (period === 'hoje') return 'Volume agregado da plataforma hoje'
  if (period === '7d') return 'Média horária consolidada — últimos 7 dias'
  if (period === '30d') return 'Média horária consolidada — últimos 30 dias'
  return 'Volume agregado da plataforma no recorte'
}

export function AdminHourlyChartPanel({
  data,
  animationKey,
  period,
  className = '',
}: AdminHourlyChartPanelProps) {
  return (
    <DashCard
      fillHeight
      className={['h-full min-h-[10rem]', className].filter(Boolean).join(' ')}
      title="Consultas por hora"
      subtitle={hourlySubtitle(period)}
      bodyClassName={[adminDashboardHourlyBodyClass, 'px-2 pb-2 pt-0.5'].join(' ')}
    >
      <PrefeituraHourlyChart
        data={data}
        animationKey={animationKey}
        ariaLabel="Gráfico de consultas por hora na plataforma Telefarmed"
        emptyMessage="Sem consultas no recorte e filtros selecionados"
      />
    </DashCard>
  )
}
