import type { PatientContact } from './unitDashboardMock'

export type UserProfileEdits = {
  phone: string
  email: string
  zipCode: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  guardianName: string
  guardianCpf: string
  contacts: PatientContact[]
}

export type UserAnnotation = {
  id: string
  text: string
  createdAt: string
  authorLabel: string
}

export function createAnnotationId() {
  return `ann-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function formatAnnotationDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}
