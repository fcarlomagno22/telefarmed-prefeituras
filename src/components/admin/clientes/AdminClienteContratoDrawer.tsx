import { CalendarDays, FileText, Pencil, Stethoscope, Users, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AdminClienteContrato, AdminClienteRow } from '../../../types/adminClientes'
import { isPrefeituraEntidadeTipo } from '../../../config/adminEntidadeTipo'
import { resolveClienteContratoTipoLabel, useAdminClientesContratoCatalog } from '../../../hooks/useAdminClientesContratoCatalog'
import {
  getClienteSpecialtyById,
  useAdminClientesClinicoCatalog,
} from '../../../hooks/useAdminClientesClinicoCatalog'
import { getSpecialtyById } from '../../../data/specialties'
import { maskIntegerPtBr } from '../../../utils/masks'
import { ConsultationChatAttachmentViewer } from '../../attendance/ConsultationChatAttachmentViewer'
import type { ConsultationChatAttachment } from '../../attendance/consultationChatTypes'
import { AdminClienteEditContratoPanel } from './AdminClienteEditContratoPanel'
import type { AddContratoFormState } from './adminClienteContratoForm'

type AdminClienteContratoDrawerProps = {
  open: boolean
  closing: boolean
  cliente: AdminClienteRow | null
  contrato: AdminClienteContrato | null
  onSaveContrato?: (contratoId: string, form: AddContratoFormState) => Promise<void>
  onClose: () => void
  onTransitionEnd: () => void
}

const drawerShellClass =
  'absolute inset-x-0 bottom-0 z-10 flex h-[92vh] max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[1.35rem] border-t border-gray-200/90 bg-white shadow-[0_-20px_60px_rgba(15,23,42,0.18)] transition-transform duration-300 ease-out motion-reduce:transition-none'

function formatCurrency(value: number | null | undefined): string {
  if (!value || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value)
}

