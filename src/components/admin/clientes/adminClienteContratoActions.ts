import type { AdminClienteContrato, AdminClienteContratoStatus } from '../../../data/adminClientesMock'

export type AdminClienteContratoAction = 'suspender' | 'reativar' | 'encerrar'

export function getContratoActionOptions(
  status: AdminClienteContratoStatus,
): { action: AdminClienteContratoAction; label: string }[] {
  if (status === 'suspenso') {
    return [
      { action: 'reativar', label: 'Reativar' },
      { action: 'encerrar', label: 'Encerrar' },
    ]
  }

  if (status === 'encerrado') {
    return [{ action: 'reativar', label: 'Reativar' }]
  }

  return [
    { action: 'suspender', label: 'Suspender' },
    { action: 'encerrar', label: 'Encerrar' },
  ]
}

export function applyContratoAction(
  contrato: AdminClienteContrato,
  action: AdminClienteContratoAction,
): AdminClienteContrato {
  if (action === 'suspender') {
    return { ...contrato, status: 'suspenso' }
  }
  if (action === 'reativar') {
    return { ...contrato, status: 'ativo' }
  }
  return { ...contrato, status: 'encerrado' }
}

export function formatContratoUtilizacao(contrato: AdminClienteContrato): string {
  if (contrato.tipo === 'sob_demanda') {
    const total = contrato.consultasRealizadas ?? 0
    return `${new Intl.NumberFormat('pt-BR').format(total)} consultas realizadas`
  }

  const percent = contrato.percentualUtilizado ?? 0
  if (contrato.tipo === 'mensal') {
    return `${percent}% do volume mensal utilizado`
  }

  return `${percent}% do pacote utilizado`
}
