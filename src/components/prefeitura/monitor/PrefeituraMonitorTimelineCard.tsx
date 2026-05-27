import { useState } from 'react'
import { monitorTimelinePeriodOptions } from '../../../data/prefeituraMonitorMock'
import { CustomSelect } from '../../ui/CustomSelect'
import { DashCard } from '../prefeituraDashboardUi'
import { PrefeituraMonitorTimelineChart } from './PrefeituraMonitorTimelineChart'

type PrefeituraMonitorTimelineCardProps = {
  className?: string
}

export function PrefeituraMonitorTimelineCard({ className = '' }: PrefeituraMonitorTimelineCardProps) {
  const [timelinePeriod, setTimelinePeriod] = useState('hoje')

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
            onChange={setTimelinePeriod}
            options={[...monitorTimelinePeriodOptions]}
            menuMinWidthPx={140}
          />
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col justify-between">
        <PrefeituraMonitorTimelineChart animationKey={timelinePeriod} />
      </div>
    </DashCard>
  )
}
