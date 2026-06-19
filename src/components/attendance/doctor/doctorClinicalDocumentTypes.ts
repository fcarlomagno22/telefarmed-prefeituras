import type { LucideIcon } from 'lucide-react'
import {
  ArrowRightLeft,
  BedDouble,
  ClipboardList,
  FileBarChart,
  FileText,
  MapPinned,
  Microscope,
  Pill,
} from 'lucide-react'

export type DoctorClinicalDocumentKind =
  | 'receita'
  | 'pedido_exame'
  | 'atestado'
  | 'encaminhamento'
  | 'relatorio'
  | 'laudo'
  | 'avaliacao_presencial'
  | 'internacao'

export type DoctorClinicalDocumentAccent = {
  iconBg: string
  iconRing: string
  hoverBorder: string
  hoverShadow: string
  hoverBg: string
  sectionBar: string
  sectionBadge: string
}

export type DoctorClinicalDocumentOption = {
  id: DoctorClinicalDocumentKind
  title: string
  description: string
  available: boolean
  icon: LucideIcon
  accent: DoctorClinicalDocumentAccent
}

export type DoctorClinicalDocumentSection = {
  id: string
  title: string
  subtitle: string
  accent: DoctorClinicalDocumentAccent
  items: DoctorClinicalDocumentOption[]
}

const emeraldAccent: DoctorClinicalDocumentAccent = {
  iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-500',
  iconRing: 'ring-emerald-100',
  hoverBorder: 'hover:border-emerald-300',
  hoverShadow: 'hover:shadow-emerald-100/80',
  hoverBg: 'hover:bg-emerald-50/60',
  sectionBar: 'from-emerald-500 to-teal-400',
  sectionBadge: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
}

const skyAccent: DoctorClinicalDocumentAccent = {
  iconBg: 'bg-gradient-to-br from-sky-500 to-blue-500',
  iconRing: 'ring-sky-100',
  hoverBorder: 'hover:border-sky-300',
  hoverShadow: 'hover:shadow-sky-100/80',
  hoverBg: 'hover:bg-sky-50/60',
  sectionBar: 'from-sky-500 to-blue-400',
  sectionBadge: 'bg-sky-50 text-sky-700 ring-sky-100',
}

const amberAccent: DoctorClinicalDocumentAccent = {
  iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
  iconRing: 'ring-amber-100',
  hoverBorder: 'hover:border-amber-300',
  hoverShadow: 'hover:shadow-amber-100/80',
  hoverBg: 'hover:bg-amber-50/60',
  sectionBar: 'from-amber-500 to-orange-400',
  sectionBadge: 'bg-amber-50 text-amber-700 ring-amber-100',
}

const violetAccent: DoctorClinicalDocumentAccent = {
  iconBg: 'bg-gradient-to-br from-violet-500 to-purple-500',
  iconRing: 'ring-violet-100',
  hoverBorder: 'hover:border-violet-300',
  hoverShadow: 'hover:shadow-violet-100/80',
  hoverBg: 'hover:bg-violet-50/60',
  sectionBar: 'from-violet-500 to-purple-400',
  sectionBadge: 'bg-violet-50 text-violet-700 ring-violet-100',
}

const indigoAccent: DoctorClinicalDocumentAccent = {
  iconBg: 'bg-gradient-to-br from-indigo-500 to-violet-500',
  iconRing: 'ring-indigo-100',
  hoverBorder: 'hover:border-indigo-300',
  hoverShadow: 'hover:shadow-indigo-100/80',
  hoverBg: 'hover:bg-indigo-50/60',
  sectionBar: 'from-indigo-500 to-violet-400',
  sectionBadge: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
}

const blueAccent: DoctorClinicalDocumentAccent = {
  iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-500',
  iconRing: 'ring-blue-100',
  hoverBorder: 'hover:border-blue-300',
  hoverShadow: 'hover:shadow-blue-100/80',
  hoverBg: 'hover:bg-blue-50/60',
  sectionBar: 'from-blue-500 to-cyan-400',
  sectionBadge: 'bg-blue-50 text-blue-700 ring-blue-100',
}

