const INVITE_HANDLED_VALUE = 'handled'

export function isProfissionalTourInvitePending(
  tourCompletedKey: string,
  tourInviteKey: string,
): boolean {
  try {
    if (localStorage.getItem(tourCompletedKey) === 'done') return false
    if (localStorage.getItem(tourInviteKey) === INVITE_HANDLED_VALUE) return false
    return true
  } catch {
    return false
  }
}

export function markProfissionalTourInviteHandled(tourInviteKey: string): void {
  try {
    localStorage.setItem(tourInviteKey, INVITE_HANDLED_VALUE)
  } catch {
    // ignore quota / private mode
  }
}

export function resetProfissionalTourInvite(tourInviteKey: string): void {
  try {
    localStorage.removeItem(tourInviteKey)
  } catch {
    // ignore
  }
}
