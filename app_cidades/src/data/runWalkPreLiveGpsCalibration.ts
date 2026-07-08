let gpsPreCalibrated = false

export function setRunWalkPreLiveGpsCalibrated(value: boolean): void {
  gpsPreCalibrated = value
}

export function consumeRunWalkPreLiveGpsCalibrated(): boolean {
  const value = gpsPreCalibrated
  gpsPreCalibrated = false
  return value
}

export function resetRunWalkPreLiveGpsCalibration(): void {
  gpsPreCalibrated = false
}
