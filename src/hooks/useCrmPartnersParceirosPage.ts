import { useCallback, useMemo, useState } from 'react'
import {
  buildCrmPartnersParceiroDetail,
  buildCrmPartnersParceirosMock,
} from '../data/crmPartnersParceirosMock'
import type {
  CrmPartnersParceiroDetail,
  CrmPartnersParceiroFormValues,
  CrmPartnersParceiroRow,
} from '../types/crmPartnersParceiros'

function emptyFormValues(): CrmPartnersParceiroFormValues {
  return {
    nome: '',
    documento: '',
    documentoTipo: 'cpf',
    telefone: '',
    email: '',
    comissaoPadraoPercentual: '',
    banco: '',
    agencia: '',
    conta: '',
    pixKey: '',
    pixKeyType: 'cpf',
  }
}

function formValuesFromParceiro(parceiro: CrmPartnersParceiroRow): CrmPartnersParceiroFormValues {
  return {
    nome: parceiro.nome,
    documento: parceiro.documento,
    documentoTipo: parceiro.documentoTipo,
    telefone: parceiro.telefone,
    email: parceiro.email,
    comissaoPadraoPercentual:
      parceiro.comissaoPadraoPercentual != null ? String(parceiro.comissaoPadraoPercentual) : '',
    banco: parceiro.bank.banco,
    agencia: parceiro.bank.agencia,
    conta: parceiro.bank.conta,
    pixKey: parceiro.bank.pixKey,
    pixKeyType: parceiro.bank.pixKeyType,
  }
}

function createParceiroFromForm(
  values: CrmPartnersParceiroFormValues,
  existing?: CrmPartnersParceiroRow,
): CrmPartnersParceiroRow {
  const documento = values.documento.replace(/\D/g, '')
  const telefone = values.telefone.replace(/\D/g, '')
  const comissaoPadrao = values.comissaoPadraoPercentual.trim()
    ? Number(values.comissaoPadraoPercentual.replace(',', '.'))
    : null

  return {
    id: existing?.id ?? `partner-${Date.now()}`,
    nome: values.nome.trim(),
    documento,
    documentoTipo: values.documentoTipo,
    telefone,
    email: values.email.trim(),
    status: existing?.status ?? 'ativo',
    clientesIndicados: existing?.clientesIndicados ?? 0,
    comissaoAcumulada: existing?.comissaoAcumulada ?? 0,
    comissaoPadraoPercentual: Number.isFinite(comissaoPadrao) ? comissaoPadrao : null,
    bank: {
      banco: values.banco.trim(),
      agencia: values.agencia.trim(),
      conta: values.conta.trim(),
      pixKey: values.pixKey.trim(),
      pixKeyType: values.pixKeyType,
    },
    dataCadastro: existing?.dataCadastro ?? new Date().toLocaleDateString('pt-BR'),
  }
}

export function useCrmPartnersParceirosPage() {
  const [parceiros, setParceiros] = useState<CrmPartnersParceiroRow[]>(() =>
    buildCrmPartnersParceirosMock(),
  )

  const getParceiroById = useCallback(
    (id: string) => parceiros.find((item) => item.id === id) ?? null,
    [parceiros],
  )

  const getDetail = useCallback(
    (id: string): CrmPartnersParceiroDetail | null => {
      const parceiro = getParceiroById(id)
      if (!parceiro) return null
      return buildCrmPartnersParceiroDetail(parceiro)
    },
    [getParceiroById],
  )

  const createParceiro = useCallback((values: CrmPartnersParceiroFormValues) => {
    const parceiro = createParceiroFromForm(values)
    setParceiros((current) => [parceiro, ...current])
    return parceiro
  }, [])

  const updateParceiro = useCallback((id: string, values: CrmPartnersParceiroFormValues) => {
    let updated: CrmPartnersParceiroRow | null = null

    setParceiros((current) =>
      current.map((item) => {
        if (item.id !== id) return item
        updated = createParceiroFromForm(values, item)
        return updated
      }),
    )

    return updated
  }, [])

  const setParceiroStatus = useCallback((id: string, status: CrmPartnersParceiroRow['status']) => {
    setParceiros((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item)),
    )
  }, [])

  const summary = useMemo(() => {
    const ativos = parceiros.filter((item) => item.status === 'ativo').length
    const inativos = parceiros.length - ativos
    const clientesIndicados = parceiros.reduce((sum, item) => sum + item.clientesIndicados, 0)
    const comissaoAcumulada = parceiros.reduce((sum, item) => sum + item.comissaoAcumulada, 0)

    return { ativos, inativos, clientesIndicados, comissaoAcumulada, total: parceiros.length }
  }, [parceiros])

  return {
    parceiros,
    summary,
    getParceiroById,
    getDetail,
    createParceiro,
    updateParceiro,
    setParceiroStatus,
    emptyFormValues,
    formValuesFromParceiro,
  }
}
