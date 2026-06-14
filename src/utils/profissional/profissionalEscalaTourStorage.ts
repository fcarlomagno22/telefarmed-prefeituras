import {
  PROFISSIONAL_ESCALA_TOUR_INVITE_STORAGE_KEY,
  PROFISSIONAL_ESCALA_TOUR_STORAGE_KEY,
} from '../../config/profissionalEscalaTour'
import {
  isProfissionalTourInvitePending,
  markProfissionalTourInviteHandled,
  resetProfissionalTourInvite,
} from './profissionalTourInviteStorage'

export function isProfissionalEscalaTourCompleted(): boolean {
  try {
    return localStorage.getItem(PROFISSIONAL_ESCALA_TOUR_STORAGE_KEY) === 'done'
  } catch {
    return false
  }
}

export function isProfissionalEscalaTourInvitePending(): boolean {
  return isProfissionalTourInvitePending(
    PROFISSIONAL_ESCALA_TOUR_STORAGE_KEY,
    PROFISSIONAL_ESCALA_TOUR_INVITE_STORAGE_KEY,
  )
}

export function markProfissionalEscalaTourCompleted(): void {
  try {
    localStorage.setItem(PROFISSIONAL_ESCALA_TOUR_STORAGE_KEY, 'done')
  } catch {
    // ignore quota / private mode
  }
}

export function markProfissionalEscalaTourInviteHandled(): void {
  markProfissionalTourInviteHandled(PROFISSIONAL_ESCALA_TOUR_INVITE_STORAGE_KEY)
}

export function resetProfissionalEscalaTour(): void {
  try {
    localStorage.removeItem(PROFISSIONAL_ESCALA_TOUR_STORAGE_KEY)
  } catch {
    // ignore
  }
  resetProfissionalTourInvite(PROFISSIONAL_ESCALA_TOUR_INVITE_STORAGE_KEY)
}
