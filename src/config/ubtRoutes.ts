/** Rotas do portal UBT (acessadas após `/ubt/login`). */
export const ubtRoutes = {
  login: '/ubt/login',
  entrando: '/ubt/entrando',
  triagem: '/ubt/triagem',
  agenda: '/ubt/agenda',
  consultas: '/ubt/consultas',
  usuarios: '/ubt/usuarios',
  relatorios: '/ubt/relatorios',
  notificacoes: '/ubt/notificacoes',
  suporte: '/ubt/suporte',
  credenciais: '/ubt/credenciais',
  auditoria: '/ubt/auditoria',
} as const

export function ubtRelatoriosCategoryPath(categoryId: string) {
  return `${ubtRoutes.relatorios}/${categoryId}`
}
