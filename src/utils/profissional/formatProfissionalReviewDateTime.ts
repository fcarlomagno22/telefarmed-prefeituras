export function formatProfissionalReviewDateTime(iso: string) {
  const date = new Date(iso)
  const dateLine = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
  const timeLine = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)

  return {
    dateLine,
    timeLine,
    full: `${dateLine} às ${timeLine}`,
  }
}
