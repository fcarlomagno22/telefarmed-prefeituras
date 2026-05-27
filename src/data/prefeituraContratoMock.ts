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

export type PrefeituraContratoInfo = {
  contractNumber: string
  municipalityName: string
  legalName: string
  signedAt: string
  startsAt: string
  endsAt: string
  monthlyPackageConsultations: number
  allowsAvulsoAfterPackage: boolean
  avulsoUnitValueBrl: number
  commercialTeam: string
  commercialEmail: string
}

export type PrefeituraContratoRecord = {
  id: string
  status: PrefeituraContratoStatus
  /** Rótulo principal no seletor. */
  selectorTitle: string
  /** Período de vigência resumido. */
  selectorSubtitle: string
  info: PrefeituraContratoInfo
  monthlyHistory: PrefeituraContratoMonthlyRow[]
}

const SHARED_MUNICIPALITY = {
  municipalityName: 'Município de São José dos Campos',
  legalName: 'Prefeitura Municipal de São José dos Campos',
  commercialTeam: 'Equipe Comercial Telefarmed',
  commercialEmail: 'comercial@telefarmed.com.br',
} as const

function monthLabel(year: number, month: number) {
  const date = new Date(year, month - 1, 1)
  const short = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date)
  const cap = short.charAt(0).toUpperCase() + short.slice(1).replace('.', '')
  return `${cap}/${String(year).slice(-2)}`
}

function periodSubtitle(startsAt: string, endsAt: string) {
  const [sy, sm] = startsAt.split('-').map(Number)
  const [ey, em, ed] = endsAt.split('-').map(Number)
  const start = monthLabel(sy, sm)
  const end = new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    year: 'numeric',
  })
    .format(new Date(ey, em - 1, ed))
    .replace('.', '')
  const endCap = end.charAt(0).toUpperCase() + end.slice(1)
  return `${start} a ${endCap}`
}

function parseIsoParts(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  return { year, month, day }
}

function buildMonthlyHistoryForContract(
  startsAt: string,
  endsAt: string,
  contracted: number,
  sampleSeed: number,
): PrefeituraContratoMonthlyRow[] {
  const start = parseIsoParts(startsAt)
  const end = parseIsoParts(endsAt)
  const rows: PrefeituraContratoMonthlyRow[] = []

  let cursorYear = start.year
  let cursorMonth = start.month

  const samples: Array<{ performedRatio: number; avulso?: number }> = [
    { performedRatio: 0.82 },
    { performedRatio: 0.91 },
    { performedRatio: 1.02, avulso: 48 },
    { performedRatio: 0.88 },
    { performedRatio: 0.95 },
    { performedRatio: 1.08, avulso: 180 },
    { performedRatio: 0.79 },
    { performedRatio: 0.93 },
    { performedRatio: 1.0 },
    { performedRatio: 0.86 },
    { performedRatio: 0.97 },
    { performedRatio: 1.04, avulso: 96 },
    { performedRatio: 0.9 },
    { performedRatio: 0.84 },
    { performedRatio: 1.01, avulso: 30 },
    { performedRatio: 0.87 },
    { performedRatio: 0.92 },
    { performedRatio: 0.96 },
    { performedRatio: 1.05, avulso: 110 },
    { performedRatio: 0.81 },
    { performedRatio: 0.89 },
    { performedRatio: 0.94 },
    { performedRatio: 0.99 },
    { performedRatio: 1.03, avulso: 72 },
  ]

  let index = 0
  while (
    cursorYear < end.year ||
    (cursorYear === end.year && cursorMonth <= end.month)
  ) {
    const sample = samples[(index + sampleSeed) % samples.length]
    const performed = Math.round(contracted * sample.performedRatio)
    const avulsoCount =
      sample.avulso ?? (performed > contracted ? performed - contracted : 0)

    let outcome: PrefeituraContratoMonthOutcome = 'within'
    if (performed >= contracted) {
      outcome = avulsoCount > 0 ? 'exceeded' : 'reached'
    }

    rows.push({
      key: `${cursorYear}-${cursorMonth}`,
      year: cursorYear,
      month: cursorMonth,
      label: monthLabel(cursorYear, cursorMonth),
      contracted,
      performed,
      avulsoCount,
      outcome,
    })

    cursorMonth += 1
    if (cursorMonth > 12) {
      cursorMonth = 1
      cursorYear += 1
    }
    index += 1
  }

  return rows
}

const prefeituraContratoCatalog: PrefeituraContratoRecord[] = [
  {
    id: 'tf-mun-2024-0847',
    status: 'active',
    selectorTitle: 'Contrato vigente',
    selectorSubtitle: periodSubtitle('2024-04-01', '2026-07-15'),
    info: {
      ...SHARED_MUNICIPALITY,
      contractNumber: 'TF-MUN-2024-0847',
      signedAt: '2024-03-15',
      startsAt: '2024-04-01',
      endsAt: '2026-07-15',
      monthlyPackageConsultations: 3_000,
      allowsAvulsoAfterPackage: true,
      avulsoUnitValueBrl: 47.9,
    },
    monthlyHistory: buildMonthlyHistoryForContract(
      '2024-04-01',
      '2026-05-31',
      3_000,
      0,
    ),
  },
  {
    id: 'tf-mun-2022-0612',
    status: 'expired',
    selectorTitle: 'Contrato anterior',
    selectorSubtitle: periodSubtitle('2022-06-01', '2024-03-31'),
    info: {
      ...SHARED_MUNICIPALITY,
      contractNumber: 'TF-MUN-2022-0612',
      signedAt: '2022-05-10',
      startsAt: '2022-06-01',
      endsAt: '2024-03-31',
      monthlyPackageConsultations: 2_400,
      allowsAvulsoAfterPackage: true,
      avulsoUnitValueBrl: 44.5,
    },
    monthlyHistory: buildMonthlyHistoryForContract(
      '2022-06-01',
      '2024-03-31',
      2_400,
      3,
    ),
  },
  {
    id: 'tf-mun-2020-0398',
    status: 'expired',
    selectorTitle: 'Contrato 2020–2022',
    selectorSubtitle: periodSubtitle('2020-03-01', '2022-05-31'),
    info: {
      ...SHARED_MUNICIPALITY,
      contractNumber: 'TF-MUN-2020-0398',
      signedAt: '2020-02-18',
      startsAt: '2020-03-01',
      endsAt: '2022-05-31',
      monthlyPackageConsultations: 1_800,
      allowsAvulsoAfterPackage: false,
      avulsoUnitValueBrl: 0,
    },
    monthlyHistory: buildMonthlyHistoryForContract(
      '2020-03-01',
      '2022-05-31',
      1_800,
      7,
    ),
  },
]

export const prefeituraContratoDefaultId = prefeituraContratoCatalog[0].id

export const prefeituraContratoOptions = prefeituraContratoCatalog.map((record) => ({
  id: record.id,
  status: record.status,
  title: record.selectorTitle,
  subtitle: record.selectorSubtitle,
  contractNumber: record.info.contractNumber,
}))

export function getPrefeituraContratoById(id: string): PrefeituraContratoRecord {
  return (
    prefeituraContratoCatalog.find((record) => record.id === id) ??
    prefeituraContratoCatalog[0]
  )
}

/** Contrato vigente (atalho para compatibilidade). */
export const prefeituraContratoInfo = getPrefeituraContratoById(
  prefeituraContratoDefaultId,
).info

export const prefeituraContratoMonthlyHistory = getPrefeituraContratoById(
  prefeituraContratoDefaultId,
).monthlyHistory
