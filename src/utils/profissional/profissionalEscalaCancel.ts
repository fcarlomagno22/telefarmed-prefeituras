import type { ProfissionalEscalaDisponivel } from '../../types/profissionalEscalaDisponivel'

export function canCancelProfissionalEscalaShift(
  shift: Pick<
    ProfissionalEscalaDisponivel,
    'startAt' | 'plantaoId' | 'inscricaoId' | 'plantaoStatus'
  >,
  now = Date.now(),
): boolean {
  if (!shift.plantaoId && !shift.inscricaoId) return false
  if (shift.plantaoStatus && shift.plantaoStatus !== 'confirmado') return false
  return new Date(shift.startAt).getTime() > now
}
