import { Building2, MapPin, Users, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { fetchIbgeCitiesByUf, fetchIbgeStates } from '../../../data/ibgeLocalidadesApi'
import { maskCnpj, maskPhone } from '../../../utils/masks'
import { AdminClienteStatusBadge } from './AdminClienteStatusBadge'
import type { AdminClienteContact, AdminClienteRow } from '../../../types/adminClientes'
import { CustomSelect } from '../../ui/CustomSelect'
import { EntidadeLogoCropCard } from './cadastro/EntidadeLogoCropCard'
import { adminEntidadeUfOptions } from './cadastro/adminEntidadeCadastroTypes'

type CadastroDraft = {
  nome: string
  subtitulo: string
  razaoSocial: string
  cnpj: string
  municipio: string
  uf: string
  logoPreview: string | null
  logoChanged: boolean
}

export type AdminClienteEntidadeCadastroSavePayload = {
  nome: string
  subtitulo: string
  razaoSocial: string
  cnpj: string
  municipio: string
  uf: string
  logoDataUrl?: string
}

type AdminClienteEntidadeDrawerProps = {
  open: boolean
  closing: boolean
  cliente: AdminClienteRow | null
  onSaveCadastro: (clienteId: string, payload: AdminClienteEntidadeCadastroSavePayload) => void
  onSaveContacts: (
    clienteId: string,
    contacts: {
      gestor: AdminClienteContact
      contrato: AdminClienteContact
      ti: AdminClienteContact
      saude: AdminClienteContact
    },
  ) => void
  onClose: () => void
  onTransitionEnd: () => void
}

const drawerShellClass =
  'absolute inset-x-0 bottom-0 z-10 flex h-[92vh] max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[1.35rem] border-t border-gray-200/90 bg-white shadow-[0_-20px_60px_rgba(15,23,42,0.18)] transition-transform duration-300 ease-out motion-reduce:transition-none'

const labelClass = 'mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500'
const inputClass =
  'h-9 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-sm text-gray-900 outline-none focus:border-[var(--brand-primary)]/40'

const phoneTypeOptions = [
  { value: 'celular', label: 'Celular' },
  { value: 'fixo', label: 'Fixo' },
]

function ContactCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-slate-50/70 px-3 py-2.5 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-gray-900">{value || 'Não informado'}</p>
    </div>
  )
}

function resolveContact(contact?: AdminClienteContact) {
  const resolvePhoneType = (phone: string): 'fixo' | 'celular' | undefined => {
    const digits = phone.replace(/\D/g, '')
    if (digits.length === 10) return 'fixo'
    if (digits.length >= 11) return 'celular'
    return undefined
  }

  if (!contact) {
    return { name: '', email: '', phone: '', phoneType: undefined }
  }
  const [legacyEmail = '', legacyPhone = ''] = (contact.email ?? '').split(' · ')
  const phoneValue = contact.phone || legacyPhone || ''
  return {
    name: contact.name || '',
    email: (contact.email && !contact.phone ? legacyEmail : contact.email) || '',
    phone: phoneValue,
    phoneType: contact.phoneType || resolvePhoneType(phoneValue),
  }
}

function buildCadastroDraft(cliente: AdminClienteRow): CadastroDraft {
  return {
    nome: cliente.prefeitura,
    subtitulo: cliente.subtitle,
    razaoSocial: cliente.razaoSocial,
    cnpj: maskCnpj(cliente.cnpj),
    municipio: cliente.municipio,
    uf: cliente.uf,
    logoPreview: cliente.logoUrl ?? null,
    logoChanged: false,
  }
}

function isCadastroDraftValid(draft: CadastroDraft) {
  return (
    draft.nome.trim().length > 0 &&
    draft.subtitulo.trim().length > 0 &&
    draft.razaoSocial.trim().length > 0 &&
    draft.cnpj.replace(/\D/g, '').length === 14 &&
    draft.municipio.trim().length > 0 &&
    draft.uf.trim().length === 2
  )
}

type ContactDraft = {
  label: string
  key: 'gestor' | 'contrato' | 'ti' | 'saude'
  value: AdminClienteContact
}

