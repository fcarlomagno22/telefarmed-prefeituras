import { supabaseAdmin } from '../../db/supabase.js'
import { createComunicadoWithDestinatarios } from '../comunicados/create.service.js'
import { priorityFromApi } from '../comunicados/priority.js'
import { resolveUbtProfissionaisRecipients } from '../comunicados/profissionais-scope.service.js'
import type { CreateUbtBroadcastBody } from './schemas.js'

export async function createUbtBroadcast(
  context: {
    entidadeId: string
    unitId: string
    sender: { id: string; nome: string }
  },
  body: CreateUbtBroadcastBody,
): Promise<{ message: string; recipientCount: number }> {
  const { data: unit, error: unitError } = await supabaseAdmin
    .from('unidades_ubt')
    .select('id, nome')
    .eq('id', context.unitId)
    .eq('entidade_contratante_id', context.entidadeId)
    .eq('status', 'ativo')
    .maybeSingle()

  if (unitError) throw unitError
  if (!unit) {
    throw new Error('Unidade não encontrada.')
  }

  const resolved = await resolveUbtProfissionaisRecipients({
    entidadeId: context.entidadeId,
    unitId: context.unitId,
    mode: body.mode ?? 'all',
    profissionalIds: body.profissionalIds,
  })

  const unitName = String(unit.nome)

  await createComunicadoWithDestinatarios(
    {
      titulo: body.title,
      corpo: body.body,
      prioridade: priorityFromApi(body.priority),
      origem: 'ubt',
      audiencia: 'medico_all',
      entidadeContratanteId: context.entidadeId,
      unidadeUbtId: context.unitId,
      remetenteTipo: 'ubt',
      remetenteUbtId: context.sender.id,
      remetenteNome: `${unitName} · ${context.sender.nome}`,
      alvosSnapshot: {
        unitId: context.unitId,
        unitName,
        mode: body.mode ?? 'all',
        profissionalIds: body.profissionalIds ?? [],
      },
      destinatariosResumo: resolved.summary,
    },
    resolved.destinatarios,
  )

  return {
    message: 'Notificação enviada com sucesso.',
    recipientCount: resolved.destinatarios.length,
  }
}
