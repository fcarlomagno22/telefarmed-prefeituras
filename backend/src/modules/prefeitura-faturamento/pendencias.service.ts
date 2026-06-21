import { isValidCns, normalizeCns } from '../../lib/cns.js'
import { updatePaciente } from '../admin-pacientes/pacientes.service.js'
import { supabaseAdmin } from '../../db/supabase.js'
import {
  buildPendenciaId,
  catalogForKind,
  competenciaFromDate,
  parsePendenciaId,
} from '../../lib/faturamento/pendenciaCatalog.js'
import { rebuildConsultaRegistroSus } from '../../lib/faturamento/rebuildRegistroSus.js'
import { persistCanonicalProfissionalCbo } from '../../lib/faturamento/formacaoCbo.js'
import {
  TELECONSULTA_ESPECIALIZADA_NOME,
  TELECONSULTA_ESPECIALIZADA_PROCEDIMENTO,
} from '../../lib/faturamento/bpa/constants.js'
import { PrefeituraFaturamentoError } from './errors.js'
import { updateProfissionalMtSusFields } from '../ubt-rh3/profissionaisMt.service.js'
import type { CorrecaoPayloadDto, PendenciaDto, PendenciasSummaryDto } from './types.js'
import type { pendenciasQuerySchema } from './schemas.js'
import type { z } from 'zod'

type PendenciasQuery = z.infer<typeof pendenciasQuerySchema>

const OPEN_STATUSES = new Set([
  'aberta',
  'em_correcao',
  'aguardando_profissional',
  'corrigida',
])

const RESOLVED_STATUSES = new Set(['validada', 'ignorada', 'nao_faturavel'])

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

function formatBirthDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  const date = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('pt-BR').format(date)
}

function formatSex(sexo: string | null | undefined): string | null {
  if (!sexo || sexo === 'nao_informado') return null
  if (sexo === 'masculino') return 'Masculino'
  if (sexo === 'feminino') return 'Feminino'
  return sexo
}

