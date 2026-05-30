import { PROFISSIONAL_SUPORTE_TOUR_STORAGE_KEY } from '../../config/profissionalSuporteTour'

export function isProfissionalSuporteTourCompleted(): boolean {
  try {
    return localStorage.getItem(PROFISSIONAL_SUPORTE_TOUR_STORAGE_KEY) === 'done'
  } catch {
    return false
  }
}

export function markProfissionalSuporteTourCompleted(): void {
  try {
    localStorage.setItem(PROFISSIONAL_SUPORTE_TOUR_STORAGE_KEY, 'done')
  } catch {
    // ignore quota / private mode
  }
}

export function resetProfissionalSuporteTour(): void {
  try {
    localStorage.removeItem(PROFISSIONAL_SUPORTE_TOUR_STORAGE_KEY)
  } catch {
    // ignore
  }
}
