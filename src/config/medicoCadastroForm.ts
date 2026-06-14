import { specialties } from '../data/specialties'
import type { MedicoCadastroMedicalSpecialty } from '../types/medicoCadastro'
import type { ProfissionalPerfilDocumentKind } from '../types/profissionalPerfil'

export const MEDICO_CADASTRO_MAX_MEDICAL_SPECIALTIES = 8

export function createMedicoCadastroMedicalSpecialty(): MedicoCadastroMedicalSpecialty {
  const id =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `spec-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  return { id, specialty: '', rqe: '' }
}

export const medicoCadastroFormationOptions = [
  { value: 'medicina', label: 'Medicina' },
  { value: 'psicologia', label: 'Psicologia' },
  { value: 'nutricao', label: 'Nutrição' },
  { value: 'fonoaudiologia', label: 'Fonoaudiologia' },
] as const

export type MedicoCadastroFormation =
  (typeof medicoCadastroFormationOptions)[number]['value']

export function isMedicoCadastroMedicinaFormation(
  formation: MedicoCadastroFormation | '',
): formation is 'medicina' {
  return formation === 'medicina'
}

export function getMedicoCadastroConselhoLabel(formation: MedicoCadastroFormation): string {
  switch (formation) {
    case 'psicologia':
      return 'CRP'
    case 'nutricao':
      return 'CRN'
    case 'fonoaudiologia':
      return 'CRFa'
    default:
      return 'CRM'
  }
}

export function getMedicoCadastroFormationDiplomaHint(formation: MedicoCadastroFormation): string {
  switch (formation) {
    case 'psicologia':
      return 'Diploma de psicologia ou documento que comprove a formação.'
    case 'nutricao':
      return 'Diploma de nutrição ou documento que comprove a formação.'
    case 'fonoaudiologia':
      return 'Diploma de fonoaudiologia ou documento que comprove a formação.'
    default:
      return 'Diploma de medicina ou documento que comprove a formação.'
  }
}

const NON_MEDICAL_SPECIALTY_PATTERN =
  /^psicologia$|^orientação nutricional$|^fonoaudiologia$/i

/** Todas as especialidades médicas do catálogo (`specialties.ts`), exceto áreas de outras formações. */
export function getMedicoCadastroSpecialtyOptions(formation: MedicoCadastroFormation | '') {
  if (!isMedicoCadastroMedicinaFormation(formation)) return []

  return specialties
    .filter((item) => !NON_MEDICAL_SPECIALTY_PATTERN.test(item.name))
    .map((item) => ({ value: item.name, label: item.name }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
}

export type MedicoCadastroDocumentField = {
  id: string
  kind: ProfissionalPerfilDocumentKind
  label: string
  hint: string
  required: boolean
}

export function getMedicoCadastroDocumentFields(
  formation: MedicoCadastroFormation,
): MedicoCadastroDocumentField[] {
  const conselho = getMedicoCadastroConselhoLabel(formation)

  return [
    {
      id: 'doc-conselho',
      kind: 'crm',
      label: `Registro no conselho de classe (${conselho})`,
      hint: `Carteira profissional, certidão de regularidade ou documento equivalente com inscrição ativa no ${conselho} da sua UF.`,
      required: true,
    },
    {
      id: 'doc-identidade',
      kind: 'identidade',
      label: 'Documento de identidade',
      hint: 'RG, CNH ou documento oficial com foto.',
      required: true,
    },
    {
      id: 'doc-profissional',
      kind: 'outro',
      label: 'Comprovante profissional',
      hint: getMedicoCadastroFormationDiplomaHint(formation),
      required: true,
    },
    {
      id: 'doc-endereco',
      kind: 'comprovante',
      label: 'Comprovante de endereço',
      hint: 'Emitido nos últimos 90 dias, no mesmo endereço informado.',
      required: true,
    },
  ]
}

export const MEDICO_CADASTRO_ACCEPTED_DOCUMENT_TYPES =
  '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'

export const MEDICO_CADASTRO_DOCUMENT_MAX_BYTES = 8 * 1024 * 1024

export type MedicoCadastroFormStepId =
  | 'personal'
  | 'professional'
  | 'specialties'
  | 'address'
  | 'documents'

export type MedicoCadastroFormStep = {
  id: MedicoCadastroFormStepId
  label: string
}

const MEDICO_CADASTRO_FORM_STEPS: MedicoCadastroFormStep[] = [
  { id: 'personal', label: 'Pessoal' },
  { id: 'professional', label: 'Profissional' },
  { id: 'specialties', label: 'Especialidades' },
  { id: 'address', label: 'Endereço' },
  { id: 'documents', label: 'Documentos' },
]

/** Etapas exibidas conforme a formação (especialidades só para medicina). */
export function getMedicoCadastroFormSteps(
  formation: MedicoCadastroFormation | '',
): MedicoCadastroFormStep[] {
  if (isMedicoCadastroMedicinaFormation(formation)) {
    return MEDICO_CADASTRO_FORM_STEPS
  }

  return MEDICO_CADASTRO_FORM_STEPS.filter((step) => step.id !== 'specialties')
}

/** @deprecated Use getMedicoCadastroFormSteps(formation) */
export const medicoCadastroFormSteps = MEDICO_CADASTRO_FORM_STEPS
