import {
  PROFISSIONAL_AGENDA_TOUR_INVITE_STORAGE_KEY,
  PROFISSIONAL_AGENDA_TOUR_STORAGE_KEY,
} from '../../config/profissionalAgendaTour'
import {
  isProfissionalTourInvitePending,
  markProfissionalTourInviteHandled,
  resetProfissionalTourInvite,
} from './profissionalTourInviteStorage'

export function isProfissionalAgendaTourCompleted(): boolean {
  try {
    return localStorage.getItem(PROFISSIONAL_AGENDA_TOUR_STORAGE_KEY) === 'done'
  } catch {
    return false
  }
}

export function isProfissionalAgendaTourInvitePending(): boolean {
  return isProfissionalTourInvitePending(
    PROFISSIONAL_AGENDA_TOUR_STORAGE_KEY,
    PROFISSIONAL_AGENDA_TOUR_INVITE_STORAGE_KEY,
  )
}

export function markProfissionalAgendaTourCompleted(): void {
  try {
    localStorage.setItem(PROFISSIONAL_AGENDA_TOUR_STORAGE_KEY, 'done')
  } catch {
    // ignore quota / private mode
  }
}

export function markProfissionalAgendaTourInviteHandled(): void {
  markProfissionalTourInviteHandled(PROFISSIONAL_AGENDA_TOUR_INVITE_STORAGE_KEY)
}

export function resetProfissionalAgendaTour(): void {
  try {
    localStorage.removeItem(PROFISSIONAL_AGENDA_TOUR_STORAGE_KEY)
  } catch {
    // ignore
  }
  resetProfissionalTourInvite(PROFISSIONAL_AGENDA_TOUR_INVITE_STORAGE_KEY)
}