export function AdminClienteContratoDrawer({
  open,
  closing,
  cliente,
  contrato,
  onSaveContrato,
  onClose,
  onTransitionEnd,
}: AdminClienteContratoDrawerProps) {
  const { labelById: contratoTipoLabels } = useAdminClientesContratoCatalog()
  const { specialties, professions } = useAdminClientesClinicoCatalog({ activeOnly: false })
  const contratoTipoLabel = resolveClienteContratoTipoLabel(contratoTipoLabels, contrato?.tipo ?? '')

  const resolveSpecialtyLabel = useCallback(
    (specialtyId: string) =>
      getClienteSpecialtyById(specialties, specialtyId)?.name ??
      getSpecialtyById(specialtyId)?.name ??
      specialtyId,
    [specialties],
  )
  const [entered, setEntered] = useState(false)
  const [editing, setEditing] = useState(false)
  const [nfViewer, setNfViewer] = useState<ConsultationChatAttachment | null>(null)

  const isActive = open || closing
  const panelVisible = isActive && entered && !closing

  useEffect(() => {
    if (!open) {
      setEntered(false)
      setEditing(false)
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
    if (!open) return
    setEditing(false)
  }, [open, contrato?.id])

  useEffect(() => {
    if (!closing) return
    const fallback = window.setTimeout(() => onTransitionEnd(), 350)
    return () => window.clearTimeout(fallback)
  }, [closing, onTransitionEnd])

  if (!isActive || !cliente || !contrato) return null

  const detalhes = contrato.detalhes

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
        aria-label="Fechar detalhes do contrato"
        onClick={onClose}
        tabIndex={panelVisible ? 0 : -1}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-contrato-drawer-title"
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.propertyName === 'transform') onTransitionEnd()
        }}
        className={`${drawerShellClass} ${
          panelVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div
          className="pointer-events-none absolute inset-x-8 top-2 z-20 h-1 w-12 rounded-full bg-gray-300/90"
          aria-hidden
        />

        <header className="relative z-20 shrink-0 overflow-visible border-b border-gray-200/80 bg-gradient-to-br from-[var(--brand-primary-light)]/70 via-orange-50/50 to-white px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-[#ff8c33] text-white shadow-[0_8px_24px_rgba(255,107,0,0.35)]">
                <CalendarDays className="h-5 w-5" strokeWidth={1.9} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand-primary)]">
                  Contrato da entidade
                </p>
                <h2
                  id="admin-contrato-drawer-title"
                  className="mt-0.5 text-xl font-bold tracking-tight text-gray-900 sm:text-[1.35rem]"
                >
                  {cliente.prefeitura}
                </h2>
                <p className="mt-0.5 text-xs text-gray-600">
                  {contratoTipoLabel} · assinado em{' '}
                  {contrato.dataAssinatura}
                </p>
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
          {!editing && onSaveContrato ? (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <Pencil className="h-4 w-4" />
                Editar contrato
              </button>
            </div>
          ) : null}
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-slate-50/70 px-5 py-4 sm:px-6">
          {editing && cliente && contrato && onSaveContrato ? (
            <AdminClienteEditContratoPanel
              cliente={cliente}
              contrato={contrato}
              professions={professions}
              specialties={specialties}
              onCancel={() => setEditing(false)}
              onSubmit={(form) => {
                if (!onSaveContrato) return
                void onSaveContrato(contrato.id, form)
                  .then(() => setEditing(false))
                  .catch(() => undefined)
              }}
            />
          ) : (
            <>
          <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">
              Dados do contrato
            </h3>
            <div className="mt-3 grid gap-3 text-sm text-gray-800 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Número do contrato
                </p>
                <p className="mt-0.5 font-medium">{contrato.numero ?? '—'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Tipo
                </p>
                <p className="mt-0.5 font-medium">
                  {contratoTipoLabel}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Data de assinatura
                </p>
                <p className="mt-0.5 font-medium">{contrato.dataAssinatura || '—'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Data de encerramento
                </p>
                <p className="mt-0.5 font-medium">{contrato.dataEncerramento ?? '—'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </p>
                <p className="mt-0.5 font-medium capitalize">{contrato.status}</p>
              </div>
              {detalhes ? (
                <>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Consultas contratadas
                    </p>
                    <p className="mt-0.5 font-medium">
                      {detalhes.consultasContratadas == null
                        ? 'Sob demanda'
                        : maskIntegerPtBr(String(detalhes.consultasContratadas))}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Ultrapassagem
                    </p>
                    <p className="mt-0.5 font-medium">
                      {detalhes.permiteUltrapassar ? 'Permitida' : 'Não permitida'}
                    </p>
                  </div>
                  {isPrefeituraEntidadeTipo(cliente?.tipoEntidade) ? (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Pacientes de outros municípios
                      </p>
                      <p className="mt-0.5 font-medium">
                        {(detalhes.aceitaPacientesOutrosMunicipios ?? false)
                          ? 'Aceitos'
                          : 'Apenas do município contratante'}
                      </p>
                    </div>
                  ) : null}
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Especialidades autorizadas
                    </p>
                    <p className="mt-0.5 text-sm text-gray-800">
                      {detalhes.especialidadesAutorizadas
                        .map((id) => resolveSpecialtyLabel(id))
                        .join(' · ') || '—'}
                    </p>
                  </div>
                </>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
              <Users className="h-3.5 w-3.5" />
              Contatos da entidade
            </h3>
            <div className="mt-3 grid gap-3 text-sm text-gray-800 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-gray-100 bg-slate-50/60 px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Gestor
                </p>
                <p className="mt-0.5 font-medium text-gray-900">{cliente.gestor.name}</p>
                <p className="mt-0.5 text-xs text-gray-600">{cliente.gestor.email}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-slate-50/60 px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Gestor do contrato
                </p>
                <p className="mt-0.5 font-medium text-gray-900">
                  {cliente.contatoContrato?.name ?? '—'}
                </p>
                <p className="mt-0.5 text-xs text-gray-600">
                  {cliente.contatoContrato?.email ?? '—'}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-slate-50/60 px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  TI
                </p>
                <p className="mt-0.5 font-medium text-gray-900">{cliente.contatoTi.name}</p>
                <p className="mt-0.5 text-xs text-gray-600">{cliente.contatoTi.email}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-slate-50/60 px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Saúde
                </p>
                <p className="mt-0.5 font-medium text-gray-900">{cliente.contatoSaude.name}</p>
                <p className="mt-0.5 text-xs text-gray-600">{cliente.contatoSaude.email}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
              <Stethoscope className="h-3.5 w-3.5" />
              Especialidades e valores
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Lista de especialidades autorizadas para este contrato, com valor de consulta e, se
              houver, valor de excedente.
            </p>
            <div className="mt-3 overflow-hidden rounded-xl border border-gray-100">
              <table className="min-w-full border-collapse text-left text-xs text-gray-700">
                <thead className="bg-slate-50/80 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-center">Especialidade</th>
                    <th className="px-3 py-2 text-center">Valor da consulta</th>
                    <th className="px-3 py-2 text-center">Valor de excedente</th>
                  </tr>
                </thead>
                <tbody>
                  {!detalhes || detalhes.precosPorEspecialidade.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-center text-xs text-gray-500">
                        Nenhuma especialidade e valor configurados para este contrato.
                      </td>
                    </tr>
                  ) : (
                    detalhes.precosPorEspecialidade.map((item) => {
                      const excedente = detalhes.excedentePrecosPorEspecialidade?.find(
                        (e) => e.specialtyId === item.specialtyId,
                      )
                      return (
                        <tr key={item.specialtyId} className="border-t border-gray-100">
                          <td className="px-3 py-2 text-center">
                            {resolveSpecialtyLabel(item.specialtyId)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-center">
                            {formatCurrency(item.valorConsulta)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-center">
                            {excedente ? formatCurrency(excedente.valorConsulta) : '—'}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">
              Histórico de pagamentos
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Exemplo estático para protótipo. Integração real pode vir do ERP / financeiro.
            </p>
            <div className="mt-3 overflow-hidden rounded-xl border border-gray-100">
              <table className="min-w-full border-collapse text-left text-xs text-gray-700">
                <thead className="bg-slate-50/80 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-3 py-2">Nota fiscal</th>
                    <th className="px-3 py-2">Emissão</th>
                    <th className="px-3 py-2">Valor</th>
                    <th className="px-3 py-2">Pagamento</th>
                    <th className="px-3 py-2 text-center">NF</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { nf: '000123', emissao: '05/05/2026', valor: 'R$ 85.000,00', pagamento: '10/05/2026' },
                    { nf: '000124', emissao: '05/06/2026', valor: 'R$ 87.500,00', pagamento: '10/06/2026' },
                    { nf: '000125', emissao: '05/07/2026', valor: 'R$ 90.200,00', pagamento: '10/07/2026' },
                    { nf: '000126', emissao: '05/08/2026', valor: 'R$ 88.900,00', pagamento: '10/08/2026' },
                    { nf: '000127', emissao: '05/09/2026', valor: 'R$ 92.300,00', pagamento: '10/09/2026' },
                    { nf: '000128', emissao: '05/10/2026', valor: 'R$ 94.750,00', pagamento: '10/10/2026' },
                    { nf: '000129', emissao: '05/11/2026', valor: 'R$ 96.100,00', pagamento: '10/11/2026' },
                    { nf: '000130', emissao: '05/12/2026', valor: 'R$ 98.500,00', pagamento: '10/12/2026' },
                    { nf: '000131', emissao: '05/01/2027', valor: 'R$ 99.800,00', pagamento: '10/01/2027' },
                    { nf: '000132', emissao: '05/02/2027', valor: 'R$ 101.200,00', pagamento: '10/02/2027' },
                  ].map((item) => (
                    <tr key={item.nf} className="border-t border-gray-100">
                      <td className="whitespace-nowrap px-3 py-2">{item.nf}</td>
                      <td className="whitespace-nowrap px-3 py-2">{item.emissao}</td>
                      <td className="whitespace-nowrap px-3 py-2">{item.valor}</td>
                      <td className="whitespace-nowrap px-3 py-2">{item.pagamento}</td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                          title="Ver nota fiscal"
                          onClick={() =>
                            setNfViewer({
                              id: `nf-${item.nf}`,
                              name: `NF ${item.nf}.pdf`,
                              type: 'pdf',
                              url: '/Password.pdf',
                            } as ConsultationChatAttachment)
                          }
                        >
                          <FileText className="h-4 w-4" strokeWidth={2} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
            </>
          )}
        </div>
      </aside>

      {nfViewer ? (
        <ConsultationChatAttachmentViewer attachment={nfViewer} onClose={() => setNfViewer(null)} />
      ) : null}
    </div>,
    document.body,
  )
}

