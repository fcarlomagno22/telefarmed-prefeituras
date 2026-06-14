import {
  PROFISSIONAL_FINANCEIRO_TOUR_INVITE_STORAGE_KEY,
  PROFISSIONAL_FINANCEIRO_TOUR_STORAGE_KEY,
} from '../../config/profissionalFinanceiroTour'
import {
  isProfissionalTourInvitePending,
  markProfissionalTourInviteHandled,
  resetProfissionalTourInvite,
} from './profissionalTourInviteStorage'

export function isProfissionalFinanceiroTourCompleted(): boolean {
  try {
    return localStorage.getItem(PROFISSIONAL_FINANCEIRO_TOUR_STORAGE_KEY) === 'done'
  } catch {
    return false
  }
}

export function isProfissionalFinanceiroTourInvitePending(): boolean {
  return isProfissionalTourInvitePending(
    PROFISSIONAL_FINANCEIRO_TOUR_STORAGE_KEY,
    PROFISSIONAL_FINANCEIRO_TOUR_INVITE_STORAGE_KEY,
  )
}

export function markProfissionalFinanceiroTourCompleted(): void {
  try {
    localStorage.setItem(PROFISSIONAL_FINANCEIRO_TOUR_STORAGE_KEY, 'done')
  } catch {
    // ignore quota / private mode
  }
}

export function markProfissionalFinanceiroTourInviteHandled(): void {
  markProfissionalTourInviteHandled(PROFISSIONAL_FINANCEIRO_TOUR_INVITE_STORAGE_KEY)
}

export function resetProfissionalFinanceiroTour(): void {
  try {
    localStorage.removeItem(PROFISSIONAL_FINANCEIRO_TOUR_STORAGE_KEY)
  } catch {
    // ignore
  }
  resetProfissionalTourInvite(PROFISSIONAL_FINANCEIRO_TOUR_INVITE_STORAGE_KEY)
}
