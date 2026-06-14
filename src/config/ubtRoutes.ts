/** Rotas do portal UBT (acessadas após `/ubt/login`). */
export const ubtRoutes = {
  login: '/ubt/login',
  entrando: '/ubt/entrando',
  triagem: '/ubt/triagem',
  agenda: '/ubt/agenda',
  consultas: '/ubt/consultas',
  usuarios: '/ubt/usuarios',
  notificacoes: '/ubt/notificacoes',
  suporte: '/ubt/suporte',
  credenciais: '/ubt/credenciais',
  auditoria: '/ubt/auditoria',
  salaDeEspera: '/ubt/sala-de-espera',
} as const

export function ubtAtendimentoPath(codigo: string) {
  return `/ubt/atendimento/${encodeURIComponent(codigo)}`
}

export function ubtAtendimentoAvaliacaoPath(codigo: string) {
  return `/ubt/atendimento/${encodeURIComponent(codigo)}/avaliacao`
}
