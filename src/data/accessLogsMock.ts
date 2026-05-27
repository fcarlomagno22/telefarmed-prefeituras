import { systemPages } from '../config/accessCredentials'
import { initialAccessCredentialUsers } from './accessCredentialsMock'
import { addDays, toDateKey } from '../utils/agendaDate'

export type AccessLogOutcome = 'success' | 'failure'

export type AccessLogEntry = {
  id: string
  userId: string
  userName: string
  userEmail: string
  initials: string
  avatarClassName: string
  avatarUrl?: string
  accessedAt: string
  pageId: string
  pageLabel: string
  device: string
  ipAddress: string
  outcome: AccessLogOutcome
}

const devices = ['Chrome · Windows', 'Safari · iPhone', 'Edge · Windows', 'Firefox · macOS']
const hours = [7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]

function buildMockAccessLogs(): AccessLogEntry[] {
  const today = new Date()
  const entries: AccessLogEntry[] = []
  let id = 0

  for (let dayOffset = 0; dayOffset < 14; dayOffset += 1) {
    const day = addDays(today, -dayOffset)
    const dateKey = toDateKey(day)

    for (let i = 0; i < 4 + (dayOffset % 3); i += 1) {
      const user = initialAccessCredentialUsers[i % initialAccessCredentialUsers.length]
      const page = systemPages[(dayOffset + i) % systemPages.length]
      const hour = hours[(dayOffset + i * 2) % hours.length]
      const minute = (i * 11 + dayOffset * 7) % 60
      const accessedAt = new Date(day)
      accessedAt.setHours(hour, minute, 0, 0)

      entries.push({
        id: `log-${id++}`,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        initials: user.initials,
        avatarClassName: user.avatarClassName,
        avatarUrl: user.avatarUrl,
        accessedAt: accessedAt.toISOString(),
        pageId: page.id,
        pageLabel: page.label,
        device: devices[(dayOffset + i) % devices.length],
        ipAddress: `177.${(20 + i) % 200}.${(dayOffset + 10) % 255}.${(30 + i) % 200}`,
        outcome: dayOffset === 3 && i === 1 ? 'failure' : 'success',
      })
    }
  }

  return entries.sort(
    (a, b) => new Date(b.accessedAt).getTime() - new Date(a.accessedAt).getTime(),
  )
}

export const accessLogs = buildMockAccessLogs()
