const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })

export function formatLastAccessLabel(ultimoLoginEm: string | null | undefined): string {
  if (!ultimoLoginEm) return 'Sem acesso recente'

  const date = new Date(ultimoLoginEm)
  if (Number.isNaN(date.getTime())) return 'Sem acesso recente'

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.round(diffMs / 60_000)

  if (diffMinutes < 1) return 'Agora'
  if (diffMinutes < 60) return `Há ${diffMinutes} min`

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) {
    if (diffHours === 1) return 'Há 1 hora'
    return `Há ${diffHours} horas`
  }

  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)

  if (date >= startOfToday) {
    return `Hoje, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  }

  if (date >= startOfYesterday) {
    return `Ontem, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  }

  const diffDays = Math.round(diffHours / 24)
  if (diffDays < 7) return rtf.format(-diffDays, 'day')

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatCpfDisplay(cpf: string): string {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return cpf
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

const avatarPalette = [
  'bg-orange-100 text-orange-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-800',
]

export function avatarClassForId(id: string): string {
  const index = Math.abs([...id].reduce((acc, char) => acc + char.charCodeAt(0), 0)) % avatarPalette.length
  return avatarPalette[index]!
}
