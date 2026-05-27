import { prefeituraAgendasAttendanceByUbs } from '../../../data/prefeituraAgendasMock'
import {
  formatAgendasNumber,
  prefeituraAgendasBottomCardHeightClass,
  prefeituraAgendasScrollClass,
} from './prefeituraAgendasUi'

function absenceBarTone(rate: number) {
  if (rate >= 25) return 'from-red-400 to-red-600'
  if (rate >= 20) return 'from-amber-400 to-orange-500'
  return 'from-emerald-400 to-green-500'
}

export function PrefeituraAgendasAttendanceCard() {
  const rows = prefeituraAgendasAttendanceByUbs

  return (
    <article
      className={[
        'flex shrink-0 flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)]',
        prefeituraAgendasBottomCardHeightClass,
      ].join(' ')}
    >
      <header className="relative z-30 shrink-0 border-b border-gray-100 bg-white px-4 py-3">
        <h3 className="text-sm font-bold text-gray-900">Comparecimento e Faltas</h3>
        <p className="mt-0.5 text-xs text-gray-500">Por unidade da rede</p>
      </header>

      <div
        className={[
          'relative isolate min-h-0 flex-1 overflow-x-auto overflow-y-auto overscroll-y-contain bg-white px-3 pb-4 sm:px-4',
          prefeituraAgendasScrollClass,
        ].join(' ')}
      >
        <table className="w-full min-w-0 border-separate border-spacing-0 text-xs">
          <thead className="sticky top-0 z-20">
            <tr className="text-[10px] font-bold uppercase tracking-wide text-gray-400 shadow-[0_-1rem_0_0_#ffffff,0_1px_0_0_rgb(243,244,246)]">
              <th className="border-b border-gray-100 bg-white px-3 py-2 text-center">
                UNIDADE
              </th>
              <th className="border-b border-gray-100 bg-white px-3 py-2 text-center">
                COMPARECIMENTO
              </th>
              <th className="border-b border-gray-100 bg-white px-3 py-2 text-center">
                FALTAS
              </th>
              <th className="border-b border-gray-100 bg-white px-3 py-2 pr-5 text-center">
                TAXA DE FALTA
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-3 py-2.5 text-center font-semibold text-gray-800">
                  {row.label}
                </td>
                <td className="px-3 py-2.5 text-center font-bold tabular-nums text-emerald-600">
                  {formatAgendasNumber(row.attended)}
                </td>
                <td className="px-3 py-2.5 text-center font-bold tabular-nums text-red-600">
                  {formatAgendasNumber(row.absences)}
                </td>
                <td className="px-3 py-2.5 pr-5">
                  <div className="mx-auto flex w-full max-w-[8.75rem] items-center justify-center gap-2.5">
                    <div className="h-1.5 w-[3.25rem] shrink-0 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={[
                          'h-full rounded-full bg-gradient-to-r transition-all duration-700',
                          absenceBarTone(row.absenceRate),
                        ].join(' ')}
                        style={{ width: `${Math.min(row.absenceRate, 100)}%` }}
                      />
                    </div>
                    <span className="min-w-[2.25rem] shrink-0 text-center font-semibold tabular-nums text-gray-700">
                      {row.absenceRate}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  )
}
