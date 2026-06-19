import type { LucideIcon } from 'lucide-react'
import {
  Apple,
  ArrowRightLeft,
  Brain,
  CalendarCheck,
  ClipboardList,
  FileBarChart,
  FileText,
  FlaskConical,
  Microscope,
  Pill,
  Scale,
  Users,
} from 'lucide-react'
import { brand } from '../config/brand'
import type { DoctorClinicalDocumentKind } from '../components/attendance/doctor/doctorClinicalDocumentTypes'
import {
  DOCTOR_CLINICAL_DOCUMENT_SECTIONS,
  type DoctorClinicalDocumentSection,
} from '../components/attendance/doctor/doctorClinicalDocumentTypes'

export type DemoConsultationProfession = 'medico' | 'psicologo' | 'nutricionista' | 'fonoaudiologo'

export type DemoPsychologistDocumentKind =
  | 'atestado_psicologico'
  | 'relatorio_psicologico'
  | 'relatorio_multiprofissional'
  | 'laudo_psicologico'
  | 'parecer_psicologico'
  | 'encaminhamento_psicologico'

export type DemoNutritionistDocumentKind =
  | 'plano_alimentar'
  | 'prescricao_dietetica'
  | 'prescricao_suplementos'
  | 'pedido_exame_nutricional'
  | 'relatorio_nutricional'
  | 'parecer_nutricional'
  | 'laudo_nutricional'
  | 'declaracao_comparecimento_nutricional'

export type DemoFonoaudiologoDocumentKind =
  | 'declaracao_comparecimento_fonoaudiologico'
  | 'relatorio_fonoaudiologico'
  | 'laudo_fonoaudiologico'
  | 'parecer_fonoaudiologico'
  | 'atestado_fonoaudiologico'
  | 'plano_terapeutico_fonoaudiologico'
  | 'resultado_avaliacao_fonoaudiologico'
  | 'encaminhamento_fonoaudiologico'

export type DemoClinicalDocumentKind =
  | DoctorClinicalDocumentKind
  | DemoPsychologistDocumentKind
  | DemoNutritionistDocumentKind
  | DemoFonoaudiologoDocumentKind

export type DemoProfessionProfile = {
  id: DemoConsultationProfession
  label: string
  doctorName: string
  doctorSpecialty: string
  doctorCouncilLabel: string
  doctorCouncilRegistration: string
  headerTitle: string
  triageSummary: string
  clinicalNoteDraft: string
}

export type DemoDocumentOption = {
  id: DemoClinicalDocumentKind
  title: string
  description: string
  available: boolean
  icon: LucideIcon
  accent: {
    iconBg: string
    iconRing: string
    hoverBorder: string
    hoverShadow: string
    hoverBg: string
    sectionBar: string
    sectionBadge: string
  }
}

export type DemoDocumentSection = {
  id: string
  title: string
  subtitle: string
  accent: DemoDocumentOption['accent']
  items: DemoDocumentOption[]
}

const violetAccent: DemoDocumentOption['accent'] = {
  iconBg: 'bg-gradient-to-br from-violet-500 to-purple-500',
  iconRing: 'ring-violet-100',
  hoverBorder: 'hover:border-violet-300',
  hoverShadow: 'hover:shadow-violet-100/80',
  hoverBg: 'hover:bg-violet-50/60',
  sectionBar: 'from-violet-500 to-purple-400',
  sectionBadge: 'bg-violet-50 text-violet-700 ring-violet-100',
}

const indigoAccent: DemoDocumentOption['accent'] = {
  iconBg: 'bg-gradient-to-br from-indigo-500 to-violet-500',
  iconRing: 'ring-indigo-100',
  hoverBorder: 'hover:border-indigo-300',
  hoverShadow: 'hover:shadow-indigo-100/80',
  hoverBg: 'hover:bg-indigo-50/60',
  sectionBar: 'from-indigo-500 to-violet-400',
  sectionBadge: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
}

