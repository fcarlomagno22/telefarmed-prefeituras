import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { CrmPartnersParceiroDetailDrawer } from '../components/crmPartners/parceiros/CrmPartnersParceiroDetailDrawer'
import { CrmPartnersParceiroFormDrawer } from '../components/crmPartners/parceiros/CrmPartnersParceiroFormDrawer'
import { CrmPartnersParceirosMainPanel } from '../components/crmPartners/parceiros/CrmPartnersParceirosMainPanel'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollAreaClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Toast, type ToastVariant } from '../components/ui/Toast'
import { useCrmPartnersParceirosPage } from '../hooks/useCrmPartnersParceirosPage'
import type {
  CrmPartnersParceiroAction,
  CrmPartnersParceiroFormValues,
  CrmPartnersParceiroRow,
} from '../types/crmPartnersParceiros'

type DrawerState =
  | { kind: 'closed' }
  | { kind: 'detail'; parceiroId: string; closing?: boolean }
  | { kind: 'form'; mode: 'create' | 'edit'; parceiroId?: string; closing?: boolean }

type ConfirmState =
  | { open: false }
  | {
      open: true
      parceiro: CrmPartnersParceiroRow
      action: 'inactivate' | 'activate'
    }

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

export function CrmPartnersParceirosPage() {
  const {
    parceiros,
    getDetail,
    createParceiro,
    updateParceiro,
    setParceiroStatus,
    emptyFormValues,
    formValuesFromParceiro,
  } = useCrmPartnersParceirosPage()

  const [drawerState, setDrawerState] = useState<DrawerState>({ kind: 'closed' })
  const [openMenuParceiroId, setOpenMenuParceiroId] = useState<string | null>(null)
  const [confirmState, setConfirmState] = useState<ConfirmState>({ open: false })
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)

  const { requestClose, handleTransitionEnd } = useDrawerTransition(drawerState, setDrawerState)

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    setToast(null)
    requestAnimationFrame(() => setToast({ message, variant }))
  }, [])

  const detail = useMemo(() => {
    if (drawerState.kind !== 'detail') return null
    return getDetail(drawerState.parceiroId)
  }, [drawerState, getDetail])

  const formInitialValues = useMemo((): CrmPartnersParceiroFormValues => {
    if (drawerState.kind !== 'form') return emptyFormValues()
    if (drawerState.mode === 'create') return emptyFormValues()
    const parceiro = parceiros.find((item) => item.id === drawerState.parceiroId)
    return parceiro ? formValuesFromParceiro(parceiro) : emptyFormValues()
  }, [drawerState, parceiros, emptyFormValues, formValuesFromParceiro])

  function handleParceiroAction(parceiro: CrmPartnersParceiroRow, action: CrmPartnersParceiroAction) {
    setOpenMenuParceiroId(null)

    if (action === 'view') {
      setDrawerState({ kind: 'detail', parceiroId: parceiro.id })
      return
    }

    if (action === 'edit') {
      setDrawerState({ kind: 'form', mode: 'edit', parceiroId: parceiro.id })
      return
    }

    if (action === 'inactivate' || action === 'activate') {
      setConfirmState({
        open: true,
        parceiro,
        action: action === 'inactivate' ? 'inactivate' : 'activate',
      })
    }
  }

  function handleConfirmStatusChange() {
    if (!confirmState.open) return

    const nextStatus = confirmState.action === 'inactivate' ? 'inativo' : 'ativo'
    setParceiroStatus(confirmState.parceiro.id, nextStatus)
    setConfirmState({ open: false })
    showToast(
      nextStatus === 'inativo'
        ? `${confirmState.parceiro.nome} foi inativado.`
        : `${confirmState.parceiro.nome} foi reativado.`,
    )
  }

  function handleFormSubmit(values: CrmPartnersParceiroFormValues) {
    if (drawerState.kind !== 'form') return

    if (drawerState.mode === 'create') {
      const created = createParceiro(values)
      setDrawerState({ kind: 'closed' })
      showToast(`${created.nome} cadastrado com sucesso.`)
      return
    }

    if (!drawerState.parceiroId) return
    const updated = updateParceiro(drawerState.parceiroId, values)
    setDrawerState({ kind: 'closed' })
    showToast(updated ? `${updated.nome} atualizado com sucesso.` : 'Parceiro atualizado.')
  }

  const detailParceiroId = drawerState.kind === 'detail' ? drawerState.parceiroId : null

  return (
    <>
      <div className={dashboardPageShellClass} aria-label="Parceiros CRM Partners">
        <div className={dashboardPageHeaderWrapClass}>
          <header>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
              CRM Partners
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-[1.65rem]">
              Parceiros
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Lista de vendedores e indicadores da rede comercial Telefarmed.
            </p>
          </header>
        </div>

        <div className={[dashboardPageScrollAreaClass, dashboardPageScrollPaddingClass, 'mt-4'].join(' ')}>
          <CrmPartnersParceirosMainPanel
            parceiros={parceiros}
            openMenuParceiroId={openMenuParceiroId}
            onToggleMenu={(parceiroId) =>
              setOpenMenuParceiroId((current) => (current === parceiroId ? null : parceiroId))
            }
            onCloseMenu={() => setOpenMenuParceiroId(null)}
            onAction={handleParceiroAction}
            onNewParceiro={() => setDrawerState({ kind: 'form', mode: 'create' })}
          />
        </div>
      </div>

      <CrmPartnersParceiroDetailDrawer
        open={drawerState.kind === 'detail'}
        closing={drawerState.kind === 'detail' && Boolean(drawerState.closing)}
        detail={detail}
        onClose={requestClose}
        onTransitionEnd={handleTransitionEnd}
        onEdit={() => {
          if (!detailParceiroId) return
          setDrawerState({ kind: 'form', mode: 'edit', parceiroId: detailParceiroId })
        }}
        onToggleStatus={() => {
          if (!detail) return
          setConfirmState({
            open: true,
            parceiro: detail.parceiro,
            action: detail.parceiro.status === 'ativo' ? 'inactivate' : 'activate',
          })
        }}
      />

      <CrmPartnersParceiroFormDrawer
        open={drawerState.kind === 'form'}
        closing={drawerState.kind === 'form' && Boolean(drawerState.closing)}
        mode={drawerState.kind === 'form' ? drawerState.mode : 'create'}
        initialValues={formInitialValues}
        onClose={requestClose}
        onTransitionEnd={handleTransitionEnd}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={confirmState.open}
        title={
          confirmState.open && confirmState.action === 'inactivate'
            ? 'Inativar parceiro'
            : 'Reativar parceiro'
        }
        description={
          confirmState.open
            ? confirmState.action === 'inactivate'
              ? `Deseja inativar ${confirmState.parceiro.nome}? O parceiro deixará de aparecer como ativo na rede.`
              : `Deseja reativar ${confirmState.parceiro.nome}?`
            : ''
        }
        confirmLabel={confirmState.open && confirmState.action === 'inactivate' ? 'Inativar' : 'Reativar'}
        tone={confirmState.open && confirmState.action === 'inactivate' ? 'danger' : 'default'}
        onConfirm={handleConfirmStatusChange}
        onCancel={() => setConfirmState({ open: false })}
      />

      {toast ? (
        <Toast
          message={toast.message}
          variant={toast.variant}
          visible
          onClose={() => setToast(null)}
        />
      ) : null}
    </>
  )
}
