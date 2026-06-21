import type { Rh3ConsultaStatusWebhookPayload } from './schemas.js'

export type Rh3ConsultaStatusWebhookResult = {
  accepted: true
  idTurno: number
  idEstado: Rh3ConsultaStatusWebhookPayload['id_estado']
}

/**
 * Processa notificação de status de consulta terceirizada (RH3).
 * Persistência no domínio de consultas será ligada na próxima etapa do fluxo MT.
 */
export async function handleRh3ConsultaStatusWebhook(
  payload: Rh3ConsultaStatusWebhookPayload,
): Promise<Rh3ConsultaStatusWebhookResult> {
  return {
    accepted: true,
    idTurno: payload.id_turno,
    idEstado: payload.id_estado,
  }
}