export function AdminClienteEntidadeDrawer({
  open,
  closing,
  cliente,
  onSaveCadastro,
  onSaveContacts,
  onClose,
  onTransitionEnd,
}: AdminClienteEntidadeDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [editingCadastro, setEditingCadastro] = useState(false)
  const [cadastroDraft, setCadastroDraft] = useState<CadastroDraft | null>(null)
  const [cadastroError, setCadastroError] = useState<string | null>(null)
  const [ufOptions, setUfOptions] = useState(adminEntidadeUfOptions)
  const [cidadeOptions, setCidadeOptions] = useState<{ value: string; label: string }[]>([])
  const [citiesLoading, setCitiesLoading] = useState(false)
  const [editingContacts, setEditingContacts] = useState(false)
  const [contactDrafts, setContactDrafts] = useState<ContactDraft[]>([])

  const isActive = open || closing
  const panelVisible = isActive && entered && !closing

  useEffect(() => {
    if (!open) {
      setEntered(false)
      setEditingCadastro(false)
      setCadastroDraft(null)
      setCadastroError(null)
      setEditingContacts(false)
      setContactDrafts([])
      return
    }
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!open || !cliente) return
    setEditingCadastro(false)
    setCadastroDraft(buildCadastroDraft(cliente))
    setCadastroError(null)
    setEditingContacts(false)
    setContactDrafts([
      { label: 'Gestor', key: 'gestor', value: resolveContact(cliente.gestor) },
      { label: 'Gestor do contrato', key: 'contrato', value: resolveContact(cliente.contatoContrato) },
      { label: 'TI', key: 'ti', value: resolveContact(cliente.contatoTi) },
      { label: 'Saude', key: 'saude', value: resolveContact(cliente.contatoSaude) },
    ])
  }, [open, cliente])

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    fetchIbgeStates(controller.signal)
      .then((states) => {
        if (states.length === 0) return
        setUfOptions(states)
      })
      .catch(() => {
        setUfOptions(adminEntidadeUfOptions)
      })
    return () => controller.abort()
  }, [open])

  useEffect(() => {
    if (!editingCadastro || !cadastroDraft?.uf) {
      setCidadeOptions([])
      return
    }

    const controller = new AbortController()
    setCitiesLoading(true)
    fetchIbgeCitiesByUf(cadastroDraft.uf, controller.signal)
      .then((cities) => {
        setCidadeOptions(cities.map((city) => ({ value: city, label: city })))
      })
      .catch(() => {
        setCidadeOptions([])
      })
      .finally(() => {
        if (!controller.signal.aborted) setCitiesLoading(false)
      })

    return () => controller.abort()
  }, [cadastroDraft?.uf, editingCadastro])

  useEffect(() => {
    if (!isActive) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, onClose])

  useEffect(() => {
    if (!closing) return
    const fallback = window.setTimeout(() => onTransitionEnd(), 350)
    return () => window.clearTimeout(fallback)
  }, [closing, onTransitionEnd])

  const fallbackCadastroDraft = useMemo(
    () => (cliente ? buildCadastroDraft(cliente) : null),
    [cliente],
  )

  if (!isActive || !cliente) return null

  const gestor = resolveContact(cliente.gestor)
  const gestorContrato = resolveContact(cliente.contatoContrato)
  const ti = resolveContact(cliente.contatoTi)
  const saude = resolveContact(cliente.contatoSaude)
  const fallbackRows: ContactDraft[] = [
    { label: 'Gestor', key: 'gestor', value: gestor },
    { label: 'Gestor do contrato', key: 'contrato', value: gestorContrato },
    { label: 'TI', key: 'ti', value: ti },
    { label: 'Saude', key: 'saude', value: saude },
  ]
  const rows = contactDrafts.length > 0 ? contactDrafts : fallbackRows
  const cadastro = cadastroDraft ?? fallbackCadastroDraft

  function updateDraft(
    key: ContactDraft['key'],
    field: keyof AdminClienteContact,
    nextValue: string | undefined,
  ) {
    setContactDrafts((current) =>
      current.map((item) =>
        item.key === key ? { ...item, value: { ...item.value, [field]: nextValue } } : item,
      ),
    )
  }

  function updateCadastroDraft(patch: Partial<CadastroDraft>) {
    setCadastroDraft((current) => {
      const base = current ?? buildCadastroDraft(cliente)
      return { ...base, ...patch }
    })
    setCadastroError(null)
  }

  function handleSaveContacts() {
    const map = new Map(rows.map((item) => [item.key, item.value]))
    onSaveContacts(cliente.id, {
      gestor: map.get('gestor') ?? resolveContact(cliente.gestor),
      contrato: map.get('contrato') ?? resolveContact(cliente.contatoContrato),
      ti: map.get('ti') ?? resolveContact(cliente.contatoTi),
      saude: map.get('saude') ?? resolveContact(cliente.contatoSaude),
    })
    setEditingContacts(false)
  }

  function handleSaveCadastro() {
    if (!cadastro) return
    if (!isCadastroDraftValid(cadastro)) {
      setCadastroError('Preencha todos os campos cadastrais com CNPJ válido.')
      return
    }

    onSaveCadastro(cliente.id, {
      nome: cadastro.nome.trim(),
      subtitulo: cadastro.subtitulo.trim(),
      razaoSocial: cadastro.razaoSocial.trim(),
      cnpj: cadastro.cnpj,
      municipio: cadastro.municipio.trim(),
      uf: cadastro.uf.trim().toUpperCase(),
      ...(cadastro.logoChanged && cadastro.logoPreview
        ? { logoDataUrl: cadastro.logoPreview }
        : {}),
    })
    setEditingCadastro(false)
    setCadastroError(null)
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-[9998] ${
        panelVisible ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-gray-900/45 backdrop-blur-[2px] transition-opacity duration-300 ${
          panelVisible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="Fechar dados da entidade"
        onClick={onClose}
        tabIndex={panelVisible ? 0 : -1}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-entidade-drawer-title"
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.propertyName === 'transform') onTransitionEnd()
        }}
        className={`${drawerShellClass} ${panelVisible ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <header className="relative z-20 shrink-0 border-b border-gray-200/80 bg-gradient-to-br from-[var(--brand-primary-light)]/70 via-orange-50/50 to-white px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-[#ff8c33] text-white shadow-[0_8px_24px_rgba(255,107,0,0.35)]">
                <Building2 className="h-5 w-5" strokeWidth={1.9} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand-primary)]">
                  Dados da entidade
                </p>
                <h2
                  id="admin-entidade-drawer-title"
                  className="mt-0.5 text-xl font-bold tracking-tight text-gray-900 sm:text-[1.35rem]"
                >
                  {cliente.prefeitura}
                </h2>
                <p className="mt-0.5 text-xs text-gray-600">{cliente.subtitle}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-800"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-slate-50/70 px-5 py-4 sm:px-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">
                Informacoes cadastrais
              </h3>
              {!editingCadastro ? (
                <button
                  type="button"
                  onClick={() => {
                    setCadastroDraft(buildCadastroDraft(cliente))
                    setCadastroError(null)
                    setEditingCadastro(true)
                  }}
                  className="inline-flex h-8 items-center rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Editar dados
                </button>
              ) : null}
            </div>

            {editingCadastro && cadastro ? (
              <div className="mt-4 space-y-4">
                <EntidadeLogoCropCard
                  value={cadastro.logoPreview}
                  entityName={cadastro.nome}
                  onChange={(next) =>
                    updateCadastroDraft({
                      logoPreview: next,
                      logoChanged: true,
                    })
                  }
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="sm:col-span-2">
                    <span className={labelClass}>Nome da entidade</span>
                    <input
                      className={inputClass}
                      value={cadastro.nome}
                      onChange={(e) => updateCadastroDraft({ nome: e.target.value })}
                      placeholder="Nome de exibição"
                    />
                  </label>
                  <label className="sm:col-span-2">
                    <span className={labelClass}>Subtitulo</span>
                    <input
                      className={inputClass}
                      value={cadastro.subtitulo}
                      onChange={(e) => updateCadastroDraft({ subtitulo: e.target.value })}
                      placeholder="Subtítulo"
                    />
                  </label>
                  <label className="sm:col-span-2">
                    <span className={labelClass}>Razao social</span>
                    <input
                      className={inputClass}
                      value={cadastro.razaoSocial}
                      onChange={(e) => updateCadastroDraft({ razaoSocial: e.target.value })}
                      placeholder="Razão social completa"
                    />
                  </label>
                  <label>
                    <span className={labelClass}>CNPJ</span>
                    <input
                      className={inputClass}
                      value={cadastro.cnpj}
                      onChange={(e) => updateCadastroDraft({ cnpj: maskCnpj(e.target.value) })}
                      placeholder="00.000.000/0000-00"
                    />
                  </label>
                  <label>
                    <span className={labelClass}>UF</span>
                    <CustomSelect
                      value={cadastro.uf}
                      onChange={(value) =>
                        updateCadastroDraft({ uf: value, municipio: '' })
                      }
                      options={ufOptions}
                      size="compact"
                      className="w-full"
                      menuMinWidthPx={120}
                    />
                  </label>
                  <label className="sm:col-span-2">
                    <span className={labelClass}>Municipio</span>
                    <CustomSelect
                      value={cadastro.municipio}
                      onChange={(value) => updateCadastroDraft({ municipio: value })}
                      options={cidadeOptions}
                      placeholder={
                        citiesLoading
                          ? 'Carregando cidades...'
                          : cidadeOptions.length > 0
                            ? 'Selecione a cidade'
                            : 'Selecione a UF primeiro'
                      }
                      size="compact"
                      className="w-full"
                      menuMinWidthPx={240}
                    />
                  </label>
                </div>

                {cadastroError ? (
                  <p role="alert" className="text-xs text-red-600">
                    {cadastroError}
                  </p>
                ) : null}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCadastro(false)
                      setCadastroDraft(buildCadastroDraft(cliente))
                      setCadastroError(null)
                    }}
                    className="inline-flex h-9 items-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCadastro}
                    className="btn-brand-gradient inline-flex h-9 items-center rounded-lg px-3 text-sm font-semibold"
                  >
                    Salvar dados
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <ContactCard label="Nome da entidade" value={cliente.prefeitura} />
                <ContactCard label="Subtitulo" value={cliente.subtitle} />
                <ContactCard label="Razao social" value={cliente.razaoSocial} />
                <ContactCard label="CNPJ" value={maskCnpj(cliente.cnpj)} />
                <ContactCard label="Municipio" value={cliente.municipio} />
                <ContactCard label="UF" value={cliente.uf} />
                <div className="rounded-xl border border-gray-100 bg-slate-50/70 px-3 py-2.5 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </p>
                  <div className="mt-1 flex justify-center">
                    <AdminClienteStatusBadge status={cliente.status} />
                  </div>
                </div>
                <div className="rounded-xl border border-gray-100 bg-slate-50/70 px-3 py-2.5 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Contratos
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-gray-900">{cliente.contratos.length}</p>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
              <Users className="h-3.5 w-3.5" />
              Contatos
            </h3>
            <div className="mt-3 overflow-hidden rounded-xl border border-gray-100">
              <table className="min-w-full border-collapse text-left text-sm text-gray-700">
                <thead className="bg-slate-50/80 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Perfil</th>
                    <th className="px-3 py-2 text-left">Nome</th>
                    <th className="px-3 py-2 text-left">E-mail</th>
                    <th className="px-3 py-2 text-left">Tipo</th>
                    <th className="px-3 py-2 text-left">Telefone</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => (
                    <tr key={item.key} className="border-t border-gray-100 align-top">
                      <td className="px-3 py-2 font-semibold text-gray-800">{item.label}</td>
                      <td className="px-3 py-2">
                        {editingContacts ? (
                          <input
                            className={inputClass}
                            value={item.value.name ?? ''}
                            onChange={(e) => updateDraft(item.key, 'name', e.target.value)}
                            placeholder="Nome"
                          />
                        ) : (
                          item.value.name || 'Não informado'
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {editingContacts ? (
                          <input
                            className={inputClass}
                            value={item.value.email ?? ''}
                            onChange={(e) => updateDraft(item.key, 'email', e.target.value)}
                            placeholder="email@dominio.com"
                          />
                        ) : (
                          item.value.email || 'Não informado'
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {editingContacts ? (
                          <CustomSelect
                            value={item.value.phoneType ?? ''}
                            onChange={(e) =>
                              updateDraft(
                                item.key,
                                'phoneType',
                                e as AdminClienteContact['phoneType'],
                              )
                            }
                            options={phoneTypeOptions}
                            placeholder="Selecione"
                            size="compact"
                            className="w-full"
                            menuMinWidthPx={120}
                          />
                        ) : (
                          item.value.phoneType || 'Não informado'
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {editingContacts ? (
                          <input
                            className={inputClass}
                            value={item.value.phone ?? ''}
                            onChange={(e) => updateDraft(item.key, 'phone', maskPhone(e.target.value))}
                            placeholder="(00) 00000-0000"
                          />
                        ) : (
                          item.value.phone || 'Não informado'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              {editingContacts ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingContacts(false)
                      setContactDrafts(fallbackRows)
                    }}
                    className="inline-flex h-9 items-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveContacts}
                    className="btn-brand-gradient inline-flex h-9 items-center rounded-lg px-3 text-sm font-semibold"
                  >
                    Salvar contatos
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingContacts(true)}
                  className="inline-flex h-9 items-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Editar contatos
                </button>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
              <MapPin className="h-3.5 w-3.5" />
              Resumo operacional
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Entidade com {cliente.contratos.length} contrato(s) cadastrado(s). Abra os detalhes do
              contrato na grade principal para visualizar precos, especialidades e historico.
            </p>
            {(() => {
              const activeContract = cliente.contratos.find((item) => item.status === 'ativo')
              if (!activeContract?.detalhes) return null
              const aceitaOutros = activeContract.detalhes.aceitaPacientesOutrosMunicipios ?? false
              return (
                <p className="mt-2 text-sm text-gray-800">
                  <span className="font-medium">Pacientes de outros municípios:</span>{' '}
                  {aceitaOutros ? 'Aceitos' : 'Apenas do município contratante'}.
                  {' '}Para alterar, abra o contrato na grade e use{' '}
                  <span className="font-medium">Editar contrato</span>.
                </p>
              )
            })()}
          </section>
        </div>
      </aside>
    </div>,
    document.body,
  )
}
