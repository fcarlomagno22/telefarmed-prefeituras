import { portalPath } from './portalHost'

/** Rotas do portal UBT (subdomínio dedicado: `/login`; local: `/ubt/login`). */
export const ubtRoutes = {
  get login() {
    return portalPath('ubt', '/login')
  },
  get entrando() {
    return portalPath('ubt', '/entrando')
  },
  get triagem() {
    return portalPath('ubt', '/triagem')
  },
  get agenda() {
    return portalPath('ubt', '/agenda')
  },
  get consultas() {
    return portalPath('ubt', '/consultas')
  },
  get usuarios() {
    return portalPath('ubt', '/usuarios')
  },
  get notificacoes() {
    return portalPath('ubt', '/notificacoes')
  },
  get suporte() {
    return portalPath('ubt', '/suporte')
  },
  get credenciais() {
    return portalPath('ubt', '/credenciais')
  },
  get auditoria() {
    return portalPath('ubt', '/auditoria')
  },
  get salaDeEspera() {
    return portalPath('ubt', '/sala-de-espera')
  },
} as const

export function ubtAtendimentoPath(codigo: string) {
  return portalPath('ubt', `/atendimento/${encodeURIComponent(codigo)}`)
}

export function ubtAtendimentoAvaliacaoPath(codigo: string) {
  return portalPath('ubt', `/atendimento/${encodeURIComponent(codigo)}/avaliacao`)
}

export function ubtAcompanhamentoPath(checkinToken: string) {
  return portalPath('ubt', `/acompanhamento/${encodeURIComponent(checkinToken)}`)
}
