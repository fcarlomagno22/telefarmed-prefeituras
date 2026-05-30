/** Avaliações com menos de 4 estrelas são consideradas críticas. */
export const PROFISSIONAL_CRITICAL_RATING_MAX = 3

export function isProfissionalCriticalRating(rating: number) {
  return rating < 4
}
