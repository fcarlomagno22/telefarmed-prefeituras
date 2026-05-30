import { PROFISSIONAL_AGENDA_TOUR_STORAGE_KEY } from '../../config/profissionalAgendaTour'

export function isProfissionalAgendaTourCompleted(): boolean {
  try {
    return localStorage.getItem(PROFISSIONAL_AGENDA_TOUR_STORAGE_KEY) === 'done'
  } catch {
    return false
  }
}

export function markProfissionalAgendaTourCompleted(): void {
  try {
    localStorage.setItem(PROFISSIONAL_AGENDA_TOUR_STORAGE_KEY, 'done')
  } catch {
    // ignore quota / private mode
  }
}

export function resetProfissionalAgendaTour(): void {
  try {
    localStorage.removeItem(PROFISSIONAL_AGENDA_TOUR_STORAGE_KEY)
  } catch {
    // ignore
  }
}
