import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
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
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { AdminClientesPage } from './pages/AdminClientesPage'
import { AdminPacientesPage } from './pages/AdminPacientesPage'
import { AdminPlaceholderPage } from './pages/AdminPlaceholderPage'
import { AdminMonitorPage } from './pages/AdminMonitorPage'
import { AdminFinanceiroPage } from './pages/AdminFinanceiroPage'
import { PrefeituraLoginPage } from './pages/PrefeituraLoginPage'
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
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/entrando" element={<LoginTransitionPage />} />
        <Route path="/prefeitura/entrando" element={<LoginTransitionPage />} />
        <Route path="/admin/entrando" element={<LoginTransitionPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="clientes" element={<AdminClientesPage />} />
          <Route path="monitor-operacional" element={<AdminMonitorPage />} />
          <Route path="monitor" element={<Navigate to="/admin/monitor-operacional" replace />} />
          <Route path="pessoas" element={<AdminPacientesPage />} />
          <Route path="pacientes" element={<Navigate to="/admin/pessoas" replace />} />
          <Route path="medicos" element={<AdminPlaceholderPage />} />
          <Route path="financeiro" element={<AdminFinanceiroPage />} />
          <Route path="notificacoes" element={<AdminPlaceholderPage />} />
          <Route path="suporte" element={<AdminPlaceholderPage />} />
          <Route path="auditoria" element={<AdminPlaceholderPage />} />
          <Route path="credenciais" element={<AdminPlaceholderPage />} />
          <Route path="configuracoes" element={<AdminPlaceholderPage />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
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
        <Route element={<UbtNotificacoesProviderLayout />}>
          <Route path="/triagem" element={<HomePage />} />
          <Route path="/home" element={<Navigate to="/triagem" replace />} />
          <Route path="/agenda" element={<AgendaPage />} />
          <Route path="/consultas" element={<ConsultasPage />} />
          <Route path="/usuarios" element={<NetworkUsersPage />} />
          <Route path="/relatorios" element={<RelatoriosPage />} />
          <Route path="/relatorios/:categoryId" element={<RelatoriosCategoryPage />} />
          <Route path="/notificacoes" element={<UbtNotificacoesPage />} />
          <Route path="/suporte" element={<SuportePage />} />
          <Route path="/credenciais" element={<AccessCredentialsPage />} />
          <Route path="/auditoria" element={<AuditLogsPage />} />
          <Route path="/dashboard" element={<Navigate to="/triagem" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
