import { CheckCircle2 } from 'lucide-react'
import { brand } from '../../../config/brand'
import { profissionalLoggedProfile } from '../../../data/profissionalPerfilMock'
import { profissionalEscalaLoggedSpecialty } from '../../../data/profissionalEscalaDisponivelMock'

export function ProfissionalEscalaStatusBar() {
  return (
    <footer
      data-tour="escala-status-bar"
      className="flex shrink-0 flex-col gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs text-gray-600 shadow-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <p>
        <span className="font-semibold text-gray-800">Profissional logado:</span>{' '}
        {profissionalLoggedProfile.fullName} · {profissionalEscalaLoggedSpecialty}
      </p>
      <p className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
        Sessão ativa · {brand.appName}
      </p>
    </footer>
  )
}
