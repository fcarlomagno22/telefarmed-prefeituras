import { Activity, AlertTriangle, Clock3, Search, ShieldAlert, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { adminMunicipalities } from '../../../data/adminDashboardMock'
import { dashboardPageScrollAreaClass, dashboardPageScrollPaddingClass } from '../../layout/dashboardPageLayout'
import { KpiStatCards, type KpiStatCardItem } from '../../ui/KpiStatCards'
import { CustomSelect } from '../../ui/CustomSelect'
import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import { DashCard, DashLiveBadge } from '../../prefeitura/prefeituraDashboardUi'
import { prefeituraSlaBadgeConfig } from '../../prefeitura/prefeituraDashboardUi'

type EvolucaoRow = {
  prefeitura: string
  ubt: string
  regiao: string
  status: string
  emCurso: number
  fila: number
  tempoMedio: string
  operador: string
  terminal: string
  ocupacao: number
  sla: 'normal' | 'atencao' | 'critico'
}

type ConsultaRow = {
  prefeitura: string
  ubt: string
  paciente: string
  especialidade: string
  medico: string
  inicio: string
  status: string
}

const kpis: KpiStatCardItem[] = [
  {
    label: 'UBTs monitoradas',
    value: '146',
    suffix: 'Online 126 (86%)',
    icon: Activity,
    iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
    iconRing: 'ring-blue-100/80',
    topBar: 'from-sky-400 to-blue-500',
  },
  {
    label: 'Atendimentos em curso',
    value: '412',
    suffix: 'Hoje 3.285',
    icon: Users,
    iconGradient: 'from-emerald-500 via-green-500 to-teal-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]',
    iconRing: 'ring-emerald-100/80',
    topBar: 'from-emerald-400 to-green-500',
  },
  {
    label: 'Aguardando médico',
    value: '58',
    suffix: 'Média fila 14 min',
    icon: Clock3,
    iconGradient: 'from-amber-500 via-orange-500 to-red-500',
    iconShadow: 'shadow-[0_8px_20px_rgba(251,146,60,0.35)]',
    iconRing: 'ring-orange-100/80',
    topBar: 'from-amber-400 to-orange-500',
  },
  {
    label: 'Filas críticas',
    value: '12',
    suffix: 'Acima de 30 min',
    icon: AlertTriangle,
    iconGradient: 'from-rose-500 via-red-500 to-red-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(239,68,68,0.35)]',
    iconRing: 'ring-red-100/80',
    topBar: 'from-rose-400 to-red-500',
  },
  {
    label: 'SLA de ocupação',
    value: '72%',
    suffix: 'Capacidade 1.980 / 2.760',
    icon: ShieldAlert,
    iconGradient: 'from-violet-500 via-purple-500 to-indigo-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(139,92,246,0.35)]',
    iconRing: 'ring-violet-100/80',
    topBar: 'from-violet-400 to-purple-500',
  },
  {
    label: 'No-show hoje',
    value: '186',
    suffix: 'Taxa 5,3%',
    icon: Search,
    iconGradient: 'from-amber-500 via-yellow-500 to-orange-500',
    iconShadow: 'shadow-[0_8px_20px_rgba(245,158,11,0.35)]',
    iconRing: 'ring-amber-100/80',
    topBar: 'from-amber-400 to-yellow-500',
  },
]

const evolucaoRows: EvolucaoRow[] = [
  {
    prefeitura: 'Brasília',
    ubt: 'UBT Asa Norte',
    regiao: 'Centro-Oeste',
    status: 'Online',
    emCurso: 18,
    fila: 4,
    tempoMedio: '12 min',
    operador: 'Carla S.',
    terminal: '8 / 8',
    ocupacao: 83,
    sla: 'normal',
  },
  {
    prefeitura: 'Anápolis',
    ubt: 'UBT Anápolis Centro',
    regiao: 'Centro-Oeste',
    status: 'Online',
    emCurso: 22,
    fila: 6,
    tempoMedio: '24 min',
    operador: 'Rafael M.',
    terminal: '8 / 8',
    ocupacao: 94,
    sla: 'atencao',
  },
  {
    prefeitura: 'Uberlândia',
    ubt: 'UBT Martins',
    regiao: 'Sudeste',
    status: 'Online',
    emCurso: 14,
    fila: 10,
    tempoMedio: '37 min',
    operador: 'Ana B.',
    terminal: '8 / 8',
    ocupacao: 100,
    sla: 'critico',
  },
  {
    prefeitura: 'Campinas',
    ubt: 'UBT Ouro Verde',
    regiao: 'Sudeste',
    status: 'Online',
    emCurso: 19,
    fila: 3,
    tempoMedio: '18 min',
    operador: 'Lucas R.',
    terminal: '8 / 8',
    ocupacao: 91,
    sla: 'atencao',
  },
  {
    prefeitura: 'Luziânia',
    ubt: 'UBT Jardim Ingá',
    regiao: 'Centro-Oeste',
    status: 'Online',
    emCurso: 8,
    fila: 1,
    tempoMedio: '7 min',
    operador: 'Paula N.',
    terminal: '6 / 8',
    ocupacao: 72,
    sla: 'normal',
  },
]

const consultasRows: ConsultaRow[] = [
  {
    prefeitura: 'Brasília',
    ubt: 'UBT Asa Norte',
    paciente: 'Maria S. Silva',
    especialidade: 'Clínica Geral',
    medico: 'Dra. Júlia F.',
    inicio: '18 min',
    status: 'Em andamento',
  },
  {
    prefeitura: 'Anápolis',
    ubt: 'UBT Anápolis Centro',
    paciente: 'João P. Souza',
    especialidade: 'Pediatria',
    medico: 'Dra. Camila R.',
    inicio: '12 min',
    status: 'Em andamento',
  },
  {
    prefeitura: 'Uberlândia',
    ubt: 'UBT Martins',
    paciente: 'Ana L. Barbosa',
    especialidade: 'Ginecologia',
    medico: 'Dr. Marcos T.',
    inicio: '24 min',
    status: 'Em andamento',
  },
  {
    prefeitura: 'Campinas',
    ubt: 'UBT Ouro Verde',
    paciente: 'Rafael L. Lima',
    especialidade: 'Clínica Geral',
    medico: 'Dr. Felipe M.',
    inicio: '14 min',
    status: 'Em andamento',
  },
]

const timelineRows = [
  { hora: '00:00', emCurso: 250, concluidas: 980, aguardando: 140 },
  { hora: '06:00', emCurso: 310, concluidas: 1260, aguardando: 220 },
  { hora: '12:00', emCurso: 412, concluidas: 2310, aguardando: 58 },
  { hora: '18:00', emCurso: 365, concluidas: 3120, aguardando: 74 },
]

const rankingRows = [
  { nome: 'UBT Asa Norte', municipio: 'Brasília', hoje: 326, ocupacao: 83, performance: 'Excelente' },
  { nome: 'UBT Ouro Verde', municipio: 'Campinas', hoje: 301, ocupacao: 91, performance: 'Bom' },
  { nome: 'UBT Martins', municipio: 'Uberlândia', hoje: 284, ocupacao: 100, performance: 'Atenção' },
  { nome: 'UBT Anápolis Centro', municipio: 'Anápolis', hoje: 262, ocupacao: 94, performance: 'Atenção' },
  { nome: 'UBT Jardim Ingá', municipio: 'Luziânia', hoje: 187, ocupacao: 72, performance: 'Normal' },
]

const heatmapRows = [
  { regiao: 'Norte', slots: [42, 61, 74, 69, 54, 32] },
  { regiao: 'Centro-Oeste', slots: [52, 68, 79, 83, 65, 52] },
  { regiao: 'Sudeste', slots: [47, 57, 63, 58, 55, 37] },
]

const TABLE_ROWS_PER_PAGE = 25

export function AdminMonitorMainPanel() {
  const [timelineFiltro, setTimelineFiltro] = useState('dia')
  const [regionFilter, setRegionFilter] = useState('todos')
  const [selectedMunicipio, setSelectedMunicipio] = useState('all')
  const [evolucaoPage, setEvolucaoPage] = useState(1)
  const [consultasPage, setConsultasPage] = useState(1)

  const municipioOptions = useMemo(
    () => [
      { value: 'all', label: 'Todos os municípios ativos' },
      ...adminMunicipalities
        .filter((municipality) => municipality.contractStatus === 'active')
        .map((municipality) => ({
          value: municipality.name,
          label: `${municipality.name}/${municipality.state}`,
        })),
    ],
    [],
  )

  const filteredEvolucaoRows = useMemo(
    () =>
      selectedMunicipio === 'all'
        ? evolucaoRows
        : evolucaoRows.filter((row) => row.prefeitura === selectedMunicipio),
    [selectedMunicipio],
  )

  const filteredConsultasRows = useMemo(
    () =>
      selectedMunicipio === 'all'
        ? consultasRows
        : consultasRows.filter((row) => row.prefeitura === selectedMunicipio),
    [selectedMunicipio],
  )

  const filteredRankingRows = useMemo(
    () =>
      selectedMunicipio === 'all'
        ? rankingRows
        : rankingRows.filter((row) => row.municipio === selectedMunicipio),
    [selectedMunicipio],
  )

  const evolucaoTotalPages = Math.max(1, Math.ceil(filteredEvolucaoRows.length / TABLE_ROWS_PER_PAGE))
  const consultasTotalPages = Math.max(1, Math.ceil(filteredConsultasRows.length / TABLE_ROWS_PER_PAGE))

  const paginatedEvolucaoRows = useMemo(() => {
    const start = (evolucaoPage - 1) * TABLE_ROWS_PER_PAGE
    return filteredEvolucaoRows.slice(start, start + TABLE_ROWS_PER_PAGE)
  }, [filteredEvolucaoRows, evolucaoPage])

  const paginatedConsultasRows = useMemo(() => {
    const start = (consultasPage - 1) * TABLE_ROWS_PER_PAGE
    return filteredConsultasRows.slice(start, start + TABLE_ROWS_PER_PAGE)
  }, [filteredConsultasRows, consultasPage])

  useEffect(() => {
    setEvolucaoPage(1)
    setConsultasPage(1)
  }, [selectedMunicipio])

  useEffect(() => {
    if (evolucaoPage > evolucaoTotalPages) setEvolucaoPage(evolucaoTotalPages)
  }, [evolucaoPage, evolucaoTotalPages])

  useEffect(() => {
    if (consultasPage > consultasTotalPages) setConsultasPage(consultasTotalPages)
  }, [consultasPage, consultasTotalPages])

  const selectedTimeline = useMemo(
    () => timelineRows.find((entry) => entry.hora === '12:00') ?? timelineRows[0],
    [],
  )

  return (
    <div className={dashboardPageScrollAreaClass}>
      <div className={[dashboardPageScrollPaddingClass, 'w-full space-y-4 pt-5 sm:pt-6'].join(' ')}>
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
              Painel administrativo
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-[1.65rem]">
              Monitor Operacional municipal
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Visão ao vivo das UBTs, filas, consultas e capacidade por prefeituras.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="w-64">
              <CustomSelect
                value={selectedMunicipio}
                onChange={setSelectedMunicipio}
                options={municipioOptions}
                size="compact"
              />
            </div>
            <DashLiveBadge />
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <KpiStatCards
            items={kpis}
            layout="grid-3x2"
            stackedHeaderIconLeft
            className="md:col-span-2 xl:col-span-6"
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(22rem,1fr)]">
          <div className="grid gap-4">
            <DashCard
              title="Evolução do Monitor Operacional"
              subtitle="Recorte por unidade e município."
              bodyClassName="flex min-h-0 flex-1 flex-col p-0"
              action={
                <div className="flex items-center gap-2">
                  <div className="w-32">
                    <CustomSelect
                      value={regionFilter}
                      onChange={setRegionFilter}
                      size="compact"
                      options={[
                        { value: 'todos', label: 'Todas' },
                        { value: 'centro', label: 'Centro-Oeste' },
                        { value: 'sudeste', label: 'Sudeste' },
                      ]}
                    />
                  </div>
                </div>
              }
              className="h-[25.5rem]"
              fillHeight
            >
              <div className="min-h-0 flex-1 overflow-auto">
                <table className="w-full min-w-[980px] text-xs">
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr className="border-b border-gray-200 text-[10px] uppercase tracking-wide text-gray-500">
                      <th className="px-3 py-2 text-left">Prefeitura</th>
                      <th className="px-3 py-2 text-center">UBT</th>
                      <th className="px-3 py-2 text-center">Região</th>
                      <th className="px-3 py-2 text-center">Status</th>
                      <th className="px-3 py-2 text-center">Em curso</th>
                      <th className="px-3 py-2 text-center">Fila</th>
                      <th className="px-3 py-2 text-center">Tempo médio</th>
                      <th className="px-3 py-2 text-center">Operador</th>
                      <th className="px-3 py-2 text-center">Terminal</th>
                      <th className="px-3 py-2 text-center">Ocupação</th>
                      <th className="px-3 py-2 text-center">SLA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedEvolucaoRows.map((row) => (
                      <tr key={row.ubt} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-semibold text-gray-900">{row.prefeitura}</td>
                        <td className="px-3 py-2 text-center text-gray-700">{row.ubt}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{row.regiao}</td>
                        <td className="px-3 py-2 text-center">
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            {row.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center font-semibold">{row.emCurso}</td>
                        <td className="px-3 py-2 text-center">{row.fila}</td>
                        <td className="px-3 py-2 text-center">{row.tempoMedio}</td>
                        <td className="px-3 py-2 text-center">{row.operador}</td>
                        <td className="px-3 py-2 text-center">{row.terminal}</td>
                        <td className="px-3 py-2 text-center">
                          <div className="mx-auto h-2 w-16 rounded-full bg-gray-100">
                            <div
                              className="h-2 rounded-full bg-emerald-500"
                              style={{ width: `${Math.min(row.ocupacao, 100)}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <SituationStatusBadge
                            config={prefeituraSlaBadgeConfig[row.sla]}
                            widthClass="w-[7.5rem]"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2 text-[11px] text-gray-500">
                <span>
                  Página {evolucaoPage} de {evolucaoTotalPages} · {filteredEvolucaoRows.length} itens
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEvolucaoPage((page) => Math.max(1, page - 1))}
                    disabled={evolucaoPage === 1}
                    className="rounded-md border border-gray-200 px-2 py-1 text-gray-600 transition enabled:hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvolucaoPage((page) => Math.min(evolucaoTotalPages, page + 1))}
                    disabled={evolucaoPage === evolucaoTotalPages}
                    className="rounded-md border border-gray-200 px-2 py-1 text-gray-600 transition enabled:hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            </DashCard>

            <DashCard
              title="Lista global de consultas"
              subtitle="Em andamento e aguardando médico."
              bodyClassName="flex min-h-0 flex-1 flex-col p-0"
              className="h-[16.5rem]"
              fillHeight
            >
              <div className="min-h-0 flex-1 overflow-auto">
                <table className="w-full min-w-[860px] text-xs">
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr className="border-b border-gray-200 text-[10px] uppercase tracking-wide text-gray-500">
                      <th className="px-3 py-2 text-left">Prefeitura</th>
                      <th className="px-3 py-2 text-center">UBT</th>
                      <th className="px-3 py-2 text-center">Paciente</th>
                      <th className="px-3 py-2 text-center">Especialidade</th>
                      <th className="px-3 py-2 text-center">Médico</th>
                      <th className="px-3 py-2 text-center">Início</th>
                      <th className="px-3 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedConsultasRows.map((row) => (
                      <tr key={row.paciente} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-semibold text-gray-900">{row.prefeitura}</td>
                        <td className="px-3 py-2 text-center">{row.ubt}</td>
                        <td className="px-3 py-2 text-center">{row.paciente}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{row.especialidade}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{row.medico}</td>
                        <td className="px-3 py-2 text-center">{row.inicio}</td>
                        <td className="px-3 py-2 text-center">
                          <span className="inline-flex items-center justify-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2 text-[11px] text-gray-500">
                <span>
                  Página {consultasPage} de {consultasTotalPages} · {filteredConsultasRows.length} itens
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConsultasPage((page) => Math.max(1, page - 1))}
                    disabled={consultasPage === 1}
                    className="rounded-md border border-gray-200 px-2 py-1 text-gray-600 transition enabled:hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setConsultasPage((page) => Math.min(consultasTotalPages, page + 1))}
                    disabled={consultasPage === consultasTotalPages}
                    className="rounded-md border border-gray-200 px-2 py-1 text-gray-600 transition enabled:hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            </DashCard>
          </div>

          <div className="grid gap-4">
            <DashCard
              title="Timeline agregada"
              subtitle="Em curso, concluídas e aguardando médico."
              className="h-[15rem]"
              fillHeight
              bodyClassName="flex min-h-0 flex-1 flex-col gap-3 p-4"
              action={
                <div className="w-32">
                  <CustomSelect
                    value={timelineFiltro}
                    onChange={setTimelineFiltro}
                    size="compact"
                    options={[
                      { value: 'dia', label: 'Hoje' },
                      { value: '7d', label: 'Últimos 7 dias' },
                    ]}
                  />
                </div>
              }
            >
              <div className="grid grid-cols-4 gap-2 text-[10px] text-gray-500">
                {timelineRows.map((entry) => (
                  <div key={entry.hora} className="rounded-lg border border-gray-100 bg-gray-50 px-2 py-1.5 text-center">
                    <p className="font-semibold text-gray-700">{entry.hora}</p>
                    <p>Em curso {entry.emCurso}</p>
                  </div>
                ))}
              </div>
              <div className="grid flex-1 grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-2">
                  <p className="text-[10px] uppercase text-emerald-700">Em curso</p>
                  <p className="text-lg font-bold text-emerald-800">{selectedTimeline.emCurso}</p>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-2">
                  <p className="text-[10px] uppercase text-blue-700">Concluídas</p>
                  <p className="text-lg font-bold text-blue-800">{selectedTimeline.concluidas}</p>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-2">
                  <p className="text-[10px] uppercase text-amber-700">Aguardando</p>
                  <p className="text-lg font-bold text-amber-800">{selectedTimeline.aguardando}</p>
                </div>
              </div>
            </DashCard>

            <DashCard
              title="Ranking de unidades"
              subtitle="Performance no dia."
              className="h-[11rem]"
              fillHeight
              bodyClassName="flex min-h-0 flex-1 flex-col p-0"
            >
              <div className="min-h-0 overflow-auto">
                <table className="w-full text-[11px]">
                  <thead className="sticky top-0 bg-white text-[10px] uppercase tracking-wide text-gray-500">
                    <tr className="border-b border-gray-200">
                      <th className="px-3 py-2 text-left">UBT</th>
                      <th className="px-3 py-2 text-left">Município</th>
                      <th className="px-3 py-2 text-center">Hoje</th>
                      <th className="px-3 py-2 text-center">Ocupação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRankingRows.map((row) => (
                      <tr key={row.nome}>
                        <td className="px-3 py-1.5 font-semibold text-gray-900">{row.nome}</td>
                        <td className="px-3 py-1.5 text-gray-600">{row.municipio}</td>
                        <td className="px-3 py-1.5 text-center">{row.hoje}</td>
                        <td className="px-3 py-1.5 text-center">{row.ocupacao}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DashCard>

            <DashCard
              title="Heatmap de ocupação"
              subtitle="Últimas 6h por macro-região."
              className="h-[10.5rem]"
              fillHeight
              bodyClassName="grid min-h-0 flex-1 grid-cols-[7rem_repeat(6,minmax(0,1fr))] gap-1 p-3"
            >
              {heatmapRows.map((row) => (
                <div key={row.regiao} className="contents">
                  <div className="flex items-center text-[10px] font-semibold text-gray-600">{row.regiao}</div>
                  {row.slots.map((slot, index) => (
                    <div
                      key={`${row.regiao}-${index}`}
                      className="flex items-center justify-center rounded-md text-[10px] font-semibold text-gray-700"
                      style={{
                        backgroundColor:
                          slot > 80 ? 'rgba(248,113,113,0.34)' : slot > 65 ? 'rgba(251,191,36,0.35)' : 'rgba(74,222,128,0.32)',
                      }}
                    >
                      {slot}%
                    </div>
                  ))}
                </div>
              ))}
            </DashCard>

            <DashCard
              title="Snapshot das filas"
              subtitle="Visão dos picos no momento."
              className="h-[8rem]"
              fillHeight
              bodyClassName="grid min-h-0 flex-1 grid-cols-2 gap-2 p-3"
            >
              <div className="flex h-full items-center justify-center rounded-xl border border-sky-100 bg-gradient-to-b from-white to-sky-50/70 p-2 shadow-[0_4px_14px_rgba(14,116,144,0.08)]">
                <div className="flex flex-col items-center justify-center text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Fila média
                  </p>
                  <p className="mt-0.5 text-xl font-bold leading-none text-slate-900">188</p>
                  <p className="mt-1 text-[11px] font-semibold text-sky-700">8,1%</p>
                </div>
              </div>
              <div className="flex h-full items-center justify-center rounded-xl border border-amber-100 bg-gradient-to-b from-white to-amber-50/70 p-2 shadow-[0_4px_14px_rgba(245,158,11,0.1)]">
                <div className="flex flex-col items-center justify-center text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    No-show hoje
                  </p>
                  <p className="mt-0.5 text-xl font-bold leading-none text-slate-900">186</p>
                  <p className="mt-1 text-[11px] font-semibold text-amber-700">5,3%</p>
                </div>
              </div>
            </DashCard>
          </div>
        </section>
      </div>
    </div>
  )
}
