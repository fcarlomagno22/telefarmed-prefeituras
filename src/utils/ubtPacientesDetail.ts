import type { ConsultationRecord, NetworkUserFullProfile } from '../data/networkUserProfiles'
import type { NetworkUser } from '../data/networkUsersMock'
import type { UbtPacienteRegistrationDetail, UbtPacienteConsultationRecord } from '../lib/mockServices/ubt/pacientes'

export type UbtPacienteDrawerRow = NetworkUser & {
  municipalRecordId?: string
  firstAttendanceUnit?: string
  registeredAt?: string
  dataQuality?: 'complete' | 'incomplete'
  missingFields?: string[]
}

function isPlaceholder(value: string | undefined | null): boolean {
  const trimmed = value?.trim()
  return !trimmed || trimmed === '—'
}

function genderLabelFromValue(gender: string): string {
  if (gender === 'feminino') return 'Feminino'
  if (gender === 'masculino') return 'Masculino'
  return '—'
}

function ageFromBirthDateBr(birthDate: string): number {
  const match = birthDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return 0
  const [, day, month, year] = match
  const born = new Date(Number(year), Number(month) - 1, Number(day))
  if (Number.isNaN(born.getTime())) return 0
  const today = new Date()
  let age = today.getFullYear() - born.getFullYear()
  const monthDiff = today.getMonth() - born.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < born.getDate())) {
    age -= 1
  }
  return Math.max(age, 0)
}

function buildLastConsultation(row: UbtPacienteDrawerRow): ConsultationRecord[] {
  if (isPlaceholder(row.lastAppointmentDate)) return []

  const relative = row.lastAppointmentRelative ?? ''
  const timeMatch = relative.match(/,\s*(.+)$/)
  const time = timeMatch?.[1]?.trim() || '—'

  return [
    {
      id: 'last-appointment',
      date: row.lastAppointmentDate,
      time,
      specialty: '—',
      professional: '—',
      status: 'concluida',
      protocol: '—',
    },
  ]
}

export function mergeUbtPacienteForDrawer(
  row: UbtPacienteDrawerRow,
  detail: UbtPacienteRegistrationDetail,
): UbtPacienteDrawerRow {
  const displayName = detail.socialName?.trim() || detail.fullName?.trim() || row.name
  const birthDate = isPlaceholder(row.birthDate) ? detail.birthDate : row.birthDate
  const age = row.age > 0 ? row.age : ageFromBirthDateBr(birthDate)
  const phone = isPlaceholder(row.phone) ? detail.phone || row.phone : row.phone
  const bairro = isPlaceholder(row.bairro)
    ? detail.neighborhood?.trim() || row.bairro
    : row.bairro

  return {
    ...row,
    name: displayName,
    birthDate,
    age,
    phone,
    bairro,
    cpf: detail.cpf || row.cpf,
    avatarUrl: row.avatarUrl || detail.photoDataUrl || undefined,
  }
}

export function buildUbtPacienteExtraContext(row: UbtPacienteDrawerRow) {
  const items: { label: string; value: string }[] = []

  if (row.dataQuality) {
    items.push({
      label: 'Qualidade do cadastro',
      value: row.dataQuality === 'complete' ? 'Completo' : 'Incompleto',
    })
  }

  if (row.missingFields?.length) {
    items.push({
      label: 'Campos pendentes',
      value: row.missingFields.join(', '),
    })
  }

  return items
}

export function mapUbtPacienteDetailToProfile(
  detail: UbtPacienteRegistrationDetail,
  row?: UbtPacienteDrawerRow | null,
): NetworkUserFullProfile {
  const birthDate = row?.birthDate && !isPlaceholder(row.birthDate) ? row.birthDate : detail.birthDate
  const age = row?.age && row.age > 0 ? row.age : ageFromBirthDateBr(birthDate)

  return {
    ageGroupLabel: age >= 18 ? 'Maior de idade' : 'Menor de idade',
    genderLabel: genderLabelFromValue(detail.gender),
    email: detail.email?.trim() || '—',
    guardianName: detail.guardianName ?? '',
    guardianCpf: detail.guardianCpf ?? '',
    photoDataUrl: detail.photoDataUrl || row?.avatarUrl || '',
    zipCode: detail.zipCode?.trim() || '—',
    street: detail.street?.trim() || '—',
    number: detail.number?.trim() || '—',
    complement: detail.complement ?? '',
    neighborhood: detail.neighborhood?.trim() || row?.bairro || '—',
    city: detail.city?.trim() || '—',
    state: detail.state?.trim() || '—',
    contacts: (detail.contacts ?? []).map((contact, index) => ({
      id: contact.id ?? `contact-${index + 1}`,
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship ?? '',
    })),
    consultations: row ? buildLastConsultation(row) : [],
    registeredAt: row?.registeredAt?.trim() || '—',
    registrationUnit: row?.firstAttendanceUnit?.trim() || '—',
    notes: '',
  }
}

function mapConsultationRecords(
  consultations: UbtPacienteConsultationRecord[],
): ConsultationRecord[] {
  return consultations.map((item) => ({
    id: item.id,
    date: item.date,
    time: item.time,
    specialty: item.specialty,
    professional: item.professional,
    status: item.status,
    protocol: item.protocol,
  }))
}

export async function loadUbtPacienteDrawerData(
  fetchRow: (id: string) => Promise<UbtPacienteDrawerRow>,
  fetchDetail: (id: string) => Promise<UbtPacienteRegistrationDetail>,
  pacienteId: string,
  fetchConsultations?: (id: string) => Promise<UbtPacienteConsultationRecord[]>,
) {
  const [row, detail, consultations = []] = await Promise.all([
    fetchRow(pacienteId),
    fetchDetail(pacienteId),
    fetchConsultations ? fetchConsultations(pacienteId).catch(() => []) : Promise.resolve([]),
  ])
  const mergedRow = mergeUbtPacienteForDrawer(row, detail)
  const profile = mapUbtPacienteDetailToProfile(detail, mergedRow)
  if (consultations.length > 0) {
    profile.consultations = mapConsultationRecords(consultations)
  }

  return {
    row: mergedRow,
    profile,
    extraContextItems: buildUbtPacienteExtraContext(row),
    detail,
  }
}
