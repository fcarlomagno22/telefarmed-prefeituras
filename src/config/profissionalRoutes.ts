import { portalPath } from './portalHost'

/** Rotas do portal profissional (subdomínio dedicado: `/login`; local: `/profissional/login`). */
export const profissionalRoutes = {
  get login() {
    return portalPath('profissional', '/login')
  },
  get cadastro() {
    return portalPath('profissional', '/cadastro')
  },
  get minhaCandidatura() {
    return portalPath('profissional', '/cadastro/minha-candidatura')
  },
  get finalizarCadastro() {
    return portalPath('profissional', '/finalizar-cadastro')
  },
  get entrando() {
    return portalPath('profissional', '/entrando')
  },
  get agenda() {
    return portalPath('profissional', '/agenda')
  },
  get atendimentos() {
    return portalPath('profissional', '/atendimentos')
  },
  get escala() {
    return portalPath('profissional', '/escala')
  },
  get financeiro() {
    return portalPath('profissional', '/financeiro')
  },
  get avaliacao() {
    return portalPath('profissional', '/avaliacao')
  },
  get suporte() {
    return portalPath('profissional', '/suporte')
  },
  get notificacoes() {
    return portalPath('profissional', '/notificacoes')
  },
  get perfil() {
    return portalPath('profissional', '/perfil')
  },
  get historicoDemo() {
    return portalPath('profissional', '/demo/historico-consultas')
  },
} as const

export function profissionalAtendimentoSessaoPath(codigo: string) {
  return portalPath('profissional', `/atendimento/${encodeURIComponent(codigo)}`)
}
