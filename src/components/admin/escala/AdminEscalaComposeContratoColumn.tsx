import { FileText } from 'lucide-react'
import { getPrefeituraById } from '../../../data/adminEscalaCatalog'
import type { EscalaContratoOptionApi } from '../../../lib/services/admin/escala'
import { AdminEscalaContratoField } from './AdminEscalaContratoField'

type AdminEscalaComposeContratoColumnProps = {
  prefeituraIds: string[]
  contratosPorPrefeitura: Record<string, string>
  specialtyIds?: string[]
  onContratoChange: (
    prefeituraId: string,
    contratoId: string,
    contrato?: EscalaContratoOptionApi | null,
  ) => void
  onLoadStateChange: (prefeituraId: string, state: { count: number; resolved: boolean }) => void
  onContractsResolved?: (contratos: EscalaContratoOptionApi[]) => void
}

export function AdminEscalaComposeContratoColumn({
  prefeituraIds,
  contratosPorPrefeitura,
  specialtyIds = [],
  onContratoChange,
  onLoadStateChange,
  onContractsResolved,
}: AdminEscalaComposeContratoColumnProps) {
  if (prefeituraIds.length === 0) {
    return (
      <div className="flex h-full min-h-[16rem] flex-col items-center justify-center rounded-xl bg-[#f8f9fb] px-6 text-center ring-1 ring-gray-200/70">
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-gray-400 ring-1 ring-gray-200/80">
          <FileText className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <p className="text-sm font-semibold text-gray-800">Contrato vigente</p>
        <p className="mt-1.5 max-w-[14rem] text-sm text-gray-500">
          Selecione um ou mais clientes ao lado para escolher o contrato de cada um.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4">
        <p className="text-sm font-bold text-gray-900">Contrato vigente</p>
        <p className="mt-0.5 text-xs text-gray-500">
          Escolha o contrato operacional de cada cliente selecionado.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {prefeituraIds.map((prefeituraId) => {
          const prefeitura = getPrefeituraById(prefeituraId)
          const clientLabel = prefeitura?.name ?? 'Cliente'
          const ufLabel = prefeitura?.uf

          return (
            <section
              key={prefeituraId}
              className="rounded-xl bg-[#f8f9fb] p-4 ring-1 ring-gray-200/70"
            >
              <div className="mb-3">
                <p className="text-sm font-bold text-gray-900">{clientLabel}</p>
                {ufLabel ? <p className="text-xs text-gray-500">{ufLabel}</p> : null}
              </div>

              <AdminEscalaContratoField
                variant="list"
                prefeituraScope={{ mode: 'selected', prefeituraIds: [prefeituraId] }}
                specialtyIds={specialtyIds}
                value={contratosPorPrefeitura[prefeituraId] ?? ''}
                onChange={(contratoId, contrato) =>
                  onContratoChange(prefeituraId, contratoId, contrato)
                }
                onContractsLoaded={(count, contratos) => {
                  onLoadStateChange(prefeituraId, { count, resolved: true })
                  if (contratos?.length) onContractsResolved?.(contratos)
                }}
              />
            </section>
          )
        })}
      </div>
    </div>
  )
}
