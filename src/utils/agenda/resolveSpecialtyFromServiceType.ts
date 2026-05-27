import { specialties } from '../../data/specialties'

function normalizeLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

const serviceTypeAliases: Record<string, string> = {
  'clinico geral': '4',
  'clinica geral': '4',
  pediatria: '3',
  cardiologia: '7',
  ginecologia: '19',
  psicologia: '33',
  dermatologia: '14',
  geriatria: '18',
  'ortopedia e traumatologia': '132',
  gastroenterologia: '16',
  neurologia: '26',
  urologia: '38',
  'medicina da familia': '179',
  'nutrologia adulto': '337',
  otorrinolaringologia: '29',
}

export function resolveSpecialtyFromServiceType(serviceType: string) {
  const normalized = normalizeLabel(serviceType)
  const aliasId = serviceTypeAliases[normalized]
  if (aliasId) {
    const specialty = specialties.find((item) => item.id === aliasId)
    if (specialty) return specialty
  }

  return specialties.find((item) => normalizeLabel(item.name) === normalized)
}
