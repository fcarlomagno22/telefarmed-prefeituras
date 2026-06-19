import { Globe, Palette, Users, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { maskPhone } from '../../../utils/masks'
import type { AdminClienteContact, AdminClienteRow } from '../../../types/adminClientes'
import { CustomSelect } from '../../ui/CustomSelect'
import {
  EntidadeFaviconCropCard,
  EntidadeLoginBackgroundCropCard,
  EntidadeLogoCropCard,
} from './cadastro/EntidadeLogoCropCard'
import { TenantSlugField } from '../../tenant/TenantSlugField'
import { EntidadeGestaoLoginPreview } from './EntidadeGestaoLoginPreview'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { checkClienteSlugAvailability } from '../../../lib/api/admin/clientes'
import {
  createIdleSlugAvailability,
  isSlugAvailabilityConfirmed,
  normalizeTenantSlugInput,
  validateTenantSlug,
  type TenantSlugAvailabilityState,
} from '../../../utils/tenantSlug'

export type AdminClienteEntidadeEditSavePayload = {
  brandingChanged: boolean
  contactsChanged: boolean
  slugChanged: boolean
  brandingChanges: {
    slug?: string
    logoDataUrl?: string
    loginBackgroundDataUrl?: string
    faviconDataUrl?: string
    corPrimaria?: string
  }
  contacts: {
    gestor: AdminClienteContact
    contrato: AdminClienteContact
    ti: AdminClienteContact
    saude: AdminClienteContact
  }
}

type AdminClienteEntidadeEditDrawerProps = {
  open: boolean
  closing: boolean
  cliente: AdminClienteRow | null
  onSave: (clienteId: string, payload: AdminClienteEntidadeEditSavePayload) => void
  onClose: () => void
  onTransitionEnd: () => void
}

const drawerShellClass =
  'absolute inset-x-0 bottom-0 z-10 flex h-[92vh] max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[1.35rem] border-t border-gray-200/90 bg-white shadow-[0_-20px_60px_rgba(15,23,42,0.18)] transition-transform duration-300 ease-out motion-reduce:transition-none'

const labelClass = 'mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500'
const sectionTitleClass = 'text-xs font-bold uppercase tracking-wide text-gray-500'
const sectionHintClass = 'mt-1 text-sm text-gray-600'
const inputClass =
  'h-9 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-sm text-gray-900 outline-none focus:border-[var(--brand-primary)]/40'

const phoneTypeOptions = [
  { value: 'celular', label: 'Celular' },
  { value: 'fixo', label: 'Fixo' },
]

type ContactDraft = {
  label: string
  key: 'gestor' | 'contrato' | 'ti' | 'saude'
  value: AdminClienteContact
}

type BrandingDraft = {
  logoPreview: string | null
  logoChanged: boolean
  loginBackgroundPreview: string | null
  loginBackgroundChanged: boolean
  faviconPreview: string | null
  faviconChanged: boolean
  corPrimaria: string
}

function resolveContact(contact?: AdminClienteContact): AdminClienteContact {
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

function buildContactDrafts(cliente: AdminClienteRow): ContactDraft[] {
  return [
    { label: 'Gestor', key: 'gestor', value: resolveContact(cliente.gestor) },
    { label: 'Gestor do contrato', key: 'contrato', value: resolveContact(cliente.contatoContrato) },
    { label: 'TI', key: 'ti', value: resolveContact(cliente.contatoTi) },
    { label: 'Saúde', key: 'saude', value: resolveContact(cliente.contatoSaude) },
  ]
}

function buildBrandingDraft(cliente: AdminClienteRow): BrandingDraft {
  return {
    logoPreview: cliente.logoUrl ?? null,
    logoChanged: false,
    loginBackgroundPreview: cliente.loginBackgroundUrl ?? null,
    loginBackgroundChanged: false,
    faviconPreview: cliente.faviconUrl ?? null,
    faviconChanged: false,
    corPrimaria: cliente.corPrimaria?.trim() || '#ff6b00',
  }
}

function contactsEqual(a: AdminClienteContact, b: AdminClienteContact): boolean {
  return (
    (a.name ?? '').trim() === (b.name ?? '').trim() &&
    (a.email ?? '').trim() === (b.email ?? '').trim() &&
    (a.phone ?? '').trim() === (b.phone ?? '').trim() &&
    (a.phoneType ?? '') === (b.phoneType ?? '')
  )
}

export function AdminClienteEntidadeEditDrawer({
  open,
  closing,
  cliente,
  onSave,
  onClose,
  onTransitionEnd,
}: AdminClienteEntidadeEditDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [brandingDraft, setBrandingDraft] = useState<BrandingDraft | null>(null)
  const [contactDrafts, setContactDrafts] = useState<ContactDraft[]>([])
  const [slugDraft, setSlugDraft] = useState('')
  const [slugAvailability, setSlugAvailability] = useState<TenantSlugAvailabilityState>(
    createIdleSlugAvailability,
  )
  const [saveError, setSaveError] = useState<string | null>(null)
  const { getAccessToken } = useAdminAuth()

  const isActive = open || closing
  const panelVisible = isActive && entered && !closing

  useEffect(() => {
    if (!open) {
      setEntered(false)
      setBrandingDraft(null)
      setContactDrafts([])
      setSlugDraft('')
      setSlugAvailability(createIdleSlugAvailability())
      setSaveError(null)
      return
    }
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!open || !cliente) return
    setBrandingDraft(buildBrandingDraft(cliente))
    setContactDrafts(buildContactDrafts(cliente))
    setSlugDraft(cliente.slug?.trim() ?? '')
    setSlugAvailability(createIdleSlugAvailability())
    setSaveError(null)
  }, [open, cliente])

  const checkSlugAvailability = useMemo(
    () => async (slug: string) => {
      const token = getAccessToken()
      if (!token) {
        return { value: slug, available: false, reason: 'Sessão expirada. Faça login novamente.' }
      }
      return checkClienteSlugAvailability(token, slug, {
        excludeEntidadeId: cliente?.id,
      })
    },
    [cliente?.id, getAccessToken],
  )

  const handleSlugAvailabilityChange = useCallback(
    (state: {
      available: boolean
      reason: string | null
      checkedValue: string
      checking: boolean
    }) => {
      setSlugAvailability((prev) => {
        const next: TenantSlugAvailabilityState = {
          status: state.checking
            ? 'checking'
            : state.available
              ? 'available'
              : state.checkedValue
                ? 'unavailable'
                : 'idle',
          reason: state.reason,
          checkedValue: state.checkedValue,
        }
        if (
          prev.status === next.status &&
          prev.reason === next.reason &&
          prev.checkedValue === next.checkedValue
        ) {
          return prev
        }
        return next
      })
    },
    [],
  )

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

  const initialBranding = useMemo(
    () => (cliente ? buildBrandingDraft(cliente) : null),
    [cliente],
  )
  const initialContacts = useMemo(
    () => (cliente ? buildContactDrafts(cliente) : []),
    [cliente],
  )
  const initialSlug = useMemo(
    () => normalizeTenantSlugInput(cliente?.slug ?? ''),
    [cliente?.slug],
  )

  if (!isActive || !cliente) return null

  const branding = brandingDraft ?? initialBranding
  const rows = contactDrafts.length > 0 ? contactDrafts : initialContacts

  const brandingChanged = Boolean(
    branding &&
      initialBranding &&
      (branding.logoChanged ||
        branding.loginBackgroundChanged ||
        branding.faviconChanged ||
        branding.corPrimaria.trim().toUpperCase() !== initialBranding.corPrimaria.trim().toUpperCase()),
  )

  const contactsChanged = rows.some((row) => {
    const initial = initialContacts.find((item) => item.key === row.key)
    return initial ? !contactsEqual(row.value, initial.value) : true
  })

  const slugChanged = normalizeTenantSlugInput(slugDraft) !== initialSlug

  const hasChanges = brandingChanged || contactsChanged || slugChanged

  function updateBranding(patch: Partial<BrandingDraft>) {
    setBrandingDraft((current) => {
      const base = current ?? buildBrandingDraft(cliente)
      return { ...base, ...patch }
    })
    setSaveError(null)
  }

  function updateContact(
    key: ContactDraft['key'],
    field: keyof AdminClienteContact,
    nextValue: string | undefined,
  ) {
    setContactDrafts((current) => {
      const base = current.length > 0 ? current : buildContactDrafts(cliente)
      return base.map((item) =>
        item.key === key ? { ...item, value: { ...item.value, [field]: nextValue } } : item,
      )
    })
    setSaveError(null)
  }

  function handleSave() {
    if (!branding) return

    if (!/^#[0-9A-Fa-f]{6}$/.test(branding.corPrimaria.trim())) {
      setSaveError('Informe uma cor primária válida no formato #RRGGBB.')
      return
    }

    if (slugChanged) {
      const slugError = validateTenantSlug(slugDraft)
      if (slugError) {
        setSaveError(slugError)
        return
      }
      if (!isSlugAvailabilityConfirmed(slugDraft, slugAvailability)) {
        setSaveError('Confirme a disponibilidade do endereço público antes de salvar.')
        return
      }
    }

    if (!hasChanges) {
      setSaveError('Nenhuma alteração para salvar.')
      return
    }

    const map = new Map(rows.map((item) => [item.key, item.value]))
    const normalizedSlug = normalizeTenantSlugInput(slugDraft)

    onSave(cliente.id, {
      brandingChanged,
      contactsChanged,
      slugChanged,
      brandingChanges: {
        ...(slugChanged ? { slug: normalizedSlug } : {}),
        ...(branding.logoChanged && branding.logoPreview
          ? { logoDataUrl: branding.logoPreview }
          : {}),
        ...(branding.loginBackgroundChanged && branding.loginBackgroundPreview
          ? { loginBackgroundDataUrl: branding.loginBackgroundPreview }
          : {}),
        ...(branding.faviconChanged && branding.faviconPreview
          ? { faviconDataUrl: branding.faviconPreview }
          : {}),
        ...(branding.corPrimaria.trim().toUpperCase() !==
        (initialBranding?.corPrimaria.trim().toUpperCase() ?? '#FF6B00')
          ? { corPrimaria: branding.corPrimaria.trim() }
          : {}),
      },
      contacts: {
        gestor: map.get('gestor') ?? resolveContact(cliente.gestor),
        contrato: map.get('contrato') ?? resolveContact(cliente.contatoContrato),
        ti: map.get('ti') ?? resolveContact(cliente.contatoTi),
        saude: map.get('saude') ?? resolveContact(cliente.contatoSaude),
      },
    })
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
        aria-label="Fechar edição do cliente"
        onClick={onClose}
        tabIndex={panelVisible ? 0 : -1}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-entidade-edit-drawer-title"
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.propertyName === 'transform') onTransitionEnd()
        }}
        className={`${drawerShellClass} ${panelVisible ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <header className="relative z-20 shrink-0 border-b border-gray-200/80 bg-gradient-to-br from-[var(--brand-primary-light)]/70 via-orange-50/50 to-white px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand-primary)]">
                Editar cliente
              </p>
              <h2
                id="admin-entidade-edit-drawer-title"
                className="mt-0.5 text-xl font-bold tracking-tight text-gray-900 sm:text-[1.35rem]"
              >
                {cliente.prefeitura}
              </h2>
              <p className="mt-0.5 text-xs text-gray-600">
                Endereço público, responsáveis, logo, fundo do login, favicon e cor primária.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-800"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-slate-50/70 px-5 py-4 sm:px-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
              <Globe className="h-3.5 w-3.5" />
              Endereço público
            </h3>
            <p className={sectionHintClass}>
              Slug único do portal de gestão em{' '}
              <span className="font-mono text-gray-700">https://{'{slug}'}.telefarmed.com.br</span>.
            </p>

            <div className="mt-4">
              {cliente.slugLocked ? (
                <p className="mb-3 text-xs text-amber-800">
                  Este portal já está publicado. Se alterar o slug, faça o deploy novamente para o novo
                  endereço entrar em vigor.
                </p>
              ) : null}
              <TenantSlugField
                value={slugDraft}
                onChange={(slug) => {
                  setSlugDraft(slug)
                  setSaveError(null)
                }}
                urlKind="gestao"
                checkAvailability={checkSlugAvailability}
                onAvailabilityChange={handleSlugAvailabilityChange}
                hint="Use letras minúsculas, números e hífens."
              />
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
              <Palette className="h-3.5 w-3.5" />
              Marca
            </h3>
            <p className={sectionHintClass}>
              Identidade visual exibida nos portais de gestão e UBT desta entidade.
            </p>

            <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,24rem)]">
              <div className="min-w-0 space-y-4">
              <EntidadeLogoCropCard
                value={branding?.logoPreview ?? null}
                entityName={cliente.prefeitura}
                onChange={(next) =>
                  updateBranding({
                    logoPreview: next,
                    logoChanged: true,
                  })
                }
              />

              <div>
                <p className={sectionTitleClass}>Fundo do login</p>
                <p className={sectionHintClass}>
                  Imagem de fundo das telas de login. Se não enviar, usamos o padrão Telefarmed.
                </p>
                <div className="mt-3">
                  <EntidadeLoginBackgroundCropCard
                    value={branding?.loginBackgroundPreview ?? null}
                    entityName={cliente.prefeitura}
                    onChange={(next) =>
                      updateBranding({
                        loginBackgroundPreview: next,
                        loginBackgroundChanged: true,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <p className={sectionTitleClass}>Favicon</p>
                <p className={sectionHintClass}>
                  Ícone da aba do navegador. Se não enviar, usamos o favicon padrão Telefarmed.
                </p>
                <div className="mt-3">
                  <EntidadeFaviconCropCard
                    value={branding?.faviconPreview ?? null}
                    entityName={cliente.prefeitura}
                    onChange={(next) =>
                      updateBranding({
                        faviconPreview: next,
                        faviconChanged: true,
                      })
                    }
                  />
                </div>
              </div>

              <div className="max-w-xs">
                <span className={labelClass}>Cor primária</span>
                <div className="mt-1 flex items-center gap-3">
                  <input
                    type="color"
                    value={branding?.corPrimaria ?? '#ff6b00'}
                    onChange={(e) => updateBranding({ corPrimaria: e.target.value })}
                    className="h-11 w-14 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-gray-200 p-0 [&::-moz-color-swatch]:rounded-xl [&::-moz-color-swatch]:border-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-xl [&::-webkit-color-swatch]:border-none"
                    aria-label="Selecionar cor primária"
                  />
                  <input
                    className={`${inputClass} min-w-0 flex-1 font-mono uppercase`}
                    value={branding?.corPrimaria ?? '#ff6b00'}
                    onChange={(e) => {
                      const value = e.target.value.trim()
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === '') {
                        updateBranding({ corPrimaria: value })
                      }
                    }}
                    placeholder="#FF6B00"
                    spellCheck={false}
                  />
                </div>
              </div>
              </div>

              <EntidadeGestaoLoginPreview
                className="lg:sticky lg:top-0 lg:self-start"
                slug={slugDraft}
                displayName={cliente.prefeitura}
                logoUrl={branding?.logoPreview ?? null}
                loginBackgroundUrl={branding?.loginBackgroundPreview ?? null}
                corPrimaria={branding?.corPrimaria ?? '#ff6b00'}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
              <Users className="h-3.5 w-3.5" />
              Responsáveis
            </h3>
            <p className={sectionHintClass}>Gestor, contrato, TI e saúde vinculados à entidade.</p>

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
                        <input
                          className={inputClass}
                          value={item.value.name ?? ''}
                          onChange={(e) => updateContact(item.key, 'name', e.target.value)}
                          placeholder="Nome"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className={inputClass}
                          value={item.value.email ?? ''}
                          onChange={(e) => updateContact(item.key, 'email', e.target.value)}
                          placeholder="email@dominio.com"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <CustomSelect
                          value={item.value.phoneType ?? ''}
                          onChange={(value) =>
                            updateContact(
                              item.key,
                              'phoneType',
                              value as AdminClienteContact['phoneType'],
                            )
                          }
                          options={phoneTypeOptions}
                          placeholder="Selecione"
                          size="compact"
                          className="w-full"
                          menuMinWidthPx={120}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className={inputClass}
                          value={item.value.phone ?? ''}
                          onChange={(e) =>
                            updateContact(item.key, 'phone', maskPhone(e.target.value))
                          }
                          placeholder="(00) 00000-0000"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <footer className="shrink-0 border-t border-gray-200 bg-white px-5 py-4 sm:px-6">
          {saveError ? (
            <p role="alert" className="mb-3 text-sm text-red-600">
              {saveError}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!hasChanges}
              onClick={handleSave}
              className="btn-brand-gradient inline-flex h-10 items-center justify-center rounded-xl px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              Salvar alterações
            </button>
          </div>
        </footer>
      </aside>
    </div>,
    document.body,
  )
}
