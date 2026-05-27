import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  CheckCircle,
  CheckCircle2,
  Building2,
  Download,
  Eye,
  Landmark,
  Loader2,
  Lock,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react'
import { AdminPageHeader } from '../AdminPageHeader'
import {
  adminCentrosCustoIniciais,
  adminFornecedoresIniciais,
  adminContaPagarRecorrenciaLabel,
  adminContaPagarStatusLabel,
  adminFechamentoCompetenciaStatusLabel,
  adminContasPagarIniciais,
  adminContaReceberStatusVencimentoLabel,
  buildAdminFechamentosCompetenciaFromContratos,
  getContratoModalidadeLabel,
  type AdminCentroCusto,
  type AdminFornecedorRow,
  type AdminContaPagarRecorrencia,
  type AdminContaPagarRow,
  type AdminContaReceberStatusVencimento,
  type AdminFechamentoCompetenciaRow,
  type AdminFechamentoCompetenciaStatus,
} from '../../../data/adminFinanceiroMock'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollAreaClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../../layout/dashboardPageLayout'
import { KpiStatCards, type KpiStatCardItem } from '../../ui/KpiStatCards'
import { AdminBillingClosureDrawer } from './AdminBillingClosureDrawer'
import { AdminContaPagarCadastroDrawer } from './AdminContaPagarCadastroDrawer'
import { AdminFechamentoCompetenciaStatusBadge } from './AdminFechamentoCompetenciaStatusBadge'
import { CustomSelect } from '../../ui/CustomSelect'
import { PinUnlockModal } from '../../users/PinUnlockModal'
import { Toast } from '../../ui/Toast'
import {
  SituationStatusBadge,
  type SituationStatusBadgeStyle,
} from '../../ui/SituationStatusBadge'
import { createPortal } from 'react-dom'
import jsPDF from 'jspdf'
import { maskBirthDate } from '../../../utils/masks'

type FinanceiroTab = 'fechamentos' | 'receber' | 'pagar' | 'balanco'

type ContaPagarForm = {
  descricao: string
  centroCustoId: string
  recorrencia: AdminContaPagarRecorrencia
  valor: string
  vencimento: string
}

type NotaFiscalState = {
  status: 'emitting' | 'issued'
  invoiceNumber?: string
  issuedAt?: string
}

type PagarSecureAction = 'toggle_paid' | 'edit' | 'delete'
type ReceberSecureAction = 'toggle_paid'

const tabLabels: Record<FinanceiroTab, string> = {
  fechamentos: 'Fechamentos',
  receber: 'Contas a receber',
  pagar: 'Contas a pagar',
  balanco: 'Balanço da operação',
}

const ADMIN_CONTA_PAGAR_STATUS_BADGE_WIDTH = 'w-[8.5rem]'
const adminContaPagarStatusBadgeConfig: Record<
  AdminContaPagarRow['status'],
  SituationStatusBadgeStyle
> = {
  pendente: {
    label: adminContaPagarStatusLabel.pendente,
    text: 'text-amber-700',
    accent: 'bg-gradient-to-r from-amber-300 via-amber-500 to-orange-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(245,158,11,0.45)]',
  },
  atrasado: {
    label: adminContaPagarStatusLabel.atrasado,
    text: 'text-red-700',
    accent: 'bg-gradient-to-r from-rose-400 via-red-500 to-red-600',
    lineGlow: 'shadow-[0_2px_10px_rgba(239,68,68,0.5)]',
  },
  pago: {
    label: adminContaPagarStatusLabel.pago,
    text: 'text-emerald-700',
    accent: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.5)]',
  },
}

const ADMIN_CONTA_RECEBER_STATUS_VENCIMENTO_BADGE_WIDTH = 'w-[8.5rem]'
const adminContaReceberStatusVencimentoBadgeConfig: Record<
  AdminContaReceberStatusVencimento,
  SituationStatusBadgeStyle
> = {
  a_vencer: {
    label: adminContaReceberStatusVencimentoLabel.a_vencer,
    text: 'text-sky-700',
    accent: 'bg-gradient-to-r from-sky-300 via-sky-500 to-blue-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(14,165,233,0.45)]',
  },
  paga: {
    label: adminContaReceberStatusVencimentoLabel.paga,
    text: 'text-emerald-700',
    accent: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.5)]',
  },
  atrasada: {
    label: adminContaReceberStatusVencimentoLabel.atrasada,
    text: 'text-red-700',
    accent: 'bg-gradient-to-r from-rose-400 via-red-500 to-red-600',
    lineGlow: 'shadow-[0_2px_10px_rgba(239,68,68,0.5)]',
  },
}

