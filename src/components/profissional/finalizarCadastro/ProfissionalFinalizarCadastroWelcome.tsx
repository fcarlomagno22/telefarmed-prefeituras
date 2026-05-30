import { ArrowRight, CalendarClock, Sparkles, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { brand } from '../../../config/brand'
import { profissionalRoutes } from '../../../config/profissionalRoutes'
import { ClosureSuccessLottie } from '../financeiro/ClosureSuccessLottie'

export function ProfissionalFinalizarCadastroWelcome() {
  return (
    <div
      className="flex flex-col items-center px-2 py-8 text-center sm:py-10"
      role="status"
      aria-live="polite"
    >
      <div className="relative flex h-[200px] w-[200px] items-center justify-center">
        <div
          className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,107,0,0.18)_0%,transparent_68%)]"
          aria-hidden
        />
        <ClosureSuccessLottie />
      </div>

      <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary-light)] px-3 py-1 text-xs font-semibold text-[var(--brand-primary)]">
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
        Cadastro concluído
      </p>

      <h2 className="mt-4 text-xl font-bold text-gray-900 sm:text-[22px]">
        Bem-vindo(a) à {brand.appName}!
      </h2>
      <p className="mt-2 max-w-sm text-xs leading-relaxed text-gray-500 sm:text-[13px]">
        Sua conta está pronta. Acesse a plataforma para ver sua agenda, assumir plantões e
        acompanhar seus repasses financeiros.
      </p>

      <div className="mt-6 grid w-full max-w-sm gap-3 sm:grid-cols-2">
        <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50/80 p-4 text-center shadow-sm">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
            <CalendarClock className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
          </span>
          <p className="mt-2.5 text-xs font-semibold text-gray-900">Agenda e plantões</p>
          <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
            Confira seus dias designados e filas de atendimento.
          </p>
        </div>
        <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50/80 p-4 text-center shadow-sm">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Wallet className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
          </span>
          <p className="mt-2.5 text-xs font-semibold text-gray-900">Financeiro</p>
          <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
            A chave PIX pode ser alterada depois no seu perfil.
          </p>
        </div>
      </div>

      <Link
        to={profissionalRoutes.login}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-7 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(255,107,0,0.35)] transition hover:bg-[var(--brand-primary-hover)]"
      >
        Acessar a plataforma
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  )
}
