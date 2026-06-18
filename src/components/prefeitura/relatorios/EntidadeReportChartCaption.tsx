import { evolucaoNaRede } from '../../../lib/entidadeBranding/copy'
import { useEntidadeCopy } from '../../../hooks/useEntidadeCopy'

type EntidadeReportChartCaptionProps = {
  mode: 'daily' | 'monthly'
  /** Texto após "Evolução mensal/diária", ex.: "de retornos pendentes" */
  subject: string
  className?: string
}

export function EntidadeReportChartCaption({
  mode,
  subject,
  className = 'mt-3 text-xs text-gray-500',
}: EntidadeReportChartCaptionProps) {
  const copy = useEntidadeCopy()
  return <p className={className}>{evolucaoNaRede(copy, mode, subject)}</p>
}
