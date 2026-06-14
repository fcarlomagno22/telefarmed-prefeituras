import {
  PROFISSIONAL_ATENDIMENTOS_TOUR_INVITE_STORAGE_KEY,
  PROFISSIONAL_ATENDIMENTOS_TOUR_STORAGE_KEY,
} from '../../config/profissionalAtendimentosTour'
import {
  isProfissionalTourInvitePending,
  markProfissionalTourInviteHandled,
  resetProfissionalTourInvite,
} from './profissionalTourInviteStorage'

export function isProfissionalAtendimentosTourCompleted(): boolean {
  try {
    return localStorage.getItem(PROFISSIONAL_ATENDIMENTOS_TOUR_STORAGE_KEY) === 'done'
  } catch {
    return false
  }
}

export function isProfissionalAtendimentosTourInvitePending(): boolean {
  return isProfissionalTourInvitePending(
    PROFISSIONAL_ATENDIMENTOS_TOUR_STORAGE_KEY,
    PROFISSIONAL_ATENDIMENTOS_TOUR_INVITE_STORAGE_KEY,
  )
}

export function markProfissionalAtendimentosTourCompleted(): void {
  try {
    localStorage.setItem(PROFISSIONAL_ATENDIMENTOS_TOUR_STORAGE_KEY, 'done')
  } catch {
    // ignore quota / private mode
  }
}

export function markProfissionalAtendimentosTourInviteHandled(): void {
  markProfissionalTourInviteHandled(PROFISSIONAL_ATENDIMENTOS_TOUR_INVITE_STORAGE_KEY)
}

export function resetProfissionalAtendimentosTour(): void {
  try {
    localStorage.removeItem(PROFISSIONAL_ATENDIMENTOS_TOUR_STORAGE_KEY)
  } catch {
    // ignore
  }
  resetProfissionalTourInvite(PROFISSIONAL_ATENDIMENTOS_TOUR_INVITE_STORAGE_KEY)
}
