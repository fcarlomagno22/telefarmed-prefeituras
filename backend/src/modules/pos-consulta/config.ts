/** Duração do plano pós-consulta (dias corridos). */
export const POS_CONSULTA_PLAN_TOTAL_DAYS = 14

/** Intervalo entre check-ins agendados (dias). */
export const POS_CONSULTA_CHECKIN_INTERVAL_DAYS = 2

/** Validade do link único após envio do e-mail (horas). */
export const POS_CONSULTA_TOKEN_TTL_HOURS = 48

/** Máximo de reenvios automáticos após expiração do token. */
export const POS_CONSULTA_MAX_TOKEN_REENVIOS = 1

export const POS_CONSULTA_TIMEZONE = 'America/Sao_Paulo'

export function getPosConsultaTotalCheckins(): number {
  return Math.ceil(POS_CONSULTA_PLAN_TOTAL_DAYS / POS_CONSULTA_CHECKIN_INTERVAL_DAYS)
}

export function posConsultaCheckinDayNumber(numeroCheckin: number): number {
  return numeroCheckin * POS_CONSULTA_CHECKIN_INTERVAL_DAYS
}
