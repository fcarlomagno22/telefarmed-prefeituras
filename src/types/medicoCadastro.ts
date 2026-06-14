import type { MedicoCadastroFormation } from '../config/medicoCadastroForm'

export type MedicoCadastroMedicalSpecialty = {
  id: string
  specialty: string
  rqe: string
}

export type MedicoCadastroFormValues = {
  fullName: string
  cpf: string
  birthDate: string
  formation: MedicoCadastroFormation | ''
  medicalSpecialties: MedicoCadastroMedicalSpecialty[]
  crm: string
  uf: string
  email: string
  phone: string
  zipCode: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  professionalDescription: string
}

export type MedicoCadastroDocumentUploads = Record<string, File | null>

export type MedicoCadastroFormErrors = Partial<
  Record<
    keyof MedicoCadastroFormValues | `document:${string}` | `medicalSpecialty:${string}`,
    string
  >
>
