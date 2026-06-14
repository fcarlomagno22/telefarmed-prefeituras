import { lazy, Suspense } from 'react'
import { Navigate, Route } from 'react-router-dom'
import { PrefixedLegacyRedirect } from '../components/routing/PrefixedLegacyRedirect'
import { AdminHomeRedirect } from '../components/auth/AdminPagePermissionGuard'
import { AdminProtectedRoute } from '../components/auth/AdminProtectedRoute'
import {
  ProfissionalHomeRedirect,
  ProfissionalPagePermissionGuard,
} from '../components/auth/ProfissionalPagePermissionGuard'
import { ProfissionalProtectedRoute } from '../components/auth/ProfissionalProtectedRoute'
import { PrefeituraHomeRedirect } from '../components/auth/PrefeituraPagePermissionGuard'
import { PrefeituraProtectedRoute } from '../components/auth/PrefeituraProtectedRoute'
import { UbtHomeRedirect, UbtPagePermissionGuard } from '../components/auth/UbtPagePermissionGuard'
import { UbtProtectedRoute } from '../components/auth/UbtProtectedRoute'
import { adminRoutes } from '../config/adminRoutes'
import type { PortalId } from '../config/portalHost'
import { prefeituraRoutes } from '../config/prefeituraRoutes'
import { ubtRoutes } from '../config/ubtRoutes'
import { AdminLayout } from '../pages/AdminLayout'
import { AdminLoginPage } from '../pages/AdminLoginPage'
import { AdminRoutesShell } from '../pages/AdminRoutesShell'
import { AdminDashboardPage } from '../pages/AdminDashboardPage'
import { AdminClientesPage } from '../pages/AdminClientesPage'
import { AdminPacientesPage } from '../pages/AdminPacientesPage'
import { AdminOperadoresPage } from '../pages/AdminOperadoresPage'
import { AdminProfissionaisPage } from '../pages/AdminProfissionaisPage'
import { AdminSuportePage } from '../pages/AdminSuportePage'
import { AdminAuditLogsPage } from '../pages/AdminAuditLogsPage'
import { AdminCredenciaisPage } from '../pages/AdminCredenciaisPage'
import { AdminConfiguracoesPage } from '../pages/AdminConfiguracoesPage'
import { AdminMonitorPage } from '../pages/AdminMonitorPage'
import { AdminEscalaPage } from '../pages/AdminEscalaPage'
import { PrefeituraLoginPage } from '../pages/PrefeituraLoginPage'
import { PrefeituraRoutesShell } from '../pages/PrefeituraRoutesShell'
import { PrefeituraLayout } from '../pages/PrefeituraLayout'
import { PrefeituraDashboardPage } from '../pages/PrefeituraDashboardPage'
import { PrefeituraRedePage } from '../pages/PrefeituraRedePage'
import { PrefeituraMonitorPage } from '../pages/PrefeituraMonitorPage'
import { PrefeituraConsultasPage } from '../pages/PrefeituraConsultasPage'
import { PrefeituraAgendasPage } from '../pages/PrefeituraAgendasPage'
import { PrefeituraUsuariosPage } from '../pages/PrefeituraUsuariosPage'
import { PrefeituraAuditLogsPage } from '../pages/PrefeituraAuditLogsPage'
import { PrefeituraSuportePage } from '../pages/PrefeituraSuportePage'
import { PrefeituraAccessCredentialsPage } from '../pages/PrefeituraAccessCredentialsPage'
import { PrefeituraContratoPage } from '../pages/PrefeituraContratoPage'
import { PrefeituraNotificacoesPage } from '../pages/PrefeituraNotificacoesPage'
import {
  PrefeituraRelatoriosCategoryPage,
  PrefeituraRelatoriosPage,
} from '../pages/PrefeituraRelatoriosPage'
import { PrefeituraRelatorioViewPage } from '../pages/PrefeituraRelatorioViewPage'
import { PrefeituraRelatoriosCompiledView } from '../components/prefeitura/relatorios/PrefeituraRelatoriosCompiledView'
import { ProfissionalLoginPage } from '../pages/ProfissionalLoginPage'
import { ProfissionalRoutesShell } from '../pages/ProfissionalRoutesShell'
import { MedicoCadastroLandingPage } from '../pages/MedicoCadastroLandingPage'
import { MinhaCandidaturaPage } from '../pages/MinhaCandidaturaPage'
import { ProfissionalFinalizarCadastroPage } from '../pages/ProfissionalFinalizarCadastroPage'
import { ProfissionalLayout } from '../pages/ProfissionalLayout'
import { ProfissionalAgendaPage } from '../pages/ProfissionalAgendaPage'
import { ProfissionalAtendimentosPage } from '../pages/ProfissionalAtendimentosPage'
import { ProfissionalEscalaPage } from '../pages/ProfissionalEscalaPage'
import { ProfissionalFinanceiroPage } from '../pages/ProfissionalFinanceiroPage'
import { ProfissionalAvaliacaoPage } from '../pages/ProfissionalAvaliacaoPage'
import { ProfissionalSuportePage } from '../pages/ProfissionalSuportePage'
import { ProfissionalNotificacoesPage } from '../pages/ProfissionalNotificacoesPage'
import { ProfissionalPerfilPage } from '../pages/ProfissionalPerfilPage'
import { UbtLoginPage } from '../pages/UbtLoginPage'
import { UbtRoutesShell } from '../pages/UbtRoutesShell'
import { UbtNotificacoesProviderLayout } from '../pages/UbtNotificacoesProviderLayout'
import { LoginTransitionPage } from '../pages/LoginTransitionPage'
import { HomePage } from '../pages/HomePage'
import { AgendaPage } from '../pages/AgendaPage'
import { ConsultasPage } from '../pages/ConsultasPage'
import { NetworkUsersPage } from '../pages/NetworkUsersPage'
import { SuportePage } from '../pages/SuportePage'
import { AccessCredentialsPage } from '../pages/AccessCredentialsPage'
import { AuditLogsPage } from '../pages/AuditLogsPage'
import { UbtNotificacoesPage } from '../pages/UbtNotificacoesPage'
import { SalaDeEsperaPage } from '../pages/SalaDeEsperaPage'
import { AtendimentoPacientePage } from '../pages/AtendimentoPacientePage'
import { AtendimentoAvaliacaoPage } from '../pages/AtendimentoAvaliacaoPage'
import { AtendimentoMedicoPage } from '../pages/AtendimentoMedicoPage'
import { VerificarDocumentoPage } from '../pages/VerificarDocumentoPage'

