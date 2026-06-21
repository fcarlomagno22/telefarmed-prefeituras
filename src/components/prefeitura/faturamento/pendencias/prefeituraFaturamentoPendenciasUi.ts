import type { SituationStatusBadgeStyle } from '../../ui/SituationStatusBadge'
import type {
  PrefeituraFaturamentoPendencia,
  PrefeituraFaturamentoPendenciaAcao,
  PrefeituraFaturamentoPendenciaGravidade,
  PrefeituraFaturamentoPendenciaStatus,
  PrefeituraFaturamentoPendenciasCategoryTab,
} from '../../../types/prefeituraFaturamentoPendencias'

export const PENDENCIAS_PAGE_SIZE = 25

export const prefeituraFaturamentoPendenciaStatusLabel: Record<
  PrefeituraFaturamentoPendenciaStatus,
  string
> = {
  aberta: 'Aberta',
  em_correcao: 'Em correção',
  aguardando_profissional: 'Aguardando profissional',
  corrigida: 'Corrigida',
  validada: 'Resolvida',
  ignorada: 'Ignorada',
  nao_faturavel: 'Não faturável',
}

export const prefeituraFaturamentoPendenciaGravidadeLabel: Record<
  PrefeituraFaturamentoPendenciaGravidade,
  string
> = {
  bloqueante: 'Impeditiva',
  aviso: 'Aviso',
}

export const prefeituraFaturamentoPendenciaAcaoLabel: Record<
  PrefeituraFaturamentoPendenciaAcao,
  string
> = {
  corrigir_cadastro: 'Corrigir cadastro',
  editar_profissional: 'Editar profissional',
  abrir_consulta: 'Abrir consulta',
  definir_procedimento: 'Definir procedimento',
  revisar_regra_sus: 'Revisar',
  comparar_consultas: 'Comparar consultas',
  solicitar_ajuste_profissional: 'Solicitar ajuste ao profissional',
}

export const prefeituraFaturamentoPendenciasCategoryTabLabel: Record<
  PrefeituraFaturamentoPendenciasCategoryTab,
  string
> = {
  todas: 'Todas',
  bloqueantes: 'Impeditivas',
  paciente: 'Paciente',
  profissional: 'Profissional',
  consulta: 'Consulta',
  procedimento: 'Procedimento',
  resolvidas: 'Resolvidas',
}

const resolvedStatuses: PrefeituraFaturamentoPendenciaStatus[] = [
  'corrigida',
  'validada',
  'ignorada',
  'nao_faturavel',
]

export function isPendenciaResolvida(status: PrefeituraFaturamentoPendenciaStatus) {
  return resolvedStatuses.includes(status)
}

export function isPendenciaAberta(status: PrefeituraFaturamentoPendenciaStatus) {
  return status === 'aberta' || status === 'em_correcao' || status === 'aguardando_profissional'
}

export const prefeituraFaturamentoPendenciaStatusBadgeConfig: Record<
  PrefeituraFaturamentoPendenciaStatus,
  SituationStatusBadgeStyle
> = {
  aberta: {
    label: prefeituraFaturamentoPendenciaStatusLabel.aberta,
    text: 'text-gray-700',
    accent: 'bg-gradient-to-r from-gray-300 via-gray-400 to-slate-500',
    lineGlow: 'shadow-[0_2px_8px_rgba(100,116,139,0.4)]',
  },
  em_correcao: {
    label: prefeituraFaturamentoPendenciaStatusLabel.em_correcao,
    text: 'text-amber-700',
    accent: 'bg-gradient-to-r from-amber-300 via-amber-500 to-orange-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(245,158,11,0.45)]',
  },
  aguardando_profissional: {
    label: prefeituraFaturamentoPendenciaStatusLabel.aguardando_profissional,
    text: 'text-indigo-700',
    accent: 'bg-gradient-to-r from-indigo-300 via-indigo-500 to-violet-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(99,102,241,0.45)]',
  },
  corrigida: {
    label: prefeituraFaturamentoPendenciaStatusLabel.corrigida,
    text: 'text-sky-700',
    accent: 'bg-gradient-to-r from-sky-300 via-sky-500 to-blue-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(14,165,233,0.45)]',
  },
  validada: {
    label: 'Resolvida',
    text: 'text-emerald-700',
    accent: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.5)]',
  },
  ignorada: {
    label: prefeituraFaturamentoPendenciaStatusLabel.ignorada,
    text: 'text-violet-700',
    accent: 'bg-gradient-to-r from-violet-400 via-purple-500 to-fuchsia-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(139,92,246,0.45)]',
  },
  nao_faturavel: {
    label: prefeituraFaturamentoPendenciaStatusLabel.nao_faturavel,
    text: 'text-gray-800',
    accent: 'bg-gradient-to-r from-slate-500 via-gray-600 to-gray-700',
    lineGlow: 'shadow-[0_2px_10px_rgba(71,85,105,0.45)]',
  },
}

export const prefeituraFaturamentoPendenciaAtualizandoBadgeConfig: SituationStatusBadgeStyle = {
  label: 'Atualizando...',
  text: 'text-[var(--brand-primary)]',
  accent: 'bg-gradient-to-r from-sky-300 via-[var(--brand-primary)] to-indigo-500',
  lineGlow: 'shadow-[0_2px_10px_rgba(59,130,246,0.45)]',
}

