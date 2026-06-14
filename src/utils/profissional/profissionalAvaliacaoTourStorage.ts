import {
  PROFISSIONAL_AVALIACAO_TOUR_INVITE_STORAGE_KEY,
  PROFISSIONAL_AVALIACAO_TOUR_STORAGE_KEY,
} from '../../config/profissionalAvaliacaoTour'
import {
  isProfissionalTourInvitePending,
  markProfissionalTourInviteHandled,
  resetProfissionalTourInvite,
} from './profissionalTourInviteStorage'

export function isProfissionalAvaliacaoTourCompleted(): boolean {
  try {
    return localStorage.getItem(PROFISSIONAL_AVALIACAO_TOUR_STORAGE_KEY) === 'done'
  } catch {
    return false
  }
}

export function isProfissionalAvaliacaoTourInvitePending(): boolean {
  return isProfissionalTourInvitePending(
    PROFISSIONAL_AVALIACAO_TOUR_STORAGE_KEY,
    PROFISSIONAL_AVALIACAO_TOUR_INVITE_STORAGE_KEY,
  )
}

export function markProfissionalAvaliacaoTourCompleted(): void {
  try {
    localStorage.setItem(PROFISSIONAL_AVALIACAO_TOUR_STORAGE_KEY, 'done')
  } catch {
    // ignore quota / private mode
  }
}

export function markProfissionalAvaliacaoTourInviteHandled(): void {
  markProfissionalTourInviteHandled(PROFISSIONAL_AVALIACAO_TOUR_INVITE_STORAGE_KEY)
}

export function resetProfissionalAvaliacaoTour(): void {
  try {
    localStorage.removeItem(PROFISSIONAL_AVALIACAO_TOUR_STORAGE_KEY)
  } catch {
    // ignore
  }
  resetProfissionalTourInvite(PROFISSIONAL_AVALIACAO_TOUR_INVITE_STORAGE_KEY)
}
