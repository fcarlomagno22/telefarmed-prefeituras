import type { AdminEscalaShift } from '../../types/adminEscala'

const PREFEITURA_LABELS: Record<string, string> = {
  'cli-bsb': 'Brasília · DF',
  'cli-campinas': 'Campinas · SP',
}

const UBT_LABELS: Record<string, string> = {
  'rede-1': 'UBT Taguatinga',
  'rede-2': 'UBT Ceilândia',
  'ubt-sul': 'UBT Sul',
}

const MODALITY_LABELS: Record<string, string> = {
  tele: 'Teleatendimento',
  hibrido: 'Híbrido',
  presencial_ubt: 'Presencial na UBT',
}

export function resolvePrefeituraLabel(shift: AdminEscalaShift): string {
  if (shift.prefeituraScope.mode === 'all') return 'Rede nacional'
  const first = shift.prefeituraScope.prefeituraIds[0]
  return (first && PREFEITURA_LABELS[first]) || 'Município contratante'
}

export function resolveUbtLabel(shift: AdminEscalaShift): string {
  if (shift.ubtScope.mode === 'tele_only') return 'Telemedicina (sem UBT fixa)'
  if (shift.ubtScope.mode === 'all') return 'Todas as UBTs do município'
  const names = shift.ubtScope.ubtIds
    .map((id) => UBT_LABELS[id])
    .filter(Boolean)
  if (names.length === 0) return 'UBT da rede'
  if (names.length === 1) return names[0]!
  return `${names[0]} +${names.length - 1}`
}

export function resolveModalityLabel(modality: string): string {
  return MODALITY_LABELS[modality] ?? modality
}

export function formatShiftTimeRange(startAt: string, endAt: string): {
  startTime: string
  endTime: string
  turnLabel: string
} {
  const start = new Date(startAt)
  const end = new Date(endAt)
  const startTime = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(start)
  const endTime = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(end)
  const hour = start.getHours()
  const turnLabel =
    hour < 12 ? 'Manhã' : hour < 18 ? 'Tarde' : 'Noite'

  return { startTime, endTime, turnLabel }
}
