import type { ProfissionalShift } from '../../types/profissionalAgenda'

export type ProfissionalShiftTiming = {
  durationLabel: string
  durationMinutes: number
  statusHint: string
  progressPercent: number | null
  startsInMinutes: number | null
  endsInMinutes: number | null
  isWithinWindow: boolean
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours <= 0) return `${mins} min`
  if (mins === 0) return hours === 1 ? '1 hora' : `${hours} horas`
  return `${hours}h ${mins}min`
}

export function formatRelativeMinutes(minutes: number): string {
  if (minutes < 1) return 'menos de 1 min'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (rest === 0) return hours === 1 ? '1 hora' : `${hours} horas`
  return `${hours}h ${rest}min`
}

export function formatProfissionalShiftDateLong(startAt: string): string {
  const date = new Date(startAt)
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function getProfissionalShiftTiming(
  shift: ProfissionalShift,
  now = new Date(),
): ProfissionalShiftTiming {
  const start = new Date(shift.startAt)
  const end = new Date(shift.endAt)
  const durationMinutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000))
  const durationLabel = formatDuration(durationMinutes)

  const startsInMinutes = Math.round((start.getTime() - now.getTime()) / 60_000)
  const endsInMinutes = Math.round((end.getTime() - now.getTime()) / 60_000)
  const isWithinWindow = now >= start && now <= end

  let progressPercent: number | null = null
  if (isWithinWindow) {
    const total = end.getTime() - start.getTime()
    const elapsed = now.getTime() - start.getTime()
    progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)))
  } else if (now > end) {
    progressPercent = 100
  }

  let statusHint: string
  if (shift.lifecycle === 'encerrado') {
    statusHint =
      shift.stats.atendidos > 0
        ? `Plantão encerrado · ${shift.stats.atendidos} atendimento(s) registrado(s) neste turno.`
        : 'Plantão encerrado neste dia. Nenhum atendimento foi iniciado por você.'
  } else if (shift.lifecycle === 'em_andamento') {
    statusHint =
      shift.stats.naFila > 0
        ? `Fila ativa · ${shift.stats.naFila} paciente(s) aguardando atendimento agora.`
        : 'Você está no plantão. A fila está disponível para novos atendimentos.'
  } else if (startsInMinutes > 0) {
    statusHint = `Início previsto em ${formatRelativeMinutes(startsInMinutes)} · abertura às ${shift.startTime}.`
  } else if (endsInMinutes > 0 && endsInMinutes <= 30) {
    statusHint = `Turno encerra em ${formatRelativeMinutes(endsInMinutes)} · até ${shift.endTime}.`
  } else if (isWithinWindow) {
    statusHint =
      'Horário do plantão em curso. Entre para liberar a fila e iniciar as teleconsultas.'
  } else {
    statusHint = 'Turno fora do horário de operação previsto na escala.'
  }

  return {
    durationLabel,
    durationMinutes,
    statusHint,
    progressPercent,
    startsInMinutes: startsInMinutes > 0 ? startsInMinutes : null,
    endsInMinutes: endsInMinutes > 0 ? endsInMinutes : null,
    isWithinWindow,
  }
}
