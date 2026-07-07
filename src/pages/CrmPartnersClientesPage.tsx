import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { CrmPartnersClienteDetailDrawer } from '../components/crmPartners/clientes/CrmPartnersClienteDetailDrawer'
import { CrmPartnersClienteFormDrawer } from '../components/crmPartners/clientes/CrmPartnersClienteFormDrawer'
import { CrmPartnersClienteParticipacaoDrawer } from '../components/crmPartners/clientes/CrmPartnersClienteParticipacaoDrawer'
import { CrmPartnersClienteTrocarParceiroDrawer } from '../components/crmPartners/clientes/CrmPartnersClienteTrocarParceiroDrawer'
import { CrmPartnersClientesMainPanel } from '../components/crmPartners/clientes/CrmPartnersClientesMainPanel'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollAreaClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import { Toast, type ToastVariant } from '../components/ui/Toast'
import { useCrmPartnersClientesPage } from '../hooks/useCrmPartnersClientesPage'
import type {
  CrmPartnersClienteAction,
  CrmPartnersClienteFormValues,
  CrmPartnersClienteParticipacaoFormValues,
  CrmPartnersClienteRow,
  CrmPartnersClienteTrocarParceiroFormValues,
} from '../types/crmPartnersClientes'

type DrawerState =
  | { kind: 'closed' }
  | { kind: 'detail'; clienteId: string; closing?: boolean }
  | { kind: 'form'; closing?: boolean }
  | { kind: 'participacao'; clienteId: string; closing?: boolean }
  | { kind: 'trocar_parceiro'; clienteId: string; closing?: boolean }

function useDrawerTransition(
  state: DrawerState,
  setState: Dispatch<SetStateAction<DrawerState>>,
) {
  const requestClose = useCallback(() => {
    setState((current) => {
      if (current.kind === 'closed') return current
      return { ...current, closing: true }
    })
  }, [setState])

  const handleTransitionEnd = useCallback(() => {
    setState((current) => {
      if (!('closing' in current) || !current.closing) return current
      return { kind: 'closed' }
    })
  }, [setState])

  return { requestClose, handleTransitionEnd }
}

