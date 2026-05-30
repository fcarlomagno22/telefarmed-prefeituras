import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { ubtRelatoriosCategoryPath, ubtRoutes } from './config/ubtRoutes'
import { AgendaPage } from './pages/AgendaPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { LoginTransitionPage } from './pages/LoginTransitionPage'
import { ConsultasPage } from './pages/ConsultasPage'
import { NetworkUsersPage } from './pages/NetworkUsersPage'
import { RelatoriosPage } from './pages/RelatoriosPage'
import { RelatoriosCategoryPage } from './pages/RelatoriosCategoryPage'
import { SuportePage } from './pages/SuportePage'
import { AccessCredentialsPage } from './pages/AccessCredentialsPage'
import { AuditLogsPage } from './pages/AuditLogsPage'
import { RootPage } from './pages/RootPage'
import { AdminLayout } from './pages/AdminLayout'
import { AdminLoginPage } from './pages/AdminLoginPage'
import { AdminRoutesShell } from './pages/AdminRoutesShell'
import { AdminHomeRedirect } from './components/auth/AdminPagePermissionGuard'
import { AdminProtectedRoute } from './components/auth/AdminProtectedRoute'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { AdminClientesPage } from './pages/AdminClientesPage'
import { AdminPacientesPage } from './pages/AdminPacientesPage'
import { AdminPlaceholderPage } from './pages/AdminPlaceholderPage'
import { AdminSuportePage } from './pages/AdminSuportePage'
import { AdminAuditLogsPage } from './pages/AdminAuditLogsPage'
import { AdminNotificacoesPage } from './pages/AdminNotificacoesPage'
import { AdminCredenciaisPage } from './pages/AdminCredenciaisPage'
import { AdminConfiguracoesPage } from './pages/AdminConfiguracoesPage'
import { AdminMonitorPage } from './pages/AdminMonitorPage'
import { AdminEscalaPage } from './pages/AdminEscalaPage'
import { AdminFinanceiroPage } from './pages/AdminFinanceiroPage'
import { PrefeituraLoginPage } from './pages/PrefeituraLoginPage'
import { ProfissionalLoginPage } from './pages/ProfissionalLoginPage'
import { MedicoCadastroLandingPage } from './pages/MedicoCadastroLandingPage'
import { ProfissionalFinalizarCadastroPage } from './pages/ProfissionalFinalizarCadastroPage'
import { medicoCadastroLandingRoute } from './config/medicoCadastroLanding'
import { ProfissionalLayout } from './pages/ProfissionalLayout'
import { ProfissionalAgendaPage } from './pages/ProfissionalAgendaPage'
import { ProfissionalAtendimentosPage } from './pages/ProfissionalAtendimentosPage'
import { ProfissionalEscalaPage } from './pages/ProfissionalEscalaPage'
import { ProfissionalFinanceiroPage } from './pages/ProfissionalFinanceiroPage'
import { ProfissionalAvaliacaoPage } from './pages/ProfissionalAvaliacaoPage'
import { ProfissionalSuportePage } from './pages/ProfissionalSuportePage'
import { ProfissionalNotificacoesPage } from './pages/ProfissionalNotificacoesPage'
import { ProfissionalPerfilPage } from './pages/ProfissionalPerfilPage'
import { profissionalRoutes } from './config/profissionalRoutes'
import { PrefeituraLayout } from './pages/PrefeituraLayout'
import { PrefeituraDashboardPage } from './pages/PrefeituraDashboardPage'
import { PrefeituraRedePage } from './pages/PrefeituraRedePage'
import { PrefeituraMonitorPage } from './pages/PrefeituraMonitorPage'
import { PrefeituraConsultasPage } from './pages/PrefeituraConsultasPage'
import { PrefeituraAgendasPage } from './pages/PrefeituraAgendasPage'
import { PrefeituraUsuariosPage } from './pages/PrefeituraUsuariosPage'
import { PrefeituraAuditLogsPage } from './pages/PrefeituraAuditLogsPage'
import { PrefeituraSuportePage } from './pages/PrefeituraSuportePage'
import { PrefeituraAccessCredentialsPage } from './pages/PrefeituraAccessCredentialsPage'
import { PrefeituraContratoPage } from './pages/PrefeituraContratoPage'
import { PrefeituraNotificacoesPage } from './pages/PrefeituraNotificacoesPage'
import { UbtNotificacoesPage } from './pages/UbtNotificacoesPage'
import { UbtNotificacoesProviderLayout } from './pages/UbtNotificacoesProviderLayout'
import { SalaDeEsperaPage } from './pages/SalaDeEsperaPage'
import { AtendimentoPacientePage } from './pages/AtendimentoPacientePage'
import { AtendimentoAvaliacaoPage } from './pages/AtendimentoAvaliacaoPage'
import { AtendimentoMedicoPage } from './pages/AtendimentoMedicoPage'

