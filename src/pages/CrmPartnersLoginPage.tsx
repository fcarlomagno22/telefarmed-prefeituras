import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { CrmPartnersFeaturePanel } from '../components/crmPartners/login/CrmPartnersFeaturePanel'
import { CrmPartnersLoginForm } from '../components/crmPartners/login/CrmPartnersLoginForm'
import { CrmPartnersPasswordRecoveryDrawer } from '../components/crmPartners/login/CrmPartnersPasswordRecoveryDrawer'
import { crmPartnersBrand, crmPartnersRoutes } from '../config/crmPartnersRoutes'
import { useCrmPartnersAuth } from '../contexts/CrmPartnersAuthContext'
import { useBrandTheme } from '../hooks/useBrandTheme'

export function CrmPartnersLoginPage() {
  useBrandTheme()
  const { login, isAuthenticated, isBootstrapping } = useCrmPartnersAuth()
  const [recoveryOpen, setRecoveryOpen] = useState(false)
  const [recoveryClosing, setRecoveryClosing] = useState(false)

  if (!isBootstrapping && isAuthenticated) {
    return <Navigate to={crmPartnersRoutes.dashboard} replace />
  }

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen min-h-[100dvh] items-center justify-center bg-[#f5f6f8]">
        <p className="text-sm font-medium text-gray-500">Carregando...</p>
      </div>
    )
  }

  function openRecoveryDrawer() {
    setRecoveryClosing(false)
    setRecoveryOpen(true)
  }

  function closeRecoveryDrawer() {
    setRecoveryClosing(true)
  }

  function handleRecoveryTransitionEnd() {
    if (recoveryClosing) {
      setRecoveryClosing(false)
      setRecoveryOpen(false)
    }
  }

  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col bg-[#f5f6f8] lg:flex-row">
      <CrmPartnersFeaturePanel />

      <main className="relative flex min-h-screen min-h-[100dvh] flex-1 flex-col overflow-hidden">
        <div className="absolute inset-0 lg:hidden" aria-hidden>
          <img
            src={crmPartnersBrand.loginImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            fetchPriority="high"
          />
        </div>

        <div className="relative z-10 flex flex-1 flex-col px-5 py-6 sm:px-8 sm:py-8 lg:px-14 lg:py-12 xl:px-20">
          <div className="flex flex-1 flex-col items-center justify-center py-6 sm:py-8">
            <CrmPartnersLoginForm
              onForgotPasswordClick={openRecoveryDrawer}
              authenticate={async ({ cpf, password }) => {
                const user = await login({ cpf, password })
                return { displayName: user.nome }
              }}
            />
          </div>
        </div>
      </main>

      <CrmPartnersPasswordRecoveryDrawer
        open={recoveryOpen && !recoveryClosing}
        closing={recoveryClosing}
        onClose={closeRecoveryDrawer}
        onTransitionEnd={handleRecoveryTransitionEnd}
      />
    </div>
  )
}
