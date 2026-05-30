import { PROFISSIONAL_FINANCEIRO_TOUR_STORAGE_KEY } from '../../config/profissionalFinanceiroTour'

export function isProfissionalFinanceiroTourCompleted(): boolean {
  try {
    return localStorage.getItem(PROFISSIONAL_FINANCEIRO_TOUR_STORAGE_KEY) === 'done'
  } catch {
    return false
  }
}

export function markProfissionalFinanceiroTourCompleted(): void {
  try {
    localStorage.setItem(PROFISSIONAL_FINANCEIRO_TOUR_STORAGE_KEY, 'done')
  } catch {
    // ignore quota / private mode
  }
}

export function resetProfissionalFinanceiroTour(): void {
  try {
    localStorage.removeItem(PROFISSIONAL_FINANCEIRO_TOUR_STORAGE_KEY)
  } catch {
    // ignore
  }
}
