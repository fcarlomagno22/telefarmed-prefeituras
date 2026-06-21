import { supabaseAdmin } from '../../db/supabase.js'
import {
  buildBpaPendenciasRelatorio,
  buildBpaTeleconsultaExport,
} from '../../lib/faturamento/bpa/buildBpaTeleconsultaExport.js'
import { TELECONSULTA_ESPECIALIZADA_PROCEDIMENTO } from '../../lib/faturamento/bpa/constants.js'
import { resolveProfissionalExecutanteSus } from '../../lib/faturamento/profissionalExecutante.js'
import { resolveMunicipioFromEndereco } from '../../lib/municipiosIbge.js'
import { resolveInstitutionConfig } from '../../lib/faturamento/bpa/validateTeleconsulta.js'
import {
  buildComplementRecordId,
  buildLoteIdForRecord,
  buildPrincipalRecordId,
  competenciaFromDate,
} from '../../lib/faturamento/pendenciaCatalog.js'
import { PrefeituraFaturamentoError } from './errors.js'
import { revalidarCompetenciaPrefeituraFaturamento } from './pendencias.service.js'
import type {
  FechamentoRecordDto,
  FechamentoSummaryDto,
  LoteItemDto,
} from './types.js'

function formatCompetenciaLabel(competencia: string): string {
  const [year, month] = competencia.split('-')
  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ]
  const idx = Number(month) - 1
  return `${months[idx] ?? month}/${year}`
}

function mapFechamentoRow(row: Record<string, unknown>): FechamentoRecordDto {
  return {
    id: String(row.id),
    competencia: String(row.competencia),
    tipo: row.tipo as 'principal' | 'complementar',
    complementoSeq: row.complemento_seq != null ? Number(row.complemento_seq) : null,
    status: String(row.status),
    closedAt: row.closed_at ? String(row.closed_at) : null,
    closedBy: row.closed_by ? String(row.closed_by) : null,
    fechamentoId: row.fechamento_id ? String(row.fechamento_id) : null,
    loteId: row.lote_id ? String(row.lote_id) : null,
    exportedAt: row.exported_at ? String(row.exported_at) : null,
    lastRevalidationAt: row.last_revalidation_at ? String(row.last_revalidation_at) : null,
    consultasNoLote: row.consultas_no_lote != null ? Number(row.consultas_no_lote) : null,
    bloqueantesRegistrados:
      row.bloqueantes_registrados != null ? Number(row.bloqueantes_registrados) : null,
  }
}

function isClosed(record: FechamentoRecordDto): boolean {
  return record.status === 'fechado' || record.status === 'exportado'
}

async function ensurePrincipalFechamento(entidadeId: string, competencia: string) {
  const { data: existing } = await supabaseAdmin
    .from('faturamento_fechamentos')
    .select('id')
    .eq('entidade_contratante_id', entidadeId)
    .eq('competencia', competencia)
    .eq('tipo', 'principal')
    .maybeSingle()

  if (existing) return String(existing.id)

  const id = buildPrincipalRecordId(entidadeId, competencia)
  const { error } = await supabaseAdmin.from('faturamento_fechamentos').insert({
    id,
    entidade_contratante_id: entidadeId,
    competencia,
    tipo: 'principal',
    complemento_seq: null,
    status: 'em_preparacao',
  })

  if (error) throw error
  return id
}

async function loadFechamentoRecords(entidadeId: string, competencia?: string) {
  let query = supabaseAdmin
    .from('faturamento_fechamentos')
    .select('*')
    .eq('entidade_contratante_id', entidadeId)
    .order('competencia', { ascending: false })

  if (competencia) {
    query = query.eq('competencia', competencia)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((row) => mapFechamentoRow(row as Record<string, unknown>))
}

async function loadRegistrosForCompetencia(entidadeId: string, competencia: string) {
  const [year, month] = competencia.split('-').map(Number)
  const start = new Date(Date.UTC(year, month - 1, 1)).toISOString()
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)).toISOString()

  const { data, error } = await supabaseAdmin
    .from('consultas_registro_sus')
    .select(
      `
      id,
      consulta_id,
      paciente_nome,
      paciente_cpf,
      paciente_cns,
      profissional_nome,
      profissional_conselho,
      profissional_cbo_codigo,
      profissional_cbo_descricao,
      procedimento_codigo,
      procedimento_nome,
      unidade_cnes,
      realizado_em,
      faturavel,
      pendencias,
      consulta:consultas!inner (
        codigo_atendimento,
        status,
        iniciada_em,
        finalizada_em,
        unidade_ubt_id,
        especialidade:config_especialidades ( nome ),
        unidade:unidades_ubt ( id, nome, cnes ),
        paciente:pacientes!inner ( endereco )
      )
    `,
    )
    .eq('entidade_contratante_id', entidadeId)
    .gte('realizado_em', start)
    .lte('realizado_em', end)

  if (error) throw error
  return data ?? []
}

