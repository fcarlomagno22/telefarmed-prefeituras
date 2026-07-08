import { resolveRequestedMeasurements } from '../pos-consulta/formatters.js'
import type { PosConsultaCheckinRespostasInput } from '../pos-consulta/schemas.js'
import { insertGlicemiaLeitura } from './glicemia.repository.js'
import {
  existsLeituraFromPosConsultaCheckin,
  POS_CONSULTA_CHECKIN_METADATA_KEY,
} from './leituras.repository.js'
import { insertPressaoLeitura } from './pressao.repository.js'
import type { VdMetricasPacienteScope } from './types.js'

type VitalField = { value: number | null; notMeasured: boolean }

export type PosConsultaVitalsExtraction = {
  bloodPressure: { systolic: number; diastolic: number } | null
  bloodGlucose: { amountMg: number } | null
}

function isMeasuredVital(
  field: VitalField,
): field is { value: number; notMeasured: false } {
  return (
    !field.notMeasured &&
    field.value != null &&
    Number.isFinite(field.value) &&
    field.value > 0
  )
}

export function extractPosConsultaVitals(
  respostas: PosConsultaCheckinRespostasInput,
  numeroCheckin: number,
): PosConsultaVitalsExtraction {
  const requested = resolveRequestedMeasurements(numeroCheckin)

  let bloodPressure: PosConsultaVitalsExtraction['bloodPressure'] = null
  if (requested.includes('blood_pressure')) {
    const systolic = respostas.bloodPressureSystolic
    const diastolic = respostas.bloodPressureDiastolic
    if (
      isMeasuredVital(systolic) &&
      isMeasuredVital(diastolic) &&
      systolic.value > diastolic.value
    ) {
      bloodPressure = {
        systolic: Math.round(systolic.value),
        diastolic: Math.round(diastolic.value),
      }
    }
  }

  let bloodGlucose: PosConsultaVitalsExtraction['bloodGlucose'] = null
  if (requested.includes('blood_glucose') && isMeasuredVital(respostas.bloodGlucose)) {
    bloodGlucose = { amountMg: Math.round(respostas.bloodGlucose.value) }
  }

  return { bloodPressure, bloodGlucose }
}

export type SyncPosConsultaVitalsInput = {
  scope: VdMetricasPacienteScope
  checkinId: string
  numeroCheckin: number
  respostas: PosConsultaCheckinRespostasInput
  recordedAtIso: string
}

export type SyncPosConsultaVitalsResult = {
  bloodPressureCreated: boolean
  bloodGlucoseCreated: boolean
}

export async function syncPosConsultaVitalsToMetricas(
  input: SyncPosConsultaVitalsInput,
): Promise<SyncPosConsultaVitalsResult> {
  const vitals = extractPosConsultaVitals(input.respostas, input.numeroCheckin)
  const metadados = { [POS_CONSULTA_CHECKIN_METADATA_KEY]: input.checkinId }
  const result: SyncPosConsultaVitalsResult = {
    bloodPressureCreated: false,
    bloodGlucoseCreated: false,
  }

  if (vitals.bloodPressure) {
    const exists = await existsLeituraFromPosConsultaCheckin(
      input.scope.pacienteId,
      'pressao',
      input.checkinId,
    )
    if (!exists) {
      await insertPressaoLeitura(input.scope, {
        systolic: vitals.bloodPressure.systolic,
        diastolic: vitals.bloodPressure.diastolic,
        recordedAtIso: input.recordedAtIso,
        origem: 'pos_consulta',
        metadados,
      })
      result.bloodPressureCreated = true
    }
  }

  if (vitals.bloodGlucose) {
    const exists = await existsLeituraFromPosConsultaCheckin(
      input.scope.pacienteId,
      'glicemia',
      input.checkinId,
    )
    if (!exists) {
      await insertGlicemiaLeitura(input.scope, {
        amountMg: vitals.bloodGlucose.amountMg,
        context: 'other',
        recordedAtIso: input.recordedAtIso,
        origem: 'pos_consulta',
        metadados,
      })
      result.bloodGlucoseCreated = true
    }
  }

  return result
}
