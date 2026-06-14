import type { PrefeituraPackageUsageStatus, PrefeituraPackageUsageDto } from './types.js'
import { computeAvulsoCount } from './contract-period.js'
import { formatDateLabelBr, getMonthlyCycle } from './cycle.js'

type BuildPackageUsageInput = {
  contractedTotal: number
  usedInCycle: number
  permiteUltrapassar: boolean
  filteredScope?: boolean
  reference?: Date
}

export function buildPackageUsageView(input: BuildPackageUsageInput): PrefeituraPackageUsageDto {
  const cycle = getMonthlyCycle(input.reference)
  const contractedTotal = Math.max(0, input.contractedTotal)
  const usedInCycle = Math.max(0, input.usedInCycle)

  const avulsoCount = computeAvulsoCount(usedInCycle, contractedTotal, input.permiteUltrapassar)

  const remainingInPackage =
    contractedTotal > 0 ? Math.max(0, contractedTotal - usedInCycle) : 0

  const usagePercent =
    contractedTotal > 0 ? Math.min(100, Math.round((usedInCycle / contractedTotal) * 100)) : 0

  const dailyRate = usedInCycle / cycle.daysElapsed
  const projectedTotalAtRenewal = Math.round(usedInCycle + dailyRate * cycle.daysRemaining)
  const projectedOverflow =
    contractedTotal > 0 ? Math.max(0, projectedTotalAtRenewal - contractedTotal) : 0

  const closeLabel = formatDateLabelBr(cycle.cycleClose)
  const nextCycleLabel = formatDateLabelBr(cycle.nextCycleStart)

  let status: PrefeituraPackageUsageStatus = 'comfortable'
  let statusLabel = 'Ritmo compatível'
  let statusHint =
    'A projeção indica que o pacote mensal deve cobrir a demanda até o fechamento do ciclo.'

  if (contractedTotal <= 0) {
    status = 'comfortable'
    statusLabel = 'Sob demanda'
    statusHint = 'Contrato sem pacote pré-contratado no ciclo atual.'
  } else if (usedInCycle >= contractedTotal) {
    status = input.permiteUltrapassar ? 'exceeded' : 'attention'
    statusLabel = input.permiteUltrapassar ? 'Pacote esgotado' : 'Pacote no limite'
    statusHint = input.permiteUltrapassar
      ? `Ciclo encerra em ${closeLabel}. Consultas acima do pacote seguem como avulso (cobrança à parte).`
      : `Ciclo encerra em ${closeLabel}. O contrato não prevê consultas avulsas após o pacote.`
  } else if (projectedOverflow > 0 && input.permiteUltrapassar) {
    status = projectedOverflow > contractedTotal * 0.08 ? 'critical' : 'attention'
    statusLabel = status === 'critical' ? 'Risco alto de estouro' : 'Atenção ao ritmo'
    statusHint = `Projeção até ${closeLabel}: ~${projectedTotalAtRenewal.toLocaleString('pt-BR')} consultas. Excedente estimado: ${projectedOverflow.toLocaleString('pt-BR')} (avulso). Novo ciclo em ${nextCycleLabel}.`
  } else if (usagePercent >= 78) {
    status = 'attention'
    statusLabel = 'Consumo elevado'
    statusHint = `Restam ${remainingInPackage.toLocaleString('pt-BR')} consultas no pacote e ${cycle.daysRemaining} dia(s) até o fechamento (${closeLabel}).`
  }

  if (input.filteredScope) {
    statusHint = `${statusHint} Recorte parcial da rede — utilizadas refletem apenas as unidades filtradas.`
  }

  return {
    contractedTotal,
    usedInCycle,
    remainingInPackage,
    avulsoCount,
    usagePercent,
    projectedTotalAtRenewal,
    projectedOverflow,
    daysRemaining: cycle.daysRemaining,
    daysElapsed: cycle.daysElapsed,
    daysInMonth: cycle.daysInMonth,
    cycleStartLabel: formatDateLabelBr(cycle.cycleStart),
    cycleCloseLabel: closeLabel,
    nextCycleStartLabel: nextCycleLabel,
    status,
    statusLabel,
    statusHint,
    filteredScope: Boolean(input.filteredScope),
  }
}

export function emptyPackageUsage(): PrefeituraPackageUsageDto {
  return buildPackageUsageView({
    contractedTotal: 0,
    usedInCycle: 0,
    permiteUltrapassar: false,
  })
}
