import { formatCpfDisplay } from '../../modules/admin-credenciais/formatters.js'
import { formatCnsDisplay, isValidCns, normalizeCns } from '../cns.js'
import { supabaseAdmin } from '../../db/supabase.js'
import {
  isConsultaMtTerceirizada,
  resolveProfissionalExecutanteSus,
} from './profissionalExecutante.js'
import {
  TELECONSULTA_ESPECIALIZADA_NOME,
  TELECONSULTA_ESPECIALIZADA_PROCEDIMENTO,
} from './bpa/constants.js'
import { competenciaFromDate, catalogForKind } from './pendenciaCatalog.js'

const DEFAULT_ESPECIALIDADE_PROCEDIMENTO: Record<string, string> = {
  '4': '0301010064',
  '179': '0301010064',
  '33': '0301010048',
  '34': '0301010048',
  '331': '0301010048',
  '337': '0301010048',
  '187': '0301010048',
}

import { resolveFormacaoCbo, persistCanonicalProfissionalCbo } from './formacaoCbo.js'
import { resolveMunicipioFromEndereco } from '../municipiosIbge.js'

type ConsultaRegistroContext = {
  id: string
  codigo_atendimento: string
  entidade_contratante_id: string
  especialidade_id: string
  status: string
  finalizada_em: string | null
  iniciada_em: string | null
  criado_em: string
  paciente_id: string
  profissional_id: string | null
  profissional_mt_id: string | null
  origem_atendimento: string
  unidade_ubt_id: string
  paciente: {
    nome: string
    cpf: string
    cns: string | null
    cns_pendente: boolean | null
    data_nascimento: string
    sexo: string
    nacionalidade: string | null
    raca_cor: string | null
    endereco: Record<string, unknown>
  }
  profissional: {
    nome: string
    conselho_sigla: string | null
    conselho_numero: string | null
    conselho_uf: string | null
    formacao: string | null
    cbo_codigo: string | null
    cbo_descricao: string | null
    cns: string | null
    status: string | null
  } | null
  unidade: {
    id: string
    nome: string
    cnes: string | null
  }
  especialidade: {
    nome: string
  }
}

function formatConselho(
  sigla: string | null | undefined,
  numero: string | null | undefined,
  uf: string | null | undefined,
): string {
  const siglaTrim = sigla?.trim() ?? ''
  const numeroTrim = numero?.trim() ?? ''
  const ufTrim = uf?.trim() ?? ''

  if (!siglaTrim && !numeroTrim) return ''

  const base = [siglaTrim, numeroTrim].filter(Boolean).join(' ')
  return ufTrim ? `${base}/${ufTrim}` : base
}

function resolvePacienteDocumento(paciente: ConsultaRegistroContext['paciente']): {
  cpf: string | null
  cns: string | null
  exibicao: string
  pendencias: string[]
} {
  const cpfDigits = paciente.cpf.replace(/\D/g, '')
  const cpf = cpfDigits.length === 11 ? cpfDigits : null
  const cnsDigits = paciente.cns ? normalizeCns(paciente.cns) : ''
  const cnsValido =
    !paciente.cns_pendente && cnsDigits.length === 15 && isValidCns(cnsDigits) ? cnsDigits : null

  const pendencias: string[] = []
  if (cpf && cnsValido) {
    pendencias.push('paciente_cpf_cns_simultaneos')
  }
  if (!cpf && !cnsValido) {
    pendencias.push('paciente_sem_documento')
  }

  const exibicao = cnsValido
    ? formatCnsDisplay(cnsValido)
    : cpf
      ? formatCpfDisplay(cpf)
      : '—'

  return { cpf, cns: cnsValido, exibicao, pendencias }
}

function resolveMunicipio(endereco: Record<string, unknown>): {
  municipio: string | null
  ibge: string | null
} {
  return resolveMunicipioFromEndereco(endereco)
}

async function loadSigtapCompetencia(): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('config_sigtap_meta')
    .select('competencia')
    .eq('id', 1)
    .maybeSingle()

  if (error) throw error
  return data?.competencia ? String(data.competencia) : null
}

