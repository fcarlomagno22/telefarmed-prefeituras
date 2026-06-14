import type { PrioridadeComunicado, PrioridadeComunicadoApi } from './types.js'

export function priorityToApi(value: PrioridadeComunicado): PrioridadeComunicadoApi {
  return value === 'importante' ? 'important' : 'normal'
}

export function priorityFromApi(value: PrioridadeComunicadoApi): PrioridadeComunicado {
  return value === 'important' ? 'importante' : 'normal'
}
