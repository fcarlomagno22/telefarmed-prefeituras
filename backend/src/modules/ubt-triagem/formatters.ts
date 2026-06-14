import type { WaitingQueueEntryDto } from './types.js'

export function formatHoraDisplay(hora: unknown): string | undefined {
  if (hora == null || hora === '') return undefined
  const raw = String(hora)
  return raw.length >= 5 ? raw.slice(0, 5) : raw
}

export function formatFilaEntryFromView(
  row: Record<string, unknown>,
  consultaRow?: Record<string, unknown>,
): WaitingQueueEntryDto {
  return {
    id: String(row.id),
    pacienteId: String(row.paciente_id ?? consultaRow?.paciente_id ?? ''),
    appointmentId: String(row.agenda_consulta_id ?? consultaRow?.id ?? ''),
    patientName: String(row.paciente_nome ?? consultaRow?.paciente_nome ?? 'Paciente'),
    patientCpf: String(row.paciente_cpf ?? consultaRow?.paciente_cpf ?? ''),
    patientPhone: String(
      row.telefone_contato ?? row.paciente_telefone ?? consultaRow?.paciente_telefone ?? '',
    ),
    serviceType: String(row.especialidade_nome ?? consultaRow?.especialidade_nome ?? ''),
    specialtyId: String(row.especialidade_id ?? consultaRow?.especialidade_id ?? ''),
    scheduledTime: formatHoraDisplay(row.hora_agendada ?? consultaRow?.hora),
    origin: String(row.origem ?? consultaRow?.origem ?? 'agendado') as 'agendado' | 'espontaneo',
    arrivedAt: String(row.chegada_em ?? new Date().toISOString()),
    status: String(row.status ?? 'aguardando'),
  }
}
