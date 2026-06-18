/** Marca o slug como imutável após go-live (entidade ativa ou UBT publicada). */
export function slugLockedAtNow(): string {
  return new Date().toISOString()
}

export function shouldLockEntidadeSlugOnStatus(status: string): boolean {
  return status === 'ativa'
}
