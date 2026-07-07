import { useCallback, useState } from 'react'
import { formatCrmPartnersValorPorConsulta } from '../components/crmPartners/clientes/crmPartnersClientesUi'
import { parseCurrencyBrl } from '../utils/masks'
import {
  buildParticipacaoResumo,
  buildCrmPartnersClienteDetail,
  buildCrmPartnersClientesMock,
} from '../data/crmPartnersClientesMock'
import { buildCrmPartnersParceirosMock } from '../data/crmPartnersParceirosMock'
import type {
  CrmPartnersClienteDetail,
  CrmPartnersClienteFormValues,
  CrmPartnersClienteParticipacaoConfig,
  CrmPartnersClienteParticipacaoFormValues,
  CrmPartnersClienteParticipacaoLinhaForm,
  CrmPartnersClienteRow,
  CrmPartnersClienteTrocarParceiroFormValues,
} from '../types/crmPartnersClientes'

function createParticipacaoLinhaKey(): string {
  return `linha-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function emptyParticipacaoLinha(parceiroId = ''): CrmPartnersClienteParticipacaoLinhaForm {
  return {
    key: createParticipacaoLinhaKey(),
    parceiroId,
    valorPorConsulta: '',
  }
}

function emptyClienteFormValues(): CrmPartnersClienteFormValues {
  const parceiros = buildCrmPartnersParceirosMock()
  return {
    razaoSocial: '',
    tipo: 'prefeitura',
    cnpj: '',
    contatoNome: '',
    contatoEmail: '',
    contatoTelefone: '',
    cidade: '',
    uf: 'SP',
    parceiroIndicadorId: parceiros[0]?.id ?? '',
    valorMensal: '',
    dataInicioContrato: '',
    contratoStatus: 'pendente',
  }
}

function emptyParticipacaoFormValues(parceiroIndicadorId = ''): CrmPartnersClienteParticipacaoFormValues {
  return {
    linhas: [emptyParticipacaoLinha(parceiroIndicadorId)],
    vigenciaInicio: new Date().toLocaleDateString('pt-BR'),
    observacoes: '',
  }
}

function participacaoFormFromConfig(
  config: CrmPartnersClienteParticipacaoConfig | null,
  parceiroIndicadorId: string,
): CrmPartnersClienteParticipacaoFormValues {
  if (!config || config.participacoes.length === 0) {
    return emptyParticipacaoFormValues(parceiroIndicadorId)
  }

  return {
    linhas: config.participacoes.map((item) => ({
      key: item.id,
      parceiroId: item.parceiroId,
      valorPorConsulta: formatCrmPartnersValorPorConsulta(item.valorPorConsulta),
    })),
    vigenciaInicio: config.vigenciaInicio,
    observacoes: config.observacoes ?? '',
  }
}

function emptyTrocarParceiroFormValues(): CrmPartnersClienteTrocarParceiroFormValues {
  return {
    parceiroId: '',
    motivo: '',
    dataInicio: new Date().toLocaleDateString('pt-BR'),
  }
}

function createClienteFromForm(values: CrmPartnersClienteFormValues): CrmPartnersClienteRow {
  const parceiros = buildCrmPartnersParceirosMock()
  const parceiro = parceiros.find((item) => item.id === values.parceiroIndicadorId)

  return {
    id: `cliente-${Date.now()}`,
    razaoSocial: values.razaoSocial.trim(),
    tipo: values.tipo,
    cnpj: values.cnpj.replace(/\D/g, ''),
    contatoNome: values.contatoNome.trim(),
    contatoEmail: values.contatoEmail.trim(),
    contatoTelefone: values.contatoTelefone.replace(/\D/g, ''),
    cidade: values.cidade.trim(),
    uf: values.uf.trim().toUpperCase(),
    contratoStatus: values.contratoStatus,
    parceiroIndicadorId: values.parceiroIndicadorId,
    parceiroIndicadorNome: parceiro?.nome ?? '—',
    participacaoDefinida: false,
    participacaoResumo: 'Não definida',
  }
}

export function useCrmPartnersClientesPage() {
  const [clientes, setClientes] = useState<CrmPartnersClienteRow[]>(() =>
    buildCrmPartnersClientesMock(),
  )
  const [participacaoOverrides, setParticipacaoOverrides] = useState<
    Record<string, CrmPartnersClienteParticipacaoConfig | null>
  >({})
  const [parceiroHistoricoOverrides, setParceiroHistoricoOverrides] = useState<
    Record<string, CrmPartnersClienteDetail['historicoParceiros']>
  >({})

  const parceiroOptions = buildCrmPartnersParceirosMock()
    .filter((item) => item.status === 'ativo')
    .map((item) => ({ value: item.id, label: item.nome }))

  const getClienteById = useCallback(
    (id: string) => clientes.find((item) => item.id === id) ?? null,
    [clientes],
  )

  const getDetail = useCallback(
    (id: string): CrmPartnersClienteDetail | null => {
      const cliente = getClienteById(id)
      if (!cliente) return null

      const base = buildCrmPartnersClienteDetail(cliente)
      const participacao = participacaoOverrides[id] ?? base.participacao
      const historicoParceiros = parceiroHistoricoOverrides[id] ?? base.historicoParceiros

      return {
        ...base,
        cliente: {
          ...base.cliente,
          participacaoDefinida: participacao != null && participacao.participacoes.length > 0,
          participacaoResumo: buildParticipacaoResumo(participacao),
        },
        participacao,
        historicoParceiros,
      }
    },
    [participacaoOverrides, getClienteById, parceiroHistoricoOverrides],
  )

  const createCliente = useCallback((values: CrmPartnersClienteFormValues) => {
    const cliente = createClienteFromForm(values)
    setClientes((current) => [cliente, ...current])
    return cliente
  }, [])

  const defineParticipacao = useCallback(
    (clienteId: string, values: CrmPartnersClienteParticipacaoFormValues) => {
      const participacoes = values.linhas.map((linha) => {
        const parceiro = parceiroOptions.find((item) => item.value === linha.parceiroId)
        return {
          id: linha.key,
          parceiroId: linha.parceiroId,
          parceiroNome: parceiro?.label ?? '—',
          valorPorConsulta: parseCurrencyBrl(linha.valorPorConsulta),
        }
      })

      const config: CrmPartnersClienteParticipacaoConfig = {
        participacoes,
        vigenciaInicio: values.vigenciaInicio,
        observacoes: values.observacoes.trim() || null,
        definidaEm: new Date().toLocaleDateString('pt-BR'),
      }

      const resumo = buildParticipacaoResumo(config)

      setParticipacaoOverrides((current) => ({ ...current, [clienteId]: config }))
      setClientes((current) =>
        current.map((item) =>
          item.id === clienteId
            ? { ...item, participacaoDefinida: true, participacaoResumo: resumo }
            : item,
        ),
      )

      return config
    },
    [parceiroOptions],
  )

  const trocarParceiro = useCallback(
    (clienteId: string, values: CrmPartnersClienteTrocarParceiroFormValues) => {
      const parceiro = parceiroOptions.find((item) => item.value === values.parceiroId)
      if (!parceiro) return null

      const detail = getDetail(clienteId)
      const historicoAtual = detail?.historicoParceiros ?? []
      const hoje = values.dataInicio

      const historicoAtualizado = historicoAtual.map((item) =>
        item.dataFim == null
          ? {
              ...item,
              dataFim: hoje,
              motivo: values.motivo.trim() || item.motivo,
            }
          : item,
      )

      historicoAtualizado.push({
        id: `${clienteId}-par-${Date.now()}`,
        parceiroId: values.parceiroId,
        parceiroNome: parceiro.label,
        dataInicio: hoje,
        dataFim: null,
        motivo: null,
      })

      setParceiroHistoricoOverrides((current) => ({
        ...current,
        [clienteId]: historicoAtualizado,
      }))

      setClientes((current) =>
        current.map((item) =>
          item.id === clienteId
            ? {
                ...item,
                parceiroIndicadorId: values.parceiroId,
                parceiroIndicadorNome: parceiro.label,
              }
            : item,
        ),
      )

      return parceiro.label
    },
    [getDetail, parceiroOptions],
  )

  return {
    clientes,
    parceiroOptions,
    getClienteById,
    getDetail,
    createCliente,
    defineParticipacao,
    trocarParceiro,
    emptyClienteFormValues,
    emptyParticipacaoFormValues,
    participacaoFormFromConfig,
    emptyParticipacaoLinha,
    emptyTrocarParceiroFormValues,
  }
}