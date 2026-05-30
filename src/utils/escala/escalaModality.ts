import type { AdminEscalaModality } from '../../types/adminEscala'
import type { ProfissionalEscalaModality } from '../../types/profissionalEscalaDisponivel'
import { PROFISSIONAL_TELEMEDICINE_LABEL } from '../../config/profissionalConfig'

export const adminEscalaModalityLabels: Record<AdminEscalaModality, string> = {
  tele: 'Telemedicina',
  hibrido: 'Híbrido',
  presencial_ubt: 'Presencial',
}

export function adminModalityToProfissional(
  modality: AdminEscalaModality,
): ProfissionalEscalaModality {
  if (modality === 'presencial_ubt') return 'presencial'
  return 'tele'
}

export function profissionalModalityLabelFromAdmin(modality: AdminEscalaModality): string {
  if (modality === 'tele' || modality === 'hibrido') {
    return modality === 'hibrido' ? 'Híbrido' : PROFISSIONAL_TELEMEDICINE_LABEL
  }
  return 'Presencial'
}

export function profissionalPlantaoSubtitle(
  modality: AdminEscalaModality,
  unitName: string,
): string {
  if (modality === 'tele' || modality === 'hibrido') return PROFISSIONAL_TELEMEDICINE_LABEL
  return unitName
}
