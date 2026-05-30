/** Rotas do portal do profissional de saúde (acessadas após `/profissional/login`). */
export const profissionalRoutes = {
  login: '/profissional/login',
  cadastro: '/profissional/cadastro',
  finalizarCadastro: '/profissional/finalizar-cadastro',
  entrando: '/profissional/entrando',
  agenda: '/profissional/agenda',
  atendimentos: '/profissional/atendimentos',
  escala: '/profissional/escala',
  financeiro: '/profissional/financeiro',
  avaliacao: '/profissional/avaliacao',
  suporte: '/profissional/suporte',
  notificacoes: '/profissional/notificacoes',
  perfil: '/profissional/perfil',
} as const
