import type { MedicoCadastroFormation } from '../config/medicoCadastroForm'

export type MedicoCadastroFormValues = {
  fullName: string
  cpf: string
  birthDate: string
  formation: MedicoCadastroFormation | ''
  specialty: string
  crm: string
  uf: string
  rqe: string
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
  Record<keyof MedicoCadastroFormValues | `document:${string}`, string>
>
