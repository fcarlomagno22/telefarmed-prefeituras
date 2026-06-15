export function parseClockTimeToMinutes(time: string): number {
  const [rawHours, rawMinutes] = time.split(':')
  let hours = Number.parseInt(rawHours ?? '0', 10)
  const minutes = Number.parseInt(rawMinutes ?? '0', 10)
  if (!Number.isFinite(hours)) hours = 0
  if (hours === 24) hours = 0
  return hours * 60 + (Number.isFinite(minutes) ? minutes : 0)
}

export function isDailyTimeRangeValid(start: string, end: string): boolean {
  return parseClockTimeToMinutes(end) > parseClockTimeToMinutes(start)
}
