import type { DonutSlice } from '../../../components/credenciais/CredentialDonutChart'
import { PrefeituraRedeIllustration } from './PrefeituraRedeIllustration'
import { PrefeituraRedeRegionBars } from './PrefeituraRedeRegionBars'
import { PrefeituraRedeStationStatusBars } from './PrefeituraRedeStationStatusBars'

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

type PrefeituraRedeSidebarPanelProps = {
  regionSlices: DonutSlice[]
  stationStatusSlices: DonutSlice[]
}

export function PrefeituraRedeSidebarPanel({
  regionSlices,
  stationStatusSlices,
}: PrefeituraRedeSidebarPanelProps) {
  const stationTotal = stationStatusSlices.reduce((sum, slice) => sum + slice.count, 0)

  return (
    <aside className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 flex-col gap-4">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
          <h2 className="text-base font-bold text-gray-900">Distribuição por região</h2>
          <PrefeituraRedeRegionBars slices={regionSlices} />
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
          <h2 className="text-base font-bold text-gray-900">Terminais por status</h2>
          <p className="mt-1 text-sm text-gray-500">
            {formatNumber(stationTotal)} terminais na rede
          </p>
          <PrefeituraRedeStationStatusBars slices={stationStatusSlices} />
        </section>
      </div>

      <PrefeituraRedeIllustration className="min-h-[12rem] shrink-0 xl:min-h-0 xl:flex-1" />
    </aside>
  )
}
