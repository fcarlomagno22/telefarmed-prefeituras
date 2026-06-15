import type { PosConsultaCheckinContext, PosConsultaCheckinRespostas } from '../types/posConsulta'
import {
  getPosConsultaTotalCheckins,
  POS_CONSULTA_PLAN_TOTAL_DAYS,
} from '../config/posConsulta'

export const POS_CONSULTA_MOCK_TOKEN = 'mock-token'
export const POS_CONSULTA_MOCK_TOKEN_RESPONDIDO = 'mock-token-respondido'
export const POS_CONSULTA_MOCK_TOKEN_EXPIRADO = 'mock-token-expirado'

export { POS_CONSULTA_PLAN_TOTAL_DAYS, POS_CONSULTA_CHECKIN_INTERVAL_DAYS } from '../config/posConsulta'

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

const MOCK_RESPONDED_ANSWERS: PosConsultaCheckinRespostas = {
  evolucaoComparacao: 'melhorou',
  intensidadeSintoma: 3,
  medicacaoAdesao: 'sim',
  medicacaoAdesaoMotivo: '',
  bloodPressureSystolic: { value: 128, notMeasured: false },
  bloodPressureDiastolic: { value: 82, notMeasured: false },
  bloodGlucose: { value: null, notMeasured: true },
  alertSigns: {
    dispneia: false,
    dor_toracica: false,
    febre_persistente: false,
    sangramento: false,
    confusao_mental: false,
  },
}

const MOCK_TOTAL_CHECKINS = getPosConsultaTotalCheckins()

export function buildMockPosConsultaCheckinContext(token: string): PosConsultaCheckinContext | null {
  if (token === POS_CONSULTA_MOCK_TOKEN_EXPIRADO) {
    return {
      token,
      status: 'expirado',
      patientFirstName: 'Maria',
      specialtyName: 'Clínica Geral',
      doctorName: 'Dr. João Pedro Santos',
      planDayNumber: 6,
      planTotalDays: POS_CONSULTA_PLAN_TOTAL_DAYS,
      checkinNumber: 2,
      totalCheckins: MOCK_TOTAL_CHECKINS,
      nextCheckinLabel: null,
      requestedMeasurements: ['blood_pressure', 'blood_glucose'],
    }
  }

  if (token === POS_CONSULTA_MOCK_TOKEN_RESPONDIDO) {
    return {
      token,
      status: 'respondido',
      patientFirstName: 'Maria',
      specialtyName: 'Clínica Geral',
      doctorName: 'Dr. João Pedro Santos',
      planDayNumber: 3,
      planTotalDays: POS_CONSULTA_PLAN_TOTAL_DAYS,
      checkinNumber: 1,
      totalCheckins: MOCK_TOTAL_CHECKINS,
      nextCheckinLabel: '04/06/2026',
      requestedMeasurements: ['blood_pressure'],
      respostas: MOCK_RESPONDED_ANSWERS,
      respondidoEmLabel: '02/06/2026 às 09:15',
    }
  }

  if (token === POS_CONSULTA_MOCK_TOKEN) {
    return {
      token,
      status: 'pendente',
      patientFirstName: 'Maria',
      specialtyName: 'Clínica Geral',
      doctorName: 'Dr. João Pedro Santos',
      planDayNumber: 6,
      planTotalDays: POS_CONSULTA_PLAN_TOTAL_DAYS,
      checkinNumber: 2,
      totalCheckins: MOCK_TOTAL_CHECKINS,
      nextCheckinLabel: '08/06/2026',
      requestedMeasurements: ['blood_pressure', 'blood_glucose'],
    }
  }

  return null
}
