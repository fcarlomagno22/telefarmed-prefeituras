import { supabaseAdmin } from '../../db/supabase.js'
import { createComunicadoWithDestinatarios } from '../comunicados/create.service.js'
import { priorityFromApi } from '../comunicados/priority.js'
import { resolveRedeUnitNotifyRecipients } from '../comunicados/recipients.service.js'
import { PrefeituraRedeError } from './errors.js'
import type { NotifyUnitBody } from './schemas.js'

async function loadUnitForNotify(entidadeId: string, unitId: string) {
  const { data, error } = await supabaseAdmin
    .from('unidades_ubt')
    .select('id, nome, status')
    .eq('id', unitId)
    .eq('entidade_contratante_id', entidadeId)
    .eq('status', 'ativo')
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new PrefeituraRedeError('Unidade não encontrada.', 'NOT_FOUND', 404)
  }

  return data
}

function scopeLabel(scope: NotifyUnitBody['recipientScope'], count: number) {
  if (scope === 'responsible') {
    return `${count} responsável${count === 1 ? '' : 'is'}`
  }
  if (scope === 'operators') {
    return `${count} operador${count === 1 ? '' : 'es'}`
  }
  return `${count} destinatário${count === 1 ? '' : 's'}`
}

export async function notifyRedeUnit(
  entidadeId: string,
  unitId: string,
  body: NotifyUnitBody,
  sender: { id: string; nome: string },
): Promise<{ message: string; recipientCount: number; delivered: boolean }> {
  const unit = await loadUnitForNotify(entidadeId, unitId)
  const { destinatarios, audience, summary, count } = await resolveRedeUnitNotifyRecipients(
    entidadeId,
    unitId,
    body.recipientScope,
  )

  const title = `Comunicado — ${unit.nome}`
  const priority = body.priority ?? 'normal'

  await createComunicadoWithDestinatarios(
    {
      titulo: title,
      corpo: body.message.trim(),
      prioridade: priorityFromApi(priority),
      origem: 'contract_manager',
      audiencia: audience,
      entidadeContratanteId: entidadeId,
      unidadeUbtId: unitId,
      remetenteTipo: 'prefeitura',
      remetentePrefeituraId: sender.id,
      remetenteNome: sender.nome,
      alvosSnapshot: {
        unitId,
        unitName: unit.nome,
        recipientScope: body.recipientScope,
      },
      destinatariosResumo: scopeLabel(body.recipientScope, count) || summary,
    },
    destinatarios,
  )

  return {
    message: 'Comunicado enviado com sucesso.',
    recipientCount: count,
    delivered: true,
  }
}
