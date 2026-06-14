import { randomUUID } from 'node:crypto'
import { verifyAdminAuthorizationPin } from '../admin-auth/service.js'
import { supabaseAdmin } from '../../db/supabase.js'
import { competenciaLabelToMonthKey, formatFechamento } from './formatters.js'
import { FinanceiroError } from './errors.js'
import type { FechamentoCompetenciaDto, NotaFiscalDto } from './types.js'
import type { listFechamentosQuerySchema } from './schemas.js'
import type { z } from 'zod'

const NF_BUCKET = 'notas-fiscais-fechamento'

type FechamentosQuery = z.infer<typeof listFechamentosQuerySchema>

const FECHAMENTO_SELECT = `
  *,
  contratos_entidade (
    numero,
    tipo,
    consultas_contratadas,
    consultas_realizadas,
    percentual_utilizado,
    permite_ultrapassar,
    entidades_contratantes (
      nome_exibicao,
      razao_social
    )
  ),
  notas_fiscais_fechamento (
    numero,
    status,
    emitida_em,
    storage_path
  )
`

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1)
}

function isoMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function addDaysIso(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

async function loadContratoPrecoMedio(contratoId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from('contrato_entidade_precos_profissao')
    .select('valor_consulta_centavos')
    .eq('contrato_id', contratoId)
    .eq('tipo', 'contratado')

  const valores = (data ?? []).map((r) => Number(r.valor_consulta_centavos)).filter((v) => v > 0)
  if (valores.length === 0) return 9200
  return Math.round(valores.reduce((a, b) => a + b, 0) / valores.length)
}

function computeFechamentoValores(contrato: {
  tipo: string
  consultas_contratadas: number | null
  consultas_realizadas: number
  percentual_utilizado: number | string | null
  permite_ultrapassar: boolean
}, precoMedioCentavos: number) {
  const pct =
    contrato.percentual_utilizado != null ? Number(contrato.percentual_utilizado) : null
  const excedeu =
    pct != null
      ? pct > 100
      : (contrato.consultas_realizadas ?? 0) > (contrato.consultas_contratadas ?? Number.MAX_SAFE_INTEGER)

  let valorBase = 0
  let valorExcedente = 0

  if (contrato.tipo === 'mensal') {
    valorBase = 18_500_000
  } else if (contrato.tipo === 'pacote_fechado') {
    const qtd = contrato.consultas_contratadas ?? 2000
    valorBase = qtd * precoMedioCentavos
    if (excedeu && contrato.permite_ultrapassar) {
      const excedenteQtd = Math.max(0, contrato.consultas_realizadas - qtd)
      valorExcedente = excedenteQtd * precoMedioCentavos
    }
  } else {
    valorBase = contrato.consultas_realizadas * precoMedioCentavos
  }

  const ajustes = 0
  const valorFinal = valorBase + valorExcedente + ajustes

  return {
    consumo_percentual: pct,
    excedeu_limite: excedeu,
    valor_base_centavos: valorBase,
    valor_excedente_centavos: valorExcedente,
    ajustes_centavos: ajustes,
    valor_final_centavos: valorFinal,
  }
}

/** Garante fechamentos dos últimos 3 meses para contratos ativos (idempotente). */
export async function ensureFechamentosFromContratos(): Promise<void> {
  const { data: contratos, error } = await supabaseAdmin
    .from('contratos_entidade')
    .select('id, tipo, status, consultas_contratadas, consultas_realizadas, percentual_utilizado, permite_ultrapassar')
    .in('status', ['ativo', 'implantacao'])

  if (error) throw error
  if (!contratos?.length) return

  const now = new Date()
  const months = [addMonths(now, 0), addMonths(now, -1), addMonths(now, -2)]

  for (const contrato of contratos) {
    const precoMedio = await loadContratoPrecoMedio(contrato.id)
    const valores = computeFechamentoValores(contrato, precoMedio)

    for (const monthDate of months) {
      const competenciaMes = isoMonth(monthDate)
      const vencimento = addDaysIso(competenciaMes, 9)

      const { data: existing } = await supabaseAdmin
        .from('fechamentos_competencia')
        .select('id, status')
        .eq('contrato_id', contrato.id)
        .eq('competencia_mes', competenciaMes)
        .maybeSingle()

      if (existing) {
        if (existing.status === 'aberto') {
          await supabaseAdmin
            .from('fechamentos_competencia')
            .update({
              ...valores,
              vencimento,
            })
            .eq('id', existing.id)
        }
        continue
      }

      await supabaseAdmin.from('fechamentos_competencia').insert({
        contrato_id: contrato.id,
        competencia_mes: competenciaMes,
        ...valores,
        status: 'aberto',
        vencimento,
        status_vencimento: 'a_vencer',
      })
    }
  }
}

export async function listFechamentos(
  params: FechamentosQuery,
): Promise<FechamentoCompetenciaDto[]> {
  await ensureFechamentosFromContratos()

  const { data, error } = await supabaseAdmin
    .from('fechamentos_competencia')
    .select(FECHAMENTO_SELECT)
    .order('competencia_mes', { ascending: false })
    .limit(500)

  if (error) throw error

  let rows = data ?? []

  const search = params.search?.trim().toLowerCase()
  if (search) {
    rows = rows.filter((row) => {
      const formatted = formatFechamento(row)
      return [formatted.prefeitura, formatted.contratoNumero, formatted.competencia].some((v) =>
        v.toLowerCase().includes(search),
      )
    })
  }

  if (params.status && params.status !== 'all') {
    rows = rows.filter((r) => r.status === params.status)
  }

  if (params.modalidade && params.modalidade !== 'all') {
    rows = rows.filter((r) => r.contratos_entidade?.tipo === params.modalidade)
  }

  if (params.competencia && params.competencia !== 'all') {
    const monthKey = competenciaLabelToMonthKey(params.competencia)
    if (monthKey) {
      rows = rows.filter((r) => String(r.competencia_mes).startsWith(monthKey.slice(0, 7)))
    }
  }

  return rows.map((row) => formatFechamento(row))
}

export async function closeFechamento(
  adminId: string,
  fechamentoId: string,
): Promise<FechamentoCompetenciaDto> {
  const { data: existing, error: findError } = await supabaseAdmin
    .from('fechamentos_competencia')
    .select('status')
    .eq('id', fechamentoId)
    .maybeSingle()

  if (findError) throw findError
  if (!existing) throw new FinanceiroError('Fechamento não encontrado.', 'NOT_FOUND', 404)
  if (existing.status === 'fechado') {
    throw new FinanceiroError('Competência já está fechada.', 'ALREADY_CLOSED', 409)
  }

  const { data, error } = await supabaseAdmin
    .from('fechamentos_competencia')
    .update({
      status: 'fechado',
      fechado_em: new Date().toISOString(),
      fechado_por_admin_id: adminId,
    })
    .eq('id', fechamentoId)
    .select(FECHAMENTO_SELECT)
    .single()

  if (error) throw error
  if (!data) throw new FinanceiroError('Fechamento não encontrado.', 'NOT_FOUND', 404)
  return formatFechamento(data)
}

export async function toggleReceberPagamento(
  adminId: string,
  fechamentoId: string,
  pin: string,
): Promise<FechamentoCompetenciaDto> {
  await verifyAdminAuthorizationPin(adminId, pin)

  const { data: existing, error: findError } = await supabaseAdmin
    .from('fechamentos_competencia')
    .select('status_vencimento, status')
    .eq('id', fechamentoId)
    .maybeSingle()

  if (findError) throw findError
  if (!existing) throw new FinanceiroError('Recebível não encontrado.', 'NOT_FOUND', 404)
  if (existing.status !== 'fechado') {
    throw new FinanceiroError('Somente títulos fechados podem ter pagamento alterado.', 'INVALID_DATA', 400)
  }

  const next =
    existing.status_vencimento === 'paga' ? 'a_vencer' : ('paga' as const)

  const { data, error } = await supabaseAdmin
    .from('fechamentos_competencia')
    .update({ status_vencimento: next })
    .eq('id', fechamentoId)
    .select(FECHAMENTO_SELECT)
    .single()

  if (error) throw error
  if (!data) throw new FinanceiroError('Recebível não encontrado.', 'NOT_FOUND', 404)
  return formatFechamento(data)
}

export async function deleteReceber(
  adminId: string,
  fechamentoId: string,
  pin: string,
): Promise<void> {
  await verifyAdminAuthorizationPin(adminId, pin)

  const { error } = await supabaseAdmin
    .from('fechamentos_competencia')
    .delete()
    .eq('id', fechamentoId)

  if (error) throw error
}

export async function emitNotaFiscal(
  adminId: string,
  fechamentoId: string,
): Promise<NotaFiscalDto> {
  const { data: fechamento, error: findError } = await supabaseAdmin
    .from('fechamentos_competencia')
    .select('id, status')
    .eq('id', fechamentoId)
    .maybeSingle()

  if (findError) throw findError
  if (!fechamento) throw new FinanceiroError('Fechamento não encontrado.', 'NOT_FOUND', 404)
  if (fechamento.status !== 'fechado') {
    throw new FinanceiroError('Emita NF apenas após fechar a competência.', 'INVALID_DATA', 400)
  }

  const invoiceNumber = `NF-${fechamentoId.slice(0, 8).toUpperCase()}`
  const storagePath = `${fechamentoId}/${randomUUID()}.pdf`

  const placeholderPdf = Buffer.from(
    `%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n`,
  )

  const { error: uploadError } = await supabaseAdmin.storage
    .from(NF_BUCKET)
    .upload(storagePath, placeholderPdf, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (uploadError) {
    throw new FinanceiroError('Falha ao gerar arquivo de NF.', 'INVALID_DATA', 500)
  }

  const issuedAt = new Date().toISOString()

  await supabaseAdmin.from('notas_fiscais_fechamento').upsert(
    {
      fechamento_id: fechamentoId,
      numero: invoiceNumber,
      status: 'issued',
      emitida_em: issuedAt,
      storage_path: storagePath,
      emitida_por_admin_id: adminId,
      mime_type: 'application/pdf',
      tamanho_bytes: placeholderPdf.length,
    },
    { onConflict: 'fechamento_id' },
  )

  const downloadUrl = await getNotaFiscalDownloadUrl(fechamentoId)

  return {
    status: 'issued',
    invoiceNumber,
    issuedAt,
    downloadUrl,
  }
}

export async function getNotaFiscalDownloadUrl(fechamentoId: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('notas_fiscais_fechamento')
    .select('storage_path, status')
    .eq('fechamento_id', fechamentoId)
    .maybeSingle()

  if (error) throw error
  if (!data?.storage_path) {
    throw new FinanceiroError('Nota fiscal não encontrada.', 'NOT_FOUND', 404)
  }

  const { data: signed, error: signError } = await supabaseAdmin.storage
    .from(NF_BUCKET)
    .createSignedUrl(data.storage_path, 3600)

  if (signError || !signed?.signedUrl) {
    throw new FinanceiroError('Não foi possível gerar link de download.', 'INVALID_DATA', 500)
  }

  return signed.signedUrl
}
