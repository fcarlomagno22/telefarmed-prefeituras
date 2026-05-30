import { Link } from 'react-router-dom'
import { brand } from '../../../config/brand'
import { profissionalRoutes } from '../../../config/profissionalRoutes'
import { FeaturePanel } from '../../login/FeaturePanel'
import { ProfissionalFinalizarCadastroForm } from './ProfissionalFinalizarCadastroForm'

export function ProfissionalFinalizarCadastroPageContent() {
  return (
    <div className="flex min-h-screen bg-[#f5f6f8] lg:flex-row">
      <FeaturePanel variant="profissional" />

      <main className="relative flex min-h-screen flex-1 flex-col overflow-hidden">
        <div className="relative z-10 flex flex-1 flex-col px-6 py-8 sm:px-12 lg:px-14 lg:py-12 xl:px-20">
          <header className="mx-auto w-full max-w-lg pt-2 text-center lg:pt-4">
            <h1 className="text-base font-bold leading-snug text-[var(--brand-primary)] sm:text-[17px] lg:text-lg">
              Aprovação confirmada — complete seu acesso
            </h1>
            <p className="mx-auto mt-1.5 max-w-md text-[11px] leading-relaxed text-gray-500 sm:text-xs">
              Informe os dados da sua empresa, chave PIX, contrato e senha para entrar na
              plataforma.
            </p>
          </header>

          <div className="flex flex-1 flex-col items-center justify-center py-6">
            <ProfissionalFinalizarCadastroForm />
          </div>

          <p className="mx-auto max-w-lg text-center text-[11px] text-gray-500 sm:text-xs">
            Já finalizou?{' '}
            <Link
              to={profissionalRoutes.login}
              className="font-semibold text-[var(--brand-primary)] transition hover:underline"
            >
              Entrar na plataforma
            </Link>
          </p>
        </div>

        <footer className="relative z-10 shrink-0 pb-5 text-center text-[11px] text-gray-400 sm:text-xs">
          {brand.copyright}
        </footer>
      </main>
    </div>
  )
}
