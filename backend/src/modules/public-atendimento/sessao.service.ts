import { supabaseAdmin } from '../../db/supabase.js'
import { calcAgeFromBirthDate } from '../../lib/patientAge.js'
import { resolvePacienteFotoPublicUrl } from '../../lib/pacienteFoto.js'
import { createProfissionalFotoSignedUrl } from '../admin-profissionais/documentos.service.js'
import {
  buildIssuedDocuments,
  loadConsultaClinicaData,
  loadOperacionalRowByCodigo,
} from '../profissional-atendimentos/clinical-data.service.js'
import {
  formatDoctorCrm,
  formatPatientCity,
  maskCpfPartial,
} from '../profissional-atendimentos/formatters.js'
import {
  assertPublicConsultaReadable,
  loadPublicConsultaByCodigo,
} from './access.service.js'
import { PublicAtendimentoError } from './errors.js'
import { computePublicFilaStatus } from './fila.service.js'
import type {
  PublicAtendimentoSessaoDto,
  PublicConsultaDocumentoDto,
  PublicFilaStatusDto,
} from './types.js'

export type {
  PublicAtendimentoSessaoDto,
  PublicConsultaDocumentoDto,
  PublicFilaStatusDto,
} from './types.js'

async function loadConsultaFilaContext(consultaId: string): Promise<{
  unidadeUbtId: string
  filaEsperaId: string | null
}> {
  const { data, error } = await supabaseAdmin
    .from('consultas')
    .select('unidade_ubt_id, fila_espera_id')
    .eq('id', consultaId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new PublicAtendimentoError('Sessão de atendimento não encontrada.', 'NOT_FOUND', 404)
  }

  return {
    unidadeUbtId: String(data.unidade_ubt_id),
    filaEsperaId: data.fila_espera_id ? String(data.fila_espera_id) : null,
  }
}

