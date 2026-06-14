import {
  getMedicoCadastroConselhoLabel,
  getMedicoCadastroDocumentFields,
  isMedicoCadastroMedicinaFormation,
  MEDICO_CADASTRO_MAX_MEDICAL_SPECIALTIES,
} from '../../config/medicoCadastroForm'
import type {
  MedicoCadastroDocumentUploads,
  MedicoCadastroFormErrors,
  MedicoCadastroFormValues,
} from '../../types/medicoCadastro'
import { isValidCpf } from '../cpf'

function parseBirthDateDigits(value: string): string {
  return value.replace(/\D/g, '')
}

function isValidBirthDate(value: string): boolean {
  const digits = parseBirthDateDigits(value)
  if (digits.length !== 8) return false

  const day = Number(digits.slice(0, 2))
  const month = Number(digits.slice(2, 4))
  const year = Number(digits.slice(4, 8))
  if (month < 1 || month > 12 || day < 1 || day > 31) return false

  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return false
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date <= today && year >= 1920
}

export function validateMedicoCadastroPersonalStep(
  values: MedicoCadastroFormValues,
): MedicoCadastroFormErrors {
  const errors: MedicoCadastroFormErrors = {}

  if (values.fullName.trim().length < 3) {
    errors.fullName = 'Informe seu nome completo.'
  }

  if (!isValidCpf(values.cpf)) {
    errors.cpf = 'CPF inválido.'
  }

  if (!isValidBirthDate(values.birthDate)) {
    errors.birthDate = 'Data de nascimento inválida.'
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'E-mail inválido.'
  }

  if (values.phone.replace(/\D/g, '').length < 10) {
    errors.phone = 'Telefone inválido.'
  }

  return errors
}

export function validateMedicoCadastroProfessionalStep(
  values: MedicoCadastroFormValues,
): MedicoCadastroFormErrors {
  const errors: MedicoCadastroFormErrors = {}

  if (!values.formation) {
    errors.formation = 'Selecione sua formação.'
  }

  const conselhoLabel = values.formation
    ? getMedicoCadastroConselhoLabel(values.formation)
    : 'conselho'

  if (values.crm.replace(/\D/g, '').length < 3) {
    errors.crm = `Informe o número do ${conselhoLabel}.`
  }

  if (values.uf.trim().length !== 2) {
    errors.uf = `Selecione a UF do ${conselhoLabel}.`
  }

  return errors
}

export function validateMedicoCadastroSpecialtiesStep(
  values: MedicoCadastroFormValues,
): MedicoCadastroFormErrors {
  const errors: MedicoCadastroFormErrors = {}

  if (!isMedicoCadastroMedicinaFormation(values.formation)) {
    return errors
  }

  if (values.medicalSpecialties.length === 0) {
    errors.medicalSpecialties = 'Informe ao menos uma especialidade com RQE.'
  }

  if (values.medicalSpecialties.length > MEDICO_CADASTRO_MAX_MEDICAL_SPECIALTIES) {
    errors.medicalSpecialties = `É possível informar no máximo ${MEDICO_CADASTRO_MAX_MEDICAL_SPECIALTIES} especialidades.`
  }

  const seen = new Set<string>()
  for (const item of values.medicalSpecialties) {
    const specialtyKey = `medicalSpecialty:${item.id}:specialty` as const
    const rqeKey = `medicalSpecialty:${item.id}:rqe` as const

    if (!item.specialty.trim()) {
      errors[specialtyKey] = 'Selecione a especialidade.'
    } else {
      const normalized = item.specialty.trim().toLowerCase()
      if (seen.has(normalized)) {
        errors[specialtyKey] = 'Especialidade duplicada.'
      }
      seen.add(normalized)
    }

    const rqeDigits = item.rqe.replace(/\D/g, '')
    if (rqeDigits.length < 3) {
      errors[rqeKey] = 'Informe o RQE com 3 a 8 dígitos.'
    }
  }

  return errors
}

export function validateMedicoCadastroAddressStep(
  values: MedicoCadastroFormValues,
): MedicoCadastroFormErrors {
  const errors: MedicoCadastroFormErrors = {}

  if (values.zipCode.replace(/\D/g, '').length !== 8) {
    errors.zipCode = 'Informe um CEP válido.'
  }

  if (!values.street.trim()) {
    errors.street = 'Informe o logradouro.'
  }

  if (!values.number.trim()) {
    errors.number = 'Informe o número.'
  }

  if (!values.neighborhood.trim()) {
    errors.neighborhood = 'Informe o bairro.'
  }

  if (!values.city.trim()) {
    errors.city = 'Informe a cidade.'
  }

  if (values.state.trim().length !== 2) {
    errors.state = 'Selecione a UF.'
  }

  return errors
}

export function validateMedicoCadastroDocumentsStep(
  documents: MedicoCadastroDocumentUploads,
  formation: MedicoCadastroFormValues['formation'],
): MedicoCadastroFormErrors {
  const errors: MedicoCadastroFormErrors = {}

  if (!formation) {
    errors.formation = 'Selecione sua formação antes de enviar os documentos.'
    return errors
  }

  for (const field of getMedicoCadastroDocumentFields(formation)) {
    if (!field.required) continue
    if (!documents[field.id]) {
      errors[`document:${field.id}`] = 'Envie este documento para análise.'
    }
  }

  return errors
}

export function validateMedicoCadastroForm(
  values: MedicoCadastroFormValues,
  documents: MedicoCadastroDocumentUploads,
): MedicoCadastroFormErrors {
  return {
    ...validateMedicoCadastroPersonalStep(values),
    ...validateMedicoCadastroProfessionalStep(values),
    ...validateMedicoCadastroSpecialtiesStep(values),
    ...validateMedicoCadastroAddressStep(values),
    ...validateMedicoCadastroDocumentsStep(documents, values.formation),
  }
}

export function hasMedicoCadastroFormErrors(errors: MedicoCadastroFormErrors) {
  return Object.keys(errors).length > 0
}