/** Badge unificado para listas e cabeçalhos — evita combinações incoerentes (ex.: Impeditiva + Resolvida). */
export function resolvePendenciaSituacaoBadge(
  item: PrefeituraFaturamentoPendencia,
  isUpdating = false,
): SituationStatusBadgeStyle {
  if (isUpdating) return prefeituraFaturamentoPendenciaAtualizandoBadgeConfig

  switch (item.status) {
    case 'validada':
      return prefeituraFaturamentoPendenciaStatusBadgeConfig.validada
    case 'ignorada':
      return prefeituraFaturamentoPendenciaStatusBadgeConfig.ignorada
    case 'nao_faturavel':
      return prefeituraFaturamentoPendenciaStatusBadgeConfig.nao_faturavel
    case 'corrigida':
      return prefeituraFaturamentoPendenciaStatusBadgeConfig.corrigida
    case 'em_correcao':
      return prefeituraFaturamentoPendenciaStatusBadgeConfig.em_correcao
    case 'aguardando_profissional':
      return prefeituraFaturamentoPendenciaStatusBadgeConfig.aguardando_profissional
    case 'aberta':
    default:
      if (item.gravidade === 'aviso') {
        return {
          label: 'Aviso',
          text: prefeituraFaturamentoPendenciaGravidadeBadgeConfig.aviso.text,
          accent: prefeituraFaturamentoPendenciaGravidadeBadgeConfig.aviso.accent,
          lineGlow: prefeituraFaturamentoPendenciaGravidadeBadgeConfig.aviso.lineGlow,
        }
      }
      return {
        label: 'Pendente',
        text: 'text-red-700',
        accent: 'bg-gradient-to-r from-rose-400 via-red-500 to-red-600',
        lineGlow: 'shadow-[0_2px_10px_rgba(239,68,68,0.5)]',
      }
  }
}

export function resolvePendenciaSituacaoHint(item: PrefeituraFaturamentoPendencia): string | null {
  if (item.status === 'validada') {
    return item.correctedAt
      ? `Regularizada em ${formatPendenciaConsultaDate(item.correctedAt)}`
      : 'Problema regularizado para esta consulta'
  }
  if (item.status === 'corrigida') {
    return 'Correção registrada · revalidar elegibilidade'
  }
  if (item.status === 'ignorada') {
    return 'Ignorada com justificativa'
  }
  if (item.status === 'aguardando_profissional') {
    return 'Aguardando ajuste do profissional'
  }
  if (isPendenciaAberta(item.status) && item.gravidade === 'bloqueante') {
    return 'Impeditivo para fechamento SUS'
  }
  if (isPendenciaAberta(item.status) && item.gravidade === 'aviso') {
    return 'Revisar antes do fechamento'
  }
  return null
}

export type PendenciaImpactoUi = {
  tone: 'danger' | 'warning' | 'success' | 'neutral'
  title: string
  message: string
}

export function resolvePendenciaImpactoUi(item: PrefeituraFaturamentoPendencia): PendenciaImpactoUi {
  if (item.status === 'validada') {
    return {
      tone: 'success',
      title: 'Regularizado',
      message: 'Esta pendência foi resolvida e não impede mais o fechamento SUS desta consulta.',
    }
  }
  if (item.status === 'corrigida') {
    return {
      tone: 'warning',
      title: 'Correção registrada',
      message: 'Revalide a elegibilidade para confirmar que a consulta pode seguir no fechamento.',
    }
  }
  if (item.status === 'ignorada') {
    return {
      tone: 'neutral',
      title: 'Ignorada',
      message: item.ignoreJustification ?? 'Pendência ignorada com justificativa registrada.',
    }
  }
  if (item.gravidade === 'aviso') {
    return {
      tone: 'warning',
      title: 'Aviso de faturamento',
      message: item.impact,
    }
  }
  return {
    tone: 'danger',
    title: 'Impeditivo para fechamento',
    message: item.impact,
  }
}

export function resolvePendenciaStatusBadgeConfig(
  item: PrefeituraFaturamentoPendencia,
  isUpdating: boolean,
): SituationStatusBadgeStyle {
  return resolvePendenciaSituacaoBadge(item, isUpdating)
}

export const prefeituraFaturamentoPendenciaGravidadeBadgeConfig: Record<
  PrefeituraFaturamentoPendenciaGravidade,
  SituationStatusBadgeStyle
> = {
  bloqueante: {
    label: prefeituraFaturamentoPendenciaGravidadeLabel.bloqueante,
    text: 'text-red-700',
    accent: 'bg-gradient-to-r from-rose-400 via-red-500 to-red-600',
    lineGlow: 'shadow-[0_2px_10px_rgba(239,68,68,0.5)]',
  },
  aviso: {
    label: prefeituraFaturamentoPendenciaGravidadeLabel.aviso,
    text: 'text-amber-700',
    accent: 'bg-gradient-to-r from-amber-300 via-amber-500 to-orange-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(245,158,11,0.45)]',
  },
}

export function formatPendenciaCompetenciaLabel(competencia: string) {
  const [year, month] = competencia.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function formatPendenciaConsultaDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function normalizePendenciaSearch(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function matchesPendenciaCategoryTab(
  item: PrefeituraFaturamentoPendencia,
  tab: PrefeituraFaturamentoPendenciasCategoryTab,
) {
  if (tab === 'todas') return true
  if (tab === 'bloqueantes') {
    return item.gravidade === 'bloqueante' && isPendenciaAberta(item.status)
  }
  if (tab === 'resolvidas') return isPendenciaResolvida(item.status)
  return item.category === tab
}

export function canIgnorePendencia(item: PrefeituraFaturamentoPendencia) {
  return item.gravidade === 'aviso' && isPendenciaAberta(item.status)
}

export function supportsInlineCnsCorrection(item: PrefeituraFaturamentoPendencia) {
  return item.kind === 'paciente_sem_cns' && isPendenciaAberta(item.status)
}