function formatAppointmentDateLabel(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function formatAppointmentTimeLabel(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

async function loadOperacionalRow(codigoAtendimento: string) {
  const row = await loadOperacionalRowByCodigo(codigoAtendimento)
  if (!row) return null

  const filaContext = await loadConsultaFilaContext(String(row.id))
  return {
    ...row,
    unidade_ubt_id: filaContext.unidadeUbtId,
    fila_espera_id: filaContext.filaEsperaId,
  }
}

async function loadAvaliacaoEnviada(consultaId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('consulta_avaliacoes')
    .select('id')
    .eq('consulta_id', consultaId)
    .maybeSingle()

  if (error) throw error
  return Boolean(data)
}

async function loadProfissionalPhoto(profissionalId: string | null): Promise<string> {
  if (!profissionalId) return ''

  const { data, error } = await supabaseAdmin
    .from('usuarios_profissionais')
    .select('foto_storage_path')
    .eq('id', profissionalId)
    .maybeSingle()

  if (error) throw error
  const signedUrl = await createProfissionalFotoSignedUrl(data?.foto_storage_path)
  return signedUrl ?? ''
}

function mapIssuedDocumentsToPublic(
  docs: ReturnType<typeof buildIssuedDocuments>,
): PublicConsultaDocumentoDto[] {
  return docs.map((doc) => ({
    id: doc.id,
    title: doc.title,
    type: doc.kind,
    origin: 'profissional' as const,
    signedAtLabel: doc.signedAtLabel,
  }))
}

export async function getPublicAtendimentoSessao(
  codigoAtendimento: string,
): Promise<PublicAtendimentoSessaoDto> {
  const access = await loadPublicConsultaByCodigo(codigoAtendimento)
  assertPublicConsultaReadable(access)

  const row = await loadOperacionalRow(codigoAtendimento)
  if (!row) {
    throw new PublicAtendimentoError('Sessão de atendimento não encontrada.', 'NOT_FOUND', 404)
  }

  const consultaId = String(row.id)
  const consultaStatus = String(row.status)
  const startedAtIso = String(row.iniciada_em ?? row.criado_em ?? new Date().toISOString())

  const [clinical, avaliacaoEnviada, patientPhotoUrl, doctorPhotoUrl, fila] = await Promise.all([
    loadConsultaClinicaData([consultaId]),
    loadAvaliacaoEnviada(consultaId),
    resolvePacienteFotoPublicUrl(row.paciente_foto_url),
    loadProfissionalPhoto(row.profissional_id ? String(row.profissional_id) : null),
    computePublicFilaStatus({
      consultaStatus,
      unidadeUbtId: String(row.unidade_ubt_id),
      filaEsperaId: row.fila_espera_id ? String(row.fila_espera_id) : null,
    }),
  ])

  const anexos = clinical.anexosByConsulta.get(consultaId) ?? []
  const issuedDocuments = buildIssuedDocuments({
    anexosProfissional: anexos.filter((item) => item.origem === 'profissional'),
    signedUrls: clinical.signedUrlsByConsulta.get(consultaId) ?? new Map(),
  })

  const doctorName = String(row.profissional_nome ?? '').trim() || 'Profissional de plantão'
  const specialty = String(row.especialidade_nome ?? 'Teleconsulta')

  return {
    token: codigoAtendimento,
    consultaId,
    consultaStatus,
    patientName: String(row.paciente_nome ?? '—'),
    patientAge: calcAgeFromBirthDate(row.paciente_data_nascimento),
    patientCity: formatPatientCity(row.paciente_endereco),
    patientCpfMasked: maskCpfPartial(String(row.paciente_cpf ?? '')),
    patientPhotoUrl: patientPhotoUrl ?? '',
    specialty,
    unitName: String(row.unidade_nome || 'Teleatendimento'),
    doctorName,
    doctorSpecialty: specialty,
    doctorCrm: formatDoctorCrm(row),
    doctorPhotoUrl,
    appointmentDateLabel: formatAppointmentDateLabel(startedAtIso),
    appointmentTimeLabel: formatAppointmentTimeLabel(startedAtIso),
    startedAtIso,
    quickNotes: String(row.triagem_resumo ?? '').trim(),
    consultationDocuments: mapIssuedDocumentsToPublic(issuedDocuments),
    fila,
    readyForConsultation: fila.readyForConsultation,
    avaliacaoEnviada,
  }
}

export async function getPublicFilaStatus(codigoAtendimento: string): Promise<PublicFilaStatusDto> {
  const consulta = await loadPublicConsultaByCodigo(codigoAtendimento)
  assertPublicConsultaReadable(consulta)

  const { data, error } = await supabaseAdmin
    .from('consultas')
    .select('status, unidade_ubt_id, fila_espera_id')
    .eq('id', consulta.id)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new PublicAtendimentoError('Sessão de atendimento não encontrada.', 'NOT_FOUND', 404)
  }

  return computePublicFilaStatus({
    consultaStatus: String(data.status),
    unidadeUbtId: String(data.unidade_ubt_id),
    filaEsperaId: data.fila_espera_id ? String(data.fila_espera_id) : null,
  })
}

export async function registrarPacienteEntradaSalaAtendimento(
  codigoAtendimento: string,
): Promise<void> {
  const consulta = await loadPublicConsultaByCodigo(codigoAtendimento)
  assertPublicConsultaReadable(consulta)

  if (String(consulta.status) !== 'em_andamento') {
    throw new PublicAtendimentoError(
      'A teleconsulta ainda não foi iniciada pelo profissional.',
      'CONFLICT',
      409,
    )
  }

  const now = new Date().toISOString()
  const { error } = await supabaseAdmin
    .from('consultas')
    .update({ paciente_sala_atendimento_entrada_em: now, atualizado_em: now })
    .eq('id', consulta.id)
    .is('paciente_sala_atendimento_entrada_em', null)

  if (error) throw error
}
