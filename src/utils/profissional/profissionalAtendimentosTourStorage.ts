import { PROFISSIONAL_ATENDIMENTOS_TOUR_STORAGE_KEY } from '../../config/profissionalAtendimentosTour'

export function isProfissionalAtendimentosTourCompleted(): boolean {
  try {
    return localStorage.getItem(PROFISSIONAL_ATENDIMENTOS_TOUR_STORAGE_KEY) === 'done'
  } catch {
    return false
  }
}

export function markProfissionalAtendimentosTourCompleted(): void {
  try {
    localStorage.setItem(PROFISSIONAL_ATENDIMENTOS_TOUR_STORAGE_KEY, 'done')
  } catch {
    // ignore quota / private mode
  }
}

export function resetProfissionalAtendimentosTour(): void {
  try {
    localStorage.removeItem(PROFISSIONAL_ATENDIMENTOS_TOUR_STORAGE_KEY)
  } catch {
    // ignore
  }
}
