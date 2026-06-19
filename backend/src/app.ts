import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { env, isProduction } from './config/env.js'
import { registerAdminAuthRoutes } from './modules/admin-auth/routes.js'
import {
  registerAdminConfiguracoesRoutes,
  registerPublicConfiguracoesRoutes,
} from './modules/admin-configuracoes/routes.js'
import { registerAdminCredenciaisRoutes } from './modules/admin-credenciais/routes.js'
import { registerAdminClientesRoutes } from './modules/admin-clientes/routes.js'
import { registerAdminPacientesRoutes } from './modules/admin-pacientes/routes.js'
import { registerAdminProfissionaisRoutes } from './modules/admin-profissionais/routes.js'
import { registerAdminEscalaRoutes } from './modules/admin-escala/routes.js'
import { registerAdminFinanceiroRoutes } from './modules/admin-financeiro/routes.js'
import { registerPrefeituraAuthRoutes } from './modules/prefeitura-auth/routes.js'
import { registerPrefeituraRedeRoutes } from './modules/prefeitura-rede/routes.js'
import { registerPrefeituraDashboardRoutes } from './modules/prefeitura-dashboard/routes.js'
import { registerPrefeituraMonitorRoutes } from './modules/prefeitura-monitor/routes.js'
import { registerPrefeituraConsultasRoutes } from './modules/prefeitura-consultas/routes.js'
import { registerPrefeituraRelatoriosRoutes } from './modules/prefeitura-relatorios/routes.js'
import { registerPrefeituraAgendasRoutes } from './modules/prefeitura-agendas/routes.js'
import { registerPrefeituraContratoRoutes } from './modules/prefeitura-contrato/routes.js'
import { registerPrefeituraCredenciaisRoutes } from './modules/prefeitura-credenciais/routes.js'
import { registerPrefeituraPacientesRoutes } from './modules/prefeitura-pacientes/routes.js'
import { registerUbtAuthRoutes } from './modules/ubt-auth/routes.js'
import { registerUbtPacientesRoutes } from './modules/ubt-pacientes/routes.js'
import { registerUbtAgendaRoutes } from './modules/ubt-agenda/routes.js'
import { registerUbtTriagemRoutes } from './modules/ubt-triagem/routes.js'
import { registerUbtConsultasRoutes } from './modules/ubt-consultas/routes.js'
import { registerUbtCredenciaisRoutes } from './modules/ubt-credenciais/routes.js'
import { registerProfissionalAuthRoutes } from './modules/profissional-auth/routes.js'
import { registerProfissionalCadastroRoutes } from './modules/profissional-cadastro/routes.js'
import { registerProfissionalAgendaRoutes } from './modules/profissional-agenda/routes.js'
import { registerProfissionalFinanceiroRoutes } from './modules/profissional-financeiro/routes.js'
import { registerProfissionalAtendimentosRoutes } from './modules/profissional-atendimentos/routes.js'
import { registerProfissionalAvaliacaoRoutes } from './modules/profissional-avaliacao/routes.js'
import { registerProfissionalEscalaRoutes } from './modules/profissional-escala/routes.js'
import { registerProfissionalNotificacoesRoutes } from './modules/profissional-notificacoes/routes.js'
import { registerProfissionalPerfilRoutes } from './modules/profissional-perfil/routes.js'
import { registerAdminNotificacoesRoutes } from './modules/admin-notificacoes/routes.js'
import { registerAdminSuporteRoutes } from './modules/admin-suporte/routes.js'
import { registerPrefeituraNotificacoesRoutes } from './modules/prefeitura-notificacoes/routes.js'
import { registerPrefeituraSuporteRoutes } from './modules/prefeitura-suporte/routes.js'
import { registerUbtNotificacoesRoutes } from './modules/ubt-notificacoes/routes.js'
import { registerUbtSuporteRoutes } from './modules/ubt-suporte/routes.js'
import { registerProfissionalSuporteRoutes } from './modules/profissional-suporte/routes.js'
import { registerPublicAtendimentoRoutes } from './modules/public-atendimento/routes.js'
import { registerPublicLiveShareRoutes } from './modules/public-live-share/routes.js'
import { registerPublicPlantaoAceiteRoutes } from './modules/public-plantao-aceite/routes.js'
import { registerAuditoriaMiddleware } from './lib/auditoria/middleware.js'
import { registerAdminAuditoriaRoutes } from './modules/admin-auditoria/routes.js'
import { registerAdminMonitorRoutes } from './modules/admin-monitor/routes.js'
import { registerAdminDashboardRoutes } from './modules/admin-dashboard/routes.js'
import { registerPrefeituraAuditoriaRoutes } from './modules/prefeitura-auditoria/routes.js'
import { registerUbtAuditoriaRoutes } from './modules/ubt-auditoria/routes.js'
import { registerProfissionalAuditoriaRoutes } from './modules/profissional-auditoria/routes.js'
import {
  registerAdminPosConsultaDashboardRoutes,
  registerPrefeituraPosConsultaDashboardRoutes,
  registerProfissionalPosConsultaRoutes,
  registerPublicPosConsultaRoutes,
} from './modules/pos-consulta/routes.js'
import { registerInternalCronRoutes } from './modules/internal-cron/routes.js'
import { registerPublicTenantRoutes } from './modules/public-tenant/routes.js'
import { registerPublicDemoRoutes } from './modules/public-demo/routes.js'
import { registerIcdReferenceRoutes } from './modules/icd-reference/routes.js'
import { resolveCorsOrigin } from './lib/corsOrigins.js'

