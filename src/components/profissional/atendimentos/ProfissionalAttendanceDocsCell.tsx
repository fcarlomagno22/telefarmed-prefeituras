type ProfissionalAttendanceDocsCellProps = {
  sentCount: number
  receivedCount: number
}

export function ProfissionalAttendanceDocsCell({
  sentCount,
  receivedCount,
}: ProfissionalAttendanceDocsCellProps) {
  if (sentCount === 0 && receivedCount === 0) {
    return <span className="text-xs text-gray-400">—</span>
  }

  return (
    <div className="flex flex-col items-center gap-0.5 text-[11px] leading-snug text-gray-600">
      {sentCount > 0 ? (
        <span>
          <span className="font-bold tabular-nums text-gray-900">{sentCount}</span> enviado
          {sentCount === 1 ? '' : 's'}
        </span>
      ) : null}
      {receivedCount > 0 ? (
        <span>
          <span className="font-bold tabular-nums text-[var(--brand-primary)]">{receivedCount}</span>{' '}
          recebido{receivedCount === 1 ? '' : 's'}
        </span>
      ) : null}
    </div>
  )
}