const tealAccent: DoctorClinicalDocumentAccent = {
  iconBg: 'bg-gradient-to-br from-teal-500 to-emerald-500',
  iconRing: 'ring-teal-100',
  hoverBorder: 'hover:border-teal-300',
  hoverShadow: 'hover:shadow-teal-100/80',
  hoverBg: 'hover:bg-teal-50/60',
  sectionBar: 'from-teal-500 to-emerald-400',
  sectionBadge: 'bg-teal-50 text-teal-700 ring-teal-100',
}

const roseAccent: DoctorClinicalDocumentAccent = {
  iconBg: 'bg-gradient-to-br from-rose-500 to-pink-500',
  iconRing: 'ring-rose-100',
  hoverBorder: 'hover:border-rose-300',
  hoverShadow: 'hover:shadow-rose-100/80',
  hoverBg: 'hover:bg-rose-50/60',
  sectionBar: 'from-rose-500 to-pink-400',
  sectionBadge: 'bg-rose-50 text-rose-700 ring-rose-100',
}

export const DOCTOR_CLINICAL_DOCUMENT_SECTIONS: DoctorClinicalDocumentSection[] = [
  {
    id: 'prescricao',
    title: 'Prescrição e atestados',
    subtitle: 'Mais usados na consulta',
    accent: emeraldAccent,
    items: [
      {
        id: 'receita',
        title: 'Receita Médica',
        description: 'Prescrição com posologia',
        available: true,
        icon: Pill,
        accent: emeraldAccent,
      },
      {
        id: 'pedido_exame',
        title: 'Pedido de Exame',
        description: 'Exames complementares',
        available: true,
        icon: ClipboardList,
        accent: skyAccent,
      },
      {
        id: 'atestado',
        title: 'Atestado Médico',
        description: 'Afastamento ou comparecimento',
        available: true,
        icon: FileText,
        accent: amberAccent,
      },
    ],
  },
  {
    id: 'laudos',
    title: 'Encaminhamentos e laudos',
    subtitle: 'Continuidade do cuidado',
    accent: violetAccent,
    items: [
      {
        id: 'encaminhamento',
        title: 'Encaminhamento',
        description: 'Referência a outro serviço',
        available: true,
        icon: ArrowRightLeft,
        accent: violetAccent,
      },
      {
        id: 'relatorio',
        title: 'Relatório Médico',
        description: 'Resumo clínico do atendimento',
        available: true,
        icon: FileBarChart,
        accent: indigoAccent,
      },
      {
        id: 'laudo',
        title: 'Laudo Médico',
        description: 'Parecer sobre condição ou exame',
        available: true,
        icon: Microscope,
        accent: blueAccent,
      },
    ],
  },
  {
    id: 'solicitacoes',
    title: 'Solicitações especiais',
    subtitle: 'Avaliação presencial ou internação',
    accent: tealAccent,
    items: [
      {
        id: 'avaliacao_presencial',
        title: 'Avaliação presencial',
        description: 'Retorno ou avaliação no serviço',
        available: true,
        icon: MapPinned,
        accent: tealAccent,
      },
      {
        id: 'internacao',
        title: 'Internação',
        description: 'Solicitação de internação',
        available: true,
        icon: BedDouble,
        accent: roseAccent,
      },
    ],
  },
]

export function isDoctorClinicalDocumentAvailable(kind: DoctorClinicalDocumentKind) {
  for (const section of DOCTOR_CLINICAL_DOCUMENT_SECTIONS) {
    const item = section.items.find((entry) => entry.id === kind)
    if (item) return item.available
  }
  return false
}

export function countDoctorClinicalDocuments() {
  let available = 0
  let total = 0

  for (const section of DOCTOR_CLINICAL_DOCUMENT_SECTIONS) {
    for (const item of section.items) {
      total += 1
      if (item.available) available += 1
    }
  }

  return { available, total, comingSoon: total - available }
}
