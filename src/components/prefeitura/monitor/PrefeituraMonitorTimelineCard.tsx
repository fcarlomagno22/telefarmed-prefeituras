import { CustomSelect } from '../../ui/CustomSelect'
import { DashCard } from '../prefeituraDashboardUi'
import { PrefeituraMonitorTimelineChart } from './PrefeituraMonitorTimelineChart'
import type { MonitorTimelineSeries } from '../../../types/prefeituraMonitor'

type PrefeituraMonitorTimelineCardProps = {
  className?: string
  timelinePeriod: string
  onTimelinePeriodChange: (value: string) => void
  timelinePeriodOptions: Array<{ value: string; label: string }>
  hours: string[]
  series: MonitorTimelineSeries[]
}

export function PrefeituraMonitorTimelineCard({
  className = '',
  timelinePeriod,
  onTimelinePeriodChange,
  timelinePeriodOptions,
  hours,
  series,
}: PrefeituraMonitorTimelineCardProps) {
  return (
    <DashCard
      fillHeight
      className={className}
      title="Timeline do dia"
      subtitle="Fluxo de atendimentos por unidade ao longo do dia."
      bodyClassName="flex min-h-0 flex-1 flex-col p-4"
      action={
        <div className="w-[7.5rem]">
          <CustomSelect
            value={timelinePeriod}
            onChange={onTimelinePeriodChange}
            options={timelinePeriodOptions}
            menuMinWidthPx={140}
          />
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col justify-between">
        <PrefeituraMonitorTimelineChart
          animationKey={timelinePeriod}
          hours={hours}
          series={series}
        />
      </div>
    </DashCard>
  )
}