async function loadClosedConsultaIds(entidadeId: string, competencia: string): Promise<Set<string>> {
  const records = await loadFechamentoRecords(entidadeId, competencia)
  const closedIds = records.filter(isClosed).map((r) => r.id)
  if (closedIds.length === 0) return new Set()

  const { data, error } = await supabaseAdmin
    .from('faturamento_fechamento_consultas')
    .select('registro_sus_id')
    .in('fechamento_record_id', closedIds)
    .eq('excluded', false)

  if (error) throw error
  return new Set((data ?? []).map((row) => String(row.registro_sus_id)))
}

async function loadExclusions(fechamentoRecordId: string): Promise<Map<string, string>> {
  const { data, error } = await supabaseAdmin
    .from('faturamento_lote_exclusoes')
    .select('registro_sus_id, exclude_reason')
    .eq('fechamento_record_id', fechamentoRecordId)

  if (error) throw error
  return new Map((data ?? []).map((row) => [String(row.registro_sus_id), String(row.exclude_reason)]))
}

function mapRegistroToLoteItem(
  row: Record<string, unknown>,
  competencia: string,
  options: {
    fechamentoRecordId?: string | null
    excluded?: boolean
    excludeReason?: string | null
    clinicalCid?: string | null
  } = {},
): LoteItemDto {
  const consulta = row.consulta as Record<string, unknown>
  const unidade = consulta?.unidade as Record<string, unknown>
  const especialidade = consulta?.especialidade as Record<string, unknown>
  const pacienteRaw = consulta?.paciente
  const paciente = (Array.isArray(pacienteRaw) ? pacienteRaw[0] : pacienteRaw) as
    | Record<string, unknown>
    | undefined
  const endereco = (paciente?.endereco as Record<string, unknown>) ?? {}
  const municipio = resolveMunicipioFromEndereco(endereco)
  const pendencias = Array.isArray(row.pendencias) ? row.pendencias.map(String) : []
  const professionalCbo = row.profissional_cbo_codigo ? String(row.profissional_cbo_codigo) : null
  const professionalCboDescricao = row.profissional_cbo_descricao
    ? String(row.profissional_cbo_descricao)
    : null

  return {
    id: String(row.id),
    competencia,
    consultaId: String(consulta?.codigo_atendimento ?? row.consulta_id),
    consultaDate: String(row.realizado_em),
    patientName: String(row.paciente_nome),
    patientCpf: row.paciente_cpf ? String(row.paciente_cpf) : null,
    patientCns: row.paciente_cns ? String(row.paciente_cns) : null,
    patientMunicipality: municipio.municipio,
    patientMunicipalityIbge: municipio.ibge,
    professionalName: String(row.profissional_nome),
    professionalConselho: row.profissional_conselho ? String(row.profissional_conselho) : null,
    professionalCbo,
    professionalCboLabel: professionalCbo
      ? `${professionalCbo}${professionalCboDescricao ? ` — ${professionalCboDescricao}` : ''}`
      : null,
    procedureCompatibleWithCbo:
      Boolean(professionalCbo && row.procedimento_codigo) &&
      !pendencias.includes('cbo_incompativel_procedimento'),
    specialty: String(especialidade?.nome ?? '—'),
    unitId: String(unidade?.id ?? consulta?.unidade_ubt_id ?? ''),
    unitName: String(unidade?.nome ?? '—'),
    cnes: String(row.unidade_cnes ?? unidade?.cnes ?? ''),
    procedureCode: String(row.procedimento_codigo ?? ''),
    procedureName: String(row.procedimento_nome ?? ''),
    clinicalCid: options.clinicalCid ?? null,
    consultaStartedAt: consulta?.iniciada_em ? String(consulta.iniciada_em) : null,
    consultaEndedAt: consulta?.finalizada_em ? String(consulta.finalizada_em) : null,
    consultaEncerrada: String(consulta?.status ?? '') === 'concluida',
    faturavel: Boolean(row.faturavel),
    excluded: options.excluded ?? false,
    excludeReason: options.excludeReason ?? null,
    fechamentoRecordId: options.fechamentoRecordId ?? null,
  }
}

