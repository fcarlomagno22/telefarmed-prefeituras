import { monitorOngoingServices } from '../../../data/prefeituraMonitorMock'
import { DashCard } from '../prefeituraDashboardUi'
import { monitorOngoingTableScrollClass, monitorTableHeadStickyClass } from './monitorTableScroll'

export function PrefeituraMonitorOngoingServicesTable() {
  const count = monitorOngoingServices.length

  return (
    <DashCard
      title="Detalhe de atendimento em andamento"
      subtitle="Visualização somente leitura · ações operacionais na UBS."
      bodyClassName="flex min-h-0 flex-col p-0"
      action={
        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
          {count} em andamento
        </span>
      }
    >
      <div className={monitorOngoingTableScrollClass}>
        <table className="w-full min-w-[720px] table-fixed text-sm">
          <thead className={monitorTableHeadStickyClass}>
            <tr className="border-b border-gray-200 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <th className="w-[14%] px-4 py-3 text-left">Unidade / sala</th>
              <th className="w-[12%] px-4 py-3 text-center">Paciente</th>
              <th className="w-[11%] px-4 py-3 text-center">Especialidade</th>
              <th className="w-[7%] px-4 py-3 text-center">Idade</th>
              <th className="w-[18%] px-4 py-3 text-center">Profissional</th>
              <th className="w-[6%] px-4 py-3 text-center">Fila</th>
              <th className="w-[10%] px-4 py-3 text-center">Iniciado há</th>
              <th className="w-[12%] px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {monitorOngoingServices.map((row) => (
              <tr key={row.id} className="text-gray-800 transition hover:bg-slate-50/80">
                <td className="px-4 py-3 text-left font-semibold text-gray-900">{row.unitRoom}</td>
                <td className="px-4 py-3 text-center">{row.patientName}</td>
                <td className="px-4 py-3 text-center text-gray-600">{row.specialty}</td>
                <td className="px-4 py-3 text-center tabular-nums">{row.age} anos</td>
                <td className="px-4 py-3 text-center text-gray-600">{row.professional}</td>
                <td className="px-4 py-3 text-center font-bold tabular-nums">{row.queue}</td>
                <td className="px-4 py-3 text-center font-bold tabular-nums text-gray-700">
                  {row.startedAgo}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center justify-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                    Em andamento
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashCard>
  )
}
