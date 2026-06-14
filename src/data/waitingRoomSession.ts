export type WaitingRoomSession = {
  token: string
  patientName: string
  specialty: string
  unitName: string
  scheduledAt: string
  professional: string
  estimatedMinutes: number
  queuePosition: number
  queueTotal: number
}

export const WAITING_ROOM_SESSION_STORAGE_KEY = 'telefarmed:waiting-room-session'

export function writeWaitingRoomSession(session: WaitingRoomSession) {
  try {
    sessionStorage.setItem(WAITING_ROOM_SESSION_STORAGE_KEY, JSON.stringify(session))
  } catch {
    // sessionStorage indisponível
  }
}

export function readWaitingRoomSession(): WaitingRoomSession | null {
  try {
    const raw = sessionStorage.getItem(WAITING_ROOM_SESSION_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as WaitingRoomSession
  } catch {
    return null
  }
}

export function clearWaitingRoomSession() {
  try {
    sessionStorage.removeItem(WAITING_ROOM_SESSION_STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function formatWaitingRoomScheduledAt(date = new Date()): string {
  const time = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
  return `Hoje, ${time}`
}
