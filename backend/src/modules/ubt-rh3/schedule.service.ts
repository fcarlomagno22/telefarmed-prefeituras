import {
  rh3CreateElegibilidad,
  rh3CreatePaciente,
  rh3ScheduleAppointment,
} from '../../lib/rh3/index.js'
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
import { loadLocalEspecialidadeNome, upsertProfissionalMt } from './profissionaisMt.service.js'
import { resolveRh3ScheduledProfessionalName } from './scheduleProfessional.service.js'

export type ScheduleRh3AppointmentInput = {
  pacienteId: string
  especialidadeId: string
  rh3EspecialidadId: number
  idTurno: number
  data: string
  hora: string
  professionalName?: string
  specialtyName?: string
  paciente: {
    cpf: string
    fullName: string
    email: string
    phone: string
    birthDate: string
    gender: string
  }
}

export type ScheduleRh3AppointmentResult = {
  idTurno: number
  idInvitacion: number
  deeplinkPaciente?: string
  deeplinkProfesional?: string
  rh3PacienteId: number
  origemAtendimento: 'mt'
  especialidadeId: string
  rh3EspecialidadId: number
  data: string
  hora: string
  pacienteId: string
  agendaConsultaId: string
  consultaId: string
  codigoAtendimento: string
  appointment: DayAppointmentDto
}

export async function scheduleRh3AppointmentForUbt(
  scope: UbtScope,
  input: ScheduleRh3AppointmentInput,
): Promise<ScheduleRh3AppointmentResult> {
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

  const professionalName = await resolveRh3ScheduledProfessionalName({
    rh3EspecialidadId: input.rh3EspecialidadId,
    idTurno: input.idTurno,
    data: input.data,
    professionalName: input.professionalName,
  })
  const especialidadeNome =
    input.specialtyName?.trim() || (await loadLocalEspecialidadeNome(input.especialidadeId))
  const profissionalMtId = await upsertProfissionalMt({
    nome: professionalName.nome,
    especialidade: especialidadeNome,
    rh3ProfessionalId: professionalName.rh3ProfessionalId,
    formacao: 'medicina',
  })

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

  const appointmentResponse = await rh3ScheduleAppointment({
    id_especialidad: String(input.rh3EspecialidadId),
    id_turno: input.idTurno,
    paciente: {
      nombre,
      apellido,
      genero,
      fecha_de_nacimiento: fechaNacimiento,
      valor_identificacion: cpf,
      telefono: telefone,
      email,
    },
  })

  const persisted = await persistRh3ConsultaForUbt(scope, {
    pacienteId: input.pacienteId,
    especialidadeId: input.especialidadeId,
    telefoneContato: input.paciente.phone,
    data: input.data,
    hora: input.hora,
    scheduled: true,
    profissionalMtId,
    rh3: {
      idInvitacion: appointmentResponse.data.id_invitacion,
      idTurno: appointmentResponse.data.id_turno,
      deeplink: appointmentResponse.data.deeplink_paciente,
    },
  })

  return {
    idTurno: appointmentResponse.data.id_turno,
    idInvitacion: appointmentResponse.data.id_invitacion,
    deeplinkPaciente: appointmentResponse.data.deeplink_paciente,
    deeplinkProfesional: appointmentResponse.data.deeplink_profesional,
    rh3PacienteId,
    origemAtendimento: 'mt',
    especialidadeId: input.especialidadeId,
    rh3EspecialidadId: input.rh3EspecialidadId,
    data: input.data,
    hora: input.hora,
    pacienteId: input.pacienteId,
    agendaConsultaId: persisted.agendaConsultaId,
    consultaId: persisted.consultaId,
    codigoAtendimento: persisted.codigoAtendimento,
    appointment: persisted.appointment,
  }
}
