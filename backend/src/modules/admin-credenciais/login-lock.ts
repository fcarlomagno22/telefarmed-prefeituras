/** Limpa bloqueio temporário por tentativas de login inválidas. */
export function applyLoginUnlockPatch(patch: Record<string, unknown>): void {
  patch.tentativas_login_falhas = 0
  patch.bloqueado_ate = null
}
