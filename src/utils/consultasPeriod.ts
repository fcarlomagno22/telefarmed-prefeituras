function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function getDefaultConsultasPeriod() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)
  return { start: toIsoDate(start), end: toIsoDate(end) }
}

export function getDefaultProfissionalAtendimentosPeriod() {
  return getDefaultConsultasPeriod()
}

export function getDefaultPrefeituraConsultasPeriod() {
  const end = new Date()
  const start = new Date(end.getFullYear(), end.getMonth(), 1)
  return { start: toIsoDate(start), end: toIsoDate(end) }
}