function LegacyUbtRelatoriosCategoryRedirect() {
  const { categoryId } = useParams<{ categoryId: string }>()
  if (!categoryId) return <Navigate to={ubtRoutes.relatorios} replace />
  return <Navigate to={ubtRelatoriosCategoryPath(categoryId)} replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootPage />} />
        <Route path="/sala-de-espera" element={<SalaDeEsperaPage />} />
        <Route path="/atendimento/:attendanceId/avaliacao" element={<AtendimentoAvaliacaoPage />} />
        <Route path="/atendimento/:attendanceId/medico" element={<AtendimentoMedicoPage />} />
        <Route path="/atendimento/:attendanceId" element={<AtendimentoPacientePage />} />
        <Route path="/ubt/login" element={<LoginPage />} />
        <Route path="/login" element={<Navigate to="/ubt/login" replace />} />
        <Route path="/ubs/login" element={<Navigate to="/ubt/login" replace />} />
        <Route path="/prefeitura/login" element={<PrefeituraLoginPage />} />
        <Route path="/profissional/login" element={<ProfissionalLoginPage />} />
        <Route
          path={medicoCadastroLandingRoute}
          element={<MedicoCadastroLandingPage />}
        />
        <Route
          path={profissionalRoutes.finalizarCadastro}
          element={<ProfissionalFinalizarCadastroPage />}
        />
        <Route path="/entrando" element={<Navigate to={ubtRoutes.entrando} replace />} />
        <Route path="/ubt/entrando" element={<LoginTransitionPage />} />
        <Route path="/prefeitura/entrando" element={<LoginTransitionPage />} />
        <Route path="/admin" element={<AdminRoutesShell />}>
          <Route path="login" element={<AdminLoginPage />} />
          <Route element={<AdminProtectedRoute />}>
            <Route path="entrando" element={<LoginTransitionPage />} />
            <Route element={<AdminLayout />}>
              <Route index element={<AdminHomeRedirect />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="clientes" element={<AdminClientesPage />} />
              <Route path="monitor-operacional" element={<AdminMonitorPage />} />
              <Route path="monitor" element={<Navigate to="/admin/monitor-operacional" replace />} />
              <Route path="pessoas" element={<AdminPacientesPage />} />
              <Route path="pacientes" element={<Navigate to="/admin/pessoas" replace />} />
              <Route path="medicos" element={<AdminPlaceholderPage />} />
              <Route path="escala" element={<AdminEscalaPage />} />
              <Route path="gestao-escala" element={<Navigate to="/admin/escala" replace />} />
              <Route path="financeiro" element={<AdminFinanceiroPage />} />
              <Route path="notificacoes" element={<AdminNotificacoesPage />} />
              <Route path="suporte" element={<AdminSuportePage />} />
              <Route path="auditoria" element={<AdminAuditLogsPage />} />
              <Route path="credenciais" element={<AdminCredenciaisPage />} />
              <Route path="configuracoes" element={<AdminConfiguracoesPage />} />
              <Route path="*" element={<AdminHomeRedirect />} />
            </Route>
          </Route>
        </Route>
        <Route path="/profissional/entrando" element={<LoginTransitionPage />} />
        <Route path="/profissional" element={<ProfissionalLayout />}>
          <Route index element={<Navigate to="agenda" replace />} />
          <Route path="agenda" element={<ProfissionalAgendaPage />} />
          <Route path="atendimentos" element={<ProfissionalAtendimentosPage />} />
          <Route path="historico" element={<Navigate to="atendimentos" replace />} />
          <Route path="escala" element={<ProfissionalEscalaPage />} />
          <Route path="financeiro" element={<ProfissionalFinanceiroPage />} />
          <Route path="avaliacao" element={<ProfissionalAvaliacaoPage />} />
          <Route path="suporte" element={<ProfissionalSuportePage />} />
          <Route path="notificacoes" element={<ProfissionalNotificacoesPage />} />
          <Route path="perfil" element={<ProfissionalPerfilPage />} />
          <Route path="*" element={<Navigate to={profissionalRoutes.agenda} replace />} />
        </Route>
        <Route path="/prefeitura" element={<PrefeituraLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<PrefeituraDashboardPage />} />
          <Route path="rede" element={<PrefeituraRedePage />} />
          <Route path="monitor" element={<PrefeituraMonitorPage />} />
          <Route path="consultas" element={<PrefeituraConsultasPage />} />
          <Route path="agendas" element={<PrefeituraAgendasPage />} />
          <Route path="agenda" element={<Navigate to="/prefeitura/agendas" replace />} />
          <Route path="usuarios" element={<PrefeituraUsuariosPage />} />
          <Route path="auditoria" element={<PrefeituraAuditLogsPage />} />
          <Route path="suporte" element={<PrefeituraSuportePage />} />
          <Route path="credenciais" element={<PrefeituraAccessCredentialsPage />} />
          <Route path="contrato" element={<PrefeituraContratoPage />} />
          <Route path="notificacoes" element={<PrefeituraNotificacoesPage />} />
          <Route path="alertas" element={<Navigate to="/prefeitura/notificacoes" replace />} />
          <Route path="*" element={<PrefeituraDashboardPage />} />
        </Route>
        <Route path="/triagem" element={<Navigate to={ubtRoutes.triagem} replace />} />
        <Route path="/home" element={<Navigate to={ubtRoutes.triagem} replace />} />
        <Route path="/dashboard" element={<Navigate to={ubtRoutes.triagem} replace />} />
        <Route path="/agenda" element={<Navigate to={ubtRoutes.agenda} replace />} />
        <Route path="/consultas" element={<Navigate to={ubtRoutes.consultas} replace />} />
        <Route path="/usuarios" element={<Navigate to={ubtRoutes.usuarios} replace />} />
        <Route path="/relatorios" element={<Navigate to={ubtRoutes.relatorios} replace />} />
        <Route
          path="/relatorios/:categoryId"
          element={<LegacyUbtRelatoriosCategoryRedirect />}
        />
        <Route path="/notificacoes" element={<Navigate to={ubtRoutes.notificacoes} replace />} />
        <Route path="/suporte" element={<Navigate to={ubtRoutes.suporte} replace />} />
        <Route path="/credenciais" element={<Navigate to={ubtRoutes.credenciais} replace />} />
        <Route path="/auditoria" element={<Navigate to={ubtRoutes.auditoria} replace />} />
        <Route path="/ubt" element={<UbtNotificacoesProviderLayout />}>
          <Route index element={<Navigate to="agenda" replace />} />
          <Route path="triagem" element={<HomePage />} />
          <Route path="home" element={<Navigate to="triagem" replace />} />
          <Route path="agenda" element={<AgendaPage />} />
          <Route path="consultas" element={<ConsultasPage />} />
          <Route path="usuarios" element={<NetworkUsersPage />} />
          <Route path="relatorios" element={<RelatoriosPage />} />
          <Route path="relatorios/:categoryId" element={<RelatoriosCategoryPage />} />
          <Route path="notificacoes" element={<UbtNotificacoesPage />} />
          <Route path="suporte" element={<SuportePage />} />
          <Route path="credenciais" element={<AccessCredentialsPage />} />
          <Route path="auditoria" element={<AuditLogsPage />} />
          <Route path="dashboard" element={<Navigate to="triagem" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
