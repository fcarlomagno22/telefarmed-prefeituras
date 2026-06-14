import { useMemo } from 'react'
import { KpiCardsRowSkeleton } from '../prefeitura/skeletons/prefeituraSkeletonUi'
import { KpiStatCards } from '../ui/KpiStatCards'
import type { UbtDashboardKpi } from '../../types/ubtDashboard'
import { buildUbtDashboardKpiCards } from '../../utils/dashboard/buildUbtDashboardKpiCards'

type UnitDashboardKpiStripProps = {
  kpis: UbtDashboardKpi[]
  isLoading?: boolean
}

const KPI_ROW_CLASS =
  'w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:!grid-cols-5 xl:!grid-cols-5'

export function UnitDashboardKpiStrip({ kpis, isLoading }: UnitDashboardKpiStripProps) {
  const items = useMemo(() => buildUbtDashboardKpiCards(kpis), [kpis])

  if (isLoading) {
    return <KpiCardsRowSkeleton count={5} variant="centered" className={KPI_ROW_CLASS} />
  }

  if (kpis.length === 0) return null

  return <KpiStatCards items={items} variant="centered" className={KPI_ROW_CLASS} />
}
