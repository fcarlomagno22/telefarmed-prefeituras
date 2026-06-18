import { Building2, MapPin, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { maskCnpj } from '../../../utils/masks'
import { AdminClienteStatusBadge } from './AdminClienteStatusBadge'
import type { AdminClienteContact, AdminClienteRow } from '../../../types/adminClientes'
import {
  getLocalidadeLabel,
  isPrefeituraEntidadeTipo,
  resolveEntidadeTipoLabel,
} from '../../../config/adminEntidadeTipo'

type AdminClienteEntidadeDrawerProps = {
  open: boolean
  closing: boolean
  cliente: AdminClienteRow | null
  onClose: () => void
  onTransitionEnd: () => void
}

const drawerShellClass =
  'absolute inset-x-0 bottom-0 z-10 flex h-[92vh] max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[1.35rem] border-t border-gray-200/90 bg-white shadow-[0_-20px_60px_rgba(15,23,42,0.18)] transition-transform duration-300 ease-out motion-reduce:transition-none'

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

export function AdminClienteEntidadeDrawer({
  open,
  closing,
  cliente,
  onClose,
  onTransitionEnd,
}: AdminClienteEntidadeDrawerProps) {
  const [entered, setEntered] = useState(false)

  const isActive = open || closing
  const panelVisible = isActive && entered && !closing

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [open])

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

  if (!isActive || !cliente) return null

  const rows = [
    { label: 'Gestor', value: resolveContact(cliente.gestor) },
    { label: 'Gestor do contrato', value: resolveContact(cliente.contatoContrato) },
    { label: 'TI', value: resolveContact(cliente.contatoTi) },
    { label: 'Saude', value: resolveContact(cliente.contatoSaude) },
  ]

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
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">
              Informacoes cadastrais
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <ContactCard label="Tipo" value={resolveEntidadeTipoLabel(cliente.tipoEntidade)} />
              <ContactCard label="Nome da entidade" value={cliente.prefeitura} />
              <ContactCard label="Subtitulo" value={cliente.subtitle} />
              <ContactCard label="Razao social" value={cliente.razaoSocial} />
              <ContactCard label="CNPJ" value={maskCnpj(cliente.cnpj)} />
              <ContactCard
                label={getLocalidadeLabel(cliente.tipoEntidade)}
                value={cliente.municipio}
              />
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
              {cliente.corPrimaria ? (
                <div className="rounded-xl border border-gray-100 bg-slate-50/70 px-3 py-2.5 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Cor primária
                  </p>
                  <div className="mt-1 flex items-center justify-center gap-2">
                    <span
                      className="inline-block h-4 w-4 rounded-full border border-gray-200"
                      style={{ backgroundColor: cliente.corPrimaria }}
                      aria-hidden
                    />
                    <span className="font-mono text-xs text-gray-700">{cliente.corPrimaria}</span>
                  </div>
                </div>
              ) : null}
            </div>
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
                    <tr key={item.label} className="border-t border-gray-100 align-top">
                      <td className="px-3 py-2 font-semibold text-gray-800">{item.label}</td>
                      <td className="px-3 py-2">{item.value.name || 'Não informado'}</td>
                      <td className="px-3 py-2">{item.value.email || 'Não informado'}</td>
                      <td className="px-3 py-2">{item.value.phoneType || 'Não informado'}</td>
                      <td className="px-3 py-2">{item.value.phone || 'Não informado'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              if (!isPrefeituraEntidadeTipo(cliente.tipoEntidade)) return null
              const activeContract = cliente.contratos.find((item) => item.status === 'ativo')
              if (!activeContract?.detalhes) return null
              const aceitaOutros = activeContract.detalhes.aceitaPacientesOutrosMunicipios ?? false
              return (
                <p className="mt-2 text-sm text-gray-800">
                  <span className="font-medium">Pacientes de outros municípios:</span>{' '}
                  {aceitaOutros ? 'Aceitos' : 'Apenas do município contratante'}. Para alterar, abra o
                  contrato na grade e use <span className="font-medium">Editar contrato</span>.
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
