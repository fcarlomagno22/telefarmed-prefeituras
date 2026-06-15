import { isSlotEndReached } from './escalaDateTime.js'

export function isEscalaSlotStatusEncerrado(status: string): boolean {
  return status === 'encerrada' || status === 'cancelada'
}

export function isEscalaSlotHorarioEncerrado(
  data: string,
  horaFim: string,
  now = new Date(),
): boolean {
  return isSlotEndReached(data, horaFim, now)
}

export function isPlantaoStatusEncerrado(plantaoStatus: string): boolean {
  return plantaoStatus === 'realizado'
}

export function isEscalaSlotEncerrado(
  data: string,
  horaFim: string,
  slotStatus: string,
  now = new Date(),
): boolean {
  if (isEscalaSlotStatusEncerrado(slotStatus)) return true
  return isEscalaSlotHorarioEncerrado(data, horaFim, now)
}

export function isPlantaoEncerradoParaProfissional(input: {
  plantaoStatus: string
  slotData: string
  slotHoraFim: string
  slotStatus: string
  now?: Date
}): boolean {
  if (isPlantaoStatusEncerrado(input.plantaoStatus)) return true
  return isEscalaSlotEncerrado(
    input.slotData,
    input.slotHoraFim,
    input.slotStatus,
    input.now,
  )
}