const adminUltrapassagemStatusBadgeConfig: Record<'sim' | 'nao', SituationStatusBadgeStyle> = {
  sim: {
    label: 'Sim',
    text: 'text-red-700',
    accent: 'bg-gradient-to-r from-rose-400 via-red-500 to-red-600',
    lineGlow: 'shadow-[0_2px_10px_rgba(239,68,68,0.5)]',
  },
  nao: {
    label: 'Não',
    text: 'text-emerald-700',
    accent: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.5)]',
  },
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function formatCurrencyInput(raw: string) {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  const value = Number(digits) / 100
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function parseCurrencyMaskedInput(raw: string) {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return 0
  return Number(digits) / 100
}

function sanitizeFilePart(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
}

function parseBrazilianDate(value: string) {
  const [day, month, year] = value.split('/').map((part) => Number(part))
  if (!day || !month || !year) return null
  const date = new Date(year, month - 1, day)
  if (Number.isNaN(date.getTime())) return null
  return date
}

function getMonthYearFromBrazilianDate(value: string) {
  const parts = value.split('/')
  const month = parts[1]
  const year = parts[2]
  if (!month || !year) return null
  return `${month}/${year}`
}

function getContaReceberStatusVencimento(
  row: Pick<AdminFechamentoCompetenciaRow, 'vencimento' | 'statusVencimento'>,
): AdminContaReceberStatusVencimento {
  if (row.statusVencimento === 'paga') return 'paga'

  const vencimento = parseBrazilianDate(row.vencimento)
  if (!vencimento) return row.statusVencimento === 'atrasada' ? 'atrasada' : 'a_vencer'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  vencimento.setHours(0, 0, 0, 0)

  if (vencimento < today) return 'atrasada'
  return 'a_vencer'
}

const cardSurfaceClass = [
  'rounded-2xl border border-gray-200 bg-white',
  'shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]',
].join(' ')

const financeiroMainCardHeightClass = 'h-[calc(100dvh-20.5rem)] min-h-[34rem]'
const MENU_MIN_WIDTH_PX = 224
const MENU_GAP_PX = 6
const VIEWPORT_PADDING_PX = 12

export function AdminFinanceiroMainPanel() {
  const [activeTab, setActiveTab] = useState<FinanceiroTab>('fechamentos')
  const [centrosCusto, setCentrosCusto] = useState<AdminCentroCusto[]>(adminCentrosCustoIniciais)
  const [fornecedores, setFornecedores] = useState<AdminFornecedorRow[]>(adminFornecedoresIniciais)
  const [contasPagar, setContasPagar] = useState<AdminContaPagarRow[]>(adminContasPagarIniciais)
  const [fechamentos, setFechamentos] = useState(buildAdminFechamentosCompetenciaFromContratos)
  const [novoCentroNome, setNovoCentroNome] = useState('')
  const [selectedFechamentoId, setSelectedFechamentoId] = useState<string | null>(null)
  const [isFechamentoDrawerClosing, setIsFechamentoDrawerClosing] = useState(false)

  // Filtros - Contas a receber
  const [receberSearchQuery, setReceberSearchQuery] = useState('')
  const [receberModalidadeFilter, setReceberModalidadeFilter] = useState<
    AdminFechamentoCompetenciaRow['modalidade'] | 'all'
  >('all')
  const [receberCompetenciaFilter, setReceberCompetenciaFilter] = useState<string | 'all'>('all')
  const [receberUltrapassagemFilter, setReceberUltrapassagemFilter] = useState<
    'all' | 'sim' | 'nao'
  >('all')
  const [receberVencimentoFilter, setReceberVencimentoFilter] = useState<
    AdminContaReceberStatusVencimento | 'all'
  >('all')

  // Filtros - Fechamentos
  const [fechamentoSearchQuery, setFechamentoSearchQuery] = useState('')
  const [fechamentoStatusFilter, setFechamentoStatusFilter] = useState<
    AdminFechamentoCompetenciaStatus | 'all'
  >('all')
  const [fechamentoModalidadeFilter, setFechamentoModalidadeFilter] = useState<
    AdminFechamentoCompetenciaRow['modalidade'] | 'all'
  >('all')
  const [fechamentoCompetenciaFilter, setFechamentoCompetenciaFilter] = useState<
    string | 'all'
  >('all')
  const [balancoViewMode, setBalancoViewMode] = useState<'consolidado' | 'competencia' | 'periodo'>(
    'consolidado',
  )
  const [balancoCompetenciaFilter, setBalancoCompetenciaFilter] = useState<string | 'all'>('all')
  const [balancoDataInicial, setBalancoDataInicial] = useState('')
  const [balancoDataFinal, setBalancoDataFinal] = useState('')

  // Ações - Contas a receber
  const [openReceberMenuId, setOpenReceberMenuId] = useState<string | null>(null)
  const [receberMenuStyle, setReceberMenuStyle] = useState<CSSProperties | null>(null)
  const [pendingDeleteReceberId, setPendingDeleteReceberId] = useState<string | null>(null)
  const [isDeletePinOpen, setIsDeletePinOpen] = useState(false)
  const [pendingReceberSecureAction, setPendingReceberSecureAction] = useState<{
    type: ReceberSecureAction
    rowId: string
  } | null>(null)
  const [isReceberPinOpen, setIsReceberPinOpen] = useState(false)
  const receberMenuTriggerRef = useRef<HTMLButtonElement | null>(null)
  const receberMenuRef = useRef<HTMLDivElement | null>(null)
  const [notaFiscalByFechamentoId, setNotaFiscalByFechamentoId] = useState<
    Record<string, NotaFiscalState>
  >({})
  const [openPagarMenuId, setOpenPagarMenuId] = useState<string | null>(null)
  const [pagarMenuStyle, setPagarMenuStyle] = useState<CSSProperties | null>(null)
  const [pendingPagarSecureAction, setPendingPagarSecureAction] = useState<{
    type: PagarSecureAction
    rowId: string
  } | null>(null)
  const [isPagarPinOpen, setIsPagarPinOpen] = useState(false)
  const [viewingContaPagarId, setViewingContaPagarId] = useState<string | null>(null)
  const [editingContaPagarId, setEditingContaPagarId] = useState<string | null>(null)
  const [editingContaPagarForm, setEditingContaPagarForm] = useState<ContaPagarForm | null>(null)
  const [editSuccessToast, setEditSuccessToast] = useState<string | null>(null)
  const [openBalancoMenuCentroId, setOpenBalancoMenuCentroId] = useState<string | null>(null)
  const [balancoMenuStyle, setBalancoMenuStyle] = useState<CSSProperties | null>(null)
  const [despesaAjustePorCentro, setDespesaAjustePorCentro] = useState<Record<string, number>>({})
  const [editingDespesaCentroId, setEditingDespesaCentroId] = useState<string | null>(null)
  const [editingDespesaValor, setEditingDespesaValor] = useState('')
  const [balancoToast, setBalancoToast] = useState<string | null>(null)
  const [pendingDeleteBalancoCentroId, setPendingDeleteBalancoCentroId] = useState<string | null>(null)
  const [isBalancoDeletePinOpen, setIsBalancoDeletePinOpen] = useState(false)
  const [isContaPagarDrawerOpen, setIsContaPagarDrawerOpen] = useState(false)
  const [isContaPagarDrawerClosing, setIsContaPagarDrawerClosing] = useState(false)
  const pagarMenuTriggerRef = useRef<HTMLButtonElement | null>(null)
  const pagarMenuRef = useRef<HTMLDivElement | null>(null)
  const balancoMenuTriggerRef = useRef<HTMLButtonElement | null>(null)
  const balancoMenuRef = useRef<HTMLDivElement | null>(null)

  const [contaPagarForm, setContaPagarForm] = useState<ContaPagarForm>({
    descricao: '',
    centroCustoId: adminCentrosCustoIniciais[0]?.id ?? '',
    recorrencia: 'mensal',
    valor: '',
    vencimento: '',
  })

  const contasReceber = useMemo(
    () => fechamentos.filter((row) => row.status === 'fechado'),
    [fechamentos],
  )

  const totalReceberPrevisto = useMemo(
    () => contasReceber.reduce((acc, row) => acc + row.valorFinal, 0),
    [contasReceber],
  )
  const totalRecebido = useMemo(
    () =>
      contasReceber
        .filter((row) => getContaReceberStatusVencimento(row) === 'paga')
        .reduce((acc, row) => acc + row.valorFinal, 0),
    [contasReceber],
  )
  const totalEmAtrasoReceber = useMemo(
    () =>
      contasReceber
        .filter((row) => getContaReceberStatusVencimento(row) === 'atrasada')
        .reduce((acc, row) => acc + row.valorFinal, 0),
    [contasReceber],
  )

  const totalDespesasBase = useMemo(
    () => contasPagar.reduce((acc, row) => acc + row.valor, 0),
    [contasPagar],
  )
  const totalAjustesDespesa = useMemo(
    () => Object.values(despesaAjustePorCentro).reduce((acc, value) => acc + value, 0),
    [despesaAjustePorCentro],
  )
  const totalDespesas = totalDespesasBase + totalAjustesDespesa
  const saldoOperacional = totalReceberPrevisto - totalDespesas
  const financeKpis = useMemo<KpiStatCardItem[]>(
    () => [
      {
        label: 'Receita prevista',
        value: formatCurrency(totalReceberPrevisto),
        suffix: 'Contratos ativos e em implantacao',
        icon: TrendingUp,
        iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
        iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
        iconRing: 'ring-blue-100/80',
        topBar: 'from-sky-400 to-blue-500',
      },
      {
        label: 'Receita recebida',
        value: formatCurrency(totalRecebido),
        suffix: 'Titulos liquidados pelas prefeituras',
        icon: Landmark,
        iconGradient: 'from-emerald-500 via-green-500 to-teal-600',
        iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]',
        iconRing: 'ring-emerald-100/80',
        topBar: 'from-emerald-400 to-green-500',
      },
      {
        label: 'Despesas totais',
        value: formatCurrency(totalDespesas),
        suffix: 'Contas a pagar cadastradas no periodo',
        icon: TrendingDown,
        iconGradient: 'from-orange-500 via-amber-500 to-orange-600',
        iconShadow: 'shadow-[0_8px_20px_rgba(249,115,22,0.35)]',
        iconRing: 'ring-orange-100/80',
        topBar: 'from-orange-400 to-amber-500',
      },
      {
        label: 'Saldo operacional',
        value: formatCurrency(saldoOperacional),
        suffix: 'Receita prevista menos despesas totais',
        icon: Wallet,
        iconGradient:
          saldoOperacional >= 0
            ? 'from-emerald-500 via-green-500 to-teal-600'
            : 'from-rose-500 via-red-500 to-red-600',
        iconShadow:
          saldoOperacional >= 0
            ? 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]'
            : 'shadow-[0_8px_20px_rgba(239,68,68,0.35)]',
        iconRing: saldoOperacional >= 0 ? 'ring-emerald-100/80' : 'ring-red-100/80',
        topBar: saldoOperacional >= 0 ? 'from-emerald-400 to-green-500' : 'from-rose-400 to-red-500',
      },
    ],
    [saldoOperacional, totalDespesas, totalReceberPrevisto, totalRecebido],
  )

  const despesasPorCentro = useMemo(
    () =>
      centrosCusto.map((centro) => {
        const valorBase = contasPagar
          .filter((conta) => conta.centroCustoId === centro.id)
          .reduce((acc, conta) => acc + conta.valor, 0)
        const ajuste = despesaAjustePorCentro[centro.id] ?? 0
        return {
          ...centro,
          valorBase,
          ajuste,
          valor: Math.max(0, valorBase + ajuste),
        }
      }),
    [centrosCusto, contasPagar, despesaAjustePorCentro],
  )

  const handleAdicionarCentroCusto = () => {
    const nome = novoCentroNome.trim()
    if (!nome) return
    const id = `cc-${nome.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString().slice(-4)}`
    const novoCentro = { id, nome }
    setCentrosCusto((prev) => [...prev, novoCentro])
    setContaPagarForm((prev) => ({ ...prev, centroCustoId: prev.centroCustoId || id }))
    setNovoCentroNome('')
  }

  const handleContaPagarFormChange = <K extends keyof ContaPagarForm>(
    field: K,
    value: ContaPagarForm[K],
  ) => {
    setContaPagarForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleCriarContaPagar = () => {
    setIsContaPagarDrawerOpen(true)
  }

  const handleCloseContaPagarDrawer = () => {
    if (!isContaPagarDrawerOpen) return
    setIsContaPagarDrawerOpen(false)
    setIsContaPagarDrawerClosing(true)
  }

  const handleContaPagarDrawerTransitionEnd = () => {
    setIsContaPagarDrawerClosing(false)
  }

  const handleCreateFornecedor = (payload: Omit<AdminFornecedorRow, 'id'>) => {
    const novoFornecedor: AdminFornecedorRow = {
      id: `forn-${Date.now()}`,
      ...payload,
    }
    setFornecedores((prev) => [novoFornecedor, ...prev])
  }

  const handleUpdateFornecedor = (payload: AdminFornecedorRow) => {
    setFornecedores((prev) => prev.map((item) => (item.id === payload.id ? payload : item)))
  }

  const handleDeleteFornecedor = (fornecedorId: string) => {
    setFornecedores((prev) => prev.filter((item) => item.id !== fornecedorId))
    setContasPagar((prev) => prev.filter((item) => item.fornecedorId !== fornecedorId))
  }

  const handleCreateContaPagarByDrawer = (payload: {
    fornecedorId: string
    descricao: string
    centroCustoId: string
    recorrencia: AdminContaPagarRecorrencia
    valor: number
    vencimento: string
  }) => {
    setContasPagar((prev) => [
      {
        id: `cp-${Date.now()}`,
        status: 'pendente',
        ...payload,
      },
      ...prev,
    ])
  }

  const resolveCentroCusto = (centroId: string) =>
    centrosCusto.find((centro) => centro.id === centroId)?.nome ?? 'Nao informado'

  const viewingContaPagar = useMemo(
    () => contasPagar.find((row) => row.id === viewingContaPagarId) ?? null,
    [contasPagar, viewingContaPagarId],
  )
  const editingContaPagar = useMemo(
    () => contasPagar.find((row) => row.id === editingContaPagarId) ?? null,
    [contasPagar, editingContaPagarId],
  )

  const selectedPagarMenuRow = useMemo(
    () => contasPagar.find((row) => row.id === openPagarMenuId) ?? null,
    [contasPagar, openPagarMenuId],
  )
  const pendingReceberSecureRow = useMemo(
    () =>
      pendingReceberSecureAction
        ? contasReceber.find((row) => row.id === pendingReceberSecureAction.rowId) ?? null
        : null,
    [contasReceber, pendingReceberSecureAction],
  )
  const pendingPagarSecureRow = useMemo(
    () =>
      pendingPagarSecureAction
        ? contasPagar.find((row) => row.id === pendingPagarSecureAction.rowId) ?? null
        : null,
    [contasPagar, pendingPagarSecureAction],
  )


  const openEditContaPagar = (rowId: string) => {
    const row = contasPagar.find((item) => item.id === rowId)
    if (!row) return
    setEditingContaPagarId(row.id)
    setEditingContaPagarForm({
      descricao: row.descricao,
      centroCustoId: row.centroCustoId,
      recorrencia: row.recorrencia,
      valor: formatCurrency(row.valor),
      vencimento: row.vencimento,
    })
  }

  const requestPagarSecureAction = (type: PagarSecureAction, rowId: string) => {
    setOpenPagarMenuId(null)
    setPendingPagarSecureAction({ type, rowId })
    setIsPagarPinOpen(true)
  }

  const requestReceberSecureAction = (type: ReceberSecureAction, rowId: string) => {
    setOpenReceberMenuId(null)
    setPendingReceberSecureAction({ type, rowId })
    setIsReceberPinOpen(true)
  }

  const handleReceberSecureActionSuccess = () => {
    if (!pendingReceberSecureAction) return

    const { rowId } = pendingReceberSecureAction
    setFechamentos((prev) =>
      prev.map((item) => {
        if (item.id !== rowId) return item

        if (item.statusVencimento === 'paga') {
          const vencimento = parseBrazilianDate(item.vencimento)
          if (!vencimento) {
            return { ...item, statusVencimento: 'a_vencer' }
          }
          const hoje = new Date()
          hoje.setHours(0, 0, 0, 0)
          vencimento.setHours(0, 0, 0, 0)
          return { ...item, statusVencimento: vencimento < hoje ? 'atrasada' : 'a_vencer' }
        }

        return { ...item, statusVencimento: 'paga' }
      }),
    )

    setIsReceberPinOpen(false)
    setPendingReceberSecureAction(null)
  }

  const handlePagarSecureActionSuccess = () => {
    if (!pendingPagarSecureAction) return

    const { type, rowId } = pendingPagarSecureAction
    if (type === 'delete') {
      setContasPagar((prev) => prev.filter((item) => item.id !== rowId))
      if (viewingContaPagarId === rowId) setViewingContaPagarId(null)
      if (editingContaPagarId === rowId) {
        setEditingContaPagarId(null)
        setEditingContaPagarForm(null)
      }
    } else if (type === 'toggle_paid') {
      setContasPagar((prev) =>
        prev.map((item) =>
          item.id === rowId
            ? { ...item, status: item.status === 'pago' ? 'pendente' : 'pago' }
            : item,
        ),
      )
    } else if (type === 'edit') {
      openEditContaPagar(rowId)
    }

    setIsPagarPinOpen(false)
    setPendingPagarSecureAction(null)
  }

  const closeEditContaPagarModal = () => {
    setEditingContaPagarId(null)
    setEditingContaPagarForm(null)
  }

  const handleSaveContaPagarEdits = () => {
    if (!editingContaPagarId || !editingContaPagarForm) return
    if (
      !editingContaPagarForm.descricao.trim() ||
      !editingContaPagarForm.centroCustoId ||
      !editingContaPagarForm.vencimento
    ) {
      return
    }

    const valor = parseCurrencyMaskedInput(editingContaPagarForm.valor)
    if (valor <= 0) return
    const descricaoAtualizada = editingContaPagarForm.descricao.trim()

    setContasPagar((prev) =>
      prev.map((item) =>
        item.id === editingContaPagarId
          ? {
              ...item,
              descricao: descricaoAtualizada,
              centroCustoId: editingContaPagarForm.centroCustoId,
              recorrencia: editingContaPagarForm.recorrencia,
              valor,
              vencimento: editingContaPagarForm.vencimento,
            }
          : item,
      ),
    )

    closeEditContaPagarModal()
    setEditSuccessToast(`Conta a pagar "${descricaoAtualizada}" atualizada com sucesso.`)
  }

  const handleOpenEditDespesaConsolidada = (centroId: string) => {
    const centro = balancoDespesasPorCentro.find((item) => item.id === centroId)
    if (!centro) return
    setEditingDespesaCentroId(centroId)
    setEditingDespesaValor(formatCurrency(centro.valor))
    setOpenBalancoMenuCentroId(null)
  }

  const handleSaveEditDespesaConsolidada = () => {
    if (!editingDespesaCentro) return
    const novoValor = parseCurrencyMaskedInput(editingDespesaValor)
    if (novoValor < 0) return
    const novoAjuste = novoValor - editingDespesaCentro.valorBase
    setDespesaAjustePorCentro((prev) => ({ ...prev, [editingDespesaCentro.id]: novoAjuste }))
    setBalancoToast(`Despesa consolidada de "${editingDespesaCentro.nome}" atualizada.`)
    setEditingDespesaCentroId(null)
    setEditingDespesaValor('')
  }

  const handleDeleteDespesaConsolidada = (centroId: string) => {
    const centro = balancoDespesasPorCentro.find((item) => item.id === centroId)
    if (!centro) return
    setDespesaAjustePorCentro((prev) => ({ ...prev, [centroId]: -centro.valorBase }))
    setBalancoToast(`Despesa consolidada de "${centro.nome}" removida.`)
    setOpenBalancoMenuCentroId(null)
  }

  const requestDeleteDespesaConsolidada = (centroId: string) => {
    setPendingDeleteBalancoCentroId(centroId)
    setIsBalancoDeletePinOpen(true)
    setOpenBalancoMenuCentroId(null)
  }

  const handleDownloadDespesaConsolidada = (centroId: string) => {
    const centro = balancoDespesasPorCentro.find((item) => item.id === centroId)
    if (!centro) return
    const doc = new jsPDF()
    let y = 18
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('Nota fiscal de despesa consolidada', 14, y)
    y += 10
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text(`Centro de custo: ${centro.nome}`, 14, y)
    y += 8
    doc.text(`Despesa consolidada: ${formatCurrency(centro.valor)}`, 14, y)
    y += 8
    doc.text(`Ajuste manual: ${formatCurrency(centro.ajuste)}`, 14, y)
    y += 8
    doc.text(
      `Emitido em: ${new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date())}`,
      14,
      y,
    )
    doc.save(`nf-despesa-consolidada-${sanitizeFilePart(centro.nome)}.pdf`)
    setOpenBalancoMenuCentroId(null)
  }

  const normalizedReceberQuery = receberSearchQuery.trim().toLowerCase()
  const normalizedFechamentoQuery = fechamentoSearchQuery.trim().toLowerCase()

  const filteredContasReceber = useMemo(() => {
    let rows = contasReceber

    if (receberCompetenciaFilter !== 'all') {
      rows = rows.filter((row) => row.competencia === receberCompetenciaFilter)
    }

    if (receberModalidadeFilter !== 'all') {
      rows = rows.filter((row) => row.modalidade === receberModalidadeFilter)
    }

    if (receberUltrapassagemFilter !== 'all') {
      rows = rows.filter((row) =>
        receberUltrapassagemFilter === 'sim' ? row.excedeuLimite : !row.excedeuLimite,
      )
    }

    if (receberVencimentoFilter !== 'all') {
      rows = rows.filter(
        (row) => getContaReceberStatusVencimento(row) === receberVencimentoFilter,
      )
    }

    if (normalizedReceberQuery) {
      rows = rows.filter((row) => {
        const haystack = [row.prefeitura, row.contratoNumero, row.competencia]
          .join(' ')
          .toLowerCase()
        return haystack.includes(normalizedReceberQuery)
      })
    }

    return rows
  }, [
    contasReceber,
    normalizedReceberQuery,
    receberCompetenciaFilter,
    receberModalidadeFilter,
    receberUltrapassagemFilter,
    receberVencimentoFilter,
  ])

  const competenciasOptions = useMemo(() => {
    const unique = new Set(fechamentos.map((f) => f.competencia))
    return [
      { value: 'all', label: 'Todas as competências' },
      ...Array.from(unique).sort((a, b) => (a < b ? 1 : -1)).map((comp) => ({
        value: comp,
        label: comp,
      })),
    ]
  }, [fechamentos])

  const balancoCompetenciaOptions = useMemo(
    () => [{ value: 'all', label: 'Todas as competências' }, ...competenciasOptions.slice(1)],
    [competenciasOptions],
  )

  const balancoContasPagar = useMemo(() => {
    if (balancoViewMode === 'consolidado') return contasPagar

    if (balancoViewMode === 'competencia' && balancoCompetenciaFilter !== 'all') {
      return contasPagar.filter(
        (row) => getMonthYearFromBrazilianDate(row.vencimento) === balancoCompetenciaFilter,
      )
    }

    if (balancoViewMode === 'periodo') {
      const dataInicial = parseBrazilianDate(balancoDataInicial)
      const dataFinal = parseBrazilianDate(balancoDataFinal)
      if (!dataInicial || !dataFinal) return contasPagar
      return contasPagar.filter((row) => {
        const vencimento = parseBrazilianDate(row.vencimento)
        if (!vencimento) return false
        return vencimento >= dataInicial && vencimento <= dataFinal
      })
    }

    return contasPagar
  }, [balancoCompetenciaFilter, balancoDataFinal, balancoDataInicial, balancoViewMode, contasPagar])

  const balancoFechamentos = useMemo(() => {
    if (balancoViewMode === 'consolidado') return contasReceber

    if (balancoViewMode === 'competencia' && balancoCompetenciaFilter !== 'all') {
      return contasReceber.filter((row) => row.competencia === balancoCompetenciaFilter)
    }

    if (balancoViewMode === 'periodo') {
      const dataInicial = parseBrazilianDate(balancoDataInicial)
      const dataFinal = parseBrazilianDate(balancoDataFinal)
      if (!dataInicial || !dataFinal) return contasReceber
      return contasReceber.filter((row) => {
        const [month, year] = row.competencia.split('/').map(Number)
        if (!month || !year) return false
        const competenciaDate = new Date(year, month - 1, 1)
        return competenciaDate >= dataInicial && competenciaDate <= dataFinal
      })
    }

    return contasReceber
  }, [balancoCompetenciaFilter, balancoDataFinal, balancoDataInicial, balancoViewMode, contasReceber])

  const balancoReceita = useMemo(
    () => balancoFechamentos.reduce((acc, row) => acc + row.valorFinal, 0),
    [balancoFechamentos],
  )
  const balancoDespesasBase = useMemo(
    () => balancoContasPagar.reduce((acc, row) => acc + row.valor, 0),
    [balancoContasPagar],
  )
  const balancoDespesas = balancoDespesasBase + totalAjustesDespesa
  const balancoResultado = balancoReceita - balancoDespesas
  const balancoDespesasPagas = useMemo(
    () =>
      balancoContasPagar.filter((row) => row.status === 'pago').reduce((acc, row) => acc + row.valor, 0),
    [balancoContasPagar],
  )
  const balancoDespesasPorCentro = centrosCusto.map((centro) => {
    const valorBase = balancoContasPagar
      .filter((conta) => conta.centroCustoId === centro.id)
      .reduce((acc, conta) => acc + conta.valor, 0)
    const ajuste = despesaAjustePorCentro[centro.id] ?? 0
    return {
      ...centro,
      valorBase,
      ajuste,
      valor: Math.max(0, valorBase + ajuste),
    }
  })
  const selectedBalancoCentro =
    balancoDespesasPorCentro.find((centro) => centro.id === openBalancoMenuCentroId) ?? null
  const editingDespesaCentro =
    balancoDespesasPorCentro.find((centro) => centro.id === editingDespesaCentroId) ?? null
  const pendingDeleteBalancoCentro =
    balancoDespesasPorCentro.find((centro) => centro.id === pendingDeleteBalancoCentroId) ?? null

  const balancoKpis = useMemo<KpiStatCardItem[]>(
    () => {
      const lucratividadePercentual =
        balancoReceita > 0 ? (balancoResultado / balancoReceita) * 100 : 0

      return [
        {
          label: 'Receita',
          value: formatCurrency(balancoReceita),
          suffix: 'Receita prevista consolidada',
          icon: TrendingUp,
          iconGradient: 'from-emerald-500 via-green-500 to-teal-600',
          iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]',
          iconRing: 'ring-emerald-100/80',
          topBar: 'from-emerald-400 to-green-500',
        },
        {
          label: 'Despesa',
          value: formatCurrency(balancoDespesas),
          suffix: 'Despesa operacional consolidada',
          icon: TrendingDown,
          iconGradient: 'from-orange-500 via-amber-500 to-orange-600',
          iconShadow: 'shadow-[0_8px_20px_rgba(249,115,22,0.35)]',
          iconRing: 'ring-orange-100/80',
          topBar: 'from-orange-400 to-amber-500',
        },
        {
          label: 'Resultado',
          value: formatCurrency(balancoResultado),
          suffix: 'Receita menos despesa',
          icon: Wallet,
          iconGradient:
            balancoResultado >= 0
              ? 'from-sky-500 via-blue-500 to-indigo-600'
              : 'from-rose-500 via-red-500 to-red-600',
          iconShadow:
            balancoResultado >= 0
              ? 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]'
              : 'shadow-[0_8px_20px_rgba(239,68,68,0.35)]',
          iconRing: balancoResultado >= 0 ? 'ring-blue-100/80' : 'ring-red-100/80',
          topBar: balancoResultado >= 0 ? 'from-sky-400 to-blue-500' : 'from-rose-400 to-red-500',
        },
        {
          label: 'Lucratividade',
          value: `${new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          }).format(lucratividadePercentual)}%`,
          suffix: 'Resultado sobre a receita',
          icon: balancoResultado >= 0 ? TrendingUp : TrendingDown,
          iconGradient:
            balancoResultado >= 0
              ? 'from-emerald-500 via-green-500 to-teal-600'
              : 'from-rose-500 via-red-500 to-red-600',
          iconShadow:
            balancoResultado >= 0
              ? 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]'
              : 'shadow-[0_8px_20px_rgba(239,68,68,0.35)]',
          iconRing: balancoResultado >= 0 ? 'ring-emerald-100/80' : 'ring-red-100/80',
          topBar: balancoResultado >= 0 ? 'from-emerald-400 to-green-500' : 'from-rose-400 to-red-500',
        },
      ]
    },
    [balancoDespesas, balancoReceita, balancoResultado],
  )

  const filteredFechamentos = useMemo(() => {
    let rows = fechamentos
    if (fechamentoStatusFilter !== 'all') {
      rows = rows.filter((row) => row.status === fechamentoStatusFilter)
    }
    if (fechamentoModalidadeFilter !== 'all') {
      rows = rows.filter((row) => row.modalidade === fechamentoModalidadeFilter)
    }
    if (fechamentoCompetenciaFilter !== 'all') {
      rows = rows.filter((row) => row.competencia === fechamentoCompetenciaFilter)
    }
    if (normalizedFechamentoQuery) {
      rows = rows.filter((row) => {
        const haystack = [row.prefeitura, row.contratoNumero, row.competencia, row.modalidade]
          .join(' ')
          .toLowerCase()
        return haystack.includes(normalizedFechamentoQuery)
      })
    }
    return rows
  }, [
    fechamentos,
    fechamentoCompetenciaFilter,
    fechamentoModalidadeFilter,
    fechamentoStatusFilter,
    normalizedFechamentoQuery,
  ])

  const limparReceberFiltros = () => {
    setReceberSearchQuery('')
    setReceberCompetenciaFilter('all')
    setReceberModalidadeFilter('all')
    setReceberUltrapassagemFilter('all')
    setReceberVencimentoFilter('all')
  }

  const limparFechamentoFiltros = () => {
    setFechamentoSearchQuery('')
    setFechamentoStatusFilter('all')
    setFechamentoModalidadeFilter('all')
    setFechamentoCompetenciaFilter('all')
  }

  const limparBalancoFiltros = () => {
    setBalancoCompetenciaFilter('all')
    setBalancoDataInicial('')
    setBalancoDataFinal('')
  }

  const handleBalancoViewModeChange = (value: string) => {
    const mode = value as 'consolidado' | 'competencia' | 'periodo'
    setBalancoViewMode(mode)
    if (mode === 'consolidado') {
      setBalancoCompetenciaFilter('all')
      setBalancoDataInicial('')
      setBalancoDataFinal('')
    }
  }

  const hasBalancoFiltrosAtivos =
    balancoViewMode === 'competencia'
      ? balancoCompetenciaFilter !== 'all'
      : balancoViewMode === 'periodo'
        ? Boolean(balancoDataInicial.trim() || balancoDataFinal.trim())
        : false

  const receberModalidadeOptions = useMemo(() => {
    const modalidades: AdminFechamentoCompetenciaRow['modalidade'][] = [
      'mensal',
      'pacote_fechado',
      'sob_demanda',
    ]
    return [
      { value: 'all', label: 'Todas as modalidades' },
      ...modalidades.map((m) => ({
        value: m,
        label: getContratoModalidadeLabel(m),
      })),
    ]
  }, [])

  const receberCompetenciaOptions = useMemo(() => {
    const unique = new Set(contasReceber.map((f) => f.competencia))
    return [
      { value: 'all', label: 'Todas as competências' },
      ...Array.from(unique).sort((a, b) => (a < b ? 1 : -1)).map((comp) => ({
        value: comp,
        label: comp,
      })),
    ]
  }, [contasReceber])

  const receberVencimentoOptions = useMemo(
    () => [
      { value: 'all', label: 'Todos os status de vencimento' },
      {
        value: 'a_vencer',
        label: adminContaReceberStatusVencimentoLabel.a_vencer,
      },
      { value: 'paga', label: adminContaReceberStatusVencimentoLabel.paga },
      { value: 'atrasada', label: adminContaReceberStatusVencimentoLabel.atrasada },
    ],
    [],
  )

  const receberUltrapassagemOptions = useMemo(
    () => [
      { value: 'all', label: 'Ultrapassagem: todas' },
      { value: 'sim', label: 'Ultrapassagem: sim' },
      { value: 'nao', label: 'Ultrapassagem: não' },
    ],
    [],
  )

  const fechamentoStatusOptions = useMemo(() => {
    const statuses = Object.keys(adminFechamentoCompetenciaStatusLabel) as AdminFechamentoCompetenciaStatus[]
    return [
      { value: 'all', label: 'Todos os status' },
      ...statuses.map((s) => ({
        value: s,
        label: adminFechamentoCompetenciaStatusLabel[s],
      })),
    ]
  }, [])

  const fechamentoModalidadeOptions = useMemo(() => {
    const modalidades: AdminFechamentoCompetenciaRow['modalidade'][] = [
      'mensal',
      'pacote_fechado',
      'sob_demanda',
    ]
    return [
      { value: 'all', label: 'Todas as modalidades' },
      ...modalidades.map((m) => ({
        value: m,
        label: getContratoModalidadeLabel(m),
      })),
    ]
  }, [])

  const selectedFechamento =
    fechamentos.find((item) => item.id === selectedFechamentoId) ?? null
  const isFechamentoDrawerOpen = selectedFechamento !== null && !isFechamentoDrawerClosing

  const handleOpenFechamentoDrawer = (id: string) => {
    setSelectedFechamentoId(id)
    setIsFechamentoDrawerClosing(false)
  }

  const handleCloseFechamentoDrawer = () => {
    if (!selectedFechamento) return
    setIsFechamentoDrawerClosing(true)
  }

  const handleFechamentoDrawerTransitionEnd = () => {
    if (!isFechamentoDrawerClosing) return
    setIsFechamentoDrawerClosing(false)
    setSelectedFechamentoId(null)
  }

  const handleConfirmCloseCompetencia = (id: string) => {
    setFechamentos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'fechado' } : item)),
    )
    handleCloseFechamentoDrawer()
  }

  async function emitirNotaFiscalNaApiFutura(row: AdminFechamentoCompetenciaRow) {
    return new Promise<{ invoiceNumber: string; issuedAt: string }>((resolve) => {
      window.setTimeout(() => {
        resolve({
          invoiceNumber: `NF-${sanitizeFilePart(row.prefeitura).slice(0, 3).toUpperCase()}-${Date.now()
            .toString()
            .slice(-6)}`,
          issuedAt: new Date().toISOString(),
        })
      }, 1100)
    })
  }

  const handleEmitirNotaFiscal = async (row: AdminFechamentoCompetenciaRow) => {
    const current = notaFiscalByFechamentoId[row.id]
    if (current?.status === 'emitting' || current?.status === 'issued') return

    setNotaFiscalByFechamentoId((prev) => ({
      ...prev,
      [row.id]: { status: 'emitting' },
    }))

    try {
      const response = await emitirNotaFiscalNaApiFutura(row)
      setNotaFiscalByFechamentoId((prev) => ({
        ...prev,
        [row.id]: {
          status: 'issued',
          invoiceNumber: response.invoiceNumber,
          issuedAt: response.issuedAt,
        },
      }))
    } catch {
      setNotaFiscalByFechamentoId((prev) => {
        const next = { ...prev }
        delete next[row.id]
        return next
      })
    }
  }

  const handleDownloadNotaFiscal = (row: AdminFechamentoCompetenciaRow) => {
    const notaState = notaFiscalByFechamentoId[row.id]
    if (!notaState || notaState.status !== 'issued') return

    const doc = new jsPDF({
      unit: 'pt',
      format: 'a4',
    })

    const left = 44
    let y = 56
    const lineGap = 20
    const nfNumber = notaState.invoiceNumber ?? `NF-${Date.now().toString().slice(-6)}`

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('Nota Fiscal de Servicos - Telefarmed', left, y)

    y += 28
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text(`Numero da nota: ${nfNumber}`, left, y)
    y += lineGap
    doc.text(`Prefeitura: ${row.prefeitura}`, left, y)
    y += lineGap
    doc.text(`Contrato: ${row.contratoNumero}`, left, y)
    y += lineGap
    doc.text(`Competencia: ${row.competencia}`, left, y)
    y += lineGap
    doc.text(`Tipo de contrato: ${getContratoModalidadeLabel(row.modalidade)}`, left, y)
    y += lineGap
    doc.text(`Ultrapassagem: ${row.excedeuLimite ? 'Sim' : 'Nao'}`, left, y)
    y += lineGap
    doc.text(`Valor base: ${formatCurrency(row.valorBase)}`, left, y)
    y += lineGap
    doc.text(`Excedente: ${formatCurrency(row.valorExcedente)}`, left, y)
    y += lineGap

    doc.setFont('helvetica', 'bold')
    doc.text(`Valor total: ${formatCurrency(row.valorFinal)}`, left, y)

    y += 36
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('Documento emitido para fins de fluxo operacional interno.', left, y)
    if (notaState.issuedAt) {
      y += lineGap
      doc.text(
        `Emitida em: ${new Intl.DateTimeFormat('pt-BR', {
          dateStyle: 'short',
          timeStyle: 'short',
        }).format(new Date(notaState.issuedAt))}`,
        left,
        y,
      )
    }

    const fileName = [
      'nota-fiscal',
      sanitizeFilePart(row.prefeitura),
      sanitizeFilePart(row.competencia),
      sanitizeFilePart(row.contratoNumero),
    ].join('-')

    doc.save(`${fileName}.pdf`)
  }

  const selectedReceberMenuRow = useMemo(
    () => filteredContasReceber.find((row) => row.id === openReceberMenuId) ?? null,
    [filteredContasReceber, openReceberMenuId],
  )
  const selectedReceberNotaState = selectedReceberMenuRow
    ? notaFiscalByFechamentoId[selectedReceberMenuRow.id]
    : undefined

  useLayoutEffect(() => {
    if (!openReceberMenuId) return

    function updatePosition() {
      const trigger = receberMenuTriggerRef.current
      if (!trigger) return false

      const rect = trigger.getBoundingClientRect()
      const menuHeight = receberMenuRef.current?.offsetHeight ?? 0
      const menuWidth = Math.max(
        MENU_MIN_WIDTH_PX,
        receberMenuRef.current?.offsetWidth ?? MENU_MIN_WIDTH_PX,
      )

      let top = rect.bottom + MENU_GAP_PX
      if (menuHeight > 0 && top + menuHeight > window.innerHeight - VIEWPORT_PADDING_PX) {
        top = Math.max(VIEWPORT_PADDING_PX, rect.top - MENU_GAP_PX - menuHeight)
      }

      const left = Math.min(
        Math.max(VIEWPORT_PADDING_PX, rect.right - menuWidth),
        window.innerWidth - menuWidth - VIEWPORT_PADDING_PX,
      )

      setReceberMenuStyle({
        position: 'fixed',
        top,
        left,
        minWidth: MENU_MIN_WIDTH_PX,
        zIndex: 200,
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
  }, [openReceberMenuId])

  useEffect(() => {
    if (!openReceberMenuId) return
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (receberMenuTriggerRef.current?.contains(target)) return
      if (receberMenuRef.current?.contains(target)) return
      setOpenReceberMenuId(null)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenReceberMenuId(null)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [openReceberMenuId])

  useLayoutEffect(() => {
    if (!openPagarMenuId) return

    function updatePosition() {
      const trigger = pagarMenuTriggerRef.current
      if (!trigger) return false

      const rect = trigger.getBoundingClientRect()
      const menuHeight = pagarMenuRef.current?.offsetHeight ?? 0
      const menuWidth = Math.max(MENU_MIN_WIDTH_PX, pagarMenuRef.current?.offsetWidth ?? MENU_MIN_WIDTH_PX)

      let top = rect.bottom + MENU_GAP_PX
      if (menuHeight > 0 && top + menuHeight > window.innerHeight - VIEWPORT_PADDING_PX) {
        top = Math.max(VIEWPORT_PADDING_PX, rect.top - MENU_GAP_PX - menuHeight)
      }

      const left = Math.min(
        Math.max(VIEWPORT_PADDING_PX, rect.right - menuWidth),
        window.innerWidth - menuWidth - VIEWPORT_PADDING_PX,
      )

      setPagarMenuStyle({
        position: 'fixed',
        top,
        left,
        minWidth: MENU_MIN_WIDTH_PX,
        zIndex: 200,
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
  }, [openPagarMenuId])

  useEffect(() => {
    if (!openPagarMenuId) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (pagarMenuTriggerRef.current?.contains(target)) return
      if (pagarMenuRef.current?.contains(target)) return
      setOpenPagarMenuId(null)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenPagarMenuId(null)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [openPagarMenuId])

  useLayoutEffect(() => {
    if (!openBalancoMenuCentroId) return

    function updatePosition() {
      const trigger = balancoMenuTriggerRef.current
      if (!trigger) return false
      const rect = trigger.getBoundingClientRect()
      const menuHeight = balancoMenuRef.current?.offsetHeight ?? 0
      const menuWidth = Math.max(
        MENU_MIN_WIDTH_PX,
        balancoMenuRef.current?.offsetWidth ?? MENU_MIN_WIDTH_PX,
      )

      let top = rect.bottom + MENU_GAP_PX
      if (menuHeight > 0 && top + menuHeight > window.innerHeight - VIEWPORT_PADDING_PX) {
        top = Math.max(VIEWPORT_PADDING_PX, rect.top - MENU_GAP_PX - menuHeight)
      }

      const left = Math.min(
        Math.max(VIEWPORT_PADDING_PX, rect.right - menuWidth),
        window.innerWidth - menuWidth - VIEWPORT_PADDING_PX,
      )

      setBalancoMenuStyle({
        position: 'fixed',
        top,
        left,
        minWidth: MENU_MIN_WIDTH_PX,
        zIndex: 200,
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
  }, [openBalancoMenuCentroId])

  useEffect(() => {
    if (!openBalancoMenuCentroId) return
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (balancoMenuTriggerRef.current?.contains(target)) return
      if (balancoMenuRef.current?.contains(target)) return
      setOpenBalancoMenuCentroId(null)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenBalancoMenuCentroId(null)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [openBalancoMenuCentroId])

  return (
    <div className={dashboardPageShellClass} aria-label="Financeiro">
      <div className={dashboardPageHeaderWrapClass}>
        <AdminPageHeader
          sectionLabel="Gestao"
          title="Financeiro"
          description="Controle financeiro e balanço consolidado"
        />
      </div>

      <div className={dashboardPageScrollAreaClass}>
        <div className={[dashboardPageScrollPaddingClass, 'mt-4 space-y-4 pb-5'].join(' ')}>
          <KpiStatCards items={financeKpis} />

          <section className={[cardSurfaceClass, financeiroMainCardHeightClass, 'flex min-h-0 flex-col overflow-hidden'].join(' ')}>
            <nav
              role="tablist"
              aria-label="Secoes do financeiro"
              className="flex shrink-0 gap-0 border-b border-gray-200 bg-white px-4 sm:px-5"
            >
              {(Object.keys(tabLabels) as FinanceiroTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                  className={[
                    'relative shrink-0 px-4 py-3 text-sm font-semibold transition sm:px-5',
                    activeTab === tab
                      ? 'text-[var(--brand-primary)]'
                      : 'text-gray-500 hover:text-gray-800',
                  ].join(' ')}
                >
                  {tabLabels[tab]}
                  <span
                    className={[
                      'pointer-events-none absolute inset-x-3 bottom-0 h-[3px] rounded-full transition-all duration-200 sm:inset-x-4',
                      activeTab === tab
                        ? 'bg-gradient-to-r from-[var(--brand-primary)] via-orange-500 to-amber-400 opacity-100 shadow-[0_2px_10px_rgba(255,107,0,0.45)]'
                        : 'scale-x-0 opacity-0',
                    ].join(' ')}
                    aria-hidden
                  />
                </button>
              ))}
            </nav>

            {activeTab === 'fechamentos' ? (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Fechamento de faturamento por competência</h2>
                    <p className="text-xs text-gray-500">
                      Consolide consumo, ajustes e valor final antes de gerar nota e enviar cobrança.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-600">
                    <CheckCircle2 className="h-4 w-4" />
                    {formatNumber(filteredFechamentos.length)} competências em acompanhamento
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="relative min-w-0 flex-1">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                      strokeWidth={2}
                    />
                    <input
                      type="search"
                      value={fechamentoSearchQuery}
                      onChange={(event) => setFechamentoSearchQuery(event.target.value)}
                      placeholder="Buscar por prefeitura, contrato ou competência"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/80 py-2 pl-9 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)]/40 focus:bg-white focus:ring-2 focus:ring-[var(--brand-primary)]/15"
                    />
                  </label>

                  <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-2 lg:grid-cols-3">
                    <CustomSelect
                      value={fechamentoCompetenciaFilter}
                      onChange={setFechamentoCompetenciaFilter}
                      options={competenciasOptions}
                      size="compact"
                      className="w-full"
                      menuMinWidthPx={220}
                    />
                    <CustomSelect
                      value={fechamentoStatusFilter}
                      onChange={setFechamentoStatusFilter}
                      options={fechamentoStatusOptions}
                      size="compact"
                      className="w-full"
                      menuMinWidthPx={220}
                    />
                    <CustomSelect
                      value={fechamentoModalidadeFilter}
                      onChange={setFechamentoModalidadeFilter}
                      options={fechamentoModalidadeOptions}
                      size="compact"
                      className="w-full lg:col-span-3"
                      menuMinWidthPx={220}
                    />
                  </div>

                  {(fechamentoSearchQuery.trim() ||
                    fechamentoStatusFilter !== 'all' ||
                    fechamentoModalidadeFilter !== 'all' ||
                    fechamentoCompetenciaFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={limparFechamentoFiltros}
                      className="self-start rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>

                <div className="min-h-0 flex-1 overflow-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Prefeitura</th>
                        <th className="px-4 py-3 text-center">Competência</th>
                        <th className="px-4 py-3 text-center">Contrato</th>
                        <th className="px-4 py-3 text-center">Modalidade</th>
                        <th className="px-4 py-3 text-center">Consumo</th>
                        <th className="px-4 py-3 text-center">Valor final</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFechamentos.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-500">
                            Nenhuma competencia encontrada para os filtros selecionados.
                          </td>
                        </tr>
                      ) : null}

                      {filteredFechamentos.map((row) => (
                        <tr key={row.id} className="border-t border-gray-100 align-top">
                          <td className="px-4 py-3 font-semibold text-gray-900">{row.prefeitura}</td>
                          <td className="px-4 py-3 text-center text-gray-700">{row.competencia}</td>
                          <td className="px-4 py-3 text-center text-gray-700">{row.contratoNumero}</td>
                          <td className="px-4 py-3 text-center text-gray-700">
                            {getContratoModalidadeLabel(row.modalidade)}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-700">
                            {row.consumoPercentual !== null ? `${row.consumoPercentual}%` : 'Sob demanda'}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-gray-900">
                            {formatCurrency(row.valorFinal)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center">
                              <AdminFechamentoCompetenciaStatusBadge status={row.status} />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenFechamentoDrawer(row.id)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary-light)] hover:text-[var(--brand-primary)]"
                                aria-label={`Prévia do fechamento ${row.competencia} — ${row.prefeitura}`}
                                title="Prévia"
                              >
                                <Eye className="h-4 w-4" strokeWidth={2} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenFechamentoDrawer(row.id)}
                                disabled={row.status === 'fechado'}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:bg-transparent disabled:hover:text-gray-500"
                                aria-label={`Fechar competência ${row.competencia} — ${row.prefeitura}`}
                                title="Fechar competência"
                              >
                                <Lock className="h-4 w-4" strokeWidth={2} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {activeTab === 'receber' ? (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Carteira de contas a receber</h2>
                    <p className="text-xs text-gray-500">
                      Títulos a receber gerados a partir de competências fechadas (valor base + excedente + ajustes).
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-600">
                    <Landmark className="h-4 w-4" />
                    {formatNumber(filteredContasReceber.length)} contratos acompanhados
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="relative min-w-0 flex-1">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                      strokeWidth={2}
                    />
                    <input
                      type="search"
                      value={receberSearchQuery}
                      onChange={(event) => setReceberSearchQuery(event.target.value)}
                      placeholder="Buscar por prefeitura, contrato ou competência"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/80 py-2 pl-9 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)]/40 focus:bg-white focus:ring-2 focus:ring-[var(--brand-primary)]/15"
                    />
                  </label>

                  <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-2 lg:grid-cols-4">
                    <CustomSelect
                      value={receberCompetenciaFilter}
                      onChange={setReceberCompetenciaFilter}
                      options={receberCompetenciaOptions}
                      size="compact"
                      className="w-full"
                      menuMinWidthPx={220}
                    />
                    <CustomSelect
                      value={receberModalidadeFilter}
                      onChange={setReceberModalidadeFilter}
                      options={receberModalidadeOptions}
                      size="compact"
                      className="w-full"
                      menuMinWidthPx={220}
                    />
                    <CustomSelect
                      value={receberVencimentoFilter}
                      onChange={(value) =>
                        setReceberVencimentoFilter(value as AdminContaReceberStatusVencimento | 'all')
                      }
                      options={receberVencimentoOptions}
                      size="compact"
                      className="w-full"
                      menuMinWidthPx={220}
                    />
                    <CustomSelect
                      value={receberUltrapassagemFilter}
                      onChange={setReceberUltrapassagemFilter}
                      options={receberUltrapassagemOptions}
                      size="compact"
                      className="w-full"
                      menuMinWidthPx={220}
                    />
                  </div>

                  {(receberSearchQuery.trim() ||
                    receberModalidadeFilter !== 'all' ||
                    receberCompetenciaFilter !== 'all' ||
                    receberUltrapassagemFilter !== 'all' ||
                    receberVencimentoFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={limparReceberFiltros}
                      className="self-start rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>

                <div className="min-h-0 flex-1 overflow-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-4 py-3 text-center">Prefeitura</th>
                        <th className="px-4 py-3 text-center">Contrato</th>
                        <th className="px-4 py-3 text-center">Tipo de contrato</th>
                        <th className="px-4 py-3 text-center">Ultrapassagem</th>
                        <th className="px-4 py-3 text-center">Valor base</th>
                        <th className="px-4 py-3 text-center">Excedente</th>
                        <th className="px-4 py-3 text-center">Valor total</th>
                        <th className="px-4 py-3 text-center">Status de vencimento</th>
                        <th className="px-4 py-3 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContasReceber.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-4 py-12 text-center text-sm text-gray-500">
                            Nenhum contrato encontrado para os filtros selecionados.
                          </td>
                        </tr>
                      ) : null}

                      {filteredContasReceber.map((row) => (
                        <tr key={row.id} className="border-t border-gray-100 align-top">
                          <td className="px-4 py-3 text-center font-semibold text-gray-900">
                            {row.prefeitura}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-700">{row.contratoNumero}</td>
                          <td className="px-4 py-3 text-center text-gray-700">
                            {getContratoModalidadeLabel(row.modalidade)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center">
                              <SituationStatusBadge
                                config={
                                  row.excedeuLimite
                                    ? adminUltrapassagemStatusBadgeConfig.sim
                                    : adminUltrapassagemStatusBadgeConfig.nao
                                }
                                widthClass="w-[7rem]"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-gray-900">
                            {formatCurrency(row.valorBase)}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-gray-900">
                            {formatCurrency(row.valorExcedente)}
                          </td>
                          <td className="px-4 py-3 text-center text-base font-bold text-gray-900">
                            {formatCurrency(row.valorFinal)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center">
                              <SituationStatusBadge
                                config={
                                  adminContaReceberStatusVencimentoBadgeConfig[
                                    getContaReceberStatusVencimento(row)
                                  ]
                                }
                                widthClass={ADMIN_CONTA_RECEBER_STATUS_VENCIMENTO_BADGE_WIDTH}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              ref={openReceberMenuId === row.id ? receberMenuTriggerRef : null}
                              type="button"
                              title="Ações do título"
                              onClick={(event) => {
                                receberMenuTriggerRef.current = event.currentTarget
                                setOpenReceberMenuId((current) => (current === row.id ? null : row.id))
                              }}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                              aria-haspopup="menu"
                              aria-expanded={openReceberMenuId === row.id}
                              aria-label={`Ações para ${row.prefeitura} — ${row.contratoNumero}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {activeTab === 'pagar' ? (
              <div className="grid h-full min-h-0 gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
                <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200">
                  <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-4 py-3">
                    <div>
                      <h2 className="text-sm font-bold text-gray-900">Contas a pagar</h2>
                      <p className="text-xs text-gray-500">
                        Cadastre despesas mensais ou pontuais com vínculo a centro de custo.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCriarContaPagar}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                    >
                      <Plus className="h-4 w-4" />
                      Criar conta a pagar
                    </button>
                  </div>
                  <div className="grid gap-3 border-b border-gray-200 p-4 lg:grid-cols-6">
                    <input
                      className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none ring-0 transition focus:border-[var(--brand-primary)] lg:col-span-2"
                      placeholder="Descrição da despesa"
                      value={contaPagarForm.descricao}
                      onChange={(event) => handleContaPagarFormChange('descricao', event.target.value)}
                    />
                    <select
                      className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--brand-primary)]"
                      value={contaPagarForm.centroCustoId}
                      onChange={(event) => handleContaPagarFormChange('centroCustoId', event.target.value)}
                    >
                      {centrosCusto.map((centro) => (
                        <option key={centro.id} value={centro.id}>
                          {centro.nome}
                        </option>
                      ))}
                    </select>
                    <select
                      className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--brand-primary)]"
                      value={contaPagarForm.recorrencia}
                      onChange={(event) =>
                        handleContaPagarFormChange(
                          'recorrencia',
                          event.target.value as AdminContaPagarRecorrencia,
                        )
                      }
                    >
                      <option value="mensal">Mensal</option>
                      <option value="unica">Unica</option>
                    </select>
                    <input
                      className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--brand-primary)]"
                      placeholder="Valor (ex: 150000)"
                      value={contaPagarForm.valor}
                      onChange={(event) => handleContaPagarFormChange('valor', event.target.value)}
                    />
                    <input
                      className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--brand-primary)]"
                      placeholder="Vencimento"
                      value={contaPagarForm.vencimento}
                      inputMode="numeric"
                      onChange={(event) =>
                        handleContaPagarFormChange('vencimento', maskBirthDate(event.target.value))
                      }
                    />
                  </div>
                  <div className="min-h-0 flex-1 overflow-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                        <tr>
                          <th className="px-4 py-3">Descrição</th>
                          <th className="px-4 py-3 text-center">Centros de custo</th>
                          <th className="px-4 py-3 text-center">Recorrência</th>
                          <th className="px-4 py-3 text-center">Valor</th>
                          <th className="px-4 py-3 text-center">Vencimento</th>
                          <th className="px-4 py-3 text-center">Status</th>
                          <th className="px-4 py-3 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contasPagar.map((row) => (
                          <tr key={row.id} className="border-t border-gray-100">
                            <td className="px-4 py-3 font-medium text-gray-900">{row.descricao}</td>
                            <td className="px-4 py-3 text-center text-gray-700">
                              {resolveCentroCusto(row.centroCustoId)}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-700">
                              {adminContaPagarRecorrenciaLabel[row.recorrencia]}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-gray-900">
                              {formatCurrency(row.valor)}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-700">{row.vencimento}</td>
                            <td className="px-4 py-3 text-center">
                              <SituationStatusBadge
                                config={adminContaPagarStatusBadgeConfig[row.status]}
                                widthClass={ADMIN_CONTA_PAGAR_STATUS_BADGE_WIDTH}
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                                onClick={() => {
                                  setOpenPagarMenuId((prev) => (prev === row.id ? null : row.id))
                                }}
                                ref={openPagarMenuId === row.id ? pagarMenuTriggerRef : null}
                                aria-haspopup="menu"
                                aria-expanded={openPagarMenuId === row.id}
                                aria-label={`Ações para ${row.descricao}`}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <aside className="rounded-xl border border-gray-200 p-4">
                  <h3 className="text-sm font-bold text-gray-900">Centros de custo</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Estruture os gastos da plataforma por area para acompanhar margens.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <input
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--brand-primary)]"
                      placeholder="Novo centro de custo"
                      value={novoCentroNome}
                      onChange={(event) => setNovoCentroNome(event.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleAdicionarCentroCusto}
                      className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      Adicionar
                    </button>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {despesasPorCentro.map((centro) => (
                      <li key={centro.id} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                        <p className="text-sm font-semibold text-gray-800">{centro.nome}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(centro.valor)} em despesas</p>
                      </li>
                    ))}
                  </ul>
                </aside>
              </div>
            ) : null}

            {activeTab === 'balanco' ? (
              <div className="grid h-full min-h-0 gap-4 overflow-auto p-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
                <div className="rounded-xl border border-gray-200 p-4">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Balanço financeiro da operação</h2>
                    <p className="mt-1 text-xs text-gray-500">
                      Receita prevista das prefeituras menos despesas operacionais e administrativas.
                    </p>
                  </div>

                  <div className="mt-4 rounded-xl border border-gray-200/80 bg-slate-50/70 p-3">
                    <div className="flex flex-wrap items-end justify-start gap-3">
                      <label className="w-full min-w-[10.5rem] sm:w-44">
                        <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-600">
                          Visualização
                        </span>
                        <CustomSelect
                          value={balancoViewMode}
                          onChange={handleBalancoViewModeChange}
                          options={[
                            { value: 'consolidado', label: 'Consolidado' },
                            { value: 'competencia', label: 'Por competência' },
                            { value: 'periodo', label: 'Por período' },
                          ]}
                          size="compact"
                          className="w-full"
                          menuMinWidthPx={220}
                        />
                      </label>

                      {balancoViewMode === 'competencia' ? (
                        <label className="w-full min-w-[10.5rem] sm:w-52">
                          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-600">
                            Competência
                          </span>
                          <CustomSelect
                            value={balancoCompetenciaFilter}
                            onChange={setBalancoCompetenciaFilter}
                            options={balancoCompetenciaOptions}
                            size="compact"
                            className="w-full"
                            menuMinWidthPx={220}
                          />
                        </label>
                      ) : null}

                      {balancoViewMode === 'periodo' ? (
                        <>
                          <label className="w-full min-w-[9rem] sm:w-40">
                            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-600">
                              Data inicial
                            </span>
                            <input
                              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
                              placeholder="dd/mm/aaaa"
                              value={balancoDataInicial}
                              inputMode="numeric"
                              onChange={(event) =>
                                setBalancoDataInicial(maskBirthDate(event.target.value))
                              }
                            />
                          </label>
                          <label className="w-full min-w-[9rem] sm:w-40">
                            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-600">
                              Data final
                            </span>
                            <input
                              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
                              placeholder="dd/mm/aaaa"
                              value={balancoDataFinal}
                              inputMode="numeric"
                              onChange={(event) =>
                                setBalancoDataFinal(maskBirthDate(event.target.value))
                              }
                            />
                          </label>
                        </>
                      ) : null}

                      {hasBalancoFiltrosAtivos ? (
                        <button
                          type="button"
                          onClick={limparBalancoFiltros}
                          className="h-10 shrink-0 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                          Limpar
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <KpiStatCards items={balancoKpis} className="mt-4" />

                  <div className="mt-5 overflow-hidden rounded-xl border border-gray-200">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                        <tr>
                          <th className="px-4 py-3">Centro de custo</th>
                          <th className="px-4 py-3 text-right">Despesa consolidada</th>
                          <th className="px-4 py-3 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {balancoDespesasPorCentro.map((centro) => (
                          <tr key={centro.id} className="border-t border-gray-100">
                            <td className="px-4 py-3 font-medium text-gray-800">{centro.nome}</td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900">
                              {formatCurrency(centro.valor)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                                onClick={() =>
                                  setOpenBalancoMenuCentroId((prev) =>
                                    prev === centro.id ? null : centro.id,
                                  )
                                }
                                ref={openBalancoMenuCentroId === centro.id ? balancoMenuTriggerRef : null}
                                aria-haspopup="menu"
                                aria-expanded={openBalancoMenuCentroId === centro.id}
                                aria-label={`Ações para ${centro.nome}`}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <aside className="space-y-4">
                  <article className="rounded-xl border border-gray-200 p-4">
                    <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <Building2 className="h-4 w-4" />
                      Contas a receber em atraso
                    </p>
                    <p className="mt-2 text-2xl font-bold text-red-700">{formatCurrency(totalEmAtrasoReceber)}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Contratos com faturamento vencido sem repasse confirmado.
                    </p>
                  </article>
                  <article className="rounded-xl border border-gray-200 p-4">
                    <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <Wallet className="h-4 w-4" />
                      Contas pagas
                    </p>
                    <p className="mt-2 text-2xl font-bold text-emerald-700">{formatCurrency(balancoDespesasPagas)}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Total liquidado de fornecedores, equipe e estrutura.
                    </p>
                  </article>
                  <article className="rounded-xl border border-gray-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Evolução financeira
                    </p>
                    <div className="mt-3 space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Receita</span>
                          <span>{formatCurrency(balancoReceita)}</span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                          <span className="block h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Despesa</span>
                          <span>{formatCurrency(balancoDespesas)}</span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                          <span
                            className="block h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                            style={{
                              width: `${Math.min(
                                100,
                                balancoReceita > 0
                                  ? (balancoDespesas / balancoReceita) * 100
                                  : 0,
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Resultado</span>
                          <span>{formatCurrency(balancoResultado)}</span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                          <span
                            className={[
                              'block h-full rounded-full',
                              balancoResultado >= 0
                                ? 'bg-gradient-to-r from-sky-400 to-indigo-500'
                                : 'bg-gradient-to-r from-rose-400 to-red-500',
                            ].join(' ')}
                            style={{
                              width: `${Math.min(
                                100,
                                balancoReceita > 0
                                  ? (Math.abs(balancoResultado) / balancoReceita) * 100
                                  : 0,
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </article>
                </aside>
              </div>
            ) : null}
          </section>
        </div>
      </div>

      <AdminBillingClosureDrawer
        open={isFechamentoDrawerOpen}
        closing={isFechamentoDrawerClosing}
        row={selectedFechamento}
        onClose={handleCloseFechamentoDrawer}
        onTransitionEnd={handleFechamentoDrawerTransitionEnd}
        onConfirmCloseCompetencia={handleConfirmCloseCompetencia}
      />

      {openReceberMenuId && receberMenuStyle && selectedReceberMenuRow
        ? createPortal(
            <div
              ref={receberMenuRef}
              role="menu"
              aria-label={`Ações para ${selectedReceberMenuRow.prefeitura}`}
              style={receberMenuStyle}
              className="overflow-hidden rounded-xl border border-gray-200/90 bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
            >
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                onClick={() => requestReceberSecureAction('toggle_paid', selectedReceberMenuRow.id)}
              >
                {selectedReceberMenuRow.statusVencimento === 'paga' ? (
                  <RotateCcw className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={2} />
                ) : (
                  <CheckCircle className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={2} />
                )}
                {selectedReceberMenuRow.statusVencimento === 'paga'
                  ? 'Desmarcar como paga'
                  : 'Marcar como paga'}
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={selectedReceberNotaState?.status === 'emitting'}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={async () => {
                  if (!selectedReceberMenuRow) return
                  if (selectedReceberNotaState?.status === 'issued') return
                  await handleEmitirNotaFiscal(selectedReceberMenuRow)
                  setOpenReceberMenuId(null)
                }}
              >
                {selectedReceberNotaState?.status === 'emitting' ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gray-500" strokeWidth={2} />
                ) : (
                  <Landmark className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={2} />
                )}
                {selectedReceberNotaState?.status === 'emitting'
                  ? 'Emitindo nota fiscal...'
                  : 'Emitir nota fiscal'}
              </button>
              {selectedReceberNotaState?.status === 'issued' ? (
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                  onClick={() => {
                    if (!selectedReceberMenuRow) return
                    handleDownloadNotaFiscal(selectedReceberMenuRow)
                    setOpenReceberMenuId(null)
                  }}
                >
                  <Landmark className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={2} />
                  Download da nota fiscal
                </button>
              ) : null}
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
                onClick={() => {
                  setOpenReceberMenuId(null)
                  setPendingDeleteReceberId(selectedReceberMenuRow.id)
                  setIsDeletePinOpen(true)
                }}
              >
                <Trash2 className="h-4 w-4 shrink-0" strokeWidth={2} />
                Excluir
              </button>
            </div>,
            document.body,
          )
        : null}

      {openPagarMenuId && pagarMenuStyle && selectedPagarMenuRow
        ? createPortal(
            <div
              ref={pagarMenuRef}
              role="menu"
              aria-label={`Ações para ${selectedPagarMenuRow.descricao}`}
              style={pagarMenuStyle}
              className="overflow-hidden rounded-xl border border-gray-200/90 bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
            >
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                onClick={() => requestPagarSecureAction('toggle_paid', selectedPagarMenuRow.id)}
              >
                {selectedPagarMenuRow.status === 'pago' ? (
                  <RotateCcw className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={2} />
                ) : (
                  <CheckCircle className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={2} />
                )}
                {selectedPagarMenuRow.status === 'pago' ? 'Desmarcar como paga' : 'Marcar como paga'}
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                onClick={() => {
                  setViewingContaPagarId(selectedPagarMenuRow.id)
                  setOpenPagarMenuId(null)
                }}
              >
                <Eye className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={2} />
                Visualizar
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                onClick={() => requestPagarSecureAction('edit', selectedPagarMenuRow.id)}
              >
                <Pencil className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={2} />
                Editar
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
                onClick={() => requestPagarSecureAction('delete', selectedPagarMenuRow.id)}
              >
                <Trash2 className="h-4 w-4 shrink-0" strokeWidth={2} />
                Excluir
              </button>
            </div>,
            document.body,
          )
        : null}

      {openBalancoMenuCentroId && balancoMenuStyle && selectedBalancoCentro
        ? createPortal(
            <div
              ref={balancoMenuRef}
              role="menu"
              aria-label={`Ações para ${selectedBalancoCentro.nome}`}
              style={balancoMenuStyle}
              className="overflow-hidden rounded-xl border border-gray-200/90 bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
            >
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                onClick={() => handleOpenEditDespesaConsolidada(selectedBalancoCentro.id)}
              >
                <Pencil className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={2} />
                Editar
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                onClick={() => handleDownloadDespesaConsolidada(selectedBalancoCentro.id)}
              >
                <Download className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={2} />
                Baixar nota fiscal
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
                onClick={() => requestDeleteDespesaConsolidada(selectedBalancoCentro.id)}
              >
                <Trash2 className="h-4 w-4 shrink-0" strokeWidth={2} />
                Excluir
              </button>
            </div>,
            document.body,
          )
        : null}

      {editingDespesaCentro
        ? createPortal(
            <div className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-900/55 p-4">
              <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-[0_20px_40px_rgba(15,23,42,0.2)]">
                <div className="border-b border-gray-100 px-5 py-4">
                  <h3 className="text-base font-semibold text-gray-900">
                    Editar despesa consolidada
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{editingDespesaCentro.nome}</p>
                </div>
                <div className="space-y-3 px-5 py-4">
                  <label className="block space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Valor consolidado
                    </span>
                    <input
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-[var(--brand-primary)]"
                      value={editingDespesaValor}
                      onChange={(event) => setEditingDespesaValor(formatCurrencyInput(event.target.value))}
                      placeholder="R$ 0,00"
                    />
                  </label>
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDespesaCentroId(null)
                      setEditingDespesaValor('')
                    }}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditDespesaConsolidada}
                    className="rounded-xl bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                  >
                    Salvar alterações
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {viewingContaPagar
        ? createPortal(
            <div className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-900/55 p-4">
              <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_20px_40px_rgba(15,23,42,0.2)]">
                <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-orange-50 px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Visualizar conta a pagar</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Confira os dados financeiros antes de executar uma ação.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => setViewingContaPagarId(null)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                        aria-label="Fechar modal"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4 sm:grid-cols-2">
                  <article className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Valor total</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {formatCurrency(viewingContaPagar.valor)}
                    </p>
                  </article>
                  <article className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vencimento</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{viewingContaPagar.vencimento}</p>
                  </article>
                </div>

                <dl className="grid gap-3 px-5 py-4 text-sm sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:col-span-2">
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Descrição</dt>
                    <dd className="mt-1 font-semibold text-slate-900">{viewingContaPagar.descricao}</dd>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-center">
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Centro de custo</dt>
                    <dd className="mt-1 flex items-center justify-center gap-2 font-medium text-slate-900">
                      <Building2 className="h-4 w-4 text-slate-500" />
                      {resolveCentroCusto(viewingContaPagar.centroCustoId)}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-center">
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Recorrência</dt>
                    <dd className="mt-1 flex items-center justify-center gap-2 font-medium text-slate-900">
                      <RotateCcw className="h-4 w-4 text-slate-500" />
                      {adminContaPagarRecorrenciaLabel[viewingContaPagar.recorrencia]}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-center">
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Status</dt>
                    <dd className="mt-2 flex justify-center">
                      <SituationStatusBadge
                        config={adminContaPagarStatusBadgeConfig[viewingContaPagar.status]}
                        widthClass={ADMIN_CONTA_PAGAR_STATUS_BADGE_WIDTH}
                      />
                    </dd>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-center">
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Categoria</dt>
                    <dd className="mt-1 flex items-center justify-center gap-2 font-medium text-slate-900">
                      <Wallet className="h-4 w-4 text-slate-500" />
                      Conta operacional
                    </dd>
                  </div>
                </dl>

              </div>
            </div>,
            document.body,
          )
        : null}

      {editingContaPagar && editingContaPagarForm
        ? createPortal(
            <div className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-900/55 p-4">
              <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_20px_40px_rgba(15,23,42,0.2)]">
                <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-orange-50 px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Editar conta a pagar</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Atualize os dados da despesa e salve as mudanças.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={closeEditContaPagarModal}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                      aria-label="Fechar modal"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="grid gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4 sm:grid-cols-2">
                  <article className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Valor informado
                    </p>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {editingContaPagarForm.valor || 'R$ 0,00'}
                    </p>
                  </article>
                  <article className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vencimento</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {editingContaPagarForm.vencimento || '--/--/----'}
                    </p>
                  </article>
                </div>
                <div className="grid gap-3 px-5 py-4 sm:grid-cols-2">
                  <label className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Descrição
                    </span>
                    <input
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--brand-primary)]"
                      placeholder="Descrição da despesa"
                      value={editingContaPagarForm.descricao}
                      onChange={(event) =>
                        setEditingContaPagarForm((prev) =>
                          prev ? { ...prev, descricao: event.target.value } : prev,
                        )
                      }
                    />
                  </label>
                  <label className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Centro de custo
                    </span>
                    <CustomSelect
                      value={editingContaPagarForm.centroCustoId}
                      onChange={(value) =>
                        setEditingContaPagarForm((prev) => (prev ? { ...prev, centroCustoId: value } : prev))
                      }
                      options={centrosCusto.map((centro) => ({ value: centro.id, label: centro.nome }))}
                      size="compact"
                      className="w-full"
                      menuMinWidthPx={260}
                    />
                  </label>
                  <label className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Recorrência
                    </span>
                    <CustomSelect
                      value={editingContaPagarForm.recorrencia}
                      onChange={(value) =>
                        setEditingContaPagarForm((prev) =>
                          prev
                            ? {
                                ...prev,
                                recorrencia: value as AdminContaPagarRecorrencia,
                              }
                            : prev,
                        )
                      }
                      options={[
                        { value: 'mensal', label: 'Mensal' },
                        { value: 'unica', label: 'Única' },
                      ]}
                      size="compact"
                      className="w-full"
                      menuMinWidthPx={220}
                    />
                  </label>
                  <label className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Valor
                    </span>
                    <input
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--brand-primary)]"
                      placeholder="R$ 0,00"
                      value={editingContaPagarForm.valor}
                      onChange={(event) =>
                        setEditingContaPagarForm((prev) =>
                          prev ? { ...prev, valor: formatCurrencyInput(event.target.value) } : prev,
                        )
                      }
                    />
                  </label>
                  <label className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Vencimento
                    </span>
                    <input
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--brand-primary)]"
                      placeholder="Vencimento"
                      value={editingContaPagarForm.vencimento}
                      inputMode="numeric"
                      onChange={(event) =>
                        setEditingContaPagarForm((prev) =>
                          prev ? { ...prev, vencimento: maskBirthDate(event.target.value) } : prev,
                        )
                      }
                    />
                  </label>
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4">
                  <button
                    type="button"
                    onClick={handleSaveContaPagarEdits}
                    className="rounded-xl bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                  >
                    Salvar alterações
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      <PinUnlockModal
        open={isReceberPinOpen}
        onClose={() => {
          setIsReceberPinOpen(false)
          setPendingReceberSecureAction(null)
        }}
        onSuccess={handleReceberSecureActionSuccess}
        title={
          pendingReceberSecureRow?.statusVencimento === 'paga'
            ? 'Desmarcar conta como paga'
            : 'Marcar conta como paga'
        }
        titleId="admin-financeiro-receber-pin-title"
        description="Para alterar o status de vencimento desta conta a receber, confirme com a senha de 6 dígitos."
        submitLabel="Confirmar ação"
        pinCompleteHint="Senha completa. Toque em confirmar ação."
        icon={Lock}
      />

      <PinUnlockModal
        open={isDeletePinOpen}
        onClose={() => {
          setIsDeletePinOpen(false)
          setPendingDeleteReceberId(null)
        }}
        onSuccess={() => {
          if (!pendingDeleteReceberId) return
          setFechamentos((prev) => prev.filter((item) => item.id !== pendingDeleteReceberId))
          setNotaFiscalByFechamentoId((prev) => {
            const next = { ...prev }
            delete next[pendingDeleteReceberId]
            return next
          })
          setIsDeletePinOpen(false)
          setPendingDeleteReceberId(null)
        }}
        title="Excluir conta a receber"
        titleId="admin-financeiro-delete-receber-pin-title"
        description="Para excluir este título a receber, informe a senha de 6 dígitos. Esta ação não pode ser desfeita."
        submitLabel="Confirmar exclusão"
        pinCompleteHint="Senha completa. Toque em confirmar exclusão."
        icon={Trash2}
      />

      <PinUnlockModal
        open={isPagarPinOpen}
        onClose={() => {
          setIsPagarPinOpen(false)
          setPendingPagarSecureAction(null)
        }}
        onSuccess={handlePagarSecureActionSuccess}
        title={
          pendingPagarSecureAction?.type === 'delete'
            ? 'Excluir conta a pagar'
            : pendingPagarSecureAction?.type === 'edit'
              ? 'Editar conta a pagar'
              : pendingPagarSecureRow?.status === 'pago'
                ? 'Desmarcar conta como paga'
                : 'Marcar conta como paga'
        }
        titleId="admin-financeiro-pagar-pin-title"
        description={
          pendingPagarSecureAction?.type === 'delete'
            ? 'Para excluir esta conta a pagar, informe a senha de 6 dígitos. Esta ação não pode ser desfeita.'
            : pendingPagarSecureAction?.type === 'edit'
              ? 'Para editar esta conta a pagar, confirme com a senha de 6 dígitos.'
              : 'Para alterar o status financeiro desta conta, confirme com a senha de 6 dígitos.'
        }
        submitLabel="Confirmar ação"
        pinCompleteHint="Senha completa. Toque em confirmar ação."
        icon={Lock}
      />

      <PinUnlockModal
        open={isBalancoDeletePinOpen}
        onClose={() => {
          setIsBalancoDeletePinOpen(false)
          setPendingDeleteBalancoCentroId(null)
        }}
        onSuccess={() => {
          if (!pendingDeleteBalancoCentroId) return
          handleDeleteDespesaConsolidada(pendingDeleteBalancoCentroId)
          setIsBalancoDeletePinOpen(false)
          setPendingDeleteBalancoCentroId(null)
        }}
        title="Excluir despesa consolidada"
        titleId="admin-financeiro-delete-balanco-pin-title"
        description={`Para excluir a despesa consolidada${pendingDeleteBalancoCentro ? ` de ${pendingDeleteBalancoCentro.nome}` : ''}, informe a senha de 6 dígitos.`}
        submitLabel="Confirmar exclusão"
        pinCompleteHint="Senha completa. Toque em confirmar exclusão."
        icon={Trash2}
      />

      <AdminContaPagarCadastroDrawer
        open={isContaPagarDrawerOpen}
        closing={isContaPagarDrawerClosing}
        fornecedores={fornecedores}
        contasPagar={contasPagar}
        centrosCusto={centrosCusto}
        onClose={handleCloseContaPagarDrawer}
        onTransitionEnd={handleContaPagarDrawerTransitionEnd}
        onCreateFornecedor={handleCreateFornecedor}
        onUpdateFornecedor={handleUpdateFornecedor}
        onDeleteFornecedor={handleDeleteFornecedor}
        onCreateContaPagar={handleCreateContaPagarByDrawer}
      />

      <Toast
        message={editSuccessToast ?? ''}
        visible={Boolean(editSuccessToast)}
        variant="success"
        onClose={() => setEditSuccessToast(null)}
      />
      <Toast
        message={balancoToast ?? ''}
        visible={Boolean(balancoToast)}
        variant="success"
        onClose={() => setBalancoToast(null)}
      />
    </div>
  )
}
