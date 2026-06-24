import { Building2, Landmark, Search, Send, Smartphone, Stethoscope } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import {
  type AdminBroadcast,
  type AdminNotificationPriority,
  type AdminNotificationSelectionMode,
  type AdminNotificationTargetSnapshot,
  type MedicoAudienceScope,
} from '../../../data/adminNotificacoesMock'
import type {
  AdminRecipientPrefeitura,
  AdminRecipientPrefeituraUser,
  AdminRecipientProfissionaisStats,
  AdminRecipientProfissional,
  AdminRecipientUbt,
  AdminRecipientUbtUser,
  CreateAdminBroadcastPayload,
} from '../../../lib/services/admin/notificacoes'
import { CustomSelect } from '../../ui/CustomSelect'

const panelShell =
  'flex min-h-0 flex-1 flex-col rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]'

function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

type AdminNotificacoesComposeDrawerContentProps = {
  onSent: (broadcast: AdminBroadcast) => void
  sendBroadcast: (payload: CreateAdminBroadcastPayload) => Promise<AdminBroadcast>
  profissionaisStats: AdminRecipientProfissionaisStats | null
  profissionais: AdminRecipientProfissional[]
  prefeituras: AdminRecipientPrefeitura[]
  ubts: AdminRecipientUbt[]
  prefeituraUsers: AdminRecipientPrefeituraUser[]
  ubtUsers: AdminRecipientUbtUser[]
  recipientsLoading: boolean
  recipientsError: string | null
  onRetryRecipients: () => void
}

