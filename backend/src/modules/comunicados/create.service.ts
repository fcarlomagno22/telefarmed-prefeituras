import { supabaseAdmin } from '../../db/supabase.js'
import { ComunicadosError } from './errors.js'
import type { ComunicadoInsertPayload, DestinatarioInsert } from './types.js'

const DESTINATARIO_BATCH_SIZE = 500

function dedupeDestinatarios(destinatarios: DestinatarioInsert[]): DestinatarioInsert[] {
  const seen = new Set<string>()
  const result: DestinatarioInsert[] = []

  for (const item of destinatarios) {
    const key =
      item.tipo === 'usuario_prefeitura'
        ? `pref:${item.usuarioPrefeituraId}`
        : item.tipo === 'usuario_ubt'
          ? `ubt:${item.usuarioUbtId}`
          : `pro:${item.profissionalId}`

    if (seen.has(key)) continue
    seen.add(key)
    result.push(item)
  }

  return result
}

export async function createComunicadoWithDestinatarios(
  payload: ComunicadoInsertPayload,
  destinatariosInput: DestinatarioInsert[],
): Promise<{ id: string; recipientCount: number }> {
  const destinatarios = dedupeDestinatarios(destinatariosInput)

  if (destinatarios.length === 0) {
    throw new ComunicadosError(
      'Nenhum destinatário válido encontrado para este comunicado.',
      'NO_RECIPIENTS',
      400,
    )
  }

  const { data: comunicado, error: insertError } = await supabaseAdmin
    .from('comunicados')
    .insert({
      titulo: payload.titulo.trim(),
      corpo: payload.corpo.trim(),
      prioridade: payload.prioridade,
      origem: payload.origem,
      audiencia: payload.audiencia,
      entidade_contratante_id: payload.entidadeContratanteId ?? null,
      unidade_ubt_id: payload.unidadeUbtId ?? null,
      remetente_tipo: payload.remetenteTipo,
      remetente_admin_id: payload.remetenteAdminId ?? null,
      remetente_prefeitura_id: payload.remetentePrefeituraId ?? null,
      remetente_ubt_id: payload.remetenteUbtId ?? null,
      remetente_profissional_id: payload.remetenteProfissionalId ?? null,
      remetente_nome: payload.remetenteNome,
      especialidade_filtro: payload.especialidadeFiltro ?? null,
      alvos_snapshot: payload.alvosSnapshot,
      destinatarios_resumo: payload.destinatariosResumo,
      total_destinatarios: destinatarios.length,
    })
    .select('id')
    .single()

  if (insertError) throw insertError
  if (!comunicado) {
    throw new ComunicadosError('Não foi possível registrar o comunicado.', 'CREATE_FAILED', 500)
  }

  const comunicadoId = String(comunicado.id)

  for (let offset = 0; offset < destinatarios.length; offset += DESTINATARIO_BATCH_SIZE) {
    const batch = destinatarios.slice(offset, offset + DESTINATARIO_BATCH_SIZE).map((item) => ({
      comunicado_id: comunicadoId,
      tipo: item.tipo,
      usuario_prefeitura_id: item.usuarioPrefeituraId ?? null,
      usuario_ubt_id: item.usuarioUbtId ?? null,
      profissional_id: item.profissionalId ?? null,
      unidade_ubt_id: item.unidadeUbtId ?? null,
      rotulo_destinatario: item.rotuloDestinatario,
    }))

    const { error: destError } = await supabaseAdmin.from('comunicado_destinatarios').insert(batch)
    if (destError) throw destError
  }

  return { id: comunicadoId, recipientCount: destinatarios.length }
}
