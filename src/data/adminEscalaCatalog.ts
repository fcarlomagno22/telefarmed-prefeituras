import type { EscalaCatalogApi } from '../lib/mockServices/admin/escala'

let catalog: EscalaCatalogApi | null = null

export function setAdminEscalaCatalog(next: EscalaCatalogApi | null) {
  catalog = next
}

export function getAdminEscalaCatalog(): EscalaCatalogApi | null {
  return catalog
}

export function getAdminEscalaDoctorOptions() {
  return catalog?.doctors ?? []
}

export function getAdminEscalaPrefeituras() {
  return catalog?.prefeituras ?? []
}

export function getAdminEscalaUbts() {
  return catalog?.ubts ?? []
}

export function getAdminEscalaSpecialties() {
  return catalog?.specialties ?? []
}

export function getPrefeituraById(id: string) {
  return getAdminEscalaPrefeituras().find((p) => p.id === id)
}

export function getUbtById(id: string) {
  return getAdminEscalaUbts().find((u) => u.id === id)
}

export function getUbtsForPrefeituraIds(prefeituraIds: string[]) {
  const ubts = getAdminEscalaUbts()
  if (prefeituraIds.length === 0) return ubts
  const set = new Set(prefeituraIds)
  return ubts.filter((ubt) => set.has(ubt.municipalityId))
}
