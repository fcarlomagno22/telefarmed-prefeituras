import { doctorsOnline } from './dashboardMock'
import { adminMunicipalityCatalog } from './adminPacientesMock'
import { specialties } from './specialties'

export type AdminDoctorAllocation = 'nacional' | 'por_contrato'
export type AdminProfessionalCategory =
  | 'Médicos'
  | 'Psicólogos'
  | 'Nutricionistas'
  | 'Fonoaudiólogos'

export type AdminDoctorDocumentKind = 'identidade' | 'crm' | 'comprovante_endereco' | 'outro'

export type AdminDoctorDocument = {
  id: string
  kind: AdminDoctorDocumentKind
  label: string
  fileName: string
  uploadedAt: string
}

export type AdminDoctorAttendance = {
  id: string
  dateTimeLabel: string
  contractCity: string
  patientName: string
  durationMinutes: number
  documents: {
    id: string
    label: string
    fileName: string
  }[]
}

export type AdminDoctorReview = {
  id: string
  rating: number
  author: string
  comment: string
  createdAtLabel: string
}

export type AdminDoctorStatus = 'ativo' | 'inativo'

export type AdminDoctorContractingEntity = {
  id: string
  razaoSocial: string
  municipality: string
  uf: string
}

export type AdminDoctor = {
  id: string
  name: string
  phone: string
  cpf: string
  rg: string
  crm: string
  ufCrm: string
  profession: AdminProfessionalCategory
  specialty: string
  avatarUrl: string
  zipCode: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  allocation: AdminDoctorAllocation
  contractingEntity: AdminDoctorContractingEntity | null
  onCallLabel: string
  status: AdminDoctorStatus
  isOnlineNow: boolean
  totalPatientsThisMonth: number
  averageRating: number
  totalReviews: number
  lastLoginAt: string
  lastLogoutAt: string | null
  documents: AdminDoctorDocument[]
  attendances: AdminDoctorAttendance[]
  reviews: AdminDoctorReview[]
}

function buildDoc(
  id: string,
  kind: AdminDoctorDocumentKind,
  label: string,
  fileName: string,
): AdminDoctorDocument {
  return {
    id,
    kind,
    label,
    fileName,
    uploadedAt: '2026-05-10T14:32:00Z',
  }
}

export function createEmptyAdminDoctor(): AdminDoctor {
  return {
    id: `prof-${Date.now()}`,
    name: '',
    phone: '',
    cpf: '',
    rg: '',
    crm: '',
    ufCrm: 'SP',
    profession: 'Médicos',
    specialty: '',
    avatarUrl: '',
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: 'SP',
    allocation: 'por_contrato',
    contractingEntity: null,
    onCallLabel: '',
    status: 'ativo',
    isOnlineNow: false,
    totalPatientsThisMonth: 0,
    averageRating: 0,
    totalReviews: 0,
    lastLoginAt: '—',
    lastLogoutAt: null,
    documents: [],
    attendances: [],
    reviews: [],
  }
}