async function resolveProcedimentoCodigo(
  especialidadeId: string,
  formacao: string | null | undefined,
): Promise<string | null> {
  if (formacao === 'medicina') {
    return TELECONSULTA_ESPECIALIZADA_PROCEDIMENTO
  }

  const { data, error } = await supabaseAdmin
    .from('config_sigtap_especialidade_procedimento')
    .select('procedimento_codigo')
    .eq('especialidade_id', especialidadeId)
    .maybeSingle()

  if (error) throw error
  if (data?.procedimento_codigo) return String(data.procedimento_codigo)

  if (DEFAULT_ESPECIALIDADE_PROCEDIMENTO[especialidadeId]) {
    return DEFAULT_ESPECIALIDADE_PROCEDIMENTO[especialidadeId]
  }

  return null
}

async function resolveProcedimentoNome(codigo: string | null): Promise<string | null> {
  if (!codigo) return null

  const { data, error } = await supabaseAdmin
    .from('config_sigtap_procedimento')
    .select('nome')
    .eq('codigo', codigo)
    .maybeSingle()

  if (error) throw error
  if (data?.nome) return String(data.nome)
  if (codigo === TELECONSULTA_ESPECIALIZADA_PROCEDIMENTO) {
    return TELECONSULTA_ESPECIALIZADA_NOME
  }
  return null
}

async function resolveCbo(
  profissional: NonNullable<ConsultaRegistroContext['profissional']>,
  especialidadeNome?: string | null,
): Promise<{ codigo: string | null; descricao: string | null; pendencias: string[] }> {
  const resolved = await resolveFormacaoCbo(profissional.formacao, especialidadeNome)
  return {
    codigo: resolved.codigo,
    descricao: resolved.descricao,
    pendencias: [],
  }
}

async function isCboCompatibleWithProcedimento(
  procedimentoCodigo: string | null,
  cboCodigo: string | null,
): Promise<boolean> {
  if (!procedimentoCodigo || !cboCodigo) return false

  const { count, error } = await supabaseAdmin
    .from('config_sigtap_procedimento_ocupacao')
    .select('procedimento_codigo', { count: 'exact', head: true })
    .eq('procedimento_codigo', procedimentoCodigo)
    .eq('ocupacao_codigo', cboCodigo)

  if (error) throw error
  return (count ?? 0) > 0
}

async function detectDuplicidade(
  entidadeId: string,
  pacienteId: string,
  consultaId: string,
  realizadoEm: string,
): Promise<{ hasDuplicidade: boolean; duplicateConsultaId: string | null }> {
  const dayStart = new Date(realizadoEm)
  dayStart.setUTCHours(0, 0, 0, 0)
  const dayEnd = new Date(realizadoEm)
  dayEnd.setUTCHours(23, 59, 59, 999)

  const { data, error } = await supabaseAdmin
    .from('consultas_registro_sus')
    .select('consulta_id, consultas!inner(codigo_atendimento, paciente_id)')
    .eq('entidade_contratante_id', entidadeId)
    .neq('consulta_id', consultaId)
    .gte('realizado_em', dayStart.toISOString())
    .lte('realizado_em', dayEnd.toISOString())

  if (error) throw error

  for (const row of data ?? []) {
    const consulta = Array.isArray(row.consultas) ? row.consultas[0] : row.consultas
    if (consulta && String(consulta.paciente_id) === pacienteId) {
      return {
        hasDuplicidade: true,
        duplicateConsultaId: String(consulta.codigo_atendimento),
      }
    }
  }

  return { hasDuplicidade: false, duplicateConsultaId: null }
}

