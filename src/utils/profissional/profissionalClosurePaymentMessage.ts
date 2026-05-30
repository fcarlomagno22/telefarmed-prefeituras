function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

/** Regra de repasse após envio da NF no fechamento da competência. */
export function getProfissionalClosurePaymentMessage(issuedAt: Date): string {
  const day = issuedAt.getDate()
  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(issuedAt)

  if (day <= 10) {
    return `O pagamento será realizado até o dia 10 de ${monthLabel}.`
  }

  const paymentDeadline = new Date(issuedAt)
  paymentDeadline.setDate(paymentDeadline.getDate() + 10)

  return `Como a nota foi enviada após o dia 10, o pagamento será realizado em até 10 dias após a emissão (previsão: ${formatLongDate(paymentDeadline)}).`
}

export async function simulateProfissionalInvoiceUpload(
  onProgress: (progress: number) => void,
): Promise<void> {
  const steps = 24
  const stepMs = 110

  for (let index = 1; index <= steps; index++) {
    await new Promise((resolve) => setTimeout(resolve, stepMs))
    onProgress(Math.min(100, Math.round((index / steps) * 100)))
  }
}
