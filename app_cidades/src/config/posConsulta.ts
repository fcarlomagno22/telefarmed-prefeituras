/** Duração do acompanhamento pós-consulta (dias). */
export const POS_CONSULTA_PLAN_TOTAL_DAYS = 14

/** Intervalo entre check-ins (dias). */
export const POS_CONSULTA_CHECKIN_INTERVAL_DAYS = 2

export function getPosConsultaTotalCheckins() {
  return Math.ceil(POS_CONSULTA_PLAN_TOTAL_DAYS / POS_CONSULTA_CHECKIN_INTERVAL_DAYS)
}
