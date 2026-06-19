import { supabaseAdmin } from '../../db/supabase.js'
import { calcAgeFromBirthDate } from '../../lib/patientAge.js'
import {
  buildIssuedDocuments,
  buildPatientUploads,
  loadConsultaClinicaData,
  loadOperacionalRowByCodigo,
  loadProfissionalPhotoUrl,
} from './clinical-data.service.js'
import { ProfissionalAtendimentosError } from './errors.js'
import {
  formatDoctorCrm,
  formatPatientAddress,
  formatPatientCity,
  mapHistoricoProntuario,
  mapSexoToGender,
  maskCpfPartial,
} from './formatters.js'
import { listConsultaMensagensApi } from './mensagens-query.service.js'
import {
  assertConsultaReadableByProfissional,
  loadConsultaByCodigo,
} from './ownership.js'
import type { HistoricoProntuarioRow } from './types.js'
import type { ProfissionalConsultaSessaoApi } from './schemas.js'

export async function getProfissionalConsultaSessao(
  profissionalId: string,
  codigoAtendimento: string,
): Promise<ProfissionalConsultaSessaoApi> {
  const access = await loadConsultaByCodigo(codigoAtendimento)
  await assertConsultaReadableByProfissional(profissionalId, access)

  const row = await loadOperacionalRowByCodigo(codigoAtendimento)
  if (!row) {
    throw new ProfissionalAtendimentosError('Consulta não encontrada.', 'NOT_FOUND', 404)
  }

  const consultaId = String(row.id)
  const [clinical, mensagens, historico, doctorPhotoUrl] = await Promise.all([
    loadConsultaClinicaData([consultaId]),
    listConsultaMensagensApi(consultaId),
    loadHistoricoProntuario(String(row.paciente_id), consultaId),
    loadProfissionalPhotoUrl(profissionalId),
  ])

  const anexos = clinical.anexosByConsulta.get(consultaId) ?? []
  const anexosProfissional = anexos.filter((item) => item.origem === 'profissional')
  const anexosPaciente = anexos.filter((item) => item.origem === 'paciente')

  const issuedDocuments = buildIssuedDocuments({
    anexosProfissional,
    signedUrls: clinical.signedUrlsByConsulta.get(consultaId) ?? new Map(),
  })
  const patientUploads = await buildPatientUploads(anexosPaciente)

  const birthIso = row.paciente_data_nascimento
    ? String(row.paciente_data_nascimento).slice(0, 10)
    : ''

  return {
    consultaId,
    codigoAtendimento: String(row.codigo_atendimento),
    status: String(row.status),
    patientName: String(row.paciente_nome ?? '—'),
    patientBirthDateIso: birthIso,
    patientAddress: formatPatientAddress(row.paciente_endereco),
    patientCity: formatPatientCity(row.paciente_endereco),
    patientCpfMasked: maskCpfPartial(String(row.paciente_cpf ?? '')),
    patientPhotoUrl: row.paciente_foto_url?.trim() || '',
    patientAge: calcAgeFromBirthDate(row.paciente_data_nascimento),
    patientGender: mapSexoToGender(String(row.paciente_sexo ?? '')),
    specialty: String(row.especialidade_nome ?? '—'),
    unitName: String(row.unidade_nome || 'Teleatendimento'),
    doctorName: row.profissional_nome?.trim() || 'Profissional',
    doctorSpecialty: String(row.especialidade_nome ?? '—'),
    doctorCrm: formatDoctorCrm(row),
    doctorPhotoUrl,
    startedAtIso: row.iniciada_em ?? row.criado_em,
    triageSummary: row.triagem_resumo?.trim() || '',
    notasClinicas: row.notas_clinicas?.trim() || '',
    historicoProntuario: mapHistoricoProntuario(historico),
    mensagens,
    issuedDocuments,
    patientUploads,
  }
}

export async function loadHistoricoProntuario(
  pacienteId: string,
  currentConsultaId: string,
): Promise<HistoricoProntuarioRow[]> {
  const { data, error } = await supabaseAdmin
    .from('vw_consultas_operacional')
    .select('id, finalizada_em, notas_clinicas, profissional_nome, especialidade_nome')
    .eq('paciente_id', pacienteId)
    .eq('status', 'concluida')
    .neq('id', currentConsultaId)
    .not('notas_clinicas', 'is', null)
    .neq('notas_clinicas', '')
    .order('finalizada_em', { ascending: false })
    .limit(20)

  if (error) throw error
  return (data ?? []) as HistoricoProntuarioRow[]
}

export async function iniciarProfissionalConsultaPorCodigo(
  profissionalId: string,
  codigoAtendimento: string,
): Promise<ProfissionalConsultaSessaoApi> {
  const access = await loadConsultaByCodigo(codigoAtendimento)
  await assertConsultaReadableByProfissional(profissionalId, access)

  if (access.status === 'aguardando_medico') {
    const now = new Date().toISOString()
    const { data: consultaRow, error: loadError } = await supabaseAdmin
      .from('consultas')
      .select('fila_espera_id, agenda_consulta_id')
      .eq('id', access.id)
      .maybeSingle()

    if (loadError) throw loadError

    const { error } = await supabaseAdmin
      .from('consultas')
      .update({
        profissional_id: profissionalId,
        status: 'em_andamento',
        iniciada_em: now,
      })
      .eq('id', access.id)

    if (error) throw error

    if (consultaRow?.agenda_consulta_id) {
      await supabaseAdmin
        .from('agenda_consultas')
        .update({ status: 'em_atendimento', profissional_id: profissionalId })
        .eq('id', consultaRow.agenda_consulta_id)

      await supabaseAdmin
        .from('fila_espera')
        .update({ status: 'em_atendimento', atendimento_inicio_em: now })
        .eq('agenda_consulta_id', consultaRow.agenda_consulta_id)
        .in('status', ['aguardando', 'chamado', 'em_atendimento'])
    } else if (consultaRow?.fila_espera_id) {
      await supabaseAdmin
        .from('fila_espera')
        .update({ status: 'em_atendimento', atendimento_inicio_em: now })
        .eq('id', consultaRow.fila_espera_id)
        .in('status', ['aguardando', 'chamado', 'em_atendimento'])
    }
  }

  return getProfissionalConsultaSessao(profissionalId, codigoAtendimento)
}
