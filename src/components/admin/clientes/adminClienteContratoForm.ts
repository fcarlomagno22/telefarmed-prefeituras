import type {
  AdminClienteContact,
  AdminClienteContratoTipo,
  AdminClientePrecoEspecialidade,
  AdminClientePrecoProfissao,
  AdminClienteRow,
} from '../../../types/adminClientes'
import type { CreateContratoPayload, UpdateContratoPayload } from '../../../lib/services/admin/clientes'
import type { ClienteSpecialtyOption } from '../../../hooks/useAdminClientesClinicoCatalog'
import type { MedicoProfessionRef } from '../../../config/adminContratoOrigemAtendimento'
import { isValidEmail } from '../../prefeitura/rede/newUbt/newUbtFormTypes'
import { parseBirthDateInput } from '../../../utils/calendar'
import { maskIntegerPtBr, maskCurrencyBrl } from '../../../utils/masks'
import type { AdminEntidadeCadastroFormState } from './cadastro/adminEntidadeCadastroTypes'
import { resolveAceitaPacientesOutrosMunicipios } from '../../../config/adminEntidadeTipo'
import type { ContratoOrigemAtendimento } from '../../../config/adminContratoOrigemAtendimento'
import {
  buildOrigemAtendimentoEspecialidadesPayload,
  buildOrigemAtendimentoProfissoesPayload,
  hydrateContratoOrigemAtendimentoFromDetalhes,
} from './adminClienteContratoOrigemAtendimento'
import {
  hasPositiveCurrency,
  parseCurrencyBrl,
  resolveEffectiveConsultaPreco,
  resolveEffectiveExcedentePreco,
} from './adminClienteContratoPricing'

export type AddContratoStep = 'contrato' | 'especialidades' | 'excedente' | 'confirmacao'

export type AddContratoFormState = {
  numeroContrato: string
  tipo: string
  tipoModalidade: AdminClienteContratoTipo
  vigenciaInicio: string
  vigenciaFim: string
  consultasContratadas: string
  usaGestorExistente: 'existente' | 'novo'
  gestorExistenteKey: string
  contatoNome: string
  contatoEmail: string
  contatoPhoneType: 'fixo' | 'celular'
  contatoPhone: string
  professionIds: Set<string>
  specialtyIds: Set<string>
  precosProfissao: Record<string, string>
  precosEspecialidade: Record<string, string>
  permiteUltrapassar: boolean
  aceitaPacientesOutrosMunicipios: boolean
  excedentePrecosProfissao: Record<string, string>
  excedentePrecosEspecialidade: Record<string, string>
  origemAtendimentoProfissao: Record<string, ContratoOrigemAtendimento>
  origemAtendimentoEspecialidade: Record<string, ContratoOrigemAtendimento>
}

export { hasPositiveCurrency, parseCurrencyBrl } from './adminClienteContratoPricing'

function numberToBrlInput(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return ''
  return maskCurrencyBrl(value.toFixed(2).replace('.', ','))
}

