export type Rh3Genero = 'M' | 'F' | 'O'

export type Rh3AuthResponse = {
  token: string
  exp: number
}

export type Rh3CreatePacienteInput = {
  nombre: string
  apellido: string
  genero: Rh3Genero
  email: string
  telefono: string
  fecha_nacimiento: string
  id_tipo_de_identificacion?: string
  valor_identificacion: string
  id_pais?: string
  tag_idioma?: string
  guest?: number
}

export type Rh3CreatePacienteResponse = {
  data: {
    id_paciente: number
    timestamp: string
  }
  signature?: string
}

export type Rh3ElegibilidadAfiliado = {
  nro_documento: string
  credencial: string
  apellido: string
  fecha_alta: string
  fecha_nacimiento: string
  nro_documento_titular: string
  sexo: Rh3Genero
  nombre: string
  plan?: string
  telefono_movil: string
  email: string
  empresa?: string
}

export type Rh3CreateElegibilidadInput = {
  afiliado: Rh3ElegibilidadAfiliado
}

export type Rh3CreateInvitacionInput = {
  id_tipo_de_identificacion?: string
  valor_identificacion: string
  id_especialidad: string
  id_motivo_consulta?: string
  nombre: string
  apellido: string
  email: string
}

export type Rh3InvitacionData = {
  id_invitacion: number
  url_sms?: string | null
  url_email: string
  url_acceso_paciente?: string | null
  tiempo_demora?: number | null
  timestamp: string
}

export type Rh3CreateInvitacionResponse = {
  data: Rh3InvitacionData
  signature?: string
}

export type Rh3Especialidad = {
  id_especialidad: number
  especialidad: string
  id_titulo?: number
  cbos?: string
}

export type Rh3ListEspecialidadesResponse = {
  data: {
    especialidades: Rh3Especialidad[]
    timestamp: string
  }
  signature?: string
}

export type Rh3ScheduleAvailabilityFilter = {
  date_from?: string
  date?: string
  language?: string
  day_of_week?: string
  start_hour?: string
  finish_hour?: string
  id_professional?: number
  show_picture?: boolean
}

export type Rh3AvailableAppointment = {
  id: number
  date: string
  hour: string
  length: number
  clinic?: number
  professional?: string
  professional_id?: number
  path_logo?: string
  id_prestador?: number
  cost?: string
  specialty_id?: number
  specialty?: string
  type?: string
  ations?: number
  ranking?: number | null
  time_zone?: string | null
  consultation_value?: string
}

export type Rh3ScheduleAvailabilityResponse = {
  data: {
    available_appointments: Rh3AvailableAppointment[]
    timestamp: string
  }
  signature?: string
}

export type Rh3SchedulePacienteInput = {
  id_tipo_de_identificacion?: number
  apellido: string
  genero: Rh3Genero
  fecha_de_nacimiento: string
  valor_identificacion: string
  telefono: string
  nombre: string
  id_pais?: string
  email: string
}

export type Rh3ScheduleAppointmentInput = {
  id_motivo_consulta?: string
  paciente: Rh3SchedulePacienteInput
  id_especialidad: string
  id_turno: number
}

export type Rh3ScheduleAppointmentResponse = {
  data: {
    id_turno: number
    id_invitacion: number
    deeplink_profesional?: string
    deeplink_paciente?: string
    timestamp: string
  }
  signature?: string
}

export type Rh3TurnoEstado = 'D' | 'A' | 'S' | 'C' | 'L' | 'F' | 'V'

export type Rh3TurnoDetails = {
  id_turno: number
  id_profesional?: number
  apellido_profesional?: string
  nombre_profesional?: string
  apellido_paciente?: string
  nombre_paciente?: string
  id_paciente?: number
  fecha?: string
  hora?: string
  duracion?: number
  id_especialidad?: number
  especialidad?: string
  estado?: Rh3TurnoEstado
  motivo_cancelacion?: string | null
  deeplink_profesional?: string
  deeplink_paciente?: string
  url_acceso_paciente?: string
  id_servicio?: number | null
  id_consulta?: number | null
  valor_copago?: string | null
  presencial?: boolean
  virtual?: boolean
  id_lugar?: number | null
  provincia?: string | null
  localidad?: string | null
  timestamp?: string
}

export type Rh3TurnoDetailsResponse = {
  data: Rh3TurnoDetails
  signature?: string
}

export type Rh3ProviderErrorBody = {
  mensaje?: string
  codigo?: string
}
