import { PROFISSIONAL_AVALIACAO_TOUR_STORAGE_KEY } from '../../config/profissionalAvaliacaoTour'

export function isProfissionalAvaliacaoTourCompleted(): boolean {
  try {
    return localStorage.getItem(PROFISSIONAL_AVALIACAO_TOUR_STORAGE_KEY) === 'done'
  } catch {
    return false
  }
}

export function markProfissionalAvaliacaoTourCompleted(): void {
  try {
    localStorage.setItem(PROFISSIONAL_AVALIACAO_TOUR_STORAGE_KEY, 'done')
  } catch {
    // ignore quota / private mode
  }
}

export function resetProfissionalAvaliacaoTour(): void {
  try {
    localStorage.removeItem(PROFISSIONAL_AVALIACAO_TOUR_STORAGE_KEY)
  } catch {
    // ignore
  }
}
