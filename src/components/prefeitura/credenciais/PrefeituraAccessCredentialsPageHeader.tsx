import { Plus } from 'lucide-react'
import { useEntidadeCopy } from '../../../hooks/useEntidadeCopy'
import { brand } from '../../../config/brand'
import type { PrefeituraAccessCredentialsTab } from './PrefeituraAccessCredentialsTabs'

type PrefeituraAccessCredentialsPageHeaderProps = {
  activeTab: PrefeituraAccessCredentialsTab
  onNewUser?: () => void
}

export function PrefeituraAccessCredentialsPageHeader({
  activeTab,
  onNewUser,
}: PrefeituraAccessCredentialsPageHeaderProps) {
  const copy = useEntidadeCopy()
  const isPortalTab = activeTab === 'portal'
  const newUserLabel = isPortalTab ? 'Novo gestor' : 'Novo operador UBT'

  return (
    <header className="shrink-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
        {copy.gestaoLabel.toUpperCase()} · CREDENCIAIS
      </p>

      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Credenciais de acesso</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500">
            {isPortalTab
              ? `Cadastre gestores do ${copy.portal} (/prefeitura) e defina quais páginas e ações cada um pode acessar.`
              : `Cadastre operadores das UBTs (/ubt) vinculados às unidades ${copy.daRede}.`}
          </p>
          <p className="mt-2 text-xs font-medium text-gray-400">
            Operador: {brand.prefeituraOperatorName} · {brand.prefeituraOperatorRole}
          </p>
        </div>

        {onNewUser ? (
          <button
            type="button"
            onClick={onNewUser}
            className="btn-brand-gradient inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl px-5 py-2.5 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            {newUserLabel}
          </button>
        ) : null}
      </div>
    </header>
  )
}