function isToday(iso: string | null): boolean {
  if (!iso) return false
  const date = new Date(iso)
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

function mapRowToPendencia(row: Record<string, unknown>): PendenciaDto {
  const metadata = (row.metadata as Record<string, unknown>) ?? {}
  const catalog = catalogForKind(String(row.kind))
  const registro = row.registro as Record<string, unknown>
  const consulta = row.consulta as Record<string, unknown>
  const unidade = row.unidade as Record<string, unknown>
  const especialidade = row.especialidade as Record<string, unknown>
  const paciente = row.paciente as Record<string, unknown>

  const realizadoEm = String(registro.realizado_em ?? consulta.finalizada_em ?? consulta.criado_em)
  const competencia = competenciaFromDate(realizadoEm)

  return {
    id: buildPendenciaId(String(registro.id), String(row.kind)),
    competencia,
    category: catalog.category,
    gravidade: catalog.gravidade,
    status: String(row.status),
    kind: catalog.kind,
    title: catalog.title,
    patientName: String(registro.paciente_nome ?? '—'),
    patientCpf: registro.paciente_cpf ? String(registro.paciente_cpf) : null,
    patientCns: registro.paciente_cns ? String(registro.paciente_cns) : null,
    patientMunicipality:
      typeof metadata.patientMunicipality === 'string' ? metadata.patientMunicipality : null,
    patientMunicipalityIbge:
      typeof metadata.patientMunicipalityIbge === 'string' ? metadata.patientMunicipalityIbge : null,
    professionalCbo:
      typeof metadata.professionalCbo === 'string'
        ? metadata.professionalCbo
        : registro.profissional_cbo_codigo
          ? String(registro.profissional_cbo_codigo)
          : null,
    professionalCboLabel:
      typeof metadata.professionalCboLabel === 'string'
        ? metadata.professionalCboLabel
        : registro.profissional_cbo_descricao
          ? `${registro.profissional_cbo_codigo} — ${registro.profissional_cbo_descricao}`
          : null,
    professionalHasCnesVinculo:
      typeof metadata.professionalHasCnesVinculo === 'boolean'
        ? metadata.professionalHasCnesVinculo
        : undefined,
    procedureCompatibleWithCbo:
      typeof metadata.procedureCompatibleWithCbo === 'boolean'
        ? metadata.procedureCompatibleWithCbo
        : Array.isArray(registro.pendencias)
          ? !registro.pendencias.includes('cbo_incompativel_procedimento') &&
            Boolean(registro.profissional_cbo_codigo && registro.procedimento_codigo)
          : undefined,
    clinicalCid: typeof metadata.clinicalCid === 'string' ? metadata.clinicalCid : null,
    clinicalRequestSentAt: row.clinical_request_sent_at
      ? String(row.clinical_request_sent_at)
      : null,
    consultaEncerrada:
      typeof metadata.consultaEncerrada === 'boolean' ? metadata.consultaEncerrada : undefined,
    duplicidadeResolvida:
      typeof metadata.duplicidadeResolvida === 'boolean' ? metadata.duplicidadeResolvida : undefined,
    duplicateConsultaId:
      typeof metadata.duplicateConsultaId === 'string' ? metadata.duplicateConsultaId : null,
    consultaStartedAt:
      typeof metadata.consultaStartedAt === 'string' ? metadata.consultaStartedAt : null,
    consultaEndedAt:
      typeof metadata.consultaEndedAt === 'string' ? metadata.consultaEndedAt : null,
    consultaModality: 'Teleconsulta',
    consultaClinicalStatus:
      consulta.status === 'concluida' ? 'Atendimento concluído' : 'Atendimento em andamento',
    patientBirthDate: formatBirthDate(
      paciente?.data_nascimento ? String(paciente.data_nascimento) : null,
    ),
    patientSex: formatSex(paciente?.sexo ? String(paciente.sexo) : null),
    professionalConselho: registro.profissional_conselho
      ? String(registro.profissional_conselho)
      : null,
    professionalCns: null,
    professionalActive: true,
    suggestedProcedureName:
      typeof metadata.suggestedProcedureName === 'string'
        ? metadata.suggestedProcedureName
        : registro.procedimento_nome
          ? String(registro.procedimento_nome)
          : null,
    consultaId: String(consulta.codigo_atendimento ?? consulta.id),
    consultaDate: realizadoEm,
    professionalName: String(registro.profissional_nome ?? '—'),
    specialty: String(especialidade?.nome ?? '—'),
    unitId: String(unidade?.id ?? ''),
    unitName: String(unidade?.nome ?? '—'),
    cnes: String(registro.unidade_cnes ?? unidade?.cnes ?? ''),
    suggestedProcedure: registro.procedimento_codigo
      ? String(registro.procedimento_codigo)
      : typeof metadata.suggestedProcedure === 'string'
        ? metadata.suggestedProcedure
        : null,
    reason: catalog.reason,
    impact: catalog.impact,
    recommendedAction: catalog.recommendedAction,
    primaryAction: catalog.primaryAction,
    responsibleName: row.responsible_name ? String(row.responsible_name) : null,
    ignoreJustification: row.ignore_justification ? String(row.ignore_justification) : null,
    correctedAt: row.corrected_at ? String(row.corrected_at) : null,
  }
}

async function loadPendenciaRows(entidadeId: string, competencia: string) {
  const [year, month] = competencia.split('-').map(Number)
  const startMs = Date.UTC(year, month - 1, 1)
  const endMs = Date.UTC(year, month, 0, 23, 59, 59, 999)

  const { data, error } = await supabaseAdmin
    .from('faturamento_pendencia_estado')
    .select(
      `
      id,
      kind,
      status,
      responsible_name,
      ignore_justification,
      corrected_at,
      clinical_request_sent_at,
      metadata,
      registro:consultas_registro_sus!inner (
        id,
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
        consulta_id
      ),
      consulta:consultas!inner (
        id,
        codigo_atendimento,
        status,
        finalizada_em,
        iniciada_em,
        criado_em,
        unidade_ubt_id,
        paciente_id,
        paciente:pacientes (
          data_nascimento,
          sexo
        ),
        unidade:unidades_ubt (
          id,
          nome,
          cnes
        ),
        especialidade:config_especialidades (
          nome
        )
      )
    `,
    )
    .eq('entidade_contratante_id', entidadeId)

  if (error) throw error

  return (data ?? [])
    .filter((row) => {
      const registro = row.registro as { realizado_em?: string }
      if (!registro?.realizado_em) return false
      const ts = new Date(registro.realizado_em).getTime()
      return ts >= startMs && ts <= endMs
    })
    .map((row) => mapRowToPendencia(row as Record<string, unknown>))
}

function matchesCategoryTab(item: PendenciaDto, tab: string | undefined): boolean {
  if (!tab || tab === 'todas') return true
  if (tab === 'bloqueantes') return item.gravidade === 'bloqueante' && OPEN_STATUSES.has(item.status)
  if (tab === 'resolvidas') return RESOLVED_STATUSES.has(item.status)
  return item.category === tab
}

function buildSummary(items: PendenciaDto[], competencia: string, faturaveis: number): PendenciasSummaryDto {
  const scoped = items.filter((item) => item.competencia === competencia)
  const abertas = scoped.filter((item) => OPEN_STATUSES.has(item.status))

  return {
    abertas: abertas.length,
    bloqueantes: abertas.filter((item) => item.gravidade === 'bloqueante').length,
    avisos: abertas.filter((item) => item.gravidade === 'aviso').length,
    corrigidasHoje: scoped.filter((item) => isToday(item.correctedAt)).length,
    faturaveis,
    competenciaLabel: formatCompetenciaLabel(competencia),
  }
}

async function countFaturaveis(entidadeId: string, competencia: string): Promise<number> {
  const [year, month] = competencia.split('-').map(Number)
  const start = new Date(Date.UTC(year, month - 1, 1)).toISOString()
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)).toISOString()

  const { count, error } = await supabaseAdmin
    .from('consultas_registro_sus')
    .select('id', { count: 'exact', head: true })
    .eq('entidade_contratante_id', entidadeId)
    .eq('faturavel', true)
    .gte('realizado_em', start)
    .lte('realizado_em', end)

  if (error) throw error
  return count ?? 0
}

