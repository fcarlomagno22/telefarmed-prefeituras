import type {
  PrefeituraConsultasDailyPoint,
  PrefeituraConsultasSpecialtyItem,
} from '../../../data/prefeituraConsultasMock'
import { PrefeituraConsultasDailyChart } from './PrefeituraConsultasDailyChart'
import { buildPrefeituraConsultasSpecialtyBadgeConfig } from './prefeituraConsultasSpecialtyBadge'
import { prefeituraConsultasCardClass } from './prefeituraConsultasCardClass'
import { SituationStatusBadge } from '../../ui/SituationStatusBadge'

type PrefeituraConsultasSidebarPanelProps = {
  dailySeries?: PrefeituraConsultasDailyPoint[]
  periodTotal?: number
  specialties?: PrefeituraConsultasSpecialtyItem[]
}

export function PrefeituraConsultasSidebarPanel({
  dailySeries = [],
  periodTotal = 0,
  specialties = [],
}: PrefeituraConsultasSidebarPanelProps) {
  return (
    <aside className="flex h-full min-h-0 flex-col gap-4 xl:justify-start">
      <section className={['shrink-0 overflow-hidden p-4', prefeituraConsultasCardClass].join(' ')}>
        <h2 className="text-sm font-bold text-gray-900">Consultas por dia</h2>
        <p className="mt-0.5 text-xs text-gray-500">Evolução do volume no período</p>
        <div className="mt-2.5">
          <PrefeituraConsultasDailyChart data={dailySeries} periodTotal={periodTotal} />
        </div>
      </section>

      <section className={['shrink-0 overflow-hidden p-4', prefeituraConsultasCardClass].join(' ')}>
        <div>
          <h2 className="text-sm font-bold text-gray-900">Especialidades mais demandadas</h2>
          <p className="mt-0.5 text-xs text-gray-500">Por volume de consultas</p>
        </div>
        <ul className="mt-3 flex flex-col gap-2">
          {specialties.length === 0 ? (
            <li className="text-sm text-gray-500">Sem dados no período.</li>
          ) : (
            specialties.map((item, index) => (
              <li key={item.key} className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-sm font-semibold text-gray-800">
                  {item.label}
                </span>
                <SituationStatusBadge
                  config={buildPrefeituraConsultasSpecialtyBadgeConfig(item, index)}
                  widthClass="w-[5.5rem]"
                />
              </li>
            ))
          )}
        </ul>
      </section>
    </aside>
  )
}