async function buildLoteItems(
  entidadeId: string,
  record: FechamentoRecordDto,
  principal: FechamentoRecordDto | undefined,
): Promise<LoteItemDto[]> {
  if (isClosed(record)) {
    const { data, error } = await supabaseAdmin
      .from('faturamento_fechamento_consultas')
      .select(
        `
        registro_sus_id,
        excluded,
        exclude_reason,
        fechamento_record_id,
        registro:consultas_registro_sus (
          id,
          consulta_id,
          paciente_nome,
          paciente_cpf,
          paciente_cns,
          profissional_nome,
          profissional_conselho,
          profissional_cbo_codigo,
          profissional_cbo_descricao,
          procedimento_codigo,
          procedimento_nome,
          unidade_cnes,
          realizado_em,
          faturavel,
          pendencias,
          consulta:consultas (
            codigo_atendimento,
            status,
            iniciada_em,
            finalizada_em,
            unidade_ubt_id,
            especialidade:config_especialidades ( nome ),
            unidade:unidades_ubt ( id, nome, cnes ),
            paciente:pacientes ( endereco )
          )
        )
      `,
      )
      .eq('fechamento_record_id', record.id)

    if (error) throw error

    return (data ?? []).map((row) => {
      const registroRaw = row.registro
      const registro = (Array.isArray(registroRaw) ? registroRaw[0] : registroRaw) as Record<
        string,
        unknown
      >
      return mapRegistroToLoteItem(registro, record.competencia, {
        fechamentoRecordId: record.id,
        excluded: Boolean(row.excluded),
        excludeReason: row.exclude_reason ? String(row.exclude_reason) : null,
      })
    })
  }

  const registros = await loadRegistrosForCompetencia(entidadeId, record.competencia)
  const closedRegistroIds = await loadClosedConsultaIds(entidadeId, record.competencia)
  const exclusions = await loadExclusions(record.id)

  const faturaveis = registros.filter(
    (row) => row.faturavel && !closedRegistroIds.has(String(row.id)),
  )

  if (record.tipo === 'complementar' && principal?.closedAt) {
    const closedAt = new Date(principal.closedAt).getTime()
    return faturaveis
      .filter((row) => new Date(String(row.realizado_em)).getTime() > closedAt)
      .map((row) =>
        mapRegistroToLoteItem(row as Record<string, unknown>, record.competencia, {
          excluded: exclusions.has(String(row.id)),
          excludeReason: exclusions.get(String(row.id)) ?? null,
        }),
      )
  }

  if (record.tipo === 'principal' && principal?.closedAt) {
    const closedAt = new Date(principal.closedAt).getTime()
    return faturaveis
      .filter((row) => new Date(String(row.realizado_em)).getTime() <= closedAt)
      .map((row) =>
        mapRegistroToLoteItem(row as Record<string, unknown>, record.competencia, {
          excluded: exclusions.has(String(row.id)),
          excludeReason: exclusions.get(String(row.id)) ?? null,
        }),
      )
  }

  return faturaveis.map((row) =>
    mapRegistroToLoteItem(row as Record<string, unknown>, record.competencia, {
      excluded: exclusions.has(String(row.id)),
      excludeReason: exclusions.get(String(row.id)) ?? null,
    }),
  )
}

async function countRealizadas(entidadeId: string, competencia: string): Promise<number> {
  const [year, month] = competencia.split('-').map(Number)
  const start = new Date(Date.UTC(year, month - 1, 1)).toISOString()
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)).toISOString()

  const { count, error } = await supabaseAdmin
    .from('consultas')
    .select('id', { count: 'exact', head: true })
    .eq('entidade_contratante_id', entidadeId)
    .eq('status', 'concluida')
    .gte('finalizada_em', start)
    .lte('finalizada_em', end)

  if (error) throw error
  return count ?? 0
}

async function countBloqueantesIgnoradas(entidadeId: string, competencia: string) {
  const [year, month] = competencia.split('-').map(Number)
  const start = new Date(Date.UTC(year, month - 1, 1)).toISOString()
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)).toISOString()

  const { data, error } = await supabaseAdmin
    .from('faturamento_pendencia_estado')
    .select('status, kind, registro:consultas_registro_sus!inner(realizado_em)')
    .eq('entidade_contratante_id', entidadeId)
    .gte('registro.realizado_em', start)
    .lte('registro.realizado_em', end)

  if (error) throw error

  const openStatuses = new Set(['aberta', 'em_correcao', 'aguardando_profissional', 'corrigida'])
  let bloqueantes = 0
  let ignoradas = 0

  for (const row of data ?? []) {
    const status = String(row.status)
    const kind = String(row.kind)
    const catalog = (await import('../../lib/faturamento/pendenciaCatalog.js')).catalogForKind(kind)

    if (status === 'ignorada' || status === 'nao_faturavel') {
      ignoradas += 1
      continue
    }

    if (openStatuses.has(status) && catalog.gravidade === 'bloqueante') {
      bloqueantes += 1
    }
  }

  return { bloqueantes, ignoradas }
}

function generateFechamentoNumericId(records: FechamentoRecordDto[]): string {
  const existing = new Set(records.map((r) => r.fechamentoId).filter(Boolean))
  let candidate = ''
  do {
    candidate = String(Math.floor(100000 + Math.random() * 900000))
  } while (existing.has(candidate))
  return candidate
}

