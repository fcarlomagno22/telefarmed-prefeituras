import {
  Activity,
  ArrowLeft,
  BarChart3,
  Building2,
  ChevronDown,
  ChevronRight,
  Gauge,
  MessageSquare,
  Monitor,
  Settings,
  UserRound,
  Users,
  Wrench,
  X,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { prefeituraRoutes } from '../../../config/prefeituraRoutes'
import { usePrefeituraAuth } from '../../../contexts/PrefeituraAuthContext'
import {
  countPrefeituraRedeTerminalsInMaintenance,
  getPrefeituraRedeQuickAction,
  isPrefeituraRedeUnitFullyInMaintenance,
  prefeituraRedeQuickActions,
  prefeituraRedeTerminalKey,
  type PrefeituraRedeQuickActionId,
  type PrefeituraRedeUnit,
} from '../../../data/prefeituraRedeMock'
import { specialties } from '../../../data/specialties'
import {
  fetchPrefeituraRedeSettings,
  isPrefeituraRedeApiError,
  updatePrefeituraRedeMaintenance,
  updatePrefeituraRedeSettings,
  type PrefeituraRedeSettingsApi,
} from '../../../lib/services/prefeitura/rede'
import { CustomSelect } from '../../ui/CustomSelect'
import { KpiStatCards, kpiStatStylePresets, type KpiStatCardItem } from '../../ui/KpiStatCards'
import { Toast } from '../../ui/Toast'
import { formatPrefeituraNumber } from '../prefeituraDashboardUi'
import { PrefeituraRedeBroadcastDrawerContent } from './PrefeituraRedeBroadcastDrawerContent'

const quickActionIcons = {
  message: MessageSquare,
  wrench: Wrench,
  settings: Settings,
  chart: BarChart3,
} as const

type PrefeituraRedeQuickActionDrawerProps = {
  actionId: PrefeituraRedeQuickActionId | null
  open: boolean
  closing: boolean
  units: PrefeituraRedeUnit[]
  onReload?: () => void | Promise<void>
  onClose: () => void
  onSelectAction: (actionId: PrefeituraRedeQuickActionId) => void
  onBackToHub: () => void
  onTransitionEnd: () => void
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function PrefeituraRedeQuickActionDrawer({
  actionId,
  open,
  closing,
  units,
  onReload,
  onClose,
  onSelectAction,
  onBackToHub,
  onTransitionEnd,
}: PrefeituraRedeQuickActionDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const isHub = actionId === null
  const action = actionId ? getPrefeituraRedeQuickAction(actionId) : undefined
  const ActionIcon = action ? quickActionIcons[action.icon] : Zap

  const isActive = open || closing
  const panelVisible = isActive && entered && !closing

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }

    setToast(null)
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true))
    })
    return () => cancelAnimationFrame(frame)
  }, [open, actionId])

  useEffect(() => {
    if (!isActive) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, onClose])

  useEffect(() => {
    if (!closing) return
    const fallback = window.setTimeout(() => onTransitionEnd(), 350)
    return () => window.clearTimeout(fallback)
  }, [closing, onTransitionEnd])

  if (!isActive) return null

  return createPortal(
    <div
      className={`fixed inset-0 z-[9997] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          panelVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Fechar"
        onClick={onClose}
        tabIndex={panelVisible ? 0 : -1}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="prefeitura-rede-quick-action-title"
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.propertyName === 'transform') onTransitionEnd()
        }}
        className={`absolute inset-x-0 bottom-0 flex h-[92vh] max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border-t border-gray-200 bg-white shadow-[0_-16px_48px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
          panelVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <header className="shrink-0 border-b border-gray-200 bg-gradient-to-b from-[var(--brand-primary-light)]/35 to-white px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              {!isHub ? (
                <button
                  type="button"
                  onClick={onBackToHub}
                  className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                  aria-label="Voltar para ações rápidas"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                </button>
              ) : null}
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  isHub ? 'bg-[var(--brand-primary-light)] text-[var(--brand-primary)]' : action?.iconClass
                }`}
              >
                <ActionIcon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <h2
                  id="prefeitura-rede-quick-action-title"
                  className="text-lg font-bold text-gray-900"
                >
                  {isHub ? 'Ações rápidas' : action?.title}
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  {isHub
                    ? 'Ferramentas para gestão da rede de telemedicina'
                    : action?.description}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-4 sm:px-6 lg:px-8">
          {isHub ? (
            <QuickActionsHub onSelectAction={onSelectAction} />
          ) : null}
          {actionId === 'broadcast' ? (
            <PrefeituraRedeBroadcastDrawerContent onSuccess={(msg) => setToast(msg)} />
          ) : null}
          {actionId === 'maintenance' ? (
            <MaintenanceDrawerContent
              units={units}
              onSuccess={(msg) => setToast(msg)}
              onReload={onReload}
            />
          ) : null}
          {actionId === 'settings' ? (
            <SettingsDrawerContent
              units={units}
              onSuccess={(msg) => setToast(msg)}
              onReload={onReload}
            />
          ) : null}
          {actionId === 'report' ? <ReportDrawerContent units={units} /> : null}
        </div>

        <footer className="shrink-0 border-t border-gray-200 bg-white px-5 py-3 sm:px-6">
          <p className="text-center text-xs text-gray-500">
            {actionId === 'broadcast' || actionId === 'report'
              ? 'Ação simulada · dados de demonstração da rede municipal'
              : 'Alterações salvas na rede municipal vinculada ao seu acesso.'}
          </p>
        </footer>
      </aside>

      <Toast
        message={toast ?? ''}
        visible={toast !== null}
        onClose={() => setToast(null)}
        anchored
      />
    </div>,
    document.body,
  )
}

const drawerPanelShell =
  'flex min-h-0 w-full flex-1 flex-col rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]'

const redeTelemedicineSpecialties = specialties.filter((item) => item.available)

function buildMaintenanceKeysFromUnits(units: PrefeituraRedeUnit[]) {
  const keys = new Set<string>()
  for (const unit of units) {
    if (unit.maintenanceTerminalIndexes?.length) {
      for (const index of unit.maintenanceTerminalIndexes) {
        keys.add(prefeituraRedeTerminalKey(unit.id, index))
      }
      continue
    }
    if (unit.status !== 'manutencao') continue
    for (let i = 0; i < unit.stationsTotal; i++) {
      keys.add(prefeituraRedeTerminalKey(unit.id, i))
    }
  }
  return keys
}

function distributeCapacityEvenly(total: number, unitCount: number) {
  if (unitCount <= 0) return 0
  return Math.max(1, Math.floor(total / unitCount))
}

function buildDefaultUnitDailyLimits(totalCapacity: number, units: PrefeituraRedeUnit[]) {
  const perUnit = distributeCapacityEvenly(totalCapacity, units.length)
  return Object.fromEntries(units.map((unit) => [unit.id, String(perUnit)]))
}

function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  description?: string
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-gray-200 bg-slate-50/60 px-4 py-3.5 transition hover:border-gray-300">
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-gray-900">{label}</span>
        {description ? (
          <span className="mt-1 block text-xs leading-relaxed text-gray-500">{description}</span>
        ) : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          'relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition',
          checked ? 'bg-[var(--brand-primary)]' : 'bg-gray-200',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition',
            checked ? 'left-[1.35rem]' : 'left-0.5',
          ].join(' ')}
        />
      </button>
    </label>
  )
}

function QuickActionsHub({
  onSelectAction,
}: {
  onSelectAction: (actionId: PrefeituraRedeQuickActionId) => void
}) {
  return (
    <ul className="grid min-h-0 flex-1 auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {prefeituraRedeQuickActions.map((item) => (
        <li key={item.id} className="flex min-h-0">
          <button
            type="button"
            onClick={() => onSelectAction(item.id)}
            className="group flex h-full min-h-[12rem] w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary-light)]/10"
          >
            <span className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-4 py-2.5 sm:px-5">
              <span className="min-w-0 text-base font-bold text-gray-900">{item.title}</span>
              <ChevronRight
                className="h-5 w-5 shrink-0 text-gray-400 transition group-hover:text-[var(--brand-primary)]"
                strokeWidth={2}
                aria-hidden
              />
            </span>

            <span className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-2 sm:p-3">
              <img
                src={item.imageSrc}
                alt=""
                className="h-full w-full object-contain object-center"
              />
            </span>

            <span className="shrink-0 border-t border-gray-100 px-4 py-2.5 text-sm leading-relaxed text-gray-500 sm:px-5">
              {item.description}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function MaintenanceToggle({
  checked,
  partial,
  onClick,
  ariaLabel,
}: {
  checked: boolean
  partial?: boolean
  onClick: () => void
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={partial ? 'mixed' : checked}
      aria-label={ariaLabel}
      onClick={onClick}
      className={[
        'relative h-7 w-12 shrink-0 rounded-full transition',
        checked ? 'bg-amber-500' : partial ? 'bg-amber-300' : 'bg-gray-200',
      ].join(' ')}
    >
      <span
        className={[
          'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition',
          checked ? 'left-[1.35rem]' : partial ? 'left-[0.65rem]' : 'left-0.5',
        ].join(' ')}
      />
    </button>
  )
}

function MaintenanceDrawerContent({
  units,
  onSuccess,
  onReload,
}: {
  units: PrefeituraRedeUnit[]
  onSuccess: (message: string) => void
  onReload?: () => void | Promise<void>
}) {
  const { getAccessToken } = usePrefeituraAuth()
  const [maintenanceTerminalKeys, setMaintenanceTerminalKeys] = useState<Set<string>>(() =>
    buildMaintenanceKeysFromUnits(units),
  )
  const [expandedUnitIds, setExpandedUnitIds] = useState<Set<string>>(() => new Set())
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setMaintenanceTerminalKeys(buildMaintenanceKeysFromUnits(units))
  }, [units])

  const sortedUnits = useMemo(
    () => [...units].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [units],
  )

  const maintenanceTerminalCount = maintenanceTerminalKeys.size
  const fullUnitsCount = useMemo(
    () =>
      sortedUnits.filter((u) => isPrefeituraRedeUnitFullyInMaintenance(u, maintenanceTerminalKeys))
        .length,
    [sortedUnits, maintenanceTerminalKeys],
  )

  function toggleUnitExpanded(unitId: string) {
    setExpandedUnitIds((prev) => {
      const next = new Set(prev)
      if (next.has(unitId)) next.delete(unitId)
      else next.add(unitId)
      return next
    })
  }

  function toggleUnitAll(unit: PrefeituraRedeUnit) {
    const allIn = isPrefeituraRedeUnitFullyInMaintenance(unit, maintenanceTerminalKeys)
    setMaintenanceTerminalKeys((prev) => {
      const next = new Set(prev)
      for (let i = 0; i < unit.stationsTotal; i++) {
        const key = prefeituraRedeTerminalKey(unit.id, i)
        if (allIn) next.delete(key)
        else next.add(key)
      }
      return next
    })
  }

  function toggleTerminal(unitId: string, terminalIndex: number) {
    const key = prefeituraRedeTerminalKey(unitId, terminalIndex)
    setMaintenanceTerminalKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function buildSaveMessage() {
    if (maintenanceTerminalCount === 0) return 'Nenhum terminal em manutenção.'
    const terminalLabel = `${maintenanceTerminalCount} terminal${maintenanceTerminalCount === 1 ? '' : 's'} em manutenção`
    if (fullUnitsCount === 0) return `${terminalLabel}.`
    const unitLabel = `${fullUnitsCount} UBT${fullUnitsCount === 1 ? '' : 's'} completa${fullUnitsCount === 1 ? '' : 's'}`
    return `${terminalLabel} (${unitLabel}).`
  }

  async function handleSave() {
    const token = getAccessToken()
    if (!token) {
      onSuccess('Sessão expirada. Faça login novamente.')
      return
    }

    setIsSaving(true)
    try {
      const items = sortedUnits.map((unit) => {
        const terminalIndexes: number[] = []
        for (let index = 0; index < unit.stationsTotal; index++) {
          if (maintenanceTerminalKeys.has(prefeituraRedeTerminalKey(unit.id, index))) {
            terminalIndexes.push(index)
          }
        }
        return { unitId: unit.id, terminalIndexes }
      })

      await updatePrefeituraRedeMaintenance(token, { items })
      await onReload?.()
      onSuccess(buildSaveMessage())
    } catch (error) {
      const message = isPrefeituraRedeApiError(error)
        ? error.message
        : 'Não foi possível salvar a manutenção.'
      onSuccess(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <p className="shrink-0 rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-sm text-amber-900 sm:px-5 sm:py-4">
        Coloque a UBT inteira ou terminais individuais em manutenção. Terminais em manutenção não
        aceitam novos atendimentos até serem reativados.
      </p>

      <div className={`${drawerPanelShell} min-h-0 flex-1 overflow-hidden`}>
        <header className="flex shrink-0 flex-col gap-2 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900">Unidades e terminais</p>
            <p className="text-xs text-gray-500">
              Use o interruptor da UBT para todos os terminais ou expanda para escolher um a um
            </p>
          </div>
          <span className="w-fit shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200/80">
            {maintenanceTerminalCount} terminal{maintenanceTerminalCount === 1 ? '' : 's'} em
            manutenção
          </span>
        </header>
        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-y-contain p-3 sm:p-4">
          {sortedUnits.map((unit) => {
            const terminalsInMaintenance = countPrefeituraRedeTerminalsInMaintenance(
              unit,
              maintenanceTerminalKeys,
            )
            const unitFullyInMaintenance = isPrefeituraRedeUnitFullyInMaintenance(
              unit,
              maintenanceTerminalKeys,
            )
            const unitPartiallyInMaintenance =
              terminalsInMaintenance > 0 && !unitFullyInMaintenance
            const isExpanded = expandedUnitIds.has(unit.id)
            const hasTerminals = unit.stationsTotal > 0

            return (
              <li
                key={unit.id}
                className={[
                  'shrink-0 overflow-hidden rounded-xl border',
                  terminalsInMaintenance > 0
                    ? 'border-amber-200 bg-amber-50/30'
                    : 'border-gray-100 bg-slate-50/60',
                ].join(' ')}
              >
                <div className="flex items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4">
                  <button
                    type="button"
                    onClick={() => toggleUnitExpanded(unit.id)}
                    disabled={!hasTerminals}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-default"
                    aria-expanded={isExpanded}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                      <Building2 className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-gray-900">{unit.name}</span>
                      <span className="text-xs text-gray-500">
                        {unit.region}
                        {hasTerminals ? (
                          <>
                            {' '}
                            · {terminalsInMaintenance}/{unit.stationsTotal} terminal
                            {unit.stationsTotal === 1 ? '' : 's'} em manutenção
                          </>
                        ) : (
                          ' · sem terminais cadastrados'
                        )}
                      </span>
                    </span>
                    {hasTerminals ? (
                      isExpanded ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} />
                      )
                    ) : null}
                  </button>
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      UBT inteira
                    </span>
                    <MaintenanceToggle
                      checked={unitFullyInMaintenance}
                      partial={unitPartiallyInMaintenance}
                      onClick={() => toggleUnitAll(unit)}
                      ariaLabel={`Manutenção da UBT inteira: ${unit.name}`}
                    />
                  </div>
                </div>

                {isExpanded && hasTerminals ? (
                  <ul className="grid gap-2 border-t border-amber-100/80 bg-white/60 px-3 py-3 sm:grid-cols-2 sm:px-4 lg:grid-cols-3">
                    {Array.from({ length: unit.stationsTotal }, (_, index) => {
                      const inMaintenance = maintenanceTerminalKeys.has(
                        prefeituraRedeTerminalKey(unit.id, index),
                      )
                      return (
                        <li
                          key={prefeituraRedeTerminalKey(unit.id, index)}
                          className={[
                            'flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5',
                            inMaintenance
                              ? 'border-amber-200 bg-amber-50/80'
                              : 'border-gray-100 bg-white',
                          ].join(' ')}
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-600">
                              <Monitor className="h-3.5 w-3.5" strokeWidth={1.75} />
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              Terminal {index + 1}
                            </span>
                          </div>
                          <MaintenanceToggle
                            checked={inMaintenance}
                            onClick={() => toggleTerminal(unit.id, index)}
                            ariaLabel={`Manutenção do terminal ${index + 1} em ${unit.name}`}
                          />
                        </li>
                      )
                    })}
                  </ul>
                ) : null}
              </li>
            )
          })}
        </ul>
      </div>

      <footer className="flex shrink-0 justify-end border-t border-gray-200 pt-4">
        <button
          type="button"
          disabled={isSaving}
          onClick={() => void handleSave()}
          className="btn-brand-gradient rounded-xl px-8 py-3 text-sm font-semibold disabled:opacity-60"
        >
          {isSaving ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </footer>
    </div>
  )
}

function SettingsDrawerContent({
  units,
  onSuccess,
  onReload,
}: {
  units: PrefeituraRedeUnit[]
  onSuccess: (message: string) => void
  onReload?: () => void | Promise<void>
}) {
  const { getAccessToken } = usePrefeituraAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [limitDailyCapacity, setLimitDailyCapacity] = useState(true)
  const [dailyCapacity, setDailyCapacity] = useState('512')
  const [limitPerUnit, setLimitPerUnit] = useState(false)
  const [unitDailyLimits, setUnitDailyLimits] = useState<Record<string, string>>({})
  const [unitSpecialties, setUnitSpecialties] = useState<Record<string, Set<string>>>({})
  const [allowAvulso, setAllowAvulso] = useState(true)
  const [packageConsultationsTotal, setPackageConsultationsTotal] = useState<number | null>(null)
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null)

  const sortedUnits = useMemo(
    () => [...units].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [units],
  )

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)

    void fetchPrefeituraRedeSettings(token)
      .then((settings) => {
        if (cancelled) return
        applySettings(settings, units)
        setExpandedUnitId(units[0]?.id ?? null)
      })
      .catch(() => {
        if (cancelled) return
        applySettings(
          {
            limitDailyCapacity: true,
            dailyCapacity: 512,
            limitPerUnit: false,
            unitDailyLimits: buildDefaultUnitDailyLimits(512, units),
            unitSpecialties: Object.fromEntries(units.map((unit) => [unit.id, [] as string[]])),
            allowAvulso: true,
            packageConsultationsTotal: null,
          },
          units,
        )
        setExpandedUnitId(units[0]?.id ?? null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [getAccessToken, units])

  function applySettings(settings: PrefeituraRedeSettingsApi, currentUnits: PrefeituraRedeUnit[]) {
    setLimitDailyCapacity(settings.limitDailyCapacity)
    setDailyCapacity(String(settings.dailyCapacity || 512))
    setLimitPerUnit(settings.limitPerUnit)
    setUnitDailyLimits(
      settings.unitDailyLimits && Object.keys(settings.unitDailyLimits).length > 0
        ? settings.unitDailyLimits
        : buildDefaultUnitDailyLimits(settings.dailyCapacity || 512, currentUnits),
    )
    setUnitSpecialties(
      Object.fromEntries(
        currentUnits.map((unit) => [
          unit.id,
          new Set(settings.unitSpecialties?.[unit.id] ?? []),
        ]),
      ),
    )
    setAllowAvulso(settings.allowAvulso)
    setPackageConsultationsTotal(settings.packageConsultationsTotal)
  }

  const networkCapacity = Math.max(0, parseInt(dailyCapacity, 10) || 0)

  const distributedSum = useMemo(
    () =>
      Object.values(unitDailyLimits).reduce((sum, value) => sum + Math.max(0, parseInt(value, 10) || 0), 0),
    [unitDailyLimits],
  )

  const capacityMismatch = limitPerUnit && limitDailyCapacity && distributedSum !== networkCapacity

  function handleDailyCapacityChange(value: string) {
    setDailyCapacity(value)
    const nextTotal = Math.max(0, parseInt(value, 10) || 0)
    if (limitPerUnit) {
      setUnitDailyLimits(buildDefaultUnitDailyLimits(nextTotal, units))
    }
  }

  function handleLimitPerUnitChange(enabled: boolean) {
    setLimitPerUnit(enabled)
    if (enabled) {
      setUnitDailyLimits(buildDefaultUnitDailyLimits(networkCapacity, units))
    }
  }

  function updateUnitLimit(unitId: string, value: string) {
    setUnitDailyLimits((prev) => ({ ...prev, [unitId]: value }))
  }

  function toggleUnitSpecialty(unitId: string, specialtyId: string) {
    setUnitSpecialties((prev) => {
      const current = new Set(prev[unitId] ?? [])
      if (current.has(specialtyId)) current.delete(specialtyId)
      else current.add(specialtyId)
      return { ...prev, [unitId]: current }
    })
  }

  function redistributeCapacity() {
    setUnitDailyLimits(buildDefaultUnitDailyLimits(networkCapacity, units))
  }

  async function handleSave() {
    const token = getAccessToken()
    if (!token) {
      onSuccess('Sessão expirada. Faça login novamente.')
      return
    }

    setIsSaving(true)
    try {
      await updatePrefeituraRedeSettings(token, {
        limitDailyCapacity,
        dailyCapacity: networkCapacity,
        limitPerUnit,
        unitDailyLimits: limitPerUnit ? unitDailyLimits : {},
        unitSpecialties: Object.fromEntries(
          Object.entries(unitSpecialties).map(([unitId, ids]) => [unitId, [...ids]]),
        ),
        allowAvulso,
      })
      await onReload?.()
      onSuccess('Configurações globais salvas.')
    } catch (error) {
      const message = isPrefeituraRedeApiError(error)
        ? error.message
        : 'Não foi possível salvar as configurações.'
      onSuccess(message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-gray-500">
        Carregando configurações…
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-6">
        <section className={`${drawerPanelShell} gap-4 overflow-y-auto overscroll-y-contain p-4 sm:p-5`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Capacidade de consultas
          </p>

          <ToggleSwitch
            checked={limitDailyCapacity}
            onChange={setLimitDailyCapacity}
            label="Limitar capacidade diária da rede"
            description="Ao atingir o limite, novas consultas são bloqueadas até o dia seguinte."
          />

          {limitDailyCapacity ? (
            <>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-gray-800">
                  Capacidade diária total
                </span>
                <input
                  type="number"
                  min={1}
                  value={dailyCapacity}
                  onChange={(event) => handleDailyCapacityChange(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[var(--brand-primary)]/40 focus:shadow-[var(--brand-primary-focus-ring)]"
                />
              </label>

              <ToggleSwitch
                checked={limitPerUnit}
                onChange={handleLimitPerUnitChange}
                label="Distribuir limite por unidade"
                description="Define quantas consultas cada UBT pode realizar por dia."
              />
            </>
          ) : null}

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Pacote mensal
            </p>
            <div className="mt-3 rounded-xl border border-gray-200 bg-slate-50/80 px-4 py-3">
              <p className="text-sm font-semibold text-gray-800">Consultas por pacote</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-gray-900">
                {packageConsultationsTotal != null
                  ? packageConsultationsTotal.toLocaleString('pt-BR')
                  : '—'}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                Definido no contrato municipal. Este valor não pode ser alterado pelo painel.
              </p>
            </div>
            <div className="mt-3">
              <ToggleSwitch
                checked={allowAvulso}
                onChange={setAllowAvulso}
                label="Permitir consultas avulsas após esgotar o pacote"
              />
            </div>
          </div>
        </section>

        <div className="flex min-h-0 flex-1 flex-col gap-4">
          {limitDailyCapacity && limitPerUnit ? (
            <section className={`${drawerPanelShell} min-h-[12rem] flex-1`}>
              <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 sm:px-5">
                <div>
                  <p className="text-sm font-bold text-gray-900">Limite por unidade</p>
                  <p
                    className={[
                      'text-xs',
                      capacityMismatch ? 'font-semibold text-amber-700' : 'text-gray-500',
                    ].join(' ')}
                  >
                    Distribuído: {distributedSum} · Rede: {networkCapacity}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={redistributeCapacity}
                  className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Redistribuir igualmente
                </button>
              </header>
              <ul className="grid min-h-0 flex-1 gap-2 overflow-y-auto overscroll-y-contain p-3 content-start sm:grid-cols-2 sm:p-4 xl:grid-cols-3">
                {sortedUnits.map((unit) => (
                  <li
                    key={unit.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-slate-50/60 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{unit.name}</p>
                      <p className="text-xs text-gray-500">{unit.region}</p>
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={unitDailyLimits[unit.id] ?? '0'}
                      onChange={(event) => updateUnitLimit(unit.id, event.target.value)}
                      className="w-16 shrink-0 rounded-lg border border-gray-200 px-2 py-1.5 text-center text-sm font-semibold tabular-nums outline-none focus:border-[var(--brand-primary)]/40"
                      aria-label={`Limite diário de ${unit.name}`}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className={`${drawerPanelShell} min-h-0 flex-1`}>
            <header className="shrink-0 border-b border-gray-100 px-4 py-3 sm:px-5">
              <p className="text-sm font-bold text-gray-900">Especialidades por unidade</p>
              <p className="text-xs text-gray-500">
                Defina quais especialidades cada UBT pode atender na rede.
              </p>
            </header>
            <ul className="min-h-0 flex-1 divide-y divide-gray-100 overflow-y-auto overscroll-y-contain">
              {sortedUnits.map((unit) => (
                <UnitSpecialtyConfigRow
                  key={unit.id}
                  unit={unit}
                  expanded={expandedUnitId === unit.id}
                  onToggleExpand={() =>
                    setExpandedUnitId((current) => (current === unit.id ? null : unit.id))
                  }
                  selectedIds={unitSpecialties[unit.id] ?? new Set()}
                  onToggleSpecialty={(specialtyId) => toggleUnitSpecialty(unit.id, specialtyId)}
                />
              ))}
            </ul>
          </section>
        </div>
      </div>

      <footer className="flex shrink-0 justify-end border-t border-gray-200 pt-4">
        <button
          type="button"
          disabled={isSaving || capacityMismatch}
          onClick={() => void handleSave()}
          className="btn-brand-gradient rounded-xl px-8 py-3 text-sm font-semibold disabled:opacity-60"
        >
          {isSaving ? 'Salvando…' : 'Salvar configurações'}
        </button>
      </footer>
    </div>
  )
}

function UnitSpecialtyConfigRow({
  unit,
  expanded,
  onToggleExpand,
  selectedIds,
  onToggleSpecialty,
}: {
  unit: PrefeituraRedeUnit
  expanded: boolean
  onToggleExpand: () => void
  selectedIds: Set<string>
  onToggleSpecialty: (specialtyId: string) => void
}) {
  const selectedCount = selectedIds.size

  return (
    <li>
      <button
        type="button"
        onClick={onToggleExpand}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-gray-50/80 sm:px-5"
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-gray-900">{unit.name}</span>
          <span className="text-xs text-gray-500">{unit.region}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
            {selectedCount} especialidade{selectedCount === 1 ? '' : 's'}
          </span>
          <ChevronRight
            className={`h-4 w-4 text-gray-400 transition ${expanded ? 'rotate-90' : ''}`}
            strokeWidth={2}
          />
        </span>
      </button>

      {expanded ? (
        <div className="border-t border-gray-100 bg-slate-50/40 px-4 py-3 sm:px-5">
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {redeTelemedicineSpecialties.map((specialty) => {
              const checked = selectedIds.has(specialty.id)
              return (
                <li key={specialty.id}>
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm transition hover:border-[var(--brand-primary)]/25">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleSpecialty(specialty.id)}
                      className="h-4 w-4 shrink-0 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                    />
                    <span className="min-w-0 font-medium text-gray-800">{specialty.name}</span>
                  </label>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </li>
  )
}

function ReportDrawerContent({ units }: { units: PrefeituraRedeUnit[] }) {
  const activeUnits = units.filter((u) => u.status === 'ativa').length
  const onlineStations = units.reduce((sum, u) => sum + u.stationsOnline, 0)
  const consultations7d = units.reduce((s, u) => s + u.stationsTotal * 12, 0)

  const regionSummary = useMemo(() => {
    const counts = new Map<string, number>()
    for (const unit of units) {
      counts.set(unit.region, (counts.get(unit.region) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [units])

  const totalUnits = units.length

  const reportKpiCards = useMemo((): KpiStatCardItem[] => {
    const [sky, orange, violet, emerald] = kpiStatStylePresets
    return [
      {
        label: 'UBT ativas',
        value: formatNumber(activeUnits),
        suffix: `de ${formatNumber(totalUnits)} unidades`,
        icon: Building2,
        ...emerald,
      },
      {
        label: 'Terminais online',
        value: formatNumber(onlineStations),
        suffix: 'em operação agora',
        icon: Monitor,
        ...sky,
      },
      {
        label: 'Consultas (7d)',
        value: formatPrefeituraNumber(consultations7d),
        suffix: 'na rede municipal',
        icon: Activity,
        ...orange,
      },
      {
        label: 'SLA médio',
        value: '94%',
        suffix: 'meta ≥ 90%',
        icon: Gauge,
        ...violet,
      },
    ]
  }, [activeUnits, consultations7d, onlineStations, totalUnits])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 lg:gap-6">
      <KpiStatCards items={reportKpiCards} className="shrink-0 gap-3 sm:gap-4" />

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_min(100%,20rem)] lg:gap-6">
        <section className={`${drawerPanelShell} flex flex-col justify-between p-5 sm:p-6 lg:p-8`}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Resumo da rede
            </p>
            <p className="mt-3 max-w-3xl text-base leading-relaxed text-gray-700">
              Visão consolidada do desempenho da rede de teleatendimento: volume por região, filas,
              disponibilidade de terminais e comparativo com o pacote mensal de consultas.
            </p>
          </div>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {regionSummary.map(([region, count]) => (
              <li
                key={region}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-slate-50/80 px-4 py-3"
              >
                <span className="text-sm font-medium text-gray-700">{region}</span>
                <span className="text-sm font-bold tabular-nums text-gray-900">
                  {count} UBT{count === 1 ? '' : 's'}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex min-h-0 flex-col gap-4">
          <div className={`${drawerPanelShell} flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center`}>
            <BarChart3 className="h-10 w-10 text-[var(--brand-primary)]" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-gray-900">Relatórios detalhados</p>
            <p className="text-xs leading-relaxed text-gray-500">
              Exportação, filtros avançados e histórico completo no módulo de relatórios.
            </p>
          </div>
          <Link
            to={prefeituraRoutes.relatorios}
            className="btn-brand-gradient inline-flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold"
          >
            <BarChart3 className="h-4 w-4" strokeWidth={2} />
            Abrir relatórios completos
          </Link>
        </section>
      </div>
    </div>
  )
}
