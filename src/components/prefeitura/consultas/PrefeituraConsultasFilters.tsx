import { Filter } from 'lucide-react'
import { CustomSelect } from '../../ui/CustomSelect'
import { CompactDateRangePicker } from '../../ui/CompactDateRangePicker'
import {
  prefeituraConsultasRegionFilterOptions,
  prefeituraConsultasUnitFilterOptions,
} from '../../../data/prefeituraConsultasMock'

type PrefeituraConsultasFiltersProps = {
  unit: string
  region: string
  periodStart: string
  periodEnd: string
  onUnitChange: (value: string) => void
  onRegionChange: (value: string) => void
  onPeriodStartChange: (value: string) => void
  onPeriodEndChange: (value: string) => void
  unitOptions?: Array<{ value: string; label: string }>
  regionOptions?: Array<{ value: string; label: string }>
}

export function PrefeituraConsultasFilters({
  unit,
  region,
  periodStart,
  periodEnd,
  onUnitChange,
  onRegionChange,
  onPeriodStartChange,
  onPeriodEndChange,
  unitOptions = [...prefeituraConsultasUnitFilterOptions],
  regionOptions = [...prefeituraConsultasRegionFilterOptions],
}: PrefeituraConsultasFiltersProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-bold text-gray-900">Filtros obrigatórios</span>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
        >
          <Filter className="h-3.5 w-3.5 text-gray-500" strokeWidth={2} />
          Filtros adicionais
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-600">Unidade (UBT)</label>
          <CustomSelect
            value={unit}
            onChange={onUnitChange}
            options={unitOptions}
            placeholder="Selecione uma unidade"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-600">Região</label>
          <CustomSelect
            value={region}
            onChange={onRegionChange}
            options={regionOptions}
            placeholder="Selecione uma região"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-600">Período</label>
          <CompactDateRangePicker
            start={periodStart}
            end={periodEnd}
            onStartChange={onPeriodStartChange}
            onEndChange={onPeriodEndChange}
          />
        </div>
      </div>
    </section>
  )
}
