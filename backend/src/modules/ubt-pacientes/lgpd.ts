import type { FastifyRequest } from 'fastify'
import { isUbtLgpdUnlockActive } from '../ubt-auth/lgpd.service.js'
import {
  maskCpfForLgpd,
  maskEmailForLgpd,
  maskPhoneForLgpd,
} from '../../lib/lgpdMask.js'
import type { UbtPacienteDto } from './types.js'
import type { UbtPatientRegistrationPayload } from './types.js'

export async function isUbtLgpdUnlocked(request: FastifyRequest): Promise<boolean> {
  const user = request.ubtUser
  if (!user) return false

  const lgpdUnlockToken = String(request.headers['x-ubt-lgpd-token'] ?? '').trim()
  if (!lgpdUnlockToken) return false

  return isUbtLgpdUnlockActive(user.id, lgpdUnlockToken)
}

export function maskUbtPacienteDto(patient: UbtPacienteDto): UbtPacienteDto {
  return {
    ...patient,
    cpf: maskCpfForLgpd(patient.cpf),
    phone: patient.phone ? maskPhoneForLgpd(patient.phone) : patient.phone,
  }
}

export function maskUbtPatientRegistrationDetail(
  detail: UbtPatientRegistrationPayload & { id: string },
): UbtPatientRegistrationPayload & { id: string } {
  return {
    ...detail,
    cpf: maskCpfForLgpd(detail.cpf),
    phone: detail.phone ? maskPhoneForLgpd(detail.phone) : detail.phone,
    email: detail.email ? maskEmailForLgpd(detail.email) : detail.email,
    // Responsável: mantém dados para fluxos operacionais de cadastro/triagem no terminal.
    zipCode: detail.zipCode ? '*****-***' : detail.zipCode,
    street: detail.street ? '••••••••' : detail.street,
    number: detail.number ? '•••' : detail.number,
    complement: detail.complement ? '•••' : detail.complement,
    contacts: (detail.contacts ?? []).map((contact) => ({
      ...contact,
      phone: contact.phone ? maskPhoneForLgpd(contact.phone) : contact.phone,
    })),
  }
}
