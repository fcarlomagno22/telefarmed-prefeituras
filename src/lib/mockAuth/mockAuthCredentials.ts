/**
 * Credenciais fixas para login offline (demonstração / frontend mockado).
 *
 * CPF: 22652204858
 * Senha: Fernando2@
 * PIN de autorização: 015419
 *
 * | Portal       | Usuário mock                          |
 * |--------------|---------------------------------------|
 * | Admin        | Marina Costa (adminInternoCredentials) |
 * | Prefeitura   | Gestor municipal (adminOperadores)     |
 * | UBT          | Juliana Silva (accessCredentials)        |
 * | Profissional | Ana Martins (profissionalLoggedProfile)  |
 */
export const MOCK_AUTH_CPF = '22652204858'
export const MOCK_AUTH_PASSWORD = 'Fernando2@'
export const MOCK_AUTH_PIN = '015419'

export const MOCK_ADMIN_CPF = MOCK_AUTH_CPF
export const MOCK_PREFEITURA_CPF = MOCK_AUTH_CPF
export const MOCK_UBT_CPF = MOCK_AUTH_CPF
export const MOCK_PROFISSIONAL_CPF = MOCK_AUTH_CPF

export function normalizeMockPin(pin: string): string {
  return pin.replace(/\D/g, '')
}

export function isValidMockAuthorizationPin(pin: string): boolean {
  return normalizeMockPin(pin) === MOCK_AUTH_PIN
}