export async function getPrefeituraFaturamentoOverview(
  entidadeId: string,
  competencia: string,
) {
  await ensurePrincipalFechamento(entidadeId, competencia)
  const records = await loadFechamentoRecords(entidadeId, competencia)
  const principal = records.find((r) => r.tipo === 'principal')
  const currentRecord = principal ?? records[0]

  if (!currentRecord) {
    return {
      records: [],
      loteItems: [],
      summary: {
        competenciaLabel: formatCompetenciaLabel(competencia),
        realizadas: 0,
        elegiveis: 0,
        noLote: 0,
        bloqueantes: 0,
        ignoradas: 0,
      } satisfies FechamentoSummaryDto,
    }
  }

  const loteItems: LoteItemDto[] = []
  for (const record of records) {
    const items = await buildLoteItems(entidadeId, record, principal)
    loteItems.push(...items)
  }

  const scopedLote = await buildLoteItems(entidadeId, currentRecord, principal)
  const activeCount = scopedLote.filter((item) => !item.excluded).length
  const { bloqueantes, ignoradas } = await countBloqueantesIgnoradas(entidadeId, competencia)
  const realizadas = await countRealizadas(entidadeId, competencia)

  return {
    records,
    loteItems,
    summary: {
      competenciaLabel: formatCompetenciaLabel(competencia),
      realizadas,
      elegiveis: scopedLote.length,
      noLote: activeCount,
      bloqueantes,
      ignoradas,
    } satisfies FechamentoSummaryDto,
  }
}

