import { FileText } from 'lucide-react'
import { getPrefeituraById } from '../../../data/adminEscalaCatalog'
import type { EscalaContratoOptionApi } from '../../../lib/services/admin/escala'
import { AdminEscalaContratoField } from './AdminEscalaContratoField'

type AdminEscalaComposeContratoColumnProps = {
  prefeituraId: string | null
  contratoId: string
  specialtyIds?: string[]
  onContratoChange: (contratoId: string, contrato?: EscalaContratoOptionApi | null) => void
  onLoadStateChange: (state: { count: number; resolved: boolean }) => void
  onContractsResolved?: (contratos: EscalaContratoOptionApi[]) => void
}

export function AdminEscalaComposeContratoColumn({
  prefeituraId,
  contratoId,
  specialtyIds = [],
  onContratoChange,
  onLoadStateChange,
  onContractsResolved,
}: AdminEscalaComposeContratoColumnProps) {
  if (!prefeituraId) {
    return (
      <div className="flex h-full min-h-[16rem] flex-col items-center justify-center rounded-xl bg-[#f8f9fb] px-6 text-center ring-1 ring-gray-200/70">
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-gray-400 ring-1 ring-gray-200/80">
          <FileText className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <p className="text-sm font-semibold text-gray-800">Contrato vigente</p>
        <p className="mt-1.5 max-w-[14rem] text-sm text-gray-500">
          Selecione uma prefeitura ao lado para ver e escolher o contrato.
        </p>
      </div>
    )
  }

  const prefeitura = getPrefeituraById(prefeituraId)
  const label = prefeitura ? `${prefeitura.name} · ${prefeitura.uf}` : 'Prefeitura'

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4">
        <p className="text-sm font-bold text-gray-900">Contrato vigente</p>
        <p className="mt-0.5 text-xs text-gray-500">{label}</p>
      </div>
      <AdminEscalaContratoField
        variant="list"
        prefeituraScope={{ mode: 'selected', prefeituraIds: [prefeituraId] }}
        specialtyIds={specialtyIds}
        value={contratoId}
        onChange={(nextId, contrato) => onContratoChange(nextId, contrato)}
        onContractsLoaded={(count, contratos) => {
          onLoadStateChange({ count, resolved: true })
          if (contratos?.length) onContractsResolved?.(contratos)
        }}
      />
    </div>
  )
}
