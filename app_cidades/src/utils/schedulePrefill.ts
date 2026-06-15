export type ScheduleUbtPrefill = {
  ubtId: string
  ubtName: string
  ubtAddress: string
}

let pendingPrefill: ScheduleUbtPrefill | null = null

export function setScheduleUbtPrefill(value: ScheduleUbtPrefill) {
  pendingPrefill = value
}

export function consumeScheduleUbtPrefill() {
  const value = pendingPrefill
  pendingPrefill = null
  return value
}