export async function listPrefeituraFaturamentoPendencias(
  entidadeId: string,
  query: PendenciasQuery,
) {
  const faturaveis = await countFaturaveis(entidadeId, query.competencia)
  let items = await loadPendenciaRows(entidadeId, query.competencia)

  if (query.unitId && query.unitId !== 'all') {
    items = items.filter((item) => item.unitId === query.unitId)
  }
  if (query.professionalName && query.professionalName !== 'all') {
    items = items.filter((item) => item.professionalName === query.professionalName)
  }
  if (query.specialty && query.specialty !== 'all') {
    items = items.filter((item) => item.specialty === query.specialty)
  }
  if (query.category && query.category !== 'all') {
    items = items.filter((item) => item.category === query.category)
  }
  if (query.gravidade && query.gravidade !== 'all') {
    items = items.filter((item) => item.gravidade === query.gravidade)
  }
  if (query.status && query.status !== 'all') {
    items = items.filter((item) => item.status === query.status)
  }
  if (query.categoryTab) {
    items = items.filter((item) => matchesCategoryTab(item, query.categoryTab))
  }
  if (query.search?.trim()) {
    const normalized = query.search.trim().toLowerCase()
    items = items.filter((item) => {
      const haystack = [
        item.title,
        item.patientName,
        item.patientCpf ?? '',
        item.patientCns ?? '',
        item.consultaId,
        item.professionalName,
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(normalized)
    })
  }

  items.sort((a, b) => new Date(b.consultaDate).getTime() - new Date(a.consultaDate).getTime())

  const summary = buildSummary(items, query.competencia, faturaveis)
  const totalFiltered = items.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / query.pageSize))
  const page = Math.min(query.page, totalPages)
  const start = (page - 1) * query.pageSize
  const paginatedItems = items.slice(start, start + query.pageSize)

  const competencias = [...new Set(items.map((item) => item.competencia))].sort().reverse()
  const units = [...new Map(items.map((item) => [item.unitId, item.unitName])).entries()]
  const professionals = [...new Set(items.map((item) => item.professionalName))].sort()
  const specialties = [...new Set(items.map((item) => item.specialty))].sort()

  return {
    items: paginatedItems,
    allItems: items,
    summary,
    page,
    pageSize: query.pageSize,
    totalFiltered,
    totalPages,
    filterOptions: {
      competencias: competencias.map((value) => ({
        value,
        label: formatCompetenciaLabel(value),
      })),
      units: [{ value: 'all', label: 'Unidade: Todas' }, ...units.map(([value, label]) => ({ value, label }))],
      professionals: [
        { value: 'all', label: 'Profissional: Todos' },
        ...professionals.map((name) => ({ value: name, label: name })),
      ],
      specialties: [
        { value: 'all', label: 'Especialidade: Todas' },
        ...specialties.map((name) => ({ value: name, label: name })),
      ],
    },
  }
}

