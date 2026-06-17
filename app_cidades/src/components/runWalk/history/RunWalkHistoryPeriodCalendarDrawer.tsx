import { MetricsPeriodDrawer } from '../../metrics/MetricsPeriodDrawer'
import { buildPeriodSelection, formatDateKey } from '../../../utils/metricsPeriod'
import type { PeriodSelection } from '../../../types/metrics'
import type { RunWalkHistoryDateRange } from '../../../types/runWalkHistory'

type RunWalkHistoryPeriodCalendarDrawerProps = {
  visible: boolean
  range: RunWalkHistoryDateRange | null
  markedDateKeys?: ReadonlySet<string>
  onClose: () => void
  onApply: (range: RunWalkHistoryDateRange) => void
}

function buildSelectionFromRange(range: RunWalkHistoryDateRange | null): PeriodSelection {
  if (!range) return buildPeriodSelection('last30days')

  return buildPeriodSelection(
    'custom',
    new Date(`${range.startIso}T12:00:00`),
    new Date(`${range.endIso}T12:00:00`),
  )
}

export function RunWalkHistoryPeriodCalendarDrawer({
  visible,
  range,
  markedDateKeys,
  onClose,
  onApply,
}: RunWalkHistoryPeriodCalendarDrawerProps) {
  return (
    <MetricsPeriodDrawer
      visible={visible}
      period={buildSelectionFromRange(range)}
      markedDateKeys={markedDateKeys}
      title="Período personalizado"
      subtitle="Selecione o intervalo no calendário"
      onClose={onClose}
      onApply={(selection) => {
        onApply({
          startIso: formatDateKey(selection.start),
          endIso: formatDateKey(selection.end),
        })
      }}
    />
  )
}