async function loadConsultaRegistroContext(
  consultaId: string,
): Promise<ConsultaRegistroContext | null> {
  const { data, error } = await supabaseAdmin
    .from('consultas')
    .select(
      `
      id,
      codigo_atendimento,
      entidade_contratante_id,
      especialidade_id,
      status,
      finalizada_em,
      iniciada_em,
      criado_em,
      paciente_id,
      profissional_id,
      profissional_mt_id,
      origem_atendimento,
      unidade_ubt_id,
      paciente:pacientes!inner (
        nome,
        cpf,
        cns,
        cns_pendente,
        data_nascimento,
        sexo,
        nacionalidade,
        raca_cor,
        endereco
      ),
      profissional:usuarios_profissionais (
        nome,
        conselho_sigla,
        conselho_numero,
        conselho_uf,
        formacao,
        cbo_codigo,
        cbo_descricao,
        cns,
        status
      ),
      profissional_mt:profissionais_mt (
        nome,
        conselho_sigla,
        conselho_numero,
        conselho_uf,
        formacao,
        cbo_codigo,
        cbo_descricao,
        cns,
        especialidade
      ),
      unidade:unidades_ubt!inner (
        id,
        nome,
        cnes
      ),
      especialidade:config_especialidades!inner (
        nome
      )
    `,
    )
    .eq('id', consultaId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const paciente = Array.isArray(data.paciente) ? data.paciente[0] : data.paciente
  const profissionalRaw = Array.isArray(data.profissional) ? data.profissional[0] : data.profissional
  const profissionalMtRaw = Array.isArray(data.profissional_mt)
    ? data.profissional_mt[0]
    : data.profissional_mt
  const unidade = Array.isArray(data.unidade) ? data.unidade[0] : data.unidade
  const especialidade = Array.isArray(data.especialidade) ? data.especialidade[0] : data.especialidade

  if (!paciente || !unidade || !especialidade) return null

  const origemAtendimento = String(data.origem_atendimento ?? 'mp')
  const profissionalExecutante = resolveProfissionalExecutanteSus({
    origemAtendimento,
    usuarioProfissional: profissionalRaw ?? null,
    profissionalMt: profissionalMtRaw ?? null,
    especialidadeNome: especialidade?.nome ? String(especialidade.nome) : null,
  })

  return {
    id: String(data.id),
    codigo_atendimento: String(data.codigo_atendimento),
    entidade_contratante_id: String(data.entidade_contratante_id),
    especialidade_id: String(data.especialidade_id),
    status: String(data.status),
    finalizada_em: data.finalizada_em ? String(data.finalizada_em) : null,
    iniciada_em: data.iniciada_em ? String(data.iniciada_em) : null,
    criado_em: String(data.criado_em),
    paciente_id: String(data.paciente_id),
    profissional_id: data.profissional_id ? String(data.profissional_id) : null,
    profissional_mt_id: data.profissional_mt_id ? String(data.profissional_mt_id) : null,
    origem_atendimento: origemAtendimento,
    unidade_ubt_id: String(data.unidade_ubt_id),
    paciente: {
      nome: String(paciente.nome ?? '—'),
      cpf: String(paciente.cpf ?? ''),
      cns: paciente.cns ? String(paciente.cns) : null,
      cns_pendente: paciente.cns_pendente ?? false,
      data_nascimento: String(paciente.data_nascimento ?? ''),
      sexo: String(paciente.sexo ?? 'nao_informado'),
      nacionalidade: paciente.nacionalidade ? String(paciente.nacionalidade) : null,
      raca_cor: paciente.raca_cor ? String(paciente.raca_cor) : null,
      endereco: (paciente.endereco as Record<string, unknown>) ?? {},
    },
    profissional: profissionalExecutante,
    unidade: {
      id: String(unidade.id),
      nome: String(unidade.nome ?? 'Unidade'),
      cnes: unidade.cnes ? String(unidade.cnes) : null,
    },
    especialidade: {
      nome: String(especialidade.nome ?? 'Especialidade'),
    },
  }
}

export type RebuildRegistroResult = {
  registroSusId: string
  consultaId: string
  faturavel: boolean
  pendencias: string[]
}

export async function rebuildConsultaRegistroSus(
  consultaId: string,
): Promise<RebuildRegistroResult | null> {
  const context = await loadConsultaRegistroContext(consultaId)
  if (!context) return null

  if (context.status === 'concluida' && !context.finalizada_em) {
    const fallbackEnd = context.iniciada_em ?? context.criado_em
    const { error: finalizeError } = await supabaseAdmin
      .from('consultas')
      .update({ finalizada_em: fallbackEnd })
      .eq('id', consultaId)
      .eq('status', 'concluida')
      .is('finalizada_em', null)

    if (finalizeError) throw finalizeError
    context.finalizada_em = fallbackEnd
  }

  const municipioResolved = resolveMunicipio(context.paciente.endereco)
  if (municipioResolved.ibge) {
    const endereco = context.paciente.endereco
    const currentIbge =
      typeof endereco.codigo_ibge_municipio === 'string'
        ? endereco.codigo_ibge_municipio.replace(/\D/g, '')
        : ''
    if (currentIbge.length !== 7) {
      const { error: pacienteError } = await supabaseAdmin
        .from('pacientes')
        .update({
          endereco: {
            ...endereco,
            codigo_ibge_municipio: municipioResolved.ibge,
            ...(municipioResolved.municipio && typeof endereco.cidade !== 'string'
              ? { cidade: municipioResolved.municipio }
              : {}),
          },
        })
        .eq('id', context.paciente_id)

      if (pacienteError) throw pacienteError
      context.paciente.endereco = {
        ...endereco,
        codigo_ibge_municipio: municipioResolved.ibge,
      }
    }
  }

  const realizadoEm = context.finalizada_em ?? context.iniciada_em ?? context.criado_em
  const pacienteDocumento = resolvePacienteDocumento(context.paciente)
  const pendencias = [...pacienteDocumento.pendencias]

  const municipio = municipioResolved
  if (!municipio.ibge) {
    pendencias.push('municipio_ausente')
  }

  if (context.status !== 'concluida') {
    pendencias.push('consulta_nao_finalizada')
  }

  if (context.profissional?.formacao !== 'medicina') {
    pendencias.push('consulta_nao_teleconsulta_medica')
  }

  if (!context.paciente.nome.trim() || context.paciente.nome.trim().split(/\s+/).length < 2) {
    pendencias.push('paciente_nome_ausente')
  }

  if (!context.paciente.data_nascimento?.trim()) {
    pendencias.push('paciente_nascimento_ausente')
  }

  if (!context.paciente.sexo?.trim()) {
    pendencias.push('paciente_sexo_ausente')
  }

  if (!context.paciente.raca_cor?.trim()) {
    pendencias.push('paciente_raca_cor_ausente')
  }

  if (context.status === 'concluida' && !context.finalizada_em) {
    pendencias.push('consulta_sem_horario_fim')
  }

  if (!context.profissional) {
    pendencias.push('profissional_ausente')
  }

  const profissionalNome = context.profissional?.nome ?? 'Profissional de plantão'
  const profissionalConselho = context.profissional
    ? formatConselho(
        context.profissional.conselho_sigla,
        context.profissional.conselho_numero,
        context.profissional.conselho_uf,
      )
    : ''

  if (context.profissional && !profissionalConselho) {
    pendencias.push('profissional_sem_conselho')
  }

  const cbo = context.profissional
    ? await resolveCbo(context.profissional, context.especialidade.nome)
    : { codigo: null, descricao: null, pendencias: ['profissional_sem_cbo'] as string[] }

  pendencias.push(...cbo.pendencias)

  if (context.profissional?.cns?.replace(/\D/g, '').length !== 15) {
    pendencias.push('profissional_sem_cns')
  }

  const procedimentoCodigo = await resolveProcedimentoCodigo(
    context.especialidade_id,
    context.profissional?.formacao,
  )
  const procedimentoNome = await resolveProcedimentoNome(procedimentoCodigo)

  if (!procedimentoCodigo) {
    pendencias.push('procedimento_sigtap_ausente')
  }

  const unidadeCnes = context.unidade.cnes?.replace(/\D/g, '') ?? ''
  if (unidadeCnes.length !== 7) {
    pendencias.push('unidade_sem_cnes')
  }

  const sigtapCompetencia = await loadSigtapCompetencia()
  if (!sigtapCompetencia) {
    pendencias.push('sigtap_nao_importado')
  }

  const consultaCompetencia = competenciaFromDate(realizadoEm)
  const sigtapCompetenciaFormatted =
    sigtapCompetencia && sigtapCompetencia.length === 6
      ? `${sigtapCompetencia.slice(0, 4)}-${sigtapCompetencia.slice(4, 6)}`
      : null

  if (sigtapCompetenciaFormatted && sigtapCompetenciaFormatted !== consultaCompetencia) {
    pendencias.push('procedimento_fora_competencia')
  }

  if (procedimentoCodigo && cbo.codigo && sigtapCompetencia) {
    const compatible = await isCboCompatibleWithProcedimento(procedimentoCodigo, cbo.codigo)
    if (!compatible) {
      pendencias.push('cbo_incompativel_procedimento')
    }
  }

  const procedureCompatibleWithCbo =
    Boolean(procedimentoCodigo && cbo.codigo) &&
    !pendencias.includes('cbo_incompativel_procedimento')

  if (context.profissional_id && !isConsultaMtTerceirizada(context.origem_atendimento)) {
    const { count, error: vinculoError } = await supabaseAdmin
      .from('profissional_vinculos_ubt')
      .select('id', { count: 'exact', head: true })
      .eq('profissional_id', context.profissional_id)
      .eq('unidade_ubt_id', context.unidade_ubt_id)
      .eq('ativo', true)

    if (vinculoError && vinculoError.code !== '42P01') throw vinculoError
    if ((count ?? 0) === 0 && vinculoError?.code !== '42P01') {
      pendencias.push('profissional_sem_vinculo_cnes')
    }
  }

  const duplicidade = await detectDuplicidade(
    context.entidade_contratante_id,
    context.paciente_id,
    context.id,
    realizadoEm,
  )
  if (duplicidade.hasDuplicidade) {
    pendencias.push('duplicidade_consulta')
  }

  const { data: estadoCid } = await supabaseAdmin
    .from('faturamento_pendencia_estado')
    .select('metadata')
    .eq('consulta_id', context.id)
    .eq('kind', 'cid_ausente')
    .maybeSingle()

  const clinicalCid =
    estadoCid?.metadata &&
    typeof estadoCid.metadata === 'object' &&
    'clinicalCid' in (estadoCid.metadata as Record<string, unknown>)
      ? String((estadoCid.metadata as Record<string, unknown>).clinicalCid ?? '')
      : ''

  const uniquePendencias = [...new Set(pendencias)]
  const faturavel = uniquePendencias.every(
    (kind) => catalogForKind(kind).gravidade !== 'bloqueante',
  )

  const payload = {
    consulta_id: consultaId,
    entidade_contratante_id: context.entidade_contratante_id,
    paciente_nome: context.paciente.nome,
    paciente_cpf: pacienteDocumento.cpf,
    paciente_cns: pacienteDocumento.cns,
    paciente_documento_exibicao: pacienteDocumento.exibicao,
    profissional_nome: profissionalNome,
    profissional_conselho: profissionalConselho,
    profissional_cbo_codigo: cbo.codigo,
    profissional_cbo_descricao: cbo.descricao,
    procedimento_codigo: procedimentoCodigo,
    procedimento_nome: procedimentoNome,
    unidade_cnes: unidadeCnes,
    realizado_em: realizadoEm,
    sigtap_competencia: sigtapCompetencia,
    faturavel,
    pendencias: uniquePendencias,
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('consultas_registro_sus')
    .select('id')
    .eq('consulta_id', consultaId)
    .maybeSingle()

  if (existingError) throw existingError

  let registroSusId: string

  if (existing) {
    registroSusId = String(existing.id)
    const { error: updateError } = await supabaseAdmin
      .from('consultas_registro_sus')
      .update(payload)
      .eq('id', registroSusId)

    if (updateError) throw updateError
  } else {
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('consultas_registro_sus')
      .insert(payload)
      .select('id')
      .single()

    if (insertError) throw insertError
    registroSusId = String(inserted.id)
  }

  await syncPendenciaEstadoRows({
    registroSusId,
    consultaId,
    entidadeId: context.entidade_contratante_id,
    activeKinds: uniquePendencias,
    duplicidadeConsultaId: duplicidade.duplicateConsultaId,
    municipio,
    context,
    cbo,
    procedimentoCodigo,
    procedimentoNome,
    clinicalCid: clinicalCid || null,
    procedureCompatibleWithCbo,
  })

  if (context.profissional && cbo.codigo) {
    await persistCanonicalProfissionalCbo({
      origemAtendimento: context.origem_atendimento,
      profissionalId: context.profissional_id,
      profissionalMtId: context.profissional_mt_id,
      formacao: context.profissional.formacao,
      especialidadeNome: context.especialidade.nome,
    })
  }

  return {
    registroSusId,
    consultaId,
    faturavel,
    pendencias: uniquePendencias,
  }
}

export async function ensureConsultaRegistroSus(consultaId: string): Promise<void> {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('consultas_registro_sus')
    .select('id')
    .eq('consulta_id', consultaId)
    .maybeSingle()

  if (existingError) throw existingError
  if (existing) return

  await rebuildConsultaRegistroSus(consultaId)
}

async function syncPendenciaEstadoRows(params: {
  registroSusId: string
  consultaId: string
  entidadeId: string
  activeKinds: string[]
  duplicidadeConsultaId: string | null
  municipio: { municipio: string | null; ibge: string | null }
  context: ConsultaRegistroContext
  cbo: { codigo: string | null; descricao: string | null }
  procedimentoCodigo: string | null
  procedimentoNome: string | null
  clinicalCid: string | null
  procedureCompatibleWithCbo: boolean
}) {
  const { data: existingRows, error: loadError } = await supabaseAdmin
    .from('faturamento_pendencia_estado')
    .select('id, kind, status, metadata')
    .eq('registro_sus_id', params.registroSusId)

  if (loadError) throw loadError

  const existingByKind = new Map((existingRows ?? []).map((row) => [String(row.kind), row]))
  const activeSet = new Set(params.activeKinds)

  for (const kind of params.activeKinds) {
    const existing = existingByKind.get(kind)
    const baseMetadata = {
      duplicateConsultaId: kind === 'duplicidade_consulta' ? params.duplicidadeConsultaId : null,
      patientMunicipality: params.municipio.municipio,
      patientMunicipalityIbge: params.municipio.ibge,
      professionalCbo: params.cbo.codigo,
      professionalCboLabel: params.cbo.codigo
        ? `${params.cbo.codigo} — ${params.cbo.descricao ?? ''}`.trim()
        : null,
      suggestedProcedure: params.procedimentoCodigo,
      suggestedProcedureName: params.procedimentoNome,
      consultaEncerrada: params.context.status === 'concluida',
      consultaStartedAt: params.context.iniciada_em,
      consultaEndedAt: params.context.finalizada_em,
      clinicalCid: params.clinicalCid,
      procedureCompatibleWithCbo: params.procedureCompatibleWithCbo,
    }

    if (!existing) {
      const { error: insertError } = await supabaseAdmin.from('faturamento_pendencia_estado').insert({
        registro_sus_id: params.registroSusId,
        consulta_id: params.consultaId,
        entidade_contratante_id: params.entidadeId,
        kind,
        status: 'aberta',
        metadata: baseMetadata,
      })
      if (insertError) throw insertError
    } else if (existing.status === 'validada' || existing.status === 'ignorada') {
      continue
    } else {
      const mergedMetadata = {
        ...(existing.metadata as Record<string, unknown>),
        ...baseMetadata,
      }
      const { error: updateError } = await supabaseAdmin
        .from('faturamento_pendencia_estado')
        .update({ metadata: mergedMetadata })
        .eq('id', existing.id)
      if (updateError) throw updateError
    }
  }

  for (const row of existingRows ?? []) {
    if (activeSet.has(String(row.kind))) continue
    if (row.status === 'ignorada') continue

    const { error: resolveError } = await supabaseAdmin
      .from('faturamento_pendencia_estado')
      .update({
        status: 'validada',
        corrected_at: new Date().toISOString(),
      })
      .eq('id', row.id)

    if (resolveError) throw resolveError
  }
}
