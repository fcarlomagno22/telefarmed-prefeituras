import {
  Bell,
  Download,
  FileText,
  LayoutGrid,
  Mail,
  Search,
  Users,
} from 'lucide-react'
import { Fragment, useCallback, useId, useMemo, useState, type FocusEvent, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { FLOATING_POPOVER_Z_INDEX } from '../../../config/overlayLayers'
import {
  PREFEITURA_RELATORIOS_DISPONIVEIS,
  prefeituraRelatorioCategoryCards,
  prefeituraRelatorioRegisteredEmails,
  type PrefeituraRelatorioCategoryCard,
  type PrefeituraRelatorioRegisteredEmail,
} from '../../../data/prefeituraRelatoriosHub'
import { getDefaultPrefeituraConsultasPeriod } from '../../../utils/consultasPeriod'
import { buildPrefeituraRelatorioGenerateUrl, buildPrefeituraRelatoriosCompiledUrl } from '../../../config/prefeituraRoutes'
import {
  SUPPORTED_PREFEITURA_RELATORIO_IDS,
  type PrefeituraRelatorioId,
} from '../../../types/prefeituraRelatorios'
import { dashboardMainPanelSurfaceClass } from '../../layout/dashboardPageLayout'
import { CompactDateRangePicker } from '../../ui/CompactDateRangePicker'
import { CustomSelect } from '../../ui/CustomSelect'
import {
  KpiStatCards,
  kpiStatStylePresets,
  type KpiStatCardItem,
} from '../../ui/KpiStatCards'
import { Toast, type ToastVariant } from '../../ui/Toast'

const cardSurface = dashboardMainPanelSurfaceClass

const defaultScheduleEmail = 'gestao@prefeitura.gov.br, controlador@prefeitura.gov.br'

const [skyPreset, orangePreset, violetPreset, emeraldPreset] = kpiStatStylePresets

const relatoriosKpiCards: KpiStatCardItem[] = [
  {
    label: 'Relatórios disponíveis',
    value: String(PREFEITURA_RELATORIOS_DISPONIVEIS),
    suffix: 'Indicadores no catálogo',
    icon: LayoutGrid,
    ...orangePreset,
  },
  {
    label: 'Perfis de gestão',
    value: '6',
    suffix: 'Níveis de acesso',
    icon: Users,
    ...skyPreset,
  },
  {
    label: 'Exportações no mês',
    value: '124',
    suffix: '↑ 12% vs mês anterior',
    icon: Download,
    ...violetPreset,
  },
  {
    label: 'Alertas acionados',
    value: '5',
    suffix: '↓ 20% vs mês anterior',
    icon: Bell,
    ...emeraldPreset,
  },
]

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function reportSelectionKey(categoryId: string, reportId: string) {
  return `${categoryId}:${reportId}`
}

const defaultRelatoriosHubPeriod = getDefaultPrefeituraConsultasPeriod()

function RelatoriosCatalogTable({
  onExport,
  onGenerateReport,
}: {
  onExport: () => void
  onGenerateReport: (payload: {
    reportIds: PrefeituraRelatorioId[]
    unsupportedCount: number
    periodStart: string
    periodEnd: string
    categoryId?: string
  }) => void
}) {
  const [search, setSearch] = useState('')
  const [periodStart, setPeriodStart] = useState(defaultRelatoriosHubPeriod.start)
  const [periodEnd, setPeriodEnd] = useState(defaultRelatoriosHubPeriod.end)
  const [categoryFilter, setCategoryFilter] = useState('todas')
  const [selectedReports, setSelectedReports] = useState<Set<string>>(() => new Set())

  const categoryFilterOptions = useMemo(
    () => [
      { value: 'todas', label: 'Categorias' },
      ...prefeituraRelatorioCategoryCards.map((category) => ({
        value: category.id,
        label: category.title,
      })),
    ],
    [],
  )

  const filteredCategories = useMemo(() => {
    const query = normalizeSearch(search.trim())

    return prefeituraRelatorioCategoryCards
      .filter((category) => categoryFilter === 'todas' || category.id === categoryFilter)
      .map((category) => {
        if (!query) return category

        const categoryHaystack = normalizeSearch(`${category.title} ${category.description}`)
        const reports = category.reports.filter((report) => {
          const reportHaystack = normalizeSearch(`${report.name} ${report.description}`)
          return reportHaystack.includes(query) || categoryHaystack.includes(query)
        })

        if (reports.length === 0 && !categoryHaystack.includes(query)) return null

        return {
          ...category,
          reports: reports.length > 0 ? reports : category.reports,
        }
      })
      .filter((category): category is PrefeituraRelatorioCategoryCard => category !== null)
  }, [categoryFilter, search])

  const totalReports = useMemo(
    () => filteredCategories.reduce((sum, category) => sum + category.reports.length, 0),
    [filteredCategories],
  )

  const selectedVisibleCount = useMemo(() => {
    let count = 0
    for (const category of filteredCategories) {
      for (const report of category.reports) {
        if (selectedReports.has(reportSelectionKey(category.id, report.id))) count += 1
      }
    }
    return count
  }, [filteredCategories, selectedReports])

  function toggleReport(categoryId: string, reportId: string) {
    const key = reportSelectionKey(categoryId, reportId)
    setSelectedReports((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleCategory(category: PrefeituraRelatorioCategoryCard) {
    const keys = category.reports.map((report) => reportSelectionKey(category.id, report.id))
    const allSelected = keys.every((key) => selectedReports.has(key))

    setSelectedReports((current) => {
      const next = new Set(current)
      for (const key of keys) {
        if (allSelected) next.delete(key)
        else next.add(key)
      }
      return next
    })
  }

  function handleGenerateReportClick() {
    const selectedKeys = [...selectedReports]
    const allReportIds = selectedKeys.map((key) => key.split(':')[1])
    const reportIds = allReportIds.filter((reportId): reportId is PrefeituraRelatorioId =>
      SUPPORTED_PREFEITURA_RELATORIO_IDS.has(reportId as PrefeituraRelatorioId),
    )
    const categoryIds = new Set(selectedKeys.map((key) => key.split(':')[0]))

    onGenerateReport({
      reportIds,
      unsupportedCount: allReportIds.length - reportIds.length,
      periodStart,
      periodEnd,
      categoryId: categoryIds.size === 1 ? [...categoryIds][0] : undefined,
    })
  }

  return (
    <>
      <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
      <header className="shrink-0 border-b border-gray-100 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-gray-900">Catálogo de relatórios</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Indicadores operacionais, clínicos e contratuais da gestão municipal.
          </p>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <CompactDateRangePicker
            start={periodStart}
            end={periodEnd}
            onStartChange={setPeriodStart}
            onEndChange={setPeriodEnd}
            compact
            className="w-full shrink-0 sm:w-[15.5rem]"
          />
          <label className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              strokeWidth={2}
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por relatório ou categoria..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pr-3 pl-9 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)]/40 focus:shadow-[0_0_0_3px_rgba(255,107,0,0.12)]"
            />
          </label>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <Download className="h-4 w-4 text-gray-500" strokeWidth={2} />
              Exportar
            </button>
            <CustomSelect
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={categoryFilterOptions}
              className="w-[10.5rem]"
              menuMinWidthPx={220}
            />
          </div>
        </div>
      </header>

      <div
        className={[
          'max-h-[42rem] min-h-[18rem] flex-1 overflow-x-auto overflow-y-auto bg-white',
          '[-ms-overflow-style:none] [scrollbar-width:thin]',
          '[&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5',
          '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300',
          '[&::-webkit-scrollbar-track]:bg-transparent',
        ].join(' ')}
      >
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <th className="w-12 px-3 py-2.5 text-center sm:px-4">
                <span className="sr-only">Selecionar</span>
              </th>
              <th className="w-[16rem] px-2 py-2.5 text-left sm:w-[18rem]">Relatório</th>
              <th className="px-4 py-2.5 text-left sm:px-5">Descrição</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-5 py-16 text-center text-sm text-gray-500 sm:px-6">
                  Nenhum relatório encontrado para os filtros selecionados.
                </td>
              </tr>
            ) : null}

            {filteredCategories.map((category, categoryIndex) => {
              const categoryKeys = category.reports.map((report) =>
                reportSelectionKey(category.id, report.id),
              )
              const categoryAllSelected =
                categoryKeys.length > 0 && categoryKeys.every((key) => selectedReports.has(key))
              const categoryPartialSelected =
                !categoryAllSelected && categoryKeys.some((key) => selectedReports.has(key))
              const Icon = category.icon

              return (
                <Fragment key={category.id}>
                  <tr
                    onClick={() => toggleCategory(category)}
                    className={[
                      'cursor-pointer bg-gray-50 transition hover:bg-gray-100/80',
                      categoryIndex > 0 ? 'border-t-2 border-gray-200' : '',
                    ].join(' ')}
                  >
                    <td className="px-3 py-3 text-center sm:px-4">
                      <input
                        type="checkbox"
                        checked={categoryAllSelected}
                        ref={(element) => {
                          if (element) element.indeterminate = categoryPartialSelected
                        }}
                        onChange={() => toggleCategory(category)}
                        onClick={(event) => event.stopPropagation()}
                        className="size-4 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/30"
                        aria-label={`Selecionar todos os relatórios de ${category.title}`}
                      />
                    </td>
                    <td colSpan={2} className="px-2 py-3 sm:px-5">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={[
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                            category.iconClass,
                          ].join(' ')}
                        >
                          <Icon className="h-4 w-4" strokeWidth={2} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                            Categoria
                          </p>
                          <p className="text-sm font-bold text-gray-900">{category.title}</p>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {category.reports.map((report) => {
                    const selectionKey = reportSelectionKey(category.id, report.id)
                    const checked = selectedReports.has(selectionKey)

                    return (
                      <tr
                        key={selectionKey}
                        onClick={() => toggleReport(category.id, report.id)}
                        className={[
                          'cursor-pointer border-t border-gray-100 text-gray-800 transition hover:bg-slate-50/80',
                          checked ? 'bg-orange-50/40' : '',
                        ].join(' ')}
                      >
                        <td className="px-3 py-2.5 text-center align-top sm:px-4">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleReport(category.id, report.id)}
                            onClick={(event) => event.stopPropagation()}
                            className="mt-0.5 size-4 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/30"
                            aria-label={`Selecionar ${report.name}`}
                          />
                        </td>
                        <td className="px-2 py-2.5 align-top text-sm font-bold text-gray-900">
                          {report.name}
                        </td>
                        <td className="px-4 py-2.5 align-top text-sm leading-relaxed text-gray-600 sm:px-5">
                          {report.description}
                        </td>
                      </tr>
                    )
                  })}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-gray-200 bg-white px-4 py-2 sm:px-5">
        <p className="text-xs text-gray-500">
          {totalReports === 0
            ? 'Nenhum relatório na lista filtrada'
            : `${formatNumber(totalReports)} relatórios exibidos`}
        </p>
        {selectedVisibleCount > 0 ? (
          <p className="text-xs font-medium text-gray-700">
            {formatNumber(selectedVisibleCount)} selecionados
          </p>
        ) : null}
      </footer>
      </section>

      {selectedReports.size > 0
        ? createPortal(
            <div className="pointer-events-none fixed bottom-[4.5rem] right-6 z-[100] sm:right-8">
              <button
                type="button"
                onClick={handleGenerateReportClick}
                className={[
                  'pointer-events-auto inline-flex items-center gap-2.5 rounded-2xl px-5 py-3.5',
                  'btn-brand-gradient text-sm font-bold text-white',
                  'shadow-[0_12px_32px_rgba(255,107,0,0.38)]',
                  'transition duration-200 hover:scale-[1.02] hover:shadow-[0_16px_40px_rgba(255,107,0,0.45)]',
                  'active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--brand-primary)]',
                ].join(' ')}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                  <FileText className="h-4 w-4" strokeWidth={2.5} />
                </span>
                <span>Gerar Relatório</span>
                <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs font-bold tabular-nums">
                  {formatNumber(selectedReports.size)}
                </span>
              </button>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

function ScheduleField({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col">
      <label className="mb-1.5 block text-[11px] font-medium leading-none text-gray-400">{label}</label>
      <div className="min-h-[42px]">{children}</div>
      {hint ? <div className="mt-1.5">{hint}</div> : null}
    </div>
  )
}

const scheduleEmailInputClass =
  'h-[42px] w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)]/40 focus:shadow-[0_0_0_3px_rgba(255,107,0,0.12)]'

const scheduleFieldLabelClass = 'text-[11px] font-medium leading-none text-gray-400'

type TooltipPosition = {
  top: number
  left: number
}

function RegisteredEmailsTooltip({
  tooltipId,
  emails,
}: {
  tooltipId: string
  emails: PrefeituraRelatorioRegisteredEmail[]
}) {
  return (
    <div
      id={tooltipId}
      role="tooltip"
      className="relative w-[17.5rem] overflow-hidden rounded-xl border border-gray-200/90 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.14)]"
    >
      <span
        className="absolute top-full left-1/2 -translate-x-1/2 border-[7px] border-transparent border-t-white"
        aria-hidden
      />
      <span
        className="absolute top-full left-1/2 z-10 -translate-x-1/2 translate-y-px border-[8px] border-transparent border-t-gray-200/90"
        aria-hidden
      />
      <div className="h-1 bg-gradient-to-r from-orange-400 via-[var(--brand-primary)] to-amber-500" />
      <div className="px-3.5 py-3">
        <p className="text-xs font-bold text-gray-900">E-mails cadastrados</p>
        <p className="mt-0.5 text-[11px] text-gray-500">Destinatários do envio automatizado</p>
        <ul className="mt-3 space-y-2">
          {emails.map((item) => (
            <li
              key={item.address}
              className="rounded-lg border border-gray-100 bg-gray-50/80 px-2.5 py-2"
            >
              <span className="flex items-start gap-2">
                <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--brand-primary)]" strokeWidth={2} />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-gray-800">{item.address}</span>
                  <span className="block text-[10px] text-gray-500">{item.role}</span>
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function RegisteredEmailsLink({ emails }: { emails: PrefeituraRelatorioRegisteredEmail[] }) {
  const tooltipId = useId()
  const [hoverPosition, setHoverPosition] = useState<TooltipPosition | null>(null)

  const showTooltip = useCallback((target: HTMLElement) => {
    const rect = target.getBoundingClientRect()
    setHoverPosition({
      top: rect.top,
      left: rect.left + rect.width / 2,
    })
  }, [])

  const hideTooltip = useCallback(() => setHoverPosition(null), [])

  const handleMouseEnter = (event: MouseEvent<HTMLButtonElement>) => {
    showTooltip(event.currentTarget)
  }

  const handleFocus = (event: FocusEvent<HTMLButtonElement>) => {
    showTooltip(event.currentTarget)
  }

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 underline-offset-2 transition hover:text-sky-700 hover:underline focus:outline-none focus-visible:underline"
        aria-describedby={hoverPosition ? tooltipId : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={hideTooltip}
        onFocus={handleFocus}
        onBlur={hideTooltip}
      >
        Ver e-mails cadastrados
      </button>

      {hoverPosition
        ? createPortal(
            <div
              className="pointer-events-none fixed"
              style={{
                top: hoverPosition.top - 10,
                left: hoverPosition.left,
                transform: 'translate(-50%, -100%)',
                zIndex: FLOATING_POPOVER_Z_INDEX,
              }}
            >
              <RegisteredEmailsTooltip tooltipId={tooltipId} emails={emails} />
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

function AutomatedSendingRow({ onSave }: { onSave: () => void }) {
  const [scheduleEmail, setScheduleEmail] = useState(defaultScheduleEmail)
  const [scheduleFrequency, setScheduleFrequency] = useState('semanal')
  const [scheduleDay, setScheduleDay] = useState('segunda')
  const [scheduleTime, setScheduleTime] = useState('08:00')

  const emailField = (
    <input
      type="text"
      value={scheduleEmail}
      onChange={(event) => setScheduleEmail(event.target.value)}
      placeholder="Digite o e-mail para envio dos relatórios"
      className={scheduleEmailInputClass}
      autoComplete="email"
    />
  )

  const emailHint = (
    <div className="flex items-center justify-between gap-3 text-[11px] leading-none">
      <RegisteredEmailsLink emails={prefeituraRelatorioRegisteredEmails} />
      <span className="text-gray-400">Até 5 e-mails</span>
    </div>
  )

  return (
    <section className={[cardSurface, 'p-4 sm:p-5'].join(' ')}>
      <div className="flex flex-col gap-4 lg:hidden">
        <div className="flex items-start gap-2.5">
          <Mail className="mt-0.5 h-[18px] w-[18px] shrink-0 text-slate-800" strokeWidth={2} />
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold leading-tight text-slate-900">Envio automatizado</h3>
            <p className="mt-0.5 text-xs leading-snug text-gray-500">
              Agende e envie relatórios por e-mail.
            </p>
          </div>
        </div>

        <ScheduleField label="Enviar para" hint={emailHint}>
          {emailField}
        </ScheduleField>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ScheduleField label="Frequência">
            <CustomSelect
              value={scheduleFrequency}
              onChange={setScheduleFrequency}
              options={[
                { value: 'semanal', label: 'Semanal' },
                { value: 'mensal', label: 'Mensal' },
                { value: 'diario', label: 'Diário' },
              ]}
              size="compact"
              className="h-[42px] rounded-xl py-0"
            />
          </ScheduleField>
          <ScheduleField label="Dia da semana">
            <CustomSelect
              value={scheduleDay}
              onChange={setScheduleDay}
              options={[
                { value: 'segunda', label: 'Segunda-feira' },
                { value: 'terca', label: 'Terça-feira' },
                { value: 'sexta', label: 'Sexta-feira' },
              ]}
              size="compact"
              className="h-[42px] rounded-xl py-0"
            />
          </ScheduleField>
          <ScheduleField label="Horário">
            <CustomSelect
              value={scheduleTime}
              onChange={setScheduleTime}
              options={[
                { value: '08:00', label: '08:00' },
                { value: '12:00', label: '12:00' },
                { value: '18:00', label: '18:00' },
              ]}
              size="compact"
              className="h-[42px] rounded-xl py-0"
            />
          </ScheduleField>
        </div>

        <button
          type="button"
          onClick={onSave}
          className="btn-brand-gradient h-[42px] w-full rounded-xl px-5 text-sm font-semibold shadow-sm"
        >
          Salvar agendamento
        </button>
      </div>

      <div className="hidden w-full lg:grid lg:grid-cols-[minmax(12rem,14rem)_minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.95fr)_auto] lg:grid-rows-[auto_42px_auto] lg:gap-x-4 lg:gap-y-1.5">
        <div className="row-span-3 flex items-start gap-2.5 self-center">
          <Mail className="mt-0.5 h-[18px] w-[18px] shrink-0 text-slate-800" strokeWidth={2} />
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold leading-tight text-slate-900">Envio automatizado</h3>
            <p className="mt-0.5 text-xs leading-snug text-gray-500">
              Agende e envie relatórios por e-mail.
            </p>
          </div>
        </div>

        <label className={`col-start-2 row-start-1 ${scheduleFieldLabelClass}`}>Enviar para</label>
        <label className={`col-start-3 row-start-1 ${scheduleFieldLabelClass}`}>Frequência</label>
        <label className={`col-start-4 row-start-1 ${scheduleFieldLabelClass}`}>Dia da semana</label>
        <label className={`col-start-5 row-start-1 ${scheduleFieldLabelClass}`}>Horário</label>

        <div className="col-start-2 row-start-2 min-w-0">{emailField}</div>

        <div className="col-start-3 row-start-2 min-w-0">
          <CustomSelect
            value={scheduleFrequency}
            onChange={setScheduleFrequency}
            options={[
              { value: 'semanal', label: 'Semanal' },
              { value: 'mensal', label: 'Mensal' },
              { value: 'diario', label: 'Diário' },
            ]}
            size="compact"
            className="h-[42px] rounded-xl py-0"
          />
        </div>

        <div className="col-start-4 row-start-2 min-w-0">
          <CustomSelect
            value={scheduleDay}
            onChange={setScheduleDay}
            options={[
              { value: 'segunda', label: 'Segunda-feira' },
              { value: 'terca', label: 'Terça-feira' },
              { value: 'sexta', label: 'Sexta-feira' },
            ]}
            size="compact"
            className="h-[42px] rounded-xl py-0"
          />
        </div>

        <div className="col-start-5 row-start-2 min-w-0">
          <CustomSelect
            value={scheduleTime}
            onChange={setScheduleTime}
            options={[
              { value: '08:00', label: '08:00' },
              { value: '12:00', label: '12:00' },
              { value: '18:00', label: '18:00' },
            ]}
            size="compact"
            className="h-[42px] rounded-xl py-0"
          />
        </div>

        <button
          type="button"
          onClick={onSave}
          className="btn-brand-gradient col-start-6 row-start-2 h-[42px] rounded-xl px-5 text-sm font-semibold shadow-sm lg:min-w-[11.5rem] lg:whitespace-nowrap"
        >
          Salvar agendamento
        </button>

        <div className="col-start-2 row-start-3">{emailHint}</div>
      </div>
    </section>
  )
}

export function PrefeituraRelatoriosHubPanel() {
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)

  function showToast(message: string, variant: ToastVariant) {
    setToast(null)
    requestAnimationFrame(() => setToast({ message, variant }))
  }

  return (
    <>
      <div className="space-y-4">
        <KpiStatCards items={relatoriosKpiCards} className="gap-3 sm:gap-4" />

        <AutomatedSendingRow onSave={() => showToast('Agendamento salvo.', 'success')} />

        <RelatoriosCatalogTable
          onExport={() => showToast('Exportação iniciada.', 'success')}
          onGenerateReport={({ reportIds, unsupportedCount, periodStart, periodEnd, categoryId }) => {
            if (reportIds.length === 0) {
              showToast('Os relatórios selecionados ainda não estão disponíveis.', 'warning')
              return
            }

            if (reportIds.length > 1) {
              const url = buildPrefeituraRelatoriosCompiledUrl({
                reportIds,
                periodStart,
                periodEnd,
                categoryId,
              })
              const tab = window.open(url, '_blank')
              if (!tab) {
                showToast('Permita pop-ups neste site para abrir o compilado.', 'warning')
                return
              }

              if (unsupportedCount > 0) {
                showToast(
                  `Compilado aberto com ${formatNumber(reportIds.length)} relatório(s). ${formatNumber(unsupportedCount)} selecionado(s) ainda não disponível(is).`,
                  'warning',
                )
                return
              }

              showToast(
                `Compilado aberto com ${formatNumber(reportIds.length)} relatórios em uma única página.`,
                'success',
              )
              return
            }

            let opened = 0
            for (const reportId of reportIds) {
              const url = buildPrefeituraRelatorioGenerateUrl(reportId, {
                periodStart,
                periodEnd,
              })
              const tab = window.open(url, '_blank')
              if (tab) opened += 1
            }

            if (opened === 0) {
              showToast('Permita pop-ups neste site para abrir os relatórios.', 'warning')
              return
            }

            if (unsupportedCount > 0) {
              showToast(
                `${formatNumber(opened)} relatório(s) aberto(s). ${formatNumber(unsupportedCount)} selecionado(s) ainda não disponível(is).`,
                'warning',
              )
              return
            }

            showToast('Relatório aberto em nova aba.', 'success')
          }}
        />
      </div>

      <Toast
        message={toast?.message ?? ''}
        visible={toast !== null}
        variant={toast?.variant}
        onClose={() => setToast(null)}
      />
    </>
  )
}
