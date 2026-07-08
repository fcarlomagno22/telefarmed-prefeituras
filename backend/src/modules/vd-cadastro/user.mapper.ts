import { formatCpfDisplay } from '../admin-credenciais/formatters.js'
import { resolvePacienteFotoPublicUrl } from '../../lib/pacienteFoto.js'
import type { AdminMunicipalPatientDetailDto } from '../admin-pacientes/types.js'
import type { VdPacienteUserPublic } from './types.js'

function formatZipCode(value: string | undefined): string {
  const digits = (value ?? '').replace(/\D/g, '')
  if (digits.length !== 8) return (value ?? '').trim()
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export async function mapPatientDetailToVdUserPublic(
  detail: AdminMunicipalPatientDetailDto,
  credencialId: string,
): Promise<VdPacienteUserPublic> {
  const profile = detail.profile
  const cpfDigits = detail.cpf.replace(/\D/g, '')

  return {
    id: detail.id,
    credencialId,
    name: detail.name,
    cpf: cpfDigits.length === 11 ? formatCpfDisplay(cpfDigits) : detail.cpf,
    email: profile?.email?.trim() ?? '',
    phone: detail.phone?.trim() ?? '',
    entidadeContratanteId: detail.contractingEntityId,
    avatarUrl: await resolvePacienteFotoPublicUrl(detail.avatarUrl),
    address: {
      cep: formatZipCode(profile?.zipCode),
      logradouro: profile?.street?.trim() ?? '',
      numero: profile?.number?.trim() ?? '',
      bairro: profile?.neighborhood?.trim() || detail.bairro?.trim() || '',
      cidade: profile?.city?.trim() ?? '',
      uf: profile?.state?.trim().toUpperCase() ?? '',
      complemento: profile?.complement?.trim() || undefined,
    },
  }
}