export function buildAddContratoFormFromContrato(
  contrato: AdminClienteRow['contratos'][number],
  tipoModalidade: AdminClienteContratoTipo,
  specialties: ClienteSpecialtyOption[] = [],
  professions: MedicoProfessionRef[] = [],
): AddContratoFormState {
  const detalhes = contrato.detalhes
  const precosProfissao: Record<string, string> = {}
  const precosEspecialidade: Record<string, string> = {}
  const excedentePrecosProfissao: Record<string, string> = {}
  const excedentePrecosEspecialidade: Record<string, string> = {}

  for (const item of detalhes?.precosPorProfissao ?? []) {
    precosProfissao[item.professionId] = numberToBrlInput(item.valorConsulta)
  }
  for (const item of detalhes?.precosPorEspecialidade ?? []) {
    precosEspecialidade[item.specialtyId] = numberToBrlInput(item.valorConsulta)
  }
  for (const item of detalhes?.excedentePrecosPorProfissao ?? []) {
    excedentePrecosProfissao[item.professionId] = numberToBrlInput(item.valorConsulta)
  }
  for (const item of detalhes?.excedentePrecosPorEspecialidade ?? []) {
    excedentePrecosEspecialidade[item.specialtyId] = numberToBrlInput(item.valorConsulta)
  }

  const professionIds = new Set((detalhes?.precosPorProfissao ?? []).map((item) => item.professionId))
  const specialtyIds = new Set(detalhes?.especialidadesAutorizadas ?? [])
  const origemMaps = hydrateContratoOrigemAtendimentoFromDetalhes({
    specialtyIds,
    professionIds,
    precosPorProfissao: detalhes?.precosPorProfissao ?? [],
    precosPorEspecialidade: detalhes?.precosPorEspecialidade ?? [],
    specialties,
    professions,
  })

  return {
    numeroContrato: contrato.numero ?? '',
    tipo: contrato.tipo,
    tipoModalidade: contrato.modalidade ?? tipoModalidade,
    vigenciaInicio: contrato.dataAssinatura,
    vigenciaFim: contrato.dataEncerramento ?? '',
    consultasContratadas:
      detalhes?.consultasContratadas != null
        ? maskIntegerPtBr(String(detalhes.consultasContratadas))
        : '',
    usaGestorExistente: 'existente',
    gestorExistenteKey: '',
    contatoNome: '',
    contatoEmail: '',
    contatoPhoneType: 'celular',
    contatoPhone: '',
    professionIds,
    specialtyIds,
    precosProfissao,
    precosEspecialidade,
    permiteUltrapassar: detalhes?.permiteUltrapassar ?? false,
    aceitaPacientesOutrosMunicipios: detalhes?.aceitaPacientesOutrosMunicipios ?? false,
    excedentePrecosProfissao,
    excedentePrecosEspecialidade,
    origemAtendimentoProfissao: origemMaps.origemAtendimentoProfissao,
    origemAtendimentoEspecialidade: origemMaps.origemAtendimentoEspecialidade,
  }
}

export function isPacoteOuMensalContrato(tipo: AdminClienteContratoTipo) {
  return tipo === 'mensal' || tipo === 'pacote_fechado'
}

function isValidContractDate(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return false
  return parseBirthDateInput(trimmed).length > 0
}

function filterPositivePrecosProfissao(items: AdminClientePrecoProfissao[]) {
  return items.filter((item) => item.valorConsulta > 0)
}

function filterPositivePrecosEspecialidade(items: AdminClientePrecoEspecialidade[]) {
  return items.filter((item) => item.valorConsulta > 0)
}

export function buildOptionalAdminClienteContact(input: {
  name: string
  email: string
  phone: string
  phoneType: NonNullable<AdminClienteContact['phoneType']>
}): AdminClienteContact | undefined {
  const name = input.name.trim()
  const email = input.email.trim()
  const phone = input.phone.trim()
  const hasAny = Boolean(name || email || phone)

  if (!hasAny) return undefined
  if (!name || !email || !isValidEmail(email)) return undefined
  if (phone.replace(/\D/g, '').length < 10) return undefined

  return {
    name,
    email,
    phone,
    phoneType: input.phoneType,
  }
}

export function contactHasAnyField(name: string, email: string, phone: string): boolean {
  return Boolean(name.trim() || email.trim() || phone.trim())
}

export function isAdminClienteContactComplete(
  name: string,
  email: string,
  phone: string,
): boolean {
  return (
    buildOptionalAdminClienteContact({
      name,
      email,
      phone,
      phoneType: 'celular',
    }) !== undefined
  )
}

export function validateOptionalAdminClienteContact(
  name: string,
  email: string,
  phone: string,
  label: string,
): string | null {
  if (!contactHasAnyField(name, email, phone)) return null

  if (!name.trim()) return `Informe o nome do contato de ${label}.`
  if (!email.trim()) return `Informe o e-mail do contato de ${label}.`
  if (!isValidEmail(email)) return `E-mail inválido para o contato de ${label}.`
  if (phone.replace(/\D/g, '').length < 10) {
    return `Informe o telefone do contato de ${label} com DDD.`
  }

  return null
}

export function validateCadastroOperacionalContactsRequirement(
  form: AdminEntidadeCadastroFormState,
): string | null {
  const hasRequiredContact =
    isAdminClienteContactComplete(form.gestorNome, form.gestorEmail, form.gestorTelefone) ||
    isAdminClienteContactComplete(form.saudeNome, form.saudeEmail, form.saudeTelefone) ||
    isAdminClienteContactComplete(form.contratoNome, form.contratoEmail, form.contratoTelefone)

  if (hasRequiredContact) return null

  return 'Informe ao menos um contato operacional completo entre Gestor da entidade, Saúde ou Gestor do contrato. O contato de TI sozinho não é suficiente.'
}

