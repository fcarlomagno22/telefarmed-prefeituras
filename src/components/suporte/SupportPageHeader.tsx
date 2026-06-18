import { MessageSquarePlus } from 'lucide-react'
import { brand } from '../../config/brand'
import { usePlatformOperatorLabel } from '../../hooks/useEntidadeCopy'
import { useUbtUnitStation } from '../../hooks/useUbtUnitStation'

type SupportPageHeaderProps = {
  onOpenNewTicket: () => void
  variant?: 'ubt' | 'prefeitura'
  showNewTicketButton?: boolean
}

export function SupportPageHeader({
  onOpenNewTicket,
  variant = 'ubt',
  showNewTicketButton = true,
}: SupportPageHeaderProps) {
  const isPrefeitura = variant === 'prefeitura'
  const platformOperatorLabel = usePlatformOperatorLabel()
  const { unitName } = useUbtUnitStation()
  const breadcrumb = isPrefeitura
    ? 'GESTÃO MUNICIPAL · SUPORTE'
    : unitName.toUpperCase()

  return (
    <header className="shrink-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
        {breadcrumb}
      </p>

      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            {isPrefeitura ? 'Central de suporte' : 'Suporte técnico'}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-gray-500">
            {isPrefeitura
              ? `Abra chamados da entidade, acompanhe solicitações abertas pelas UBTs e visualize as conversas com o suporte ${platformOperatorLabel}.`
              : 'Acompanhe seus chamados de suporte técnico e fique por dentro das atualizações.'}
          </p>
          {isPrefeitura ? (
            <p className="mt-2 text-xs font-medium text-gray-400">
              Operador: {brand.prefeituraOperatorName} · {brand.prefeituraOperatorRole}
            </p>
          ) : null}
        </div>

        {showNewTicketButton ? (
          <button
            type="button"
            onClick={onOpenNewTicket}
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border-2 border-[var(--brand-primary)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--brand-primary)] shadow-sm transition hover:bg-[var(--brand-primary-light)]"
          >
            <MessageSquarePlus className="h-4 w-4" strokeWidth={2} />
            Abrir novo chamado
          </button>
        ) : null}
      </div>
    </header>
  )
}
