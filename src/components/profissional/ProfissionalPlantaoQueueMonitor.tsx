import { useProfissionalPlantaoQueueMonitor } from '../../hooks/useProfissionalPlantaoQueueMonitor'

/** Monitor invisível: polling global + alerta sonoro da sala de espera. */
export function ProfissionalPlantaoQueueMonitor() {
  useProfissionalPlantaoQueueMonitor()
  return null
}
