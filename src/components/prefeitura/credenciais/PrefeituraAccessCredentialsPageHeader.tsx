import { Plus } from 'lucide-react'
import { brand } from '../../../config/brand'

type PrefeituraAccessCredentialsPageHeaderProps = {
  onNewUser: () => void
}

export function PrefeituraAccessCredentialsPageHeader({
  onNewUser,
}: PrefeituraAccessCredentialsPageHeaderProps) {
  return (
    <header className="shrink-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
        GESTÃO MUNICIPAL · CREDENCIAIS
      </p>

      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Credenciais de acesso</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500">
            Visão consolidada dos acessos da rede municipal por UBT e região administrativa (RA).
            Expanda cada unidade para ver responsável, função, nível de acesso e permissões.
          </p>
          <p className="mt-2 text-xs font-medium text-gray-400">
            Operador: {brand.prefeituraOperatorName} · {brand.prefeituraOperatorRole}
          </p>
        </div>

        <button
          type="button"
          onClick={onNewUser}
          className="btn-brand-gradient inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl px-5 py-2.5 text-sm font-semibold"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Novo usuário
        </button>
      </div>
    </header>
  )
}
