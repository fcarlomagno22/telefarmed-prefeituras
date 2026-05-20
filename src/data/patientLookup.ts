import { cpfDigits } from '../utils/cpf'
import type { PatientRegistration } from './unitDashboardMock'

/** CPF de teste: paciente já cadastrada retornando para nova consulta. */
export const RETURNING_PATIENT_CPF_DIGITS = '35328834810'

const registeredPatientsByCpf: Record<string, PatientRegistration> = {
  [RETURNING_PATIENT_CPF_DIGITS]: {
    fullName: 'Ana Paula Oliveira',
    cpf: '353.288.348-10',
    birthDate: '1992-08-14',
    gender: 'feminino',
    phone: '(11) 98765-4321',
    email: 'ana.paula@email.com',
    guardianName: '',
    guardianCpf: '',
    contacts: [
      {
        id: 'contact-returning-1',
        name: 'Carlos Oliveira',
        phone: '(11) 91234-5678',
        relationship: 'conjuge',
      },
    ],
    zipCode: '01310-100',
    street: 'Av. Paulista',
    number: '1578',
    complement: 'Sala 42',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    photoDataUrl: 'https://randomuser.me/api/portraits/women/65.jpg',
  },
}

export type PatientLookupResult =
  | { status: 'found'; patient: PatientRegistration }
  | { status: 'not_found' }

export async function lookupPatientByCpf(cpf: string): Promise<PatientLookupResult> {
  await new Promise((resolve) => setTimeout(resolve, 900))

  const patient = registeredPatientsByCpf[cpfDigits(cpf)]
  if (patient) {
    return { status: 'found', patient: { ...patient, contacts: patient.contacts.map((c) => ({ ...c })) } }
  }

  return { status: 'not_found' }
}
