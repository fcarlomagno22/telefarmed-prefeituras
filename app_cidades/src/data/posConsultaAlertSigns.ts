import type { PosConsultaCheckinRespostas } from '../types/posConsulta'

export const POS_CONSULTA_ALERT_SIGNS: {
  id: keyof PosConsultaCheckinRespostas['alertSigns']
  label: string
}[] = [
  { id: 'dispneia', label: 'Falta de ar ou dificuldade para respirar' },
  { id: 'dor_toracica', label: 'Dor no peito' },
  { id: 'febre_persistente', label: 'Febre persistente (acima de 38 °C)' },
  { id: 'sangramento', label: 'Sangramento incomum' },
  { id: 'confusao_mental', label: 'Confusão mental ou tontura intensa' },
]
