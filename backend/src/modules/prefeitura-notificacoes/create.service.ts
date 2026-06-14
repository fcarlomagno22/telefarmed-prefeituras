import { createComunicadoWithDestinatarios } from '../comunicados/create.service.js'
import { priorityFromApi } from '../comunicados/priority.js'
import { resolvePrefeituraProfissionaisRecipients } from '../comunicados/profissionais-scope.service.js'
import { resolvePrefeituraBroadcastRecipients } from '../comunicados/recipients.service.js'
import type { CreatePrefeituraBroadcastBody } from './schemas.js'

export async function createPrefeituraBroadcast(
  entidadeId: string,
  sender: { id: string; nome: string },
  body: CreatePrefeituraBroadcastBody,
): Promise<{ message: string; recipientCount: number }> {
  if (body.recipientTarget === 'medico') {
    const resolved = await resolvePrefeituraProfissionaisRecipients({
      entidadeId,
      mode: body.mode,
      profissionalIds: body.profissionalIds,
    })

    await createComunicadoWithDestinatarios(
      {
        titulo: 'Comunicado enviado aos profissionais',
        corpo: body.message,
        prioridade: priorityFromApi(body.priority ?? 'normal'),
        origem: 'contract_manager',
        audiencia: 'medico_all',
        entidadeContratanteId: entidadeId,
        remetenteTipo: 'prefeitura',
        remetentePrefeituraId: sender.id,
        remetenteNome: sender.nome,
        alvosSnapshot: {
          recipientTarget: 'medico',
          mode: body.mode,
          profissionalIds: body.profissionalIds ?? [],
        },
        destinatariosResumo: resolved.summary,
      },
      resolved.destinatarios,
    )

    return {
      message: 'Comunicado enviado com sucesso.',
      recipientCount: resolved.destinatarios.length,
    }
  }

  const resolved = await resolvePrefeituraBroadcastRecipients({
    entidadeId,
    unitIds: body.unitIds,
    recipientScope: body.recipientScope,
    operatorIds: body.operatorIds,
  })

  await createComunicadoWithDestinatarios(
    {
      titulo: 'Comunicado enviado à rede',
      corpo: body.message,
      prioridade: priorityFromApi(body.priority ?? 'normal'),
      origem: 'contract_manager',
      audiencia: resolved.audience,
      entidadeContratanteId: entidadeId,
      remetenteTipo: 'prefeitura',
      remetentePrefeituraId: sender.id,
      remetenteNome: sender.nome,
      alvosSnapshot: {
        recipientTarget: 'ubt',
        unitIds: body.unitIds,
        recipientScope: body.recipientScope,
        operatorIds: body.operatorIds ?? [],
      },
      destinatariosResumo: resolved.summary,
    },
    resolved.destinatarios,
  )

  return {
    message: 'Comunicado enviado com sucesso.',
    recipientCount: resolved.destinatarios.length,
  }
}