function buildContratoPricingPayload(
  form: AddContratoFormState | AdminEntidadeCadastroFormState,
  specialties: ClienteSpecialtyOption[],
  options: { pacoteOuMensal: boolean; permiteUltrapassar: boolean },
) {
  const specialtyById = new Map(specialties.map((item) => [item.id, item]))

  const precosPorProfissao: AdminClientePrecoProfissao[] = [...form.professionIds].map(
    (professionId) => ({
      professionId,
      valorConsulta: parseCurrencyBrl(form.precosProfissao[professionId] ?? ''),
    }),
  )

  const precosPorEspecialidade: AdminClientePrecoEspecialidade[] = [...form.specialtyIds].map(
    (specialtyId) => {
      const specialty = specialtyById.get(specialtyId)
      return {
        specialtyId,
        valorConsulta: specialty
          ? resolveEffectiveConsultaPreco(form, specialty)
          : parseCurrencyBrl(form.precosEspecialidade[specialtyId] ?? ''),
      }
    },
  )

  const excedentePrecosPorProfissao: AdminClientePrecoProfissao[] | null =
    options.pacoteOuMensal && options.permiteUltrapassar
      ? [...form.professionIds].map((professionId) => ({
          professionId,
          valorConsulta: parseCurrencyBrl(form.excedentePrecosProfissao[professionId] ?? ''),
        }))
      : null

  const excedentePrecosPorEspecialidade: AdminClientePrecoEspecialidade[] | null =
    options.pacoteOuMensal && options.permiteUltrapassar
      ? [...form.specialtyIds].map((specialtyId) => {
          const specialty = specialtyById.get(specialtyId)
          return {
            specialtyId,
            valorConsulta: specialty
              ? resolveEffectiveExcedentePreco(form, specialty)
              : parseCurrencyBrl(form.excedentePrecosEspecialidade[specialtyId] ?? ''),
          }
        })
      : null

  return {
    precosPorProfissao: filterPositivePrecosProfissao(precosPorProfissao),
    precosPorEspecialidade: filterPositivePrecosEspecialidade(precosPorEspecialidade),
    excedentePrecosPorProfissao: excedentePrecosPorProfissao
      ? filterPositivePrecosProfissao(excedentePrecosPorProfissao)
      : null,
    excedentePrecosPorEspecialidade: excedentePrecosPorEspecialidade
      ? filterPositivePrecosEspecialidade(excedentePrecosPorEspecialidade)
      : null,
  }
}

function validateGestorContrato(
  form: AddContratoFormState,
  hasExistingGestorContrato: boolean,
): string | null {
  if (form.usaGestorExistente === 'existente') {
    if (!hasExistingGestorContrato) {
      return 'Não há gestor cadastrado na entidade. Adicione um novo gestor operacional.'
    }
    if (!form.gestorExistenteKey.trim()) {
      return 'Selecione o gestor operacional do contrato.'
    }
    return null
  }

  if (!form.contatoNome.trim()) return 'Informe o nome do gestor operacional.'
  if (!form.contatoEmail.trim()) return 'Informe o e-mail do gestor operacional.'
  if (!isValidEmail(form.contatoEmail)) return 'Informe um e-mail válido para o gestor operacional.'
  if (form.contatoPhone.replace(/\D/g, '').length < 10) {
    return 'Informe o telefone do gestor operacional com DDD.'
  }
  return null
}

function validateContratoStep(
  form: AddContratoFormState,
  options: { pacoteOuMensal: boolean; hasExistingGestorContrato: boolean },
): string | null {
  if (!form.tipo.trim()) {
    return 'Selecione um tipo de contrato válido.'
  }

  if (!isValidContractDate(form.vigenciaInicio)) {
    return 'Informe a data de início da vigência no formato dd/mm/aaaa.'
  }

  if (form.vigenciaFim.trim()) {
    if (!isValidContractDate(form.vigenciaFim)) {
      return 'Informe a data de fim da vigência no formato dd/mm/aaaa.'
    }
    const inicioIso = parseBirthDateInput(form.vigenciaInicio.trim())
    const fimIso = parseBirthDateInput(form.vigenciaFim.trim())
    if (inicioIso && fimIso && fimIso < inicioIso) {
      return 'A data de fim da vigência deve ser igual ou posterior ao início.'
    }
  }

  if (options.pacoteOuMensal) {
    const consultas = Number.parseInt(form.consultasContratadas.replace(/\D/g, ''), 10)
    if (!Number.isFinite(consultas) || consultas <= 0) {
      return 'Informe a quantidade de consultas contratadas (maior que zero).'
    }
  }

  return validateGestorContrato(form, options.hasExistingGestorContrato)
}

