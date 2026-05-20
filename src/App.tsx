import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AgendaPage } from './pages/AgendaPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { NetworkUsersPage } from './pages/NetworkUsersPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/triagem" element={<HomePage />} />
        <Route path="/home" element={<Navigate to="/triagem" replace />} />
        <Route path="/agenda" element={<AgendaPage />} />
        <Route path="/usuarios" element={<NetworkUsersPage />} />
        <Route path="/dashboard" element={<Navigate to="/triagem" replace />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
