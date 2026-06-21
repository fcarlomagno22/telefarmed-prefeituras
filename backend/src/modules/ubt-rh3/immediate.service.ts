import { rh3CreateElegibilidad, rh3CreateInvitacion, rh3CreatePaciente } from '../../lib/rh3/index.js'
import { isRh3ImmediateMtSpecialtyName } from '../../lib/rh3/walkInSpecialty.js'
import type { DayAppointmentDto } from '../ubt-agenda/types.js'
import type { UbtScope } from '../ubt-pacientes/types.js'
import { UbtRh3Error } from './errors.js'
import { pickOrigemAtendimento, loadAuthorizedSpecialtyOrigemMap } from './origem.service.js'
import {
  mapPatientGenderToRh3,
  normalizeBirthDateForRh3,
  splitPatientFullName,
  todayIsoDateSaoPaulo,
} from './patient-mapper.js'
import { persistRh3ConsultaForUbt } from './persistConsulta.service.js'
import {
  loadLocalEspecialidadeNome,
  syncProfissionalMtFromUsuarioProfissional,
} from './profissionaisMt.service.js'
import { resolveMtImmediateDefaultProfissionalId } from './mtImmediateProfessional.js'

export type CreateRh3ImmediateConsultationInput = {
  pacienteId: string
  especialidadeId: string
  rh3EspecialidadId: number
  specialtyName: string
  paciente: {
    cpf: string
    fullName: string
    email: string
    phone: string
    birthDate: string
    gender: string
  }
}

export type CreateRh3ImmediateConsultationResult = {
  idInvitacion: number
  deeplinkPaciente: string
  rh3PacienteId: number
  origemAtendimento: 'mt'
  especialidadeId: string
  rh3EspecialidadId: number
  pacienteId: string
  specialtyName: string
  agendaConsultaId: string
  consultaId: string
  codigoAtendimento: string
  appointment: DayAppointmentDto
}

export async function createRh3ImmediateConsultationForUbt(
  scope: UbtScope,
  input: CreateRh3ImmediateConsultationInput,
): Promise<CreateRh3ImmediateConsultationResult> {
  if (!isRh3ImmediateMtSpecialtyName(input.specialtyName)) {
    throw new UbtRh3Error(
      'Esta especialidade não está configurada para atendimento imediato terceirizado.',
      'SPECIALTY_NOT_IMMEDIATE_MT',
      400,
    )
  }

  const origemMap = await loadAuthorizedSpecialtyOrigemMap(scope.entidadeContratanteId)
  const origem = pickOrigemAtendimento(origemMap, input.especialidadeId)
  if (origem !== 'mt') {
    throw new UbtRh3Error(
      'Esta especialidade não está configurada como atendimento terceirizado (MT).',
      'SPECIALTY_NOT_MT',
      400,
    )
  }

  const { nombre, apellido } = splitPatientFullName(input.paciente.fullName)
  const genero = mapPatientGenderToRh3(input.paciente.gender)
  const fechaNacimiento = normalizeBirthDateForRh3(input.paciente.birthDate)
  const cpf = input.paciente.cpf.replace(/\D/g, '')
  const telefone = input.paciente.phone.replace(/\D/g, '')
  const email = input.paciente.email.trim()
  const fechaAlta = todayIsoDateSaoPaulo()

  const pacienteResponse = await rh3CreatePaciente({
    nombre,
    apellido,
    genero,
    email,
    telefono: telefone,
    fecha_nacimiento: fechaNacimiento,
    valor_identificacion: cpf,
  })

  const rh3PacienteId = pacienteResponse.data.id_paciente

  await rh3CreateElegibilidad({
    afiliado: {
      nro_documento: cpf,
      credencial: cpf,
      apellido,
      fecha_alta: fechaAlta,
      fecha_nacimiento: fechaNacimiento,
      nro_documento_titular: cpf,
      sexo: genero,
      nombre,
      telefono_movil: telefone,
      email,
    },
  })

  const invitacionResponse = await rh3CreateInvitacion({
    valor_identificacion: cpf,
    id_especialidad: String(input.rh3EspecialidadId),
    nombre,
    apellido,
    email,
  })

  const deeplinkPaciente =
    invitacionResponse.data.url_acceso_paciente?.trim() ||
    invitacionResponse.data.url_email?.trim()

  if (!deeplinkPaciente) {
    throw new UbtRh3Error(
      'RH3 não retornou link de acesso do paciente para teleconsulta imediata.',
      'RH3_DEEPLINK_MISSING',
      502,
    )
  }

  const today = todayIsoDateSaoPaulo()
  const hora = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())

  const profissionalId = await resolveMtImmediateDefaultProfissionalId()
  const especialidadeNome = await loadLocalEspecialidadeNome(input.especialidadeId)
  const profissionalMtId = await syncProfissionalMtFromUsuarioProfissional(
    profissionalId,
    especialidadeNome,
  )

  const persisted = await persistRh3ConsultaForUbt(scope, {
    pacienteId: input.pacienteId,
    especialidadeId: input.especialidadeId,
    telefoneContato: input.paciente.phone,
    data: today,
    hora,
    scheduled: false,
    profissionalId,
    profissionalMtId,
    rh3: {
      idInvitacion: invitacionResponse.data.id_invitacion,
      deeplink: deeplinkPaciente,
    },
  })

  return {
    idInvitacion: invitacionResponse.data.id_invitacion,
    deeplinkPaciente,
    rh3PacienteId,
    origemAtendimento: 'mt',
    especialidadeId: input.especialidadeId,
    rh3EspecialidadId: input.rh3EspecialidadId,
    pacienteId: input.pacienteId,
    specialtyName: input.specialtyName,
    agendaConsultaId: persisted.agendaConsultaId,
    consultaId: persisted.consultaId,
    codigoAtendimento: persisted.codigoAtendimento,
    appointment: persisted.appointment,
  }
}
