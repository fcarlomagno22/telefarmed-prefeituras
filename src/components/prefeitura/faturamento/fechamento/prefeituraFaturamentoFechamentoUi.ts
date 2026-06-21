import type { SituationStatusBadgeStyle } from '../../ui/SituationStatusBadge'
import type {
  PrefeituraFaturamentoFechamentoRecord,
  PrefeituraFaturamentoFechamentoStatus,
} from '../../../types/prefeituraFaturamentoFechamento'
import { formatPendenciaCompetenciaLabel } from '../pendencias/prefeituraFaturamentoPendenciasUi'

export { formatPendenciaCompetenciaLabel as formatFechamentoCompetenciaLabel }

const FECHAMENTO_NUMERIC_ID_START = 1_000_001

export function generateUniqueFechamentoNumericId(
  records: PrefeituraFaturamentoFechamentoRecord[],
): string {
  const usedIds = new Set(
    records
      .map((record) => record.fechamentoId)
      .filter((id): id is string => !!id && /^\d+$/.test(id)),
  )

  let nextId =
    usedIds.size > 0
      ? Math.max(...Array.from(usedIds, (id) => Number(id))) + 1
      : FECHAMENTO_NUMERIC_ID_START

  while (usedIds.has(String(nextId))) {
    nextId += 1
  }

  return String(nextId)
}

export const prefeituraFaturamentoFechamentoStatusLabel: Record<
  PrefeituraFaturamentoFechamentoStatus,
  string
> = {
  em_preparacao: 'Em preparação',
  pronto_para_fechar: 'Aberto',
  fechado: 'Fechado',
  exportado: 'Exportado',
}

export const prefeituraFaturamentoFechamentoStatusBadgeConfig: Record<
  PrefeituraFaturamentoFechamentoStatus,
  SituationStatusBadgeStyle
> = {
  em_preparacao: {
    label: prefeituraFaturamentoFechamentoStatusLabel.em_preparacao,
    text: 'text-amber-700',
    accent: 'bg-gradient-to-r from-amber-300 via-amber-500 to-orange-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(245,158,11,0.45)]',
  },
  pronto_para_fechar: {
    label: prefeituraFaturamentoFechamentoStatusLabel.pronto_para_fechar,
    text: 'text-emerald-700',
    accent: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.5)]',
  },
  fechado: {
    label: prefeituraFaturamentoFechamentoStatusLabel.fechado,
    text: 'text-sky-700',
    accent: 'bg-gradient-to-r from-sky-300 via-sky-500 to-blue-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(14,165,233,0.45)]',
  },
  exportado: {
    label: prefeituraFaturamentoFechamentoStatusLabel.exportado,
    text: 'text-indigo-700',
    accent: 'bg-gradient-to-r from-indigo-300 via-indigo-500 to-violet-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(99,102,241,0.45)]',
  },
}

export function formatFechamentoDateTime(iso: string | null) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export const prefeituraFaturamentoLoteInclusaoBadgeConfig: SituationStatusBadgeStyle = {
  label: 'No lote',
  text: 'text-emerald-700',
  accent: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
  lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.5)]',
}

export const prefeituraFaturamentoLoteExcluidaBadgeConfig: SituationStatusBadgeStyle = {
  label: 'Excluída',
  text: 'text-amber-700',
  accent: 'bg-gradient-to-r from-amber-300 via-amber-500 to-orange-500',
  lineGlow: 'shadow-[0_2px_10px_rgba(245,158,11,0.45)]',
}

export function normalizeFechamentoSearch(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