export function AdminNotificacoesComposeDrawerContent({
  onSent,
  sendBroadcast,
  profissionaisStats,
  profissionais,
  prefeituras,
  ubts,
  prefeituraUsers,
  ubtUsers,
  recipientsLoading,
  recipientsError,
  onRetryRecipients,
}: AdminNotificacoesComposeDrawerContentProps) {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState<AdminNotificationPriority>('normal')
  const [isSending, setIsSending] = useState(false)
  const [includePrefeituras, setIncludePrefeituras] = useState(true)
  const [includeAppPacientes, setIncludeAppPacientes] = useState(false)
  const [includeUbts, setIncludeUbts] = useState(false)
  const [includeMedicos, setIncludeMedicos] = useState(false)
  const [medicoScope, setMedicoScope] = useState<MedicoAudienceScope>('medico_all')
  const [specialtyFilter, setSpecialtyFilter] = useState('')
  const [prefeituraMode, setPrefeituraMode] = useState<AdminNotificationSelectionMode>('all')
  const [ubtMode, setUbtMode] = useState<AdminNotificationSelectionMode>('all')
  const [selectedPrefeituraIds, setSelectedPrefeituraIds] = useState<Set<string>>(new Set())
  const [selectedUbtIds, setSelectedUbtIds] = useState<Set<string>>(new Set())
  const [selectedPrefeituraUserIds, setSelectedPrefeituraUserIds] = useState<Set<string>>(new Set())
  const [selectedUbtUserIds, setSelectedUbtUserIds] = useState<Set<string>>(new Set())
  const [selectedMedicoIds, setSelectedMedicoIds] = useState<Set<string>>(new Set())
  const [prefeituraSearch, setPrefeituraSearch] = useState('')
  const [ubtSearch, setUbtSearch] = useState('')
  const [prefeituraUserSearch, setPrefeituraUserSearch] = useState('')
  const [ubtUserSearch, setUbtUserSearch] = useState('')
  const [medicoUserSearch, setMedicoUserSearch] = useState('')
  const [medicoSpecialtyFilter, setMedicoSpecialtyFilter] = useState('all')
  const [ufFilter, setUfFilter] = useState('all')
  const [ubtPrefeituraFilter, setUbtPrefeituraFilter] = useState('all')
  const [prefeituraUserPrefeituraFilter, setPrefeituraUserPrefeituraFilter] = useState('all')
  const [ubtUserPrefeituraFilter, setUbtUserPrefeituraFilter] = useState('all')
  const [ubtUserUnidadeFilter, setUbtUserUnidadeFilter] = useState('all')

  const ufFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'UF: Todas' },
      ...Array.from(new Set(prefeituras.map((item) => item.uf)))
        .sort()
        .map((uf) => ({ value: uf, label: uf })),
    ],
    [prefeituras],
  )

  const ubtPrefeituraFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'Prefeitura: Todas' },
      ...prefeituras.map((item) => ({
        value: item.id,
        label: `${item.name} · ${item.uf}`,
      })),
    ],
    [prefeituras],
  )

  const ubtUserUnidadeFilterOptions = useMemo(() => {
    const units = ubts.filter((item) => {
      if (ubtUserPrefeituraFilter !== 'all' && item.prefeituraId !== ubtUserPrefeituraFilter) {
        return false
      }
      if (ufFilter !== 'all' && item.uf !== ufFilter) return false
      return true
    })
    return [
      { value: 'all', label: 'UBT: Todas' },
      ...units.map((item) => ({
        value: item.id,
        label: `${item.name} · ${item.prefeituraName}`,
      })),
    ]
  }, [ubts, ubtUserPrefeituraFilter, ufFilter])

  const medicoSpecialtyFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'Especialidade: Todas' },
      ...(profissionaisStats?.especialidades ?? []).map((item) => ({
        value: item.name,
        label: `${item.name} (${item.activeCount})`,
      })),
    ],
    [profissionaisStats],
  )

  const filteredPrefeituras = useMemo(() => {
    const query = normalizeSearch(prefeituraSearch.trim())
    return prefeituras.filter((item) => {
      if (ufFilter !== 'all' && item.uf !== ufFilter) return false
      if (!query) return true
      return normalizeSearch(`${item.name} ${item.municipality} ${item.uf}`).includes(query)
    })
  }, [prefeituraSearch, prefeituras, ufFilter])

  const filteredUbts = useMemo(() => {
    const query = normalizeSearch(ubtSearch.trim())
    return ubts.filter((item) => {
      if (ubtPrefeituraFilter !== 'all' && item.prefeituraId !== ubtPrefeituraFilter) {
        return false
      }
      if (ufFilter !== 'all' && item.uf !== ufFilter) return false
      if (!query) return true
      return normalizeSearch(`${item.name} ${item.prefeituraName} ${item.municipality}`).includes(
        query,
      )
    })
  }, [ubtPrefeituraFilter, ubts, ubtSearch, ufFilter])

  const filteredPrefeituraUsers = useMemo(() => {
    const query = normalizeSearch(prefeituraUserSearch.trim())
    return prefeituraUsers.filter((item) => {
      if (prefeituraUserPrefeituraFilter !== 'all' && item.prefeituraId !== prefeituraUserPrefeituraFilter) {
        return false
      }
      if (ufFilter !== 'all' && item.uf !== ufFilter) return false
      if (!query) return true
      return normalizeSearch(
        `${item.name} ${item.role} ${item.prefeituraName} ${item.municipality} ${item.uf}`,
      ).includes(query)
    })
  }, [prefeituraUserPrefeituraFilter, prefeituraUserSearch, prefeituraUsers, ufFilter])

  const filteredUbtUsers = useMemo(() => {
    const query = normalizeSearch(ubtUserSearch.trim())
    return ubtUsers.filter((item) => {
      if (ubtUserPrefeituraFilter !== 'all' && item.prefeituraId !== ubtUserPrefeituraFilter) {
        return false
      }
      if (ubtUserUnidadeFilter !== 'all' && item.unidadeId !== ubtUserUnidadeFilter) return false
      if (ufFilter !== 'all' && item.uf !== ufFilter) return false
      if (!query) return true
      return normalizeSearch(
        `${item.name} ${item.role} ${item.unidadeName} ${item.prefeituraName} ${item.municipality}`,
      ).includes(query)
    })
  }, [ubtUserPrefeituraFilter, ubtUserSearch, ubtUsers, ubtUserUnidadeFilter, ufFilter])

  const filteredProfissionais = useMemo(() => {
    const query = normalizeSearch(medicoUserSearch.trim())
    return profissionais.filter((item) => {
      if (medicoSpecialtyFilter !== 'all' && item.specialty !== medicoSpecialtyFilter) {
        return false
      }
      if (!query) return true
      return normalizeSearch(
        `${item.name} ${item.specialty} ${item.councilRegistration ?? ''}`,
      ).includes(query)
    })
  }, [medicoSpecialtyFilter, medicoUserSearch, profissionais])

  const prefeituraRecipients =
    prefeituraMode === 'all'
      ? prefeituras
      : prefeituraMode === 'selected'
        ? prefeituras.filter((item) => selectedPrefeituraIds.has(item.id))
        : prefeituraUsers.filter((item) => selectedPrefeituraUserIds.has(item.id))

  const ubtRecipients =
    ubtMode === 'all'
      ? ubts
      : ubtMode === 'selected'
        ? ubts.filter((item) => selectedUbtIds.has(item.id))
        : ubtUsers.filter((item) => selectedUbtUserIds.has(item.id))

  const medicoRecipientCount = useMemo(() => {
    if (!includeMedicos || !profissionaisStats) return 0
    if (medicoScope === 'medico_users') return selectedMedicoIds.size
    if (medicoScope === 'medico_all') return profissionaisStats.totalAtivos
    if (medicoScope === 'medico_plantao') return profissionaisStats.emPlantao
    const selected = profissionaisStats.especialidades.find(
      (item) => item.id === specialtyFilter || item.name === specialtyFilter,
    )
    return selected?.activeCount ?? 0
  }, [includeMedicos, medicoScope, profissionaisStats, specialtyFilter, selectedMedicoIds.size])

  const recipientCount = useMemo(() => {
    let count = 0
    if (includePrefeituras) {
      if (prefeituraMode === 'users') count += selectedPrefeituraUserIds.size
      else count += prefeituraRecipients.length
    }
    if (includeUbts) {
      if (ubtMode === 'users') count += selectedUbtUserIds.size
      else count += ubtRecipients.length
    }
    if (includeMedicos) count += medicoRecipientCount
    return count
  }, [
    includePrefeituras,
    includeUbts,
    includeMedicos,
    prefeituraMode,
    ubtMode,
    prefeituraRecipients.length,
    ubtRecipients.length,
    selectedPrefeituraUserIds.size,
    selectedUbtUserIds.size,
    medicoRecipientCount,
  ])

  const destinationPreview = useMemo(() => {
    if (!includePrefeituras && !includeUbts && !includeMedicos && !includeAppPacientes) {
      return 'Marque pelo menos um tipo de destinatário.'
    }
    if (includeMedicos && medicoScope === 'medico_especialidade' && !specialtyFilter) {
      return 'Selecione a especialidade para ver o alcance do comunicado.'
    }

    const parts: string[] = []
    if (includeAppPacientes) {
      parts.push('todos os pacientes ativos do app Telefarmed Cidades')
    }
    if (includePrefeituras && prefeituraMode === 'all') parts.push('todas as prefeituras ativas')
    if (includePrefeituras && prefeituraMode === 'users') {
      parts.push(`${selectedPrefeituraUserIds.size} gestor(es) municipal(is)`)
    }
    if (includeUbts && ubtMode === 'all') parts.push('todas as UBTs da rede')
    if (includeUbts && ubtMode === 'users') {
      parts.push(`${selectedUbtUserIds.size} operador(es) UBT`)
    }
    if (includeMedicos) {
      if (medicoScope === 'medico_users') {
        parts.push(`${selectedMedicoIds.size} profissional(is) selecionado(s)`)
      } else if (medicoScope === 'medico_all') {
        parts.push(`${medicoRecipientCount} profissional(is) ativo(s)`)
      } else if (medicoScope === 'medico_plantao') {
        parts.push(`${medicoRecipientCount} profissional(is) em plantão`)
      } else {
        parts.push(`${medicoRecipientCount} profissional(is) da especialidade selecionada`)
      }
    }

    if (!parts.length) return 'Selecione os destinatários nas listas ao lado.'
    return `O comunicado será enviado para ${parts.join(' · ')}.`
  }, [
    includePrefeituras,
    includeAppPacientes,
    includeUbts,
    includeMedicos,
    prefeituraMode,
    ubtMode,
    medicoScope,
    specialtyFilter,
    medicoRecipientCount,
    selectedPrefeituraUserIds.size,
    selectedUbtUserIds.size,
    selectedMedicoIds.size,
  ])

  const showDestinationPreview =
    !(includePrefeituras && (prefeituraMode === 'selected' || prefeituraMode === 'users')) &&
    !(includeUbts && (ubtMode === 'selected' || ubtMode === 'users')) &&
    !(includeMedicos && medicoScope === 'medico_users')

  const canSend =
    title.trim().length > 0 &&
    message.trim().length > 0 &&
    (includePrefeituras || includeUbts || includeMedicos || includeAppPacientes) &&
    (!includePrefeituras ||
      prefeituraMode === 'all' ||
      (prefeituraMode === 'selected' && selectedPrefeituraIds.size > 0) ||
      (prefeituraMode === 'users' && selectedPrefeituraUserIds.size > 0)) &&
    (!includeUbts ||
      ubtMode === 'all' ||
      (ubtMode === 'selected' && selectedUbtIds.size > 0) ||
      (ubtMode === 'users' && selectedUbtUserIds.size > 0)) &&
    (!includeMedicos ||
      (medicoScope === 'medico_users' && selectedMedicoIds.size > 0) ||
      (medicoScope !== 'medico_especialidade' && medicoScope !== 'medico_users') ||
      specialtyFilter.trim().length > 0)

  function togglePrefeitura(id: string) {
    setSelectedPrefeituraIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleUbt(id: string) {
    setSelectedUbtIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAllPrefeituras() {
    setSelectedPrefeituraIds(new Set(filteredPrefeituras.map((p) => p.id)))
  }

  function clearPrefeituras() {
    setSelectedPrefeituraIds(new Set())
  }

  function selectAllUbts() {
    setSelectedUbtIds(new Set(filteredUbts.map((u) => u.id)))
  }

  function clearUbts() {
    setSelectedUbtIds(new Set())
  }

  function togglePrefeituraUser(id: string) {
    setSelectedPrefeituraUserIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleUbtUser(id: string) {
    setSelectedUbtUserIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAllPrefeituraUsers() {
    setSelectedPrefeituraUserIds(new Set(filteredPrefeituraUsers.map((user) => user.id)))
  }

  function clearPrefeituraUsers() {
    setSelectedPrefeituraUserIds(new Set())
  }

  function selectAllUbtUsers() {
    setSelectedUbtUserIds(new Set(filteredUbtUsers.map((user) => user.id)))
  }

  function clearUbtUsers() {
    setSelectedUbtUserIds(new Set())
  }

  function toggleMedico(id: string) {
    setSelectedMedicoIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAllMedicos() {
    setSelectedMedicoIds(new Set(filteredProfissionais.map((item) => item.id)))
  }

  function clearMedicos() {
    setSelectedMedicoIds(new Set())
  }

  async function handleSend() {
    if (!canSend || isSending) return

    const targets: AdminNotificationTargetSnapshot[] = []

    const apiTargets: CreateAdminBroadcastPayload['targets'] = []

    if (includeAppPacientes) {
      targets.push({
        channel: 'paciente_app',
        mode: 'all',
        recipientIds: [],
        recipientLabels: ['Todos os pacientes ativos do app'],
        count: 0,
      })
      apiTargets.push({
        channel: 'paciente_app',
        mode: 'all',
      })
    }

    if (includePrefeituras) {
      if (prefeituraMode === 'users') {
        const list = prefeituraUsers.filter((user) => selectedPrefeituraUserIds.has(user.id))
        targets.push({
          channel: 'prefeitura',
          mode: 'users',
          userIds: list.map((user) => user.id),
          recipientIds: [],
          recipientLabels: list.map((user) => `${user.name} · ${user.prefeituraName}`),
          count: list.length,
        })
        apiTargets.push({
          channel: 'prefeitura',
          mode: 'users',
          userIds: list.map((user) => user.id),
        })
      } else {
        const list = prefeituraRecipients as AdminRecipientPrefeitura[]
        targets.push({
          channel: 'prefeitura',
          mode: prefeituraMode,
          recipientIds: prefeituraMode === 'all' ? [] : list.map((p) => p.id),
          recipientLabels:
            prefeituraMode === 'all'
              ? ['Todas as prefeituras ativas']
              : list.map((p) => p.name),
          count: list.length,
        })
        apiTargets.push({
          channel: 'prefeitura',
          mode: prefeituraMode,
          recipientIds: prefeituraMode === 'all' ? undefined : list.map((p) => p.id),
        })
      }
    }

    if (includeUbts) {
      if (ubtMode === 'users') {
        const list = ubtUsers.filter((user) => selectedUbtUserIds.has(user.id))
        targets.push({
          channel: 'ubt',
          mode: 'users',
          userIds: list.map((user) => user.id),
          recipientIds: [],
          recipientLabels: list.map((user) =>
            user.isUnitResponsible
              ? `Responsável · ${user.unidadeName}`
              : `${user.name} · ${user.unidadeName}`,
          ),
          count: list.length,
        })
        apiTargets.push({
          channel: 'ubt',
          mode: 'users',
          userIds: list.map((user) => user.id),
        })
      } else {
        const list = ubtRecipients as AdminRecipientUbt[]
        targets.push({
          channel: 'ubt',
          mode: ubtMode,
          recipientIds: ubtMode === 'all' ? [] : list.map((u) => u.id),
          recipientLabels: ubtMode === 'all' ? ['Todas as UBTs'] : list.map((u) => u.name),
          count: list.length,
        })
        apiTargets.push({
          channel: 'ubt',
          mode: ubtMode,
          recipientIds: ubtMode === 'all' ? undefined : list.map((u) => u.id),
        })
      }
    }

    if (includeMedicos) {
      if (medicoScope === 'medico_users') {
        const list = profissionais.filter((item) => selectedMedicoIds.has(item.id))
        targets.push({
          channel: 'medico',
          mode: 'users',
          userIds: list.map((item) => item.id),
          recipientIds: [],
          recipientLabels: list.map((item) =>
            item.councilRegistration
              ? `${item.name} · ${item.specialty} · ${item.councilRegistration}`
              : `${item.name} · ${item.specialty}`,
          ),
          count: list.length,
        })
        apiTargets.push({
          channel: 'medico',
          mode: 'users',
          userIds: list.map((item) => item.id),
        })
      } else {
        const selectedSpecialty = profissionaisStats?.especialidades.find(
          (item) => item.id === specialtyFilter,
        )
        targets.push({
          channel: 'medico',
          mode: 'all',
          audienceScope: medicoScope,
          specialtyFilter:
            medicoScope === 'medico_especialidade'
              ? selectedSpecialty?.name ?? specialtyFilter
              : undefined,
          recipientIds: [],
          recipientLabels: [
            medicoScope === 'medico_all'
              ? 'Todos os profissionais ativos'
              : medicoScope === 'medico_plantao'
                ? 'Plantão atual'
                : `Especialidade · ${selectedSpecialty?.name ?? specialtyFilter}`,
          ],
          count: medicoRecipientCount,
        })
        apiTargets.push({
          channel: 'medico',
          mode: 'all',
          audienceScope: medicoScope,
          specialtyFilter:
            medicoScope === 'medico_especialidade'
              ? selectedSpecialty?.name ?? specialtyFilter
              : undefined,
        })
      }
    }

    setIsSending(true)
    try {
      const broadcast = await sendBroadcast({
        title: title.trim(),
        body: message.trim(),
        priority,
        targets: apiTargets,
      })

      onSent(broadcast)
      setTitle('')
      setMessage('')
      setPriority('normal')
      setIncludePrefeituras(true)
      setIncludeAppPacientes(false)
      setIncludeUbts(false)
      setIncludeMedicos(false)
      setMedicoScope('medico_all')
      setSpecialtyFilter('')
      setPrefeituraMode('all')
      setUbtMode('all')
      setSelectedPrefeituraIds(new Set())
      setSelectedUbtIds(new Set())
      setSelectedPrefeituraUserIds(new Set())
      setSelectedUbtUserIds(new Set())
      setSelectedMedicoIds(new Set())
      setPrefeituraSearch('')
      setUbtSearch('')
      setPrefeituraUserSearch('')
      setUbtUserSearch('')
      setMedicoUserSearch('')
      setMedicoSpecialtyFilter('all')
      setUfFilter('all')
      setUbtPrefeituraFilter('all')
      setPrefeituraUserPrefeituraFilter('all')
      setUbtUserPrefeituraFilter('all')
      setUbtUserUnidadeFilter('all')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-6">
      <section className="flex min-h-0 w-full shrink-0 flex-col gap-4 lg:w-[min(100%,22rem)] xl:w-[min(100%,26rem)]">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Assunto
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do comunicado"
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[var(--brand-primary)]/40 focus:shadow-[0_0_0_3px_rgba(255,107,0,0.12)]"
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Mensagem
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escreva o comunicado..."
            className="min-h-[8rem] flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-[var(--brand-primary)]/40 focus:shadow-[0_0_0_3px_rgba(255,107,0,0.12)] lg:min-h-[10rem]"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Prioridade
          </label>
          <CustomSelect
            value={priority}
            onChange={(value) => setPriority(value as AdminNotificationPriority)}
            options={[
              { value: 'normal', label: 'Normal' },
              { value: 'important', label: 'Importante' },
            ]}
          />
        </div>

        <div className="space-y-3 rounded-xl border border-gray-200 bg-slate-50/60 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Destino</p>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5">
            <input
              type="checkbox"
              checked={includeAppPacientes}
              onChange={(e) => setIncludeAppPacientes(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)]"
            />
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                <Smartphone className="h-4 w-4 text-orange-500" strokeWidth={2} />
                App do paciente
              </span>
              <span className="mt-0.5 block text-xs text-gray-500">
                Telefarmed Cidades — caixa de entrada no celular
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5">
            <input
              type="checkbox"
              checked={includePrefeituras}
              onChange={(e) => setIncludePrefeituras(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)]"
            />
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                <Landmark className="h-4 w-4 text-violet-600" strokeWidth={2} />
                Prefeituras
              </span>
              <span className="mt-0.5 block text-xs text-gray-500">
                Gestão municipal e contrato
              </span>
            </span>
          </label>

          {includePrefeituras ? (
            <div className="ml-2 space-y-2 border-l-2 border-violet-200 pl-3">
              <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
                {(
                  [
                    { value: 'all', label: 'Todas' },
                    { value: 'selected', label: 'Prefeituras' },
                    { value: 'users', label: 'Pessoas' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPrefeituraMode(opt.value)}
                    className={[
                      'rounded-md px-2.5 py-1.5 text-xs font-semibold',
                      prefeituraMode === opt.value
                        ? 'bg-violet-100 text-violet-800'
                        : 'text-gray-600',
                    ].join(' ')}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5">
            <input
              type="checkbox"
              checked={includeUbts}
              onChange={(e) => setIncludeUbts(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)]"
            />
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                <Building2 className="h-4 w-4 text-sky-600" strokeWidth={2} />
                UBTs
              </span>
              <span className="mt-0.5 block text-xs text-gray-500">Unidades da rede de atendimento</span>
            </span>
          </label>

          {includeUbts ? (
            <div className="ml-2 space-y-2 border-l-2 border-sky-200 pl-3">
              <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
                {(
                  [
                    { value: 'all', label: 'Todas' },
                    { value: 'selected', label: 'UBTs' },
                    { value: 'users', label: 'Pessoas' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setUbtMode(opt.value)}
                    className={[
                      'rounded-md px-2.5 py-1.5 text-xs font-semibold',
                      ubtMode === opt.value ? 'bg-sky-100 text-sky-800' : 'text-gray-600',
                    ].join(' ')}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5">
            <input
              type="checkbox"
              checked={includeMedicos}
              onChange={(e) => setIncludeMedicos(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)]"
            />
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                <Stethoscope className="h-4 w-4 text-emerald-600" strokeWidth={2} />
                Profissionais
              </span>
              <span className="mt-0.5 block text-xs text-gray-500">
                Médicos e demais profissionais ativos na plataforma
              </span>
            </span>
          </label>

          {includeMedicos ? (
            <div className="ml-2 space-y-3 border-l-2 border-emerald-200 pl-3">
              <div className="space-y-2">
                {(
                  [
                    {
                      value: 'medico_all' as const,
                      label: 'Todos os profissionais',
                      hint: profissionaisStats
                        ? `${profissionaisStats.totalAtivos} ativo(s)`
                        : 'Carregando…',
                    },
                    {
                      value: 'medico_plantao' as const,
                      label: 'Plantão atual',
                      hint: profissionaisStats
                        ? `${profissionaisStats.emPlantao} em plantão`
                        : 'Carregando…',
                    },
                    {
                      value: 'medico_especialidade' as const,
                      label: 'Por especialidade',
                      hint: 'Filtra por especialidade principal',
                    },
                    {
                      value: 'medico_users' as const,
                      label: 'Alguns profissionais',
                      hint: 'Escolha individualmente na lista ao lado',
                    },
                  ] as const
                ).map((opt) => (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-start gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2"
                  >
                    <input
                      type="radio"
                      name="medico-scope"
                      checked={medicoScope === opt.value}
                      onChange={() => setMedicoScope(opt.value)}
                      className="mt-0.5 h-4 w-4 border-gray-300 text-[var(--brand-primary)]"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-gray-900">{opt.label}</span>
                      <span className="text-xs text-gray-500">{opt.hint}</span>
                    </span>
                  </label>
                ))}
              </div>

              {medicoScope === 'medico_especialidade' ? (
                <CustomSelect
                  value={specialtyFilter}
                  onChange={setSpecialtyFilter}
                  options={[
                    { value: '', label: 'Selecione a especialidade' },
                    ...(profissionaisStats?.especialidades ?? []).map((item) => ({
                      value: item.id,
                      label: `${item.name} (${item.activeCount})`,
                    })),
                  ]}
                  placeholder="Especialidade"
                />
              ) : null}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          disabled={!canSend || isSending}
          onClick={() => void handleSend()}
          className="btn-brand-gradient inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" strokeWidth={2} />
          Enviar para {recipientCount} destinatário{recipientCount === 1 ? '' : 's'}
        </button>
      </section>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 lg:flex-row">
        {includePrefeituras && prefeituraMode === 'selected' ? (
          <RecipientListPanel
            title="Prefeituras"
            description={`${selectedPrefeituraIds.size} de ${filteredPrefeituras.length} selecionada(s)`}
            search={prefeituraSearch}
            onSearchChange={setPrefeituraSearch}
            searchPlaceholder="Buscar prefeitura..."
            isLoading={recipientsLoading}
            error={recipientsError}
            onRetry={onRetryRecipients}
            filters={
              <>
                <CustomSelect
                  value={ufFilter}
                  onChange={setUfFilter}
                  options={ufFilterOptions}
                />
              </>
            }
            onSelectAll={selectAllPrefeituras}
            onClear={clearPrefeituras}
            emptyLabel="Nenhuma prefeitura com os filtros atuais."
          >
            {filteredPrefeituras.map((item) => (
              <li key={item.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 bg-slate-50/50 px-3 py-2.5 hover:bg-white">
                  <input
                    type="checkbox"
                    checked={selectedPrefeituraIds.has(item.id)}
                    onChange={() => togglePrefeitura(item.id)}
                    className="h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)]"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-gray-900">{item.name}</span>
                    <span className="text-xs text-gray-500">
                      {item.municipality} · {item.uf}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </RecipientListPanel>
        ) : null}

        {includePrefeituras && prefeituraMode === 'users' ? (
          <RecipientListPanel
            title="Gestores municipais"
            description={`${selectedPrefeituraUserIds.size} de ${filteredPrefeituraUsers.length} selecionado(s)`}
            search={prefeituraUserSearch}
            onSearchChange={setPrefeituraUserSearch}
            searchPlaceholder="Buscar gestor..."
            isLoading={recipientsLoading}
            error={recipientsError}
            onRetry={onRetryRecipients}
            filters={
              <>
                <CustomSelect
                  value={prefeituraUserPrefeituraFilter}
                  onChange={setPrefeituraUserPrefeituraFilter}
                  options={ubtPrefeituraFilterOptions}
                />
                <CustomSelect
                  value={ufFilter}
                  onChange={setUfFilter}
                  options={ufFilterOptions}
                />
              </>
            }
            onSelectAll={selectAllPrefeituraUsers}
            onClear={clearPrefeituraUsers}
            emptyLabel="Nenhum gestor com os filtros atuais."
          >
            {filteredPrefeituraUsers.map((item) => (
              <li key={item.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 bg-slate-50/50 px-3 py-2.5 hover:bg-white">
                  <input
                    type="checkbox"
                    checked={selectedPrefeituraUserIds.has(item.id)}
                    onChange={() => togglePrefeituraUser(item.id)}
                    className="h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)]"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-gray-900">{item.name}</span>
                    <span className="text-xs text-gray-500">
                      {item.prefeituraName}
                      {item.role ? ` · ${item.role}` : ''}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </RecipientListPanel>
        ) : null}

        {includeUbts && ubtMode === 'selected' ? (
          <RecipientListPanel
            title="UBTs"
            description={`${selectedUbtIds.size} de ${filteredUbts.length} selecionada(s)`}
            search={ubtSearch}
            onSearchChange={setUbtSearch}
            searchPlaceholder="Buscar UBT..."
            isLoading={recipientsLoading}
            error={recipientsError}
            onRetry={onRetryRecipients}
            filters={
              <>
                <CustomSelect
                  value={ubtPrefeituraFilter}
                  onChange={setUbtPrefeituraFilter}
                  options={ubtPrefeituraFilterOptions}
                />
                <CustomSelect
                  value={ufFilter}
                  onChange={setUfFilter}
                  options={ufFilterOptions}
                />
              </>
            }
            onSelectAll={selectAllUbts}
            onClear={clearUbts}
            emptyLabel="Nenhuma UBT com os filtros atuais."
          >
            {filteredUbts.map((item) => (
              <li key={item.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 bg-slate-50/50 px-3 py-2.5 hover:bg-white">
                  <input
                    type="checkbox"
                    checked={selectedUbtIds.has(item.id)}
                    onChange={() => toggleUbt(item.id)}
                    className="h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)]"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-gray-900">{item.name}</span>
                    <span className="text-xs text-gray-500">
                      {item.prefeituraName} · {item.municipality}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </RecipientListPanel>
        ) : null}

        {includeUbts && ubtMode === 'users' ? (
          <RecipientListPanel
            title="Operadores UBT"
            description={`${selectedUbtUserIds.size} de ${filteredUbtUsers.length} selecionado(s)`}
            search={ubtUserSearch}
            onSearchChange={setUbtUserSearch}
            searchPlaceholder="Buscar operador..."
            isLoading={recipientsLoading}
            error={recipientsError}
            onRetry={onRetryRecipients}
            filters={
              <>
                <CustomSelect
                  value={ubtUserPrefeituraFilter}
                  onChange={(value) => {
                    setUbtUserPrefeituraFilter(value)
                    setUbtUserUnidadeFilter('all')
                  }}
                  options={ubtPrefeituraFilterOptions}
                />
                <CustomSelect
                  value={ubtUserUnidadeFilter}
                  onChange={setUbtUserUnidadeFilter}
                  options={ubtUserUnidadeFilterOptions}
                />
                <CustomSelect
                  value={ufFilter}
                  onChange={setUfFilter}
                  options={ufFilterOptions}
                />
              </>
            }
            onSelectAll={selectAllUbtUsers}
            onClear={clearUbtUsers}
            emptyLabel="Nenhum operador com os filtros atuais."
          >
            {filteredUbtUsers.map((item) => (
              <li key={item.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 bg-slate-50/50 px-3 py-2.5 hover:bg-white">
                  <input
                    type="checkbox"
                    checked={selectedUbtUserIds.has(item.id)}
                    onChange={() => toggleUbtUser(item.id)}
                    className="h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)]"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-gray-900">
                      {item.name}
                      {item.isUnitResponsible ? (
                        <span className="ml-1.5 text-xs font-medium text-sky-700">Responsável</span>
                      ) : null}
                    </span>
                    <span className="text-xs text-gray-500">
                      {item.unidadeName} · {item.prefeituraName}
                      {item.role ? ` · ${item.role}` : ''}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </RecipientListPanel>
        ) : null}

        {includeMedicos && medicoScope === 'medico_users' ? (
          <RecipientListPanel
            title="Profissionais"
            description={`${selectedMedicoIds.size} de ${filteredProfissionais.length} selecionado(s)`}
            search={medicoUserSearch}
            onSearchChange={setMedicoUserSearch}
            searchPlaceholder="Buscar profissional..."
            isLoading={recipientsLoading}
            error={recipientsError}
            onRetry={onRetryRecipients}
            filters={
              <CustomSelect
                value={medicoSpecialtyFilter}
                onChange={setMedicoSpecialtyFilter}
                options={medicoSpecialtyFilterOptions}
              />
            }
            onSelectAll={selectAllMedicos}
            onClear={clearMedicos}
            emptyLabel="Nenhum profissional com os filtros atuais."
          >
            {filteredProfissionais.map((item) => (
              <li key={item.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 bg-slate-50/50 px-3 py-2.5 hover:bg-white">
                  <input
                    type="checkbox"
                    checked={selectedMedicoIds.has(item.id)}
                    onChange={() => toggleMedico(item.id)}
                    className="h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)]"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-gray-900">{item.name}</span>
                    <span className="text-xs text-gray-500">
                      {item.specialty}
                      {item.councilRegistration ? ` · ${item.councilRegistration}` : ''}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </RecipientListPanel>
        ) : null}

        {showDestinationPreview ? (
          <section className={`${panelShell} flex flex-1 items-center justify-center p-8`}>
            <p className="max-w-sm text-center text-sm text-gray-500">{destinationPreview}</p>
          </section>
        ) : null}
      </div>
    </div>
  )
}

function RecipientListPanel({
  title,
  description,
  search,
  onSearchChange,
  searchPlaceholder,
  filters,
  onSelectAll,
  onClear,
  emptyLabel,
  isLoading = false,
  error = null,
  onRetry,
  children,
}: {
  title: string
  description: string
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  filters: React.ReactNode
  onSelectAll: () => void
  onClear: () => void
  emptyLabel: string
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  children: ReactNode
}) {
  const isEmpty = !isLoading && !error && (!children || (Array.isArray(children) && children.length === 0))

  return (
    <section className={`${panelShell} flex min-h-[14rem] min-w-0 flex-1 flex-col lg:min-h-0`}>
      <header className="shrink-0 space-y-3 border-b border-gray-100 px-4 py-3">
        <div>
          <p className="text-sm font-bold text-gray-900">{title}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            disabled={isLoading || Boolean(error)}
            className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--brand-primary)]/40 disabled:cursor-not-allowed disabled:bg-gray-50"
          />
        </div>
        <div className="grid gap-2">{filters}</div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSelectAll}
            disabled={isLoading || Boolean(error)}
            className="flex-1 rounded-lg border border-gray-200 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Marcar visíveis
          </button>
          <button
            type="button"
            onClick={onClear}
            disabled={isLoading || Boolean(error)}
            className="flex-1 rounded-lg border border-gray-200 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Limpar
          </button>
        </div>
      </header>
      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {isLoading ? (
          <li className="py-8 text-center text-sm text-gray-500">Carregando destinatários…</li>
        ) : error ? (
          <li className="space-y-3 py-8 text-center">
            <p className="text-sm text-red-600">{error}</p>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Tentar novamente
              </button>
            ) : null}
          </li>
        ) : isEmpty ? (
          <li className="py-8 text-center text-sm text-gray-500">{emptyLabel}</li>
        ) : (
          children
        )}
      </ul>
    </section>
  )
}