function validateEditContratoFieldsStep(
  form: AddContratoFormState,
  options: { pacoteOuMensal: boolean },
): string | null {
  if (!form.tipo.trim()) {
    return 'Selecione um tipo de contrato válido.'
  }

  if (!isValidContractDate(form.vigenciaInicio)) {
    return 'Informe a data de início da vigência no formato dd/mm/aaaa.'
  }

  if (form.vigenciaFim.trim()) {
    if (!isValidContractDate(form.vigenciaFim)) {
      return 'Informe a data de fim da vigência no formato dd/mm/aaaa.'
    }
    const inicioIso = parseBirthDateInput(form.vigenciaInicio.trim())
    const fimIso = parseBirthDateInput(form.vigenciaFim.trim())
    if (inicioIso && fimIso && fimIso < inicioIso) {
      return 'A data de fim da vigência deve ser igual ou posterior ao início.'
    }
  }

  if (options.pacoteOuMensal) {
    const consultas = Number.parseInt(form.consultasContratadas.replace(/\D/g, ''), 10)
    if (!Number.isFinite(consultas) || consultas <= 0) {
      return 'Informe a quantidade de consultas contratadas (maior que zero).'
    }
  }

  return null
}

export function validateEditContratoStep(
  step: AddContratoStep,
  form: AddContratoFormState,
  options: { pacoteOuMensal: boolean; specialties?: ClienteSpecialtyOption[] },
): string | null {
  const specialties = options.specialties ?? []

  switch (step) {
    case 'contrato':
      return validateEditContratoFieldsStep(form, options)
    case 'especialidades':
      return validateEspecialidadesStep(form, specialties)
    case 'excedente':
      return validateExcedenteStep(form, options.pacoteOuMensal)
    case 'confirmacao':
      return (
        validateEditContratoFieldsStep(form, options) ??
        validateEspecialidadesStep(form, specialties) ??
        validateExcedenteStep(form, options.pacoteOuMensal)
      )
    default:
      return null
  }
}

export function validateLimitedEditContratoForm(
  form: AddContratoFormState,
  specialties: ClienteSpecialtyOption[] = [],
): string | null {
  return validateEspecialidadesStep(form, specialties)
}

function validateEspecialidadesStep(
  form: AddContratoFormState,
  specialties: ClienteSpecialtyOption[] = [],
): string | null {
  if (form.professionIds.size === 0) {
    return 'Selecione ao menos uma profissão autorizada no contrato.'
  }

  if (form.specialtyIds.size === 0) {
    return 'Marque ao menos uma especialidade do contrato.'
  }

  if (specialties.length === 0) {
    for (const professionId of form.professionIds) {
      if (!hasPositiveCurrency(form.precosProfissao[professionId] ?? '')) {
        return 'Informe o valor por consulta maior que zero para cada profissão selecionada.'
      }
    }
    return null
  }

  const specialtyById = new Map(specialties.map((item) => [item.id, item]))

  for (const specialtyId of form.specialtyIds) {
    const specialty = specialtyById.get(specialtyId)
    if (!specialty) {
      if (!hasPositiveCurrency(form.precosEspecialidade[specialtyId] ?? '')) {
        return 'Informe o valor por consulta para cada especialidade selecionada.'
      }
      continue
    }

    if (resolveEffectiveConsultaPreco(form, specialty) <= 0) {
      return `Informe um valor para ${specialty.name} ou defina o valor padrão da profissão correspondente.`
    }
  }

  return null
}

function validateExcedenteStep(
  form: AddContratoFormState,
  pacoteOuMensal: boolean,
): string | null {
  if (!pacoteOuMensal || !form.permiteUltrapassar) return null

  for (const professionId of form.professionIds) {
    if (!hasPositiveCurrency(form.excedentePrecosProfissao[professionId] ?? '')) {
      return 'Informe o valor de excedente maior que zero para cada profissão selecionada.'
    }
  }

  return null
}

