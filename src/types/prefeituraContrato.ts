export type PrefeituraContratoMonthOutcome = 'within' | 'reached' | 'exceeded'

export type PrefeituraContratoStatus = 'active' | 'expired'

export type PrefeituraContratoMonthlyRow = {
  key: string
  year: number
  month: number
  label: string
  contracted: number
  performed: number
  avulsoCount: number
  outcome: PrefeituraContratoMonthOutcome
}

export type PrefeituraContratoModality = 'mensal' | 'pacote_fechado' | 'sob_demanda'

export type PrefeituraContratoInfo = {
  contractNumber: string
  municipalityName: string
  legalName: string
  signedAt: string
  startsAt: string
  endsAt: string
  modalidade?: PrefeituraContratoModality
  contractTypeLabel?: string
  monthlyPackageConsultations: number
  allowsAvulsoAfterPackage: boolean
  avulsoUnitValueBrl: number
  commercialTeam: string
  commercialEmail: string
}

export type PrefeituraContratoRecord = {
  id: string
  status: PrefeituraContratoStatus
  selectorTitle: string
  selectorSubtitle: string
  info: PrefeituraContratoInfo
  monthlyHistory: PrefeituraContratoMonthlyRow[]
}

export type PrefeituraContratoOption = {
  id: string
  title: string
  subtitle: string
  contractNumber: string
  status: PrefeituraContratoStatus
}

export type PrefeituraContratoUtilizacao = {
  consultasContratadas: number | null
  consultasRealizadas: number
  percentualUtilizado: number | null
  permiteUltrapassar: boolean
  tipo: string
  currentMonth: {
    year: number
    month: number
    contracted: number
    performed: number
    avulsoCount: number
  }
}

export type PrefeituraContratoEspecialidade = {
  id: string
  nome: string
  precoContratadoBrl: number | null
  precoExcedenteBrl: number | null
}