async function resolvePendenciaContext(entidadeId: string, pendenciaId: string) {
  const parsed = parsePendenciaId(pendenciaId)
  if (!parsed) {
    throw new PrefeituraFaturamentoError('Pendência inválida.', 404, 'PENDENCIA_NOT_FOUND')
  }

  const { data, error } = await supabaseAdmin
    .from('faturamento_pendencia_estado')
    .select('id, consulta_id, kind, status, metadata')
    .eq('registro_sus_id', parsed.registroSusId)
    .eq('kind', parsed.kind)
    .eq('entidade_contratante_id', entidadeId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new PrefeituraFaturamentoError('Pendência não encontrada.', 404, 'PENDENCIA_NOT_FOUND')
  }

  return { ...parsed, estadoId: String(data.id), consultaId: String(data.consulta_id), row: data }
}

export async function reavaliarPrefeituraFaturamentoPendencia(
  entidadeId: string,
  pendenciaId: string,
) {
  const ctx = await resolvePendenciaContext(entidadeId, pendenciaId)
  const result = await rebuildConsultaRegistroSus(ctx.consultaId)
  if (!result) {
    throw new PrefeituraFaturamentoError('Consulta não encontrada.', 404)
  }

  const list = await loadPendenciaRows(entidadeId, competenciaFromDate(new Date().toISOString()))
  const item = list.find((entry) => entry.id === pendenciaId)

  if (result.faturavel) {
    return {
      ok: true as const,
      message:
        'Elegibilidade confirmada. A consulta está apta para seguir no fechamento SUS desta competência.',
      item: item ?? null,
    }
  }

  const stillOpen = result.pendencias.includes(ctx.kind)
  if (!stillOpen) {
    return {
      ok: true as const,
      message: 'Pendência resolvida após reavaliação.',
      item: item ?? null,
    }
  }

  return {
    ok: false as const,
    errorReason:
      item?.reason ??
      'A consulta ainda não atende aos requisitos de faturamento SUS.',
    item: item ?? null,
  }
}

export async function ignorarPrefeituraFaturamentoPendencia(
  entidadeId: string,
  pendenciaId: string,
  justification: string,
  responsibleName: string,
) {
  const ctx = await resolvePendenciaContext(entidadeId, pendenciaId)

  const { error } = await supabaseAdmin
    .from('faturamento_pendencia_estado')
    .update({
      status: 'ignorada',
      ignore_justification: justification,
      responsible_name: responsibleName,
    })
    .eq('id', ctx.estadoId)

  if (error) throw error

  const list = await listPrefeituraFaturamentoPendencias(entidadeId, {
    competencia: competenciaFromDate(new Date().toISOString()),
    page: 1,
    pageSize: 1,
  })

  const item = list.allItems.find((entry) => entry.id === pendenciaId) ?? null
  return { item }
}

const CNS_PENDENCIA_KINDS = new Set(['paciente_sem_cns'])

function buildCorrecaoMetadataPatch(payload: CorrecaoPayloadDto): Record<string, unknown> {
  const patch: Record<string, unknown> = {}

  if (payload.patientMunicipality !== undefined) {
    patch.patientMunicipality = payload.patientMunicipality
  }
  if (payload.patientMunicipalityIbge !== undefined) {
    patch.patientMunicipalityIbge = payload.patientMunicipalityIbge
  }
  if (payload.professionalCbo !== undefined) patch.professionalCbo = payload.professionalCbo
  if (payload.professionalCboLabel !== undefined) {
    patch.professionalCboLabel = payload.professionalCboLabel
  }
  if (payload.professionalCns !== undefined) patch.professionalCns = payload.professionalCns
  if (payload.professionalConselhoNumero !== undefined) {
    patch.professionalConselhoNumero = payload.professionalConselhoNumero
  }
  if (payload.professionalConselhoUf !== undefined) {
    patch.professionalConselhoUf = payload.professionalConselhoUf
  }
  if (payload.professionalHasCnesVinculo !== undefined) {
    patch.professionalHasCnesVinculo = payload.professionalHasCnesVinculo
  }
  if (payload.suggestedProcedure !== undefined) patch.suggestedProcedure = payload.suggestedProcedure
  if (payload.consultaEncerrada !== undefined) patch.consultaEncerrada = payload.consultaEncerrada
  if (payload.duplicidadeResolvida !== undefined) {
    patch.duplicidadeResolvida = payload.duplicidadeResolvida
  }
  if (payload.clinicalCid !== undefined) patch.clinicalCid = payload.clinicalCid

  return patch
}

