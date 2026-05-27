import { Building2, Eye, Loader2, MoreVertical, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import type {
  AdminCentroCusto,
  AdminContaPagarRecorrencia,
  AdminContaPagarRow,
  AdminFornecedorRow,
} from '../../../data/adminFinanceiroMock'
import { adminContaPagarRecorrenciaLabel } from '../../../data/adminFinanceiroMock'
import { maskBirthDate, maskCnpj, maskCurrencyBrl, maskPhone, parseCurrencyBrl } from '../../../utils/masks'
import { CustomSelect } from '../../ui/CustomSelect'
import { Toast } from '../../ui/Toast'
import { PinUnlockModal } from '../../users/PinUnlockModal'

type AdminContaPagarCadastroDrawerProps = {
  open: boolean
  closing: boolean
  fornecedores: AdminFornecedorRow[]
  contasPagar: AdminContaPagarRow[]
  centrosCusto: AdminCentroCusto[]
  onClose: () => void
  onTransitionEnd: () => void
  onCreateFornecedor: (payload: Omit<AdminFornecedorRow, 'id'>) => void
  onUpdateFornecedor: (payload: AdminFornecedorRow) => void
  onDeleteFornecedor: (fornecedorId: string) => void
  onCreateContaPagar: (payload: {
    fornecedorId: string
    descricao: string
    centroCustoId: string
    recorrencia: AdminContaPagarRecorrencia
    valor: number
    vencimento: string
  }) => void
}

type FornecedorForm = Omit<AdminFornecedorRow, 'id'>

type ContaPagarForm = {
  descricao: string
  centroCustoId: string
  recorrencia: AdminContaPagarRecorrencia
  valor: string
  vencimento: string
}

const MENU_MIN_WIDTH_PX = 212
const MENU_GAP_PX = 6
const VIEWPORT_PADDING_PX = 12

const EMPTY_FORNECEDOR_FORM: FornecedorForm = {
  cnpj: '',
  razaoSocial: '',
  situacao: 'nao_informado',
  contatoEmail: '',
  contatoTelefone: '',
  pessoaContato: '',
}

function getFornecedorSituacaoLabel(situacao: AdminFornecedorRow['situacao']) {
  if (situacao === 'ativa') return 'Ativa'
  if (situacao === 'inativa') return 'Inativa'
  return 'Não informado'
}

function getFornecedorSituacaoClasses(situacao: AdminFornecedorRow['situacao']) {
  if (situacao === 'ativa') return 'text-emerald-700 bg-emerald-50 border-emerald-200'
  if (situacao === 'inativa') return 'text-red-700 bg-red-50 border-red-200'
  return 'text-gray-600 bg-gray-50 border-gray-200'
}

function parseSituacaoFromCnpjResponse(payload: {
  descricao_situacao_cadastral?: string
  situacao_cadastral?: number | string
}) {
  const descricao = (payload.descricao_situacao_cadastral ?? '').toLowerCase()
  if (descricao.includes('ativa')) return 'ativa' as const
  if (descricao.includes('inativa') || descricao.includes('baixada') || descricao.includes('suspensa'))
    return 'inativa' as const

  const numericSituacao = Number(payload.situacao_cadastral)
  if (!Number.isNaN(numericSituacao)) {
    if (numericSituacao === 2) return 'ativa' as const
    if (numericSituacao === 8 || numericSituacao === 4 || numericSituacao === 3) return 'inativa' as const
  }

  return 'nao_informado' as const
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function AdminContaPagarCadastroDrawer({
  open,
  closing,
  fornecedores,
  contasPagar,
  centrosCusto,
  onClose,
  onTransitionEnd,
  onCreateFornecedor,
  onUpdateFornecedor,
  onDeleteFornecedor,
  onCreateContaPagar,
}: AdminContaPagarCadastroDrawerProps) {
  const [entered, setEntered] = useState(false)
  const isActive = open || closing
  const panelVisible = isActive && entered && !closing

  const [selectedFornecedorId, setSelectedFornecedorId] = useState<string>('')
  const [fornecedorPaneWidth, setFornecedorPaneWidth] = useState(352)
  const resizeContainerRef = useRef<HTMLDivElement | null>(null)
  const isResizingRef = useRef(false)
  const [openFornecedorMenuId, setOpenFornecedorMenuId] = useState<string | null>(null)
  const [fornecedorMenuStyle, setFornecedorMenuStyle] = useState<CSSProperties | null>(null)
  const fornecedorMenuTriggerRef = useRef<HTMLButtonElement | null>(null)
  const fornecedorMenuRef = useRef<HTMLDivElement | null>(null)

  const [isFornecedorFormOpen, setIsFornecedorFormOpen] = useState(false)
  const [fornecedorEditId, setFornecedorEditId] = useState<string | null>(null)
  const [fornecedorForm, setFornecedorForm] = useState<FornecedorForm>(EMPTY_FORNECEDOR_FORM)
  const [isCnpjLookupLoading, setIsCnpjLookupLoading] = useState(false)

  const [viewFornecedorId, setViewFornecedorId] = useState<string | null>(null)
  const [successToast, setSuccessToast] = useState<string | null>(null)
  const [pendingDeleteFornecedorId, setPendingDeleteFornecedorId] = useState<string | null>(null)
  const [isDeleteFornecedorAlertOpen, setIsDeleteFornecedorAlertOpen] = useState(false)
  const [isDeleteFornecedorPinOpen, setIsDeleteFornecedorPinOpen] = useState(false)

  const [contaForm, setContaForm] = useState<ContaPagarForm>({
    descricao: '',
    centroCustoId: centrosCusto[0]?.id ?? '',
    recorrencia: 'mensal',
    valor: '',
    vencimento: '',
  })

  useEffect(() => {
    let frameId: number | null = null
    if (!open) {
      frameId = requestAnimationFrame(() => setEntered(false))
      return
    }

    frameId = requestAnimationFrame(() => {
      if (fornecedores.length > 0) setSelectedFornecedorId(fornecedores[0].id)
      setOpenFornecedorMenuId(null)
      setFornecedorMenuStyle(null)
      setViewFornecedorId(null)
      setIsFornecedorFormOpen(false)
      setFornecedorEditId(null)
      setFornecedorForm(EMPTY_FORNECEDOR_FORM)
      setContaForm({
        descricao: '',
        centroCustoId: centrosCusto[0]?.id ?? '',
        recorrencia: 'mensal',
        valor: '',
        vencimento: '',
      })
      requestAnimationFrame(() => setEntered(true))
    })
    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId)
    }
  }, [open, fornecedores, centrosCusto])

  useEffect(() => {
    if (!isActive) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isActive, onClose])

  useEffect(() => {
    if (!closing) return
    const fallback = window.setTimeout(() => onTransitionEnd(), 350)
    return () => window.clearTimeout(fallback)
  }, [closing, onTransitionEnd])

  useEffect(() => {
    function handleMouseMove(event: MouseEvent) {
      if (!isResizingRef.current) return
      const container = resizeContainerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const next = event.clientX - rect.left
      const minPx = 280
      const maxPx = Math.max(minPx, rect.width - 420)
      setFornecedorPaneWidth(Math.min(maxPx, Math.max(minPx, next)))
    }

    function handleMouseUp() {
      isResizingRef.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const effectiveSelectedFornecedorId =
    fornecedores.some((item) => item.id === selectedFornecedorId)
      ? selectedFornecedorId
      : (fornecedores[0]?.id ?? '')

  const selectedFornecedor = useMemo(
    () => fornecedores.find((row) => row.id === effectiveSelectedFornecedorId) ?? null,
    [fornecedores, effectiveSelectedFornecedorId],
  )
  const openFornecedorMenuRow = useMemo(
    () => fornecedores.find((row) => row.id === openFornecedorMenuId) ?? null,
    [fornecedores, openFornecedorMenuId],
  )
  const viewFornecedor = useMemo(
    () => fornecedores.find((row) => row.id === viewFornecedorId) ?? null,
    [fornecedores, viewFornecedorId],
  )
  const pendingDeleteFornecedor = useMemo(
    () => fornecedores.find((row) => row.id === pendingDeleteFornecedorId) ?? null,
    [fornecedores, pendingDeleteFornecedorId],
  )
  const contasFornecedor = useMemo(
    () => contasPagar.filter((row) => row.fornecedorId === effectiveSelectedFornecedorId),
    [contasPagar, effectiveSelectedFornecedorId],
  )
  const pendingDeleteFornecedorContasCount = useMemo(
    () => contasPagar.filter((row) => row.fornecedorId === pendingDeleteFornecedorId).length,
    [contasPagar, pendingDeleteFornecedorId],
  )

  useEffect(() => {
    if (!openFornecedorMenuId) return

    function updatePosition() {
      const trigger = fornecedorMenuTriggerRef.current
      if (!trigger) return false
      const rect = trigger.getBoundingClientRect()
      const menuWidth = Math.max(
        MENU_MIN_WIDTH_PX,
        fornecedorMenuRef.current?.offsetWidth ?? MENU_MIN_WIDTH_PX,
      )
      const menuHeight = fornecedorMenuRef.current?.offsetHeight ?? 0
      let top = rect.bottom + MENU_GAP_PX
      if (menuHeight > 0 && top + menuHeight > window.innerHeight - VIEWPORT_PADDING_PX) {
        top = Math.max(VIEWPORT_PADDING_PX, rect.top - MENU_GAP_PX - menuHeight)
      }
      const left = Math.min(
        Math.max(VIEWPORT_PADDING_PX, rect.right - menuWidth),
        window.innerWidth - menuWidth - VIEWPORT_PADDING_PX,
      )
      setFornecedorMenuStyle({
        position: 'fixed',
        top,
        left,
        minWidth: MENU_MIN_WIDTH_PX,
        zIndex: 10020,
      })
      return true
    }

    if (!updatePosition()) {
      const frame = requestAnimationFrame(() => updatePosition())
      return () => cancelAnimationFrame(frame)
    }

    const frame = requestAnimationFrame(updatePosition)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [openFornecedorMenuId])

  useEffect(() => {
    if (!openFornecedorMenuId) return
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (fornecedorMenuTriggerRef.current?.contains(target)) return
      if (fornecedorMenuRef.current?.contains(target)) return
      setOpenFornecedorMenuId(null)
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [openFornecedorMenuId])

  function openFornecedorCreateForm() {
    setFornecedorEditId(null)
    setFornecedorForm(EMPTY_FORNECEDOR_FORM)
    setIsFornecedorFormOpen(true)
  }

  function openFornecedorEditForm(row: AdminFornecedorRow) {
    setFornecedorEditId(row.id)
    setFornecedorForm({
      cnpj: row.cnpj,
      razaoSocial: row.razaoSocial,
      situacao: row.situacao,
      contatoEmail: row.contatoEmail,
      contatoTelefone: row.contatoTelefone,
      pessoaContato: row.pessoaContato,
    })
    setIsFornecedorFormOpen(true)
  }

  async function handleBuscarCnpj() {
    const digits = fornecedorForm.cnpj.replace(/\D/g, '')
    if (digits.length !== 14) return

    setIsCnpjLookupLoading(true)
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`)
      if (!response.ok) throw new Error('Falha ao consultar CNPJ')
      const payload = (await response.json()) as {
        razao_social?: string
        descricao_situacao_cadastral?: string
        situacao_cadastral?: number | string
        email?: string
        ddd_telefone_1?: string
        qsa?: Array<{ nome_socio?: string }>
      }

      setFornecedorForm((prev) => ({
        ...prev,
        razaoSocial: payload.razao_social ?? prev.razaoSocial,
        situacao: parseSituacaoFromCnpjResponse(payload),
        contatoEmail: payload.email ?? prev.contatoEmail,
        contatoTelefone: payload.ddd_telefone_1 ? maskPhone(payload.ddd_telefone_1) : prev.contatoTelefone,
        pessoaContato: payload.qsa?.[0]?.nome_socio ?? prev.pessoaContato,
      }))
    } catch {
      // mantém preenchimento manual
    } finally {
      setIsCnpjLookupLoading(false)
    }
  }

  function handleSaveFornecedor() {
    const payload: FornecedorForm = {
      cnpj: fornecedorForm.cnpj,
      razaoSocial: fornecedorForm.razaoSocial.trim(),
      contatoEmail: fornecedorForm.contatoEmail.trim(),
      contatoTelefone: fornecedorForm.contatoTelefone,
      pessoaContato: fornecedorForm.pessoaContato.trim(),
    }
    if (!payload.cnpj || !payload.razaoSocial) return

    if (fornecedorEditId) {
      onUpdateFornecedor({ id: fornecedorEditId, ...payload })
    } else {
      onCreateFornecedor(payload)
      setSuccessToast(`Fornecedor "${payload.razaoSocial}" criado com sucesso.`)
    }

    setIsFornecedorFormOpen(false)
    setFornecedorEditId(null)
    setFornecedorForm(EMPTY_FORNECEDOR_FORM)
  }

  function handleCreateContaPagar() {
    if (!effectiveSelectedFornecedorId) return
    if (!contaForm.descricao.trim() || !contaForm.centroCustoId || !contaForm.vencimento) return
    const valor = parseCurrencyBrl(contaForm.valor)
    if (valor <= 0) return

    onCreateContaPagar({
      fornecedorId: effectiveSelectedFornecedorId,
      descricao: contaForm.descricao.trim(),
      centroCustoId: contaForm.centroCustoId,
      recorrencia: contaForm.recorrencia,
      valor,
      vencimento: contaForm.vencimento,
    })

    setContaForm((prev) => ({ ...prev, descricao: '', valor: '', vencimento: '' }))
  }

  if (!isActive) return null

  return createPortal(
    <div className={`fixed inset-0 z-[10010] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <button
        type="button"
        className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${panelVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        aria-label="Fechar cadastro de contas a pagar"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-conta-pagar-cadastro-title"
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.propertyName === 'transform') onTransitionEnd()
        }}
        className={`absolute inset-x-0 bottom-0 flex h-[92vh] max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border-t border-gray-200/90 bg-gradient-to-b from-slate-50 via-white to-white shadow-[0_-24px_64px_rgba(15,23,42,0.22)] transition-transform duration-300 ease-out ${panelVisible ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <header className="shrink-0 border-b border-gray-200/80 bg-gradient-to-r from-[var(--brand-primary-light)]/45 via-white to-slate-100/70 px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
                <Building2 className="h-[18px] w-[18px]" />
              </span>
              <div>
                <h2 id="admin-conta-pagar-cadastro-title" className="text-lg font-bold text-gray-900">
                  Cadastro de contas a pagar por fornecedor
                </h2>
                <p className="text-xs text-gray-500 sm:text-sm">
                  Selecione ou cadastre fornecedor e lance as contas do lado direito.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div
          ref={resizeContainerRef}
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 sm:flex-row sm:p-6"
        >
          <section
            className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white sm:shrink-0"
            style={{ width: `min(100%, ${fornecedorPaneWidth}px)` }}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Fornecedores</h3>
                <p className="text-xs text-gray-500">Nome, CNPJ e gestão de cadastro.</p>
              </div>
              <button
                type="button"
                onClick={openFornecedorCreateForm}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-3">
              <ul className="space-y-2">
                {fornecedores.map((row) => (
                  <li key={row.id}>
                    <div
                      className={[
                        'rounded-xl border px-3 py-2.5 transition',
                        selectedFornecedorId === row.id
                          ? 'border-[var(--brand-primary)]/35 bg-[var(--brand-primary-light)]/35'
                          : 'border-gray-200 bg-white hover:bg-gray-50',
                      ].join(' ')}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedFornecedorId(row.id)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="truncate text-sm font-semibold text-gray-900">{row.razaoSocial}</p>
                          <p className="mt-0.5 text-xs text-gray-500">{row.cnpj}</p>
                          <span
                            className={[
                              'mt-1 inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                              getFornecedorSituacaoClasses(row.situacao),
                            ].join(' ')}
                          >
                            {getFornecedorSituacaoLabel(row.situacao)}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenFornecedorMenuId((prev) => (prev === row.id ? null : row.id))}
                          ref={openFornecedorMenuId === row.id ? fornecedorMenuTriggerRef : null}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50"
                          aria-label={`Ações para ${row.razaoSocial}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <div className="hidden sm:flex sm:items-stretch">
            <button
              type="button"
              aria-label="Redimensionar colunas"
              onMouseDown={() => {
                isResizingRef.current = true
                document.body.style.cursor = 'col-resize'
                document.body.style.userSelect = 'none'
              }}
              className="group relative h-full w-3 cursor-col-resize rounded-full"
            >
              <span className="absolute inset-y-6 left-1/2 w-px -translate-x-1/2 bg-gray-200 transition group-hover:bg-[var(--brand-primary)]/70" />
            </button>
          </div>

          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-4 py-3">
              <h3 className="text-sm font-bold text-gray-900">
                {selectedFornecedor ? `Contas de ${selectedFornecedor.razaoSocial}` : 'Contas do fornecedor'}
              </h3>
              <p className="text-xs text-gray-500">Liste contas pagas/pendentes e adicione novos lançamentos.</p>
            </div>
            <div className="grid gap-3 border-b border-gray-200 bg-slate-50/60 p-4 sm:grid-cols-2 lg:grid-cols-7">
              <label className="lg:col-span-2">
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-600">
                  Descrição
                </span>
                <input
                  className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-[var(--brand-primary)]"
                  value={contaForm.descricao}
                  onChange={(event) => setContaForm((prev) => ({ ...prev, descricao: event.target.value }))}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-600">
                  Centro de custo
                </span>
                <CustomSelect
                  value={contaForm.centroCustoId}
                  onChange={(value) => setContaForm((prev) => ({ ...prev, centroCustoId: value }))}
                  options={centrosCusto.map((centro) => ({ value: centro.id, label: centro.nome }))}
                  size="compact"
                  className="w-full"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-600">
                  Recorrência
                </span>
                <CustomSelect
                  value={contaForm.recorrencia}
                  onChange={(value) =>
                    setContaForm((prev) => ({ ...prev, recorrencia: value as AdminContaPagarRecorrencia }))
                  }
                  options={[
                    { value: 'mensal', label: 'Mensal' },
                    { value: 'unica', label: 'Única' },
                  ]}
                  size="compact"
                  className="w-full"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-600">
                  Valor
                </span>
                <input
                  className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-[var(--brand-primary)]"
                  value={contaForm.valor}
                  placeholder="R$ 0,00"
                  onChange={(event) =>
                    setContaForm((prev) => ({ ...prev, valor: maskCurrencyBrl(event.target.value) }))
                  }
                />
              </label>
              <label>
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-600">
                  Vencimento
                </span>
                <input
                  className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-[var(--brand-primary)]"
                  value={contaForm.vencimento}
                  placeholder="dd/mm/aaaa"
                  inputMode="numeric"
                  onChange={(event) =>
                    setContaForm((prev) => ({ ...prev, vencimento: maskBirthDate(event.target.value) }))
                  }
                />
              </label>
              <div className="sm:col-span-2 lg:col-span-1 lg:flex lg:items-end">
                <button
                  type="button"
                  onClick={handleCreateContaPagar}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand-primary)] px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!effectiveSelectedFornecedorId}
                >
                  <Plus className="h-4 w-4" />
                  Adicionar conta
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Descrição</th>
                    <th className="px-4 py-3 text-center">Recorrência</th>
                    <th className="px-4 py-3 text-center">Valor</th>
                    <th className="px-4 py-3 text-center">Vencimento</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {contasFornecedor.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                        Selecione um fornecedor e adicione uma nova conta a pagar.
                      </td>
                    </tr>
                  ) : null}
                  {contasFornecedor.map((row) => (
                    <tr key={row.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-medium text-gray-900">{row.descricao}</td>
                      <td className="px-4 py-3 text-center text-gray-700">
                        {adminContaPagarRecorrenciaLabel[row.recorrencia]}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-900">{formatCurrency(row.valor)}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{row.vencimento}</td>
                      <td className="px-4 py-3 text-center text-gray-700">
                        {row.status === 'pago' ? 'Pago' : row.status === 'atrasado' ? 'Atrasado' : 'Pendente'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </aside>

      {openFornecedorMenuId && fornecedorMenuStyle && openFornecedorMenuRow
        ? createPortal(
            <div
              ref={fornecedorMenuRef}
              role="menu"
              style={fornecedorMenuStyle}
              className="overflow-hidden rounded-xl border border-gray-200/90 bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setViewFornecedorId(openFornecedorMenuRow.id)
                  setOpenFornecedorMenuId(null)
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50"
              >
                <Eye className="h-4 w-4 text-gray-500" />
                Visualizar
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  openFornecedorEditForm(openFornecedorMenuRow)
                  setOpenFornecedorMenuId(null)
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50"
              >
                <Pencil className="h-4 w-4 text-gray-500" />
                Editar
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setPendingDeleteFornecedorId(openFornecedorMenuRow.id)
                  setIsDeleteFornecedorAlertOpen(true)
                  setOpenFornecedorMenuId(null)
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </button>
            </div>,
            document.body,
          )
        : null}

      {isFornecedorFormOpen
        ? createPortal(
            <div className="fixed inset-0 z-[10030] flex items-center justify-center bg-slate-900/50 p-4">
              <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_20px_40px_rgba(15,23,42,0.2)]">
                <div className="flex items-start justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-orange-50 px-5 py-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {fornecedorEditId ? 'Editar fornecedor' : 'Novo fornecedor'}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Busque pelo CNPJ na Receita e complete os dados de contato.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFornecedorFormOpen(false)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-3 px-5 py-4 sm:grid-cols-2">
                  <label className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">CNPJ</span>
                    <div className="flex gap-2">
                      <input
                        className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-[var(--brand-primary)]"
                        value={fornecedorForm.cnpj}
                        onChange={(event) =>
                          setFornecedorForm((prev) => ({ ...prev, cnpj: maskCnpj(event.target.value) }))
                        }
                        placeholder="00.000.000/0001-00"
                      />
                      <button
                        type="button"
                        onClick={handleBuscarCnpj}
                        disabled={fornecedorForm.cnpj.replace(/\D/g, '').length !== 14 || isCnpjLookupLoading}
                        className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition enabled:hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {isCnpjLookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        Buscar
                      </button>
                    </div>
                  </label>
                  <label className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Razão social</span>
                    <input
                      className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-[var(--brand-primary)]"
                      value={fornecedorForm.razaoSocial}
                      onChange={(event) =>
                        setFornecedorForm((prev) => ({ ...prev, razaoSocial: event.target.value }))
                      }
                    />
                  </label>
                  <label className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:col-span-2">
                    <div className="flex min-h-[2.5rem] items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Situação na Receita
                      </span>
                      <p
                        className={[
                          'text-sm font-semibold',
                          fornecedorForm.situacao === 'ativa'
                            ? 'text-emerald-700'
                            : fornecedorForm.situacao === 'inativa'
                              ? 'text-red-700'
                              : 'text-slate-600',
                        ].join(' ')}
                      >
                        {getFornecedorSituacaoLabel(fornecedorForm.situacao)}
                      </p>
                    </div>
                  </label>
                  <label className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">E-mail</span>
                    <input
                      className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-[var(--brand-primary)]"
                      type="email"
                      value={fornecedorForm.contatoEmail}
                      onChange={(event) =>
                        setFornecedorForm((prev) => ({ ...prev, contatoEmail: event.target.value }))
                      }
                    />
                  </label>
                  <label className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Telefone</span>
                    <input
                      className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-[var(--brand-primary)]"
                      value={fornecedorForm.contatoTelefone}
                      onChange={(event) =>
                        setFornecedorForm((prev) => ({
                          ...prev,
                          contatoTelefone: maskPhone(event.target.value),
                        }))
                      }
                    />
                  </label>
                  <label className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pessoa de contato</span>
                    <input
                      className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-[var(--brand-primary)]"
                      value={fornecedorForm.pessoaContato}
                      onChange={(event) =>
                        setFornecedorForm((prev) => ({ ...prev, pessoaContato: event.target.value }))
                      }
                    />
                  </label>
                </div>
                <div className="flex justify-end border-t border-gray-100 px-5 py-4">
                  <button
                    type="button"
                    onClick={handleSaveFornecedor}
                    className="inline-flex h-10 items-center rounded-lg bg-[var(--brand-primary)] px-4 text-sm font-semibold text-white transition hover:brightness-110"
                  >
                    Salvar fornecedor
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {viewFornecedor
        ? createPortal(
            <div className="fixed inset-0 z-[10030] flex items-center justify-center bg-slate-900/50 p-4">
              <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-[0_20px_40px_rgba(15,23,42,0.2)]">
                <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Fornecedor</h3>
                    <p className="mt-1 text-sm text-gray-500">{viewFornecedor.razaoSocial}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewFornecedorId(null)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <dl className="grid gap-3 px-5 py-4 text-sm">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-500">CNPJ</dt>
                    <dd className="mt-1 font-medium text-gray-900">{viewFornecedor.cnpj}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-500">Contato</dt>
                    <dd className="mt-1 font-medium text-gray-900">
                      {viewFornecedor.pessoaContato || 'Não informado'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-500">Situação</dt>
                    <dd className="mt-1">
                      <span
                        className={[
                          'inline-flex rounded-md border px-2 py-1 text-xs font-semibold uppercase tracking-wide',
                          getFornecedorSituacaoClasses(viewFornecedor.situacao),
                        ].join(' ')}
                      >
                        {getFornecedorSituacaoLabel(viewFornecedor.situacao)}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-500">E-mail</dt>
                    <dd className="mt-1 font-medium text-gray-900">{viewFornecedor.contatoEmail || 'Não informado'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-500">Telefone</dt>
                    <dd className="mt-1 font-medium text-gray-900">
                      {viewFornecedor.contatoTelefone || 'Não informado'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>,
            document.body,
          )
        : null}

      {isDeleteFornecedorAlertOpen && pendingDeleteFornecedor
        ? createPortal(
            <div className="fixed inset-0 z-[10030] flex items-center justify-center bg-slate-900/50 p-4">
              <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-[0_20px_40px_rgba(15,23,42,0.2)]">
                <div className="border-b border-gray-100 px-5 py-4">
                  <h3 className="text-base font-semibold text-gray-900">Excluir fornecedor</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Você está prestes a excluir o fornecedor{' '}
                    <span className="font-semibold text-gray-900">{pendingDeleteFornecedor.razaoSocial}</span>.
                  </p>
                  <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    Este fornecedor possui {pendingDeleteFornecedorContasCount} conta(s) registrada(s). Ao
                    excluir, todas essas contas também serão apagadas.
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2 px-5 py-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDeleteFornecedorAlertOpen(false)
                      setPendingDeleteFornecedorId(null)
                    }}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDeleteFornecedorAlertOpen(false)
                      setIsDeleteFornecedorPinOpen(true)
                    }}
                    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    Continuar exclusão
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      <PinUnlockModal
        open={isDeleteFornecedorPinOpen}
        onClose={() => {
          setIsDeleteFornecedorPinOpen(false)
          setPendingDeleteFornecedorId(null)
        }}
        onSuccess={() => {
          if (!pendingDeleteFornecedorId) return
          const fornecedorNome =
            fornecedores.find((item) => item.id === pendingDeleteFornecedorId)?.razaoSocial ?? 'Fornecedor'
          onDeleteFornecedor(pendingDeleteFornecedorId)
          setIsDeleteFornecedorPinOpen(false)
          setPendingDeleteFornecedorId(null)
          setSuccessToast(`${fornecedorNome} e contas vinculadas excluídos com sucesso.`)
        }}
        title="Confirmar exclusão de fornecedor"
        titleId="admin-financeiro-delete-fornecedor-pin-title"
        description="Para excluir este fornecedor e as contas vinculadas, informe a senha de 6 dígitos."
        submitLabel="Confirmar exclusão"
        pinCompleteHint="Senha completa. Toque em confirmar exclusão."
        icon={Trash2}
      />

      <Toast
        message={successToast ?? ''}
        visible={Boolean(successToast)}
        variant="success"
        onClose={() => setSuccessToast(null)}
      />
    </div>,
    document.body,
  )
}
