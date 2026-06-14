import {
  PROFISSIONAL_SUPORTE_TOUR_INVITE_STORAGE_KEY,
  PROFISSIONAL_SUPORTE_TOUR_STORAGE_KEY,
} from '../../config/profissionalSuporteTour'
import {
  isProfissionalTourInvitePending,
  markProfissionalTourInviteHandled,
  resetProfissionalTourInvite,
} from './profissionalTourInviteStorage'

export function isProfissionalSuporteTourCompleted(): boolean {
  try {
    return localStorage.getItem(PROFISSIONAL_SUPORTE_TOUR_STORAGE_KEY) === 'done'
  } catch {
    return false
  }
}

export function isProfissionalSuporteTourInvitePending(): boolean {
  return isProfissionalTourInvitePending(
    PROFISSIONAL_SUPORTE_TOUR_STORAGE_KEY,
    PROFISSIONAL_SUPORTE_TOUR_INVITE_STORAGE_KEY,
  )
}

export function markProfissionalSuporteTourCompleted(): void {
  try {
    localStorage.setItem(PROFISSIONAL_SUPORTE_TOUR_STORAGE_KEY, 'done')
  } catch {
    // ignore quota / private mode
  }
}

export function markProfissionalSuporteTourInviteHandled(): void {
  markProfissionalTourInviteHandled(PROFISSIONAL_SUPORTE_TOUR_INVITE_STORAGE_KEY)
}

export function resetProfissionalSuporteTour(): void {
  try {
    localStorage.removeItem(PROFISSIONAL_SUPORTE_TOUR_STORAGE_KEY)
  } catch {
    // ignore
  }
  resetProfissionalTourInvite(PROFISSIONAL_SUPORTE_TOUR_INVITE_STORAGE_KEY)
}
