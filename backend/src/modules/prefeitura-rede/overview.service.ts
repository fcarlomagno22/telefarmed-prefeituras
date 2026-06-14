import { supabaseAdmin } from '../../db/supabase.js'
import {
  buildFilterOptions,
  buildRegionSlices,
  buildTerminalStatusSlices,
  parseConfigRede,
} from './formatters.js'
import { listRedeUnits } from './units.service.js'
import type { RedeOverviewApi } from './types.js'

async function loadConfigRede(entidadeId: string) {
  const { data, error } = await supabaseAdmin
    .from('entidades_contratantes')
    .select('config_rede')
    .eq('id', entidadeId)
    .maybeSingle()

  if (error) throw error
  return parseConfigRede(data?.config_rede)
}

export async function getRedeOverview(entidadeId: string): Promise<RedeOverviewApi> {
  const units = await listRedeUnits(entidadeId)
  const config = await loadConfigRede(entidadeId)

  const activeUnits = units.filter((unit) => unit.status === 'ativa')
  const terminalsOnline = units.reduce((sum, unit) => sum + unit.stationsOnline, 0)
  const terminalsTotal = units.reduce((sum, unit) => sum + unit.stationsTotal, 0)

  let dailyCapacity = 0
  if (config.limitDailyCapacity && typeof config.dailyCapacity === 'number') {
    dailyCapacity = config.dailyCapacity
  } else {
    dailyCapacity = activeUnits.reduce((sum, unit) => {
      const rowCapacity = unit.stationsTotal * 18
      return sum + rowCapacity
    }, 0)
  }

  const availabilityPercent =
    terminalsTotal > 0 ? Math.round((terminalsOnline / terminalsTotal) * 100) : 0

  return {
    kpis: [
      {
        key: 'active_units',
        label: 'Unidades ativas',
        value: String(activeUnits.length),
        suffix: `de ${units.length} unidades`,
        topBar: 'from-emerald-400 to-green-500',
      },
      {
        key: 'terminals',
        label: 'Terminais de atendimento',
        value: String(terminalsOnline),
        suffix: 'computadores online',
        topBar: 'from-sky-400 to-blue-500',
      },
      {
        key: 'daily_capacity',
        label: 'Capacidade diária',
        value: String(dailyCapacity),
        suffix: 'atendimentos estimados',
        topBar: 'from-orange-400 to-amber-500',
      },
      {
        key: 'availability',
        label: 'Taxa de disponibilidade',
        value: `${availabilityPercent}%`,
        suffix: 'dos terminais online',
        topBar: 'from-teal-400 to-cyan-500',
      },
    ],
    regionSlices: buildRegionSlices(units),
    stationStatusSlices: buildTerminalStatusSlices(units),
    filterOptions: buildFilterOptions(units),
  }
}
