import { supabaseAdmin } from '../../db/supabase.js'
import { formatCnpjDisplay, formatCompetenciaLabelFromDate, parseDateBrToIso } from './money.js'
import {
  formatPlantaoAuditoria,
  formatRepasseCompetencia,
} from './formatters.js'
import {
  computePlantaoRepasse,
  mapRepasseActionToFechamentoStatus,
} from './repasse-compute.js'
import { findOrCreateFornecedorByCnpj } from './fornecedores.service.js'
import { FinanceiroError } from './errors.js'
import type { PlantaoAuditoriaDto, PlantaoDecisaoAnalista, RepasseCompetenciaDto } from './types.js'

type ProfissionalContext = {
  profissionalId: string
  profissionalNome: string
  pjRazaoSocial: string
  pjCnpj: string
}

async function loadProfissionalContext(profissionalId: string): Promise<ProfissionalContext> {
  const { data: prof } = await supabaseAdmin
    .from('usuarios_profissionais')
    .select('id, nome')
    .eq('id', profissionalId)
    .maybeSingle()

  const { data: candidatura } = await supabaseAdmin
    .from('candidaturas_profissionais')
    .select('id, nome_completo')
    .eq('profissional_id', profissionalId)
    .order('finalizada_em', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  let pjRazaoSocial = 'PJ não informada'
  let pjCnpj = '00000000000000'

  if (candidatura?.id) {
    const { data: empresa } = await supabaseAdmin
      .from('candidatura_empresa_pj')
      .select('cnpj, razao_social')
      .eq('candidatura_id', candidatura.id)
      .maybeSingle()

    if (empresa?.razao_social) pjRazaoSocial = empresa.razao_social
    if (empresa?.cnpj) pjCnpj = empresa.cnpj.replace(/\D/g, '')
  }

  return {
    profissionalId,
    profissionalNome: prof?.nome ?? candidatura?.nome_completo ?? 'Profissional',
    pjRazaoSocial,
    pjCnpj: formatCnpjDisplay(pjCnpj),
  }
}

function parseSessaoSummary(summary: unknown): {
  consultasAgendadas: number
  encaixes: number
  atendidos: number
  naoCompareceu: number
  desistiu: number
  percentualOnline: number | null
  encerramentoFormal: boolean
} {
  const obj =
    summary && typeof summary === 'object' && !Array.isArray(summary)
      ? (summary as Record<string, unknown>)
      : {}

  return {
    consultasAgendadas: Number(obj.consultasAgendadas ?? obj.consultas_agendadas ?? 0),
    encaixes: Number(obj.encaixes ?? 0),
    atendidos: Number(obj.atendidos ?? obj.consultasConcluidas ?? 0),
    naoCompareceu: Number(obj.naoCompareceu ?? 0),
    desistiu: Number(obj.desistiu ?? 0),
    percentualOnline:
      obj.percentualOnline != null
        ? Number(obj.percentualOnline)
        : obj.percentual_online != null
          ? Number(obj.percentual_online)
          : null,
    encerramentoFormal: Boolean(obj.encerramentoFormal ?? obj.encerramento_formal ?? false),
  }
}

async function loadPlantoesForCompetencia(
  ctx: ProfissionalContext,
  competencia: string,
): Promise<PlantaoAuditoriaDto[]> {
  const [year, month] = competencia.split('-')
  const startDate = `${year}-${month}-01`
  const lastDay = new Date(Number(year), Number(month), 0).getDate()
  const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`

  const { data: plantoes, error } = await supabaseAdmin
    .from('escala_plantoes_confirmados')
    .select(
      `
      id,
      profissional_id,
      status,
      escala_slots!inner (
        id,
        data,
        hora_inicio,
        hora_fim,
        valor_centavos,
        repasse_regra,
        config_especialidades ( nome )
      )
    `,
    )
    .eq('profissional_id', ctx.profissionalId)
    .gte('escala_slots.data', startDate)
    .lte('escala_slots.data', endDate)
    .in('status', ['confirmado', 'realizado'])

  if (error) throw error
  if (!plantoes?.length) return []

  const plantaoIds = plantoes.map((p) => p.id)
  const { data: sessoes } = await supabaseAdmin
    .from('profissional_plantao_sessoes')
    .select('plantao_id, entered_at, ended_at, summary')
    .in('plantao_id', plantaoIds)

  const sessaoMap = new Map(
    (sessoes ?? []).map((s) => [String(s.plantao_id), s]),
  )

  return plantoes.map((row) => {
    const slotRaw = row.escala_slots as unknown
    const slot = Array.isArray(slotRaw) ? slotRaw[0] : slotRaw
    const slotObj = slot as {
      data: string
      hora_inicio: string
      hora_fim: string
      valor_centavos: number
      repasse_regra: unknown
      config_especialidades?: { nome: string } | { nome: string }[] | null
    }

    const espRaw = slotObj.config_especialidades
    const esp = Array.isArray(espRaw) ? espRaw[0] : espRaw

    const sessao = sessaoMap.get(String(row.id))
    const metrics = parseSessaoSummary(sessao?.summary)

    return formatPlantaoAuditoria({
      plantao: {
        id: row.id,
        profissional_id: row.profissional_id,
        status: row.status,
        slot: {
          data: slotObj.data,
          hora_inicio: slotObj.hora_inicio,
          hora_fim: slotObj.hora_fim,
          valor_centavos: slotObj.valor_centavos,
          repasse_regra: slotObj.repasse_regra,
          especialidade_nome: esp?.nome,
        },
        sessao: sessao
          ? {
              entered_at: sessao.entered_at,
              ended_at: sessao.ended_at,
              summary: sessao.summary,
            }
          : null,
        metrics,
      },
      profissionalNome: ctx.profissionalNome,
      pjRazaoSocial: ctx.pjRazaoSocial,
      pjCnpj: ctx.pjCnpj,
      competencia,
    })
  })
}

function isFullPlantaoSnapshot(snapshot: PlantaoAuditoriaDto[]): boolean {
  return snapshot.length > 0 && Boolean(snapshot[0]?.slotLabel)
}

async function resolvePlantoesForFechamento(
  fechamento: {
    profissional_id: string
    competencia: string
    plantoes_snapshot: unknown
  },
  ctx: ProfissionalContext,
): Promise<PlantaoAuditoriaDto[]> {
  const snapshot = Array.isArray(fechamento.plantoes_snapshot)
    ? (fechamento.plantoes_snapshot as PlantaoAuditoriaDto[])
    : []

  if (isFullPlantaoSnapshot(snapshot)) {
    return snapshot
  }

  const fresh = await loadPlantoesForCompetencia(ctx, fechamento.competencia)
  if (snapshot.length === 0) {
    return fresh
  }

  const decisaoById = new Map(snapshot.map((plantao) => [plantao.id, plantao]))
  return fresh.map((plantao) => {
    const saved = decisaoById.get(plantao.id)
    if (!saved?.decisaoAnalista) return plantao
    return {
      ...plantao,
      decisaoAnalista: saved.decisaoAnalista,
      observacaoAnalista: saved.observacaoAnalista ?? '',
      decididoEm: saved.decididoEm ?? null,
      decididoPorAdminId: saved.decididoPorAdminId ?? null,
    }
  })
}

async function buildRepasseRow(fechamento: {
  id: string
  profissional_id: string
  competencia: string
  status: string
  invoice_file_name: string
  submitted_at: string | null
  valor_calculado_centavos: number
  valor_aprovado_centavos: number | null
  valor_nf_centavos: number | null
  plantoes_snapshot: unknown
}): Promise<RepasseCompetenciaDto> {
  const ctx = await loadProfissionalContext(fechamento.profissional_id)
  const plantoes = await resolvePlantoesForFechamento(fechamento, ctx)

  return formatRepasseCompetencia({
    fechamento,
    profissionalNome: ctx.profissionalNome,
    pjRazaoSocial: ctx.pjRazaoSocial,
    pjCnpj: ctx.pjCnpj,
    plantoes,
  })
}

export async function listRepasseCompetencias(): Promise<RepasseCompetenciaDto[]> {
  const { data, error } = await supabaseAdmin
    .from('profissional_fechamento_competencia')
    .select('*')
    .not('submitted_at', 'is', null)
    .order('competencia', { ascending: false })
    .limit(200)

  if (error) throw error

  const rows: RepasseCompetenciaDto[] = []
  for (const fechamento of data ?? []) {
    rows.push(await buildRepasseRow(fechamento))
  }
  return rows
}

async function getFechamentoOrThrow(id: string) {
  const { data, error } = await supabaseAdmin
    .from('profissional_fechamento_competencia')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new FinanceiroError('Competência não encontrada.', 'NOT_FOUND', 404)
  return data
}

async function resolveCentroCustoMedico(): Promise<string> {
  const { data } = await supabaseAdmin
    .from('financeiro_centros_custo')
    .select('id, nome')
    .ilike('nome', '%medica%')
    .limit(1)
    .maybeSingle()

  if (data?.id) return data.id

  const { data: anyCentro } = await supabaseAdmin
    .from('financeiro_centros_custo')
    .select('id')
    .limit(1)
    .maybeSingle()

  if (!anyCentro?.id) {
    throw new FinanceiroError('Nenhum centro de custo cadastrado.', 'INVALID_DATA', 500)
  }
  return anyCentro.id
}

export async function approveRepasseCompetencia(
  adminId: string,
  fechamentoId: string,
  input: { valorAprovadoCentavos: number; motivoAjuste?: string | null },
): Promise<RepasseCompetenciaDto> {
  const fechamento = await getFechamentoOrThrow(fechamentoId)

  if (fechamento.conta_pagar_id) {
    throw new FinanceiroError('Esta competência já possui conta a pagar gerada.', 'CONFLICT', 409)
  }

  if (fechamento.status === 'pago' || fechamento.status === 'rejeitado') {
    throw new FinanceiroError('Competência não pode ser aprovada neste status.', 'CONFLICT', 409)
  }

  const ctx = await loadProfissionalContext(fechamento.profissional_id)
  const plantoes = await resolvePlantoesForFechamento(fechamento, ctx)

  const valorCalculadoCentavos = plantoes.reduce((sum, p) => {
    const c = computePlantaoRepasse({
      plantaoEncerrado: p.plantaoEncerrado,
      percentualOnline: p.percentualOnline,
      consultasAgendadas: p.consultasAgendadas,
      encaixes: p.encaixes,
      atendidos: p.atendidos,
      encerramentoFormal: p.encerramentoFormal,
      repasseRule: p.repasseRule,
    })
    return sum + c.valorCalculadoCentavos
  }, 0)

  const valorAprovado = input.valorAprovadoCentavos
  if (
    valorAprovado !== valorCalculadoCentavos &&
    !input.motivoAjuste?.trim()
  ) {
    throw new FinanceiroError(
      'Informe o motivo quando o valor aprovado difere do calculado.',
      'INVALID_DATA',
      400,
    )
  }

  const fornecedorId = await findOrCreateFornecedorByCnpj(ctx.pjCnpj, ctx.pjRazaoSocial)
  const centroCustoId = await resolveCentroCustoMedico()

  const competenciaLabel = formatCompetenciaLabelFromDate(fechamento.competencia)
  const [year, month] = fechamento.competencia.split('-')
  const vencimentoIso = parseDateBrToIso(`10/${month}/${year}`)
  const descricao = `Repasse profissional — ${ctx.profissionalNome} — ${competenciaLabel}`

  const repasseSnapshot = {
    competenciaId: fechamentoId,
    profissionalNome: ctx.profissionalNome,
    pjRazaoSocial: ctx.pjRazaoSocial,
    pjCnpj: ctx.pjCnpj,
    competencia: competenciaLabel,
    valorCalculadoCentavos,
    valorAprovadoCentavos: valorAprovado,
    valorNFCentavos: fechamento.valor_nf_centavos,
    motivoAjuste: input.motivoAjuste ?? null,
    nfFileName: fechamento.invoice_file_name || null,
    plantaoIds: plantoes.map((p) => p.id),
    plantoesResumo: plantoes.map((p) => {
      const c = computePlantaoRepasse({
        plantaoEncerrado: p.plantaoEncerrado,
        percentualOnline: p.percentualOnline,
        consultasAgendadas: p.consultasAgendadas,
        encaixes: p.encaixes,
        atendidos: p.atendidos,
        encerramentoFormal: p.encerramentoFormal,
        repasseRule: p.repasseRule,
      })
      return {
        id: p.id,
        slotLabel: p.slotLabel,
        data: p.horarioPrevistoInicio.slice(0, 10),
        modalidade: p.repasseRule.modalidade,
        atendidos: p.atendidos,
        valorCalculadoCentavos: c.valorCalculadoCentavos,
        elegibilidade: c.elegibilidade,
        alertasResolvidos: Boolean(p.decisaoAnalista) || c.alertas.length === 0,
      }
    }),
    aprovadoEm: new Date().toISOString(),
  }

  const { data: conta, error: contaError } = await supabaseAdmin
    .from('financeiro_contas_pagar')
    .insert({
      fornecedor_id: fornecedorId,
      descricao,
      centro_custo_id: centroCustoId,
      recorrencia: 'unica',
      valor_centavos: valorAprovado,
      vencimento: vencimentoIso,
      status: 'pendente',
      origem: 'repasse_profissional',
      profissional_fechamento_id: fechamentoId,
      motivo_ajuste: input.motivoAjuste?.trim() ?? '',
      repasse_conferencia_status: 'pendente_conferencia',
      repasse_snapshot: repasseSnapshot,
    })
    .select('id')
    .single()

  if (contaError) throw contaError
  if (!conta) throw new FinanceiroError('Falha ao gerar conta a pagar.', 'INVALID_DATA', 500)

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('profissional_fechamento_competencia')
    .update({
      status: 'aprovado',
      valor_calculado_centavos: valorCalculadoCentavos,
      valor_aprovado_centavos: valorAprovado,
      motivo_ajuste: input.motivoAjuste?.trim() ?? '',
      conta_pagar_id: conta.id,
      aprovado_por_admin_id: adminId,
      approved_at: new Date().toISOString(),
      plantoes_snapshot: plantoes,
    })
    .eq('id', fechamentoId)
    .select('*')
    .single()

  if (updateError) throw updateError
  if (!updated) throw new FinanceiroError('Competência não encontrada.', 'NOT_FOUND', 404)

  return buildRepasseRow(updated)
}

export async function rejectRepasseCompetencia(
  fechamentoId: string,
  motivo: string,
): Promise<RepasseCompetenciaDto> {
  const fechamento = await getFechamentoOrThrow(fechamentoId)

  if (fechamento.conta_pagar_id) {
    throw new FinanceiroError('Competência com conta a pagar não pode ser rejeitada.', 'CONFLICT', 409)
  }

  const { data: updated, error } = await supabaseAdmin
    .from('profissional_fechamento_competencia')
    .update({
      status: 'rejeitado',
      rejection_reason: motivo.trim(),
    })
    .eq('id', fechamentoId)
    .select('*')
    .single()

  if (error) throw error
  if (!updated) throw new FinanceiroError('Competência não encontrada.', 'NOT_FOUND', 404)
  return buildRepasseRow(updated)
}

export async function requestRepasseCorrecao(
  fechamentoId: string,
  motivo: string,
): Promise<RepasseCompetenciaDto> {
  const { data: updated, error } = await supabaseAdmin
    .from('profissional_fechamento_competencia')
    .update({
      status: 'aberto',
      correcao_motivo: motivo.trim(),
      submitted_at: null,
    })
    .eq('id', fechamentoId)
    .select('*')
    .single()

  if (error) throw error
  if (!updated) throw new FinanceiroError('Competência não encontrada.', 'NOT_FOUND', 404)
  return buildRepasseRow(updated)
}

export async function markRepasseCompetenciaPago(
  adminId: string,
  fechamentoId: string,
): Promise<RepasseCompetenciaDto> {
  void adminId
  const fechamento = await getFechamentoOrThrow(fechamentoId)

  if (fechamento.status !== 'aprovado') {
    throw new FinanceiroError('Somente competências aprovadas podem ser marcadas como pagas.', 'INVALID_DATA', 400)
  }

  if (fechamento.conta_pagar_id) {
    await supabaseAdmin
      .from('financeiro_contas_pagar')
      .update({ status: 'pago', repasse_conferencia_status: 'conferido' })
      .eq('id', fechamento.conta_pagar_id)
  }

  const { data: updated, error } = await supabaseAdmin
    .from('profissional_fechamento_competencia')
    .update({
      status: 'pago',
      paid_at: new Date().toISOString(),
    })
    .eq('id', fechamentoId)
    .select('*')
    .single()

  if (error) throw error
  if (!updated) throw new FinanceiroError('Competência não encontrada.', 'NOT_FOUND', 404)
  return buildRepasseRow(updated)
}

export async function saveRepassePlantaoDecisao(
  adminId: string,
  fechamentoId: string,
  plantaoId: string,
  input: { decisao: PlantaoDecisaoAnalista; observacao?: string },
): Promise<RepasseCompetenciaDto> {
  const fechamento = await getFechamentoOrThrow(fechamentoId)

  if (fechamento.conta_pagar_id) {
    throw new FinanceiroError(
      'Competência já aprovada — decisões de plantão não podem ser alteradas.',
      'CONFLICT',
      409,
    )
  }

  if (fechamento.status === 'aprovado' || fechamento.status === 'pago') {
    throw new FinanceiroError(
      'Competência já aprovada — decisões de plantão não podem ser alteradas.',
      'CONFLICT',
      409,
    )
  }

  if (fechamento.status === 'rejeitado') {
    throw new FinanceiroError('Competência rejeitada.', 'CONFLICT', 409)
  }

  const ctx = await loadProfissionalContext(fechamento.profissional_id)
  const plantoes = await resolvePlantoesForFechamento(fechamento, ctx)
  const index = plantoes.findIndex((plantao) => plantao.id === plantaoId)

  if (index === -1) {
    throw new FinanceiroError('Plantão não encontrado nesta competência.', 'NOT_FOUND', 404)
  }

  const observacao = input.observacao?.trim() ?? ''
  if (input.decisao === 'indeferido' && observacao.length < 3) {
    throw new FinanceiroError(
      'Informe o parecer ao indeferir o plantão (mínimo 3 caracteres).',
      'INVALID_DATA',
      400,
    )
  }

  const updatedPlantoes = [...plantoes]
  updatedPlantoes[index] = {
    ...updatedPlantoes[index]!,
    decisaoAnalista: input.decisao,
    observacaoAnalista: observacao,
    decididoEm: new Date().toISOString(),
    decididoPorAdminId: adminId,
  }

  const { data: updated, error } = await supabaseAdmin
    .from('profissional_fechamento_competencia')
    .update({ plantoes_snapshot: updatedPlantoes })
    .eq('id', fechamentoId)
    .select('*')
    .single()

  if (error) throw error
  if (!updated) {
    throw new FinanceiroError('Competência não encontrada.', 'NOT_FOUND', 404)
  }

  return buildRepasseRow(updated)
}

export { mapRepasseActionToFechamentoStatus }