export function validateAddContratoStep(
  step: AddContratoStep,
  form: AddContratoFormState,
  options: { pacoteOuMensal: boolean; hasExistingGestorContrato: boolean; specialties?: ClienteSpecialtyOption[] },
): string | null {
  const specialties = options.specialties ?? []

  switch (step) {
    case 'contrato':
      return validateContratoStep(form, options)
    case 'especialidades':
      return validateEspecialidadesStep(form, specialties)
    case 'excedente':
      return validateExcedenteStep(form, options.pacoteOuMensal)
    case 'confirmacao':
      return (
        validateContratoStep(form, options) ??
        validateEspecialidadesStep(form, specialties) ??
        validateExcedenteStep(form, options.pacoteOuMensal)
      )
    default:
      return null
  }
}

export function buildCreateContratoPayloadFromForm(
  cliente: AdminClienteRow,
  form: AddContratoFormState,
  pin: string,
  specialties: ClienteSpecialtyOption[],
  professions: MedicoProfessionRef[] = [],
): CreateContratoPayload {
  const pacoteOuMensal = isPacoteOuMensalContrato(form.tipoModalidade)
  const pricing = buildContratoPricingPayload(form, specialties, {
    pacoteOuMensal,
    permiteUltrapassar: form.permiteUltrapassar,
  })

  const existingContato = cliente.contatoContrato
  const contatoContrato: AdminClienteContact | undefined =
    form.usaGestorExistente === 'existente' && existingContato
      ? existingContato
      : buildOptionalAdminClienteContact({
          name: form.contatoNome,
          email: form.contatoEmail,
          phone: form.contatoPhone,
          phoneType: form.contatoPhoneType,
        })

  return {
    pin,
    numero: form.numeroContrato.trim() || undefined,
    tipo: form.tipo,
    dataAssinatura: form.vigenciaInicio.trim(),
    dataEncerramento: form.vigenciaFim.trim() || null,
    consultasContratadas: pacoteOuMensal
      ? Number.parseInt(form.consultasContratadas.replace(/\D/g, '') || '0', 10)
      : null,
    permiteUltrapassar: pacoteOuMensal && form.permiteUltrapassar,
    aceitaPacientesOutrosMunicipios: resolveAceitaPacientesOutrosMunicipios(
      cliente.tipoEntidade,
      form.aceitaPacientesOutrosMunicipios,
    ),
    precosPorProfissao: pricing.precosPorProfissao,
    precosPorEspecialidade: pricing.precosPorEspecialidade,
    excedentePrecosPorProfissao: pricing.excedentePrecosPorProfissao,
    excedentePrecosPorEspecialidade: pricing.excedentePrecosPorEspecialidade,
    especialidadesAutorizadas: [...form.specialtyIds],
    origemAtendimentoEspecialidades: buildOrigemAtendimentoEspecialidadesPayload(
      form,
      specialties,
      professions,
    ),
    origemAtendimentoProfissoes: buildOrigemAtendimentoProfissoesPayload(form, professions),
    contatoContrato,
  }
}

export function buildUpdateContratoPayloadFromForm(
  form: AddContratoFormState,
  pin: string,
  specialties: ClienteSpecialtyOption[],
  professions: MedicoProfessionRef[] = [],
): UpdateContratoPayload {
  const payload = buildCreateContratoPayloadFromForm(
    { contatoContrato: undefined } as AdminClienteRow,
    form,
    pin,
    specialties,
    professions,
  )
  const { contatoContrato: _ignored, ...rest } = payload
  return rest
}

export function validateCadastroContratoStep(form: AdminEntidadeCadastroFormState): string | null {
  if (!form.contratoTipo.trim()) {
    return 'Selecione um tipo de contrato válido.'
  }

  if (!isValidContractDate(form.vigenciaInicio)) {
    return 'Informe a data de início da vigência no formato dd/mm/aaaa.'
  }

  if (form.vigenciaFim.trim()) {
    if (!isValidContractDate(form.vigenciaFim)) {
      return 'Informe a data de fim da vigência no formato dd/mm/aaaa.'
    }
    const inicioIso = parseBirthDateInput(form.vigenciaInicio.trim())
    const fimIso = parseBirthDateInput(form.vigenciaFim.trim())
    if (inicioIso && fimIso && fimIso < inicioIso) {
      return 'A data de fim da vigência deve ser igual ou posterior ao início.'
    }
  }

  if (isPacoteOuMensalContrato(form.contratoModalidade)) {
    const consultas = Number.parseInt(form.consultasContratadas.replace(/\D/g, ''), 10)
    if (!Number.isFinite(consultas) || consultas <= 0) {
      return 'Informe a quantidade de consultas contratadas (maior que zero).'
    }
  }

  return null
}

