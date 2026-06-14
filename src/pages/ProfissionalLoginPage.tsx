import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { MinhaCandidaturaDrawer } from '../components/landing/medicoCadastro/MinhaCandidaturaDrawer'
import { FeaturePanel } from '../components/login/FeaturePanel'
import { LoginForm } from '../components/login/LoginForm'
import { ProfissionalPasswordRecoveryDrawer } from '../components/profissional/login/ProfissionalPasswordRecoveryDrawer'
import { brand } from '../config/brand'
import { profissionalRoutes } from '../config/profissionalRoutes'
import { resolveDefaultProfissionalHomePath } from '../config/profissionalPageAccess'
import { useProfissionalAuth } from '../contexts/ProfissionalAuthContext'
import { useBrandTheme } from '../hooks/useBrandTheme'
import { ProfissionalAuthApiError } from '../lib/services/profissional/auth'
import { cpfDigits } from '../utils/cpf'

type LoginLocationState = {
  openMinhaCandidatura?: boolean
}

export function ProfissionalLoginPage() {
  useBrandTheme()
  const { login, isAuthenticated, isBootstrapping, user } = useProfissionalAuth()
  const location = useLocation()
  const [minhaCandidaturaOpen, setMinhaCandidaturaOpen] = useState(false)
  const [minhaCandidaturaClosing, setMinhaCandidaturaClosing] = useState(false)
  const [recoveryOpen, setRecoveryOpen] = useState(false)
  const [recoveryClosing, setRecoveryClosing] = useState(false)

  useEffect(() => {
    const state = location.state as LoginLocationState | null
    if (state?.openMinhaCandidatura) {
      setMinhaCandidaturaOpen(true)
      setMinhaCandidaturaClosing(false)
    }
  }, [location.state])

  if (!isBootstrapping && isAuthenticated) {
    return <Navigate to={resolveDefaultProfissionalHomePath(user)} replace />
  }

  function openMinhaCandidaturaDrawer() {
    setMinhaCandidaturaClosing(false)
    setMinhaCandidaturaOpen(true)
  }

  function closeMinhaCandidaturaDrawer() {
    setMinhaCandidaturaClosing(true)
  }

  function handleMinhaCandidaturaTransitionEnd() {
    if (minhaCandidaturaClosing) {
      setMinhaCandidaturaClosing(false)
      setMinhaCandidaturaOpen(false)
    }
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
    <div className="flex min-h-screen bg-[#f5f6f8] lg:flex-row">
      <FeaturePanel variant="profissional" />

      <main className="relative flex min-h-screen flex-1 flex-col overflow-hidden">
        <div className="relative z-10 flex flex-1 flex-col px-6 py-8 sm:px-12 lg:px-14 lg:py-12 xl:px-20">
          <div className="flex flex-1 flex-col items-center justify-center py-6">
            <LoginForm
              portal="profissional"
              onForgotPasswordClick={openRecoveryDrawer}
              authenticate={async ({ cpf, password }) => {
                try {
                  const authUser = await login({
                    cpf: cpfDigits(cpf),
                    password,
                  })
                  return { displayName: authUser.nome }
                } catch (error) {
                  if (error instanceof ProfissionalAuthApiError) {
                    throw error
                  }
                  throw new ProfissionalAuthApiError('Não foi possível concluir o login.', 0)
                }
              }}
              cardFooter={
                <p>
                  É profissional de saúde e ainda não integra nossa rede?{' '}
                  <Link
                    to={profissionalRoutes.cadastro}
                    className="font-semibold text-[var(--brand-primary)] underline-offset-2 transition hover:underline"
                  >
                    Candidate-se e faça seu cadastro
                  </Link>
                </p>
              }
            />

            <p className="mt-6 w-full max-w-md text-center text-sm leading-relaxed text-gray-600">
              Solicitamos ajustes no seu cadastro?
              <span className="mt-1 block">
                <button
                  type="button"
                  onClick={openMinhaCandidaturaDrawer}
                  className="font-semibold text-[var(--brand-primary)] underline-offset-2 transition hover:underline"
                >
                  Enviar informações complementares
                </button>
              </span>
            </p>
          </div>
        </div>

        <footer className="relative z-10 shrink-0 pb-5 text-center text-[11px] text-gray-400 sm:text-xs">
          {brand.copyright}
        </footer>
      </main>

      <MinhaCandidaturaDrawer
        open={minhaCandidaturaOpen && !minhaCandidaturaClosing}
        closing={minhaCandidaturaClosing}
        onClose={closeMinhaCandidaturaDrawer}
        onTransitionEnd={handleMinhaCandidaturaTransitionEnd}
      />

      <ProfissionalPasswordRecoveryDrawer
        open={recoveryOpen && !recoveryClosing}
        closing={recoveryClosing}
        onClose={closeRecoveryDrawer}
        onTransitionEnd={handleRecoveryTransitionEnd}
      />
    </div>
  )
}
