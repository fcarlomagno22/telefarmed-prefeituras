import type { EscalaRepasseRule } from '../../types/adminEscala'
import type { AdminPlantaoAuditoriaRow } from '../../types/adminProfissionalRepasse'
import {
  ensureRepasseRule,
  formatCriteriosPresencaResumo,
  normalizeCriteriosPresenca,
  repasseModalidadeLabel,
} from '../adminEscala/repasseRule'

function formatCurrency(centavos: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(centavos / 100)
}

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export function formatPlantaoAuditoriaDateTime(iso: string | null): string {
  if (!iso) return '—'
  return dateTimeFormatter.format(new Date(iso))
}

export function formatPlantaoAuditoriaHeaderDate(iso: string): string {
  return dateFormatter.format(new Date(iso))
}

export function formatPlantaoHorarioRange(inicio: string, fim: string): string {
  return `${timeFormatter.format(new Date(inicio))} – ${timeFormatter.format(new Date(fim))}`
}

const tableDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
})

export function formatPlantaoTableDate(iso: string): string {
  return tableDateFormatter.format(new Date(iso))
}

export function formatPlantaoRepasseContratoCopy(rule: EscalaRepasseRule): string {
  const safe = ensureRepasseRule(rule)
  const criterios = normalizeCriteriosPresenca(safe.criteriosPresenca)
  const modalidade = repasseModalidadeLabel(safe.modalidade)
  const minOnline = criterios.minPercentualOnline
  const semDemanda = criterios.aceitaSemDemandaComprovada
    ? ', aceita turno sem demanda comprovada'
    : ''

  switch (safe.modalidade) {
    case 'plantao_fixo':
      return `Este plantão foi criado como ${modalidade} (${formatCurrency(safe.valorPlantaoCentavos)} integral, mín. ${minOnline}% online${semDemanda}).`
    case 'por_consulta':
      return `Este plantão foi criado como ${modalidade} (${formatCurrency(safe.valorConsultaCentavos)}/consulta, mín. ${minOnline}% online${semDemanda}).`
    case 'hibrido':
      return `Este plantão foi criado como ${modalidade} (${safe.percentualFixoHibrido ?? 30}% fixo + ${formatCurrency(safe.valorConsultaCentavos)}/consulta, mín. ${minOnline}% online${semDemanda}).`
    default:
      return formatCriteriosPresencaResumo(safe.criteriosPresenca)
  }
}

export function formatPlantaoTurnoSubtitle(plantao: AdminPlantaoAuditoriaRow): string {
  const date = formatPlantaoAuditoriaHeaderDate(plantao.horarioPrevistoInicio)
  const horario = formatPlantaoHorarioRange(
    plantao.horarioPrevistoInicio,
    plantao.horarioPrevistoFim,
  )
  return `${date} · ${horario} · ${plantao.slotLabel}`
}

export function formatPlantaoNfDiferenca(
  valorCalculadoCentavos: number,
  valorNFCentavos: number | null,
): { label: string; centavos: number; divergente: boolean } {
  if (valorNFCentavos == null) {
    return { label: 'NF não informada', centavos: 0, divergente: false }
  }
  const diff = valorNFCentavos - valorCalculadoCentavos
  if (diff === 0) {
    return { label: 'Sem diferença', centavos: 0, divergente: false }
  }
  const prefix = diff > 0 ? '+' : ''
  return {
    label: `${prefix}${formatCurrency(diff)}`,
    centavos: diff,
    divergente: Math.abs(diff) > Math.max(valorCalculadoCentavos * 0.1, 5000),
  }
}
