import { config } from 'dotenv'
import { resolve } from 'node:path'
import { supabaseAdmin } from '../src/db/supabase.js'

config({ path: resolve(process.cwd(), '.env') })

const ENTIDADE_ID = '2c0ece8d-63d4-4750-89e3-15f26f03cac8'
const COMPETENCIA = '2026-06'
const FECHAMENTO_RECORD_ID = 'rec-2026-06-principal'

async function reopenFechamento(recordId: string) {
  const { error: deleteConsultasError } = await supabaseAdmin
    .from('faturamento_fechamento_consultas')
    .delete()
    .eq('fechamento_record_id', recordId)

  if (deleteConsultasError) throw deleteConsultasError

  const { error: deleteExclusoesError } = await supabaseAdmin
    .from('faturamento_lote_exclusoes')
    .delete()
    .eq('fechamento_record_id', recordId)

  if (deleteExclusoesError) throw deleteExclusoesError

  const { error: updateError } = await supabaseAdmin
    .from('faturamento_fechamentos')
    .update({
      status: 'em_preparacao',
      closed_at: null,
      closed_by: null,
      fechamento_id: null,
      lote_id: null,
      exported_at: null,
      consultas_no_lote: null,
      bloqueantes_registrados: null,
    })
    .eq('id', recordId)
    .eq('entidade_contratante_id', ENTIDADE_ID)

  if (updateError) throw updateError
}

async function main() {
  const recordId = process.argv[2] ?? FECHAMENTO_RECORD_ID

  const { data: record, error: findError } = await supabaseAdmin
    .from('faturamento_fechamentos')
    .select('id, competencia, status, fechamento_id')
    .eq('id', recordId)
    .eq('entidade_contratante_id', ENTIDADE_ID)
    .maybeSingle()

  if (findError) throw findError
  if (!record) {
    throw new Error(`Fechamento não encontrado: ${recordId}`)
  }

  console.log(
    `[reopen] Reabrindo ${record.id} (${record.competencia}) — status atual: ${record.status}`,
  )

  await reopenFechamento(recordId)

  console.log('[reopen] Fechamento reaberto. Status: em_preparacao')
  console.log(`  Competência: ${COMPETENCIA}`)
  console.log(`  Record ID: ${recordId}`)
  console.log('  Recarregue a aba Fechamento no navegador para fechar manualmente.')
}

main().catch((error) => {
  console.error('[reopen] Falha', error)
  process.exit(1)
})
