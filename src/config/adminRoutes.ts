import { portalPath } from './portalHost'

/** Rotas do painel admin (subdomínio dedicado: `/login`; local: `/admin/login`). */
export const adminRoutes = {
  get login() {
    return portalPath('admin', '/login')
  },
  get entrando() {
    return portalPath('admin', '/entrando')
  },
  get dashboard() {
    return portalPath('admin', '/dashboard')
  },
  get clientes() {
    return portalPath('admin', '/clientes')
  },
  get monitorOperacional() {
    return portalPath('admin', '/monitor-operacional')
  },
  get pacientes() {
    return portalPath('admin', '/pacientes')
  },
  get operadores() {
    return portalPath('admin', '/operadores')
  },
  get profissionais() {
    return portalPath('admin', '/profissionais')
  },
  get escala() {
    return portalPath('admin', '/escala')
  },
  get financeiro() {
    return portalPath('admin', '/financeiro')
  },
  get notificacoes() {
    return portalPath('admin', '/notificacoes')
  },
  get suporte() {
    return portalPath('admin', '/suporte')
  },
  get auditoria() {
    return portalPath('admin', '/auditoria')
  },
  get credenciais() {
    return portalPath('admin', '/credenciais')
  },
  get configuracoes() {
    return portalPath('admin', '/configuracoes')
  },
} as const
