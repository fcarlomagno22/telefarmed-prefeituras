import type { ReactNode } from 'react'
import type { PrefeituraFaturamentoFechamentoLoteItem } from '../../../../types/prefeituraFaturamentoFechamento'
import { maskCpfForDisplay } from '../../../../utils/lgpdDisplay'
import { SituationStatusBadge } from '../../../ui/SituationStatusBadge'
import { formatPendenciaConsultaDate } from '../pendencias/prefeituraFaturamentoPendenciasUi'
import {
  prefeituraFaturamentoLoteExcluidaBadgeConfig,
  prefeituraFaturamentoLoteInclusaoBadgeConfig,
} from './prefeituraFaturamentoFechamentoUi'

type PrefeituraFaturamentoFechamentoLoteTableProps = {
  items: PrefeituraFaturamentoFechamentoLoteItem[]
  renderActions: (item: PrefeituraFaturamentoFechamentoLoteItem) => ReactNode
}

export function PrefeituraFaturamentoFechamentoLoteTable({
  items,
  renderActions,
}: PrefeituraFaturamentoFechamentoLoteTableProps) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center px-6 py-10 text-center">
        <p className="text-sm font-semibold text-gray-900">Nenhuma consulta no lote</p>
        <p className="mt-1 text-sm text-gray-600">
          Ajuste os filtros ou selecione outra competência.
        </p>
      </div>
    )
  }

  return (
    <table className="min-w-full text-left text-sm">
      <thead className="border-b border-gray-200 bg-gray-50/80 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        <tr>
          <th className="px-3 py-3">Paciente</th>
          <th className="px-3 py-3">Consulta</th>
          <th className="px-3 py-3">Profissional</th>
          <th className="px-3 py-3 text-center">Unidade</th>
          <th className="px-3 py-3 text-center">SIGTAP</th>
          <th className="px-3 py-3 text-center">Situação</th>
          <th className="w-14 px-3 py-3 text-center">Ações</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-gray-100">
        {items.map((item) => (
          <tr
            key={item.id}
            className={[
              'bg-white transition hover:bg-gray-50/80',
              item.excluded ? 'text-gray-600' : '',
            ].join(' ')}
          >
            <td className="px-3 py-3">
              <p className="font-medium text-gray-900">{item.patientName}</p>
              <p className="mt-0.5 text-xs text-gray-500">
                {item.patientCpf ? maskCpfForDisplay(item.patientCpf) : 'CPF ausente'}
              </p>
            </td>

            <td className="whitespace-nowrap px-3 py-3 text-gray-700">
              {formatPendenciaConsultaDate(item.consultaDate)}
            </td>

            <td className="px-3 py-3">
              <p className="font-medium text-gray-900">{item.professionalName}</p>
              <p className="mt-0.5 text-xs text-gray-500">{item.specialty}</p>
            </td>

            <td className="px-3 py-3 text-center">
              <p className="font-medium text-gray-900">{item.unitName}</p>
              <p className="mt-0.5 text-xs text-gray-500">CNES {item.cnes}</p>
            </td>

            <td className="max-w-[12rem] px-3 py-3 text-center">
              <p className="font-semibold tabular-nums text-gray-900">{item.procedureCode}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{item.procedureName}</p>
            </td>

            <td className="px-3 py-3">
              <div className="flex justify-center">
                <SituationStatusBadge
                config={
                  item.excluded
                    ? prefeituraFaturamentoLoteExcluidaBadgeConfig
                    : prefeituraFaturamentoLoteInclusaoBadgeConfig
                }
                widthClass="w-[6.5rem]"
              />
              </div>
            </td>

            <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
              {renderActions(item)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