const blueAccent: DemoDocumentOption['accent'] = {
  iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-500',
  iconRing: 'ring-blue-100',
  hoverBorder: 'hover:border-blue-300',
  hoverShadow: 'hover:shadow-blue-100/80',
  hoverBg: 'hover:bg-blue-50/60',
  sectionBar: 'from-blue-500 to-cyan-400',
  sectionBadge: 'bg-blue-50 text-blue-700 ring-blue-100',
}

const amberAccent: DemoDocumentOption['accent'] = {
  iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
  iconRing: 'ring-amber-100',
  hoverBorder: 'hover:border-amber-300',
  hoverShadow: 'hover:shadow-amber-100/80',
  hoverBg: 'hover:bg-amber-50/60',
  sectionBar: 'from-amber-500 to-orange-400',
  sectionBadge: 'bg-amber-50 text-amber-700 ring-amber-100',
}

const tealAccent: DemoDocumentOption['accent'] = {
  iconBg: 'bg-gradient-to-br from-teal-500 to-emerald-500',
  iconRing: 'ring-teal-100',
  hoverBorder: 'hover:border-teal-300',
  hoverShadow: 'hover:shadow-teal-100/80',
  hoverBg: 'hover:bg-teal-50/60',
  sectionBar: 'from-teal-500 to-emerald-400',
  sectionBadge: 'bg-teal-50 text-teal-700 ring-teal-100',
}

const fuchsiaAccent: DemoDocumentOption['accent'] = {
  iconBg: 'bg-gradient-to-br from-fuchsia-500 to-pink-500',
  iconRing: 'ring-fuchsia-100',
  hoverBorder: 'hover:border-fuchsia-300',
  hoverShadow: 'hover:shadow-fuchsia-100/80',
  hoverBg: 'hover:bg-fuchsia-50/60',
  sectionBar: 'from-fuchsia-500 to-pink-400',
  sectionBadge: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-100',
}

const limeAccent: DemoDocumentOption['accent'] = {
  iconBg: 'bg-gradient-to-br from-lime-500 to-emerald-500',
  iconRing: 'ring-lime-100',
  hoverBorder: 'hover:border-lime-300',
  hoverShadow: 'hover:shadow-lime-100/80',
  hoverBg: 'hover:bg-lime-50/60',
  sectionBar: 'from-lime-500 to-emerald-400',
  sectionBadge: 'bg-lime-50 text-lime-700 ring-lime-100',
}

const emeraldAccent: DemoDocumentOption['accent'] = {
  iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-500',
  iconRing: 'ring-emerald-100',
  hoverBorder: 'hover:border-emerald-300',
  hoverShadow: 'hover:shadow-emerald-100/80',
  hoverBg: 'hover:bg-emerald-50/60',
  sectionBar: 'from-emerald-500 to-teal-400',
  sectionBadge: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
}

