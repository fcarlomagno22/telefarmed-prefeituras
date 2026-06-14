import { randomUUID } from 'node:crypto'
import { supabaseAdmin } from '../../db/supabase.js'
import { isMissingSupabaseResource } from '../../lib/supabaseErrors.js'
import { validatePixKey, type PixKeyType } from '../profissional-cadastro/pix.validation.js'
import { updateProfissionalDadosPagamento } from './dados-pagamento.service.js'
import { ProfissionalFinanceiroError } from './errors.js'
import { formatFechamentoApi } from './formatters.js'
import { getProfissionalRepasseDetail } from './repasses.service.js'
import type { ProfissionalFinanceiroContext } from './types.js'

const INVOICE_BUCKET = 'profissional-notas-fiscais'
const MAX_INVOICE_BYTES = 8 * 1024 * 1024
const ALLOWED_INVOICE_MIMES = new Set([
  'application/pdf',
  'text/xml',
  'application/xml',
])

function normalizePixTipo(value: string): PixKeyType {
  if (value === 'email' || value === 'telefone' || value === 'aleatoria') return value
  return 'cnpj'
}

function sanitizeFileName(name: string): string {
  return name.replace(/[/\\]/g, '').replace(/\.\./g, '').trim().slice(0, 120) || 'nota-fiscal.pdf'
}

export async function submitProfissionalFechamento(
  ctx: ProfissionalFinanceiroContext,
  competencia: string,
  input: {
    pixTipo: string
    pixChave: string
    invoice: { buffer: Buffer; mimeType: string; fileName: string }
  },
) {
  if (!ALLOWED_INVOICE_MIMES.has(input.invoice.mimeType)) {
    throw new ProfissionalFinanceiroError(
      'Formato de nota fiscal inválido. Use PDF ou XML.',
      'INVALID_DATA',
      400,
    )
  }

  if (input.invoice.buffer.length > MAX_INVOICE_BYTES) {
    throw new ProfissionalFinanceiroError(
      'Arquivo muito grande. Máximo 8 MB.',
      'INVALID_DATA',
      400,
    )
  }

  const pixTipo = normalizePixTipo(input.pixTipo)
  const pixChave = validatePixKey(pixTipo, input.pixChave)

  const detail = await getProfissionalRepasseDetail(ctx, competencia)
  if (detail.status === 'pago' || detail.status === 'processando') {
    throw new ProfissionalFinanceiroError(
      'Esta competência já foi enviada para análise.',
      'CONFLICT',
      409,
    )
  }

  await updateProfissionalDadosPagamento(ctx, {
    pixTipo,
    pixChave,
  })

  const safeName = sanitizeFileName(input.invoice.fileName)
  const storagePath = `${ctx.profissionalId}/${competencia}/${randomUUID()}-${safeName}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from(INVOICE_BUCKET)
    .upload(storagePath, input.invoice.buffer, {
      contentType: input.invoice.mimeType,
      upsert: false,
    })

  if (uploadError) {
    if (String(uploadError.message).includes('Bucket not found')) {
      throw new ProfissionalFinanceiroError(
        'Armazenamento de notas fiscais indisponível. Configure o bucket profissional-notas-fiscais.',
        'SERVICE_UNAVAILABLE',
        503,
      )
    }
    throw uploadError
  }

  const submittedAt = new Date().toISOString()

  const { data: fechamento, error: fechamentoError } = await supabaseAdmin
    .from('profissional_fechamento_competencia')
    .upsert(
      {
        profissional_id: ctx.profissionalId,
        competencia,
        status: 'em_analise',
        invoice_file_name: safeName,
        invoice_storage_path: storagePath,
        invoice_mime_type: input.invoice.mimeType,
        pix_tipo: pixTipo,
        pix_chave: pixChave,
        submitted_at: submittedAt,
        rejection_reason: '',
      },
      { onConflict: 'profissional_id,competencia' },
    )
    .select('*')
    .single()

  if (fechamentoError) {
    await supabaseAdmin.storage.from(INVOICE_BUCKET).remove([storagePath])
    if (isMissingSupabaseResource(fechamentoError, 'profissional_fechamento_competencia')) {
      throw new ProfissionalFinanceiroError(
        'Módulo de fechamento indisponível.',
        'SERVICE_UNAVAILABLE',
        503,
      )
    }
    throw fechamentoError
  }

  await supabaseAdmin
    .from('profissional_repasse_competencia')
    .update({ status: 'processando' })
    .eq('profissional_id', ctx.profissionalId)
    .eq('competencia', competencia)

  return formatFechamentoApi(fechamento)
}

export async function getProfissionalFechamento(
  ctx: ProfissionalFinanceiroContext,
  competencia: string,
) {
  const { data, error } = await supabaseAdmin
    .from('profissional_fechamento_competencia')
    .select('*')
    .eq('profissional_id', ctx.profissionalId)
    .eq('competencia', competencia)
    .maybeSingle()

  if (error) {
    if (isMissingSupabaseResource(error, 'profissional_fechamento_competencia')) return null
    throw error
  }

  return formatFechamentoApi(data)
}
