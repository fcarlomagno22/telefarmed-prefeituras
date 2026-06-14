import { supabaseAdmin } from '../../db/supabase.js'
import { resolvePacienteFotoPublicUrl } from '../../lib/pacienteFoto.js'
import {
  loadConsultaClinicaData,
  mapOperacionalRowsToRecords,
} from '../profissional-atendimentos/clinical-data.service.js'
import {
  formatDateTimeLabel,
  formatDoctorCrm,
  mapDbStatusToUiStatus,
} from '../profissional-atendimentos/formatters.js'
import { listConsultaMensagensApi } from '../profissional-atendimentos/mensagens-query.service.js'
import type { ConsultaOperacionalFullRow } from '../profissional-atendimentos/types.js'
import { PacientesError } from './errors.js'
import {
  mapListagemToPatient,
  readEnderecoField,
  sexoToGenderLabel,
  type ListagemRow,
} from './formatters.js'
import type {
  AdminPatientProntuarioDto,
  AdminPatientProntuarioEntryDto,
  AdminPatientProntuarioExamRequestDto,
  AdminPatientProntuarioPrescriptionDto,
} from './types.js'

const OPERACIONAL_SELECT = `
  id,
  codigo_atendimento,
  paciente_id,
  profissional_id,
  especialidade_id,
  status,
  triagem_resumo,
  notas_clinicas,
  iniciada_em,
  finalizada_em,
  duracao_minutos,
  criado_em,
  paciente_nome,
  paciente_cpf,
  paciente_sexo,
  paciente_data_nascimento,
  paciente_endereco,
  paciente_foto_url,
  profissional_nome,
  profissional_conselho_sigla,
  profissional_conselho_numero,
  profissional_conselho_uf,
  especialidade_nome,
  unidade_nome
`

async function fetchListagemRow(id: string): Promise<ListagemRow> {
  const { data, error } = await supabaseAdmin
    .from('vw_admin_pacientes_listagem')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new PacientesError('Paciente não encontrado.', 'NOT_FOUND', 404)
  return data as ListagemRow
}

async function loadPatientConsultations(
  pacienteId: string,
): Promise<ConsultaOperacionalFullRow[]> {
  const { data, error } = await supabaseAdmin
    .from('vw_consultas_operacional')
    .select(OPERACIONAL_SELECT)
    .eq('paciente_id', pacienteId)
    .in('status', ['concluida', 'interrompida'])
    .order('finalizada_em', { ascending: false, nullsFirst: false })

  if (error) {
    if (error.code === 'PGRST205') return []
    throw error
  }

  return (data ?? []) as ConsultaOperacionalFullRow[]
}

function mapPrescriptionRows(
  rows: Array<{
    id: string
    medicamento_nome: string
    dosagem?: string | null
    via?: string | null
    frequencia?: string | null
    duracao?: string | null
    observacoes?: string | null
  }>,
): AdminPatientProntuarioPrescriptionDto[] {
  return rows.map((row) => ({
    id: String(row.id),
    medicationName: String(row.medicamento_nome ?? '—'),
    dosage: row.dosagem?.trim() ?? '',
    route: row.via?.trim() ?? '',
    frequency: row.frequencia?.trim() ?? '',
    duration: row.duracao?.trim() ?? '',
    notes: row.observacoes?.trim() ?? '',
  }))
}

function mapExamRequestRows(
  rows: Array<{
    id: string
    exame_id: string
    observacoes?: string | null
  }>,
  examNames: Map<string, string>,
): AdminPatientProntuarioExamRequestDto[] {
  return rows.map((row) => ({
    id: String(row.id),
    examName: examNames.get(String(row.exame_id)) ?? 'Exame',
    notes: row.observacoes?.trim() ?? '',
  }))
}

export async function getPacienteProntuario(pacienteId: string): Promise<AdminPatientProntuarioDto> {
  const row = await fetchListagemRow(pacienteId)
  const operacionalRows = await loadPatientConsultations(pacienteId)
  const [records, clinical] = await Promise.all([
    mapOperacionalRowsToRecords(operacionalRows),
    loadConsultaClinicaData(operacionalRows.map((item) => String(item.id))),
  ])

  const entries: AdminPatientProntuarioEntryDto[] = await Promise.all(
    operacionalRows.map(async (opRow, index) => {
      const consultaId = String(opRow.id)
      const record = records[index]
      const reference = opRow.finalizada_em ?? opRow.iniciada_em ?? opRow.criado_em
      const messages = await listConsultaMensagensApi(consultaId)

      return {
        id: consultaId,
        attendanceId: String(opRow.codigo_atendimento),
        dateTimeIso: reference,
        dateTimeLabel: formatDateTimeLabel(reference),
        specialty: String(opRow.especialidade_nome ?? '—'),
        professionalName: opRow.profissional_nome?.trim() || 'Profissional',
        professionalCrm: formatDoctorCrm(opRow),
        ubtName: String(opRow.unidade_nome ?? '—'),
        status: mapDbStatusToUiStatus(String(opRow.status)),
        durationMinutes: record.durationMinutes,
        triageSummary: opRow.triagem_resumo?.trim() || undefined,
        clinicalNotes: opRow.notas_clinicas?.trim() ?? '',
        prescriptions: mapPrescriptionRows(clinical.prescricoesByConsulta.get(consultaId) ?? []),
        examRequests: mapExamRequestRows(
          clinical.examesByConsulta.get(consultaId) ?? [],
          clinical.examNames,
        ),
        issuedDocuments: record.issuedDocuments,
        patientUploads: record.patientUploads,
        messages,
      }
    }),
  )

  const patient = mapListagemToPatient(row)
  let photoUrl = patient.avatarUrl ?? ''
  if (photoUrl) {
    photoUrl = (await resolvePacienteFotoPublicUrl(photoUrl)) ?? photoUrl
  }

  return {
    patient: {
      id: patient.id,
      name: patient.name,
      photoUrl,
      birthDate: patient.birthDate,
      age: patient.age,
      genderLabel: sexoToGenderLabel(row.sexo),
      cpf: patient.cpf,
      municipalRecordId: patient.municipalRecordId,
      municipality: patient.municipality,
      contractingEntityRazaoSocial: patient.contractingEntityRazaoSocial,
      registrationUnit: patient.firstAttendanceUnit,
      registeredAt: patient.registeredAt,
      city: readEnderecoField(row.endereco, 'cidade') || row.municipio,
      neighborhood: readEnderecoField(row.endereco, 'bairro') || '—',
    },
    entries,
  }
}