export const DEMO_CONSULTATION_PROFESSIONS: DemoProfessionProfile[] = [
  {
    id: 'medico',
    label: 'Médico(a)',
    doctorName: brand.profissionalOperatorName,
    doctorSpecialty: 'Clínica Médica',
    doctorCouncilLabel: 'CRM',
    doctorCouncilRegistration: '123456/SP',
    headerTitle: 'Consulta por vídeo / Atendimento médico',
    triageSummary: [
      'Motivo: Tosse residual após IVAS',
      'Início: Há 2 dias',
      'Intensidade: Leve (3/10)',
      'Sintomas: Tosse seca ocasional, sem febre',
      'Pressão arterial: 118/76 mmHg',
      'Medicamentos em uso: Nenhum contínuo',
    ].join('\n'),
    clinicalNoteDraft:
      'Paciente em teleconsulta por tosse residual pós-IVAS. Sem febre, sem dispneia. Orientada sobre hidratação e sinais de alerta.',
  },
  {
    id: 'psicologo',
    label: 'Psicólogo(a)',
    doctorName: 'Dra. Ana Beatriz Mendes',
    doctorSpecialty: 'Psicologia Clínica',
    doctorCouncilLabel: 'CRP',
    doctorCouncilRegistration: '06/88421/SP',
    headerTitle: 'Consulta por vídeo / Atendimento psicológico',
    triageSummary: [
      'Motivo: Ansiedade e insônia',
      'Início: Há 3 semanas',
      'Intensidade: Moderada (6/10)',
      'Sintomas: Preocupação excessiva, dificuldade para dormir, irritabilidade',
      'Histórico: Primeiro atendimento psicológico',
      'Medicações em uso: Nenhuma',
    ].join('\n'),
    clinicalNoteDraft:
      'Paciente relata ansiedade generalizada com impacto no sono. Sem ideação suicida ativa. Iniciada escuta clínica e psicoeducação sobre higiene do sono.',
  },
  {
    id: 'nutricionista',
    label: 'Nutricionista',
    doctorName: 'Dra. Camila Rocha',
    doctorSpecialty: 'Nutrição Clínica',
    doctorCouncilLabel: 'CRN',
    doctorCouncilRegistration: '12345/SP',
    headerTitle: 'Consulta por vídeo / Atendimento nutricional',
    triageSummary: [
      'Motivo: Reavaliação de plano alimentar',
      'Objetivo: Controle de peso e glicemia',
      'Restrições: Intolerância à lactose',
      'Medidas: IMC 28,4 kg/m²',
    ].join('\n'),
    clinicalNoteDraft:
      'Paciente em reavaliação nutricional para controle de peso e glicemia. Plano alimentar individualizado com restrição de lactose.',
  },
  {
    id: 'fonoaudiologo',
    label: 'Fonoaudiólogo(a)',
    doctorName: 'Dr. Rafael Costa',
    doctorSpecialty: 'Fonoaudiologia',
    doctorCouncilLabel: 'CRFa',
    doctorCouncilRegistration: '2-88421/SP',
    headerTitle: 'Consulta por vídeo / Atendimento fonoaudiológico',
    triageSummary: [
      'Motivo: Disfonia funcional',
      'Início: Há 10 dias',
      'Contexto: Uso vocal intenso no trabalho',
      'Queixa: Rouquidão vespertina',
    ].join('\n'),
    clinicalNoteDraft:
      'Paciente com disfonia funcional associada a sobrecarga vocal ocupacional. Orientadas medidas de higiene vocal e iniciado plano terapêutico fonoaudiológico.',
  },
]

export const PSYCHOLOGIST_DOCUMENT_SECTIONS: DemoDocumentSection[] = [
  {
    id: 'atestados-relatorios',
    title: 'Atestados e relatórios',
    subtitle: 'Documentos psicológicos mais usados',
    accent: violetAccent,
    items: [
      {
        id: 'atestado_psicologico',
        title: 'Atestado psicológico',
        description: 'Comparecimento ou afastamento',
        available: true,
        icon: FileText,
        accent: amberAccent,
      },
      {
        id: 'relatorio_psicologico',
        title: 'Relatório psicológico',
        description: 'Síntese do acompanhamento',
        available: true,
        icon: FileBarChart,
        accent: indigoAccent,
      },
      {
        id: 'relatorio_multiprofissional',
        title: 'Relatório multiprofissional',
        description: 'Equipe e conduta integrada',
        available: true,
        icon: Users,
        accent: tealAccent,
      },
    ],
  },
  {
    id: 'laudos-pareceres',
    title: 'Laudos e pareceres',
    subtitle: 'Avaliação e opinião técnica',
    accent: blueAccent,
    items: [
      {
        id: 'laudo_psicologico',
        title: 'Laudo psicológico',
        description: 'Achados e interpretação',
        available: true,
        icon: Microscope,
        accent: blueAccent,
      },
      {
        id: 'parecer_psicologico',
        title: 'Parecer psicológico',
        description: 'Resposta técnica formal',
        available: true,
        icon: Scale,
        accent: fuchsiaAccent,
      },
    ],
  },
  {
    id: 'encaminhamentos',
    title: 'Encaminhamentos',
    subtitle: 'Continuidade com outro profissional',
    accent: violetAccent,
    items: [
      {
        id: 'encaminhamento_psicologico',
        title: 'Encaminhamento',
        description: 'Médico, psiquiatra ou outro',
        available: true,
        icon: ArrowRightLeft,
        accent: violetAccent,
      },
    ],
  },
]

