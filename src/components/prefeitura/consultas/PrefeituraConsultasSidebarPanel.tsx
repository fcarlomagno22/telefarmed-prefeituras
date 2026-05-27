import {
  prefeituraConsultasDailySeries,
  prefeituraConsultasPeriodTotal,
  prefeituraConsultasSpecialties,
} from '../../../data/prefeituraConsultasMock'
import { PrefeituraConsultasDailyChart } from './PrefeituraConsultasDailyChart'
import { buildPrefeituraConsultasSpecialtyBadgeConfig } from './prefeituraConsultasSpecialtyBadge'
import { SituationStatusBadge } from '../../ui/SituationStatusBadge'

export function PrefeituraConsultasSidebarPanel() {
  return (
    <aside className="flex h-full min-h-0 flex-col gap-4">
      <section className="shrink-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
        <h2 className="text-sm font-bold text-gray-900">Consultas por dia</h2>
        <p className="mt-0.5 text-xs text-gray-500">Evolução do volume no período</p>
        <div className="mt-2.5">
          <PrefeituraConsultasDailyChart
            data={prefeituraConsultasDailySeries}
            periodTotal={prefeituraConsultasPeriodTotal}
          />
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
        <div className="shrink-0">
          <h2 className="text-sm font-bold text-gray-900">Especialidades mais demandadas</h2>
          <p className="mt-0.5 text-xs text-gray-500">Por volume de consultas</p>
        </div>
        <ul className="mt-3 flex min-h-0 flex-1 flex-col justify-between gap-2">
          {prefeituraConsultasSpecialties.map((item, index) => (
            <li key={item.key} className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate text-sm font-semibold text-gray-800">
                {item.label}
              </span>
              <SituationStatusBadge
                config={buildPrefeituraConsultasSpecialtyBadgeConfig(item, index)}
                widthClass="w-[5.5rem]"
              />
            </li>
          ))}
        </ul>
      </section>
    </aside>
  )
}
