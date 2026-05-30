import type { ProfissionalAgendaNotice } from '../types/profissionalAgenda'
import { toDateKey } from '../utils/agendaDate'

const todayKey = toDateKey(new Date())

export const profissionalAgendaNoticesInitial: ProfissionalAgendaNotice[] = [
  {
    id: 'notice-1',
    type: 'troca',
    title: 'Troca de escala confirmada',
    body: 'Seu plantão de Clínico Geral em 29/05 passou das 08:00–14:00 para 14:00–20:00. Modalidade: telemedicina.',
    dateLabel: 'Atualizado há 2 h',
    shiftDateKey: '2026-05-29',
  },
  {
    id: 'notice-2',
    type: 'reserva',
    title: 'Você está na fila de reserva',
    body: 'No plantão de Pediatria (27/05, tarde), você é o 2º médico de reserva. Será acionado se o titular não entrar até 14:15.',
    dateLabel: 'Hoje',
    shiftDateKey: '2026-05-27',
  },
  {
    id: 'notice-3',
    type: 'cancelamento',
    title: 'Plantão cancelado',
    body: 'O plantão de Cardiologia em 30/05 foi cancelado pela operação. Nenhuma ação é necessária.',
    dateLabel: 'Ontem',
    shiftDateKey: '2026-05-30',
  },
]

export function getNoticesForDate(dateKey: string): ProfissionalAgendaNotice[] {
  return profissionalAgendaNoticesInitial.filter(
    (notice) => !notice.shiftDateKey || notice.shiftDateKey === dateKey,
  )
}

export function getActiveNotices(): ProfissionalAgendaNotice[] {
  return profissionalAgendaNoticesInitial.filter(
    (notice) => !notice.shiftDateKey || notice.shiftDateKey >= todayKey,
  )
}