export function CrmPartnersClientesPage() {
  const {
    clientes,
    parceiroOptions,
    getDetail,
    getClienteById,
    createCliente,
    defineParticipacao,
    trocarParceiro,
    emptyClienteFormValues,
    emptyParticipacaoFormValues,
    participacaoFormFromConfig,
    emptyParticipacaoLinha,
    emptyTrocarParceiroFormValues,
  } = useCrmPartnersClientesPage()

  const [drawerState, setDrawerState] = useState<DrawerState>({ kind: 'closed' })
  const [openMenuClienteId, setOpenMenuClienteId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)

  const { requestClose, handleTransitionEnd } = useDrawerTransition(drawerState, setDrawerState)

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    setToast(null)
    requestAnimationFrame(() => setToast({ message, variant }))
  }, [])

  const activeClienteId =
    drawerState.kind === 'detail' ||
    drawerState.kind === 'participacao' ||
    drawerState.kind === 'trocar_parceiro'
      ? drawerState.clienteId
      : null

  const detail = useMemo(() => {
    if (!activeClienteId) return null
    return getDetail(activeClienteId)
  }, [activeClienteId, getDetail])

  const participacaoInitialValues = useMemo((): CrmPartnersClienteParticipacaoFormValues => {
    if (drawerState.kind !== 'participacao') return emptyParticipacaoFormValues()
    const item = getDetail(drawerState.clienteId)
    const indicadorId = item?.cliente.parceiroIndicadorId ?? ''
    return participacaoFormFromConfig(item?.participacao ?? null, indicadorId)
  }, [drawerState, getDetail, emptyParticipacaoFormValues, participacaoFormFromConfig])

  function handleClienteAction(cliente: CrmPartnersClienteRow, action: CrmPartnersClienteAction) {
    setOpenMenuClienteId(null)

    if (action === 'view') {
      setDrawerState({ kind: 'detail', clienteId: cliente.id })
      return
    }
    if (action === 'define_participacao') {
      setDrawerState({ kind: 'participacao', clienteId: cliente.id })
      return
    }
    if (action === 'change_partner') {
      setDrawerState({ kind: 'trocar_parceiro', clienteId: cliente.id })
    }
  }

  function handleCreateCliente(values: CrmPartnersClienteFormValues) {
    const created = createCliente(values)
    setDrawerState({ kind: 'closed' })
    showToast(`${created.razaoSocial} cadastrado com sucesso.`)
  }

  function handleDefineParticipacao(values: CrmPartnersClienteParticipacaoFormValues) {
    if (drawerState.kind !== 'participacao') return
    defineParticipacao(drawerState.clienteId, values)
    setDrawerState({ kind: 'closed' })
    showToast('Participação dos parceiros salva com sucesso.')
  }

  function handleTrocarParceiro(values: CrmPartnersClienteTrocarParceiroFormValues) {
    if (drawerState.kind !== 'trocar_parceiro') return
    const nome = trocarParceiro(drawerState.clienteId, values)
    setDrawerState({ kind: 'closed' })
    showToast(nome ? `Parceiro indicador alterado para ${nome}.` : 'Parceiro indicador atualizado.')
  }

  return (
    <>
      <div className={dashboardPageShellClass} aria-label="Clientes CRM Partners">
        <div className={dashboardPageHeaderWrapClass}>
          <header>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
              CRM Partners
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-[1.65rem]">
              Clientes
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Cadastro unificado de clientes indicados e participação dos parceiros na operação.
            </p>
          </header>
        </div>

        <div className={[dashboardPageScrollAreaClass, dashboardPageScrollPaddingClass, 'mt-4'].join(' ')}>
          <CrmPartnersClientesMainPanel
            clientes={clientes}
            openMenuClienteId={openMenuClienteId}
            onToggleMenu={(clienteId) =>
              setOpenMenuClienteId((current) => (current === clienteId ? null : clienteId))
            }
            onCloseMenu={() => setOpenMenuClienteId(null)}
            onAction={handleClienteAction}
            onNewCliente={() => setDrawerState({ kind: 'form' })}
          />
        </div>
      </div>

      <CrmPartnersClienteDetailDrawer
        open={drawerState.kind === 'detail'}
        closing={drawerState.kind === 'detail' && Boolean(drawerState.closing)}
        detail={detail}
        onClose={requestClose}
        onTransitionEnd={handleTransitionEnd}
        onDefineParticipacao={() => {
          if (!activeClienteId) return
          setDrawerState({ kind: 'participacao', clienteId: activeClienteId })
        }}
        onTrocarParceiro={() => {
          if (!activeClienteId) return
          setDrawerState({ kind: 'trocar_parceiro', clienteId: activeClienteId })
        }}
      />

      <CrmPartnersClienteFormDrawer
        open={drawerState.kind === 'form'}
        closing={drawerState.kind === 'form' && Boolean(drawerState.closing)}
        initialValues={emptyClienteFormValues()}
        parceiroOptions={parceiroOptions}
        onClose={requestClose}
        onTransitionEnd={handleTransitionEnd}
        onSubmit={handleCreateCliente}
      />

      <CrmPartnersClienteParticipacaoDrawer
        open={drawerState.kind === 'participacao'}
        closing={drawerState.kind === 'participacao' && Boolean(drawerState.closing)}
        clienteNome={detail?.cliente.razaoSocial ?? getClienteById(drawerState.kind === 'participacao' ? drawerState.clienteId : '')?.razaoSocial ?? ''}
        parceiroOptions={parceiroOptions}
        initialValues={participacaoInitialValues}
        onCreateLinha={() => emptyParticipacaoLinha()}
        onClose={requestClose}
        onTransitionEnd={handleTransitionEnd}
        onSubmit={handleDefineParticipacao}
      />

      <CrmPartnersClienteTrocarParceiroDrawer
        open={drawerState.kind === 'trocar_parceiro'}
        closing={drawerState.kind === 'trocar_parceiro' && Boolean(drawerState.closing)}
        detail={detail}
        parceiroOptions={parceiroOptions}
        initialValues={emptyTrocarParceiroFormValues()}
        onClose={requestClose}
        onTransitionEnd={handleTransitionEnd}
        onSubmit={handleTrocarParceiro}
      />

      {toast ? (
        <Toast message={toast.message} variant={toast.variant} visible onClose={() => setToast(null)} />
      ) : null}
    </>
  )
}