export const adminDoctors: AdminDoctor[] = doctorsOnline.map((base, index) => {
  const id = String(index + 1)
  const allocation: AdminDoctorAllocation = index % 3 === 0 ? 'nacional' : 'por_contrato'
  // Considera apenas status \"online\" como online; \"consulting\" aparece como offline para fins de BI.
  const isOnlineNow = base.status === 'online'

  const attendances: AdminDoctorAttendance[] = Array.from({ length: 6 }).map((_, idx) => ({
    id: `att-${id}-${idx + 1}`,
    dateTimeLabel: `${18 - idx}/05/2026 · ${idx % 2 === 0 ? '14:30' : '09:15'}`,
    contractCity: idx % 2 === 0 ? 'São José dos Campos' : 'Taubaté',
    patientName: `Paciente ${index + 1}-${idx + 1}`,
    durationMinutes: 18 + idx * 6 + (index % 4),
    documents:
      idx % 2 === 0
        ? [
            {
              id: `att-doc-presc-${id}-${idx + 1}`,
              label: 'Receita médica (PDF)',
              fileName: `receita-${id}-${idx + 1}.pdf`,
            },
            {
              id: `att-doc-exame-${id}-${idx + 1}`,
              label: 'Pedido de exame (PDF)',
              fileName: `exames-${id}-${idx + 1}.pdf`,
            },
          ]
        : [
            {
              id: `att-doc-presc-${id}-${idx + 1}`,
              label: 'Receita médica (PDF)',
              fileName: `receita-${id}-${idx + 1}.pdf`,
            },
          ],
  }))

  const reviews: AdminDoctorReview[] = [
    {
      id: `rev-${id}-1`,
      rating: 5,
      author: 'Paciente',
      comment: 'Atendimento muito atencioso e explicações claras sobre o tratamento.',
      createdAtLabel: 'Há 2 dias',
    },
    {
      id: `rev-${id}-2`,
      rating: 4,
      author: 'Familiar',
      comment: 'Consulta pontual, pediu exames corretos e orientou os próximos passos.',
      createdAtLabel: 'Há 5 dias',
    },
    {
      id: `rev-${id}-3`,
      rating: 4,
      author: 'Paciente',
      comment: 'Boa consulta. Poderia ter mais tempo para dúvidas no final.',
      createdAtLabel: 'Há 9 dias',
    },
  ]

  const professionCycle: AdminProfessionalCategory[] = [
    'Médicos',
    'Psicólogos',
    'Nutricionistas',
    'Fonoaudiólogos',
  ]
  const profession = professionCycle[index % professionCycle.length]

  const specialty = specialties[index % specialties.length]?.name ?? base.specialty
  const municipality =
    adminMunicipalityCatalog[index % adminMunicipalityCatalog.length] ?? 'São José dos Campos'
  const contractingEntity: AdminDoctorContractingEntity | null =
    allocation === 'nacional'
      ? null
      : {
          id: `ent-${municipality.toLowerCase().replace(/\s+/g, '-')}`,
          razaoSocial: `Prefeitura Municipal de ${municipality}`,
          municipality,
          uf: 'SP',
        }

  return {
    id,
    name: base.name,
    phone: `(11) 9${8800 + index}-${1200 + index}`,
    cpf: `123.45${index}.${
      index % 2 === 0 ? '678-9' : '012-3'
    }`, // apenas para mock visual
    rg: `22.${index}5.678-${index}`,
    crm: `CRM ${45000 + index}`,
    ufCrm: 'SP',
    profession,
    specialty,
    avatarUrl: base.avatar,
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: index % 2 === 0 ? 'São José dos Campos' : 'Taubaté',
    state: 'SP',
    allocation,
    contractingEntity,
    onCallLabel:
      allocation === 'nacional'
        ? 'Plantão nacional · escala 12x36'
        : 'Contrato municipal · turno noturno',
    status: index % 4 === 0 ? 'inativo' : 'ativo',
    isOnlineNow,
    totalPatientsThisMonth: 40 + index * 7,
    averageRating: Number(
      (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1),
    ),
    totalReviews: 20 + index * 3,
    lastLoginAt: 'Hoje · 07:45',
    lastLogoutAt: isOnlineNow ? null : 'Ontem · 23:10',
    documents: [
      buildDoc(`doc-id-${id}`, 'identidade', 'Documento de identidade (frente/verso)', `rg-${id}.pdf`),
      buildDoc(`doc-crm-${id}`, 'crm', 'Registro CRM', `crm-${id}.pdf`),
      buildDoc(
        `doc-end-${id}`,
        'comprovante_endereco',
        'Comprovante de endereço',
        `endereco-${id}.pdf`,
      ),
    ],
    attendances,
    reviews,
  }
})

export const adminDoctorsSummary = {
  totalDoctors: adminDoctors.length,
  onlineNow: adminDoctors.filter((d) => d.isOnlineNow).length,
  avgRating:
    adminDoctors.reduce((sum, d) => sum + d.averageRating, 0) / Math.max(1, adminDoctors.length),
  totalReviews: adminDoctors.reduce((sum, d) => sum + d.totalReviews, 0),
}

export function getAdminDoctorSpecialtySlices() {
  const map = new Map<string, number>()
  adminDoctors.forEach((doctor) => {
    map.set(doctor.specialty, (map.get(doctor.specialty) ?? 0) + 1)
  })
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
}

export function getAdminDoctorAllocationSlices() {
  const national = adminDoctors.filter((d) => d.allocation === 'nacional').length
  const contract = adminDoctors.length - national
  return [
    { label: 'Nacional', count: national },
    { label: 'Por contrato', count: contract },
  ]
}
