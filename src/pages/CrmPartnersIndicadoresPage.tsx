import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import {
  CrmPartnersIndicadorDetailDrawer,
  type CrmPartnersIndicadorDrawerAction,
} from '../components/crmPartners/indicadores/CrmPartnersIndicadorDetailDrawer'
import { CrmPartnersIndicadoresMainPanel } from '../components/crmPartners/indicadores/CrmPartnersIndicadoresMainPanel'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollAreaClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import { Toast, type ToastVariant } from '../components/ui/Toast'
import { useCrmPartnersIndicadoresPage } from '../hooks/useCrmPartnersIndicadoresPage'
import type { CrmPartnersIndicadorRow } from '../types/crmPartnersIndicadores'

type DrawerState =
  | { kind: 'closed' }
  | { kind: 'detail'; indicadorId: string; closing?: boolean }

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

const actionMessages: Record<Exclude<CrmPartnersIndicadorDrawerAction, 'ver_calculo'>, string> = {
  cadastrar_parceiro: 'Cadastro de parceiro em breve neste fluxo.',
  registrar_repasse: 'Registro de repasse salvo com sucesso.',
  baixar_comprovante: 'Download do comprovante iniciado.',
}

export function CrmPartnersIndicadoresPage() {
  const { rows, kpiCards, getDetail, marcarNfEmitida, anexarNotaFiscal } =
    useCrmPartnersIndicadoresPage()
  const [drawerState, setDrawerState] = useState<DrawerState>({ kind: 'closed' })
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)

  const { requestClose, handleTransitionEnd } = useDrawerTransition(drawerState, setDrawerState)

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    setToast(null)
    requestAnimationFrame(() => setToast({ message, variant }))
  }, [])

  const activeIndicadorId = drawerState.kind === 'detail' ? drawerState.indicadorId : null

  const detail = useMemo(() => {
    if (!activeIndicadorId) return null
    return getDetail(activeIndicadorId)
  }, [activeIndicadorId, getDetail])

  function handleRowClick(row: CrmPartnersIndicadorRow) {
    setDrawerState({ kind: 'detail', indicadorId: row.id })
  }

  function handleDrawerAction(action: CrmPartnersIndicadorDrawerAction) {
    if (action === 'ver_calculo') return
    showToast(actionMessages[action])
  }

  function handleConfirmarNfEmitida() {
    if (!activeIndicadorId) return
    marcarNfEmitida(activeIndicadorId)
    showToast('Nota fiscal marcada como emitida. Agora você pode anexar o arquivo.')
  }

  function handleAnexarNf(file: File) {
    if (!activeIndicadorId) return
    anexarNotaFiscal(activeIndicadorId, file)
    showToast(`Nota fiscal "${file.name}" anexada com sucesso.`)
  }

  return (
    <>
      <div className={dashboardPageShellClass} aria-label="Financeiro CRM Partners">
        <div className={dashboardPageHeaderWrapClass}>
          <header>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
              CRM Partners
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-[1.65rem]">
              Financeiro
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Acompanhe comissões, emita e anexe notas fiscais e gerencie repasses aos parceiros.
            </p>
          </header>
        </div>

        <div className={[dashboardPageScrollAreaClass, dashboardPageScrollPaddingClass, 'mt-4'].join(' ')}>
          <CrmPartnersIndicadoresMainPanel
            rows={rows}
            kpiCards={kpiCards}
            onRowClick={handleRowClick}
          />
        </div>
      </div>

      <CrmPartnersIndicadorDetailDrawer
        open={drawerState.kind === 'detail'}
        closing={drawerState.kind === 'detail' && Boolean(drawerState.closing)}
        detail={detail}
        onClose={requestClose}
        onTransitionEnd={handleTransitionEnd}
        onConfirmarNfEmitida={handleConfirmarNfEmitida}
        onAnexarNf={handleAnexarNf}
        onAction={handleDrawerAction}
      />

      {toast ? (
        <Toast message={toast.message} variant={toast.variant} visible onClose={() => setToast(null)} />
      ) : null}
    </>
  )
}
