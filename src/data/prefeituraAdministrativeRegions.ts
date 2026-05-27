export type PrefeituraAdministrativeRegion = {
  id: string
  key: string
  label: string
  gradientFrom: string
  gradientTo: string
}

const defaultRegions: PrefeituraAdministrativeRegion[] = [
  {
    id: 'ra-centro',
    key: 'centro',
    label: 'Centro',
    gradientFrom: '#3b82f6',
    gradientTo: '#6366f1',
  },
  {
    id: 'ra-norte',
    key: 'norte',
    label: 'Norte',
    gradientFrom: '#10b981',
    gradientTo: '#14b8a6',
  },
  {
    id: 'ra-sul',
    key: 'sul',
    label: 'Sul',
    gradientFrom: '#f97316',
    gradientTo: '#fb923c',
  },
  {
    id: 'ra-leste',
    key: 'leste',
    label: 'Leste',
    gradientFrom: '#8b5cf6',
    gradientTo: '#a855f7',
  },
  {
    id: 'ra-oeste',
    key: 'oeste',
    label: 'Oeste',
    gradientFrom: '#ec4899',
    gradientTo: '#f43f5e',
  },
]

let regions: PrefeituraAdministrativeRegion[] = [...defaultRegions]

function slugify(label: string) {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function uniqueKey(base: string) {
  let key = base || 'regiao'
  let index = 1
  while (regions.some((region) => region.key === key)) {
    key = `${base}-${index}`
    index += 1
  }
  return key
}

export function getPrefeituraAdministrativeRegions() {
  return [...regions]
}

export function createPrefeituraAdministrativeRegion(label: string) {
  const trimmed = label.trim()
  if (!trimmed) return null

  const key = uniqueKey(slugify(trimmed))
  const region: PrefeituraAdministrativeRegion = {
    id: `ra-${key}-${Date.now()}`,
    key,
    label: trimmed,
    gradientFrom: '#64748b',
    gradientTo: '#94a3b8',
  }

  regions = [...regions, region]
  return region
}

export function updatePrefeituraAdministrativeRegion(id: string, label: string) {
  const trimmed = label.trim()
  if (!trimmed) return false

  const index = regions.findIndex((region) => region.id === id)
  if (index < 0) return false

  const next = [...regions]
  next[index] = { ...next[index], label: trimmed }
  regions = next
  return true
}

export function deletePrefeituraAdministrativeRegion(id: string) {
  if (regions.length <= 1) return false
  const next = regions.filter((region) => region.id !== id)
  if (next.length === regions.length) return false
  regions = next
  return true
}

export function findPrefeituraAdministrativeRegion(id: string) {
  return regions.find((region) => region.id === id)
}
