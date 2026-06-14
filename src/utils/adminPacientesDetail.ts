import type { ConsultationRecord, NetworkUserFullProfile } from '../data/networkUserProfiles'
import type {
  AdminMunicipalPatientDetail,
  AdminPatientConsultation,
  AdminPatientDetailProfile,
} from '../types/adminPacientes'

function mapConsultationStatus(
  status: AdminPatientConsultation['status'],
): ConsultationRecord['status'] {
  return status
}

export function mapAdminPatientDetailToProfile(
  detail: AdminMunicipalPatientDetail,
): NetworkUserFullProfile {
  const profile = detail.profile
  const consultations: ConsultationRecord[] = (detail.consultations ?? []).map((item) => ({
    id: item.id,
    date: item.date,
    time: item.time,
    specialty: item.specialty,
    professional: item.professional,
    status: mapConsultationStatus(item.status),
    protocol: item.protocol,
  }))

  return {
    ageGroupLabel: detail.age >= 18 ? 'Maior de idade' : 'Menor de idade',
    genderLabel: profile?.genderLabel ?? '—',
    email: profile?.email ?? '—',
    guardianName: profile?.guardianName ?? '',
    guardianCpf: profile?.guardianCpf ?? '',
    photoDataUrl: detail.avatarUrl ?? '',
    zipCode: profile?.zipCode ?? '—',
    street: profile?.street ?? '—',
    number: profile?.number ?? '—',
    complement: profile?.complement ?? '',
    neighborhood: profile?.neighborhood ?? detail.bairro,
    city: profile?.city ?? detail.municipality,
    state: profile?.state ?? '—',
    contacts: (profile?.contacts ?? []).map((contact, index) => ({
      id: contact.id ?? `contact-${index + 1}`,
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship ?? '',
    })),
    consultations,
    registeredAt: profile?.registeredAt ?? detail.registeredAt,
    registrationUnit: profile?.registrationUnit ?? detail.firstAttendanceUnit,
    notes: profile?.notes ?? '',
  }
}

export function buildAdminPatientExtraContext(detail: AdminMunicipalPatientDetail) {
  const items = [
    { label: 'Entidade contratante', value: detail.contractingEntityRazaoSocial },
    { label: 'Contratante', value: `${detail.municipality} / ${detail.profile?.state ?? '—'}` },
    {
      label: 'Status do contrato',
      value: detail.contractStatus === 'ativo' ? 'Ativo' : 'Encerrado',
    },
  ]

  const ubts = detail.ubts ?? []
  if (ubts.length > 0) {
    const principal = ubts.find((ubt) => ubt.principal) ?? ubts[0]
    items.push({
      label: 'UBT principal',
      value: principal.nome,
    })
    if (ubts.length > 1) {
      items.push({
        label: 'Outras UBTs',
        value: ubts
          .filter((ubt) => ubt.id !== principal.id)
          .map((ubt) => ubt.nome)
          .join(', '),
      })
    }
  }

  return items
}
