import { PROFISSIONAL_ESCALA_TOUR_STORAGE_KEY } from '../../config/profissionalEscalaTour'

export function isProfissionalEscalaTourCompleted(): boolean {
  try {
    return localStorage.getItem(PROFISSIONAL_ESCALA_TOUR_STORAGE_KEY) === 'done'
  } catch {
    return false
  }
}

export function markProfissionalEscalaTourCompleted(): void {
  try {
    localStorage.setItem(PROFISSIONAL_ESCALA_TOUR_STORAGE_KEY, 'done')
  } catch {
    // ignore quota / private mode
  }
}

export function resetProfissionalEscalaTour(): void {
  try {
    localStorage.removeItem(PROFISSIONAL_ESCALA_TOUR_STORAGE_KEY)
  } catch {
    // ignore
  }
}
