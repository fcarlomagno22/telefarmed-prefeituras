import { rh3GetScheduleAvailability } from '../../lib/rh3/index.js'
import { formatRh3ProfessionalName } from '../../lib/rh3/formatters.js'
import { UbtRh3Error } from './errors.js'

export async function resolveRh3ScheduledProfessionalName(input: {
  rh3EspecialidadId: number
  idTurno: number
  data: string
  professionalName?: string
}): Promise<{ nome: string; rh3ProfessionalId: number | null }> {
  const response = await rh3GetScheduleAvailability(input.rh3EspecialidadId, {
    date: input.data,
    language: 'PT',
  })

  const slot = response.data.available_appointments.find((item) => item.id === input.idTurno)
  const fromAvailability = formatRh3ProfessionalName(slot?.professional)
  if (fromAvailability) {
    return {
      nome: fromAvailability,
      rh3ProfessionalId: slot?.professional_id ?? null,
    }
  }

  const fallback = input.professionalName?.trim()
  if (fallback) {
    return { nome: fallback, rh3ProfessionalId: slot?.professional_id ?? null }
  }

  throw new UbtRh3Error(
    'Profissional terceirizado não encontrado para o horário selecionado.',
    'MT_PROFESSIONAL_NOT_FOUND',
    400,
  )
}
