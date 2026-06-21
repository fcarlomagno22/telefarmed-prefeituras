import {
  BPA_CARATER_ATENDIMENTO,
  BPA_HEADER_LENGTH,
  BPA_HEADER_LITERAL,
  BPA_HEADER_TYPE,
  BPA_LINEBREAK,
  BPA_ORIGEM_REGISTRO,
  BPA_QUANTIDADE,
  BPA_RECORD_LENGTH,
  BPA_RECORD_TYPE,
  TELECONSULTA_ESPECIALIZADA_PROCEDIMENTO,
} from './constants.js'
import {
  computeAgeYears,
  formatBirthDateAaaammdd,
  formatCidField,
  formatCnpjCpf14,
  formatCompetenciaAaaamm,
  formatDateAaaammdd,
  mapNacionalidadeBpa,
  mapRacaCorBpa,
  mapSexoBpa,
  normalizeBpaText,
  padLeft,
  padRight,
  padSpaces,
  resolveEnderecoField,
} from './formatters.js'
import type { BpaHeaderInput, BpaTeleconsultaInput } from './types.js'

function assertExactLength(line: string, expected: number, label: string): void {
  if (line.length !== expected) {
    throw new Error(`${label} deve ter ${expected} caracteres, obteve ${line.length}.`)
  }
}

export function buildBpaHeaderLine(input: BpaHeaderInput): string {
  const line = [
    padRight(BPA_HEADER_TYPE, 2),
    padRight(BPA_HEADER_LITERAL, 5),
    padLeft(formatCompetenciaAaaamm(input.competencia), 6),
    padLeft(String(input.totalRegistros), 6),
    padLeft(String(input.totalFolhas), 6),
    padSpaces(5),
    padRight(normalizeBpaText(input.responsavelNome), 30),
    padRight(normalizeBpaText(input.responsavelSigla), 5),
    formatCnpjCpf14(input.responsavelCnpjCpf),
    padRight(normalizeBpaText(input.destinatarioNome), 30),
    input.destinoIndicador,
    padRight(normalizeBpaText(input.versaoSistema), 20),
  ].join('')

  assertExactLength(line, BPA_HEADER_LENGTH, 'Cabeçalho BPA')
  return line
}

export function buildBpaRecordLine(input: BpaTeleconsultaInput): string {
  const pacienteCnsField = input.pacienteCns
    ? padLeft(input.pacienteCns, 15)
    : padSpaces(15)
  const pacienteCpfField = input.pacienteCpf
    ? padLeft(input.pacienteCpf, 11)
    : padSpaces(11)

  const sexo = mapSexoBpa(input.pacienteSexo) ?? ' '
  const raca = mapRacaCorBpa(input.pacienteRacaCor) ?? padSpaces(2)
  const etnia =
    input.pacienteRacaCor?.trim().toLowerCase() === 'indigena'
      ? padSpaces(4)
      : padSpaces(4)
  const nacionalidade = mapNacionalidadeBpa(input.pacienteNacionalidade)

  const endereco = input.pacienteEndereco
  const cep = resolveEnderecoField(endereco, ['cep', 'zipCode', 'zip']).replace(/\D/g, '')
  const logradouroCodigo = resolveEnderecoField(endereco, ['codigoLogradouro', 'logradouroCodigo'])
  const logradouro = resolveEnderecoField(endereco, [
    'logradouro',
    'rua',
    'street',
    'endereco',
  ])
  const complemento = resolveEnderecoField(endereco, ['complemento', 'complement'])
  const numero = resolveEnderecoField(endereco, ['numero', 'number'])
  const bairro = resolveEnderecoField(endereco, ['bairro', 'neighborhood'])
  const telefone = (input.pacienteTelefone ?? '').replace(/\D/g, '')
  const email = normalizeBpaText(input.pacienteEmail ?? '')

  const cadastral = [
    padLeft(cep.slice(0, 8), 8),
    padLeft(logradouroCodigo.replace(/\D/g, '').slice(0, 3), 3),
    padRight(logradouro, 30),
    padRight(complemento, 10),
    padRight(numero, 5),
    padRight(bairro, 30),
    padLeft(telefone.slice(0, 11), 11),
    padRight(email, 40),
    padSpaces(42),
  ].join('')

  if (cadastral.length !== 179) {
    throw new Error(`Campos cadastrais devem ter 179 caracteres, obteve ${cadastral.length}.`)
  }

  const line = [
    padRight(BPA_RECORD_TYPE, 2),
    padLeft(input.cnesExecutante, 7),
    padLeft(formatCompetenciaAaaamm(input.competencia), 6),
    padLeft(input.profissionalCns, 15),
    padLeft(input.profissionalCbo, 6),
    formatDateAaaammdd(input.realizadoEm),
    padLeft(String(input.folha), 3),
    padLeft(String(input.sequencia), 2),
    padRight(input.procedimentoCodigo, 10),
    pacienteCnsField,
    sexo,
    padLeft(input.pacienteIbge6, 6),
    formatCidField(input.clinicalCid),
    computeAgeYears(input.realizadoEm, input.pacienteNascimento),
    BPA_QUANTIDADE,
    BPA_CARATER_ATENDIMENTO,
    padSpaces(13),
    padRight(BPA_ORIGEM_REGISTRO, 3),
    padRight(normalizeBpaText(input.pacienteNome), 30),
    formatBirthDateAaaammdd(input.pacienteNascimento),
    raca,
    etnia,
    nacionalidade,
    cadastral,
    pacienteCpfField,
    input.situacaoRua,
  ].join('')

  assertExactLength(line, BPA_RECORD_LENGTH, 'Registro BPA-I')
  return line
}

export function buildBpaFileContent(header: BpaHeaderInput, records: BpaTeleconsultaInput[]): string {
  const headerLine = buildBpaHeaderLine(header)
  const recordLines = records.map((record) => buildBpaRecordLine(record))
  return [headerLine, ...recordLines].join(BPA_LINEBREAK) + BPA_LINEBREAK
}

export function validateRecordProcedureCode(code: string): boolean {
  return code === TELECONSULTA_ESPECIALIZADA_PROCEDIMENTO
}

export function extractProcedureCodeFromRecordLine(line: string): string {
  return line.slice(49, 59)
}

export function extractPatientCnsFromRecordLine(line: string): string {
  return line.slice(59, 74)
}

export function extractPatientCpfFromRecordLine(line: string): string {
  return line.slice(338, 349)
}

export function extractQuantityFromRecordLine(line: string): string {
  return line.slice(88, 94)
}
