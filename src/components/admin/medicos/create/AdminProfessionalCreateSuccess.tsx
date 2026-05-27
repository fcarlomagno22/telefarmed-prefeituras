import { CheckCircle2, UserRound } from 'lucide-react'
import { getCouncilLabel, type AdminProfessionalCreateDraft } from './adminProfessionalCreateTypes'

type AdminProfessionalCreateSuccessProps = {
  draft: AdminProfessionalCreateDraft
  onClose: () => void
}

export function AdminProfessionalCreateSuccess({
  draft,
  onClose,
}: AdminProfessionalCreateSuccessProps) {
  const councilLabel = getCouncilLabel(draft.profession)
  const name = draft.fullName.trim()

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-10 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 shadow-[0_8px_32px_rgba(16,185,129,0.2)] ring-1 ring-emerald-100">
        <CheckCircle2 className="h-10 w-10 text-emerald-500" strokeWidth={2} />
      </span>

      <h3 className="mt-6 text-xl font-bold text-gray-900">Profissional cadastrado!</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500">
        <strong className="text-gray-800">{name}</strong> foi incluído na base de profissionais e já
        pode acessar a plataforma com a senha definida.
      </p>

      <div className="mt-8 w-full max-w-md rounded-2xl border border-gray-200 bg-gradient-to-b from-[var(--brand-primary-light)]/40 to-white p-5 text-left shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <div className="flex items-start gap-3">
          {draft.photoDataUrl ? (
            <img
              src={draft.photoDataUrl}
              alt=""
              className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-gray-100"
            />
          ) : (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
              <UserRound className="h-6 w-6 text-[var(--brand-primary)]" strokeWidth={2} />
            </span>
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-primary)]">
              Resumo
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900">{name}</p>
            <p className="mt-2 text-sm text-gray-600">
              {draft.profession.replace(/s$/, '')} · {draft.specialty}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {councilLabel} {draft.councilNumber} / {draft.councilUf}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {draft.city}/{draft.state}
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="mt-8 rounded-xl bg-[var(--brand-primary)] px-8 py-3.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(255,107,0,0.35)] transition hover:bg-[var(--brand-primary-hover)]"
      >
        Fechar
      </button>
    </div>
  )
}
