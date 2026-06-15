import { GlucoseHistoryEntry, GlucoseReadingContext } from '../types/glucose'

export const GLUCOSE_CONTEXT_LABELS: Record<GlucoseReadingContext, string> = {
  fasting: 'Jejum',
  pre_meal: 'Pré-refeição',
  post_meal: 'Pós-refeição',
  bedtime: 'Antes de dormir',
  other: 'Outro',
}

export type GlucoseZoneLabel = 'Baixa' | 'Normal' | 'Elevada' | 'Alta'

export type GlucoseZone = {
  label: GlucoseZoneLabel
  color: string
  bg: string
  border: string
}

export function getGlucoseContextLabel(context: GlucoseReadingContext) {
  return GLUCOSE_CONTEXT_LABELS[context]
}

export function getGlucoseZone(mg: number, context: GlucoseReadingContext): GlucoseZone {
  if (mg < 70) {
    return {
      label: 'Baixa',
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.14)',
      border: 'rgba(56, 189, 248, 0.35)',
    }
  }

  if (context === 'post_meal') {
    if (mg <= 140) {
      return {
        label: 'Normal',
        color: '#34d399',
        bg: 'rgba(52, 211, 153, 0.14)',
        border: 'rgba(52, 211, 153, 0.35)',
      }
    }
    if (mg <= 180) {
      return {
        label: 'Elevada',
        color: '#fbbf24',
        bg: 'rgba(251, 191, 36, 0.14)',
        border: 'rgba(251, 191, 36, 0.35)',
      }
    }
    return {
      label: 'Alta',
      color: '#f87171',
      bg: 'rgba(248, 113, 113, 0.14)',
      border: 'rgba(248, 113, 113, 0.35)',
    }
  }

  if (context === 'bedtime') {
    if (mg <= 120) {
      return {
        label: 'Normal',
        color: '#34d399',
        bg: 'rgba(52, 211, 153, 0.14)',
        border: 'rgba(52, 211, 153, 0.35)',
      }
    }
    if (mg <= 160) {
      return {
        label: 'Elevada',
        color: '#fbbf24',
        bg: 'rgba(251, 191, 36, 0.14)',
        border: 'rgba(251, 191, 36, 0.35)',
      }
    }
    return {
      label: 'Alta',
      color: '#f87171',
      bg: 'rgba(248, 113, 113, 0.14)',
      border: 'rgba(248, 113, 113, 0.35)',
    }
  }

  if (mg <= 99) {
    return {
      label: 'Normal',
      color: '#34d399',
      bg: 'rgba(52, 211, 153, 0.14)',
      border: 'rgba(52, 211, 153, 0.35)',
    }
  }
  if (mg <= 125) {
    return {
      label: 'Elevada',
      color: '#fbbf24',
      bg: 'rgba(251, 191, 36, 0.14)',
      border: 'rgba(251, 191, 36, 0.35)',
    }
  }
  return {
    label: 'Alta',
    color: '#f87171',
    bg: 'rgba(248, 113, 113, 0.14)',
    border: 'rgba(248, 113, 113, 0.35)',
  }
}

export function isGlucoseInTarget(mg: number, context: GlucoseReadingContext) {
  return getGlucoseZone(mg, context).label === 'Normal'
}

export function isHypoglycemia(mg: number) {
  return mg < 70
}

export function isHyperglycemiaPeak(mg: number, context: GlucoseReadingContext) {
  const label = getGlucoseZone(mg, context).label
  return label === 'Alta' || label === 'Elevada'
}

export function formatGlucoseValue(mg: number) {
  return `${Math.round(mg)} mg/dL`
}

export function formatGlucoseDateTime(iso: string) {
  const date = new Date(iso)
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatGlucoseDate(iso: string) {
  const date = new Date(iso)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
}

export function formatGlucoseTime(iso: string) {
  const date = new Date(iso)
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function sortGlucoseHistory(entries: GlucoseHistoryEntry[]) {
  return [...entries].sort(
    (left, right) => new Date(right.recordedAt).getTime() - new Date(left.recordedAt).getTime(),
  )
}

export function filterGlucoseHistoryByPeriod(
  entries: GlucoseHistoryEntry[],
  start: Date,
  end: Date,
) {
  const startMs = start.getTime()
  const endMs = end.getTime()

  return entries.filter((entry) => {
    const recordedMs = new Date(entry.recordedAt).getTime()
    return recordedMs >= startMs && recordedMs <= endMs
  })
}