function resolveProcedimentoNomeCorrecao(codigo: string, nomeDb: string | null | undefined): string | null {
  if (nomeDb) return nomeDb
  if (codigo === TELECONSULTA_ESPECIALIZADA_PROCEDIMENTO) {
    return TELECONSULTA_ESPECIALIZADA_NOME
  }
  return null
}

export async function corrigirPrefeituraFaturamentoPendencia(
  entidadeId: string,
  pendenciaId: string,
  payload: CorrecaoPayloadDto,
  responsibleName: string,
) {
  const ctx = await resolvePendenciaContext(entidadeId, pendenciaId)

  const { data: consulta, error: consultaError } = await supabaseAdmin
    .from('consultas')
    .select(
      `
      paciente_id,
      profissional_id,
      profissional_mt_id,
      origem_atendimento,
      profissional:usuarios_profissionais ( formacao ),
      profissional_mt:profissionais_mt ( formacao, especialidade ),
      especialidade:config_especialidades ( nome )
    `,
    )
    .eq('id', ctx.consultaId)
    .eq('entidade_contratante_id', entidadeId)
    .maybeSingle()

  if (consultaError) throw consultaError
  if (!consulta) throw new PrefeituraFaturamentoError('Consulta não encontrada.', 404)

  const pendenciaKind = String(ctx.row.kind)

  if (payload.patientCns && consulta.paciente_id && CNS_PENDENCIA_KINDS.has(pendenciaKind)) {
    const digits = normalizeCns(payload.patientCns)
    if (digits.length < 15 || !isValidCns(digits)) {
      throw new PrefeituraFaturamentoError('CNS deve conter 15 dígitos válidos.', 400)
    }
    await updatePaciente(String(consulta.paciente_id), {
      cns: digits,
      cnsPendente: false,
    })
  }

  if (
    (payload.patientMunicipality || payload.patientMunicipalityIbge) &&
    consulta.paciente_id
  ) {
    const { data: paciente } = await supabaseAdmin
      .from('pacientes')
      .select('endereco')
      .eq('id', consulta.paciente_id)
      .maybeSingle()

    const endereco = (paciente?.endereco as Record<string, unknown>) ?? {}
    const ibgeCode = payload.patientMunicipalityIbge?.replace(/\D/g, '') ?? null

    await supabaseAdmin
      .from('pacientes')
      .update({
        endereco: {
          ...endereco,
          municipio: payload.patientMunicipality ?? endereco.municipio,
          cidade: payload.patientMunicipality ?? endereco.cidade,
          ibge: ibgeCode ?? endereco.ibge,
          codigo_ibge: ibgeCode ?? endereco.codigo_ibge,
          codigo_ibge_municipio: ibgeCode ?? endereco.codigo_ibge_municipio,
        },
      })
      .eq('id', consulta.paciente_id)
  }

  if (consulta.profissional_id || consulta.profissional_mt_id) {
    const profissionalRaw = consulta.profissional
    const profissional = Array.isArray(profissionalRaw) ? profissionalRaw[0] : profissionalRaw
    const profissionalMtRaw = consulta.profissional_mt
    const profissionalMt = Array.isArray(profissionalMtRaw) ? profissionalMtRaw[0] : profissionalMtRaw
    const especialidadeRaw = consulta.especialidade
    const especialidade = Array.isArray(especialidadeRaw) ? especialidadeRaw[0] : especialidadeRaw
    const formacao =
      (profissional?.formacao ? String(profissional.formacao) : null) ??
      (profissionalMt?.formacao ? String(profissionalMt.formacao) : null)

    await persistCanonicalProfissionalCbo({
      origemAtendimento: String(consulta.origem_atendimento ?? 'mp'),
      profissionalId: consulta.profissional_id ? String(consulta.profissional_id) : null,
      profissionalMtId: consulta.profissional_mt_id ? String(consulta.profissional_mt_id) : null,
      formacao,
      especialidadeNome: especialidade?.nome ? String(especialidade.nome) : null,
    })
  }

  if (consulta.profissional_mt_id) {
    const mtPatch: {
      cns?: string
      conselhoNumero?: string
      conselhoUf?: string
    } = {}

    if (payload.professionalCns) {
      const digits = normalizeCns(payload.professionalCns)
      if (digits.length < 15 || !isValidCns(digits)) {
        throw new PrefeituraFaturamentoError('CNS do profissional deve conter 15 dígitos válidos.', 400)
      }
      mtPatch.cns = digits
    }

    if (payload.professionalConselhoNumero) {
      mtPatch.conselhoNumero = payload.professionalConselhoNumero.replace(/\D/g, '')
    }

    if (payload.professionalConselhoUf) {
      mtPatch.conselhoUf = payload.professionalConselhoUf.trim().toUpperCase()
    }

    if (Object.keys(mtPatch).length > 0) {
      await updateProfissionalMtSusFields(String(consulta.profissional_mt_id), mtPatch)
    }
  }

  const metadataPatch = buildCorrecaoMetadataPatch(payload)
  if (payload.suggestedProcedure) {
    metadataPatch.procedureCompatibleWithCbo = true
    const procNome = await supabaseAdmin
      .from('config_sigtap_procedimento')
      .select('nome')
      .eq('codigo', payload.suggestedProcedure)
      .maybeSingle()
    const procedimentoNome = resolveProcedimentoNomeCorrecao(
      payload.suggestedProcedure,
      procNome.data?.nome ? String(procNome.data.nome) : null,
    )
    if (procedimentoNome) {
      metadataPatch.suggestedProcedureName = procedimentoNome
    }
    await supabaseAdmin
      .from('consultas_registro_sus')
      .update({
        procedimento_codigo: payload.suggestedProcedure,
        procedimento_nome: procedimentoNome,
      })
      .eq('consulta_id', ctx.consultaId)
  }

  const { data: existingEstado } = await supabaseAdmin
    .from('faturamento_pendencia_estado')
    .select('metadata')
    .eq('id', ctx.estadoId)
    .maybeSingle()

  const mergedMetadata = {
    ...((existingEstado?.metadata as Record<string, unknown>) ?? {}),
    ...metadataPatch,
  }

  const { error: estadoError } = await supabaseAdmin
    .from('faturamento_pendencia_estado')
    .update({
      status: 'corrigida',
      corrected_at: new Date().toISOString(),
      responsible_name: responsibleName,
      metadata: mergedMetadata,
    })
    .eq('id', ctx.estadoId)

  if (estadoError) throw estadoError

  await rebuildConsultaRegistroSus(ctx.consultaId)

  const refreshed = await reavaliarPrefeituraFaturamentoPendencia(entidadeId, pendenciaId)
  return refreshed
}

