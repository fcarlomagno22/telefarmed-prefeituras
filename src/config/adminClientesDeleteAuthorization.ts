/** CPF do único admin que pode excluir clientes/contratos (sessão logada + PIN). */
export const ADMIN_CLIENTES_DELETE_AUTHORIZED_CPF = '22652204858'

export function normalizeAdminCpf(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

export function canAdminDeleteClientesAndContratos(cpf: string | undefined | null): boolean {
  if (!cpf) return false
  return normalizeAdminCpf(cpf) === ADMIN_CLIENTES_DELETE_AUTHORIZED_CPF
}
