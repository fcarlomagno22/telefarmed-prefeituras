import { useMemo } from 'react'
import { KpiCardsRowSkeleton } from '../prefeitura/skeletons/prefeituraSkeletonUi'
import { KpiStatCards } from '../ui/KpiStatCards'
import type { ConsultasSummary } from '../../data/consultasMock'
import { buildUbtConsultasKpiCards } from '../../utils/consultas/buildUbtConsultasKpiCards'

type ConsultasKpiStripProps = {
  summary: ConsultasSummary
  avgDurationMinutes: number | null
  periodKey: string
  isLoading?: boolean
}

const KPI_ROW_CLASS =
  'w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:!grid-cols-5 xl:!grid-cols-5'

export function ConsultasKpiStrip({
  summary,
  avgDurationMinutes,
  periodKey,
  isLoading,
}: ConsultasKpiStripProps) {
  const items = useMemo(
    () => buildUbtConsultasKpiCards(summary, avgDurationMinutes),
    [avgDurationMinutes, summary],
  )

  if (isLoading) {
    return <KpiCardsRowSkeleton count={5} variant="centered" className={KPI_ROW_CLASS} />
  }

  return (
    <KpiStatCards
      items={items}
      variant="centered"
      animated
      updateKey={periodKey}
      className={KPI_ROW_CLASS}
    />
  )
}
