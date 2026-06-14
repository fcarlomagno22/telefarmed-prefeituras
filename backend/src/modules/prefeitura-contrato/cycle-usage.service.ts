import { listRedeUnits } from '../prefeitura-rede/units.service.js'
import { resolvePrefeituraContratoModalidade } from './contract-modality.js'
import { clampIsoRange, contractEndIso, contractStartIso } from './contract-period.js'
import { getMonthlyCycle, todayIsoInBrazil } from './cycle.js'
import { buildPackageUsageView } from './package-usage.formatters.js'
import {
  countConsultasRealizadas,
  loadActiveContrato,
  loadTipoContratoNome,
} from './query.service.js'
import type { PrefeituraPackageUsageDto } from './types.js'

async function resolveUnitIds(
  entidadeId: string,
  params: { unidadeUbtId?: string; regionKey?: string },
): Promise<{ unitIds?: string[]; filteredScope: boolean }> {
  if (params.unidadeUbtId && params.unidadeUbtId !== 'todas') {
    return { unitIds: [params.unidadeUbtId], filteredScope: true }
  }

  if (params.regionKey && params.regionKey !== 'todas' && params.regionKey !== '') {
    const units = await listRedeUnits(entidadeId)
    const normalized = params.regionKey === 'central' ? 'centro' : params.regionKey
    const filtered = units.filter((unit) => unit.regionKey === normalized)
    return {
      unitIds: filtered.map((unit) => unit.id),
      filteredScope: true,
    }
  }

  return { filteredScope: false }
}

export async function getPrefeituraUtilizacaoCiclo(
  entidadeId: string,
  params: { unidadeUbtId?: string; regionKey?: string } = {},
): Promise<PrefeituraPackageUsageDto> {
  const [contrato, scope] = await Promise.all([
    loadActiveContrato(entidadeId),
    resolveUnitIds(entidadeId, params),
  ])

  const tipoLabel = contrato ? await loadTipoContratoNome(contrato.tipo) : null
  const modalidade = contrato
    ? resolvePrefeituraContratoModalidade(contrato.tipo, tipoLabel)
    : 'mensal'

  const cycle = getMonthlyCycle()
  const contractStart = contrato ? contractStartIso(contrato.data_assinatura) : null
  const contractEnd = contrato ? contractEndIso(contrato.data_encerramento) : null
  const currentCycleRange =
    contractStart != null
      ? clampIsoRange(cycle.startIso, cycle.endIso, contractStart, contractEnd)
      : { startIso: cycle.startIso, endIso: cycle.endIso }

  const contractUsageEnd =
    contractEnd ?? `${todayIsoInBrazil()}T23:59:59.999-03:00`
  const contractUsageRange =
    contractStart != null
      ? clampIsoRange(contractStart, contractUsageEnd, contractStart, contractEnd)
      : currentCycleRange

  const usageRange = modalidade === 'mensal' ? currentCycleRange : contractUsageRange

  const usedInCycle = await countConsultasRealizadas(
    entidadeId,
    usageRange.startIso,
    usageRange.endIso,
    scope.unitIds,
  )

  const contractedTotal = contrato?.consultas_contratadas ?? 0
  const permiteUltrapassar = contrato?.permite_ultrapassar ?? false

  return buildPackageUsageView({
    contractedTotal,
    usedInCycle,
    permiteUltrapassar,
    filteredScope: scope.filteredScope,
  })
}
