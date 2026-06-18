type EntidadeRelatorioReportHeaderProps = {
  title: string
  description?: string
  entidadeRazaoSocial?: string
  periodLabel?: string
  brandName: string
  logoUrl: string
  generatedAtLabel?: string
  generatedBy?: string
}

export function EntidadeRelatorioReportHeader({
  title,
  description,
  entidadeRazaoSocial,
  periodLabel,
  brandName,
  logoUrl,
  generatedAtLabel,
  generatedBy,
}: EntidadeRelatorioReportHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-gray-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
          Relatório operacional
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
        {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
        <div className="mt-3 space-y-0.5 text-xs text-gray-500">
          {entidadeRazaoSocial ? (
            <p>
              <span className="font-semibold text-gray-700">{entidadeRazaoSocial}</span>
              {' · '}
              {brandName}
            </p>
          ) : (
            <p className="font-semibold text-gray-700">{brandName}</p>
          )}
          {periodLabel ? (
            <p>
              Período: <span className="font-semibold text-gray-700">{periodLabel}</span>
            </p>
          ) : null}
          {generatedAtLabel ? (
            <p>
              Gerado em <span className="font-semibold text-gray-700">{generatedAtLabel}</span>
              {generatedBy ? (
                <>
                  {' '}
                  por <span className="font-semibold text-gray-700">{generatedBy}</span>
                </>
              ) : null}
            </p>
          ) : null}
        </div>
      </div>
      <img
        src={logoUrl}
        alt={brandName}
        className="h-9 w-auto max-w-[140px] shrink-0 object-contain"
      />
    </header>
  )
}
