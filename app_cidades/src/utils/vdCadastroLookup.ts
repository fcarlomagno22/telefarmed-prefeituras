import type { VdCadastroLookupPatient } from '../types/vdApi'
import type { RegistrationAddress, RegistrationProfile } from '../types/auth'

export function mapLookupPatientToProfile(patient: VdCadastroLookupPatient): RegistrationProfile {
  return {
    name: patient.fullName.trim(),
    cpf: patient.cpf.trim(),
    email: patient.email.trim(),
    phone: patient.phone.trim(),
  }
}

export function mapLookupPatientToAddress(
  patient: VdCadastroLookupPatient,
): Partial<RegistrationAddress> {
  return {
    cep: patient.address.cep.trim(),
    street: patient.address.logradouro.trim(),
    number: patient.address.numero.trim(),
    neighborhood: patient.address.bairro.trim(),
    city: patient.address.cidade.trim(),
    state: patient.address.uf.trim(),
    complement: patient.address.complemento?.trim() ?? '',
  }
}