const AdminNotificacoesPage = lazy(() =>
  import('../pages/AdminNotificacoesPage').then((module) => ({
    default: module.AdminNotificacoesPage,
  })),
)

const AdminFinanceiroPage = lazy(() =>
  import('../pages/AdminFinanceiroPage').then((module) => ({
    default: module.AdminFinanceiroPage,
  })),
)

function SharedPublicRoutes() {
  return <Route path="/verificar/:codigo" element={<VerificarDocumentoPage />} />
}

export const adminDedicatedRoutes = (
  <>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/admin/*" element={<PrefixedLegacyRedirect portal="admin" />} />
      <Route element={<AdminRoutesShell />}>
        <Route path="login" element={<AdminLoginPage />} />
        <Route element={<AdminProtectedRoute />}>
          <Route path="entrando" element={<LoginTransitionPage />} />
          <Route element={<AdminLayout />}>
            <Route index element={<AdminHomeRedirect />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="clientes" element={<AdminClientesPage />} />
            <Route path="monitor-operacional" element={<AdminMonitorPage />} />
            <Route path="monitor" element={<Navigate to={adminRoutes.monitorOperacional} replace />} />
            <Route path="pessoas" element={<Navigate to={adminRoutes.pacientes} replace />} />
            <Route path="pacientes" element={<AdminPacientesPage />} />
            <Route path="operadores" element={<AdminOperadoresPage />} />
            <Route path="profissionais" element={<AdminProfissionaisPage />} />
            <Route path="medicos" element={<Navigate to={adminRoutes.profissionais} replace />} />
            <Route path="escala" element={<AdminEscalaPage />} />
            <Route path="gestao-escala" element={<Navigate to={adminRoutes.escala} replace />} />
            <Route
              path="financeiro"
              element={
                <Suspense
                  fallback={
                    <div className="flex flex-1 items-center justify-center p-8 text-sm text-gray-500">
                      Carregando financeiro…
                    </div>
                  }
                >
                  <AdminFinanceiroPage />
                </Suspense>
              }
            />
            <Route
              path="notificacoes"
              element={
                <Suspense
                  fallback={
                    <div className="flex flex-1 items-center justify-center p-8 text-sm text-gray-500">
                      Carregando notificações…
                    </div>
                  }
                >
                  <AdminNotificacoesPage />
                </Suspense>
              }
            />
            <Route path="suporte" element={<AdminSuportePage />} />
            <Route path="auditoria" element={<AdminAuditLogsPage />} />
            <Route path="credenciais" element={<AdminCredenciaisPage />} />
            <Route path="configuracoes" element={<AdminConfiguracoesPage />} />
            <Route path="*" element={<AdminHomeRedirect />} />
          </Route>
        </Route>
      </Route>
      {SharedPublicRoutes()}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </>
)

export const prefeituraDedicatedRoutes = (
  <>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/prefeitura/*" element={<PrefixedLegacyRedirect portal="prefeitura" />} />
      <Route element={<PrefeituraRoutesShell />}>
        <Route path="login" element={<PrefeituraLoginPage />} />
        <Route element={<PrefeituraProtectedRoute />}>
          <Route path="entrando" element={<LoginTransitionPage />} />
          <Route path="relatorios/compilado" element={<PrefeituraRelatoriosCompiledView />} />
          <Route path="relatorios/gerar/:reportId" element={<PrefeituraRelatorioViewPage />} />
          <Route element={<PrefeituraLayout />}>
            <Route index element={<PrefeituraHomeRedirect />} />
            <Route path="dashboard" element={<PrefeituraDashboardPage />} />
            <Route path="rede" element={<PrefeituraRedePage />} />
            <Route path="monitor" element={<PrefeituraMonitorPage />} />
            <Route path="consultas" element={<PrefeituraConsultasPage />} />
            <Route path="agendas" element={<PrefeituraAgendasPage />} />
            <Route path="agenda" element={<Navigate to={prefeituraRoutes.agendas} replace />} />
            <Route path="usuarios" element={<PrefeituraUsuariosPage />} />
            <Route path="auditoria" element={<PrefeituraAuditLogsPage />} />
            <Route path="suporte" element={<PrefeituraSuportePage />} />
            <Route path="credenciais" element={<PrefeituraAccessCredentialsPage />} />
            <Route path="contrato" element={<PrefeituraContratoPage />} />
            <Route path="relatorios" element={<PrefeituraRelatoriosPage />} />
            <Route path="relatorios/:categoryId" element={<PrefeituraRelatoriosCategoryPage />} />
            <Route path="notificacoes" element={<PrefeituraNotificacoesPage />} />
            <Route path="alertas" element={<Navigate to={prefeituraRoutes.notificacoes} replace />} />
            <Route path="*" element={<PrefeituraHomeRedirect />} />
          </Route>
        </Route>
      </Route>
      {SharedPublicRoutes()}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </>
)

export const profissionalDedicatedRoutes = (
  <>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/profissional/*" element={<PrefixedLegacyRedirect portal="profissional" />} />
      <Route element={<ProfissionalRoutesShell />}>
        <Route path="login" element={<ProfissionalLoginPage />} />
        <Route path="cadastro" element={<MedicoCadastroLandingPage />} />
        <Route path="cadastro/minha-candidatura" element={<MinhaCandidaturaPage />} />
        <Route path="finalizar-cadastro" element={<ProfissionalFinalizarCadastroPage />} />
        <Route element={<ProfissionalProtectedRoute />}>
          <Route path="entrando" element={<LoginTransitionPage />} />
          <Route element={<ProfissionalPagePermissionGuard />}>
            <Route path="atendimento/:attendanceId" element={<AtendimentoMedicoPage />} />
          </Route>
          <Route element={<ProfissionalLayout />}>
            <Route index element={<ProfissionalHomeRedirect />} />
            <Route path="agenda" element={<ProfissionalAgendaPage />} />
            <Route path="atendimentos" element={<ProfissionalAtendimentosPage />} />
            <Route path="historico" element={<Navigate to="atendimentos" replace />} />
            <Route path="escala" element={<ProfissionalEscalaPage />} />
            <Route path="financeiro" element={<ProfissionalFinanceiroPage />} />
            <Route path="avaliacao" element={<ProfissionalAvaliacaoPage />} />
            <Route path="suporte" element={<ProfissionalSuportePage />} />
            <Route path="notificacoes" element={<ProfissionalNotificacoesPage />} />
            <Route path="perfil" element={<ProfissionalPerfilPage />} />
            <Route path="*" element={<ProfissionalHomeRedirect />} />
          </Route>
        </Route>
      </Route>
      {SharedPublicRoutes()}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </>
)

export const ubtDedicatedRoutes = (
  <>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/ubt/*" element={<PrefixedLegacyRedirect portal="ubt" />} />
      <Route element={<UbtRoutesShell />}>
        <Route path="login" element={<UbtLoginPage />} />
        <Route element={<UbtProtectedRoute />}>
          <Route path="entrando" element={<LoginTransitionPage />} />
          <Route element={<UbtPagePermissionGuard />}>
            <Route path="sala-de-espera" element={<SalaDeEsperaPage />} />
            <Route path="atendimento/:attendanceId/avaliacao" element={<AtendimentoAvaliacaoPage />} />
            <Route path="atendimento/:attendanceId" element={<AtendimentoPacientePage />} />
            <Route element={<UbtNotificacoesProviderLayout />}>
              <Route index element={<UbtHomeRedirect />} />
              <Route path="triagem" element={<HomePage />} />
              <Route path="home" element={<Navigate to="triagem" replace />} />
              <Route path="agenda" element={<AgendaPage />} />
              <Route path="consultas" element={<ConsultasPage />} />
              <Route path="usuarios" element={<NetworkUsersPage />} />
              <Route path="relatorios" element={<Navigate to="triagem" replace />} />
              <Route path="relatorios/*" element={<Navigate to="triagem" replace />} />
              <Route path="notificacoes" element={<UbtNotificacoesPage />} />
              <Route path="suporte" element={<SuportePage />} />
              <Route path="credenciais" element={<AccessCredentialsPage />} />
              <Route path="auditoria" element={<AuditLogsPage />} />
              <Route path="dashboard" element={<Navigate to="triagem" replace />} />
              <Route path="*" element={<UbtHomeRedirect />} />
            </Route>
          </Route>
        </Route>
      </Route>
      <Route path="/triagem" element={<Navigate to={ubtRoutes.triagem} replace />} />
      <Route path="/home" element={<Navigate to={ubtRoutes.triagem} replace />} />
      <Route path="/agenda" element={<Navigate to={ubtRoutes.agenda} replace />} />
      <Route path="/consultas" element={<Navigate to={ubtRoutes.consultas} replace />} />
      <Route path="/usuarios" element={<Navigate to={ubtRoutes.usuarios} replace />} />
      <Route path="/notificacoes" element={<Navigate to={ubtRoutes.notificacoes} replace />} />
      <Route path="/suporte" element={<Navigate to={ubtRoutes.suporte} replace />} />
      <Route path="/credenciais" element={<Navigate to={ubtRoutes.credenciais} replace />} />
      <Route path="/auditoria" element={<Navigate to={ubtRoutes.auditoria} replace />} />
      {SharedPublicRoutes()}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </>
)

export function dedicatedPortalRoutes(portal: PortalId) {
  switch (portal) {
    case 'admin':
      return adminDedicatedRoutes
    case 'prefeitura':
      return prefeituraDedicatedRoutes
    case 'profissional':
      return profissionalDedicatedRoutes
    case 'ubt':
      return ubtDedicatedRoutes
    default:
      return null
  }
}