export const NUTRITIONIST_DOCUMENT_SECTIONS: DemoDocumentSection[] = [
  {
    id: 'planos-prescricoes',
    title: 'Planos e prescrições',
    subtitle: 'Orientação alimentar e suplementação permitida',
    accent: limeAccent,
    items: [
      {
        id: 'plano_alimentar',
        title: 'Plano alimentar',
        description: 'Distribuição das refeições',
        available: true,
        icon: Apple,
        accent: limeAccent,
      },
      {
        id: 'prescricao_dietetica',
        title: 'Prescrição dietética',
        description: 'Dieta prescrita individualizada',
        available: true,
        icon: ClipboardList,
        accent: tealAccent,
      },
      {
        id: 'prescricao_suplementos',
        title: 'Prescrição de suplementos',
        description: 'Suplementos permitidos',
        available: true,
        icon: Pill,
        accent: amberAccent,
      },
    ],
  },
  {
    id: 'exames-relatorios',
    title: 'Exames e relatórios',
    subtitle: 'Acompanhamento nutricional e dietoterápico',
    accent: blueAccent,
    items: [
      {
        id: 'pedido_exame_nutricional',
        title: 'Solicitação de exames',
        description: 'Laboratoriais ligados ao acompanhamento',
        available: true,
        icon: FlaskConical,
        accent: blueAccent,
      },
      {
        id: 'relatorio_nutricional',
        title: 'Relatório nutricional',
        description: 'Síntese da avaliação nutricional',
        available: true,
        icon: FileBarChart,
        accent: indigoAccent,
      },
    ],
  },
  {
    id: 'laudos-pareceres',
    title: 'Laudos, pareceres e declarações',
    subtitle: 'Avaliação técnica e comparecimento',
    accent: emeraldAccent,
    items: [
      {
        id: 'parecer_nutricional',
        title: 'Parecer nutricional',
        description: 'Resposta técnica formal',
        available: true,
        icon: Scale,
        accent: fuchsiaAccent,
      },
      {
        id: 'laudo_nutricional',
        title: 'Laudo / avaliação nutricional',
        description: 'Achados e interpretação',
        available: true,
        icon: Microscope,
        accent: blueAccent,
      },
      {
        id: 'declaracao_comparecimento_nutricional',
        title: 'Declaração de comparecimento',
        description: 'Consulta nutricional realizada',
        available: true,
        icon: CalendarCheck,
        accent: emeraldAccent,
      },
    ],
  },
]

export const FONOAUDIOLOGIST_DOCUMENT_SECTIONS: DemoDocumentSection[] = [
  {
    id: 'declaracoes-atestados',
    title: 'Declarações e atestados',
    subtitle: 'Documentos de comparecimento e afastamento',
    accent: emeraldAccent,
    items: [
      {
        id: 'declaracao_comparecimento_fonoaudiologico',
        title: 'Declaração de comparecimento',
        description: 'Comprovação de atendimento fonoaudiológico',
        available: true,
        icon: CalendarCheck,
        accent: emeraldAccent,
      },
      {
        id: 'atestado_fonoaudiologico',
        title: 'Atestado fonoaudiológico',
        description: 'Comparecimento ou afastamento',
        available: true,
        icon: FileText,
        accent: amberAccent,
      },
    ],
  },
  {
    id: 'relatorios-tecnicos',
    title: 'Relatórios e avaliação',
    subtitle: 'Síntese clínica, laudos e pareceres',
    accent: indigoAccent,
    items: [
      {
        id: 'relatorio_fonoaudiologico',
        title: 'Relatório fonoaudiológico',
        description: 'Síntese de acompanhamento',
        available: true,
        icon: FileBarChart,
        accent: indigoAccent,
      },
      {
        id: 'laudo_fonoaudiologico',
        title: 'Laudo fonoaudiológico',
        description: 'Achados e interpretação',
        available: true,
        icon: Microscope,
        accent: blueAccent,
      },
      {
        id: 'parecer_fonoaudiologico',
        title: 'Parecer fonoaudiológico',
        description: 'Resposta técnica formal',
        available: true,
        icon: Scale,
        accent: fuchsiaAccent,
      },
      {
        id: 'resultado_avaliacao_fonoaudiologico',
        title: 'Resultado de avaliação/exame fonoaudiológico',
        description: 'Registro formal de resultados',
        available: true,
        icon: FlaskConical,
        accent: blueAccent,
      },
    ],
  },
  {
    id: 'plano-continuidade',
    title: 'Plano terapêutico e continuidade',
    subtitle: 'Planejamento da intervenção e encaminhamento',
    accent: tealAccent,
    items: [
      {
        id: 'plano_terapeutico_fonoaudiologico',
        title: 'Plano terapêutico fonoaudiológico',
        description: 'Objetivos, frequência e técnicas',
        available: true,
        icon: ClipboardList,
        accent: tealAccent,
      },
      {
        id: 'encaminhamento_fonoaudiologico',
        title: 'Encaminhamento',
        description: 'Continuidade com outro profissional',
        available: true,
        icon: ArrowRightLeft,
        accent: violetAccent,
      },
    ],
  },
]

