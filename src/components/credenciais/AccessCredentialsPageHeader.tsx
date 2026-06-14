import { Plus } from 'lucide-react'
import { useUbtUnitStation } from '../../hooks/useUbtUnitStation'

type AccessCredentialsPageHeaderProps = {
  onNewUser?: () => void
}

export function AccessCredentialsPageHeader({ onNewUser }: AccessCredentialsPageHeaderProps) {
  const { unitName } = useUbtUnitStation()
  const breadcrumb = unitName.toUpperCase()

  return (
    <header className="shrink-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
        {breadcrumb}
      </p>

      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Credenciais de acesso</h1>
          <p className="mt-2 max-w-xl text-sm text-gray-500">
            Gerencie usuários e defina níveis de acesso ao sistema.
          </p>
        </div>

        {onNewUser ? (
          <button
            type="button"
            onClick={onNewUser}
            className="btn-brand-gradient inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl px-5 py-2.5 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Novo usuário
          </button>
        ) : null}
      </div>
    </header>
  )
}