export async function listPrefeituraFaturamentoHistorico(entidadeId: string, search?: string) {
  const records = (await loadFechamentoRecords(entidadeId)).filter(isClosed)

  const items = await Promise.all(
    records.map(async (record) => {
      const lote = (await buildLoteItems(entidadeId, record, undefined)).filter(
        (item) => !item.excluded,
      )
      return {
        record,
        competenciaLabel: formatCompetenciaLabel(record.competencia),
        tipoLabel: record.tipo === 'principal' ? 'Lote principal' : `Complemento ${record.complementoSeq ?? ''}`,
        consultasNoLote: record.consultasNoLote ?? lote.length,
      }
    }),
  )

  if (!search?.trim()) {
    return items.sort((a, b) => {
      const aTime = a.record.closedAt ? new Date(a.record.closedAt).getTime() : 0
      const bTime = b.record.closedAt ? new Date(b.record.closedAt).getTime() : 0
      return bTime - aTime
    })
  }

  const normalized = search.trim().toLowerCase()
  return items
    .filter((item) => {
      const haystack = [
        item.competenciaLabel,
        item.tipoLabel,
        item.record.competencia,
        item.record.loteId ?? '',
        item.record.fechamentoId ?? '',
        item.record.closedBy ?? '',
        item.record.status,
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(normalized)
    })
    .sort((a, b) => {
      const aTime = a.record.closedAt ? new Date(a.record.closedAt).getTime() : 0
      const bTime = b.record.closedAt ? new Date(b.record.closedAt).getTime() : 0
      return bTime - aTime
    })
}

export async function iniciarComplementoPrefeituraFaturamento(
  entidadeId: string,
  competencia: string,
) {
  const records = await loadFechamentoRecords(entidadeId, competencia)
  const principal = records.find((r) => r.tipo === 'principal')
  if (!principal || !isClosed(principal)) {
    throw new PrefeituraFaturamentoError('Fechamento principal ainda não foi concluído.', 400)
  }

  const openComplement = records.find((r) => r.tipo === 'complementar' && !isClosed(r))
  if (openComplement) return openComplement

  const seqs = records
    .filter((r) => r.tipo === 'complementar')
    .map((r) => r.complementoSeq ?? 0)
  const seq = seqs.length > 0 ? Math.max(...seqs) + 1 : 1
  const id = buildComplementRecordId(entidadeId, competencia, seq)
  const now = new Date().toISOString()

  const { error } = await supabaseAdmin.from('faturamento_fechamentos').insert({
    id,
    entidade_contratante_id: entidadeId,
    competencia,
    tipo: 'complementar',
    complemento_seq: seq,
    status: 'em_preparacao',
    last_revalidation_at: now,
  })

  if (error) throw error

  const { data, error: loadError } = await supabaseAdmin
    .from('faturamento_fechamentos')
    .select('*')
    .eq('id', id)
    .single()

  if (loadError) throw loadError
  return mapFechamentoRow(data as Record<string, unknown>)
}

export async function revalidarFechamentoPrefeituraFaturamento(
  entidadeId: string,
  recordId: string,
) {
  const { data, error } = await supabaseAdmin
    .from('faturamento_fechamentos')
    .select('competencia, status')
    .eq('id', recordId)
    .eq('entidade_contratante_id', entidadeId)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new PrefeituraFaturamentoError('Fechamento não encontrado.', 404)
  if (data.status === 'fechado' || data.status === 'exportado') {
    throw new PrefeituraFaturamentoError('Fechamento já encerrado.', 400)
  }

  await revalidarCompetenciaPrefeituraFaturamento(entidadeId, String(data.competencia))

  const now = new Date().toISOString()
  const { error: updateError } = await supabaseAdmin
    .from('faturamento_fechamentos')
    .update({ last_revalidation_at: now })
    .eq('id', recordId)

  if (updateError) throw updateError

  return getPrefeituraFaturamentoOverview(entidadeId, String(data.competencia))
}

export async function excludeLoteItemPrefeituraFaturamento(
  entidadeId: string,
  itemId: string,
  fechamentoRecordId: string,
  reason: string,
) {
  const { data: record, error: recordError } = await supabaseAdmin
    .from('faturamento_fechamentos')
    .select('status, competencia')
    .eq('id', fechamentoRecordId)
    .eq('entidade_contratante_id', entidadeId)
    .maybeSingle()

  if (recordError) throw recordError
  if (!record) throw new PrefeituraFaturamentoError('Fechamento não encontrado.', 404)
  if (record.status === 'fechado' || record.status === 'exportado') {
    throw new PrefeituraFaturamentoError('Fechamento já encerrado.', 400)
  }

  const { error } = await supabaseAdmin.from('faturamento_lote_exclusoes').upsert({
    registro_sus_id: itemId,
    fechamento_record_id: fechamentoRecordId,
    exclude_reason: reason.trim() || 'Excluída manualmente do lote.',
  })

  if (error) throw error

  return getPrefeituraFaturamentoOverview(entidadeId, String(record.competencia))
}

export async function restoreLoteItemPrefeituraFaturamento(
  entidadeId: string,
  itemId: string,
  fechamentoRecordId: string,
) {
  const { data: record, error: recordError } = await supabaseAdmin
    .from('faturamento_fechamentos')
    .select('status, competencia')
    .eq('id', fechamentoRecordId)
    .eq('entidade_contratante_id', entidadeId)
    .maybeSingle()

  if (recordError) throw recordError
  if (!record) throw new PrefeituraFaturamentoError('Fechamento não encontrado.', 404)

  const { error } = await supabaseAdmin
    .from('faturamento_lote_exclusoes')
    .delete()
    .eq('registro_sus_id', itemId)
    .eq('fechamento_record_id', fechamentoRecordId)

  if (error) throw error

  return getPrefeituraFaturamentoOverview(entidadeId, String(record.competencia))
}

export async function fecharPrefeituraFaturamento(
  entidadeId: string,
  recordId: string,
  closedBy: string,
) {
  const records = await loadFechamentoRecords(entidadeId)
  const record = records.find((r) => r.id === recordId)
  if (!record) throw new PrefeituraFaturamentoError('Fechamento não encontrado.', 404)
  if (isClosed(record)) {
    return { ok: false as const, errorReason: 'Este lote já foi fechado.' }
  }

  const principal = records.find(
    (r) => r.competencia === record.competencia && r.tipo === 'principal',
  )
  const lote = await buildLoteItems(entidadeId, record, principal)
  const active = lote.filter((item) => !item.excluded)

  if (active.length === 0) {
    return { ok: false as const, errorReason: 'O lote não possui consultas elegíveis para fechamento.' }
  }

  const { bloqueantes } = await countBloqueantesIgnoradas(entidadeId, record.competencia)
  const fechamentoId = generateFechamentoNumericId(records)
  const loteId = buildLoteIdForRecord(
    record.competencia,
    record.tipo,
    record.complementoSeq,
    record.loteId,
  )
  const closedAt = new Date().toISOString()

  const { error: updateError } = await supabaseAdmin
    .from('faturamento_fechamentos')
    .update({
      status: 'fechado',
      closed_at: closedAt,
      closed_by: closedBy,
      fechamento_id: fechamentoId,
      lote_id: loteId,
      consultas_no_lote: active.length,
      bloqueantes_registrados: bloqueantes,
    })
    .eq('id', recordId)

  if (updateError) throw updateError

  const inserts = await Promise.all(
    active.map(async (item) => {
      const { data: registro } = await supabaseAdmin
        .from('consultas_registro_sus')
        .select('consulta_id')
        .eq('id', item.id)
        .maybeSingle()

      return {
        fechamento_record_id: recordId,
        registro_sus_id: item.id,
        consulta_id: String(registro?.consulta_id ?? item.id),
        entidade_contratante_id: entidadeId,
        excluded: false,
        exclude_reason: null,
      }
    }),
  )

  const { error: insertError } = await supabaseAdmin
    .from('faturamento_fechamento_consultas')
    .upsert(inserts, { onConflict: 'fechamento_record_id,registro_sus_id' })

  if (insertError) throw insertError

  const tipoLabel = record.tipo === 'principal' ? 'Lote principal' : `Complemento ${record.complementoSeq ?? ''}`

  return {
    ok: true as const,
    fechamentoId,
    message: `${tipoLabel} fechado com ${active.length} consulta(s) no lote SUS.`,
    overview: await getPrefeituraFaturamentoOverview(entidadeId, record.competencia),
  }
}

export async function marcarExportadoPrefeituraFaturamento(
  entidadeId: string,
  recordId: string,
) {
  const { data, error } = await supabaseAdmin
    .from('faturamento_fechamentos')
    .select('competencia, status')
    .eq('id', recordId)
    .eq('entidade_contratante_id', entidadeId)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new PrefeituraFaturamentoError('Fechamento não encontrado.', 404)

  const { error: updateError } = await supabaseAdmin
    .from('faturamento_fechamentos')
    .update({
      status: 'exportado',
      exported_at: new Date().toISOString(),
    })
    .eq('id', recordId)

  if (updateError) throw updateError

  return getPrefeituraFaturamentoOverview(entidadeId, String(data.competencia))
}

async function loadBpaExportSources(
  entidadeId: string,
  record: FechamentoRecordDto,
) {
  const loteRows = await buildLoteItems(entidadeId, record, undefined)
  const registroIds = loteRows.map((item) => item.id)

  if (registroIds.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from('consultas_registro_sus')
    .select(
      `
      id,
      consulta_id,
      paciente_nome,
      paciente_cpf,
      paciente_cns,
      procedimento_codigo,
      realizado_em,
      consulta:consultas!inner (
        id,
        codigo_atendimento,
        status,
        origem_atendimento,
        especialidade_id,
        profissional:usuarios_profissionais (
          formacao,
          cns,
          cbo_codigo
        ),
        profissional_mt:profissionais_mt (
          formacao,
          cns,
          cbo_codigo,
          especialidade
        ),
        especialidade:config_especialidades (
          nome
        ),
        paciente:pacientes!inner (
          nome,
          cpf,
          cns,
          cns_pendente,
          data_nascimento,
          sexo,
          raca_cor,
          nacionalidade,
          telefone,
          email,
          endereco
        )
      )
    `,
    )
    .eq('entidade_contratante_id', entidadeId)
    .in('id', registroIds)

  if (error) throw error

  const loteByRegistroId = new Map(loteRows.map((item) => [item.id, item]))
  const duplicateKinds = new Map<string, string | null>()

  const { data: duplicidadeRows, error: duplicidadeError } = await supabaseAdmin
    .from('faturamento_pendencia_estado')
    .select('registro_sus_id, metadata')
    .in('registro_sus_id', registroIds)
    .eq('kind', 'duplicidade_consulta')

  if (duplicidadeError) throw duplicidadeError

  for (const row of duplicidadeRows ?? []) {
    const metadata = (row.metadata as Record<string, unknown>) ?? {}
    duplicateKinds.set(
      String(row.registro_sus_id),
      metadata.duplicateConsultaId ? String(metadata.duplicateConsultaId) : null,
    )
  }

  const cidByConsulta = new Map<string, string | null>()
  const consultaIds = (data ?? []).map((row) => {
    const consultaRaw = row.consulta as unknown
    const consulta = (Array.isArray(consultaRaw) ? consultaRaw[0] : consultaRaw) as Record<
      string,
      unknown
    >
    return String(consulta.id)
  })

  if (consultaIds.length > 0) {
    const { data: cidRows, error: cidError } = await supabaseAdmin
      .from('faturamento_pendencia_estado')
      .select('consulta_id, metadata')
      .in('consulta_id', consultaIds)
      .eq('kind', 'cid_ausente')

    if (cidError) throw cidError

    for (const row of cidRows ?? []) {
      const metadata = (row.metadata as Record<string, unknown>) ?? {}
      cidByConsulta.set(
        String(row.consulta_id),
        metadata.clinicalCid ? String(metadata.clinicalCid) : null,
      )
    }
  }

  const cboCompatCache = new Map<string, boolean>()

  return (data ?? []).map((row) => {
    const consultaRaw = row.consulta as unknown
    const consulta = (Array.isArray(consultaRaw) ? consultaRaw[0] : consultaRaw) as Record<
      string,
      unknown
    >
    const profissionalRaw = consulta.profissional
    const profissional = Array.isArray(profissionalRaw) ? profissionalRaw[0] : profissionalRaw
    const profissionalMtRaw = consulta.profissional_mt
    const profissionalMt = Array.isArray(profissionalMtRaw) ? profissionalMtRaw[0] : profissionalMtRaw
    const especialidadeRaw = consulta.especialidade
    const especialidade = Array.isArray(especialidadeRaw) ? especialidadeRaw[0] : especialidadeRaw
    const pacienteRaw = consulta.paciente
    const paciente = Array.isArray(pacienteRaw) ? pacienteRaw[0] : pacienteRaw
    const loteItem = loteByRegistroId.get(String(row.id))
    const executante = resolveProfissionalExecutanteSus({
      origemAtendimento: String(consulta.origem_atendimento ?? 'mp'),
      usuarioProfissional: profissional ?? null,
      profissionalMt: profissionalMt ?? null,
      especialidadeNome: especialidade?.nome ? String(especialidade.nome) : null,
    })
    const profissionalCbo = executante?.cbo_codigo ? String(executante.cbo_codigo) : null
    const cacheKey = `${profissionalCbo ?? ''}:${TELECONSULTA_ESPECIALIZADA_PROCEDIMENTO}`

    return {
      consultaId: String(row.consulta_id),
      codigoAtendimento: String(consulta.codigo_atendimento),
      competencia: record.competencia,
      status: String(consulta.status),
      realizadoEm: String(row.realizado_em),
      excluded: loteItem?.excluded ?? false,
      profissionalFormacao: executante?.formacao ? String(executante.formacao) : null,
      profissionalCns: executante?.cns ? String(executante.cns) : null,
      profissionalCbo,
      cboCompativel: cboCompatCache.get(cacheKey) ?? false,
      procedimentoCodigo: row.procedimento_codigo
        ? String(row.procedimento_codigo)
        : TELECONSULTA_ESPECIALIZADA_PROCEDIMENTO,
      pacienteNome: String(row.paciente_nome ?? paciente?.nome ?? ''),
      pacienteNascimento: paciente?.data_nascimento ? String(paciente.data_nascimento) : null,
      pacienteSexo: paciente?.sexo ? String(paciente.sexo) : null,
      pacienteRacaCor: paciente?.raca_cor ? String(paciente.raca_cor) : null,
      pacienteNacionalidade: paciente?.nacionalidade ? String(paciente.nacionalidade) : null,
      pacienteCns: row.paciente_cns
        ? String(row.paciente_cns)
        : paciente?.cns
          ? String(paciente.cns)
          : null,
      pacienteCnsPendente: Boolean(paciente?.cns_pendente),
      pacienteCpf: row.paciente_cpf
        ? String(row.paciente_cpf)
        : paciente?.cpf
          ? String(paciente.cpf)
          : null,
      pacienteEndereco: (paciente?.endereco as Record<string, unknown>) ?? {},
      pacienteTelefone: paciente?.telefone ? String(paciente.telefone) : null,
      pacienteEmail: paciente?.email ? String(paciente.email) : null,
      situacaoRua: ' ' as const,
      clinicalCid: cidByConsulta.get(String(consulta.id)) ?? null,
      duplicateConsultaId: duplicateKinds.get(String(row.id)) ?? null,
      _cacheKey: cacheKey,
      _profissionalCboForCompat: profissionalCbo,
    }
  })
}

async function hydrateCboCompatibility(
  sources: Array<{
    cboCompativel: boolean
    _cacheKey: string
    _profissionalCboForCompat: string | null
  }>,
) {
  const uniqueCbos = [
    ...new Set(
      sources
        .map((source) => source._profissionalCboForCompat)
        .filter((value): value is string => Boolean(value)),
    ),
  ]

  const compatibility = new Map<string, boolean>()
  await Promise.all(
    uniqueCbos.map(async (cbo) => {
      const { count, error } = await supabaseAdmin
        .from('config_sigtap_procedimento_ocupacao')
        .select('procedimento_codigo', { count: 'exact', head: true })
        .eq('procedimento_codigo', TELECONSULTA_ESPECIALIZADA_PROCEDIMENTO)
        .eq('ocupacao_codigo', cbo)

      if (error) throw error
      compatibility.set(`${cbo}:${TELECONSULTA_ESPECIALIZADA_PROCEDIMENTO}`, (count ?? 0) > 0)
    }),
  )

  for (const source of sources) {
    source.cboCompativel = compatibility.get(source._cacheKey) ?? false
    delete (source as { _cacheKey?: string })._cacheKey
    delete (source as { _profissionalCboForCompat?: string | null })._profissionalCboForCompat
  }
}

export async function exportBpaPrefeituraFaturamento(
  entidadeId: string,
  recordId: string,
) {
  const records = await loadFechamentoRecords(entidadeId)
  const record = records.find((r) => r.id === recordId)
  if (!record || !isClosed(record)) {
    throw new PrefeituraFaturamentoError('Fechamento não disponível para exportação.', 400)
  }

  const { data: entidade, error: entidadeError } = await supabaseAdmin
    .from('entidades_contratantes')
    .select('razao_social, nome_exibicao, cnpj, config_faturamento_sus')
    .eq('id', entidadeId)
    .maybeSingle()

  if (entidadeError) throw entidadeError
  if (!entidade) {
    throw new PrefeituraFaturamentoError('Entidade não encontrada.', 404)
  }

  const rawSources = await loadBpaExportSources(entidadeId, record)
  await hydrateCboCompatibility(rawSources)

  const exportResult = buildBpaTeleconsultaExport({
    competencia: record.competencia,
    loteId: record.loteId ?? null,
    entidadeNome: String(entidade.nome_exibicao || entidade.razao_social || ''),
    entidadeCnpj: String(entidade.cnpj ?? ''),
    configFaturamentoSus: entidade.config_faturamento_sus,
    sources: rawSources,
  })

  if (exportResult.includedCount === 0) {
    throw new PrefeituraFaturamentoError(
      'Nenhuma teleconsulta elegível para exportação BPA-I. Consulte o relatório de pendências.',
      400,
    )
  }

  return {
    contentType: 'text/plain; charset=iso-8859-1',
    filename: exportResult.txtFilename,
    body: exportResult.txtBody,
    meta: {
      includedCount: exportResult.includedCount,
      blockedCount: exportResult.blocked.length,
    },
  }
}

export async function exportRelatorioPrefeituraFaturamento(
  entidadeId: string,
  recordId: string,
) {
  const records = await loadFechamentoRecords(entidadeId)
  const record = records.find((r) => r.id === recordId)
  if (!record || !isClosed(record)) {
    throw new PrefeituraFaturamentoError('Fechamento não disponível.', 400)
  }

  const { data: entidade, error: entidadeError } = await supabaseAdmin
    .from('entidades_contratantes')
    .select('razao_social, nome_exibicao, cnpj, config_faturamento_sus')
    .eq('id', entidadeId)
    .maybeSingle()

  if (entidadeError) throw entidadeError
  if (!entidade) {
    throw new PrefeituraFaturamentoError('Entidade não encontrada.', 404)
  }

  const rawSources = await loadBpaExportSources(entidadeId, record)
  await hydrateCboCompatibility(rawSources)

  const exportResult = buildBpaTeleconsultaExport({
    competencia: record.competencia,
    loteId: record.loteId ?? null,
    entidadeNome: String(entidade.nome_exibicao || entidade.razao_social || ''),
    entidadeCnpj: String(entidade.cnpj ?? ''),
    configFaturamentoSus: entidade.config_faturamento_sus,
    sources: rawSources,
  })

  const institutionResult = resolveInstitutionConfig(
    entidade.config_faturamento_sus,
    String(entidade.nome_exibicao || entidade.razao_social || ''),
    String(entidade.cnpj ?? ''),
  )

  const body = buildBpaPendenciasRelatorio({
    competencia: record.competencia,
    loteId: record.loteId ?? null,
    fechamentoId: record.fechamentoId ?? null,
    includedCount: exportResult.includedCount,
    blocked: exportResult.blocked,
    institution: institutionResult.config,
  })

  return {
    contentType: 'text/plain; charset=utf-8',
    filename: `relatorio-pendencias-bpa-${record.competencia}.txt`,
    body,
  }
}

export async function listSigtapOcupacoes(query: string | undefined, limit: number) {
  let dbQuery = supabaseAdmin.from('config_sigtap_ocupacao').select('codigo, nome').limit(limit)

  if (query?.trim()) {
    dbQuery = dbQuery.or(`codigo.ilike.%${query.trim()}%,nome.ilike.%${query.trim()}%`)
  }

  const { data, error } = await dbQuery.order('codigo')
  if (error) throw error

  return (data ?? []).map((row) => ({
    value: String(row.codigo),
    label: `${row.codigo} — ${row.nome}`,
  }))
}

export async function listSigtapProcedimentos(
  query: string | undefined,
  cbo: string | undefined,
  limit: number,
) {
  if (cbo?.trim()) {
    const { data: links, error: linkError } = await supabaseAdmin
      .from('config_sigtap_procedimento_ocupacao')
      .select('procedimento_codigo, procedimento:config_sigtap_procedimento(codigo, nome)')
      .eq('ocupacao_codigo', cbo.trim())
      .limit(limit)

    if (linkError) throw linkError

    return (links ?? [])
      .map((row) => {
        const proc = Array.isArray(row.procedimento) ? row.procedimento[0] : row.procedimento
        if (!proc) return null
        return {
          value: String(proc.codigo),
          label: `${proc.codigo} — ${proc.nome}`,
        }
      })
      .filter(Boolean)
  }

  let dbQuery = supabaseAdmin.from('config_sigtap_procedimento').select('codigo, nome').limit(limit)
  if (query?.trim()) {
    dbQuery = dbQuery.or(`codigo.ilike.%${query.trim()}%,nome.ilike.%${query.trim()}%`)
  }

  const { data, error } = await dbQuery.order('codigo')
  if (error) throw error

  return (data ?? []).map((row) => ({
    value: String(row.codigo),
    label: `${row.codigo} — ${row.nome}`,
  }))
}

export async function listCompetenciasDisponiveis(entidadeId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('consultas_registro_sus')
    .select('realizado_em')
    .eq('entidade_contratante_id', entidadeId)
    .order('realizado_em', { ascending: false })
    .limit(500)

  if (error) throw error

  const set = new Set<string>()
  for (const row of data ?? []) {
    set.add(competenciaFromDate(String(row.realizado_em)))
  }

  const fechamentos = await loadFechamentoRecords(entidadeId)
  for (const record of fechamentos) {
    set.add(record.competencia)
  }

  return [...set].sort().reverse()
}
