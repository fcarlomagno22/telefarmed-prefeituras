import { Skeleton } from '../../ui/Skeleton'

const TABLE_ROW_COUNT = 8

export function ProfissionalAtendimentosTableSkeleton() {
  return (
    <table
      className="w-full min-w-[720px] border-collapse text-left"
      aria-busy="true"
      aria-label="Carregando histórico de atendimentos"
    >
      <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm">
        <tr className="border-b border-gray-100 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          <th className="px-5 py-3">Data</th>
          <th className="px-5 py-3">Paciente</th>
          <th className="px-5 py-3 text-center">Idade</th>
          <th className="px-5 py-3 text-center">Duração</th>
          <th className="px-5 py-3 text-center">Docs</th>
          <th className="px-5 py-3 text-center">Status</th>
          <th className="w-20 px-3 py-3 text-center">Detalhes</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: TABLE_ROW_COUNT }).map((_, index) => (
          <tr key={index} className="border-b border-gray-50">
            <td className="px-5 py-3.5">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="mt-1.5 h-3 w-10" />
            </td>
            <td className="px-5 py-3.5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-36 max-w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </td>
            <td className="px-5 py-3.5 text-center">
              <Skeleton className="mx-auto h-4 w-14" />
            </td>
            <td className="px-5 py-3.5 text-center">
              <Skeleton className="mx-auto h-4 w-12" />
            </td>
            <td className="px-5 py-3.5 text-center">
              <Skeleton className="mx-auto h-4 w-8" />
            </td>
            <td className="px-5 py-3.5 text-center">
              <Skeleton className="mx-auto h-8 w-[8.5rem] rounded-lg" />
            </td>
            <td className="w-20 px-3 py-3.5 text-center">
              <Skeleton className="mx-auto h-9 w-9 rounded-lg" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