const COMING_SOON_SECTION: DemoDocumentSection = {
  id: 'em-breve',
  title: 'Documentos da profissão',
  subtitle: 'Em desenvolvimento para demonstração',
  accent: tealAccent,
  items: [
    {
      id: 'receita',
      title: 'Em breve',
      description: 'Documentos específicos desta profissão',
      available: false,
      icon: Brain,
      accent: tealAccent,
    },
  ],
}

export function getDemoProfessionProfile(
  profession: DemoConsultationProfession,
): DemoProfessionProfile {
  return (
    DEMO_CONSULTATION_PROFESSIONS.find((entry) => entry.id === profession) ??
    DEMO_CONSULTATION_PROFESSIONS[0]!
  )
}

export function getDemoDocumentSectionsForProfession(
  profession: DemoConsultationProfession,
): DemoDocumentSection[] | DoctorClinicalDocumentSection[] {
  if (profession === 'medico') return DOCTOR_CLINICAL_DOCUMENT_SECTIONS
  if (profession === 'psicologo') return PSYCHOLOGIST_DOCUMENT_SECTIONS
  if (profession === 'nutricionista') return NUTRITIONIST_DOCUMENT_SECTIONS
  if (profession === 'fonoaudiologo') return FONOAUDIOLOGIST_DOCUMENT_SECTIONS
  return [COMING_SOON_SECTION]
}

export function isDemoPsychologistDocumentKind(
  kind: DemoClinicalDocumentKind,
): kind is DemoPsychologistDocumentKind {
  return (
    kind === 'atestado_psicologico' ||
    kind === 'relatorio_psicologico' ||
    kind === 'relatorio_multiprofissional' ||
    kind === 'laudo_psicologico' ||
    kind === 'parecer_psicologico' ||
    kind === 'encaminhamento_psicologico'
  )
}

export function isDemoNutritionistDocumentKind(
  kind: DemoClinicalDocumentKind,
): kind is DemoNutritionistDocumentKind {
  return (
    kind === 'plano_alimentar' ||
    kind === 'prescricao_dietetica' ||
    kind === 'prescricao_suplementos' ||
    kind === 'pedido_exame_nutricional' ||
    kind === 'relatorio_nutricional' ||
    kind === 'parecer_nutricional' ||
    kind === 'laudo_nutricional' ||
    kind === 'declaracao_comparecimento_nutricional'
  )
}

export function isDemoFonoaudiologoDocumentKind(
  kind: DemoClinicalDocumentKind,
): kind is DemoFonoaudiologoDocumentKind {
  return (
    kind === 'declaracao_comparecimento_fonoaudiologico' ||
    kind === 'relatorio_fonoaudiologico' ||
    kind === 'laudo_fonoaudiologico' ||
    kind === 'parecer_fonoaudiologico' ||
    kind === 'atestado_fonoaudiologico' ||
    kind === 'plano_terapeutico_fonoaudiologico' ||
    kind === 'resultado_avaliacao_fonoaudiologico' ||
    kind === 'encaminhamento_fonoaudiologico'
  )
}