export function validateCadastroEspecialidadesStep(
  form: AdminEntidadeCadastroFormState,
  specialties: ClienteSpecialtyOption[] = [],
): string | null {
  if (form.professionIds.size === 0) {
    return 'Selecione ao menos uma profissão autorizada no contrato.'
  }

  if (form.specialtyIds.size === 0) {
    return 'Marque ao menos uma especialidade do contrato.'
  }

  if (specialties.length === 0) {
    for (const professionId of form.professionIds) {
      if (!hasPositiveCurrency(form.precosProfissao[professionId] ?? '')) {
        return 'Informe o valor por consulta maior que zero para cada profissão selecionada.'
      }
    }
    return null
  }

  const specialtyById = new Map(specialties.map((item) => [item.id, item]))

  for (const specialtyId of form.specialtyIds) {
    const specialty = specialtyById.get(specialtyId)
    if (!specialty) {
      if (!hasPositiveCurrency(form.precosEspecialidade[specialtyId] ?? '')) {
        return 'Informe o valor por consulta para cada especialidade selecionada.'
      }
      continue
    }

    if (resolveEffectiveConsultaPreco(form, specialty) <= 0) {
      return `Informe um valor para ${specialty.name} ou defina o valor padrão da profissão correspondente.`
    }
  }

  return null
}

export function validateCadastroExcedenteStep(form: AdminEntidadeCadastroFormState): string | null {
  if (!isPacoteOuMensalContrato(form.contratoModalidade) || !form.permiteUltrapassar) {
    return null
  }

  for (const professionId of form.professionIds) {
    if (!hasPositiveCurrency(form.excedentePrecosProfissao[professionId] ?? '')) {
      return 'Informe o valor de excedente maior que zero para cada profissão selecionada.'
    }
  }

  return null
}

export function validateCadastroContratoContactStep(
  form: AdminEntidadeCadastroFormState,
): string | null {
  return validateOptionalAdminClienteContact(
    form.contratoNome,
    form.contratoEmail,
    form.contratoTelefone,
    'gestor do contrato',
  )
}

export function buildCreateContratoPayloadFromCadastroForm(
  form: AdminEntidadeCadastroFormState,
  pin: string,
  specialties: ClienteSpecialtyOption[],
  professions: MedicoProfessionRef[] = [],
): CreateContratoPayload {
  const pacoteOuMensal = isPacoteOuMensalContrato(form.contratoModalidade)
  const permiteUltrapassar = pacoteOuMensal && form.permiteUltrapassar
  const pricing = buildContratoPricingPayload(form, specialties, {
    pacoteOuMensal,
    permiteUltrapassar,
  })

  const contatoContrato = buildOptionalAdminClienteContact({
    name: form.contratoNome,
    email: form.contratoEmail,
    phone: form.contratoTelefone,
    phoneType: form.contratoTelefoneTipo,
  })

  return {
    pin,
    numero: form.numeroContrato.trim() || undefined,
    tipo: form.contratoTipo,
    dataAssinatura: form.vigenciaInicio.trim(),
    dataEncerramento: form.vigenciaFim.trim() || null,
    consultasContratadas: pacoteOuMensal
      ? Number.parseInt(form.consultasContratadas.replace(/\D/g, '') || '0', 10)
      : null,
    permiteUltrapassar,
    aceitaPacientesOutrosMunicipios: resolveAceitaPacientesOutrosMunicipios(
      form.tipoEntidade,
      form.aceitaPacientesOutrosMunicipios,
    ),
    precosPorProfissao: pricing.precosPorProfissao,
    precosPorEspecialidade: pricing.precosPorEspecialidade,
    excedentePrecosPorProfissao: permiteUltrapassar
      ? pricing.excedentePrecosPorProfissao
      : null,
    excedentePrecosPorEspecialidade: permiteUltrapassar
      ? pricing.excedentePrecosPorEspecialidade
      : null,
    especialidadesAutorizadas: [...form.specialtyIds],
    origemAtendimentoEspecialidades: buildOrigemAtendimentoEspecialidadesPayload(
      form,
      specialties,
      professions,
    ),
    origemAtendimentoProfissoes: buildOrigemAtendimentoProfissoesPayload(form, professions),
    contatoContrato,
  }
}
