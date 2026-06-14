import type { ConsultationStatus } from '../data/consultasMock'

export function consultaDateTimeCaption(status: ConsultationStatus): string {
  if (status === 'cancelada') return 'Cancelada em'
  if (status === 'concluida') return 'Realizada em'
  return 'Iniciada em'
}