export async function buildApp() {
  const app = Fastify({
    logger: !isProduction,
    trustProxy: true,
    // Selfie em base64 no JSON de finalizar cadastro; padrão Fastify (1 MB) é insuficiente.
    bodyLimit: 6 * 1024 * 1024,
  })

  // refresh/logout usam cookie sem body JSON
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
    if (body === '' || body == null) {
      done(null, {})
      return
    }
    try {
      const raw = typeof body === 'string' ? body : body.toString()
      done(null, JSON.parse(raw) as Record<string, unknown>)
    } catch (error) {
      done(error as Error, undefined)
    }
  })

  await app.register(helmet, {
    contentSecurityPolicy: false,
  })

  await app.register(cors, {
    origin: resolveCorsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  await app.register(cookie, {
    secret: env.JWT_REFRESH_SECRET,
    hook: 'onRequest',
  })

  await app.register(rateLimit, {
    global: true,
    max: 200,
    timeWindow: '1 minute',
  })

  app.get('/health', async () => ({ ok: true }))

  await app.register(
    async (internalCron) => {
      await registerInternalCronRoutes(internalCron)
    },
    { prefix: '/api/v1/internal/cron' },
  )

  await app.register(
    async (adminAuth) => {
      await registerAdminAuthRoutes(adminAuth)
    },
    { prefix: '/api/v1/admin/auth' },
  )

  await app.register(
    async (prefeituraAuth) => {
      await registerPrefeituraAuthRoutes(prefeituraAuth)
    },
    { prefix: '/api/v1/prefeitura/auth' },
  )

  await app.register(
    async (ubtAuth) => {
      await registerUbtAuthRoutes(ubtAuth)
    },
    { prefix: '/api/v1/ubt/auth' },
  )

  await app.register(
    async (ubtPacientes) => {
      await registerUbtPacientesRoutes(ubtPacientes)
    },
    { prefix: '/api/v1/ubt/pacientes' },
  )

  await app.register(
    async (ubtAgenda) => {
      await registerUbtAgendaRoutes(ubtAgenda)
    },
    { prefix: '/api/v1/ubt/agenda' },
  )

  await app.register(
    async (ubtTriagem) => {
      await registerUbtTriagemRoutes(ubtTriagem)
    },
    { prefix: '/api/v1/ubt/triagem' },
  )

  await app.register(
    async (ubtConsultas) => {
      await registerUbtConsultasRoutes(ubtConsultas)
    },
    { prefix: '/api/v1/ubt/consultas' },
  )

  await app.register(
    async (ubtCredenciais) => {
      await registerUbtCredenciaisRoutes(ubtCredenciais)
    },
    { prefix: '/api/v1/ubt/credenciais' },
  )

  await app.register(
    async (prefeituraRede) => {
      await registerPrefeituraRedeRoutes(prefeituraRede)
    },
    { prefix: '/api/v1/prefeitura/rede' },
  )

  await app.register(
    async (prefeituraDashboard) => {
      await registerPrefeituraDashboardRoutes(prefeituraDashboard)
      await registerPrefeituraPosConsultaDashboardRoutes(prefeituraDashboard)
    },
    { prefix: '/api/v1/prefeitura/dashboard' },
  )

  await app.register(
    async (prefeituraMonitor) => {
      await registerPrefeituraMonitorRoutes(prefeituraMonitor)
    },
    { prefix: '/api/v1/prefeitura/monitor' },
  )

  await app.register(
    async (prefeituraConsultas) => {
      await registerPrefeituraConsultasRoutes(prefeituraConsultas)
    },
    { prefix: '/api/v1/prefeitura/consultas' },
  )

  await app.register(
    async (prefeituraRelatorios) => {
      await registerPrefeituraRelatoriosRoutes(prefeituraRelatorios)
    },
    { prefix: '/api/v1/prefeitura/relatorios' },
  )

  await app.register(
    async (prefeituraAgendas) => {
      await registerPrefeituraAgendasRoutes(prefeituraAgendas)
    },
    { prefix: '/api/v1/prefeitura/agendas' },
  )

  await app.register(
    async (prefeituraContrato) => {
      await registerPrefeituraContratoRoutes(prefeituraContrato)
    },
    { prefix: '/api/v1/prefeitura/contrato' },
  )

  await app.register(
    async (prefeituraCredenciais) => {
      await registerPrefeituraCredenciaisRoutes(prefeituraCredenciais)
    },
    { prefix: '/api/v1/prefeitura/credenciais' },
  )

  await app.register(
    async (prefeituraPacientes) => {
      await registerPrefeituraPacientesRoutes(prefeituraPacientes)
    },
    { prefix: '/api/v1/prefeitura/pacientes' },
  )

  await app.register(
    async (adminCredenciais) => {
      await registerAdminCredenciaisRoutes(adminCredenciais)
    },
    { prefix: '/api/v1/admin/credenciais' },
  )

  await app.register(
    async (adminClientes) => {
      await registerAdminClientesRoutes(adminClientes)
    },
    { prefix: '/api/v1/admin/clientes' },
  )

  await app.register(
    async (adminPacientes) => {
      await registerAdminPacientesRoutes(adminPacientes)
    },
    { prefix: '/api/v1/admin/pacientes' },
  )

  await app.register(
    async (adminProfissionais) => {
      await registerAdminProfissionaisRoutes(adminProfissionais)
    },
    { prefix: '/api/v1/admin/profissionais' },
  )

  await app.register(
    async (adminEscala) => {
      await registerAdminEscalaRoutes(adminEscala)
    },
    { prefix: '/api/v1/admin/escala' },
  )

  await app.register(
    async (adminFinanceiro) => {
      await registerAdminFinanceiroRoutes(adminFinanceiro)
    },
    { prefix: '/api/v1/admin/financeiro' },
  )

  await app.register(
    async (publicTenant) => {
      await registerPublicTenantRoutes(publicTenant)
    },
    { prefix: '/api/v1/public' },
  )

  await app.register(
    async (publicConfiguracoes) => {
      await registerPublicConfiguracoesRoutes(publicConfiguracoes)
    },
    { prefix: '/api/v1/configuracoes' },
  )

  await app.register(
    async (publicAtendimento) => {
      await registerPublicAtendimentoRoutes(publicAtendimento)
    },
    { prefix: '/api/v1/atendimento' },
  )

  await app.register(
    async (publicPlantaoAceite) => {
      await registerPublicPlantaoAceiteRoutes(publicPlantaoAceite)
    },
    { prefix: '/api/v1/public/plantao-aceite' },
  )

  await app.register(
    async (publicLiveShare) => {
      await registerPublicLiveShareRoutes(publicLiveShare)
    },
    { prefix: '/api/v1/public/live-share' },
  )

  await app.register(
    async (publicDemo) => {
      await registerPublicDemoRoutes(publicDemo)
    },
    { prefix: '/api/v1/public/demo' },
  )

  await app.register(
    async (icdReference) => {
      await registerIcdReferenceRoutes(icdReference)
    },
    { prefix: '/api/v1/reference/icd' },
  )

  await app.register(
    async (publicPosConsulta) => {
      await registerPublicPosConsultaRoutes(publicPosConsulta)
    },
    { prefix: '/api/v1/public/pos-consulta' },
  )

  await app.register(
    async (profissionalAuth) => {
      await registerProfissionalAuthRoutes(profissionalAuth)
    },
    { prefix: '/api/v1/profissional/auth' },
  )

  await app.register(
    async (profissionalCadastro) => {
      await registerProfissionalCadastroRoutes(profissionalCadastro)
    },
    { prefix: '/api/v1/profissional/cadastro' },
  )

  await app.register(
    async (profissionalEscala) => {
      await registerProfissionalEscalaRoutes(profissionalEscala)
    },
    { prefix: '/api/v1/profissional/escala' },
  )

  await app.register(
    async (profissionalAgenda) => {
      await registerProfissionalAgendaRoutes(profissionalAgenda)
    },
    { prefix: '/api/v1/profissional/agenda' },
  )

  await app.register(
    async (profissionalAtendimentos) => {
      await registerProfissionalAtendimentosRoutes(profissionalAtendimentos)
    },
    { prefix: '/api/v1/profissional/atendimentos' },
  )

  await app.register(
    async (profissionalPosConsulta) => {
      await registerProfissionalPosConsultaRoutes(profissionalPosConsulta)
    },
    { prefix: '/api/v1/profissional/pos-consulta' },
  )

  await app.register(
    async (profissionalAvaliacao) => {
      await registerProfissionalAvaliacaoRoutes(profissionalAvaliacao)
    },
    { prefix: '/api/v1/profissional/avaliacao' },
  )

  await app.register(
    async (profissionalNotificacoes) => {
      await registerProfissionalNotificacoesRoutes(profissionalNotificacoes)
    },
    { prefix: '/api/v1/profissional/notificacoes' },
  )

  await app.register(
    async (adminNotificacoes) => {
      await registerAdminNotificacoesRoutes(adminNotificacoes)
    },
    { prefix: '/api/v1/admin/notificacoes' },
  )

  await app.register(
    async (adminSuporte) => {
      await registerAdminSuporteRoutes(adminSuporte)
    },
    { prefix: '/api/v1/admin/suporte' },
  )

  await app.register(
    async (prefeituraNotificacoes) => {
      await registerPrefeituraNotificacoesRoutes(prefeituraNotificacoes)
    },
    { prefix: '/api/v1/prefeitura/notificacoes' },
  )

  await app.register(
    async (prefeituraSuporte) => {
      await registerPrefeituraSuporteRoutes(prefeituraSuporte)
    },
    { prefix: '/api/v1/prefeitura/suporte' },
  )

  await app.register(
    async (ubtNotificacoes) => {
      await registerUbtNotificacoesRoutes(ubtNotificacoes)
    },
    { prefix: '/api/v1/ubt/notificacoes' },
  )

  await app.register(
    async (ubtSuporte) => {
      await registerUbtSuporteRoutes(ubtSuporte)
    },
    { prefix: '/api/v1/ubt/suporte' },
  )

  await app.register(
    async (profissionalSuporte) => {
      await registerProfissionalSuporteRoutes(profissionalSuporte)
    },
    { prefix: '/api/v1/profissional/suporte' },
  )

  await app.register(
    async (profissionalPerfil) => {
      await registerProfissionalPerfilRoutes(profissionalPerfil)
    },
    { prefix: '/api/v1/profissional/perfil' },
  )

  await app.register(
    async (profissionalFinanceiro) => {
      await registerProfissionalFinanceiroRoutes(profissionalFinanceiro)
    },
    { prefix: '/api/v1/profissional/financeiro' },
  )

  await app.register(
    async (adminConfiguracoes) => {
      await registerAdminConfiguracoesRoutes(adminConfiguracoes)
    },
    { prefix: '/api/v1/admin/configuracoes' },
  )

  await app.register(
    async (adminMonitor) => {
      await registerAdminMonitorRoutes(adminMonitor)
    },
    { prefix: '/api/v1/admin/monitor' },
  )

  await app.register(
    async (adminDashboard) => {
      await registerAdminDashboardRoutes(adminDashboard)
      await registerAdminPosConsultaDashboardRoutes(adminDashboard)
    },
    { prefix: '/api/v1/admin/dashboard' },
  )

  await app.register(
    async (adminAuditoria) => {
      await registerAdminAuditoriaRoutes(adminAuditoria)
    },
    { prefix: '/api/v1/admin/auditoria' },
  )

  await app.register(
    async (prefeituraAuditoria) => {
      await registerPrefeituraAuditoriaRoutes(prefeituraAuditoria)
    },
    { prefix: '/api/v1/prefeitura/auditoria' },
  )

  await app.register(
    async (ubtAuditoria) => {
      await registerUbtAuditoriaRoutes(ubtAuditoria)
    },
    { prefix: '/api/v1/ubt/auditoria' },
  )

  await app.register(
    async (profissionalAuditoria) => {
      await registerProfissionalAuditoriaRoutes(profissionalAuditoria)
    },
    { prefix: '/api/v1/profissional/auditoria' },
  )

  registerAuditoriaMiddleware(app)

  return app
}
