export type PosConsultaEvolucaoComparacao = 'melhorou' | 'igual' | 'piorou'

export type PosConsultaMedicacaoAdesao = 'sim' | 'parcial' | 'nao'

export type PosConsultaCheckinStatus = 'pendente' | 'respondido' | 'expirado'

export type PosConsultaMeasurementId = 'blood_pressure' | 'blood_glucose'

export type PosConsultaVitalField<T> = {
  value: T | null
  notMeasured: boolean
}

export type PosConsultaAlertSignId =
  | 'dispneia'
  | 'dor_toracica'
  | 'febre_persistente'
  | 'sangramento'
  | 'confusao_mental'

export type PosConsultaCheckinRespostas = {
  evolucaoComparacao: PosConsultaEvolucaoComparacao | null
  intensidadeSintoma: number | null
  medicacaoAdesao: PosConsultaMedicacaoAdesao | null
  medicacaoAdesaoMotivo: string
  bloodPressureSystolic: PosConsultaVitalField<number>
  bloodPressureDiastolic: PosConsultaVitalField<number>
  bloodGlucose: PosConsultaVitalField<number>
  alertSigns: Record<PosConsultaAlertSignId, boolean>
}

export type PosConsultaCheckinContext = {
  token: string
  status: PosConsultaCheckinStatus
  patientFirstName: string
  specialtyName: string
  doctorName: string
  planDayNumber: number
  planTotalDays: number
  checkinNumber: number
  totalCheckins: number
  nextCheckinLabel: string | null
  requestedMeasurements: PosConsultaMeasurementId[]
  respostas?: PosConsultaCheckinRespostas
  respondidoEmLabel?: string
}

export type PosConsultaSubmitResult = {
  nextCheckinLabel: string | null
}

export type PosConsultaPlanStatus = 'ativo' | 'encerrado'

export type PosConsultaCheckinListStatus = 'respondido' | 'disponivel' | 'agendado' | 'expirado'

export type PosConsultaPlanCheckinItem = {
  id: string
  checkinNumber: number
  planDayNumber: number
  status: PosConsultaCheckinListStatus
  scheduledDateLabel: string
  token: string
  respondedAtLabel?: string
  evolucaoComparacao?: PosConsultaEvolucaoComparacao
  summary?: string
  respostas?: PosConsultaCheckinRespostas
  hasAlertSign?: boolean
}

export type PosConsultaPlanView = {
  hasPlan: boolean
  planStatus: PosConsultaPlanStatus
  planDayNumber: number
  planTotalDays: number
  totalCheckins: number
  answeredCheckins: number
  nextCheckinNumber: number | null
  nextCheckinDateLabel: string | null
  availableCheckin: PosConsultaPlanCheckinItem | null
  checkins: PosConsultaPlanCheckinItem[]
}

export function emptyPosConsultaVitalField<T>(): PosConsultaVitalField<T> {
  return { value: null, notMeasured: false }
}

export function emptyPosConsultaCheckinRespostas(): PosConsultaCheckinRespostas {
  return {
    evolucaoComparacao: null,
    intensidadeSintoma: null,
    medicacaoAdesao: null,
    medicacaoAdesaoMotivo: '',
    bloodPressureSystolic: emptyPosConsultaVitalField(),
    bloodPressureDiastolic: emptyPosConsultaVitalField(),
    bloodGlucose: emptyPosConsultaVitalField(),
    alertSigns: {
      dispneia: false,
      dor_toracica: false,
      febre_persistente: false,
      sangramento: false,
      confusao_mental: false,
    },
  }
}
