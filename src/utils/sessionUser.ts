import { brand } from '../config/brand'

let sessionUserDisplayName: string | null = null

/** Sincroniza o nome exibido em exports/PDF com o usuário autenticado do portal. */
export function setSessionUserDisplayName(name: string | null | undefined) {
  const trimmed = name?.trim()
  sessionUserDisplayName = trimmed ? trimmed : null
}

export function getLoggedOperatorName(fallback = brand.operatorName) {
  return sessionUserDisplayName ?? fallback
}
