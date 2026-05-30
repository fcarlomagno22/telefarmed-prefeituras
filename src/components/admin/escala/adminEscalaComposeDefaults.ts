export function defaultClosedRange() {
  const start = new Date()
  const end = new Date()
  end.setDate(end.getDate() + 13)
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return { start: fmt(start), end: fmt(end) }
}
