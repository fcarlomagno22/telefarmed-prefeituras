import type { VdRunWalkHealthDto } from './types.js'

export function toVdRunWalkHealthDto(): VdRunWalkHealthDto {
  return {
    ok: true,
    module: 'vd-run-walk',
  }
}