export async function solicitarCorrecaoClinicaPrefeituraFaturamentoPendencia(
  entidadeId: string,
  pendenciaId: string,
  responsibleName: string,
) {
  const ctx = await resolvePendenciaContext(entidadeId, pendenciaId)

  const { error } = await supabaseAdmin
    .from('faturamento_pendencia_estado')
    .update({
      status: 'aguardando_profissional',
      clinical_request_sent_at: new Date().toISOString(),
      responsible_name: responsibleName,
    })
    .eq('id', ctx.estadoId)

  if (error) throw error

  return { ok: true }
}

export async function revalidarCompetenciaPrefeituraFaturamento(
  entidadeId: string,
  competencia: string,
) {
  const [year, month] = competencia.split('-').map(Number)
  const start = new Date(Date.UTC(year, month - 1, 1)).toISOString()
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)).toISOString()

  const { data, error } = await supabaseAdmin
    .from('consultas_registro_sus')
    .select('consulta_id')
    .eq('entidade_contratante_id', entidadeId)
    .gte('realizado_em', start)
    .lte('realizado_em', end)

  if (error) throw error

  for (const row of data ?? []) {
    await rebuildConsultaRegistroSus(String(row.consulta_id))
  }

  return { ok: true, revalidated: (data ?? []).length }
}

export async function saveCnsPrefeituraFaturamentoPendencia(
  entidadeId: string,
  pendenciaId: string,
  cns: string,
  responsibleName: string,
) {
  const digits = normalizeCns(cns)
  if (digits.length < 15) {
    throw new PrefeituraFaturamentoError('CNS deve conter 15 dígitos.', 400)
  }

  return corrigirPrefeituraFaturamentoPendencia(
    entidadeId,
    pendenciaId,
    { patientCns: digits },
    responsibleName,
  )
}
